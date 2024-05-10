#!/usr/bin/env python3
"""Test for the ee.feature module."""

import json
from typing import Any, Dict
from unittest import mock

import unittest
import ee
from ee import apitestcase


EPSG_4326 = 'EPSG:4326'

MAX_ERROR_GRAPH = {
    'functionInvocationValue': {
        'functionName': 'ErrorMargin',
        'arguments': {'value': {'constantValue': 10}},
    }
}
PROJ_GRAPH = {
    'functionInvocationValue': {
        'functionName': 'Projection',
        'arguments': {'crs': {'constantValue': EPSG_4326}},
    }
}
FEATURE_NONE_GRAPH = {
    'functionInvocationValue': {
        'functionName': 'Feature',
        'arguments': {},
    }
}


def right_maxerror_proj(function_name: str) -> Dict[str, Any]:
  return {
      'result': '0',
      'values': {
          '1': FEATURE_NONE_GRAPH,
          '0': {
              'functionInvocationValue': {
                  'arguments': {
                      'left': {'valueReference': '1'},
                      'right': {'valueReference': '1'},
                      'maxError': MAX_ERROR_GRAPH,
                      'proj': PROJ_GRAPH,
                  },
                  'functionName': 'Feature.' + function_name,
              }
          },
      },
  }


def make_expression_graph(
    function_invocation_value: Dict[str, Any],
) -> Dict[str, Any]:
  return {
      'result': '0',
      'values': {'0': {'functionInvocationValue': function_invocation_value}},
  }


class FeatureTest(apitestcase.ApiTestCase):

  def testConstructors(self):
    """Verifies that constructors understand valid parameters."""
    point = ee.Geometry.Point(1, 2)
    from_geometry = ee.Feature(point)
    self.assertEqual(ee.ApiFunction('Feature'), from_geometry.func)
    self.assertEqual({'geometry': point, 'metadata': None}, from_geometry.args)

    from_null_geometry = ee.Feature(None, {'x': 2})
    self.assertEqual(ee.ApiFunction('Feature'), from_null_geometry.func)
    self.assertEqual({
        'geometry': None,
        'metadata': {
            'x': 2
        }
    }, from_null_geometry.args)

    computed_geometry = ee.Geometry(ee.ComputedObject(ee.Function(), {'a': 1}))
    computed_properties = ee.ComputedObject(ee.Function(), {'b': 2})
    from_computed_one = ee.Feature(computed_geometry)
    from_computed_both = ee.Feature(computed_geometry, computed_properties)
    self.assertEqual(ee.ApiFunction('Feature'), from_computed_one.func)
    self.assertEqual({
        'geometry': computed_geometry,
        'metadata': None
    }, from_computed_one.args)
    self.assertEqual(ee.ApiFunction('Feature'), from_computed_both.func)
    self.assertEqual({
        'geometry': computed_geometry,
        'metadata': computed_properties
    }, from_computed_both.args)

    from_variable = ee.Feature(ee.CustomFunction.variable(None, 'foo'))
    self.assertIsInstance(from_variable, ee.Feature)

    result = from_variable.encode(None)
    self.assertEqual({'type': 'ArgumentRef', 'value': 'foo'}, result)

    from_geo_json_feature = ee.Feature({
        'type': 'Feature',
        'id': 'bar',
        'geometry': point.toGeoJSON(),
        'properties': {'foo': 42}
    })
    self.assertEqual(ee.ApiFunction('Feature'), from_geo_json_feature.func)
    self.assertEqual(point, from_geo_json_feature.args['geometry'])
    self.assertEqual({
        'foo': 42,
        'system:index': 'bar'
    }, from_geo_json_feature.args['metadata'])

  def testGetMap(self):
    """Verifies that getMap() uses Collection.draw to rasterize Features."""
    feature = ee.Feature(None)
    mapid = feature.getMapId({'color': 'ABCDEF'})
    manual = ee.ApiFunction.apply_('Collection.draw', {
        'collection': ee.FeatureCollection([feature]),
        'color': 'ABCDEF'})

    self.assertEqual('fakeMapId', mapid['mapid'])
    self.assertEqual(manual.serialize(), mapid['image'].serialize())

  def testInitOptParams(self):
    result = ee.Feature(
        geom=ee.Geometry.Point(1, 2), opt_properties=dict(prop='a')
    ).serialize()
    self.assertIn('"metadata": {"constantValue": {"prop": "a"}}', result)

  def test_area(self):
    expect = make_expression_graph({
        'arguments': {
            'feature': FEATURE_NONE_GRAPH,
            'maxError': MAX_ERROR_GRAPH,
            'proj': PROJ_GRAPH,
        },
        'functionName': 'Feature.area',
    })
    expression = ee.Feature(None).area(10, EPSG_4326)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Feature(None).area(maxError=10, proj=EPSG_4326)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_aside(self):
    mock_function = mock.Mock(return_value=None)
    feature = ee.Feature(None)
    self.assertIs(feature, feature.aside(mock_function))
    mock_function.assert_called_once_with(feature)

  def test_bounds(self):
    expect = make_expression_graph({
        'arguments': {
            'feature': FEATURE_NONE_GRAPH,
            'maxError': MAX_ERROR_GRAPH,
            'proj': PROJ_GRAPH,
        },
        'functionName': 'Feature.bounds',
    })
    expression = ee.Feature(None).bounds(10, EPSG_4326)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Feature(None).bounds(maxError=10, proj=EPSG_4326)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_buffer(self):
    expect = make_expression_graph({
        'arguments': {
            'feature': FEATURE_NONE_GRAPH,
            'distance': {'constantValue': 42},
            'maxError': MAX_ERROR_GRAPH,
            'proj': PROJ_GRAPH,
        },
        'functionName': 'Feature.buffer',
    })
    expression = ee.Feature(None).buffer(42, 10, EPSG_4326)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Feature(None).buffer(
        distance=42, maxError=10, proj=EPSG_4326
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_centroid(self):
    expect = make_expression_graph({
        'arguments': {
            'feature': FEATURE_NONE_GRAPH,
            'maxError': MAX_ERROR_GRAPH,
            'proj': PROJ_GRAPH,
        },
        'functionName': 'Feature.centroid',
    })
    expression = ee.Feature(None).centroid(10, EPSG_4326)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Feature(None).centroid(maxError=10, proj=EPSG_4326)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_contained_in(self):
    expect = right_maxerror_proj('containedIn')

    expression = ee.Feature(None).containedIn(ee.Feature(None), 10, EPSG_4326)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Feature(None).containedIn(
        right=ee.Feature(None), maxError=10, proj=EPSG_4326
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_contains(self):
    expect = right_maxerror_proj('contains')

    expression = ee.Feature(None).contains(ee.Feature(None), 10, EPSG_4326)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Feature(None).contains(
        right=ee.Feature(None), maxError=10, proj=EPSG_4326
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_convex_hull(self):
    expect = make_expression_graph({
        'arguments': {
            'feature': FEATURE_NONE_GRAPH,
            'maxError': MAX_ERROR_GRAPH,
            'proj': PROJ_GRAPH,
        },
        'functionName': 'Feature.convexHull',
    })
    expression = ee.Feature(None).convexHull(10, EPSG_4326)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Feature(None).convexHull(maxError=10, proj=EPSG_4326)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_cutLines(self):
    expect = make_expression_graph({
        'arguments': {
            'feature': FEATURE_NONE_GRAPH,
            'distances': {'constantValue': [1, 2]},
            'maxError': MAX_ERROR_GRAPH,
            'proj': PROJ_GRAPH,
        },
        'functionName': 'Feature.cutLines',
    })
    expression = ee.Feature(None).cutLines([1, 2], 10, EPSG_4326)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Feature(None).cutLines(
        distances=[1, 2], maxError=10, proj=EPSG_4326
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_difference(self):
    expect = right_maxerror_proj('difference')

    expression = ee.Feature(None).difference(ee.Feature(None), 10, EPSG_4326)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Feature(None).difference(
        right=ee.Feature(None), maxError=10, proj=EPSG_4326
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_disjoint(self):
    expect = right_maxerror_proj('disjoint')

    expression = ee.Feature(None).disjoint(ee.Feature(None), 10, EPSG_4326)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Feature(None).disjoint(
        right=ee.Feature(None), maxError=10, proj=EPSG_4326
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_dissolve(self):
    expect = make_expression_graph({
        'arguments': {
            'feature': FEATURE_NONE_GRAPH,
            'maxError': MAX_ERROR_GRAPH,
            'proj': PROJ_GRAPH,
        },
        'functionName': 'Feature.dissolve',
    })
    expression = ee.Feature(None).dissolve(10, EPSG_4326)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Feature(None).dissolve(maxError=10, proj=EPSG_4326)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_distance(self):
    expect = right_maxerror_proj('distance')
    expression = ee.Feature(None).distance(ee.Feature(None), 10, EPSG_4326)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Feature(None).distance(
        right=ee.Feature(None), maxError=10, proj=EPSG_4326
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_geometry(self):
    expect = make_expression_graph({
        'arguments': {
            'feature': FEATURE_NONE_GRAPH,
            'maxError': MAX_ERROR_GRAPH,
            'proj': PROJ_GRAPH,
            'geodesics': {'constantValue': True},
        },
        'functionName': 'Feature.geometry',
    })
    expression = ee.Feature(None).geometry(10, EPSG_4326, True)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Feature(None).geometry(
        maxError=10, proj=EPSG_4326, geodesics=True
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_hers_descriptor(self):
    expect = make_expression_graph({
        'arguments': {
            'element': FEATURE_NONE_GRAPH,
            'selectors': {'constantValue': ['a', 'b']},
            'buckets': {'constantValue': 2},
            'peakWidthScale': {'constantValue': 3},
        },
        'functionName': 'Feature.hersDescriptor',
    })
    expression = ee.Feature(None).hersDescriptor(['a', 'b'], 2, 3)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Feature(None).hersDescriptor(
        selectors=['a', 'b'], buckets=2, peakWidthScale=3
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_id(self):
    expect = make_expression_graph({
        'arguments': {
            'element': FEATURE_NONE_GRAPH,
        },
        'functionName': 'Feature.id',
    })
    expression = ee.Feature(None).id()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_intersection(self):
    expect = right_maxerror_proj('intersection')

    expression = ee.Feature(None).intersection(ee.Feature(None), 10, EPSG_4326)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Feature(None).intersection(
        right=ee.Feature(None), maxError=10, proj=EPSG_4326
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_intersects(self):
    expect = right_maxerror_proj('intersects')

    expression = ee.Feature(None).intersects(ee.Feature(None), 10, EPSG_4326)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Feature(None).intersects(
        right=ee.Feature(None), maxError=10, proj=EPSG_4326
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_length(self):
    expect = make_expression_graph({
        'arguments': {
            'feature': FEATURE_NONE_GRAPH,
            'maxError': MAX_ERROR_GRAPH,
            'proj': PROJ_GRAPH,
        },
        'functionName': 'Feature.length',
    })
    expression = ee.Feature(None).length(10, EPSG_4326)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Feature(None).length(maxError=10, proj=EPSG_4326)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_perimeter(self):
    expect = make_expression_graph({
        'arguments': {
            'feature': FEATURE_NONE_GRAPH,
            'maxError': MAX_ERROR_GRAPH,
            'proj': PROJ_GRAPH,
        },
        'functionName': 'Feature.perimeter',
    })
    expression = ee.Feature(None).perimeter(10, EPSG_4326)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Feature(None).perimeter(maxError=10, proj=EPSG_4326)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_select(self):
    expect = make_expression_graph({
        'arguments': {
            'input': FEATURE_NONE_GRAPH,
            'propertySelectors': {'constantValue': ['a', 'b']},
            'newProperties': {'constantValue': ['c', 'd']},
            'retainGeometry': {'constantValue': True},
        },
        'functionName': 'Feature.select',
    })
    expression = ee.Feature(None).select(['a', 'b'], ['c', 'd'], True)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Feature(None).select(
        propertySelectors=['a', 'b'],
        newProperties=['c', 'd'],
        retainGeometry=True,
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_setGeometry(self):
    expect = make_expression_graph({
        'arguments': {
            'feature': FEATURE_NONE_GRAPH,
            'geometry': {
                'functionInvocationValue': {
                    'functionName': 'GeometryConstructors.Point',
                    'arguments': {'coordinates': {'constantValue': [1, 2]}},
                }
            },
        },
        'functionName': 'Feature.setGeometry',
    })
    geojson_geom = {'type': 'Point', 'coordinates': [1, 2]}
    expression = ee.Feature(None).setGeometry(geojson_geom)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Feature(None).setGeometry(geometry=geojson_geom)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_simplify(self):
    expect = make_expression_graph({
        'arguments': {
            'feature': FEATURE_NONE_GRAPH,
            'maxError': MAX_ERROR_GRAPH,
            'proj': PROJ_GRAPH,
        },
        'functionName': 'Feature.simplify',
    })
    expression = ee.Feature(None).simplify(10, EPSG_4326)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Feature(None).simplify(maxError=10, proj=EPSG_4326)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_symmetric_difference(self):
    expect = right_maxerror_proj('symmetricDifference')

    expression = ee.Feature(None).symmetricDifference(
        ee.Feature(None), 10, EPSG_4326
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Feature(None).symmetricDifference(
        right=ee.Feature(None), maxError=10, proj=EPSG_4326
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_to_array(self):
    expect = make_expression_graph({
        'arguments': {
            'feature': FEATURE_NONE_GRAPH,
            'properties': {'constantValue': ['a', 'b']},
        },
        'functionName': 'Feature.toArray',
    })
    expression = ee.Feature(None).toArray(['a', 'b'])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Feature(None).toArray(properties=['a', 'b'])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_transform(self):
    expect = make_expression_graph({
        'arguments': {
            'feature': FEATURE_NONE_GRAPH,
            'maxError': MAX_ERROR_GRAPH,
            'proj': PROJ_GRAPH,
        },
        'functionName': 'Feature.transform',
    })
    expression = ee.Feature(None).transform(EPSG_4326, maxError=10)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Feature(None).transform(proj=EPSG_4326, maxError=10)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_union(self):
    expect = right_maxerror_proj('union')

    expression = ee.Feature(None).union(ee.Feature(None), 10, EPSG_4326)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Feature(None).union(
        right=ee.Feature(None), maxError=10, proj=EPSG_4326
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_withinDistance(self):
    expect = {
        'result': '0',
        'values': {
            '1': {
                'functionInvocationValue': {
                    'functionName': 'Feature',
                    'arguments': {},
                }
            },
            '0': {
                'functionInvocationValue': {
                    'arguments': {
                        'left': {'valueReference': '1'},
                        'right': {'valueReference': '1'},
                        'distance': {'constantValue': 42},
                        'maxError': MAX_ERROR_GRAPH,
                        'proj': PROJ_GRAPH,
                    },
                    'functionName': 'Feature.withinDistance',
                }
            },
        },
    }

    expression = ee.Feature(None).withinDistance(
        ee.Feature(None), 42, 10, EPSG_4326
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Feature(None).withinDistance(
        right=ee.Feature(None), distance=42, maxError=10, proj=EPSG_4326
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)


if __name__ == '__main__':
  unittest.main()
