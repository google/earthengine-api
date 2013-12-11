"""A set of utilities to work with EE types."""



# Using lowercase function naming to match the JavaScript names.
# pylint: disable-msg=g-bad-name

import datetime
import numbers

import computedobject
import encodable

# The name of the property inserted into objects created by
# ee.CustomFunction.variable_() whose value is the type (class)
# of the variable.
VAR_TYPE_KEY = '__EE_VAR_TYPE'

# A dictionary of the classes in the ee module.  Set by registerClasses.
_registered_classes = {}


def _registerClasses(classes):
  """Registers the known classes.

  Args:
    classes: A dictionary of the classes available in the ee module.
  """
  global _registered_classes
  _registered_classes = classes


def classToName(klass):
  """Converts a class to the API-friendly type name.

  Args:
    klass: The class.

  Returns:
    The name of the class, or "Object" if not recognized.
  """
  if issubclass(klass, computedobject.ComputedObject):
    return klass.name()
  elif issubclass(klass, numbers.Number):
    return 'Number'
  elif issubclass(klass, basestring):
    return 'String'
  elif issubclass(klass, (list, tuple)):
    return 'Array'
  elif issubclass(klass, datetime.datetime):
    return 'Date'
  else:
    return 'Object'


def nameToClass(name):
  """Converts a class name to a class.  Returns None if not an ee class.

  Args:
    name: The class name.

  Returns:
    The named class.
  """
  return _registered_classes.get(name)


def isSubtype(firstType, secondType):
  """Checks whether a type is a subtype of another.

  Args:
    firstType: The first type name.
    secondType: The second type name.

  Returns:
    Whether secondType is a subtype of firstType.
  """
  if secondType == firstType:
    return True

  if firstType in ('Element', 'EEObject'):
    # TODO(user): Remove 'EEObject' once the server is updated.
    return secondType in ('EEObject', 'Element', 'Image', 'Feature',
                          'Collection', 'ImageCollection', 'FeatureCollection')
  elif firstType in ('FeatureCollection', 'Collection'):
    return secondType in ('Collection', 'ImageCollection', 'FeatureCollection')
  elif firstType == object:
    return True
  else:
    return False


def isNumber(obj):
  """Returns true if this object is a number or number variable.

  Args:
    obj: The object to check.

  Returns:
    Whether the object is a number or number variable.
  """
  return isinstance(obj, numbers.Number) or isVarOfType(obj, numbers.Number)


def isString(obj):
  """Returns true if this object is a string or string variable.

  Args:
    obj: The object to check.

  Returns:
    Whether the object is a string or string variable.
  """
  return isinstance(obj, basestring) or isVarOfType(obj, basestring)


def isArray(obj):
  """Returns true if this object is an array or array variable.

  Args:
    obj: The object to check.

  Returns:
    Whether the object is an array or array variable.
  """
  return (isinstance(obj, (list, tuple)) or
          isVarOfType(obj, list) or
          isVarOfType(obj, tuple))


def isVarOfType(obj, klass):
  """Returns true if this object is an EE variable with the given type.

  Args:
    obj: The object to check.
    klass: The class to check against.

  Returns:
    Whether the object is a variable of the given type.
  """
  if isinstance(obj, encodable.Encodable) and hasattr(obj, VAR_TYPE_KEY):
    actual_klass = getattr(obj, VAR_TYPE_KEY)
    return actual_klass is not None and issubclass(actual_klass, klass)
  else:
    return False
