"""A representation of an Earth Engine image.

See: https://developers.google.com/earth-engine/apidocs/ee-image for more
details.
"""

from __future__ import annotations

import json
from typing import Any, Dict, List, Optional, Sequence, Tuple, Union

from ee import _utils
from ee import apifunction
from ee import computedobject
from ee import data
from ee import deprecation
from ee import dictionary
from ee import ee_date
from ee import ee_exception
from ee import ee_list
from ee import ee_number
from ee import ee_string
from ee import ee_types
from ee import element
from ee import function
from ee import geometry

_EeAnyType = Union[Any, computedobject.ComputedObject]
_EeBoolType = Union[Any, computedobject.ComputedObject]
_ImageType = Union[Any, computedobject.ComputedObject]
_IntegerType = Union[int, ee_number.Number, computedobject.ComputedObject]
_ListType = Union[List[Any], Tuple[Any, Any], computedobject.ComputedObject]
_NumberType = Union[float, ee_number.Number, computedobject.ComputedObject]
_ReducerType = Union[Any, computedobject.ComputedObject]
_StringType = Union[str, 'ee_string.String', computedobject.ComputedObject]


def _parse_dimensions(dimensions: Any) -> Sequence[Any]:
  """Parses a dimensions specification into a one or two element list."""
  if ee_types.isNumber(dimensions):
    return [dimensions]
  elif isinstance(dimensions, str):
    # Unpack WIDTHxHEIGHT
    return [int(x) for x in dimensions.split('x')]
  elif isinstance(dimensions, (list, tuple)) and 1 <= len(dimensions) <= 2:
    return dimensions

  raise ee_exception.EEException(
      'Invalid dimensions {}.'.format(dimensions))


class Image(element.Element):
  """An object to represent an Earth Engine image."""

  _initialized = False

  # Tell pytype to not complain about dynamic attributes.
  _HAS_DYNAMIC_ATTRIBUTES = True

  @deprecation.WarnForDeprecatedAsset('args')
  def __init__(
      self, args: Optional[Any] = None, version: Optional[float] = None
  ):
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
        super().__init__(
            apifunction.ApiFunction.lookup('Image.load'),
            {'id': args, 'version': version})
      else:
        raise ee_exception.EEException(
            'If version is specified, the arg to Image() must be a string. '
            'Received: %s' % (args,))
      return

    if ee_types.isNumber(args):
      # A constant image.
      super().__init__(
          apifunction.ApiFunction.lookup('Image.constant'), {'value': args})
    elif ee_types.isString(args):
      # An ID.
      super().__init__(
          apifunction.ApiFunction.lookup('Image.load'), {'id': args})
    elif isinstance(args, (list, tuple)):
      # Make an image out of each element.
      image = Image.combine_([Image(i) for i in args])
      super().__init__(image.func, image.args)
    elif isinstance(args, computedobject.ComputedObject):
      if args.name() == 'Array':
        # A constant array image.
        super().__init__(
            apifunction.ApiFunction.lookup('Image.constant'), {'value': args})
      else:
        # A custom object to reinterpret as an Image.
        super().__init__(args.func, args.args, args.varName)
    elif args is None:
      super().__init__(
          apifunction.ApiFunction.lookup('Image.mask'),
          {'image': Image(0), 'mask': Image(0)})
    else:
      raise ee_exception.EEException(
          'Unrecognized argument type to convert to an Image: %s' % args)

  @classmethod
  def initialize(cls) -> None:
    """Imports API functions to this class."""
    if not cls._initialized:
      apifunction.ApiFunction.importApi(cls, cls.name(), cls.name())
      cls._initialized = True

  @classmethod
  def reset(cls) -> None:
    """Removes imported API functions from this class."""
    apifunction.ApiFunction.clearApi(cls)
    cls._initialized = False

  @staticmethod
  def name() -> str:
    return 'Image'

  # pylint: disable-next=useless-parent-delegation
  def getInfo(self) -> Optional[Any]:
    """Fetch and return information about this image.

    Returns:
      The return contents vary but will include at least:
          bands - Array containing metadata about the bands in the image,
          properties - Dictionary containing the image's metadata properties.
    """
    return super().getInfo()

  def getMapId(self, vis_params: Optional[Any] = None) -> Dict[str, Any]:
    """Fetch and return a map ID dictionary, suitable for use in a Map overlay.

    Args:
      vis_params: The visualization parameters. See ee.data.getMapId.

    Returns:
      A map ID dictionary as described in ee.data.getMapId.
    """
    vis_image, request = self._apply_visualization(vis_params)
    request['image'] = vis_image
    response = data.getMapId(request)
    response['image'] = self
    return response

  def _apply_crs_and_affine(
      self, params: Dict[str, Any]
  ) -> Tuple[Any, Any, Any]:
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
        if isinstance(crs_transform, str):
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

  def _apply_selection_and_scale(
      self, params: Dict[str, Any], dimensions_consumed: bool
  ) -> Tuple[Any, Dict[str, Any]]:
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
    request: Dict[str, Any] = {}
    selection_params: Dict[str, Any] = {}
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
            if isinstance(region, str):
              region = json.loads(region)
            # By default the Geometry should be planar.
            if isinstance(region, list):
              if (len(region) == 2
                  or all(isinstance(e, (float, int)) for e in region)):
                selection_params['geometry'] = geometry.Geometry.Rectangle(
                    region, None, geodesic=False)
              else:
                selection_params['geometry'] = geometry.Geometry.Polygon(
                    region, None, geodesic=False)
              continue
            selection_params['geometry'] = geometry.Geometry(
                region, proj=None, geodesic=False
            )
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

  def _apply_spatial_transformations(
      self, params: Dict[str, Any]
  ) -> Tuple[Any, Dict[str, Any]]:
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

  def _apply_visualization(
      self, params: Dict[str, Any]
  ) -> Tuple[Any, Dict[str, Any]]:
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

  def _build_download_id_image(self, params: Dict[str, Any]) -> Any:
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

    def _extract_and_validate_transforms(obj: Dict[str, Any]) -> Dict[str, Any]:
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

    def _build_image_per_band(band_params: Dict[str, Any]) -> Any:
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
      del copy_params  # Unused.
    return image

  def prepare_for_export(self, params: Dict[str, Any]) -> Any:
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

  def getDownloadURL(self, params: Optional[Dict[str, Any]] = None) -> str:
    """Get a download URL for an image chunk.

    Generates a download URL for small chunks of image data in GeoTIFF or NumPy
    format. Maximum request size is 32 MB, maximum grid dimension is 10000.

    Use getThumbURL for RGB visualization formats PNG and JPG.

    Args:
      params: An object containing download options with the following
          possible values:
        - name: a base name to use when constructing filenames. Only applicable
            when format is "ZIPPED_GEO_TIFF" (default),
            "ZIPPED_GEO_TIFF_PER_BAND" or filePerBand is true. Defaults to the
            image id (or "download" for computed images) when format is
            "ZIPPED_GEO_TIFF", "ZIPPED_GEO_TIFF_PER_BAND", or filePerBand is
            true, otherwise a random character string is generated. Band names
            are appended when filePerBand is true.
        - bands: a description of the bands to download. Must be an array of
            band names or an array of dictionaries, each with the
            following keys:
          + id: the name of the band, a string, required.
          + crs: an optional CRS string defining the band projection.
          + crs_transform: an optional array of 6 numbers specifying an affine
              transform from the specified CRS, in the order:
              [xScale, yShearing, xShearing, yScale, xTranslation, yTranslation]
          + dimensions: an optional array of two integers defining the width and
              height to which the band is cropped.
          + scale: an optional number, specifying the scale in meters of the
                 band; ignored if crs and crs_transform are specified.
        - crs: a default CRS string to use for any bands that do not explicitly
            specify one.
        - crs_transform: a default affine transform to use for any bands that do
            not specify one, of the same format as the crs_transform of bands.
        - dimensions: default image cropping dimensions to use for any bands
            that do not specify them.
        - scale: a default scale to use for any bands that do not specify one;
            ignored if crs and crs_transform is specified.
        - region: a polygon specifying a region to download; ignored if crs
            and crs_transform are specified.
        - filePerBand: whether to produce a separate GeoTIFF per band (boolean).
            Defaults to true. If false, a single GeoTIFF is produced and all
            band-level transformations will be ignored. Note that this is
            ignored if the format is "ZIPPED_GEO_TIFF" or
            "ZIPPED_GEO_TIFF_PER_BAND".
        - format: the download format. One of:
            "ZIPPED_GEO_TIFF" (GeoTIFF file wrapped in a zip file, default),
            "ZIPPED_GEO_TIFF_PER_BAND"  (Multiple GeoTIFF files wrapped in a
            zip file), "GEO_TIFF" (GeoTIFF file), "NPY" (NumPy binary format).
            If "GEO_TIFF" or "NPY", filePerBand and all band-level
            transformations will be ignored. Loading a NumPy output results in
            a structured array.

    Returns:
      A URL to download for the specified image chunk.
    """
    request = params or {}
    request['image'] = self
    return data.makeDownloadUrl(data.getDownloadId(request))

  def getThumbId(self, params: Dict[str, Any]) -> Dict[str, str]:
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

  def getThumbURL(self, params: Optional[Dict[str, Any]] = None) -> str:
    """Get a thumbnail URL for this image.

    Args:
      params: Parameters identical to getMapId, plus, optionally:
          dimensions - (a number or pair of numbers in format WIDTHxHEIGHT) Max
            dimensions of the thumbnail to render, in pixels. If only one number
            is passed, it is used as the maximum, and the other dimension is
            computed by proportional scaling.
          region - (ee.Geometry, GeoJSON, list of numbers, list of points)
            Geospatial region of the image to render. By default, the whole
            image. If given a list of min lon, min lat, max lon, max lat,
            a planar rectangle is created. If given a list of points a
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

  # pylint: disable=g-bad-name
  # Deprecated spellings to match the JS library.
  getDownloadUrl = deprecation.Deprecated('Use getDownloadURL().')(
      getDownloadURL)
  getThumbUrl = deprecation.Deprecated('Use getThumbURL().')(getThumbURL)
  # pylint: enable=g-bad-name

  ###################################################
  # Static methods.
  ###################################################

  @staticmethod
  def rgb(r: float, g: float, b: float) -> Image:
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
  def cat(*args) -> Image:
    """Combine the given images' bands into a single image with all the bands.

    If two or more bands share a name, they are suffixed with an incrementing
    index.

    The resulting image will have the metadata from the first input image, only.

    This function will promote constant values into constant images.

    Args:
      *args: The list of images to be combined.

    Returns:
      The combined image.
    """
    return Image.combine_(args)

  @staticmethod
  def combine_(images: Any, names: Optional[Any] = None) -> Image:
    """Combine all the bands from the given images into a single image.

    Args:
      images: The images to be combined.
      names: An array of names for the output bands.

    Returns:
      The combined image.
    """
    if not images:
      raise ee_exception.EEException('Cannot combine 0 images.')

    # Append all the bands.
    result = Image(images[0])
    for image in images[1:]:
      result = apifunction.ApiFunction.call_('Image.addBands', result, image)

    # Optionally, rename the bands of the result.
    if names:
      result = result.select(['.*'], names)

    return result

  @_utils.accept_opt_prefix('opt_selectors', 'opt_names')
  # pylint: disable-next=keyword-arg-before-vararg
  def select(
      self,
      selectors: Optional[Any] = None,
      names: Optional[Any] = None,
      *args,
  ) -> Image:
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
      selectors: An array of names, regexes or numeric indices specifying the
        bands to select.
      names: An array of strings specifying the new names for the selected
        bands.
      *args: Selector elements as varargs.

    Returns:
      An image with the selected bands.
    """
    if selectors is not None:
      args = list(args)
      if names is not None:
        args.insert(0, names)
      args.insert(0, selectors)
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

  @_utils.accept_opt_prefix(('opt_map', 'map_'))
  def expression(self, expression: Any, map_: Optional[Any] = None) -> Image:
    """Evaluates an arithmetic expression on an image or images.

    The bands of the primary input image are available using the built-in
    function b(), as b(0) or b('band_name').

    Variables in the expression are interpreted as additional image parameters
    which must be supplied in map_. The bands of each such image can be
    accessed like image.band_name or image[0].

    Both b() and image[] allow multiple arguments, to specify multiple bands,
    such as b(1, 'name', 3). Calling b() with no arguments, or using a variable
    by itself, returns all bands of the image.

    Args:
      expression: The expression to evaluate.
      map_: An optional map of input images available by name.

    Returns:
      The image computed by the provided expression.
    """
    arg_name = 'DEFAULT_EXPRESSION_IMAGE'
    all_vars = [arg_name]
    args = {arg_name: self}

    # Add custom arguments, promoting them to Images manually.
    if map_:
      for name, value in map_.items():
        all_vars.append(name)
        args[name] = Image(value)

    body = apifunction.ApiFunction.call_(
        'Image.parseExpression', expression, arg_name, all_vars)

    # Like Spot the zebra, Image.parseExpression is not like all the others.
    # It's an Algorithm whose output (in "body" here) is another Algorithm, one
    # that takes a set of Images and produces an Image. We need to make an
    # ee.Function to wrap it properly: encoding and specification of input and
    # output types.
    signature = {
        'name': '',
        'args': [{'name': name, 'type': self.name(), 'optional': False}
                 for name in all_vars],
        'returns': 'Image'
    }
    # Perform the call to the result of Image.parseExpression
    return function.SecondOrderFunction(body, signature).apply(args)

  def abs(self) -> Image:
    """Computes the absolute value of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.abs', self)

  def acos(self) -> Image:
    """Computes the arc cosine in radians of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.acos', self)

  def add(self, image2: _ImageType) -> Image:
    """Adds the first value to the second for each matched pair of bands.

    If either image1 or image2 has only 1 band, then it is used against all the
    bands in the other image. If the images have the same number of bands, but
    not the same names, they're used pairwise in the natural order. The output
    bands are named for the longer of the two inputs, or if they're equal in
    length, in image1's order. The type of the output pixels is the union of the
    input types.

    Args:
      image2: The image from which the right operand bands are taken.

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(self.name() + '.add', self, image2)

  def addBands(
      self,
      srcImg: _ImageType,  # pylint: disable=invalid-name
      names: Optional[_ListType] = None,
      overwrite: Optional[_EeBoolType] = None,
  ) -> Image:
    """Returns an image containing all bands.

    Bands are copied from the first input and selected bands from the second
    input, optionally overwriting bands in the first image with the same name.

    The new image has the metadata and footprint from the first input image.

    Args:
      srcImg: An image containing bands to copy.
      names: Optional list of band names to copy. If names is omitted, all bands
        from srcImg will be copied over.
      overwrite: If true, bands from `srcImg` will override bands with the same
        names in `dstImg`. Otherwise the new band will be renamed with a
        numerical suffix (`foo` to `foo_1` unless `foo_1` exists, then `foo_2`
        unless it exists, etc).

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.addBands', self, srcImg, names, overwrite
    )

  def And(self, image2: _ImageType) -> Image:
    """Returns 1 if both values are non-zero; otherwise 0.

    Returns 1 if and only if both values are non-zero for each matched pair of
    bands in image1 and image2.

    If either image1 or image2 has only 1 band, then it is used against all the
    bands in the other image. If the images have the same number of bands, but
    not the same names, they're used pairwise in the natural order. The output
    bands are named for the longer of the two inputs, or if they're equal in
    length, in image1's order. The type of the output pixels is boolean.

    Args:
      image2: The image from which the right operand bands are taken.

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(self.name() + '.and', self, image2)

  def arrayAccum(
      self, axis: _IntegerType, reducer: Optional[_ReducerType] = None
  ) -> Image:
    """Accumulates elements of each array pixel along the given axis.

    Accumulates elements of each array pixel along the given axis, by setting
    each element of the result array pixel to the reduction of elements in that
    pixel along the given axis, up to and including the current position on the
    axis.

    May be used to make a cumulative sum, a monotonically increasing sequence,
    etc.

    Args:
      axis: Axis along which to perform the cumulative sum.
      reducer: Reducer to accumulate values. Default is SUM, to produce the
        cumulative sum of each vector along the given axis.

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.arrayAccum', self, axis, reducer
    )

  def arrayArgmax(self) -> Image:
    """Returns the positional indices of the maximum value of array values.

    If there are multiple occurrences of the maximum, the indices reflect the
    first.
    """

    return apifunction.ApiFunction.call_(self.name() + '.arrayArgmax', self)

  def arrayCat(self, image2: _ImageType, axis: _IntegerType) -> Image:
    """Creates an array image by concatenating each array pixel.

    Creates an array image by concatenating each array pixel along the given
    axis in each band.

    Args:
      image2: Second array image to concatenate.
      axis: Axis to concatenate along.

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.arrayCat', self, image2, axis
    )

  def arrayDimensions(self) -> Image:
    """Returns the number of dimensions in each array band.

    Gives 0 for scalar image bands.
    """

    return apifunction.ApiFunction.call_(self.name() + '.arrayDimensions', self)

  def arrayDotProduct(self, image2: _ImageType) -> Image:
    """Computes the dot product.

    Computes the dot product of each pair of 1-D arrays in the bands of the
    input images.

    Args:
      image2: Second array image of 1-D vectors.

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.arrayDotProduct', self, image2
    )

  def arrayFlatten(
      self,
      coordinateLabels: _ListType,  # pylint: disable=invalid-name
      separator: Optional[_StringType] = None,
  ) -> Image:
    """Returns an image of scalar pixels with one band per element of the array.

    Converts a single-band image of equal-shape multidimensional pixels to an
    image of scalar pixels, with 1 band for each element of the array.

    Args:
      coordinateLabels: Name of each position along each axis. For example, 2x2
        arrays with axes meaning 'day' and 'color' could have labels like
        [['monday', 'tuesday'], ['red', 'green']], resulting in band
        names'monday_red', 'monday_green', 'tuesday_red', and 'tuesday_green'.
      separator: Separator between array labels in each band name.

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.arrayFlatten', self, coordinateLabels, separator
    )

  def arrayGet(self, position: _ImageType) -> Image:
    """Returns the value at the given position in each band of the input image.

    For each band, an output band of the same name is created with the value at
    the given position extracted from the input multidimensional pixel in that
    band.

    Args:
      position: The coordinates of the element to get. There must be as many
        scalar bands as there are dimensions in the input image.

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.arrayGet', self, position
    )

  def arrayLength(self, axis: _IntegerType) -> Image:
    """Returns the length of each pixel's array along the given axis.

    Args:
      axis: The axis along which to take the length.

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.arrayLength', self, axis
    )

  def arrayLengths(self) -> Image:
    """Returns a 1D array image with the length of each array axis."""

    return apifunction.ApiFunction.call_(self.name() + '.arrayLengths', self)

  def arrayMask(self, mask: _ImageType) -> Image:
    """Returns an image where each pixel is masked by another.

    Creates an array image where each array-valued pixel is masked with another
    array-valued pixel, retaining only the elements where the mask is non-zero.

    If the mask image has one band it will be applied to all the bands of
    'input', otherwise they must have the same number of bands.

    Args:
      mask: Array image to mask with.

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(self.name() + '.arrayMask', self, mask)

  def arrayPad(
      self, lengths: _ListType, pad: Optional[_NumberType] = None
  ) -> Image:
    """Pads the array values in each pixel to be a fixed length.

    The pad value will be appended to each array to extend it to given length
    along each axis. All bands of the image must be array-valued and have the
    same dimensions.

    Args:
      lengths: A list of desired lengths for each axis in the output arrays.
        Arrays are already as large or larger than the given length will be
        unchanged along that axis
      pad: The value to pad with.

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.arrayPad', self, lengths, pad
    )

  def arrayProject(self, axes: _EeAnyType) -> Image:
    """Creates an array image of lower dimension.

    Projects the array in each pixel to a lower dimensional space by specifying
    the axes to retain.

    Dropped axes must be at most length 1.

    Args:
      axes: The axes to retain. Other axes will be discarded and must be at most
        length 1.

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.arrayProject', self, axes
    )

  def arrayReduce(
      self,
      reducer: _EeAnyType,
      axes: _EeAnyType,
      fieldAxis: Optional[_IntegerType] = None,  # pylint: disable=invalid-name
  ) -> Image:
    """Reduces elements of each array pixel.

    Args:
      reducer: The reducer to apply
      axes: The list of array axes to reduce in each pixel. The output will have
        a length of 1 in all these axes.
      fieldAxis: The axis for the reducer's input and output fields. Only
        required if the reducer has multiple inputs or outputs.

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.arrayReduce', self, reducer, axes, fieldAxis
    )

  def arrayRepeat(self, axis: _IntegerType, copies: _EeAnyType) -> Image:
    """Repeats each array pixel along the given axis.

    Each output pixel will have the shape of the input pixel, except length
    along the repeated axis, which will be multiplied by the number of copies.

    Args:
      axis: Axis along which to repeat each pixel's array.
      copies: Number of copies of each pixel.

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.arrayRepeat', self, axis, copies
    )

  def arrayReshape(
      self, lengths: _EeAnyType, dimensions: _IntegerType
  ) -> Image:
    """Returns an image of arrays with a new shape.

    Converts array bands of an image with equally-shaped, possibly
    multidimensional pixels to an image of arrays with a new shape.

    Args:
      lengths: A 1-band image specifying the new lengths of each axis of the
        input image specified as a 1-D array per pixel. There should be
        'dimensions' lengths values in each shape' array. If one of the lengths
        is -1, then the corresponding length for that axis will be computed such
        that the total size remains constant. In particular, a shape of [-1]
        flattens into 1-D. At most one component of shape can be -1.
      dimensions: The number of dimensions shared by all output array pixels.

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.arrayReshape', self, lengths, dimensions
    )

  def arraySlice(
      self,
      axis: Optional[_IntegerType] = None,
      start: Optional[_EeAnyType] = None,
      end: Optional[_EeAnyType] = None,
      step: Optional[_IntegerType] = None,
  ) -> Image:
    """Returns a subarray image.

    Creates a subarray by slicing out each position along the given axis from
    the 'start' (inclusive) to 'end' (exclusive) by increments of 'step'.

    The result will have as many dimensions as the input, and the same length in
    all directions except the slicing axis, where the length will be the number
    of positions from 'start' to 'end' by 'step' that are in range of the input
    array's length along 'axis'. This means the result can be length 0 along the
    given axis if start=end, or if the start or end values are entirely out of
    range.

    Args:
      axis: Axis to subset.
      start: The coordinate of the first slice (inclusive) along 'axis'.
        Negative numbers are used to position the start of slicing relative to
        the end of the array, where -1 starts at the last position on the axis,
        -2 starts at the next to last position, etc. There must one band for
        start indices, or one band per 'input' band. If this argument is not set
        or masked at some pixel, then the slice at that pixel will start at
        index 0.
      end: The coordinate (exclusive) at which to stop taking slices. By default
        this will be the length of the given axis. Negative numbers are used to
        position the end of slicing relative to the end of the array, where -1
        will exclude the last position, -2 will exclude the last two positions,
        etc. There must be one band for end indices, or one band per 'input'
        band. If this argument is not set or masked at some pixel, then the
        slice at that pixel will end just after the last index.
      step: The separation between slices along 'axis'; a slice will be taken at
        each whole multiple of 'step' from 'start' (inclusive) to 'end'
        (exclusive). Must be positive.

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.arraySlice', self, axis, start, end, step
    )

  def arraySort(self, keys: Optional[_EeAnyType] = None) -> Image:
    """Sorts elements of each array pixel along one axis.

    Args:
      keys: Optional keys to sort by. If not provided, the values are used as
        the keys. The keys can only have multiple elements along one axis, which
        determines the direction to sort in.

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(self.name() + '.arraySort', self, keys)

  def arrayTranspose(
      self,
      axis1: Optional[_IntegerType] = None,
      axis2: Optional[_IntegerType] = None,
  ) -> Image:
    """Transposes two dimensions of each array pixel.

    Args:
      axis1: First axis to swap.
      axis2: Second axis to swap.

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.arrayTranspose', self, axis1, axis2
    )

  def asin(self) -> Image:
    """Computes the arc sine in radians of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.asin', self)

  def atan(self) -> Image:
    """Computes the arc tangent in radians of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.atan', self)

  def atan2(self, image2: _EeAnyType) -> Image:
    """Returns an image of angles in radians of 2D vectors.

    Calculates the angle formed by the 2D vector [x, y] for each matched pair of
    bands in image1 and image2.

    If either image1 or image2 has only 1 band, then it is used against all the
    bands in the other image. If the images have the same number of bands, but
    not the same names, they're used pairwise in the natural order. The output
    bands are named for the longer of the two inputs, or if they're equal in
    length, in image1's order. The type of the output pixels is float.

    Args:
      image2: The image from which the right operand bands are taken.

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(self.name() + '.atan2', self, image2)

  def bandNames(self) -> ee_list.List:
    """Returns a list containing the names of the bands of an image."""

    return apifunction.ApiFunction.call_(self.name() + '.bandNames', self)

  def bandTypes(self) -> dictionary.Dictionary:
    """Returns a dictionary of the image's band types."""

    return apifunction.ApiFunction.call_(self.name() + '.bandTypes', self)

  def bitCount(self) -> Image:
    """Calculates the number of one-bits.

    Calculates the number of one-bits in the 64-bit two's complement binary
    representation of the input.

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(self.name() + '.bitCount', self)

  def bitsToArrayImage(self) -> Image:
    """Turns the bits of an integer into a 1-D array.

    The array has a lengthup to the highest 'on' bit in the input.

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.bitsToArrayImage', self
    )

  def bitwiseNot(self) -> Image:
    """Calculates the bitwise NOT of the input.

    Uses the smallest signed integer type that can hold the input.

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(self.name() + '.bitwiseNot', self)

  def byte(self) -> Image:
    """Casts the input value to an unsigned 8-bit integer."""

    return apifunction.ApiFunction.call_(self.name() + '.byte', self)

  def cbrt(self) -> Image:
    """Computes the cubic root of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.cbrt', self)

  def ceil(self) -> Image:
    """Computes the smallest integer greater than or equal to the input."""

    return apifunction.ApiFunction.call_(self.name() + '.ceil', self)

  def clip(self, clip_geometry: Any) -> Image:
    """Clips an image to a Geometry or Feature.

    The output bands correspond exactly to the input bands, except data not
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
      # specify the type so auto promotion will not work.
      clip_geometry = geometry.Geometry(clip_geometry)
    except ee_exception.EEException:
      pass  # Not an ee.Geometry or GeoJSON. Just pass it along.

    return apifunction.ApiFunction.call_(
        self.name() + '.clip', self, clip_geometry
    )

  def cos(self) -> Image:
    """Computes the cosine of the input in radians."""

    return apifunction.ApiFunction.call_(self.name() + '.cos', self)

  def cosh(self) -> Image:
    """Computes the hyperbolic cosine of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.cosh', self)

  def date(self) -> ee_date.Date:
    """Returns the acquisition time of an image as a Date object.

    This helper function is equivalent to
    `ee.Date(image.get('system:time_start'))`.
    """

    return apifunction.ApiFunction.call_(self.name() + '.date', self)

  def derivative(self) -> Image:
    """Computes the X and Y discrete derivatives.

    Computes the X and Y discrete derivatives for each band in the input image,
    in pixel coordinates.

    For each band of the input image, the output image will have two bands named
    with the suffixes `_x` and `_y`, containing the respective derivatives.

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(self.name() + '.derivative', self)

  def digamma(self) -> Image:
    """Computes the digamma function of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.digamma', self)

  def double(self) -> Image:
    """Casts the input value to a 64-bit float."""

    return apifunction.ApiFunction.call_(self.name() + '.double', self)

  def erf(self) -> Image:
    """Computes the error function of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.erf', self)

  def erfInv(self) -> Image:
    """Computes the inverse error function of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.erfInv', self)

  def erfc(self) -> Image:
    """Computes the complementary error function of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.erfc', self)

  def erfcInv(self) -> Image:
    """Computes the inverse complementary error function of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.erfcInv', self)

  def exp(self) -> Image:
    """Computes the Euler's number e raised to the power of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.exp', self)

  def float(self) -> Image:
    """Casts the input value to a 32-bit float."""

    return apifunction.ApiFunction.call_(self.name() + '.float', self)

  def floor(self) -> Image:
    """Computes the largest integer less than or equal to the input."""

    return apifunction.ApiFunction.call_(self.name() + '.floor', self)

  def gamma(self) -> Image:
    """Computes the gamma function of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.gamma', self)

  def gradient(self) -> Image:
    """Calculates the x and y gradient."""

    return apifunction.ApiFunction.call_(self.name() + '.gradient', self)

  def hsvToRgb(self) -> Image:
    """Transforms the image from the HSV color space to the RGB color space.

    Expects a 3 band image in the range [0, 1], and produces three bands: red,
    green and blue with values in the range [0, 1].

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(self.name() + '.hsvToRgb', self)

  def id(self) -> ee_string.String:
    """Returns the ID of a given element within a collection.

    Objects outside collections are not guaranteed to have IDs.
    """

    return apifunction.ApiFunction.call_(self.name() + '.id', self)

  def int(self) -> Image:
    """Casts the input value to a signed 32-bit integer."""

    return apifunction.ApiFunction.call_(self.name() + '.int', self)

  def int16(self) -> Image:
    """Casts the input value to a signed 16-bit integer."""

    return apifunction.ApiFunction.call_(self.name() + '.int16', self)

  def int32(self) -> Image:
    """Casts the input value to a signed 32-bit integer."""

    return apifunction.ApiFunction.call_(self.name() + '.int32', self)

  def int64(self) -> Image:
    """Casts the input value to a signed 64-bit integer."""

    return apifunction.ApiFunction.call_(self.name() + '.int64', self)

  def int8(self) -> Image:
    """Casts the input value to a signed 8-bit integer."""

    return apifunction.ApiFunction.call_(self.name() + '.int8', self)

  def lanczos(self) -> Image:
    """Computes the Lanczos approximation of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.lanczos', self)

  def log(self) -> Image:
    """Computes the natural logarithm of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.log', self)

  def log10(self) -> Image:
    """Computes the base-10 logarithm of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.log10', self)

  def long(self) -> Image:
    """Casts the input value to a signed 64-bit integer."""

    return apifunction.ApiFunction.call_(self.name() + '.long', self)

  def matrixCholeskyDecomposition(self) -> Image:
    """Calculates the Cholesky decomposition of a matrix.

    The Cholesky decomposition is a decomposition into the form L * L' where L
    is a lower triangular matrix. The input must be a symmetric
    positive-definite matrix. Returns an image with 1 band named 'L'.

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.matrixCholeskyDecomposition', self
    )

  def matrixDeterminant(self) -> Image:
    """Computes the determinant of the matrix."""

    return apifunction.ApiFunction.call_(
        self.name() + '.matrixDeterminant', self
    )

  def matrixDiagonal(self) -> Image:
    """Computes the diagonal of the matrix in a single column."""

    return apifunction.ApiFunction.call_(self.name() + '.matrixDiagonal', self)

  def matrixFnorm(self) -> Image:
    """Computes the Frobenius norm of the matrix."""

    return apifunction.ApiFunction.call_(self.name() + '.matrixFnorm', self)

  def matrixInverse(self) -> Image:
    """Computes the inverse of the matrix."""

    return apifunction.ApiFunction.call_(self.name() + '.matrixInverse', self)

  def matrixLUDecomposition(self) -> Image:
    """Calculates the LU matrix decomposition.

    Calculates the LU matrix decomposition such that Pxinput=LxU, where L is
    lower triangular (with unit diagonal terms), U is upper triangular and P is
    a partial pivot permutation matrix.

    The input matrix must be square. Returns an image with bands named 'L', 'U'
    and 'P'.

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.matrixLUDecomposition', self
    )

  def matrixPseudoInverse(self) -> Image:
    """Computes the Moore-Penrose pseudoinverse of the matrix."""

    return apifunction.ApiFunction.call_(
        self.name() + '.matrixPseudoInverse', self
    )

  def matrixQRDecomposition(self) -> Image:
    """Calculates the QR-decomposition of a matrix.

    Calculates the QR-decomposition of a matrix into two matrices Q and R such
    that input = QR, where Q is orthogonal, and R is upper triangular.

    Returns an image with bands named 'Q' and 'R'.

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.matrixQRDecomposition', self
    )

  def matrixSingularValueDecomposition(self) -> Image:
    """Calculates the Singular Value Decomposition.

    Calculates the Singular Value Decomposition of the input matrix into UxSxV',
    such that U and V are orthogonal and S is diagonal.

    Returns:
      An image with bands named 'U', 'S' and 'V'.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.matrixSingularValueDecomposition', self
    )

  def matrixToDiag(self) -> Image:
    """Computes a square diagonal matrix from a single column matrix."""

    return apifunction.ApiFunction.call_(self.name() + '.matrixToDiag', self)

  def matrixTrace(self) -> Image:
    """Computes the trace of the matrix."""

    return apifunction.ApiFunction.call_(self.name() + '.matrixTrace', self)

  def Not(self) -> Image:
    """Returns 0 if the input is non-zero, and 1 otherwise."""

    return apifunction.ApiFunction.call_(self.name() + '.not', self)

  def randomVisualizer(self) -> Image:
    """Creates a random visualization image.

    Creates a visualization image by assigning a random color to each unique
    value of the pixels of the first band.

    The first three bands of the output image will contain 8-bit R, G and B
    values, followed by all bands of the input image.

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.randomVisualizer', self
    )

  def rename(self, names: Any, *args) -> Image:
    """Rename the bands of an image.

    Can be called with either a list of strings or any number of strings.

    Args:
      names: An array of strings specifying the new names for the bands. Must
        exactly match the number of bands in the image.
      *args: Band names as varargs.

    Returns:
      An image with the renamed bands.
    """
    if args or ee_types.isString(names):
      # Handle varargs; everything else we let the server handle.
      args = list(args)
      args.insert(0, names)
      names = args

    algorithm_args = {'input': self, 'names': names}
    return apifunction.ApiFunction.apply_('Image.rename', algorithm_args)

  def rgbToHsv(self) -> Image:
    """Transforms the image from the RGB color space to the HSV color space.

    Expects a 3 band image in the range [0, 1], and produces three bands: hue,
    saturation and value with values in the range [0, 1].

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(self.name() + '.rgbToHsv', self)

  def round(self) -> Image:
    """Computes the integer nearest to the input."""

    return apifunction.ApiFunction.call_(self.name() + '.round', self)

  def selfMask(self) -> Image:
    """Updates an image's mask based on the image itself.

    Updates an image's mask at all positions where the existing mask is not zero
    using the value of the image as the new mask value.

    The output image retains the metadata and footprint of the input image.

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(self.name() + '.selfMask', self)

  def short(self) -> Image:
    """Casts the input value to a signed 16-bit integer."""

    return apifunction.ApiFunction.call_(self.name() + '.short', self)

  def signum(self) -> Image:
    """Computes the signum function (sign) of the input.

    Zero if the input is zero, 1 if the input is greater than zero, -1 if the
    input is less than zero.

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(self.name() + '.signum', self)

  def sin(self) -> Image:
    """Computes the sine of the input in radians."""

    return apifunction.ApiFunction.call_(self.name() + '.sin', self)

  def sinh(self) -> Image:
    """Computes the hyperbolic sine of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.sinh', self)

  def sqrt(self) -> Image:
    """Computes the square root of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.sqrt', self)

  def tan(self) -> Image:
    """Computes the tangent of the input in radians."""

    return apifunction.ApiFunction.call_(self.name() + '.tan', self)

  def tanh(self) -> Image:
    """Computes the hyperbolic tangent of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.tanh', self)

  def toByte(self) -> Image:
    """Casts the input value to an unsigned 8-bit integer."""

    return apifunction.ApiFunction.call_(self.name() + '.toByte', self)

  def toDouble(self) -> Image:
    """Casts the input value to a 64-bit float."""

    return apifunction.ApiFunction.call_(self.name() + '.toDouble', self)

  def toFloat(self) -> Image:
    """Casts the input value to a 32-bit float."""

    return apifunction.ApiFunction.call_(self.name() + '.toFloat', self)

  def toInt(self) -> Image:
    """Casts the input value to a signed 32-bit integer."""

    return apifunction.ApiFunction.call_(self.name() + '.toInt', self)

  def toInt16(self) -> Image:
    """Casts the input value to a signed 16-bit integer."""

    return apifunction.ApiFunction.call_(self.name() + '.toInt16', self)

  def toInt32(self) -> Image:
    """Casts the input value to a signed 32-bit integer."""

    return apifunction.ApiFunction.call_(self.name() + '.toInt32', self)

  def toInt64(self) -> Image:
    """Casts the input value to a signed 64-bit integer."""

    return apifunction.ApiFunction.call_(self.name() + '.toInt64', self)

  def toInt8(self) -> Image:
    """Casts the input value to a signed 8-bit integer."""

    return apifunction.ApiFunction.call_(self.name() + '.toInt8', self)

  def toLong(self) -> Image:
    """Casts the input value to a signed 64-bit integer."""

    return apifunction.ApiFunction.call_(self.name() + '.toLong', self)

  def toShort(self) -> Image:
    """Casts the input value to a signed 16-bit integer."""

    return apifunction.ApiFunction.call_(self.name() + '.toShort', self)

  def toUint16(self) -> Image:
    """Casts the input value to an unsigned 16-bit integer."""

    return apifunction.ApiFunction.call_(self.name() + '.toUint16', self)

  def toUint32(self) -> Image:
    """Casts the input value to an unsigned 32-bit integer."""

    return apifunction.ApiFunction.call_(self.name() + '.toUint32', self)

  def toUint8(self) -> Image:
    """Casts the input value to an unsigned 8-bit integer."""

    return apifunction.ApiFunction.call_(self.name() + '.toUint8', self)

  def trigamma(self) -> Image:
    """Computes the trigamma function of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.trigamma', self)

  def uint16(self) -> Image:
    """Casts the input value to an unsigned 16-bit integer."""

    return apifunction.ApiFunction.call_(self.name() + '.uint16', self)

  def uint32(self) -> Image:
    """Casts the input value to an unsigned 32-bit integer."""

    return apifunction.ApiFunction.call_(self.name() + '.uint32', self)

  def uint8(self) -> Image:
    """Casts the input value to an unsigned 8-bit integer."""

    return apifunction.ApiFunction.call_(self.name() + '.uint8', self)

  def zeroCrossing(self) -> Image:
    """Finds zero-crossings on each band of an image."""

    return apifunction.ApiFunction.call_(self.name() + '.zeroCrossing', self)
