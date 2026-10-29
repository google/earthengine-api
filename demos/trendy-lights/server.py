#!/usr/bin/env python3
"""Web server for the Trendy Lights application.

The overall architecture looks like:

               server.py         script.js
 ______       ____________       _________
|      |     |            |     |         |
|  EE  | <-> | App Engine | <-> | Browser |
|______|     |____________|     |_________|
     \                               /
      '- - - - - - - - - - - - - - -'

The code in this file runs on App Engine. It's called when the user loads the
web page and when details about a polygon are requested.

Our App Engine code does most of the communication with EE. It uses the
EE Python library and the service account specified in config.py. The
exception is that when the browser loads map tiles it talks directly with EE.

The basic flows are:

1. Initial page load

When the user first loads the application in their browser, their request is
routed to the get() function in the MainHandler class by the framework we're
using, webapp2.

The get() function sends back the main web page (from index.html) along
with information the browser needs to render an Earth Engine map and
the IDs of the polygons to show on the map. This information is injected
into the index.html template through a templating engine called Jinja2,
which puts information from the Python context into the HTML for the user's
browser to receive.

Note: The polygon IDs are determined by looking at the static/polygons
folder. To add support for another polygon, just add another GeoJSON file to
that folder.

2. Getting details about a polygon

When the user clicks on a polygon, our JavaScript code (in static/script.js)
running in their browser sends a request to our backend. webapp2 routes this
request to the get() method in the DetailsHandler.

This method checks to see if the details for this polygon are cached. If
yes, it returns them right away. If no, we generate a Wikipedia URL and use
Earth Engine to compute the brightness trend for the region. We then store
these results in a cache and return the result.

Note: The brightness trend is a list of points for the chart drawn by the
Google Visualization API in a time series e.g. [[x1, y1], [x2, y2], ...].

Note: memcache, the cache we are using, is a service provided by App Engine
that temporarily stores small values in memory. Using it allows us to avoid
needlessly requesting the same data from Earth Engine over and over again,
which in turn helps us avoid exceeding our quota and respond to user
requests more quickly.

"""
import json
import os

import config
import ee
import jinja2
import webapp2

from google.appengine.api import memcache


###############################################################################
#                             Web request handlers.                           #
###############################################################################


class MainHandler(webapp2.RequestHandler):
  """A servlet to handle requests to load the main Trendy Lights web page."""

  def get(self, path=''):
    """Returns the main web page, populated with EE map and polygon info."""
    mapid = GetTrendyMapId()
    print(('MapID', mapid))
    template_values = {
        'mapUrlFormat': mapid['tile_fetcher'].url_format,
        'serializedPolygonIds': json.dumps(POLYGON_IDS)
    }
    template = JINJA2_ENVIRONMENT.get_template('index.html')
    self.response.out.write(template.render(template_values))


class DetailsHandler(webapp2.RequestHandler):
  """A servlet to handle requests for details about a Polygon."""

  def get(self):
    """Returns details about a polygon."""
    polygon_id = self.request.get('polygon_id')
    if polygon_id in POLYGON_IDS:
      content = GetPolygonTimeSeries(polygon_id)
    else:
      content = json.dumps({'error': 'Unrecognized polygon ID: ' + polygon_id})
    self.response.headers['Content-Type'] = 'application/json'
    self.response.out.write(content)


# Define webapp2 routing from URL paths to web request handlers. See:
# http://webapp-improved.appspot.com/tutorials/quickstart.html
app = webapp2.WSGIApplication([
    ('/details', DetailsHandler),
    ('/', MainHandler),
])


###############################################################################
#                                   Helpers.                                  #
###############################################################################


def GetTrendyMapId():
  """Returns the MapID for the night-time lights trend map."""
  collection = ee.ImageCollection(IMAGE_COLLECTION_ID)

  # Add a band containing image date as years since 1991.
  def CreateTimeBand(img):
    year = ee.Date(img.get('system:time_start')).get('year').subtract(1991)
    return ee.Image(year).byte().addBands(img)
  collection = collection.select('stable_lights').map(CreateTimeBand)

  # Fit a linear trend to the nighttime lights collection.
  fit = collection.reduce(ee.Reducer.linearFit())
  return fit.getMapId({
      'min': '0',
      'max': '0.18,20,-0.18',
      'bands': 'scale,offset,scale',
  })


def GetPolygonTimeSeries(polygon_id):
  """Returns details about the polygon with the passed-in ID."""
  details = memcache.get(polygon_id)

  # If we've cached details for this polygon, return them.
  if details is not None:
    return details

  details = {'wikiUrl': WIKI_URL + polygon_id.replace('-', '%20')}

  try:
    details['timeSeries'] = ComputePolygonTimeSeries(polygon_id)
    # Store the results in memcache.
    memcache.add(polygon_id, json.dumps(details), MEMCACHE_EXPIRATION)
  except ee.EEException as e:
    # Handle exceptions from the EE client library.
    details['error'] = str(e)

  # Send the results to the browser.
  return json.dumps(details)


def ComputePolygonTimeSeries(polygon_id):
  """Returns a series of brightness over time for the polygon."""
  collection = ee.ImageCollection(IMAGE_COLLECTION_ID)
  collection = collection.select('stable_lights').sort('system:time_start')
  feature = GetFeature(polygon_id)

  # Compute the mean brightness in the region in each image.
  def ComputeMean(img):
    reduction = img.reduceRegion(
        ee.Reducer.mean(), feature.geometry(), REDUCTION_SCALE_METERS)
    return ee.Feature(None, {
        'stable_lights': reduction.get('stable_lights'),
        'system:time_start': img.get('system:time_start')
    })
  chart_data = collection.map(ComputeMean).getInfo()

  # Extract the results as a list of lists.
  def ExtractMean(feature):
    return [
        feature['properties']['system:time_start'],
        feature['properties']['stable_lights']
    ]
  return map(ExtractMean, chart_data['features'])


def GetFeature(polygon_id):
  """Returns an ee.Feature for the polygon with the given ID."""
  # Note: The polygon IDs are read from the filesystem in the initialization
  # section below. "sample-id" corresponds to "static/polygons/sample-id.json".
  path = POLYGON_PATH + polygon_id + '.json'
  path = os.path.join(os.path.split(__file__)[0], path)
  with open(path) as f:
    return ee.Feature(json.load(f))


###############################################################################
#                                   Constants.                                #
###############################################################################


# Memcache is used to avoid exceeding our EE quota. Entries in the cache expire
# 24 hours after they are added. See:
# https://cloud.google.com/appengine/docs/python/memcache/
MEMCACHE_EXPIRATION = 60 * 60 * 24

# The ImageCollection of the night-time lights dataset. See:
# https://earthengine.google.org/#detail/NOAA%2FDMSP-OLS%2FNIGHTTIME_LIGHTS
IMAGE_COLLECTION_ID = 'NOAA/DMSP-OLS/NIGHTTIME_LIGHTS'

# The file system folder path to the folder with GeoJSON polygon files.
POLYGON_PATH = 'static/polygons/'

# The scale at which to reduce the polygons for the brightness time series.
REDUCTION_SCALE_METERS = 20000

# The Wikipedia URL prefix.
WIKI_URL = 'http://en.wikipedia.org/wiki/'

###############################################################################
#                               Initialization.                               #
###############################################################################


# Use our App Engine service account's credentials.
EE_CREDENTIALS = ee.ServiceAccountCredentials(
    config.EE_ACCOUNT, config.EE_PRIVATE_KEY_FILE)

# Read the polygon IDs from the file system.
POLYGON_IDS = [name.replace('.json', '') for name in os.listdir(POLYGON_PATH)]

# Create the Jinja templating system we use to dynamically generate HTML. See:
# http://jinja.pocoo.org/docs/dev/
JINJA2_ENVIRONMENT = jinja2.Environment(
    loader=jinja2.FileSystemLoader(os.path.dirname(__file__)), autoescape=True)

# Initialize the EE API.
ee.Initialize(EE_CREDENTIALS)
