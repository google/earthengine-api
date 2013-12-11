"""Test for the ee.element module."""



import unittest

import ee
from ee import apitestcase


class ElementTestCase(apitestcase.ApiTestCase):

  def testSet(self):
    """Verifies Element.set() keyword argument interpretation."""

    def AssertProperties(expected, image):
      properties = {}
      while image.func == ee.ApiFunction.lookup('Element.set'):
        key = image.args['key']
        if not isinstance(key, basestring):
          key = key.encode()
        properties[key] = image.args['value']
        image = image.args['object']
      self.assertEquals(ee.Image(1), image)
      self.assertEquals(expected, properties)

    image = ee.Image(1)

    AssertProperties({'foo': 'bar'}, image.set({'foo': 'bar'}))
    AssertProperties({'foo': 'bar'}, image.set({'properties': {'foo': 'bar'}}))
    AssertProperties({'properties': 5}, image.set({'properties': 5}))
    AssertProperties({'properties': image}, image.set({'properties': image}))
    AssertProperties({'properties': {'foo': 'bar'}, 'baz': 'quux'},
                     image.set({'properties': {'foo': 'bar'}, 'baz': 'quux'}))
    AssertProperties({'foo': 'bar', 'baz': 'quux'},
                     image.set('foo', 'bar', 'baz', 'quux'))


if __name__ == '__main__':
  unittest.main()
