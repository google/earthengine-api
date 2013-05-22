"""Test for the ee.__init__ file."""



import unittest

import ee
import apitestcase


class EETestCase(unittest.TestCase):

  def setUp(self):
    ee.Reset()

  def testInitialization(self):
    """Verifies library initialization."""

    def MockSend(path, params, unused_method=None, unused_raw=None):
      if path == '/algorithms':
        return {}
      else:
        raise Exception('Unexpected API call to %s with %s' % (path, params))
    ee.data.send_ = MockSend

    # Verify that the base state is uninitialized.
    self.assertFalse(ee.data._initialized)
    self.assertEquals(ee.data._api_base_url, None)
    self.assertEquals(ee.ApiFunction._api, None)
    self.assertFalse(ee.Image._initialized)

    # Verify that ee.Initialize() sets the URL and initializes classes.
    ee.Initialize(None, 'foo')
    self.assertTrue(ee.data._initialized)
    self.assertEquals(ee.data._api_base_url, 'foo/api')
    self.assertEquals(ee.ApiFunction._api, {})
    self.assertTrue(ee.Image._initialized)

    # Verify that parameterless ee.Initialize() does not override custom URLs.
    ee.Initialize()
    self.assertTrue(ee.data._initialized)
    self.assertEquals(ee.data._api_base_url, 'foo/api')

    # Verify that ee.Reset() reverts everything to the base state.
    ee.Reset()
    self.assertFalse(ee.data._initialized)
    self.assertEquals(ee.data._api_base_url, None)
    self.assertEquals(ee.ApiFunction._api, None)
    self.assertFalse(ee.Image._initialized)

  def testCallAndApply(self):
    """Verifies library initialization."""

    # Use a custom set of known functions.
    def MockSend(path, params, unused_method=None, unused_raw=None):
      if path == '/algorithms':
        return {
            'fakeFunction': {
                'type': 'Algorithm',
                'args': [
                    {'name': 'image1', 'type': 'Image'},
                    {'name': 'image2', 'type': 'Image'}
                ],
                'returns': 'Image'
            },
            'Image.constant': apitestcase.BUILTIN_FUNCTIONS['Image.constant']
        }
      else:
        raise Exception('Unexpected API call to %s with %s' % (path, params))
    ee.data.send_ = MockSend

    image1 = ee.Image(1)
    image2 = ee.Image(2)
    expected = ee.Image(ee.ComputedObject(
        ee.ApiFunction.lookup('fakeFunction'),
        {'image1': image1, 'image2': image2}))

    applied_with_images = ee.apply(
        'fakeFunction', {'image1': image1, 'image2': image2})
    self.assertEquals(expected, applied_with_images)

    applied_with_numbers = ee.apply('fakeFunction', {'image1': 1, 'image2': 2})
    self.assertEquals(expected, applied_with_numbers)

    called_with_numbers = ee.call('fakeFunction', 1, 2)
    self.assertEquals(expected, called_with_numbers)

    # Test call and apply() with a custom function.
    func = ee.CustomFunction({'foo': ee.Image}, ee.Image,
                             lambda foo: ee.call('fakeFunction', 42, foo))
    expected_custom_function_call = ee.Image(
        ee.ComputedObject(func, {'foo': ee.Image(13)}))
    self.assertEquals(expected_custom_function_call, ee.call(func, 13))
    self.assertEquals(expected_custom_function_call,
                      ee.apply(func, {'foo': 13}))

    # Test None promotion.
    called_with_null = ee.call('fakeFunction', None, 1)
    self.assertEquals(None, called_with_null.args['image1'])


if __name__ == '__main__':
  unittest.main()
