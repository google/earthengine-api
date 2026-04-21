"""A wrapper for colors."""

from __future__ import annotations

from ee import _arg_types
from ee import apifunction
from ee import computedobject
from ee import ee_exception
from ee import ee_list
from ee import ee_string


class Color(computedobject.ComputedObject):
  """A color."""

  _initialized = False

  # Tell pytype to not complain about dynamic attributes.
  _HAS_DYNAMIC_ATTRIBUTES = True

  def __init__(self, input: _arg_types.Color | None = None):  # pylint: disable=redefined-builtin
    """Initializes a color wrapper.

    This constructor accepts the following args:
      1) A W3C compatible color string.
      2) A list of RGBA values in the range of [0:1].
      3) A ComputedObject returning a color.

    Args:
      input: The color to wrap.
    """
    self.initialize()

    if input is None:
      message = f'Required argument (input) missing to function: {self.name()}'
      raise ee_exception.EEException(message)

    if isinstance(input, computedobject.ComputedObject):
      super().__init__(input.func, input.args, input.varName)
    else:
      super().__init__(apifunction.ApiFunction(self.name()), {'input': input})

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
    return 'Color'

  @classmethod
  def fromHsv(cls, hsv: _arg_types.List) -> Color:
    """Creates a Color given a list of HSV values.

    Args:
      hsv: A list of HSV (hue, saturation, value) values in the range [0:1].

    Returns:
      An ee.Color.
    """
    return apifunction.ApiFunction.call_(cls.name() + '.fromHsv', hsv)

  @classmethod
  def fromHsl(cls, hsl: _arg_types.List) -> Color:
    """Creates a Color given a list of HSL values.

    Args:
      hsl: A list of HSL (hue, saturation, luminosity) values in the range
        [0:1].

    Returns:
      An ee.Color.
    """
    return apifunction.ApiFunction.call_(cls.name() + '.fromHsl', hsl)

  @classmethod
  def fromLab(cls, lab: _arg_types.List) -> Color:
    """Creates a Color given a list of CIE-LAB values.

    Args:
      lab: A list of CIE-LAB values.

    Returns:
      An ee.Color.
    """
    return apifunction.ApiFunction.call_(cls.name() + '.fromLab', lab)

  @classmethod
  def fromLch(cls, lch: _arg_types.List) -> Color:
    """Creates a Color given a list of CIE-LCH values.

    Args:
      lch: A list of CIE-LCH (lightness, chroma, hue) values.

    Returns:
      An ee.Color.
    """
    return apifunction.ApiFunction.call_(cls.name() + '.fromLch', lch)

  @classmethod
  def gray(
      cls, value: _arg_types.Number, alpha: _arg_types.Number = 1.0
  ) -> Color:
    """Creates a gray color.

    Args:
      value: The gray value in the range [0:1].
      alpha: The alpha value in the range [0:1].

    Returns:
      An ee.Color.
    """
    return apifunction.ApiFunction.call_(cls.name() + '.gray', value, alpha)

  def brighter(self, scale: _arg_types.Number = 0.7) -> Color:
    """Scales each of the RGB channels to produce a brighter color.

    Args:
      scale: The scale factor.

    Returns:
      An ee.Color.
    """
    return apifunction.ApiFunction.call_(self.name() + '.brighter', self, scale)

  def darker(self, scale: _arg_types.Number = 0.7) -> Color:
    """Scales each of the RGB channels to produce a darker color.

    Args:
      scale: The scale factor.

    Returns:
      An ee.Color.
    """
    return apifunction.ApiFunction.call_(self.name() + '.darker', self, scale)

  def mix(
      self,
      end: _arg_types.Color,
      ratio: _arg_types.Number = 0.5,
      colorspace: _arg_types.String = 'rgb',
  ) -> Color:
    """Mixes two colors.

    Args:
      end: The ending color.
      ratio: The mix ratio.
      colorspace: The colorspace to mix in. One of 'rgb', 'lrgb', 'hsv', 'hsl',
        'lab', or 'lch'.

    Returns:
      An ee.Color.
    """
    return apifunction.ApiFunction.call_(
        self.name() + '.mix', self, end, ratio, colorspace
    )

  def toHexString(self) -> ee_string.String:
    """Returns value of a color as an RGBA hex string."""
    return apifunction.ApiFunction.call_(self.name() + '.toHexString', self)

  def toHsl(self) -> ee_list.List:
    """Returns Hue, Saturation, Lightness (HSL) as a List in the range [0:1]."""
    return apifunction.ApiFunction.call_(self.name() + '.toHsl', self)

  def toHsv(self) -> ee_list.List:
    """Returns Hue Saturation Value (HSV) as a list in the range [0:1]."""
    return apifunction.ApiFunction.call_(self.name() + '.toHsv', self)

  def toLab(self) -> ee_list.List:
    """Returns the CIE-Lab as a list of values.

    The components are unnormalized and have the approximate ranges of:

    L=[0:100], a,b=[-127:128].
    """
    return apifunction.ApiFunction.call_(self.name() + '.toLab', self)

  def toLch(self) -> ee_list.List:
    """Returns the CIE-LCH as a list of values.

    The components are unnormalized and have an approximate range of:

    L=[0:100], C=[0:180], H=[0:360] (degrees).
    """
    return apifunction.ApiFunction.call_(self.name() + '.toLch', self)

  def toRGB(self) -> ee_list.List:
    """Returns RGB and alpha as a list of numbers in the range of [0:1].
    """
    return apifunction.ApiFunction.call_(self.name() + '.toRGB', self)
