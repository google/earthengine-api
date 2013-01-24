# Copyright 2012 Google Inc. All Rights Reserved.

"""Test for the ee.__init__ file."""



import json

import unittest

import ee
from ee import ee_exception


class EETestCase(unittest.TestCase):
  def setUp(self):
    ee.algorithms._signatures = {
        'Image.fakeFunction': {
            'returns': 'Image',
            'args': [
                {'type': 'Image', 'name': 'image1'},
                {'type': 'Image', 'name': 'image2'}
                ]
            }
        }

  def testCallAndApply(self):
    ee.algorithms.init()

    image1 = ee.Image(1)
    image2 = ee.Image(2)

    expected = {
        'algorithm': 'Image.fakeFunction',
        'image1': {'algorithm': 'Constant', 'value': 1},
        'image2': {'algorithm': 'Constant', 'value': 2},
        }

    # Test positional args.
    out = ee.call('Image.fakeFunction', image1, image2)
    self.assertEquals(expected, json.loads(out.serialize()))

    # Test positional args with promotion
    out = ee.call('Image.fakeFunction', 1, 2)
    self.assertEquals(expected, json.loads(out.serialize()))

    # Test kwargs.
    out = ee.call('Image.fakeFunction', image1=image1, image2=image2)
    self.assertEquals(expected, json.loads(out.serialize()))

    # Test kwargs with promotion.
    out = ee.call('Image.fakeFunction', image1=1, image2=2)
    self.assertEquals(expected, json.loads(out.serialize()))

    # Test kwargs with promotion.
    try:
      out = ee.call('Image.fakeFunction', image1=1, image2=2, image3=3)
    except ee_exception.EEException as e:
      self.assertTrue(e.args[0].startswith('Unknown arguments'))
    else:
      self.fail('Expected unknown args exception.')

    # Test apply().
    out = ee.apply('Image.fakeFunction', {'image1': image1, 'image2': image2})
    self.assertEquals(expected, json.loads(out.serialize()))

    # Test apply() with promotion.
    out = ee.apply('Image.fakeFunction', {'image1': 1, 'image2': 2})
    self.assertEquals(expected, json.loads(out.serialize()))
    
    # Test call and apply() with a lambda.
    func = ee.lambda_(['foo'], {'bar': 'quux'})
    expected_lambda_call = {
                          'foo': 'a',
                          'algorithm': {
                              'type': 'Algorithm',
                              'args': ['foo'],
                              'body': {'bar': 'quux'}
                          }
                      }
    self.assertEquals(expected_lambda_call, ee.call(func, 'a'))
    self.assertEquals(expected_lambda_call, ee.call(func, foo='a'))
    self.assertEquals(expected_lambda_call, ee.apply(func, {'foo': 'a'}))
        


if __name__ == '__main__':
  unittest.main()
