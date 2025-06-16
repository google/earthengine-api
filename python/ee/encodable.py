"""Interfaces implemented by serializable objects."""

from typing import Any, Callable


class Encodable:
  """An interface implemented by objects that can serialize themselves."""

  def encode(self, encoder: Callable[[Any], Any]) -> Any:
    """Encodes the object in a format compatible with Serializer.

    Args:
      encoder: A function that can be called to encode the components of
          an object.

    Returns:
      The encoded form of the object.
    """
    raise NotImplementedError('Encodable classes must implement encode().')

  def encode_cloud_value(self, encoder: Callable[[Any], Any]) -> Any:
    """Encodes the object as a ValueNode.

    Args:
      encoder: A function that can be called to encode the components of
          an object.

    Returns:
      The encoded form of the object.
    """
    raise NotImplementedError(
        'Encodable classes must implement encode_cloud_value().')


class EncodableFunction:
  """An interface implemented by functions that can serialize themselves."""

  def encode_invocation(self, encoder: Callable[[Any], Any]) -> Any:
    """Encodes the function in a format compatible with Serializer.

    Args:
      encoder: A function that can be called to encode the components of
          an object.

    Returns:
      The encoded form of the function.
    """
    raise NotImplementedError(
        'EncodableFunction classes must implement encode_invocation().')

  def encode_cloud_invocation(self, encoder: Callable[[Any], Any]) -> Any:
    """Encodes the function as a FunctionInvocation.

    Args:
      encoder: A function that can be called to encode the components of
          an object. Returns a reference to the encoded value.

    Returns:
      The encoded form of the function.
    """
    raise NotImplementedError(
        'EncodableFunction classes must implement encode_cloud_invocation().')
