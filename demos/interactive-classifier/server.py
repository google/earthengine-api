#!/usr/bin/env python3
"""An example application that allows interactive classification training."""

import json
import os
import random

import config
import ee
import jinja2
import webapp2

jinja_environment = jinja2.Environment(
    loader=jinja2.FileSystemLoader(os.path.dirname(__file__)))


class MainPage(webapp2.RequestHandler):
  """Handler for the main index page."""

  def get(self):
    """Writes the index page to the response based on the template."""
    template = jinja_environment.get_template('templates/index.html')
    self.response.out.write(template.render({
        'cache_bust': random.randint(0, 150000)
    }))


class GetMapData(webapp2.RequestHandler):
  """Handler for the classifier."""

  def get(self):
    """Sets up the request to Earth Engine and returns the map information."""
    ee.Initialize(config.EE_CREDENTIALS)

    # Upsample MODIS landcover classification (250m) to Landsat resolution
    # (30m) using a supervised classifier.

    layers = []

    geometry = None
    if self.request.get('rectangle'):
      coords = [float(i) for i in self.request.get('rectangle').split(',')]
      geometry = ee.FeatureCollection([ee.Feature(
          ee.Geometry.Rectangle(coords=coords),
          {'system:index': '0'}
      )])
    else:
      geometry = ee.FeatureCollection([
          ee.Feature(
              ee.Geometry.Polygon([[
                  [29.970703125, 31.522361470421437],
                  [29.981689453125, 30.05007652169871],
                  [32.574462890625, 30.116621582819374],
                  [32.4755859375, 31.737511125687828]
              ]]),
              {'system:index': '0'}
          )
      ])

    # Use the MCD12 land-cover as training data.
    modis_landcover = ee.Image(
        'MCD12Q1/MCD12Q1_005_2001_01_01').select('Land_Cover_Type_1')

    # A palette to use for visualizing landcover images.
    modis_landcover_palette = ','.join([
        'aec3d4',  # water
        '152106', '225129', '369b47', '30eb5b', '387242',  # forest
        '6a2325', 'c3aa69', 'b76031', 'd9903d', '91af40',  # shrub, grass and
                                                           # savanah
        '111149',  # wetlands
        '8dc33b',  # croplands
        'cc0013',  # urban
        '6ca80d',  # crop mosaic
        'd7cdcc',  # snow and ice
        'f7e084',  # barren
        '6f6f6f'   # tundra
    ])

    # A set of visualization parameters using the landcover palette.
    modis_landcover_visualization_options = {
        'palette': modis_landcover_palette,
        'min': 0,
        'max': 17,
        'format': 'png'
    }

    # Add the MODIS landcover image.
    modis_landcover_visualization = modis_landcover.getMapId(
        modis_landcover_visualization_options)
    layers.append({
        'mapid': modis_landcover_visualization['mapid'],
        'label': 'MODIS landcover',
        'token': modis_landcover_visualization['token']
    })

    # Add the Landsat composite, visualizing just the [30, 20, 10] bands.
    landsat_composite = ee.Image('L7_TOA_1YEAR_2000')
    landsat_composite_visualization = landsat_composite.getMapId({
        'min': 0,
        'max': 100,
        'bands': ','.join(['30', '20', '10'])
    })
    layers.append({
        'mapid': landsat_composite_visualization['mapid'],
        'label': 'Landsat composite',
        'token': landsat_composite_visualization['token']
    })

    # The number of samples we want to use to train our classifier.
    num_points = 10000
    if self.request.get('points'):
      num_points = int(self.request.get('points'))

    # Construct a collection of random points, limited to the region of
    # interest.
    points = ee.FeatureCollection.randomPoints(
        geometry, num_points, num_points, 1)

    # For each point, populate it with the pixel values that it intersects.
    training = modis_landcover.addBands(landsat_composite).reduceToVectors(
        reducer='mean',
        geometry=points,
        geometryType='centroid',
        scale=30,
        crs='EPSG:4326'
    )

    # Train a classifier using the aggregated data.
    classifier = ee.Classifier.smileNaiveBayes().train(
        features=training,
        classProperty='label',
        inputProperties=landsat_composite.bandNames(),
    )

    # Apply the classifier to the original composite.
    upsampled = landsat_composite.classify(classifier)

    # Add the upsampled landcover image.
    upsampled_visualization = upsampled.getMapId(
        modis_landcover_visualization_options)
    layers.append({
        'urlFormat': upsampled_visualization['tile_fetcher'].url_format,
        'label': 'Upsampled landcover',
    })

    self.response.out.write(json.dumps(layers))

app = webapp2.WSGIApplication([
    ('/', MainPage),
    ('/getmapdata', GetMapData)
], debug=True)
