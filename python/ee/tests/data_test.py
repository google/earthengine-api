#!/usr/bin/env python


import httplib2
import mock
import unittest
import ee


class DataTest(unittest.TestCase):

  def testSuccess(self):
    with DoStubHttp(200, 'application/json', '{"data": "bar"}'):
      self.assertEqual('bar', ee.data.send_('/foo', {}))

  def testNon200Success(self):
    with DoStubHttp(202, 'application/json', '{"data": "bar"}'):
      self.assertEqual('bar', ee.data.send_('/foo', {}))

  def testJsonSyntaxError(self):
    with DoStubHttp(200, 'application/json', '{"data"}'):
      with self.assertRaises(ee.ee_exception.EEException) as cm:
        ee.data.send_('/foo', {})
      self.assertEqual('Invalid JSON: {"data"}', cm.exception.message)

  def testJsonStructureError(self):
    with DoStubHttp(200, 'application/json', '{}'):
      with self.assertRaises(ee.ee_exception.EEException) as cm:
        ee.data.send_('/foo', {})
      self.assertEqual('Malformed response: {}', cm.exception.message)

  def testUnexpectedStatus(self):
    with DoStubHttp(418, 'text/html', '<html>'):
      with self.assertRaises(ee.ee_exception.EEException) as cm:
        ee.data.send_('/foo', {})
      self.assertEqual('Server returned HTTP code: 418', cm.exception.message)

  def testJson200Error(self):
    with DoStubHttp(200, 'application/json',
                    '{"error": {"code": 500, "message": "bar"}}'):
      with self.assertRaises(ee.ee_exception.EEException) as cm:
        ee.data.send_('/foo', {})
      self.assertEqual(u'bar', cm.exception.message)

  def testJsonNon2xxError(self):
    with DoStubHttp(400, 'application/json',
                    '{"error": {"code": 400, "message": "bar"}}'):
      with self.assertRaises(ee.ee_exception.EEException) as cm:
        ee.data.send_('/foo', {})
      self.assertEqual(u'bar', cm.exception.message)

  def testWrongContentType(self):
    with DoStubHttp(200, 'text/html', '{"data": "bar"}'):
      with self.assertRaises(ee.ee_exception.EEException) as cm:
        ee.data.send_('/foo', {})
      self.assertEqual(u'Response was unexpectedly not JSON, but text/html',
                       cm.exception.message)

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
      self.assertEqual(u'Server returned HTTP code: 400', cm.exception.message)

  def testRaw200Error(self):
    """Raw shouldn't be parsed, so the error-in-200 shouldn't be noticed.

    (This is an edge case we do not expect to see.)
    """
    with DoStubHttp(200, 'application/json',
                    '{"error": {"code": 400, "message": "bar"}}'):
      self.assertEqual('{"error": {"code": 400, "message": "bar"}}',
                       ee.data.send_('/foo', {}, opt_raw=True))


def DoStubHttp(status, mime, resp_body):
  """Context manager for temporarily overriding Http."""
  def Request(unused_self, unused_url, method, body, headers):
    _ = method, body, headers  # unused kwargs
    response = httplib2.Response({
        'status': status,
        'content-type': mime,
    })
    return response, resp_body
  return mock.patch('httplib2.Http.request', new=Request)


class StubResponse(object):

  def __init__(self, status):
    self.status = status


if __name__ == '__main__':
  unittest.main()
