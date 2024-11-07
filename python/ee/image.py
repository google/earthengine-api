"""A representation of an Earth Engine image.

See: https://developers.google.com/earth-engine/apidocs/ee-image for more
details.
"""

from __future__ import annotations

import json
from typing import Any, Dict, Optional, Sequence, Tuple

from ee import _arg_types
from ee import _utils
from ee import apifunction
from ee import computedobject
from ee import data
from ee import deprecation
from ee import dictionary
from ee import ee_date
from ee import ee_exception
from ee import ee_list
from ee import ee_string
from ee import ee_types
from ee import element
from ee import feature
from ee import featurecollection
from ee import function
from ee import geometry as ee_geometry
from ee import projection as ee_projection


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
            desired_rectangle = ee_geometry.Geometry.Rectangle(
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
            if isinstance(region, ee_geometry.Geometry):
              selection_params['geometry'] = region
              continue
            # Otherwise, we may be given a GeoJSON object or string.
            if isinstance(region, str):
              region = json.loads(region)
            # By default the Geometry should be planar.
            if isinstance(region, list):
              if (len(region) == 2
                  or all(isinstance(e, (float, int)) for e in region)):
                selection_params['geometry'] = ee_geometry.Geometry.Rectangle(
                    region, None, geodesic=False)
              else:
                selection_params['geometry'] = ee_geometry.Geometry.Polygon(
                    region, None, geodesic=False)
              continue
            selection_params['geometry'] = ee_geometry.Geometry(
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
    # pylint: disable-next=protected-access
    return image._apply_selection_and_scale(params, dimensions_consumed)

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
    # pylint: disable-next=protected-access
    image, params = image._apply_visualization(params)
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
    return Image(function.SecondOrderFunction(body, signature).apply(args))

  def abs(self) -> Image:
    """Computes the absolute value of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.abs', self)

  def acos(self) -> Image:
    """Computes the arccosine in radians of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.acos', self)

  def add(self, image2: _arg_types.Image) -> Image:
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
      srcImg: _arg_types.Image,  # pylint: disable=invalid-name
      names: Optional[_arg_types.List] = None,
      overwrite: Optional[_arg_types.Bool] = None,
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

  def And(self, image2: _arg_types.Image) -> Image:
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
      self,
      axis: _arg_types.Integer,
      reducer: Optional[_arg_types.Reducer] = None,
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

  def arrayCat(
      self, image2: _arg_types.Image, axis: _arg_types.Integer
  ) -> Image:
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

  def arrayDotProduct(self, image2: _arg_types.Image) -> Image:
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
      coordinateLabels: _arg_types.List,  # pylint: disable=invalid-name
      separator: Optional[_arg_types.String] = None,
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

  def arrayGet(self, position: _arg_types.Image) -> Image:
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

  def arrayLength(self, axis: _arg_types.Integer) -> Image:
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

  def arrayMask(self, mask: _arg_types.Image) -> Image:
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
      self, lengths: _arg_types.List, pad: Optional[_arg_types.Number] = None
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

  def arrayProject(self, axes: _arg_types.Any) -> Image:
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
      reducer: _arg_types.Any,
      axes: _arg_types.Any,
      # pylint: disable-next=invalid-name
      fieldAxis: Optional[_arg_types.Integer] = None,
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

  def arrayRepeat(
      self, axis: _arg_types.Integer, copies: _arg_types.Any
  ) -> Image:
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
      self, lengths: _arg_types.Any, dimensions: _arg_types.Integer
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
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.arrayReshape', self, lengths, dimensions
    )

  def arraySlice(
      self,
      axis: Optional[_arg_types.Integer] = None,
      start: Optional[_arg_types.Any] = None,
      end: Optional[_arg_types.Any] = None,
      step: Optional[_arg_types.Integer] = None,
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
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.arraySlice', self, axis, start, end, step
    )

  def arraySort(self, keys: Optional[_arg_types.Any] = None) -> Image:
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
      axis1: Optional[_arg_types.Integer] = None,
      axis2: Optional[_arg_types.Integer] = None,
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
    """Computes the arcsine in radians of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.asin', self)

  def atan(self) -> Image:
    """Computes the arctangent in radians of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.atan', self)

  def atan2(self, image2: _arg_types.Any) -> Image:
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
    """

    return apifunction.ApiFunction.call_(self.name() + '.atan2', self, image2)

  def bandNames(self) -> ee_list.List:
    """Returns a list containing the names of the bands of an image."""

    return apifunction.ApiFunction.call_(self.name() + '.bandNames', self)

  def bandTypes(self) -> dictionary.Dictionary:
    """Returns a dictionary of the image's band types."""

    return apifunction.ApiFunction.call_(self.name() + '.bandTypes', self)

  def bitCount(self) -> Image:
    """Returns the number of one-bits.

    Calculates the number of one-bits in the 64-bit two's complement binary
    representation of the input.
    """

    return apifunction.ApiFunction.call_(self.name() + '.bitCount', self)

  def bitsToArrayImage(self) -> Image:
    """Turns the bits of an integer into a 1-D array.

    The array has a length up to the highest 'on' bit in the input.

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.bitsToArrayImage', self
    )

  def bitwiseAnd(self, image2: _arg_types.Image) -> Image:
    """Returns the bitwise AND of the current image and image2.

    Calculates the bitwise AND of the input values for each matched pair of
    bands in image1 and image2. If either image1 or image2 has only 1 band, then
    it is used against all the bands in the other image. If the images have the
    same number of bands, but not the same names, they're used pairwise in the
    natural order. The output bands are named for the longer of the two inputs,
    or if they're equal in length, in image1's order. The type of the output
    pixels is the union of the input types.

    Args:
      image2: The image from which the right operand bands are taken.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.bitwiseAnd', self, image2
    )

  def bitwiseNot(self) -> Image:
    """Calculates the bitwise NOT of the input.

    Uses the smallest signed integer type that can hold the input.

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(self.name() + '.bitwiseNot', self)

  def bitwiseOr(self, image2: _arg_types.Image) -> Image:
    """Returns the bitwise OR of the current image and image2.

    Calculates the bitwise OR of the input values for each matched pair of bands
    in image1 and image2.

    If either image1 or image2 has only 1 band, then it is used against all the
    bands in the other image. If the images have the same number of bands, but
    not the same names, they're used pairwise in the natural order. The output
    bands are named for the longer of the two inputs, or if they're equal in
    length, in image1's order. The type of the output pixels is the union of the
    input types.

    Args:
      image2: The image from which the right operand bands are taken.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.bitwiseOr', self, image2
    )

  def bitwiseXor(self, image2: _arg_types.Image) -> Image:
    """Returns the bitwise XOR of the current image and image2.

    Calculates the bitwise XOR of the input values for each matched pair of
    bands in image1 and image2.

    If either image1 or image2 has only 1 band, then it is used against all the
    bands in the other image. If the images have the same number of bands, but
    not the same names, they're used pairwise in the natural order. The output
    bands are named for the longer of the two inputs, or if they're equal in
    length, in image1's order. The type of the output pixels is the union of the
    input types.

    Args:
      image2: The image from which the right operand bands are taken.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.bitwiseXor', self, image2
    )

  def blend(self, top: _arg_types.Image) -> Image:
    """Overlays one image on top of another.

    The images are blended together using the masks as opacity. If either of
    images has only 1 band, it is replicated to match the number of bands in the
    other image.

    Args:
      top: The top image.

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(self.name() + '.blend', self, top)

  def byte(self) -> Image:
    """Casts the input value to an unsigned 8-bit integer."""

    return apifunction.ApiFunction.call_(self.name() + '.byte', self)

  def cast(
      self,
      # pylint: disable=invalid-name
      bandTypes: _arg_types.Dictionary,
      bandOrder: Optional[_arg_types.Any] = None,
      # pylint: enable=invalid-name
  ) -> Image:
    """Casts some or all bands of an image to the specified types.

    Args:
      bandTypes: A dictionary from band name to band types. Types can be
        PixelTypes or strings. The valid strings are: 'int8', 'int16', 'int32',
        'int64', 'uint8', 'uint16', 'uint32', 'byte', 'short', 'int', 'long',
        'float', and 'double'. If bandTypes includes bands that are not already
        in the input image, they will be added to the image as transparent
        bands. If bandOrder isn't also specified, new bands will be appended in
        alphabetical order.
      bandOrder: A list specifying the order of the bands in the result. If
        specified, must match the full list of bands in the result.

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.cast', self, bandTypes, bandOrder
    )

  # TODO: cat static method

  def cbrt(self) -> Image:
    """Computes the cubic root of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.cbrt', self)

  def ceil(self) -> Image:
    """Computes the smallest integer greater than or equal to the input."""

    return apifunction.ApiFunction.call_(self.name() + '.ceil', self)

  def changeProj(
      self,
      srcProj: _arg_types.Projection,  # pylint: disable=invalid-name
      dstProj: _arg_types.Projection,  # pylint: disable=invalid-name
  ) -> Image:
    """Returns a reprojected image.

    Tweaks the projection of the input image, moving each pixel from its
    location in srcProj to the same coordinates in dstProj.

    Args:
      srcProj: The original projection.
      dstProj: The new projection.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.changeProj', self, srcProj, dstProj
    )

  def clamp(self, low: _arg_types.Number, high: _arg_types.Number) -> Image:
    """Returns an image clamped to the range low to high.

    Clamps the values in all bands of an image to all lie within the specified
    range.

    Args:
      low: The minimum allowed value in the range.
      high: The maximum allowed value in the range.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.clamp', self, low, high
    )

  def classify(
      self,
      classifier: _arg_types.Classifier,
      # pylint: disable-next=invalid-name
      outputName: Optional[_arg_types.String] = None,
  ) -> Image:
    """Classifies an image.

    Args:
      classifier: The classifier to use.
      outputName: The name of the band to be added. If the classifier produces
        more than 1 output, this name is ignored.

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.classify', self, classifier, outputName
    )

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
      clip_geometry = ee_geometry.Geometry(clip_geometry)
    except ee_exception.EEException:
      pass  # Not an ee.Geometry or GeoJSON. Just pass it along.

    return apifunction.ApiFunction.call_(
        self.name() + '.clip', self, clip_geometry
    )

  def clipToBoundsAndScale(
      self,
      geometry: Optional[_arg_types.Geometry] = None,
      width: Optional[_arg_types.Integer] = None,
      height: Optional[_arg_types.Integer] = None,
      # pylint: disable-next=invalid-name
      maxDimension: Optional[_arg_types.Integer] = None,
      scale: Optional[_arg_types.Number] = None,
  ) -> Image:
    """Returns an image clipped to a geometry and scaled.

    Clips an image to the bounds of a Geometry, and scales the clipped image to
    a particular size or scale.

    Caution: providing a large or complex collection as the `geometry` argument
    can result in poor performance. Collating the geometry of collections does
    not scale well; use the smallest collection (or geometry) that is required
    to achieve the desired outcome.

    Args:
      geometry: The Geometry to clip the image to. The image will be clipped to
        the bounding box, in the image's projection, of this geometry.
      width: The width to scale the image to, in pixels. Must be provided along
        with "height". Exclusive with "maxDimension" and "scale".
      height: The height to scale the image to, in pixels. Must be provided
        along with "width". Exclusive with "maxDimension" and "scale".
      maxDimension: The maximum dimension to scale the image to, in pixels.
        Exclusive with "width", "height" and "scale".
      scale: If scale is specified, then the projection is scaled by dividing
        the specified scale value by the nominal size of a meter in the image's
        projection. Exclusive with "width", "height" and "maxDimension".
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.clipToBoundsAndScale',
        self,
        geometry,
        width,
        height,
        maxDimension,
        scale,
    )

  def clipToCollection(self, collection: _arg_types.FeatureCollection) -> Image:
    """Clips an image to a FeatureCollection.

    The output bands correspond exactly the input bands, except data not covered
    by the geometry of at least one feature from the collection is masked. The
    output image retains the metadata of the input image.

    Args:
      collection: The FeatureCollection to clip to.

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.clipToCollection', self, collection
    )

  def cluster(
      self,
      clusterer: _arg_types.Clusterer,
      # pylint: disable-next=invalid-name
      outputName: Optional[_arg_types.String] = None,
  ) -> Image:
    """Applies a clusterer to an image.

    Returns a new image with a single band containing values from 0 to N,
    indicating the cluster each pixel is assigned to.

    Args:
      clusterer: The clusterer to use.
      outputName: The name of the output band.

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.cluster', self, clusterer, outputName
    )

  def connectedComponents(
      self,
      connectedness: _arg_types.Kernel,
      maxSize: _arg_types.Integer,  # pylint: disable=invalid-name
  ) -> Image:
    """Returns an ee.Image with the connectedness.

    Finds connected components with the same value of the first band of the
    input and labels them with a globally unique value.

    Connectedness is specified by the given kernel. Objects larger than maxSize
    are considered background, and are masked.

    Args:
      connectedness: Connectedness kernel.
      maxSize: Maximum size of objects to be labeled.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.connectedComponents', self, connectedness, maxSize
    )

  def connectedPixelCount(
      self,
      # pylint: disable=invalid-name
      maxSize: Optional[_arg_types.Integer] = None,
      eightConnected: Optional[_arg_types.Bool] = None,
      # pylint: enable=invalid-name
  ) -> Image:
    """Returns an ee.Image with the number of connected neighbors.

    Generate an image where each pixel contains the number of 4- or 8-connected
    neighbors (including itself).

    Args:
      maxSize: The maximum size of the neighborhood in pixels.
      eightConnected: Whether to use 8-connected rather 4-connected rules.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.connectedPixelCount', self, maxSize, eightConnected
    )

  # TODO: Change EeAny to Number, an Array, or a list of Arrays.
  @staticmethod
  def constant(value: _arg_types.Any) -> Image:
    """Returns an image containing a constant value everywhere.

    Args:
      value: The value of the pixels in the constant image. Must be a number or
        an Array or a list of numbers or Arrays.
    """

    return apifunction.ApiFunction.call_('Image.constant', value)

  def convolve(self, kernel: _arg_types.Kernel) -> Image:
    """Convolves each band of an image with the given kernel.

    Args:
      kernel: The kernel to convolve with.

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.convolve', self, kernel
    )

  # NOTE: Image.copyProperties overrides Element.copyProperties.
  # NOTE: source is marked as optional in the API, but is required for users.
  # NOTE: The API specifies Element as the return type, but it returns an Image.
  def copyProperties(
      self,
      source: _arg_types.Element,
      properties: Optional[_arg_types.List] = None,
      exclude: Optional[_arg_types.List] = None,
  ) -> Image:
    """Copies metadata properties from one element to another.

    Args:
      source: The object from which to copy the properties.
      properties: The properties to copy. If omitted, all ordinary (i.e.
        non-system) properties are copied.
      exclude: The list of properties to exclude when copying all properties.
        Must not be specified if properties is.

    Returns:
      An element with the specified properties copied from the source element.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.copyProperties', self, source, properties, exclude
    )

  def cos(self) -> Image:
    """Computes the cosine of the input in radians."""

    return apifunction.ApiFunction.call_(self.name() + '.cos', self)

  def cosh(self) -> Image:
    """Computes the hyperbolic cosine of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.cosh', self)

  def cumulativeCost(
      self,
      source: _arg_types.Any,
      # pylint: disable=invalid-name
      maxDistance: _arg_types.Number,
      geodeticDistance: Optional[_arg_types.Bool] = None,
      # pylint: enable=invalid-name
  ) -> Image:
    """Returns an ee.Image with the cumulative cost map.

    Computes a cumulative cost map based on an image containing costs to
    traverse each pixel and an image containing source locations.

    Each output band represents the cumulative cost over the corresponding input
    cost band.

    Args:
      source: A single-band image representing the sources. A pixel value
        different from 0 defines a source pixel.
      maxDistance: Maximum distance for computation, in meters.
      geodeticDistance: If true, geodetic distance along the curved surface is
        used, assuming a spherical Earth of radius 6378137.0. If false,
        Euclidean distance in the 2D plane of the map projection is used
        (faster, but less accurate).
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.cumulativeCost',
        self,
        source,
        maxDistance,
        geodeticDistance,
    )

  def date(self) -> ee_date.Date:
    """Returns the acquisition time of an image as a Date object.

    This helper function is equivalent to
    `ee.Date(image.get('system:time_start'))`.
    """

    return apifunction.ApiFunction.call_(self.name() + '.date', self)

  def derivative(self) -> Image:
    """Returns an ee.Image with the X and Y discrete derivatives.

    Computes the X and Y discrete derivatives for each band in the input image,
    in pixel coordinates.

    For each band of the input image, the output image will have two bands named
    with the suffixes `_x` and `_y`, containing the respective derivatives.
    """

    return apifunction.ApiFunction.call_(self.name() + '.derivative', self)

  def digamma(self) -> Image:
    """Computes the digamma function of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.digamma', self)

  def directionalDistanceTransform(
      self,
      angle: _arg_types.Number,
      # pylint: disable=invalid-name
      maxDistance: _arg_types.Integer,
      labelBand: Optional[_arg_types.String] = None,
      # pylint: enable=invalid-name
  ) -> Image:
    """Returns an ee.Image with the directional distance transform.

    For each zero-valued pixel in the source, get the distance to the nearest
    non-zero pixels in the given direction.

    Returns a band of floating point distances called "distance".

    Args:
      angle: The angle, in degrees, at which to search for non-zero pixels.
      maxDistance: The maximum distance, in pixels, over which to search.
      labelBand: If provided, multi-band inputs are permitted and only this band
        is used for searching. All other bands are returned and populated with
        the per-band values found at the searched non-zero pixels in the label
        band.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.directionalDistanceTransform',
        self,
        angle,
        maxDistance,
        labelBand,
    )

  def displace(
      self,
      displacement: _arg_types.Any,
      mode: Optional[_arg_types.String] = None,
      # pylint: disable-next=invalid-name
      maxOffset: Optional[_arg_types.Number] = None,
  ) -> Image:
    """Warps an image using an image of displacements.

    Args:
      displacement: An image containing displacement values. The first band is
        interpreted as the 'X' displacement and the second as the 'Y'
        displacement. Each displacement pixel is a [dx,dy] vector added to the
        pixel location to determine the corresponding pixel location in 'image'.
        Displacements are interpreted as meters in the default projection of the
        displacement image.
      mode: The interpolation mode to use. One of 'nearest_neighbor', 'bilinear'
        or 'bicubic'.
      maxOffset: The maximum absolute offset in the displacement image.
        Providing this may improve processing performance.

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.displace', self, displacement, mode, maxOffset
    )

  def displacement(
      self,
      # pylint: disable=invalid-name
      referenceImage: _arg_types.Image,
      maxOffset: _arg_types.Number,
      projection: Optional[_arg_types.Projection] = None,
      patchWidth: Optional[_arg_types.Number] = None,
      # pylint: enable=invalid-name
      stiffness: Optional[_arg_types.Number] = None,
  ) -> Image:
    """Returns an ee.Image with the displacement map.

    Determines displacements required to register an image to a reference image
    while allowing local, rubber sheet deformations.

    Displacements are computed in the CRS of the reference image, at a scale
    dictated by the lowest resolution of the following three projections: input
    image projection, reference image projection, and requested projection. The
    displacements are then transformed into the user-specified projection for
    output.

    Args:
      referenceImage: The image to register to.
      maxOffset: The maximum offset allowed when attempting to align the input
        images, in meters. Using a smaller value can reduce computation time
        significantly, but it must still be large enough to cover the greatest
        displacement within the entire image region.
      projection: The projection in which to output displacement values. The
        default is the projection of the first band of the reference image.
      patchWidth: Patch size for detecting image offsets, in meters. This should
        be set large enough to capture texture, as well as large enough that
        ignorable objects are small within the patch. Default is null. Patch
        size will be determined automatically if not provided.
      stiffness: Enforces a stiffness constraint on the solution. Valid values
        are in the range [0,10]. The stiffness is used for outlier rejection
        when determining displacements at adjacent grid points. Higher values
        move the solution towards a rigid transformation. Lower values allow
        more distortion or warping of the image during registration.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.displacement',
        self,
        referenceImage,
        maxOffset,
        projection,
        patchWidth,
        stiffness,
    )

  def distance(
      self,
      kernel: Optional[_arg_types.Kernel] = None,
      # pylint: disable-next=invalid-name
      skipMasked: Optional[_arg_types.Bool] = True,
  ) -> Image:
    """Returns an ee.Image with the distance map.

    Computes the distance to the nearest non-zero pixel in each band, using the
    specified distance kernel.

    Args:
      kernel: The distance kernel. One of Chebyshev, Euclidean, or Manhattan.
      skipMasked: Mask output pixels if the corresponding input pixel is masked.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.distance', self, kernel, skipMasked
    )

  def divide(self, image2: _arg_types.Image) -> Image:
    """Returns an ee.Image with the current image divided by image2.

    Divides the first value by the second, returning 0 for division by 0 for
    each matched pair of bands in image1 and image2.

    If either image1 or image2 has only 1 band, then it is used against all the
    bands in the other image. If the images have the same number of bands, but
    not the same names, they're used pairwise in the natural order. The output
    bands are named for the longer of the two inputs, or if they're equal in
    length, in image1's order. The type of the output pixels is the union of the
    input types.

    Args:
      image2: The image from which the right operand bands are taken.
    """

    return apifunction.ApiFunction.call_(self.name() + '.divide', self, image2)

  def double(self) -> Image:
    """Casts the input value to a 64-bit float."""

    return apifunction.ApiFunction.call_(self.name() + '.double', self)

  def entropy(self, kernel: _arg_types.Kernel) -> Image:
    """Returns an ee.Image with the entropy.

    Computes the windowed entropy for each band using the specified kernel
    centered on each input pixel.

    Entropy is computed as -sum(p * log2(p)), where p is the normalized
    probability of occurrence of the values encountered in each window.

    Args:
      kernel: A kernel specifying the window in which to compute.
    """

    return apifunction.ApiFunction.call_(self.name() + '.entropy', self, kernel)

  def eq(self, image2: _arg_types.Image) -> Image:
    """Returns an ee.Image with the current image equal to image2.

    Returns 1 if and only if the first value is equal to the second for each
    matched pair of bands in image1 and image2.

    If either image1 or image2 has only 1 band, then it is used against all the
    bands in the other image. If the images have the same number of bands, but
    not the same names, they're used pairwise in the natural order. The output
    bands are named for the longer of the two inputs, or if they're equal in
    length, in image1's order. The type of the output pixels is boolean.

    Args:
      image2: The image from which the right operand bands are taken.
    """

    return apifunction.ApiFunction.call_(self.name() + '.eq', self, image2)

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

  def fastDistanceTransform(
      self,
      neighborhood: Optional[_arg_types.Integer] = None,
      units: Optional[_arg_types.String] = None,
      metric: Optional[_arg_types.String] = None,
  ) -> Image:
    """Returns the distance to the nearest non-zero valued pixel.

    Returns the distance, as determined by the specified distance metric, to the
    nearest non-zero valued pixel in the input. The output contains values for
    all pixels within the given neighborhood size, regardless of the input's
    mask. Note: the default distance metric returns squared distance.

    Args:
      neighborhood: Neighborhood size in pixels.
      units: The units of the neighborhood, currently only 'pixels' are
        supported.
      metric: Distance metric to use: options are `squared_euclidean`,
        `manhattan` or `chebyshev`.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.fastDistanceTransform',
        self,
        neighborhood,
        units,
        metric,
    )

  def first(self, image2: _arg_types.Image) -> Image:
    """Returns the first value for each matched pair of bands with image2.

    Selects the value of the first value for each matched pair of bands in
    image1 and image2.

    If either image1 or image2 has only 1 band, then it is used against all the
    bands in the other image. If the images have the same number of bands, but
    not the same names, they're used pairwise in the natural order. The output
    bands are named for the longer of the two inputs, or if they're equal in
    length, in image1's order. The type of the output pixels is the union of the
    input types.

    Args:
      image2: The image from which the right operand bands are taken.
    """

    return apifunction.ApiFunction.call_(self.name() + '.first', self, image2)

  def firstNonZero(self, image2: _arg_types.Image) -> Image:
    """Returns the first non-zero value for each matched pair with image2.

    Selects the first value if it is non-zero, and the second value otherwise
    for each matched pair of bands in image1 and image2.

    If either image1 or image2 has only 1 band, then it is used against all the
    bands in the other image. If the images have the same number of bands, but
    not the same names, they're used pairwise in the natural order. The output
    bands are named for the longer of the two inputs, or if they're equal in
    length, in image1's order. The type of the output pixels is the union of the
    input types.

    Args:
      image2: The image from which the right operand bands are taken.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.firstNonZero', self, image2
    )

  def float(self) -> Image:
    """Casts the input value to a 32-bit float."""

    return apifunction.ApiFunction.call_(self.name() + '.float', self)

  def floor(self) -> Image:
    """Computes the largest integer less than or equal to the input."""

    return apifunction.ApiFunction.call_(self.name() + '.floor', self)

  def focalMax(
      self,
      radius: Optional[_arg_types.Number] = None,
      # pylint: disable-next=invalid-name
      kernelType: Optional[_arg_types.String] = None,
      units: Optional[_arg_types.String] = None,
      iterations: Optional[_arg_types.Integer] = None,
      kernel: Optional[_arg_types.Kernel] = None,
  ) -> Image:
    """Returns the maximum value of the input within the kernel.

    Applies a morphological reducer() filter to each band of an image using a
    named or custom kernel.

    Args:
      radius: The radius of the kernel to use.
      kernelType: The type of kernel to use. Options include: 'circle',
        'square', 'cross', 'plus', 'octagon', and 'diamond'.
      units: If a kernel is not specified, this determines whether the kernel is
        in meters or pixels.
      iterations: The number of times to apply the given kernel.
      kernel: A custom kernel. If used, kernelType and radius are ignored.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.focalMax',
        self,
        radius,
        kernelType,
        units,
        iterations,
        kernel,
    )

  def focalMean(
      self,
      radius: Optional[_arg_types.Number] = None,
      # pylint: disable-next=invalid-name
      kernelType: Optional[_arg_types.String] = None,
      units: Optional[_arg_types.String] = None,
      iterations: Optional[_arg_types.Integer] = None,
      kernel: Optional[_arg_types.Kernel] = None,
  ) -> Image:
    """Returns the mean value of the input within the kernel.

    Applies a morphological mean filter to each band of an image using a named
    or custom kernel.

    Args:
      radius: The radius of the kernel to use.
      kernelType: The type of kernel to use. Options include: 'circle',
        'square', 'cross', 'plus', 'octagon', and 'diamond'.
      units: If a kernel is not specified, this determines whether the kernel is
        in meters or pixels.
      iterations: The number of times to apply the given kernel.
      kernel: A custom kernel. If used, kernelType and radius are ignored.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.focalMean',
        self,
        radius,
        kernelType,
        units,
        iterations,
        kernel,
    )

  def focalMedian(
      self,
      radius: Optional[_arg_types.Number] = None,
      # pylint: disable-next=invalid-name
      kernelType: Optional[_arg_types.String] = None,
      units: Optional[_arg_types.String] = None,
      iterations: Optional[_arg_types.Integer] = None,
      kernel: Optional[_arg_types.Kernel] = None,
  ) -> Image:
    """Returns the median value of the input within the kernel.

    Applies a morphological reducer() filter to each band of an image using a
    named or custom kernel.

    Args:
      radius: The radius of the kernel to use.
      kernelType: The type of kernel to use. Options include: 'circle',
        'square', 'cross', 'plus', 'octagon', and 'diamond'.
      units: If a kernel is not specified, this determines whether the kernel is
        in meters or pixels.
      iterations: The number of times to apply the given kernel.
      kernel: A custom kernel. If used, kernelType and radius are ignored.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.focalMedian',
        self,
        radius,
        kernelType,
        units,
        iterations,
        kernel,
    )

  def focalMin(
      self,
      radius: Optional[_arg_types.Number] = None,
      # pylint: disable-next=invalid-name
      kernelType: Optional[_arg_types.String] = None,
      units: Optional[_arg_types.String] = None,
      iterations: Optional[_arg_types.Integer] = None,
      kernel: Optional[_arg_types.Kernel] = None,
  ) -> Image:
    """Returns the minimum value of the input within the kernel.

    Applies a morphological reducer() filter to each band of an image using a
    named or custom kernel.

    Args:
      radius: The radius of the kernel to use.
      kernelType: The type of kernel to use. Options include: 'circle',
        'square', 'cross', 'plus', 'octagon', and 'diamond'.
      units: If a kernel is not specified, this determines whether the kernel is
        in meters or pixels.
      iterations: The number of times to apply the given kernel.
      kernel: A custom kernel. If used, kernelType and radius are ignored.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.focalMin',
        self,
        radius,
        kernelType,
        units,
        iterations,
        kernel,
    )

  def focalMode(
      self,
      radius: Optional[_arg_types.Number] = None,
      # pylint: disable-next=invalid-name
      kernelType: Optional[_arg_types.String] = None,
      units: Optional[_arg_types.String] = None,
      iterations: Optional[_arg_types.Integer] = None,
      kernel: Optional[_arg_types.Kernel] = None,
  ) -> Image:
    """Returns the mode value of the input within the kernel.

    Applies a morphological reducer() filter to each band of an image using a
    named or custom kernel.

    Args:
      radius: The radius of the kernel to use.
      kernelType: The type of kernel to use. Options include: 'circle',
        'square', 'cross', 'plus', 'octagon', and 'diamond'.
      units: If a kernel is not specified, this determines whether the kernel is
        in meters or pixels.
      iterations: The number of times to apply the given kernel.
      kernel: A custom kernel. If used, kernelType and radius are ignored.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.focalMode',
        self,
        radius,
        kernelType,
        units,
        iterations,
        kernel,
    )

  def gamma(self) -> Image:
    """Computes the gamma function of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.gamma', self)

  def gammainc(self, image2: _arg_types.Image) -> Image:
    """Returns the regularized lower incomplete Gamma function.

    Calculates the regularized lower incomplete Gamma function gamma(x,a) for
    each matched pair of bands in image1 and image2.

    If either image1 or image2 has only 1 band, then it is used against all the
    bands in the other image. If the images have the same number of bands, but
    not the same names, they're used pairwise in the natural order. The output
    bands are named for the longer of the two inputs, or if they're equal in
    length, in image1's order. The type of the output pixels is float.

    Args:
      image2: The image from which the right operand bands are taken.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.gammainc', self, image2
    )

  def geometry(
      self,
      # pylint: disable-next=invalid-name
      maxError: Optional[_arg_types.ErrorMargin] = None,
      proj: Optional[_arg_types.Projection] = None,
      geodesics: Optional[_arg_types.Bool] = None,
  ) -> ee_geometry.Geometry:
    """Returns the geometry of a given feature in a given projection.

    Args:
      maxError: The maximum amount of error tolerated when performing any
        necessary reprojection.
      proj: If specified, the geometry will be in this projection. If
        unspecified, the geometry will be in its default projection.
      geodesics: If true, the geometry will have geodesic edges. If false, it
        will have edges as straight lines in the specified projection. If null,
        the edge interpretation will be the same as the original geometry. This
        argument is ignored if proj is not specified.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.geometry', self, maxError, proj, geodesics
    )

  def glcmTexture(
      self,
      size: Optional[_arg_types.Integer] = None,
      kernel: Optional[_arg_types.Kernel] = None,
      average: Optional[_arg_types.Bool] = None,
  ) -> Image:
    """Returns the GLCM texture metrics.

    Computes texture metrics from the Gray Level Co-occurrence Matrix around
    each pixel of every band. The GLCM is a tabulation of how often different
    combinations of pixel brightness values (grey levels) occur in an image. It
    counts the number of times a pixel of value X lies next to a pixel of value
    Y, in a particular direction and distance. and then derives statistics from
    this tabulation.

    This implementation computes the 14 GLCM metrics proposed by Haralick, and 4
    additional metrics from Conners. Inputs are required to be integer valued.

    The output consists of 18 bands per input band if directional averaging is
    on and 18 bands per directional pair in the kernel, if not:

    - ASM: f1, Angular Second Moment; measures the number of repeated pairs
    - CONTRAST: f2, Contrast; measures the local contrast of an image
    - CORR: f3, Correlation; measures the correlation between pairs of pixels
    - VAR: f4, Variance; measures how spread out the distribution of gray-levels
    is
    - IDM: f5, Inverse Difference Moment; measures the homogeneity
    - SAVG: f6, Sum Average
    - SVAR: f7, Sum Variance
    - SENT: f8, Sum Entropy
    - ENT: f9, Entropy. Measures the randomness of a gray-level distribution
    - DVAR: f10, Difference variance
    - DENT: f11, Difference entropy
    - IMCORR1: f12, Information Measure of Corr. 1
    - IMCORR2: f13, Information Measure of Corr. 2
    - MAXCORR: f14, Max Corr. Coefficient. (not computed)
    - DISS: Dissimilarity
    - INERTIA: Inertia
    - SHADE: Cluster Shade
    - PROM: Cluster prominence

    More information can be found in the two papers: Haralick et al., 'Textural
    Features for Image Classification',
    https://doi.org/10.1109/TSMC.1973.4309314
    and Conners, et al., Segmentation of a high-resolution urban scene using
    texture operators', https://doi.org/10.1016/0734-189X(84)90197-X.

    Args:
      size: The size of the neighborhood to include in each GLCM.
      kernel: A kernel specifying the x and y offsets over which to compute the
        GLCMs. A GLCM is computed for each pixel in the kernel that is non-zero,
        except the center pixel and as long as a GLCM hasn't already been
        computed for the same direction and distance. For example, if either or
        both of the east and west pixels are set, only 1 (horizontal) GLCM is
        computed. Kernels are scanned from left to right and top to bottom. The
        default is a 3x3 square, resulting in 4 GLCMs with the offsets (-1, -1),
        (0, -1), (1, -1) and (-1, 0).
      average: If true, the directional bands for each metric are averaged.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.glcmTexture', self, size, kernel, average
    )

  def gradient(self) -> Image:
    """Calculates the x and y gradient."""

    return apifunction.ApiFunction.call_(self.name() + '.gradient', self)

  def gt(self, image2: _arg_types.Image) -> Image:
    """Returns 1 if the image is greater than image2.

    Returns 1 if and only if the first value is greater than the second for each
    matched pair of bands in image1 and image2.

    If either image1 or image2 has only 1 band, then it is used against all the
    bands in the other image. If the images have the same number of bands, but
    not the same names, they're used pairwise in the natural order. The output
    bands are named for the longer of the two inputs, or if they're equal in
    length, in image1's order. The type of the output pixels is boolean.

    Args:
      image2: The image from which the right operand bands are taken.
    """

    return apifunction.ApiFunction.call_(self.name() + '.gt', self, image2)

  def gte(self, image2: _arg_types.Image) -> Image:
    """Returns 1 if the image is greater than or equal to image2.

    Returns 1 if and only if the first value is greater than or equal to the
    second for each matched pair of bands in image1 and image2.

    If either image1 or image2 has only 1 band, then it is used against all the
    bands in the other image. If the images have the same number of bands, but
    not the same names, they're used pairwise in the natural order. The output
    bands are named for the longer of the two inputs, or if they're equal in
    length, in image1's order. The type of the output pixels is boolean.

    Args:
      image2: The image from which the right operand bands are taken.
    """

    return apifunction.ApiFunction.call_(self.name() + '.gte', self, image2)

  def hersDescriptor(
      self,
      selectors: Optional[_arg_types.List] = None,
      buckets: Optional[_arg_types.Integer] = None,
      # pylint: disable-next=invalid-name
      peakWidthScale: Optional[_arg_types.Number] = None,
  ) -> dictionary.Dictionary:
    """Returns a dictionary of Histogram Error Ring Statistic (HERS) arrays.

    Creates a dictionary of Histogram Error Ring Statistic (HERS) descriptor
    arrays from square array properties of an element.

    The HERS radius is taken to be the array's (side_length - 1) / 2.

    Args:
      selectors: The array properties for which descriptors will be created.
        Selected array properties must be square, floating point arrays.
        Defaults to all array properties.
      buckets: The number of HERS buckets. Defaults to 100.
      peakWidthScale: The HERS peak width scale. Defaults to 1.0.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.hersDescriptor',
        self,
        selectors,
        buckets,
        peakWidthScale,
    )

  def hersFeature(
      self,
      reference: _arg_types.Dictionary,
      # pylint: disable-next=invalid-name
      peakWidthScale: Optional[_arg_types.Number] = None,
  ) -> Image:
    """Returns an ee.Image with Histogram Error Ring Statistic (HERS).

    Computes the Histogram Error Ring Statistic (HERS) for each pixel in each
    band matching the keys in the descriptor. Only the bands for which HERS
    could be computed are returned.

    Args:
      reference: The reference descriptor computed with
        ee.Feature.hersDescriptor(...).
      peakWidthScale: The HERS peak width scale.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.hersFeature', self, reference, peakWidthScale
    )

  def hersImage(
      self,
      image2: _arg_types.Image,
      radius: _arg_types.Integer,
      buckets: Optional[_arg_types.Integer] = None,
      # pylint: disable-next=invalid-name
      peakWidthScale: Optional[_arg_types.Number] = None,
  ) -> Image:
    """Returns an Image with Histogram Error Ring Statistic (HERS) for pairs.

    Computes the Histogram Error Ring Statistic (HERS) for each pair of pixels
    in each band present in both images.

    Only the bands for which HERS could be computed are returned.

    Args:
      image2: The image to compare.
      radius: The radius of the window.
      buckets: The number of HERS buckets.
      peakWidthScale: The HERS peak width scale.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.hersImage',
        self,
        image2,
        radius,
        buckets,
        peakWidthScale,
    )

  def hsvToRgb(self) -> Image:
    """Transforms the image from the HSV color space to the RGB color space.

    Expects a 3 band image in the range [0, 1], and produces three bands: red,
    green and blue with values in the range [0, 1].

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(self.name() + '.hsvToRgb', self)

  def hypot(self, image2: _arg_types.Image) -> Image:
    """Returns the length of the hypotenuse.

    Calculates the magnitude of the 2D vector [x, y] for each matched pair of
    bands in image1 and image2. If either image1 or image2 has only 1 band, then
    it is used against all the bands in the other image. If the images have the
    same number of bands, but not the same names, they're used pairwise in the
    natural order. The output bands are named for the longer of the two inputs,
    or if they're equal in length, in image1's order. The type of the output
    pixels is float.

    Args:
      image2: The image from which the right operand bands are taken.
    """

    return apifunction.ApiFunction.call_(self.name() + '.hypot', self, image2)

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

  def interpolate(
      self,
      x: _arg_types.List,
      y: _arg_types.List,
      behavior: Optional[_arg_types.String] = None,
  ) -> Image:
    """Returns an ee.Image with interpolated values.

    Interpolates each point in the first band of the input image into the
    piecewise-linear function specified by the x and y arrays.

    The x values must be strictly increasing. If an input point is less than the
    first or greater than the last x value, then the output is specified by the
    "behavior" argument: "extrapolate" specifies the output value is
    extrapolated from the two nearest points, "clamp" specifies the output value
    is taken from the nearest point, "input" specifies the output value is
    copied from the input, and "mask" specifies the output value is masked.

    Args:
      x: The x axis (input) values in the piecewise function.
      y: The y axis (output) values in the piecewise function.
      behavior: The behavior for points that are outside of the range of the
        supplied function. Options are: 'extrapolate', 'clamp', 'mask', or
        'input'.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.interpolate', self, x, y, behavior
    )

  def lanczos(self) -> Image:
    """Computes the Lanczos approximation of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.lanczos', self)

  def leftShift(self, image2: _arg_types.Image) -> Image:
    """Returns an ee.Image left shifted the values in image2.

    Calculates the left shift of v1 by v2 bits for each matched pair of bands in
    image1 and image2. If either image1 or image2 has only 1 band, then it is
    used against all the bands in the other image. If the images have the same
    number of bands, but not the same names, they're used pairwise in the
    natural order. The output bands are named for the longer of the two inputs,
    or if they're equal in length, in image1's order. The type of the output
    pixels is the union of the input types.

    Args:
      image2: The image from which the right operand bands are taken.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.leftShift', self, image2
    )

  def linkCollection(
      self,
      # pylint: disable=invalid-name
      imageCollection: _arg_types.ImageCollection,
      linkedBands: Optional[_arg_types.Any] = None,
      linkedProperties: Optional[_arg_types.Any] = None,
      matchPropertyName: Optional[_arg_types.String] = None,
      # pylint: enable=invalid-name
  ) -> Image:
    """Links the source image to a matching image from an image collection.

    Any specified bands or metadata will be added to the source image from the
    image found in the collection, and if the bands or metadata are already
    present they will be overwritten. If a matching image is not found, any new
    or updated bands will be fully masked and any new or updated metadata will
    be null. The output footprint will be the same as the source image
    footprint.

    A match is determined if the source image and an image in the collection
    have a specific equivalent metadata property. If more than one collection
    image would match, the collection image selected is arbitrary. By default,
    images are matched on their 'system:index' metadata property.

    This linking function is a convenience method for adding bands to a target
    image based on a specified shared metadata property and is intended to
    support linking collections that apply different processing/product
    generation to the same source imagery. For more expressive linking known as
    'joining', see
    https://developers.google.com/earth-engine/guides/joins_intro.

    Args:
      imageCollection: The image collection searched to extract an image
        matching the source.
      linkedBands: A band name or list of band names to add or update from the
        matching image.
      linkedProperties: A metadata property or list of properties to add or
        update from the matching image.
      matchPropertyName: The metadata property name to use as a match criteria.

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.linkCollection',
        self,
        imageCollection,
        linkedBands,
        linkedProperties,
        matchPropertyName,
    )

  @staticmethod
  def load(
      id: _arg_types.String,  # pylint: disable=redefined-builtin
      version: Optional[_arg_types.Integer] = None,
  ) -> Image:
    """Returns the image given its ID.

    Args:
      id: The asset ID of the image.
      version: The version of the asset. -1 signifies the latest version.
    """

    return apifunction.ApiFunction.call_('Image.load', id, version)

  @staticmethod
  def loadGeoTIFF(uri: _arg_types.String) -> Image:
    """Returns an image from a GeoTIFF in Cloud Storage.

    Args:
      uri: The Cloud Storage URI of the GeoTIFF to load. The bucket metadata
        must be accessible (requires the `storage.buckets.get` permission which
        is provided by the role "Storage Legacy Bucket Reader" among others, see
        https://cloud.google.com/storage/docs/access-control/iam-roles) and the
          bucket metadata must be located in the US multi-region, a dual-region
          including US-CENTRAL1, or the US-CENTRAL1 region.
    """

    return apifunction.ApiFunction.call_('Image.loadGeoTIFF', uri)

  def log(self) -> Image:
    """Computes the natural logarithm of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.log', self)

  def log10(self) -> Image:
    """Computes the base-10 logarithm of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.log10', self)

  def long(self) -> Image:
    """Casts the input value to a signed 64-bit integer."""

    return apifunction.ApiFunction.call_(self.name() + '.long', self)

  def lt(self, image2: _arg_types.Image) -> Image:
    """Returns 1 if the image is less than image2.

    Returns 1 if and only if the first value is less than the second for each
    matched pair of bands in image1 and image2. If either image1 or image2 has
    only 1 band, then it is used against all the bands in the other image. If
    the images have the same number of bands, but not the same names, they're
    used pairwise in the natural order. The output bands are named for the
    longer of the two inputs, or if they're equal in length, in image1's order.
    The type of the output pixels is boolean.

    Args:
      image2: The image from which the right operand bands are taken.

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(self.name() + '.lt', self, image2)

  def lte(self, image2: _arg_types.Image) -> Image:
    """Returns 1 if the image is less than or equal to image2.

    Returns 1 if and only if the first value is less than or equal to the second
    for each matched pair of bands in image1 and image2. If either image1 or
    image2 has only 1 band, then it is used against all the bands in the other
    image. If the images have the same number of bands, but not the same names,
    they're used pairwise in the natural order. The output bands are named for
    the longer of the two inputs, or if they're equal in length, in image1's
    order. The type of the output pixels is boolean.

    Args:
      image2: The image from which the right operand bands are taken.

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(self.name() + '.lte', self, image2)

  def mask(self, mask: Optional[_arg_types.Image] = None) -> Image:
    """Gets or sets an image's mask.

    The output image retains the metadata and footprint of the input image.
    Pixels where the mask changes from zero to another value will be filled with
    zeros, or the values closest to zero within the range of the pixel type.

    Note: the version that sets a mask will be deprecated. To set a mask from an
    image on previously unmasked pixels, use Image.updateMask. To unmask
    previously masked pixels, use Image.unmask.

    Args:
      mask: The mask image. If specified, the input image is copied to the
        output but given the mask by the values of this image. If this is a
        single band, it is used for all bands in the input image. If not
        specified, returns an image created from the mask of the input image,
        scaled to the range [0:1] (invalid = 0, valid = 1.0).

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(self.name() + '.mask', self, mask)

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

  @staticmethod
  def matrixIdentity(size: _arg_types.Integer) -> Image:
    """Returns an image where each pixel is a 2D identity matrix of size.

    Args:
      size: The length of each axis.
    """

    return apifunction.ApiFunction.call_('Image.matrixIdentity', size)

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

  def matrixMultiply(self, image2: _arg_types.Image) -> Image:
    """Returns the matrix multiplication with image2.

    Returns the matrix multiplication A * B for each matched pair of bands in
    image1 and image2. If either image1 or image2 has only 1 band, then it is
    used against all the bands in the other image. If the images have the same
    number of bands, but not the same names, they're used pairwise in the
    natural order. The output bands are named for the longer of the two inputs,
    or if they're equal in length, in image1's order. The type of the output
    pixels is the union of the input types.

    Args:
      image2: The image from which the right operand bands are taken.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.matrixMultiply', self, image2
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

  def matrixSolve(self, image2: _arg_types.Image) -> Image:
    """Returns the solution for x in the matrix equation A * x = B.

    Solves for x in the matrix equation A * x = B, finding a least-squares
    solution if A is overdetermined for each matched pair of bands in image1 and
    image2. If either image1 or image2 has only 1 band, then it is used against
    all the bands in the other image. If the images have the same number of
    bands, but not the same names, they're used pairwise in the natural order.
    The output bands are named for the longer of the two inputs, or if they're
    equal in length, in image1's order. The type of the output pixels is the
    union of the input types.

    Args:
      image2: The image from which the right operand bands are taken.

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.matrixSolve', self, image2
    )

  def matrixToDiag(self) -> Image:
    """Computes a square diagonal matrix from a single column matrix."""

    return apifunction.ApiFunction.call_(self.name() + '.matrixToDiag', self)

  def matrixTrace(self) -> Image:
    """Computes the trace of the matrix."""

    return apifunction.ApiFunction.call_(self.name() + '.matrixTrace', self)

  def matrixTranspose(
      self,
      axis1: Optional[_arg_types.Integer] = None,
      axis2: Optional[_arg_types.Integer] = None,
  ) -> Image:
    """Transposes two dimensions of each array pixel.

    Args:
      axis1: First axis to swap.
      axis2: Second axis to swap.

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.matrixTranspose', self, axis1, axis2
    )

  def max(self, image2: _arg_types.Image) -> Image:
    """Returns the maximum of the image or image2.

    Selects the maximum of the first and second values for each matched pair of
    bands in image1 and image2. If either image1 or image2 has only 1 band, then
    it is used against all the bands in the other image. If the images have the
    same number of bands, but not the same names, they're used pairwise in the
    natural order. The output bands are named for the longer of the two inputs,
    or if they're equal in length, in image1's order. The type of the output
    pixels is the union of the input types.

    Args:
      image2: The image from which the right operand bands are taken.

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(self.name() + '.max', self, image2)

  def medialAxis(
      self,
      neighborhood: Optional[_arg_types.Integer] = None,
      units: Optional[_arg_types.String] = None,
  ) -> Image:
    """Returns the discrete medial axis of the input image.

    Computes the discrete medial axis of the zero valued pixels of the first
    band of the input. Outputs 4 bands:

    * medial - the medial axis points, scaled by the distance.
    * coverage - the number of points supporting each medial axis point.
    * xlabel - the horizontal distance to the power point for each pixel.
    * ylabel - the vertical distance to the power point for each pixel.

    Args:
      neighborhood: Neighborhood size in pixels.
      units: The units of the neighborhood, currently only 'pixels' are
        supported.

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.medialAxis', self, neighborhood, units
    )

  def metadata(
      self,
      property: _arg_types.String,  # pylint: disable=redefined-builtin
      name: Optional[_arg_types.String] = None,
  ) -> Image:
    """Generates a constant image of type double from a metadata property.

    Args:
      property: The property from which to take the value.
      name: The name for the output band. If unspecified, it will be the same as
        the property name.

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.metadata', self, property, name
    )

  def min(self, image2: _arg_types.Any) -> Image:
    """Returns the minimum of the image or image2.

    Selects the minimum of the first and second values for each matched pair of
    bands in image1 and image2. If either image1 or image2 has only 1 band, then
    it is used against all the bands in the other image. If the images have the
    same number of bands, but not the same names, they're used pairwise in the
    natural order. The output bands are named for the longer of the two inputs,
    or if they're equal in length, in image1's order. The type of the output
    pixels is the union of the input types.

    Args:
      image2: The image from which the right operand bands are taken.
    """

    return apifunction.ApiFunction.call_(self.name() + '.min', self, image2)

  def mod(self, image2: _arg_types.Any) -> Image:
    """Returns the remainder of the image divided by the second (modulus).

    Calculates the remainder of the first value divided by the second for each
    matched pair of bands in image1 and image2. If either image1 or image2 has
    only 1 band, then it is used against all the bands in the other image. If
    the images have the same number of bands, but not the same names, they're
    used pairwise in the natural order. The output bands are named for the
    longer of the two inputs, or if they're equal in length, in image1's order.
    The type of the output pixels is the union of the input types.

    Args:
      image2: The image from which the right operand bands are taken.
    """

    return apifunction.ApiFunction.call_(self.name() + '.mod', self, image2)

  def multiply(self, image2: _arg_types.Image) -> Image:
    """Returns the image multiplied by image2.

    Multiplies the first value by the second for each matched pair of bands in
    image1 and image2. If either image1 or image2 has only 1 band, then it is
    used against all the bands in the other image. If the images have the same
    number of bands, but not the same names, they're used pairwise in the
    natural order. The output bands are named for the longer of the two inputs,
    or if they're equal in length, in image1's order. The type of the output
    pixels is the union of the input types.

    Args:
      image2: The image from which the right operand bands are taken.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.multiply', self, image2
    )

  def neighborhoodToArray(
      self,
      kernel: _arg_types.Kernel,
      # pylint: disable-next=invalid-name
      defaultValue: Optional[_arg_types.Number] = None,
  ) -> Image:
    """Turns the neighborhood of each pixel in a scalar image into a 2D array.

    Axes 0 and 1 of the output array correspond to Y and X axes of the image,
    respectively. The output image will have as many bands as the input; each
    output band has the same mask as the corresponding input band. The footprint
    and metadata of the input image are preserved.

    Args:
      kernel: The kernel specifying the shape of the neighborhood. Only fixed,
        square and rectangle kernels are supported. Weights are ignored; only
        the shape of the kernel is used.
      defaultValue: The value to use in the output arrays to replace the invalid
        (masked) pixels of the input. If the band type is integral, the
        fractional part of this value is discarded; in all cases, the value is
        clamped to the value range of the band.

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.neighborhoodToArray', self, kernel, defaultValue
    )

  def neighborhoodToBands(self, kernel: _arg_types.Kernel) -> Image:
    """Turns the neighborhood of a pixel into a set of bands.

    The neighborhood is specified using a Kernel and only non-zero-weight
    kernel values are used. The weights of the kernel is otherwise ignored.

    Each input band produces x * y output bands. Each output band is named
    'input_x_y' where x and y indicate the pixel's location in the kernel. For
    example, a 3x3 kernel operating on a 2-band image produces 18 output bands.

    Args:
      kernel: The kernel specifying the neighborhood. Zero-weight values are
        ignored.

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.neighborhoodToBands', self, kernel
    )

  def neq(self, image2: _arg_types.Image) -> Image:
    """Returns 1 if the pixel in the image is not equal to the pixel in image2.

    Returns 1 if and only if the first value is not equal to the second for each
    matched pair of bands in image1 and image2. If either image1 or image2 has
    only 1 band, then it is used against all the bands in the other image. If
    the images have the same number of bands, but not the same names, they're
    used pairwise in the natural order. The output bands are named for the
    longer of the two inputs, or if they're equal in length, in image1's order.
    The type of the output pixels is boolean.

    Args:
      image2: The image from which the right operand bands are taken.
    """

    return apifunction.ApiFunction.call_(self.name() + '.neq', self, image2)

  def normalizedDifference(
      self,
      # pylint: disable-next=invalid-name
      bandNames: Optional[_arg_types.Any] = None,
  ) -> Image:
    """Computes the normalized difference between two bands.

    If the bands to use are not specified, uses the first two bands. The
    normalized difference is computed as (first − second) / (first + second).
    Note that the returned image band name is 'nd', the input image properties
    are not retained in the output image, and a negative pixel value in either
    input band will cause the output pixel to be masked. To avoid masking
    negative input values, use `ee.Image.expression()` to compute normalized
    difference.

    Args:
      bandNames: A list of names specifying the bands to use. If not specified,
        the first and second bands are used.

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.normalizedDifference', self, bandNames
    )

  def Not(self) -> Image:
    """Returns 0 if the input is non-zero, and 1 otherwise."""

    return apifunction.ApiFunction.call_(self.name() + '.not', self)

  def Or(self, image2: _arg_types.Image) -> Image:
    """Returns 1 if the pixel in either image is non-zero, and 0 otherwise.

    Returns 1 if and only if either input value is non-zero for each matched
    pair of bands in image1 and image2. If either image1 or image2 has only 1
    band, then it is used against all the bands in the other image. If the
    images have the same number of bands, but not the same names, they're used
    pairwise in the natural order. The output bands are named for the longer of
    the two inputs, or if they're equal in length, in image1's order. The type
    of the output pixels is boolean.

    Args:
      image2: The image from which the right operand bands are taken.
    """

    return apifunction.ApiFunction.call_(self.name() + '.or', self, image2)

  # TODO: Tighten the types of color and width.
  def paint(
      self,
      # pylint: disable-next=invalid-name
      featureCollection: _arg_types.FeatureCollection,
      color: Optional[_arg_types.Any] = None,
      width: Optional[_arg_types.Any] = None,
  ) -> Image:
    """Returns an image with the geometries of a collection painted onto it.

    Paints the geometries of a collection onto an image, using the given 'color'
    value to replace each band's values where any geometry covers the image (or,
    if a line width is specified, where the perimeters do).

    This algorithm is most suitable for converting categorical data from feature
    properties to pixels in an image; if you wish to visualize a collection,
    consider using FeatureCollection.style instead, which supports RGB colors
    whereas this algorithm is strictly 'monochrome' (using single numeric
    values).

    Args:
      featureCollection: The collection painted onto the image.
      color: The pixel value to paint into every band of the input image, either
        as a number which will be used for all features, or the name of a
        numeric property to take from each feature in the collection.
      width: Line width, either as a number which will be the line width for all
        geometries, or the name of a numeric property to take from each feature
        in the collection. If unspecified, the geometries will be filled instead
        of outlined.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.paint', self, featureCollection, color, width
    )

  @staticmethod
  def pixelArea() -> Image:
    """Returns an image with the value of each pixel in square meters.

    Returns an image in which the value of each pixel is the area of that pixel
    in square meters.

    The returned image has a single band called "area."
    """

    return apifunction.ApiFunction.call_('Image.pixelArea')

  @staticmethod
  def pixelCoordinates(projection: _arg_types.Projection) -> Image:
    """Returns the x and y coordinates of each pixel in the given projection.

    Creates a two-band image containing the x and y coordinates of each pixel in
    the given projection.

    args:
      projection: The projection in which to provide pixels.
    """

    return apifunction.ApiFunction.call_('Image.pixelCoordinates', projection)

  @staticmethod
  def pixelLonLat() -> Image:
    """Returns an image with two bands named 'longitude' and 'latitude'.

    The result at each pixel is in degrees.
    """

    return apifunction.ApiFunction.call_('Image.pixelLonLat')

  def polynomial(self, coefficients: _arg_types.List) -> Image:
    """Compute a polynomial at each pixel using the given coefficients.

    Args:
      coefficients: The polynomial coefficients in increasing order of degree
        starting with the constant term.

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.polynomial', self, coefficients
    )

  def pow(self, image2: _arg_types.Image) -> Image:
    """Returns an Image with image to the power of image2.

    Raises the first value to the power of the second for each matched pair of
    bands in image1 and image2. If either image1 or image2 has only 1 band, then
    it is used against all the bands in the other image. If the images have the
    same number of bands, but not the same names, they're used pairwise in the
    natural order. The output bands are named for the longer of the two inputs,
    or if they're equal in length, in image1's order. The type of the output
    pixels is float.

    Args:
      image2: The image from which the right operand bands are taken.
    """

    return apifunction.ApiFunction.call_(self.name() + '.pow', self, image2)

  def projection(self) -> ee_projection.Projection:
    """Returns the default projection of an Image.

    Throws an error if the bands of the image don't all have the same
    projection.
    """

    return apifunction.ApiFunction.call_(self.name() + '.projection', self)

  @staticmethod
  def random(
      seed: Optional[_arg_types.Integer] = None,
      distribution: Optional[_arg_types.String] = None,
  ) -> Image:
    """Returns an image with a random number at each pixel location.

    When using the 'uniform' distribution, outputs are in the range of [0, 1).
    Using the 'normal' distribution, the outputs have mu=0, sigma=1, but no
    explicit limits.

    Args:
      seed: Seed for the random number generator.
      distribution: The distribution type of random numbers to produce. One of
        'uniform' or 'normal'.
    """

    return apifunction.ApiFunction.call_(
        'Image.random', seed, distribution
    )

  def randomVisualizer(self) -> Image:
    """Returns a random visualization image.

    Creates a visualization image by assigning a random color to each unique
    value of the pixels of the first band.

    The first three bands of the output image will contain 8-bit R, G and B
    values, followed by all bands of the input image.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.randomVisualizer', self
    )

  def reduce(self, reducer: _arg_types.Reducer) -> Image:
    """Applies a reducer to all of the bands of an image.

    The reducer must have a single input and will be called at each pixel to
    reduce the stack of band values.

    The output image will have one band for each reducer output.

    Args:
      reducer: The reducer to apply to the given image.

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(self.name() + '.reduce', self, reducer)

  def reduceConnectedComponents(
      self,
      reducer: _arg_types.Reducer,
      # pylint: disable=invalid-name
      labelBand: Optional[_arg_types.String] = None,
      maxSize: Optional[_arg_types.Integer] = None,
      # pylint: enable=invalid-name
  ) -> Image:
    """Applies a reducer to all of the pixels inside of each 'object'.

    Pixels are considered to belong to an object if they are connected (8-way)
    and have the same value in the 'label' band. The label band is only used to
    identify the connectedness; the rest are provided as inputs to the reducer.

    Args:
      reducer: The reducer to apply to pixels within the connected component.
      labelBand: The name of the band to use to detect connectedness. If
        unspecified, the first band is used.
      maxSize: Size of the neighborhood to consider when aggregating values. Any
        objects larger than maxSize in either the horizontal or vertical
        dimension will be masked, since portions of the object might be outside
        of the neighborhood.

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.reduceConnectedComponents',
        self,
        reducer,
        labelBand,
        maxSize,
    )

  def reduceNeighborhood(
      self,
      reducer: _arg_types.Reducer,
      kernel: _arg_types.Kernel,
      # pylint: disable=invalid-name
      inputWeight: Optional[_arg_types.String] = None,
      skipMasked: Optional[_arg_types.Bool] = None,
      # pylint: enable=invalid-name
      optimization: Optional[_arg_types.String] = None,
  ) -> Image:
    """Returns an ee.Image with the reducer applied as determined by the kernel.

    Applies the given reducer to the neighborhood around each pixel, as
    determined by the given kernel. If the reducer has a single input, it
    will be applied separately to each band of the collection; otherwise it
    must have the same number of inputs as the input image has bands.

    The reducer output names determine the names of the output bands: reducers
    with multiple inputs will use the output names directly, while reducers with
    a single input will prefix the output name with the input band name (e.g.,
    '10_mean', '20_mean').
    Reducers with weighted inputs can have the input weight based on the input
    mask, the kernel value, or the smaller of those two.

    Args:
      reducer: The reducer to apply to pixels within the neighborhood.
      kernel: The kernel defining the neighborhood.
      inputWeight: One of 'mask', 'kernel', or 'min'.
      skipMasked: Mask output pixels if the corresponding input pixel is masked.
      optimization: Optimization strategy. Options are 'boxcar' and 'window'.
        The 'boxcar' method is a fast method for computing count, sum or mean.
        It requires a homogeneous kernel, a single-input reducer and either
        MASK, KERNEL or no weighting. The 'window' method uses a running window,
        and has the same requirements as 'boxcar', but can use any single input
        reducer. Both methods require considerable additional memory.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.reduceNeighborhood',
        self,
        reducer,
        kernel,
        inputWeight,
        skipMasked,
        optimization,
    )

  def reduceRegion(
      self,
      reducer: _arg_types.Reducer,
      geometry: Optional[_arg_types.Geometry] = None,
      scale: Optional[_arg_types.Number] = None,
      crs: Optional[_arg_types.Projection] = None,
      # pylint: disable=invalid-name
      crsTransform: Optional[_arg_types.List] = None,
      bestEffort: Optional[_arg_types.Bool] = None,
      maxPixels: Optional[_arg_types.Integer] = None,
      tileScale: Optional[_arg_types.Number] = None,
      # pylint: enable=invalid-name
  ) -> dictionary.Dictionary:
    """Apply a reducer to all the pixels in a specific region.

    Either the reducer must have the same number of inputs as the input image
    has bands, or it must have a single input and will be repeated for each
    band.

    Args:
      reducer: The reducer to apply.
      geometry: The region over which to reduce data. Defaults to the footprint
        of the image's first band.
      scale: A nominal scale in meters of the projection to work in.
      crs: The projection to work in. If unspecified, the projection of the
        image's first band is used. If specified in addition to scale, rescaled
        to the specified scale.
      crsTransform: The list of CRS transform values. This is a row-major
        ordering of the 3x2 transform matrix. This option is mutually exclusive
        with 'scale', and replaces any transform already set on the projection.
      bestEffort: If the polygon would contain too many pixels at the given
        scale, compute and use a larger scale which would allow the operation to
        succeed.
      maxPixels: The maximum number of pixels to reduce.
      tileScale: A scaling factor between 0.1 and 16 used to adjust aggregation
        tile size; setting a larger tileScale (e.g., 2 or 4) uses smaller tiles
        and may enable computations that run out of memory with the default.

    Returns:
      An ee.Dictionary of the reducer's outputs.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.reduceRegion',
        self,
        reducer,
        geometry,
        scale,
        crs,
        crsTransform,
        bestEffort,
        maxPixels,
        tileScale,
    )

  def reduceRegions(
      self,
      collection: _arg_types.FeatureCollection,
      reducer: _arg_types.Reducer,
      scale: Optional[_arg_types.Number] = None,
      crs: Optional[_arg_types.Projection] = None,
      # pylint: disable=invalid-name
      crsTransform: Optional[_arg_types.List] = None,
      tileScale: Optional[_arg_types.Number] = None,
      # pylint: enable=invalid-name
  ) -> featurecollection.FeatureCollection:
    """Apply a reducer over the area of each feature in the given collection.

    The reducer must have the same number of inputs as the input image has
    bands.

    Args:
      collection: The features to reduce over.
      reducer: The reducer to apply.
      scale: A nominal scale in meters of the projection to work in.
      crs: The projection to work in. If unspecified, the projection of the
        image's first band is used. If specified in addition to scale, rescaled
        to the specified scale.
      crsTransform: The list of CRS transform values. This is a row-major
        ordering of the 3x2 transform matrix. This option is mutually exclusive
        with 'scale', and will replace any transform already set on the
        projection.
      tileScale: A scaling factor used to reduce aggregation tile size; using a
        larger tileScale (e.g., 2 or 4) may enable computations that run out of
        memory with the default.

    Returns:
      Returns the input ee.FeatureCollection, each augmented with the
      corresponding reducer outputs.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.reduceRegions',
        self,
        collection,
        reducer,
        scale,
        crs,
        crsTransform,
        tileScale,
    )

  def reduceResolution(
      self,
      reducer: _arg_types.Reducer,
      # pylint: disable=invalid-name
      bestEffort: Optional[_arg_types.Bool] = None,
      maxPixels: Optional[_arg_types.Integer] = None,
      # pylint: enable=invalid-name
  ) -> Image:
    """Returns an ee.Image with the reducer applied to combine all input pixels.

    Enables reprojection using the given reducer to combine all input pixels
    corresponding to each output pixel. If the reducer has a single input, it
    will be applied separately to each band of the collection; otherwise it must
    have the same number of inputs as the input image has bands.

    The reducer output names determine the names of the output bands: reducers
    with multiple inputs will use the output names directly, reducers with a
    single input and single output will preserve the input band names, and
    reducers with a single input and multiple outputs will prefix the output
    name with the input band name (e.g., '10_mean', '10_stdDev', '20_mean',
    '20_stdDev').

    Reducer input weights will be the product of the  input mask and the
    fraction of the output pixel covered by the input pixel.

    Args:
      reducer: The reducer to apply to be used for combining pixels.
      bestEffort: If using the input at its default resolution would require too
        many pixels, start with already-reduced input pixels from a pyramid
        level that allows the operation to succeed.
      maxPixels: The maximum number of input pixels to combine for each output
        pixel. Setting this too large will cause out-of-memory problems.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.reduceResolution', self, reducer, bestEffort, maxPixels
    )

  def reduceToVectors(
      self,
      reducer: Optional[_arg_types.Reducer] = None,
      geometry: Optional[_arg_types.Geometry] = None,
      scale: Optional[_arg_types.Number] = None,
      # pylint: disable=invalid-name
      geometryType: Optional[_arg_types.String] = None,
      eightConnected: Optional[_arg_types.Bool] = None,
      labelProperty: Optional[_arg_types.String] = None,
      # pylint: enable=invalid-name
      crs: Optional[_arg_types.Projection] = None,
      # pylint: disable=invalid-name
      crsTransform: Optional[_arg_types.List] = None,
      bestEffort: Optional[_arg_types.Bool] = None,
      maxPixels: Optional[_arg_types.Integer] = None,
      tileScale: Optional[_arg_types.Number] = None,
      geometryInNativeProjection: Optional[_arg_types.Bool] = None,
      # pylint: enable=invalid-name
  ) -> featurecollection.FeatureCollection:
    """Convert an image to a feature collection by reducing homogeneous regions.

    Given an image containing a band of labeled segments and zero or more
    additional bands, runs a reducer over the pixels in each segment producing a
    feature per segment.

    Either the reducer must have one fewer inputs than the image has bands, or
    it must have a single input and will be repeated for each band.

    Args:
      reducer: The reducer to apply. Its inputs will be taken from the image's
        bands after dropping the first band. Defaults to Reducer.countEvery()
      geometry: The region over which to reduce data. Defaults to the footprint
        of the image's first band.
      scale: A nominal scale in meters of the projection to work in.
      geometryType: How to choose the geometry of each generated feature; one of
        'polygon' (a polygon enclosing the pixels in the segment), 'bb' (a
        rectangle bounding the pixels), or 'centroid' (the centroid of the
        pixels).
      eightConnected: If true, diagonally-connected pixels are considered
        adjacent; otherwise only pixels that share an edge are.
      labelProperty: If non-null, the value of the first band will be saved as
        the specified property of each feature.
      crs: The projection to work in. If unspecified, the projection of the
        image's first band is used. If specified in addition to scale, rescaled
        to the specified scale.
      crsTransform: The list of CRS transform values. This is a row-major
        ordering of the 3x2 transform matrix. This option is mutually exclusive
        with 'scale', and replaces any transform already set on the projection.
      bestEffort: If the polygon would contain too many pixels at the given
        scale, compute and use a larger scale which would allow the operation to
        succeed.
      maxPixels: The maximum number of pixels to reduce.
      tileScale: A scaling factor used to reduce aggregation tile size; using a
        larger tileScale (e.g., 2 or 4) may enable computations that run out of
        memory with the default.
      geometryInNativeProjection: Create geometries in the pixel projection,
        rather than WGS84.

    Returns:
      An ee.FeatureCollection.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.reduceToVectors',
        self,
        reducer,
        geometry,
        scale,
        geometryType,
        eightConnected,
        labelProperty,
        crs,
        crsTransform,
        bestEffort,
        maxPixels,
        tileScale,
        geometryInNativeProjection,
    )

  def regexpRename(
      self,
      regex: _arg_types.String,
      replacement: _arg_types.String,
      # pylint: disable-next=redefined-builtin
      all: Optional[_arg_types.Bool] = None,
  ) -> Image:
    """Renames the bands of an image.

    Renames the bands of an image by applying a regular expression replacement
    to the current band names. Any bands not matched by the regex will be copied
    over without renaming.

    Args:
      regex: A regular expression to match in each band name.
      replacement: The text with which to replace each match. Supports $n syntax
        for captured values.
      all: If true, all matches in a given string will be replaced. Otherwise,
        only the first match in each string will be replaced.

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.regexpRename', self, regex, replacement, all
    )

  def register(
      self,
      # pylint: disable=invalid-name
      referenceImage: _arg_types.Image,
      maxOffset: _arg_types.Number,
      patchWidth: Optional[_arg_types.Number] = None,
      # pylint: enable=invalid-name
      stiffness: Optional[_arg_types.Number] = None,
  ) -> Image:
    """Registers an image to a reference image.

    Registers an image to a reference image while allowing local, rubber sheet
    deformations. Displacements are computed in the CRS of the reference image,
    at a scale dictated by the lowest resolution of the following three
    projections: input image projection, reference image projection, and
    requested projection. The displacements then applied to the input image to
    register it with the reference.

    Args:
      referenceImage: The image to register to.
      maxOffset: The maximum offset allowed when attempting to align the input
        images, in meters. Using a smaller value can reduce computation time
        significantly, but it must still be large enough to cover the greatest
        displacement within the entire image region.
      patchWidth: Patch size for detecting image offsets, in meters. This should
        be set large enough to capture texture, as well as large enough that
        ignorable objects are small within the patch. Default is null. Patch
        size will be determined automatically if notprovided.
      stiffness: Enforces a stiffness constraint on the solution. Valid values
        are in the range [0,10]. The stiffness is used for outlier rejection
        when determining displacements at adjacent grid points. Higher values
        move the solution towards a rigid transformation. Lower values allow
        more distortion or warping of the image during registration.

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.register',
        self,
        referenceImage,
        maxOffset,
        patchWidth,
        stiffness,
    )

  def remap(
      self,
      from_: Optional[_arg_types.List] = None,
      to: Optional[_arg_types.List] = None,
      # pylint: disable=invalid-name
      defaultValue: Optional[_arg_types.Any] = None,
      bandName: Optional[_arg_types.String] = None,
      # pylint: enable=invalid-name
      **kwargs,
  ) -> Image:
    # pylint: disable=g-doc-args
    """Returns an image with the values of a band remapped.

    Maps from input values to output values, represented by two parallel lists.
    Any input values not included in the input list are either set to
    defaultValue if it is given or masked if it isn't. Note that inputs
    containing floating point values might sometimes fail to match due to
    floating point precision errors.

    Args:
      from: The source values (numbers or ee.Array). All values in this list
        will be mapped to the corresponding value in 'to'.
      to: The destination values (numbers or ee.Array). These are used to
        replace the corresponding values in 'from'. Must have the same number of
        values as 'from'.
      defaultValue: The default value to replace values that weren't matched by
        a value in 'from'. If not specified, unmatched values are masked out.
      bandName: The name of the band to remap. If not specified, the first band
        in the image is used.
    """
    # pylint: enable=g-doc-args

    if kwargs:
      if kwargs.keys() != {'from'}:
        raise TypeError(
            f'Unexpected arguments: {list(kwargs.keys())}. Expected: from.'
        )
      from_ = kwargs['from']

    if not from_:
      raise TypeError('from is required.')
    if not to:
      raise TypeError('to is required.')

    return apifunction.ApiFunction.call_(
        self.name() + '.remap', self, from_, to, defaultValue, bandName
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

  def reproject(
      self,
      crs: _arg_types.Projection,
      # pylint: disable-next=invalid-name
      crsTransform: Optional[_arg_types.List] = None,
      scale: Optional[_arg_types.Number] = None,
  ) -> Image:
    """Force an image to be computed in a given projection and resolution.

    Args:
      crs: The CRS to project the image to.
      crsTransform: The list of CRS transform values. This is a row-major
        ordering of the 3x2 transform matrix. This option is mutually exclusive
        with the scale option, and replaces any transform already on the
        projection.
      scale: If scale is specified, then the projection is scaled by dividing
        the specified scale value by the nominal size of a meter in the
        specified projection. If scale is not specified, then the scale of the
        given projection will be used.

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.reproject', self, crs, crsTransform, scale
    )

  def resample(self, mode: Optional[_arg_types.String] = None) -> Image:
    """Returns an image that uses bilinear or bicubic interpolation.

    An algorithm that returns an image identical to its argument, but which uses
    bilinear or bicubic interpolation (rather than the default nearest-neighbor)
    to compute pixels in projections other than its native projection or other
    levels of the same image pyramid.

    This relies on the input image's default projection being meaningful, and so
    cannot be used on composites, for example. (Instead, you should resample the
    images that are used to create the composite.)

    Args:
      mode: The interpolation mode to use. One of 'bilinear' or 'bicubic'.

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(self.name() + '.resample', self, mode)

  def rgbToHsv(self) -> Image:
    """Transforms the image from the RGB color space to the HSV color space.

    Expects a 3 band image in the range [0, 1], and produces three bands: hue,
    saturation and value with values in the range [0, 1].

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(self.name() + '.rgbToHsv', self)

  def rightShift(self, image2: _arg_types.Image) -> Image:
    """Returns an image with the pixels right shifted by image2.

    Calculates the signed right shift of v1 by v2 bits for each matched pair of
    bands in image1 and image2. If either image1 or image2 has only 1 band, then
    it is used against all the bands in the other image. If the images have the
    same number of bands, but not the same names, they're used pairwise in the
    natural order. The output bands are named for the longer of the two inputs,
    or if they're equal in length, in image1's order. The type of the output
    pixels is the union of the input types.

    Args:
      image2: The image from which the right operand bands are taken.

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.rightShift', self, image2
    )

  def round(self) -> Image:
    """Computes the integer nearest to the input."""

    return apifunction.ApiFunction.call_(self.name() + '.round', self)

  def rsedTransform(
      self,
      neighborhood: Optional[_arg_types.Integer] = None,
      units: Optional[_arg_types.String] = None,
  ) -> Image:
    """Calculated the Reverse Squared Euclidean Distance (RSED).

    Computes the 2D maximal height surface created by placing an inverted
    parabola over each non-zero pixel of the input image, where the pixel's
    value is the height of the parabola. Viewed as a binary image
    (zero/not-zero) this is equivalent to buffering each non-zero input pixel by
    the square root of its value, in pixels.

    Args:
      neighborhood: Neighborhood size in pixels.
      units: The units of the neighborhood, currently only 'pixels' are
        supported.

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.rsedTransform', self, neighborhood, units
    )

  def sample(
      self,
      region: Optional[_arg_types.Geometry] = None,
      scale: Optional[_arg_types.Number] = None,
      projection: Optional[_arg_types.Projection] = None,
      factor: Optional[_arg_types.Number] = None,
      # pylint: disable=invalid-name
      numPixels: Optional[_arg_types.Integer] = None,
      seed: Optional[_arg_types.Integer] = None,
      dropNulls: Optional[_arg_types.Bool] = None,
      tileScale: Optional[_arg_types.Number] = None,
      geometries: Optional[_arg_types.Bool] = None,
      # pylint: enable=invalid-name
  ) -> featurecollection.FeatureCollection:
    """Returns an ee.FeatureCollection of samples from an ee.Image.

    Samples the pixels of an image, returning them as a FeatureCollection. Each
    feature will have 1 property per band in the input image. Note that the
    default behavior is to drop features that intersect masked pixels, which
    result in null-valued properties (see dropNulls argument).

    Args:
      region: The region to sample from. If unspecified, uses the image's whole
        footprint.
      scale: A nominal scale in meters of the projection to sample in.
      projection: The projection in which to sample. If unspecified, the
        projection of the image's first band is used. If specified in addition
        to scale, rescaled to the specified scale.
      factor: A subsampling factor, within (0, 1]. If specified, 'numPixels'
        must not be specified. Defaults to no subsampling.
      numPixels: The approximate number of pixels to sample. If specified,
        'factor' must not be specified.
      seed: A randomization seed to use for subsampling.
      dropNulls: Post filter the result to drop features that have null-valued
        properties.
      tileScale: A scaling factor used to reduce aggregation tile size; using a
        larger tileScale (e.g., 2 or 4) may enable computations that run out of
        memory with the default.
      geometries: If true, adds the center of the sampled pixel as the geometry
        property of the output feature. Otherwise, geometries will be omitted
        (saving memory).
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.sample',
        self,
        region,
        scale,
        projection,
        factor,
        numPixels,
        seed,
        dropNulls,
        tileScale,
        geometries,
    )

  def sampleRectangle(
      self,
      region: Optional[_arg_types.Any] = None,
      properties: Optional[_arg_types.List] = None,
      # pylint: disable=invalid-name
      defaultValue: Optional[_arg_types.Number] = None,
      defaultArrayValue: Optional[_arg_types.Array] = None,
      # pylint: enable=invalid-name
  ) -> feature.Feature:
    """Returns pixels from an image into a ND array per band.

    The arrays are returned in a feature retaining the same properties as the
    image and a geometry the same as that used to sample the image (or the image
    footprint if unspecified). Each band is sampled in its input projection, and
    if no geometry is specified, sampled using its footprint. For scalar bands,
    the output array is 2D. For array bands the output array is (2+N)D where N
    is the number of dimensions in the original band. If sampling array bands,
    all arrays must have the same number of elements. If a band's sampled region
    is entirely masked and a default array value is specified, the default array
    value is used in-lieu of sampling the image.

    Args:
      region: The region whose projected bounding box is used to sample the
        image. Defaults to the footprint in each band.
      properties: The properties to copy over from the sampled image. Defaults
        to all non-system properties.
      defaultValue: A default value used when a sampled pixel is masked or
        outside a band's footprint.
      defaultArrayValue: A default value used when a sampled array pixel is
        masked or outside a band's footprint.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.sampleRectangle',
        self,
        region,
        properties,
        defaultValue,
        defaultArrayValue,
    )

  def sampleRegions(
      self,
      collection: _arg_types.FeatureCollection,
      properties: Optional[_arg_types.List] = None,
      scale: Optional[_arg_types.Number] = None,
      projection: Optional[_arg_types.Projection] = None,
      # pylint: disable-next=invalid-name
      tileScale: Optional[_arg_types.Number] = None,
      geometries: Optional[_arg_types.Bool] = None,
  ) -> featurecollection.FeatureCollection:
    """Returns an ee.FeatureCollection of samples from an ee.Image.

    Converts each pixel of an image (at a given scale) that intersects one or
    more regions to a Feature, returning them as a FeatureCollection. Each
    output feature will have one property per band of the input image, as well
    as any specified properties copied from the input feature.

    Note that geometries will be snapped to pixel centers.

    Args:
      collection: The regions to sample over.
      properties: The list of properties to copy from each input feature.
        Defaults to all non-system properties.
      scale: A nominal scale in meters of the projection to sample in. If
        unspecified, the scale of the image's first band is used.
      projection: The projection in which to sample. If unspecified, the
        projection of the image's first band is used. If specified in addition
        to scale, rescaled to the specified scale.
      tileScale: A scaling factor used to reduce aggregation tile size; using a
        larger tileScale (e.g., 2 or 4) may enable computations that run out of
        memory with the default.
      geometries: If true, the results will include a point geometry per sampled
        pixel. Otherwise, geometries will be omitted (saving memory).
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.sampleRegions',
        self,
        collection,
        properties,
        scale,
        projection,
        tileScale,
        geometries,
    )

  # TODO: Arg names should be bandSelectors and newNames
  @_utils.accept_opt_prefix('opt_selectors', 'opt_names')
  # pylint: disable-next=keyword-arg-before-vararg
  def select(
      self,
      selectors: Optional[_arg_types.List] = None,
      names: Optional[_arg_types.List] = None,
      *args,
  ) -> Image:
    """Selects bands from an image.

    Can be called in one of two ways:
      - Passed any number of non-list arguments. All of these will be
        interpreted as band selectors. These can be band names, regexes, or
        numeric indices. For example:
        selected = image.select('a', 'b', 3, 'd');
      - Passed two lists. The first will be used as band selectors and the
        second as new names for the selected bands. The number of new names
        must match the number of selected bands. For example:
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
      if (
          len(args) > 2
          or ee_types.isString(args[0])
          or ee_types.isNumber(args[0])
      ):
        # Varargs inputs.
        selectors = args
        # Verify we didn't get anything unexpected.
        for selector in selectors:
          if (
              not ee_types.isString(selector)
              and not ee_types.isNumber(selector)
              and not isinstance(selector, computedobject.ComputedObject)
          ):
            raise ee_exception.EEException(
                'Illegal argument to select(): ' + selector
            )
        algorithm_args['bandSelectors'] = selectors
      elif len(args) > 1:
        algorithm_args['newNames'] = args[1]
    return apifunction.ApiFunction.apply_('Image.select', algorithm_args)

  def selfMask(self) -> Image:
    """Updates an image's mask based on the image itself.

    Updates an image's mask at all positions where the existing mask is not zero
    using the value of the image as the new mask value.

    The output image retains the metadata and footprint of the input image.

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(self.name() + '.selfMask', self)

  def setDefaultProjection(
      self,
      crs: _arg_types.Projection,
      # pylint: disable-next=invalid-name
      crsTransform: Optional[_arg_types.List] = None,
      scale: Optional[_arg_types.Number] = None,
  ) -> Image:
    """Set a default projection to be applied to this image.

    The projection's resolution may be overridden by later operations.

    Args:
      crs: The CRS to project the image to.
      crsTransform: The list of CRS transform values. This is a row-major
        ordering of the 3x2 transform matrix. This option is mutually exclusive
        with the scale option, and replaces any transform already on the
        projection.
      scale: If scale is specified, then the projection is scaled by dividing
        the specified scale value by the nominal size of a meter in the
        specified projection. If scale is not specified, then the scale of the
        given projection will be used.

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.setDefaultProjection', self, crs, crsTransform, scale
    )

  def short(self) -> Image:
    """Casts the input value to a signed 16-bit integer."""

    return apifunction.ApiFunction.call_(self.name() + '.short', self)

  def signum(self) -> Image:
    """Computes the signum function (sign) of the input.

    The return value is 0 if the input is 0, 1 if the input is greater than 0,
    -1 if the input is less than 0.

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

  # pylint: disable-next=invalid-name
  def sldStyle(self, sldXml: _arg_types.String) -> Image:
    """Styles a raster input with the provided OGC SLD styling.

    Points of note:

    * OGC SLD 1.0 and OGC SE 1.1 are supported.
    * The XML document passed in can be complete, or just the
      SldRasterSymbolizer element and down.
    * Exactly one SldRasterSymbolizer is required.
    * Bands may be selected by their proper Earth Engine names or using numeric
      identifiers ("1", "2", ...). Proper Earth Engine names are tried first.
    * The Histogram and Normalize contrast stretch mechanisms are supported.
    * The type="values", type="intervals" and type="ramp" attributes for
      ColorMap element in SLD 1.0 (GeoServer extensions) are supported.
    * Opacity is only taken into account when it is 0.0 (transparent).
      Non-zero opacity values are treated as completely opaque.
    * The OverlapBehavior definition is currently ignored.
    * The ShadedRelief mechanism is not currently supported.
    * The ImageOutline mechanism is not currently supported.
    * The Geometry element is ignored.

    The output image will have histogram_bandname metadata if histogram
    equalization or normalization is requested.

    Args:
      sldXml: The OGC SLD 1.0 or 1.1 document (or fragment).

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.sldStyle', self, sldXml
    )

  def slice(
      self, start: _arg_types.Integer, end: Optional[_arg_types.Integer] = None
  ) -> Image:
    """Selects a contiguous group of bands from an image by position.

    Args:
      start: Where to start the selection. Negative numbers select from the end,
        counting backwards.
      end: Where to end the selection. If omitted, selects all bands from the
        start position to the end.

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.slice', self, start, end
    )

  def spectralDilation(
      self,
      metric: Optional[_arg_types.String] = None,
      kernel: Optional[_arg_types.Kernel] = None,
      # pylint: disable-next=invalid-name
      useCentroid: Optional[_arg_types.Bool] = None,
  ) -> Image:
    """Returns the spectral/spatial dilation of an image.

    Computes the spectral/spatial dilation of an image by computing the spectral
    distance of each pixel under a structuring kernel from the centroid of all
    pixels under the kernel and taking the most distant result.

    See 'Spatial/spectral endmember extraction by multidimensional morphological
    operations.' IEEE transactions on geoscience and remote sensing 40.9 (2002):
    2025-2041.

    Args:
      metric: The spectral distance metric to use. One of 'sam' (spectral angle
        mapper), 'sid' (spectral information divergence), 'sed' (squared
        Euclidean distance), or 'emd' (earth movers distance).
      kernel: Connectedness kernel. Defaults to a square of radius 1 (8-way
        connected).
      useCentroid: If true, distances are computed from the mean of all pixels
        under the kernel instead of the kernel's center pixel.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.spectralDilation', self, metric, kernel, useCentroid
    )

  def spectralDistance(
      self, image2: _arg_types.Image, metric: Optional[_arg_types.String] = None
  ) -> Image:
    """Computes the per-pixel spectral distance between two images.

    If the images are array based then only the first band of each image is
    used; otherwise all bands are involved in the distance computation. The two
    images are therefore expected  to contain the same number of bands or have
    the same 1-dimensional array length.

    Args:
      image2: The second image.
      metric: The spectral distance metric to use. One of 'sam' (spectral angle
        mapper), 'sid' (spectral information divergence), 'sed' (squared
        Euclidean distance), or 'emd' (earth movers distance).

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.spectralDistance', self, image2, metric
    )

  def spectralErosion(
      self,
      metric: Optional[_arg_types.String] = None,
      kernel: Optional[_arg_types.Kernel] = None,
      # pylint: disable-next=invalid-name
      useCentroid: Optional[_arg_types.Bool] = None,
  ) -> Image:
    """Returns the spectral/spatial erosion of an image.

    Computes the spectral/spatial erosion of an image by computing the spectral
    distance of each pixel under a structuring kernel from the centroid of all
    pixels under the kernel and taking the closest result.

    See 'Spatial/spectral endmember extraction by multidimensional morphological
    operations.' IEEE transactions on geoscience and remote sensing 40.9 (2002):
    2025-2041.

    Args:
      metric: The spectral distance metric to use. One of 'sam' (spectral angle
        mapper), 'sid' (spectral information divergence), 'sed' (squared
        Euclidean distance), or 'emd' (earth movers distance).
      kernel: Connectedness kernel. Defaults to a square of radius 1 (8-way
        connected).
      useCentroid: If true, distances are computed from the mean of all pixels
        under the kernel instead of the kernel's center pixel.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.spectralErosion', self, metric, kernel, useCentroid
    )

  def spectralGradient(
      self,
      metric: Optional[_arg_types.String] = None,
      kernel: Optional[_arg_types.Kernel] = None,
      # pylint: disable-next=invalid-name
      useCentroid: Optional[_arg_types.Bool] = None,
  ) -> Image:
    """Returns the spectral gradient of an image.

    Computes the spectral gradient over all bands of an image (or the first band
    if the image is Array typed) by computing the per-pixel difference between
    the spectral erosion and dilation with a given structuring kernel and
    distance metric. See: Plaza, Antonio, et al. 'Spatial/spectral endmember
    extraction by multidimensional morphological operations.' IEEE transactions
    on geoscience and remote sensing 40.9 (2002): 2025-2041.

    Args:
      metric: The spectral distance metric to use. One of 'sam' (spectral angle
        mapper), 'sid' (spectral information divergence), 'sed' (squared
        Euclidean distance), or 'emd' (earth movers distance).
      kernel: Connectedness kernel. Defaults to a square of radius 1 (8-way
        connected).
      useCentroid: If true, distances are computed from the mean of all pixels
        under the kernel instead of the kernel's center pixel.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.spectralGradient', self, metric, kernel, useCentroid
    )

  def sqrt(self) -> Image:
    """Computes the square root of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.sqrt', self)

  def stratifiedSample(
      self,
      # pylint: disable=invalid-name
      numPoints: _arg_types.Integer,
      classBand: Optional[_arg_types.String] = None,
      # pylint: endable=invalid-name
      region: Optional[_arg_types.Geometry] = None,
      scale: Optional[_arg_types.Number] = None,
      projection: Optional[_arg_types.Projection] = None,
      seed: Optional[_arg_types.Integer] = None,
      # pylint: disable=invalid-name
      classValues: Optional[_arg_types.List] = None,
      classPoints: Optional[_arg_types.List] = None,
      dropNulls: Optional[_arg_types.Bool] = None,
      tileScale: Optional[_arg_types.Number] = None,
      # pylint: enable=invalid-name
      geometries: Optional[_arg_types.Bool] = None,
  ) -> featurecollection.FeatureCollection:
    """Extracts a stratified random sample of points from an image.

    Extracts the specified number of samples for each distinct value discovered
    within the 'classBand'. Returns a FeatureCollection of 1 Feature per
    extracted point, with each feature having 1 property per band in the input
    image. If there are less than the specified number of samples available for
    a given class value, then all of the points for that class will be included.
    Requires that the classBand contain integer values.

    Args:
      numPoints: The default number of points to sample in each class. Can be
        overridden for specific classes using the 'classValues' and
        'classPoints' properties.
      classBand: The name of the band containing the classes to use for
        stratification. If unspecified, the first band of the input image is
        used.
      region: The region to sample from. If unspecified, the input image's whole
        footprint is used.
      scale: A nominal scale in meters of the projection to sample in. Defaults
        to the scale of the first band of the input image.
      projection: The projection in which to sample. If unspecified, the
        projection of the input image's first band is used. If specified in
        addition to scale, rescaled to the specified scale.
      seed: A randomization seed to use for subsampling.
      classValues: A list of class values for which to override the numPoints
        parameter. Must be the same size as classPoints or null.
      classPoints: A list of the per-class maximum number of pixels to sample
        for each class in  the classValues list. Must be the same size as
        classValues or null.
      dropNulls: Skip pixels in which any band is masked.
      tileScale: A scaling factor used to reduce aggregation tile size; using a
        larger tileScale (e.g., 2 or 4) may enable computations that run out of
        memory with the default.
      geometries: If true, the results will include a geometry per sampled
        pixel. Otherwise, geometries will be omitted (saving memory).

    Returns:
      An ee.FeatureCollection.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.stratifiedSample',
        self,
        numPoints,
        classBand,
        region,
        scale,
        projection,
        seed,
        classValues,
        classPoints,
        dropNulls,
        tileScale,
        geometries,
    )

  def subtract(self, image2: _arg_types.Image) -> Image:
    """Returns image2 subtracted from this image.

    Subtracts the second value from the first for each matched pair of bands in
    image1 and image2. If either image1 or image2 has only 1 band, then it is
    used against all the bands in the other image. If the images have the same
    number of bands, but not the same names, they're used pairwise in the
    natural order. The output bands are named for the longer of the two inputs,
    or if they're equal in length, in image1's order. The type of the output
    pixels is the union of the input types.

    Args:
      image2: The image from which the right operand bands are taken.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.subtract', self, image2
    )

  def tan(self) -> Image:
    """Computes the tangent of the input in radians."""

    return apifunction.ApiFunction.call_(self.name() + '.tan', self)

  def tanh(self) -> Image:
    """Computes the hyperbolic tangent of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.tanh', self)

  def toArray(self, axis: Optional[_arg_types.Integer] = None) -> Image:
    """Concatenates pixels from each band into a single array per pixel.

    The result will be masked if any input bands are masked.

    Args:
      axis: Axis to concatenate along; must be at least 0 and at most the
        dimension of the inputs. If the axis equals the dimension of the inputs,
        the result will have 1 more dimension than the inputs.

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(self.name() + '.toArray', self, axis)

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

  def translate(
      self,
      x: _arg_types.Number,
      y: _arg_types.Number,
      units: Optional[_arg_types.String] = None,
      proj: Optional[_arg_types.Projection] = None,
  ) -> Image:
    """Translate the input image.

    Args:
      x: The amount to translate the image in the x direction.
      y: The amount to translate the image in the y direction.
      units: The units for x and y; 'meters' or 'pixels'.
      proj: The projection in which to translate the image; defaults to the
        projection of the first band.

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.translate', self, x, y, units, proj
    )

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

  def unitScale(self, low: _arg_types.Number, high: _arg_types.Number) -> Image:
    """Returns an ee.Image with input values [low, high] scaled to [0, 1].

    Scales the input so that the range of input values [low, high] becomes [0,
    1]. Values outside the range are NOT clamped. This algorithm always produces
    floating point pixels.

    Args:
      low: The value mapped to 0.
      high: The value mapped to 1.

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.unitScale', self, low, high
    )

  def unmask(
      self,
      value: Optional[_arg_types.Image] = None,
      # pylint: disable-next=invalid-name
      sameFootprint: Optional[_arg_types.Bool] = None,
  ) -> Image:
    """Returns an ee.Image with mask and value of the value image.

    Replaces mask and value of the input image with the mask and value of
    another image at all positions where the input mask is zero. The output
    image retains the metadata of the input image. By default, the output image
    also retains the footprint of the input, but setting sameFootprint to false
    allows to extend the footprint.

    Args:
      value: New value and mask for the masked pixels of the input image. If not
        specified, defaults to constant zero image which is valid everywhere.
      sameFootprint: If true (or unspecified), the output retains the footprint
        of the input image. If false, the footprint of the output is the union
        of the input footprint with the footprint of the value image.

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.unmask', self, value, sameFootprint
    )

  def unmix(
      self,
      endmembers: _arg_types.List,
      # pylint: disable=invalid-name
      sumToOne: Optional[_arg_types.Bool] = None,
      nonNegative: Optional[_arg_types.Bool] = None,
      # pylint: enable=invalid-name
  ) -> Image:
    """Returns an ee.Image with endmembers unmixing each pixel.

    Unmix each pixel with the given endmembers, by computing the pseudo-inverse
    and multiplying it through each pixel. Returns an image of doubles with the
    same number of bands as endmembers.

    Args:
      endmembers: The endmembers to unmix with.
      sumToOne: Constrain the outputs to sum to one.
      nonNegative: Constrain the outputs to be non-negative.

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.unmix', self, endmembers, sumToOne, nonNegative
    )

  def updateMask(self, mask: _arg_types.Image) -> Image:
    """Returns an ee.Image with mask of the mask image.

    Updates an image's mask at all positions where the existing mask is not
    zero. The output image retains the metadata and footprint of the input
    image.

    Args:
      mask: New mask for the image, as a floating-point value in the range [0,
        1] (invalid = 0, valid = 1). If this image has a single band, it is used
        for all bands in the input image; otherwise, must have the same number
        of bands as the input image.

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.updateMask', self, mask
    )

  def visualize(
      self,
      bands: Optional[_arg_types.Any] = None,
      gain: Optional[_arg_types.Any] = None,
      bias: Optional[_arg_types.Any] = None,
      min: Optional[_arg_types.Any] = None,  # pylint: disable=redefined-builtin
      max: Optional[_arg_types.Any] = None,  # pylint: disable=redefined-builtin
      gamma: Optional[_arg_types.Any] = None,
      opacity: Optional[_arg_types.Number] = None,
      palette: Optional[_arg_types.Any] = None,
      # pylint: disable-next=invalid-name
      forceRgbOutput: Optional[_arg_types.Bool] = None,
  ) -> Image:
    """Produces an RGB or grayscale visualization of an image.

    Each of the gain, bias, min, max, and gamma arguments can take either a
    single value, which will be applied to all bands, or a list of values the
    same length as bands.

    Args:
      bands: A list of the bands to visualize. If empty, the first 3 are used.
      gain: The visualization gain(s) to use.
      bias: The visualization bias(es) to use.
      min: The value(s) to map to RGB8 value 0.
      max: The value(s) to map to RGB8 value 255.
      gamma: The gamma correction factor(s) to use.
      opacity: The opacity scaling factor to use.
      palette: The color palette to use. List of CSS color identifiers or
        hexadecimal color strings (e.g., ['red', '00FF00', 'blueviolet']).
      forceRgbOutput: Whether to produce RGB output even for single-band inputs.

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.visualize',
        self,
        bands,
        gain,
        bias,
        min,
        max,
        gamma,
        opacity,
        palette,
        forceRgbOutput,
    )

  def where(self, test: _arg_types.Image, value: _arg_types.Image) -> Image:
    """Performs conditional replacement of values.

    For each pixel in each band of 'input', if the corresponding pixel in 'test'
    is nonzero, output the corresponding pixel in value, otherwise output the
    input pixel.

    If at a given pixel, either test or value is masked, the input value is
    used. If the input is masked, nothing is done.

    The output bands have the same names as the input bands. The output type of
    each band is the larger of the input and value types. The output image
    retains the metadata and footprint of the input image.

    Args:
      test: The test image. The pixels of this image determines which of the
        input pixels is returned. If this is a single band, it is used for all
        bands in the input image. This may not be an array image.
      value: The output value to use where test is not zero. If this is a single
        band, it is used for all bands in the input image.

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.where', self, test, value
    )

  def zeroCrossing(self) -> Image:
    """Finds zero-crossings on each band of an image."""

    return apifunction.ApiFunction.call_(self.name() + '.zeroCrossing', self)
