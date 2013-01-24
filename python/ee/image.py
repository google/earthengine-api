# Copyright 2012 Google Inc. All Rights Reserved.

"""A representation of an Earth Engine image."""



# Using old-style python function naming on purpose to match the
# javascript version's naming.
# pylint: disable-msg=C6003,C6409

import collections
import copy
import numbers

import data
import ee_exception
import serializer


class Image(object):
  """An object to represent an Earth Engine image."""

  def __init__(self, args):
    """An object to represent an Earth Engine image.

    Args:
      args: This constructor accepts a variety of arguments:
          A string - an EarthEngine asset id,
          A number - creates a constant image,
          An iterable - creates an image out of each element of the array
              and combines them into a single, multiband image,
          An ee.Image - makes a copy of the specified image.
          A dict - Assumed to be an image's JSON description.

    Raises:
      EEException: if passed something other than the above.
    """
    if isinstance(args, numbers.Number):
      # Make a constant image.
      args = {'algorithm': 'Constant', 'value': args}
    elif isinstance(args, basestring):
      # Get an asset by AssetID
      args = {'type': 'Image', 'id': args}
    elif isinstance(args, dict):           # must check for dict before iterable
      args = copy.deepcopy(args)
    elif isinstance(args, collections.Iterable):
      # Make an image for each
      c = Image.combine_([Image(x) for x in args])
      args = c._description                          # pylint: disable-msg=W0212
    elif isinstance(args, Image):
      # Another image
      args = copy.deepcopy(args._description)        # pylint: disable-msg=W0212
    else:
      raise ee_exception.EEException('Unrecognized constructor argument.')

    self._description = args

  def __str__(self):
    """Writes out the image in a human-readable form."""
    return 'Image(%s)' % serializer.toJSON(self._description)

  def __repr__(self):
    """Writes out the image in an eval-able form."""
    return 'ee.Image(%s)' % self._description

  def getInfo(self):
    """Fetch and return information about this image.

    Returns:
      The return contents vary but will include at least:
          bands - Array containing metadata about the bands in the image,
          properties - Dictionary containing the image's metadata properties.
    """
    return data.getValue({
        'json': self.serialize(False)
        })

  def getMapId(self, vis_params=None):
    """Fetch and return a map id and token, suitable for use in a Map overlay.

    Args:
      vis_params: The visualization parameters.  See ee.data.getMapId.

    Returns:
      An object containing a mapid and access token, or an error message.
    """
    request = vis_params or {}
    request['image'] = self.serialize(False)
    return data.getMapId(request)

  def getDownloadUrl(self, params=None):
    """Get a download URL for this image.

    Args:
      params: An object containing visualization options with the following
          possible values:
        name -  a base name to use when constructing filenames.
        bands -  a description of the bands to download. Must be an array of
            dictionaries, each with the following keys:
          id -  the name of the band, a string, required.
          crs -  an optional CRS string defining the band projection.
          crs_transform -  an optional array of 6 numbers specifying an affine
              transform from the specified CRS, in the order: xScale, yShearing,
              xShearing, yScale, xTranslation and yTranslation.
          dimensions -  an optional array of two integers defining the width and
              height to which the band is cropped.
          scale -  an optional number, specifying the scale in meters of the
                 band; ignored if crs and crs_transform is specified.
        crs -  a default CRS string to use for any bands that do not explicitly
            specify one.
        crs_transform -  a default affine transform to use for any bands that do
            not specify one, of the same format as the crs_transform of bands.
        dimensions -  default image cropping dimensions to use for any bands
            that do not specify them.
        scale -  a default scale to use for any bands that do not specify one;
            ignored if crs and crs_transform is specified.
        region -  a polygon specifying a region to download; ignored if crs
            and crs_transform is specified.

    Returns:
      A URL to download the specified image.
    """
    request = params or {}
    request['image'] = self.serialize(False)
    return data.makeDownloadUrl(data.getDownloadId(request))

  def serialize(self, opt_pretty=True):
    """Serialize this object into a JSON string.

    Args:
      opt_pretty: A flag indicating whether to pretty-print the JSON.

    Returns:
      A JSON represenation of this image.
    """
    return serializer.toJSON(self._description, opt_pretty)

  def select(self, selectors, opt_names=None, *args):
    """Select bands from an image.

    This is an override to the normal Image.select function to allow
    varargs specification of selectors.

    Args:
      selectors: An array of names, regexes or numeric indices specifying
          the bands to select.
      opt_names: An array of strings specifying the new names for the
          selected bands.  If supplied, the length must match the number
          of bands selected.

    Returns:
      An image with the selected bands.
    """
    call = {
        'algorithm': 'Image.select',
        'input': self
    }
    if (isinstance(selectors, basestring) or
        isinstance(selectors, numbers.Number)):
      # Varargs inputs.
      selectors = [selectors]
      if opt_names is not None:
        selectors.append(opt_names)
        opt_names = None
      selectors.extend(args)
    call['bandSelectors'] = selectors
    if opt_names:
      call['newNames'] = opt_names
    return Image(call)

  ###################################################
  # Static methods.
  ###################################################

  @staticmethod
  def rgb(r, g, b):
    """Create a 3-band image.

    This creates a 3-band image specifically for visualization using
    the first band in each image.

    Args:
      r: The red image.
      g: The green image.
      b: The blue image.

    Returns:
      The combined image.
    """
    return Image.combine_([r, g, b], ['vis-red', 'vis-green', 'vis-blue'])

  @staticmethod
  def cat(*args):
    """Concatenate the given images together into a single image."""
    return Image.combine_(args, [])

  @staticmethod
  def combine_(images, names=None):
    """Combine all the bands from the given images into a single image.

    Args:
      images: The images to be combined.
      names: An array of names for the output bands.

    Returns:
      The combined image.
    """
    if not images:
      raise ee_exception.EEException('Can\'t combine 0 images.')

    # Append all the bands.
    result = Image(images[0])
    for image in images[1:]:
      result = Image({
          'algorithm': 'Image.addBands',
          'dstImg': result,
          'srcImg': Image(image)
      })

    # Optionally, rename the bands of the result.
    if names:
      result = result.select(['.*'], names)

    return result
