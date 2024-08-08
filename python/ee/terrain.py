"""A namespace for Terrain."""
from __future__ import annotations

from typing import Optional

from ee import _arg_types
from ee import apifunction
from ee import image as ee_image


class Terrain:
  """A namespace for Terrain Algorithms."""

  _initialized: bool = False

  def __init__(self):
    raise RuntimeError(
        self.__name__
        + ' should not be used as an object. Only direct usage of Terrain'
        ' static methods is allowed. For example, use this: '
        ' `ee.Terrain.aspect(...)`'
    )

  @classmethod
  def initialize(cls) -> None:
    """Imports API functions to this class."""
    if not cls._initialized:
      apifunction.ApiFunction.importApi(cls, cls.__name__, cls.__name__)
      cls._initialized = True

  @classmethod
  def reset(cls) -> None:
    """Removes imported API functions from this class."""
    apifunction.ApiFunction.clearApi(cls)
    cls._initialized = False

  @staticmethod
  def name() -> str:
    return 'Terrain'

  @staticmethod
  def aspect(input: _arg_types.Image) -> ee_image.Image:
    """Returns an ee.Image with aspect in degrees from a terrain DEM.

    The local gradient is computed using the 4-connected neighbors of each
    pixel, so missing values will occur around the edges of an image.

    Args:
      input: An elevation image, in meters.
    """

    return apifunction.ApiFunction.call_('Terrain.aspect', input)

  @staticmethod
  def fillMinima(
      image: _arg_types.Image,
      borderValue: Optional[_arg_types.Integer] = None,
      neighborhood: Optional[_arg_types.Integer] = None,
  ) -> ee_image.Image:
    """Returns an ee.Image with local minima filled.

    Only works on INT types.

    Args:
      image: The image to fill.
      borderValue: The border value.
      neighborhood: The size of the neighborhood to compute over.
    """

    return apifunction.ApiFunction.call_(
        'Terrain.fillMinima', image, borderValue, neighborhood
    )

  @staticmethod
  def hillShadow(
      image: _arg_types.Image,
      azimuth: _arg_types.Number,
      zenith: _arg_types.Number,
      neighborhoodSize: Optional[_arg_types.Integer] = None,
      hysteresis: Optional[_arg_types.Bool] = None,
  ) -> ee_image.Image:
    """Returns an ee.Image with the hill shadow.

    Creates a shadow band, with output 1 where pixels are illumunated and 0
    where they are shadowed. Takes as input an elevation band, azimuth and
    zenith of the light source in degrees, a neighborhood size, and whether or
    not to apply hysteresis when a shadow appears. Currently, this algorithm
    only works for Mercator projections, in which light rays are parallel.

    Args:
      image: The image to which to apply the shadow algorithm, in which each
        pixel should represent an elevation in meters.
      azimuth: Azimuth in degrees.
      zenith: Zenith in degrees.
      neighborhoodSize: Neighborhood size.
      hysteresis: Use hysteresis. Less physically accurate, but may generate
        better images.
    """

    return apifunction.ApiFunction.call_(
        'Terrain.hillShadow',
        image,
        azimuth,
        zenith,
        neighborhoodSize,
        hysteresis,
    )

  @staticmethod
  def hillshade(
      input: _arg_types.Image,
      azimuth: Optional[_arg_types.Number] = None,
      elevation: Optional[_arg_types.Number] = None,
  ) -> ee_image.Image:
    """Returns an ee.Image with a simple hillshade from a DEM.

    Args:
      input: An elevation image, in meters.
      azimuth: The illumination azimuth in degrees from north.
      elevation: The illumination elevation in degrees.
    """

    return apifunction.ApiFunction.call_(
        'Terrain.hillshade', input, azimuth, elevation
    )

  @staticmethod
  def products(input: _arg_types.Image) -> ee_image.Image:
    """Returns slope, aspect, and a simple hillshade from a terrain DEM.

    Expects an image containing either a single band of elevation, measured in
    meters, or if there's more than one band, one named 'elevation'. Adds output
    bands named 'slope' and 'aspect' measured in degrees plus an unsigned byte
    output band named 'hillshade' for visualization. All other bands and
    metadata are copied from the input image. The local gradient is computed
    using the 4-connected neighbors of each pixel, so missing values will occur
    around the edges of an image.

    Args:
      input: An elevation image, in meters.
    """

    return apifunction.ApiFunction.call_('Terrain.products', input)

  @staticmethod
  def slope(input: _arg_types.Image) -> ee_image.Image:
    """Returns slope in degrees from a terrain DEM.

    The local gradient is computed using the 4-connected neighbors of each
    pixel, so missing values will occur around the edges of an image.

    Args:
      input: An elevation image, in meters.
    """

    return apifunction.ApiFunction.call_('Terrain.slope', input)
