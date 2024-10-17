#!/usr/bin/env python3
"""Test for the ee.imagecollection module."""

import json
from typing import Any, Dict
from unittest import mock

import unittest
import ee
from ee import apitestcase


def make_expression_graph(
    function_invocation_value: Dict[str, Any],
) -> Dict[str, Any]:
  return {
      'result': '0',
      'values': {'0': {'functionInvocationValue': function_invocation_value}},
  }


# ee.ImageCollection('a').serialize()
IMAGES_A = {
    'functionInvocationValue': {
        'functionName': 'ImageCollection.load',
        'arguments': {'id': {'constantValue': 'a'}},
    }
}

# ee.ImageCollection('b').serialize()
IMAGES_B = {
    'functionInvocationValue': {
        'functionName': 'ImageCollection.load',
        'arguments': {'id': {'constantValue': 'b'}},
    }
}

# ee.ImageCollection([ee.Image(1)]).serialize()
IMAGES_ONE = {
    'functionInvocationValue': {
        'functionName': 'ImageCollection.fromImages',
        'arguments': {
            'images': {
                'arrayValue': {
                    'values': [{
                        'functionInvocationValue': {
                            'functionName': 'Image.constant',
                            'arguments': {'value': {'constantValue': 1}},
                        }
                    }]
                }
            }
        },
    }
}


class ImageCollectionTest(apitestcase.ApiTestCase):

  def test_image_collection_constructors(self):
    """Verifies that constructors understand valid parameters."""
    from_id = ee.ImageCollection('abcd')
    self.assertEqual(
        ee.ApiFunction.lookup('ImageCollection.load'), from_id.func)
    self.assertEqual({'id': 'abcd'}, from_id.args)

    from_images = ee.ImageCollection([ee.Image(1), ee.Image(2)])
    self.assertEqual(
        ee.ApiFunction.lookup('ImageCollection.fromImages'), from_images.func)
    self.assertEqual({'images': [ee.Image(1), ee.Image(2)]}, from_images.args)

    self.assertEqual(
        ee.ImageCollection([ee.Image(1)]), ee.ImageCollection(ee.Image(1)))

    original = ee.ImageCollection('foo')
    from_other_image_collection = ee.ImageCollection(original)
    self.assertEqual(from_other_image_collection, original)

    l = ee.List([ee.Image(1)]).slice(0)
    from_list = ee.ImageCollection(l)
    self.assertEqual({'images': l}, from_list.args)

    from_computed_object = ee.ImageCollection(
        ee.ComputedObject(None, {'x': 'y'}))
    self.assertEqual({'x': 'y'}, from_computed_object.args)

  def test_imperative_functions(self):
    """Verifies that imperative functions return ready values."""
    image_collection = ee.ImageCollection(ee.Image(1))
    self.assertEqual({'value': 'fakeValue'}, image_collection.getInfo())
    self.assertEqual('fakeMapId', image_collection.getMapId()['mapid'])

  def test_filter(self):
    """Verifies that filtering an ImageCollection wraps the result."""
    collection = ee.ImageCollection(ee.Image(1))
    noop_filter = ee.Filter()
    filtered = collection.filter(noop_filter)
    self.assertIsInstance(filtered, ee.ImageCollection)
    self.assertEqual(ee.ApiFunction.lookup('Collection.filter'), filtered.func)
    self.assertEqual({
        'collection': collection,
        'filter': noop_filter
    }, filtered.args)

  def test_first_lookup(self):
    """Verifies that first gets promoted properly."""
    first = ee.ImageCollection(ee.Image(1)).first()
    self.assertIsInstance(first, ee.Image)
    self.assertEqual(ee.ApiFunction.lookup('Collection.first'), first.func)

  def test_prepare_for_export(self):
    """Verifies proper handling of export-related parameters."""
    with apitestcase.UsingCloudApi():
      base_collection = ee.ImageCollection(ee.Image(1))

      collection, params = base_collection.prepare_for_export(
          {'something': 'else'})
      self.assertEqual(base_collection, collection)
      self.assertEqual({'something': 'else'}, params)

      collection, params = base_collection.prepare_for_export({
          'crs': 'ABCD',
          'crs_transform': '1,2,3,4,5,6'
      })

      # Need to do a serialized comparison for the collection because
      # custom functions don't implement equality comparison.
      def expected_preparation_function(img):
        return img.reproject(
            crs='ABCD', crsTransform=[1.0, 2.0, 3.0, 4.0, 5.0, 6.0])

      expected_collection = base_collection.map(expected_preparation_function)
      self.assertEqual(
          expected_collection.serialize(for_cloud_api=True),
          collection.serialize(for_cloud_api=True))
      self.assertEqual({}, params)

  def test_select_opt_params(self):
    result = (
        ee.ImageCollection([])
        .select(['selector_a', 4], opt_names=['name_a', 'name_b'])
        .serialize()
    )
    self.assertIn('"newNames": {"constantValue": ["name_a", "name_b"]}', result)

  def test_aggregate_array(self):
    property_name = 'property name'
    expect = make_expression_graph({
        'arguments': {
            'collection': IMAGES_A,
            'property': {'constantValue': property_name},
        },
        'functionName': 'AggregateFeatureCollection.array',
    })
    expression = ee.ImageCollection('a').aggregate_array(property_name)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.ImageCollection('a').aggregate_array(property=property_name)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_aggregate_count(self):
    property_name = 'property name'
    expect = make_expression_graph({
        'arguments': {
            'collection': IMAGES_A,
            'property': {'constantValue': property_name},
        },
        'functionName': 'AggregateFeatureCollection.count',
    })
    expression = ee.ImageCollection('a').aggregate_count(property_name)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.ImageCollection('a').aggregate_count(property=property_name)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_aggregate_count_distinct(self):
    property_name = 'property name'
    expect = make_expression_graph({
        'arguments': {
            'collection': IMAGES_A,
            'property': {'constantValue': property_name},
        },
        'functionName': 'AggregateFeatureCollection.count_distinct',
    })
    expression = ee.ImageCollection('a').aggregate_count_distinct(property_name)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.ImageCollection('a').aggregate_count_distinct(
        property=property_name
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_aggregate_first(self):
    property_name = 'property name'
    expect = make_expression_graph({
        'arguments': {
            'collection': IMAGES_A,
            'property': {'constantValue': property_name},
        },
        'functionName': 'AggregateFeatureCollection.first',
    })
    expression = ee.ImageCollection('a').aggregate_first(property_name)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.ImageCollection('a').aggregate_first(property=property_name)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_aggregate_histogram(self):
    property_name = 'property name'
    expect = make_expression_graph({
        'arguments': {
            'collection': IMAGES_A,
            'property': {'constantValue': property_name},
        },
        'functionName': 'AggregateFeatureCollection.histogram',
    })
    expression = ee.ImageCollection('a').aggregate_histogram(property_name)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.ImageCollection('a').aggregate_histogram(
        property=property_name
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_aggregate_max(self):
    property_name = 'property name'
    expect = make_expression_graph({
        'arguments': {
            'collection': IMAGES_A,
            'property': {'constantValue': property_name},
        },
        'functionName': 'AggregateFeatureCollection.max',
    })
    expression = ee.ImageCollection('a').aggregate_max(property_name)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.ImageCollection('a').aggregate_max(property=property_name)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_aggregate_mean(self):
    property_name = 'property name'
    expect = make_expression_graph({
        'arguments': {
            'collection': IMAGES_A,
            'property': {'constantValue': property_name},
        },
        'functionName': 'AggregateFeatureCollection.mean',
    })
    expression = ee.ImageCollection('a').aggregate_mean(property_name)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.ImageCollection('a').aggregate_mean(property=property_name)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_aggregate_min(self):
    property_name = 'property name'
    expect = make_expression_graph({
        'arguments': {
            'collection': IMAGES_A,
            'property': {'constantValue': property_name},
        },
        'functionName': 'AggregateFeatureCollection.min',
    })
    expression = ee.ImageCollection('a').aggregate_min(property_name)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.ImageCollection('a').aggregate_min(property=property_name)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_aggregate_product(self):
    property_name = 'property name'
    expect = make_expression_graph({
        'arguments': {
            'collection': IMAGES_A,
            'property': {'constantValue': property_name},
        },
        'functionName': 'AggregateFeatureCollection.product',
    })
    expression = ee.ImageCollection('a').aggregate_product(property_name)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.ImageCollection('a').aggregate_product(
        property=property_name
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_aggregate_sample_sd(self):
    property_name = 'property name'
    expect = make_expression_graph({
        'arguments': {
            'collection': IMAGES_A,
            'property': {'constantValue': property_name},
        },
        'functionName': 'AggregateFeatureCollection.sample_sd',
    })
    expression = ee.ImageCollection('a').aggregate_sample_sd(property_name)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.ImageCollection('a').aggregate_sample_sd(
        property=property_name
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_aggregate_sample_var(self):
    property_name = 'property name'
    expect = make_expression_graph({
        'arguments': {
            'collection': IMAGES_A,
            'property': {'constantValue': property_name},
        },
        'functionName': 'AggregateFeatureCollection.sample_var',
    })
    expression = ee.ImageCollection('a').aggregate_sample_var(property_name)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.ImageCollection('a').aggregate_sample_var(
        property=property_name
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_aggregate_stats(self):
    property_name = 'property name'
    expect = make_expression_graph({
        'arguments': {
            'collection': IMAGES_A,
            'property': {'constantValue': property_name},
        },
        'functionName': 'AggregateFeatureCollection.stats',
    })
    expression = ee.ImageCollection('a').aggregate_stats(property_name)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.ImageCollection('a').aggregate_stats(property=property_name)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_aggregate_sum(self):
    property_name = 'property name'
    expect = make_expression_graph({
        'arguments': {
            'collection': IMAGES_A,
            'property': {'constantValue': property_name},
        },
        'functionName': 'AggregateFeatureCollection.sum',
    })
    expression = ee.ImageCollection('a').aggregate_sum(property_name)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.ImageCollection('a').aggregate_sum(property=property_name)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_aggregate_total_sd(self):
    property_name = 'property name'
    expect = make_expression_graph({
        'arguments': {
            'collection': IMAGES_A,
            'property': {'constantValue': property_name},
        },
        'functionName': 'AggregateFeatureCollection.total_sd',
    })
    expression = ee.ImageCollection('a').aggregate_total_sd(property_name)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.ImageCollection('a').aggregate_total_sd(
        property=property_name
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_aggregate_total_var(self):
    property_name = 'property name'
    expect = make_expression_graph({
        'arguments': {
            'collection': IMAGES_A,
            'property': {'constantValue': property_name},
        },
        'functionName': 'AggregateFeatureCollection.total_var',
    })
    expression = ee.ImageCollection('a').aggregate_total_var(property_name)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.ImageCollection('a').aggregate_total_var(
        property=property_name
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_cast(self):
    band_types = {'a': 'int8'}
    band_order = ['a']
    expect = make_expression_graph({
        'arguments': {
            'collection': IMAGES_ONE,
            'bandTypes': {'constantValue': band_types},
            'bandOrder': {'constantValue': band_order},
        },
        'functionName': 'ImageCollection.cast',
    })
    expression = ee.ImageCollection([ee.Image(1)]).cast(band_types, band_order)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.ImageCollection([ee.Image(1)]).cast(
        bandTypes=band_types, bandOrder=band_order
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_combine(self):
    secondary = ee.ImageCollection('b')
    overwrite = True
    expect = make_expression_graph({
        'arguments': {
            'primary': IMAGES_ONE,
            'secondary': IMAGES_B,
            'overwrite': {'constantValue': overwrite},
        },
        'functionName': 'ImageCollection.combine',
    })
    expression = ee.ImageCollection([ee.Image(1)]).combine(secondary, overwrite)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.ImageCollection([ee.Image(1)]).combine(
        secondary=secondary, overwrite=overwrite
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_copy_properties(self):
    source = ee.ImageCollection('b')
    properties = ['c', 'd']
    exclude = ['e', 'f']
    expect = make_expression_graph({
        'arguments': {
            'destination': IMAGES_A,
            'source': IMAGES_B,
            'properties': {'constantValue': properties},
            'exclude': {'constantValue': exclude},
        },
        # Note this is Element rather than ImageCollection
        'functionName': 'Element.copyProperties',
    })
    expression = ee.ImageCollection('a').copyProperties(
        source, properties, exclude
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.ImageCollection('a').copyProperties(
        source=source, properties=properties, exclude=exclude
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_count(self):
    expect = make_expression_graph({
        'arguments': {'collection': IMAGES_A},
        # Note that this is not ImageCollection.count or collection.count.
        'functionName': 'reduce.count',
    })
    expression = ee.ImageCollection('a').count()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_distance(self):
    # Inherited from Collection.distance.
    features = ee.ImageCollection('a')
    search_radius = 1.1
    max_error = 2.2
    expect = make_expression_graph({
        'arguments': {
            'features': IMAGES_A,
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
    collection = ee.ImageCollection('a')
    properties = 'property name'
    expect = make_expression_graph({
        'arguments': {
            'collection': IMAGES_A,
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
    collection = ee.ImageCollection('a')
    color = 'red'
    point_radius = 1
    stroke_width = 2
    expect = make_expression_graph({
        'arguments': {
            'collection': IMAGES_A,
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
    collection = ee.ImageCollection('a')
    actual = 'b'
    predicted = 'c'
    order = [1, 2]
    expect = make_expression_graph({
        'arguments': {
            'collection': IMAGES_A,
            'actual': {'constantValue': actual},
            'predicted': {'constantValue': predicted},
            'order': {'constantValue': order},
        },
        'functionName': 'Collection.errorMatrix',
    })
    expression = collection.errorMatrix(actual, predicted, order)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = collection.errorMatrix(
        actual=actual, predicted=predicted, order=order
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_first(self):
    collection = ee.ImageCollection('a')
    expect = make_expression_graph({
        'arguments': {
            'collection': IMAGES_A,
        },
        'functionName': 'Collection.first',
    })
    expression = collection.first()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_flatten(self):
    collection = ee.ImageCollection('a')
    expect = make_expression_graph({
        'arguments': {
            'collection': IMAGES_A,
        },
        'functionName': 'Collection.flatten',
    })
    expression = collection.flatten()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_forma_trend(self):
    covariates = ee.ImageCollection('b')
    window_size = 3
    expect = make_expression_graph({
        'arguments': {
            'timeSeries': IMAGES_ONE,
            'covariates': IMAGES_B,
            'windowSize': {'constantValue': window_size},
        },
        'functionName': 'ImageCollection.formaTrend',
    })
    expression = ee.ImageCollection([ee.Image(1)]).formaTrend(
        covariates, window_size
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.ImageCollection([ee.Image(1)]).formaTrend(
        covariates=covariates, windowSize=window_size
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  # fromImages already tested in other tests.

  def test_geometry(self):
    max_error = 1.1
    collection = ee.ImageCollection('a')
    expect = make_expression_graph({
        'arguments': {
            'collection': IMAGES_A,
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

  def test_get_region(self):
    geometry = ee.Geometry.Point([1, 2])
    scale = 3
    crs = 'EPSG:4326'
    crs_transform = [4, 5, 6, 7, 8, 9]
    expect = make_expression_graph({
        'arguments': {
            'collection': IMAGES_A,
            'geometry': {
                'functionInvocationValue': {
                    'functionName': 'GeometryConstructors.Point',
                    'arguments': {'coordinates': {'constantValue': [1, 2]}},
                }
            },
            'scale': {'constantValue': scale},
            'crs': {
                'functionInvocationValue': {
                    'functionName': 'Projection',
                    'arguments': {'crs': {'constantValue': crs}},
                }
            },
            'crsTransform': {'constantValue': crs_transform},
        },
        'functionName': 'ImageCollection.getRegion',
    })
    expression = ee.ImageCollection('a').getRegion(
        geometry, scale, crs, crs_transform
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.ImageCollection('a').getRegion(
        geometry=geometry, scale=scale, crs=crs, crsTransform=crs_transform
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_load(self):
    id_name = 'id name'
    version = 1
    expect = make_expression_graph({
        'arguments': {
            'id': {'constantValue': id_name},
            'version': {'constantValue': version},
        },
        'functionName': 'ImageCollection.load',
    })
    expression = ee.ImageCollection.load(id_name, version)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.ImageCollection('a').load(id=id_name, version=version)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_merge(self):
    images_b = ee.ImageCollection('b')
    expect = make_expression_graph({
        'arguments': {
            'collection1': IMAGES_A,
            'collection2': IMAGES_B,
        },
        'functionName': 'ImageCollection.merge',
    })
    expression = ee.ImageCollection('a').merge(images_b)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.ImageCollection('a').merge(collection2=images_b)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_mosaic(self):
    expect = make_expression_graph({
        'arguments': {
            'collection': IMAGES_A,
        },
        'functionName': 'ImageCollection.mosaic',
    })
    expression = ee.ImageCollection('a').mosaic()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_quality_mosaic(self):
    quality_band = 'quality band'
    expect = make_expression_graph({
        'arguments': {
            'collection': IMAGES_A,
            'qualityBand': {'constantValue': quality_band},
        },
        'functionName': 'ImageCollection.qualityMosaic',
    })
    expression = ee.ImageCollection('a').qualityMosaic(quality_band)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.ImageCollection('a').qualityMosaic(qualityBand=quality_band)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_random_column(self):
    collection = ee.ImageCollection('a')
    column_name = 'column a'
    seed = 1
    distribution = 'uniform'
    expect = make_expression_graph({
        'arguments': {
            'collection': IMAGES_A,
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

  def test_reduce(self):
    reducer = ee.Reducer.sum()
    parallel_scale = 1
    expect = make_expression_graph({
        'arguments': {
            'collection': IMAGES_A,
            'reducer': {
                'functionInvocationValue': {
                    'functionName': 'Reducer.sum',
                    'arguments': {},
                }
            },
            'parallelScale': {'constantValue': parallel_scale},
        },
        'functionName': 'ImageCollection.reduce',
    })
    expression = ee.ImageCollection('a').reduce(reducer, parallel_scale)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.ImageCollection('a').reduce(
        reducer=reducer, parallelScale=parallel_scale
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_reduce_columns(self):
    collection = ee.ImageCollection('a')
    reducer = ee.Reducer.sum()
    selectors = ['b', 'c']
    weight_selectors = ['d', 'e']
    expect = make_expression_graph({
        'arguments': {
            'collection': IMAGES_A,
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
    collection = ee.ImageCollection('a')
    properties = ['b', 'c']
    reducer = ee.Reducer.sum()
    expect = make_expression_graph({
        'arguments': {
            'collection': IMAGES_A,
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
    collection = ee.ImageCollection('a')
    lookup_in = ['b', 1]
    lookup_out = [2, 3]
    column_name = 'column name'
    expect = make_expression_graph({
        'arguments': {
            'collection': IMAGES_A,
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
    collection = ee.ImageCollection('a')
    expect = make_expression_graph({
        'arguments': {
            'collection': IMAGES_A,
        },
        'functionName': 'Collection.size',
    })
    expression = collection.size()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_style(self):
    collection = ee.ImageCollection('a')
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
            'collection': IMAGES_A,
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

  def test_to_array(self):
    expect = make_expression_graph({
        'arguments': {
            'collection': IMAGES_A,
        },
        'functionName': 'ImageCollection.toArray',
    })
    expression = ee.ImageCollection('a').toArray()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_to_array_per_band(self):
    axis = 1
    expect = make_expression_graph({
        'arguments': {
            'collection': IMAGES_A,
            'axis': {'constantValue': axis},
        },
        'functionName': 'ImageCollection.toArrayPerBand',
    })
    expression = ee.ImageCollection('a').toArrayPerBand(axis)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.ImageCollection('a').toArrayPerBand(axis=axis)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_to_bands(self):
    expect = make_expression_graph({
        'arguments': {
            'collection': IMAGES_A,
        },
        'functionName': 'ImageCollection.toBands',
    })
    expression = ee.ImageCollection('a').toBands()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_to_list(self):
    collection = ee.ImageCollection('a')
    count = 1
    offset = 2
    expect = make_expression_graph({
        'arguments': {
            'collection': IMAGES_A,
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
    collection = ee.ImageCollection('a')
    max_error = 1.1
    expect = make_expression_graph({
        'arguments': {
            'collection': IMAGES_A,
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


class ImageCollectionReduceTest(apitestcase.ApiTestCase):

  def test_and(self):
    collection = ee.ImageCollection('a')
    expect = make_expression_graph({
        'arguments': {'collection': IMAGES_A},
        'functionName': 'reduce.and',
    })
    expression = collection.And()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_max(self):
    collection = ee.ImageCollection('a')
    expect = make_expression_graph({
        'arguments': {'collection': IMAGES_A},
        'functionName': 'reduce.max',
    })
    expression = collection.max()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_mean(self):
    collection = ee.ImageCollection('a')
    expect = make_expression_graph({
        'arguments': {'collection': IMAGES_A},
        'functionName': 'reduce.mean',
    })
    expression = collection.mean()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_median(self):
    collection = ee.ImageCollection('a')
    expect = make_expression_graph({
        'arguments': {'collection': IMAGES_A},
        'functionName': 'reduce.median',
    })
    expression = collection.median()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_min(self):
    collection = ee.ImageCollection('a')
    expect = make_expression_graph({
        'arguments': {'collection': IMAGES_A},
        'functionName': 'reduce.min',
    })
    expression = collection.min()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_mode(self):
    collection = ee.ImageCollection('a')
    expect = make_expression_graph({
        'arguments': {'collection': IMAGES_A},
        'functionName': 'reduce.mode',
    })
    expression = collection.mode()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_or(self):
    collection = ee.ImageCollection('a')
    expect = make_expression_graph({
        'arguments': {'collection': IMAGES_A},
        'functionName': 'reduce.or',
    })
    expression = collection.Or()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_product(self):
    collection = ee.ImageCollection('a')
    expect = make_expression_graph({
        'arguments': {'collection': IMAGES_A},
        'functionName': 'reduce.product',
    })
    expression = collection.product()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_sum(self):
    collection = ee.ImageCollection('a')
    expect = make_expression_graph({
        'arguments': {'collection': IMAGES_A},
        'functionName': 'reduce.sum',
    })
    expression = collection.sum()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)


if __name__ == '__main__':
  unittest.main()
