# Copyright 2012 Google Inc. All Rights Reserved.

"""Representation of an Earth Engine FeatureCollection."""



# Using old-style python function naming on purpose to match the
# javascript version's naming.
# pylint: disable-msg=C6003,C6409

import collections
import numbers

import collection
import ee_exception
import feature
import image
import serializer


class FeatureCollection(collection.Collection):

  def __init__(self, args, opt_column=None):       # pylint: disable-msg=W0231
    """A representation of a FeatureCollection.

    Args:
      args: constructor argument.  One of:
          A string - The name of a collection.
          A number - The ID of a Fusion Table.
          A feature.
          An array of features.
          A dict - a collections's JSON description.
      opt_column: The name of the column containing the geometry.  This is
          only useful when args is a string or a number.

    Raises:
      EEException: if passed something other than the above.
    """
    if isinstance(args, feature.Feature):
      args = [args]

    if isinstance(args, basestring):
      args = {'type': 'FeatureCollection', 'id': args}
      if opt_column:
        args['geo_column'] = opt_column
    elif isinstance(args, numbers.Number):
      args = {'type': 'FeatureCollection', 'table_id': args}
      if opt_column:
        args['geo_column'] = opt_column
    elif isinstance(args, FeatureCollection):
      args = dict(args._description)            # pylint: disable-msg=W0212
    elif isinstance(args, dict):
      # This is the default, but we need to check it before we get to iterable.
      pass
    elif isinstance(args, collections.Iterable):
      new_args = {
          'type': 'FeatureCollection',
          'features': [feature.Feature(x) for x in args]
          }
      args = new_args
    else:
      raise ee_exception.EEException('Unrecognized constructor argument.')

    self._description = args

  def getMapId(self, vis_params=None):
    """Fetch and return a map id and token, suitable for use in a Map overlay.

    Args:
      vis_params: The visualization parameters. Currently only one parameter,
          'color', containing a hex RGB color string is allowed.

    Returns:
      An object containing a mapid string, an access token, plus a DrawVector
      image wrapping this collection.
    """
    painted = image.Image({
        'algorithm': 'DrawVector',
        'collection': self,
        'color': (vis_params or {}).get('color', '000000')
    })
    return painted.getMapId({})

  def map(self,
          algorithm,
          opt_dynamicArgs=None,
          opt_constantArgs=None,
          opt_destination=None):
    """Maps an algorithm over a collection. See ee.Collection.mapInternal()."""
    return self.mapInternal(feature.Feature, algorithm,
                            opt_dynamicArgs, opt_constantArgs, opt_destination)

  def __str__(self):
    """Writes out the collection in a human-readable form."""
    return 'FeatureCollection(%s)' % serializer.toJSON(self._description)

  def __repr__(self):
    """Writes out the collection in an eval-able form."""
    return 'ee.FeatureCollection(%s)' % self._description
