#!/usr/bin/env python3
"""Tests for the ee.Classifier module."""

import json

import unittest
import ee
from ee import apitestcase


_CLASSIFIER_JSON = {
    'result': '0',
    'values': {
        '0': {
            'functionInvocationValue': {
                'functionName': 'Classifier.smileNaiveBayes',
                'arguments': {'lambda': {'constantValue': 0.01}},
            }
        }
    },
}


class ClassifierTest(apitestcase.ApiTestCase):

  def test_naive_bayes_args(self):
    classifier = ee.Classifier.smileNaiveBayes(0.01)
    self.assertEqual({'value': 'fakeValue'}, classifier.getInfo())

    naive_bayes_func = ee.ApiFunction.lookup('Classifier.smileNaiveBayes')
    self.assertEqual(naive_bayes_func, classifier.func)
    self.assertFalse(classifier.isVariable())

    result = json.loads(classifier.serialize())
    self.assertEqual(_CLASSIFIER_JSON, result)

  def test_square_kwargs(self):
    kwargs = {'lambda': 0.01}
    classifier = ee.Classifier.smileNaiveBayes(**kwargs)
    result = json.loads(classifier.serialize())
    self.assertEqual(_CLASSIFIER_JSON, result)

  def test_cast(self):
    classifier = ee.Classifier(ee.Classifier.smileNaiveBayes(0.01))
    result = json.loads(classifier.serialize())
    self.assertEqual(_CLASSIFIER_JSON, result)

  @unittest.skip('Does not work on github with python <= 3.9')
  def test_no_args(self):
    message = (
        r'Classifier\.__init__\(\) missing 1 required positional argument:'
        r' \'classifier\''
    )
    with self.assertRaisesRegex(TypeError, message):
      ee.Classifier()  # pytype:disable=missing-parameter

  def test_wrong_type(self):
    message = (
        r'Classifier can only be used as a cast to Classifier\. Found <class'
        r' \'int\'>'
    )
    with self.assertRaisesRegex(TypeError, message):
      ee.Classifier(1234)  # pytype:disable=wrong-arg-types


if __name__ == '__main__':
  unittest.main()
