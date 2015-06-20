#!/usr/bin/env python
"""Representation of an Earth Engine FeatureCollection."""



# Using lowercase function naming to match the JavaScript names.
# pylint: disable=g-bad-name

import apifunction
import collection
import computedobject
import data
import deprecation
import ee_exception
import ee_list
import ee_types
import feature
import geometry


class FeatureCollection(collection.Collection):
  """A representation of a FeatureCollection."""

  _initialized = False

  def __init__(self, args, opt_column=None):
    """Constructs a collection features.

    Args:
      args: constructor argument.  One of:
          1) A string - assumed to be the name of a collection.
          2) A number - assumed to be the ID of a Fusion Table.
          3) A geometry.
          4) A feature.
          5) An array of features.
          6) A computed object - reinterpreted as a collection.
      opt_column: The name of the geometry column to use. Only useful with the
          string or number constructor arguments.

    Raises:
      EEException: if passed something other than the above.
    """
    self.initialize()

    # Wrap geometries with features.
    if isinstance(args, geometry.Geometry):
      args = feature.Feature(args)

    # Wrap single features in an array.
    if isinstance(args, feature.Feature):
      args = [args]

    if ee_types.isNumber(args) or ee_types.isString(args):
      # An ID.
      actual_args = {'tableId': args}
      if opt_column:
        actual_args['geometryColumn'] = opt_column
      super(FeatureCollection, self).__init__(
          apifunction.ApiFunction.lookup('Collection.loadTable'), actual_args)
    elif isinstance(args, (list, tuple)):
      # A list of features.
      super(FeatureCollection, self).__init__(
          apifunction.ApiFunction.lookup('Collection'), {
              'features': [feature.Feature(i) for i in args]
          })
    elif isinstance(args, ee_list.List):
      # A computed list of features.
      super(FeatureCollection, self).__init__(
          apifunction.ApiFunction.lookup('Collection'), {
              'features': args
          })
    elif isinstance(args, computedobject.ComputedObject):
      # A custom object to reinterpret as a FeatureCollection.
      super(FeatureCollection, self).__init__(
          args.func, args.args, args.varName)
    else:
      raise ee_exception.EEException(
          'Unrecognized argument type to convert to a FeatureCollection: %s' %
          args)

  @classmethod
  def initialize(cls):
    """Imports API functions to this class."""
    if not cls._initialized:
      super(FeatureCollection, cls).initialize()
      apifunction.ApiFunction.importApi(
          cls, 'FeatureCollection', 'FeatureCollection')
      cls._initialized = True

  @classmethod
  def reset(cls):
    """Removes imported API functions from this class."""
    apifunction.ApiFunction.clearApi(cls)
    cls._initialized = False

  def getMapId(self, vis_params=None):
    """Fetch and return a map id and token, suitable for use in a Map overlay.

    Args:
      vis_params: The visualization parameters. Currently only one parameter,
          'color', containing a hex RGB color string is allowed.

    Returns:
      An object containing a mapid string, an access token, plus a
      Collection.draw image wrapping this collection.
    """
    painted = apifunction.ApiFunction.apply_('Collection.draw', {
        'collection': self,
        'color': (vis_params or {}).get('color', '000000')
    })
    return painted.getMapId({})

  def getDownloadURL(self, filetype=None, selectors=None, filename=None):
    """Get a download URL for this feature collection.

    Args:
      filetype: The filetype of download, either CSV or JSON. Defaults to CSV.
      selectors: The selectors that should be used to determine which attributes
          will be downloaded.
      filename: The name of the file to be downloaded.

    Returns:
      A URL to download the specified feature collection.
    """
    request = {}
    request['table'] = self.serialize()
    if filetype is not None:
      request['format'] = filetype.upper()
    if filename is not None:
      request['filename'] = filename
    if selectors is not None:
      if isinstance(selectors, (list, tuple)):
        selectors = ','.join(selectors)
      request['selectors'] = selectors
    return data.makeTableDownloadUrl(data.getTableDownloadId(request))

  # Deprecated spelling to match the JS library.
  getDownloadUrl = deprecation.Deprecated('Use getDownloadURL().')(
      getDownloadURL)

  def select(self, selectors, opt_names=None, *args):
    """Select properties from each feature in a collection.

    Args:
      selectors: An array of names or regexes specifying the properties
          to select.
      opt_names: An array of strings specifying the new names for the
          selected properties.  If supplied, the length must match the number
          of properties selected.
      *args: Selector elements as varargs.

    Returns:
      The feature collection with selected properties.
    """
    return self.map(lambda feat: feat.select(selectors, opt_names, *args))

  @staticmethod
  def name():
    return 'FeatureCollection'

  @staticmethod
  def elementType():
    return feature.Feature
