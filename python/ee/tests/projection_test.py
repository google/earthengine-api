#!/usr/bin/env python3
"""Tests for the ee.Projection module."""

import json

import ee
from ee import apitestcase
import unittest

CRS = 'crs'
TRANSFORM = 'transform'
TRANSFORM_WKT = 'transformWkt'

PROJECTION = 'Projection'


class ProjectionTest(apitestcase.ApiTestCase):

  def test_init(self):
    crs = 'EPSG:4326'
    transform = [1, 2, 3, 4, 5, 6]

    projection = ee.Projection(crs, transform=transform)
    self.assertEqual({'value': 'fakeValue'}, projection.getInfo())

    projection_func = ee.ApiFunction.lookup('Projection')
    self.assertEqual(projection_func, projection.func)
    self.assertFalse(projection.isVariable())
    self.assertEqual(set(['crs', 'transform']), set(projection.args))
    self.assertEqual('EPSG:4326', projection.args['crs'])
    expected_transform = {
        'result': '0',
        'values': {'0': {'constantValue': [1, 2, 3, 4, 5, 6]}},
    }
    self.assertEqual(
        expected_transform,
        json.loads(projection.args['transform'].serialize()),
    )

  def test_init_transform_wkt(self):
    crs = 'EPSG:4326'
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
    self.assertEqual(set(['crs', 'transformWkt']), set(projection.args))
    self.assertEqual('EPSG:4326', projection.args['crs'])
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


if __name__ == '__main__':
  unittest.main()
