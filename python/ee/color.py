"""A wrapper for colors."""

from __future__ import annotations

from typing import Any

from ee import _arg_types
from ee import apifunction
from ee import computedobject
from ee import ee_exception
from ee import ee_list


class Color(computedobject.ComputedObject):
  """An object to represent colors."""

  _initialized = False

  # Tell pytype to not complain about dynamic attributes.
  _HAS_DYNAMIC_ATTRIBUTES = True

  def __init__(self, input: Any = None, color: Any = None):  # pylint: disable=redefined-builtin
    """Construct a color wrapper.

    This constructor accepts the following args:
      1) A W3C compatible color string.
      2) A list of RGBA values in the range of [0:1].
      3) A ComputedObject returning a color.

    Args:
      input: The color to wrap.
      color: The color to wrap. (Deprecated, use 'input' instead.)
    """
    self.initialize()

    color = input if input is not None else color
    if color is None:
      raise ee_exception.EEException(
          'Required argument (input) missing to function: Color'
      )

    if isinstance(color, computedobject.ComputedObject):
      super().__init__(color.func, color.args, color.varName)
    else:
      super().__init__(apifunction.ApiFunction(self.name()), {'input': color})

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

  @classmethod
  def name(cls) -> str:
    return 'Color'

  @classmethod
  def fromHsv(cls, hsv: _arg_types.List) -> Color:
    """Creates a Color given a list of HSV values.

    Args:
      hsv: A list of HSV (hue, saturation, value) values in the range [0:1].

    Returns:
      An ee.Color.
    """
    return apifunction.ApiFunction.call_('Color.fromHsv', hsv)

  @classmethod
  def fromHsl(cls, hsl: _arg_types.List) -> Color:
    """Creates a Color given a list of HSL values.

    Args:
      hsl: A list of HSL (hue, saturation, luminosity) values in the range
        [0:1].

    Returns:
      An ee.Color.
    """
    return apifunction.ApiFunction.call_('Color.fromHsl', hsl)

  @classmethod
  def fromLab(cls, lab: _arg_types.List) -> Color:
    """Creates a Color given a list of CIE-LAB values.

    Args:
      lab: A list of CIE-LAB values.

    Returns:
      An ee.Color.
    """
    return apifunction.ApiFunction.call_('Color.fromLab', lab)

  @classmethod
  def fromLch(cls, lch: _arg_types.List) -> Color:
    """Creates a Color given a list of CIE-LCH values.

    Args:
      lch: A list of CIE-LCH (lightness, chroma, hue) values.

    Returns:
      An ee.Color.
    """
    return apifunction.ApiFunction.call_('Color.fromLch', lch)

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
    return apifunction.ApiFunction.call_('Color.gray', value, alpha)

  @classmethod
  def mix(
      cls,
      start: Color,
      end: Color,
      ratio: _arg_types.Number = 0.5,
      colorspace: _arg_types.String = 'rgb',
  ) -> Color:
    """Mixes two colors.

    Args:
      start: The starting color.
      end: The ending color.
      ratio: The mix ratio.
      colorspace: The colorspace to mix in.

    Returns:
      An ee.Color.
    """
    return apifunction.ApiFunction.call_(
        'Color.mix', start, end, ratio, colorspace
    )

  def brighter(self, scale: _arg_types.Number = 0.7) -> Color:
    """Scale each of the RGB channels to produce a brighter color.

    Args:
      scale: The scale factor.

    Returns:
      An ee.Color.
    """
    return apifunction.ApiFunction.call_('Color.brighter', self, scale)

  def darker(self, scale: _arg_types.Number = 0.7) -> Color:
    """Scale each of the RGB channels to produce a darker color.

    Args:
      scale: The scale factor.

    Returns:
      An ee.Color.
    """
    return apifunction.ApiFunction.call_('Color.darker', self, scale)

  def toHsl(self) -> ee_list.List:
    """Convert a color to HSL.

    Returns:
      An ee.List.
    """
    return apifunction.ApiFunction.call_('Color.toHsl', self)

  def toHsv(self) -> ee_list.List:
    """Convert a color to HSV.

    Returns:
      An ee.List.
    """
    return apifunction.ApiFunction.call_('Color.toHsv', self)

  def toLab(self) -> ee_list.List:
    """Convert a color to CIE-Lab.

    Returns:
      An ee.List.
    """
    return apifunction.ApiFunction.call_('Color.toLab', self)

  def toLch(self) -> ee_list.List:
    """Convert a color to CIE-LCH.

    Returns:
      An ee.List.
    """
    return apifunction.ApiFunction.call_('Color.toLch', self)

  def toRgb(self) -> ee_list.List:
    """Convert a color to RGB.

    Returns:
      An ee.List.
    """
    return apifunction.ApiFunction.call_('Color.toRGB', self)

  def toHexString(self) -> Any:
    """Returns value of a color as an RGBA hex string.

    Returns:
      An ee.String.
    """
    return apifunction.ApiFunction.call_('Color.toHexString', self)
