#!/usr/bin/env python
"""Representation for an Earth Engine ImageCollection."""



# Using lowercase function naming to match the JavaScript names.
# pylint: disable=g-bad-name

from . import apifunction
from . import collection
from . import computedobject
from . import ee_exception
from . import ee_list
from . import ee_types
from . import image


class ImageCollection(collection.Collection):
  """Representation for an Earth Engine ImageCollection."""

  _initialized = False

  def __init__(self, args):
    """ImageCollection constructor.

    Args:
       args: ImageCollections can be constructed from the following arguments:
           1) A string: assumed to be the name of a collection,
           2) An array of images, or anything that can be used to construct an
              image.
           3) A single image.
           5) A computed object - reinterpreted as a collection.

    Raises:
      EEException: if passed something other than the above.
    """
    self.initialize()

    # Wrap single images in an array.
    if isinstance(args, image.Image):
      args = [args]

    if ee_types.isString(args):
      # An ID.
      super(ImageCollection, self).__init__(
          apifunction.ApiFunction.lookup('ImageCollection.load'), {'id': args})
    elif isinstance(args, (list, tuple)):
      # A list of images.
      super(ImageCollection, self).__init__(
          apifunction.ApiFunction.lookup('ImageCollection.fromImages'), {
              'images': [image.Image(i) for i in args]
          })
    elif isinstance(args, ee_list.List):
      # A computed list of images.
      super(ImageCollection, self).__init__(
          apifunction.ApiFunction.lookup('ImageCollection.fromImages'), {
              'images': args
          })
    elif isinstance(args, computedobject.ComputedObject):
      # A custom object to reinterpret as a ImageCollection.
      super(ImageCollection, self).__init__(args.func, args.args, args.varName)
    else:
      raise ee_exception.EEException(
          'Unrecognized argument type to convert to a ImageCollection: %s' %
          args)

  @classmethod
  def initialize(cls):
    """Imports API functions to this class."""
    if not cls._initialized:
      super(ImageCollection, cls).initialize()
      apifunction.ApiFunction.importApi(
          cls, 'ImageCollection', 'ImageCollection')
      apifunction.ApiFunction.importApi(
          cls, 'reduce', 'ImageCollection')
      cls._initialized = True

  @classmethod
  def reset(cls):
    """Removes imported API functions from this class."""
    apifunction.ApiFunction.clearApi(cls)
    cls._initialized = False

  def getMapId(self, vis_params=None):
    """Fetch and return a MapID.

    This mosaics the collection to a single image and return a mapid suitable
    for building a Google Maps overlay.

    Args:
       vis_params: The visualization parameters.

    Returns:
       A mapid and token.
    """
    mosaic = apifunction.ApiFunction.call_('ImageCollection.mosaic', self)
    return mosaic.getMapId(vis_params)

  def select(self, selectors, opt_names=None, *args):
    """Select bands from each image in a collection.

    Args:
      selectors: An array of names, regexes or numeric indices specifying
          the bands to select.
      opt_names: An array of strings specifying the new names for the
          selected bands.  If supplied, the length must match the number
          of bands selected.
      *args: Selector elements as varargs.

    Returns:
      The image collection with selected bands.
    """
    return self.map(lambda img: img.select(selectors, opt_names, *args))

  def first(self):
    """Returns the first entry from a given collection.

    Returns:
      The first entry from the collection.
    """
    return image.Image(apifunction.ApiFunction.call_('Collection.first', self))

  @staticmethod
  def name():
    return 'ImageCollection'

  @staticmethod
  def elementType():
    return image.Image
