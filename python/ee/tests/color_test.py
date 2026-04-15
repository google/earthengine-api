#!/usr/bin/env python3
"""Tests for the ee.Color class."""

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


class ColorTest(apitestcase.ApiTestCase, parameterized.TestCase):

  def test_constructors(self):
    self.assertEqual('Color', ee.Color('red').func.getSignature()['name'])
    self.assertEqual({'input': 'red'}, ee.Color('red').args)

    self.assertEqual('Color', ee.Color([1, 0, 0]).func.getSignature()['name'])
    self.assertEqual({'input': [1, 0, 0]}, ee.Color([1, 0, 0]).args)

    self.assertEqual(
        'Color', ee.Color(input='blue').func.getSignature()['name']
    )
    self.assertEqual({'input': 'blue'}, ee.Color(input='blue').args)

  def test_color_name(self):
    color = 'red'
    expect = make_expression_graph({
        'arguments': {'input': {'constantValue': color}},
        'functionName': 'Color',
    })
    self.assertEqual(expect, json.loads(ee.Color('red').serialize()))
    self.assertEqual(expect, json.loads(ee.Color(input='red').serialize()))

  def test_color_list(self):
    color = [1, 0, 0]
    expect = make_expression_graph({
        'arguments': {'input': {'constantValue': color}},
        'functionName': 'Color',
    })
    self.assertEqual(expect, json.loads(ee.Color([1, 0, 0]).serialize()))

  @parameterized.named_parameters(
      ('Hsl', 'fromHsl', [0.1, 0.2, 0.3], 'hsl'),
      ('Hsv', 'fromHsv', [0.1, 0.2, 0.3], 'hsv'),
      ('Lab', 'fromLab', [10, -20, -30], 'lab'),
      ('Lch', 'fromLch', [40, 120, 350], 'lch'),
  )
  def test_from_color_space(self, method_name, color_value, arg_name):
    expect = make_expression_graph({
        'functionName': 'Color',
        'arguments': {
            'input': {
                'functionInvocationValue': {
                    'functionName': f'Color.{method_name}',
                    'arguments': {arg_name: {'constantValue': color_value}},
                }
            }
        },
    })
    method = getattr(ee.Color, method_name)
    self.assertEqual(expect, json.loads(method(color_value).serialize()))
    self.assertEqual(
        expect,
        json.loads(method(**{arg_name: color_value}).serialize()),
    )

  def test_gray(self):
    value = 0.5
    alpha = 0.8
    expect = make_expression_graph({
        'functionName': 'Color',
        'arguments': {
            'input': {
                'functionInvocationValue': {
                    'functionName': 'Color.gray',
                    'arguments': {
                        'value': {'constantValue': value},
                        'alpha': {'constantValue': alpha},
                    },
                }
            }
        },
    })
    self.assertEqual(
        expect, json.loads(ee.Color.gray(value, alpha).serialize())
    )
    self.assertEqual(
        expect, json.loads(ee.Color.gray(value=value, alpha=alpha).serialize())
    )

  def test_brighter(self):
    color = 'red'
    scale = 0.9
    expect = make_expression_graph({
        'functionName': 'Color',
        'arguments': {
            'input': {
                'functionInvocationValue': {
                    'functionName': 'Color.brighter',
                    'arguments': {
                        'color': {
                            'functionInvocationValue': {
                                'functionName': 'Color',
                                'arguments': {
                                    'input': {'constantValue': 'red'}
                                },
                            }
                        },
                        'scale': {'constantValue': 0.9},
                    },
                }
            }
        },
    })

    self.assertEqual(
        expect, json.loads(ee.Color(color).brighter(scale).serialize())
    )
    self.assertEqual(
        expect, json.loads(ee.Color(color).brighter(scale=scale).serialize())
    )

  def test_darker(self):
    color = 'red'
    scale = 0.1
    expect = make_expression_graph({
        'functionName': 'Color',
        'arguments': {
            'input': {
                'functionInvocationValue': {
                    'functionName': 'Color.darker',
                    'arguments': {
                        'color': {
                            'functionInvocationValue': {
                                'functionName': 'Color',
                                'arguments': {
                                    'input': {'constantValue': 'red'}
                                },
                            }
                        },
                        'scale': {'constantValue': 0.1},
                    },
                }
            }
        },
    })

    self.assertEqual(
        expect, json.loads(ee.Color(color).darker(scale).serialize())
    )
    self.assertEqual(
        expect, json.loads(ee.Color(color).darker(scale=scale).serialize())
    )

  def test_to_mix(self):
    start = 'red'
    end = 'blue'
    ratio = 0.8
    colorspace = 'hsv'

    expect = {
        'result': '0',
        'values': {
            '0': {
                'functionInvocationValue': {
                    'functionName': 'Color',
                    'arguments': {
                        'input': {
                            'functionInvocationValue': {
                                'functionName': 'Color.mix',
                                'arguments': {
                                    'colorspace': {'constantValue': colorspace},
                                    'end': {
                                        'functionInvocationValue': {
                                            'functionName': 'Color',
                                            'arguments': {
                                                'input': {'constantValue': end}
                                            },
                                        }
                                    },
                                    'ratio': {'constantValue': ratio},
                                    'start': {
                                        'functionInvocationValue': {
                                            'functionName': 'Color',
                                            'arguments': {
                                                'input': {
                                                    'constantValue': start
                                                }
                                            },
                                        }
                                    },
                                },
                            }
                        }
                    },
                }
            }
        },
    }

    start_color = ee.Color(start)
    end_color = ee.Color(end)

    self.assertEqual(
        expect,
        json.loads(start_color.mix(end_color, ratio, colorspace).serialize()),
    )
    self.assertEqual(
        expect,
        json.loads(
            ee.Color(start)
            .mix(end=ee.Color(end), ratio=ratio, colorspace=colorspace)
            .serialize()
        ),
    )

  @parameterized.named_parameters(
      ('HexString', 'toHexString'),
      ('Hsl', 'toHsl'),
      ('Hsv', 'toHsv'),
      ('Lab', 'toLab'),
      ('Lch', 'toLch'),
      ('Rgb', 'toRGB'),
  )
  def test_to_color_space(self, method_name):
    color = 'red'
    expect = make_expression_graph({
        'functionName': f'Color.{method_name}',
        'arguments': {
            'color': {
                'functionInvocationValue': {
                    'functionName': 'Color',
                    'arguments': {'input': {'constantValue': color}},
                }
            }
        },
    })

    color_obj = ee.Color(color)
    method = getattr(color_obj, method_name)
    self.assertEqual(expect, json.loads(method().serialize()))


if __name__ == '__main__':
  unittest.main()
