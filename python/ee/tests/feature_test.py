"""Test for the ee.feature module."""



import unittest

import ee
import apitestcase


class FeatureTest(apitestcase.ApiTestCase):

  def testConstructors(self):
    """Verifies that constructors understand valid parameters."""
    point = ee.Geometry.Point(1, 2)
    from_geometry = ee.Feature(point)
    self.assertEquals(ee.ApiFunction('Feature'), from_geometry.func)
    self.assertEquals({'geometry': point, 'metadata': None}, from_geometry.args)

    from_null_geometry = ee.Feature(None, {'x': 2})
    self.assertEquals(ee.ApiFunction('Feature'), from_null_geometry.func)
    self.assertEquals({'geometry': None, 'metadata': {'x': 2}},
                      from_null_geometry.args)

    computed_geometry = ee.ComputedObject(ee.Function(), {'a': 1})
    computed_properties = ee.ComputedObject(ee.Function(), {'b': 2})
    from_computed_one = ee.Feature(computed_geometry)
    from_computed_both = ee.Feature(computed_geometry, computed_properties)
    self.assertEquals(computed_geometry.func, from_computed_one.func)
    self.assertEquals(computed_geometry.args, from_computed_one.args)
    self.assertEquals(ee.ApiFunction('Feature'), from_computed_both.func)
    self.assertEquals({'geometry': computed_geometry,
                       'metadata': computed_properties},
                      from_computed_both.args)

  def testGetMap(self):
    """Verifies that getMap() uses DrawVector to rasterize Features."""
    feature = ee.Feature(None)
    mapid = feature.getMapId({'color': 'ABCDEF'})
    manual = ee.ApiFunction.call_(
        'DrawVector', ee.FeatureCollection(feature), 'ABCDEF')

    self.assertEquals('fakeMapId', mapid['mapid'])
    self.assertEquals(manual, mapid['image'])


if __name__ == '__main__':
  unittest.main()
