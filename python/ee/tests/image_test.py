#!/usr/bin/env python
"""Test for the ee.image module."""



import json
import mock

import unittest

import ee
from ee import apitestcase
from ee import ee_exception
from ee import serializer


class ImageTestCase(apitestcase.ApiTestCase):

  def testConstructors(self):
    """Verifies that constructors understand valid parameters."""
    from_constant = ee.Image(1)
    self.assertEqual(
        ee.ApiFunction.lookup('Image.constant'), from_constant.func)
    self.assertEqual({'value': 1}, from_constant.args)

    array_constant = ee.Array([1, 2])
    from_array_constant = ee.Image(array_constant)
    self.assertEqual(
        ee.ApiFunction.lookup('Image.constant'), from_array_constant.func)
    self.assertEqual({'value': array_constant}, from_array_constant.args)

    from_id = ee.Image('abcd')
    self.assertEqual(ee.ApiFunction.lookup('Image.load'), from_id.func)
    self.assertEqual({'id': 'abcd'}, from_id.args)

    from_array = ee.Image([1, 2])
    self.assertEqual(ee.ApiFunction.lookup('Image.addBands'), from_array.func)
    self.assertEqual({
        'dstImg': ee.Image(1),
        'srcImg': ee.Image(2)
    }, from_array.args)

    from_computed_object = ee.Image(ee.ComputedObject(None, {'x': 'y'}))
    self.assertEqual({'x': 'y'}, from_computed_object.args)

    original = ee.Image(1)
    from_other_image = ee.Image(original)
    self.assertEqual(from_other_image, original)

    from_nothing = ee.Image()
    self.assertEqual(ee.ApiFunction.lookup('Image.mask'), from_nothing.func)
    self.assertEqual({
        'image': ee.Image(0),
        'mask': ee.Image(0)
    }, from_nothing.args)

    from_id_and_version = ee.Image('abcd', 123)
    self.assertEqual(
        ee.ApiFunction.lookup('Image.load'), from_id_and_version.func)
    self.assertEqual({'id': 'abcd', 'version': 123}, from_id_and_version.args)

    from_variable = ee.Image(ee.CustomFunction.variable(None, 'foo'))
    self.assertTrue(isinstance(from_variable, ee.Image))
    self.assertEqual({
        'type': 'ArgumentRef',
        'value': 'foo'
    }, from_variable.encode(None))

  def testImageSignatures(self):
    """Verifies that the API functions are added to ee.Image."""
    self.assertTrue(hasattr(ee.Image(1), 'addBands'))

  def testImperativeFunctions(self):
    """Verifies that imperative functions return ready values."""
    image = ee.Image(1)
    self.assertEqual({'value': 'fakeValue'}, image.getInfo())
    map_id = image.getMapId()
    self.assertEqual('fakeMapId', map_id['mapid'])
    self.assertEqual(image, map_id['image'])

  def testGetMapIdVisualization(self):
    """Verifies that imperative functions return ready values."""
    image = ee.Image(1)
    image.getMapId({'min': 0})

    self.assertEqual(
        ee.Image(1).visualize(min=0).serialize(),
        self.last_mapid_call['data']['image'])

  def testCombine(self):
    """Verifies the behavior of ee.Image.combine_()."""
    image1 = ee.Image([1, 2])
    image2 = ee.Image([3, 4])
    combined = ee.Image.combine_([image1, image2], ['a', 'b', 'c', 'd'])

    self.assertEqual(ee.ApiFunction.lookup('Image.select'), combined.func)
    self.assertEqual(ee.List(['.*']), combined.args['bandSelectors'])
    self.assertEqual(ee.List(['a', 'b', 'c', 'd']), combined.args['newNames'])
    self.assertEqual(
        ee.ApiFunction.lookup('Image.addBands'), combined.args['input'].func)
    self.assertEqual({
        'dstImg': image1,
        'srcImg': image2
    }, combined.args['input'].args)

  def testSelect(self):
    """Verifies regression in the behavior of empty ee.Image.select()."""
    image = ee.Image([1, 2]).select()
    self.assertEqual(ee.ApiFunction.lookup('Image.select'), image.func)
    self.assertEqual(ee.List([]), image.args['bandSelectors'])

  def testRename(self):
    """Verifies image.rename varargs handling."""
    image = ee.Image([1, 2]).rename('a', 'b')
    self.assertEqual(ee.ApiFunction.lookup('Image.rename'), image.func)
    self.assertEqual(ee.List(['a', 'b']), image.args['names'])

    image = ee.Image([1, 2]).rename(['a', 'b'])
    self.assertEqual(ee.ApiFunction.lookup('Image.rename'), image.func)
    self.assertEqual(ee.List(['a', 'b']), image.args['names'])

    image = ee.Image([1]).rename('a')
    self.assertEqual(ee.ApiFunction.lookup('Image.rename'), image.func)
    self.assertEqual(ee.List(['a']), image.args['names'])

  def testExpression(self):
    """Verifies the behavior of ee.Image.expression()."""
    image = ee.Image([1, 2]).expression('a', {'b': 'c'})
    expression_func = image.func

    # The call is buried in a one-time override of .encode so we have to call
    # it rather than comparing the object structure.
    def dummy_encoder(x):
      if isinstance(x, ee.encodable.Encodable):
        return x.encode(dummy_encoder)
      elif isinstance(x, ee.encodable.EncodableFunction):
        return x.encode_invocation(dummy_encoder)
      else:
        return x

    self.assertEqual({
        'type': 'Invocation',
        'functionName': 'Image.parseExpression',
        'arguments': {
            'expression': 'a',
            'argName': 'DEFAULT_EXPRESSION_IMAGE',
            'vars': ['DEFAULT_EXPRESSION_IMAGE', 'b']
        }
    }, dummy_encoder(expression_func))

  def testExpressionInCloudAPI(self):
    """Verifies the behavior of ee.Image.expression() in the Cloud API."""
    image = ee.Image(1).expression('a', {'b': 'c'})

    self.assertEqual({
        'result': '0',
        'values': {
            '0': {
                'functionInvocationValue': {
                    'arguments': {
                        'b': {
                            'functionInvocationValue': {
                                'arguments': {
                                    'id': {
                                        'constantValue': 'c'
                                    }
                                },
                                'functionName': 'Image.load'
                            }
                        },
                        'DEFAULT_EXPRESSION_IMAGE': {
                            'functionInvocationValue': {
                                'arguments': {
                                    'value': {
                                        'constantValue': 1
                                    }
                                },
                                'functionName': 'Image.constant'
                            }
                        }
                    },
                    'functionReference': '1'
                }
            },
            '1': {
                'functionInvocationValue': {
                    'arguments': {
                        'expression': {
                            'constantValue': 'a'
                        },
                        'argName': {
                            'valueReference': '2'
                        },
                        'vars': {
                            'arrayValue': {
                                'values': [{
                                    'valueReference': '2'
                                }, {
                                    'constantValue': 'b'
                                }]
                            }
                        }
                    },
                    'functionName': 'Image.parseExpression'
                }
            },
            '2': {
                'constantValue': 'DEFAULT_EXPRESSION_IMAGE'
            }
        }
    }, serializer.encode(image, for_cloud_api=True))

  def testDownload(self):
    """Verifies Download ID and URL generation."""
    url = ee.Image(1).getDownloadURL()

    self.assertEqual('/download', self.last_download_call['url'])
    self.assertEqual({
        'image': ee.Image(1).serialize(),
        'json_format': 'v2'
    }, self.last_download_call['data'])
    self.assertEqual('/api/download?docid=1&token=2', url)

  def testThumb(self):
    """Verifies Thumbnail ID and URL generation."""
    geo_json = {
        'type': 'Polygon',
        'coordinates': [[
            [-112.587890625, 44.94924926661151],
            [-114.873046875, 39.48708498168749],
            [-103.623046875, 41.82045509614031],
        ]],
    }
    url = ee.Image(1).getThumbURL({
        'size': [13, 42],
        'region': geo_json,
    })

    self.assertEqual('/thumb', self.last_thumb_call['url'])
    self.assertEqual({
        'image': ee.Image(1).serialize(),
        'json_format': 'v2',
        'size': '13x42',
        'getid': '1',
        'region': json.dumps(geo_json),
    }, self.last_thumb_call['data'])
    self.assertEqual('/api/thumb?thumbid=3&token=4', url)

    # Again with visualization parameters
    url = ee.Image(1).getThumbURL({
        'size': [13, 42],
        'region': geo_json,
        'min': 0
    })
    self.assertEqual(
        ee.Image(1).visualize(min=0).serialize(),
        self.last_thumb_call['data']['image'])

  def testThumbInCloudApi(self):
    """Verifies Thumbnail ID and URL generation in the Cloud API."""
    geo_json = {
        'type':
            'Polygon',
        'coordinates': [[
            [-112.587890625, 44.94924926661151],
            [-114.873046875, 39.48708498168749],
            [-103.623046875, 41.82045509614031],
        ]],
    }

    cloud_api_resource = mock.MagicMock()
    cloud_api_resource.projects().thumbnails().create().execute.return_value = {
        'name': 'thumbName'
    }

    with apitestcase.UsingCloudApi(cloud_api_resource=cloud_api_resource):
      url = ee.Image(1).getThumbURL({
          'dimensions': [13, 42],
          'region': geo_json,
          'crs': 'EPSG:4326',
      })

      self.assertEqual('/v1alpha/thumbName:getPixels', url)
      _, kwargs = cloud_api_resource.projects().thumbnails().create.call_args
      self.assertEqual(
          kwargs['body']['expression'],
          serializer.encode(
              ee.Image(1).setDefaultProjection(
                  crs='EPSG:4326',
                  crsTransform=[1, 0, 0, 0, -1, 0]).clipToBoundsAndScale(
                      geometry=geo_json,
                      width=13,
                      height=42),
              for_cloud_api=True))
      self.assertEqual(kwargs['parent'], 'projects/earthengine-legacy')

    # Try it with the region as a GeoJSON string.
    with apitestcase.UsingCloudApi(cloud_api_resource=cloud_api_resource):
      url = ee.Image(1).getThumbURL({
          'dimensions': [13, 42],
          'region': json.dumps(geo_json),
      })

      _, kwargs = cloud_api_resource.projects().thumbnails().create.call_args
      self.assertEqual(
          kwargs['body']['expression'],
          serializer.encode(
              ee.Image(1).clipToBoundsAndScale(
                  geometry=geo_json, width=13, height=42),
              for_cloud_api=True))
      self.assertEqual(kwargs['parent'], 'projects/earthengine-legacy')

    # Again with visualization parameters
    with apitestcase.UsingCloudApi(cloud_api_resource=cloud_api_resource):
      url = ee.Image(1).getThumbURL({
          'dimensions': [13, 42],
          'region': geo_json,
          'min': 0
      })
      _, kwargs = cloud_api_resource.projects().thumbnails().create.call_args
      self.assertEqual(
          kwargs['body']['expression'],
          serializer.encode(
              ee.Image(1).clipToBoundsAndScale(
                  geometry=geo_json, width=13, height=42).visualize(min=0),
              for_cloud_api=True))

  def testPrepareForExport(self):
    """Verifies proper handling of export-related parameters."""
    with apitestcase.UsingCloudApi():
      base_image = ee.Image(1)

      image, params = base_image.prepare_for_export({'something': 'else'})
      self.assertEqual(base_image, image)
      self.assertEqual({'something': 'else'}, params)

      image, params = base_image.prepare_for_export({
          'crs': 'ABCD',
          'crs_transform': '1,2,3,4,5,6'
      })
      self.assertEqual(
          base_image.reproject(crs='ABCD', crsTransform=[1, 2, 3, 4, 5, 6]),
          image)
      self.assertEqual({}, params)

      with self.assertRaises(ee_exception.EEException):
        image, params = base_image.prepare_for_export(
            {'crs_transform': '1,2,3,4,5,6'})
      with self.assertRaises(ValueError):
        image, params = base_image.prepare_for_export({
            'crs': 'ABCD',
            'crs_transform': 'x'
        })

      point = ee.Geometry.Point(9, 8)
      image, params = base_image.prepare_for_export({
          'dimensions': '3x2',
          'region': point
      })
      self.assertEqual(
          base_image.clipToBoundsAndScale(width=3, height=2, geometry=point),
          image)
      self.assertEqual({}, params)

      image, params = base_image.prepare_for_export({
          'scale': 8,
          'region': point.toGeoJSONString(),
          'something': 'else'
      })
      self.assertEqual(
          base_image.clipToBoundsAndScale(scale=8, geometry=point), image)
      self.assertEqual({'something': 'else'}, params)

      image, params = base_image.prepare_for_export({
          'crs': 'ABCD',
          'crs_transform': '[1,2,3,4,5,6]',
          'dimensions': [3, 2],
          'region': point.toGeoJSONString(),
          'something': 'else'
      })
      self.assertEqual(
          base_image.reproject(
              crs='ABCD', crsTransform=[1, 2, 3, 4, 5, 6]).clipToBoundsAndScale(
                  width=3, height=2, geometry=point), image)
      self.assertEqual({'something': 'else'}, params)

      # Special case of crs+transform+two dimensions
      image, params = base_image.prepare_for_export({
          'crs': 'ABCD',
          'crs_transform': [1, 2, 3, 4, 5, 6],
          'dimensions': [3, 2],
          'something': 'else'
      })
      reprojected_image = base_image.reproject(
          crs='ABCD', crsTransform=[1, 2, 3, 4, 5, 6])
      self.assertEqual(
          reprojected_image.clipToBoundsAndScale(
              geometry=ee.Geometry.Rectangle(
                  coords=[0, 0, 3, 2],
                  proj=reprojected_image.projection(),
                  geodesic=False,
                  evenOdd=True)), image)
      self.assertEqual({'something': 'else'}, params)

      # CRS with no crs_transform causes a "soft" reprojection. Make sure that
      # the (crs, crsTransform, dimensions) special case doesn't trigger.
      image, params = base_image.prepare_for_export({
          'crs': 'ABCD',
          'dimensions': [3, 2],
          'something': 'else'
      })
      self.assertEqual(
          base_image.setDefaultProjection(
              crs='ABCD',
              crsTransform=[1, 0, 0, 0, -1, 0]).clipToBoundsAndScale(
                  width=3, height=2), image)
      self.assertEqual({'something': 'else'}, params)


if __name__ == '__main__':
  unittest.main()
