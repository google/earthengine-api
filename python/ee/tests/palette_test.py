#!/usr/bin/env python3
"""Tests for the ee.Palette class."""

import json
from typing import Any

from absl.testing import parameterized

import unittest
import ee
from ee import apitestcase


def make_expression_graph(
    function_invocation_value: dict[str, Any],
) -> dict[str, Any]:
  return {
      'result': '0',
      'values': {'0': {'functionInvocationValue': function_invocation_value}},
  }


class PaletteTest(apitestcase.ApiTestCase, parameterized.TestCase):

  def test_constructor_empty(self):
    expect = make_expression_graph({
        'functionName': 'Palette',
        'arguments': {},
    })
    self.assertEqual(expect, json.loads(ee.Palette().serialize()))

  def test_constructor_palette_name(self):
    name = 'spectral'
    expect = make_expression_graph({
        'functionName': 'Palette',
        'arguments': {'colors': {'constantValue': name}},
    })
    self.assertEqual(expect, json.loads(ee.Palette(name).serialize()))
    self.assertEqual(expect, json.loads(ee.Palette(colors=name).serialize()))

  def test_constructor_colors(self):
    colors = ['red', 'blue']
    expect = make_expression_graph({
        'functionName': 'Palette',
        'arguments': {'colors': {'constantValue': colors}},
    })
    self.assertEqual(expect, json.loads(ee.Palette(colors).serialize()))
    self.assertEqual(expect, json.loads(ee.Palette(colors=colors).serialize()))

  def test_constructor_colors_hex(self):
    colors = ['#FFFFFFFF', '#00FF00FF', '#000000FF']
    expect = make_expression_graph({
        'functionName': 'Palette',
        'arguments': {'colors': {'constantValue': colors}},
    })
    self.assertEqual(expect, json.loads(ee.Palette(colors).serialize()))
    self.assertEqual(expect, json.loads(ee.Palette(colors=colors).serialize()))

  def test_constructor_mode(self):
    mode = 'hsv'
    colors = ['lightgoldenrodyellow', 'lightsalmon']
    expect = make_expression_graph({
        'functionName': 'Palette',
        'arguments': {
            'colors': {'constantValue': colors},
            'mode': {'constantValue': mode},
        },
    })
    self.assertEqual(expect, json.loads(ee.Palette(colors, mode).serialize()))
    self.assertEqual(
        expect, json.loads(ee.Palette(colors=colors, mode=mode).serialize())
    )

  def test_constructor_min_max(self):
    minimum = 1
    maximum = 2
    colors = ['lavenderblush', 'lemonchiffon']
    expect = make_expression_graph({
        'functionName': 'Palette',
        'arguments': {
            'colors': {'constantValue': colors},
            'min': {'constantValue': minimum},
            'max': {'constantValue': maximum},
        },
    })
    self.assertEqual(
        expect,
        json.loads(ee.Palette(colors, None, minimum, maximum).serialize()),
    )
    self.assertEqual(
        expect,
        json.loads(
            ee.Palette(colors=colors, min=minimum, max=maximum).serialize()
        ),
    )

  @parameterized.parameters(
      [[0.1]],
      [[0.2, 0.3]],
  )
  def test_constructor_padding(self, padding):
    colors = ['lightsteelblue', 'mistyrose']
    expect = make_expression_graph({
        'functionName': 'Palette',
        'arguments': {
            'colors': {'constantValue': colors},
            'padding': {'constantValue': padding},
        },
    })
    self.assertEqual(
        expect,
        json.loads(ee.Palette(colors, None, None, None, padding).serialize()),
    )
    self.assertEqual(
        expect,
        json.loads(ee.Palette(colors=colors, padding=padding).serialize()),
    )

  @parameterized.parameters(
      [[3]],
      [[0.1, 0.2, 0.3]],
  )
  def test_constructor_classes(self, classes):
    colors = ['firebrick', 'gainsboro']
    expect = make_expression_graph({
        'functionName': 'Palette',
        'arguments': {
            'colors': {'constantValue': colors},
            'classes': {'constantValue': classes},
        },
    })
    self.assertEqual(
        expect,
        json.loads(
            ee.Palette(colors, None, None, None, None, classes).serialize()
        ),
    )
    self.assertEqual(
        expect,
        json.loads(ee.Palette(colors=colors, classes=classes).serialize()),
    )

  def test_constructor_positions(self):
    colors = ['papayawhip', 'peachpuff']
    positions = [2, 1]
    expect = make_expression_graph({
        'functionName': 'Palette',
        'arguments': {
            'colors': {'constantValue': colors},
            'positions': {'constantValue': positions},
        },
    })
    self.assertEqual(
        expect,
        json.loads(
            ee.Palette(
                colors, None, None, None, None, None, positions
            ).serialize()
        ),
    )
    self.assertEqual(
        expect,
        json.loads(ee.Palette(colors=colors, positions=positions).serialize()),
    )

  def test_constructor_correct_lightness(self):
    colors = ['crimson', 'deepskyblue']
    correct_lightness = True
    expect = make_expression_graph({
        'functionName': 'Palette',
        'arguments': {
            'colors': {'constantValue': colors},
            'correctLightness': {'constantValue': correct_lightness},
        },
    })
    self.assertEqual(
        expect,
        json.loads(
            ee.Palette(
                colors, None, None, None, None, None, None, correct_lightness
            ).serialize()
        ),
    )
    self.assertEqual(
        expect,
        json.loads(
            ee.Palette(
                colors=colors, correctLightness=correct_lightness
            ).serialize()
        ),
    )

  def test_constructor_gamma(self):
    colors = ['cadetblue', 'cornflowerblue']
    gamma = 2.1
    expect = make_expression_graph({
        'functionName': 'Palette',
        'arguments': {
            'colors': {'constantValue': colors},
            'gamma': {'constantValue': gamma},
        },
    })
    self.assertEqual(
        expect,
        json.loads(
            ee.Palette(
                colors, None, None, None, None, None, None, None, gamma
            ).serialize()
        ),
    )
    self.assertEqual(
        expect, json.loads(ee.Palette(colors=colors, gamma=gamma).serialize())
    )

  def test_constructor_bezier(self):
    colors = ['aliceblue', 'blanchedalmond']
    bezier = True
    expect = make_expression_graph({
        'functionName': 'Palette',
        'arguments': {
            'colors': {'constantValue': colors},
            'bezier': {'constantValue': bezier},
        },
    })
    self.assertEqual(
        expect,
        json.loads(
            ee.Palette(
                colors, None, None, None, None, None, None, None, None, bezier
            ).serialize()
        ),
    )
    self.assertEqual(
        expect, json.loads(ee.Palette(colors=colors, bezier=bezier).serialize())
    )

  @parameterized.parameters(
      'Accent',
      'Blues',
      'BrBG',
      'BuGn',
      'BuPu',
      'Cool',
      'Copper',
      'Dark2',
      'GnBu',
      'Greens',
      'Greys',
      'Hot',
      'Inferno',
      'Magma',
      'OrRd',
      'Oranges',
      'PRGn',
      'Paired',
      'Pastel1',
      'Pastel2',
      'PiYG',
      'Plasma',
      'PuBu',
      'PuBuGn',
      'PuOr',
      'PuRd',
      'Purples',
      'RdBu',
      'RdGy',
      'RdPu',
      'RdYlBu',
      'RdYlGn',
      'Reds',
      'Set1',
      'Set2',
      'Set3',
      'Spectral',
      'Viridis',
      'YlGn',
      'YlGnBu',
      'YlOrBr',
      'YlOrRd',
  )
  def test_palette(self, palette_name):
    palette_func = getattr(ee.Palette, palette_name)
    expect = make_expression_graph({
        'functionName': 'Palette',
        'arguments': {
            'colors': {
                'functionInvocationValue': {
                    'functionName': f'Palette.{palette_name}',
                    'arguments': {},
                }
            }
        },
    })

    palette = palette_func()
    self.assertEqual(expect, json.loads(palette.serialize()))

  def test_cube_helix_default(self):
    expect = make_expression_graph({
        'functionName': 'Palette',
        'arguments': {
            'colors': {
                'functionInvocationValue': {
                    'functionName': 'Palette.cubeHelix',
                    'arguments': {},
                }
            }
        },
    })
    self.assertEqual(expect, json.loads(ee.Palette.cubeHelix().serialize()))

  def test_cube_helix(self):
    start_hue = 0.5
    rotations = 1.0
    saturation = 2.0
    gamma = 1.5
    start_lightness = 0.1
    end_lightness = 0.9
    end_hue = 0.8
    expect = make_expression_graph({
        'functionName': 'Palette',
        'arguments': {
            'colors': {
                'functionInvocationValue': {
                    'functionName': 'Palette.cubeHelix',
                    'arguments': {
                        'startHue': {'constantValue': start_hue},
                        'rotations': {'constantValue': rotations},
                        'saturation': {'constantValue': saturation},
                        'gamma': {'constantValue': gamma},
                        'startLightness': {'constantValue': start_lightness},
                        'endLightness': {'constantValue': end_lightness},
                        'endHue': {'constantValue': end_hue},
                    },
                }
            }
        },
    })
    palette = ee.Palette.cubeHelix(
        start_hue,
        rotations,
        saturation,
        gamma,
        start_lightness,
        end_lightness,
        end_hue,
    )
    self.assertEqual(expect, json.loads(palette.serialize()))

    palette = ee.Palette.cubeHelix(
        startHue=start_hue,
        rotations=rotations,
        saturation=saturation,
        gamma=gamma,
        startLightness=start_lightness,
        endLightness=end_lightness,
        endHue=end_hue,
    )
    self.assertEqual(expect, json.loads(palette.serialize()))

  def test_bezier_default(self):
    expect = make_expression_graph({
        'functionName': 'Palette',
        'arguments': {
            'colors': {
                'functionInvocationValue': {
                    'functionName': 'Palette.bezier',
                    'arguments': {
                        'palette': {
                            'functionInvocationValue': {
                                'functionName': 'Palette',
                                'arguments': {},
                            }
                        }
                    },
                }
            }
        },
    })

    palette = ee.Palette().bezier()
    self.assertEqual(expect, json.loads(palette.serialize()))

  def test_bezier(self):
    interpolate = False
    expect = make_expression_graph({
        'functionName': 'Palette',
        'arguments': {
            'colors': {
                'functionInvocationValue': {
                    'functionName': 'Palette.bezier',
                    'arguments': {
                        'interpolate': {'constantValue': interpolate},
                        'palette': {
                            'functionInvocationValue': {
                                'functionName': 'Palette',
                                'arguments': {},
                            }
                        },
                    },
                }
            }
        },
    })

    palette = ee.Palette().bezier(interpolate)
    self.assertEqual(expect, json.loads(palette.serialize()))

    palette = ee.Palette().bezier(interpolate=interpolate)
    self.assertEqual(expect, json.loads(palette.serialize()))

  def test_classes(self):
    classes = [3]
    expect = make_expression_graph({
        'functionName': 'Palette',
        'arguments': {
            'colors': {
                'functionInvocationValue': {
                    'functionName': 'Palette.classes',
                    'arguments': {
                        'classes': {'constantValue': classes},
                        'palette': {
                            'functionInvocationValue': {
                                'functionName': 'Palette',
                                'arguments': {},
                            }
                        },
                    },
                }
            }
        },
    })

    palette = ee.Palette().classes(classes)
    self.assertEqual(expect, json.loads(palette.serialize()))

    palette = ee.Palette().classes(classes=classes)
    self.assertEqual(expect, json.loads(palette.serialize()))

  def test_correct_lightness(self):
    correct_lightness = True
    expect = make_expression_graph({
        'functionName': 'Palette',
        'arguments': {
            'colors': {
                'functionInvocationValue': {
                    'functionName': 'Palette.correctLightness',
                    'arguments': {
                        'correct': {'constantValue': correct_lightness},
                        'palette': {
                            'functionInvocationValue': {
                                'functionName': 'Palette',
                                'arguments': {},
                            }
                        },
                    },
                }
            }
        },
    })

    palette = ee.Palette().correctLightness(correct_lightness)
    self.assertEqual(expect, json.loads(palette.serialize()))

    palette = ee.Palette().correctLightness(correct=correct_lightness)
    self.assertEqual(expect, json.loads(palette.serialize()))

  def test_gamma(self):
    gamma = 2.1
    expect = make_expression_graph({
        'functionName': 'Palette',
        'arguments': {
            'colors': {
                'functionInvocationValue': {
                    'functionName': 'Palette.gamma',
                    'arguments': {
                        'gamma': {'constantValue': gamma},
                        'palette': {
                            'functionInvocationValue': {
                                'functionName': 'Palette',
                                'arguments': {},
                            }
                        },
                    },
                }
            }
        },
    })

    palette = ee.Palette().gamma(gamma)
    self.assertEqual(expect, json.loads(palette.serialize()))

    palette = ee.Palette().gamma(gamma=gamma)
    self.assertEqual(expect, json.loads(palette.serialize()))

  def test_get_color(self):
    value = 0.5
    expect = make_expression_graph({
        'functionName': 'Palette.getColor',
        'arguments': {
            'palette': {
                'functionInvocationValue': {
                    'functionName': 'Palette',
                    'arguments': {},
                }
            },
            'value': {'constantValue': value},
        },
    })

    palette = ee.Palette().getColor(value)
    self.assertEqual(expect, json.loads(palette.serialize()))

    palette = ee.Palette().getColor(value=value)
    self.assertEqual(expect, json.loads(palette.serialize()))

  def test_get_colors(self):
    n_colors = 5
    expect = make_expression_graph({
        'functionName': 'Palette.getColors',
        'arguments': {
            'nColors': {'constantValue': n_colors},
            'palette': {
                'functionInvocationValue': {
                    'functionName': 'Palette',
                    'arguments': {},
                }
            },
        },
    })

    palette = ee.Palette().getColors(n_colors)
    self.assertEqual(expect, json.loads(palette.serialize()))

    palette = ee.Palette().getColors(nColors=n_colors)
    self.assertEqual(expect, json.loads(palette.serialize()))

  def test_limits(self):
    minimum = 0.1
    maximum = 2.3
    expect = make_expression_graph({
        'functionName': 'Palette',
        'arguments': {
            'colors': {
                'functionInvocationValue': {
                    'functionName': 'Palette.limits',
                    'arguments': {
                        'max': {'constantValue': maximum},
                        'min': {'constantValue': minimum},
                        'palette': {
                            'functionInvocationValue': {
                                'functionName': 'Palette',
                                'arguments': {},
                            }
                        },
                    },
                }
            }
        },
    })
    palette = ee.Palette().limits(minimum, maximum)
    self.assertEqual(expect, json.loads(palette.serialize()))

    palette = ee.Palette().limits(min=minimum, max=maximum)
    self.assertEqual(expect, json.loads(palette.serialize()))

  def test_mode(self):
    mode = 'HSL'
    expect = make_expression_graph({
        'functionName': 'Palette',
        'arguments': {
            'colors': {
                'functionInvocationValue': {
                    'functionName': 'Palette.mode',
                    'arguments': {
                        'mode': {'constantValue': mode},
                        'palette': {
                            'functionInvocationValue': {
                                'functionName': 'Palette',
                                'arguments': {},
                            }
                        },
                    },
                }
            }
        },
    })

    palette = ee.Palette().mode(mode)
    self.assertEqual(expect, json.loads(palette.serialize()))

    palette = ee.Palette().mode(mode=mode)
    self.assertEqual(expect, json.loads(palette.serialize()))

  def test_padding_default(self):
    left = 0.1
    expect = make_expression_graph({
        'functionName': 'Palette',
        'arguments': {
            'colors': {
                'functionInvocationValue': {
                    'functionName': 'Palette.padding',
                    'arguments': {
                        'left': {'constantValue': left},
                        'palette': {
                            'functionInvocationValue': {
                                'functionName': 'Palette',
                                'arguments': {},
                            }
                        },
                    },
                }
            }
        },
    })
    palette = ee.Palette().padding(left)
    self.assertEqual(expect, json.loads(palette.serialize()))

    palette = ee.Palette().padding(left=left)
    self.assertEqual(expect, json.loads(palette.serialize()))

  def test_padding(self):
    left = 0.1
    right = 0.2
    expect = make_expression_graph({
        'functionName': 'Palette',
        'arguments': {
            'colors': {
                'functionInvocationValue': {
                    'functionName': 'Palette.padding',
                    'arguments': {
                        'left': {'constantValue': left},
                        'right': {'constantValue': right},
                        'palette': {
                            'functionInvocationValue': {
                                'functionName': 'Palette',
                                'arguments': {},
                            }
                        },
                    },
                }
            }
        },
    })
    palette = ee.Palette().padding(left, right)
    self.assertEqual(expect, json.loads(palette.serialize()))

    palette = ee.Palette().padding(left=left, right=right)
    self.assertEqual(expect, json.loads(palette.serialize()))

  def test_positions(self):
    positions = [0, 1]
    expect = make_expression_graph({
        'functionName': 'Palette',
        'arguments': {
            'colors': {
                'functionInvocationValue': {
                    'functionName': 'Palette.positions',
                    'arguments': {
                        'positions': {'constantValue': positions},
                        'palette': {
                            'functionInvocationValue': {
                                'functionName': 'Palette',
                                'arguments': {},
                            }
                        },
                    },
                }
            }
        },
    })

    palette = ee.Palette().positions(positions)
    self.assertEqual(expect, json.loads(palette.serialize()))

    palette = ee.Palette().positions(positions=positions)
    self.assertEqual(expect, json.loads(palette.serialize()))


if __name__ == '__main__':
  unittest.main()
