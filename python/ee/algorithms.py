# Copyright 2012 Google Inc. All Rights Reserved.

"""Handle dynamically loaded function signatures."""



# Using old-style python function naming on purpose to match the
# javascript version's naming.
# pylint: disable-msg=C6003,C6409

import keyword
import numbers
import textwrap

import data
import ee_exception
import feature
import featurecollection
import image
import imagecollection
import serializer


# The list of function signatures.
_signatures = None

# The width of the generated method docstrings.
DOCSTRING_WIDTH = 75


def init():
  """Initialize the list of signatures from the Earth Engine frontend."""
  global _signatures                    # pylint: disable-msg=W0603
  if _signatures is None:
    _signatures = data.getAlgorithms()


def getSignature(name):
  """Get a signature by name.

  This makes sure that the signatures have been initialized.

  Args:
      name: The name of the signature to get.

  Returns:
      The specified signature.
  """
  init()
  signature = dict(_signatures[name])
  signature['name'] = name
  return signature


def allSignatures():
  """Return all the signatures.

  This makes sure that the signatures have been initialized.

  Returns:
     All the signatures.
  """
  init()
  return _signatures


def _applySignature(signature, *args, **kwargs):
  """Call the given function with the specified named and positional args.

  Args:
    signature: The algorithm's signature.
    *args: The positional arguments to be passed to the algorithm.
    **kwargs: The named arguments to be passed to the algorithm.

  Returns:
    An object representing the called algorithm.  If the signature specifies a
    recognized return type, the returned value will be wrapped in that type.
    Otherwise, returns just the JSON description of the algorithm invocation.

  Raises:
    ee_exception.EEException: if there's a problem matching up args with the
        signature.
  """
  parameters = dict(kwargs)

  sigArgs = signature['args']
  if len(sigArgs) < len(args):
    raise ee_exception.EEException('Incorrect number of arguments: ' +
                                   signature['name'])

  # Convert the positional arguments to named ones.
  for i in xrange(0, len(args)):
    name = sigArgs[i]['name']
    if name in parameters:
      raise ee_exception.EEException('Argument already set: ' +
                                     signature['name'] + '(' + name + ')')
    else:
      parameters[name] = args[i]

  # Promote types.
  for i in xrange(0, len(sigArgs)):
    name = sigArgs[i]['name']
    if name in parameters:
      parameters[name] = _promote(sigArgs[i]['type'],
                                  parameters[name])

  # Check for unknown parameters.
  argNames = set([x['name'] for x in sigArgs])
  unknown = set(parameters.keys()).difference(argNames)
  if unknown:
    raise ee_exception.EEException('Unknown arguments %s(%s): ' %
                                   (signature['name'], str(list(unknown))))

  # Apply return type.
  parameters['algorithm'] = signature['name']
  return _promote(signature['returns'], parameters)


def _makeFunction(name, signature, opt_bound_args=None):
  """Create a function for the given signature.

  Creates a function for the given signature, with an optional set of
  values to pre-bind to some of the function arguments.

  Args:
     name: The name of the function as it appears on the class.
     signature: The signature of the function.
     opt_bound_args: A dictionary from arg names to values to pre-bind to
         this call.

  Returns:
     The bound function.
  """
  opt_bound_args = opt_bound_args or {}

  def BoundFunction(self, *argsIn, **namedArgsIn):
    """A generated function for the given signature."""
    argsIn = list(argsIn)
    argsIn.insert(0, self._description)       # pylint: disable-msg=W0212
    named = dict(opt_bound_args)
    named.update(namedArgsIn)
    return _applySignature(signature, *argsIn, **named)
  BoundFunction.__name__ = name.encode('utf8')
  BoundFunction.__doc__ = _makeDoc(signature)
  return BoundFunction


def _makeAggregateFunction(name, signature, opt_bound_args=None):
  """Create an aggregation function for the given signature.

  The aggregation function not only constructs the JSON for an algorithm call
  but actually runs it. The produced function accepts an optional callback as
  its last argument.

  Args:
     name: The name of the function as it appears on the class.
     signature: The signature of the function.
     opt_bound_args: A dictionary from arg names to values to pre-bind to
         this call.

  Returns:
     The bound function.
  """
  opt_bound_args = opt_bound_args or {}
  func = _makeFunction(name, signature, opt_bound_args)

  def BoundFunction(self, *argsIn, **namedArgsIn):
    """A generated aggregation function for the given signature."""
    description = func(self, *argsIn, **namedArgsIn)
    return data.getValue({'json': serializer.toJSON(description, False)})

  BoundFunction.__name__ = func.__name__
  BoundFunction.__doc__ = func.__doc__
  return BoundFunction


def _makeMapFunction(name, signature, opt_bound_args=None):
  """Create a mapping function.

  Creates a mapping function for the given signature, with an optional
  set of values to pre-bind to some of the function arguments.

  Args:
     name: The name of the function as it appears on the class.
     signature: The signature of the function.
     opt_bound_args: A dictionary from arg names to values to pre-bind to
         this call.

  Returns:
     The bound function.
  """
  opt_bound_args = opt_bound_args or {}

  def BoundFunction(target, *argsIn, **namedArgsIn):
    """A function generated for the given signature."""
    # Don't use the first argument, and unset the return type.
    s = dict(signature)
    s['args'] = signature['args'][1:]
    s['returns'] = None
    named = dict(opt_bound_args)
    named.update(namedArgsIn)
    parameters = _applySignature(s, *argsIn, **named)
    if 'algorithm' in parameters:
      parameters.pop('algorithm')

    description = {
        'constantArgs': parameters,
        'baseAlgorithm': signature['name'],
        'collection': target,
        'dynamicArgs': {
            signature['args'][0]['name']: '.all'
        },
        'algorithm': 'MapAlgorithm'
    }

    if signature['returns'] == 'Image':
      collectionClass = imagecollection.ImageCollection
    else:
      collectionClass = featurecollection.FeatureCollection
      # Mapping an algorithm that produces a value (e.g. area) attaches the
      # result to the objects instead of replacing them.
      if signature['returns'] not in ('Feature', 'EEObject'):
        description['destination'] = signature['name'].split('.')[-1]

    return collectionClass(description)
  BoundFunction.__name__ = name.encode('utf8')
  BoundFunction.__doc__ = ('Applies ' + signature['name'] +
                           '() on each element in the collection.')

  return BoundFunction


def _addFunctions(target, prefix, name_prefix='', wrapper=_makeFunction):
  """Add all the functions that begin with "prefix" to the target class.

  Args:
     target: The class to add to.
     prefix: The prefix to search for.
     name_prefix: An optional string to prepend to the names
         of the added functions.
     wrapper: The function to use for converting a signature into a function.
  """
  init()
  for name in _signatures:
    parts = name.split('.')
    if len(parts) == 2 and parts[0] == prefix:
      fname = name_prefix + parts[1]

      # Specifically handle the function names that are illegal in python.
      if keyword.iskeyword(fname):
        fname = fname.title()

      # Don't overwrite existing versions of this function.
      if hasattr(target, fname):
        fname = '_' + fname

      signature = _signatures[name]
      signature['name'] = name
      setattr(target, fname, wrapper(fname, signature))


def _makeDoc(signature, opt_bound_args=None):
  """Create a docstring for the given signature.

  Args:
     signature: The signature of the function.
     opt_bound_args: A list of names specifying the arguments that are bound
         before the call to the function is made.

  Returns:
     The docstring.
  """
  opt_bound_args = opt_bound_args or []
  parts = []
  parts.append(textwrap.fill(signature['description'], width=DOCSTRING_WIDTH))
  args = signature['args']
  args = [i for i in args if i['name'] not in opt_bound_args]
  if args:
    parts.append('')
    parts.append('Args:')
    for arg in args:
      name_part = '  ' + arg['name'] + ': '
      arg_doc = textwrap.fill(name_part + arg['description'],
                              width=DOCSTRING_WIDTH - len(name_part),
                              subsequent_indent=' ' * 6)
      parts.append(arg_doc)
  return u'\n'.join(parts).encode('utf8')


def _promote(klass, arg):
  """Wrap an argument in an object of the specified class.

  This is used to e.g.: promote numbers or strings to Images and arrays
  to Collections.

  Args:
      klass: The expected type.
      arg: The object to promote.

  Returns:
      The argument promoted if the class is recognized, otherwise the
      original argument.
  """
  if klass == 'Image':
    return image.Image(arg)
  elif klass == 'ImageCollection':
    return imagecollection.ImageCollection(arg)
  elif klass in ('Feature', 'EEObject'):
    if isinstance(arg, (imagecollection.ImageCollection,
                        featurecollection.FeatureCollection)):
      return feature.Feature({
          'type': 'Feature',
          'geometry': arg.geometry(),
          'properties': {}
      })
    else:
      return feature.Feature(arg)
  elif klass in ('FeatureCollection', 'EECollection'):
    return featurecollection.FeatureCollection(arg)
  elif klass == 'ErrorMargin' and isinstance(arg, numbers.Number):
    return {
        'type': 'ErrorMargin',
        'unit': 'meters',
        'value': arg
    }
  else:
    return arg


def variable(cls, name):                       # pylint: disable-msg=C6409,W0622
  """Returns a variable with a given name that implements a given EE type.

  Args:
    cls: A type (class) to mimic.
    name: The name of the variable as it will appear in the arguments of the
        lambdas that use this variable.

  Returns:
    A placeholder with the specified name implementing the specified type.
  """

  class Variable(cls):
    def __init__(self, name):
      self._description = {
          'type': 'Variable',
          'name': name
      }

  return Variable(name)


def lambda_(args, body):                       # pylint: disable-msg=C6409,W0622
  """Creates an EE lambda function.

  Args:
    args: The names of the arguments to the lambda.
    body: The expression to evaluate.

  Returns:
    An EE lambda object that can be used in place of algorithms.
  """
  return {
      'type': 'Algorithm',
      'args': args,
      'body': body
  }
