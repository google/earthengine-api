"""Test for the ee.__init__ file."""



import unittest

import ee
from ee import apitestcase


class EETestCase(apitestcase.ApiTestCase):

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

    ee.Initialize()
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
    sig = {'returns': 'Image', 'args': [{'name': 'foo', 'type': 'Image'}]}
    func = ee.CustomFunction(sig, lambda foo: ee.call('fakeFunction', 42, foo))
    expected_custom_function_call = ee.Image(
        ee.ComputedObject(func, {'foo': ee.Image(13)}))
    self.assertEquals(expected_custom_function_call, ee.call(func, 13))
    self.assertEquals(expected_custom_function_call,
                      ee.apply(func, {'foo': 13}))

    # Test None promotion.
    called_with_null = ee.call('fakeFunction', None, 1)
    self.assertEquals(None, called_with_null.args['image1'])

  def testDynamicClasses(self):
    """Verifies dynamic class initialization."""

    # Use a custom set of known functions.
    def MockSend(path, unused_params, unused_method=None, unused_raw=None):
      if path == '/algorithms':
        return {
            'Array': {
                'type': 'Algorithm',
                'args': [
                    {
                        'name': 'values',
                        'type': 'Serializable',
                        'description': ''
                    }
                ],
                'description': '',
                'returns': 'Array'
            },
            'Array.cos': {
                'type': 'Algorithm',
                'args': [
                    {
                        'type': 'Array',
                        'description': '',
                        'name': 'input'
                    }
                ],
                'description': '',
                'returns': 'Array'
            },
            'Kernel.circle': {
                'returns': 'Kernel',
                'args': [
                    {
                        'type': 'float',
                        'description': '',
                        'name': 'radius',
                    },
                    {
                        'default': 1.0,
                        'type': 'float',
                        'optional': True,
                        'description': '',
                        'name': 'scale'
                    },
                    {
                        'default': True,
                        'type': 'boolean',
                        'optional': True,
                        'description': '',
                        'name': 'normalize'
                        }
                    ],
                'type': 'Algorithm',
                'description': ''
            },
            'Reducer.mean': {
                'returns': 'Reducer',
                'args': []
            },
            'fakeFunction': {
                'returns': 'Array',
                'args': [
                    {
                        'type': 'Reducer',
                        'description': '',
                        'name': 'kernel',
                    }
                ]
            }
        }
    ee.data.send_ = MockSend

    ee.Initialize()

    # Verify that the expected classes got generated.
    self.assertTrue(hasattr(ee, 'Array'))
    self.assertTrue(hasattr(ee, 'Kernel'))
    self.assertTrue(hasattr(ee.Array, 'cos'))
    self.assertTrue(hasattr(ee.Kernel, 'circle'))

    # Try out the constructors.
    kernel = ee.ApiFunction('Kernel.circle').call(1, 2)
    self.assertEquals(kernel, ee.Kernel.circle(1, 2))

    array = ee.ApiFunction('Array').call([1, 2])
    self.assertEquals(array, ee.Array([1, 2]))
    self.assertEquals(array, ee.Array(ee.Array([1, 2])))

    # Try out the member function.
    self.assertEquals(ee.ApiFunction('Array.cos').call(array),
                      ee.Array([1, 2]).cos())

    # Test argument promotion.
    f1 = ee.ApiFunction('Array.cos').call([1, 2])
    f2 = ee.ApiFunction('Array.cos').call(ee.Array([1, 2]))
    self.assertEquals(f1, f2)
    self.assertTrue(isinstance(f1, ee.Array))

    f3 = ee.call('fakeFunction', 'mean')
    f4 = ee.call('fakeFunction', ee.Reducer.mean())
    self.assertEquals(f3, f4)

    try:
      ee.call('fakeFunction', 'moo')
      self.fail()
    except ee.EEException as e:
      self.assertTrue('Unknown algorithm: Reducer.moo' in str(e))

  def testPromotion(self):
    """Verifies object promotion rules."""
    self.InitializeApi()

    # Features and Images are both already EEObjects.
    self.assertTrue(isinstance(ee._Promote(ee.Feature(None), 'EEObject'),
                               ee.Feature))
    self.assertTrue(isinstance(ee._Promote(ee.Image(0), 'EEObject'), ee.Image))

    # When asked to promote an untyped object to an EEObject, we
    # currently assume that means Feature.
    untyped = ee.ComputedObject('foo', {})
    self.assertTrue(isinstance(ee._Promote(untyped, 'EEObject'), ee.Feature))

  def testUnboundMethods(self):
    """Verifies unbound method attachment to ee.Algorithms."""

    # Use a custom set of known functions.
    def MockSend(path, unused_params, unused_method=None, unused_raw=None):
      if path == '/algorithms':
        return {
            'Foo': {
                'type': 'Algorithm',
                'args': [],
                'description': '',
                'returns': 'Object'
            },
            'Foo.bar': {
                'type': 'Algorithm',
                'args': [],
                'description': '',
                'returns': 'Object'
            },
            'Quux.baz': {
                'type': 'Algorithm',
                'args': [],
                'description': '',
                'returns': 'Object'
            }
        }
    ee.data.send_ = MockSend

    ee.ApiFunction.importApi(lambda: None, 'Quux', 'Quux')
    ee._InitializeUnboundMethods()

    self.assertTrue(callable(ee.Algorithms.Foo))
    self.assertTrue(callable(ee.Algorithms.Foo.bar))
    self.assertTrue('Quux' not in ee.Algorithms)
    self.assertEquals(ee.call('Foo.bar'), ee.Algorithms.Foo.bar())

if __name__ == '__main__':
  unittest.main()
