#!/usr/bin/env python3
"""Test for the ee.featurecollection module."""

import json
from typing import Any, Dict
from unittest import mock

import unittest
import ee
from ee import _cloud_api_utils
from ee import apitestcase


def make_expression_graph(
    function_invocation_value: Dict[str, Any],
) -> Dict[str, Any]:
  return {
      'result': '0',
      'values': {'0': {'functionInvocationValue': function_invocation_value}},
  }


# ee.FeatureCollection(ee.Feature(None))
FEATURES_ONE = {
    'functionInvocationValue': {
        'functionName': 'Collection',
        'arguments': {
            'features': {
                'arrayValue': {
                    'values': [{
                        'functionInvocationValue': {
                            'functionName': 'Feature',
                            'arguments': {},
                        }
                    }]
                }
            }
        },
    }
}


class FeatureCollectionTestCase(apitestcase.ApiTestCase):

  def test_constructors(self):
    """Verifies that constructors understand valid parameters."""
    from_id = ee.FeatureCollection('abcd')
    self.assertEqual(
        ee.ApiFunction.lookup('Collection.loadTable'), from_id.func)
    self.assertEqual({'tableId': 'abcd'}, from_id.args)

    from_id_and_geom_column = ee.FeatureCollection('abcd', 'xyz')
    self.assertEqual(
        ee.ApiFunction.lookup('Collection.loadTable'),
        from_id_and_geom_column.func)
    self.assertEqual({
        'tableId': 'abcd',
        'geometryColumn': 'xyz'
    }, from_id_and_geom_column.args)

    geometry = ee.Geometry.Point(1, 2)
    feature = ee.Feature(geometry)
    geo_json = {'type': 'FeatureCollection', 'features': [geometry.toGeoJSON()]}
    from_geometries = ee.FeatureCollection([geometry])
    from_single_geometry = ee.FeatureCollection(geometry)
    from_features = ee.FeatureCollection([feature])
    from_single_feature = ee.FeatureCollection(feature)
    from_geo_json = ee.FeatureCollection(geo_json)
    self.assertEqual(from_geometries, from_single_geometry)
    self.assertEqual(from_geometries, from_features)
    self.assertEqual(from_geometries, from_single_feature)
    self.assertEqual(from_geometries, from_geo_json)
    self.assertEqual(ee.ApiFunction.lookup('Collection'), from_geometries.func)
    self.assertEqual({'features': [feature]}, from_geometries.args)

    # Test a computed list object.
    l = ee.List([feature]).slice(0)
    from_list = ee.FeatureCollection(l)
    self.assertEqual({'features': l}, from_list.args)

    from_computed_object = ee.FeatureCollection(
        ee.ComputedObject(None, {'x': 'y'}))
    self.assertEqual({'x': 'y'}, from_computed_object.args)

  def test_get_map_id(self):
    """Verifies that getMap() uses Collection.draw to draw."""
    collection = ee.FeatureCollection('test5')
    mapid = collection.getMapId({'color': 'ABCDEF'})
    manual = ee.ApiFunction.call_('Collection.draw', collection, 'ABCDEF')

    self.assertEqual('fakeMapId', mapid['mapid'])
    self.assertEqual(manual, mapid['image'])

  def test_download(self):
    """Verifies that Download ID and URL generation."""
    ee.FeatureCollection('test7').getDownloadURL()

    self.assertEqual('/table', self.last_table_call['url'])
    self.assertEqual(ee.FeatureCollection('test7').serialize(),
                     self.last_table_call['data']['table'].serialize())

    ee.FeatureCollection('test8').getDownloadURL(
        'json', 'bar, baz', 'qux')
    self.assertEqual(
        ee.FeatureCollection('test8').serialize(),
        self.last_table_call['data']['table'].serialize())
    self.assertEqual('JSON', self.last_table_call['data']['format'])
    self.assertEqual('bar, baz', self.last_table_call['data']['selectors'])
    self.assertEqual('qux', self.last_table_call['data']['filename'])

    self.assertEqual(
        ee.FeatureCollection('test7').getDownloadUrl('csv'),
        ee.FeatureCollection('test7').getDownloadURL('csv'))

  def test_download_table_with_cloud_api(self):
    cloud_api_resource = mock.MagicMock()
    with apitestcase.UsingCloudApi(cloud_api_resource=cloud_api_resource):
      create_table_response = {'name': 'table_name'}
      cloud_api_resource.projects().tables().create().execute.return_value = (
          create_table_response)
      fc = ee.FeatureCollection([ee.Feature(None, {'foo': 'bar'})])
      result = ee.data.getTableDownloadId({
          'table': fc, 'selectors': 'foo', 'format': 'CSV',
      })
      url = ee.data.makeTableDownloadUrl(result)

      self.assertDictEqual(result, {'docid': '5', 'token': '6'})
      self.assertEqual(url, f'/{_cloud_api_utils.VERSION}/5:getFeatures')

  def test_select(self):
    def equals(c1, c2):
      self.assertEqual(c1.serialize(), c2.serialize())

    fc = ee.FeatureCollection(ee.Feature(ee.Geometry.Point(0, 0), {'a': 5}))
    equals(fc.select('a'), fc.select(['a']))
    equals(fc.select('a', 'b'), fc.select(['a', 'b']))
    equals(fc.select('a', 'b', 'c'), fc.select(['a', 'b', 'c']))
    equals(fc.select('a', 'b', 'c', 'd'), fc.select(['a', 'b', 'c', 'd']))

    equals(fc.select(['a']), fc.select(['a'], None, True))
    equals(fc.select(['a'], None, False),
           fc.select(propertySelectors=['a'], retainGeometry=False))

  def test_init_opt_column(self):
    result = ee.FeatureCollection(
        args='[{}]', opt_column='a-column'
    ).serialize()
    self.assertIn('"geometryColumn": {"constantValue": "a-column"}', result)

  def test_classify(self):
    output_name = 'output name'
    expect = make_expression_graph({
        'arguments': {
            'features': FEATURES_ONE,
            'classifier': {
                'functionInvocationValue': {
                    'arguments': {},
                    'functionName': 'Classifier.smileNaiveBayes',
                }
            },
            'outputName': {'constantValue': output_name},
        },
        'functionName': 'FeatureCollection.classify',
    })
    classifier = ee.Classifier.smileNaiveBayes()
    expression = ee.FeatureCollection(ee.Feature(None)).classify(
        classifier, output_name
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.FeatureCollection(ee.Feature(None)).classify(
        classifier=classifier, outputName=output_name
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_cluster(self):
    output_name = 'output name'
    expect = make_expression_graph({
        'arguments': {
            'features': FEATURES_ONE,
            'clusterer': {
                'functionInvocationValue': {
                    'functionName': 'Clusterer.wekaCobweb',
                    'arguments': {},
                }
            },
            'outputName': {'constantValue': output_name},
        },
        'functionName': 'FeatureCollection.cluster',
    })
    clusterer = ee.Clusterer.wekaCobweb()
    expression = ee.FeatureCollection(ee.Feature(None)).cluster(
        clusterer, output_name
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.FeatureCollection(ee.Feature(None)).cluster(
        clusterer=clusterer, outputName=output_name
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_inverse_distance(self):
    range = 2
    property_name = 'property name'
    mean = 3
    std_dev = 4
    gamma = 5
    reducer = ee.Reducer.max()
    expect = make_expression_graph({
        'arguments': {
            'collection': FEATURES_ONE,
            'range': {'constantValue': range},
            'propertyName': {'constantValue': property_name},
            'mean': {'constantValue': mean},
            'stdDev': {'constantValue': std_dev},
            'gamma': {'constantValue': gamma},
            'reducer': {
                'functionInvocationValue': {
                    'functionName': 'Reducer.max',
                    'arguments': {},
                }
            },
        },
        'functionName': 'FeatureCollection.inverseDistance',
    })
    expression = ee.FeatureCollection(ee.Feature(None)).inverseDistance(
        range, property_name, mean, std_dev, gamma, reducer
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.FeatureCollection(ee.Feature(None)).inverseDistance(
        range=range,
        propertyName=property_name,
        mean=mean,
        stdDev=std_dev,
        gamma=gamma,
        reducer=reducer,
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_kriging(self):
    property_name = 'property name'
    shape = 'exponential'
    range = 1
    sill = 2
    nugget = 3
    max_distance = 4
    reducer = ee.Reducer.max()
    expect = make_expression_graph({
        'arguments': {
            'collection': FEATURES_ONE,
            'propertyName': {'constantValue': property_name},
            'shape': {'constantValue': shape},
            'range': {'constantValue': range},
            'sill': {'constantValue': sill},
            'nugget': {'constantValue': nugget},
            'maxDistance': {'constantValue': max_distance},
            'reducer': {
                'functionInvocationValue': {
                    'functionName': 'Reducer.max',
                    'arguments': {},
                }
            },
        },
        'functionName': 'FeatureCollection.kriging',
    })
    expression = ee.FeatureCollection(ee.Feature(None)).kriging(
        property_name, shape, range, sill, nugget, max_distance, reducer
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.FeatureCollection(ee.Feature(None)).kriging(
        propertyName=property_name,
        shape=shape,
        range=range,
        sill=sill,
        nugget=nugget,
        maxDistance=max_distance,
        reducer=reducer,
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_make_array(self):
    properties = ['a', 'b']
    name = 'name string'
    expect = make_expression_graph({
        'arguments': {
            'collection': FEATURES_ONE,
            'properties': {'constantValue': properties},
            'name': {'constantValue': name},
        },
        'functionName': 'FeatureCollection.makeArray',
    })
    expression = ee.FeatureCollection(ee.Feature(None)).makeArray(
        properties, name
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.FeatureCollection(ee.Feature(None)).makeArray(
        properties=properties, name=name
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_random_points(self):
    region = ee.Geometry.Point([1, 2])
    points = 1
    seed = 2
    max_error_num = 3
    max_error = ee.ErrorMargin(max_error_num)
    expect = make_expression_graph({
        'arguments': {
            'region': {
                'functionInvocationValue': {
                    'functionName': 'GeometryConstructors.Point',
                    'arguments': {'coordinates': {'constantValue': [1, 2]}},
                }
            },
            'points': {'constantValue': points},
            'seed': {'constantValue': seed},
            'maxError': {
                'functionInvocationValue': {
                    'functionName': 'ErrorMargin',
                    'arguments': {'value': {'constantValue': max_error_num}},
                }
            },
        },
        'functionName': 'FeatureCollection.randomPoints',
    })

    expression = ee.FeatureCollection.randomPoints(
        region, points, seed, max_error_num
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.FeatureCollection.randomPoints(
        region, points, seed, max_error
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.FeatureCollection(ee.Feature(None)).randomPoints(
        region=region, points=points, seed=seed, maxError=max_error
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)



if __name__ == '__main__':
  unittest.main()
