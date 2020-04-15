#!/usr/bin/env python


from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import json
import warnings

import unittest
from ee import _cloud_api_utils
from ee import ee_exception


class CloudApiUtilsTest(unittest.TestCase):

  def setUp(self):
    super(CloudApiUtilsTest, self).setUp()
    _cloud_api_utils.set_cloud_api_user_project('earthengine-legacy')

  def test_convert_dict_simple(self):
    result = _cloud_api_utils._convert_dict({
        'x': 99,
        'y': 2
    }, {
        'x': 'a',
        'y': ('c', lambda x: x + 1)
    })
    self.assertEqual({'a': 99, 'c': 3}, result)

  def test_convert_dict_with_defaults(self):
    result = _cloud_api_utils._convert_dict(
        {
            'x': 99
        }, {'x': 'a'}, defaults={
            'q': 'r',
            'a': 'aaa'
        })
    self.assertEqual({'a': 99, 'q': 'r'}, result)

  def test_convert_dict_with_warnings(self):
    with warnings.catch_warnings(record=True) as w:
      result = _cloud_api_utils._convert_dict({
          'x': 1,
          'y': 2
      }, {
          'x': 'flan',
          'y': 'flan'
      })
      self.assertLen(w, 1)
      self.assertEqual('Multiple request parameters converted to flan',
                       str(w[0].message))
    with warnings.catch_warnings(record=True) as w:
      result = _cloud_api_utils._convert_dict({'x': 1, 'y': 2}, {'x': 'flan'})
      self.assertEqual({'flan': 1}, result)
      self.assertEmpty(w)
    with warnings.catch_warnings(record=True) as w:
      result = _cloud_api_utils._convert_dict(
          {
              'x': 1,
              'y': 2
          }, {'x': 'flan'}, key_warnings=True)
      self.assertEqual({'flan': 1}, result)
      self.assertLen(w, 1)
      self.assertEqual('Unrecognized key y ignored', str(w[0].message))

  def test_convert_value(self):
    self.assertEqual('x', _cloud_api_utils._convert_value('a', {'a': 'x'}, 'z'))
    self.assertEqual('z', _cloud_api_utils._convert_value('b', {'a': 'x'}, 'z'))

  def test_convert_msec_to_timestamp(self):
    self.assertEqual('2018-07-31T20:46:28.888000Z',
                     _cloud_api_utils._convert_msec_to_timestamp(1533069988888))

  def test_convert_timestamp_to_msec(self):
    self.assertEqual(
        1533069988888,
        _cloud_api_utils._convert_timestamp_to_msec(
            '2018-07-31T20:46:28.888000Z'))
    self.assertEqual(
        1533069988000,
        _cloud_api_utils._convert_timestamp_to_msec(
            '2018-07-31T20:46:28Z'))

  def test_convert_bounding_box_to_geo_json(self):
    geo_json = _cloud_api_utils._convert_bounding_box_to_geo_json(
        [-105, 45, 10, 60])
    geo_json_parsed = json.loads(geo_json)
    self.assertEqual({
        'type':
            'Polygon',
        'coordinates': [[[-105, 45], [10, 45], [10, 60], [-105, 60], [-105, 45]]
                       ]
    }, geo_json_parsed)

  def test_convert_asset_type_for_create_asset(self):
    self.assertEqual(
        'IMAGE_COLLECTION',
        _cloud_api_utils.convert_asset_type_for_create_asset('ImageCollection'))
    self.assertEqual(
        'IMAGE_COLLECTION',
        _cloud_api_utils.convert_asset_type_for_create_asset(
            'IMAGE_COLLECTION'))
    self.assertEqual(
        'FOLDER',
        _cloud_api_utils.convert_asset_type_for_create_asset('Folder'))
    self.assertEqual(
        'FOLDER',
        _cloud_api_utils.convert_asset_type_for_create_asset('FOLDER'))

  def test_convert_asset_id_to_asset_name(self):
    self.assertEqual(
        'projects/earthengine-public/assets/path/to/asset',
        _cloud_api_utils.convert_asset_id_to_asset_name('path/to/asset'))
    self.assertEqual(
        'projects/earthengine-legacy/assets/users/path/to/asset',
        _cloud_api_utils.convert_asset_id_to_asset_name('users/path/to/asset'))
    self.assertEqual(
        'projects/earthengine-legacy/assets/projects/path/to/asset',
        _cloud_api_utils.convert_asset_id_to_asset_name(
            'projects/path/to/asset'))
    self.assertEqual(
        'projects/foobar/assets/baz',
        _cloud_api_utils.convert_asset_id_to_asset_name(
            'projects/foobar/assets/baz'))

  def test_split_asset_name(self):
    parent, asset_id = _cloud_api_utils.split_asset_name(
        'projects/earthengine-legacy/assets/users/path/to/asset')
    self.assertEqual('projects/earthengine-legacy', parent)
    self.assertEqual('users/path/to/asset', asset_id)

  def test_convert_operation_name_to_task_id(self):
    self.assertEqual(
        'taskId',
        _cloud_api_utils.convert_operation_name_to_task_id(
            'operations/taskId'))
    self.assertEqual(
        'taskId',
        _cloud_api_utils.convert_operation_name_to_task_id(
            'projects/test/operations/taskId'))
    self.assertEqual(
        'taskId',
        _cloud_api_utils.convert_operation_name_to_task_id(
            'projects/operations/operations/taskId'))
    self.assertEqual(
        'taskId', _cloud_api_utils.convert_operation_name_to_task_id('taskId'))

  def test_convert_task_id_to_operation_name(self):
    self.assertEqual(
        'projects/earthengine-legacy/operations/taskId',
        _cloud_api_utils.convert_task_id_to_operation_name('taskId'))

  def test_encode_number_as_cloud_value(self):
    self.assertEqual({
        'constantValue': 112233
    }, _cloud_api_utils.encode_number_as_cloud_value(112233))
    # Large integer not representable as double.
    self.assertEqual({
        'integerValue': '112233445566778899'
    }, _cloud_api_utils.encode_number_as_cloud_value(112233445566778899))
    # Large integer representable as double.
    self.assertEqual({
        'constantValue': 3.402823669209385e+38
    }, _cloud_api_utils.encode_number_as_cloud_value(1 << 128))

  def test_convert_algorithms(self):
    result = _cloud_api_utils.convert_algorithms({
        'algorithms': [
            {
                'name': 'algorithms/algNoArgs',
                'description': 'desc',
                'returnType': 'ret'
            },
            {
                'name': 'algorithms/algNoDesc',
                'arguments': [
                    {
                        'argumentName': 'argNoDesc'
                    },
                    {
                        'argumentName': 'argOptional',
                        'description': 'descArg',
                        'type': 't',
                        'optional': True,
                        'defaultValue': [1, 2]
                    }]
            },
            {
                'name': 'algorithms/algHidden',
                'description': 'desc',
                'returnType': 'ret',
                'hidden': True
            },
            {
                'name': 'algorithms/algPreview',
                'description': 'desc',
                'returnType': 'ret',
                'preview': True
            },
            {
                'name': 'algorithms/algDeprecated',
                'description': 'desc',
                'returnType': 'ret',
                'deprecated': True,
                'deprecationReason': 'reason'
            }]
    })
    self.assertEqual({
        'algNoArgs': {
            'description': 'desc',
            'returns': 'ret',
            'args': []
        },
        'algNoDesc': {
            'description': '',
            'returns': '',
            'args': [
                {
                    'name': 'argNoDesc',
                    'type': '',
                    'description': ''
                },
                {
                    'name': 'argOptional',
                    'description': 'descArg',
                    'type': 't',
                    'optional': True,
                    'default': [1, 2]
                }]
        },
        'algHidden': {
            'description': 'desc',
            'returns': 'ret',
            'args': [],
            'hidden': True
        },
        'algPreview': {
            'description': 'desc',
            'returns': 'ret',
            'args': [],
            'preview': True
        },
        'algDeprecated': {
            'description': 'desc',
            'returns': 'ret',
            'args': [],
            'deprecated': 'reason'
        }
    }, result)

  def test_convert_to_image_file_format(self):
    self.assertEqual('AUTO_JPEG_PNG',
                     _cloud_api_utils.convert_to_image_file_format(None))
    self.assertEqual('AUTO_JPEG_PNG',
                     _cloud_api_utils.convert_to_image_file_format('auto'))
    self.assertEqual('JPEG',
                     _cloud_api_utils.convert_to_image_file_format('jpg'))
    self.assertEqual('JPEG',
                     _cloud_api_utils.convert_to_image_file_format('jpeg'))
    self.assertEqual('PNG',
                     _cloud_api_utils.convert_to_image_file_format('png'))
    self.assertEqual('GEO_TIFF',
                     _cloud_api_utils.convert_to_image_file_format('GeoTIFF'))
    self.assertEqual('TF_RECORD_IMAGE',
                     _cloud_api_utils.convert_to_image_file_format('TFRecord'))

  def test_convert_to_table_file_format(self):
    self.assertEqual('CSV',
                     _cloud_api_utils.convert_to_table_file_format('csv'))
    self.assertEqual('GEO_JSON',
                     _cloud_api_utils.convert_to_table_file_format('GeoJSON'))
    self.assertEqual('TF_RECORD_TABLE',
                     _cloud_api_utils.convert_to_table_file_format('TFRecord'))

  def test_convert_to_band_list(self):
    self.assertEqual([], _cloud_api_utils.convert_to_band_list(None))
    self.assertEqual(['a'], _cloud_api_utils.convert_to_band_list('a'))
    self.assertEqual(['a', 'b'], _cloud_api_utils.convert_to_band_list('a,b'))
    self.assertEqual(['a', 'b'],
                     _cloud_api_utils.convert_to_band_list(['a', 'b']))

  def test_convert_to_visualization_options(self):
    with self.assertRaises(ee_exception.EEException):
      _cloud_api_utils.convert_to_visualization_options({
          'min': '0,1',
          'max': '2'
      })
    with self.assertRaises(ee_exception.EEException):
      _cloud_api_utils.convert_to_visualization_options({
          'gain': '0,1',
          'bias': '2'
      })
    with self.assertRaises(ee_exception.EEException):
      _cloud_api_utils.convert_to_visualization_options({
          'gain': '0,1',
          'min': '0,1'
      })
    with self.assertRaises(ee_exception.EEException):
      _cloud_api_utils.convert_to_visualization_options({
          'gamma': '2,3'
      })
    with self.assertRaises(ee_exception.EEException):
      _cloud_api_utils.convert_to_visualization_options({'gamma': '0,1'})
    self.assertEqual({
        'ranges': [{'min': 0, 'max': 1}, {'min': 0, 'max': 2}],
        'gamma': {'value': 2.2}
    },
                     _cloud_api_utils.convert_to_visualization_options({
                         'max': '1,2',
                         'gamma': '2.2'
                     }))
    self.assertEqual({
        'ranges': [{'min': 0, 'max': 1}, {'min': -.5, 'max': 0}],
        'paletteColors': ['0', '1', '2']
    },
                     _cloud_api_utils.convert_to_visualization_options({
                         'gain': '2,4',
                         'bias': '0,2',
                         'palette': '0,1,2',
                     }))

  def test_convert_operation_to_task(self):
    self.assertEqual({
        'start_timestamp_ms': 1538676004000,
        'state': 'COMPLETED',
        'description': 'Ingest image: "an/image"',
        'creation_timestamp_ms': 1538676001749,
        'id': '7T42Q7FH4KSIXQKGT6MJFBPX',
        'update_timestamp_ms': 1538676053218,
        'task_type': 'INGEST_IMAGE',
        'destination_uris': ['https://test.com'],
        'name': 'projects/test/operations/7T42Q7FH4KSIXQKGT6MJFBPX',
    },
                     _cloud_api_utils.convert_operation_to_task({
                         'metadata': {
                             'createTime': '2018-10-04T18:00:01.749999Z',
                             'updateTime': '2018-10-04T18:00:53.218488Z',
                             'description': 'Ingest image: "an/image"',
                             'startTime': '2018-10-04T18:00:04Z',
                             'state': 'SUCCEEDED',
                             'endTime': '2018-10-04T18:00:53.218488Z',
                             'type': 'INGEST_IMAGE',
                             'destinationUris': ['https://test.com'],
                         },
                         'done': True,
                         'name':
                             'projects/test/operations/'
                             '7T42Q7FH4KSIXQKGT6MJFBPX',
                     }))

  def test_convert_iam_policy_to_acl(self):
    self.assertEqual({
        'owners': ['user:owner@owner.domain'],
        'writers': [],
        'readers': ['group:readerGroup', 'user:readerUser'],
        'all_users_can_read': True
    }, _cloud_api_utils.convert_iam_policy_to_acl({
        'bindings': [{
            'role': 'roles/owner',
            'members': ['user:owner@owner.domain']
        }, {
            'role': 'roles/viewer',
            'members': ['group:readerGroup', 'allUsers', 'user:readerUser']
        }]
    }))

  def test_convert_acl_to_iam_policy(self):
    self.assertEqual({
        'bindings': [{
            'role': 'roles/owner',
            'members': ['user:owner@owner.domain']
        }, {
            'role': 'roles/viewer',
            'members': ['group:readerGroup', 'user:readerUser', 'allUsers']
        }]
    }, _cloud_api_utils.convert_acl_to_iam_policy({
        'owners': ['user:owner@owner.domain'],
        'writers': [],
        'readers': ['group:readerGroup', 'user:readerUser'],
        'all_users_can_read': True
    }))

  def test_convert_to_grid_dimension(self):
    self.assertEqual({'width': 123, 'height': 123},
                     _cloud_api_utils.convert_to_grid_dimensions(123))
    self.assertEqual({'width': 123, 'height': 123},
                     _cloud_api_utils.convert_to_grid_dimensions((123)))
    self.assertEqual({'width': 123, 'height': 234},
                     _cloud_api_utils.convert_to_grid_dimensions((123, 234)))

  def test_to_image_one_platform_source(self):
    old_sources = [{
        'primaryPath': 'path1',
        'affineTransform': {
            'scaleX': 1,
            'shearX': 2,
            'translateX': 3,
            'shearY': 4,
            'scaleY': 5,
            'translateY': 6,
        }
    }]
    expected = [{
        'uris': ['path1'],
        'affineTransform': {
            'scaleX': 1,
            'shearX': 2,
            'translateX': 3,
            'shearY': 4,
            'scaleY': 5,
            'translateY': 6,
        }
    }]
    self.assertEqual(
        expected,
        _cloud_api_utils.convert_sources_to_one_platform_sources(old_sources))

  def test_to_shape_one_platform_source(self):
    old_sources = [{
        'charset':
            'UTF-8',
        'maxError':
            1,
        'maxVertices':
            100000,
        'primaryPath':
            'gs://ee.google.com.a.appspot.com/qGc_ZVNWLKpokgLv/test.shp',
        'additionalPaths': [
            'gs://ee.google.com.a.appspot.com/qGc_ZVNWLKpokgLv/test.dbf',
            'gs://ee.google.com.a.appspot.com/qGc_ZVNWLKpokgLv/test.prj',
            'gs://ee.google.com.a.appspot.com/qGc_ZVNWLKpokgLv/test.shx',
        ],
    }]
    expected = [{
        'charset':
            'UTF-8',
        'maxErrorMeters':
            1,
        'maxVertices':
            100000,
        'uris': [
            'gs://ee.google.com.a.appspot.com/qGc_ZVNWLKpokgLv/test.shp',
            'gs://ee.google.com.a.appspot.com/qGc_ZVNWLKpokgLv/test.dbf',
            'gs://ee.google.com.a.appspot.com/qGc_ZVNWLKpokgLv/test.prj',
            'gs://ee.google.com.a.appspot.com/qGc_ZVNWLKpokgLv/test.shx',
        ],
    }]
    self.assertEqual(
        expected,
        _cloud_api_utils.convert_sources_to_one_platform_sources(old_sources))

  def test_to_csv_one_platform_source(self):
    old_sources = [{
        'charset':
            'UTF-8',
        'maxError':
            1,
        'maxVertices':
            1000000,
        'geodesic':
            True,
        'primaryGeometryColumn':
            'geometry0',
        'xColumn':
            'x',
        'yColumn':
            'y',
        'primaryPath':
            'gs://ee.google.com.a.appspot.com/qGc_ZVNWLKpokgLv/wildlife.csv',
    }]
    expected = [{
        'charset':
            'UTF-8',
        'maxErrorMeters':
            1,
        'maxVertices':
            1000000,
        'geodesic':
            True,
        'primaryGeometryColumn':
            'geometry0',
        'xColumn':
            'x',
        'yColumn':
            'y',
        'uris': [
            'gs://ee.google.com.a.appspot.com/qGc_ZVNWLKpokgLv/wildlife.csv',
        ],
    }]
    self.assertEqual(
        expected,
        _cloud_api_utils.convert_sources_to_one_platform_sources(old_sources))


if __name__ == '__main__':
  unittest.main()
