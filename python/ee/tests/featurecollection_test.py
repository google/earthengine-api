#!/usr/bin/env python
"""Test for the ee.featurecollection module."""



from unittest import mock

import unittest

import ee
from ee import apitestcase


class FeatureCollectionTestCase(apitestcase.ApiTestCase):

  def testConstructors(self):
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

  def testGetMapId(self):
    """Verifies that getMap() uses Collection.draw to draw."""
    collection = ee.FeatureCollection('test5')
    mapid = collection.getMapId({'color': 'ABCDEF'})
    manual = ee.ApiFunction.call_('Collection.draw', collection, 'ABCDEF')

    self.assertEqual('fakeMapId', mapid['mapid'])
    self.assertEqual(manual, mapid['image'])

  def testDownload(self):
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

  def testDownloadTableWithCloudApi(self):
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
      self.assertEqual(url, '/v1alpha/5:getFeatures')

  def testSelect(self):
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

if __name__ == '__main__':
  unittest.main()
