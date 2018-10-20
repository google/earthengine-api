#!/usr/bin/env python


import httplib2
import mock
from six.moves import urllib
import unittest
import ee


class DataTest(unittest.TestCase):

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
      self.assertEqual('Server returned HTTP code: 418', str(cm.exception))

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
      self.assertEqual(u'Server returned HTTP code: 400', str(cm.exception))

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




class ExceptionForTest(Exception):
  pass


if __name__ == '__main__':
  unittest.main()
