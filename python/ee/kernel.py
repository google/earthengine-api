"""A wrapper for Kernels."""
from __future__ import annotations

from ee import _arg_types
from ee import apifunction
from ee import computedobject


class Kernel(computedobject.ComputedObject):
  """An object to represent an Earth Engine Kernel.

  Example:
    # Square kernel
    ee.Kernel.square(radius=2, units='pixels', normalize=False)
    # Chebyshev kernel
    ee.Kernel.chebyshev(radius=3)
  """

  _initialized: bool = False

  def __init__(self, kernel: computedobject.ComputedObject):
    """Creates a Kernel wrapper.

    Args:
      kernel: A Kernel to cast.
    """
    self.initialize()

    if isinstance(kernel, computedobject.ComputedObject):
      # There is no server-side constructor for ee.Kernel. Pass the object as-is
      # to the server in case it is intended to be a Kernel cast.
      super().__init__(kernel.func, kernel.args, kernel.varName)
      return

    raise TypeError(
        f'Kernel can only be used as a cast to Kernel. Found {type(kernel)}.'
    )

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
    return 'Kernel'

  def add(
      self,
      kernel2: _arg_types.Kernel,
      normalize: _arg_types.Bool | None = None,
  ) -> Kernel:
    """Returns the addition of two kernels.

    Does pointwise addition after aligning their centers.

    Args:
      kernel2: The second kernel.
      normalize: Normalize the kernel.

    Returns:
      An ee.Kernel.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.add', self, kernel2, normalize
    )

  @staticmethod
  def chebyshev(
      radius: _arg_types.Number,
      units: _arg_types.String | None = None,
      normalize: _arg_types.Bool | None = None,
      magnitude: _arg_types.Number | None = None,
  ) -> Kernel:
    """Returns a Chebyshev kernel.

    Generates a distance kernel based on Chebyshev distance (greatest distance
    along any dimension).

    Args:
      radius: The radius of the kernel to generate.
      units: The system of measurement for the kernel ('pixels' or 'meters'). If
        the kernel is specified in meters, it will resize when the zoom-level is
        changed.
      normalize: Normalize the kernel values to sum to 1.
      magnitude: Scale each value by this amount.
    """

    return apifunction.ApiFunction.call_(
        'Kernel.chebyshev', radius, units, normalize, magnitude
    )

  @staticmethod
  def circle(
      radius: _arg_types.Number,
      units: _arg_types.String | None = None,
      normalize: _arg_types.Bool | None = None,
      magnitude: _arg_types.Number | None = None,
  ) -> Kernel:
    """Returns a circle-shaped boolean kernel.

    Args:
      radius: The radius of the kernel to generate.
      units: The system of measurement for the kernel ('pixels' or 'meters'). If
        the kernel is specified in meters, it will resize when the zoom-level is
        changed.
      normalize: Normalize the kernel values to sum to 1.
      magnitude: Scale each value by this amount.
    """

    return apifunction.ApiFunction.call_(
        'Kernel.circle', radius, units, normalize, magnitude
    )

  @staticmethod
  def compass(
      magnitude: _arg_types.Number | None = None,
      normalize: _arg_types.Bool | None = None,
  ) -> Kernel:
    """Returns a 3x3 Prewitt's Compass edge-detection kernel.

    Args:
      magnitude: Scale each value by this amount.
      normalize: Normalize the kernel values to sum to 1.
    """

    return apifunction.ApiFunction.call_('Kernel.compass', magnitude, normalize)

  @staticmethod
  def cross(
      radius: _arg_types.Number,
      units: _arg_types.String | None = None,
      normalize: _arg_types.Bool | None = None,
      magnitude: _arg_types.Number | None = None,
  ) -> Kernel:
    """Returns a cross-shaped boolean kernel.

    Args:
      radius: The radius of the kernel to generate.
      units: The system of measurement for the kernel ('pixels' or 'meters'). If
        the kernel is specified in meters, it will resize when the zoom-level is
        changed.
      normalize: Normalize the kernel values to sum to 1.
      magnitude: Scale each value by this amount.
    """

    return apifunction.ApiFunction.call_(
        'Kernel.cross', radius, units, normalize, magnitude
    )

  @staticmethod
  def diamond(
      radius: _arg_types.Number,
      units: _arg_types.String | None = None,
      normalize: _arg_types.Bool | None = None,
      magnitude: _arg_types.Number | None = None,
  ) -> Kernel:
    """Returns a diamond-shaped boolean kernel.

    Args:
      radius: The radius of the kernel to generate.
      units: The system of measurement for the kernel ('pixels' or 'meters'). If
        the kernel is specified in meters, it will resize when the zoom-level is
        changed.
      normalize: Normalize the kernel values to sum to 1.
      magnitude: Scale each value by this amount.
    """

    return apifunction.ApiFunction.call_(
        'Kernel.diamond', radius, units, normalize, magnitude
    )

  @staticmethod
  def euclidean(
      radius: _arg_types.Number,
      units: _arg_types.String | None = None,
      normalize: _arg_types.Bool | None = None,
      magnitude: _arg_types.Number | None = None,
  ) -> Kernel:
    """Returns a distance kernel based on Euclidean (straight-line) distance.

    Args:
      radius: The radius of the kernel to generate.
      units: The system of measurement for the kernel ('pixels' or 'meters'). If
        the kernel is specified in meters, it will resize when the zoom-level is
        changed.
      normalize: Normalize the kernel values to sum to 1.
      magnitude: Scale each value by this amount.
    """

    return apifunction.ApiFunction.call_(
        'Kernel.euclidean', radius, units, normalize, magnitude
    )

  # TODO: Test missing weights.
  @staticmethod
  def fixed(
      width: _arg_types.Integer | None = None,
      height: _arg_types.Integer | None = None,
      weights: _arg_types.List | None = None,
      x: _arg_types.Integer | None = None,
      y: _arg_types.Integer | None = None,
      normalize: _arg_types.Bool | None = None,
  ) -> Kernel:
    """Returns a kernel with the given weights.

    Args:
      width: The width of the kernel in pixels.
      height: The height of the kernel in pixels.
      weights: A 2-D list of [height] x [width] values to use as the weights of
        the kernel.
      x: The location of the focus, as an offset from the left.
      y: The location of the focus, as an offset from the top.
      normalize: Normalize the kernel values to sum to 1.
    """
    if weights is None:
      raise ValueError('weights is required.')

    return apifunction.ApiFunction.call_(
        'Kernel.fixed', width, height, weights, x, y, normalize
    )

  @staticmethod
  def gaussian(
      radius: _arg_types.Number,
      sigma: _arg_types.Number | None = None,
      units: _arg_types.String | None = None,
      normalize: _arg_types.Bool | None = None,
      magnitude: _arg_types.Number | None = None,
  ) -> Kernel:
    """Returns a Gaussian kernel from a sampled continuous Gaussian.

    Args:
      radius: The radius of the kernel to generate.
      sigma: Standard deviation of the Gaussian function (same units as radius).
      units: The system of measurement for the kernel ('pixels' or 'meters'). If
        the kernel is specified in meters, it will resize when the zoom-level is
        changed.
      normalize: Normalize the kernel values to sum to 1.
      magnitude: Scale each value by this amount.
    """

    return apifunction.ApiFunction.call_(
        'Kernel.gaussian', radius, sigma, units, normalize, magnitude
    )

  def inverse(self) -> Kernel:
    """Returns a kernel which has each of its weights multiplicatively inverted.

    Weights with a value of zero are not inverted and remain zero.
    """

    return apifunction.ApiFunction.call_(self.name() + '.inverse', self)

  @staticmethod
  def kirsch(
      magnitude: _arg_types.Number | None = None,
      normalize: _arg_types.Bool | None = None,
  ) -> Kernel:
    """Returns a 3x3 Kirsch's Compass edge-detection kernel.

    Args:
      magnitude: Scale each value by this amount.
      normalize: Normalize the kernel values to sum to 1.
    """

    return apifunction.ApiFunction.call_('Kernel.kirsch', magnitude, normalize)

  @staticmethod
  def laplacian4(
      magnitude: _arg_types.Number | None = None,
      normalize: _arg_types.Bool | None = None,
  ) -> Kernel:
    """Returns a 3x3 Laplacian-4 edge-detection kernel.

    Args:
      magnitude: Scale each value by this amount.
      normalize: Normalize the kernel values to sum to 1.
    """

    return apifunction.ApiFunction.call_(
        'Kernel.laplacian4', magnitude, normalize
    )

  @staticmethod
  def laplacian8(
      magnitude: _arg_types.Number | None = None,
      normalize: _arg_types.Bool | None = None,
  ) -> Kernel:
    """Returns a 3x3 Laplacian-8 edge-detection kernel.

    Args:
      magnitude: Scale each value by this amount.
      normalize: Normalize the kernel values to sum to 1.
    """

    return apifunction.ApiFunction.call_(
        'Kernel.laplacian8', magnitude, normalize
    )

  @staticmethod
  def manhattan(
      radius: _arg_types.Number,
      units: _arg_types.String | None = None,
      normalize: _arg_types.Bool | None = None,
      magnitude: _arg_types.Number | None = None,
  ) -> Kernel:
    """Returns a distance kernel based on rectilinear (city-block) distance.

    Args:
      radius: The radius of the kernel to generate.
      units: The system of measurement for the kernel ('pixels' or 'meters'). If
        the kernel is specified in meters, it will resize when the zoom-level is
        changed.
      normalize: Normalize the kernel values to sum to 1.
      magnitude: Scale each value by this amount.
    """

    return apifunction.ApiFunction.call_(
        'Kernel.manhattan', radius, units, normalize, magnitude
    )

  @staticmethod
  def octagon(
      radius: _arg_types.Number,
      units: _arg_types.String | None = None,
      normalize: _arg_types.Bool | None = None,
      magnitude: _arg_types.Number | None = None,
  ) -> Kernel:
    """Returns an octagon-shaped boolean kernel.

    Args:
      radius: The radius of the kernel to generate.
      units: The system of measurement for the kernel ('pixels' or 'meters'). If
        the kernel is specified in meters, it will resize when the zoom-level is
        changed.
      normalize: Normalize the kernel values to sum to 1.
      magnitude: Scale each value by this amount.
    """

    return apifunction.ApiFunction.call_(
        'Kernel.octagon', radius, units, normalize, magnitude
    )

  @staticmethod
  def plus(
      radius: _arg_types.Number,
      units: _arg_types.String | None = None,
      normalize: _arg_types.Bool | None = None,
      magnitude: _arg_types.Number | None = None,
  ) -> Kernel:
    """Returns a plus-shaped boolean kernel.

    Args:
      radius: The radius of the kernel to generate.
      units: The system of measurement for the kernel ('pixels' or 'meters'). If
        the kernel is specified in meters, it will resize when the zoom-level is
        changed.
      normalize: Normalize the kernel values to sum to 1.
      magnitude: Scale each value by this amount.
    """

    return apifunction.ApiFunction.call_(
        'Kernel.plus', radius, units, normalize, magnitude
    )

  @staticmethod
  def prewitt(
      magnitude: _arg_types.Number | None = None,
      normalize: _arg_types.Bool | None = None,
  ) -> Kernel:
    """Returns a 3x3 Prewitt edge-detection kernel.

    Args:
      magnitude: Scale each value by this amount.
      normalize: Normalize the kernel values to sum to 1.
    """

    return apifunction.ApiFunction.call_('Kernel.prewitt', magnitude, normalize)

  @staticmethod
  def rectangle(
      xRadius: _arg_types.Number,  # pylint: disable=invalid-name
      yRadius: _arg_types.Number,  # pylint: disable=invalid-name
      units: _arg_types.String | None = None,
      normalize: _arg_types.Bool | None = None,
      magnitude: _arg_types.Number | None = None,
  ) -> Kernel:
    """Returns a rectangular-shaped kernel.

    Args:
      xRadius: The horizontal radius of the kernel to generate.
      yRadius: The vertical radius of the kernel to generate.
      units: The system of measurement for the kernel ("pixels" or "meters"). If
        the kernel is specified in meters, it will resize when the zoom-level is
        changed.
      normalize: Normalize the kernel values to sum to 1.
      magnitude: Scale each value by this amount.
    """

    return apifunction.ApiFunction.call_(
        'Kernel.rectangle', xRadius, yRadius, units, normalize, magnitude
    )

  @staticmethod
  def roberts(
      magnitude: _arg_types.Number | None = None,
      normalize: _arg_types.Bool | None = None,
  ) -> Kernel:
    """Returns a 2x2 Roberts edge-detection kernel.

    Args:
      magnitude: Scale each value by this amount.
      normalize: Normalize the kernel values to sum to 1.
    """

    return apifunction.ApiFunction.call_('Kernel.roberts', magnitude, normalize)

  def rotate(self, rotations: _arg_types.Integer) -> Kernel:
    """Returns a rotated kernel.

    Args:
      rotations: Number of 90 degree rotations to make. Negative numbers rotate
        counterclockwise.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.rotate', self, rotations
    )

  @staticmethod
  def sobel(
      magnitude: _arg_types.Number | None = None,
      normalize: _arg_types.Bool | None = None,
  ) -> Kernel:
    """Returns a 3x3 Sobel edge-detection kernel.

    Args:
      magnitude: Scale each value by this amount.
      normalize: Normalize the kernel values to sum to 1.
    """

    return apifunction.ApiFunction.call_('Kernel.sobel', magnitude, normalize)

  @staticmethod
  def square(
      radius: _arg_types.Number,
      units: _arg_types.String | None = None,
      normalize: _arg_types.Bool | None = None,
      magnitude: _arg_types.Number | None = None,
  ) -> Kernel:
    """Returns a square-shaped boolean kernel.

    Args:
      radius: The radius of the kernel to generate.
      units: The system of measurement for the kernel ('pixels' or 'meters'). If
        the kernel is specified in meters, it will resize when the zoom-level is
        changed.
      normalize: Normalize the kernel values to sum to 1.
      magnitude: Scale each value by this amount.
    """

    return apifunction.ApiFunction.call_(
        'Kernel.square', radius, units, normalize, magnitude
    )
