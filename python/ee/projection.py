"""A wrapper for Projections."""

from typing import Any, Dict, Optional, Sequence, Union

from ee import apifunction
from ee import computedobject
from ee import ee_number
from ee import ee_string

_NumberType = Union[float, ee_number.Number, computedobject.ComputedObject]
_NumberSequenceType = Union[Sequence[_NumberType]]
_StringType = Union[str, ee_string.String, computedobject.ComputedObject]


class Projection(computedobject.ComputedObject):
  """An object to represent an Earth Engine Projection.

  Examples:
    # Construct a variety of projections.
    # crs: EPSG:4326, transform: identity
    ee.Projection('EPSG:4326')
    # crs: EPSG:4326, transform: projection.scale(2, 3)
    ee.Projection('EPSG:4326', [2, 0, 0, 0, 3, 0])
    # crs: EPSG:4326, transform wkt:
    ee.Projection(
        'EPSG:4326',
        transformWkt=(
            'GEOGCS["WGS 84",'
            '  DATUM["WGS_1984",'
            '    SPHEROID["WGS 84",6378137,298.257223563,'
            '      AUTHORITY["EPSG","7030"]],'
            '    AUTHORITY["EPSG","6326"]],'
            '  PRIMEM["Greenwich",0,'
            '    AUTHORITY["EPSG","8901"]],'
            '  UNIT["degree",0.0174532925199433,'
            '    AUTHORITY["EPSG","9122"]],'
            '  AXIS["Longitude",EAST],'
            '  AXIS["Latitude",NORTH]]'
        ),
    )
  """

  _initialized: bool = False

  def __init__(
      self,
      crs: _StringType,
      transform: Optional[_NumberSequenceType] = None,
      # pylint: disable-next=invalid-name
      transformWkt: Optional[_StringType] = None,
  ):
    """Creates a Projection wrapper.

    Returns a Projection with the given base coordinate system and the given
    transform between projected coordinates and the base.

    Args:
      crs: The base coordinate reference system of this Projection, given as a
        well-known authority code (e.g. 'EPSG:4326') or a WKT string.
      transform: The transform between projected coordinates and the base
        coordinate system, specified as a 2x3 affine transform matrix in
        row-major order: [xScale, xShearing, xTranslation, yShearing, yScale,
        yTranslation]. May not specify both this and 'transformWkt'.
      transformWkt: The transform between projected coordinates and the base
        coordinate system, specified as a WKT string. May not specify both this
        and 'transform'.
    """
    self.initialize()

    if (
        isinstance(crs, computedobject.ComputedObject)
        and transform is None
        and transformWkt is None
    ):
      # Handles cases where a user wants to manually cast a projection. Examples
      # include: `ee.Projection(ee.Image(...).projection())` and
      # `ee.Projection(ee.Projection(...))`.
      if self.is_func_returning_same(crs):
        # If it is a call that is already returning a Projection, just cast.
        super().__init__(crs.func, crs.args, crs.varName)
        return

    args: Dict[str, Any] = {'crs': crs}
    if transform is not None:
      args['transform'] = transform
    if transformWkt is not None:
      args['transformWkt'] = transformWkt

    func = apifunction.ApiFunction(self.name())
    super().__init__(func, func.promoteArgs(args))

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
    return 'Projection'
