#!/usr/bin/env python
"""A TestCase that initializes the library with standard API methods."""



import contextlib
import json
import os
from . import _cloud_api_utils

import unittest

import ee


class ApiTestCase(unittest.TestCase):

  def setUp(self):
    self.InitializeApi()

  def InitializeApi(self, algorithms=None, should_mock=True):
    """Initializes the library with standard API methods.

    This is normally invoked during setUp(), but subclasses may invoke
    it manually instead if they prefer.

    Args:
      algorithms: A set of algorithms to set on the initialize
      should_mock: Whether or not to mock the various functions.
    """
    self.last_download_call = None
    self.last_thumb_call = None
    self.last_table_call = None
    self.last_mapid_call = None

    ee.Reset()

    if algorithms is None:
      algorithms = BUILTIN_FUNCTIONS

    ee.data._install_cloud_api_resource = lambda: None
    ee.data.getAlgorithms = lambda: algorithms
    if should_mock:
      ee.data.computeValue = lambda x: {'value': 'fakeValue'}
      ee.data.getMapId = self._MockMapId
      ee.data.getDownloadId = self._MockDownloadUrl
      ee.data.getThumbId = self._MockThumbUrl
      ee.data.getTableDownloadId = self._MockTableDownload
      ee.Initialize(None, '')

  # We are mocking the url here so the unit tests are happy.
  def _MockMapId(self, params):
    self.last_mapid_call = {'url': '/mapid', 'data': params}
    return {'mapid': 'fakeMapId', 'token': 'fakeToken'}

  def _MockDownloadUrl(self, params):
    self.last_download_call = {'url': '/download', 'data': params}
    return {'docid': '1', 'token': '2'}

  def _MockThumbUrl(self, params, thumbType=None):  # pylint: disable=invalid-name,unused-argument
    # Hang on to the call arguments.
    self.last_thumb_call = {'url': '/thumb', 'data': params}
    return {'thumbid': '3', 'token': '4'}

  def _MockTableDownload(self, params):
    self.last_table_call = {'url': '/table', 'data': params}
    return {'docid': '5', 'token': '6'}


@contextlib.contextmanager
def UsingCloudApi(cloud_api_resource=None, mock_http=None):
  """Returns a context manager under which the Cloud API is enabled."""
  old_cloud_api_resource = ee.data._cloud_api_resource
  try:
    if cloud_api_resource is None:
      discovery_doc_path = os.path.join(
         os.path.dirname(os.path.realpath(__file__)),
         "tests/cloud_api_discovery_document.json")
      with open(discovery_doc_path) as discovery_doc_file:
        discovery_doc_str = discovery_doc_file.read()
      cloud_api_resource = (
          _cloud_api_utils.build_cloud_resource_from_document(
              json.loads(discovery_doc_str),
              http_transport=mock_http,
              headers_supplier=ee.data._make_request_headers,
              response_inspector=ee.data._handle_profiling_response))
    ee.data._cloud_api_resource = cloud_api_resource
    yield
  finally:
    ee.data._cloud_api_resource = old_cloud_api_resource

BUILTIN_FUNCTIONS = {
    'Image.constant': {
        'type': 'Algorithm',
        'args': [
            {
                'description': '',
                'name': 'value',
                'type': 'Object'
            }
        ],
        'description': '',
        'returns': 'Image'
    },
    'Image.load': {
        'type': 'Algorithm',
        'args': [
            {
                'description': '',
                'name': 'id',
                'type': 'String'
            },
            {
                'default': None,
                'description': '',
                'optional': True,
                'name': 'version',
                'type': 'Long'
            }
        ],
        'description': '',
        'returns': 'Image'
    },
    'Image.addBands': {
        'type': 'Algorithm',
        'args': [
            {
                'description': '',
                'name': 'dstImg',
                'type': 'Image'
            },
            {
                'description': '',
                'name': 'srcImg',
                'type': 'Image'
            },
            {
                'default': None,
                'description': '',
                'optional': True,
                'name': 'names',
                'type': 'List<String>'
            },
            {
                'default': False,
                'description': '',
                'optional': True,
                'name': 'overwrite',
                'type': 'boolean'
            }
        ],
        'description': '',
        'returns': 'Image'
    },
    'Image.clip': {
        'type': 'Algorithm',
        'args': [
            {
                'description': '',
                'name': 'input',
                'type': 'Image'
            },
            {
                'default': None,
                'description': '',
                'optional': True,
                'name': 'geometry',
                'type': 'Object'
            }
        ],
        'description': '',
        'returns': 'Image'
    },
    'Image.select': {
        'type': 'Algorithm',
        'args': [
            {
                'description': '',
                'name': 'input',
                'type': 'Image'
            },
            {
                'description': '',
                'name': 'bandSelectors',
                'type': 'List<Object>'
            },
            {
                'default': None,
                'description': '',
                'optional': True,
                'name': 'newNames',
                'type': 'List<String>'
            }
        ],
        'description': '',
        'returns': 'Image'
    },
    'Image.parseExpression': {
        'type': 'Algorithm',
        'args': [
            {
                'description': '',
                'name': 'expression',
                'type': 'String'
            },
            {
                'default': 'image',
                'description': '',
                'optional': True,
                'name': 'argName',
                'type': 'String'
            },
            {
                'default': None,
                'description': '',
                'optional': True,
                'name': 'vars',
                'type': 'List<String>'
            }
        ],
        'description': '',
        'returns': 'Algorithm'
    },
    'Feature': {
        'type': 'Algorithm',
        'args': [
            {
                'default': None,
                'description': '',
                'optional': True,
                'name': 'geometry',
                'type': 'Geometry'
            },
            {
                'default': {},
                'description': '',
                'optional': True,
                'name': 'metadata',
                'type': 'Dictionary<Object>'
            }
        ],
        'description': '',
        'returns': 'Feature'
    },
    'Feature.select': {
        'type': 'Algorithm',
        'args': [
            {
                'description': 'The feature to select properties from.',
                'name': 'input',
                'type': 'Element'
            },
            {
                'description': '',
                'name': 'propertySelectors',
                'type': 'List<String>'
            },
            {
                'default': None,
                'description': '',
                'name': 'newProperties',
                'optional': True,
                'type': 'List<String>'
            },
            {
                'default': True,
                'description': '',
                'name': 'retainGeometry',
                'optional': True,
                'type': 'Boolean'
            }
        ],
        'description': '',
        'returns': 'Element',
    },
    'Feature.get': {
        'type': 'Algorithm',
        'returns': '<any>',
        'hidden': False,
        'args': [
            {
                'type': 'Element',
                'description': '',
                'name': 'object'
            },
            {
                'type': 'String',
                'description': '',
                'name': 'property'
            }
        ],
        'description': ''
    },
    'Collection': {
        'type': 'Algorithm',
        'args': [
            {
                'description': '',
                'name': 'features',
                'type': 'List<Feature>'
            }
        ],
        'description': '',
        'returns': 'FeatureCollection'
    },
    'Collection.loadTable': {
        'type': 'Algorithm',
        'args': [
            {
                'default': None,
                'description': '',
                'optional': True,
                'name': 'tableId',
                'type': 'Object'
            },
            {
                'default': None,
                'description': '',
                'optional': True,
                'name': 'geometryColumn',
                'type': 'String'
            },
            {
                'default': None,
                'description': '',
                'optional': True,
                'name': 'version',
                'type': 'Long'
            }
        ],
        'description': '',
        'returns': 'FeatureCollection'
    },
    'Collection.filter': {
        'type': 'Algorithm',
        'args': [
            {
                'description': '',
                'name': 'collection',
                'type': 'FeatureCollection'
            },
            {
                'description': '',
                'name': 'filter',
                'type': 'Filter'
            }
        ],
        'description': '',
        'returns': 'FeatureCollection'
    },
    'Collection.limit': {
        'type': 'Algorithm',
        'args': [
            {
                'description': '',
                'name': 'collection',
                'type': 'FeatureCollection'
            },
            {
                'default': -1,
                'description': '',
                'optional': True,
                'name': 'limit',
                'type': 'int'
            },
            {
                'default': None,
                'description': '',
                'optional': True,
                'name': 'key',
                'type': 'String'
            },
            {
                'default': True,
                'description': '',
                'optional': True,
                'name': 'ascending',
                'type': 'boolean'
            }
        ],
        'description': '',
        'returns': 'FeatureCollection'
    },
    'Collection.map': {
        'type': 'Algorithm',
        'args': [
            {
                'description': '',
                'name': 'collection',
                'type': 'FeatureCollection'
            },
            {
                'description': '',
                'name': 'baseAlgorithm',
                'type': 'Algorithm'
            },
            {
                'default': None,
                'description': '',
                'optional': True,
                'name': 'dynamicArgs',
                'type': 'Dictionary<String>'
            },
            {
                'default': {},
                'description': '',
                'optional': True,
                'name': 'constantArgs',
                'type': 'Dictionary<Object>'
            },
            {
                'default': None,
                'description': '',
                'optional': True,
                'name': 'destination',
                'type': 'String'
            }
        ],
        'description': '',
        'returns': 'FeatureCollection'
    },
    'Collection.iterate': {
        'type': 'Algorithm',
        'args': [
            {
                'description': '',
                'name': 'collection',
                'type': 'FeatureCollection'
            },
            {
                'description': '',
                'name': 'function',
                'type': 'Algorithm'
            },
            {
                'default': None,
                'description': '',
                'optional': True,
                'name': 'first',
                'type': 'Object'
            }
        ],
        'description': '',
        'returns': 'Object',
    },
    'ImageCollection.load': {
        'type': 'Algorithm',
        'args': [
            {
                'description': '',
                'name': 'id',
                'type': 'String'
            },
            {
                'default': None,
                'description': '',
                'optional': True,
                'name': 'version',
                'type': 'Long'
            }
        ],
        'description': '',
        'returns': 'ImageCollection'
    },
    'ImageCollection.fromImages': {
        'type': 'Algorithm',
        'args': [
            {
                'description': '',
                'name': 'images',
                'type': 'List<Image>'
            }
        ],
        'description': '',
        'returns': 'ImageCollection'
    },
    'ImageCollection.mosaic': {
        'type': 'Algorithm',
        'args': [
            {
                'description': '',
                'name': 'collection',
                'type': 'ImageCollection'
            }
        ],
        'description': '',
        'returns': 'Image'
    },
    'Collection.geometry': {
        'type': 'Algorithm',
        'args': [
            {
                'description': '',
                'name': 'collection',
                'type': 'FeatureCollection'
            },
            {
                'default': {
                    'type': 'ErrorMargin',
                    'unit': 'meters',
                    'value': 0
                },
                'description': '',
                'optional': True,
                'name': 'maxError',
                'type': 'ErrorMargin'
            }
        ],
        'description': '',
        'returns': 'Geometry'
    },
    'Collection.draw': {
        'type': 'Algorithm',
        'args': [
            {
                'description': '',
                'name': 'collection',
                'type': 'FeatureCollection'
            },
            {
                'description': '',
                'name': 'color',
                'type': 'String'
            },
            {
                'default': 3,
                'description': '',
                'optional': True,
                'name': 'pointRadius',
                'type': 'int'
            },
            {
                'default': 2,
                'description': '',
                'optional': True,
                'name': 'strokeWidth',
                'type': 'int'
            }
        ],
        'description': '',
        'returns': 'Image'
    },
    'DateRange': {
        'type': 'Algorithm',
        'args': [
            {
                'description': '',
                'name': 'start',
                'type': 'Date'
            },
            {
                'default': None,
                'description': '',
                'optional': True,
                'name': 'end',
                'type': 'Date'
            }
        ],
        'description': '',
        'returns': 'DateRange'
    },
    'Date': {
        'returns': 'Date',
        'hidden': False,
        'args': [
            {
                'type': 'Object',
                'description': '',
                'name': 'value'
            },
            {
                'type': 'String',
                'default': None,
                'description': '',
                'optional': True,
                'name': 'timeZone'
            }
        ],
        'type': 'Algorithm',
        'description': ''
    },
    'ErrorMargin': {
        'type': 'Algorithm',
        'args': [
            {
                'description': '',
                'name': 'value',
                'type': 'Double'
            },
            {
                'default': 'meters',
                'description': '',
                'optional': True,
                'name': 'unit',
                'type': 'String'
            }
        ],
        'description': '',
        'returns': 'ErrorMargin'
    },
    'Filter.intersects': {
        'type': 'Algorithm',
        'args': [
            {
                'default': None,
                'description': '',
                'optional': True,
                'name': 'leftField',
                'type': 'String'
            },
            {
                'default': None,
                'description': '',
                'optional': True,
                'name': 'rightValue',
                'type': 'Object'
            },
            {
                'default': None,
                'description': '',
                'optional': True,
                'name': 'rightField',
                'type': 'String'
            },
            {
                'default': None,
                'description': '',
                'optional': True,
                'name': 'leftValue',
                'type': 'Object'
            },
            {
                'default': {
                    'type': 'ErrorMargin',
                    'unit': 'meters',
                    'value': 0.1
                },
                'description': '',
                'optional': True,
                'name': 'maxError',
                'type': 'ErrorMargin'
            }
        ],
        'description': '',
        'returns': 'Filter'
    },
    'Filter.dateRangeContains': {
        'type': 'Algorithm',
        'args': [
            {
                'default': None,
                'description': '',
                'optional': True,
                'name': 'leftField',
                'type': 'String'
            },
            {
                'default': None,
                'description': '',
                'optional': True,
                'name': 'rightValue',
                'type': 'Object'
            },
            {
                'default': None,
                'description': '',
                'optional': True,
                'name': 'rightField',
                'type': 'String'
            },
            {
                'default': None,
                'description': '',
                'optional': True,
                'name': 'leftValue',
                'type': 'Object'
            }
        ],
        'description': '',
        'returns': 'Filter'
    },
    'Filter.or': {
        'type': 'Algorithm',
        'args': [
            {
                'description': '',
                'name': 'filters',
                'type': 'List<Filter>'
            }
        ],
        'description': '',
        'returns': 'Filter'
    },
    'Filter.and': {
        'type': 'Algorithm',
        'args': [
            {
                'description': '',
                'name': 'filters',
                'type': 'List<Filter>'
            }
        ],
        'description': '',
        'returns': 'Filter'
    },
    'Filter.not': {
        'type': 'Algorithm',
        'args': [
            {
                'description': '',
                'name': 'filter',
                'type': 'Filter'
            }
        ],
        'description': '',
        'returns': 'Filter'
    },
    'Filter.equals': {
        'type': 'Algorithm',
        'args': [
            {
                'default': None,
                'description': '',
                'optional': True,
                'name': 'leftField',
                'type': 'String'
            },
            {
                'default': None,
                'description': '',
                'optional': True,
                'name': 'rightValue',
                'type': 'Object'
            },
            {
                'default': None,
                'description': '',
                'optional': True,
                'name': 'rightField',
                'type': 'String'
            },
            {
                'default': None,
                'description': '',
                'optional': True,
                'name': 'leftValue',
                'type': 'Object'
            }
        ],
        'description': '',
        'returns': 'Filter'
    },
    'Filter.lessThan': {
        'type': 'Algorithm',
        'args': [
            {
                'default': None,
                'description': '',
                'optional': True,
                'name': 'leftField',
                'type': 'String'
            },
            {
                'default': None,
                'description': '',
                'optional': True,
                'name': 'rightValue',
                'type': 'Object'
            },
            {
                'default': None,
                'description': '',
                'optional': True,
                'name': 'rightField',
                'type': 'String'
            },
            {
                'default': None,
                'description': '',
                'optional': True,
                'name': 'leftValue',
                'type': 'Object'
            }
        ],
        'description': '',
        'returns': 'Filter'
    },
    'Filter.greaterThan': {
        'type': 'Algorithm',
        'args': [
            {
                'default': None,
                'description': '',
                'optional': True,
                'name': 'leftField',
                'type': 'String'
            },
            {
                'default': None,
                'description': '',
                'optional': True,
                'name': 'rightValue',
                'type': 'Object'
            },
            {
                'default': None,
                'description': '',
                'optional': True,
                'name': 'rightField',
                'type': 'String'
            },
            {
                'default': None,
                'description': '',
                'optional': True,
                'name': 'leftValue',
                'type': 'Object'
            }
        ],
        'description': '',
        'returns': 'Filter'
    },
    'Filter.stringContains': {
        'type': 'Algorithm',
        'args': [
            {
                'default': None,
                'description': '',
                'optional': True,
                'name': 'leftField',
                'type': 'String'
            },
            {
                'default': None,
                'description': '',
                'optional': True,
                'name': 'rightValue',
                'type': 'Object'
            },
            {
                'default': None,
                'description': '',
                'optional': True,
                'name': 'rightField',
                'type': 'String'
            },
            {
                'default': None,
                'description': '',
                'optional': True,
                'name': 'leftValue',
                'type': 'Object'
            }
        ],
        'description': '',
        'returns': 'Filter'
    },
    'Filter.stringStartsWith': {
        'type': 'Algorithm',
        'args': [
            {
                'default': None,
                'description': '',
                'optional': True,
                'name': 'leftField',
                'type': 'String'
            },
            {
                'default': None,
                'description': '',
                'optional': True,
                'name': 'rightValue',
                'type': 'Object'
            },
            {
                'default': None,
                'description': '',
                'optional': True,
                'name': 'rightField',
                'type': 'String'
            },
            {
                'default': None,
                'description': '',
                'optional': True,
                'name': 'leftValue',
                'type': 'Object'
            }
        ],
        'description': '',
        'returns': 'Filter'
    },
    'Filter.stringEndsWith': {
        'type': 'Algorithm',
        'args': [
            {
                'default': None,
                'description': '',
                'optional': True,
                'name': 'leftField',
                'type': 'String'
            },
            {
                'default': None,
                'description': '',
                'optional': True,
                'name': 'rightValue',
                'type': 'Object'
            },
            {
                'default': None,
                'description': '',
                'optional': True,
                'name': 'rightField',
                'type': 'String'
            },
            {
                'default': None,
                'description': '',
                'optional': True,
                'name': 'leftValue',
                'type': 'Object'
            }
        ],
        'description': '',
        'returns': 'Filter'
    },
    'Filter.listContains': {
        'type': 'Algorithm',
        'args': [
            {
                'default': None,
                'description': '',
                'optional': True,
                'name': 'leftField',
                'type': 'String'
            },
            {
                'default': None,
                'description': '',
                'optional': True,
                'name': 'rightValue',
                'type': 'Object'
            },
            {
                'default': None,
                'description': '',
                'optional': True,
                'name': 'rightField',
                'type': 'String'
            },
            {
                'default': None,
                'description': '',
                'optional': True,
                'name': 'leftValue',
                'type': 'Object'
            }
        ],
        'description': '',
        'returns': 'Filter'
    },
    'Image.mask': {
        'type': 'Algorithm',
        'args': [
            {
                'name': 'image',
                'type': 'Image',
                'description': ''
            },
            {
                'name': 'mask',
                'type': 'Image',
                'description': '',
                'optional': True,
                'default': None
            }
        ],
        'description': '',
        'returns': 'Image'
    },
    # These two functions (Dictionary.get and Image.reduceRegion) are here
    # to force the creation of the Dictionary class.
    'Dictionary.get': {
        'returns': 'Object',
        'args': [
            {
                'type': 'Dictionary<Object>',
                'description': '',
                'name': 'map'
                },
            {
                'type': 'String',
                'description': '',
                'name': 'property'
                }
            ],
        'type': 'Algorithm',
        'description': '',
    },
    'Dictionary.map': {
        'returns': 'Dictionary<Object>',
        'args': [
            {
                'type': 'Dictionary<Object>',
                'description': '',
                'name': 'dictionary'
                },
            {
                'type': 'Algorithm',
                'description': '',
                'name': 'baseAlgorithm'
                }
            ],
        'type': 'Algorithm',
        'description': '',
    },
    'Image.reduceRegion': {
        'returns': 'Dictionary<Object>',
        'hidden': False,
        'args': [
            {
                'type': 'Image',
                'description': '',
                'name': 'image'
            },
            {
                'type': 'ReducerOld',
                'description': '',
                'name': 'reducer'
            },
            {
                'default': None,
                'type': 'Geometry',
                'optional': True,
                'description': '',
                'name': 'geometry'
            },
            {
                'default': None,
                'type': 'Double',
                'optional': True,
                'description': '',
                'name': 'scale'
            },
            {
                'default': 'EPSG:4326',
                'type': 'String',
                'optional': True,
                'description': '',
                'name': 'crs'
            },
            {
                'default': None,
                'type': 'double[]',
                'optional': True,
                'description': '',
                'name': 'crsTransform'
            },
            {
                'default': False,
                'type': 'boolean',
                'optional': True,
                'description': '',
                'name': 'bestEffort'
            }
        ],
        'type': 'Algorithm',
        'description': ''
    },
    # Algorithms for testing ee.String.
    'String': {
        'returns': 'String',
        'hidden': False,
        'args': [
            {
                'type': 'Object',
                'description': '',
                'name': 'input'
            }
        ],
        'type': 'Algorithm',
        'description': ''
    },
    'String.cat': {
        'returns': 'String',
        'hidden': False,
        'args': [
            {
                'type': 'String',
                'description': '',
                'name': 'string1'
            },
            {
                'type': 'String',
                'description': '',
                'name': 'string2'
            }
        ],
        'type': 'Algorithm',
        'description': ''
    },
    # An algorithm for testing computed Geometries.
    'Geometry.bounds': {
        'returns': 'Geometry',
        'hidden': False,
        'args': [
            {
                'type': 'Geometry',
                'description': '',
                'name': 'geometry'
            },
            {
                'default': None,
                'type': 'ErrorMargin',
                'optional': True,
                'description': '',
                'name': 'maxError'
            },
            {
                'default': None,
                'type': 'Projection',
                'optional': True,
                'description': '',
                'name': 'proj'
            }
        ],
        'type': 'Algorithm',
        'description': ''
    },
    'Geometry.centroid': {
        'returns': 'Geometry',
        'args': [
            {
                'description': '',
                'name': 'geometry',
                'type': 'Geometry'
            },
            {
                'default': None,
                'description': '',
                'optional': True,
                'name': 'maxError',
                'type': 'ErrorMargin'
            },
            {
                'default': None,
                'description': '',
                'optional': True,
                'name': 'proj',
                'type': 'Projection'
            }
        ],
        'description': '',
        'type': 'Algorithm',
    },
    'GeometryConstructors.BBox': {
        'description': '',
        'returns': 'Geometry',
        'args': [
            {
                'name': 'west',
                'type': 'Float',
                'description': ''
            },
            {
                'name': 'south',
                'type': 'Float',
                'description': ''
            },
            {
                'name': 'east',
                'type': 'Float',
                'description': ''
            },
            {
                'name': 'north',
                'type': 'Float',
                'description': ''
            }
        ]
    },
    'GeometryConstructors.Point': {
        'returns': 'Geometry',
        'args': [
            {
                'name': 'coordinates',
                'type': 'List<Number>',
                'description': ''
            },
            {
                'name': 'crs',
                'type': 'Projection',
                'description': '',
                'optional': True,
                'default': 'epsg:4326'
            }
        ],
        'type': 'Algorithm',
        'description': ''
    },
    'GeometryConstructors.Rectangle': {
        'returns': 'Geometry',
        'args': [
            {
                'name': 'coordinates',
                'type': 'List<Object>',
                'description': ''
            },
            {
                'name': 'crs',
                'type': 'Projection',
                'description': '',
                'optional': True,
                'default': 'epsg:4326'
            },
            {
                'default': None,
                'description': '',
                'optional': True,
                'name': 'geodesic',
                'type': 'Boolean'
            },
            {
                'default': True,
                'description': '',
                'optional': True,
                'name': 'evenOdd',
                'type': 'Boolean'
            },
        ],
        'type': 'Algorithm',
        'description': ''
    },
    'GeometryConstructors.LineString': {
        'returns': 'Geometry',
        'args': [
            {
                'name': 'coordinates',
                'type': 'List<Object>',
                'description': ''
            },
            {
                'name': 'crs',
                'type': 'Projection',
                'description': '',
                'optional': True,
                'default': 'epsg:4326'
            },
            {
                'default': None,
                'description': '',
                'optional': True,
                'name': 'geodesic',
                'type': 'Boolean'
            },
            {
                'default': None,
                'description': '',
                'optional': True,
                'name': 'maxError',
                'type': 'ErrorMargin'
            },
        ],
        'type': 'Algorithm',
        'description': ''
    },
    'GeometryConstructors.LinearRing': {
        'returns': 'Geometry',
        'args': [
            {
                'name': 'coordinates',
                'type': 'List<Object>',
                'description': ''
            },
            {
                'name': 'crs',
                'type': 'Projection',
                'description': '',
                'optional': True,
                'default': 'epsg:4326'
            },
            {
                'default': None,
                'description': '',
                'optional': True,
                'name': 'geodesic',
                'type': 'Boolean'
            },
        ],
        'type': 'Algorithm',
        'description': ''
    },
    'GeometryConstructors.MultiGeometry': {
        'returns': 'Geometry',
        'args': [
            {
                'name': 'geometries',
                'type': 'List<Geometry>',
                'description': '',
            },
            {
                'name': 'crs',
                'type': 'Projection',
                'description': '',
                'optional': True,
                'default': 'epsg:4326'
            },
            {
                'default': None,
                'description': '',
                'optional': True,
                'name': 'geodesic',
                'type': 'Boolean'
            },
            {
                'default': None,
                'description': '',
                'optional': True,
                'name': 'maxError',
                'type': 'ErrorMargin'
            },
        ],
        'type': 'Algorithm',
        'description': ''
    },
    'GeometryConstructors.MultiLineString': {
        'returns': 'Geometry',
        'args': [
            {
                'name': 'coordinates',
                'type': 'List<Object>',
                'description': ''
            },
            {
                'name': 'crs',
                'type': 'Projection',
                'description': '',
                'optional': True,
                'default': 'epsg:4326'
            },
            {
                'default': None,
                'description': '',
                'optional': True,
                'name': 'geodesic',
                'type': 'Boolean'
            },
            {
                'default': None,
                'description': '',
                'optional': True,
                'name': 'maxError',
                'type': 'ErrorMargin'
            },
        ],
        'type': 'Algorithm',
        'description': ''
    },
    'GeometryConstructors.MultiPoint': {
        'returns': 'Geometry',
        'args': [
            {
                'name': 'coordinates',
                'type': 'List<Object>',
                'description': ''
            },
            {
                'name': 'crs',
                'type': 'Projection',
                'description': '',
                'optional': True,
                'default': 'epsg:4326'
            }
        ],
        'type': 'Algorithm',
        'description': ''
    },
    'GeometryConstructors.MultiPolygon': {
        'returns': 'Geometry',
        'args': [
            {
                'name': 'coordinates',
                'type': 'List<Object>',
                'description': ''
            },
            {
                'name': 'crs',
                'type': 'Projection',
                'description': '',
                'optional': True,
                'default': 'epsg:4326'
            },
            {
                'default': None,
                'description': '',
                'optional': True,
                'name': 'geodesic',
                'type': 'Boolean'
            },
            {
                'default': None,
                'description': '',
                'optional': True,
                'name': 'maxError',
                'type': 'ErrorMargin'
            },
            {
                'default': None,
                'description': '',
                'optional': True,
                'name': 'evenOdd',
                'type': 'Boolean'
            },
        ],
        'type': 'Algorithm',
        'description': ''
    },
    'GeometryConstructors.Polygon': {
        'returns': 'Geometry',
        'args': [
            {
                'name': 'coordinates',
                'type': 'List<Object>',
                'description': ''
            },
            {
                'name': 'crs',
                'type': 'Projection',
                'description': '',
                'optional': True,
                'default': 'epsg:4326'
            },
            {
                'default': None,
                'description': '',
                'optional': True,
                'name': 'geodesic',
                'type': 'Boolean'
            },
            {
                'default': None,
                'description': '',
                'optional': True,
                'name': 'maxError',
                'type': 'ErrorMargin'
            },
            {
                'default': None,
                'description': '',
                'optional': True,
                'name': 'evenOdd',
                'type': 'Boolean'
            },
        ],
        'type': 'Algorithm',
        'description': ''
    },
    # Element property setting, used by the client-side override.
    'Element.set': {
        'returns': 'Element',
        'hidden': False,
        'args': [
            {
                'type': 'Element',
                'description': '',
                'name': 'object'
            },
            {
                'type': 'String',
                'description': '',
                'name': 'key'
            },
            {
                'type': 'Object',
                'description': '',
                'name': 'value'
            }
        ],
        'type': 'Algorithm',
        'description': ''
    },
    'Element.setMulti': {
        'returns': 'Element',
        'hidden': False,
        'args': [
            {
                'type': 'Element',
                'description': '',
                'name': 'object'
            },
            {
                'type': 'Dictionary<Object>',
                'description': '',
                'name': 'properties'
            }
        ],
        'type': 'Algorithm',
        'description': ''
    },
    'Image.geometry': {
        'returns': 'Geometry',
        'args': [
            {
                'description': '',
                'name': 'feature',
                'type': 'Element'
            },
            {
                'default': None,
                'description': '',
                'optional': True,
                'name': 'maxError',
                'type': 'ErrorMargin'
            },
            {
                'default': None,
                'description': '',
                'optional': True,
                'name': 'proj',
                'type': 'Projection'
            },
            {
                'default': None,
                'description': '',
                'optional': True,
                'name': 'geodesics',
                'type': 'Boolean'
            }
        ],
        'type': 'Algorithm',
        'description': '',
    },
    'Number.add': {
        'returns': 'Number',
        'hidden': False,
        'args': [
            {
                'type': 'Number',
                'description': '',
                'name': 'left'
            },
            {
                'type': 'Number',
                'description': '',
                'name': 'right'
            }
        ],
        'type': 'Algorithm',
        'description': ''
    },
    'Array': {
        'returns': 'Array',
        'hidden': False,
        'args': [
            {
                'name': 'values',
                'type': 'Object'
            },
            {
                'name': 'pixelType',
                'type': 'PixelType',
                'optional': True,
                'default': None
            }
        ],
        'type': 'Algorithm',
        'description': ''
    },
    'List.slice': {
        'returns': 'List<Object>',
        'args': [
            {
                'type': 'List<Object>',
                'name': 'list'
            },
            {
                'type': 'Integer',
                'name': 'start'
            },
            {
                'default': None,
                'type': 'Integer',
                'optional': True,
                'name': 'end'
            }
        ],
        'type': 'Algorithm',
        'description': '',
    },
    'List.map': {
        'type': 'Algorithm',
        'args': [
            {
                'description': '',
                'name': 'list',
                'type': 'List'
            },
            {
                'description': '',
                'name': 'baseAlgorithm',
                'type': 'Algorithm'
            },
        ],
        'description': '',
        'returns': 'List'
    },
    'Profile.getProfiles': {
        'args': [
            {
                'description': '',
                'name': 'ids',
                'type': 'List<String>'
            },
            {
                'default': 'text',
                'description': '',
                'name': 'format',
                'optional': True,
                'type': 'String'
            }
        ],
        'description': '',
        'returns': 'Object',
        'type': 'Algorithm',
        'hidden': True
    },
    'Profile.getProfilesInternal': {
        'args': [
            {
                'description': '',
                'name': 'ids',
                'type': 'List<String>'
            },
            {
                'default': 'text',
                'description': '',
                'name': 'format',
                'optional': True,
                'type': 'String'
            }
        ],
        'description': '',
        'returns': 'Object',
        'type': 'Algorithm',
        'hidden': True
    },
    'Projection': {
        'returns': 'Projection',
        'type': 'Algorithm',
        'description': '',
        'args': [
            {
                'name': 'crs',
                'type': 'Object',
                'description': ''
            },
            {
                'name': 'transform',
                'default': None,
                'type': 'List<Number>',
                'optional': True,
                'description': ''
            },
            {
                'name': 'transformWkt',
                'default': None,
                'type': 'String',
                'optional': True,
                'description': '',
            }
        ]
    },
    'Image.cast': {
        'type': 'Algorithm',
        'args': [
            {
                'description': '',
                'name': 'image',
                'type': 'Image'
            },
            {
                'description': '',
                'name': 'bandTypes',
                'type': 'Dictionary'
            },
            {
                'default': None,
                'description': '',
                'optional': True,
                'name': 'bandOrder',
                'type': 'List'
            }
        ],
        'description': '',
        'returns': 'Image'
    },
    'Describe': {
        'type': 'Algorithm',
        'args': [
            {
                'description': '',
                'name': 'input',
                'type': 'Object'
            }
        ],
        'description': '',
        'returns': 'Object',
    },
    'Image.rename': {
        'type': 'Algorithm',
        'args': [
            {
                'description': '',
                'name': 'input',
                'type': 'Image'
            },
            {
                'description': '',
                'name': 'names',
                'type': 'List'
            }
        ],
        'description': '',
        'returns': 'Image'
    },
    'Dictionary': {
        'type': 'Algorithm',
        'args': [
            {
                'description': '',
                'name': 'input',
                'optional': 'true',
                'type': 'Object'
            }
        ],
        'returns': 'Dictionary'
    },
    'Image.visualize': {
        'type': 'Algorithm',
        'args': [
            {
                'description': '',
                'name': 'image',
                'type': 'Image'
            },
            {
                'description': '',
                'name': 'bands',
                'type': 'Object',
                'optional': 'true',
            },
            {
                'description': '',
                'name': 'gain',
                'type': 'Object',
                'optional': 'true',
            },
            {
                'description': '',
                'name': 'bias',
                'type': 'Object',
                'optional': 'true',
            },
            {
                'description': '',
                'name': 'min',
                'type': 'Object',
                'optional': 'true',
            },
            {
                'description': '',
                'name': 'max',
                'type': 'Object',
                'optional': 'true',
            },
            {
                'description': '',
                'name': 'gamma',
                'type': 'Object',
                'optional': 'true',
            },
            {
                'description': '',
                'name': 'opacity',
                'type': 'Object',
                'optional': 'true',
            },
            {
                'description': '',
                'name': 'palette',
                'type': 'Object',
                'optional': 'true',
            },
            {
                'description': '',
                'name': 'forceRgbOutput',
                'type': 'Boolean',
                'optional': 'true'
            }
        ],
        'description': '',
        'returns': 'Image<unknown bands>',
    },
    'Collection.first': {
        'type': 'Algorithm',
        'args': [
            {
                'description': '',
                'name': 'collection',
                'type': 'FeatureCollection'
            }
        ],
        'description': '',
        'returns': 'Element',
    },
    'Image.reproject': {
        'type': 'Algorithm',
        'args': [
            {
                'name': 'image',
                'type': 'Image',
                'description': ''
            },
            {
                'name': 'crs',
                'type': 'Projection',
                'description': ''
            },
            {
                'name': 'crsTransform',
                'type': 'List',
                'description': '',
                'optional': True,
            },
            {
                'name': 'scale',
                'type': 'Float',
                'description': '',
                'optional': True,
            }
        ],
        'description': '',
        'returns': 'Image',
    },
    'Image.setDefaultProjection': {
        'type': 'Algorithm',
        'args': [
            {
                'name': 'image',
                'type': 'Image',
                'description': ''
            },
            {
                'name': 'crs',
                'type': 'Projection',
                'description': ''
            },
            {
                'name': 'crsTransform',
                'type': 'List',
                'description': '',
                'optional': True,
            },
            {
                'name': 'scale',
                'type': 'Float',
                'description': '',
                'optional': True,
            }
        ],
        'description': '',
        'returns': 'Image',
    },
    'Image.clipToBoundsAndScale': {
        'type': 'Algorithm',
        'args': [
            {
                'name': 'input',
                'type': 'Image',
                'description': ''
            },
            {
                'name': 'geometry',
                'type': 'Geometry',
                'description': '',
                'optional': True,
            },
            {
                'name': 'width',
                'type': 'Integer',
                'description': '',
                'optional': True,
            },
            {
                'name': 'height',
                'type': 'Integer',
                'description': '',
                'optional': True,
            },
            {
                'name': 'maxDimension',
                'type': 'Integer',
                'description': '',
                'optional': True,
            },
            {
                'name': 'scale',
                'type': 'Double',
                'description': '',
                'optional': True,
            }
        ],
        'description': '',
        'returns': 'Image<unknown bands>',
    },
    'Image.projection': {
        'type': 'Algorithm',
        'args': [
            {
                'name': 'image',
                'type': 'Image',
                'description': ''
            }
        ],
        'description': '',
        'returns': 'Projection'
    },
}


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
