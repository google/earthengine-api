#!/usr/bin/env python3
"""Test for the ee.__init__ file."""

from unittest import mock

import google.auth
from google.oauth2 import credentials

import unittest
import ee
from ee import apitestcase


class EETestCase(apitestcase.ApiTestCase):

  def setUp(self):
    super().setUp()
    ee.Reset()
    ee.data._install_cloud_api_resource = lambda: None

  def testInitialization(self):
    """Verifies library initialization."""

    def MockAlgorithms():
      return {}

    ee.data.getAlgorithms = MockAlgorithms

    # Verify that the base state is uninitialized.
    self.assertFalse(ee.data._initialized)
    self.assertIsNone(ee.data._api_base_url)
    self.assertEqual(ee.ApiFunction._api, {})
    self.assertFalse(ee.Image._initialized)

    # Verify that ee.Initialize() sets the URL and initializes classes.
    ee.Initialize(None, 'foo', project='my-project')
    self.assertTrue(ee.data._initialized)
    self.assertEqual(ee.data._api_base_url, 'foo/api')
    self.assertEqual(ee.data._cloud_api_user_project, 'my-project')
    self.assertEqual(ee.ApiFunction._api, {})
    self.assertTrue(ee.Image._initialized)

    # Verify that ee.Initialize() without a URL does not override custom URLs.
    ee.Initialize(None, project='my-project')
    self.assertTrue(ee.data._initialized)
    self.assertEqual(ee.data._api_base_url, 'foo/api')

    # Verify that ee.Reset() reverts everything to the base state.
    ee.Reset()
    self.assertFalse(ee.data._initialized)
    self.assertIsNone(ee.data._api_base_url)
    self.assertIsNone(ee.data._cloud_api_user_project)
    self.assertEqual(ee.ApiFunction._api, {})
    self.assertFalse(ee.Image._initialized)

  def testProjectInitialization(self):
    """Verifies that we can fetch the client project from many locations.

    This also exercises the logic in data.get_persistent_credentials.
    """

    cred_args = dict(refresh_token='rt', quota_project_id='qp1')
    google_creds = credentials.Credentials(token=None, quota_project_id='qp2')
    expected_project = None

    def CheckDataInit(**kwargs):
      self.assertEqual(expected_project, kwargs.get('project'))

    moc = mock.patch.object
    with (moc(ee.oauth, 'get_credentials_arguments', new=lambda: cred_args),
          moc(ee.oauth, 'is_valid_credentials', new=lambda _: True),
          moc(google.auth, 'default', new=lambda: (google_creds, None)),
          moc(ee.data, 'initialize', side_effect=CheckDataInit) as inits):
      expected_project = 'qp0'
      ee.Initialize(project='qp0')

      expected_project = 'qp1'
      ee.Initialize()

      cred_args['refresh_token'] = None
      ee.Initialize()

      cred_args['quota_project_id'] = None
      expected_project = 'qp2'
      ee.Initialize()
      self.assertEqual(4, inits.call_count)

      google_creds = google_creds.with_quota_project(None)
      with self.assertRaisesRegex(ee.EEException, '.*no project found..*'):
        ee.Initialize()
      self.assertEqual(4, inits.call_count)

      msg = 'Earth Engine API has not been used in project 764086051850 before'
      with moc(ee.ApiFunction, 'initialize', side_effect=ee.EEException(msg)):
        with self.assertRaisesRegex(ee.EEException, '.*no project found..*'):
          ee.Initialize()
      self.assertEqual(4, inits.call_count)

      oauth_project = '517222506229'
      expected_project = oauth_project
      msg = (
          'Caller does not have required permission to use project ' +
          oauth_project
      )
      with moc(ee.ApiFunction, 'initialize', side_effect=ee.EEException(msg)):
        with self.assertRaisesRegex(ee.EEException, '.*no project found..*'):
          ee.Initialize(project=oauth_project)
      self.assertEqual(5, inits.call_count)

      cred_args['client_id'] = '123456789-xxx'
      cred_args['refresh_token'] = 'rt'
      expected_project = '123456789'
      ee.Initialize()
      self.assertEqual(6, inits.call_count)

      cred_args['client_id'] = '764086051850-xxx'  # dummy usable-auth client
      with self.assertRaisesRegex(ee.EEException, '.*no project found..*'):
        ee.Initialize()
      self.assertEqual(6, inits.call_count)

  def testCallAndApply(self):
    """Verifies library initialization."""

    # Use a custom set of known functions.
    def MockAlgorithms():
      return {
          'fakeFunction': {
              'type': 'Algorithm',
              'args': [{
                  'name': 'image1',
                  'type': 'Image'
              }, {
                  'name': 'image2',
                  'type': 'Image'
              }],
              'returns': 'Image'
          },
          'Image.constant': apitestcase.GetAlgorithms()['Image.constant']
      }

    ee.data.getAlgorithms = MockAlgorithms

    ee.Initialize(None, project='my-project')
    image1 = ee.Image(1)
    image2 = ee.Image(2)
    expected = ee.Image(
        ee.ComputedObject(
            ee.ApiFunction.lookup('fakeFunction'), {
                'image1': image1,
                'image2': image2
            }))

    applied_with_images = ee.apply('fakeFunction', {
        'image1': image1,
        'image2': image2
    })
    self.assertEqual(expected, applied_with_images)

    applied_with_numbers = ee.apply('fakeFunction', {'image1': 1, 'image2': 2})
    self.assertEqual(expected, applied_with_numbers)

    called_with_numbers = ee.call('fakeFunction', 1, 2)
    self.assertEqual(expected, called_with_numbers)

    # Test call and apply() with a custom function.
    sig = {'returns': 'Image', 'args': [{'name': 'foo', 'type': 'Image'}]}
    func = ee.CustomFunction(sig, lambda foo: ee.call('fakeFunction', 42, foo))
    expected_custom_function_call = ee.Image(
        ee.ComputedObject(func, {'foo': ee.Image(13)}))
    self.assertEqual(expected_custom_function_call, ee.call(func, 13))
    self.assertEqual(expected_custom_function_call, ee.apply(func, {'foo': 13}))

    # Test None promotion.
    called_with_null = ee.call('fakeFunction', None, 1)
    self.assertIsNone(called_with_null.args['image1'])

  def testDynamicClasses(self):
    """Verifies dynamic class initialization."""

    # Use a custom set of known functions.
    def MockAlgorithms():
      return {
          'Array': {
              'type': 'Algorithm',
              'args': [{
                  'name': 'values',
                  'type': 'Serializable',
                  'description': ''
              }],
              'description': '',
              'returns': 'Array'
          },
          'Array.cos': {
              'type': 'Algorithm',
              'args': [{
                  'type': 'Array',
                  'description': '',
                  'name': 'input'
              }],
              'description': '',
              'returns': 'Array'
          },
          'Kernel.circle': {
              'returns': 'Kernel',
              'args': [{
                  'type': 'float',
                  'description': '',
                  'name': 'radius',
              }, {
                  'default': 1.0,
                  'type': 'float',
                  'optional': True,
                  'description': '',
                  'name': 'scale'
              }, {
                  'default': True,
                  'type': 'boolean',
                  'optional': True,
                  'description': '',
                  'name': 'normalize'
              }, {
                  'default': 1.0,
                  'type': 'float',
                  'optional': True,
                  'description': '',
                  'name': 'magnitude'
              }],
              'type': 'Algorithm',
              'description': ''
          },
          'Reducer.mean': {
              'returns': 'Reducer',
              'args': []
          },
          'fakeFunction': {
              'returns':
                  'Array',
              'args': [{
                  'type': 'Reducer',
                  'description': '',
                  'name': 'kernel',
              }]
          }
      }

    ee.data.getAlgorithms = MockAlgorithms

    ee.Initialize(None, project='my-project')

    # Verify that the expected classes got generated.
    self.assertTrue(hasattr(ee, 'Array'))
    self.assertTrue(hasattr(ee, 'Kernel'))
    self.assertTrue(hasattr(ee.Array, 'cos'))
    self.assertTrue(hasattr(ee.Kernel, 'circle'))

    # Try out the constructors.
    kernel = ee.ApiFunction('Kernel.circle').call(1, 'meters', True, 2)
    self.assertEqual(kernel, ee.Kernel.circle(1, 'meters', True, 2))

    array = ee.ApiFunction('Array').call([1, 2])
    self.assertEqual(array, ee.Array([1, 2]))
    self.assertEqual(array, ee.Array(ee.Array([1, 2])))

    # Try out the member function.
    self.assertEqual(
        ee.ApiFunction('Array.cos').call(array),
        ee.Array([1, 2]).cos())

    # Test argument promotion.
    f1 = ee.ApiFunction('Array.cos').call([1, 2])
    f2 = ee.ApiFunction('Array.cos').call(ee.Array([1, 2]))
    self.assertEqual(f1, f2)
    self.assertIsInstance(f1, ee.Array)

    f3 = ee.call('fakeFunction', 'mean')
    f4 = ee.call('fakeFunction', ee.Reducer.mean())
    self.assertEqual(f3, f4)

    with self.assertRaisesRegex(
        ee.EEException, 'Unknown algorithm: Reducer.moo'):
      ee.call('fakeFunction', 'moo')

  def testDynamicConstructor(self):
    # Test the behavior of the dynamic class constructor.

    # Use a custom set of known functions for classes Foo and Bar.
    # Foo Foo(arg1, [arg2])
    # Bar Foo.makeBar()
    # Bar Foo.takeBar(Bar bar)
    # Baz Foo.baz()
    def MockAlgorithms():
      return {
          'Foo': {
              'returns':
                  'Foo',
              'args': [{
                  'name': 'arg1',
                  'type': 'Object'
              }, {
                  'name': 'arg2',
                  'type': 'Object',
                  'optional': True
              }]
          },
          'Foo.makeBar': {
              'returns': 'Bar',
              'args': [{
                  'name': 'foo',
                  'type': 'Foo'
              }]
          },
          'Foo.takeBar': {
              'returns':
                  'Bar',
              'args': [{
                  'name': 'foo',
                  'type': 'Foo'
              }, {
                  'name': 'bar',
                  'type': 'Bar'
              }]
          },
          'Bar.baz': {
              'returns': 'Baz',
              'args': [{
                  'name': 'bar',
                  'type': 'Bar'
              }]
          }
      }

    ee.data.getAlgorithms = MockAlgorithms
    ee.Initialize(None, project='my-project')

    # Try to cast something that's already of the right class.
    x = ee.Foo('argument')
    self.assertEqual(ee.Foo(x), x)

    # Tests for dynamic classes, where there is a constructor.
    #
    # If there's more than 1 arg, call the constructor.
    x = ee.Foo('a')
    y = ee.Foo(x, 'b')
    ctor = ee.ApiFunction.lookup('Foo')
    self.assertEqual(y.func, ctor)
    self.assertEqual(y.args, {'arg1': x, 'arg2': 'b'})

    # Can't cast a primitive; call the constructor.
    self.assertEqual(ctor, ee.Foo(1).func)

    # A computed object, but not this class; call the constructor.
    self.assertEqual(ctor, ee.Foo(ee.List([1, 2, 3])).func)

    # Tests for dynamic classes, where there isn't a constructor.
    #
    # Foo.makeBar and Foo.takeBar should have caused Bar to be generated.
    self.assertTrue(hasattr(ee, 'Bar'))

    # Make sure we can create a Bar.
    bar = ee.Foo(1).makeBar()
    self.assertIsInstance(bar, ee.Bar)

    # Now cast something else to a Bar and verify it was just a cast.
    cast = ee.Bar(ee.Foo(1))
    self.assertIsInstance(cast, ee.Bar)
    self.assertEqual(ctor, cast.func)

    # Tests for kwargs.
    foo = ee.Foo(arg1='a', arg2='b')
    self.assertEqual(foo.args, {'arg1': 'a', 'arg2': 'b'})
    foo = ee.Foo('a', arg2='b')
    self.assertEqual(foo.args, {'arg1': 'a', 'arg2': 'b'})
    foo = ee.Foo(arg2='b', arg1='a')
    self.assertEqual(foo.args, {'arg1': 'a', 'arg2': 'b'})

    # We should get an error for an invalid kwarg.
    with self.assertRaisesRegex(
        ee.EEException,
        "Unrecognized arguments {'arg_invalid'} to function: Foo",
    ):
      ee.Foo('a', arg_invalid='b')

    # We shouldn't be able to cast with more than 1 arg.
    with self.assertRaisesRegex(
        ee.EEException, 'Too many arguments for ee.Bar'):
      ee.Bar(x, 'foo')

    # We shouldn't be able to cast a primitive.
    with self.assertRaisesRegex(ee.EEException, 'Must be a ComputedObject'):
      ee.Bar(1)

  def testDynamicConstructorCasting(self):
    """Test the behavior of casting with dynamic classes."""
    self.InitializeApi()
    result = ee.Geometry.Rectangle(1, 1, 2, 2).bounds(0, 'EPSG:4326')
    expected = (
        ee.Geometry.Polygon([[1, 2], [1, 1], [2, 1], [2, 2]]).bounds(
            ee.ErrorMargin(0), ee.Projection('EPSG:4326')))
    self.assertEqual(expected, result)

  def testPromotion(self):
    """Verifies object promotion rules."""
    self.InitializeApi()

    # Features and Images are both already Elements.
    self.assertIsInstance(ee._Promote(ee.Feature(None), 'Element'), ee.Feature)
    self.assertIsInstance(ee._Promote(ee.Image(0), 'Element'), ee.Image)

    # Promote an untyped object to an Element.
    untyped = ee.ComputedObject('foo', {})
    self.assertIsInstance(ee._Promote(untyped, 'Element'), ee.Element)

    # Promote an untyped variable to an Element.
    untyped = ee.ComputedObject(None, None, 'foo')
    self.assertIsInstance(ee._Promote(untyped, 'Element'), ee.Element)
    self.assertEqual('foo', ee._Promote(untyped, 'Element').varName)

  def testUnboundMethods(self):
    """Verifies unbound method attachment to ee.Algorithms."""

    # Use a custom set of known functions.
    def MockAlgorithms():
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

    ee.data.getAlgorithms = MockAlgorithms

    ee.ApiFunction.importApi(lambda: None, 'Quux', 'Quux')
    ee._InitializeUnboundMethods()

    self.assertTrue(callable(ee.Algorithms.Foo))
    self.assertTrue(callable(ee.Algorithms.Foo.bar))
    self.assertNotIn('Quux', ee.Algorithms)
    self.assertEqual(ee.call('Foo.bar'), ee.Algorithms.Foo.bar())
    self.assertNotEqual(ee.Algorithms.Foo.bar(), ee.Algorithms.last())

  def testNonAsciiDocumentation(self):
    """Verifies that non-ASCII characters in documentation work."""
    foo = '\uFB00\u00F6\u01EB'
    bar = 'b\u00E4r'
    baz = 'b\u00E2\u00DF'

    def MockAlgorithms():
      return {
          'Foo': {
              'type': 'Algorithm',
              'args': [],
              'description': foo,
              'returns': 'Object'
          },
          'Image.bar': {
              'type': 'Algorithm',
              'args': [{
                  'name': 'bar',
                  'type': 'Bar',
                  'description': bar
              }],
              'description': '',
              'returns': 'Object'
          },
          'Image.oldBar': {
              'type': 'Algorithm',
              'args': [],
              'description': foo,
              'returns': 'Object',
              'deprecated': 'Causes fire'
          },
          'Image.baz': {
              'type': 'Algorithm',
              'args': [],
              'description': baz,
              'returns': 'Object'
          },
          'Image.newBaz': {
              'type': 'Algorithm',
              'args': [],
              'description': baz,
              'returns': 'Object',
              'preview': True
          }
      }

    ee.data.getAlgorithms = MockAlgorithms

    ee.Initialize(None, project='my-project')

    # The initialisation shouldn't blow up.
    self.assertTrue(callable(ee.Algorithms.Foo))
    # pytype: disable=attribute-error
    self.assertTrue(callable(ee.Image.bar))
    self.assertTrue(callable(ee.Image.baz))
    self.assertTrue(callable(ee.Image.baz))

    self.assertEqual(ee.Algorithms.Foo.__doc__, foo)
    self.assertIn(foo, ee.Image.oldBar.__doc__)
    self.assertIn('DEPRECATED: Causes fire', ee.Image.oldBar.__doc__)
    self.assertIn('PREVIEW: This function is preview or internal only.',
                  ee.Image.newBaz.__doc__)
    self.assertEqual(ee.Image.bar.__doc__, '\n\nArgs:\n  bar: ' + bar)
    self.assertEqual(ee.Image.baz.__doc__, baz)
    # pytype: enable=attribute-error


if __name__ == '__main__':
  unittest.main()
