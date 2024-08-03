"""A wrapper for Models."""

from typing import Any, Dict, List, Optional, Sequence, Tuple, Union

from ee import apifunction
from ee import computedobject
from ee import dictionary
from ee import ee_number
from ee import ee_string
from ee import featurecollection
from ee import image
from ee import projection

_DictionaryType = Union[
    Dict[Any, Any],
    Sequence[Any],
    'dictionary.Dictionary',
    computedobject.ComputedObject,
]
_EeAnyType = Union[Any, computedobject.ComputedObject]
_EeBoolType = Union[Any, computedobject.ComputedObject]
_FeatureCollectionType = Union[
    Any, featurecollection.FeatureCollection, computedobject.ComputedObject
]
_ImageType = Union[Any, image.Image, computedobject.ComputedObject]
_IntegerType = Union[int, 'ee_number.Number', computedobject.ComputedObject]
_ListType = Union[List[Any], Tuple[Any, Any], computedobject.ComputedObject]
_NumberType = Union[float, 'ee_number.Number', computedobject.ComputedObject]
_ProjectionType = Union[
    str,
    'ee_string.String',
    projection.Projection,
    computedobject.ComputedObject,
]
_StringType = Union[str, 'ee_string.String', computedobject.ComputedObject]


class Model(computedobject.ComputedObject):
  """An object to represent an Earth Engine Model.

  Example:
    model = ee.Model.fromVertexAi(
        endpoint='endpoint-name',
        inputTileSize=[8, 8],
        outputBands={
            'probability': {'type': ee.PixelType.float(), 'dimensions': 1}
        },
    )

  Please visit one of the following links for more info:
    - https://developers.google.com/earth-engine/guides/machine-learning
    - https://developers.google.com/earth-engine/guides/tensorflow-vertex
  """

  _initialized: bool = False

  def __init__(self, model: computedobject.ComputedObject):
    """Creates a Model wrapper.

    Args:
      model: A Model to cast.
    """
    self.initialize()

    if isinstance(model, computedobject.ComputedObject):
      # There is no server-side constructor for ee.Model. Pass the object as-is
      # to the server in case it is intended to be a Model cast.
      super().__init__(model.func, model.args, model.varName)
      return

    raise TypeError('Model constructor can only cast to Model.')

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
    return 'Model'

  @staticmethod
  def fromAiPlatformPredictor(
      # pylint: disable=invalid-name
      projectName: Optional[_EeAnyType] = None,
      projectId: Optional[_StringType] = None,
      modelName: Optional[_StringType] = None,
      # pylint: enable=invalid-name
      version: Optional[_StringType] = None,
      region: Optional[_StringType] = None,
      # pylint: disable=invalid-name
      inputProperties: Optional[_ListType] = None,
      inputTypeOverride: Optional[_DictionaryType] = None,
      inputShapes: Optional[_DictionaryType] = None,
      # pylint: enable=invalid-name
      proj: Optional[_ProjectionType] = None,
      # pylint: disable=invalid-name
      fixInputProj: Optional[_EeBoolType] = None,
      inputTileSize: Optional[_ListType] = None,
      inputOverlapSize: Optional[_ListType] = None,
      outputTileSize: Optional[_ListType] = None,
      outputBands: Optional[_DictionaryType] = None,
      outputProperties: Optional[_DictionaryType] = None,
      outputMultiplier: Optional[_NumberType] = None,
      # pylint: enable=invalid-name
  ) -> 'Model':
    """Returns an ee.Model from a description of an AI Platform prediction model.

    (See https://cloud.google.com/ml-engine/).

    Args:
      projectName: The Google Cloud project that owns the model. Deprecated: use
        "projectId" instead.
      projectId: The ID of the Google Cloud project that owns the model.
      modelName: The name of the model.
      version: The model version. Defaults to the AI Platform default model
        version.
      region: The model deployment region. Defaults to "us-central1".
      inputProperties: Properties passed with each prediction instance. Image
        predictions are tiled, so these properties will be replicated into each
        image tile instance. Defaults to no properties.
      inputTypeOverride: Types to which model inputs will be coerced if
        specified. Both Image bands and Image/Feature properties are valid.
      inputShapes: The fixed shape of input array bands. For each array band not
        specified, the fixed array shape will be automatically deduced from a
        non-masked pixel.
      proj: The input projection at which to sample all bands. Defaults to the
        default projection of an image's first band.
      fixInputProj: If true, pixels will be sampled in a fixed projection
        specified by 'proj'. The output projection is used otherwise. Defaults
        to false.
      inputTileSize: Rectangular dimensions of pixel tiles passed in to
        prediction instances. Required for image predictions.
      inputOverlapSize: Amount of adjacent-tile overlap in X/Y along each edge
        of pixel tiles passed in to prediction instances. Defaults to [0, 0].
      outputTileSize: Rectangular dimensions of pixel tiles returned from AI
        Platform. Defaults to the value in 'inputTileSize'.
      outputBands: A map from output band names to a dictionary of output band
        info. Valid band info fields are 'type' and 'dimensions'. 'type' should
        be a ee.PixelType describing the output band, and 'dimensions' is an
        optional integer with the number of dimensions in that band e.g.,
        "outputBands: {'p': {'type': ee.PixelType.int8(), 'dimensions': 1}}".
        Required for image predictions.
      outputProperties: A map from output property names to a dictionary of
        output property info. Valid property info fields are 'type' and
        'dimensions'. 'type' should be a ee.PixelType describing the output
        property, and 'dimensions' is an optional integer with the number of
        dimensions for that property if it is an array e.g., "outputBands: {'p':
        {'type': ee.PixelType.int8(), 'dimensions': 1}}". Required for
        predictions from FeatureCollections.
      outputMultiplier: An approximation to the increase in data volume for the
        model outputs over the model inputs. If specified this must be >= 1.
        This is only needed if the model produces more data than it consumes,
        e.g., a model that takes 5 bands and produces 10 outputs per pixel.

    Returns:
      An ee.Model.
    """

    return apifunction.ApiFunction.call_(
        'Model.fromAiPlatformPredictor',
        projectName,
        projectId,
        modelName,
        version,
        region,
        inputProperties,
        inputTypeOverride,
        inputShapes,
        proj,
        fixInputProj,
        inputTileSize,
        inputOverlapSize,
        outputTileSize,
        outputBands,
        outputProperties,
        outputMultiplier,
    )

  @staticmethod
  def fromVertexAi(
      endpoint: _StringType,
      # pylint: disable=invalid-name
      inputProperties: Optional[_ListType] = None,
      inputTypeOverride: Optional[_DictionaryType] = None,
      inputShapes: Optional[_DictionaryType] = None,
      # pylint: enable=invalid-name
      proj: Optional[_ProjectionType] = None,
      # pylint: disable=invalid-name
      fixInputProj: Optional[_EeBoolType] = None,
      inputTileSize: Optional[_ListType] = None,
      inputOverlapSize: Optional[_ListType] = None,
      outputTileSize: Optional[_ListType] = None,
      outputBands: Optional[_DictionaryType] = None,
      outputProperties: Optional[_DictionaryType] = None,
      outputMultiplier: Optional[_NumberType] = None,
      maxPayloadBytes: Optional[_IntegerType] = None,
      payloadFormat: Optional[_StringType] = None,
      # pylint: enable=invalid-name
  ) -> 'Model':
    """Returns an ee.Model from a description of a Vertex AI model endpoint.

    See https://cloud.google.com/vertex-ai.

    Warning: This method is in public preview and may undergo breaking changes.

    Args:
      endpoint: The endpoint name for predictions.
      inputProperties: Properties passed with each prediction instance. Image
        predictions are tiled, so these properties will be replicated into each
        image tile instance. Defaults to no properties.
      inputTypeOverride: Types to which model inputs will be coerced if
        specified. Both Image bands and Image/Feature properties are valid.
      inputShapes: The fixed shape of input array bands. For each array band not
        specified, the fixed array shape will be automatically deduced from a
        non-masked pixel.
      proj: The input projection at which to sample all bands. Defaults to the
        default projection of an image's first band.
      fixInputProj: If true, pixels will be sampled in a fixed projection
        specified by 'proj'. The output projection is used otherwise. Defaults
        to false.
      inputTileSize: Rectangular dimensions of pixel tiles passed in to
        prediction instances. Required for image predictions.
      inputOverlapSize: Amount of adjacent-tile overlap in X/Y along each edge
        of pixel tiles passed in to prediction instances. Defaults to [0, 0].
      outputTileSize: Rectangular dimensions of pixel tiles returned from AI
        Platform. Defaults to the value in 'inputTileSize'.
      outputBands: A map from output band names to a dictionary of output band
        info. Valid band info fields are 'type' and 'dimensions'. 'type' should
        be a ee.PixelType describing the output band, and 'dimensions' is an
        optional integer with the number of dimensions in that band e.g.,
        "outputBands: {'p': {'type': ee.PixelType.int8(), 'dimensions': 1}}".
        Required for image predictions.
      outputProperties: A map from output property names to a dictionary of
        output property info. Valid property info fields are 'type' and
        'dimensions'. 'type' should be a ee.PixelType describing the output
        property, and 'dimensions' is an optional integer with the number of
        dimensions for that property if it is an array e.g., "outputBands: {'p':
        {'type': ee.PixelType.int8(), 'dimensions': 1}}". Required for
        predictions from FeatureCollections.
      outputMultiplier: An approximation to the increase in data volume for the
        model outputs over the model inputs. If specified this must be >= 1.
        This is only needed if the model produces more data than it consumes,
        e.g., a model that takes 5 bands and produces 10 outputs per pixel.
      maxPayloadBytes: The prediction payload size limit in bytes. Defaults to
        1.5MB (1500000 bytes.)
      payloadFormat: The payload format of entries in prediction requests and
        responses. One of: ['SERIALIZED_TF_TENSORS, 'RAW_JSON', 'ND_ARRAYS'].
        Defaults to 'SERIALIZED_TF_TENSORS'.

    Returns:
      An ee.Model.
    """

    return apifunction.ApiFunction.call_(
        'Model.fromVertexAi',
        endpoint,
        inputProperties,
        inputTypeOverride,
        inputShapes,
        proj,
        fixInputProj,
        inputTileSize,
        inputOverlapSize,
        outputTileSize,
        outputBands,
        outputProperties,
        outputMultiplier,
        maxPayloadBytes,
        payloadFormat,
    )

  def predictImage(self, image: _ImageType) -> image.Image:
    """Returns an image with predictions from pixel tiles of an image.

    The predictions are merged as bands with the input image.

    The model will receive 0s in place of masked pixels. The masks of predicted
    output bands are the minimum of the masks of the inputs.

    Args:
      image: The input image.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.predictImage', self, image
    )

  def predictProperties(
      self, collection: _FeatureCollectionType
  ) -> featurecollection.FeatureCollection:
    """Returns a feature collection with predictions for each feature.

    Predicted properties are merged with the properties of the input feature.

    Args:
      collection: The input collection.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.predictProperties', self, collection
    )
