#!/usr/bin/env python
"""Test for the ee.batch module."""
import copy
import json

import mock

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

    def mock_send(path, params, unused_method=None, unused_raw=None):
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
    ee.data.send_ = mock_send

  def testTaskList(self):
    """Verifies the return value of Task.list()."""
    tasks = ee.batch.Task.list()
    self.assertEqual(2, len(tasks))
    self.assertEqual(TASK_STATUS_1['id'], tasks[0].id)
    self.assertEqual(TASK_STATUS_1['task_type'], tasks[0].task_type)
    self.assertEqual(TASK_STATUS_2['id'], tasks[1].id)

  def testTaskStatus(self):
    """Verifies the return value of Task.status()."""
    tasks = ee.batch.Task.list()
    self.assertEqual(
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
    self.assertEqual(
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
    self.assertEqual({
        'state': 'UNSUBMITTED',
        'creation_timestamp_ms': 0,
        'id': 'TESTTASKID',
    }, new_task.status())
    self.assertFalse(new_task.active())

  def testTaskStart(self):
    """Verifies that Task.start() calls the server appropriately."""
    task = ee.batch.Export.table(ee.FeatureCollection('foo'), 'bar')
    task.start()
    self.assertEqual('TESTTASKID', self.start_call_params['id'])
    self.assertEqual('bar', self.start_call_params['description'])

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

  def testTaskCancel(self):
    """Verifies that Task.cancel() calls the server appropriately."""
    task = ee.batch.Task.list()[0]
    task.cancel()
    self.assertEqual('TEST1', self.update_call_params['id'])
    self.assertEqual('CANCEL', self.update_call_params['action'])

  def testTaskCancelCloudApi(self):
    mock_cloud_api_resource = mock.MagicMock()
    mock_cloud_api_resource.projects().operations().list(
    ).execute.return_value = {
        'operations': [{
            'name': 'projects/earthengine-legacy/operations/TEST1',
            'metadata': {},
        }]
    }
    mock_cloud_api_resource.projects().operations(
    ).list_next.return_value = None
    with apitestcase.UsingCloudApi(cloud_api_resource=mock_cloud_api_resource):
      task = ee.batch.Task.list()[0]
      task.cancel()
      cancel_args = mock_cloud_api_resource.projects().operations(
      ).cancel.call_args
      self.assertEqual(
          cancel_args[1]['name'],
          'projects/earthengine-legacy/operations/TEST1')

  def testStringRepresentation(self):
    """Verifies the string representation of tasks."""
    tasks = ee.batch.Task.list()
    self.assertEqual('<Task EXPORT_IMAGE: FirstTestTask (RUNNING)>',
                     str(tasks[0]))
    self.assertEqual('<Task EXPORT_FEATURES: SecondTestTask (FAILED)>',
                     str(tasks[1]))
    new_task = ee.batch.Export.table(ee.FeatureCollection('foo'), 'bar')
    self.assertEqual('<Task EXPORT_FEATURES: bar (UNSUBMITTED)>', str(new_task))
    self.assertEqual(
        '<Task "foo">', str(ee.batch.Task('foo', None, None, None)))

  def testExportImageTrivialRegion(self):
    """Verifies the task created by Export.image() with a trivial region."""
    task = ee.batch.Export.image.toAsset(
        ee.Image(42),
        assetId='users/foo/bar',
        region=[0, 0, 1, 0, 1, 1],
        scale=1000)
    self.assertEqual('TESTTASKID', task.id)
    self.assertEqual('EXPORT_IMAGE', task.task_type)
    self.assertEqual('UNSUBMITTED', task.state)
    self.assertEqual({
        'assetId': 'users/foo/bar',
        'description': 'myExportImageTask',
        'json': ee.Image(42).serialize(),
        'region': '[0, 0, 1, 0, 1, 1]',
        'scale': 1000,
    }, task.config)

  def testExportImageTrivialRegionCloudApi(self):
    """Verifies the task created by Export.image() with a trivial region."""
    with apitestcase.UsingCloudApi():
      region = [0, 0, 1, 0, 1, 1]
      task = ee.batch.Export.image.toAsset(
          ee.Image(42), assetId='users/foo/bar', region=region, scale=1000)
      expected_expression = ee.Image(42).clipToBoundsAndScale(
          geometry=ee.Geometry.LineString(region),
          scale=1000)
      self.assertIsNone(task.id)
      self.assertIsNone(task.name)
      self.assertEqual('EXPORT_IMAGE', task.task_type)
      self.assertEqual('UNSUBMITTED', task.state)
      self.assertEqual({
          'expression': expected_expression,
          'assetExportOptions': {
              'earthEngineDestination': {
                  'name': 'projects/earthengine-legacy/assets/users/foo/bar'
              }
          },
          'description': 'myExportImageTask',
      }, task.config)

  def testExportImage(self):
    """Verifies the task created by Export.image()."""
    region = ee.Geometry.Rectangle(1, 2, 3, 4)
    config = dict(region=region['coordinates'], maxPixels=10**10,
                  crs='foo', crs_transform='[9,8,7,6,5,4]')
    task = ee.batch.Export.image(ee.Image(1), 'TestDescription', config)
    self.assertEqual('TESTTASKID', task.id)
    self.assertEqual('EXPORT_IMAGE', task.task_type)
    self.assertEqual('UNSUBMITTED', task.state)
    self.assertEqual({
        'fileFormat': 'GeoTIFF',
        'json': ee.Image(1).serialize(),
        'description': 'TestDescription',
        'region': '[[[1, 4], [1, 2], [3, 2], [3, 4]]]',
        'driveFileNamePrefix': 'TestDescription',
        'maxPixels': 10**10,
        'crs': 'foo',
        'crs_transform': '[9,8,7,6,5,4]',
    }, task.config)

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
          fileDimensions=1024,
      )
      task = ee.batch.Export.image(ee.Image(1), 'TestDescription', config)
      expected_expression = ee.Image(1).reproject(
          'foo', crsTransform=[
              9.0, 8.0, 7.0, 6.0, 5.0, 4.0
          ]).clip(region)
      self.assertIsNone(task.id)
      self.assertIsNone(task.name)
      self.assertEqual('EXPORT_IMAGE', task.task_type)
      self.assertEqual('UNSUBMITTED', task.state)
      self.assertEqual({
          'expression': expected_expression,
          'description': 'TestDescription',
          'fileExportOptions': {
              'fileFormat': 'GEO_TIFF',
              'driveDestination': {
                  'filenamePrefix': 'TestDescription'
              },
              'geoTiffOptions': {
                  'cloudOptimized': True,
                  'tileDimensions': {
                      'width': 1024,
                      'height': 1024
                  }
              },
          },
          'maxPixels': {
              'value': '10000000000'
          },
      }, task.config)

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
              'maskedThreshold': .5,
          },
      )
      task = ee.batch.Export.image(ee.Image(1), 'TestDescription', config)
      expected_expression = ee.Image(1).reproject(
          'foo', crsTransform=[
              9.0, 8.0, 7.0, 6.0, 5.0, 4.0
          ]).clip(region)
      self.assertIsNone(task.id)
      self.assertIsNone(task.name)
      self.assertEqual('EXPORT_IMAGE', task.task_type)
      self.assertEqual('UNSUBMITTED', task.state)
      self.assertEqual({
          'expression': expected_expression,
          'description': 'TestDescription',
          'fileExportOptions': {
              'fileFormat': 'TF_RECORD_IMAGE',
              'driveDestination': {
                  'filenamePrefix': 'TestDescription'
              },
              'tfRecordOptions': {
                  'tileDimensions': {
                      'width': 256,
                      'height': 256
                  },
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
          'maxPixels': {
              'value': '10000000000'
          },
      }, task.config)

  def testExportImageToAsset(self):
    """Verifies the Asset export task created by Export.image.toAsset()."""
    config = dict(
        image=ee.Image(1), assetId='users/foo/bar',
        pyramidingPolicy={'B1': 'min'})

    # Test keyed parameters.
    task_keyed = ee.batch.Export.image.toAsset(
        image=config['image'], assetId=config['assetId'],
        pyramidingPolicy=config['pyramidingPolicy'])
    self.assertEqual('TESTTASKID', task_keyed.id)
    self.assertEqual('EXPORT_IMAGE', task_keyed.task_type)
    self.assertEqual('UNSUBMITTED', task_keyed.state)
    self.assertEqual({
        'json': config['image'].serialize(),
        'description': 'myExportImageTask',
        'assetId': config['assetId'],
        'pyramidingPolicy': json.dumps(config['pyramidingPolicy']),
    }, task_keyed.config)

    task_ordered = ee.batch.Export.image.toAsset(
        config['image'], 'TestDescription', config['assetId'], maxPixels=1000)
    self.assertEqual('EXPORT_IMAGE', task_ordered.task_type)
    self.assertEqual('UNSUBMITTED', task_ordered.state)
    self.assertEqual({
        'json': config['image'].serialize(),
        'description': 'TestDescription',
        'assetId': config['assetId'],
        'maxPixels': 1000
    }, task_ordered.config)

  def testExportImageToAssetCloudApi(self):
    """Verifies the Asset export task created by Export.image.toAsset()."""
    with apitestcase.UsingCloudApi():
      config = dict(
          image=ee.Image(1),
          assetId='users/foo/bar',
          pyramidingPolicy={'B1': 'min'})
      expected_expression = ee.Image(1)

      # Test keyed parameters.
      task_keyed = ee.batch.Export.image.toAsset(
          image=config['image'],
          assetId=config['assetId'],
          pyramidingPolicy=config['pyramidingPolicy'])
      self.assertIsNone(task_keyed.id)
      self.assertIsNone(task_keyed.name)
      self.assertEqual('EXPORT_IMAGE', task_keyed.task_type)
      self.assertEqual('UNSUBMITTED', task_keyed.state)
      self.assertEqual({
          'expression': expected_expression,
          'description': 'myExportImageTask',
          'assetExportOptions': {
              'earthEngineDestination': {
                  'name': 'projects/earthengine-legacy/assets/users/foo/bar'
              },
              'pyramidingPolicyOverrides': {
                  'B1': 'MIN'
              }
          },
      }, task_keyed.config)

      task_ordered = ee.batch.Export.image.toAsset(
          config['image'],
          'TestDescription',
          config['assetId'],
          maxPixels=1000,
          maxWorkers=100,
          tileSize=4)
      self.assertEqual('EXPORT_IMAGE', task_ordered.task_type)
      self.assertEqual('UNSUBMITTED', task_ordered.state)
      self.assertEqual({
          'expression': expected_expression,
          'description': 'TestDescription',
          'assetExportOptions': {
              'earthEngineDestination': {
                  'name': 'projects/earthengine-legacy/assets/users/foo/bar'
              },
              'tileSize': {
                  'value': 4
              }
          },
          'maxPixels': {
              'value': '1000'
          },
          'maxWorkerCount': {
              'value': 100
          }
      }, task_ordered.config)

  def testExportImageToCloudStorage(self):
    """Verifies the Cloud Storage export task created by Export.image()."""
    region = ee.Geometry.Rectangle(1, 2, 3, 4)
    config = dict(region=region['coordinates'], maxPixels=10**10,
                  outputBucket='test-bucket')
    task = ee.batch.Export.image.toCloudStorage(
        ee.Image(1), 'TestDescription',
        config['outputBucket'], None, None,
        config['region'], None, None, None, config['maxPixels'])
    self.assertEqual('TESTTASKID', task.id)
    self.assertEqual('EXPORT_IMAGE', task.task_type)
    self.assertEqual('UNSUBMITTED', task.state)
    self.assertEqual({
        'fileFormat': 'GeoTIFF',
        'json': ee.Image(1).serialize(),
        'description': 'TestDescription',
        'region': '[[[1, 4], [1, 2], [3, 2], [3, 4]]]',
        'outputBucket': 'test-bucket',
        'outputPrefix': 'TestDescription',
        'maxPixels': 10**10,
    }, task.config)

  def testExportImageToCloudStorageCloudApi(self):
    """Verifies the Cloud Storage export task created by Export.image()."""
    with apitestcase.UsingCloudApi():
      region = ee.Geometry.Rectangle(1, 2, 3, 4)
      config = dict(
          region=region['coordinates'],
          maxPixels=10**10,
          outputBucket='test-bucket')
      task = ee.batch.Export.image.toCloudStorage(
          ee.Image(1), 'TestDescription', config['outputBucket'], None, None,
          config['region'], None, None, None, config['maxPixels'], None,
          [512, 2048], True)
      expected_expression = ee.Image(1).clip(region)
      self.assertIsNone(task.id)
      self.assertIsNone(task.name)
      self.assertEqual('EXPORT_IMAGE', task.task_type)
      self.assertEqual('UNSUBMITTED', task.state)
      self.assertEqual({
          'expression': expected_expression,
          'description': 'TestDescription',
          'fileExportOptions': {
              'fileFormat': 'GEO_TIFF',
              'gcsDestination': {
                  'bucket': 'test-bucket',
                  'filenamePrefix': 'TestDescription'
              },
              'geoTiffOptions': {
                  'tileDimensions': {
                      'width': 512,
                      'height': 2048
                  },
                  'skipEmptyFiles': True,
              },
          },
          'maxPixels': {
              'value': '10000000000'
          },
      }, task.config)

  def testUnknownFileFormat(self):
    self.assertRaisesRegex(ee.EEException, '.*file format.*',
                           ee.batch.ConvertFormatSpecificParams,
                           {'fileFormat': 'mp3'})

  def testFormatParamSpecifiedTwice(self):
    self.assertRaisesRegex(ee.EEException, '.*at least twice.*',
                           ee.batch.ConvertFormatSpecificParams, {
                               'cloudOptimized': False,
                               'formatOptions': {
                                   'cloudOptimized': True
                               }
                           })

  def testDisallowedFormatPrefix(self):
    self.assertRaisesRegex(ee.EEException, '.*prefix "tiff" disallowed.*',
                           ee.batch.ConvertFormatSpecificParams, {
                               'tiffCloudOptimized': False,
                               'formatOptions': {
                                   'cloudOptimized': True
                               }
                           })

  def testUnknownFormatOption(self):
    self.assertRaisesRegex(ee.EEException, '.*not a valid option.*',
                           ee.batch.ConvertFormatSpecificParams,
                           {'formatOptions': {
                               'garbage': 0
                           }})

  def testConvertFormat(self):
    config = {
        'fieldA': 1,
        'fieldB': 3,
        'fileFormat': 'GEoTIFF',
        'formatOptions': {
            'cloudOptimized': False
        }
    }
    fixed_config = copy.copy(config)
    ee.batch.ConvertFormatSpecificParams(fixed_config)
    self.assertEqual(
        fixed_config, {
            'fieldA': 1,
            'fieldB': 3,
            'fileFormat': 'GEoTIFF',
            'tiffCloudOptimized': False
        })

  def testConvertFormatTfRecord(self):
    config = {
        'fileFormat': 'tfrecord',
        'formatOptions': {
            'patchDimensions': [10, 10],
            'compressed': True
        }
    }
    fixed_config = copy.copy(config)
    ee.batch.ConvertFormatSpecificParams(fixed_config)
    self.assertEqual(
        fixed_config, {
            'fileFormat': 'tfrecord',
            'tfrecordPatchDimensions': '10,10',
            'tfrecordCompressed': True
        })

  def testExportImageToGoogleDrive(self):
    """Verifies the Drive destined task created by Export.image.toDrive()."""
    region = ee.Geometry.Rectangle(1, 2, 3, 4)
    drive_task_by_keys = ee.batch.Export.image.toDrive(
        image=ee.Image(1), region=region['coordinates'], folder='foo',
        maxPixels=10**10, crsTransform='[9,8,7,6,5,4]')
    self.assertEqual('TESTTASKID', drive_task_by_keys.id)
    self.assertEqual('EXPORT_IMAGE', drive_task_by_keys.task_type)
    self.assertEqual('UNSUBMITTED', drive_task_by_keys.state)
    self.assertEqual(
        {
            'fileFormat': 'GeoTIFF',
            'json': ee.Image(1).serialize(),
            'description': 'myExportImageTask',
            'region': '[[[1, 4], [1, 2], [3, 2], [3, 4]]]',
            'driveFileNamePrefix': 'myExportImageTask',
            'driveFolder': 'foo',
            'maxPixels': 10**10,
            # Transformed by _ConvertToServerParams.
            'crs_transform': '[9,8,7,6,5,4]',
        },
        drive_task_by_keys.config)

    drive_task_with_old_keys = ee.batch.Export.image.toDrive(
        image=ee.Image(1), region=region['coordinates'], driveFolder='foo',
        driveFileNamePrefix='fooExport', maxPixels=10**10,
        crs_transform='[9,8,7,6,5,4]')
    self.assertEqual('EXPORT_IMAGE', drive_task_with_old_keys.task_type)
    self.assertEqual('UNSUBMITTED', drive_task_with_old_keys.state)
    self.assertEqual(
        {
            'fileFormat': 'GeoTIFF',
            'json': ee.Image(1).serialize(),
            'description': 'myExportImageTask',
            'region': '[[[1, 4], [1, 2], [3, 2], [3, 4]]]',
            'driveFileNamePrefix': 'fooExport',
            'driveFolder': 'foo',
            'maxPixels': 10**10,
            # Transformed by _ConvertToServerParams.
            'crs_transform': '[9,8,7,6,5,4]',
        },
        drive_task_with_old_keys.config)

  def testExportImageToGoogleDriveCloudApi(self):
    """Verifies the Drive destined task created by Export.image.toDrive()."""
    with apitestcase.UsingCloudApi():
      region = ee.Geometry.Rectangle(1, 2, 3, 4)
      drive_task_by_keys = ee.batch.Export.image.toDrive(
          image=ee.Image(1), region=region['coordinates'], folder='foo',
          maxPixels=10**10, crs='foo', crsTransform='[9,8,7,6,5,4]')
      expected_expression = ee.Image(1).reproject(
          'foo', crsTransform=[9.0, 8.0, 7.0, 6.0, 5.0, 4.0]).clip(region)
      self.assertIsNone(drive_task_by_keys.id)
      self.assertIsNone(drive_task_by_keys.name)
      self.assertEqual('EXPORT_IMAGE', drive_task_by_keys.task_type)
      self.assertEqual('UNSUBMITTED', drive_task_by_keys.state)
      self.assertEqual({
          'expression': expected_expression,
          'description': 'myExportImageTask',
          'fileExportOptions': {
              'fileFormat': 'GEO_TIFF',
              'driveDestination': {
                  'folder': 'foo',
                  'filenamePrefix': 'myExportImageTask'
              }
          },
          'maxPixels': {
              'value': '10000000000'
          },
      }, drive_task_by_keys.config)

      drive_task_with_old_keys = ee.batch.Export.image.toDrive(
          image=ee.Image(1), region=region['coordinates'], driveFolder='foo',
          driveFileNamePrefix='fooExport', maxPixels=10**10,
          crs='foo', crs_transform='[9,8,7,6,5,4]')
      self.assertIsNone(drive_task_with_old_keys.id)
      self.assertIsNone(drive_task_by_keys.name)
      self.assertEqual('EXPORT_IMAGE', drive_task_with_old_keys.task_type)
      self.assertEqual('UNSUBMITTED', drive_task_with_old_keys.state)
      self.assertEqual({
          'expression': expected_expression,
          'description': 'myExportImageTask',
          'fileExportOptions': {
              'fileFormat': 'GEO_TIFF',
              'driveDestination': {
                  'folder': 'foo',
                  'filenamePrefix': 'fooExport'
              }
          },
          'maxPixels': {
              'value': '10000000000'
          },
      }, drive_task_with_old_keys.config)

      with self.assertRaisesRegex(ee.EEException,
                                  'Unknown configuration options.*'):
        ee.batch.Export.image.toDrive(image=ee.Image(1), framesPerSecond=30)

  def testExportImageFileDimensions(self):
    """Verifies proper handling of the fileDimensions parameter."""
    number_task = ee.batch.Export.image.toDrive(
        image=ee.Image(1), fileDimensions=100)
    self.assertEqual(100, number_task.config['fileDimensions'])

    tuple_task = ee.batch.Export.image.toDrive(
        image=ee.Image(1), fileDimensions=(100, 200))
    self.assertEqual('100,200', tuple_task.config['fileDimensions'])

  def testExportMapToCloudStorage(self):
    """Verifies the task created by Export.map.toCloudStorage()."""
    config = dict(
        image=ee.Image(1), bucket='test-bucket', maxZoom=7, path='foo/gcs/path')

    # Test keyed parameters.
    task_keyed = ee.batch.Export.map.toCloudStorage(
        image=config['image'], bucket=config['bucket'],
        maxZoom=config['maxZoom'], path=config['path'])
    self.assertEqual('TESTTASKID', task_keyed.id)
    self.assertEqual('EXPORT_TILES', task_keyed.task_type)
    self.assertEqual('UNSUBMITTED', task_keyed.state)
    self.assertEqual({
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
    self.assertEqual('EXPORT_TILES', task_ordered.task_type)
    self.assertEqual('UNSUBMITTED', task_ordered.state)
    self.assertEqual({
        'json': config['image'].serialize(),
        'description': 'TestDescription',
        'outputBucket': config['bucket'],
        'outputPrefix': 'TestDescription',
        'scale': 30,
        'writePublicTiles': False,
        'fileFormat': 'jpeg'
    }, task_ordered.config)

  def testExportMapToCloudStorageCloudApi(self):
    """Verifies the task created by Export.map.toCloudStorage()."""
    with apitestcase.UsingCloudApi():
      config = dict(
          image=ee.Image(1),
          bucket='test-bucket',
          maxZoom=7,
          path='foo/gcs/path',
          maxWorkers=100)

      # Test keyed parameters.
      task_keyed = ee.batch.Export.map.toCloudStorage(
          image=config['image'], bucket=config['bucket'],
          maxZoom=config['maxZoom'], path=config['path'],
          maxWorkers=config['maxWorkers'])
      expected_expression = ee.Image(1)
      self.assertIsNone(task_keyed.id)
      self.assertIsNone(task_keyed.name)
      self.assertEqual('EXPORT_TILES', task_keyed.task_type)
      self.assertEqual('UNSUBMITTED', task_keyed.state)
      self.assertEqual({
          'expression': expected_expression,
          'description': 'myExportMapTask',
          'tileOptions': {
              'maxZoom': config['maxZoom'],
          },
          'tileExportOptions': {
              'fileFormat': 'AUTO_JPEG_PNG',
              'gcsDestination': {
                  'bucket': config['bucket'],
                  'filenamePrefix': config['path'],
                  'permissions': 'PUBLIC',
              },
          },
          'maxWorkerCount': {'value': 100}
      }, task_keyed.config)

      with self.assertRaisesRegex(ee.EEException,
                                  'Unknown configuration options.*'):
        config_with_bogus_option = config.copy()
        config_with_bogus_option['framesPerSecond'] = 30
        ee.batch.Export.map.toCloudStorage(**config_with_bogus_option)

      # Test ordered parameters.
      task_ordered = ee.batch.Export.map.toCloudStorage(
          config['image'], 'TestDescription', config['bucket'], 'jpeg', None,
          False, None, 30, None, None, None, 'aFakeKey', maxWorkers=100)
      self.assertIsNone(task_ordered.id)
      self.assertIsNone(task_ordered.name)
      self.assertEqual('EXPORT_TILES', task_ordered.task_type)
      self.assertEqual('UNSUBMITTED', task_ordered.state)
      self.assertEqual({
          'expression': expected_expression,
          'description': 'TestDescription',
          'tileOptions': {
              'scale': 30,
              'mapsApiKey': 'aFakeKey',
          },
          'tileExportOptions': {
              'fileFormat': 'JPEG',
              'gcsDestination': {
                  'bucket': config['bucket'],
                  'filenamePrefix': 'TestDescription',
              },
          },
          'maxWorkerCount': {'value': 100}
      }, task_ordered.config)

  def testExportTable(self):
    """Verifies the task created by Export.table()."""
    task = ee.batch.Export.table(ee.FeatureCollection('drive test FC'))
    self.assertEqual('TESTTASKID', task.id)
    self.assertEqual('EXPORT_FEATURES', task.task_type)
    self.assertEqual('UNSUBMITTED', task.state)
    self.assertEqual({
        'json': ee.FeatureCollection('drive test FC').serialize(),
        'description': 'myExportTableTask',
        'driveFileNamePrefix': 'myExportTableTask',
        'fileFormat': 'CSV',
    }, task.config)

  def testExportTableCloudApi(self):
    """Verifies the task created by Export.table()."""
    with apitestcase.UsingCloudApi():
      task = ee.batch.Export.table(
          ee.FeatureCollection('drive test FC'), config={'maxWorkers': 100})
      self.assertIsNone(task.id)
      self.assertIsNone(task.name)
      self.assertEqual('EXPORT_FEATURES', task.task_type)
      self.assertEqual('UNSUBMITTED', task.state)
      self.assertEqual({
          'expression': ee.FeatureCollection('drive test FC'),
          'description': 'myExportTableTask',
          'fileExportOptions': {
              'fileFormat': 'CSV',
              'driveDestination': {
                  'filenamePrefix': 'myExportTableTask',
              }
          },
          'maxWorkerCount': {'value': 100},
      }, task.config)

  def testExportTableCloudApiBogusParameter(self):
    """Verifies that bogus parameters are rejected."""
    with apitestcase.UsingCloudApi():
      with self.assertRaisesRegex(ee.EEException,
                                  'Unknown configuration options.*'):
        ee.batch.Export.table.toDrive(
            ee.FeatureCollection('drive test FC'), framesPerSecond=30)

  def testExportTableSelectors(self):
    """Verifies that table export accepts a list or tuple of selectors."""
    task = ee.batch.Export.table.toCloudStorage(
        collection=ee.FeatureCollection('foo'),
        selectors=['ab', 'bb', 'c'])
    self.assertEqual('ab,bb,c', task.config['selectors'])
    task = ee.batch.Export.table.toCloudStorage(
        collection=ee.FeatureCollection('foo'),
        selectors=('x', 'y'))
    self.assertEqual('x,y', task.config['selectors'])
    # Single string should work too.
    task = ee.batch.Export.table.toCloudStorage(
        collection=ee.FeatureCollection('foo'),
        selectors='ab,cd,ef')
    self.assertEqual('ab,cd,ef', task.config['selectors'])

  def testExportTableSelectorsCloudApi(self):
    """Verifies that table export accepts a list or tuple of selectors."""
    with apitestcase.UsingCloudApi():
      task = ee.batch.Export.table.toCloudStorage(
          collection=ee.FeatureCollection('foo'),
          selectors=['ab', 'bb', 'c'],
          outputBucket='foo')
      self.assertEqual(['ab', 'bb', 'c'], task.config['selectors'])
      task = ee.batch.Export.table.toCloudStorage(
          collection=ee.FeatureCollection('foo'),
          selectors=('x', 'y'),
          outputBucket='foo')
      self.assertEqual(['x', 'y'], task.config['selectors'])
      # Single string should work too.
      task = ee.batch.Export.table.toCloudStorage(
          collection=ee.FeatureCollection('foo'),
          selectors='ab,cd,ef',
          outputBucket='foo')
      self.assertEqual(['ab', 'cd', 'ef'], task.config['selectors'])

  def testExportTableToCloudStorage(self):
    """Verifies the Cloud Storage task created by Export.table()."""
    task = ee.batch.Export.table.toCloudStorage(
        collection=ee.FeatureCollection('foo'), outputBucket='test-bucket')
    self.assertEqual('TESTTASKID', task.id)
    self.assertEqual('EXPORT_FEATURES', task.task_type)
    self.assertEqual('UNSUBMITTED', task.state)
    self.assertEqual({
        'json': ee.FeatureCollection('foo').serialize(),
        'description': 'myExportTableTask',
        'outputBucket': 'test-bucket',
        'outputPrefix': 'myExportTableTask',
        'fileFormat': 'CSV',
    }, task.config)

  def testExportTableToCloudStorageCloudApi(self):
    """Verifies the Cloud Storage task created by Export.table()."""
    with apitestcase.UsingCloudApi():
      task = ee.batch.Export.table.toCloudStorage(
          collection=ee.FeatureCollection('foo'), outputBucket='test-bucket')
      self.assertIsNone(task.id)
      self.assertIsNone(task.name)
      self.assertEqual('EXPORT_FEATURES', task.task_type)
      self.assertEqual('UNSUBMITTED', task.state)
      self.assertEqual({
          'expression': ee.FeatureCollection('foo'),
          'description': 'myExportTableTask',
          'fileExportOptions': {
              'fileFormat': 'CSV',
              'gcsDestination': {
                  'bucket': 'test-bucket',
                  'filenamePrefix': 'myExportTableTask',
              }
          }
      }, task.config)

  def testExportTableToGoogleDrive(self):
    """Verifies the Drive destined task created by Export.table.toDrive()."""
    test_collection = ee.FeatureCollection('foo')
    test_description = 'TestDescription'
    test_file_name_prefix = 'fooDriveFileNamePrefix'
    test_format = 'KML'
    expected_config = {
        'json': test_collection.serialize(),
        'description': test_description,
        'driveFileNamePrefix': test_file_name_prefix,
        'fileFormat': test_format,
    }

    # Ordered parameters
    task_ordered = ee.batch.Export.table.toDrive(
        test_collection, test_description,
        None, test_file_name_prefix, test_format)
    self.assertEqual('TESTTASKID', task_ordered.id)
    self.assertEqual('EXPORT_FEATURES', task_ordered.task_type)
    self.assertEqual('UNSUBMITTED', task_ordered.state)
    self.assertEqual(expected_config, task_ordered.config)

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
    self.assertEqual('EXPORT_FEATURES', task_old_keys.task_type)
    self.assertEqual('UNSUBMITTED', task_old_keys.state)
    self.assertEqual(expected_config, task_old_keys.config)

    # Test that new parameters work
    task_new_keys = ee.batch.Export.table.toDrive(
        collection=test_collection, folder='fooFolder',
        fileNamePrefix='fooDriveFileNamePrefix')
    self.assertEqual('EXPORT_FEATURES', task_new_keys.task_type)
    self.assertEqual('UNSUBMITTED', task_new_keys.state)
    self.assertEqual(expected_config, task_new_keys.config)

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
              }
          }
      }

      # Ordered parameters
      task_ordered = ee.batch.Export.table.toDrive(
          test_collection, test_description,
          None, test_file_name_prefix, test_format)
      self.assertIsNone(task_ordered.id)
      self.assertIsNone(task_ordered.name)
      self.assertEqual('EXPORT_FEATURES', task_ordered.task_type)
      self.assertEqual('UNSUBMITTED', task_ordered.state)
      self.assertEqual(expected_config, task_ordered.config)

      # Updating expectations to test keyed parameters
      expected_config['description'] = 'myExportTableTask'
      expected_config['fileExportOptions']['fileFormat'] = 'CSV'
      expected_config['fileExportOptions']['driveDestination'][
          'folder'] = 'fooFolder'

      # Test that deprecated parameters (driveFolder and driveFileNamePrefix)
      # still work.
      task_old_keys = ee.batch.Export.table.toDrive(
          collection=test_collection, driveFolder='fooFolder',
          driveFileNamePrefix='fooDriveFileNamePrefix')
      self.assertEqual('EXPORT_FEATURES', task_old_keys.task_type)
      self.assertEqual('UNSUBMITTED', task_old_keys.state)
      self.assertEqual(expected_config, task_old_keys.config)

      # Test that new parameters work
      task_new_keys = ee.batch.Export.table.toDrive(
          collection=test_collection, folder='fooFolder',
          fileNamePrefix='fooDriveFileNamePrefix')
      self.assertEqual('EXPORT_FEATURES', task_new_keys.task_type)
      self.assertEqual('UNSUBMITTED', task_new_keys.state)
      self.assertEqual(expected_config, task_new_keys.config)

  def testExportTableToAsset(self):
    """Verifies the export task created by Export.table.toAsset()."""
    task = ee.batch.Export.table.toAsset(
        collection=ee.FeatureCollection('foo'),
        description='foo',
        assetId='users/foo/bar')
    self.assertEqual('TESTTASKID', task.id)
    self.assertEqual('EXPORT_FEATURES', task.task_type)
    self.assertEqual('UNSUBMITTED', task.state)
    self.assertEqual({
        'json': ee.FeatureCollection('foo').serialize(),
        'description': 'foo',
        'assetId': 'users/foo/bar'
    }, task.config)

  def testExportTableToAssetCloudApi(self):
    """Verifies the export task created by Export.table.toAsset()."""
    with apitestcase.UsingCloudApi():
      task = ee.batch.Export.table.toAsset(
          collection=ee.FeatureCollection('foo'),
          description='foo',
          assetId='users/foo/bar')
      self.assertIsNone(task.id)
      self.assertIsNone(task.name)
      self.assertEqual('EXPORT_FEATURES', task.task_type)
      self.assertEqual('UNSUBMITTED', task.state)
      self.assertEqual({
          'expression': ee.FeatureCollection('foo'),
          'description': 'foo',
          'assetExportOptions': {
              'earthEngineDestination': {
                  'name': 'projects/earthengine-legacy/assets/users/foo/bar'
              }
          }
      }, task.config)

  def testExportTableWithFileFormat(self):
    """Verifies the task created by Export.table() given a file format."""
    task = ee.batch.Export.table.toCloudStorage(
        collection=ee.FeatureCollection('foo'),
        outputBucket='test-bucket',
        fileFormat='tfRecord')
    self.assertEqual('TESTTASKID', task.id)
    self.assertEqual('EXPORT_FEATURES', task.task_type)
    self.assertEqual('UNSUBMITTED', task.state)
    self.assertEqual(
        {
            'json': ee.FeatureCollection('foo').serialize(),
            'description': 'myExportTableTask',
            'outputBucket': 'test-bucket',
            'outputPrefix': 'myExportTableTask',
            'fileFormat': 'tfRecord',
        }, task.config)

  def testExportTableWithFileFormatCloudApi(self):
    """Verifies the task created by Export.table() given a file format."""
    with apitestcase.UsingCloudApi():
      task = ee.batch.Export.table.toCloudStorage(
          collection=ee.FeatureCollection('foo'),
          outputBucket='test-bucket',
          fileFormat='tfRecord')
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
                  'gcsDestination': {
                      'bucket': 'test-bucket',
                      'filenamePrefix': 'myExportTableTask',
                  }
              }
          }, task.config)

  def testExportVideo(self):
    """Verifies the task created by Export.video()."""
    region = ee.Geometry.Rectangle(1, 2, 3, 4)
    config = dict(region=region['coordinates'], dimensions=16)
    collection = ee.ImageCollection([ee.Image(1), ee.Image(2)])
    task = ee.batch.Export.video(collection, 'TestVideoName', config)
    self.assertEqual('TESTTASKID', task.id)
    self.assertEqual('EXPORT_VIDEO', task.task_type)
    self.assertEqual('UNSUBMITTED', task.state)
    # Defaults the destination to Drive.
    self.assertEqual({
        'json': collection.serialize(),
        'description': 'TestVideoName',
        'crs': 'SR-ORG:6627',
        'driveFileNamePrefix': 'TestVideoName',
        'region': '[[[1, 4], [1, 2], [3, 2], [3, 4]]]',
        'dimensions': 16
    }, task.config)

    config['outputBucket'] = 'test-bucket'
    gcs_task = ee.batch.Export.video(collection, 'TestVideoName', config)
    self.assertEqual('EXPORT_VIDEO', gcs_task.task_type)
    self.assertEqual('UNSUBMITTED', gcs_task.state)
    self.assertEqual({
        'json': collection.serialize(),
        'description': 'TestVideoName',
        'crs': 'SR-ORG:6627',
        'outputBucket': 'test-bucket',
        'outputPrefix': 'TestVideoName',
        'region': '[[[1, 4], [1, 2], [3, 2], [3, 4]]]',
        'dimensions': 16
    }, gcs_task.config)

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
          maxWorkers=100)
      collection = ee.ImageCollection([ee.Image(1), ee.Image(2)])
      task = ee.batch.Export.video(collection, 'TestVideoName', config)
      self.assertIsNone(task.id)
      self.assertIsNone(task.name)
      self.assertEqual('EXPORT_VIDEO', task.task_type)
      self.assertEqual('UNSUBMITTED', task.state)
      # Defaults the destination to Drive.

      def expected_preparation_function(img):
        img = img.setDefaultProjection(
            crs='SR-ORG:6627', crsTransform=[1, 0, 0, 0, -1, 0])
        img = img.clipToBoundsAndScale(geometry=region, maxDimension=16)
        return img

      expected_collection = collection.map(expected_preparation_function)
      # Using map() breaks equality comparison on collections, so compare the
      # serialised forms instead.
      self.assertEqual(
          expected_collection.serialize(for_cloud_api=True),
          task.config.pop('expression').serialize(for_cloud_api=True))
      self.assertEqual({
          'description': 'TestVideoName',
          'videoOptions': {
              'framesPerSecond': 30,
              'maxFrames': 10000,
              'maxPixelsPerFrame': {
                  'value': '10000000'
              }
          },
          'fileExportOptions': {
              'fileFormat': 'MP4',
              'driveDestination': {
                  'filenamePrefix': 'TestVideoName',
              }
          },
          'maxWorkerCount': {'value': 100}
      }, task.config)

      config['outputBucket'] = 'test-bucket'
      gcs_task = ee.batch.Export.video(collection, 'TestVideoName', config)
      self.assertEqual('EXPORT_VIDEO', gcs_task.task_type)
      self.assertEqual('UNSUBMITTED', gcs_task.state)
      self.assertEqual(
          expected_collection.serialize(for_cloud_api=True),
          gcs_task.config.pop('expression').serialize(for_cloud_api=True))
      self.assertEqual({
          'description': 'TestVideoName',
          'videoOptions': {
              'framesPerSecond': 30,
              'maxFrames': 10000,
              'maxPixelsPerFrame': {
                  'value': '10000000'
              }
          },
          'fileExportOptions': {
              'fileFormat': 'MP4',
              'gcsDestination': {
                  'bucket': 'test-bucket',
                  'filenamePrefix': 'TestVideoName',
              }
          },
          'maxWorkerCount': {'value': 100}
      }, gcs_task.config)

      with self.assertRaisesRegex(ee.EEException,
                                  'Unknown configuration options.*'):
        config_with_bogus_option = config.copy()
        config_with_bogus_option['flamesPerSleestak'] = 30
        ee.batch.Export.video(collection, 'TestVideoName',
                              config_with_bogus_option)

  def testExportVideoToCloudStorage(self):
    """Verifies the task created by Export.video.toCloudStorage()."""
    region = ee.Geometry.Rectangle(1, 2, 3, 4)
    collection = ee.ImageCollection([ee.Image(1), ee.Image(2)])
    expected_config = {
        'json': collection.serialize(),
        'description': 'TestVideoName',
        'outputBucket': 'test-bucket',
        'outputPrefix': 'TestVideoName',
        'region': '[[[1, 4], [1, 2], [3, 2], [3, 4]]]',
        'dimensions': 16,
        # Transformed by _ConvertToServerParams.
        'crs_transform': '[9,8,7,6,5,4]',
        'crs': 'foo'
    }

    # Test keyed parameters.
    task_keyed = ee.batch.Export.video.toCloudStorage(
        collection=collection,
        description='TestVideoName',
        bucket='test-bucket',
        dimensions=16,
        region=region['coordinates'],
        crsTransform='[9,8,7,6,5,4]',
        crs='foo')
    self.assertEqual('TESTTASKID', task_keyed.id)
    self.assertEqual('EXPORT_VIDEO', task_keyed.task_type)
    self.assertEqual('UNSUBMITTED', task_keyed.state)
    self.assertEqual(expected_config, task_keyed.config)

    # Test ordered parameters.
    task_ordered = ee.batch.Export.video.toCloudStorage(
        collection, 'TestVideoName', 'test-bucket', None, None, 16,
        region['coordinates'], None, 'foo', '[9,8,7,6,5,4]')
    self.assertEqual('EXPORT_VIDEO', task_ordered.task_type)
    self.assertEqual('UNSUBMITTED', task_ordered.state)
    self.assertEqual(expected_config, task_ordered.config)

  def testExportVideoToCloudStorageCloudApi(self):
    """Verifies the task created by Export.video.toCloudStorage()."""
    with apitestcase.UsingCloudApi():
      region = ee.Geometry.Rectangle(1, 2, 3, 4)
      collection = ee.ImageCollection([ee.Image(1), ee.Image(2)])
      def expected_preparation_function(img):
        img = img.reproject(
            crs='foo', crsTransform=[9.0, 8.0, 7.0, 6.0, 5.0, 4.0])
        img = img.clipToBoundsAndScale(geometry=region, maxDimension=16)
        return img

      expected_collection = collection.map(expected_preparation_function)
      expected_config = {
          'description': 'TestVideoName',
          'fileExportOptions': {
              'fileFormat': 'MP4',
              'gcsDestination': {
                  'bucket': 'test-bucket',
                  'filenamePrefix': 'TestVideoName',
              }
          }
      }

      # Test keyed parameters.
      task_keyed = ee.batch.Export.video.toCloudStorage(
          collection=collection,
          description='TestVideoName',
          bucket='test-bucket',
          dimensions=16,
          region=region['coordinates'],
          crsTransform='[9,8,7,6,5,4]',
          crs='foo')
      self.assertIsNone(task_keyed.id)
      self.assertIsNone(task_keyed.name)
      self.assertEqual('EXPORT_VIDEO', task_keyed.task_type)
      self.assertEqual('UNSUBMITTED', task_keyed.state)
      self.assertEqual(
          expected_collection.serialize(for_cloud_api=True),
          task_keyed.config.pop('expression').serialize(for_cloud_api=True))
      self.assertEqual(expected_config, task_keyed.config)

      # Test ordered parameters.
      task_ordered = ee.batch.Export.video.toCloudStorage(
          collection, 'TestVideoName', 'test-bucket', None, None, 16,
          region['coordinates'], None, 'foo', '[9,8,7,6,5,4]')
      self.assertEqual('EXPORT_VIDEO', task_ordered.task_type)
      self.assertEqual('UNSUBMITTED', task_ordered.state)
      self.assertEqual(
          expected_collection.serialize(for_cloud_api=True),
          task_ordered.config.pop('expression').serialize(for_cloud_api=True))
      self.assertEqual(expected_config, task_ordered.config)

  def testExportVideoToDrive(self):
    """Verifies the task created by Export.video.toDrive()."""
    region = ee.Geometry.Rectangle(1, 2, 3, 4)
    collection = ee.ImageCollection([ee.Image(1), ee.Image(2)])
    expected_config = {
        'json': collection.serialize(),
        'description': 'TestVideoName',
        'crs': 'SR-ORG:6627',
        'driveFolder': 'test-folder',
        'driveFileNamePrefix': 'TestVideoName',
        'region': '[[[1, 4], [1, 2], [3, 2], [3, 4]]]',
        'dimensions': 16,
        'crs_transform': '[9,8,7,6,5,4]'
    }

    # Test keyed parameters.
    task_keyed = ee.batch.Export.video.toDrive(
        collection=collection,
        description='TestVideoName',
        folder='test-folder',
        dimensions=16,
        crsTransform='[9,8,7,6,5,4]',
        region=region['coordinates'])
    self.assertEqual('TESTTASKID', task_keyed.id)
    self.assertEqual('EXPORT_VIDEO', task_keyed.task_type)
    self.assertEqual('UNSUBMITTED', task_keyed.state)
    self.assertEqual(expected_config, task_keyed.config)

    # Test ordered parameters.
    task_ordered = ee.batch.Export.video.toDrive(
        collection, 'TestVideoName', 'test-folder', None, None, 16,
        region['coordinates'], None, 'SR-ORG:6627', '[9,8,7,6,5,4]')
    self.assertEqual('EXPORT_VIDEO', task_ordered.task_type)
    self.assertEqual('UNSUBMITTED', task_ordered.state)
    self.assertEqual(expected_config, task_ordered.config)

  def testExportVideoToDriveCloudApi(self):
    """Verifies the task created by Export.video.toDrive()."""
    with apitestcase.UsingCloudApi():
      region = ee.Geometry.Rectangle(1, 2, 3, 4)
      collection = ee.ImageCollection([ee.Image(1), ee.Image(2)])
      def expected_preparation_function(img):
        img = img.reproject(
            crs='SR-ORG:6627', crsTransform=[9.0, 8.0, 7.0, 6.0, 5.0, 4.0])
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
              }
          }
      }

      # Test keyed parameters.
      task_keyed = ee.batch.Export.video.toDrive(
          collection=collection,
          description='TestVideoName',
          folder='test-folder',
          dimensions=16,
          crsTransform='[9,8,7,6,5,4]',
          region=region['coordinates'])
      self.assertIsNone(task_keyed.id)
      self.assertIsNone(task_keyed.name)
      self.assertEqual('EXPORT_VIDEO', task_keyed.task_type)
      self.assertEqual('UNSUBMITTED', task_keyed.state)
      self.assertEqual(
          expected_collection.serialize(for_cloud_api=True),
          task_keyed.config.pop('expression').serialize(for_cloud_api=True))
      self.assertEqual(expected_config, task_keyed.config)

      # Test ordered parameters.
      task_ordered = ee.batch.Export.video.toDrive(
          collection, 'TestVideoName', 'test-folder', None, None, 16,
          region['coordinates'], None, 'SR-ORG:6627', '[9,8,7,6,5,4]')
      self.assertEqual('EXPORT_VIDEO', task_ordered.task_type)
      self.assertEqual('UNSUBMITTED', task_ordered.state)
      self.assertEqual(
          expected_collection.serialize(for_cloud_api=True),
          task_ordered.config.pop('expression').serialize(for_cloud_api=True))
      self.assertEqual(expected_config, task_ordered.config)



if __name__ == '__main__':
  unittest.main()
