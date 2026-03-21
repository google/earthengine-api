"""A wrapper for palettes."""
from __future__ import annotations

from typing import Any

from ee import _arg_types
from ee import _utils
from ee import apifunction
from ee import color as ee_color
from ee import computedobject
from ee import ee_exception
from ee import ee_list


class Palette(computedobject.ComputedObject):
  """An object to represent palettes."""

  _initialized = False

  # Tell pytype to not complain about dynamic attributes.
  _HAS_DYNAMIC_ATTRIBUTES = True

  def __init__(
      self,
      colors: Any = None,
      mode: _arg_types.String | None = None,
      min: _arg_types.Number | None = None,
      max: _arg_types.Number | None = None,
      padding: _arg_types.List | None = None,
      classes: _arg_types.List | None = None,
      positions: _arg_types.List | None = None,
      correctLightness: _arg_types.Bool | None = None,
      gamma: _arg_types.Number | None = None,
      bezier: _arg_types.Bool | None = None,
  ):
    """Construct a palette wrapper.

    Args:
      colors: A list of colors or the name of a predefined color palette.
      mode: The colorspace in which to interpolate.
      min: The minimum value of the palette.
      max: The maximum value of the palette.
      padding: Shifts the color range by padding the end of the color scale.
      classes: Create a palette representing discrete classes.
      positions: Set the positions for the colors.
      correctLightness: Correct the color spacing to spread lightness range.
      gamma: A gamma correction for the palette.
      bezier: Sets the palette to use Bezier interpolation.
    """
    self.initialize()

    if isinstance(colors, computedobject.ComputedObject) and all(
        v is None
        for v in [
            mode,
            min,
            max,
            padding,
            classes,
            positions,
            correctLightness,
            gamma,
            bezier,
        ]
    ):
      super().__init__(colors.func, colors.args, colors.varName)
    else:
      super().__init__(
          apifunction.ApiFunction(self.name()),
          {
              'colors': colors,
              'mode': mode if mode is not None else 'RGB',
              'min': min if min is not None else 0.0,
              'max': max if max is not None else 1.0,
              'padding': padding,
              'classes': classes,
              'positions': positions,
              'correctLightness': (
                  correctLightness if correctLightness is not None else False
              ),
              'gamma': gamma if gamma is not None else 1.0,
              'bezier': bezier if bezier is not None else False,
          },
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
    return 'Palette'

  def getColor(self, value: _arg_types.Number) -> ee_color.Color:
    """Returns the color at the given value.

    Args:
      value: The value to look up.

    Returns:
      An ee.Color.
    """
    return apifunction.ApiFunction.call_('Palette.getColor', self, value)

  def getColors(self, nColors: _arg_types.Integer = 0) -> ee_list.List:
    """Get colors from this palette.

    Args:
      nColors: The number of equally spaced colors to retrieve.

    Returns:
      An ee.List of ee.Colors.
    """
    return apifunction.ApiFunction.call_('Palette.getColors', self, nColors)

  def mode(self, mode: _arg_types.String) -> Palette:
    """Set the colorspace interpolation mode.

    Args:
      mode: The colorspace mode.

    Returns:
      An ee.Palette.
    """
    return apifunction.ApiFunction.call_('Palette.mode', self, mode)

  def limits(self, min: _arg_types.Number, max: _arg_types.Number) -> Palette:
    """Set the minimum and maximum limits for the palette.

    Args:
      min: The minimum value.
      max: The maximum value.

    Returns:
      An ee.Palette.
    """
    return apifunction.ApiFunction.call_('Palette.limits', self, min, max)

  def positions(self, positions: _arg_types.List) -> Palette:
    """Set the position for each color in the palette.

    Args:
      positions: A list of values specifying the position for each color.

    Returns:
      An ee.Palette.
    """
    return apifunction.ApiFunction.call_('Palette.positions', self, positions)

  def classes(self, classes: Any) -> Palette:
    """Use discrete classes as opposed to a continuous gradient.

    Args:
      classes: Either a list of class break values, or a single number.

    Returns:
      An ee.Palette.
    """
    return apifunction.ApiFunction.call_('Palette.classes', self, classes)

  def padding(
      self, left: _arg_types.Number, right: _arg_types.Number = None
  ) -> Palette:
    """Shifts the color range by padding the end of the color scale.

    Args:
      left: The left padding.
      right: The right padding.

    Returns:
      An ee.Palette.
    """
    return apifunction.ApiFunction.call_('Palette.padding', self, left, right)

  def gamma(self, gamma: _arg_types.Number) -> Palette:
    """Apply a gamma correction to the palette.

    Args:
      gamma: The gamma value.

    Returns:
      An ee.Palette.
    """
    return apifunction.ApiFunction.call_('Palette.gamma', self, gamma)

  def bezier(self, interpolate: _arg_types.Bool = True) -> Palette:
    """Sets the palette to use bezier interpolation.

    Args:
      interpolate: Whether to use bezier interpolation.

    Returns:
      An ee.Palette.
    """
    return apifunction.ApiFunction.call_('Palette.bezier', self, interpolate)

  def correctLightness(self, correct: _arg_types.Bool = True) -> Palette:
    """Correct the color spacing to spread lightness range evenly.

    Args:
      correct: Whether to correct lightness.

    Returns:
      An ee.Palette.
    """
    return apifunction.ApiFunction.call_(
        'Palette.correctLightness', self, correct
    )
