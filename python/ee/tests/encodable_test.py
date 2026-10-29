#!/usr/bin/env python3
"""Tests for ee.encodable."""

from collections.abc import Callable
from typing import Any
import unittest

from ee import encodable


class EncodableTest(unittest.TestCase):

  def test_encodable(self):
    encoder: Callable[[Any], Any] = lambda x: x
    with self.assertRaises(NotImplementedError):
      encodable.Encodable().encode(encoder)
    with self.assertRaises(NotImplementedError):
      encodable.Encodable().encode_cloud_value(encoder)

  def test_encodable_function(self):
    encoder: Callable[[Any], Any] = lambda x: x
    with self.assertRaises(NotImplementedError):
      encodable.EncodableFunction().encode_invocation(encoder)
    with self.assertRaises(NotImplementedError):
      encodable.EncodableFunction().encode_cloud_invocation(encoder)


if __name__ == '__main__':
  unittest.main()
