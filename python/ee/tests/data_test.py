#!/usr/bin/env python


import httplib2
import mock


from six.moves import urllib
import unittest
import ee
from ee import apitestcase
import ee.image as image


class DataTest(unittest.TestCase):

  def setUp(self):
    super(DataTest, self).setUp()
    # Default this to false.  Eventually this should default to true.
    ee.data._use_cloud_api = False

  def testGetTaskList(self):

    def Request(unused_self, url, method, body, headers):
      _ = method, body, headers  # Unused kwargs.

      parse_result = urllib.parse.urlparse(url)
      if parse_result.path != '/api/tasklist':
        return httplib2.Response({'status': 404}), 'not found'

      resp_body = '{}'
      query_args = urllib.parse.parse_qs(parse_result.query)
      if query_args == {'pagesize': ['500']}:
        resp_body = ('{"data": {"tasks": [{"id": "1"}],'
                     ' "next_page_token": "foo"}}')
      elif query_args == {'pagesize': ['500'], 'pagetoken': ['foo']}:
        resp_body = '{"data": {"tasks": [{"id": "2"}]}}'

      response = httplib2.Response({
          'status': 200,
          'content-type': 'application/json',
      })
      return response, resp_body

    with mock.patch('httplib2.Http.request', new=Request):
      self.assertEqual([{'id': '1'}, {'id': '2'}], ee.data.getTaskList())

  def testListOperations(self):
    mock_http = mock.MagicMock(httplib2.Http)
    # Return in three groups.
    mock_http.request.side_effect = [
        (httplib2.Response({
            'status': 200
        }), b'{"operations": [{"name": "name1"}], "nextPageToken": "t1"}'),
        (httplib2.Response({
            'status': 200
        }), b'{"operations": [{"name": "name2"}], "nextPageToken": "t2"}'),
        (httplib2.Response({
            'status': 200
        }), b'{"operations": [{"name": "name3"}]}'),
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

  @mock.patch('time.sleep')
  def testSuccess(self, mock_sleep):
    with DoStubHttp(200, 'application/json', '{"data": "bar"}'):
      self.assertEqual('bar', ee.data.send_('/foo', {}))
    self.assertEqual(False, mock_sleep.called)

  @mock.patch('time.sleep')
  def testRetry(self, mock_sleep):
    with DoStubHttp(429, 'application/json', '{"data": "bar"}'):
      with self.assertRaises(ee.ee_exception.EEException):
        ee.data.send_('/foo', {})
    self.assertEqual(5, mock_sleep.call_count)

  def testNon200Success(self):
    with DoStubHttp(202, 'application/json', '{"data": "bar"}'):
      self.assertEqual('bar', ee.data.send_('/foo', {}))

  def testJsonSyntaxError(self):
    with DoStubHttp(200, 'application/json', '{"data"}'):
      with self.assertRaises(ee.ee_exception.EEException) as cm:
        ee.data.send_('/foo', {})
      self.assertEqual('Invalid JSON: {"data"}', str(cm.exception))

  def testJsonStructureError(self):
    with DoStubHttp(200, 'application/json', '{}'):
      with self.assertRaises(ee.ee_exception.EEException) as cm:
        ee.data.send_('/foo', {})
      self.assertEqual('Malformed response: {}', str(cm.exception))

  def testUnexpectedStatus(self):
    with DoStubHttp(418, 'text/html', '<html>'):
      with self.assertRaises(ee.ee_exception.EEException) as cm:
        ee.data.send_('/foo', {})
      self.assertEqual('Server returned HTTP code: 418. Reason: Ok.',
                       str(cm.exception))

  def testJson200Error(self):
    with DoStubHttp(200, 'application/json',
                    '{"error": {"code": 500, "message": "bar"}}'):
      with self.assertRaises(ee.ee_exception.EEException) as cm:
        ee.data.send_('/foo', {})
      self.assertEqual(u'bar', str(cm.exception))

  def testJsonNon2xxError(self):
    with DoStubHttp(400, 'application/json',
                    '{"error": {"code": 400, "message": "bar"}}'):
      with self.assertRaises(ee.ee_exception.EEException) as cm:
        ee.data.send_('/foo', {})
      self.assertEqual(u'bar', str(cm.exception))

  def testWrongContentType(self):
    with DoStubHttp(200, 'text/html', '{"data": "bar"}'):
      with self.assertRaises(ee.ee_exception.EEException) as cm:
        ee.data.send_('/foo', {})
      self.assertEqual(u'Response was unexpectedly not JSON, but text/html',
                       str(cm.exception))

  def testNoContentType(self):
    with DoStubHttp(200, None, '{"data": "bar"}'):
      self.assertEqual('bar', ee.data.send_('/foo', {}))

  def testContentTypeParameterAllowed(self):
    with DoStubHttp(200, 'application/json; charset=utf-8', '{"data": ""}'):
      self.assertEqual('', ee.data.send_('/foo', {}))

  def testRawSuccess(self):
    with DoStubHttp(200, 'image/png', 'FAKEDATA'):
      self.assertEqual('FAKEDATA', ee.data.send_('/foo', {}, opt_raw=True))

  def testRawError(self):
    with DoStubHttp(400, 'application/json',
                    '{"error": {"code": 400, "message": "bar"}}'):
      with self.assertRaises(ee.ee_exception.EEException) as cm:
        ee.data.send_('/foo', {}, opt_raw=True)
      self.assertEqual(u'Server returned HTTP code: 400. Reason: Ok.',
                       str(cm.exception))

  def testRaw200Error(self):
    """Raw shouldn't be parsed, so the error-in-200 shouldn't be noticed.

    (This is an edge case we do not expect to see.)
    """
    with DoStubHttp(200, 'application/json',
                    '{"error": {"code": 400, "message": "bar"}}'):
      self.assertEqual('{"error": {"code": 400, "message": "bar"}}',
                       ee.data.send_('/foo', {}, opt_raw=True))

  def testNotProfiling(self):
    # Test that we do not request profiling.
    with DoProfileStubHttp(self, False):
      ee.data.send_('/foo', {})

  def testProfiling(self):
    with DoProfileStubHttp(self, True):
      seen = []
      def ProfileHook(profile_id):
        seen.append(profile_id)

      with ee.data.profiling(ProfileHook):
        ee.data.send_('/foo', {})
      self.assertEqual(['someProfileId'], seen)

  def testProfilingCleanup(self):
    with DoProfileStubHttp(self, True):
      try:
        with ee.data.profiling(lambda _: None):
          raise ExceptionForTest()
      except ExceptionForTest:
        pass

    # Should not have profiling enabled after exiting the context by raising.
    with DoProfileStubHttp(self, False):
      ee.data.send_('/foo', {})

  def testSetAssetProperties(self):
    mock_http = mock.MagicMock(httplib2.Http)
    with apitestcase.UsingCloudApi(mock_http=mock_http), mock.patch.object(
        ee.data, 'updateAsset', autospec=True) as mock_update_asset:
      ee.data.setAssetProperties(
          'foo', {'mYPropErTy': 'Value', 'system:time_start': 1})
      asset_id = mock_update_asset.call_args[0][0]
      self.assertEqual(asset_id, 'foo')
      asset = mock_update_asset.call_args[0][1]
      self.assertEqual(
          asset['properties'],
          {'mYPropErTy': 'Value', 'system:time_start': 1})
      update_mask = mock_update_asset.call_args[0][2]
      self.assertSetEqual(
          set(update_mask), set([
              'properties.\"mYPropErTy\"',
              'properties.\"system:time_start\"'
          ]))

  def testListAssets(self):
    cloud_api_resource = mock.MagicMock()
    with apitestcase.UsingCloudApi(cloud_api_resource=cloud_api_resource):
      mock_result = {'assets': [{'path': 'id1', 'type': 'type1'}]}
      cloud_api_resource.projects().assets().listAssets(
      ).execute.return_value = mock_result
      cloud_api_resource.projects().assets().listAssets_next.return_value = None
      actual_result = ee.data.listAssets({'p': 'q'})
      cloud_api_resource.projects().assets().listAssets().\
        execute.assert_called_once()
      self.assertEqual(mock_result, actual_result)

  def testListImages(self):
    cloud_api_resource = mock.MagicMock()
    with apitestcase.UsingCloudApi(cloud_api_resource=cloud_api_resource):
      mock_result = {'images': [{'path': 'id1', 'type': 'type1'}]}
      cloud_api_resource.projects().assets().listImages(
      ).execute.return_value = mock_result
      cloud_api_resource.projects().assets().listImages_next.return_value = None
      actual_result = ee.data.listImages({'p': 'q'})
      cloud_api_resource.projects().assets().listImages(
      ).execute.assert_called_once()
      self.assertEqual(mock_result, actual_result)

  def testListBuckets(self):
    cloud_api_resource = mock.MagicMock()
    with apitestcase.UsingCloudApi(cloud_api_resource=cloud_api_resource):
      mock_result = {'assets': [{'name': 'id1', 'type': 'FOLDER'}]}
      cloud_api_resource.projects().listAssets(
          ).execute.return_value = mock_result
      actual_result = ee.data.listBuckets()
    cloud_api_resource.projects().listAssets(
        ).execute.assert_called_once()
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
          'pageSize': 3
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
      actual_result = ee.data.getList(
          {'id': 'projects/my-project/assets/', 'num': 3})
      expected_params = {

          'parent': 'projects/my-project',
          'pageSize': 3
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
      actual_result = ee.data.getList(
          {'id': 'projects/my-project/assets', 'num': 3})
      expected_params = {
          'parent': 'projects/my-project',
          'pageSize': 3
      }
      expected_result = [{'id': 'id1', 'type': 'ImageCollection'}]
      cloud_api_resource.projects().listAssets.assert_called_with(
          **expected_params)
      self.assertEqual(expected_result, actual_result)

  def testComplexGetListViaCloudApi(self):
    cloud_api_resource = mock.MagicMock()
    with apitestcase.UsingCloudApi(cloud_api_resource=cloud_api_resource):
      mock_result = {
          'images': [{
              'name': 'id1',
              'size_bytes': 1234
          }]
      }
      cloud_api_resource.projects().assets().listImages(
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
          'startTime': '1970-01-01T01:00:12.345000Z',
          'view': 'BASIC',
          'filter': 'foo'
      }
      expected_result = [{'id': 'id1', 'type': 'Image'}]
      cloud_api_resource.projects().assets().listImages.assert_called_with(
          **expected_params)
      self.assertEqual(expected_result, actual_result)

  # The Cloud API context manager does not mock getAlgorithms, so it's done
  # separately here.
  @mock.patch.object(
      ee.data,
      'getAlgorithms',
      return_value=apitestcase.BUILTIN_FUNCTIONS,
      autospec=True)
  def testGetDownloadId(self, _):
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


def DoStubHttp(status, mime, resp_body):
  """Context manager for temporarily overriding Http."""
  def Request(unused_self, unused_url, method, body, headers):
    _ = method, body, headers  # Unused kwargs.
    response = httplib2.Response({
        'status': status,
        'content-type': mime,
    })
    return response, resp_body
  return mock.patch('httplib2.Http.request', new=Request)


def DoProfileStubHttp(test, expect_profiling):
  def Request(unused_self, unused_url, method, body, headers):
    _ = method, headers  # Unused kwargs.
    test.assertEqual(expect_profiling, 'profiling=1' in body, msg=body)
    response_dict = {
        'status': 200,
        'content-type': 'application/json'
    }
    if expect_profiling:
      response_dict[
          ee.data._PROFILE_RESPONSE_HEADER_LOWERCASE] = 'someProfileId'
    response = httplib2.Response(response_dict)
    return response, '{"data": "dummy_data"}'
  return mock.patch('httplib2.Http.request', new=Request)


def DoCloudProfileStubHttp(test, expect_profiling):

  def Request(unused_self, unused_url, method, body, headers):
    _ = method, body  # Unused kwargs.
    test.assertEqual(expect_profiling,
                     ee.data._PROFILE_REQUEST_HEADER in headers)
    response_dict = {
        'status': 200,
        'content-type': 'application/json'
    }
    if expect_profiling:
      response_dict[
          ee.data._PROFILE_RESPONSE_HEADER_LOWERCASE] = 'someProfileId'
    response = httplib2.Response(response_dict)
    return response, '{"data": "dummy_data"}'
  return mock.patch('httplib2.Http.request', new=Request)


class ExceptionForTest(Exception):
  pass


if __name__ == '__main__':
  unittest.main()
