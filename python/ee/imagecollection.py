"""Representation for an Earth Engine ImageCollection."""

from __future__ import annotations

from collections.abc import Sequence
from typing import Any, Callable

from ee import _arg_types
from ee import _utils
from ee import apifunction
from ee import collection
from ee import computedobject
from ee import data
from ee import deprecation
from ee import ee_exception
from ee import ee_list
from ee import ee_types
from ee import image

REDUCE_PREFIX = 'reduce'


class ImageCollection(collection.Collection):
  """Representation for an Earth Engine ImageCollection."""

  _initialized = False

  # Tell pytype to not complain about dynamic attributes.
  _HAS_DYNAMIC_ATTRIBUTES = True

  @deprecation.WarnForDeprecatedAsset('args')
  def __init__(self, args: Any):
    """ImageCollection constructor.

    Args:
       args: ImageCollections can be constructed from the following arguments:
           1) A string: assumed to be the name of a collection,
           2) An array of images, or anything that can be used to construct an
              image.
           3) A single image.
           5) A computed object - reinterpreted as a collection.

    Raises:
      EEException: if passed something other than the above.
    """
    self.initialize()

    # Wrap single images in an array.
    if isinstance(args, image.Image):
      args = [args]

    if ee_types.isString(args):
      # An ID.
      super().__init__(
          apifunction.ApiFunction.lookup('ImageCollection.load'), {'id': args})
    elif isinstance(args, (list, tuple)):
      # A list of images.
      super().__init__(
          apifunction.ApiFunction.lookup('ImageCollection.fromImages'), {
              'images': [image.Image(i) for i in args]
          })
    elif isinstance(args, ee_list.List):
      # A computed list of images.
      super().__init__(
          apifunction.ApiFunction.lookup('ImageCollection.fromImages'), {
              'images': args
          })
    elif isinstance(args, computedobject.ComputedObject):
      # A custom object to reinterpret as an ImageCollection.
      super().__init__(args.func, args.args, args.varName)
    else:
      raise ee_exception.EEException(
          'Unrecognized argument type to convert to an ImageCollection: %s' %
          args)

  @classmethod
  def initialize(cls) -> None:
    """Imports API functions to this class."""
    if not cls._initialized:
      super().initialize()
      apifunction.ApiFunction.importApi(cls, cls.name(), cls.name())
      apifunction.ApiFunction.importApi(cls, 'reduce', cls.name())
      cls._initialized = True

  @classmethod
  def reset(cls) -> None:
    """Removes imported API functions from this class."""
    apifunction.ApiFunction.clearApi(cls)
    cls._initialized = False

  def getMapId(self, vis_params: Any | None = None) -> dict[str, Any]:
    """Fetch and return a Map ID.

    This mosaics the collection to a single image and return a map ID suitable
    for building a Google Maps overlay.

    Args:
      vis_params: The visualization parameters.

    Returns:
      A map ID dictionary as described in ee.data.getMapId.
    """
    mosaic = apifunction.ApiFunction.call_('ImageCollection.mosaic', self)
    return mosaic.getMapId(vis_params)

  @_utils.accept_opt_prefix('opt_names')
  # pylint: disable-next=keyword-arg-before-vararg
  def select(
      self, selectors: Any, names: Any | None = None, *args
  ) -> ImageCollection:
    """Select bands from each image in a collection.

    Args:
      selectors: An array of names, regexes or numeric indices specifying the
        bands to select.
      names: An array of strings specifying the new names for the selected
        bands.  If supplied, the length must match the number of bands selected.
      *args: Selector elements as varargs.

    Returns:
      The image collection with selected bands.
    """
    return self.map(lambda img: img.select(selectors, names, *args))

  # Disable argument usage check; arguments are accessed using locals().
  # pylint: disable=unused-argument,g-bad-name
  def linkCollection(
      self,
      imageCollection: ImageCollection,
      linkedBands: Sequence[str] | None = None,
      linkedProperties: Sequence[str] | None = None,
      matchPropertyName: str | None = None,
  ) -> ImageCollection:
    """Links images in this collection to matching images from imageCollection.

    For each source image in this collection, any specified bands or metadata
    will be added to the source image from the matching image found in
    imageCollection. If bands or metadata are already present, they will be
    overwritten. If matching images are not found, any new or updated bands will
    be fully masked and any new or updated metadata will be null. The output
    footprint will be the same as the source image footprint.

    Matches are determined if a source image and an image in imageCollection
    have a specific equivalent metadata property. If more than one collection
    image would match, the collection image selected is arbitrary. By default,
    images are matched on their 'system:index' metadata property.

    This linking function is a convenience method for adding bands target images
    based on a specified shared metadata property and is intended to support
    linking collections that apply different processing/product generation to
    the same source imagery. For more expressive linking known as 'joining', see
    https://developers.google.com/earth-engine/guides/joins_intro.

    Args:
      imageCollection: The image collection searched to find matches from this
        collection.
      linkedBands: Optional list of band names to add or update from matching
        images.
      linkedProperties: Optional list of metadata properties to add or
        update from matching images.
      matchPropertyName: The metadata property name to use as a match
        criteria. Defaults to "system:index".

    Returns:
      The linked image collection.
    """
    kwargs = {
        k: v for k, v in locals().items() if k != 'self' and v is not None}
    def _linkCollection(img):
      return apifunction.ApiFunction.apply_(
          'Image.linkCollection', {'input': img, **kwargs})

    return self.map(_linkCollection)

  # pylint: enable=g-bad-name,unused-argument

  def first(self) -> image.Image:
    """Returns the first entry from a given collection.

    Returns:
      The first entry from the collection.
    """
    return image.Image(apifunction.ApiFunction.call_('Collection.first', self))

  @staticmethod
  def name() -> str:
    return 'ImageCollection'

  @staticmethod
  def elementType():
    return image.Image

  def getVideoThumbURL(self, params: dict[str, Any] | None = None) -> str:
    """Get the URL for an animated video thumbnail of the given collection.

    Note: Videos can only be created when the image visualization
    creates an RGB or RGBA image.  This can be done by mapping a visualization
    onto the collection or specifying three bands in the params.

    Args:
      params: Parameters identical to getMapId, plus, optionally:
      dimensions -
        (a number or pair of numbers in format WIDTHxHEIGHT) Max dimensions of
        the thumbnail to render, in pixels. If only one number is passed, it is
        used as the maximum, and the other dimension is computed by proportional
        scaling.
      crs - a CRS string specifying the projection of the output.
      crs_transform - the affine transform to use for the output pixel grid.
      scale - a scale to determine the output pixel grid; ignored if both crs
        and crs_transform are specified.
      region - (E,S,W,N or GeoJSON) Geospatial region of the result. By default,
        the whole image.
      format - (string) The output format (only 'gif' is currently supported).
      framesPerSecond - Animation speed.
      Visualization parameters - ['bands', 'gain', 'bias', 'min', 'max',
        'gamma', 'palette', 'opacity', 'forceRgbOutput'] see Earth Engine
         API for ee.Image.visualize for more information.
    Returns:
      A URL to download a thumbnail of the specified ImageCollection.

    Raises:
      EEException: If the region parameter is not an array or GeoJSON object.
    """
    return self._getThumbURL(['gif'], params, thumbType='video')

  def getFilmstripThumbURL(self, params: Any | None = None) -> str:
    """Get the URL for a "filmstrip" thumbnail of the given collection.

    Args:
      params: Parameters identical to getMapId, plus, optionally:
      dimensions -
        (a number or pair of numbers in format WIDTHxHEIGHT) Max dimensions of
        the thumbnail to render, in pixels. If only one number is passed, it is
        used as the maximum, and the other dimension is computed by proportional
        scaling.
      crs - a CRS string specifying the projection of the output.
      crs_transform - the affine transform to use for the output pixel grid.
      scale - a scale to determine the output pixel grid; ignored if both crs
        and crs_transform are specified.
      region - (E,S,W,N or GeoJSON) Geospatial region of the result. By default,
        the whole image.
      format - (string) The output format (e.g., "png", "jpg").
      Visualization parameters - ['bands', 'gain', 'bias', 'min', 'max',
        'gamma', 'palette', 'opacity', 'forceRgbOutput'] see Earth Engine
         API for ee.Image.visualize for more information.
    Returns:
      A URL to download a thumbnail of the specified ImageCollection.

    Raises:
      EEException: If the region parameter is not an array or GeoJSON object.
    """
    return self._getThumbURL(['png', 'jpg'], params, thumbType='filmstrip')

  def _getThumbURL(
      self,
      valid_formats: Sequence[str],
      # TODO(user): Need to drop the default None and use dict[str, Any]]
      params: Any | None = None,
      thumbType: str | None = None,  # pylint: disable=g-bad-name
  ) -> str:
    """Get the URL for a thumbnail of this collection.

    Args:
      valid_formats: A list of supported formats, the first of which is used as
        a default if no format is supplied in 'params'.
      params: Parameters identical to getMapId, plus, optionally:
      dimensions -
        (a number or pair of numbers in format WIDTHxHEIGHT) Max dimensions of
        the thumbnail to render, in pixels. If only one number is passed, it is
        used as the maximum, and the other dimension is computed by proportional
        scaling.
      crs - a CRS string specifying the projection of the output.
      crs_transform - the affine transform to use for the output pixel grid.
      scale - a scale to determine the output pixel grid; ignored if both crs
        and crs_transform are specified.
      region - (E,S,W,N or GeoJSON) Geospatial region of the result. By default,
        the whole image.
      format - (string) The output format
      thumbType: must be either 'video' or 'filmstrip'.

    Returns:
      A URL to download a thumbnail of the specified ImageCollection.

    Raises:
      EEException: If the region parameter is not an array or GeoJSON object.
    """
    def map_function(input_image, input_params):
      # pylint: disable=protected-access
      output_image, request = input_image._apply_spatial_transformations(
          input_params)
      output_image, request = output_image._apply_visualization(request)
      # pylint: enable=protected-access
      return output_image, request

    clipped_collection, request = self._apply_preparation_function(
        map_function, params)

    assert params is not None
    request['format'] = params.get('format', valid_formats[0])
    if request['format'] not in valid_formats:
      raise ee_exception.EEException(
          'Invalid format specified for thumbnail. ' + str(params['format']))

    if params and 'framesPerSecond' in params:
      request['framesPerSecond'] = params.get('framesPerSecond')
    request['image'] = clipped_collection
    if params and params.get('dimensions') is not None:
      request['dimensions'] = params.get('dimensions')
    if thumbType not in ['video', 'filmstrip']:
      raise ee_exception.EEException(
          'Invalid thumbType provided to _getThumbURL only \'video\' or '
          '\'filmstrip\' is supported.')

    return data.makeThumbUrl(data.getThumbId(request, thumbType=thumbType))

  def _apply_preparation_function(
      self,
      preparation_function: Callable[[Any, Any], Any],
      params: dict[str, Any],
  ) -> Any:
    """Applies a preparation function to an ImageCollection.

    Args:
      preparation_function: The preparation function. Takes an image and a
        parameter dict; returns the modified image and a subset of the
        parameter dict, with the parameters it used removed.
      params: The parameters to the preparation function.

    Returns:
      A tuple containing:
      - an ImageCollection that has had many of the parameters applied
        to it
      - any remaining parameters.
    """
    # The preparation function operates only on a single image and returns a
    # modified parameter set; we need to apply across all the images in this
    # collection via self.map, and also return a modified parameter set, which
    # we can't easily get out of self.map. So we invoke it in two ways: once on
    # a dummy Image to get a modified parameter set, and once via self.map.
    _, remaining_params = preparation_function(self.first(), params)

    if remaining_params == params:
      # Nothing in params affects us; omit the map.
      return self, params

    # Copy params defensively in case it's modified after we return but before
    # the map operation is serialised.
    params = params.copy()
    def apply_params(img):
      prepared_img, _ = preparation_function(img, params)
      return prepared_img
    return self.map(apply_params), remaining_params

  def prepare_for_export(
      self, params: dict[str, Any]
  ) -> tuple[ImageCollection, dict[str, Any]]:
    """Applies all relevant export parameters to an ImageCollection.

    Args:
      params: The export request parameters.

    Returns:
      A tuple containing:
      - an ImageCollection that has had many of the request parameters applied
        to it
      - any remaining parameters.
    """
    # If the Cloud API is enabled, we can do cleaner handling of the parameters.
    # If it isn't enabled, we have to be bug-for-bug compatible with current
    # behaviour, so we do nothing.
    return self._apply_preparation_function(image.Image.prepare_for_export,
                                            params)

  def cast(
      self,
      bandTypes: _arg_types.Dictionary,  # pylint: disable=invalid-name
      bandOrder: _arg_types.List,  # pylint: disable=invalid-name
  ) -> ImageCollection:
    """Casts some or all bands of each image to the specified types.

    Args:
      bandTypes: A dictionary from band name to band types. Types can be
        PixelTypes or strings. The valid strings are: 'int8', 'int16', 'int32',
        'int64', 'uint8', 'uint16', 'uint32', 'byte', 'short', 'int', 'long',
        'float', and 'double'. Must include all bands already in any image in
        the collection. If this includes bands that are not already in an input
        image, they will be added to the image as transparent bands.
      bandOrder: A list specifying the order of the bands in the result. Must
        match the keys of bandTypes.

    Returns:
      An ee.ImageCollection.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.cast', self, bandTypes, bandOrder
    )

  def combine(
      self,
      secondary: _arg_types.ImageCollection,
      overwrite: _arg_types.Bool | None = None,
  ) -> ImageCollection:
    """Returns a collection adding all the bands from the image in secondary.

    Makes a new collection that is a copy of the images in primary, adding all
    the bands from the image in secondary with a matching ID. If there are no
    matching IDs, the resulting collection will be empty. This is equivalent to
    an inner join on ID with merging of the bands of the result.

    Note that this algorithm assumes that for a matching pair of inputs, both
    have the same footprint and metadata.

    Args:
      secondary: The secondary collection to join.
      overwrite: If true, bands with the same name will get overwritten. If
        false, bands with the same name will be renamed.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.combine', self, secondary, overwrite
    )

  def formaTrend(
      self,
      covariates: _arg_types.ImageCollection | None = None,
      # pylint: disable-next=invalid-name
      windowSize: _arg_types.Integer | None = None,
  ) -> image.Image:
    """Returns an image with the forma trend of the collection.

    Computes the long and short term trends of a time series or optionally, the
    trends of the ratio of the time series and a covariate. The long term trend
    is estimated from the linear term of a regression on the full time series.
    The short term trend is computed as the windowed minimum over the time
    series.

    The time series and covariate series are expected to contain a single band
    each, and the time series is expected to be evenly spaced in time. The
    output is 4 float bands: the long and short term trends, the t-test of the
    long term trend against the time series, and the Bruce Hansen test of
    parameter stability.

    Args:
      covariates: Cofactors to use in the trend analysis.
      windowSize: Short term trend analysis window size, in images.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.formaTrend', self, covariates, windowSize
    )

  @staticmethod
  def fromImages(images: _arg_types.List) -> ImageCollection:
    """Returns the image collection containing the given images."""

    return apifunction.ApiFunction.call_('ImageCollection.fromImages', images)

  def getRegion(
      self,
      geometry: _arg_types.Geometry,
      scale: _arg_types.Number | None = None,
      crs: _arg_types.Projection | None = None,
      # pylint: disable-next=invalid-name
      crsTransform: _arg_types.List | None = None,
  ) -> ee_list.List:
    """Returns a list of values for each [pixel, band, image] tuple.

    Output an array of values for each [pixel, band, image] tuple in an
    ImageCollection. The output contains rows of id, lon, lat, time, and all
    bands for each image that intersects each pixel in the given region.
    Attempting to extract more than 1048576 values will result in an error.

    Args:
      geometry: The region over which to extract data.
      scale: A nominal scale in meters of the projection to work in.
      crs: The projection to work in. If unspecified, defaults to EPSG:4326. If
        specified in addition to scale, the projection is rescaled to the
        specified scale.
      crsTransform: The array of CRS transform values. This is a row-major
        ordering of a 3x2 affine transform. This option is mutually exclusive
        with the scale option, and will replace any transform already set on the
        given projection.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.getRegion', self, geometry, scale, crs, crsTransform
    )

  @staticmethod
  def load(
      # pylint: disable-next=redefined-builtin
      id: _arg_types.String,
      version: _arg_types.Integer | None = None,
  ) -> ImageCollection:
    """Returns the image collection given its ID.

    Args:
      id: The asset ID of the image collection.
      version: The version of the asset. -1 signifies the latest version.
    """

    return apifunction.ApiFunction.call_('ImageCollection.load', id, version)

  def merge(self, collection2: _arg_types.ImageCollection) -> ImageCollection:
    """Returns a collection of two image collections merged into one.

    The result has all the images that were in either collection.

    Args:
      collection2: The second collection to merge.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.merge', self, collection2
    )

  def mosaic(self) -> image.Image:
    """Composites all the images in a collection, using the mask."""

    return apifunction.ApiFunction.call_(self.name() + '.mosaic', self)

  def qualityMosaic(
      self, qualityBand: _arg_types.String  # pylint: disable=invalid-name
  ) -> image.Image:
    """Returns an image with the quality mosaic of the collection.

    Composites all the images in a collection, using a quality band as a
    per-pixel ordering function.

    Args:
      qualityBand: The name of the quality band in the collection.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.qualityMosaic', self, qualityBand
    )

  def reduce(
      self,
      reducer: _arg_types.Reducer,
      # pylint: disable-next=invalid-name
      parallelScale: _arg_types.Number | None = None,
  ) -> image.Image:
    """Returns a reduced image from the collection.

    Applies a reducer across all of the images in a collection.

    If the reducer has a single input, it will be applied separately to each
    band of the collection; otherwise it must have the same number of inputs as
    the collection has bands.

    The reducer output names determine the names of the output bands: reducers
    with multiple inputs will use the output names directly, while reducers with
    a single input will prefix the output name with the input band name (e.g.,
    '10_mean', '20_mean').

    Args:
      reducer: The reducer to apply to the given collection.
      parallelScale: A scaling factor used to limit memory use; using a larger
        parallelScale (e.g., 2 or 4) may enable computations that run out of
        memory with the default.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.reduce', self, reducer, parallelScale
    )

  def toArray(self) -> image.Image:
    """Returns an image of an image collection converted into 2D arrays.

    At each pixel, the images that have valid (unmasked) values in all bands are
    laid out along the first axis of the array in the order they appear in the
    image collection. The bands of each image are laid out along the second axis
    of the array, in the order the bands appear in that image. The array element
    type will be the union of the types of each band.
    """

    return apifunction.ApiFunction.call_(self.name() + '.toArray', self)

  def toArrayPerBand(
      self, axis: _arg_types.Integer | None = None
  ) -> image.Image:
    """Returns an image of an image collection converted into 2D arrays.

    Concatenates multiple images into a single array image. The result will be
    masked if any input is masked.

    Args:
      axis: Axis to concatenate along; must be at least 0 and at most the
        minimum dimension of any band in the collection.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.toArrayPerBand', self, axis
    )

  def toBands(self) -> image.Image:
    """Returns an image containing all bands of every image in the collection.

    Converts a collection to a single multi-band image containing all of the
    bands of every image in the collection. Output bands are named by prefixing
    the existing band names with the image id from which it came (e.g.,
    'image1_band1'). Note: The maximum number of bands is 5000.
    """

    return apifunction.ApiFunction.call_(self.name() + '.toBands', self)

  # Methods from 'reduce.*'

  def And(self) -> image.Image:
    """Returns an image with the logical AND of the collection.

    Reduces an image collection by setting each pixel to 1 if and only if all
    the non-masked values at that pixel are non-zero across the stack of all
    matching bands. Bands are matched by name.
    """

    return apifunction.ApiFunction.call_(REDUCE_PREFIX + '.and', self)

  def count(self) -> image.Image:
    """Returns an image with the number of images in the collection.

    Reduces an image collection by calculating the number of images with a valid
    mask at each pixel across the stack of all matching bands. Bands are matched
    by name.
    """

    return apifunction.ApiFunction.call_(REDUCE_PREFIX + '.count', self)

  def max(self) -> image.Image:
    """Returns an image with the maximum value of the collection.

    Reduces an image collection by calculating the maximum value of each pixel
    across the stack of all matching bands. Bands are matched by name.
    """

    return apifunction.ApiFunction.call_(REDUCE_PREFIX + '.max', self)

  def mean(self) -> image.Image:
    """Returns an image with the mean of the collection.

    Reduces an image collection by calculating the mean of all values at each
    pixel across the stack of all matching bands. Bands are matched by name.
    """

    return apifunction.ApiFunction.call_(REDUCE_PREFIX + '.mean', self)

  def median(self) -> image.Image:
    """Returns an image with the median of the collection.

    Reduces an image collection by calculating the median of all values at each
    pixel across the stack of all matching bands. Bands are matched by name.
    """

    return apifunction.ApiFunction.call_(REDUCE_PREFIX + '.median', self)

  def min(self) -> image.Image:
    """Returns an image with the minimum value of the collection.

    Reduces an image collection by calculating the minimum value of each pixel
    across the stack of all matching bands. Bands are matched by name.
    """

    return apifunction.ApiFunction.call_(REDUCE_PREFIX + '.min', self)

  def mode(self) -> image.Image:
    """Returns an image with the most common value of the collection.

    Reduces an image collection by calculating the most common value at each
    pixel across the stack of all matching bands. Bands are matched by name.
    """

    return apifunction.ApiFunction.call_(REDUCE_PREFIX + '.mode', self)

  def Or(self) -> image.Image:
    """Returns an image with the logical OR of the collection.

    Reduces an image collection by setting each pixel to 1 if and only if any of
    the non-masked values at that pixel are non-zero across the stack of all
    matching bands. Bands are matched by name.
    """

    return apifunction.ApiFunction.call_(REDUCE_PREFIX + '.or', self)

  def product(self) -> image.Image:
    """Returns an image with the product of the collection.

    Reduces an image collection by calculating the product of all values at each
    pixel across the stack of all matching bands. Bands are matched by name.
    """

    return apifunction.ApiFunction.call_(REDUCE_PREFIX + '.product', self)

  def sum(self) -> image.Image:
    """Returns an image with the sum of the collection.

    Reduces an image collection by calculating the sum of all values at each
    pixel across the stack of all matching bands. Bands are matched by name.
    """

    return apifunction.ApiFunction.call_(REDUCE_PREFIX + '.sum', self)
