#!/usr/bin/env python
"""An interface to the Earth Engine batch processing system.

Use the static methods on the Export class to create export tasks, call start()
on them to launch them, then poll status() to find out when they are finished.
"""



# Using camelCase public function naming to match the rest of the library.
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
  """A static class with methods to start export tasks."""

  def __init__(self):
    """Forbids class instantiation."""
    raise AssertionError('This class cannot be instantiated.')

  @staticmethod
  def image(image, description='myExportImageTask', config=None):
    """Creates a task to export an EE Image.

    Args:
      image: The image to be exported.
      description: Human-readable name of the task.
      config: A dictionary of configuration parameters for the task:
          - region: The lon,lat coordinates for a LinearRing or Polygon
            specifying the region to export. Can be specified as a nested
            lists of numbers or a serialized string. Defaults to the image's
            region.
          - scale: The resolution in meters per pixel. Defaults to 1000 unless
            a crs_transform is specified.
          - maxPixels: The maximum allowed number of pixels in the exported
            image. The task will fail if the exported region covers more pixels
            in the specified projection. Defaults to 100,000,000.
          - crs: The coordinate reference system of the exported image's
            projection. Defaults to the image's default projection.
          - crs_transform: A comma-separated string of 6 numbers describing
            the affine transform of the coordinate reference system of the
            exported image's projection, in the order: xScale, yShearing,
            xShearing, yScale, xTranslation and yTranslation. Defaults to
            the image's native CRS transform.
          - dimensions: The dimensions of the exported image. Takes either a
            single positive integer as the maximum dimension or "WIDTHxHEIGHT"
            where WIDTH and HEIGHT are each positive integers.
          If exporting to Google Drive (default):
          - driveFolder: The name of a unique folder in your Drive account to
            export into. Defaults to the root of the drive.
          - driveFileNamePrefix: The Google Drive filename for the export.
            Defaults to the name of the task.
          If exporting to Google Maps Engine:
          - gmeProjectId: The name of a GME project for the export.
            If present, attribution and mosaic name must also be given.
          - gmeAttributionName: The Name of an attribution for the export.
          - gmeMosaic: The name of the mosaic to export to.
          - gmeTerrain: A boolean specifying whether the export to GME will
            create an asset of type TERRAIN. The image must contain a
            single band of type 'float'.

    Returns:
      An unstarted Task that exports the image.
    """
    config = (config or {}).copy()
    if 'scale' not in config and 'crs_transform' not in config:
      config['scale'] = 1000
    if 'driveFileNamePrefix' not in config and 'gmeProjectId' not in config:
      config['driveFileNamePrefix'] = description

    if 'region' in config:
      # Convert the region to a serialized form, if necessary.
      config['region'] = Export._GetSerializedRegion(config.get('region'))

    return Export._CreateTask(
        Task.Type.EXPORT_IMAGE, image, description, config)

  @staticmethod
  def video(imageCollection, description='myExportVideoTask', config=None):
    """Creates a task to export an EE ImageCollection as a video.

    Args:
      imageCollection: The image collection to be exported. The collection must
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
          - driveFolder: The name of a unique folder in your Drive account to
            export into. Defaults to the root of the drive.
          - driveFileNamePrefix: The Google Drive filename for the export.
            Defaults to the name of the task.

    Returns:
      An unstarted Task that exports the video.
    """
    config = (config or {}).copy()
    if 'crs' not in config:
      config['crs'] = 'SR-ORG:6627'
    if 'driveFileNamePrefix' not in config:
      config['driveFileNamePrefix'] = description

    if 'region' in config:
      # Convert the region to a serialized form, if necessary.
      config['region'] = Export._GetSerializedRegion(config.get('region'))

    return Export._CreateTask(
        Task.Type.EXPORT_VIDEO, imageCollection, description, config)

  @staticmethod
  def table(collection, description='myExportTableTask', config=None):
    """Creates a task to export an EE FeatureCollection as a table.

    Args:
      collection: The feature collection to be exported.
      description: Human-readable name of the task.
      config: A dictionary of configuration parameters for the task (strings):
          - driveFolder: The name of a unique folder in your Drive account to
            export into. Defaults to the root of the drive.
          - driveFileNamePrefix: The Google Drive filename for the export.
            Defaults to the name of the task.
          - fileFormat: The output format: CSV (default), GeoJSON, KML, or KMZ.

    Returns:
      An unstarted Task that exports the table.
    """
    config = (config or {}).copy()
    if 'driveFileNamePrefix' not in config and 'gmeAssetName' not in config:
      config['driveFileNamePrefix'] = description
    if 'fileFormat' not in config:
      config['fileFormat'] = 'CSV'
    return Export._CreateTask(
        Task.Type.EXPORT_TABLE, collection, description, config)

  @staticmethod
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

  @staticmethod
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
