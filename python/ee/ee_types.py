"""A set of utilities to work with EE types."""

# Using lowercase function naming to match the JavaScript names.
# pylint: disable=g-bad-name

import datetime
from typing import Any, Type

from ee import computedobject


# A dictionary of the classes in the ee module.  Set by registerClasses.
_registered_classes = {}


def _registerClasses(classes) -> None:
  """Registers the known classes.

  Args:
    classes: A dictionary of the classes available in the ee module.
  """
  global _registered_classes
  _registered_classes = classes


def classToName(a_class: Type[Any]) -> str:
  """Converts a class to the API-friendly type name.

  Args:
    a_class: The class.

  Returns:
    The name of the class, or "Object" if not recognized.
  """
  if issubclass(a_class, computedobject.ComputedObject):
    return a_class.name()
  elif issubclass(a_class, (float, int)):
    return 'Number'
  elif issubclass(a_class, str):
    return 'String'
  elif issubclass(a_class, (list, tuple)):
    return 'Array'
  elif issubclass(a_class, datetime.datetime):
    return 'Date'
  else:
    return 'Object'


# TODO(user): Any -> Optional[type[Any]].
def nameToClass(name: str) -> Any:
  """Converts a class name to a class.  Returns None if not an ee class.

  Args:
    name: The class name.

  Returns:
    The named class.
  """
  return _registered_classes.get(name)


def isSubtype(firstType: str, secondType: str) -> bool:
  """Checks whether a type is a subtype of another.

  Args:
    firstType: The first type name.
    secondType: The second type name.

  Returns:
    Whether secondType is a subtype of firstType.
  """
  if secondType == firstType:
    return True

  if firstType == 'Element':
    return secondType in ('Element', 'Image', 'Feature',
                          'Collection', 'ImageCollection', 'FeatureCollection')
  elif firstType in ('FeatureCollection', 'Collection'):
    return secondType in ('Collection', 'ImageCollection', 'FeatureCollection')
  elif firstType == object:
    return True
  else:
    return False


def isNumber(obj: Any) -> bool:
  """Returns true if this object is a number or number variable.

  Args:
    obj: The object to check.

  Returns:
    Whether the object is a number or number variable.
  """
  return (isinstance(obj, (float, int)) or
          (isinstance(obj, computedobject.ComputedObject) and
           obj.name() == 'Number'))


def isString(obj: Any) -> bool:
  """Returns true if this object is a string or string variable.

  Args:
    obj: The object to check.

  Returns:
    Whether the object is a string or string variable.
  """
  return (isinstance(obj, str) or
          (isinstance(obj, computedobject.ComputedObject) and
           obj.name() == 'String'))


def isArray(obj: Any) -> bool:
  """Returns true if this object is an array or array variable.

  Args:
    obj: The object to check.

  Returns:
    Whether the object is an array or array variable.
  """
  return (isinstance(obj, (list, tuple)) or
          (isinstance(obj, computedobject.ComputedObject) and
           obj.name() == 'List'))
