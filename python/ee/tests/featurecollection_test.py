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

    from_numeric_id = ee.FeatureCollection(123456)
    self.assertEquals(ee.ApiFunction.lookup('Collection.loadTable'),
                      from_numeric_id.func)
    self.assertEquals({'tableId': 123456}, from_numeric_id.args)

    from_numeric_id_and_geom_column = ee.FeatureCollection(123456, 'xyz')
    self.assertEquals(ee.ApiFunction('Collection.loadTable'),
                      from_numeric_id_and_geom_column.func)
    self.assertEquals({'tableId': 123456, 'geometryColumn': 'xyz'},
                      from_numeric_id_and_geom_column.args)

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

    from_computed_object = ee.FeatureCollection(
        ee.ComputedObject(None, {'x': 'y'}))
    self.assertEquals({'x': 'y'}, from_computed_object.args)

  def testGetMapId(self):
    """Verifies that getMap() uses Collection.draw to draw."""
    collection = ee.FeatureCollection(5)
    mapid = collection.getMapId({'color': 'ABCDEF'})
    manual = ee.ApiFunction.call_('Collection.draw', collection, 'ABCDEF')

    self.assertEquals('fakeMapId', mapid['mapid'])
    self.assertEquals(manual, mapid['image'])


if __name__ == '__main__':
  unittest.main()
