#!/usr/bin/env python
"""Test for the ee.batch module."""



import unittest

import ee
from ee import apitestcase


TASK_STATUS_1 = {
    'description': 'FirstTestTask',
    'id': 'TEST1',
    'source_url': 'http://example.org/',
    'state': 'RUNNING',
    'task_type': 'EXPORT_IMAGE',
    'creation_timestamp_ms': 7,
    'start_timestamp_ms': 13,
    'update_timestamp_ms': 42,
}
TASK_STATUS_2 = {
    'description': 'SecondTestTask',
    'id': 'TEST2',
    'state': 'FAILED',
    'task_type': 'EXPORT_FEATURES',
    'creation_timestamp_ms': 17,
    'start_timestamp_ms': 113,
    'update_timestamp_ms': 142,
    'error_message': 'Explosions.',
}


class BatchTestCase(apitestcase.ApiTestCase):
  """A test case for batch functionality."""

  def setUp(self):
    super(BatchTestCase, self).setUp()

    self.start_call_params = None
    self.update_call_params = None

    def MockSend(path, params, unused_method=None, unused_raw=None):
      if path == '/newtaskid':
        return ['TESTTASKID']
      elif path == '/tasklist':
        return {'tasks': [TASK_STATUS_1.copy(), TASK_STATUS_2.copy()]}
      elif path == '/taskstatus':
        if params['q'] == TASK_STATUS_1['id']:
          return [TASK_STATUS_1.copy()]
        elif params['q'] == TASK_STATUS_2['id']:
          return [TASK_STATUS_2.copy()]
        else:
          return [{
              'creation_timestamp_ms': 0,
              'id': params['q'],
              'state': 'UNKNOWN'
          }]
      elif path == '/processingrequest':
        self.start_call_params = params
        return {'started': 'OK'}
      elif path == '/updatetask':
        self.update_call_params = params
        return {'updated': 'OK'}
      else:
        raise Exception('Unexpected API call to %s with %s' % (path, params))
    ee.data.send_ = MockSend

  def testTaskList(self):
    """Verifies the return value of Task.list()."""
    tasks = ee.batch.Task.list()
    self.assertEquals(2, len(tasks))
    self.assertEquals(TASK_STATUS_1['id'], tasks[0].id)
    self.assertEquals(TASK_STATUS_1['task_type'], tasks[0].config['type'])
    self.assertEquals(TASK_STATUS_2['id'], tasks[1].id)

  def testTaskStatus(self):
    """Verifies the return value of Task.status()."""
    tasks = ee.batch.Task.list()
    self.assertEquals(
        {
            'state': 'RUNNING',
            'creation_timestamp_ms': 7,
            'update_timestamp_ms': 42,
            'description': 'FirstTestTask',
            'id': 'TEST1',
            'source_url': 'http://example.org/',
            'start_timestamp_ms': 13,
            'task_type': 'EXPORT_IMAGE',
        }, tasks[0].status())
    self.assertTrue(tasks[0].active())
    self.assertEquals(
        {
            'state': 'FAILED',
            'creation_timestamp_ms': 17,
            'update_timestamp_ms': 142,
            'error_message': 'Explosions.',
            'description': 'SecondTestTask',
            'id': 'TEST2',
            'start_timestamp_ms': 113,
            'task_type': 'EXPORT_FEATURES',
        }, tasks[1].status())
    self.assertFalse(tasks[1].active())
    new_task = ee.batch.Export.table(ee.FeatureCollection('foo'))
    self.assertEquals({
        'state': 'UNSUBMITTED',
        'creation_timestamp_ms': 0,
        'id': 'TESTTASKID',
    }, new_task.status())
    self.assertFalse(new_task.active())

  def testTaskStart(self):
    """Verifies that Task.start() calls the server appropriately."""
    task = ee.batch.Export.table(ee.FeatureCollection('foo'), 'bar')
    task.start()
    self.assertEquals('TESTTASKID', self.start_call_params['id'])
    self.assertEquals('bar', self.start_call_params['description'])

  def testTaskCancel(self):
    """Verifies that Task.cancel() calls the server appropriately."""
    task = ee.batch.Task.list()[0]
    task.cancel()
    self.assertEquals('TEST1', self.update_call_params['id'])
    self.assertEquals('CANCEL', self.update_call_params['action'])

  def testStringRepresentation(self):
    """Verifies the string representation of tasks."""
    tasks = ee.batch.Task.list()
    self.assertEquals(
        '<Task EXPORT_IMAGE: FirstTestTask (RUNNING)>', str(tasks[0]))
    self.assertEquals(
        '<Task EXPORT_FEATURES: SecondTestTask (FAILED)>', str(tasks[1]))
    new_task = ee.batch.Export.table(ee.FeatureCollection('foo'), 'bar')
    self.assertEquals(
        '<Task EXPORT_FEATURES: bar (UNSUBMITTED)>', str(new_task))
    self.assertEquals(
        '<Task "foo">', str(ee.batch.Task('foo')))

  def testExportImage(self):
    """Verifies the task created by Export.image()."""
    region = ee.Geometry.Rectangle(1, 2, 3, 4)
    config = dict(region=region['coordinates'], maxPixels=10**10,
                  crs='foo', crs_transform='bar')
    task = ee.batch.Export.image(ee.Image(1), 'TestDescription', config)
    self.assertEquals('TESTTASKID', task.id)
    self.assertEquals(
        {
            'type': 'EXPORT_IMAGE',
            'state': 'UNSUBMITTED',
            'json': ee.Image(1).serialize(),
            'description': 'TestDescription',
            'region': '[[[1, 4], [1, 2], [3, 2], [3, 4]]]',
            'driveFileNamePrefix': 'TestDescription',
            'maxPixels': 10**10,
            'crs': 'foo',
            'crs_transform': 'bar',
        },
        task.config)

  def testExportImageToCloudStorage(self):
    """Verifies the Cloud Storge export task created by Export.image()."""
    region = ee.Geometry.Rectangle(1, 2, 3, 4)
    config = dict(region=region['coordinates'], maxPixels=10**10,
                  outputBucket='test-bucket')
    task = ee.batch.Export.image.toCloudStorage(
        ee.Image(1), 'TestDescription',
        config['outputBucket'], None, None,
        config['region'], None, None, None, config['maxPixels'])
    self.assertEquals('TESTTASKID', task.id)
    self.assertEquals(
        {
            'type': 'EXPORT_IMAGE',
            'state': 'UNSUBMITTED',
            'json': ee.Image(1).serialize(),
            'description': 'TestDescription',
            'region': '[[[1, 4], [1, 2], [3, 2], [3, 4]]]',
            'outputBucket': 'test-bucket',
            'maxPixels': 10**10,
        },
        task.config)

  def testExportImageToGoogleDrive(self):
    """Verifies the Drive destined task created by Export.table.toDrive()."""
    region = ee.Geometry.Rectangle(1, 2, 3, 4)
    drive_task_by_keys = ee.batch.Export.image.toDrive(
        image=ee.Image(1), region=region['coordinates'], folder='foo',
        maxPixels=10**10, crsTransform='bar')
    self.assertEquals('TESTTASKID', drive_task_by_keys.id)
    self.assertEquals(
        {
            'type': 'EXPORT_IMAGE',
            'state': 'UNSUBMITTED',
            'json': ee.Image(1).serialize(),
            'description': 'myExportImageTask',
            'region': '[[[1, 4], [1, 2], [3, 2], [3, 4]]]',
            'driveFileNamePrefix': 'myExportImageTask',
            'driveFolder': 'foo',
            'maxPixels': 10**10,
            'crs_transform': 'bar',  # Transformed by _ConvertToServerParams.
        },
        drive_task_by_keys.config)

    drive_task_with_old_keys = ee.batch.Export.image.toDrive(
        image=ee.Image(1), region=region['coordinates'], driveFolder='foo',
        driveFileNamePrefix='fooExport', maxPixels=10**10, crs_transform='bar')
    self.assertEquals(
        {
            'type': 'EXPORT_IMAGE',
            'state': 'UNSUBMITTED',
            'json': ee.Image(1).serialize(),
            'description': 'myExportImageTask',
            'region': '[[[1, 4], [1, 2], [3, 2], [3, 4]]]',
            'driveFileNamePrefix': 'fooExport',
            'driveFolder': 'foo',
            'maxPixels': 10**10,
            'crs_transform': 'bar',  # Transformed by _ConvertToServerParams.
        },
        drive_task_with_old_keys.config)

  def testExportMapToCloudStorage(self):
    """Verifies the task created by Export.map.toCloudStorage()."""
    config = dict(
        image=ee.Image(1), bucket='test-bucket', maxZoom=7, path='foo/gcs/path')

    # Test keyed parameters.
    task_keyed = ee.batch.Export.map.toCloudStorage(
        image=config['image'], bucket=config['bucket'],
        maxZoom=config['maxZoom'], path=config['path'])
    self.assertEquals('TESTTASKID', task_keyed.id)
    self.assertEquals(
        {
            'type': 'EXPORT_TILES',
            'state': 'UNSUBMITTED',
            'json': config['image'].serialize(),
            'description': 'myExportMapTask',
            'outputBucket': config['bucket'],
            'maxZoom': config['maxZoom'],
            'outputPrefix': config['path'],
            'writePublicTiles': True,
            'fileFormat': 'auto'
        }, task_keyed.config)

    # Test ordered parameters.
    task_ordered = ee.batch.Export.map.toCloudStorage(
        config['image'], 'TestDescription', config['bucket'], 'jpeg', None,
        False, None, 30)
    self.assertEquals(
        {
            'type': 'EXPORT_TILES',
            'state': 'UNSUBMITTED',
            'json': config['image'].serialize(),
            'description': 'TestDescription',
            'outputBucket': config['bucket'],
            'scale': 30,
            'writePublicTiles': False,
            'fileFormat': 'jpeg'
        }, task_ordered.config)

  def testExportTable(self):
    """Verifies the task created by Export.table()."""
    task = ee.batch.Export.table(ee.FeatureCollection('drive test FC'))
    self.assertEquals('TESTTASKID', task.id)
    self.assertEquals(
        {
            'type': 'EXPORT_FEATURES',
            'state': 'UNSUBMITTED',
            'json': ee.FeatureCollection('drive test FC').serialize(),
            'description': 'myExportTableTask',
            'driveFileNamePrefix': 'myExportTableTask',
            'fileFormat': 'CSV',
        },
        task.config)

  def testExportTableToCloudStorage(self):
    """Verifies the Cloud Storage task created by Export.table()."""
    task = ee.batch.Export.table.toCloudStorage(
        collection=ee.FeatureCollection('foo'), outputBucket='test-bucket')
    self.assertEquals('TESTTASKID', task.id)
    self.assertEquals(
        {
            'type': 'EXPORT_FEATURES',
            'state': 'UNSUBMITTED',
            'json': ee.FeatureCollection('foo').serialize(),
            'description': 'myExportTableTask',
            'outputBucket': 'test-bucket',
            'fileFormat': 'CSV',
        },
        task.config)

  def testExportTableToGoogleDrive(self):
    """Verifies the Drive destined task created by Export.table.toDrive()."""
    test_collection = ee.FeatureCollection('foo')
    test_description = 'TestDescription'
    test_file_name_prefix = 'fooDriveFileNamePrefix'
    test_format = 'KML'
    expected_config = {
        'type': 'EXPORT_FEATURES',
        'state': 'UNSUBMITTED',
        'json': test_collection.serialize(),
        'description': test_description,
        'driveFileNamePrefix': test_file_name_prefix,
        'fileFormat': test_format,
    }

    # Ordered parameters
    task_ordered = ee.batch.Export.table.toDrive(
        test_collection, test_description,
        None, test_file_name_prefix, test_format)
    self.assertEquals('TESTTASKID', task_ordered.id)
    self.assertEquals(expected_config, task_ordered.config)

    # Updating expectations to test keyed parameters
    expected_config.update({
        'fileFormat': 'CSV',
        'description': 'myExportTableTask',
        'driveFolder': 'fooFolder'
    })

    # Test that deprecated parameters (driveFolder and driveFileNamePrefix)
    # still work.
    task_old_keys = ee.batch.Export.table.toDrive(
        collection=test_collection, driveFolder='fooFolder',
        driveFileNamePrefix='fooDriveFileNamePrefix')
    self.assertEquals(expected_config, task_old_keys.config)

    # Test that new parameters work
    task_new_keys = ee.batch.Export.table.toDrive(
        collection=test_collection, folder='fooFolder',
        fileNamePrefix='fooDriveFileNamePrefix')
    self.assertEquals(expected_config, task_new_keys.config)

  def testExportVideo(self):
    """Verifies the task created by Export.video()."""
    region = ee.Geometry.Rectangle(1, 2, 3, 4)
    config = dict(region=region['coordinates'], dimensions=16)
    collection = ee.ImageCollection([ee.Image(1), ee.Image(2)])
    task = ee.batch.Export.video(collection, 'TestVideoName', config)
    self.assertEquals('TESTTASKID', task.id)
    # Defaults the destination to Drive.
    self.assertEquals(
        {
            'type': 'EXPORT_VIDEO',
            'state': 'UNSUBMITTED',
            'json': collection.serialize(),
            'description': 'TestVideoName',
            'crs': 'SR-ORG:6627',
            'driveFileNamePrefix': 'TestVideoName',
            'region': '[[[1, 4], [1, 2], [3, 2], [3, 4]]]',
            'dimensions': 16
        },
        task.config)

    config['outputBucket'] = 'test-bucket'
    gcs_task = ee.batch.Export.video(collection, 'TestVideoName', config)
    self.assertEquals(
        {
            'type': 'EXPORT_VIDEO',
            'state': 'UNSUBMITTED',
            'json': collection.serialize(),
            'description': 'TestVideoName',
            'crs': 'SR-ORG:6627',
            'outputBucket': 'test-bucket',
            'region': '[[[1, 4], [1, 2], [3, 2], [3, 4]]]',
            'dimensions': 16
        },
        gcs_task.config)

  def testExportVideoToCloudStorage(self):
    """Verifies the task created by Export.video.toCloudStorage()."""
    region = ee.Geometry.Rectangle(1, 2, 3, 4)
    collection = ee.ImageCollection([ee.Image(1), ee.Image(2)])
    expected_config = {
        'type': 'EXPORT_VIDEO',
        'state': 'UNSUBMITTED',
        'json': collection.serialize(),
        'description': 'TestVideoName',
        'outputBucket': 'test-bucket',
        'outputPrefix': 'TestVideoName',
        'region': '[[[1, 4], [1, 2], [3, 2], [3, 4]]]',
        'dimensions': 16,
        'crs_transform': 'bar',  # Transformed by _ConvertToServerParams.
        'crs': 'foo'
    }

    # Test keyed parameters.
    task_keyed = ee.batch.Export.video.toCloudStorage(
        collection=collection,
        description='TestVideoName',
        bucket='test-bucket',
        dimensions=16,
        region=region['coordinates'],
        crsTransform='bar',
        crs='foo')
    self.assertEquals('TESTTASKID', task_keyed.id)
    self.assertEquals(expected_config, task_keyed.config)

    # Test orderd parameters.
    task_ordered = ee.batch.Export.video.toCloudStorage(
        collection, 'TestVideoName', 'test-bucket', None, None, 16,
        region['coordinates'], None, 'foo', 'bar')
    self.assertEquals(expected_config, task_ordered.config)

  def testExportVideoToDrive(self):
    """Verifies the task created by Export.video.toDrive()."""
    region = ee.Geometry.Rectangle(1, 2, 3, 4)
    collection = ee.ImageCollection([ee.Image(1), ee.Image(2)])
    expected_config = {
        'type': 'EXPORT_VIDEO',
        'state': 'UNSUBMITTED',
        'json': collection.serialize(),
        'description': 'TestVideoName',
        'crs': 'SR-ORG:6627',
        'driveFolder': 'test-folder',
        'driveFileNamePrefix': 'TestVideoName',
        'region': '[[[1, 4], [1, 2], [3, 2], [3, 4]]]',
        'dimensions': 16,
        'crs_transform': 'bar'
    }

    # Test keyed parameters.
    task_keyed = ee.batch.Export.video.toDrive(
        collection=collection,
        description='TestVideoName',
        folder='test-folder',
        dimensions=16,
        crsTransform='bar',
        region=region['coordinates'])
    self.assertEquals('TESTTASKID', task_keyed.id)
    self.assertEquals(expected_config, task_keyed.config)

    # Test orderd parameters.
    task_ordered = ee.batch.Export.video.toDrive(
        collection, 'TestVideoName', 'test-folder', None, None, 16,
        region['coordinates'], None, 'SR-ORG:6627', 'bar')
    self.assertEquals(expected_config, task_ordered.config)

if __name__ == '__main__':
  unittest.main()
