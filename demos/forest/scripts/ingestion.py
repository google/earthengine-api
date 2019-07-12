#!/usr/bin/env python
"""Destination data generators for the Global Forest Change Explorer."""

import config
import ee


_BASE_COLUMNS = ['id', 'title', 'type', 'boundingBoxSW', 'boundingBoxNE']


# We remove countries with tree cover < 10,000 sqkm or < 25% of land.
_MIN_SQ_M_TREE_COVER = 10000 * 1000 * 1000


def LoadDestinations(limit=500):
  """Returns a feature collection containing all destinations.

  Args:
    limit: The maximum count of each type of destination. Useful to set this
        to 1 for testing.

  Returns:
    An ee.FeatureCollection containing a feature for each destination.
  """
  countries = _LoadCountries(config.COUNTRIES_TABLE_ID).limit(limit)
  ecoregions = _LoadEcoregions(config.ECOREGIONS_TABLE_ID).limit(limit)
  hotspots = _LoadHotspots(config.HOTSPOTS_TABLE_ID).limit(limit)
  return countries.merge(ecoregions).merge(hotspots)


def _GetFeatureBoundingBox(f):
  """Returns a bounding box for the geometry of the passed-in feature."""
  bounds = ee.Geometry(f.bounds().geometry()).coordinates()
  sw = ee.List(ee.List(bounds.get(0)).get(0))
  ne = ee.List(ee.List(bounds.get(0)).get(2))
  bbox = ee.Dictionary({
      'sw': ee.List([sw.get(1), sw.get(0)]),
      'ne': ee.List([ne.get(1), ne.get(0)])
  })
  return bbox


def _LoadHotspots(hotspots_table_id):
  """Generates the hotspots feature collection.

  Args:
    hotspots_table_id: The ID of the hotspots Fusion Table.

  Returns:
    An ee.FeatureCollection with hotspots.
  """
  hotspots_source = ee.FeatureCollection(hotspots_table_id)
  def ExtractHotspot(f):
    """Extracts details for a hotspot destination."""
    url_part = ee.String(ee.String(f.get('sourceUrl')).split('=').get(2))
    coord = url_part.replace('&t', '').split('%2C')
    coord = coord.map(lambda x: ee.Number.parse(x))  # pylint: disable=unnecessary-lambda
    bbox_sw = [coord.get(1), coord.get(3)]
    bbox_ne = [coord.get(0), coord.get(2)]
    rectangle = ee.Geometry.Rectangle([
        coord.get(3), coord.get(1), coord.get(2), coord.get(0)])
    return ee.Feature(rectangle, {
        'id': ee.String('hotspot_').cat(ee.String(f.get('id'))),
        'title': f.get('title'),
        'type': 'hotspot',
        'boundingBoxSW': bbox_sw,
        'boundingBoxNE': bbox_ne,
        # Note: Only hotspots have the fields needed for Q/A sections:
        # "correctChoice", "explanation", "learnMoreLink".
        'correctChoice': f.get('correctChoice'),
        'explanation': f.get('explanation'),
        'learnMoreLink': f.get('learnMoreLink'),
    })
  return hotspots_source.map(ExtractHotspot)


def _LoadCountries(countries_table_id):
  """Generates the countries feature collection.

  Args:
    countries_table_id: The ID of the countries Fusion Table.

  Returns:
    An ee.FeatureCollection with countries.
  """
  countries_source = ee.FeatureCollection(countries_table_id)
  gfc = ee.Image(config.HANSEN_IMAGE_ID)
  cover_image = gfc.select(['treecover2000']).multiply(ee.Image.pixelArea())

  def ExtractCountry(f):
    """Extracts details for a country destination."""
    bbox = _GetFeatureBoundingBox(f)
    stats = cover_image.reduceRegion(
        reducer=ee.Reducer.sum(),
        geometry=f.geometry(),
        bestEffort=True,
    )
    id_tail = ee.String(f.get('admin')).replace(' ', '-', 'g').toLowerCase()
    treecover = stats.get('treecover2000')
    return ee.Feature(f.geometry(), {
        'id': ee.String('country_').cat(id_tail),
        'title': f.get('admin'),
        'type': 'country',
        'boundingBoxSW': bbox.get('sw'),
        'boundingBoxNE': bbox.get('ne'),
        'treecover_sq_m': treecover,
        'treecover_percent': ee.Number(treecover).divide(f.geometry().area()),
    })
  countries = countries_source.map(ExtractCountry)
  countries = countries.filterMetadata(
      'treecover_sq_m', 'not_less_than', _MIN_SQ_M_TREE_COVER)
  countries = countries.filterMetadata(
      'treecover_percent', 'not_less_than', 25)

  # Order the countries by the size of their forests.
  return countries.sort('treecover_sq_m', False).select(_BASE_COLUMNS)


def _LoadEcoregions(ecoregions_table_id):
  """Generates the ecoregions feature collection.

  Args:
    ecoregions_table_id: The ID of the ecoregions Fusion Table.

  Returns:
    An ee.FeatureCollection with ecoregions.
  """
  ecoregions_source = (ee.FeatureCollection(ecoregions_table_id)
                       .distinct('G200_REGIO'))

  # Filter for forest-realted biomes (numbered 1-6, 12, and 14).
  forest_filter = ee.Filter.Or(ee.Filter.lte('G200_BIOME', 6),
                               ee.Filter.eq('G200_BIOME', 12),
                               ee.Filter.eq('G200_BIOME', 14))

  def ExtractEcoregion(f):
    """Extracts details for an ecoregion destination."""
    region_name = ee.String(f.get('G200_REGIO'))
    id_tail = (region_name
               .replace(u'\u00E1', 'a', 'g')
               .replace(u'\u00F3', 'o', 'g')
               .replace(u'\u00E9', 'e', 'g')
               .replace('[^A-Za-z0-9]+', '-', 'g')
               .toLowerCase())
    title = region_name
    bbox = _GetFeatureBoundingBox(f)

    return ee.Feature(f.geometry(), {
        'id': ee.String('ecoregion_').cat(id_tail),
        'title': title,
        'type': 'ecoregion',
        'boundingBoxSW': bbox.get('sw'),
        'boundingBoxNE': bbox.get('ne'),
        'size': f.geometry().area()
    })

  ecoregions = ecoregions_source.filter(forest_filter).map(ExtractEcoregion)
  return ecoregions.sort('size', False).select(_BASE_COLUMNS)
