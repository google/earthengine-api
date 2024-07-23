#!/usr/bin/env python3
"""Tests for the ee.Kernel module."""

import json
import sys
from typing import Any, Dict
import unittest

import unittest
import ee
from ee import apitestcase


_KERNEL_JSON = {
    'result': '0',
    'values': {
        '0': {
            'functionInvocationValue': {
                'functionName': 'Kernel.square',
                'arguments': {
                    'magnitude': {'constantValue': 2},
                    'normalize': {'constantValue': True},
                    'radius': {'constantValue': 1},
                    'units': {'constantValue': 'pixels'},
                },
            }
        }
    },
}


def make_expression_graph(
    function_invocation_value: Dict[str, Any],
) -> Dict[str, Any]:
  return {
      'result': '0',
      'values': {'0': {'functionInvocationValue': function_invocation_value}},
  }


class KernelTest(apitestcase.ApiTestCase):

  def test_square_args(self):
    kernel = ee.Kernel.square(1, 'pixels', True, 2)
    self.assertEqual({'value': 'fakeValue'}, kernel.getInfo())

    square_func = ee.ApiFunction.lookup('Kernel.square')
    self.assertEqual(square_func, kernel.func)
    self.assertFalse(kernel.isVariable())

    result = json.loads(kernel.serialize())
    self.assertEqual(_KERNEL_JSON, result)

  def test_square_kwargs(self):
    kernel = ee.Kernel.square(
        radius=1, units='pixels', normalize=True, magnitude=2
    )
    result = json.loads(kernel.serialize())
    self.assertEqual(_KERNEL_JSON, result)

  def test_cast(self):
    kernel = ee.Kernel(ee.Kernel.square(1, 'pixels', True, 2))
    result = json.loads(kernel.serialize())
    self.assertEqual(_KERNEL_JSON, result)

  @unittest.skipIf(sys.version_info < (3, 10), 'Unsupported in Python <= 3.9')
  def test_no_args(self):
    message = (
        r'Kernel\.__init__\(\) missing 1 required positional argument:'
        r' \'kernel\''
    )
    with self.assertRaisesRegex(TypeError, message):
      ee.Kernel()  # pytype:disable=missing-parameter

  def test_wrong_type(self):
    message = (
        r'Kernel can only be used as a cast to Kernel\. Found <class'
        r' \'int\'>'
    )
    with self.assertRaisesRegex(TypeError, message):
      ee.Kernel(1234)  # pytype:disable=wrong-arg-types

  def test_add(self):
    kernel1 = ee.Kernel.kirsch(1.1, True)
    kernel2 = ee.Kernel.prewitt(2.2, False)
    normalize = True
    expect = make_expression_graph({
        'arguments': {
            'kernel1': {
                'functionInvocationValue': {
                    'functionName': 'Kernel.kirsch',
                    'arguments': {
                        'magnitude': {'constantValue': 1.1},
                        'normalize': {'constantValue': True},
                    },
                }
            },
            'kernel2': {
                'functionInvocationValue': {
                    'functionName': 'Kernel.prewitt',
                    'arguments': {
                        'magnitude': {'constantValue': 2.2},
                        'normalize': {'constantValue': False},
                    },
                }
            },
            'normalize': {'constantValue': normalize},
        },
        'functionName': 'Kernel.add',
    })
    expression = kernel1.add(kernel2, normalize)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = kernel1.add(kernel2=kernel2, normalize=normalize)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_chebyshev(self):
    radius = 1.1
    units = 'pixels'
    normalize = True
    magnitude = 2.2
    expect = make_expression_graph({
        'arguments': {
            'radius': {'constantValue': radius},
            'units': {'constantValue': units},
            'normalize': {'constantValue': normalize},
            'magnitude': {'constantValue': magnitude},
        },
        'functionName': 'Kernel.chebyshev',
    })
    expression = ee.Kernel.chebyshev(radius, units, normalize, magnitude)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Kernel.chebyshev(
        radius=radius, units=units, normalize=normalize, magnitude=magnitude
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_circle(self):
    radius = 1.1
    units = 'meters'
    normalize = False
    magnitude = 2.2
    expect = make_expression_graph({
        'arguments': {
            'radius': {'constantValue': radius},
            'units': {'constantValue': units},
            'normalize': {'constantValue': normalize},
            'magnitude': {'constantValue': magnitude},
        },
        'functionName': 'Kernel.circle',
    })
    expression = ee.Kernel.circle(radius, units, normalize, magnitude)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Kernel.circle(
        radius=radius, units=units, normalize=normalize, magnitude=magnitude
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_compass(self):
    magnitude = 1.1
    normalize = True
    expect = make_expression_graph({
        'arguments': {
            'magnitude': {'constantValue': magnitude},
            'normalize': {'constantValue': normalize},
        },
        'functionName': 'Kernel.compass',
    })
    expression = ee.Kernel.compass(magnitude, normalize)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Kernel.compass(magnitude=magnitude, normalize=normalize)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_cross(self):
    radius = 1.1
    units = 'pixels'
    normalize = False
    magnitude = 2.2
    expect = make_expression_graph({
        'arguments': {
            'radius': {'constantValue': radius},
            'units': {'constantValue': units},
            'normalize': {'constantValue': normalize},
            'magnitude': {'constantValue': magnitude},
        },
        'functionName': 'Kernel.cross',
    })
    expression = ee.Kernel.cross(radius, units, normalize, magnitude)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Kernel.cross(
        radius=radius, units=units, normalize=normalize, magnitude=magnitude
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_diamond(self):
    radius = 1.1
    units = 'meters'
    normalize = True
    magnitude = 2.2
    expect = make_expression_graph({
        'arguments': {
            'radius': {'constantValue': radius},
            'units': {'constantValue': units},
            'normalize': {'constantValue': normalize},
            'magnitude': {'constantValue': magnitude},
        },
        'functionName': 'Kernel.diamond',
    })
    expression = ee.Kernel.diamond(radius, units, normalize, magnitude)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Kernel.diamond(
        radius=radius, units=units, normalize=normalize, magnitude=magnitude
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_euclidean(self):
    radius = 1.1
    units = 'pixels'
    normalize = False
    magnitude = 2.2
    expect = make_expression_graph({
        'arguments': {
            'radius': {'constantValue': radius},
            'units': {'constantValue': units},
            'normalize': {'constantValue': normalize},
            'magnitude': {'constantValue': magnitude},
        },
        'functionName': 'Kernel.euclidean',
    })
    expression = ee.Kernel.euclidean(radius, units, normalize, magnitude)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Kernel.euclidean(
        radius=radius, units=units, normalize=normalize, magnitude=magnitude
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_fixed(self):
    width = 1
    height = 2
    weights = [[3, 4]]
    x = 5
    y = 6
    normalize = True
    expect = make_expression_graph({
        'arguments': {
            'width': {'constantValue': width},
            'height': {'constantValue': height},
            'weights': {'constantValue': weights},
            'x': {'constantValue': x},
            'y': {'constantValue': y},
            'normalize': {'constantValue': normalize},
        },
        'functionName': 'Kernel.fixed',
    })
    expression = ee.Kernel.fixed(width, height, weights, x, y, normalize)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Kernel.fixed(
        width=width,
        height=height,
        weights=weights,
        x=x,
        y=y,
        normalize=normalize,
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_gaussian(self):
    radius = 1.1
    sigma = 2.2
    units = 'meters'
    normalize = False
    magnitude = 3.3
    expect = make_expression_graph({
        'arguments': {
            'radius': {'constantValue': radius},
            'sigma': {'constantValue': sigma},
            'units': {'constantValue': units},
            'normalize': {'constantValue': normalize},
            'magnitude': {'constantValue': magnitude},
        },
        'functionName': 'Kernel.gaussian',
    })
    expression = ee.Kernel.gaussian(radius, sigma, units, normalize, magnitude)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Kernel.gaussian(
        radius=radius,
        sigma=sigma,
        units=units,
        normalize=normalize,
        magnitude=magnitude,
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_inverse(self):
    kernel = ee.Kernel.kirsch(1.1, True)
    expect = make_expression_graph({
        'arguments': {
            'kernel': {
                'functionInvocationValue': {
                    'functionName': 'Kernel.kirsch',
                    'arguments': {
                        'magnitude': {'constantValue': 1.1},
                        'normalize': {'constantValue': True},
                    },
                }
            }
        },
        'functionName': 'Kernel.inverse',
    })
    expression = kernel.inverse()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_kirsch(self):
    magnitude = 1.1
    normalize = False
    expect = make_expression_graph({
        'arguments': {
            'magnitude': {'constantValue': magnitude},
            'normalize': {'constantValue': normalize},
        },
        'functionName': 'Kernel.kirsch',
    })
    expression = ee.Kernel.kirsch(magnitude, normalize)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Kernel.kirsch(magnitude=magnitude, normalize=normalize)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_laplacian4(self):
    magnitude = 1.1
    normalize = True
    expect = make_expression_graph({
        'arguments': {
            'magnitude': {'constantValue': magnitude},
            'normalize': {'constantValue': normalize},
        },
        'functionName': 'Kernel.laplacian4',
    })
    expression = ee.Kernel.laplacian4(magnitude, normalize)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Kernel.laplacian4(magnitude=magnitude, normalize=normalize)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_laplacian8(self):
    magnitude = 1.1
    normalize = False
    expect = make_expression_graph({
        'arguments': {
            'magnitude': {'constantValue': magnitude},
            'normalize': {'constantValue': normalize},
        },
        'functionName': 'Kernel.laplacian8',
    })
    expression = ee.Kernel.laplacian8(magnitude, normalize)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Kernel.laplacian8(magnitude=magnitude, normalize=normalize)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_manhattan(self):
    radius = 1.1
    units = 'meters'
    normalize = True
    magnitude = 2.2
    expect = make_expression_graph({
        'arguments': {
            'radius': {'constantValue': radius},
            'units': {'constantValue': units},
            'normalize': {'constantValue': normalize},
            'magnitude': {'constantValue': magnitude},
        },
        'functionName': 'Kernel.manhattan',
    })
    expression = ee.Kernel.manhattan(radius, units, normalize, magnitude)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Kernel.manhattan(
        radius=radius, units=units, normalize=normalize, magnitude=magnitude
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_octagon(self):
    radius = 1.1
    units = 'meters'
    normalize = False
    magnitude = 2.2
    expect = make_expression_graph({
        'arguments': {
            'radius': {'constantValue': radius},
            'units': {'constantValue': units},
            'normalize': {'constantValue': normalize},
            'magnitude': {'constantValue': magnitude},
        },
        'functionName': 'Kernel.octagon',
    })
    expression = ee.Kernel.octagon(radius, units, normalize, magnitude)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Kernel.octagon(
        radius=radius, units=units, normalize=normalize, magnitude=magnitude
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_plus(self):
    radius = 1.1
    units = 'pixels'
    normalize = False
    magnitude = 2.2
    expect = make_expression_graph({
        'arguments': {
            'radius': {'constantValue': radius},
            'units': {'constantValue': units},
            'normalize': {'constantValue': normalize},
            'magnitude': {'constantValue': magnitude},
        },
        'functionName': 'Kernel.plus',
    })
    expression = ee.Kernel.plus(radius, units, normalize, magnitude)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Kernel.plus(
        radius=radius, units=units, normalize=normalize, magnitude=magnitude
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_prewitt(self):
    magnitude = 1.1
    normalize = True
    expect = make_expression_graph({
        'arguments': {
            'magnitude': {'constantValue': magnitude},
            'normalize': {'constantValue': normalize},
        },
        'functionName': 'Kernel.prewitt',
    })
    expression = ee.Kernel.prewitt(magnitude, normalize)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Kernel.prewitt(magnitude=magnitude, normalize=normalize)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_rectangle(self):
    x_radius = 1.1
    y_radius = 2.2
    units = 'meters'
    normalize = True
    magnitude = 3.3
    expect = make_expression_graph({
        'arguments': {
            'xRadius': {'constantValue': x_radius},
            'yRadius': {'constantValue': y_radius},
            'units': {'constantValue': units},
            'normalize': {'constantValue': normalize},
            'magnitude': {'constantValue': magnitude},
        },
        'functionName': 'Kernel.rectangle',
    })
    expression = ee.Kernel.rectangle(
        x_radius, y_radius, units, normalize, magnitude
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Kernel.rectangle(
        xRadius=x_radius,
        yRadius=y_radius,
        units=units,
        normalize=normalize,
        magnitude=magnitude,
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_roberts(self):
    magnitude = 1.1
    normalize = True
    expect = make_expression_graph({
        'arguments': {
            'magnitude': {'constantValue': magnitude},
            'normalize': {'constantValue': normalize},
        },
        'functionName': 'Kernel.roberts',
    })
    expression = ee.Kernel.roberts(magnitude, normalize)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Kernel.roberts(magnitude=magnitude, normalize=normalize)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_rotate(self):
    kernel = ee.Kernel.kirsch(1.1, True)
    rotations = 2
    expect = make_expression_graph({
        'arguments': {
            'kernel': {
                'functionInvocationValue': {
                    'functionName': 'Kernel.kirsch',
                    'arguments': {
                        'magnitude': {'constantValue': 1.1},
                        'normalize': {'constantValue': True},
                    },
                }
            },
            'rotations': {'constantValue': rotations},
        },
        'functionName': 'Kernel.rotate',
    })
    expression = kernel.rotate(rotations)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = kernel.rotate(rotations=rotations)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_sobel(self):
    magnitude = 1.1
    normalize = True
    expect = make_expression_graph({
        'arguments': {
            'magnitude': {'constantValue': magnitude},
            'normalize': {'constantValue': normalize},
        },
        'functionName': 'Kernel.sobel',
    })
    expression = ee.Kernel.sobel(magnitude, normalize)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Kernel.sobel(magnitude=magnitude, normalize=normalize)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_square(self):
    radius = 1.1
    units = 'meters'
    normalize = True
    magnitude = 2.2
    expect = make_expression_graph({
        'arguments': {
            'radius': {'constantValue': radius},
            'units': {'constantValue': units},
            'normalize': {'constantValue': normalize},
            'magnitude': {'constantValue': magnitude},
        },
        'functionName': 'Kernel.square',
    })
    expression = ee.Kernel.square(radius, units, normalize, magnitude)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Kernel.square(
        radius=radius, units=units, normalize=normalize, magnitude=magnitude
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)


if __name__ == '__main__':
  unittest.main()
