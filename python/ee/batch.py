#!/usr/bin/env python
"""An interface to the Earth Engine batch processing system.

Use the static methods on the Export class to create export tasks, call start()
on them to launch them, then poll status() to find out when they are finished.
The function styling uses camelCase to match the JavaScript names.
"""

# pylint: disable=g-bad-name

import json
import data
import ee_exception
import geometry


class Task(object):
  """A batch task that can be run on the EE batch processing system."""

  def __init__(self, taskId, config=None):
    """Creates a Task with the given ID and configuration.

    The constructor is not for public use. Instances can be obtained by:
    - Calling the static method Task.list().
    - Calling any of the methods on the Export static class.
    - Unpickling a previously pickled Task object.

    If you're looking for a task's status but don't need a full task object,
    ee.data.getTaskStatus() may be appropriate.

    Args:
      taskId: The task ID, originally obtained through ee.data.newTaskId().
      config: The task configuration dictionary. Only necessary if start()
          will be called. Fields shared by all tasks are:
          - type: The type of the task. One of entries in Task.Type.
          - state: The state of the task. One of entries in Task.State.
          - description: The name of the task, a freeform string.
          - sourceURL: An optional URL for the script that generated the task.
          Specific task types have other custom config fields.
    """
    self.id = taskId
    self.config = config and config.copy()

  class Type(object):
    EXPORT_IMAGE = 'EXPORT_IMAGE'
    EXPORT_MAP = 'EXPORT_TILES'
    EXPORT_TABLE = 'EXPORT_FEATURES'
    EXPORT_VIDEO = 'EXPORT_VIDEO'

  class State(object):
    UNSUBMITTED = 'UNSUBMITTED'
    READY = 'READY'
    RUNNING = 'RUNNING'
    COMPLETED = 'COMPLETED'
    FAILED = 'FAILED'
    CANCEL_REQUESTED = 'CANCEL_REQUESTED'
    CANCELLED = 'CANCELLED'

  # Export destinations.
  class ExportDestination(object):
    DRIVE = 'DRIVE'
    GCS = 'GOOGLE_CLOUD_STORAGE'

  def start(self):
    """Starts the task. No-op for started tasks."""
    if not self.config:
      raise ee_exception.EEException(
          'Task config must be specified for tasks to be started.')
    data.startProcessing(self.id, self.config)

  def status(self):
    """Fetches the current status of the task.

    Returns:
      A dictionary describing the current status of the task as it appears on
      the EE server. Includes the following fields:
      - state: One of the values in Task.State.
      - creation_timestamp_ms: The Unix timestamp of when the task was created.
      - update_timestamp_ms: The Unix timestamp of when the task last changed.
      - output_url: URL of the output. Appears only if state is COMPLETED.
      - error_message: Failure reason. Appears only if state is FAILED.
      May also include other fields.
    """
    result = data.getTaskStatus(self.id)[0]
    if result['state'] == 'UNKNOWN': result['state'] = Task.State.UNSUBMITTED
    return result

  def active(self):
    """Returns whether the task is still running."""
    return self.status()['state'] in (Task.State.READY,
                                      Task.State.RUNNING,
                                      Task.State.CANCEL_REQUESTED)

  def cancel(self):
    """Cancels the task."""
    data.cancelTask(self.id)

  @staticmethod
  def list():
    """Returns the tasks submitted to EE by the current user.

    These include all currently running tasks as well as recently canceled or
    failed tasks.

    Returns:
      A list of Tasks.
    """
    statuses = data.getTaskList()
    tasks = []
    for status in statuses:
      tasks.append(Task(status['id'], {
          'type': status['task_type'],
          'description': status['description'],
          'state': status['state'],
      }))
    return tasks

  def __repr__(self):
    """Returns a string representation of the task."""
    if self.config:
      return '<Task %(type)s: %(description)s (%(state)s)>' % self.config
    else:
      return '<Task "%s">' % self.id


class Export(object):
  """A class with static methods to start export tasks."""

  def __init__(self):
    """Forbids class instantiation."""
    raise AssertionError('This class cannot be instantiated.')

  class image(object):
    """A static class with methods to start image export tasks."""

    def __init__(self):
      """Forbids class instantiation."""
      raise AssertionError('This class cannot be instantiated.')

    def __new__(cls, image, description='myExportImageTask', config=None):
      """Creates a task to export an EE Image to Google Drive or Cloud Storage.

      Args:
        image: The image to be exported.
        description: Human-readable name of the task.
        config: A dictionary that will be copied and used as parameters
            for the task:
            - region: The lon,lat coordinates for a LinearRing or Polygon
              specifying the region to export. Can be specified as a nested
              lists of numbers or a serialized string. Defaults to the image's
              region.
            - scale: The resolution in meters per pixel.
              Defaults to the native resolution of the image assset unless
              a crs_transform is specified.
            - maxPixels: The maximum allowed number of pixels in the exported
              image. The task will fail if the exported region covers
              more pixels in the specified projection. Defaults to 100,000,000.
            - crs: The coordinate reference system of the exported image's
              projection. Defaults to the image's default projection.
            - crs_transform: A comma-separated string of 6 numbers describing
              the affine transform of the coordinate reference system of the
              exported image's projection, in the order: xScale, yShearing,
              xShearing, yScale, xTranslation and yTranslation. Defaults to
              the image's native CRS transform.
            - dimensions: The dimensions of the exported image. Takes either a
              single positive integer as the maximum dimension or
              "WIDTHxHEIGHT" where WIDTH and HEIGHT are each positive integers.
            If exporting to Google Drive (default):
            - driveFolder: The name of a unique folder in your Drive account to
              export into. Defaults to the root of the drive.
            - driveFileNamePrefix: The Google Drive filename for the export.
              Defaults to the name of the task.
            If exporting to Google Cloud Storage:
            - outputBucket: The name of a Cloud Storage bucket for the export.
            - outputPrefix: Cloud Storage object name prefix for the export.

      Returns:
        An unstarted Task that exports the image.
      """
      config = (config or {}).copy()
      if 'driveFileNamePrefix' not in config and 'outputBucket' not in config:
        config['driveFileNamePrefix'] = description

      if 'region' in config:
        # Convert the region to a serialized form, if necessary.
        config['region'] = _GetSerializedRegion(config.get('region'))

      return _CreateTask(
          Task.Type.EXPORT_IMAGE, image, description, config)

    # Disable argument usage check; arguments are accessed using local().
    # pylint: disable=unused-argument
    @staticmethod
    def toCloudStorage(image, description='myExportImageTask',
                       bucket=None, fileNamePrefix=None,
                       dimensions=None, region=None, scale=None,
                       crs=None, crsTransform=None, maxPixels=None,
                       **kwargs):
      """Creates a task to export an EE Image to Google Cloud Storage.

      Args:
        image: The image to be exported.
        description: Human-readable name of the task.
        bucket: The name of a Cloud Storage bucket for the export.
        fileNamePrefix: Cloud Storage object name prefix for the export.
            Defaults to the name of the task.
        dimensions: The dimensions of the exported image. Takes either a
            single positive integer as the maximum dimension or "WIDTHxHEIGHT"
            where WIDTH and HEIGHT are each positive integers.
        region: The lon,lat coordinates for a LinearRing or Polygon
            specifying the region to export. Can be specified as a nested
            lists of numbers or a serialized string. Defaults to the image's
            region.
        scale: The resolution in meters per pixel. Defaults to the
            native resolution of the image assset unless a crs_transform
            is specified.
        crs: The coordinate reference system of the exported image's
            projection. Defaults to the image's default projection.
        crsTransform: A comma-separated string of 6 numbers describing
            the affine transform of the coordinate reference system of the
            exported image's projection, in the order: xScale, yShearing,
            xShearing, yScale, xTranslation and yTranslation. Defaults to
            the image's native CRS transform.
        maxPixels: The maximum allowed number of pixels in the exported
            image. The task will fail if the exported region covers more
            pixels in the specified projection. Defaults to 100,000,000.
        **kwargs: Holds other keyword arguments that may have been deprecated
            such as 'crs_transform'.

      Returns:
        An unstarted Task that exports the image to Google Cloud Storage.
      """
      # _CopyDictFilterNone must be called first because it copies locals to
      # support deprecated arguments.
      config = _CopyDictFilterNone(locals())

      _ConvertToServerParams(config, 'image', Task.ExportDestination.GCS)

      if 'region' in config:
        # Convert the region to a serialized form, if necessary.
        config['region'] = _GetSerializedRegion(config.get('region'))

      return _CreateTask(
          Task.Type.EXPORT_IMAGE, image, description, config)

    @staticmethod
    def toDrive(image, description='myExportImageTask', folder=None,
                fileNamePrefix=None, dimensions=None, region=None,
                scale=None, crs=None, crsTransform=None, maxPixels=None,
                **kwargs):
      """Creates a task to export an EE Image to Drive.

      Args:
        image: The image to be exported.
        description: Human-readable name of the task.
        folder: The name of a unique folder in your Drive account to
            export into. Defaults to the root of the drive.
        fileNamePrefix: The Google Drive filename for the export.
            Defaults to the name of the task.
        dimensions: The dimensions of the exported image. Takes either a
            single positive integer as the maximum dimension or "WIDTHxHEIGHT"
            where WIDTH and HEIGHT are each positive integers.
        region: The lon,lat coordinates for a LinearRing or Polygon
            specifying the region to export. Can be specified as a nested
            lists of numbers or a serialized string. Defaults to the image's
            region.
        scale: The resolution in meters per pixel. Defaults to the
            native resolution of the image assset unless a crs_transform
            is specified.
        crs: The coordinate reference system of the exported image's
            projection. Defaults to the image's default projection.
        crsTransform: A comma-separated string of 6 numbers describing
            the affine transform of the coordinate reference system of the
            exported image's projection, in the order: xScale, yShearing,
            xShearing, yScale, xTranslation and yTranslation. Defaults to
            the image's native CRS transform.
        maxPixels: The maximum allowed number of pixels in the exported
            image. The task will fail if the exported region covers more
            pixels in the specified projection. Defaults to 100,000,000.
        **kwargs: Holds other keyword arguments that may have been deprecated
            such as 'crs_transform', 'driveFolder', and 'driveFileNamePrefix'.

      Returns:
        An unstarted Task that exports the image to Drive.
      """
      # _CopyDictFilterNone must be called first because it copies locals to
      # support deprecated arguments.
      config = _CopyDictFilterNone(locals())

      # fileNamePrefix should be defaulted before converting to server params.
      if 'fileNamePrefix' not in config:
        config['fileNamePrefix'] = description

      _ConvertToServerParams(config, 'image', Task.ExportDestination.DRIVE)

      if 'region' in config:
        # Convert the region to a serialized form, if necessary.
        config['region'] = _GetSerializedRegion(config.get('region'))

      return _CreateTask(
          Task.Type.EXPORT_IMAGE, image, description, config)
    # pylint: enable=unused-argument

  class map(object):
    """A class with a static method to start map export tasks."""

    def __init__(self):
      """Forbids class instantiation."""
      raise AssertionError('This class cannot be instantiated.')

    # Disable argument usage check; arguments are accessed using local().
    # pylint: disable=unused-argument
    @staticmethod
    def toCloudStorage(image, description='myExportMapTask', bucket=None,
                       fileFormat=None, path=None, writePublicTiles=None,
                       maxZoom=None, scale=None, minZoom=None,
                       region=None, **kwargs):
      """Creates a task to export an Image as a pyramid of map tiles.

      Exports a rectangular pyramid of map tiles for use with web map
      viewers. The map tiles will be accompanied by a reference
      index.html file that displays them using the Google Maps API.

      Args:
        image: The image to export as tiles.
        description: Human-readable name of the task.
        bucket: The destination bucket to write to.
        fileFormat: The map tiles' file format, one of 'auto', 'png',
            or 'jpeg'. Defaults to 'auto', which means that opaque tiles
            will be encoded as 'jpg' and tiles with transparency will be
            encoded as 'png'.
        path: The string used as the output's path. A trailing '/'
            is optional.
        writePublicTiles: Whether to write public tiles instead of using the
            bucket's default object ACL. Defaults to true and requires the
            invoker to be an OWNER of bucket.
        maxZoom: The maximum zoom level of the map tiles to export.
        scale: The max image resolution in meters per pixel, as an alternative
            to 'maxZoom'. The scale will be converted to the most appropriate
            maximum zoom level at the equator.
        minZoom: The optional minimum zoom level of the map tiles to export.
        region: The lon,lat coordinates for a LinearRing or Polygon
            specifying the region to export. Can be specified as a nested
            lists of numbers or a serialized string. Map tiles will be
            produced in the rectangular region containing this geometry.
            Defaults to the image's region.
        **kwargs: Holds other keyword arguments that may have been deprecated
            such as 'crs_transform'.

      Returns:
        An unstarted Task that exports the image to Google Cloud Storage.

      """
      # _CopyDictFilterNone must be called first because it copies locals to
      # support deprecated arguments.
      config = _CopyDictFilterNone(locals())

      _ConvertToServerParams(config, 'image', Task.ExportDestination.GCS)

      if 'fileFormat' not in config:
        config['fileFormat'] = 'auto'
      if 'writePublicTiles' not in config:
        config['writePublicTiles'] = True
      if 'region' in config:
        # Convert the region to a serialized form, if necessary.
        config['region'] = _GetSerializedRegion(config.get('region'))

      return _CreateTask(
          Task.Type.EXPORT_MAP, image, description, config)
    # pylint: enable=unused-argument

  class table(object):
    """A class with static methods to start table export tasks."""

    def __init__(self):
      """Forbids class instantiation."""
      raise AssertionError('This class cannot be instantiated.')

    def __new__(cls, collection, description='myExportTableTask', config=None):
      """Export an EE FeatureCollection as a table.

      The exported table will reside in Google Drive or Cloud Storage.

      Args:
        collection: The feature collection to be exported.
        description: Human-readable name of the task.
        config: A dictionary that will be copied and used as parameters
            for the task:
            - fileFormat: The output format: CSV (default), GeoJSON,
              KML, or KMZ.
            If exporting to Google Drive (default):
            - driveFolder: The name of a unique folder in your Drive
              account to export into. Defaults to the root of the drive.
            - driveFileNamePrefix: The Google Drive filename for the export.
              Defaults to the name of the task.
            If exporting to Google Cloud Storage:
            - outputBucket: The name of a Cloud Storage bucket for the export.
            - outputPrefix: Cloud Storage object name prefix for the export.

      Returns:
        An unstarted Task that exports the table.
      """
      config = (config or {}).copy()
      if 'driveFileNamePrefix' not in config and 'outputBucket' not in config:
        config['driveFileNamePrefix'] = description
      if 'fileFormat' not in config:
        config['fileFormat'] = 'CSV'
      return _CreateTask(
          Task.Type.EXPORT_TABLE, collection, description, config)

    # Disable argument usage check; arguments are accessed using local().
    # pylint: disable=unused-argument
    @staticmethod
    def toCloudStorage(collection, description='myExportTableTask',
                       bucket=None, fileNamePrefix=None,
                       fileFormat=None, **kwargs):
      """Creates a task to export a FeatureCollection to Google Cloud Storage.

      Args:
        collection: The feature collection to be exported.
        description: Human-readable name of the task.
        bucket: The name of a Cloud Storage bucket for the export.
        fileNamePrefix: Cloud Storage object name prefix for the export.
            Defaults to the name of the task.
        fileFormat: The output format: CSV (default), GeoJSON, KML, or KMZ.
        **kwargs: Holds other keyword arguments that may have been deprecated
            such as 'outputBucket'.

      Returns:
        An unstarted Task that exports the table.
      """
      # _CopyDictFilterNone must be called first because it copies locals to
      # support deprecated arguments.
      config = _CopyDictFilterNone(locals())

      if 'fileFormat' not in config:
        config['fileFormat'] = 'CSV'

      _ConvertToServerParams(
          config, 'collection', Task.ExportDestination.GCS)

      return _CreateTask(
          Task.Type.EXPORT_TABLE, collection, description, config)

    @staticmethod
    def toDrive(collection, description='myExportTableTask',
                folder=None, fileNamePrefix=None, fileFormat=None, **kwargs):
      """Creates a task to export a FeatureCollection to Google Cloud Storage.

      Args:
        collection: The feature collection to be exported.
        description: Human-readable name of the task.
        folder: The name of a unique folder in your Drive account to
            export into. Defaults to the root of the drive.
        fileNamePrefix: The Google Drive filename for the export.
            Defaults to the name of the task.
        fileFormat: The output format: CSV (default), GeoJSON, KML, or KMZ.
        **kwargs: Holds other keyword arguments that may have been deprecated
            such as 'driveFolder' and 'driveFileNamePrefix'.

      Returns:
        An unstarted Task that exports the table.
      """
      # _CopyDictFilterNone must be called first because it copies locals to
      # support deprecated arguments.
      config = _CopyDictFilterNone(locals())

      # fileNamePrefix should be defaulted before converting to server params.
      if 'fileNamePrefix' not in config:
        config['fileNamePrefix'] = description
      if 'fileFormat' not in config:
        config['fileFormat'] = 'CSV'

      _ConvertToServerParams(
          config, 'collection', Task.ExportDestination.DRIVE)

      return _CreateTask(
          Task.Type.EXPORT_TABLE, collection, description, config)

  class video(object):
    """A class with static methods to start video export task."""

    def __init__(self):
      """Forbids class instantiation."""
      raise AssertionError('This class cannot be instantiated.')

    def __new__(cls, collection, description='myExportVideoTask', config=None):
      """Exports an EE ImageCollection as a video.

      The exported video will reside in Google Drive or Cloud Storage.

      Args:
        collection: The image collection to be exported. The collection must
            only contain RGB images.
        description: Human-readable name of the task.
        config: A dictionary of configuration parameters for the task:
            - region: The lon,lat coordinates for a LinearRing or Polygon
              specifying the region to export. Can be specified as a nested
              lists of numbers or a serialized string. Defaults to the first
              image's region.
            - scale: The resolution in meters per pixel.
            - crs: The coordinate reference system of the exported video's
              projection. Defaults to SR-ORG:6627.
            - crs_transform: A comma-separated string of 6 numbers describing
              the affine transform of the coordinate reference system of the
              exported video's projection, in the order: xScale, yShearing,
              xShearing, yScale, xTranslation and yTranslation. Defaults to
              the image collection's native CRS transform.
            - dimensions: The dimensions of the exported video. Takes either a
              single positive integer as the maximum dimension or "WIDTHxHEIGHT"
              where WIDTH and HEIGHT are each positive integers.
            - framesPerSecond: A number between .1 and 100 describing the
              framerate of the exported video.
            - maxPixels: The maximum number of pixels per frame.
              Defaults to 1e8 pixels per frame. By setting this explicitly,
              you may raise or lower the limit.
            If exporting to Google Drive (default):
            - driveFolder: The name of a unique folder in your Drive account to
              export into. Defaults to the root of the drive.
            - driveFileNamePrefix: The Google Drive filename for the export.
              Defaults to the name of the task.
            If exporting to Google Cloud Storage:
            - outputBucket: The name of a Cloud Storage bucket for the export.
            - outputPrefix: Cloud Storage object name prefix for the export.

      Returns:
        An unstarted Task that exports the video.
      """
      config = (config or {}).copy()
      if 'crs' not in config:
        config['crs'] = 'SR-ORG:6627'
      if 'driveFileNamePrefix' not in config and 'outputBucket' not in config:
        config['driveFileNamePrefix'] = description

      if 'region' in config:
        # Convert the region to a serialized form, if necessary.
        config['region'] = _GetSerializedRegion(config.get('region'))

      return _CreateTask(
          Task.Type.EXPORT_VIDEO, collection, description, config)

    # Disable argument usage check; arguments are accessed using local().
    # pylint: disable=unused-argument
    @staticmethod
    def toCloudStorage(collection, description='myExportVideoTask',
                       bucket=None, fileNamePrefix=None, framesPerSecond=None,
                       dimensions=None, region=None, scale=None, crs=None,
                       crsTransform=None, maxPixels=None, **kwargs):
      """Creates a task to export an ImageCollection video to Cloud Storage.

      Args:
        collection: The image collection to be exported. The collection must
            only contain RGB images.
        description: Human-readable name of the task.
        bucket: The name of a Cloud Storage bucket for the export.
        fileNamePrefix: Cloud Storage object name prefix for the export.
            Defaults to the task's description.
        framesPerSecond: A number between .1 and 100 describing the
            framerate of the exported video.
        dimensions: The dimensions of the exported video. Takes either a
            single positive integer as the maximum dimension or "WIDTHxHEIGHT"
            where WIDTH and HEIGHT are each positive integers.
        region: The lon,lat coordinates for a LinearRing or Polygon
            specifying the region to export. Can be specified as a nested
            lists of numbers or a serialized string. Defaults to the first
            image's region.
        scale: The resolution in meters per pixel.
        crs: The coordinate reference system of the exported video's
            projection. Defaults to SR-ORG:6627.
        crsTransform: A comma-separated string of 6 numbers describing
            the affine transform of the coordinate reference system of the
            exported video's projection, in the order: xScale, yShearing,
            xShearing, yScale, xTranslation and yTranslation. Defaults to
            the image collection's native CRS transform.
        maxPixels: The maximum number of pixels per frame.
            Defaults to 1e8 pixels per frame. By setting this explicitly,
            you may raise or lower the limit.
        **kwargs: Holds other keyword arguments that may have been deprecated
            such as 'crs_transform'.

      Returns:
        An unstarted Task that exports the image collection
        to Google Cloud Storage.
      """
      # _CopyDictFilterNone must be called first because it copies locals to
      # support deprecated arguments.
      config = _CopyDictFilterNone(locals())
      if 'crs' not in config:
        config['crs'] = 'SR-ORG:6627'
      if 'fileNamePrefix' not in config:
        config['fileNamePrefix'] = description

      _ConvertToServerParams(config, 'collection', Task.ExportDestination.GCS)

      if 'region' in config:
        # Convert the region to a serialized form, if necessary.
        config['region'] = _GetSerializedRegion(config.get('region'))

      return _CreateTask(
          Task.Type.EXPORT_VIDEO, collection, description, config)

    @staticmethod
    def toDrive(collection, description='myExportVideoTask',
                folder=None, fileNamePrefix=None, framesPerSecond=None,
                dimensions=None, region=None, scale=None, crs=None,
                crsTransform=None, maxPixels=None, **kwargs):
      """Creates a task to export an ImageCollection as a video to Drive.

      Args:
        collection: The image collection to be exported. The collection must
            only contain RGB images.
        description: Human-readable name of the task.
        folder: The name of a unique folder in your Drive account to
            export into. Defaults to the root of the drive.
        fileNamePrefix: The Google Drive filename for the export.
            Defaults to the name of the task.
        framesPerSecond: A number between .1 and 100 describing the
            framerate of the exported video.
        dimensions: The dimensions of the exported video. Takes either a
            single positive integer as the maximum dimension or "WIDTHxHEIGHT"
            where WIDTH and HEIGHT are each positive integers.
        region: The lon,lat coordinates for a LinearRing or Polygon
            specifying the region to export. Can be specified as a nested
            lists of numbers or a serialized string. Defaults to the first
            image's region.
        scale: The resolution in meters per pixel.
        crs: The coordinate reference system of the exported video's
            projection. Defaults to SR-ORG:6627.
        crsTransform: A comma-separated string of 6 numbers describing
            the affine transform of the coordinate reference system of the
            exported video's projection, in the order: xScale, yShearing,
            xShearing, yScale, xTranslation and yTranslation. Defaults to
            the image collection's native CRS transform.
        maxPixels: The maximum number of pixels per frame.
            Defaults to 1e8 pixels per frame. By setting this explicitly,
            you may raise or lower the limit.
        **kwargs: Holds other keyword arguments that may have been deprecated
            such as 'crs_transform'.

      Returns:
        An unstarted Task that exports the image collection to Drive.
      """
      # _CopyDictFilterNone must be called first because it copies locals to
      # support deprecated arguments.
      config = _CopyDictFilterNone(locals())
      if 'crs' not in config:
        config['crs'] = 'SR-ORG:6627'
      if 'fileNamePrefix' not in config:
        config['fileNamePrefix'] = description

      _ConvertToServerParams(config, 'collection', Task.ExportDestination.DRIVE)

      if 'region' in config:
        # Convert the region to a serialized form, if necessary.
        config['region'] = _GetSerializedRegion(config.get('region'))

      return _CreateTask(
          Task.Type.EXPORT_VIDEO, collection, description, config)
    # pylint: enable=unused-argument


def _CreateTask(task_type, ee_object, description, config):
  """Creates an export task.

  Args:
    task_type: The type of the task to create. One of Task.Type.
    ee_object: The object to export.
    description: Human-readable name of the task.
    config: Custom config fields for the task.

  Returns:
    An unstarted export Task.
  """
  full_config = {
      'type': task_type,
      'json': ee_object.serialize(),
      'description': description,
      'state': Task.State.UNSUBMITTED,
  }
  if config: full_config.update(config)
  return Task(data.newTaskId()[0], full_config)


def _GetSerializedRegion(region):
  """Converts a region parameter to serialized form, if it isn't already."""
  region_error = ee_exception.EEException(
      'Invalid format for region property. '
      'See Export.image() documentation for more details.')
  if isinstance(region, basestring):
    try:
      region = json.loads(region)
    except:
      raise region_error
  try:
    geometry.Geometry.LineString(region)
  except:  # pylint: disable=bare-except
    try:
      geometry.Geometry.Polygon(region)
    except:
      raise region_error
  return json.dumps(region)


def _CopyDictFilterNone(originalDict):
  """Copies a dictionary and filters out None values."""
  return dict((k, v) for k, v in originalDict.iteritems() if v is not None)


def _ConvertToServerParams(configDict, eeElementKey, destination):
  """Converts an export configuration to server friendly parameters.

  Note that configDict is changed in place and not returned.

  Args:
    configDict: The configuration dictionary to be converted.
    eeElementKey: The key used to access the EE element.
    destination: The destination to export to.
  """
  del configDict[eeElementKey]
  if 'kwargs' in configDict:
    configDict.update(configDict['kwargs'])
    del configDict['kwargs']

  if 'crsTransform' in configDict:
    configDict['crs_transform'] = configDict.pop('crsTransform')

  if destination is Task.ExportDestination.GCS:
    if 'bucket' in configDict:
      configDict['outputBucket'] = configDict.pop('bucket')

    if 'fileNamePrefix' in configDict:
      if 'outputPrefix' not in configDict:
        configDict['outputPrefix'] = configDict.pop('fileNamePrefix')
      else:
        del configDict['fileNamePrefix']

    # Only used with Export.map
    if 'path' in configDict:
      configDict['outputPrefix'] = configDict.pop('path')
  elif destination is Task.ExportDestination.DRIVE:
    if 'folder' in configDict:
      configDict['driveFolder'] = configDict.pop('folder')

    if 'fileNamePrefix' in configDict:
      if 'driveFileNamePrefix' not in configDict:
        configDict['driveFileNamePrefix'] = configDict.pop('fileNamePrefix')
      else:
        del configDict['fileNamePrefix']
  else:
    raise ee_exception.EEException('Unknown export destination.')
