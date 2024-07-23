#!/usr/bin/env python3
"""Tests for _utils decorators."""

import unittest
from ee import _utils


class EeElementStub:

  @_utils.accept_opt_prefix('opt_arg1', ('opt_arg2', 'arg2_'))
  def __init__(self, arg1=None, arg2_=None):
    self.arg1 = arg1
    self.arg2_ = arg2_

  @_utils.accept_opt_prefix('opt_arg1', ('opt_arg2', 'arg2_'))
  def test_method(self, arg1=None, arg2_=None):
    return (arg1, arg2_)


class UtilsTest(unittest.TestCase):

  def test_accept_opt_prefix_decorator_method(self):
    # Test constructors decorated with accept_opt_prefix.
    api = EeElementStub('a test arg', 'a new arg')
    self.assertEqual('a test arg', api.arg1)
    self.assertEqual('a new arg', api.arg2_)

    api = EeElementStub(arg1='a test arg', arg2_='a new arg')
    self.assertEqual('a test arg', api.arg1)
    self.assertEqual('a new arg', api.arg2_)

    # pylint: disable=unexpected-keyword-arg
    # pytype: disable=wrong-keyword-args
    api = EeElementStub(opt_arg1='a test arg', opt_arg2='a new arg')
    self.assertEqual('a test arg', api.arg1)
    self.assertEqual('a new arg', api.arg2_)
    # pylint: enable=unexpected-keyword-arg
    # pytype: enable=wrong-keyword-args

    # Test methods decorated with accept_opt_prefix.
    api = EeElementStub()
    self.assertEqual(
        ('a test arg', 'a new arg'),
        api.test_method('a test arg', 'a new arg'),
    )
    self.assertEqual(
        ('a test arg', 'a new arg'),
        api.test_method(arg1='a test arg', arg2_='a new arg'),
    )
    self.assertEqual(
        ('a test arg', 'a new arg'),
        # pylint: disable-next=unexpected-keyword-arg
        api.test_method(opt_arg1='a test arg', opt_arg2='a new arg'),
    )

    # Test functions decorated with accept_opt_prefix.
    @_utils.accept_opt_prefix('opt_arg1', ('opt_arg2', 'arg2_'))
    def test_function(arg1=None, arg2_=None):
      return (arg1, arg2_)

    self.assertEqual(
        ('a test arg', 'a new arg'),
        test_function('a test arg', 'a new arg'),
    )
    self.assertEqual(
        ('a test arg', 'a new arg'),
        test_function(arg1='a test arg', arg2_='a new arg'),
    )
    self.assertEqual(
        ('a test arg', 'a new arg'),
        # pylint: disable-next=unexpected-keyword-arg
        test_function(opt_arg1='a test arg', opt_arg2='a new arg'),
    )
    # pylint: disable=unexpected-keyword-arg
    # pytype: disable=wrong-keyword-args
    self.assertEqual(
        ('a test arg', 'an overridden arg'),
        test_function(
            opt_arg1='a test arg',
            opt_arg2='a new arg',
            arg2_='an overridden arg',
        ),
    )
    # pylint: enable=unexpected-keyword-arg
    # pytype: enable=wrong-keyword-args


if __name__ == '__main__':
  unittest.main()
