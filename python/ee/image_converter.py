"""Converters used in the image data fetching methods."""

import io
from typing import Any, Optional, Union


class ImageConverter:
  """Base class for image data conversion."""

  def expected_data_format(self) -> str:
    raise NotImplementedError()

  def do_conversion(self, data: bytes) -> Any:
    raise NotImplementedError()


class IdentityImageConverter(ImageConverter):
  """Data converter that applies an identity function."""

  data_format: str

  def __init__(self, data_format: str):
    self.data_format = data_format

  def expected_data_format(self) -> str:
    return self.data_format

  def do_conversion(self, data: bytes) -> bytes:
    return data


class NumPyConverter(ImageConverter):
  """Data converter that converts from a binary string to a NumPy array."""

  def expected_data_format(self) -> str:
    return 'NPY'

  def do_conversion(self, data: bytes) -> Any:
    try:
      import numpy  # pylint: disable=g-import-not-at-top
    except ImportError as exc:
      raise ImportError('Using format NUMPY_NDARRAY requires numpy.') from exc
    return numpy.load(io.BytesIO(data))


_PIXEL_DATA_CONVERTERS: dict[str, type[ImageConverter]] = {
    'NUMPY_NDARRAY': NumPyConverter
}


def from_file_format(
    file_format: Union[str, ImageConverter]
) -> Optional[ImageConverter]:
  if isinstance(file_format, ImageConverter):
    return file_format
  if file_format in _PIXEL_DATA_CONVERTERS:
    return _PIXEL_DATA_CONVERTERS[file_format.upper()]()
  return None
