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
    mapped = collection.map(
        (lambda img: img.select('bar')), None, {'baz': 42}, ee.String('quux'))

    self.assertTrue(isinstance(mapped, ee.ImageCollection))
    self.assertEquals(ee.ApiFunction.lookup('Collection.map'), mapped.func)
    self.assertEquals(collection, mapped.args['collection'])
    self.assertEquals({'_MAPPING_VAR_0': '.all'}, mapped.args['dynamicArgs'])
    self.assertEquals({'baz': 42}, mapped.args['constantArgs'])
    self.assertEquals(ee.String('quux'), mapped.args['destination'])

    # Need to do a serialized comparison for the function body because
    # variables returned from CustomFunction.variable() do not implement
    # __eq__.
    sig = {
        'returns': 'Image',
        'args': [{'name': '_MAPPING_VAR_0', 'type': 'Image'}]
    }
    expected_function = ee.CustomFunction(sig, lambda img: img.select('bar'))
    self.assertEquals(expected_function.serialize(),
                      mapped.args['baseAlgorithm'].serialize())


if __name__ == '__main__':
  unittest.main()
