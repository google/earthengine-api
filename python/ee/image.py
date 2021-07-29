#!/usr/bin/env python
"""A representation of an Earth Engine image.

See: https://sites.google.com/site/earthengineapidocs for more details.
"""



# Using lowercase function naming to match the JavaScript names.
# pylint: disable=g-bad-name

# Disable lint messages caused by Python 3 compatibility changes.
# pylint: disable=superfluous-parens

import json

from . import apifunction
from . import computedobject
from . import data
from . import deprecation
from . import ee_exception
from . import ee_types
from . import element
from . import function
from . import geometry

import six


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
          - An ee.Array - creates a constant array image,
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
    """Fetch and return a map ID dictionary, suitable for use in a Map overlay.

    Args:
      vis_params: The visualization parameters.  See ee.data.getMapId.

    Returns:
      A map ID dictionary as described in ee.data.getMapId.
    """
    vis_image, request = self._apply_visualization(vis_params)
    request['image'] = vis_image
    response = data.getMapId(request)
    response['image'] = self
    return response

  def _apply_crs_and_affine(self, params):
    """Applies any CRS and affine parameters to an image.

    Wraps the image in a call to Reproject() if the request includes
    specifying a CRS and affine transformation.

    Args:
      params: the request parameters.

    Returns:
      A tuple containing:
      - the result of applying the projection parameters to this image
      - any remaining parameters.
      - whether dimensions had originally been specified, but were merged
        into the image.
    """
    keys_to_extract = set(['crs', 'crs_transform', 'crsTransform'])
    request = {}
    reprojection_params = {}
    dimensions_consumed = False
    if params:
      for key in params:
        if key in keys_to_extract:
          reprojection_params[key] = params[key]
        else:
          request[key] = params[key]
    image = self
    if reprojection_params:
      if 'crsTransform' in reprojection_params:
        if 'crs_transform' in reprojection_params:
          raise ee_exception.EEException(
              'Both "crs_transform" and "crsTransform" are specified.')
        reprojection_params['crs_transform'] = reprojection_params.pop(
            'crsTransform')

      if 'crs' not in reprojection_params:
        raise ee_exception.EEException(
            'Must specify "crs" if "crs_transform" is specified.')
      crs = reprojection_params['crs']

      if 'crs_transform' in reprojection_params:
        crs_transform = reprojection_params['crs_transform']
        # crs_transform can come in a bewildering variety of shapes: a list of
        # numbers, an ee.List of possibly computed values, or even a
        # comma-separated list of numbers, potentially wrapped in square
        # brackets. Parameter coercion takes care of the first two, but we need
        # to deal with the third.
        if isinstance(crs_transform, six.string_types):
          crs_transform = [
              float(x) for x in crs_transform.lstrip('[').rstrip(']').split(',')
          ]

        image = image.reproject(crs, crsTransform=crs_transform)

        # Special case here: If they specified "crs", "crs_transform", and a
        # two-element "dimensions", but not a region or other parameters such
        # as "scale", then the desired operation is to extract an exact
        # rectangle in that exact projection, not what we'd otherwise
        # interpret this as ("reproject to that projection, then resize to
        # those dimensions"). Detect this and convert the dimensions to a
        # Geometry: a Rectangle in that Projection.
        if ('dimensions' in request and 'region' not in request and
            'scale' not in request):
          dimensions = _parse_dimensions(params['dimensions'])
          if len(dimensions) == 2:
            del request['dimensions']
            dimensions_consumed = True
            desired_rectangle = geometry.Geometry.Rectangle(
                [0, 0, dimensions[0], dimensions[1]],
                proj=image.projection(),
                geodesic=False,
                evenOdd=True)
            # This will take effect in _apply_selection_and_scale. The
            # combination reprojection and clipping will result in the exact
            # desired rectangle.
            request['region'] = desired_rectangle
      else:
        # CRS but no CRS transform means that we reproject to that CRS using a
        # default transform (with the Y coordinate flipped as we usually do) but
        # don't resample after the reprojection, so that later operations can
        # alter the image scale.
        image = image.setDefaultProjection(
            crs, crsTransform=[1, 0, 0, 0, -1, 0])

    return image, request, dimensions_consumed

  def _apply_selection_and_scale(self, params, dimensions_consumed):
    """Applies region selection and scaling parameters to an image.

    Wraps the image in a call to clipToBoundsAndScale() if there are any
    recognized region selection and scale parameters present.

    Args:
      params: the request parameters.
      dimensions_consumed: Whether the image had previously had "dimensions"
        specified, and those were consumed in an earlier stage of processing.

    Returns:
      A tuple containing:
      - the result of applying the selection and scale parameters to this
        image
      - any remaining (non-selection/scale) parameters.
    """
    keys_to_extract = set(['region', 'dimensions', 'scale'])
    scale_keys = ['maxDimension', 'height', 'width', 'scale']
    request = {}
    selection_params = {}
    if params:
      for key in params:
        if key not in keys_to_extract:
          request[key] = params[key]
        else:
          if key == 'dimensions':
            dimensions = _parse_dimensions(params['dimensions'])
            if len(dimensions) == 1:
              selection_params['maxDimension'] = dimensions[0]
            elif len(dimensions) == 2:
              selection_params['width'] = dimensions[0]
              selection_params['height'] = dimensions[1]
          elif key == 'region':
            # Could be a Geometry, a GeoJSON struct, or a GeoJSON string.
            # Geometry's constructor knows how to handle the first two.
            region = params[key]
            # If given a Geometry object, just use the client's Geometry.
            if isinstance(region, geometry.Geometry):
              selection_params['geometry'] = region
              continue
            # Otherwise, we may be given a GeoJSON object or string.
            if isinstance(region, six.string_types):
              region = json.loads(region)
            # By default the Geometry should be planar.
            if isinstance(region, list):
              if (len(region) == 2
                  or all(isinstance(e, (int, float)) for e in region)):
                selection_params['geometry'] = geometry.Geometry.Rectangle(
                    region, None, geodesic=False)
              else:
                selection_params['geometry'] = geometry.Geometry.Polygon(
                    region, None, geodesic=False)
              continue
            selection_params['geometry'] = geometry.Geometry(
                region, opt_proj=None, opt_geodesic=False)
          else:
            selection_params[key] = params[key]
    image = self
    if selection_params:
      selection_params['input'] = image
      if dimensions_consumed or any(
          key in selection_params for key in scale_keys):
        image = apifunction.ApiFunction.apply_(
            'Image.clipToBoundsAndScale', selection_params)
      else:
        clip_params = {
            'input': image,
            'geometry': selection_params.get('geometry')
        }
        image = apifunction.ApiFunction.apply_('Image.clip', clip_params)
    return image, request

  def _apply_spatial_transformations(self, params):
    """Applies spatial transformation and clipping.

    Args:
      params: the request parameters.

    Returns:
      A tuple containing:
      - the result of applying the projection, scaling, and selection
        parameters to this image.
      - any remaining parameters.
    """
    image, params, dimensions_consumed = self._apply_crs_and_affine(params)
    return image._apply_selection_and_scale(params, dimensions_consumed)  # pylint: disable=protected-access

  def _apply_visualization(self, params):
    """Applies visualization parameters to an image.

    Wraps the image in a call to visualize() if there are any recognized
    visualization parameters present.

    Args:
      params: the request parameters.

    Returns:
      A tuple containing:
      - the result of applying the visualization parameters to this image
      - any remaining (non-visualization) parameters.
    """
    # Split the parameters into those handled handled by visualize()
    # and those that aren't.
    keys_to_extract = set(['bands', 'gain', 'bias', 'min', 'max',
                           'gamma', 'palette', 'opacity', 'forceRgbOutput'])
    request = {}
    vis_params = {}
    if params:
      for key in params:
        if key in keys_to_extract:
          vis_params[key] = params[key]
        else:
          request[key] = params[key]
    image = self
    if vis_params:
      vis_params['image'] = image
      image = apifunction.ApiFunction.apply_('Image.visualize', vis_params)
    return image, request

  def _build_download_id_image(self, params):
    """Processes the getDownloadId parameters and returns the built image.

    Given transformation parameters (crs, crs_transform, dimensions, scale, and
    region), constructs an image per band. Band level parameters override the
    parameters specified in the top level. If dimensions and scale parameters
    are both specified, the scale parameter is ignored.

    Image transformations will be applied on a per band basis if the
    format parameter is ZIPPED_GEO_TIFF_PER_BAND and there are bands in the
    bands list. Otherwise, the transformations will be applied on the entire
    image.

    Args:
      params: The getDownloadId parameters.

    Returns:
      The image filtered to the given bands and the associated transformations
      applied.
    """
    params = params.copy()

    def _extract_and_validate_transforms(obj):
      """Takes a parameter dictionary and extracts the transformation keys."""
      extracted = {}
      for key in ['crs', 'crs_transform', 'dimensions', 'region']:
        if key in obj:
          extracted[key] = obj[key]
      # Since dimensions and scale are mutually exclusive, we ignore scale
      # if dimensions are specified.
      if 'scale' in obj and 'dimensions' not in obj:
        extracted['scale'] = obj['scale']
      return extracted

    def _build_image_per_band(band_params):
      """Takes a band dictionary and builds an image for it."""
      if 'id' not in band_params:
        raise ee_exception.EEException('Each band dictionary must have an id.')
      band_id = band_params['id']
      band_image = self.select(band_id)
      # Override the existing top level params with the band level params.
      copy_params = _extract_and_validate_transforms(params)
      band_params = _extract_and_validate_transforms(band_params)
      copy_params.update(band_params)
      band_params = _extract_and_validate_transforms(copy_params)
      # pylint: disable=protected-access
      band_image, _ = band_image._apply_spatial_transformations(band_params)
      # pylint: enable=protected-access
      return band_image

    if params['format'] == 'ZIPPED_GEO_TIFF_PER_BAND' and params.get(
        'bands') and len(params.get('bands')):
      # Build a new image based on the constituent band images.
      image = Image.combine_(
          [_build_image_per_band(band) for band in params['bands']])
    else:
      # Apply transformations directly onto the image, ignoring any band params.
      copy_params = _extract_and_validate_transforms(params)
      image, copy_params = self._apply_spatial_transformations(copy_params)
    return image

  def prepare_for_export(self, params):
    """Applies all relevant export parameters to an image.

    Args:
      params: the export request parameters.

    Returns:
      A tuple containing:
      - an image that has had many of the request parameters applied
        to it
      - any remaining parameters.
    """
    return self._apply_spatial_transformations(params)

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
        filePerBand - whether to produce a different GeoTIFF per band (boolean).
            Defaults to true. If false, a single GeoTIFF is produced and all
            band-level transformations will be ignored.
    Returns:
      A URL to download the specified image.
    """
    request = params or {}
    request['image'] = self
    return data.makeDownloadUrl(data.getDownloadId(request))

  def getThumbId(self, params):
    """Applies transformations and returns the thumbId.

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
      A thumbId for the created thumbnail.

    Raises:
      EEException: If the region parameter is not an array or GeoJSON object.
    """
    image, params = self._apply_spatial_transformations(params)
    image, params = image._apply_visualization(params)  # pylint: disable=protected-access
    params['image'] = image
    return data.getThumbId(params)

  def getThumbURL(self, params=None):
    """Get a thumbnail URL for this image.

    Args:
      params: Parameters identical to getMapId, plus, optionally:
          dimensions - (a number or pair of numbers in format WIDTHxHEIGHT) Max
            dimensions of the thumbnail to render, in pixels. If only one number
            is passed, it is used as the maximum, and the other dimension is
            computed by proportional scaling.
          region - (ee.Geometry, GeoJSON, list of numbers, list of points)
            Geospatial region of the image to render. By default, the whole
            image.  If given a list of min lon, min lat, max lon, max lat,
            a planar rectangle is created.  If given a list of points a
            planar polygon is created.
          format - (string) Either 'png' or 'jpg'.

    Returns:
      A URL to download a thumbnail the specified image.

    Raises:
      EEException: If the region parameter is not an array or GeoJSON object.
    """
    # If the Cloud API is enabled, we can do cleaner handling of the parameters.
    # If it isn't enabled, we have to be bug-for-bug compatible with current
    # behaviour.
    return data.makeThumbUrl(self.getThumbId(params))

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
      for name, value in opt_map.items():
        all_vars.append(name)
        args[name] = Image(value)

    body = apifunction.ApiFunction.call_(
        'Image.parseExpression', expression, arg_name, all_vars)

    # Like Spot the zebra, Image.parseExpression is not like all the others.
    # It's an Algorithm whose output (in "body" here) is another Algorithm, one
    # that takes a set of Images and produces an Image. We need to make an
    # ee.Function to wrap it properly: encoding and specification of input and
    # output types.
    class ReinterpretedFunction(function.Function):
      """A function that executes the result of a function."""

      def encode_invocation(self, encoder):
        return body.encode(encoder)

      def encode_cloud_invocation(self, encoder):
        return {'functionReference': encoder(body)}

      def getSignature(self):
        return {
            'name': '',
            'args': [{'name': name, 'type': 'Image', 'optional': False}
                     for name in all_vars],
            'returns': 'Image'
        }

    # Perform the call to the result of Image.parseExpression
    return ReinterpretedFunction().apply(args)

  def clip(self, clip_geometry):
    """Clips an image to a Geometry or Feature.

    The output bands correspond exactly the input bands, except data not
    covered by the geometry is masked. The output image retains the
    metadata of the input image.

    Use clipToCollection to clip an image to a FeatureCollection.

    Args:
      clip_geometry: The Geometry or Feature to clip to.

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
    if args or ee_types.isString(names):
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


def _parse_dimensions(dimensions):
  """Parses a dimensions specification into a one or two element list."""
  if ee_types.isNumber(dimensions):
    return [dimensions]
  elif isinstance(dimensions, six.string_types):
    # Unpack WIDTHxHEIGHT
    return [int(x) for x in dimensions.split('x')]
  elif isinstance(dimensions, (list, tuple)) and 1 <= len(dimensions) <= 2:
    return dimensions

  raise ee_exception.EEException(
      'Invalid dimensions {}.'.format(dimensions))
