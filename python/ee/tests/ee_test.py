#!/usr/bin/env python
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

    # Verify that ee.Initialize(None) does not override custom URLs.
    ee.Initialize(None)
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

    ee.Initialize(None)
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

    ee.Initialize(None)

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

  def testDynamicConstructor(self):
    # Test the behavior of the dynamic class constructor.

    # Use a custom set of known functions for classes Foo and Bar.
    # Foo Foo(arg1, [arg2])
    # Bar Foo.makeBar()
    # Bar Foo.takeBar(Bar bar)
    # Baz Foo.baz()
    def MockSend(path, unused_params, unused_method=None, unused_raw=None):
      if path == '/algorithms':
        return {
            'Foo': {
                'returns': 'Foo',
                'args': [
                    {'name': 'arg1', 'type': 'Object'},
                    {'name': 'arg2', 'type': 'Object', 'optional': True}
                ]
            },
            'Foo.makeBar': {
                'returns': 'Bar',
                'args': [{'name': 'foo', 'type': 'Foo'}]
            },
            'Foo.takeBar': {
                'returns': 'Bar',
                'args': [
                    {'name': 'foo', 'type': 'Foo'},
                    {'name': 'bar', 'type': 'Bar'}
                ]
            },
            'Bar.baz': {
                'returns': 'Baz',
                'args': [{'name': 'bar', 'type': 'Bar'}]
            }
        }

    ee.data.send_ = MockSend
    ee.Initialize(None)

    # Try to cast something that's already of the right class.
    x = ee.Foo('argument')
    self.assertEquals(ee.Foo(x), x)

    # Tests for dynamic classes, where there is a constructor.
    #
    # If there's more than 1 arg, call the constructor.
    x = ee.Foo('a')
    y = ee.Foo(x, 'b')
    ctor = ee.ApiFunction.lookup('Foo')
    self.assertEquals(y.func, ctor)
    self.assertEquals(y.args, {'arg1': x, 'arg2': 'b'})

    # Can't cast a primitive; call the constructor.
    self.assertEquals(ctor, ee.Foo(1).func)

    # A computed object, but not this class; call the constructor.
    self.assertEquals(ctor, ee.Foo(ee.List([1, 2, 3])).func)

    # Tests for dynamic classes, where there isn't a constructor.
    #
    # Foo.makeBar and Foo.takeBar should have caused Bar to be generated.
    self.assertTrue(hasattr(ee, 'Bar'))

    # Make sure we can create a Bar.
    bar = ee.Foo(1).makeBar()
    self.assertTrue(isinstance(bar, ee.Bar))

    # Now cast something else to a Bar and verify it was just a cast.
    cast = ee.Bar(ee.Foo(1))
    self.assertTrue(isinstance(cast, ee.Bar))
    self.assertEquals(ctor, cast.func)

    # We shouldn't be able to cast with more than 1 arg.
    try:
      ee.Bar(x, 'foo')
      self.fail('Expected an exception.')
    except ee.EEException as e:
      self.assertTrue('Too many arguments for ee.Bar' in str(e))

    # We shouldn't be able to cast a primitive.
    try:
      ee.Bar(1)
      self.fail('Expected an exception.')
    except ee.EEException as e:
      self.assertTrue('Must be a ComputedObject' in str(e))

  def testDynamicConstructorCasting(self):
    """Test the behavior of casting with dynamic classes."""
    self.InitializeApi()
    result = ee.Geometry.Rectangle(1, 1, 2, 2).bounds(0, 'EPSG:4326')
    expected = (ee.Geometry.Polygon([[1, 2], [1, 1], [2, 1], [2, 2]])
                .bounds(ee.ErrorMargin(0), ee.Projection('EPSG:4326')))
    self.assertEquals(expected, result)

  def testPromotion(self):
    """Verifies object promotion rules."""
    self.InitializeApi()

    # Features and Images are both already Elements.
    self.assertTrue(isinstance(ee._Promote(ee.Feature(None), 'Element'),
                               ee.Feature))
    self.assertTrue(isinstance(ee._Promote(ee.Image(0), 'Element'), ee.Image))

    # Promote an untyped object to an Element.
    untyped = ee.ComputedObject('foo', {})
    self.assertTrue(isinstance(ee._Promote(untyped, 'Element'), ee.Element))

    # Promote an untyped variable to an Element.
    untyped = ee.ComputedObject(None, None, 'foo')
    self.assertTrue(isinstance(ee._Promote(untyped, 'Element'), ee.Element))
    self.assertEquals('foo', ee._Promote(untyped, 'Element').varName)

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
            },
            'last': {
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
    self.assertNotEquals(ee.Algorithms.Foo.bar(), ee.Algorithms.last())

  def testDatePromtion(self):
    # Make a feature, put a time in it, and get it out as a date.
    self.InitializeApi()
    point = ee.Geometry.Point(1, 2)
    feature = ee.Feature(point, {'x': 1, 'y': 2})
    date_range = ee.call('DateRange', feature.get('x'), feature.get('y'))

    # Check that the start and end args are wrapped in a call to Date.
    self.assertEquals(date_range.args['start'].func._signature['name'], 'Date')
    self.assertEquals(date_range.args['end'].func._signature['name'], 'Date')


if __name__ == '__main__':
  unittest.main()
