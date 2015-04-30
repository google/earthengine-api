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
    config = dict(region=region['coordinates'], maxPixels=10**10)
    task = ee.batch.Export.image(ee.Image(1), 'TestName', config)
    self.assertEquals('TESTTASKID', task.id)
    self.assertEquals(
        {
            'type': 'EXPORT_IMAGE',
            'state': 'UNSUBMITTED',
            'json': ee.Image(1).serialize(),
            'description': 'TestName',
            'region': '[[[1, 4], [1, 2], [3, 2], [3, 4]]]',
            'scale': 1000,
            'driveFileNamePrefix': 'TestName',
            'maxPixels': 10**10,
        },
        task.config)

  def testExportTable(self):
    """Verifies the task created by Export.table()."""
    task = ee.batch.Export.table(ee.FeatureCollection('foo'))
    self.assertEquals('TESTTASKID', task.id)
    self.assertEquals(
        {
            'type': 'EXPORT_FEATURES',
            'state': 'UNSUBMITTED',
            'json': ee.FeatureCollection('foo').serialize(),
            'description': 'myExportTableTask',
            'driveFileNamePrefix': 'myExportTableTask',
            'fileFormat': 'CSV',
        },
        task.config)

  def testExportVideo(self):
    """Verifies the task created by Export.video()."""
    region = ee.Geometry.Rectangle(1, 2, 3, 4)
    config = dict(region=region['coordinates'], dimensions=16)
    collection = ee.ImageCollection([ee.Image(1), ee.Image(2)])
    task = ee.batch.Export.video(collection, 'TestVideoName', config)
    self.assertEquals('TESTTASKID', task.id)
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


if __name__ == '__main__':
  unittest.main()
