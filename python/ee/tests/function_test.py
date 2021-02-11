#!/usr/bin/env python
"""Test for the ee.function module."""



import unittest

import ee

# A function to experiment on.
TEST_FUNC = ee.Function()
TEST_FUNC.getSignature = lambda: {  # pylint: disable-msg=g-long-lambda
    'description': 'Method description.',
    'returns': 'Image',
    'args': [
        {
            'type': 'Image',
            'name': 'a',
            'description': 'Arg A doc.'},
        {
            'type': 'Image',
            'name': 'b',
            'description': 'Arg B doc.',
            'optional': True
        }
    ]
}

EXPECTED_DOC = """Method description.

Args:
  a: Arg A doc.
  b: Arg B doc."""


class FunctionTest(unittest.TestCase):

  def testNameArgs(self):
    """Verifies that Functions can convert positional to named arguments."""
    self.assertEqual({}, TEST_FUNC.nameArgs([]))
    self.assertEqual({'a': 42}, TEST_FUNC.nameArgs([42]))
    self.assertEqual({'a': 42, 'b': 13}, TEST_FUNC.nameArgs([42, 13]))
    self.assertEqual({'a': 3, 'b': 5}, TEST_FUNC.nameArgs([3], {'b': 5}))

    self.assertRaisesWithRegexpMatch('Too many', TEST_FUNC.nameArgs, [1, 2, 3])

  def testPromoteArgs(self):
    """Verifies that Functions can promote and verify their arguments."""
    old_promoter = ee.Function._promoter
    ee.Function._registerPromoter(lambda obj, type_name: [type_name, obj])

    # Regular call.
    self.assertEqual({
        'a': ['Image', 42],
        'b': ['Image', 13]
    }, TEST_FUNC.promoteArgs({
        'a': 42,
        'b': 13
    }))

    # Allow missing optional argument.
    self.assertEqual({'a': ['Image', 42]}, TEST_FUNC.promoteArgs({'a': 42}))

    # Disallow unknown arguments.
    self.assertRaisesWithRegexpMatch(
        'Required argument', TEST_FUNC.promoteArgs, {})

    # Disallow unknown arguments.
    self.assertRaisesWithRegexpMatch(
        'Unrecognized', TEST_FUNC.promoteArgs, {'a': 42, 'c': 13})

    # Clean up.
    ee.Function._registerPromoter(old_promoter)

  def testCall(self):
    """Verifies the full function invocation flow."""
    old_promoter = ee.Function._promoter
    ee.Function._registerPromoter(lambda obj, type_name: [type_name, obj])

    return_type, return_value = TEST_FUNC.call(42, 13)
    self.assertEqual('Image', return_type)
    self.assertEqual(TEST_FUNC, return_value.func)
    self.assertEqual({
        'a': ['Image', 42],
        'b': ['Image', 13]
    }, return_value.args)

    # Clean up.
    ee.Function._registerPromoter(old_promoter)

  def testToString(self):
    """Verifies function docstring generation."""
    self.assertEqual(EXPECTED_DOC, str(TEST_FUNC))

  def assertRaisesWithRegexpMatch(self, msg, func, *args):
    try:
      func(*args)
    except ee.EEException as e:
      self.assertIn(msg, str(e))
    else:
      self.fail('Expected an exception.')


if __name__ == '__main__':
  unittest.main()
