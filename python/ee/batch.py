#!/usr/bin/env python
"""An interface to the Earth Engine batch processing system.

Use the static methods on the Export class to create export tasks, call start()
on them to launch them, then poll status() to find out when they are finished.
The public function styling uses camelCase to match the JavaScript names.
"""

# pylint: disable=g-bad-name

# pylint: disable=g-bad-import-order
import json
import six

from . import data
from . import ee_exception
from . import geometry


class Task(object):
  """A batch task that can be run on the EE batch processing system."""

  def __init__(self, task_id, task_type, state, config=None):
    """Creates a Task with the given ID and configuration.

    The constructor is not for public use. Instances can be obtained by:
    - Calling the static method Task.list().
    - Calling any of the methods on the Export static class.
    - Unpickling a previously pickled Task object.

    If you're looking for a task's status but don't need a full task object,
    ee.data.getTaskStatus() may be appropriate.

    Args:
      task_id: The task ID, originally obtained through ee.data.newTaskId().
        May be None if the ID is not yet known.
      task_type: The type of the task; one of the values in Task.Type.
      state: The state of the task; one of the values entries in Task.State.
      config: The task configuration dictionary. Only necessary if start()
          will be called. Fields shared by all tasks are:
          - description: The name of the task, a freeform string.
          - sourceURL: An optional URL for the script that generated the task.
          Specific task types have other custom config fields.
    """
    self.id = self._request_id = task_id
    self.config = config and config.copy()
    self.task_type = task_type
    self.state = state

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
    ASSET = 'ASSET'

  def start(self):
    """Starts the task. No-op for started tasks."""
    if not self.config:
      raise ee_exception.EEException(
          'Task config must be specified for tasks to be started.')
    if not self._request_id:
      self._request_id = data.newTaskId()[0]

    if self.task_type == Task.Type.EXPORT_IMAGE:
      result = data.exportImage(self._request_id, self.config)
    elif self.task_type == Task.Type.EXPORT_MAP:
      result = data.exportMap(self._request_id, self.config)
    elif self.task_type == Task.Type.EXPORT_TABLE:
      result = data.exportTable(self._request_id, self.config)
    elif self.task_type == Task.Type.EXPORT_VIDEO:
      result = data.exportVideo(self._request_id, self.config)
    else:
      raise ee_exception.EEException(
          'Unknown Task type "{}"'.format(self.task_type))

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
    if self.id:
      result = data.getTaskStatus(self.id)[0]
      if result['state'] == 'UNKNOWN':
        result['state'] = Task.State.UNSUBMITTED
    else:
      result = {'state': Task.State.UNSUBMITTED}
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
      tasks.append(Task(status['id'],
                        status.get('task_type'),
                        status.get('state'),
                        {'description': status.get('description')}))
    return tasks

  def __repr__(self):
    """Returns a string representation of the task."""
    if self.config:
      return '<Task %s: %s (%s)>' % (self.task_type, self.config['description'],
                                     self.state)
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
              exported image's projection, in the order: xScale, xShearing,
              xTranslation, yShearing, yScale and yTranslation. Defaults to
              the image's native CRS transform.
            - dimensions: The dimensions of the exported image. Takes either a
              single positive integer as the maximum dimension or
              "WIDTHxHEIGHT" where WIDTH and HEIGHT are each positive integers.
            - skipEmptyTiles: If true, skip writing empty (i.e. fully-masked)
              image tiles. Defaults to false.
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

      if 'driveFileNamePrefix' in config:
        return Export.image.toDrive(image, description, **config)
      else:
        return Export.image.toCloudStorage(image, description, **config)

    # Disable argument usage check; arguments are accessed using locals().
    # pylint: disable=unused-argument
    @staticmethod
    def toAsset(image, description='myExportImageTask', assetId=None,
                pyramidingPolicy=None, dimensions=None, region=None,
                scale=None, crs=None, crsTransform=None, maxPixels=None,
                **kwargs):
      """Creates a task to export an EE Image to an EE Asset.

      Args:
        image: The image to be exported.
        description: Human-readable name of the task.
        assetId: The destination asset ID.
        pyramidingPolicy: The pyramiding policy to apply to each band in the
            image, a dictionary keyed by band name. Values must be
            one of: "mean", "sample", "min", "max", or "mode".
            Defaults to "mean". A special key, ".default", may be used to
            change the default for all bands.
        dimensions: The dimensions of the exported image. Takes either a
            single positive integer as the maximum dimension or "WIDTHxHEIGHT"
            where WIDTH and HEIGHT are each positive integers.
        region: The lon,lat coordinates for a LinearRing or Polygon
            specifying the region to export. Can be specified as a nested
            lists of numbers or a serialized string. Defaults to the image's
            region.
        scale: The resolution in meters per pixel. Defaults to the
            native resolution of the image assset unless a crsTransform
            is specified.
        crs: The coordinate reference system of the exported image's
            projection. Defaults to the image's default projection.
        crsTransform: A comma-separated string of 6 numbers describing
            the affine transform of the coordinate reference system of the
            exported image's projection, in the order: xScale, xShearing,
            xTranslation, yShearing, yScale and yTranslation. Defaults to
            the image's native CRS transform.
        maxPixels: The maximum allowed number of pixels in the exported
            image. The task will fail if the exported region covers more
            pixels in the specified projection. Defaults to 100,000,000.
        **kwargs: Holds other keyword arguments that may have been deprecated
            such as 'crs_transform'.

      Returns:
        An unstarted Task that exports the image to Drive.
      """
      config = _capture_parameters(locals(), ['image'])
      config = _prepare_image_export_config(image, config,
                                            Task.ExportDestination.ASSET)
      return _create_export_task(config, Task.Type.EXPORT_IMAGE)

    # Disable argument usage check; arguments are accessed using locals().
    # pylint: disable=unused-argument
    @staticmethod
    def toCloudStorage(image, description='myExportImageTask',
                       bucket=None, fileNamePrefix=None,
                       dimensions=None, region=None, scale=None,
                       crs=None, crsTransform=None, maxPixels=None,
                       shardSize=None, fileDimensions=None,
                       skipEmptyTiles=None, fileFormat=None, formatOptions=None,
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
            native resolution of the image assset unless a crsTransform
            is specified.
        crs: The coordinate reference system of the exported image's
            projection. Defaults to the image's default projection.
        crsTransform: A comma-separated string of 6 numbers describing
            the affine transform of the coordinate reference system of the
            exported image's projection, in the order: xScale, xShearing,
            xTranslation, yShearing, yScale and yTranslation. Defaults to
            the image's native CRS transform.
        maxPixels: The maximum allowed number of pixels in the exported
            image. The task will fail if the exported region covers more
            pixels in the specified projection. Defaults to 100,000,000.
        shardSize: Size in pixels of the shards in which this image will be
            computed. Defaults to 256.
        fileDimensions: The dimensions in pixels of each image file, if the
            image is too large to fit in a single file. May specify a
            single number to indicate a square shape, or a tuple of two
            dimensions to indicate (width,height). Note that the image will
            still be clipped to the overall image dimensions. Must be a
            multiple of shardSize.
        skipEmptyTiles: If true, skip writing empty (i.e. fully-masked)
            image tiles. Defaults to false.
        fileFormat: The string file format to which the image is exported.
            Currently only 'GeoTIFF' and 'TFRecord' are supported, defaults to
            'GeoTIFF'.
        formatOptions: A dictionary of string keys to format specific options.
        **kwargs: Holds other keyword arguments that may have been deprecated
            such as 'crs_transform'.

      Returns:
        An unstarted Task that exports the image to Google Cloud Storage.
      """
      config = _capture_parameters(locals(), ['image'])
      config = _prepare_image_export_config(image, config,
                                            Task.ExportDestination.GCS)
      return _create_export_task(config, Task.Type.EXPORT_IMAGE)

    @staticmethod
    def toDrive(image, description='myExportImageTask', folder=None,
                fileNamePrefix=None, dimensions=None, region=None,
                scale=None, crs=None, crsTransform=None,
                maxPixels=None, shardSize=None, fileDimensions=None,
                skipEmptyTiles=None, fileFormat=None, formatOptions=None,
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
            native resolution of the image assset unless a crsTransform
            is specified.
        crs: The coordinate reference system of the exported image's
            projection. Defaults to the image's default projection.
        crsTransform: A comma-separated string of 6 numbers describing
            the affine transform of the coordinate reference system of the
            exported image's projection, in the order: xScale, xShearing,
            xTranslation, yShearing, yScale and yTranslation. Defaults to
            the image's native CRS transform.
        maxPixels: The maximum allowed number of pixels in the exported
            image. The task will fail if the exported region covers more
            pixels in the specified projection. Defaults to 100,000,000.
        shardSize: Size in pixels of the shards in which this image will be
            computed. Defaults to 256.
        fileDimensions: The dimensions in pixels of each image file, if the
            image is too large to fit in a single file. May specify a
            single number to indicate a square shape, or a tuple of two
            dimensions to indicate (width,height). Note that the image will
            still be clipped to the overall image dimensions. Must be a
            multiple of shardSize.
        skipEmptyTiles: If true, skip writing empty (i.e. fully-masked)
            image tiles. Defaults to false.
        fileFormat: The string file format to which the image is exported.
            Currently only 'GeoTIFF' and 'TFRecord' are supported, defaults to
            'GeoTIFF'.
        formatOptions: A dictionary of string keys to format specific options.
        **kwargs: Holds other keyword arguments that may have been deprecated
            such as 'crs_transform', 'driveFolder', and 'driveFileNamePrefix'.

      Returns:
        An unstarted Task that exports the image to Drive.
      """
      config = _capture_parameters(locals(), ['image'])
      config = _prepare_image_export_config(image, config,
                                            Task.ExportDestination.DRIVE)
      return _create_export_task(config, Task.Type.EXPORT_IMAGE)
    # pylint: enable=unused-argument

  class map(object):
    """A class with a static method to start map export tasks."""

    def __init__(self):
      """Forbids class instantiation."""
      raise AssertionError('This class cannot be instantiated.')

    # Disable argument usage check; arguments are accessed using locals().
    # pylint: disable=unused-argument
    @staticmethod
    def toCloudStorage(image, description='myExportMapTask', bucket=None,
                       fileFormat=None, path=None, writePublicTiles=None,
                       maxZoom=None, scale=None, minZoom=None,
                       region=None, skipEmptyTiles=None, mapsApiKey=None,
                       **kwargs):
      """Creates a task to export an Image as a pyramid of map tiles.

      Exports a rectangular pyramid of map tiles for use with web map
      viewers. The map tiles will be accompanied by a reference
      index.html file that displays them using the Google Maps API,
      and an earth.html file for opening the map on Google Earth.

      Args:
        image: The image to export as tiles.
        description: Human-readable name of the task.
        bucket: The destination bucket to write to.
        fileFormat: The map tiles' file format, one of 'auto', 'png',
            or 'jpeg'. Defaults to 'auto', which means that opaque tiles
            will be encoded as 'jpg' and tiles with transparency will be
            encoded as 'png'.
        path: The string used as the output's path. A trailing '/'
            is optional. Defaults to the task's description.
        writePublicTiles: Whether to write public tiles instead of using the
            bucket's default object ACL. Defaults to True and requires the
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
        skipEmptyTiles: If true, skip writing empty (i.e. fully-transparent)
            map tiles. Defaults to false.
        mapsApiKey: Used in index.html to initialize the Google Maps API. This
            removes the "development purposes only" message from the map.
        **kwargs: Holds other keyword arguments that may have been deprecated
            such as 'crs_transform'.

      Returns:
        An unstarted Task that exports the image to Google Cloud Storage.

      """
      config = _capture_parameters(locals(), ['image'])
      config = _prepare_map_export_config(image, config)
      return _create_export_task(config, Task.Type.EXPORT_MAP)
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
            - fileFormat: The output format: "CSV" (default), "GeoJSON", "KML",
              "KMZ", or "SHP".
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

      if 'driveFileNamePrefix' in config:
        return Export.table.toDrive(collection, description, **config)
      else:
        return Export.table.toCloudStorage(collection, description, **config)

    # Disable argument usage check; arguments are accessed using locals().
    # pylint: disable=unused-argument
    @staticmethod
    def toCloudStorage(collection, description='myExportTableTask',
                       bucket=None, fileNamePrefix=None,
                       fileFormat=None, selectors=None, **kwargs):
      """Creates a task to export a FeatureCollection to Google Cloud Storage.

      Args:
        collection: The feature collection to be exported.
        description: Human-readable name of the task.
        bucket: The name of a Cloud Storage bucket for the export.
        fileNamePrefix: Cloud Storage object name prefix for the export.
            Defaults to the name of the task.
        fileFormat: The output format: "CSV" (default), "GeoJSON", "KML", "KMZ",
            "SHP", or "TFRecord".
        selectors: The list of properties to include in the output, as a list
            of strings or a comma-separated string. By default, all properties
            are included.
        **kwargs: Holds other keyword arguments that may have been deprecated
            such as 'outputBucket'.

      Returns:
        An unstarted Task that exports the table.
      """
      config = _capture_parameters(locals(), ['collection'])
      config = _prepare_table_export_config(collection, config,
                                            Task.ExportDestination.GCS)
      return _create_export_task(config, Task.Type.EXPORT_TABLE)

    @staticmethod
    def toDrive(collection, description='myExportTableTask',
                folder=None, fileNamePrefix=None, fileFormat=None,
                selectors=None, **kwargs):
      """Creates a task to export a FeatureCollection to Google Cloud Storage.

      Args:
        collection: The feature collection to be exported.
        description: Human-readable name of the task.
        folder: The name of a unique folder in your Drive account to
            export into. Defaults to the root of the drive.
        fileNamePrefix: The Google Drive filename for the export.
            Defaults to the name of the task.
        fileFormat: The output format: "CSV" (default), "GeoJSON", "KML",
            "KMZ", "SHP", or "TFRecord".
        selectors: The list of properties to include in the output, as a list
            of strings or a comma-separated string. By default, all properties
            are included.
        **kwargs: Holds other keyword arguments that may have been deprecated
            such as 'driveFolder' and 'driveFileNamePrefix'.

      Returns:
        An unstarted Task that exports the table.
      """
      config = _capture_parameters(locals(), ['collection'])
      config = _prepare_table_export_config(collection, config,
                                            Task.ExportDestination.DRIVE)
      return _create_export_task(config, Task.Type.EXPORT_TABLE)

    @staticmethod
    def toAsset(collection, description='myExportTableTask', assetId=None,
                **kwargs):
      """Creates a task to export a FeatureCollection to an EE table asset.

      Args:
        collection: The feature collection to be exported.
        description: Human-readable name of the task.
        assetId: The destination asset ID.
        **kwargs: Holds other keyword arguments that may have been deprecated.

      Returns:
        An unstarted Task that exports the table.
      """
      config = _capture_parameters(locals(), ['collection'])
      config = _prepare_table_export_config(collection, config,
                                            Task.ExportDestination.ASSET)
      return _create_export_task(config, Task.Type.EXPORT_TABLE)

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
              exported video's projection, in the order: xScale, xShearing,
              xTranslation, yShearing, yScale and yTranslation. Defaults to
              the image collection's native CRS transform.
            - dimensions: The dimensions of the exported video. Takes either a
              single positive integer as the maximum dimension or "WIDTHxHEIGHT"
              where WIDTH and HEIGHT are each positive integers.
            - framesPerSecond: A number between .1 and 120 describing the
              framerate of the exported video.
            - maxPixels: The maximum number of pixels per frame.
              Defaults to 1e8 pixels per frame. By setting this explicitly,
              you may raise or lower the limit.
            - maxFrames: The maximum number of frames.
              Defaults to 1000 frames. By setting this explicitly, you may
              raise or lower the limit.
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
      if 'driveFileNamePrefix' not in config and 'outputBucket' not in config:
        config['driveFileNamePrefix'] = description

      if 'driveFileNamePrefix' in config:
        return Export.video.toDrive(collection, description, **config)
      else:
        return Export.video.toCloudStorage(collection, description, **config)

    # Disable argument usage check; arguments are accessed using locals().
    # pylint: disable=unused-argument
    @staticmethod
    def toCloudStorage(collection, description='myExportVideoTask',
                       bucket=None, fileNamePrefix=None, framesPerSecond=None,
                       dimensions=None, region=None, scale=None, crs=None,
                       crsTransform=None, maxPixels=None,
                       maxFrames=None, **kwargs):
      """Creates a task to export an ImageCollection video to Cloud Storage.

      Args:
        collection: The image collection to be exported. The collection must
            only contain RGB images.
        description: Human-readable name of the task.
        bucket: The name of a Cloud Storage bucket for the export.
        fileNamePrefix: Cloud Storage object name prefix for the export.
            Defaults to the task's description.
        framesPerSecond: A number between .1 and 120 describing the
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
            exported video's projection, in the order: xScale, xShearing,
            xTranslation, yShearing, yScale and yTranslation. Defaults to
            the image collection's native CRS transform.
        maxPixels: The maximum number of pixels per frame.
            Defaults to 1e8 pixels per frame. By setting this explicitly,
            you may raise or lower the limit.
        maxFrames: The maximum number of frames to export.
            Defaults to 1000 frames. By setting this explicitly, you may
            raise or lower the limit.
        **kwargs: Holds other keyword arguments that may have been deprecated
            such as 'crs_transform'.

      Returns:
        An unstarted Task that exports the image collection
        to Google Cloud Storage.
      """
      config = _capture_parameters(locals(), ['collection'])
      config = _prepare_video_export_config(collection, config,
                                            Task.ExportDestination.GCS)
      return _create_export_task(config, Task.Type.EXPORT_VIDEO)

    @staticmethod
    def toDrive(collection, description='myExportVideoTask',
                folder=None, fileNamePrefix=None, framesPerSecond=None,
                dimensions=None, region=None, scale=None, crs=None,
                crsTransform=None, maxPixels=None, maxFrames=None, **kwargs):
      """Creates a task to export an ImageCollection as a video to Drive.

      Args:
        collection: The image collection to be exported. The collection must
            only contain RGB images.
        description: Human-readable name of the task.
        folder: The name of a unique folder in your Drive account to
            export into. Defaults to the root of the drive.
        fileNamePrefix: The Google Drive filename for the export.
            Defaults to the name of the task.
        framesPerSecond: A number between .1 and 120 describing the
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
            exported video's projection, in the order: xScale, xShearing,
            xTranslation, yShearing, yScale and yTranslation. Defaults to
            the image collection's native CRS transform.
        maxPixels: The maximum number of pixels per frame.
            Defaults to 1e8 pixels per frame. By setting this explicitly,
            you may raise or lower the limit.
        maxFrames: The maximum number of frames to export.
            Defaults to 1000 frames. By setting this explicitly, you may
            raise or lower the limit.
        **kwargs: Holds other keyword arguments that may have been deprecated
            such as 'crs_transform'.

      Returns:
        An unstarted Task that exports the image collection to Drive.
      """
      config = _capture_parameters(locals(), ['collection'])
      config = _prepare_video_export_config(collection, config,
                                            Task.ExportDestination.DRIVE)
      return _create_export_task(config, Task.Type.EXPORT_VIDEO)



def _CheckConfigDisallowedPrefixes(config, prefix):
  for key in config:
    if key.startswith(prefix):
      raise ee_exception.EEException(
          'Export config parameter prefix "{}" disallowed, found "{}"'.
          format(prefix, key))

# Mapping from file formats to prefixes attached to format specific config.
FORMAT_PREFIX_MAP = {'GEOTIFF': 'tiff', 'TFRECORD': 'tfrecord'}

# Configuration field specifying file format for image exports.
IMAGE_FORMAT_FIELD = 'fileFormat'

# Image format-specific options dictionary config field.
IMAGE_FORMAT_OPTIONS_FIELD = 'formatOptions'

# Format-specific options permitted in formatOptions config parameter.
ALLOWED_FORMAT_OPTIONS = {
    'tiffCloudOptimized', 'tiffFileDimensions', 'tfrecordPatchDimensions',
    'tfrecordKernelSize', 'tfrecordCompressed', 'tfrecordMaxFileSize',
    'tfrecordDefaultValue', 'tfrecordTensorDepths', 'tfrecordSequenceData',
    'tfrecordCollapseBands', 'tfrecordMaskedThreshold'
}


def _ConvertConfigParams(config):
  """Converts numeric sequences into comma-separated string representations."""
  updatedConfig = {}
  for k, v in config.items():
    if v and isinstance(v, (list, tuple)):
      # Leave nested lists/tuples alone. We're only interested in converting
      # lists of strings or numbers.
      if not isinstance(v[0], (list, tuple)):
        updatedConfig[k] = ','.join(str(e) for e in v)

  return updatedConfig


# TODO(user): This method and its uses are very hack-y, and once we're using One
# Platform API we should stop sending arbitrary parameters from "options".
def ConvertFormatSpecificParams(configDict):
  """Mutates configDict into server params by extracting format options.

    For example:
      {'fileFormat': 'GeoTIFF', 'formatOptions': {'cloudOptimized': true}}
    becomes:
      {'fileFormat': 'GeoTIFF', 'tiffCloudOptimized': true}

    Also performs checks to make sure any specified options are valid and/or
    won't collide with top level arguments when converted to server-friendly
    parameters.

  Args:
    configDict: A task config dict

  Raises:
    EEException: We were unable to create format specific parameters for the
    server.
  """

  formatString = 'GeoTIFF'
  if IMAGE_FORMAT_FIELD in configDict:
    formatString = configDict[IMAGE_FORMAT_FIELD]

  formatString = formatString.upper()
  if formatString not in FORMAT_PREFIX_MAP:
    raise ee_exception.EEException(
        'Invalid file format. Currently only "GeoTIFF" and "TFRecord" is '
        'supported.')

  if IMAGE_FORMAT_OPTIONS_FIELD in configDict:
    options = configDict.pop(IMAGE_FORMAT_OPTIONS_FIELD)

    if set(options) & set(configDict):
      raise ee_exception.EEException(
          'Parameter specified at least twice: once in config, '
          'and once in format options.')

    prefix = FORMAT_PREFIX_MAP[formatString]
    _CheckConfigDisallowedPrefixes(configDict, prefix)

    prefixedOptions = {}
    for key, value in options.items():
      prefixedKey = prefix + key[:1].upper() + key[1:]
      if prefixedKey not in ALLOWED_FORMAT_OPTIONS:
        raise ee_exception.EEException(
            '"{}" is not a valid option for "{}".'.format(
                key, formatString))
      prefixedOptions[prefixedKey] = value

    prefixedOptions.update(_ConvertConfigParams(prefixedOptions))

    configDict.update(prefixedOptions)


def _prepare_image_export_config(image, config, export_destination):
  """Performs all preparation steps for an image export.

  Args:
    image: The Image to be exported.
    config: All the user-specified export parameters. May be modified.
    export_destination: One of the Task.ExportDestination values.

  Returns:
    A config dict containing all information required for the export.
  """
  # Supply some defaults.
  if (export_destination != Task.ExportDestination.ASSET and
      'fileFormat' not in config):
    config['fileFormat'] = 'GeoTIFF'

  _canonicalize_parameters(config, export_destination)

  image, config = image.prepare_for_export(config)
  if export_destination != Task.ExportDestination.ASSET:
    ConvertFormatSpecificParams(config)

  config.update(_ConvertConfigParams(config))
  config['json'] = image.serialize()

  return config


def _prepare_map_export_config(image, config):
  """Performs all preparation steps for a map export.

  Args:
    image: The Image to be exported.
    config: All the user-specified export parameters. May be modified.

  Returns:
    A config dict containing all information required for the export.
  """
  _canonicalize_parameters(config, Task.ExportDestination.GCS)

  # We have to protect the "scale" parameter as prepare_for_export will try
  # to interpret it inappropriately.
  scale = config.pop('scale', None)
  image, config = image.prepare_for_export(config)
  if scale is not None:
    config['scale'] = scale

  if 'fileFormat' not in config:
    config['fileFormat'] = 'auto'
  if 'writePublicTiles' not in config:
    config['writePublicTiles'] = True

  config.update(_ConvertConfigParams(config))
  config['json'] = image.serialize()

  return config


def _prepare_table_export_config(collection, config, export_destination):
  """Performs all preparation steps for a table export.

  Args:
    collection: The FeatureCollection to be exported.
    config: All the user-specified export parameters. May be modified.
    export_destination: One of the Task.ExportDestination values.

  Returns:
    A config dict containing all information required for the export.
  """
  if export_destination != Task.ExportDestination.ASSET:
    if 'fileFormat' not in config:
      config['fileFormat'] = 'CSV'

  _canonicalize_parameters(config, export_destination)

  config.update(_ConvertConfigParams(config))
  config['json'] = collection.serialize()

  return config


def _prepare_video_export_config(collection, config, export_destination):
  """Performs all preparation steps for a video export.

  Args:
    collection: The ImageCollection to be exported as a video.
    config: All the user-specified export parameters. May be modified.
    export_destination: One of the Task.ExportDestination values.

  Returns:
    A config dict containing all information required for the export.
  """
  _canonicalize_parameters(config, export_destination)
  if 'crs' not in config:
    config['crs'] = 'SR-ORG:6627'
  collection, config = collection.prepare_for_export(config)
  config['json'] = collection.serialize()
  return config






def _create_export_task(config, task_type):
  """Creates an export task.

  Args:
    config: Custom config fields for the task.
    task_type: The type of the task to create. One of Task.Type.

  Returns:
    An unstarted export Task.
  """
  return Task(data.newTaskId()[0], task_type, Task.State.UNSUBMITTED, config)


def _create_task(task_type, ee_object, description, config):
  """Creates an export task.

  Args:
    task_type: The type of the task to create. One of Task.Type.
    ee_object: The object to export.
    description: Human-readable name of the task.
    config: Custom config fields for the task.

  Returns:
    An unstarted export Task.
  """
  config.update(_ConvertConfigParams(config))
  full_config = {
      'json': ee_object.serialize(),
      'description': description,
  }
  if config: full_config.update(config)
  return Task(data.newTaskId()[0], task_type, Task.State.UNSUBMITTED,
              full_config)


def _capture_parameters(all_locals, parameters_to_exclude):
  """Creates a parameter dict by copying all non-None locals.

  This is generally invoked as the first part of call processing, via
  something like
    _capture_parameters(locals(), ['image'])
  so that all call parameters can be pulled into a single dict.

  Args:
    all_locals: The dict of local variables.
    parameters_to_exclude: An iterable giving names of parameters that should
      be excluded from the result.

  Returns:
    A dict containing all the non-None values in all_locals, except for
    those listed in parameters_to_exclude.
  """
  result = {k: v for k, v in six.iteritems(all_locals) if v is not None}
  for parameter_to_exclude in parameters_to_exclude:
    if parameter_to_exclude in result:
      del result[parameter_to_exclude]
  return result


def _canonicalize_parameters(config, destination):
  """Canonicalizes a set of parameter names.

  For legacy and other reasons, there are multiple ways to specify some export
  parameters. This function applies canonicalization rules to simplify further
  processing. It validates that the canonicalization introduces no collisions.

  Note that config is changed in place and not returned.

  The parameter name mappings performed here are:
    crsTransform -> crs_transform
    bucket -> outputBucket
    fileNamePrefix, path -> outputPrefix or driveFileNamePrefix depending
      on whether the destination is GCS or Drive. "description" is used as
      the default value of outputPrefix or driveFileNamePrefix if nothing else
      provided a value.
    folder -> driveFolder
    If "fileFormat" is "GeoTIFF": tiffX -> formatOptions { x }
    If "fileFormat" is "TfRecord": tfrecordX -> formatOptions { x }

  The "region" parameter's value, if present, is processed with
  _canonicalize_region.

  The "selectors" parameter's value, if present and a string, is converted
  to a list by splitting at commas.

  Args:
    config: The configuration dictionary to be converted.
    destination: The type of destination targeted by the export.
  """
  if 'kwargs' in config:
    config.update(config['kwargs'])
    del config['kwargs']

  collision_error = 'Both {} and {} are specified.'
  def canonicalize_name(a, b):
    """Renames config[a] to config[b]."""
    if a in config:
      if b in config:
        raise ee_exception.EEException(collision_error.format(a, b))
      config[b] = config.pop(a)

  canonicalize_name('crsTransform', 'crs_transform')

  if 'region' in config:
    config['region'] = _canonicalize_region(config['region'])

  if 'selectors' in config and isinstance(config['selectors'],
                                          six.string_types):
    config['selectors'] = config['selectors'].split(',')

  if destination == Task.ExportDestination.GCS:
    canonicalize_name('bucket', 'outputBucket')
    canonicalize_name('fileNamePrefix', 'outputPrefix')

    # Only used with Export.map
    canonicalize_name('path', 'outputPrefix')

    if 'outputPrefix' not in config and 'description' in config:
      config['outputPrefix'] = config['description']
  elif destination == Task.ExportDestination.DRIVE:
    canonicalize_name('folder', 'driveFolder')
    canonicalize_name('fileNamePrefix', 'driveFileNamePrefix')

    if 'driveFileNamePrefix' not in config and 'description' in config:
      config['driveFileNamePrefix'] = config['description']
  elif destination != Task.ExportDestination.ASSET:
    raise ee_exception.EEException('Unknown export destination.')

  if (IMAGE_FORMAT_FIELD in config and
      config[IMAGE_FORMAT_FIELD].upper() in FORMAT_PREFIX_MAP):
    prefix = FORMAT_PREFIX_MAP[config[IMAGE_FORMAT_FIELD].upper()]
    format_options = config.get(IMAGE_FORMAT_OPTIONS_FIELD, {})
    keys_to_delete = []
    for key, value in six.iteritems(config):
      if key.startswith(prefix):
        # Transform like "tiffSomeKey" -> "someKey"
        remapped_key = key[len(prefix):]
        remapped_key = remapped_key[:1].lower() + remapped_key[1:]
        if remapped_key in format_options:
          raise ee_exception.EEException(
              collision_error.format(key, remapped_key))
        format_options[remapped_key] = value
        keys_to_delete.append(key)
    config[IMAGE_FORMAT_OPTIONS_FIELD] = format_options
    for key in keys_to_delete:
      del config[key]


def _canonicalize_region(region):
  """Converts a region parameter to a form appropriate for export."""
  region_error = ee_exception.EEException(
      'Invalid format for "region" property. '
      'See Export.image() documentation for more details.')
  # pylint: disable=bare-except
  # If the GeoJSON blob we have parses as a LineString or Polygon, accept it,
  # and turn it into a string. Which it might have started out as.
  if isinstance(region, six.string_types):
    try:
      region = json.loads(region)
    except:
      raise region_error
  try:
    geometry.Geometry.LineString(region)
  except:
    try:
      geometry.Geometry.Polygon(region)
    except:
      raise region_error
  return json.dumps(region)
  # pylint: enable=bare-except
