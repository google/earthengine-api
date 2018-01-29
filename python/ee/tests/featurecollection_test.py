#!/usr/bin/env python
"""Test for the ee.featurecollection module."""



import unittest

import ee
from ee import apitestcase


class FeatureCollectionTestCase(apitestcase.ApiTestCase):

  def testConstructors(self):
    """Verifies that constructors understand valid parameters."""
    from_id = ee.FeatureCollection('abcd')
    self.assertEquals(ee.ApiFunction.lookup('Collection.loadTable'),
                      from_id.func)
    self.assertEquals({'tableId': 'abcd'}, from_id.args)

    from_id_and_geom_column = ee.FeatureCollection('abcd', 'xyz')
    self.assertEquals(ee.ApiFunction.lookup('Collection.loadTable'),
                      from_id_and_geom_column.func)
    self.assertEquals({'tableId': 'abcd', 'geometryColumn': 'xyz'},
                      from_id_and_geom_column.args)

    geometry = ee.Geometry.Point(1, 2)
    feature = ee.Feature(geometry)
    from_geometries = ee.FeatureCollection([geometry])
    from_single_geometry = ee.FeatureCollection(geometry)
    from_features = ee.FeatureCollection([feature])
    from_single_feature = ee.FeatureCollection(feature)
    self.assertEquals(from_geometries, from_single_geometry)
    self.assertEquals(from_geometries, from_features)
    self.assertEquals(from_geometries, from_single_feature)
    self.assertEquals(ee.ApiFunction.lookup('Collection'), from_geometries.func)
    self.assertEquals({'features': [feature]}, from_geometries.args)

    # Test a computed list object.
    l = ee.List([feature]).slice(0)
    from_list = ee.FeatureCollection(l)
    self.assertEquals({'features': l}, from_list.args)

    from_computed_object = ee.FeatureCollection(
        ee.ComputedObject(None, {'x': 'y'}))
    self.assertEquals({'x': 'y'}, from_computed_object.args)

  def testGetMapId(self):
    """Verifies that getMap() uses Collection.draw to draw."""
    collection = ee.FeatureCollection('test5')
    mapid = collection.getMapId({'color': 'ABCDEF'})
    manual = ee.ApiFunction.call_('Collection.draw', collection, 'ABCDEF')

    self.assertEquals('fakeMapId', mapid['mapid'])
    self.assertEquals(manual, mapid['image'])

  def testDownload(self):
    """Verifies that Download ID and URL generation."""
    csv_url = ee.FeatureCollection('test7').getDownloadURL('csv')

    self.assertEquals('/table', self.last_table_call['url'])
    self.assertEquals(
        {
            'table': ee.FeatureCollection('test7').serialize(),
            'json_format': 'v2',
            'format': 'CSV'
        },
        self.last_table_call['data'])
    self.assertEquals('/api/table?docid=5&token=6', csv_url)

    everything_url = ee.FeatureCollection('test8').getDownloadURL(
        'json', 'bar, baz', 'qux')
    self.assertEquals(
        {
            'table': ee.FeatureCollection('test8').serialize(),
            'json_format': 'v2',
            'format': 'JSON',
            'selectors': 'bar, baz',
            'filename': 'qux'
        },
        self.last_table_call['data'])
    self.assertEquals('/api/table?docid=5&token=6', everything_url)

    self.assertEquals(ee.FeatureCollection('test7').getDownloadUrl('csv'),
                      ee.FeatureCollection('test7').getDownloadURL('csv'))

  def testSelect(self):
    def equals(c1, c2):
      self.assertEquals(c1.serialize(), c2.serialize())

    fc = ee.FeatureCollection(ee.Feature(ee.Geometry.Point(0, 0), {'a': 5}))
    equals(fc.select('a'), fc.select(['a']))
    equals(fc.select('a', 'b'), fc.select(['a', 'b']))
    equals(fc.select('a', 'b', 'c'), fc.select(['a', 'b', 'c']))
    equals(fc.select('a', 'b', 'c', 'd'), fc.select(['a', 'b', 'c', 'd']))

    equals(fc.select(['a']), fc.select(['a'], None, True))
    equals(fc.select(['a'], None, False),
           fc.select(propertySelectors=['a'], retainGeometry=False))

if __name__ == '__main__':
  unittest.main()
