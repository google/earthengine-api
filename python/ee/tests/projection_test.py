#!/usr/bin/env python3
"""Tests for the ee.Projection module."""

import json
from typing import Any

import unittest
import ee
from ee import apitestcase

CRS = 'crs'
TRANSFORM = 'transform'
TRANSFORM_WKT = 'transformWkt'

PROJECTION = 'Projection'

EPSG_4326 = 'EPSG:4326'
PROJECTION_EPSG_4326 = {
    'functionInvocationValue': {
        'functionName': 'Projection',
        'arguments': {'crs': {'constantValue': EPSG_4326}},
    }
}


def make_expression_graph(
    function_invocation_value: dict[str, Any],
) -> dict[str, Any]:
  return {
      'result': '0',
      'values': {'0': {'functionInvocationValue': function_invocation_value}},
  }


class ProjectionTest(apitestcase.ApiTestCase):

  def test_init(self):
    crs = EPSG_4326
    transform = [1, 2, 3, 4, 5, 6]

    projection = ee.Projection(crs, transform=transform)
    self.assertEqual({'value': 'fakeValue'}, projection.getInfo())

    projection_func = ee.ApiFunction.lookup('Projection')
    self.assertEqual(projection_func, projection.func)
    self.assertFalse(projection.isVariable())
    self.assertEqual({'crs', 'transform'}, set(projection.args))
    self.assertEqual(EPSG_4326, projection.args['crs'])
    expected_transform = {
        'result': '0',
        'values': {'0': {'constantValue': [1, 2, 3, 4, 5, 6]}},
    }
    self.assertEqual(
        expected_transform,
        json.loads(projection.args['transform'].serialize()),
    )

  def test_init_transform_wkt(self):
    crs = EPSG_4326
    transform_wkt = (
        'PARAM_MT["Affine",'
        '  PARAMETER["num_row",3],'
        '  PARAMETER["num_col",3],'
        '  PARAMETER["elt_0_1",1],'
        '  PARAMETER["elt_0_2",2],'
        '  PARAMETER["elt_1_2",3]]'
    )

    projection = ee.Projection(crs, transformWkt=transform_wkt)
    self.assertEqual({'value': 'fakeValue'}, projection.getInfo())

    projection_func = ee.ApiFunction.lookup('Projection')
    self.assertEqual(projection_func, projection.func)
    self.assertEqual({'crs', 'transformWkt'}, set(projection.args))
    self.assertEqual(EPSG_4326, projection.args['crs'])
    expected_transform_wkt = {
        'result': '0',
        'values': {
            '0': {
                'constantValue': (
                    'PARAM_MT["Affine",  PARAMETER["num_row",3], '
                    ' PARAMETER["num_col",3],  PARAMETER["elt_0_1",1], '
                    ' PARAMETER["elt_0_2",2],  PARAMETER["elt_1_2",3]]'
                )
            }
        },
    }
    self.assertEqual(
        expected_transform_wkt,
        json.loads(projection.args['transformWkt'].serialize()),
    )
    projection_func = ee.ApiFunction.lookup('Projection')
    self.assertEqual(projection_func, projection.func)

  def test_serialize(self):
    crs = 'EPSG:32610'
    transform = [1, 2, 3, 4, 5, 6]

    result = json.loads(ee.Projection(crs, transform=transform).serialize())
    expect = {
        'result': '0',
        'values': {
            '0': {
                'functionInvocationValue': {
                    'arguments': {
                        'crs': {'constantValue': crs},
                        'transform': {'constantValue': transform},
                    },
                    'functionName': PROJECTION,
                }
            }
        },
    }
    self.assertEqual(expect, result)

  def test_cast(self):
    crs = 'EPSG:32610'

    projection = ee.Projection(ee.Projection(crs))
    result = json.loads(projection.serialize())
    expect = {
        'result': '0',
        'values': {
            '0': {
                'functionInvocationValue': {
                    'arguments': {
                        'crs': {'constantValue': crs},
                    },
                    'functionName': PROJECTION,
                }
            }
        },
    }
    self.assertEqual(expect, result)

  def test_at_scale(self):
    expect = make_expression_graph({
        'arguments': {
            'projection': PROJECTION_EPSG_4326,
            'meters': {'constantValue': 1},
        },
        'functionName': 'Projection.atScale',
    })
    expression = ee.Projection(EPSG_4326).atScale(1)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Projection(EPSG_4326).atScale(meters=1)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_crs(self):
    expect = make_expression_graph({
        'arguments': {
            'projection': PROJECTION_EPSG_4326,
        },
        'functionName': 'Projection.crs',
    })
    expression = ee.Projection(EPSG_4326).crs()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_nominal_scale(self):
    expect = make_expression_graph({
        'arguments': {
            'proj': PROJECTION_EPSG_4326,
        },
        'functionName': 'Projection.nominalScale',
    })
    expression = ee.Projection(EPSG_4326).nominalScale()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_scale(self):
    expect = make_expression_graph({
        'arguments': {
            'projection': PROJECTION_EPSG_4326,
            'x': {'constantValue': 1},
            'y': {'constantValue': 2},
        },
        'functionName': 'Projection.scale',
    })
    expression = ee.Projection(EPSG_4326).scale(1, 2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Projection(EPSG_4326).scale(x=1, y=2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_transform(self):
    expect = make_expression_graph({
        'arguments': {
            'projection': PROJECTION_EPSG_4326,
        },
        'functionName': 'Projection.transform',
    })
    expression = ee.Projection(EPSG_4326).transform()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_translate(self):
    expect = make_expression_graph({
        'arguments': {
            'projection': PROJECTION_EPSG_4326,
            'x': {'constantValue': 1},
            'y': {'constantValue': 2},
        },
        'functionName': 'Projection.translate',
    })
    expression = ee.Projection(EPSG_4326).translate(1, 2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Projection(EPSG_4326).translate(x=1, y=2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_wkt(self):
    expect = make_expression_graph({
        'arguments': {
            'projection': PROJECTION_EPSG_4326,
        },
        'functionName': 'Projection.wkt',
    })
    expression = ee.Projection(EPSG_4326).wkt()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)


if __name__ == '__main__':
  unittest.main()
