#!/usr/bin/env python3
"""Tests for the image_converter module."""

from typing import Optional, Type

from absl.testing import parameterized
import numpy

import unittest
from ee import image_converter


class ImageConverterTest(parameterized.TestCase):

  @parameterized.named_parameters(
      ('np', 'NUMPY_NDARRAY', image_converter.NumPyConverter),
      ('mixed', 'nUMpy_ndARRAY', None),
      ('invalid', 'UNKNOWN', None),
  )
  def test_from_file_format(
      self,
      data_format: str,
      expected: Optional[Type[image_converter.ImageConverter]],
  ) -> None:
    """Verifies `from_file_format` returns the correct converter class."""
    if expected is None:
      self.assertIsNone(image_converter.from_file_format(data_format))
    else:
      self.assertIsInstance(
          image_converter.from_file_format(data_format), expected
      )

  def test_identity_converter(self) -> None:
    """Verifies `IdentityImageConverter` does the correct conversion."""
    converter = image_converter.IdentityImageConverter('JPEG')

    converted = converter.do_conversion(b'some-jpeg-data')

    self.assertEqual(converted, b'some-jpeg-data')
    self.assertEqual(converter.expected_data_format(), 'JPEG')

  def test_numpy_converter(self) -> None:
    """Verifies `NumPyConverter` does the correct conversion."""
    converter = image_converter.NumPyConverter()

    image_data = (
        b"\x93NUMPY\x01\x00V\x00{'descr': [('b1', '|u1'), ('b3', '|u1')],"
        b" 'fortran_order': False, 'shape': (3, 2), }"
        b' \n\x01\x03\x01\x03\x01\x03\x01\x03\x01\x03\x01\x03'
    )
    ndarray = converter.do_conversion(image_data)

    expected = numpy.array(
        [[(1, 3), (1, 3)], [(1, 3), (1, 3)], [(1, 3), (1, 3)]],
        dtype=[('b1', '|u1'), ('b3', '|u1')],
    )
    numpy.testing.assert_array_equal(ndarray, expected)


if __name__ == '__main__':
  unittest.main()
