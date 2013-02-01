# Copyright 2012 Google Inc. All Rights Reserved.

"""A representation of an Earth Engine computed object."""



import copy

import data
import serializer


class ComputedObject(object):
  """An representation of an Earth Engine computed object.

  These objects contain the minimal functions to allow interoperability
  with the rest of the API.
  """

  def __init__(self, args):
    """An representation of an Earth Engine computed object.

    Args:
      args: A JSON description of an Earth Engine object.
    """
    if isinstance(args, ComputedObject):
      # Another one of these.
      args = copy.deepcopy(args._description)        # pylint: disable-msg=W0212

    self._description = args

  def __str__(self):
    """Writes out the object in a human-readable form."""
    return 'ComputedObject(%s)' % serializer.toJSON(self._description)

  def __repr__(self):
    """Writes out the object in an eval-able form."""
    return 'ee.ComputedObject(%s)' % self._description

  def getInfo(self):
    """Fetch and return information about this object.

    Returns:
      The value returned by the system.
    """
    return data.getValue({
        'json': self.serialize(False)
        })

  def serialize(self, opt_pretty=True):
    """Serialize this object into a JSON string.

    Args:
      opt_pretty: A flag indicating whether to pretty-print the JSON.

    Returns:
      A JSON represenation of this image.
    """
    return serializer.toJSON(self._description, opt_pretty)
