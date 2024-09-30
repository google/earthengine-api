"""The EE Python library."""

__version__ = '1.1.2'

# Using lowercase function naming to match the JavaScript names.
# pylint: disable=g-bad-name

import collections
import datetime
import inspect
import os
import re
from typing import Any, Hashable, List as ListType, Optional, Sequence, Tuple, Type, Union

from ee import _utils
from ee import batch
from ee import data
from ee import deprecation
from ee import deserializer
from ee import ee_types as types
from ee import oauth

# Public re-exports.
from ._helpers import apply  # pylint: disable=redefined-builtin
from ._helpers import call
from ._helpers import profilePrinting
from ._helpers import ServiceAccountCredentials
from .apifunction import ApiFunction
from .blob import Blob
from .classifier import Classifier
from .clusterer import Clusterer
from .collection import Collection
from .computedobject import ComputedObject
from .confusionmatrix import ConfusionMatrix
from .customfunction import CustomFunction
from .daterange import DateRange
from .dictionary import Dictionary
from .ee_array import Array
from .ee_date import Date
from .ee_exception import EEException
from .ee_list import List
from .ee_number import Number
from .ee_string import String
from .element import Element
from .encodable import Encodable
from .errormargin import ErrorMargin
from .feature import Feature
from .featurecollection import FeatureCollection
from .filter import Filter
from .function import Function
from .geometry import Geometry
from .image import Image
from .imagecollection import ImageCollection
from .join import Join
from .kernel import Kernel
from .model import Model
from .pixeltype import PixelType
from .projection import Projection
from .reducer import Reducer
from .serializer import Serializer
from .terrain import Terrain

# Tell pytype not to worry about dynamic attributes.
_HAS_DYNAMIC_ATTRIBUTES = True

# A list of autogenerated class names added by _InitializeGeneratedClasses.
_generatedClasses: ListType[str] = []

NO_PROJECT_EXCEPTION = ('ee.Initialize: no project found. Call with project='
                        ' or see http://goo.gle/ee-auth.')


class _AlgorithmsContainer(dict):
  """A lightweight class that is used as a dictionary with dot notation."""

  def __getattr__(self, name: Hashable) -> Any:
    try:
      return self[name]
    except KeyError:
      # Match dict's behavior when a key is missing.
      raise AttributeError  # pylint: disable=raise-missing-from

  def __setattr__(self, name: Hashable, value: int) -> None:
    self[name] = value

  def __delattr__(self, name: Hashable) -> None:
    del self[name]


# A dictionary of algorithms that are not bound to a specific class.
Algorithms = _AlgorithmsContainer()


def Authenticate(
    authorization_code: Optional[str] = None,
    quiet: Optional[bool] = None,
    code_verifier: Optional[str] = None,
    auth_mode: Optional[str] = None,
    scopes: Optional[Sequence[str]] = None,
    force: bool = False,
) -> Optional[bool]:
  """Prompts the user to authorize access to Earth Engine via OAuth2.

  Args:
    authorization_code: An optional authorization code.
    quiet: If true, do not require interactive prompts and force --no-browser
      mode for gcloud-legacy. If false, never supply --no-browser. Default is
      None, which autodetects the --no-browser setting.
    code_verifier: PKCE verifier to prevent auth code stealing.
    auth_mode: The authentication mode. One of:
      "colab" - use the Colab authentication flow;
      "notebook" - send user to notebook authenticator page;
      "gcloud" - use gcloud to obtain credentials;
      "gcloud-legacy" - use legacy gcloud flow to obtain credentials;
      "localhost" - runs auth flow in local browser only;
      None - a default mode is chosen based on your environment.
    scopes: List of scopes to use for authentication. Defaults to [
        'https://www.googleapis.com/auth/earthengine',
        'https://www.googleapis.com/auth/devstorage.full_control' ].
    force: Will force authentication even if valid credentials already exist.

  Returns:
    True if we found valid credentials and didn't run the auth flow.
  """
  return oauth.authenticate(authorization_code, quiet, code_verifier, auth_mode,
                            scopes, force)


@_utils.accept_opt_prefix('opt_url')
def Initialize(
    credentials: Optional[Any] = 'persistent',
    url: Optional[str] = None,
    cloud_api_key: Optional[str] = None,
    http_transport: Optional[Any] = None,
    project: Optional[Union[str, int]] = None,
) -> None:
  """Initialize the EE library.

  If this hasn't been called by the time any object constructor is used,
  it will be called then.  If this is called a second time with a different
  URL, this doesn't do an un-initialization of, e.g., the previously loaded
  Algorithms, but will overwrite them and let point at alternate servers.

  Args:
    credentials: OAuth2 credentials.  'persistent' (default) means use
      credentials already stored in the filesystem, or raise an explanatory
      exception guiding the user to create those credentials.
    url: The base url for the EarthEngine REST API to connect to.
    cloud_api_key: An optional API key to use the Cloud API.
    http_transport: The http transport method to use when making requests.
    project: The client project ID or number to use when making API calls.
  """
  if credentials == 'persistent':
    credentials = data.get_persistent_credentials()
  if not project and credentials and hasattr(credentials, 'quota_project_id'):
    project = credentials.quota_project_id
  # SDK credentials are not authorized for EE so a project must be given.
  if not project and oauth.is_sdk_credentials(credentials):
    raise EEException(NO_PROJECT_EXCEPTION)

  data.initialize(
      credentials=credentials,
      api_base_url=(url + '/api' if url else None),
      tile_base_url=url,
      cloud_api_base_url=url,
      cloud_api_key=cloud_api_key,
      project=project,
      http_transport=http_transport,
  )

  # Initialize the dynamically loaded functions on the objects that want them.
  try:
    ApiFunction.initialize()
  except EEException as e:
    # We tried to detect missing projects before initialization, but some cases
    # like Colab hide the project, so check errors from missing projects too.
    adc_err = 'authenticating by using local Application Default Credentials'
    api_err = 'Earth Engine API has not been used in project ([0-9]+) before'
    matches = re.search(api_err, str(e))
    if (adc_err in str(e)) or (matches and oauth.is_sdk_project(matches[1])):
      raise EEException(NO_PROJECT_EXCEPTION) from None
    raise e
  Array.initialize()
  Blob.initialize()
  Classifier.initialize()
  Clusterer.initialize()
  Collection.initialize()
  ConfusionMatrix.initialize()
  Date.initialize()
  DateRange.initialize()
  Dictionary.initialize()
  Element.initialize()
  ErrorMargin.initialize()
  Feature.initialize()
  FeatureCollection.initialize()
  Filter.initialize()
  Geometry.initialize()
  Image.initialize()
  ImageCollection.initialize()
  Join.initialize()
  Kernel.initialize()
  List.initialize()
  Model.initialize()
  Number.initialize()
  PixelType.initialize()
  Projection.initialize()
  Reducer.initialize()
  String.initialize()
  Terrain.initialize()

  # These must happen last.
  _InitializeGeneratedClasses()
  _InitializeUnboundMethods()
  _InitializeDeprecatedAssets()


def _InitializeDeprecatedAssets() -> None:
  """Initialize deprecated assets."""
  deprecation.InitializeDeprecatedAssets()


def Reset() -> None:
  """Reset the library. Useful for re-initializing to a different server."""
  data.reset()
  deprecation.Reset()

  # Must call reset on the base class before any of its derived classes.
  ApiFunction.reset()
  Element.reset()  # Must be before Collection.
  Collection.reset()  # Must be before FeatureCollection and ImageCollection.
  Array.reset()
  Blob.reset()
  Classifier.reset()
  Clusterer.reset()
  ConfusionMatrix.reset()
  Date.reset()
  DateRange.reset()
  Dictionary.reset()
  ErrorMargin.reset()
  Feature.reset()
  FeatureCollection.reset()
  Filter.reset()
  Geometry.reset()
  Image.reset()
  ImageCollection.reset()
  Join.reset()
  Kernel.reset()
  List.reset()
  Model.reset()
  Number.reset()
  PixelType.reset()
  Projection.reset()
  Reducer.reset()
  String.reset()
  Terrain.reset()

  _ResetGeneratedClasses()
  global Algorithms
  Algorithms = _AlgorithmsContainer()


def _ResetGeneratedClasses() -> None:
  """Remove the dynamic classes."""
  global _generatedClasses

  for name in _generatedClasses:
    ApiFunction.clearApi(globals()[name])
    del globals()[name]
  _generatedClasses = []
  # Warning: we're passing all of globals() into registerClasses.
  # This is a) pass by reference, and b) a lot more stuff.
  types._registerClasses(globals())     # pylint: disable=protected-access


def _Promote(arg: Optional[Any], a_class: str) -> Optional[Any]:
  """Wrap an argument in an object of the specified class.

  This is used to, e.g., promote numbers or strings to Images and arrays
  to Collections.

  Args:
    arg: The object to promote.
    a_class: The expected type.

  Returns:
    The argument promoted if the class is recognized, otherwise the
    original argument.
  """
  if arg is None:
    return arg

  if a_class == 'Image':
    return Image(arg)
  elif a_class == 'Feature':
    if isinstance(arg, Collection):
      #  This can be quite dangerous on large collections.
      return ApiFunction.call_(
          'Feature', ApiFunction.call_('Collection.geometry', arg))
    else:
      return Feature(arg)
  elif a_class == 'Element':
    if isinstance(arg, Element):
      # Already an Element.
      return arg
    elif isinstance(arg, Geometry):
      # Geometries get promoted to Features.
      return Feature(arg)
    elif isinstance(arg, ComputedObject):
      # Try a cast.
      return Element(arg.func, arg.args, arg.varName)
    else:
      # No way to convert.
      raise EEException('Cannot convert {0} to Element.'.format(arg))
  elif a_class == 'Geometry':
    if isinstance(arg, Collection):
      return ApiFunction.call_('Collection.geometry', arg)
    else:
      return Geometry(arg)
  elif a_class in ('FeatureCollection', 'Collection'):
    # For now Collection is synonymous with FeatureCollection.
    if isinstance(arg, Collection):
      return arg
    else:
      return FeatureCollection(arg)
  elif a_class == 'ImageCollection':
    return ImageCollection(arg)
  elif a_class == 'Filter':
    return Filter(arg)
  elif a_class == 'Algorithm':
    if isinstance(arg, str):
      # An API function name.
      return ApiFunction.lookup(arg)
    elif callable(arg):
      # A native function that needs to be wrapped.
      args_count = len(inspect.getfullargspec(arg).args)
      return CustomFunction.create(arg, 'Object', ['Object'] * args_count)
    elif isinstance(arg, Encodable):
      # An ee.Function or a computed function like the return value of
      # Image.parseExpression().
      return arg
    else:
      raise EEException('Argument is not a function: {0}'.format(arg))
  elif a_class == 'Dictionary':
    if isinstance(arg, dict):
      return arg
    else:
      return Dictionary(arg)
  elif a_class == 'String':
    if (types.isString(arg) or
        isinstance(arg, ComputedObject) or
        isinstance(arg, String)):
      return String(arg)
    else:
      return arg
  elif a_class == 'List':
    return List(arg)
  elif a_class in ('Number', 'Float', 'Long', 'Integer', 'Short', 'Byte'):
    return Number(arg)
  elif a_class in globals():
    cls = globals()[a_class]
    ctor = ApiFunction.lookupInternal(a_class)
    # Handle dynamically created classes.
    if isinstance(arg, cls):
      # Return unchanged.
      return arg
    elif ctor:
      # The client-side constructor will call the server-side constructor.
      return cls(arg)
    elif isinstance(arg, str):
      if hasattr(cls, arg):
        # arg is the name of a method in a_class.
        return getattr(cls, arg)()
      else:
        raise EEException('Unknown algorithm: {0}.{1}'.format(a_class, arg))
    else:
      # Client-side cast.
      return cls(arg)
  else:
    return arg


def _InitializeUnboundMethods() -> None:
  """Initializes the unbounded functions."""
  # Sort the items by length, so parents get created before children.
  items = sorted(
      ApiFunction.unboundFunctions().items(), key=lambda x: len(x[0]))

  for name, func in items:
    signature = func.getSignature()
    if signature.get('hidden', False):
      continue

    # Create nested objects as needed.
    name_parts = name.split('.')
    target = Algorithms
    while len(name_parts) > 1:
      first = name_parts[0]
      # Set the attribute if it doesn't already exist.
      try:
        getattr(target, first)
      except AttributeError:
        setattr(target, first, _AlgorithmsContainer())

      target = getattr(target, first)
      name_parts = name_parts[1:]

    # Attach the function.
    # We need a copy of the function to attach properties.
    def GenerateFunction(f):
      return lambda *args, **kwargs: f.call(*args, **kwargs)  # pylint: disable=unnecessary-lambda
    bound = GenerateFunction(func)
    bound.signature = signature
    bound.__doc__ = str(func)
    setattr(target, name_parts[0], bound)


def _InitializeGeneratedClasses() -> None:
  """Generate classes for extra types that appear in the web API."""
  signatures = ApiFunction.allSignatures()
  # Collect the first part of all function names.
  names = set([name.split('.')[0] for name in signatures])
  # Collect the return types of all functions.
  returns = set([signatures[sig]['returns'] for sig in signatures])

  want = [name for name in names.intersection(returns) if name not in globals()]

  for name in want:
    globals()[name] = _MakeClass(name)
    _generatedClasses.append(name)
    ApiFunction._bound_signatures.add(name)  # pylint: disable=protected-access

  # Warning: we're passing all of globals() into registerClasses.
  # This is a) pass by reference, and b) a lot more stuff.
  types._registerClasses(globals())     # pylint: disable=protected-access


def _MakeClass(name: str) -> Type[Any]:
  """Generates a dynamic API class for a given name."""

  def init(self, *args, **kwargs):
    """Initializer for dynamically created classes.

    Args:
      self: The instance of this class.  Listed to make the linter hush.
      *args: Either a ComputedObject to be promoted to this type, or
             arguments to an algorithm with the same name as this class.
      **kwargs: Any kwargs passed to this class constructor.

    Returns:
      The new class.
    """
    a_class = globals()[name]
    onlyOneArg = (len(args) == 1)
    # Are we trying to cast something that's already of the right class?
    if not (onlyOneArg and isinstance(args[0], a_class)):
      # Decide whether to call a server-side constructor or just do a
      # client-side cast.
      ctor = ApiFunction.lookupInternal(name)
      firstArgIsPrimitive = not isinstance((args or [None])[0], ComputedObject)
      shouldUseConstructor = False
      if ctor:
        if not onlyOneArg:
          # Can't client-cast multiple arguments.
          shouldUseConstructor = True
        elif firstArgIsPrimitive:
          # Can't cast a primitive.
          shouldUseConstructor = True
        elif args[0].func != ctor:
          # We haven't already called the constructor on this object.
          shouldUseConstructor = True

      # Apply our decision.
      if shouldUseConstructor and ctor:
        # Call ctor manually to avoid having promote() called on the output.
        promoted_args = ctor.promoteArgs(ctor.nameArgs(args, kwargs))
        ComputedObject.__init__(self, ctor, promoted_args)
      else:
        # Just cast and hope for the best.
        if not onlyOneArg:
          # We don't know what to do with multiple args.
          raise EEException(
              'Too many arguments for ee.{0}(): {1}'.format(name, args))
        elif firstArgIsPrimitive:
          # Can't cast a primitive.
          raise EEException(
              'Invalid argument for ee.{0}(): {1}.  '
              'Must be a ComputedObject.'.format(name, args))

        result = args[0]
        ComputedObject.__init__(self, result.func, result.args, result.varName)

  properties = {'__init__': init, 'name': lambda self: name}
  new_class = type(str(name), (ComputedObject,), properties)
  ApiFunction.importApi(new_class, name, name)
  return new_class


# Set up type promotion rules as soon the package is loaded.
Function._registerPromoter(_Promote)   # pylint: disable=protected-access
