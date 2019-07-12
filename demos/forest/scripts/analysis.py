#!/usr/bin/env python
"""Destination details data generators for the Global Forest Change Explorer."""

import json
import posixpath



import config
import ee


_MAX_DESTINATIONS = 500
_YEARS = range(config.HANSEN_FIRST_YEAR, config.HANSEN_LAST_YEAR)
_BAND_NAMES = [str(year + 2000) for year in _YEARS]
_OUTPUT_PATH = posixpath.join(config.FILEPATH_ROOT, 'static/destinations')
_COMPACT_SEPARATORS = (',', ':')


################
# Entrypoints. #
################


def GenerateIndexJson(destinations):
  """Generates index.json.

  Args:
    destinations: An ee.FeatureCollection of destinations.
  """
  index_path = posixpath.join(_OUTPUT_PATH, 'index.json')
  index = _ComputeIndex(destinations)
  index_file = open(index_path, 'w')
  json.dump(index, index_file, separators=_COMPACT_SEPARATORS)
  index_file.close()


def GenerateDetailsJson(destinations):
  """Generates details.json.

  Args:
    destinations: An ee.FeatureCollection of destinations.
  """
  details_path = posixpath.join(_OUTPUT_PATH, 'details.json')
  details = _ComputeDetails(destinations)
  details_file = open(details_path, 'w')
  json.dump(details, details_file, separators=_COMPACT_SEPARATORS)
  details_file.close()


def ExportGeometriesKml(destinations):
  """Exports destination IDs and geomerties to a KML file.

  Args:
    destinations: An ee.FeatureCollection of destinations.
  """
  destinations = destinations.map(lambda f: f.select(['id']))
  task = ee.batch.Export.table(
      destinations,
      'GlobalForestChangeExplorerGeometries',
      {
          'driveFileNamePrefix': 'GlobalForestChangeExplorerGeometries',
          'fileFormat': 'kml',
      })
  task.start()


############
# Helpers. #
############


def _ComputeIndex(destinations):
  """Computes an index of all destinations.

  Args:
    destinations: An ee.FeatureCollection of destinations.

  Returns:
    A Python dictionary mapping from destination ID to its details.
  """
  # Create the JSON destination index file.
  def GetIndex(destination_type):
    collection = destinations.filterMetadata('type', 'equals', destination_type)
    index_properties = ['id', 'title']
    get_dictionary = lambda x: ee.Feature(x).toDictionary(index_properties)
    return collection.toList(_MAX_DESTINATIONS).map(get_dictionary)

  return ee.Dictionary({
      'country': GetIndex('country'),
      'ecoregion': GetIndex('ecoregion'),
      'hotspot': GetIndex('hotspot'),
  }).getInfo()


def _ComputeDetails(destinations):
  """Generates details about the destinations.

  Args:
    destinations: An ee.FeatureCollection with all the destinations.

  Returns:
    An ee.Dictionary mapping from destination ID to its details.
  """
  def GetEeDetails(f):
    return ee.Feature(None, {
        'id': f.get('id'),
        'details': f.toDictionary().set('loss_stats', _GetForestLossData(f)),
    })

  fc = destinations.map(GetEeDetails)
  ids = fc.reduceColumns(ee.Reducer.toList(), ['id']).get('list')
  details = fc.reduceColumns(ee.Reducer.toList(), ['details']).get('list')
  dictionary = ee.Dictionary.fromLists(ee.List(ids), ee.List(details))

  # Retrieve the details dictionary from the EE server.
  details_by_id = dictionary.getInfo()

  # Refine and extend the details locally for use in the web app.
  for _, details in details_by_id.iteritems():
    details['geoQuery'] = {
        'select': config.FT_GEOMETRY_COLUMN,
        'from': config.GEOMETRY_TABLE_ID[3:],
        'where': config.FT_ID_COLUMN + '=\'' + details['id'] + '\'',
    }

    details['boundingBox'] = {
        'sw': details['boundingBoxSW'],
        'ne': details['boundingBoxNE'],
    }
    del details['boundingBoxSW']
    del details['boundingBoxNE']

    details['loss'] = {
        'stats': details['loss_stats'],
        'chart': _CreateChartStats(details['loss_stats'])
    }

  return details_by_id


def _GetForestLossData(destination):
  """Computes the square meters of forest loss per year for the destination.

  Args:
    destination: The destination as an ee.Feature.

  Returns:
    An ee.Dictionary of years and the square meters of forest lost. e.g.
    {
      2005: 23510633
      2006: 20701320
      2007: 29148605
    }
  """
  # Create an image out of the year array.
  constant = ee.Image(_YEARS)

  # Select the forest loss imagery by lossyear.
  gfc_image = ee.Image(config.HANSEN_IMAGE_ID)
  loss_year = gfc_image.select(['lossyear'])

  # Pixels with value 0 indicate no loss of the period of interest mask them.
  loss_year = loss_year.mask(loss_year)

  # This results in a 15-band image. Each band represents one year.
  # Selecting takes the band names and renames them to the second list.
  band_per_year = loss_year.eq(constant).select(_YEARS, _BAND_NAMES)
  area = band_per_year.multiply(ee.Image.pixelArea())

  # Compute loss statistics by summing the number of pixels lost per year.
  loss_stats = area.reduceRegion(
      reducer=ee.Reducer.sum(),
      geometry=destination.geometry(),
      bestEffort=True
  ).select(_BAND_NAMES[1:])  # 2000 is the baseline year; omit it.

  # Convert the square meters lost into integers.
  int_values = loss_stats.values().map(lambda sum: ee.Number(sum).int64())
  return ee.Dictionary.fromLists(loss_stats.keys(), int_values)


def _CreateChartStats(loss_stats):
  """Creates the Chart object to interface with Google Charts drawChart method.

  https://developers.google.com/chart/interactive/docs/reference#google.visualization.drawchart

  Args:
    loss_stats: A dictionary of years paired to square meters.

  Returns:
    A Python dictionary with all of the parameters required to draw a Chart.
  """
  chart_data = {
      'type': 'area',
      'options': {},
  }

  columns = [
      {'id': 'name', 'label': 'Year', 'type': 'string'},
      {'id': 'year', 'label': 'Loss (sq. km)', 'type': 'number'}]
  rows = []

  for loss_year in sorted(loss_stats.keys()):
    entry = {
        # The loss stats are in m2; convert them to km2.
        'c': [{'v': loss_year}, {'v': loss_stats[loss_year]/1000/1000}]
    }
    rows.append(entry)

  chart_data['data'] = {'cols': columns, 'rows': rows}

  return chart_data
