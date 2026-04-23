"""A wrapper for palettes."""

from __future__ import annotations

from ee import _arg_types
from ee import apifunction
from ee import color
from ee import computedobject
from ee import ee_list


class Palette(computedobject.ComputedObject):
  """A palette."""

  _initialized = False

  # Tell pytype to not complain about dynamic attributes.
  _HAS_DYNAMIC_ATTRIBUTES = True

  def __init__(
      self,
      colors: _arg_types.Palette | None = None,
      mode: _arg_types.String | None = None,
      min: _arg_types.Number | None = None,  # pylint: disable=redefined-builtin
      max: _arg_types.Number | None = None,  # pylint: disable=redefined-builtin
      padding: _arg_types.List | None = None,
      classes: _arg_types.List | None = None,
      positions: _arg_types.List | None = None,
      correctLightness: _arg_types.Bool | None = None,  # pylint: disable=invalid-name
      gamma: _arg_types.Number | None = None,
      bezier: _arg_types.Bool | None = None,
  ):
    """Initializes a palette wrapper.

    Args:
      colors: A list of colors or the name of a predefined color palette.
      mode: The colorspace in which to interpolate. One of 'rgb', 'lrgb', 'hsv',
        'hsl', 'lab', or 'lch'. Defaults to 'rgb'.
      min: The minimum value of the palette. Values less than min will be
        clamped to min.
      max: The maximum value of the palette. Values greater than max will be
        clamped to max.
      padding: Shifts the color range by padding the end of the color scale (a
        percentage 0-1). Positive values reduce the spread of the gradient and
        negative values expand it. If only 1 value is provided, the same padding
        will be applied to both ends.
      classes: Create a palette representing discrete classes instead of a
        continuous gradient. Either a list of class break values, or a single
        number indicating the number of equidistant breaks to generate between
        'min' and 'max'. This option is mutually exclusive with 'positions'.
      positions: Set the positions for the colors. The number of positions must
        exactly match the number of colors in the palette. Resets 'min' and
        'max' to first and last value. This option is mutually exclusive with
        'min'/'max' and 'classes'.
      correctLightness: Correct the color spacing to spread the (Lab) lightness
        range evenly over the range of values. Defaults to False.
      gamma: A gamma correction for the palette. Numbers greater than 1 increase
        lightness. Defaults to 1.0.
      bezier: Sets the palette to use Bezier interpolation. Defaults to False.
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
      return

    args = {}
    if colors is not None:
      args['colors'] = colors
    if mode is not None:
      args['mode'] = mode
    if min is not None:
      args['min'] = min
    if max is not None:
      args['max'] = max
    if padding is not None:
      args['padding'] = padding
    if classes is not None:
      args['classes'] = classes
    if positions is not None:
      args['positions'] = positions
    if correctLightness is not None:
      args['correctLightness'] = correctLightness
    if gamma is not None:
      args['gamma'] = gamma
    if bezier is not None:
      args['bezier'] = bezier
    super().__init__(apifunction.ApiFunction(self.name()), args)

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
    return 'Palette'

  @classmethod
  def Accent(cls) -> Palette:
    """Returns the Colorbrewer named palette: 'Accent'."""
    return apifunction.ApiFunction.call_(cls.name() + '.Accent')

  @classmethod
  def Blues(cls) -> Palette:
    """Returns the Colorbrewer named palette: 'Blues'."""
    return apifunction.ApiFunction.call_(cls.name() + '.Blues')

  @classmethod
  def BrBG(cls) -> Palette:
    """Returns the Colorbrewer named palette: 'BrBG'."""
    return apifunction.ApiFunction.call_(cls.name() + '.BrBG')

  @classmethod
  def BuGn(cls) -> Palette:
    """Returns the Colorbrewer named palette: 'BuGn'."""
    return apifunction.ApiFunction.call_(cls.name() + '.BuGn')

  @classmethod
  def BuPu(cls) -> Palette:
    """Returns the Colorbrewer named palette: 'BuPu'."""
    return apifunction.ApiFunction.call_(cls.name() + '.BuPu')

  @classmethod
  def Cool(cls) -> Palette:
    """Returns the Colorbrewer named palette: 'Cool'."""
    return apifunction.ApiFunction.call_(cls.name() + '.Cool')

  @classmethod
  def Copper(cls) -> Palette:
    """Returns the Colorbrewer named palette: 'Copper'."""
    return apifunction.ApiFunction.call_(cls.name() + '.Copper')

  @classmethod
  def Dark2(cls) -> Palette:
    """Returns the Colorbrewer named palette: 'Dark2'."""
    return apifunction.ApiFunction.call_(cls.name() + '.Dark2')

  @classmethod
  def GnBu(cls) -> Palette:
    """Returns the Colorbrewer named palette: 'GnBu'."""
    return apifunction.ApiFunction.call_(cls.name() + '.GnBu')

  @classmethod
  def Greens(cls) -> Palette:
    """Returns the Colorbrewer named palette: 'Greens'."""
    return apifunction.ApiFunction.call_(cls.name() + '.Greens')

  @classmethod
  def Greys(cls) -> Palette:
    """Returns the Colorbrewer named palette: 'Greys'."""
    return apifunction.ApiFunction.call_(cls.name() + '.Greys')

  @classmethod
  def Hot(cls) -> Palette:
    """Returns the Colorbrewer named palette: 'Hot'."""
    return apifunction.ApiFunction.call_(cls.name() + '.Hot')

  @classmethod
  def Inferno(cls) -> Palette:
    """Returns the Colorbrewer named palette: 'Inferno'."""
    return apifunction.ApiFunction.call_(cls.name() + '.Inferno')

  @classmethod
  def Magma(cls) -> Palette:
    """Returns the Colorbrewer named palette: 'Magma'."""
    return apifunction.ApiFunction.call_(cls.name() + '.Magma')

  @classmethod
  def OrRd(cls) -> Palette:
    """Returns the Colorbrewer named palette: 'OrRd'."""
    return apifunction.ApiFunction.call_(cls.name() + '.OrRd')

  @classmethod
  def Oranges(cls) -> Palette:
    """Returns the Colorbrewer named palette: 'Oranges'."""
    return apifunction.ApiFunction.call_(cls.name() + '.Oranges')

  @classmethod
  def PRGn(cls) -> Palette:
    """Returns the Colorbrewer named palette: 'PRGn'."""
    return apifunction.ApiFunction.call_(cls.name() + '.PRGn')

  @classmethod
  def Paired(cls) -> Palette:
    """Returns the Colorbrewer named palette: 'Paired'."""
    return apifunction.ApiFunction.call_(cls.name() + '.Paired')

  @classmethod
  def Pastel1(cls) -> Palette:
    """Returns the Colorbrewer named palette: 'Pastel1'."""
    return apifunction.ApiFunction.call_(cls.name() + '.Pastel1')

  @classmethod
  def Pastel2(cls) -> Palette:
    """Returns the Colorbrewer named palette: 'Pastel2'."""
    return apifunction.ApiFunction.call_(cls.name() + '.Pastel2')

  @classmethod
  def PiYG(cls) -> Palette:
    """Returns the Colorbrewer named palette: 'PiYG'."""
    return apifunction.ApiFunction.call_(cls.name() + '.PiYG')

  @classmethod
  def Plasma(cls) -> Palette:
    """Returns the Colorbrewer named palette: 'Plasma'."""
    return apifunction.ApiFunction.call_(cls.name() + '.Plasma')

  @classmethod
  def PuBu(cls) -> Palette:
    """Returns the Colorbrewer named palette: 'PuBu'."""
    return apifunction.ApiFunction.call_(cls.name() + '.PuBu')

  @classmethod
  def PuBuGn(cls) -> Palette:
    """Returns the Colorbrewer named palette: 'PuBuGn'."""
    return apifunction.ApiFunction.call_(cls.name() + '.PuBuGn')

  @classmethod
  def PuOr(cls) -> Palette:
    """Returns the Colorbrewer named palette: 'PuOr'."""
    return apifunction.ApiFunction.call_(cls.name() + '.PuOr')

  @classmethod
  def Purples(cls) -> Palette:
    """Returns the Colorbrewer named palette: 'Purples'."""
    return apifunction.ApiFunction.call_(cls.name() + '.Purples')

  @classmethod
  def PuRd(cls) -> Palette:
    """Returns the Colorbrewer named palette: 'PuRd'."""
    return apifunction.ApiFunction.call_(cls.name() + '.PuRd')

  @classmethod
  def RdBu(cls) -> Palette:
    """Returns the Colorbrewer named palette: 'RdBu'."""
    return apifunction.ApiFunction.call_(cls.name() + '.RdBu')

  @classmethod
  def RdPu(cls) -> Palette:
    """Returns the Colorbrewer named palette: 'RdPu'."""
    return apifunction.ApiFunction.call_(cls.name() + '.RdPu')

  @classmethod
  def RdGy(cls) -> Palette:
    """Returns the Colorbrewer named palette: 'RdGy'."""
    return apifunction.ApiFunction.call_(cls.name() + '.RdGy')

  @classmethod
  def RdYlBu(cls) -> Palette:
    """Returns the Colorbrewer named palette: 'RdYlBu'."""
    return apifunction.ApiFunction.call_(cls.name() + '.RdYlBu')

  @classmethod
  def RdYlGn(cls) -> Palette:
    """Returns the Colorbrewer named palette: 'RdYlGn'."""
    return apifunction.ApiFunction.call_(cls.name() + '.RdYlGn')

  @classmethod
  def Reds(cls) -> Palette:
    """Returns the Colorbrewer named palette: 'Reds'."""
    return apifunction.ApiFunction.call_(cls.name() + '.Reds')

  @classmethod
  def Set1(cls) -> Palette:
    """Returns the Colorbrewer named palette: 'Set1'."""
    return apifunction.ApiFunction.call_(cls.name() + '.Set1')

  @classmethod
  def Set2(cls) -> Palette:
    """Returns the Colorbrewer named palette: 'Set2'."""
    return apifunction.ApiFunction.call_(cls.name() + '.Set2')

  @classmethod
  def Set3(cls) -> Palette:
    """Returns the Colorbrewer named palette: 'Set3'."""
    return apifunction.ApiFunction.call_(cls.name() + '.Set3')

  @classmethod
  def Spectral(cls) -> Palette:
    """Returns the Colorbrewer named palette: 'Spectral'."""
    return apifunction.ApiFunction.call_(cls.name() + '.Spectral')

  @classmethod
  def Viridis(cls) -> Palette:
    """Returns the Colorbrewer named palette: 'Viridis'."""
    return apifunction.ApiFunction.call_(cls.name() + '.Viridis')

  @classmethod
  def YlGn(cls) -> Palette:
    """Returns the Colorbrewer named palette: 'YlGn'."""
    return apifunction.ApiFunction.call_(cls.name() + '.YlGn')

  @classmethod
  def YlGnBu(cls) -> Palette:
    """Returns the Colorbrewer named palette: 'YlGnBu'."""
    return apifunction.ApiFunction.call_(cls.name() + '.YlGnBu')

  @classmethod
  def YlOrBr(cls) -> Palette:
    """Returns the Colorbrewer named palette: 'YlOrBr'."""
    return apifunction.ApiFunction.call_(cls.name() + '.YlOrBr')

  @classmethod
  def YlOrRd(cls) -> Palette:
    """Returns the Colorbrewer named palette: 'YlOrRd'."""
    return apifunction.ApiFunction.call_(cls.name() + '.YlOrRd')

  @classmethod
  def cubeHelix(
      cls,
      startHue: _arg_types.Number | None = None,  # pylint: disable=invalid-name
      rotations: _arg_types.Number | None = None,
      saturation: _arg_types.Number | None = None,
      gamma: _arg_types.Number | None = None,
      startLightness: _arg_types.Number | None = None,  # pylint: disable=invalid-name
      endLightness: _arg_types.Number | None = None,  # pylint: disable=invalid-name
      endHue: _arg_types.Number | None = None,  # pylint: disable=invalid-name
  ) -> Palette:
    """Returns a palette using cubehelix interpolation.

    See: D.A. Green 'A colour scheme for the display of astronomical intensity
    images' (http://astron-soc.in/bulletin/11June/289392011.pdf)

    Args:
      startHue: The start hue, normalized [0:1]. Defaults to 0.8.
      rotations: The number of rotations through the hue space. Negative values
        correspond to Blue->Red direction. Defaults to -1.5.
      saturation: The saturation scaling factor. Defaults to 1.0.
      gamma: A gamma correction factor. Values less than 1 emphasize low
        intensity values. Defaults to 1.0.
      startLightness: Controls how light the colors are. Lightness is linearly
        interpolated between startLightness and endLightness. Defaults to 0.0.
      endLightness: Defaults to 1.0.
      endHue: The ending hue. If specified, the distance between (startHue +
        rotations) and endHue will be added to rotations to ensure the last
        color has a hue of endHue.
    """
    return apifunction.ApiFunction.call_(
        cls.name() + '.cubeHelix',
        startHue,
        rotations,
        saturation,
        gamma,
        startLightness,
        endLightness,
        endHue,
    )

  def bezier(self, interpolate: _arg_types.Bool | None = None) -> Palette:
    """Sets the palette to use bezier interpolation.

    Args:
      interpolate: Whether to use bezier interpolation. Defaults to True.

    Returns:
      An ee.Palette.
    """
    return apifunction.ApiFunction.call_(
        self.name() + '.bezier', self, interpolate
    )

  def classes(self, classes: _arg_types.List | _arg_types.Integer) -> Palette:
    """Returns a palette that uses discrete classes instead of a gradient.

    Args:
      classes: Either a list of class break values, or a single number.
    """
    return apifunction.ApiFunction.call_(
        self.name() + '.classes', self, classes
    )

  def correctLightness(self, correct: _arg_types.Bool = True) -> Palette:
    """Corrects the color spacing to spread lightness range evenly.

    Args:
      correct: Whether to correct lightness.

    Returns:
      An ee.Palette.
    """
    return apifunction.ApiFunction.call_(
        self.name() + '.correctLightness', self, correct
    )

  def gamma(self, gamma: _arg_types.Number) -> Palette:
    """Apply a gamma correction to the palette.

    Args:
      gamma: The gamma value.

    Returns:
      An ee.Palette.
    """
    return apifunction.ApiFunction.call_(self.name() + '.gamma', self, gamma)

  def getColor(self, value: _arg_types.Number) -> color.Color:
    """Returns an ee.Color at the given value."""
    return apifunction.ApiFunction.call_(self.name() + '.getColor', self, value)

  def getColors(
      self, nColors: _arg_types.Integer | None = None  # pylint: disable=invalid-name
  ) -> ee_list.List:
    """Returns a list of ee.Colors from this palette.

    Args:
      nColors: The number of equally spaced colors to retrieve. If nColors is 0
        or unspecified, the algorithm returns the entire list of colors used to
        construct the palette.
    """
    return apifunction.ApiFunction.call_(
        self.name() + '.getColors', self, nColors
    )

  def limits(
      self,
      min: _arg_types.Number,  # pylint: disable=redefined-builtin
      max: _arg_types.Number,  # pylint: disable=redefined-builtin
  ) -> Palette:
    """Returns a palette with the minimum and maximum limits set.

    Args:
      min: The minimum value. Values less than min will be clamped to min.
      max: The maximum value. Values greater than max will be clamped to max.
    """
    return apifunction.ApiFunction.call_(
        self.name() + '.limits', self, min, max
    )

  def mode(self, mode: _arg_types.String) -> Palette:
    """Set the colorspace interpolation mode.

    Args:
      mode: The colorspace mode.

    Returns:
      An ee.Palette.
    """
    return apifunction.ApiFunction.call_(self.name() + '.mode', self, mode)

  def padding(
      self, left: _arg_types.Number, right: _arg_types.Number | None = None
  ) -> Palette:
    """Shifts the color range by padding the end of the color scale.

    Args:
      left: The left padding.
      right: The right padding.

    Returns:
      An ee.Palette.
    """
    return apifunction.ApiFunction.call_(
        self.name() + '.padding', self, left, right
    )

  def positions(self, positions: _arg_types.List) -> Palette:
    """Set the position for each color in the palette.

    Args:
      positions: A list of values specifying the position for each color. This
        overrides any value of 'classes', and explicitly sets min/max to the
        first/last position.

    Returns:
      An ee.Palette.
    """
    return apifunction.ApiFunction.call_(
        self.name() + '.positions', self, positions
    )
