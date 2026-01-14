#!/usr/bin/env python3
"""Test for the ee.data module."""

import json
from typing import Any
from unittest import mock

import googleapiclient
import httplib2
import requests

import unittest
import ee
from ee import _cloud_api_utils
from ee import _state
from ee import apitestcase
from ee import featurecollection
from ee import image


def NotFoundError() -> googleapiclient.errors.HttpError:
  """Creates a mock HttpError with a 404 status code."""
  resp = httplib2.Response({'status': '404', 'reason': 'Not Found'})
  content = json.dumps({'error': {'code': 404, 'message': 'Not Found'}}).encode(
      'utf-8'
  )
  return googleapiclient.errors.HttpError(resp, content)


def NewFolderAsset(
    name: str, quota: dict[str, int] | None = None
) -> dict[str, Any]:
  return {
      'type': 'FOLDER',
      'name': name,
      'quota': quota or {},
  }


class DataTest(unittest.TestCase):

  def setUp(self):
    super().setUp()
    mock.patch.object(
        ee.data,
        'getAlgorithms',
        return_value=apitestcase.GetAlgorithms(),
        autospec=True,
    ).start()

  def tearDown(self):
    super().tearDown()
    ee.data.reset()
    mock.patch.stopall()

  def test_is_initialized(self):
    self.assertFalse(ee.data.is_initialized())
    with apitestcase.UsingCloudApi():
      self.assertTrue(ee.data.is_initialized())

  @mock.patch.object(ee.data, '_install_cloud_api_resource', return_value=None)
  def test_initialize(self, mock_install_cloud_api_resource):
    ee.data.initialize()

    self.assertTrue(ee.data.is_initialized())
    mock_install_cloud_api_resource.assert_called_once()

  @mock.patch.object(ee.data, '_install_cloud_api_resource', return_value=None)
  def test_initialize_with_project(
      self, unused_mock_install_cloud_api_resource
  ):
    ee.data.initialize(project='my-project')

    self.assertTrue(ee.data.is_initialized())
    self.assertEqual(
        _state.get_state().cloud_api_user_project, 'my-project'
    )

  @mock.patch.object(ee.data, '_install_cloud_api_resource', return_value=None)
  def test_initialize_with_no_project(
      self, unused_mock_install_cloud_api_resource
  ):
    ee.data.initialize()

    self.assertTrue(ee.data.is_initialized())
    self.assertEqual(
        _state.get_state().cloud_api_user_project, 'earthengine-legacy'
    )

  @mock.patch.object(ee.data, '_install_cloud_api_resource', return_value=None)
  def test_initialize_with_credentials(
      self, unused_mock_install_cloud_api_resource
  ):
    creds = mock.MagicMock()
    ee.data.initialize(credentials=creds)

    self.assertTrue(ee.data.is_initialized())
    self.assertEqual(creds, _state.get_state().credentials)

  @mock.patch.object(ee.data, '_install_cloud_api_resource', return_value=None)
  def test_initialize_with_cloud_api_key(
      self, unused_mock_install_cloud_api_resource
  ):
    cloud_api_key = 'a cloud api key'
    ee.data.initialize(cloud_api_key=cloud_api_key)

    self.assertTrue(ee.data.is_initialized())
    self.assertEqual(cloud_api_key, _state.get_state().cloud_api_key)

  def test_set_max_retries_bad_values(self):
    with self.assertRaises(ValueError):
      ee.data.setMaxRetries(-1)
    with self.assertRaises(ValueError):
      ee.data.setMaxRetries(100)

  def test_set_max_retries(self):
    mock_result = {'result': 5}
    ee.data.setMaxRetries(3)
    cloud_api_resource = mock.MagicMock()
    with apitestcase.UsingCloudApi(cloud_api_resource=cloud_api_resource):
      cloud_api_resource.projects().value().compute().execute.return_value = (
          mock_result
      )
      self.assertEqual(5, ee.data.computeValue(ee.Number(1)))
      self.assertEqual(
          3,
          cloud_api_resource.projects()
          .value()
          .compute()
          .execute.call_args.kwargs['num_retries'],
      )

  def test_set_cloud_api_key(self):
    cloud_api_key = 'a cloud api key'
    with mock.patch.object(
        ee.data, '_install_cloud_api_resource', return_value=None
    ) as mock_install_cloud_api_resource:
      ee.data.setCloudApiKey(cloud_api_key)
      self.assertEqual(cloud_api_key, _state.get_state().cloud_api_key)
      mock_install_cloud_api_resource.assert_called_once()

  def test_set_deadline(self):
    deadline_ms = 12345
    with mock.patch.object(
        ee.data, '_install_cloud_api_resource', return_value=None
    ) as mock_install_cloud_api_resource:
      ee.data.setDeadline(deadline_ms)
      self.assertEqual(deadline_ms, _state.get_state().deadline_ms)
      mock_install_cloud_api_resource.assert_called_once()

  def test_get_set_user_agent(self):
    self.assertIsNone(ee.data.getUserAgent())
    user_agent = 'user-agent'
    ee.data.setUserAgent(user_agent)
    self.assertEqual(user_agent, ee.data.getUserAgent())

  def test_authorize_http_no_credentials(self):
    self.assertIsNone(ee.data._get_state().credentials)
    http = mock.MagicMock()
    self.assertEqual(http, ee.data.authorizeHttp(http))

  def test_authorize_http_with_credentials(self):
    creds = mock.MagicMock()
    ee.data._get_state().credentials = creds
    http = mock.MagicMock()
    with mock.patch.object(
        ee.data.google_auth_httplib2, 'AuthorizedHttp'
    ) as mock_authorized_http:
      result = ee.data.authorizeHttp(http)
      self.assertEqual(mock_authorized_http.return_value, result)
      mock_authorized_http.assert_called_once_with(creds)

  def test_list_operations(self):
    mock_http = mock.MagicMock(httplib2.Http)
    # Return in three groups.
    mock_http.request.side_effect = [
        (httplib2.Response({'status': 200}),
         b'{"operations": [{"name": "name1"}], "nextPageToken": "t1"}'),
        (httplib2.Response({'status': 200}),
         b'{"operations": [{"name": "name2"}], "nextPageToken": "t2"}'),
        (httplib2.Response({'status': 200}),
         b'{"operations": [{"name": "name3"}]}'),
    ]
    with apitestcase.UsingCloudApi(mock_http=mock_http):
      self.assertEqual([{
          'name': 'name1'
      }, {
          'name': 'name2'
      }, {
          'name': 'name3'
      }], ee.data.listOperations())

  def test_list_operations_empty_list(self):
    # Empty lists don't appear at all in the result.
    mock_http = mock.MagicMock(httplib2.Http)
    mock_http.request.return_value = (httplib2.Response({'status': 200}), b'{}')
    with apitestcase.UsingCloudApi(mock_http=mock_http):
      self.assertEqual([], ee.data.listOperations())

  def test_get_operation(self):
    cloud_api_resource = mock.MagicMock()
    with apitestcase.UsingCloudApi(cloud_api_resource=cloud_api_resource):
      name = 'projects/test-project/operations/foo'
      cloud_api_resource.projects().operations().get.execute.return_value = {
          'name': name,
          'done': False,
      }
      ee.data.getOperation(name)
      cloud_api_resource.projects().operations().get.assert_called_once_with(
          name=name
      )

  def test_get_task_status(self):
    cloud_api_resource = mock.MagicMock()
    with apitestcase.UsingCloudApi(cloud_api_resource=cloud_api_resource):
      cloud_api_resource.projects().operations().get.return_value.execute.return_value = {
          'name': 'projects/earthengine-legacy/operations/foo',
          'done': False,
          'metadata': {'state': 'RUNNING'},
      }
      result = ee.data.getTaskStatus('foo')
      cloud_api_resource.projects().operations().get.assert_called_once_with(
          name='projects/earthengine-legacy/operations/foo'
      )
      self.assertEqual(
          result,
          [{
              'id': 'foo',
              'state': 'RUNNING',
              'name': 'projects/earthengine-legacy/operations/foo',
          }],
      )

  def test_get_task_status_with_not_found(self):
    cloud_api_resource = mock.MagicMock()
    with apitestcase.UsingCloudApi(cloud_api_resource=cloud_api_resource):
      cloud_api_resource.projects().operations().get.return_value.execute.side_effect = [
          {
              'name': 'projects/earthengine-legacy/operations/foo',
              'done': False,
              'metadata': {'state': 'RUNNING'},
          },
          NotFoundError(),
          {
              'name': 'projects/earthengine-legacy/operations/bar',
              'done': True,
              'metadata': {'state': 'SUCCEEDED'},
          },
      ]
      result = ee.data.getTaskStatus(['foo', 'missing', 'bar'])
      cloud_api_resource.projects().operations().get.assert_has_calls([
          mock.call(name='projects/earthengine-legacy/operations/foo'),
          mock.call().execute(num_retries=5),
          mock.call(name='projects/earthengine-legacy/operations/missing'),
          mock.call().execute(num_retries=5),
          mock.call(name='projects/earthengine-legacy/operations/bar'),
          mock.call().execute(num_retries=5),
      ])
      self.assertEqual(
          3,
          cloud_api_resource.projects()
          .operations()
          .get.return_value.execute.call_count,
      )
      self.assertEqual(
          result,
          [
              {
                  'id': 'foo',
                  'state': 'RUNNING',
                  'name': 'projects/earthengine-legacy/operations/foo',
              },
              {
                  'id': 'missing',
                  'state': 'UNKNOWN',
                  'name': 'projects/earthengine-legacy/operations/missing',
              },
              {
                  'id': 'bar',
                  'state': 'COMPLETED',
                  'name': 'projects/earthengine-legacy/operations/bar',
              },
          ],
      )

  def test_cancel_operation(self):
    cloud_api_resource = mock.MagicMock()
    with apitestcase.UsingCloudApi(cloud_api_resource=cloud_api_resource):
      cancel_mock = cloud_api_resource.projects().operations().cancel
      cancel_mock.execute.return_value = {}
      ee.data.cancelOperation('projects/test-project/operations/foo')
      cancel_mock.assert_called_once_with(
          name='projects/test-project/operations/foo', body={}
      )

  def test_cancel_task(self):
    cloud_api_resource = mock.MagicMock()
    with apitestcase.UsingCloudApi(cloud_api_resource=cloud_api_resource):
      cancel_mock = cloud_api_resource.projects().operations().cancel
      cancel_mock.execute.return_value = {}
      ee.data.cancelTask('foo')
      cancel_mock.assert_called_once_with(
          name='projects/earthengine-legacy/operations/foo', body={}
      )

  def test_create_asset(self):
    cloud_api_resource = mock.MagicMock()
    with apitestcase.UsingCloudApi(cloud_api_resource=cloud_api_resource):
      mock_result = {
          'type': 'FOLDER',
          'name': 'projects/earthengine-legacy/assets/users/foo/xyz1234',
          'id': 'users/foo/xyz1234',
      }
      cloud_api_resource.projects().assets().create.execute.return_value = (
          mock_result
      )
      ee.data.createAsset({'type': 'FOLDER'}, 'users/foo/xyz123')
      mock_create_asset = cloud_api_resource.projects().assets().create
      mock_create_asset.assert_called_once()
      parent = mock_create_asset.call_args.kwargs['parent']
      self.assertEqual(parent, 'projects/earthengine-legacy')
      asset_id = mock_create_asset.call_args.kwargs['assetId']
      self.assertEqual(asset_id, 'users/foo/xyz123')
      asset = mock_create_asset.call_args.kwargs['body']
      self.assertEqual(asset, {'type': 'FOLDER'})

  def test_create_asset_with_v1alpha_params(self):
    cloud_api_resource = mock.MagicMock()
    with apitestcase.UsingCloudApi(cloud_api_resource=cloud_api_resource):
      mock_result = {
          'type': 'IMAGE',
          'name': 'projects/earthengine-legacy/assets/users/foo/xyz1234',
          'id': 'users/foo/xyz1234',
          'properties': {
              'title': 'My Test Asset',
              'description': 'original description',
              'myProperty': 1,
          },
          'cloudStorageLocation': {'uris': ['gs://my-bucket/path']},
          'tilestoreLocation': {'sources': []},
      }
      cloud_api_resource.projects().assets().create.execute.return_value = (
          mock_result
      )
      test_properties = {
          'myProperty': 1,
          'description': 'original description',
      }
      ee.data.createAsset(
          {
              'type': 'IMAGE',
              'gcs_location': {'uris': ['gs://my-bucket/path']},
              'tilestore_entry': {'sources': []},
              'title': 'My Test Asset',
              'description': 'new description',
              'properties': test_properties,
          },
          'users/foo/xyz123',
      )
      mock_create_asset = cloud_api_resource.projects().assets().create
      mock_create_asset.assert_called_once()
      parent = mock_create_asset.call_args.kwargs['parent']
      self.assertEqual(parent, 'projects/earthengine-legacy')
      asset_id = mock_create_asset.call_args.kwargs['assetId']
      self.assertEqual(asset_id, 'users/foo/xyz123')
      asset = mock_create_asset.call_args.kwargs['body']
      self.assertEqual(
          asset['properties'],
          {
              'title': 'My Test Asset',
              'description': 'original description',
              'myProperty': 1,
          },
      )
      self.assertEqual(test_properties, {
          'myProperty': 1,
          'description': 'original description',
      })
      self.assertEqual(
          asset['cloud_storage_location'],
          {'uris': ['gs://my-bucket/path']},
      )

  def test_create_folder(self):
    cloud_api_resource = mock.MagicMock()
    with apitestcase.UsingCloudApi(cloud_api_resource=cloud_api_resource):
      mock_result = {
          'type': 'FOLDER',
          'name': 'projects/earthengine-legacy/assets/users/foo/xyz1234',
          'id': 'users/foo/xyz1234',
      }
      cloud_api_resource.projects().assets().create.execute.return_value = (
          mock_result
      )
      ee.data.createFolder('users/foo/xyz123')
      mock_create_asset = cloud_api_resource.projects().assets().create
      mock_create_asset.assert_called_once()
      parent = mock_create_asset.call_args.kwargs['parent']
      self.assertEqual(parent, 'projects/earthengine-legacy')
      asset_id = mock_create_asset.call_args.kwargs['assetId']
      self.assertEqual(asset_id, 'users/foo/xyz123')
      asset = mock_create_asset.call_args.kwargs['body']
      self.assertEqual(asset, {'type': 'FOLDER'})

  @mock.patch.object(ee.data, 'createAsset')
  def test_create_asset_home(self, mock_create_asset):
    ee.data.createAssetHome('users/test')
    mock_create_asset.assert_called_once_with({
        'name': 'projects/earthengine-legacy/assets/users/test',
        'type': 'FOLDER',
    })

  def test_create_assets(self):
    cloud_api_resource = mock.MagicMock()
    with apitestcase.UsingCloudApi(cloud_api_resource=cloud_api_resource):
      asset_name = 'projects/some-project/assets/some-asset'
      cloud_api_resource.projects().assets().get().execute.side_effect = (
          NotFoundError()
      )
      ee.data.create_assets([asset_name], 'FOLDER', False)
      mock_create_asset = cloud_api_resource.projects().assets().create
      mock_create_asset.assert_called_once_with(
          parent='projects/some-project',
          assetId='some-asset',
          body={'type': 'FOLDER'},
          prettyPrint=False,
      )

  def test_create_assets_empty(self):
    cloud_api_resource = mock.MagicMock()
    with apitestcase.UsingCloudApi(cloud_api_resource=cloud_api_resource):
      ee.data.create_assets([], 'FOLDER', False)
      mock_create_asset = cloud_api_resource.projects().assets().create
      mock_create_asset.assert_not_called()

  def test_create_assets_no_op_if_asset_exists(self):
    cloud_api_resource = mock.MagicMock()
    with apitestcase.UsingCloudApi(cloud_api_resource=cloud_api_resource):
      asset_name = 'projects/some-project/assets/some-asset'
      cloud_api_resource.projects().assets().get.execute.return_value = (
          NewFolderAsset(asset_name)
      )
      ee.data.create_assets([asset_name], 'FOLDER', False)
      mock_create_asset = cloud_api_resource.projects().assets().create
      mock_create_asset.assert_not_called()

  def test_create_assets_with_parents(self):
    cloud_api_resource = mock.MagicMock()
    with apitestcase.UsingCloudApi(cloud_api_resource=cloud_api_resource):
      asset_name = 'projects/some-project/assets/foo/bar'
      cloud_api_resource.projects().assets().get().execute.side_effect = (
          NotFoundError()
      )
      ee.data.create_assets([asset_name], 'FOLDER', True)
      mock_create_asset = cloud_api_resource.projects().assets().create
      mock_create_asset.assert_has_calls([
          mock.call(
              parent='projects/some-project',
              assetId='foo',
              body={'type': 'FOLDER'},
              prettyPrint=False,
          ),
          mock.call().execute(num_retries=5),
          mock.call(
              parent='projects/some-project',
              assetId='foo/bar',
              body={'type': 'FOLDER'},
              prettyPrint=False,
          ),
          mock.call().execute(num_retries=5),
      ])

  def test_start_ingestion(self):
    cloud_api_resource = mock.MagicMock()
    with apitestcase.UsingCloudApi(cloud_api_resource=cloud_api_resource):
      mock_result = {'name': 'operations/ingestion', 'done': False}
      cloud_api_resource.projects().image().import_().execute.return_value = (
          mock_result
      )
      manifest = {
          'id': 'projects/some-project/assets/some-name',
          'arg': 'something',
      }
      result = ee.data.startIngestion(
          'request_id',
          manifest,
          True
      )
      self.assertEqual(result['id'], 'ingestion')
      self.assertEqual(result['name'], 'operations/ingestion')

      mock_import = cloud_api_resource.projects().image().import_
      import_args = mock_import.call_args.kwargs['body']
      self.assertEqual(
          import_args['imageManifest'],
          {
              'name': 'projects/some-project/assets/some-name',
              'arg': 'something',
          },
      )
      self.assertTrue(import_args['overwrite'])

  def test_start_table_ingestion(self):
    cloud_api_resource = mock.MagicMock()
    with apitestcase.UsingCloudApi(cloud_api_resource=cloud_api_resource):
      mock_result = {'name': 'operations/ingestion', 'done': False}
      cloud_api_resource.projects().table().import_.return_value.execute.return_value = (
          mock_result
      )
      params = {
          'id': 'users/test/table',
          'sources': [{'uris': ['gs://bucket/file.shp'], 'charset': 'UTF-8'}],
      }
      result = ee.data.startTableIngestion('request_id', params, True)
      self.assertEqual(result['id'], 'ingestion')
      self.assertEqual(result['name'], 'operations/ingestion')

      mock_import = cloud_api_resource.projects().table().import_
      mock_import.assert_called_once()
      call_kwargs = mock_import.call_args.kwargs
      self.assertEqual(call_kwargs['project'], 'projects/earthengine-legacy')
      body = call_kwargs['body']
      self.assertEqual(
          body['tableManifest'],
          {
              'name': 'projects/earthengine-legacy/assets/users/test/table',
              'sources': [
                  {'uris': ['gs://bucket/file.shp'], 'charset': 'UTF-8'}
              ],
          },
      )
      self.assertEqual(body['requestId'], 'request_id')
      self.assertTrue(body['overwrite'])

  def test_start_external_image_ingestion(self):
    cloud_api_resource = mock.MagicMock()
    with apitestcase.UsingCloudApi(cloud_api_resource=cloud_api_resource):
      cloud_api_resource.projects().image().importExternal.return_value.execute.return_value = (
          {}
      )
      manifest = {
          'id': 'users/test/image',
          'tilesets': [{'sources': [{'uris': ['gs://bucket/file.tif']}]}],
      }
      result = ee.data.startExternalImageIngestion(manifest, True)
      expected_name = 'projects/earthengine-legacy/assets/users/test/image'
      self.assertEqual(result['name'], expected_name)

      mock_import_external = (
          cloud_api_resource.projects().image().importExternal
      )
      mock_import_external.assert_called_once()
      call_kwargs = mock_import_external.call_args.kwargs
      self.assertEqual(call_kwargs['project'], 'projects/earthengine-legacy')
      body = call_kwargs['body']
      self.assertEqual(
          body['imageManifest'],
          {
              'name': expected_name,
              'tilesets': [{'sources': [{'uris': ['gs://bucket/file.tif']}]}],
          },
      )
      self.assertTrue(body['overwrite'])

  def test_set_asset_properties(self):
    mock_http = mock.MagicMock(httplib2.Http)
    with apitestcase.UsingCloudApi(mock_http=mock_http), mock.patch.object(
        ee.data, 'updateAsset', autospec=True
    ) as mock_update_asset:
      ee.data.setAssetProperties(
          'foo', {'mYPropErTy': 'Value', 'system:time_start': 1}
      )
      asset_id = mock_update_asset.call_args[0][0]
      self.assertEqual(asset_id, 'foo')
      asset = mock_update_asset.call_args[0][1]
      self.assertEqual(
          asset['properties'], {'mYPropErTy': 'Value', 'system:time_start': 1}
      )
      update_mask = mock_update_asset.call_args[0][2]
      self.assertSetEqual(
          set(update_mask),
          {'properties."mYPropErTy"', 'properties."system:time_start"'},
      )

  def test_update_asset(self):
    cloud_api_resource = mock.MagicMock()
    with apitestcase.UsingCloudApi(cloud_api_resource=cloud_api_resource):
      asset_id = 'users/test/asset'
      asset = {'properties': {'foo': 'bar'}}
      update_mask = ['properties.foo']
      ee.data.updateAsset(asset_id, asset, update_mask)
      cloud_api_resource.projects().assets().patch.assert_called_once_with(
          name='projects/earthengine-legacy/assets/users/test/asset',
          body={'updateMask': {'paths': update_mask}, 'asset': asset},
      )

  def test_list_assets(self):
    cloud_api_resource = mock.MagicMock()
    with apitestcase.UsingCloudApi(cloud_api_resource=cloud_api_resource):
      mock_result = {'assets': [{'path': 'id1', 'type': 'type1'}]}
      cloud_api_resource.projects().assets().listAssets(
      ).execute.return_value = mock_result
      cloud_api_resource.projects().assets().listAssets_next.return_value = None
      actual_result = ee.data.listAssets('path/to/folder')
      cloud_api_resource.projects().assets().listAssets(
      ).execute.assert_called_once()
      self.assertEqual(mock_result, actual_result)

  def test_list_assets_with_page_size(self):
    mock_http = mock.MagicMock(httplib2.Http)
    ok_resp = httplib2.Response({'status': 200})
    page = (
        b'{"assets": [{"path": "id1", "type": "type1"}], "nextPageToken": "t1"}'
    )
    mock_http.request.side_effect = [(ok_resp, page)]
    with apitestcase.UsingCloudApi(mock_http=mock_http):
      actual_result = ee.data.listAssets(
          {'parent': 'path/to/folder', 'pageSize': 3}
      )
      expected_result = {
          'assets': [{'path': 'id1', 'type': 'type1'}],
          'nextPageToken': 't1',
      }
      self.assertEqual(expected_result, actual_result)

  def test_list_assets_multiple_pages(self):
    mock_http = mock.MagicMock(httplib2.Http)
    ok_resp = httplib2.Response({'status': 200})
    page1 = (
        b'{"assets": [{"path": "id1", "type": "type1"}], "nextPageToken": "t1"}'
    )
    page2 = (
        b'{"assets": [{"path": "id2", "type": "type2"}], "nextPageToken": "t2"}'
    )
    page3 = b'{"assets": [{"path": "id3", "type": "type3"}]}'
    mock_http.request.side_effect = [
        (ok_resp, page1),
        (ok_resp, page2),
        (ok_resp, page3),
    ]
    with apitestcase.UsingCloudApi(mock_http=mock_http):
      actual_result = ee.data.listAssets('path/to/folder')
      expected_result = {
          'assets': [
              {'path': 'id1', 'type': 'type1'},
              {'path': 'id2', 'type': 'type2'},
              {'path': 'id3', 'type': 'type3'},
          ]
      }
      self.assertEqual(expected_result, actual_result)

  def test_list_images(self):
    cloud_api_resource = mock.MagicMock()
    with apitestcase.UsingCloudApi(cloud_api_resource=cloud_api_resource):
      mock_result = {'assets': [{'path': 'id1', 'type': 'type1'}]}
      cloud_api_resource.projects().assets().listAssets(
      ).execute.return_value = mock_result
      cloud_api_resource.projects().assets().listAssets_next.return_value = None
      actual_result = ee.data.listImages('path/to/folder')
      cloud_api_resource.projects().assets().listAssets(
      ).execute.assert_called_once()
      self.assertEqual({'images': [{
          'path': 'id1',
          'type': 'type1'
      }]}, actual_result)

  def test_list_images_with_page_size(self):
    mock_http = mock.MagicMock(httplib2.Http)
    ok_resp = httplib2.Response({'status': 200})
    page = (
        b'{"assets": [{"path": "id1", "type": "type1"}], "nextPageToken": "t1"}'
    )
    mock_http.request.side_effect = [(ok_resp, page)]
    with apitestcase.UsingCloudApi(mock_http=mock_http):
      actual_result = ee.data.listImages(
          {'parent': 'path/to/folder', 'pageSize': 3}
      )
      expected_result = {
          'images': [{'path': 'id1', 'type': 'type1'}],
          'nextPageToken': 't1',
      }
      self.assertEqual(expected_result, actual_result)

  def test_list_images_multiple_pages(self):
    mock_http = mock.MagicMock(httplib2.Http)
    ok_resp = httplib2.Response({'status': 200})
    page1 = (
        b'{"assets": [{"path": "id1", "type": "type1"}], "nextPageToken": "t1"}'
    )
    page2 = (
        b'{"assets": [{"path": "id2", "type": "type2"}], "nextPageToken": "t2"}'
    )
    page3 = b'{"assets": [{"path": "id3", "type": "type3"}]}'
    mock_http.request.side_effect = [
        (ok_resp, page1),
        (ok_resp, page2),
        (ok_resp, page3),
    ]
    with apitestcase.UsingCloudApi(mock_http=mock_http):
      actual_result = ee.data.listImages('path/to/folder')
      expected_result = {
          'images': [
              {'path': 'id1', 'type': 'type1'},
              {'path': 'id2', 'type': 'type2'},
              {'path': 'id3', 'type': 'type3'},
          ]
      }
      self.assertEqual(expected_result, actual_result)

  def test_list_buckets(self):
    cloud_api_resource = mock.MagicMock()
    with apitestcase.UsingCloudApi(cloud_api_resource=cloud_api_resource):
      mock_result = {'assets': [{'name': 'id1', 'type': 'FOLDER'}]}
      cloud_api_resource.projects().listAssets(
      ).execute.return_value = mock_result
      actual_result = ee.data.listBuckets()
    cloud_api_resource.projects().listAssets().execute.assert_called_once()
    self.assertEqual(mock_result, actual_result)

  def test_get_asset_roots(self):
    with mock.patch.object(
        ee.data,
        'listBuckets',
        return_value={'assets': [{'name': 'id1', 'type': 'FOLDER'}]},
    ) as mock_list_buckets:
      result = ee.data.getAssetRoots()
      mock_list_buckets.assert_called_once()
      self.assertEqual([{'id': 'id1', 'type': 'Folder'}], result)

  def test_simple_get_list_via_cloud_api(self):
    cloud_api_resource = mock.MagicMock()
    with apitestcase.UsingCloudApi(cloud_api_resource=cloud_api_resource):
      mock_result = {'assets': [{'name': 'id1', 'type': 'IMAGE_COLLECTION'}]}
      cloud_api_resource.projects().assets().listAssets(
      ).execute.return_value = mock_result
      actual_result = ee.data.getList({'id': 'glam', 'num': 3})
      expected_params = {
          'parent': 'projects/earthengine-public/assets/glam',
          'pageSize': 3,
          'view': 'BASIC',
      }
      expected_result = [{'id': 'id1', 'type': 'ImageCollection'}]
      cloud_api_resource.projects().assets().listAssets.assert_called_with(
          **expected_params)
      self.assertEqual(expected_result, actual_result)

  def test_get_list_asset_root_via_cloud_api(self):
    cloud_api_resource = mock.MagicMock()
    with apitestcase.UsingCloudApi(cloud_api_resource=cloud_api_resource):
      mock_result = {'assets': [{'name': 'id1', 'type': 'IMAGE_COLLECTION'}]}
      cloud_api_resource.projects().listAssets(
      ).execute.return_value = mock_result
      actual_result = ee.data.getList({
          'id': 'projects/my-project/assets/',
          'num': 3
      })
      expected_params = {
          'parent': 'projects/my-project',
          'pageSize': 3,
          'view': 'BASIC'
      }
      expected_result = [{'id': 'id1', 'type': 'ImageCollection'}]
      cloud_api_resource.projects().listAssets.assert_called_with(
          **expected_params)
      self.assertEqual(expected_result, actual_result)

  def test_get_list_asset_root_via_cloud_api_no_slash(self):
    cloud_api_resource = mock.MagicMock()
    with apitestcase.UsingCloudApi(cloud_api_resource=cloud_api_resource):
      mock_result = {'assets': [{'name': 'id1', 'type': 'IMAGE_COLLECTION'}]}
      cloud_api_resource.projects().listAssets(
      ).execute.return_value = mock_result
      actual_result = ee.data.getList({
          'id': 'projects/my-project/assets',
          'num': 3
      })
      expected_params = {
          'parent': 'projects/my-project',
          'pageSize': 3,
          'view': 'BASIC'
      }
      expected_result = [{'id': 'id1', 'type': 'ImageCollection'}]
      cloud_api_resource.projects().listAssets.assert_called_with(
          **expected_params)
      self.assertEqual(expected_result, actual_result)

  def test_complex_get_list_via_cloud_api(self):
    cloud_api_resource = mock.MagicMock()
    with apitestcase.UsingCloudApi(cloud_api_resource=cloud_api_resource):
      mock_result = {
          'assets': [{
              'name': 'id1',
              'type': 'IMAGE',
              'size_bytes': 1234
          }]
      }
      cloud_api_resource.projects().assets().listAssets(
      ).execute.return_value = mock_result
      actual_result = ee.data.getList({
          'id': 'glam',
          'num': 3,
          'starttime': 3612345,
          'filter': 'foo'
      })
      expected_params = {
          'parent': 'projects/earthengine-public/assets/glam',
          'pageSize': 3,
          'view': 'BASIC',
          'filter': 'foo AND startTime >= "1970-01-01T01:00:12.345000Z"'
      }
      expected_result = [{'id': 'id1', 'type': 'Image'}]
      cloud_api_resource.projects().assets().listAssets.assert_called_with(
          **expected_params)
      self.assertEqual(expected_result, actual_result)

  def test_get_map_id(self):
    cloud_api_resource = mock.MagicMock()
    with apitestcase.UsingCloudApi(cloud_api_resource=cloud_api_resource):
      mock_result = {
          'name': 'projects/earthengine-legacy/maps/DOCID',
      }
      cloud_api_resource.projects().maps().create(
      ).execute.return_value = mock_result
      actual_result = ee.data.getMapId({
          'image': image.Image('my-image'),
      })
      cloud_api_resource.projects().maps().create().execute.assert_called_once()
      self.assertEqual('projects/earthengine-legacy/maps/DOCID',
                       actual_result['mapid'])
      self.assertEqual('', actual_result['token'])
      self.assertIsInstance(actual_result['tile_fetcher'], ee.data.TileFetcher)

  def test_get_map_id_with_workload_tag(self):
    with ee.data.workloadTagContext('mapid-tag'):
      cloud_api_resource = mock.MagicMock()
      with apitestcase.UsingCloudApi(cloud_api_resource=cloud_api_resource):
        mock_result = {
            'name': 'projects/earthengine-legacy/maps/DOCID',
        }
        cloud_api_resource.projects().maps().create(
        ).execute.return_value = mock_result
        ee.data.getMapId({
            'image': image.Image('my-image'),
        })
        self.assertEqual(
            'mapid-tag',
            cloud_api_resource.projects().maps().create.call_args_list[1]
            .kwargs['workloadTag'])

  def test_get_map_id_with_string_image(self):
    cloud_api_resource = mock.MagicMock()
    with apitestcase.UsingCloudApi(cloud_api_resource=cloud_api_resource):
      with self.assertRaisesRegex(
          ee.ee_exception.EEException, '^Image as JSON string not supported.'
      ):
        ee.data.getMapId({'image': 'my-image'})

  def test_get_map_id_with_version(self):
    cloud_api_resource = mock.MagicMock()
    with apitestcase.UsingCloudApi(cloud_api_resource=cloud_api_resource):
      with self.assertRaisesRegex(
          ee.ee_exception.EEException,
          '^Image version specification not supported.',
      ):
        ee.data.getMapId({
            'image': image.Image('my-image'),
            'version': '123',
        })

  def test_get_map_id_with_vis_params(self):
    cloud_api_resource = mock.MagicMock()
    with apitestcase.UsingCloudApi(cloud_api_resource=cloud_api_resource):
      mock_result = {
          'name': 'projects/earthengine-legacy/maps/DOCID',
      }
      cloud_api_resource.projects().maps().create().execute.return_value = (
          mock_result
      )
      vis_params = {'paletteColors': ['FF0000']}
      ee.data.getMapId({
          'image': image.Image('my-image'),
          'palette': 'FF0000',
      })
      self.assertEqual(
          2, cloud_api_resource.projects().maps().create.call_count
      )
      kwargs = (
          cloud_api_resource.projects().maps().create.call_args_list[1].kwargs
      )
      self.assertIn('body', kwargs)
      self.assertIn('visualizationOptions', kwargs['body'])
      self.assertEqual(vis_params, kwargs['body']['visualizationOptions'])

  def test_get_map_id_with_cloud_api_key(self):
    cloud_api_resource = mock.MagicMock()
    with apitestcase.UsingCloudApi(cloud_api_resource=cloud_api_resource):
      custom_url = 'https://example.test'
      ee.data._get_state().cloud_api_key = 'my-api-key'
      ee.data._get_state().tile_base_url = custom_url

      mock_result = {
          'name': 'projects/earthengine-legacy/maps/DOCID',
      }
      cloud_api_resource.projects().maps().create().execute.return_value = (
          mock_result
      )
      actual_result = ee.data.getMapId({
          'image': image.Image('my-image'),
      })
      expected_url = (
          custom_url
          + '/v1/projects/earthengine-legacy/maps/DOCID/tiles/{z}/{x}/{y}'
          '?key=my-api-key'
      )
      self.assertEqual(expected_url, actual_result['tile_fetcher'].url_format)

  def test_get_map_id_no_cloud_api_key(self):
    cloud_api_resource = mock.MagicMock()
    with apitestcase.UsingCloudApi(cloud_api_resource=cloud_api_resource):
      custom_url = 'https://example.test'
      ee.data._get_state().cloud_api_key = None
      ee.data._get_state().tile_base_url = custom_url
      mock_result = {
          'name': 'projects/earthengine-legacy/maps/DOCID',
      }
      cloud_api_resource.projects().maps().create().execute.return_value = (
          mock_result
      )
      actual_result = ee.data.getMapId({'image': image.Image('my-image')})
      expected_url = (
          custom_url
          + '/v1/projects/earthengine-legacy/maps/DOCID/tiles/{z}/{x}/{y}'
      )
      self.assertEqual(expected_url, actual_result['tile_fetcher'].url_format)

  def test_get_thumbnail_default(self):
    cloud_api_resource_raw = mock.MagicMock()
    with apitestcase.UsingCloudApi(
        cloud_api_resource_raw=cloud_api_resource_raw
    ):
      thumb_id = 'projects/earthengine-legacy/thumbnails/some-id'
      thumb_id_result = {'thumbid': thumb_id}
      img = image.Image('my-image')
      img.getThumbId = mock.Mock(return_value=thumb_id_result)
      params = {'image': img}
      (
          cloud_api_resource_raw.projects()
          .thumbnails()
          .getPixels.return_value.execute.return_value
      ) = b'pixel data'
      result = ee.data.getThumbnail(params)
      self.assertEqual(b'pixel data', result)
      img.getThumbId.assert_called_once_with(params)
      cloud_api_resource_raw.projects().thumbnails().getPixels.assert_called_once_with(
          name=thumb_id
      )

  def test_get_thumbnail_video(self):
    cloud_api_resource_raw = mock.MagicMock()
    with apitestcase.UsingCloudApi(
        cloud_api_resource_raw=cloud_api_resource_raw
    ):
      thumb_id = 'projects/earthengine-legacy/videoThumbnails/some-id'
      thumb_id_result = {'thumbid': thumb_id}
      img = image.Image('my-image')
      img.getThumbId = mock.Mock(return_value=thumb_id_result)
      params = {'image': img}
      (
          cloud_api_resource_raw.projects()
          .videoThumbnails()
          .getPixels.return_value.execute.return_value
      ) = b'video data'
      result = ee.data.getThumbnail(params, thumbType='video')
      self.assertEqual(b'video data', result)
      img.getThumbId.assert_called_once_with(params)
      cloud_api_resource_raw.projects().videoThumbnails().getPixels.assert_called_once_with(
          name=thumb_id
      )

  def test_get_thumbnail_filmstrip(self):
    cloud_api_resource_raw = mock.MagicMock()
    with apitestcase.UsingCloudApi(
        cloud_api_resource_raw=cloud_api_resource_raw
    ):
      thumb_id = 'projects/earthengine-legacy/filmstripThumbnails/some-id'
      thumb_id_result = {'thumbid': thumb_id}
      img = image.Image('my-image')
      img.getThumbId = mock.Mock(return_value=thumb_id_result)
      params = {'image': img}
      (
          cloud_api_resource_raw.projects()
          .filmstripThumbnails()
          .getPixels.return_value.execute.return_value
      ) = b'filmstrip data'
      result = ee.data.getThumbnail(params, thumbType='filmstrip')
      self.assertEqual(b'filmstrip data', result)
      img.getThumbId.assert_called_once_with(params)
      cloud_api_resource_raw.projects().filmstripThumbnails().getPixels.assert_called_once_with(
          name=thumb_id
      )

  def test_get_download_id(self):
    cloud_api_resource = mock.MagicMock()
    with apitestcase.UsingCloudApi(cloud_api_resource=cloud_api_resource):
      mock_result = {'name': 'projects/earthengine-legacy/thumbnails/DOCID'}
      cloud_api_resource.projects().thumbnails().create(
      ).execute.return_value = mock_result
      actual_result = ee.data.getDownloadId({
          'image': image.Image('my-image'),
          'name': 'dummy'
      })
      cloud_api_resource.projects().thumbnails().create(
      ).execute.assert_called_once()
      self.assertEqual(
          {
              'docid': 'projects/earthengine-legacy/thumbnails/DOCID',
              'token': ''
          }, actual_result)

  def test_get_download_id_with_workload_tag(self):
    with ee.data.workloadTagContext('downloadid-tag'):
      cloud_api_resource = mock.MagicMock()
      with apitestcase.UsingCloudApi(cloud_api_resource=cloud_api_resource):
        mock_result = {'name': 'projects/earthengine-legacy/thumbnails/DOCID'}
        cloud_api_resource.projects().thumbnails().create(
        ).execute.return_value = mock_result
        ee.data.getDownloadId({
            'image': image.Image('my-image'),
            'name': 'dummy'
        })
        self.assertEqual(
            'downloadid-tag',
            cloud_api_resource.projects().thumbnails().create.call_args
            .kwargs['workloadTag'])

  def test_get_download_id_with_band_list(self):
    cloud_api_resource = mock.MagicMock()
    with apitestcase.UsingCloudApi(cloud_api_resource=cloud_api_resource):
      mock_result = {'name': 'projects/earthengine-legacy/thumbnails/DOCID'}
      cloud_api_resource.projects().thumbnails().create(
      ).execute.return_value = mock_result
      actual_result = ee.data.getDownloadId({
          'image': image.Image('my-image'),
          'name': 'dummy',
          'bands': ['B1', 'B2', 'B3']
      })
      cloud_api_resource.projects().thumbnails().create(
      ).execute.assert_called_once()
      self.assertEqual(
          {
              'docid': 'projects/earthengine-legacy/thumbnails/DOCID',
              'token': ''
          }, actual_result)

  def test_get_download_id_with_image_id(self):
    cloud_api_resource = mock.MagicMock()
    with apitestcase.UsingCloudApi(cloud_api_resource=cloud_api_resource):
      with self.assertRaisesRegex(ee.ee_exception.EEException,
                                  '^Image ID string is not supported.'):
        ee.data.getDownloadId({'id': 'my-image', 'name': 'dummy'})

  def test_get_download_id_with_serialized_image(self):
    cloud_api_resource = mock.MagicMock()
    with apitestcase.UsingCloudApi(cloud_api_resource=cloud_api_resource):
      with self.assertRaisesRegex(ee.ee_exception.EEException,
                                  '^Image as JSON string not supported.'):
        ee.data.getDownloadId({
            'image': image.Image('my-image').serialize(),
            'name': 'dummy'
        })

  def test_get_thumb_id(self):
    cloud_api_resource = mock.MagicMock()
    with apitestcase.UsingCloudApi(cloud_api_resource=cloud_api_resource):
      mock_result = {'name': 'projects/earthengine-legacy/thumbnails/DOCID'}
      cloud_api_resource.projects().thumbnails().create(
      ).execute.return_value = mock_result
      actual_result = ee.data.getThumbId({
          'image': image.Image('my-image'),
          'name': 'dummy'
      })
      cloud_api_resource.projects().thumbnails().create(
      ).execute.assert_called_once()
      self.assertEqual(
          {
              'thumbid': 'projects/earthengine-legacy/thumbnails/DOCID',
              'token': ''
          }, actual_result)

  def test_get_thumb_id_with_workload_tag(self):
    with ee.data.workloadTagContext('thumbid-tag'):
      cloud_api_resource = mock.MagicMock()
      with apitestcase.UsingCloudApi(cloud_api_resource=cloud_api_resource):
        mock_result = {'name': 'projects/earthengine-legacy/thumbnails/DOCID'}
        cloud_api_resource.projects().thumbnails().create(
        ).execute.return_value = mock_result
        ee.data.getThumbId({'image': image.Image('my-image'), 'name': 'dummy'})
        self.assertEqual(
            'thumbid-tag',
            cloud_api_resource.projects().thumbnails().create.call_args
            .kwargs['workloadTag'])

  def test_make_thumb_url_with_api_key(self):
    cloud_api_resource = mock.MagicMock()
    with apitestcase.UsingCloudApi(cloud_api_resource=cloud_api_resource):
      ee.data._get_state().cloud_api_key = 'my-api-key'
      thumb_id = {'thumbid': 'projects/earthengine-legacy/thumbnails/some-id'}
      url = ee.data.makeThumbUrl(thumb_id)
      self.assertIn('?key=my-api-key', url)

  def test_get_table_download_id(self):
    cloud_api_resource = mock.MagicMock()
    with apitestcase.UsingCloudApi(cloud_api_resource=cloud_api_resource):
      mock_result = {'name': 'projects/earthengine-legacy/table/DOCID'}
      cloud_api_resource.projects().tables().create(
      ).execute.return_value = mock_result
      actual_result = ee.data.getTableDownloadId({
          'table': featurecollection.FeatureCollection('my-fc'),
          'filename': 'dummy'
      })
      cloud_api_resource.projects().tables().create(
      ).execute.assert_called_once()
      self.assertEqual(
          {
              'docid': 'projects/earthengine-legacy/table/DOCID',
              'token': ''
          }, actual_result)

  def test_get_table_download_id_with_workload_tag(self):
    with ee.data.workloadTagContext('tableid-tag'):
      cloud_api_resource = mock.MagicMock()
      with apitestcase.UsingCloudApi(cloud_api_resource=cloud_api_resource):
        mock_result = {'name': 'projects/earthengine-legacy/thumbnails/DOCID'}
        cloud_api_resource.projects().tables().create(
        ).execute.return_value = mock_result
        ee.data.getTableDownloadId({
            'table': featurecollection.FeatureCollection('my-fc'),
            'filename': 'dummy'
        })
        self.assertEqual(
            'tableid-tag',
            cloud_api_resource.projects().tables().create.call_args
            .kwargs['workloadTag'])

  def test_cloud_profiling_enabled(self):
    seen = []

    def ProfileHook(profile_id):
      seen.append(profile_id)

    with ee.data.profiling(ProfileHook):
      with apitestcase.UsingCloudApi(), DoCloudProfileStubHttp(self, True):
        ee.data.listImages({'parent': 'projects/earthengine-public/assets/q'})
    self.assertEqual(['someProfileId'], seen)

  def test_cloud_profiling_disabled(self):
    with apitestcase.UsingCloudApi(), DoCloudProfileStubHttp(self, False):
      ee.data.listImages({'parent': 'projects/earthengine-public/assets/q'})

  def test_cloud_error_translation(self):
    mock_http = mock.MagicMock(httplib2.Http)
    mock_http.request.return_value = (httplib2.Response({'status': 400}),
                                      b'{"error": {"message": "errorly"} }')
    with apitestcase.UsingCloudApi(mock_http=mock_http):
      with self.assertRaisesRegex(ee.ee_exception.EEException, '^errorly$'):
        ee.data.listImages({'parent': 'projects/earthengine-public/assets/q'})

  def test_list_features(self):
    cloud_api_resource = mock.MagicMock()
    with apitestcase.UsingCloudApi(cloud_api_resource=cloud_api_resource):
      mock_result = {
          'type':
              'FeatureCollection',
          'features': [{
              'type': 'Feature',
              'properties': {
                  'baz': 'qux',
                  'foo': 'bar',
                  'system:index': '0'
              }
          }]
      }
      cloud_api_resource.projects().assets().listFeatures(
      ).execute.return_value = mock_result
      actual_result = ee.data.listFeatures({
          'assetId':
              'users/userfoo/foobar',
          'region':
              '{\"type\":\"Polygon\",\"coordinates\":[[[-96,42],[-95,42],[-95,43],[-96,43],[-96,42]]]}'
      })
      cloud_api_resource.projects().assets().listFeatures(
      ).execute.assert_called_once()
      self.assertEqual(mock_result, actual_result)

  def test_get_pixels(self):
    cloud_api_resource_raw = mock.MagicMock()
    with apitestcase.UsingCloudApi(
        cloud_api_resource_raw=cloud_api_resource_raw
    ):
      assets = cloud_api_resource_raw.projects().assets()
      mock_result = b'pixel data'
      assets.getPixels.return_value.execute.return_value = mock_result
      asset_id = 'users/foo/bar'
      params = {'assetId': asset_id}
      result = ee.data.getPixels(params)
      self.assertEqual(mock_result, result)
      assets.getPixels.assert_called_once_with(
          name='projects/earthengine-legacy/assets/users/foo/bar',
          body={'fileFormat': 'AUTO_JPEG_PNG'},
      )

  def test_compute_pixels(self):
    cloud_api_resource_raw = mock.MagicMock()
    with apitestcase.UsingCloudApi(
        cloud_api_resource_raw=cloud_api_resource_raw
    ):
      mock_result = b'pixel data'
      (
          cloud_api_resource_raw.projects()
          .image()
          .computePixels.return_value.execute.return_value
      ) = mock_result
      expression = ee.Image(1)
      params = {'expression': expression}
      result = ee.data.computePixels(params)
      self.assertEqual(mock_result, result)
      (
          cloud_api_resource_raw.projects()
          .image()
          .computePixels.assert_called_once_with(
              project='projects/earthengine-legacy',
              body={
                  'expression': ee.serializer.encode(expression),
                  'fileFormat': 'AUTO_JPEG_PNG',
              },
          )
      )

  def test_get_feature_view_tiles_key(self):
    cloud_api_resource = mock.MagicMock()
    _state.get_state().tile_base_url = 'base_url'
    with apitestcase.UsingCloudApi(cloud_api_resource=cloud_api_resource):
      mock_name = 'projects/projectfoo/featureView/tiles-key-foo'
      mock_result = {'name': mock_name}
      cloud_api_resource.projects().featureView().create(
      ).execute.return_value = mock_result
      actual_result = ee.data.getFeatureViewTilesKey({
          'assetId': 'projects/projectfoo/assets/assetbar',
      })
      cloud_api_resource.projects().featureView().create(
      ).execute.assert_called_once()
      expected_keys = [
          'token',
          'formatTileUrl',
      ]
      self.assertEqual(expected_keys, list(actual_result.keys()))
      self.assertEqual('tiles-key-foo', actual_result['token'])
      self.assertEqual(
          f'base_url/{_cloud_api_utils.VERSION}/{mock_name}/tiles/7/5/6',
          actual_result['formatTileUrl'](5, 6, 7))

  def test_get_project_config(self) -> None:
    cloud_api_resource = mock.MagicMock()
    with apitestcase.UsingCloudApi(cloud_api_resource=cloud_api_resource):
      mock_result = {'fake-project-config-value': 1}
      cloud_api_resource.projects().getConfig().execute.return_value = (
          mock_result
      )
      actual_result = ee.data.getProjectConfig()
      cloud_api_resource.projects().getConfig().execute.assert_called_once()
      self.assertEqual(mock_result, actual_result)

  def test_update_project_config(self) -> None:
    cloud_api_resource = mock.MagicMock()
    with apitestcase.UsingCloudApi(cloud_api_resource=cloud_api_resource):
      mock_result = {'fake-project-config-value': 1}
      cloud_api_resource.projects().updateConfig().execute.return_value = (
          mock_result
      )
      project_config = {'maxConcurrentExports': 2}
      actual_result = ee.data.updateProjectConfig(
          project_config, ['max_concurrent_exports']
      )
      cloud_api_resource.projects().updateConfig.assert_called_with(
          name='projects/earthengine-legacy/config',
          body=project_config,
          updateMask='max_concurrent_exports',
      )
      cloud_api_resource.projects().updateConfig().execute.assert_called_once()
      self.assertEqual(mock_result, actual_result)

  def test_update_project_config_no_mask(self) -> None:
    cloud_api_resource = mock.MagicMock()
    with apitestcase.UsingCloudApi(cloud_api_resource=cloud_api_resource):
      mock_result = {'fake-project-config-value': 1}
      cloud_api_resource.projects().updateConfig().execute.return_value = (
          mock_result
      )
      project_config = {'maxConcurrentExports': 2}
      actual_result = ee.data.updateProjectConfig(project_config)
      cloud_api_resource.projects().updateConfig.assert_called_with(
          name='projects/earthengine-legacy/config',
          body=project_config,
          updateMask='max_concurrent_exports',
      )
      cloud_api_resource.projects().updateConfig().execute.assert_called_once()
      self.assertEqual(mock_result, actual_result)

  def test_workload_tag(self):
    self.assertEqual('', ee.data.getWorkloadTag())
    ee.data.setDefaultWorkloadTag(None)
    self.assertEqual('', ee.data.getWorkloadTag())
    ee.data.setDefaultWorkloadTag('')
    self.assertEqual('', ee.data.getWorkloadTag())
    ee.data.setDefaultWorkloadTag(0)
    self.assertEqual('0', ee.data.getWorkloadTag())
    ee.data.setDefaultWorkloadTag(123)
    self.assertEqual('123', ee.data.getWorkloadTag())

    with self.assertRaisesRegex(ValueError, 'Invalid tag'):
      ee.data.setDefaultWorkloadTag('inv@lid')

    with self.assertRaisesRegex(ValueError, 'Invalid tag'):
      ee.data.setDefaultWorkloadTag('in.valid')

    with self.assertRaisesRegex(ValueError, 'Invalid tag'):
      ee.data.setDefaultWorkloadTag('Invalid')

    with self.assertRaisesRegex(ValueError, 'Invalid tag'):
      ee.data.setDefaultWorkloadTag('-invalid')

    with self.assertRaisesRegex(ValueError, 'Invalid tag'):
      ee.data.setDefaultWorkloadTag('invalid_')

    with self.assertRaisesRegex(ValueError, 'Invalid tag'):
      ee.data.setDefaultWorkloadTag('i' * 64)

    ee.data.setDefaultWorkloadTag('default-tag')
    self.assertEqual('default-tag', ee.data.getWorkloadTag())

    ee.data.setWorkloadTag('exports-1')
    self.assertEqual('exports-1', ee.data.getWorkloadTag())

    ee.data.setWorkloadTag('exports-2')
    self.assertEqual('exports-2', ee.data.getWorkloadTag())

    ee.data.resetWorkloadTag()
    self.assertEqual('default-tag', ee.data.getWorkloadTag())

    with ee.data.workloadTagContext('in-context'):
      self.assertEqual('in-context', ee.data.getWorkloadTag())

    self.assertEqual('default-tag', ee.data.getWorkloadTag())

    ee.data.setWorkloadTag('reset-me')
    self.assertEqual('reset-me', ee.data.getWorkloadTag())

    ee.data.setWorkloadTag('')
    self.assertEqual('', ee.data.getWorkloadTag())

    ee.data.setDefaultWorkloadTag('reset-me')
    self.assertEqual('reset-me', ee.data.getWorkloadTag())

    ee.data.resetWorkloadTag(True)
    self.assertEqual('', ee.data.getWorkloadTag())

  def test_reset_workload_tag_opt_params(self):
    ee.data.setDefaultWorkloadTag('reset-me')
    self.assertEqual('reset-me', ee.data.getWorkloadTag())
    ee.data.resetWorkloadTag(opt_resetDefault=True)
    self.assertEqual('', ee.data.getWorkloadTag())

  def test_get_asset_root_quota_v1alpha(self):
    cloud_api_resource = mock.MagicMock()
    with apitestcase.UsingCloudApi(cloud_api_resource=cloud_api_resource):
      fake_asset = {
          'type': 'FOLDER',
          'name': 'projects/test-proj/assets',
          'quota': {
              'assetCount': 123,
              'maxAssets': 456,
              'sizeBytes': 789,
              'maxSizeBytes': 1001,
          },
      }
      cloud_api_resource.projects().assets().get().execute.return_value = (
          fake_asset
      )

      quota = ee.data.getAssetRootQuota('projects/test-proj/assets')
      expected = {
          'asset_count': {'usage': 123, 'limit': 456},
          'asset_size': {'usage': 789, 'limit': 1001},
      }
      self.assertEqual(expected, quota)

  def test_get_asset_root_quota(self):
    cloud_api_resource = mock.MagicMock()
    with apitestcase.UsingCloudApi(cloud_api_resource=cloud_api_resource):
      fake_asset = {
          'type': 'FOLDER',
          'name': 'projects/test-proj/assets',
          'quota': {
              'assetCount': 123,
              'maxAssetCount': 456,
              'sizeBytes': 789,
              'maxSizeBytes': 1001,
          },
      }
      cloud_api_resource.projects().assets().get().execute.return_value = (
          fake_asset
      )

      quota = ee.data.getAssetRootQuota('projects/test-proj/assets')
      expected = {
          'asset_count': {'usage': 123, 'limit': 456},
          'asset_size': {'usage': 789, 'limit': 1001},
      }
      self.assertEqual(expected, quota)

  def test_get_asset_root_quota_not_root(self):
    cloud_api_resource = mock.MagicMock()
    with apitestcase.UsingCloudApi(cloud_api_resource=cloud_api_resource):
      asset_id = 'users/test/asset'
      fake_asset = {
          'type': 'IMAGE',
          'name': 'projects/earthengine-legacy/assets/users/test/asset',
      }
      cloud_api_resource.projects().assets().get().execute.return_value = (
          fake_asset
      )
      with self.assertRaisesRegex(
          ee.ee_exception.EEException, f'{asset_id} is not a root folder.'
      ):
        ee.data.getAssetRootQuota(asset_id)

  def test_get_iam_policy(self):
    cloud_api_resource = mock.MagicMock()
    with apitestcase.UsingCloudApi(cloud_api_resource=cloud_api_resource):
      asset_id = 'users/test/asset'
      ee.data.getIamPolicy(asset_id)
      cloud_api_resource.projects().assets().getIamPolicy.assert_called_once_with(
          resource='projects/earthengine-legacy/assets/users/test/asset',
          body={},
          prettyPrint=False,
      )

  def test_get_asset_acl(self):
    asset_id = 'users/test/asset'
    policy = {'bindings': [{'role': 'roles/viewer', 'members': ['allUsers']}]}
    acl = {'readers': ['allUsers']}
    with mock.patch.object(
        ee.data, 'getIamPolicy', return_value=policy
    ) as mock_get_iam_policy, mock.patch.object(
        ee.data._cloud_api_utils, 'convert_iam_policy_to_acl', return_value=acl
    ) as mock_convert:
      result = ee.data.getAssetAcl(asset_id)
      mock_get_iam_policy.assert_called_once_with(asset_id)
      mock_convert.assert_called_once_with(policy)
      self.assertEqual(acl, result)

  def test_set_asset_acl(self):
    asset_id = 'users/test/asset'
    acl_update_dict = {'readers': ['allUsers']}
    acl_update_str = '{"readers": ["allUsers"]}'
    policy = {'bindings': [{'role': 'roles/viewer', 'members': ['allUsers']}]}
    with mock.patch.object(
        ee.data._cloud_api_utils,
        'convert_acl_to_iam_policy',
        return_value=policy,
    ) as mock_convert, mock.patch.object(
        ee.data, 'setIamPolicy'
    ) as mock_set_iam_policy:
      ee.data.setAssetAcl(asset_id, acl_update_dict)
      mock_convert.assert_called_once_with(acl_update_dict)
      mock_set_iam_policy.assert_called_once_with(asset_id, policy)

      mock_convert.reset_mock()
      mock_set_iam_policy.reset_mock()
      ee.data.setAssetAcl(asset_id, acl_update_str)
      mock_convert.assert_called_once_with(acl_update_dict)
      mock_set_iam_policy.assert_called_once_with(asset_id, policy)

  def test_set_iam_policy(self):
    cloud_api_resource = mock.MagicMock()
    with apitestcase.UsingCloudApi(cloud_api_resource=cloud_api_resource):
      asset_id = 'users/test/asset'
      policy = {'bindings': [{'role': 'roles/viewer', 'members': ['allUsers']}]}
      ee.data.setIamPolicy(asset_id, policy)
      cloud_api_resource.projects().assets().setIamPolicy.assert_called_once_with(
          resource='projects/earthengine-legacy/assets/users/test/asset',
          body={'policy': policy},
          prettyPrint=False,
      )


def DoCloudProfileStubHttp(test, expect_profiling):

  def MockRequest(self, method, uri, data, headers, timeout):
    del self  # Unused.
    del method, uri, data, timeout  # Unused
    test.assertEqual(expect_profiling, ee.data._PROFILE_REQUEST_HEADER
                     in headers)
    response = requests.Response()
    response.status_code = 200
    response._content = '{"data": "dummy_data"}'
    if expect_profiling:
      response.headers[
          ee.data._PROFILE_RESPONSE_HEADER_LOWERCASE] = 'someProfileId'
    return response

  return mock.patch.object(requests.Session, 'request', new=MockRequest)


if __name__ == '__main__':
  unittest.main()
