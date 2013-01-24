# Copyright 2012 Google Inc. All Rights Reserved.

"""Representation for an Earth Engine ImageCollection."""



# Dont bug me about the invalid names; it's on purpose.
#pylint: disable-msg=C6409

import collections
import copy

import collection
import ee_exception
import image
import serializer


class ImageCollection(collection.Collection):
  """Representation for an Earth Engine ImageCollection."""

  def __init__(self, args):                     # pylint: disable-msg=W0231
    """ImageCollection constructor.

    Args:
       args: ImageCollections can be constructed from the following arguments:
           A string: the asset ID of an image collection,
           An iterable of images, or anything that can be used to construct
               an image (ids, constants, etc).
           A single image.
           A dictionary: a collections's JSON description.

    Raises:
      EEException: if passed something other than the above.
    """
    if isinstance(args, image.Image):
      args = [args]

    if isinstance(args, basestring):
      # Get an asset by AssetID
      args = {'type': 'ImageCollection', 'id': args}
    elif isinstance(args, dict):        # Must check for dict before iterable.
      args = copy.deepcopy(args)
    elif isinstance(args, collections.Iterable):
      # A manually created collection.
      args = {'type': 'ImageCollection',
              'images': [image.Image(x) for x in args]}
    elif isinstance(args, ImageCollection):
      args = copy.deepcopy(args._description)        # pylint: disable-msg=W0212
    else:
      raise ee_exception.EEException('Unrecognized constructor argument.')

    self._description = args

  def getMapId(self, vis_params):
    """Fetch and return a MapID.

    This mosaics the collection to a single image and return a mapid suitable
    for building a Google Maps overlay.

    Args:
       vis_params: The visualization parameters.

    Returns:
       A mapid and token.
    """
    return self.mosaic().getMapId(vis_params)

  def mosaic(self):
    """Wrap this collection in a SimpleMosaic function."""
    return image.Image({'creator': 'SimpleMosaic', 'args': [self]})

  def combine(self, other):
    """Combine two ImageCollections by ID, merging bands.

    The collection contains one image for each image in this collection
    merged with the bands from any matching images in the other collection.

    Args:
       other: The second collection.

    Returns:
       The combined collection.
    """
    return ImageCollection({
        'algorithm': 'CombineCollectionBands',
        'primary': self,
        'secondary': other
        })

  def map(self,
          algorithm,
          opt_dynamicArgs=None,
          opt_constantArgs=None,
          opt_destination=None):
    """Maps an algorithm over a collection. See ee.Collection.mapInternal()."""
    return self.mapInternal(image.Image, algorithm,
                            opt_dynamicArgs, opt_constantArgs, opt_destination)

  def __str__(self):
    """Writes out the collection in a human-readable form."""
    return 'ImageCollection(%s)' % serializer.toJSON(self._description)

  def __repr__(self):
    """Writes out the collection in an eval-able form."""
    return 'ee.ImageCollection(%s)' % self._description
