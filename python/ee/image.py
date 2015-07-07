#!/usr/bin/env python
"""A representation of an Earth Engine image.

See: https://sites.google.com/site/earthengineapidocs for more details.
"""



# Using lowercase function naming to match the JavaScript names.
# pylint: disable=g-bad-name

import json

import apifunction
import computedobject
import data
import deprecation
import ee_exception
import ee_types
import element
import function
import geometry


class Image(element.Element):
  """An object to represent an Earth Engine image."""

  _initialized = False

  def __init__(self, args=None, version=None):
    """Constructs an Earth Engine image.

    Args:
      args: This constructor accepts a variety of arguments:
          - A string - an EarthEngine asset id,
          - A string and a number - an EarthEngine asset id and version,
          - A number - creates a constant image,
          - An EEArray - creates a constant array image,
          - A list - creates an image out of each element of the array and
            combines them into a single image,
          - An ee.Image - returns the argument,
          - Nothing - results in an empty transparent image.
      version: An optional asset version.

    Raises:
      EEException: if passed something other than the above.
    """

    self.initialize()

    if version is not None:
      if ee_types.isString(args) and ee_types.isNumber(version):
        # An ID and version.
        super(Image, self).__init__(
            apifunction.ApiFunction.lookup('Image.load'),
            {'id': args, 'version': version})
      else:
        raise ee_exception.EEException(
            'If version is specified, the arg to Image() must be a string. '
            'Received: %s' % (args,))
      return

    if ee_types.isNumber(args):
      # A constant image.
      super(Image, self).__init__(
          apifunction.ApiFunction.lookup('Image.constant'), {'value': args})
    elif ee_types.isString(args):
      # An ID.
      super(Image, self).__init__(
          apifunction.ApiFunction.lookup('Image.load'), {'id': args})
    elif isinstance(args, (list, tuple)):
      # Make an image out of each element.
      image = Image.combine_([Image(i) for i in args])
      super(Image, self).__init__(image.func, image.args)
    elif isinstance(args, computedobject.ComputedObject):
      if args.name() == 'Array':
        # A constant array image.
        super(Image, self).__init__(
            apifunction.ApiFunction.lookup('Image.constant'), {'value': args})
      else:
        # A custom object to reinterpret as an Image.
        super(Image, self).__init__(args.func, args.args, args.varName)
    elif args is None:
      super(Image, self).__init__(
          apifunction.ApiFunction.lookup('Image.mask'),
          {'image': Image(0), 'mask': Image(0)})
    else:
      raise ee_exception.EEException(
          'Unrecognized argument type to convert to an Image: %s' % args)

  @classmethod
  def initialize(cls):
    """Imports API functions to this class."""
    if not cls._initialized:
      apifunction.ApiFunction.importApi(cls, 'Image', 'Image')
      apifunction.ApiFunction.importApi(cls, 'Window', 'Image', 'focal_')
      cls._initialized = True

  @classmethod
  def reset(cls):
    """Removes imported API functions from this class."""
    apifunction.ApiFunction.clearApi(cls)
    cls._initialized = False

  def getInfo(self):
    """Fetch and return information about this image.

    Returns:
      The return contents vary but will include at least:
          bands - Array containing metadata about the bands in the image,
          properties - Dictionary containing the image's metadata properties.
    """
    return super(Image, self).getInfo()

  def getMapId(self, vis_params=None):
    """Fetch and return a map id and token, suitable for use in a Map overlay.

    Args:
      vis_params: The visualization parameters.  See ee.data.getMapId.

    Returns:
      An object containing a mapid and access token, or an error message.
    """
    request = (vis_params or {}).copy()
    request['image'] = self.serialize()
    response = data.getMapId(request)
    response['image'] = self
    return response

  def getDownloadURL(self, params=None):
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
    request['image'] = self.serialize()
    return data.makeDownloadUrl(data.getDownloadId(request))

  def getThumbURL(self, params=None):
    """Get a thumbnail URL for this image.

    Args:
      params: Parameters identical to getMapId, plus, optionally:
          dimensions - (a number or pair of numbers in format WIDTHxHEIGHT) Max
            dimensions of the thumbnail to render, in pixels. If only one number
            is passed, it is used as the maximum, and the other dimension is
            computed by proportional scaling.
          region - (E,S,W,N or GeoJSON) Geospatial region of the image
            to render. By default, the whole image.
          format - (string) Either 'png' or 'jpg'.

    Returns:
      A URL to download a thumbnail the specified image.

    Raises:
      EEException: If the region parameter is not an array or GeoJSON object.
    """
    request = params or {}
    request['image'] = self.serialize()
    if request.has_key('region'):
      if (isinstance(request['region'], dict) or
          isinstance(request['region'], list)):
        request['region'] = json.dumps(request['region'])
      elif not isinstance(request['region'], str):
        raise ee_exception.EEException(
            'The region parameter must be an array or a GeoJSON object.')
    return data.makeThumbUrl(data.getThumbId(request))

  # Deprecated spellings to match the JS library.
  getDownloadUrl = deprecation.Deprecated('Use getDownloadURL().')(
      getDownloadURL)
  getThumbUrl = deprecation.Deprecated('Use getThumbURL().')(getThumbURL)

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
    return Image.combine_(args)

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
      result = apifunction.ApiFunction.call_('Image.addBands', result, image)

    # Optionally, rename the bands of the result.
    if names:
      result = result.select(['.*'], names)

    return result

  def select(self, opt_selectors=None, opt_names=None, *args):
    """Selects bands from an image.

    Can be called in one of two ways:
      - Passed any number of non-list arguments. All of these will be
        interpreted as band selectors. These can be band names, regexes, or
        numeric indices. E.g.
        selected = image.select('a', 'b', 3, 'd');
      - Passed two lists. The first will be used as band selectors and the
        second as new names for the selected bands. The number of new names
        must match the number of selected bands. E.g.
        selected = image.select(['a', 4], ['newA', 'newB']);

    Args:
      opt_selectors: An array of names, regexes or numeric indices specifying
          the bands to select.
      opt_names: An array of strings specifying the new names for the
          selected bands.
      *args: Selector elements as varargs.

    Returns:
      An image with the selected bands.
    """
    if opt_selectors is not None:
      args = list(args)
      if opt_names is not None:
        args.insert(0, opt_names)
      args.insert(0, opt_selectors)
    algorithm_args = {
        'input': self,
        'bandSelectors': args[0] if args else [],
    }
    if args:
      # If the user didn't pass an array as the first argument, assume
      # that everything in the arguments array is actually a selector.
      if (len(args) > 2 or
          ee_types.isString(args[0]) or
          ee_types.isNumber(args[0])):
        # Varargs inputs.
        selectors = args
        # Verify we didn't get anything unexpected.
        for selector in selectors:
          if (not ee_types.isString(selector) and
              not ee_types.isNumber(selector) and
              not isinstance(selector, computedobject.ComputedObject)):
            raise ee_exception.EEException(
                'Illegal argument to select(): ' + selector)
        algorithm_args['bandSelectors'] = selectors
      elif len(args) > 1:
        algorithm_args['newNames'] = args[1]
    return apifunction.ApiFunction.apply_('Image.select', algorithm_args)

  def expression(self, expression, opt_map=None):
    """Evaluates an arithmetic expression on an image or images.

    The bands of the primary input image are available using the built-in
    function b(), as b(0) or b('band_name').

    Variables in the expression are interpreted as additional image parameters
    which must be supplied in opt_map. The bands of each such image can be
    accessed like image.band_name or image[0].

    Both b() and image[] allow multiple arguments, to specify multiple bands,
    such as b(1, 'name', 3).  Calling b() with no arguments, or using a variable
    by itself, returns all bands of the image.

    Args:
      expression: The expression to evaluate.
      opt_map: An optional map of input images available by name.

    Returns:
      The image computed by the provided expression.
    """
    arg_name = 'DEFAULT_EXPRESSION_IMAGE'
    all_vars = [arg_name]
    args = {arg_name: self}

    # Add custom arguments, promoting them to Images manually.
    if opt_map:
      for name, value in opt_map.iteritems():
        all_vars.append(name)
        args[name] = Image(value)

    body = apifunction.ApiFunction.call_(
        'Image.parseExpression', expression, arg_name, all_vars)

    # Reinterpret the body call as an ee.Function by hand-generating the
    # signature so the computed function knows its input and output types.
    class ReinterpretedFunction(function.Function):

      def encode(self, encoder):
        return body.encode(encoder)

      def getSignature(self):
        return {
            'name': '',
            'args': [{'name': name, 'type': 'Image', 'optional': False}
                     for name in all_vars],
            'returns': 'Image'
        }

    # Perform the call.
    return ReinterpretedFunction().apply(args)

  def clip(self, clip_geometry):
    """Clips an image by a Geometry, Feature or FeatureCollection.

    Args:
      clip_geometry: The Geometry, Feature or FeatureCollection to clip to.

    Returns:
      The clipped image.
    """
    try:
      # Need to manually promote GeoJSON, because the signature does not
      # specify the type so auto promotion won't work.
      clip_geometry = geometry.Geometry(clip_geometry)
    except ee_exception.EEException:
      pass  # Not an ee.Geometry or GeoJSON. Just pass it along.
    return apifunction.ApiFunction.call_('Image.clip', self, clip_geometry)

  def rename(self, names, *args):
    """Rename the bands of an image.

    Can be called with either a list of strings or any number of strings.

    Args:
      names: An array of strings specifying the new names for the
          bands.  Must exactly match the number of bands in the image.
      *args: Band names as varargs.

    Returns:
      An image with the renamed bands.
    """
    if args:
      # Handle varargs; everything else we let the server handle.
      args = list(args)
      args.insert(0, names)
      names = args

    algorithm_args = {
        'input': self,
        'names': names
    }
    return apifunction.ApiFunction.apply_('Image.rename', algorithm_args)

  @staticmethod
  def name():
    return 'Image'
