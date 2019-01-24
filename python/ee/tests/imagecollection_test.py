#!/usr/bin/env python
"""Test for the ee.imagecollection module."""



import unittest

import ee
from ee import apitestcase


class ImageCollectionTestCase(apitestcase.ApiTestCase):

  def testImageCollectionConstructors(self):
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

  def testImperativeFunctions(self):
    """Verifies that imperative functions return ready values."""
    image_collection = ee.ImageCollection(ee.Image(1))
    self.assertEqual({'value': 'fakeValue'}, image_collection.getInfo())
    self.assertEqual('fakeMapId', image_collection.getMapId()['mapid'])

  def testFilter(self):
    """Verifies that filtering an ImageCollection wraps the result."""
    collection = ee.ImageCollection(ee.Image(1))
    noop_filter = ee.Filter()
    filtered = collection.filter(noop_filter)
    self.assertTrue(isinstance(filtered, ee.ImageCollection))
    self.assertEqual(ee.ApiFunction.lookup('Collection.filter'), filtered.func)
    self.assertEqual({
        'collection': collection,
        'filter': noop_filter
    }, filtered.args)

  def testFirst(self):
    """Verifies that first gets promoted properly."""
    first = ee.ImageCollection(ee.Image(1)).first()
    self.assertTrue(isinstance(first, ee.Image))
    self.assertEqual(ee.ApiFunction.lookup('Collection.first'), first.func)


if __name__ == '__main__':
  unittest.main()
