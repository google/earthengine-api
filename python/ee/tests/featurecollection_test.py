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

FEATURES_A = {
    'functionInvocationValue': {
        'functionName': 'Collection.loadTable',
        'arguments': {'tableId': {'constantValue': 'a'}},
    }
}

FEATURES_B = {
    'functionInvocationValue': {
        'functionName': 'Collection.loadTable',
        'arguments': {'tableId': {'constantValue': 'b'}},
    }
}


class FeatureCollectionTest(apitestcase.ApiTestCase):

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

  def test_aggregate_array(self):
    property_name = 'property name'
    expect = make_expression_graph({
        'arguments': {
            'collection': FEATURES_ONE,
            'property': {'constantValue': property_name},
        },
        'functionName': 'AggregateFeatureCollection.array',
    })
    expression = ee.FeatureCollection(ee.Feature(None)).aggregate_array(
        property_name
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.FeatureCollection(ee.Feature(None)).aggregate_array(
        property=property_name
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_aggregate_count(self):
    property_name = 'property name'
    expect = make_expression_graph({
        'arguments': {
            'collection': FEATURES_ONE,
            'property': {'constantValue': property_name},
        },
        'functionName': 'AggregateFeatureCollection.count',
    })
    expression = ee.FeatureCollection(ee.Feature(None)).aggregate_count(
        property_name
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.FeatureCollection(ee.Feature(None)).aggregate_count(
        property=property_name
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_aggregate_count_distinct(self):
    property_name = 'property name'
    expect = make_expression_graph({
        'arguments': {
            'collection': FEATURES_ONE,
            'property': {'constantValue': property_name},
        },
        'functionName': 'AggregateFeatureCollection.count_distinct',
    })
    expression = ee.FeatureCollection(
        ee.Feature(None)
    ).aggregate_count_distinct(property_name)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.FeatureCollection(
        ee.Feature(None)
    ).aggregate_count_distinct(property=property_name)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_aggregate_first(self):
    property_name = 'property name'
    expect = make_expression_graph({
        'arguments': {
            'collection': FEATURES_ONE,
            'property': {'constantValue': property_name},
        },
        'functionName': 'AggregateFeatureCollection.first',
    })
    expression = ee.FeatureCollection(ee.Feature(None)).aggregate_first(
        property_name
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.FeatureCollection(ee.Feature(None)).aggregate_first(
        property=property_name
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_aggregate_histogram(self):
    property_name = 'property name'
    expect = make_expression_graph({
        'arguments': {
            'collection': FEATURES_ONE,
            'property': {'constantValue': property_name},
        },
        'functionName': 'AggregateFeatureCollection.histogram',
    })
    expression = ee.FeatureCollection(ee.Feature(None)).aggregate_histogram(
        property_name
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.FeatureCollection(ee.Feature(None)).aggregate_histogram(
        property=property_name
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_aggregate_max(self):
    property_name = 'property name'
    expect = make_expression_graph({
        'arguments': {
            'collection': FEATURES_ONE,
            'property': {'constantValue': property_name},
        },
        'functionName': 'AggregateFeatureCollection.max',
    })
    expression = ee.FeatureCollection(ee.Feature(None)).aggregate_max(
        property_name
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.FeatureCollection(ee.Feature(None)).aggregate_max(
        property=property_name
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_aggregate_mean(self):
    property_name = 'property name'
    expect = make_expression_graph({
        'arguments': {
            'collection': FEATURES_ONE,
            'property': {'constantValue': property_name},
        },
        'functionName': 'AggregateFeatureCollection.mean',
    })
    expression = ee.FeatureCollection(ee.Feature(None)).aggregate_mean(
        property_name
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.FeatureCollection(ee.Feature(None)).aggregate_mean(
        property=property_name
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_aggregate_min(self):
    property_name = 'property name'
    expect = make_expression_graph({
        'arguments': {
            'collection': FEATURES_ONE,
            'property': {'constantValue': property_name},
        },
        'functionName': 'AggregateFeatureCollection.min',
    })
    expression = ee.FeatureCollection(ee.Feature(None)).aggregate_min(
        property_name
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.FeatureCollection(ee.Feature(None)).aggregate_min(
        property=property_name
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_aggregate_product(self):
    property_name = 'property name'
    expect = make_expression_graph({
        'arguments': {
            'collection': FEATURES_ONE,
            'property': {'constantValue': property_name},
        },
        'functionName': 'AggregateFeatureCollection.product',
    })
    expression = ee.FeatureCollection(ee.Feature(None)).aggregate_product(
        property_name
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.FeatureCollection(ee.Feature(None)).aggregate_product(
        property=property_name
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_aggregate_sample_sd(self):
    property_name = 'property name'
    expect = make_expression_graph({
        'arguments': {
            'collection': FEATURES_ONE,
            'property': {'constantValue': property_name},
        },
        'functionName': 'AggregateFeatureCollection.sample_sd',
    })
    expression = ee.FeatureCollection(ee.Feature(None)).aggregate_sample_sd(
        property_name
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.FeatureCollection(ee.Feature(None)).aggregate_sample_sd(
        property=property_name
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_aggregate_sample_var(self):
    property_name = 'property name'
    expect = make_expression_graph({
        'arguments': {
            'collection': FEATURES_ONE,
            'property': {'constantValue': property_name},
        },
        'functionName': 'AggregateFeatureCollection.sample_var',
    })
    expression = ee.FeatureCollection(ee.Feature(None)).aggregate_sample_var(
        property_name
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.FeatureCollection(ee.Feature(None)).aggregate_sample_var(
        property=property_name
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_aggregate_stats(self):
    property_name = 'property name'
    expect = make_expression_graph({
        'arguments': {
            'collection': FEATURES_ONE,
            'property': {'constantValue': property_name},
        },
        'functionName': 'AggregateFeatureCollection.stats',
    })
    expression = ee.FeatureCollection(ee.Feature(None)).aggregate_stats(
        property_name
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.FeatureCollection(ee.Feature(None)).aggregate_stats(
        property=property_name
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_aggregate_sum(self):
    property_name = 'property name'
    expect = make_expression_graph({
        'arguments': {
            'collection': FEATURES_ONE,
            'property': {'constantValue': property_name},
        },
        'functionName': 'AggregateFeatureCollection.sum',
    })
    expression = ee.FeatureCollection(ee.Feature(None)).aggregate_sum(
        property_name
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.FeatureCollection(ee.Feature(None)).aggregate_sum(
        property=property_name
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_aggregate_total_sd(self):
    property_name = 'property name'
    expect = make_expression_graph({
        'arguments': {
            'collection': FEATURES_ONE,
            'property': {'constantValue': property_name},
        },
        'functionName': 'AggregateFeatureCollection.total_sd',
    })
    expression = ee.FeatureCollection(ee.Feature(None)).aggregate_total_sd(
        property_name
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.FeatureCollection(ee.Feature(None)).aggregate_total_sd(
        property=property_name
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_aggregate_total_var(self):
    property_name = 'property name'
    expect = make_expression_graph({
        'arguments': {
            'collection': FEATURES_ONE,
            'property': {'constantValue': property_name},
        },
        'functionName': 'AggregateFeatureCollection.total_var',
    })
    expression = ee.FeatureCollection(ee.Feature(None)).aggregate_total_var(
        property_name
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.FeatureCollection(ee.Feature(None)).aggregate_total_var(
        property=property_name
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

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

  def test_copy_properties(self):
    source = ee.FeatureCollection('b')
    properties = ['c', 'd']
    exclude = ['e', 'f']
    expect = make_expression_graph({
        'arguments': {
            'destination': FEATURES_A,
            'source': FEATURES_B,
            'properties': {'constantValue': properties},
            'exclude': {'constantValue': exclude},
        },
        # Note this is Element rather than FeatureCollection
        'functionName': 'Element.copyProperties',
    })
    expression = ee.FeatureCollection('a').copyProperties(
        source, properties, exclude
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.FeatureCollection('a').copyProperties(
        source=source, properties=properties, exclude=exclude
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_distance(self):
    # Inherited from Collection.distance.
    features = ee.FeatureCollection('a')
    search_radius = 1.1
    max_error = 2.2
    expect = make_expression_graph({
        'arguments': {
            'features': FEATURES_A,
            'searchRadius': {'constantValue': search_radius},
            'maxError': {'constantValue': max_error},
        },
        # Not FeatureCollection.
        'functionName': 'Collection.distance',
    })
    expression = features.distance(search_radius, max_error)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_distinct(self):
    collection = ee.FeatureCollection(ee.Feature(None))
    properties = 'property name'
    expect = make_expression_graph({
        'arguments': {
            'collection': FEATURES_ONE,
            'properties': {'constantValue': properties},
        },
        'functionName': 'Collection.distinct',
    })
    expression = collection.distinct(properties)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = collection.distinct(properties=properties)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_draw(self):
    collection = ee.FeatureCollection('a')
    color = 'red'
    point_radius = 1
    stroke_width = 2
    expect = make_expression_graph({
        'arguments': {
            'collection': FEATURES_A,
            'color': {'constantValue': color},
            'pointRadius': {'constantValue': point_radius},
            'strokeWidth': {'constantValue': stroke_width},
        },
        'functionName': 'Collection.draw',
    })
    expression = collection.draw(color, point_radius, stroke_width)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = collection.draw(
        color=color, pointRadius=point_radius, strokeWidth=stroke_width
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_error_matrix(self):
    features = ee.FeatureCollection('a')
    actual = 'b'
    predicted = 'c'
    order = [1, 2]
    expect = make_expression_graph({
        'arguments': {
            'collection': FEATURES_A,
            'actual': {'constantValue': actual},
            'predicted': {'constantValue': predicted},
            'order': {'constantValue': order},
        },
        'functionName': 'Collection.errorMatrix',
    })
    expression = features.errorMatrix(actual, predicted, order)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = features.errorMatrix(
        actual=actual, predicted=predicted, order=order
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_first(self):
    collection = ee.FeatureCollection('a')
    expect = make_expression_graph({
        'arguments': {
            'collection': FEATURES_A,
        },
        'functionName': 'Collection.first',
    })
    expression = collection.first()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_flatten(self):
    collection = ee.FeatureCollection('a')
    expect = make_expression_graph({
        'arguments': {
            'collection': FEATURES_A,
        },
        'functionName': 'Collection.flatten',
    })
    expression = collection.flatten()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_geometry(self):
    max_error = 1.1
    collection = ee.FeatureCollection('a')
    expect = make_expression_graph({
        'arguments': {
            'collection': FEATURES_A,
            'maxError': {
                'functionInvocationValue': {
                    'functionName': 'ErrorMargin',
                    'arguments': {'value': {'constantValue': 1.1}},
                }
            },
        },
        'functionName': 'Collection.geometry',
    })
    expression = collection.geometry(max_error)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_inverse_distance(self):
    a_range = 2
    property_name = 'property name'
    mean = 3
    std_dev = 4
    gamma = 5
    reducer = ee.Reducer.max()
    expect = make_expression_graph({
        'arguments': {
            'collection': FEATURES_ONE,
            'range': {'constantValue': a_range},
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
        a_range, property_name, mean, std_dev, gamma, reducer
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.FeatureCollection(ee.Feature(None)).inverseDistance(
        range=a_range,
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
    range_val = 1
    sill = 2
    nugget = 3
    max_distance = 4
    reducer = ee.Reducer.max()
    expect = make_expression_graph({
        'arguments': {
            'collection': FEATURES_ONE,
            'propertyName': {'constantValue': property_name},
            'shape': {'constantValue': shape},
            'range': {'constantValue': range_val},
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
        property_name, shape, range_val, sill, nugget, max_distance, reducer
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.FeatureCollection(ee.Feature(None)).kriging(
        propertyName=property_name,
        shape=shape,
        range=range_val,
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

  def test_merge(self):
    collection1 = ee.FeatureCollection('a')
    collection2 = ee.FeatureCollection('b')
    expect = make_expression_graph({
        'arguments': {'collection1': FEATURES_A, 'collection2': FEATURES_B},
        'functionName': 'Collection.merge',
    })
    expression = collection1.merge(collection2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = collection1.merge(collection2=collection2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_random_column(self):
    collection = ee.FeatureCollection('a')
    column_name = 'column a'
    seed = 1
    distribution = 'uniform'
    expect = make_expression_graph({
        'arguments': {
            'collection': FEATURES_A,
            'columnName': {'constantValue': column_name},
            'seed': {'constantValue': seed},
            'distribution': {'constantValue': distribution},
        },
        'functionName': 'Collection.randomColumn',
    })
    expression = collection.randomColumn(column_name, seed, distribution)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = collection.randomColumn(
        columnName=column_name, seed=seed, distribution=distribution
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

  def test_reduce_columns(self):
    collection = ee.FeatureCollection('a')
    reducer = ee.Reducer.sum()
    selectors = ['b', 'c']
    weight_selectors = ['d', 'e']
    expect = make_expression_graph({
        'arguments': {
            'collection': FEATURES_A,
            'reducer': {
                'functionInvocationValue': {
                    'functionName': 'Reducer.sum',
                    'arguments': {},
                }
            },
            'selectors': {'constantValue': selectors},
            'weightSelectors': {'constantValue': weight_selectors},
        },
        'functionName': 'Collection.reduceColumns',
    })
    expression = collection.reduceColumns(reducer, selectors, weight_selectors)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = collection.reduceColumns(
        reducer=reducer, selectors=selectors, weightSelectors=weight_selectors
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_reduce_to_image(self):
    collection = ee.FeatureCollection('a')
    properties = ['b', 'c']
    reducer = ee.Reducer.sum()
    expect = make_expression_graph({
        'arguments': {
            'collection': FEATURES_A,
            'properties': {'constantValue': properties},
            'reducer': {
                'functionInvocationValue': {
                    'functionName': 'Reducer.sum',
                    'arguments': {},
                }
            },
        },
        'functionName': 'Collection.reduceToImage',
    })
    expression = collection.reduceToImage(properties, reducer)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = collection.reduceToImage(
        properties=properties, reducer=reducer
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_remap(self):
    collection = ee.FeatureCollection('a')
    lookup_in = ['b', 1]
    lookup_out = [2, 3]
    column_name = 'column name'
    expect = make_expression_graph({
        'arguments': {
            'collection': FEATURES_A,
            'lookupIn': {'constantValue': lookup_in},
            'lookupOut': {'constantValue': lookup_out},
            'columnName': {'constantValue': column_name},
        },
        'functionName': 'Collection.remap',
    })
    expression = collection.remap(lookup_in, lookup_out, column_name)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = collection.remap(
        lookupIn=lookup_in, lookupOut=lookup_out, columnName=column_name
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_size(self):
    collection = ee.FeatureCollection('a')
    expect = make_expression_graph({
        'arguments': {
            'collection': FEATURES_A,
        },
        'functionName': 'Collection.size',
    })
    expression = collection.size()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_style(self):
    collection = ee.FeatureCollection('a')
    color = 'red'
    point_size = 1
    point_shape = 'circle'
    width = 2.3
    fill_color = 'cadetblue'
    style_property = 'property name'
    neighborhood = 3
    line_type = 'dotted'
    expect = make_expression_graph({
        'arguments': {
            'collection': FEATURES_A,
            'color': {'constantValue': color},
            'pointSize': {'constantValue': point_size},
            'pointShape': {'constantValue': point_shape},
            'width': {'constantValue': width},
            'fillColor': {'constantValue': fill_color},
            'styleProperty': {'constantValue': style_property},
            'neighborhood': {'constantValue': neighborhood},
            'lineType': {'constantValue': line_type},
        },
        'functionName': 'Collection.style',
    })
    expression = collection.style(
        color,
        point_size,
        point_shape,
        width,
        fill_color,
        style_property,
        neighborhood,
        line_type,
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = collection.style(
        color=color,
        pointSize=point_size,
        pointShape=point_shape,
        width=width,
        fillColor=fill_color,
        styleProperty=style_property,
        neighborhood=neighborhood,
        lineType=line_type,
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_to_list(self):
    collection = ee.FeatureCollection('a')
    count = 1
    offset = 2
    expect = make_expression_graph({
        'arguments': {
            'collection': FEATURES_A,
            'count': {'constantValue': count},
            'offset': {'constantValue': offset},
        },
        'functionName': 'Collection.toList',
    })
    expression = collection.toList(count, offset)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = collection.toList(count=count, offset=offset)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_union(self):
    collection = ee.FeatureCollection('a')
    max_error = 1.1
    expect = make_expression_graph({
        'arguments': {
            'collection': FEATURES_A,
            'maxError': {
                'functionInvocationValue': {
                    'functionName': 'ErrorMargin',
                    'arguments': {'value': {'constantValue': max_error}},
                }
            },
        },
        'functionName': 'Collection.union',
    })
    expression = collection.union(max_error)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = collection.union(maxError=max_error)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)


if __name__ == '__main__':
  unittest.main()
