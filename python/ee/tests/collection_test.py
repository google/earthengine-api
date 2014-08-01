"""Test for the ee.collection module."""



import datetime

import unittest

import ee
from ee import apitestcase


class CollectionTestCase(apitestcase.ApiTestCase):

  def testSortAndLimit(self):
    """Verifies the behavior of the sort() and limit() methods."""
    collection = ee.Collection(ee.Function(), {})

    limited = collection.limit(10)
    self.assertEquals(ee.ApiFunction.lookup('Collection.limit'), limited.func)
    self.assertEquals(
        {'collection': collection, 'limit': 10},
        limited.args)

    sorted_collection = collection.sort('bar', True)
    self.assertEquals(
        ee.ApiFunction.lookup('Collection.limit'),
        sorted_collection.func)
    self.assertEquals(
        {'collection': collection, 'key': ee.String('bar'), 'ascending': True},
        sorted_collection.args)

    reverse_sorted_collection = collection.sort('bar', False)
    self.assertEquals(
        ee.ApiFunction.lookup('Collection.limit'),
        reverse_sorted_collection.func)
    self.assertEquals(
        {'collection': collection, 'key': ee.String('bar'), 'ascending': False},
        reverse_sorted_collection.args)

  def testFilter(self):
    """Verifies the behavior of filter() method."""
    collection = ee.Collection(ee.Function(), {})

    # We don't allow empty filters.
    self.assertRaises(Exception, collection.filter)

    filtered = collection.filter(ee.Filter.eq('foo', 1))
    self.assertEquals(
        ee.ApiFunction.lookup('Collection.filter'),
        filtered.func)
    self.assertEquals(
        {'collection': collection, 'filter': ee.Filter.eq('foo', 1)},
        filtered.args)
    self.assertTrue(isinstance(filtered, ee.Collection))

  def testFilterShortcuts(self):
    """Verifies the behavior of the various filtering shortcut methods."""
    collection = ee.Collection(ee.Function(), {})
    geom = {'type': 'Polygon', 'coordinates': [[[1, 2], [3, 4]]]}
    d1 = datetime.datetime.strptime('1/1/2000', '%m/%d/%Y')
    d2 = datetime.datetime.strptime('1/1/2001', '%m/%d/%Y')

    self.assertEquals(collection.filter(ee.Filter.geometry(geom)),
                      collection.filterBounds(geom))
    self.assertEquals(collection.filter(ee.Filter.date(d1)),
                      collection.filterDate(d1))
    self.assertEquals(collection.filter(ee.Filter.date(d1, d2)),
                      collection.filterDate(d1, d2))
    self.assertEquals(collection.filter(ee.Filter.eq('foo', 13)),
                      collection.filterMetadata('foo', 'equals', 13))

  def testMapping(self):
    """Verifies the behavior of the map() method."""
    collection = ee.ImageCollection('foo')
    algorithm = lambda img: img.select('bar')
    mapped = collection.map(algorithm)

    self.assertTrue(isinstance(mapped, ee.ImageCollection))
    self.assertEquals(ee.ApiFunction.lookup('Collection.map'), mapped.func)
    self.assertEquals(collection, mapped.args['collection'])

    # Need to do a serialized comparison for the function body because
    # variables returned from CustomFunction.variable() do not implement
    # __eq__.
    sig = {
        'returns': 'Image',
        'args': [{'name': '_MAPPING_VAR_0_0', 'type': 'Image'}]
    }
    expected_function = ee.CustomFunction(sig, algorithm)
    self.assertEquals(expected_function.serialize(),
                      mapped.args['baseAlgorithm'].serialize())

  def testNestedMapping(self):
    """Verifies that nested map() calls produce distinct variables."""
    collection = ee.FeatureCollection('foo')
    result = collection.map(lambda x: collection.map(lambda y: [x, y]))

    # Verify the signatures.
    self.assertEquals(
        '_MAPPING_VAR_1_0',
        result.args['baseAlgorithm']._signature['args'][0]['name'])
    inner_result = result.args['baseAlgorithm']._body
    self.assertEquals(
        '_MAPPING_VAR_0_0',
        inner_result.args['baseAlgorithm']._signature['args'][0]['name'])

    # Verify the references.
    self.assertEquals(
        '_MAPPING_VAR_1_0',
        inner_result.args['baseAlgorithm']._body[0].varName)
    self.assertEquals(
        '_MAPPING_VAR_0_0',
        inner_result.args['baseAlgorithm']._body[1].varName)

  def testIteration(self):
    """Verifies the behavior of the iterate() method."""
    collection = ee.ImageCollection('foo')
    first = ee.Image(0)
    algorithm = lambda img, prev: img.addBands(ee.Image(prev))
    result = collection.iterate(algorithm, first)

    self.assertEquals(ee.ApiFunction.lookup('Collection.iterate'), result.func)
    self.assertEquals(collection, result.args['collection'])
    self.assertEquals(first, result.args['first'])

    # Need to do a serialized comparison for the function body because
    # variables returned from CustomFunction.variable() do not implement
    # __eq__.
    sig = {
        'returns': 'Object',
        'args': [
            {'name': '_MAPPING_VAR_0_0', 'type': 'Image'},
            {'name': '_MAPPING_VAR_0_1', 'type': 'Object'}
        ]
    }
    expected_function = ee.CustomFunction(sig, algorithm)
    self.assertEquals(expected_function.serialize(),
                      result.args['function'].serialize())


if __name__ == '__main__':
  unittest.main()
