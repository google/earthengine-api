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


class ImageCollectionTestCase(apitestcase.ApiTestCase):

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

  def test_first(self):
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



if __name__ == '__main__':
  unittest.main()
