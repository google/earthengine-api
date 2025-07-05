#!/usr/bin/env python3
"""Test for the ee.batch module."""

import json
from typing import Any, Optional
import unittest
from unittest import mock

import unittest
import ee
from ee import apitestcase
from ee import batch
from ee import data

RUNNING_OPERATION = {
    'metadata': {
        'createTime': '1970-01-01T00:00:00.00Z',
        'startTime': '1970-01-01T00:00:01.00Z',
        'updateTime': '1970-01-01T00:01:00.00Z',
        'description': 'FirstTestTask',
        'state': 'RUNNING',
        'type': 'EXPORT_IMAGE',
        'destinationUris': ['https://test.com'],
        'attempt': 42,
        'priority': 100,
    },
    'done': False,
    'name': 'projects/test-project/operations/TEST1',
}
SUCCEEDED_OPERATION = {
    'metadata': {
        'createTime': '1970-01-01T00:00:00.00Z',
        'startTime': '1970-01-01T00:00:01.00Z',
        'updateTime': '1970-01-01T00:01:00.00Z',
        'description': 'Ingest image: "an/image"',
        'state': 'SUCCEEDED',
        'type': 'EXPORT_IMAGE',
        'destinationUris': ['https://test.com'],
        'attempt': 42,
        'priority': 100,
    },
    'done': False,
    'name': 'projects/test-project/operations/TEST2',
}
UNKNOWN_OPERATION = {
    'metadata': {
        'state': 'UNKNOWN',
    },
    'done': True,
    'name': 'projects/test-project/operations/TEST2',
}


class TaskTest(unittest.TestCase):

  def setUp(self):
    super().setUp()
    data.setCloudApiUserProject('test-project')

  def testStartWithoutConfig(self):
    task = batch.Task('an id', 'a task type', 'a state')
    self.assertIsNone(task.config)
    with self.assertRaisesRegex(ee.EEException, 'Task config'):
      task.start()

  def testStartUnknownTaskType(self):
    task_type = 'bad task type'
    task = batch.Task('an id', task_type, 'a state', {'some': 'value'})
    with self.assertRaisesRegex(
        ee.EEException, f'Unknown Task type "{task_type}"'
    ):
      task.start()

  def testStatusWithId(self):
    task = batch.Task('test_1', 'a task type', 'a state')
    with mock.patch.object(
        data, 'getOperation', return_value=RUNNING_OPERATION
    ) as m:
      self.assertEqual('RUNNING', task.status()['state'])
      self.assertEqual(
          m.call_args.args[0], 'projects/test-project/operations/test_1'
      )

  def testStatusWithName(self):
    task = batch.Task(
        None,
        'a task type',
        'a state',
        name='projects/test-project/operations/test_1',
    )
    with mock.patch.object(
        data, 'getOperation', return_value=RUNNING_OPERATION
    ) as m:
      self.assertEqual('RUNNING', task.status()['state'])
      self.assertEqual(
          m.call_args.args[0], 'projects/test-project/operations/test_1'
      )

  def testStatusWithIdStateUnknown(self):
    task = batch.Task('an id', 'a task type', 'a state')
    with mock.patch.object(
        data, 'getOperation', return_value=UNKNOWN_OPERATION
    ) as m:
      self.assertEqual('UNSUBMITTED', task.status()['state'])
      self.assertEqual(
          m.call_args.args[0], 'projects/test-project/operations/an id'
      )

  def testStatusWithoutIdOrName(self):
    task = batch.Task(None, 'a task type', 'a state')
    self.assertEqual('UNSUBMITTED', task.status()['state'])

  def testActive(self):
    task = batch.Task('an id', 'a task type', 'a state')
    with mock.patch.object(
        data, 'getOperation', return_value=RUNNING_OPERATION
    ):
      self.assertTrue(task.active())

  def testNotActive(self):
    task = batch.Task('an id', 'a task type', 'a state')
    with mock.patch.object(
        data, 'getOperation', return_value=SUCCEEDED_OPERATION
    ):
      self.assertFalse(task.active())

  def testReprWithoutConfig(self):
    task = batch.Task('an id', 'a task type', 'a state')
    self.assertEqual('<Task "an id">', task.__repr__())

  def testReprWithConfig(self):
    an_id = None
    task_type = 'a task type'
    state = 'a state'
    description = 'a description'
    task = batch.Task(
        an_id, task_type, state, config={'description': description}
    )
    self.assertEqual(
        f'<Task {task_type}: {description} ({state})>', task.__repr__()
    )

  def testReprWithIdAndConfig(self):
    an_id = 'an id'
    task_type = 'a task type'
    state = 'a state'
    description = 'a description'
    task = batch.Task(
        an_id, task_type, state, config={'description': description}
    )
    self.assertEqual(
        f'<Task {an_id} {task_type}: {description} ({state})>', task.__repr__()
    )


class ExportTest(unittest.TestCase):

  def testExportCannotInit(self):
    with self.assertRaises(AssertionError):
      batch.Export()

  def testExportImageCannotInit(self):
    with self.assertRaises(AssertionError):
      batch.Export.image.__init__('something')

  def testExportMapCannotInit(self):
    with self.assertRaises(AssertionError):
      batch.Export.map.__init__('something')

  def testExportTableCannotInit(self):
    with self.assertRaises(AssertionError):
      batch.Export.table.__init__('something')

  def testExportVideoCannotInit(self):
    with self.assertRaises(AssertionError):
      batch.Export.video.__init__('something')


class BatchTestCase(apitestcase.ApiTestCase):
  """A test case for batch functionality."""

  start_call_params: Optional[Any]
  update_call_params: Optional[Any]

  def setUp(self):
    super().setUp()

    self.start_call_params = None
    self.update_call_params = None

  def testTaskStartCloudApi(self):
    """Verifies that Task.start() calls the server appropriately."""
    mock_cloud_api_resource = mock.MagicMock()
    mock_cloud_api_resource.projects().table().export().execute.return_value = {
        'name': 'projects/earthengine-legacy/operations/foo',
        'metadata': {},
    }
    with apitestcase.UsingCloudApi(cloud_api_resource=mock_cloud_api_resource):
      task = ee.batch.Export.table(ee.FeatureCollection('foo'), 'bar')
      task.start()
      export_args = mock_cloud_api_resource.projects().table().export.call_args
      self.assertEqual(task.id, 'foo')
      self.assertTrue(export_args[1]['body']['requestId'])
      self.assertEqual(export_args[1]['body']['description'], 'bar')

  def testTaskCancelCloudApi(self):
    mock_cloud_api_resource = mock.MagicMock()
    mock_cloud_api_resource.projects().operations().list().execute.return_value = {
        'operations': [{
            'name': 'projects/earthengine-legacy/operations/TEST1',
            'metadata': {},
        }]
    }
    mock_cloud_api_resource.projects().operations().list_next.return_value = (
        None
    )
    with apitestcase.UsingCloudApi(cloud_api_resource=mock_cloud_api_resource):
      task = ee.batch.Task.list()[0]
      task.cancel()
      cancel_args = (
          mock_cloud_api_resource.projects().operations().cancel.call_args
      )
      self.assertEqual(
          cancel_args[1]['name'], 'projects/earthengine-legacy/operations/TEST1'
      )

  def testExportImageTrivialRegionCloudApi(self):
    """Verifies the task created by Export.image() with a trivial region."""
    with apitestcase.UsingCloudApi():
      region = [0, 0, 1, 0, 1, 1]
      task = ee.batch.Export.image.toAsset(
          ee.Image(42), assetId='users/foo/bar', region=region, scale=1000
      )
      expected_expression = ee.Image(42).clipToBoundsAndScale(
          geometry=ee.Geometry.LineString(region), scale=1000
      )
      self.assertIsNone(task.id)
      self.assertIsNone(task.name)
      self.assertEqual('EXPORT_IMAGE', task.task_type)
      self.assertEqual('UNSUBMITTED', task.state)

      self.assertEqual(
          json.loads(task.config['expression'].serialize()),
          json.loads(expected_expression.serialize()),
      )

      task.config.pop('expression')
      self.assertEqual(
          {
              'assetExportOptions': {
                  'earthEngineDestination': {
                      'name': (
                          'projects/earthengine-legacy/assets/users/foo/bar'
                      ),
                  }
              },
              'description': 'myExportImageTask',
          },
          task.config,
      )

  def testExportImageCloudApi(self):
    """Verifies the task created by Export.image()."""
    with apitestcase.UsingCloudApi():
      region = ee.Geometry.Rectangle(1, 2, 3, 4)
      config = dict(
          region=region['coordinates'],
          maxPixels=10**10,
          crs='foo',
          crs_transform='[9,8,7,6,5,4]',
          tiffCloudOptimized=True,
          shardSize=512,
          fileDimensions=1024,
          formatOptions={'noData': 1},
      )
      task = ee.batch.Export.image(ee.Image(1), 'TestDescription', config)
      expected_expression = (
          ee.Image(1)
          .reproject('foo', crsTransform=[9.0, 8.0, 7.0, 6.0, 5.0, 4.0])
          .clip(region)
      )
      self.assertIsNone(task.id)
      self.assertIsNone(task.name)
      self.assertEqual('EXPORT_IMAGE', task.task_type)
      self.assertEqual('UNSUBMITTED', task.state)
      self.assertEqual(
          {
              'expression': expected_expression,
              'description': 'TestDescription',
              'fileExportOptions': {
                  'fileFormat': 'GEO_TIFF',
                  'driveDestination': {'filenamePrefix': 'TestDescription'},
                  'geoTiffOptions': {
                      'cloudOptimized': True,
                      'tileDimensions': {'width': 1024, 'height': 1024},
                      'tileSize': {'value': 512},
                      'noData': {'floatValue': 1},
                  },
              },
              'maxPixels': {'value': '10000000000'},
          },
          task.config,
      )

  def testExportImageCloudApiInvalidSkipEmptyTiles(self):
    """Verifies errors are thrown when incorrectly specifying skipEmptyTiles."""
    with apitestcase.UsingCloudApi():
      with self.assertRaisesRegex(
          ValueError, 'skipEmptyTiles is only supported for GeoTIFF'
      ):
        ee.batch.Export.image.toDrive(
            ee.Image(1),
            'TestDescription',
            fileFormat='TFRecord',
            skipEmptyTiles=True,
        )

  def testExportImageWithTfRecordCloudApi(self):
    """Verifies the task created by Export.image()."""
    with apitestcase.UsingCloudApi():
      region = ee.Geometry.Rectangle(1, 2, 3, 4)
      config = dict(
          region=region['coordinates'],
          maxPixels=10**10,
          crs='foo',
          crs_transform='[9,8,7,6,5,4]',
          fileFormat='TFRecord',
          formatOptions={
              'patchDimensions': [256, 256],
              'kernelSize': [32, 32],
              'compressed': True,
              'maxFileSize': 1e9,
              'defaultValue': -999,
              'tensorDepths': {'b1': 1, 'b2': 2},
              'sequenceData': True,
              'collapseBands': True,
              'maskedThreshold': 0.5,
          },
      )
      task = ee.batch.Export.image(ee.Image(1), 'TestDescription', config)
      expected_expression = (
          ee.Image(1)
          .reproject('foo', crsTransform=[9.0, 8.0, 7.0, 6.0, 5.0, 4.0])
          .clip(region)
      )
      self.assertIsNone(task.id)
      self.assertIsNone(task.name)
      self.assertEqual('EXPORT_IMAGE', task.task_type)
      self.assertEqual('UNSUBMITTED', task.state)
      self.assertEqual(
          {
              'expression': expected_expression,
              'description': 'TestDescription',
              'fileExportOptions': {
                  'fileFormat': 'TF_RECORD_IMAGE',
                  'driveDestination': {'filenamePrefix': 'TestDescription'},
                  'tfRecordOptions': {
                      'tileDimensions': {'width': 256, 'height': 256},
                      'marginDimensions': {
                          'width': 32,
                          'height': 32,
                      },
                      'compress': True,
                      'maxSizeBytes': {'value': '1000000000'},
                      'defaultValue': -999,
                      'tensorDepths': {'b1': 1, 'b2': 2},
                      'sequenceData': True,
                      'collapseBands': True,
                      'maxMaskedRatio': {'value': 0.5},
                  },
              },
              'maxPixels': {'value': '10000000000'},
          },
          task.config,
      )

  def testExportImageToAssetCloudApi(self):
    """Verifies the Asset export task created by Export.image.toAsset()."""
    with apitestcase.UsingCloudApi():
      config = dict(
          image=ee.Image(1),
          assetId='users/foo/bar',
          pyramidingPolicy={'B1': 'min'},
      )
      expected_expression = ee.Image(1)

      # Test keyed parameters.
      task_keyed = ee.batch.Export.image.toAsset(
          image=config['image'],
          assetId=config['assetId'],
          pyramidingPolicy=config['pyramidingPolicy'],
      )
      self.assertIsNone(task_keyed.id)
      self.assertIsNone(task_keyed.name)
      self.assertEqual('EXPORT_IMAGE', task_keyed.task_type)
      self.assertEqual('UNSUBMITTED', task_keyed.state)
      self.assertEqual(
          {
              'expression': expected_expression,
              'description': 'myExportImageTask',
              'assetExportOptions': {
                  'earthEngineDestination': {
                      'name': (
                          'projects/earthengine-legacy/assets/users/foo/bar'
                      ),
                  },
                  'pyramidingPolicyOverrides': {'B1': 'MIN'},
              },
          },
          task_keyed.config,
      )

      task_ordered = ee.batch.Export.image.toAsset(
          config['image'],
          'TestDescription',
          config['assetId'],
          maxPixels=1000,
          maxWorkers=100,
          shardSize=4,
      )
      self.assertEqual('EXPORT_IMAGE', task_ordered.task_type)
      self.assertEqual('UNSUBMITTED', task_ordered.state)
      self.assertEqual(
          {
              'expression': expected_expression,
              'description': 'TestDescription',
              'assetExportOptions': {
                  'earthEngineDestination': {
                      'name': (
                          'projects/earthengine-legacy/assets/users/foo/bar'
                      ),
                  },
                  'tileSize': {'value': 4},
              },
              'maxPixels': {'value': '1000'},
              'maxWorkers': {'value': 100},
          },
          task_ordered.config,
      )

  def testExportImageToAssetCloudApi_withTileSize(self):
    """Verifies the Asset export task created by Export.image.toAsset()."""
    with apitestcase.UsingCloudApi():
      config = dict(
          image=ee.Image(1),
          assetId='users/foo/bar',
          pyramidingPolicy={'B1': 'min'},
      )
      expected_expression = ee.Image(1)

      task_ordered = ee.batch.Export.image.toAsset(
          config['image'],
          'TestDescription',
          config['assetId'],
          maxPixels=1000,
          maxWorkers=100,
          tileSize=4,
      )
      self.assertEqual('EXPORT_IMAGE', task_ordered.task_type)
      self.assertEqual('UNSUBMITTED', task_ordered.state)
      self.assertEqual(
          {
              'expression': expected_expression,
              'description': 'TestDescription',
              'assetExportOptions': {
                  'earthEngineDestination': {
                      'name': (
                          'projects/earthengine-legacy/assets/users/foo/bar'
                      ),
                  },
                  'tileSize': {'value': 4},
              },
              'maxPixels': {'value': '1000'},
              'maxWorkers': {'value': 100},
          },
          task_ordered.config,
      )

  def testExportImageToCloudStorageCloudApi(self):
    """Verifies the Cloud Storage export task created by Export.image()."""
    with apitestcase.UsingCloudApi():
      region = ee.Geometry.Rectangle(1, 2, 3, 4)
      config = dict(
          region=region['coordinates'],
          maxPixels=10**10,
          outputBucket='test-bucket',
      )
      task = ee.batch.Export.image.toCloudStorage(
          ee.Image(1),
          'TestDescription',
          config['outputBucket'],
          None,
          None,
          config['region'],
          None,
          None,
          None,
          config['maxPixels'],
          None,
          [512, 2048],
          True,
      )
      expected_expression = ee.Image(1).clip(region)
      self.assertIsNone(task.id)
      self.assertIsNone(task.name)
      self.assertEqual('EXPORT_IMAGE', task.task_type)
      self.assertEqual('UNSUBMITTED', task.state)
      self.assertEqual(
          {
              'expression': expected_expression,
              'description': 'TestDescription',
              'fileExportOptions': {
                  'fileFormat': 'GEO_TIFF',
                  'cloudStorageDestination': {
                      'bucket': 'test-bucket',
                      'filenamePrefix': 'TestDescription',
                  },
                  'geoTiffOptions': {
                      'tileDimensions': {'width': 512, 'height': 2048},
                      'skipEmptyFiles': True,
                  },
              },
              'maxPixels': {'value': '10000000000'},
          },
          task.config,
      )

      config = dict(
          region=region['coordinates'],
          maxPixels=10**10,
          outputBucket='test-bucket',
          priority=999,
      )
      task_with_priority = ee.batch.Export.image.toCloudStorage(
          ee.Image(1),
          'TestDescription',
          config['outputBucket'],
          None,
          None,
          config['region'],
          None,
          None,
          None,
          config['maxPixels'],
          None,
          [512, 2048],
          True,
          None,
          None,
          config['priority'],
      )
      self.assertEqual(
          {
              'expression': expected_expression,
              'description': 'TestDescription',
              'fileExportOptions': {
                  'fileFormat': 'GEO_TIFF',
                  'cloudStorageDestination': {
                      'bucket': 'test-bucket',
                      'filenamePrefix': 'TestDescription',
                  },
                  'geoTiffOptions': {
                      'tileDimensions': {'width': 512, 'height': 2048},
                      'skipEmptyFiles': True,
                  },
              },
              'maxPixels': {'value': '10000000000'},
              'priority': {'value': 999},
          },
          task_with_priority.config,
      )

  def testExportImageToGoogleDriveCloudApi(self):
    """Verifies the Drive destined task created by Export.image.toDrive()."""
    with apitestcase.UsingCloudApi():
      region = ee.Geometry.Rectangle(1, 2, 3, 4)
      drive_task_by_keys = ee.batch.Export.image.toDrive(
          image=ee.Image(1),
          region=region['coordinates'],
          folder='foo',
          maxPixels=10**10,
          crs='foo',
          crsTransform='[9,8,7,6,5,4]',
          shardSize=512,
      )
      expected_expression = (
          ee.Image(1)
          .reproject('foo', crsTransform=[9.0, 8.0, 7.0, 6.0, 5.0, 4.0])
          .clip(region)
      )
      self.assertIsNone(drive_task_by_keys.id)
      self.assertIsNone(drive_task_by_keys.name)
      self.assertEqual('EXPORT_IMAGE', drive_task_by_keys.task_type)
      self.assertEqual('UNSUBMITTED', drive_task_by_keys.state)
      self.assertEqual(
          {
              'expression': expected_expression,
              'description': 'myExportImageTask',
              'fileExportOptions': {
                  'fileFormat': 'GEO_TIFF',
                  'driveDestination': {
                      'folder': 'foo',
                      'filenamePrefix': 'myExportImageTask',
                  },
                  'geoTiffOptions': {'tileSize': {'value': 512}},
              },
              'maxPixels': {'value': '10000000000'},
          },
          drive_task_by_keys.config,
      )

      drive_task_with_old_keys = ee.batch.Export.image.toDrive(
          image=ee.Image(1),
          region=region['coordinates'],
          driveFolder='foo',
          driveFileNamePrefix='fooExport',
          maxPixels=10**10,
          crs='foo',
          crs_transform='[9,8,7,6,5,4]',
      )
      self.assertIsNone(drive_task_with_old_keys.id)
      self.assertIsNone(drive_task_by_keys.name)
      self.assertEqual('EXPORT_IMAGE', drive_task_with_old_keys.task_type)
      self.assertEqual('UNSUBMITTED', drive_task_with_old_keys.state)
      self.assertEqual(
          {
              'expression': expected_expression,
              'description': 'myExportImageTask',
              'fileExportOptions': {
                  'fileFormat': 'GEO_TIFF',
                  'driveDestination': {
                      'folder': 'foo',
                      'filenamePrefix': 'fooExport',
                  },
              },
              'maxPixels': {'value': '10000000000'},
          },
          drive_task_with_old_keys.config,
      )

      with self.assertRaisesRegex(
          ee.EEException, 'Unknown configuration options.*'
      ):
        ee.batch.Export.image.toDrive(image=ee.Image(1), framesPerSecond=30)

      drive_task_with_priority = ee.batch.Export.image.toDrive(
          image=ee.Image(1),
          region=region['coordinates'],
          folder='foo',
          maxPixels=10**10,
          crs='foo',
          crsTransform='[9,8,7,6,5,4]',
          shardSize=512,
          priority=999,
      )
      expected_expression = (
          ee.Image(1)
          .reproject('foo', crsTransform=[9.0, 8.0, 7.0, 6.0, 5.0, 4.0])
          .clip(region)
      )
      self.assertEqual(
          {
              'expression': expected_expression,
              'description': 'myExportImageTask',
              'fileExportOptions': {
                  'fileFormat': 'GEO_TIFF',
                  'driveDestination': {
                      'folder': 'foo',
                      'filenamePrefix': 'myExportImageTask',
                  },
                  'geoTiffOptions': {'tileSize': {'value': 512}},
              },
              'maxPixels': {'value': '10000000000'},
              'priority': {'value': 999},
          },
          drive_task_with_priority.config,
      )

  def testExportMapToCloudStorageCloudApi(self):
    """Verifies the task created by Export.map.toCloudStorage()."""
    with apitestcase.UsingCloudApi():
      config = dict(
          image=ee.Image(1),
          bucket='test-bucket',
          maxZoom=7,
          path='foo/gcs/path',
          maxWorkers=100,
      )

      # Test keyed parameters.
      task_keyed = ee.batch.Export.map.toCloudStorage(
          image=config['image'],
          bucket=config['bucket'],
          maxZoom=config['maxZoom'],
          path=config['path'],
          maxWorkers=config['maxWorkers'],
          bucketCorsUris=['*'],
      )
      expected_expression = ee.Image(1)
      self.assertIsNone(task_keyed.id)
      self.assertIsNone(task_keyed.name)
      self.assertEqual('EXPORT_TILES', task_keyed.task_type)
      self.assertEqual('UNSUBMITTED', task_keyed.state)
      self.assertEqual(
          {
              'expression': expected_expression,
              'description': 'myExportMapTask',
              'tileOptions': {
                  'endZoom': config['maxZoom'],
              },
              'tileExportOptions': {
                  'fileFormat': 'AUTO_JPEG_PNG',
                  'cloudStorageDestination': {
                      'bucket': config['bucket'],
                      'filenamePrefix': config['path'],
                      'permissions': 'PUBLIC',
                      'bucketCorsUris': ['*'],
                  },
              },
              'maxWorkers': {'value': 100},
          },
          task_keyed.config,
      )

      with self.assertRaisesRegex(
          ee.EEException, 'Unknown configuration options.*'
      ):
        config_with_bogus_option = config.copy()
        config_with_bogus_option['framesPerSecond'] = 30
        ee.batch.Export.map.toCloudStorage(**config_with_bogus_option)

      # Test ordered parameters.
      task_ordered = ee.batch.Export.map.toCloudStorage(
          config['image'],
          'TestDescription',
          config['bucket'],
          'jpeg',
          None,
          False,
          None,
          30,
          None,
          None,
          None,
          'aFakeKey',
          maxWorkers=100,
      )
      self.assertIsNone(task_ordered.id)
      self.assertIsNone(task_ordered.name)
      self.assertEqual('EXPORT_TILES', task_ordered.task_type)
      self.assertEqual('UNSUBMITTED', task_ordered.state)
      self.assertEqual(
          {
              'expression': expected_expression,
              'description': 'TestDescription',
              'tileOptions': {
                  'scale': 30,
                  'mapsApiKey': 'aFakeKey',
              },
              'tileExportOptions': {
                  'fileFormat': 'JPEG',
                  'cloudStorageDestination': {
                      'bucket': config['bucket'],
                      'filenamePrefix': 'TestDescription',
                  },
              },
              'maxWorkers': {'value': 100},
          },
          task_ordered.config,
      )

      config = dict(
          image=ee.Image(1),
          bucket='test-bucket',
          maxZoom=7,
          path='foo/gcs/path',
          maxWorkers=100,
          priority=999,
      )
      task_with_priority = ee.batch.Export.map.toCloudStorage(
          image=config['image'],
          bucket=config['bucket'],
          maxZoom=config['maxZoom'],
          path=config['path'],
          maxWorkers=config['maxWorkers'],
          bucketCorsUris=['*'],
          priority=config['priority'],
      )
      expected_expression = ee.Image(1)
      self.assertEqual(
          {
              'expression': expected_expression,
              'description': 'myExportMapTask',
              'tileOptions': {
                  'endZoom': config['maxZoom'],
              },
              'tileExportOptions': {
                  'fileFormat': 'AUTO_JPEG_PNG',
                  'cloudStorageDestination': {
                      'bucket': config['bucket'],
                      'filenamePrefix': config['path'],
                      'permissions': 'PUBLIC',
                      'bucketCorsUris': ['*'],
                  },
              },
              'maxWorkers': {'value': 100},
              'priority': {'value': 999},
          },
          task_with_priority.config,
      )

  def testExportMapToCloudStorageCloudApi_WithV1Parameters(self):
    """Verifies Export.map.toCloudStorage() tasks with v1 parameters."""
    with apitestcase.UsingCloudApi():
      config = dict(
          image=ee.Image(1),
          bucket='test-bucket',
          minZoom=1,
          maxZoom=7,
          startZoom=2,  # Takes precedence over minZoom.
          endZoom=8,  # Takes precedence over maxZoom.
          path='foo/gcs/path',
          skipEmptyTiles=True,
          skipEmpty=False,  # Takes precedence over skipEmpty.
          maxWorkers=100,
      )

      # Test keyed parameters.
      task_keyed = ee.batch.Export.map.toCloudStorage(
          image=config['image'],
          bucket=config['bucket'],
          minZoom=config['minZoom'],
          maxZoom=config['maxZoom'],
          startZoom=config['startZoom'],
          endZoom=config['endZoom'],
          path=config['path'],
          maxWorkers=config['maxWorkers'],
          skipEmptyTiles=config['skipEmptyTiles'],
          skipEmpty=config['skipEmpty'],
      )
      expected_expression = ee.Image(1)
      self.assertIsNone(task_keyed.id)
      self.assertIsNone(task_keyed.name)
      self.assertEqual('EXPORT_TILES', task_keyed.task_type)
      self.assertEqual('UNSUBMITTED', task_keyed.state)
      self.assertEqual(
          {
              'expression': expected_expression,
              'description': 'myExportMapTask',
              'tileOptions': {
                  'startZoom': config['startZoom'],
                  'endZoom': config['endZoom'],
                  'skipEmpty': config['skipEmpty'],
              },
              'tileExportOptions': {
                  'fileFormat': 'AUTO_JPEG_PNG',
                  'cloudStorageDestination': {
                      'bucket': config['bucket'],
                      'filenamePrefix': config['path'],
                      'permissions': 'PUBLIC',
                  },
              },
              'maxWorkers': {'value': 100},
          },
          task_keyed.config,
      )

  def testExportMapToCloudStorageCloudApi_WithV1AlphaParameters(self):
    """Verifies Export.map.toCloudStorage() tasks with v1alpha parameters."""
    with apitestcase.UsingCloudApi():
      task_keyed = ee.batch.Export.map.toCloudStorage(
          image=ee.Image(0),
          bucket='test-bucket',
          minZoom=2,
          maxWorkers=1,
          maxZoom=3,
          skipEmptyTiles=True,
      )
      self.assertEqual(
          {
              'expression': ee.Image(0),
              'description': 'myExportMapTask',
              'tileOptions': {'startZoom': 2, 'endZoom': 3, 'skipEmpty': True},
              'tileExportOptions': {
                  'fileFormat': 'AUTO_JPEG_PNG',
                  'cloudStorageDestination': {
                      'bucket': 'test-bucket',
                      'filenamePrefix': 'myExportMapTask',
                      'permissions': 'PUBLIC',
                  },
              },
              'maxWorkers': {'value': 1},
          },
          task_keyed.config,
      )

  def testExportTableCloudApi(self):
    """Verifies the task created by Export.table()."""
    with apitestcase.UsingCloudApi():
      task = ee.batch.Export.table(
          ee.FeatureCollection('drive test FC'), config={'maxWorkers': 100}
      )
      self.assertIsNone(task.id)
      self.assertIsNone(task.name)
      self.assertEqual('EXPORT_FEATURES', task.task_type)
      self.assertEqual('UNSUBMITTED', task.state)
      self.assertEqual(
          {
              'expression': ee.FeatureCollection('drive test FC'),
              'description': 'myExportTableTask',
              'fileExportOptions': {
                  'fileFormat': 'CSV',
                  'driveDestination': {
                      'filenamePrefix': 'myExportTableTask',
                  },
              },
              'maxWorkers': {'value': 100},
          },
          task.config,
      )

  def testExportTableCloudApiBogusParameter(self):
    """Verifies that bogus parameters are rejected."""
    with apitestcase.UsingCloudApi():
      with self.assertRaisesRegex(
          ee.EEException, 'Unknown configuration options.*'
      ):
        ee.batch.Export.table.toDrive(
            ee.FeatureCollection('drive test FC'), framesPerSecond=30
        )

  def testExportTableSelectorsCloudApi(self):
    """Verifies that table export accepts a list or tuple of selectors."""
    with apitestcase.UsingCloudApi():
      task = ee.batch.Export.table.toCloudStorage(
          collection=ee.FeatureCollection('foo'),
          selectors=['ab', 'bb', 'c'],
          outputBucket='foo',
      )
      self.assertEqual(['ab', 'bb', 'c'], task.config['selectors'])
      task = ee.batch.Export.table.toCloudStorage(
          collection=ee.FeatureCollection('foo'),
          selectors=('x', 'y'),
          outputBucket='foo',
      )
      self.assertEqual(['x', 'y'], task.config['selectors'])
      # Single string should work too.
      task = ee.batch.Export.table.toCloudStorage(
          collection=ee.FeatureCollection('foo'),
          selectors='ab,cd,ef',
          outputBucket='foo',
      )
      self.assertEqual(['ab', 'cd', 'ef'], task.config['selectors'])

  def testExportTableToCloudStorageCloudApi(self):
    """Verifies the Cloud Storage task created by Export.table()."""
    with apitestcase.UsingCloudApi():
      task = ee.batch.Export.table.toCloudStorage(
          collection=ee.FeatureCollection('foo'),
          outputBucket='test-bucket',
          maxVertices=1e6,
      )
      self.assertIsNone(task.id)
      self.assertIsNone(task.name)
      self.assertEqual('EXPORT_FEATURES', task.task_type)
      self.assertEqual('UNSUBMITTED', task.state)
      self.assertEqual(
          {
              'expression': ee.FeatureCollection('foo'),
              'description': 'myExportTableTask',
              'fileExportOptions': {
                  'fileFormat': 'CSV',
                  'cloudStorageDestination': {
                      'bucket': 'test-bucket',
                      'filenamePrefix': 'myExportTableTask',
                  },
              },
              'maxVertices': {'value': int(1e6)},
          },
          task.config,
      )

      task_with_priority = ee.batch.Export.table.toCloudStorage(
          collection=ee.FeatureCollection('foo'),
          outputBucket='test-bucket',
          maxVertices=1e6,
          priority=999,
      )
      self.assertEqual(
          {
              'expression': ee.FeatureCollection('foo'),
              'description': 'myExportTableTask',
              'fileExportOptions': {
                  'fileFormat': 'CSV',
                  'cloudStorageDestination': {
                      'bucket': 'test-bucket',
                      'filenamePrefix': 'myExportTableTask',
                  },
              },
              'maxVertices': {'value': int(1e6)},
              'priority': {'value': 999},
          },
          task_with_priority.config,
      )

  def testExportTableToGoogleDriveCloudApi(self):
    """Verifies the Drive destined task created by Export.table.toDrive()."""
    with apitestcase.UsingCloudApi():
      test_collection = ee.FeatureCollection('foo')
      test_description = 'TestDescription'
      test_file_name_prefix = 'fooDriveFileNamePrefix'
      test_format = 'KML'
      expected_config = {
          'expression': test_collection,
          'description': test_description,
          'fileExportOptions': {
              'fileFormat': test_format,
              'driveDestination': {
                  'filenamePrefix': test_file_name_prefix,
              },
          },
          'maxVertices': {'value': 0},
      }

      # Ordered parameters
      task_ordered = ee.batch.Export.table.toDrive(
          test_collection,
          test_description,
          None,
          test_file_name_prefix,
          test_format,
          maxVertices=0,
      )
      self.assertIsNone(task_ordered.id)
      self.assertIsNone(task_ordered.name)
      self.assertEqual('EXPORT_FEATURES', task_ordered.task_type)
      self.assertEqual('UNSUBMITTED', task_ordered.state)
      self.assertEqual(expected_config, task_ordered.config)

      # Updating expectations to test keyed parameters
      expected_config['description'] = 'myExportTableTask'
      expected_config['fileExportOptions']['fileFormat'] = 'CSV'
      expected_config['fileExportOptions']['driveDestination'][
          'folder'
      ] = 'fooFolder'

      # Test that deprecated parameters (driveFolder and driveFileNamePrefix)
      # still work.
      task_old_keys = ee.batch.Export.table.toDrive(
          collection=test_collection,
          driveFolder='fooFolder',
          driveFileNamePrefix='fooDriveFileNamePrefix',
          maxVertices=0,
      )
      self.assertEqual('EXPORT_FEATURES', task_old_keys.task_type)
      self.assertEqual('UNSUBMITTED', task_old_keys.state)
      self.assertEqual(expected_config, task_old_keys.config)

      # Test that new parameters work
      task_new_keys = ee.batch.Export.table.toDrive(
          collection=test_collection,
          folder='fooFolder',
          fileNamePrefix='fooDriveFileNamePrefix',
          maxVertices=0,
      )
      self.assertEqual('EXPORT_FEATURES', task_new_keys.task_type)
      self.assertEqual('UNSUBMITTED', task_new_keys.state)
      self.assertEqual(expected_config, task_new_keys.config)

      expected_config_with_priority = {
          'expression': test_collection,
          'description': test_description,
          'fileExportOptions': {
              'fileFormat': test_format,
              'driveDestination': {
                  'filenamePrefix': test_file_name_prefix,
              },
          },
          'maxVertices': {'value': 0},
          'priority': {'value': 999},
      }
      task_with_priority = ee.batch.Export.table.toDrive(
          test_collection,
          test_description,
          None,
          test_file_name_prefix,
          test_format,
          maxVertices=0,
          priority=999,
      )
      self.assertEqual(expected_config_with_priority, task_with_priority.config)

  def testExportTableToAssetCloudApi(self):
    """Verifies the export task created by Export.table.toAsset()."""
    with apitestcase.UsingCloudApi():
      task = ee.batch.Export.table.toAsset(
          collection=ee.FeatureCollection('foo'),
          description='foo',
          assetId='users/foo/bar',
      )
      self.assertIsNone(task.id)
      self.assertIsNone(task.name)
      self.assertEqual('EXPORT_FEATURES', task.task_type)
      self.assertEqual('UNSUBMITTED', task.state)
      self.assertEqual(
          {
              'expression': ee.FeatureCollection('foo'),
              'description': 'foo',
              'assetExportOptions': {
                  'earthEngineDestination': {
                      'name': (
                          'projects/earthengine-legacy/assets/users/foo/bar'
                      ),
                  }
              },
          },
          task.config,
      )
      task_with_priority = ee.batch.Export.table.toAsset(
          collection=ee.FeatureCollection('foo'),
          description='foo',
          assetId='users/foo/bar',
          priority=999,
      )
      self.assertEqual(
          {
              'expression': ee.FeatureCollection('foo'),
              'description': 'foo',
              'assetExportOptions': {
                  'earthEngineDestination': {
                      'name': (
                          'projects/earthengine-legacy/assets/users/foo/bar'
                      ),
                  }
              },
              'priority': {'value': 999},
          },
          task_with_priority.config,
      )

  def testExportTableWithFileFormatCloudApi(self):
    """Verifies the task created by Export.table() given a file format."""
    with apitestcase.UsingCloudApi():
      task = ee.batch.Export.table.toCloudStorage(
          collection=ee.FeatureCollection('foo'),
          outputBucket='test-bucket',
          fileFormat='tfRecord',
      )
      self.assertIsNone(task.id)
      self.assertIsNone(task.name)
      self.assertEqual('EXPORT_FEATURES', task.task_type)
      self.assertEqual('UNSUBMITTED', task.state)
      self.assertEqual(
          {
              'expression': ee.FeatureCollection('foo'),
              'description': 'myExportTableTask',
              'fileExportOptions': {
                  'fileFormat': 'TF_RECORD_TABLE',
                  'cloudStorageDestination': {
                      'bucket': 'test-bucket',
                      'filenamePrefix': 'myExportTableTask',
                  },
              },
          },
          task.config,
      )

  def testExportTableToFeatureViewCloudApi(self):
    """Verifies the export task created by Export.table.toFeatureView()."""
    with apitestcase.UsingCloudApi():
      task = ee.batch.Export.table.toFeatureView(
          collection=ee.FeatureCollection('foo'),
          description='foo',
          assetId='users/foo/bar',
          ingestionTimeParameters={
              'maxFeaturesPerTile': 10,
              'zOrderRanking': [],
          },
      )
      self.assertIsNone(task.id)
      self.assertIsNone(task.name)
      self.assertEqual('EXPORT_FEATURES', task.task_type)
      self.assertEqual('UNSUBMITTED', task.state)
      self.assertEqual(
          {
              'expression': ee.FeatureCollection('foo'),
              'description': 'foo',
              'featureViewExportOptions': {
                  'featureViewDestination': {
                      'name': (
                          'projects/earthengine-legacy/assets/users/foo/bar'
                      ),
                  },
                  'ingestionTimeParameters': {
                      'thinningOptions': {'maxFeaturesPerTile': 10},
                  },
              },
          },
          task.config,
      )

      task_with_priority = ee.batch.Export.table.toFeatureView(
          collection=ee.FeatureCollection('foo'),
          description='foo',
          assetId='users/foo/bar',
          ingestionTimeParameters={
              'maxFeaturesPerTile': 10,
              'zOrderRanking': [],
          },
          priority=999,
      )
      self.assertEqual(
          {
              'expression': ee.FeatureCollection('foo'),
              'description': 'foo',
              'featureViewExportOptions': {
                  'featureViewDestination': {
                      'name': (
                          'projects/earthengine-legacy/assets/users/foo/bar'
                      ),
                  },
                  'ingestionTimeParameters': {
                      'thinningOptions': {'maxFeaturesPerTile': 10},
                  },
              },
              'priority': {'value': 999},
          },
          task_with_priority.config,
      )

  def testExportTableToFeatureViewEmptyParamsCloudApi(self):
    """Verifies the export task created by Export.table.toFeatureView()."""
    with apitestcase.UsingCloudApi():
      task = ee.batch.Export.table.toFeatureView(
          collection=ee.FeatureCollection('foo'),
          description='foo',
          assetId='users/foo/bar',
      )
      with self.subTest(name='TaskIdAndName'):
        self.assertIsNone(task.id)
        self.assertIsNone(task.name)
      with self.subTest(name='TypeIsExportFeatures'):
        self.assertEqual('EXPORT_FEATURES', task.task_type)
      with self.subTest(name='StateIsUnsubmitted'):
        self.assertEqual('UNSUBMITTED', task.state)
      with self.subTest(name='ConfigContents'):
        self.assertEqual(
            {
                'expression': ee.FeatureCollection('foo'),
                'description': 'foo',
                'featureViewExportOptions': {
                    'featureViewDestination': {
                        'name': (
                            'projects/earthengine-legacy/assets/users/foo/bar'
                        ),
                    },
                    'ingestionTimeParameters': {},
                },
            },
            task.config,
        )

  def testExportTableToFeatureViewAllIngestionParams(self):
    """Verifies the task ingestion params created by toFeatureView()."""
    task = ee.batch.Export.table.toFeatureView(
        collection=ee.FeatureCollection('foo'),
        description='foo',
        assetId='users/foo/bar',
        ingestionTimeParameters={
            'maxFeaturesPerTile': 10,
            'thinningStrategy': 'GLOBALLY_CONSISTENT',
            'thinningRanking': 'my-attribute ASC, other-attr DESC',
            'zOrderRanking': ['.minZoomLevel DESC', '.geometryType ASC'],
        },
    )
    expected_ingestion_params = {
        'rankingOptions': {
            'thinningRankingRule': {
                'rankByOneThingRule': [
                    {
                        'direction': 'ASCENDING',
                        'rankByAttributeRule': {
                            'attributeName': 'my-attribute'
                        },
                    },
                    {
                        'direction': 'DESCENDING',
                        'rankByAttributeRule': {'attributeName': 'other-attr'},
                    },
                ]
            },
            'zOrderRankingRule': {
                'rankByOneThingRule': [
                    {'direction': 'DESCENDING', 'rankByMinZoomLevelRule': {}},
                    {'direction': 'ASCENDING', 'rankByGeometryTypeRule': {}},
                ]
            },
        },
        'thinningOptions': {
            'maxFeaturesPerTile': 10,
            'thinningStrategy': 'GLOBALLY_CONSISTENT',
        },
    }
    self.assertEqual(
        expected_ingestion_params,
        task.config['featureViewExportOptions']['ingestionTimeParameters'],
    )

  def testExportTableToFeatureViewBadRankByOneThingRule(self):
    """Verifies a bad RankByOneThingRule throws an exception."""
    with self.assertRaisesRegex(
        ee.EEException, 'Ranking rule format is invalid.*'
    ):
      ee.batch.Export.table.toFeatureView(
          collection=ee.FeatureCollection('foo'),
          assetId='users/foo/bar',
          ingestionTimeParameters={'thinningRanking': 'my-attribute BAD_DIR'},
      )

  def testExportTableToFeatureViewBadRankingRule(self):
    """Verifies a bad RankingRule throws an exception."""
    with self.assertRaisesRegex(
        ee.EEException, 'Unable to build ranking rule from rules.*'
    ):
      ee.batch.Export.table.toFeatureView(
          collection=ee.FeatureCollection('foo'),
          assetId='users/foo/bar',
          ingestionTimeParameters={'thinningRanking': {'key': 'val'}},
      )

  def testExportTableToFeatureViewBadIngestionTimeParams(self):
    """Verifies a bad set of ingestion time params throws an exception."""
    with self.assertRaisesRegex(
        ee.EEException,
        (
            r'The following keys are unrecognized in the '
            r'ingestion parameters: \[\'badThinningKey\'\]'
        ),
    ):
      ee.batch.Export.table.toFeatureView(
          collection=ee.FeatureCollection('foo'),
          assetId='users/foo/bar',
          ingestionTimeParameters={'badThinningKey': {'key': 'val'}},
      )

  def testExportTableToBigQueryRequiredParams(self):
    """Verifies the export task created by Export.table.toBigQuery()."""
    with apitestcase.UsingCloudApi():
      task = ee.batch.Export.table.toBigQuery(
          collection=ee.FeatureCollection('foo'),
          table='project.dataset.table',
          description='foo',
      )
      with self.subTest(name='TaskIdAndName'):
        self.assertIsNone(task.id)
        self.assertIsNone(task.name)
      with self.subTest(name='TypeIsExportFeatures'):
        self.assertEqual('EXPORT_FEATURES', task.task_type)
      with self.subTest(name='StateIsUnsubmitted'):
        self.assertEqual('UNSUBMITTED', task.state)
      with self.subTest(name='ConfigContents'):
        self.assertEqual(
            {
                'expression': ee.FeatureCollection('foo'),
                'description': 'foo',
                'bigqueryExportOptions': {
                    'bigqueryDestination': {
                        'table': 'project.dataset.table',
                        'overwrite': False,
                        'append': False,
                    }
                },
            },
            task.config,
        )
      with self.subTest(name='PriorityIsSet'):
        task_with_priority = ee.batch.Export.table.toBigQuery(
            collection=ee.FeatureCollection('foo'),
            table='project.dataset.table',
            description='foo',
            priority=999,
        )
        self.assertEqual(
            {
                'expression': ee.FeatureCollection('foo'),
                'description': 'foo',
                'bigqueryExportOptions': {
                    'bigqueryDestination': {
                        'table': 'project.dataset.table',
                        'overwrite': False,
                        'append': False,
                    }
                },
                'priority': {'value': 999},
            },
            task_with_priority.config,
        )

  def testExportTableToBigQueryAllParams(self):
    """Verifies the export task created by Export.table.toBigQuery()."""
    with apitestcase.UsingCloudApi():
      task = ee.batch.Export.table.toBigQuery(
          collection=ee.FeatureCollection('foo'),
          description='foo',
          table='project.dataset.table',
          overwrite=True,
          append=True,
          selectors=['.geo'],
          maxVertices=500,
      )
      with self.subTest(name='TaskIdAndName'):
        self.assertIsNone(task.id)
        self.assertIsNone(task.name)
      with self.subTest(name='TypeIsExportFeatures'):
        self.assertEqual('EXPORT_FEATURES', task.task_type)
      with self.subTest(name='StateIsUnsubmitted'):
        self.assertEqual('UNSUBMITTED', task.state)
      with self.subTest(name='ConfigContents'):
        self.assertEqual(
            {
                'expression': ee.FeatureCollection('foo'),
                'description': 'foo',
                'maxVertices': {'value': 500},
                'selectors': ['.geo'],
                'bigqueryExportOptions': {
                    'bigqueryDestination': {
                        'table': 'project.dataset.table',
                        'overwrite': True,
                        'append': True,
                    }
                },
            },
            task.config,
        )

  def testExportTableToBigQueryBadTableName(self):
    """Verifies a bad table name throws an exception."""
    with apitestcase.UsingCloudApi():
      with self.assertRaisesRegex(
          ee.EEException,
          'The BigQuery table reference must be a string of the form.*',
      ):
        ee.batch.Export.table.toBigQuery(
            collection=ee.FeatureCollection('foo'),
            table=['array.instead.of.string'],
            description='foo',
        )

      with self.assertRaisesRegex(
          ee.EEException,
          'The BigQuery table reference must be a string of the form.*',
      ):
        ee.batch.Export.table.toBigQuery(
            collection=ee.FeatureCollection('foo'),
            table='not.the-correct-format',
            description='foo',
        )

  def testExportVideoCloudApi(self):
    """Verifies the task created by Export.video()."""
    with apitestcase.UsingCloudApi():
      region = ee.Geometry.Rectangle(1, 2, 3, 4)
      config = dict(
          region=region['coordinates'],
          dimensions=16,
          framesPerSecond=30,
          maxFrames=10000,
          maxPixels=10000000,
          maxWorkers=100,
      )
      collection = ee.ImageCollection([ee.Image(1), ee.Image(2)])
      task = ee.batch.Export.video(collection, 'TestVideoName', config)
      self.assertIsNone(task.id)
      self.assertIsNone(task.name)
      self.assertEqual('EXPORT_VIDEO', task.task_type)
      self.assertEqual('UNSUBMITTED', task.state)
      # Defaults the destination to Drive.

      def expected_preparation_function(img):
        img = img.setDefaultProjection(
            crs='SR-ORG:6627', crsTransform=[1, 0, 0, 0, -1, 0]
        )
        img = img.clipToBoundsAndScale(geometry=region, maxDimension=16)
        return img

      expected_collection = collection.map(expected_preparation_function)
      # Using map() breaks equality comparison on collections, so compare the
      # serialised forms instead.
      self.assertEqual(
          expected_collection.serialize(for_cloud_api=True),
          task.config.pop('expression').serialize(for_cloud_api=True),
      )
      self.assertEqual(
          {
              'description': 'TestVideoName',
              'videoOptions': {
                  'framesPerSecond': 30,
                  'maxFrames': 10000,
                  'maxPixelsPerFrame': {'value': '10000000'},
              },
              'fileExportOptions': {
                  'fileFormat': 'MP4',
                  'driveDestination': {
                      'filenamePrefix': 'TestVideoName',
                  },
              },
              'maxWorkers': {'value': 100},
          },
          task.config,
      )

      config['outputBucket'] = 'test-bucket'
      gcs_task = ee.batch.Export.video(collection, 'TestVideoName', config)
      self.assertEqual('EXPORT_VIDEO', gcs_task.task_type)
      self.assertEqual('UNSUBMITTED', gcs_task.state)
      self.assertEqual(
          expected_collection.serialize(for_cloud_api=True),
          gcs_task.config.pop('expression').serialize(for_cloud_api=True),
      )
      self.assertEqual(
          {
              'description': 'TestVideoName',
              'videoOptions': {
                  'framesPerSecond': 30,
                  'maxFrames': 10000,
                  'maxPixelsPerFrame': {'value': '10000000'},
              },
              'fileExportOptions': {
                  'fileFormat': 'MP4',
                  'cloudStorageDestination': {
                      'bucket': 'test-bucket',
                      'filenamePrefix': 'TestVideoName',
                  },
              },
              'maxWorkers': {'value': 100},
          },
          gcs_task.config,
      )

      with self.assertRaisesRegex(
          ee.EEException, 'Unknown configuration options.*'
      ):
        config_with_bogus_option = config.copy()
        config_with_bogus_option['flamesPerSleestak'] = 30
        ee.batch.Export.video(
            collection, 'TestVideoName', config_with_bogus_option
        )

  def testExportVideoToCloudStorageCloudApi(self):
    """Verifies the task created by Export.video.toCloudStorage()."""
    with apitestcase.UsingCloudApi():
      region = ee.Geometry.Rectangle(1, 2, 3, 4)
      collection = ee.ImageCollection([ee.Image(1), ee.Image(2)])

      def expected_preparation_function(img):
        img = img.reproject(
            crs='foo', crsTransform=[9.0, 8.0, 7.0, 6.0, 5.0, 4.0]
        )
        img = img.clipToBoundsAndScale(geometry=region, maxDimension=16)
        return img

      expected_collection = collection.map(expected_preparation_function)
      expected_config = {
          'description': 'TestVideoName',
          'fileExportOptions': {
              'fileFormat': 'MP4',
              'cloudStorageDestination': {
                  'bucket': 'test-bucket',
                  'filenamePrefix': 'TestVideoName',
              },
          },
      }

      # Test keyed parameters.
      task_keyed = ee.batch.Export.video.toCloudStorage(
          collection=collection,
          description='TestVideoName',
          bucket='test-bucket',
          dimensions=16,
          region=region['coordinates'],
          crsTransform='[9,8,7,6,5,4]',
          crs='foo',
      )
      self.assertIsNone(task_keyed.id)
      self.assertIsNone(task_keyed.name)
      self.assertEqual('EXPORT_VIDEO', task_keyed.task_type)
      self.assertEqual('UNSUBMITTED', task_keyed.state)
      self.assertEqual(
          expected_collection.serialize(for_cloud_api=True),
          task_keyed.config.pop('expression').serialize(for_cloud_api=True),
      )
      self.assertEqual(expected_config, task_keyed.config)

      # Test ordered parameters.
      task_ordered = ee.batch.Export.video.toCloudStorage(
          collection,
          'TestVideoName',
          'test-bucket',
          None,
          None,
          16,
          region['coordinates'],
          None,
          'foo',
          '[9,8,7,6,5,4]',
      )
      self.assertEqual('EXPORT_VIDEO', task_ordered.task_type)
      self.assertEqual('UNSUBMITTED', task_ordered.state)
      self.assertEqual(
          expected_collection.serialize(for_cloud_api=True),
          task_ordered.config.pop('expression').serialize(for_cloud_api=True),
      )
      self.assertEqual(expected_config, task_ordered.config)

      expected_config_with_priority = {
          'description': 'TestVideoName',
          'fileExportOptions': {
              'fileFormat': 'MP4',
              'cloudStorageDestination': {
                  'bucket': 'test-bucket',
                  'filenamePrefix': 'TestVideoName',
              },
          },
          'priority': {'value': 999},
      }
      task_with_priority = ee.batch.Export.video.toCloudStorage(
          collection=collection,
          description='TestVideoName',
          bucket='test-bucket',
          dimensions=16,
          region=region['coordinates'],
          crsTransform='[9,8,7,6,5,4]',
          crs='foo',
          priority=999,
      )
      self.assertEqual(
          expected_collection.serialize(for_cloud_api=True),
          task_with_priority.config.pop('expression').serialize(
              for_cloud_api=True
          ),
      )
      self.assertEqual(expected_config_with_priority, task_with_priority.config)

  def testExportVideoToDriveCloudApi(self):
    """Verifies the task created by Export.video.toDrive()."""
    with apitestcase.UsingCloudApi():
      region = ee.Geometry.Rectangle(1, 2, 3, 4)
      collection = ee.ImageCollection([ee.Image(1), ee.Image(2)])

      def expected_preparation_function(img):
        img = img.reproject(
            crs='SR-ORG:6627', crsTransform=[9.0, 8.0, 7.0, 6.0, 5.0, 4.0]
        )
        img = img.clipToBoundsAndScale(geometry=region, maxDimension=16)
        return img

      expected_collection = collection.map(expected_preparation_function)
      expected_config = {
          'description': 'TestVideoName',
          'fileExportOptions': {
              'fileFormat': 'MP4',
              'driveDestination': {
                  'folder': 'test-folder',
                  'filenamePrefix': 'TestVideoName',
              },
          },
      }

      # Test keyed parameters.
      task_keyed = ee.batch.Export.video.toDrive(
          collection=collection,
          description='TestVideoName',
          folder='test-folder',
          dimensions=16,
          crsTransform='[9,8,7,6,5,4]',
          region=region['coordinates'],
      )
      self.assertIsNone(task_keyed.id)
      self.assertIsNone(task_keyed.name)
      self.assertEqual('EXPORT_VIDEO', task_keyed.task_type)
      self.assertEqual('UNSUBMITTED', task_keyed.state)
      self.assertEqual(
          expected_collection.serialize(for_cloud_api=True),
          task_keyed.config.pop('expression').serialize(for_cloud_api=True),
      )
      self.assertEqual(expected_config, task_keyed.config)

      # Test ordered parameters.
      task_ordered = ee.batch.Export.video.toDrive(
          collection,
          'TestVideoName',
          'test-folder',
          None,
          None,
          16,
          region['coordinates'],
          None,
          'SR-ORG:6627',
          '[9,8,7,6,5,4]',
      )
      self.assertEqual('EXPORT_VIDEO', task_ordered.task_type)
      self.assertEqual('UNSUBMITTED', task_ordered.state)
      self.assertEqual(
          expected_collection.serialize(for_cloud_api=True),
          task_ordered.config.pop('expression').serialize(for_cloud_api=True),
      )
      self.assertEqual(expected_config, task_ordered.config)

      expected_config_with_priority = {
          'description': 'TestVideoName',
          'fileExportOptions': {
              'fileFormat': 'MP4',
              'driveDestination': {
                  'folder': 'test-folder',
                  'filenamePrefix': 'TestVideoName',
              },
          },
          'priority': {'value': 999},
      }
      task_with_priority = ee.batch.Export.video.toDrive(
          collection=collection,
          description='TestVideoName',
          folder='test-folder',
          dimensions=16,
          crsTransform='[9,8,7,6,5,4]',
          region=region['coordinates'],
          priority=999,
      )
      self.assertEqual(
          expected_collection.serialize(for_cloud_api=True),
          task_with_priority.config.pop('expression').serialize(
              for_cloud_api=True
          ),
      )
      self.assertEqual(expected_config_with_priority, task_with_priority.config)

  def testExportWorkloadTag(self):
    """Verifies that the workload tag state is captured before start."""
    mock_cloud_api_resource = mock.MagicMock()
    mock_cloud_api_resource.projects().table().export().execute.return_value = {
        'name': 'projects/earthengine-legacy/operations/foo',
        'metadata': {},
    }

    with apitestcase.UsingCloudApi(cloud_api_resource=mock_cloud_api_resource):
      ee.data.setWorkloadTag('test-export')
      task = ee.batch.Export.table(ee.FeatureCollection('foo'), 'bar')
      ee.data.setWorkloadTag('not-test-export')
      self.assertEqual('test-export', task.workload_tag)
      task.start()
      self.assertEqual('test-export', task.config['workloadTag'])
      export_args = mock_cloud_api_resource.projects().table().export.call_args
      self.assertEqual(export_args[1]['body']['workloadTag'], 'test-export')

    ee.data.resetWorkloadTag(True)

    with apitestcase.UsingCloudApi(cloud_api_resource=mock_cloud_api_resource):
      ee.data.setWorkloadTag('test-export')
      task = ee.batch.Export.table(ee.FeatureCollection('foo'), 'bar')
      self.assertEqual('test-export', task.workload_tag)
      task.config['workloadTag'] = 'not-test-export'
      task.start()
      # Overridden in config.
      self.assertEqual('not-test-export', task.config['workloadTag'])
      export_args = mock_cloud_api_resource.projects().table().export.call_args
      self.assertEqual(export_args[1]['body']['workloadTag'], 'not-test-export')

    ee.data.resetWorkloadTag(True)

    with apitestcase.UsingCloudApi(cloud_api_resource=mock_cloud_api_resource):
      task = ee.batch.Export.table(ee.FeatureCollection('foo'), 'bar')
      ee.data.setWorkloadTag('not-test-export')
      self.assertEqual('', task.workload_tag)
      task.start()
      # Not captured on start().
      self.assertEqual('', task.config['workloadTag'])
      export_args = mock_cloud_api_resource.projects().table().export.call_args
      self.assertNotIn('workloadTag', export_args[1]['body'])

    ee.data.resetWorkloadTag(True)


if __name__ == '__main__':
  unittest.main()
