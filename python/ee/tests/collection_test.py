#!/usr/bin/env python
"""Test for the ee.collection module."""



import datetime
import re

import unittest

import ee
from ee import apitestcase


class CollectionTestCase(apitestcase.ApiTestCase):

  def testSortAndLimit(self):
    """Verifies the behavior of the sort() and limit() methods."""
    collection = ee.Collection(ee.Function(), {})

    limited = collection.limit(10)
    self.assertEqual(ee.ApiFunction.lookup('Collection.limit'), limited.func)
    self.assertEqual({'collection': collection, 'limit': 10}, limited.args)

    sorted_collection = collection.sort('bar', True)
    self.assertEqual(
        ee.ApiFunction.lookup('Collection.limit'), sorted_collection.func)
    self.assertEqual({
        'collection': collection,
        'key': ee.String('bar'),
        'ascending': True
    }, sorted_collection.args)

    reverse_sorted_collection = collection.sort('bar', False)
    self.assertEqual(
        ee.ApiFunction.lookup('Collection.limit'),
        reverse_sorted_collection.func)
    self.assertEqual({
        'collection': collection,
        'key': ee.String('bar'),
        'ascending': False
    }, reverse_sorted_collection.args)

  def testFilter(self):
    """Verifies the behavior of filter() method."""
    collection = ee.Collection(ee.Function(), {})

    # We don't allow empty filters.
    self.assertRaises(Exception, collection.filter)

    filtered = collection.filter(ee.Filter.eq('foo', 1))
    self.assertEqual(ee.ApiFunction.lookup('Collection.filter'), filtered.func)
    self.assertEqual({
        'collection': collection,
        'filter': ee.Filter.eq('foo', 1)
    }, filtered.args)
    self.assertIsInstance(filtered, ee.Collection)

  def testFilterShortcuts(self):
    """Verifies the behavior of the various filtering shortcut methods."""
    collection = ee.Collection(ee.Function(), {})
    geom = {'type': 'Polygon', 'coordinates': [[[1, 2], [3, 4]]]}
    d1 = datetime.datetime.strptime('1/1/2000', '%m/%d/%Y')
    d2 = datetime.datetime.strptime('1/1/2001', '%m/%d/%Y')

    self.assertEqual(
        collection.filter(ee.Filter.geometry(geom)),
        collection.filterBounds(geom))
    self.assertEqual(
        collection.filter(ee.Filter.date(d1)), collection.filterDate(d1))
    self.assertEqual(
        collection.filter(ee.Filter.date(d1, d2)), collection.filterDate(
            d1, d2))
    self.assertEqual(
        collection.filter(ee.Filter.eq('foo', 13)),
        collection.filterMetadata('foo', 'equals', 13))

  def testMapping(self):
    """Verifies the behavior of the map() method."""
    collection = ee.ImageCollection('foo')
    algorithm = lambda img: img.select('bar')
    mapped = collection.map(algorithm)

    self.assertIsInstance(mapped, ee.ImageCollection)
    self.assertEqual(ee.ApiFunction.lookup('Collection.map'), mapped.func)
    self.assertEqual(collection, mapped.args['collection'])

    # Need to do a serialized comparison for the function body because
    # variables returned from CustomFunction.variable() do not implement
    # __eq__.
    sig = {
        'returns': 'Image',
        'args': [{'name': '_MAPPING_VAR_0_0', 'type': 'Image'}]
    }
    expected_function = ee.CustomFunction(sig, algorithm)
    self.assertEqual(expected_function.serialize(),
                     mapped.args['baseAlgorithm'].serialize())

  def testNestedMapping(self):
    """Verifies that nested map() calls produce distinct variables."""
    collection = ee.FeatureCollection('foo')
    result = collection.map(lambda x: collection.map(lambda y: [x, y]))

    # Verify the signatures.
    self.assertEqual('_MAPPING_VAR_1_0',
                     result.args['baseAlgorithm']._signature['args'][0]['name'])
    inner_result = result.args['baseAlgorithm']._body
    self.assertEqual(
        '_MAPPING_VAR_0_0',
        inner_result.args['baseAlgorithm']._signature['args'][0]['name'])

    # Verify the references.
    self.assertEqual('_MAPPING_VAR_1_0',
                     inner_result.args['baseAlgorithm']._body[0].varName)
    self.assertEqual('_MAPPING_VAR_0_0',
                     inner_result.args['baseAlgorithm']._body[1].varName)

  def testIteration(self):
    """Verifies the behavior of the iterate() method."""
    collection = ee.ImageCollection('foo')
    first = ee.Image(0)
    algorithm = lambda img, prev: img.addBands(ee.Image(prev))
    result = collection.iterate(algorithm, first)

    self.assertEqual(ee.ApiFunction.lookup('Collection.iterate'), result.func)
    self.assertEqual(collection, result.args['collection'])
    self.assertEqual(first, result.args['first'])

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
    self.assertEqual(expected_function.serialize(),
                     result.args['function'].serialize())

  def testNestedFunctions(self):
    """Verifies that nested function calls produce distinct variables."""
    fc = ee.FeatureCollection('fc')
    def f0(feat):
      return ee.Dictionary(feat.get('get')).map(f1)
    def f1(k1, v1):
      def f2(k2, v2):
        def f3(k3, v3):
          def f4(k4):
            return (ee.Number(1).add(ee.Number(k1)).add(ee.Number(k2))
                    .add(ee.Number(k3)).add(ee.Number(k4)))
          return ee.Dictionary(v3).map(f4)
        return ee.Dictionary(v2).map(f3)
      return ee.Dictionary(v1).map(f2)
    mapped_vars = re.findall(r'\d_\d', fc.map(f0).serialize())
    self.assertEqual(
        '0_0, 1_0, 1_1, 2_0, 2_1, 3_0, 3_1, 4_0',
        ', '.join(sorted(set(mapped_vars))))


if __name__ == '__main__':
  unittest.main()
