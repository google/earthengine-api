#!/usr/bin/env python3
"""Test for the ee.data module."""

import json
from typing import Any, Optional
from unittest import mock

import googleapiclient
import httplib2
import requests

import unittest
import ee
from ee import _cloud_api_utils
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
    name: str, quota: Optional[dict[str, int]] = None
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
    mock.patch.stopall()

  def testIsInitialized(self):
    self.assertFalse(ee.data.is_initialized())
    with apitestcase.UsingCloudApi():
      self.assertTrue(ee.data.is_initialized())

  def testSetMaxRetries_badValues(self):
    with self.assertRaises(ValueError):
      ee.data.setMaxRetries(-1)
    with self.assertRaises(ValueError):
      ee.data.setMaxRetries(100)

  def testSetMaxRetries(self):
    mock_result = {'result': 5}
    original_max_retries = ee.data._max_retries
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
    ee.data._max_retries = original_max_retries

  def testListOperations(self):
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

  def testListOperationsEmptyList(self):
    # Empty lists don't appear at all in the result.
    mock_http = mock.MagicMock(httplib2.Http)
    mock_http.request.return_value = (httplib2.Response({'status': 200}), b'{}')
    with apitestcase.UsingCloudApi(mock_http=mock_http):
      self.assertEqual([], ee.data.listOperations())

  def testCreateAsset(self):
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

  def testCreateAssetWithV1AlphaParams(self):
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

  def testCreateFolder(self):
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

  def testCreateAssets(self):
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

  def testCreateAssets_empty(self):
    cloud_api_resource = mock.MagicMock()
    with apitestcase.UsingCloudApi(cloud_api_resource=cloud_api_resource):
      ee.data.create_assets([], 'FOLDER', False)
      mock_create_asset = cloud_api_resource.projects().assets().create
      mock_create_asset.assert_not_called()

  def testCreateAssets_noOpIfAssetExists(self):
    cloud_api_resource = mock.MagicMock()
    with apitestcase.UsingCloudApi(cloud_api_resource=cloud_api_resource):
      asset_name = 'projects/some-project/assets/some-asset'
      cloud_api_resource.projects().assets().get.execute.return_value = (
          NewFolderAsset(asset_name)
      )
      ee.data.create_assets([asset_name], 'FOLDER', False)
      mock_create_asset = cloud_api_resource.projects().assets().create
      mock_create_asset.assert_not_called()

  def testCreateAssets_withParents(self):
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

  def testStartIngestion(self):
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

  def testSetAssetProperties(self):
    mock_http = mock.MagicMock(httplib2.Http)
    with apitestcase.UsingCloudApi(mock_http=mock_http), mock.patch.object(
        ee.data, 'updateAsset', autospec=True) as mock_update_asset:
      ee.data.setAssetProperties('foo', {
          'mYPropErTy': 'Value',
          'system:time_start': 1
      })
      asset_id = mock_update_asset.call_args[0][0]
      self.assertEqual(asset_id, 'foo')
      asset = mock_update_asset.call_args[0][1]
      self.assertEqual(asset['properties'], {
          'mYPropErTy': 'Value',
          'system:time_start': 1
      })
      update_mask = mock_update_asset.call_args[0][2]
      self.assertSetEqual(
          set(update_mask),
          set(['properties.\"mYPropErTy\"',
               'properties.\"system:time_start\"']))

  def testListAssets(self):
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

  def testListAssetsWithPageSize(self):
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

  def testListAssetsMultiplePages(self):
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

  def testListImages(self):
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

  def testListImagesWithPageSize(self):
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

  def testListImagesMultiplePages(self):
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

  def testListBuckets(self):
    cloud_api_resource = mock.MagicMock()
    with apitestcase.UsingCloudApi(cloud_api_resource=cloud_api_resource):
      mock_result = {'assets': [{'name': 'id1', 'type': 'FOLDER'}]}
      cloud_api_resource.projects().listAssets(
      ).execute.return_value = mock_result
      actual_result = ee.data.listBuckets()
    cloud_api_resource.projects().listAssets().execute.assert_called_once()
    self.assertEqual(mock_result, actual_result)

  def testSimpleGetListViaCloudApi(self):
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

  def testGetListAssetRootViaCloudApi(self):
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

  def testGetListAssetRootViaCloudApiNoSlash(self):
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

  def testComplexGetListViaCloudApi(self):
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

  def testGetMapId(self):
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

  def testGetMapId_withWorkloadTag(self):
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

  def testGetDownloadId(self):
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

  def testGetDownloadId_withWorkloadTag(self):
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

  def testGetDownloadId_withBandList(self):
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

  def testGetDownloadId_withImageID(self):
    cloud_api_resource = mock.MagicMock()
    with apitestcase.UsingCloudApi(cloud_api_resource=cloud_api_resource):
      with self.assertRaisesRegex(ee.ee_exception.EEException,
                                  '^Image ID string is not supported.'):
        ee.data.getDownloadId({'id': 'my-image', 'name': 'dummy'})

  def testGetDownloadId_withSerializedImage(self):
    cloud_api_resource = mock.MagicMock()
    with apitestcase.UsingCloudApi(cloud_api_resource=cloud_api_resource):
      with self.assertRaisesRegex(ee.ee_exception.EEException,
                                  '^Image as JSON string not supported.'):
        ee.data.getDownloadId({
            'image': image.Image('my-image').serialize(),
            'name': 'dummy'
        })

  def testGetThumbId(self):
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

  def testGetThumbId_withWorkloadTag(self):
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

  def testGetTableDownloadId(self):
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

  def testGetTableDownloadId_withWorkloadTag(self):
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

  def testCloudProfilingEnabled(self):
    seen = []

    def ProfileHook(profile_id):
      seen.append(profile_id)

    with ee.data.profiling(ProfileHook):
      with apitestcase.UsingCloudApi(), DoCloudProfileStubHttp(self, True):
        ee.data.listImages({'parent': 'projects/earthengine-public/assets/q'})
    self.assertEqual(['someProfileId'], seen)

  def testCloudProfilingDisabled(self):
    with apitestcase.UsingCloudApi(), DoCloudProfileStubHttp(self, False):
      ee.data.listImages({'parent': 'projects/earthengine-public/assets/q'})

  def testCloudErrorTranslation(self):
    mock_http = mock.MagicMock(httplib2.Http)
    mock_http.request.return_value = (httplib2.Response({'status': 400}),
                                      b'{"error": {"message": "errorly"} }')
    with apitestcase.UsingCloudApi(mock_http=mock_http):
      with self.assertRaisesRegex(ee.ee_exception.EEException, '^errorly$'):
        ee.data.listImages({'parent': 'projects/earthengine-public/assets/q'})

  def testListFeatures(self):
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

  @mock.patch.object(ee.data, '_tile_base_url', new='base_url')
  def testGetFeatureViewTilesKey(self):
    cloud_api_resource = mock.MagicMock()
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

  def testGetProjectConfig(self) -> None:
    cloud_api_resource = mock.MagicMock()
    with apitestcase.UsingCloudApi(cloud_api_resource=cloud_api_resource):
      mock_result = {'fake-project-config-value': 1}
      cloud_api_resource.projects().getConfig().execute.return_value = (
          mock_result
      )
      actual_result = ee.data.getProjectConfig()
      cloud_api_resource.projects().getConfig().execute.assert_called_once()
      self.assertEqual(mock_result, actual_result)

  def testUpdateProjectConfig(self) -> None:
    cloud_api_resource = mock.MagicMock()
    with apitestcase.UsingCloudApi(cloud_api_resource=cloud_api_resource):
      mock_result = {'fake-project-config-value': 1}
      cloud_api_resource.projects().updateConfig().execute.return_value = (
          mock_result
      )
      actual_result = ee.data.updateProjectConfig(
          {'maxConcurrentExports': 2}, ['max_concurrent_exports']
      )
      cloud_api_resource.projects().updateConfig().execute.assert_called_once()
      self.assertEqual(mock_result, actual_result)

  def testWorkloadTag(self):
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

  def testResetWorkloadTagOptParams(self):
    ee.data.setDefaultWorkloadTag('reset-me')
    self.assertEqual('reset-me', ee.data.getWorkloadTag())
    ee.data.resetWorkloadTag(opt_resetDefault=True)
    self.assertEqual('', ee.data.getWorkloadTag())

  def testGetAssetRootQuota_V1Alpha(self):
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

  def testGetAssetRootQuota(self):
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
