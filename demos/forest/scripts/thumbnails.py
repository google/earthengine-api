#!/usr/bin/env python
"""Global Forest Change Explorer destination thumbnail generation logic."""

import os.path
import posixpath
import urllib

from enum import Enum
from PIL import Image



import config
import ee


def GenerateThumbnails(destinations):
  """Generates thumbnail image files for the destinations.

  Args:
    destinations: An ee.FeatureCollection of destinations.
  """
  thumbnail_urls_by_id = _GetThumbnailUrlsByIdDict(destinations)
  _DownloadThumbnails(thumbnail_urls_by_id)
  _PostProcessThumbnails(thumbnail_urls_by_id.keys())


###################
# Constants & Enums
###################


class _DestinationType(Enum):
  HOTSPOT = 'hotspot'
  COUNTRY = 'country'
  ECOREGION = 'ecoregion'


class _ThumbnailType(Enum):
  PRETTY_EARTH = 'pretty_earth'
  GEOMETRY_OUTLINE = 'geometry_outline'

_OUTPUT_PATH = posixpath.join(config.FILEPATH_ROOT, 'static/thumbnails')

# Projection chosen to match country shapes in Google Maps.
_PROJECTION = 'EPSG:3857'

# The final length of the sides of the Pretty Earth thumbnails.
# They're squares so width and height are the same.
_FINAL_PRETTY_EARTH_SIZE = 120

# Visualization parameters sent to the EE server when requesting thumbnails.
_VIS_PARAMS = {
    _ThumbnailType.PRETTY_EARTH: {
        'min': '-0.04',
        'max': '0.4,0.4,0.45',
        'gamma': '1.6,1.6,1.4',
        'bands': 'red,green,blue',
        'format': 'png',
        'dimensions': '400',
    },
    _ThumbnailType.GEOMETRY_OUTLINE: {
        'min': '0',
        'max': '1',
        'dimensions': '100',
        'format': 'png',
    }
}

# The colors to use to fill the geometry outline.
_GEOMETRY_FILL_COLOR = {
    _DestinationType.COUNTRY: '#009688',    # --paper-teal-500
    _DestinationType.ECOREGION: '#FF5722',  # --paper-deep-orange-500
}

_PRETTY_EARTH_FILL_COLOR = '#49574C'  # A dark green that matches vis params.

#########
# Helpers
#########


def _GetPrettyEarthImage():
  """Returns a pretty image which can be used to generate thumbnails.

  Source script from herwig@:
  https://code.earthengine.google.com/b15b34ebf77deb13afe42c8f004e1069

  Returns:
    A pretty ee.Image of the world.
  """
  landsat8 = (ee.ImageCollection('LANDSAT/LC08/C01/T1_TOA')
              .filter(ee.Filter.date('2015-05-01', '2015-12-31'))
              .filter(ee.Filter.lte('CLOUD_COVER', 20)))

  bands_in = ee.Dictionary({
      'red': 'B4',
      'green': 'B3',
      'blue': 'B2',
      'pan': 'B8',
  })

  def Pansharpen(scene):
    """Pansharpens raw bands to create a single high-resolution color image."""
    cloud = ee.Algorithms.Landsat.simpleCloudScore(scene).select('cloud')
    scene = scene.select(bands_in.values(bands_in.keys()), bands_in.keys())
    native_mask = scene.mask().reduce(ee.Reducer.min()).multiply(cloud.lt(40))
    pan = scene.select(['pan'], ['value'])
    scene = scene.select(['red', 'green', 'blue']).add(pan.multiply(0.15))
    hsv = scene.rgbtohsv()
    return hsv.select([0, 1]).addBands(pan).hsvtorgb().mask(native_mask)

  def EnhanceContrast(scene):
    """Applies local contrast enhancement."""
    src_value = scene.select(['red', 'green', 'blue'])
    gauss = src_value.fastGaussianBlur(10000)
    gauss = src_value.subtract(gauss)
    return src_value.add(gauss)

  landsat8 = landsat8.map(Pansharpen).map(EnhanceContrast)

  return landsat8.median()


def _CropImage(image):
  """Returns the given PIL image cropped to the pretty earth length."""
  width, height = image.size
  left = (width - _FINAL_PRETTY_EARTH_SIZE) / 2
  top = (height - _FINAL_PRETTY_EARTH_SIZE) / 2
  right = (width + _FINAL_PRETTY_EARTH_SIZE) / 2
  bottom = (height + _FINAL_PRETTY_EARTH_SIZE) / 2
  return image.crop((left, top, right, bottom))


def _FillTransparentPixels(image):
  """Returns the given PIL image with transparent pixels filled."""
  non_transparent = Image.new('RGBA', image.size, _PRETTY_EARTH_FILL_COLOR)
  non_transparent.paste(image, (0, 0), image)
  return non_transparent


def _CleanPrettyEarthImageFile(filepath):
  """Post-processes the pretty earth image file at the filepath."""
  print 'Cleaning Pretty Earth file %s\n' % filepath
  image = Image.open(filepath).convert('RGBA')
  image = _CropImage(image)
  image = _FillTransparentPixels(image)
  image.save(filepath, 'PNG')


def _GetDestinationType(destination_id):
  """Returns the thumbnail type for the destination with the id."""
  # Destinations are formatted like "hotspot_colorado" where "hotspot"
  # is the type.
  return _DestinationType(destination_id.split('_')[0])


def _GetThumbnailType(destination_id):
  """Returns the thumbnail type for the destination with the id."""
  destination_type = _GetDestinationType(destination_id)
  if destination_type == _DestinationType.HOTSPOT:
    return _ThumbnailType.PRETTY_EARTH
  else:
    return _ThumbnailType.GEOMETRY_OUTLINE


def _GetFilepath(destination_id):
  filename = '%s.png' % destination_id
  return posixpath.join(_OUTPUT_PATH, filename)


################
# Workflow steps
################


def _GetThumbnailUrlsByIdDict(destinations):
  """Returns a mapping from destination ID to thumbnail URL.

  Args:
    destinations: An ee.FeatureCollection of destinations.

  Returns:
    A dictionary mapping destination ID to thumbnail URL.
  """
  destination_ids = (destinations
                     .reduceColumns(ee.Reducer.toList(), ['id'])
                     .getInfo()['list'])

  thumbnail_urls_by_id = {}
  for destination_id in destination_ids:
    # Skip destinations for which we already have thumbnails.

    if os.path.exists(_GetFilepath(destination_id)):
      print 'Skipping %s (existing thumbnail).' % destination_id
      continue

    geometry = (destinations
                .filter(ee.Filter.equals('id', destination_id))
                .first()
                .geometry()
                .geometries()
                .get(0)
                .getInfo())

    thumbnail_type = _GetThumbnailType(destination_id)
    vis_params = _VIS_PARAMS[thumbnail_type].copy()
    if thumbnail_type == _ThumbnailType.PRETTY_EARTH:
      image = _GetPrettyEarthImage()
    else:
      image = ee.Image(1).reproject(_PROJECTION)
      destination_type = _GetDestinationType(destination_id)
      vis_params['palette'] = _GEOMETRY_FILL_COLOR[destination_type]

    thumbnail_url = (image
                     .clip(geometry)
                     .getThumbURL(vis_params))
    thumbnail_urls_by_id[destination_id] = thumbnail_url
    print 'URL for destination %s:\n%s\n' % (destination_id, thumbnail_url)

  return thumbnail_urls_by_id


def _DownloadThumbnails(thumbnail_urls_by_id):
  """Saves each thumbnail image as ../thumbnails/<destination-id>.png.

  Args:
    thumbnail_urls_by_id: A dictionary mapping destination ID to thumbnail URL.
  """
  retriever = urllib.URLopener()
  for destination_id, thumbnail_url in thumbnail_urls_by_id.items():
    filepath = _GetFilepath(destination_id)
    print 'Downloading %s from URL:\n%s\n' % (filepath, thumbnail_url)
    retriever.retrieve(thumbnail_url, filepath)


def _PostProcessThumbnails(destination_ids):
  """Post-processes each ../thumbnails/<destination-id>.png image if needed.

  Only Pretty Earth images are post-processed.

  Args:
    destination_ids: The list of IDs of thumbnails to post-process.
  """
  for destination_id in destination_ids:
    if _GetThumbnailType(destination_id) == _ThumbnailType.PRETTY_EARTH:
      filepath = _GetFilepath(destination_id)
      _CleanPrettyEarthImageFile(filepath)


#############
# Entrypoints
#############


def main():
  ee.Initialize()


if __name__ == '__main__':
  main()
