"""A TestCase that initializes the library with standard API methods."""

import contextlib
import json
import os
from typing import Any, Dict, Iterable, Optional

from googleapiclient import discovery

import unittest
import ee
from ee import _cloud_api_utils


# Cached algorithms list
_algorithms_cache: Optional[Dict[str, Any]] = None


def GetAlgorithms() -> Dict[str, Any]:
  """Returns a static version of the ListAlgorithms call.

  After ApiTestCase.setUp is called, ee.data.getAlgorithms() is patched to use
  this data. This function may be called explicitly if the test data is needed
  at a time before the test case has started executing.
  """
  global _algorithms_cache
  if _algorithms_cache is not None:
    return _algorithms_cache
  algorithms_path = os.path.join(
     os.path.dirname(os.path.realpath(__file__)),
     "tests/algorithms.json")
  with open(algorithms_path, encoding='utf-8') as algorithms_file:
    algorithms = json.load(algorithms_file)
    _algorithms_cache = _cloud_api_utils.convert_algorithms(algorithms)
  return _algorithms_cache


class ApiTestCase(unittest.TestCase):
  """A TestCase that initializes the library with standard API methods."""
  last_download_call: Optional[Any]
  last_thumb_call: Optional[Any]
  last_table_call: Optional[Any]
  last_mapid_call: Optional[Any]

  def setUp(self):
    super().setUp()
    self.InitializeApi()

  def InitializeApi(self, should_mock: bool = True):
    """Initializes the library with standard API methods.

    This is normally invoked during setUp(), but subclasses may invoke
    it manually instead if they prefer.

    Args:
      should_mock: Whether or not to mock the various functions.
    """
    self.last_download_call = None
    self.last_thumb_call = None
    self.last_table_call = None
    self.last_mapid_call = None

    ee.Reset()

    ee.data._install_cloud_api_resource = lambda: None  # pylint: disable=protected-access
    ee.data.getAlgorithms = GetAlgorithms
    if should_mock:
      ee.data.computeValue = lambda x: {'value': 'fakeValue'}
      ee.data.getMapId = self._MockMapId
      ee.data.getDownloadId = self._MockDownloadUrl
      ee.data.getThumbId = self._MockThumbUrl
      ee.data.getTableDownloadId = self._MockTableDownload
      ee.Initialize(None, '')

  # We are mocking the url here so the unit tests are happy.
  def _MockMapId(self, params: Dict[str, Any]) -> Dict[str, str]:
    self.last_mapid_call = {'url': '/mapid', 'data': params}
    return {'mapid': 'fakeMapId', 'token': 'fakeToken'}

  def _MockDownloadUrl(self, params: Dict[str, Any]) -> Dict[str, str]:
    self.last_download_call = {'url': '/download', 'data': params}
    return {'docid': '1', 'token': '2'}

  def _MockThumbUrl(
      self,
      params: Dict[str, Any],
      # pylint: disable-next=invalid-name
      thumbType: Optional[str] = None,
  ) -> Dict[str, str]:
    del thumbType  # Unused.
    # Hang on to the call arguments.
    self.last_thumb_call = {'url': '/thumb', 'data': params}
    return {'thumbid': '3', 'token': '4'}

  def _MockTableDownload(self, params: Dict[str, Any]) -> Dict[str, str]:
    self.last_table_call = {'url': '/table', 'data': params}
    return {'docid': '5', 'token': '6'}


def _GenerateCloudApiResource(mock_http: Any, raw: Any) -> discovery.Resource:
  """Returns a Cloud API resource for testing."""
  discovery_doc_path = os.path.join(
     os.path.dirname(os.path.realpath(__file__)),
     "tests/cloud_api_discovery_document.json")
  with open(discovery_doc_path) as discovery_doc_file:
    discovery_doc_str = discovery_doc_file.read()
  return _cloud_api_utils.build_cloud_resource_from_document(
      json.loads(discovery_doc_str),
      http_transport=mock_http,
      headers_supplier=ee.data._make_request_headers,  # pylint: disable=protected-access
      response_inspector=ee.data._handle_profiling_response,  # pylint: disable=protected-access
      raw=raw,
  )


@contextlib.contextmanager  # pytype: disable=wrong-arg-types
def UsingCloudApi(
    cloud_api_resource: Optional[Any] = None,
    cloud_api_resource_raw: Optional[Any] = None,
    mock_http: Optional[Any] = None,
) -> Iterable[Any]:
  """Returns a context manager under which the Cloud API is enabled."""
  old_cloud_api_resource = ee.data._cloud_api_resource  # pylint: disable=protected-access
  old_cloud_api_resource_raw = ee.data._cloud_api_resource_raw  # pylint: disable=protected-access
  old_initialized = ee.data._initialized  # pylint: disable=protected-access
  try:
    if cloud_api_resource is None:
      cloud_api_resource = _GenerateCloudApiResource(mock_http, False)
    if cloud_api_resource_raw is None:
      cloud_api_resource_raw = _GenerateCloudApiResource(mock_http, True)
    ee.data._cloud_api_resource = cloud_api_resource  # pylint: disable=protected-access
    ee.data._cloud_api_resource_raw = cloud_api_resource_raw  # pylint: disable=protected-access
    ee.data._initialized = True  # pylint: disable=protected-access
    yield
  finally:
    ee.data._cloud_api_resource = old_cloud_api_resource  # pylint: disable=protected-access
    ee.data._cloud_api_resource_raw = old_cloud_api_resource_raw  # pylint: disable=protected-access
    ee.data._initialized = old_initialized  # pylint: disable=protected-access


# A sample of encoded EE API JSON, used by SerializerTest and DeserializerTest.
ENCODED_JSON_SAMPLE = {
    'type': 'CompoundValue',
    'scope': [
        ['0', {
            'type': 'Invocation',
            'functionName': 'Date',
            'arguments': {
                'value': 1234567890000
            }
        }],
        ['1', {
            'type': 'LineString',
            'coordinates': [[1, 2], [3, 4]],
            'crs': {
                'type': 'name',
                'properties': {
                    'name': 'SR-ORG:6974'
                }
            }
        }],
        ['2', {
            'evenOdd': True,
            'type': 'Polygon',
            'coordinates': [
                [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]],
                [[5, 6], [7, 6], [7, 8], [5, 8]],
                [[1, 1], [2, 1], [2, 2], [1, 2]]
            ]
        }],
        ['3', {
            'type': 'Bytes',
            'value': 'aGVsbG8='
        }],
        ['4', {
            'type': 'Invocation',
            'functionName': 'String.cat',
            'arguments': {
                'string1': 'x',
                'string2': 'y'
            }
        }],
        ['5', {
            'type': 'Dictionary',
            'value': {
                'foo': 'bar',
                'baz': {'type': 'ValueRef', 'value': '4'}
            }
        }],
        ['6', {
            'type': 'Function',
            'argumentNames': ['x', 'y'],
            'body': {'type': 'ArgumentRef', 'value': 'y'}
        }],
        ['7', [
            None,
            True,
            5,
            7,
            3.4,
            112233445566778899,
            'hello',
            {'type': 'ValueRef', 'value': '0'},
            {'type': 'ValueRef', 'value': '1'},
            {'type': 'ValueRef', 'value': '2'},
            {'type': 'ValueRef', 'value': '3'},
            {'type': 'ValueRef', 'value': '5'},
            {'type': 'ValueRef', 'value': '4'},
            {'type': 'ValueRef', 'value': '6'}
        ]]
    ],
    'value': {'type': 'ValueRef', 'value': '7'}
}

# A sample of encoded EE API JSON for the Cloud API, used by SerializerTest.
ENCODED_CLOUD_API_JSON_SAMPLE = {
    'values': {
        '0': {
            'arrayValue': {
                'values': [
                    {'constantValue': None},
                    {'constantValue': True},
                    {'constantValue': 5},
                    {'constantValue': 7},
                    {'constantValue': 3.4},
                    {'integerValue': '112233445566778899'},
                    {'constantValue': 'hello'},
                    {'functionInvocationValue': {
                        'functionName': 'Date',
                        'arguments': {'value': {'constantValue': 1234567890000}}
                    }},
                    {'functionInvocationValue': {
                        'functionName': 'GeometryConstructors.LineString',
                        'arguments': {
                            'crs': {'functionInvocationValue': {
                                'functionName': 'Projection',
                                'arguments': {
                                    'crs': {'constantValue': 'SR-ORG:6974'}}
                            }},
                            'coordinates': {'arrayValue': {'values': [
                                {'valueReference': '1'},
                                {'constantValue': [3, 4]}
                            ]}}
                        }}},
                    {'functionInvocationValue': {
                        'functionName': 'GeometryConstructors.Polygon',
                        'arguments': {
                            'coordinates': {'arrayValue': {'values': [
                                {'arrayValue': {'values': [
                                    {'valueReference': '2'},
                                    {'constantValue': [10, 0]},
                                    {'constantValue': [10, 10]},
                                    {'constantValue': [0, 10]},
                                    {'valueReference': '2'}]}},
                                {'constantValue':
                                 [[5, 6], [7, 6], [7, 8], [5, 8]]},
                                {'arrayValue': {'values': [
                                    {'constantValue': [1, 1]},
                                    {'constantValue': [2, 1]},
                                    {'constantValue': [2, 2]},
                                    {'valueReference': '1'}]}}
                            ]}},
                            'evenOdd': {'constantValue': True}}}},
                    {'bytesValue': 'aGVsbG8='},
                    {'dictionaryValue': {
                        'values': {
                            'baz': {'valueReference': '3'},
                            'foo': {'constantValue': 'bar'},
                        }
                    }},
                    {'valueReference': '3'},
                    {'functionDefinitionValue': {
                        'argumentNames': ['x', 'y'],
                        'body': '4'}
                    }
                ]}},
        '1': {'constantValue': [1, 2]},
        '2': {'constantValue': [0, 0]},
        '3': {'functionInvocationValue': {
            'functionName': 'String.cat',
            'arguments': {
                'string1': {'constantValue': 'x'},
                'string2': {'constantValue': 'y'}
            }}},
        '4': {'argumentReference': 'y'},
    },
    'result': '0'
}
ENCODED_CLOUD_API_JSON_SAMPLE_PRETTY = {
    'arrayValue': {
        'values': [
            {'constantValue': None},
            {'constantValue': True},
            {'constantValue': 5},
            {'constantValue': 7},
            {'constantValue': 3.4},
            {'integerValue': '112233445566778899'},
            {'constantValue': 'hello'},
            {'functionInvocationValue': {
                'functionName': 'Date',
                'arguments': {'value': {'constantValue': 1234567890000}}
            }},
            {'functionInvocationValue': {
                'functionName': 'GeometryConstructors.LineString',
                'arguments': {
                    'crs': {'functionInvocationValue': {
                        'functionName': 'Projection',
                        'arguments': {
                            'crs': {'constantValue': 'SR-ORG:6974'}}
                    }},
                    'coordinates': {'constantValue': [[1, 2], [3, 4]]}
                }}},
            {'functionInvocationValue': {
                'functionName': 'GeometryConstructors.Polygon',
                'arguments': {
                    'coordinates': {
                        'constantValue':
                        [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]],
                         [[5, 6], [7, 6], [7, 8], [5, 8]],
                         [[1, 1], [2, 1], [2, 2], [1, 2]]]},
                    'evenOdd': {'constantValue': True}}}},
            {'bytesValue': 'aGVsbG8='},
            {'dictionaryValue': {
                'values': {
                    'baz': {'functionInvocationValue': {
                        'functionName': 'String.cat',
                        'arguments': {
                            'string1': {'constantValue': 'x'},
                            'string2': {'constantValue': 'y'}
                        }}},
                    'foo': {'constantValue': 'bar'},
                }}},
            {'functionInvocationValue': {
                'functionName': 'String.cat',
                'arguments': {
                    'string1': {'constantValue': 'x'},
                    'string2': {'constantValue': 'y'}
                }}},
            {'functionDefinitionValue': {
                'argumentNames': ['x', 'y'],
                'body': {'argumentReference': 'y'}}
            }
        ]}}
