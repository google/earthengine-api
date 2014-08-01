"""A representation of an Earth Engine image.

See: https://sites.google.com/site/earthengineapidocs for more details.
"""



# Using lowercase function naming to match the JavaScript names.
# pylint: disable=g-bad-name

import apifunction
import computedobject
import data
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
    request = vis_params or {}
    request['image'] = self.serialize()
    response = data.getMapId(request)
    response['image'] = self
    return response

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
    request['image'] = self.serialize()
    return data.makeDownloadUrl(data.getDownloadId(request))

  def getThumbUrl(self, params=None):
    """Get a thumbnail URL for this image.

    Args:
      params: Parameters identical to getMapId, plus:
          size - (a number or pair of numbers in format WIDTHxHEIGHT) Maximum
            dimensions of the thumbnail to render, in pixels. If only one number
            is passed, it is used as the maximum, and the other dimension is
            computed by proportional scaling.
          region - (E,S,W,N or GeoJSON) Geospatial region of the image
            to render. By default, the whole image.
          format - (string) Either 'png' (default) or 'jpg'.

    Returns:
      A URL to download a thumbnail the specified image.
    """
    request = params or {}
    request['image'] = self.serialize()
    return data.makeThumbUrl(data.getThumbId(request))

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
    """Select bands from an image.

    This is an override to the normal Image.select function to allow
    varargs specification of selectors.

    Args:
      opt_selectors: An array of names, regexes or numeric indices specifying
          the bands to select.
      opt_names: An array of strings specifying the new names for the
          selected bands.  If supplied, the length must match the number
          of bands selected.
      *args: Selector elements as varargs.

    Returns:
      An image with the selected bands.
    """
    if opt_selectors is None:
      opt_selectors = []

    arguments = {
        'input': self,
        'bandSelectors': opt_selectors,
    }
    if (isinstance(opt_selectors, (basestring, int, long)) or
        ee_types.isString(opt_selectors) or ee_types.isNumber(opt_selectors)):
      # Varargs inputs.
      opt_selectors = [opt_selectors]
      if opt_names is not None:
        opt_selectors.append(opt_names)
        opt_names = None
      opt_selectors.extend(args)
    arguments['bandSelectors'] = opt_selectors
    if opt_names:
      arguments['newNames'] = opt_names
    return apifunction.ApiFunction.apply_('Image.select', arguments)

  def expression(self, expression, opt_map=None):
    """Evaluates an expression on an image.

    This is an override to the normal Image.select function to allow
    varargs specification of selectors.

    Args:
      expression: The expression to evaluate.
      opt_map: An optional map of input images available by name.

    Returns:
      The image created by the provided expression.
    """
    arg_name = 'DEFAULT_EXPRESSION_IMAGE'
    body = apifunction.ApiFunction.call_(
        'Image.parseExpression', expression, arg_name)
    arg_names = [arg_name]
    args = {arg_name: self}

    # Add custom arguments, promoting them to Images manually.
    if opt_map:
      for name, value in opt_map.iteritems():
        arg_names.append(name)
        args[name] = Image(value)

    # Reinterpret the body call as an ee.Function by hand-generating the
    # signature so the computed function knows its input and output types.
    class ReinterpretedFunction(function.Function):

      def encode(self, encoder):
        return body.encode(encoder)

      def getSignature(self):
        return {
            'name': '',
            'args': [{'name': name, 'type': 'Image', 'optional': False}
                     for name in arg_names],
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

  @staticmethod
  def name():
    return 'Image'
