#!/usr/bin/env python3
"""Test for the ee.image module."""

import json
from typing import Any, Dict
from unittest import mock

import unittest
import ee
from ee import _cloud_api_utils
from ee import apitestcase
from ee import ee_exception
from ee import serializer

EPSG_3857 = 'EPSG:3857'
EPSG_4326 = 'EPSG:4326'

# ee.Image('a').serialize()
IMAGE = {
    'functionInvocationValue': {
        'functionName': 'Image.load',
        'arguments': {'id': {'constantValue': 'a'}},
    }
}
IMAGE_B = {
    'functionInvocationValue': {
        'functionName': 'Image.load',
        'arguments': {'id': {'constantValue': 'b'}},
    }
}
IMAGE_C = {
    'functionInvocationValue': {
        'functionName': 'Image.load',
        'arguments': {'id': {'constantValue': 'c'}},
    }
}


def make_expression_graph(
    function_invocation_value: Dict[str, Any],
) -> Dict[str, Any]:
  return {
      'result': '0',
      'values': {'0': {'functionInvocationValue': function_invocation_value}},
  }


class ImageTest(apitestcase.ApiTestCase):

  def test_constructors(self):
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
    self.assertIsInstance(from_variable, ee.Image)
    self.assertEqual({
        'type': 'ArgumentRef',
        'value': 'foo'
    }, from_variable.encode(None))

  def test_image_signatures(self):
    """Verifies that the API functions are added to ee.Image."""
    self.assertTrue(hasattr(ee.Image(1), 'addBands'))

  def test_imperative_functions(self):
    """Verifies that imperative functions return ready values."""
    image = ee.Image(1)
    self.assertEqual({'value': 'fakeValue'}, image.getInfo())
    map_id = image.getMapId()
    self.assertEqual('fakeMapId', map_id['mapid'])
    self.assertEqual(image, map_id['image'])

  def test_get_map_id_visualization(self):
    """Verifies that imperative functions return ready values."""
    image = ee.Image(1)
    image.getMapId({'min': 0})

    self.assertEqual(
        ee.Image(1).visualize(min=0).serialize(),
        self.last_mapid_call['data']['image'].serialize())

  def test_combine(self):
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

  def test_select(self):
    """Verifies regression in the behavior of empty ee.Image.select()."""
    image = ee.Image([1, 2]).select()
    self.assertEqual(ee.ApiFunction.lookup('Image.select'), image.func)
    self.assertEqual(ee.List([]), image.args['bandSelectors'])

  def test_rename(self):
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

  def test_expression(self):
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

  def test_expression_in_cloud_api(self):
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

  def test_download(self):
    """Verifies Download ID and URL generation."""
    ee.Image(1).getDownloadURL()

    self.assertEqual('/download', self.last_download_call['url'])
    self.assertEqual(
        ee.Image(1).serialize(),
        self.last_download_call['data']['image'].serialize())


class CloudThumbnailAndExportImageTest(apitestcase.ApiTestCase):

  @property
  def _base_image(self):
    return ee.Image(1)

  @property
  def _geo_json(self):
    return {
        'type': 'Polygon',
        'coordinates': [[
            [-112.587890625, 44.94924926661151],
            [-114.873046875, 39.48708498168749],
            [-103.623046875, 41.82045509614031],
        ]],
    }

  @property
  def _expected_geometry(self):
    return ee.Geometry(self._geo_json, geodesic=False)

  def assertImageEqual(self, expected, actual):
    self.assertDictEqual(serializer.encode(expected), serializer.encode(actual))

  def test_thumb_with_dimensions_region_crs(self):
    """Verifies Thumbnail ID and URL generation in the Cloud API."""
    cloud_api_resource = mock.MagicMock()
    with apitestcase.UsingCloudApi(cloud_api_resource=cloud_api_resource):
      ee.data.getThumbId = self.old_get_thumb_id
      cloud_api_resource.projects().thumbnails().create().execute.return_value = {
          'name': 'thumbName'
      }
      url = self._base_image.getThumbURL({
          'dimensions': [13, 42],
          'region': self._geo_json,
          'crs': EPSG_4326,
      })

      # The tile base url is empty because ApiTestCase sets it that way.
      self.assertEqual(
          '/%s/thumbName:getPixels' % _cloud_api_utils.VERSION, url
      )
      _, kwargs = cloud_api_resource.projects().thumbnails().create.call_args
      self.assertEqual(
          kwargs['body']['expression'],
          serializer.encode(
              self._base_image.setDefaultProjection(
                  crs=EPSG_4326, crsTransform=[1, 0, 0, 0, -1, 0]
              ).clipToBoundsAndScale(
                  geometry=ee.Geometry(self._geo_json, geodesic=False),
                  width=13,
                  height=42,
              )
          ),
      )
      self.assertEqual('projects/my-project', kwargs['parent'])

  def test_thumb_with_dimensions_region_json(self):
    # Try it with the region as a GeoJSON string.
    cloud_api_resource = mock.MagicMock()
    with apitestcase.UsingCloudApi(cloud_api_resource=cloud_api_resource):
      ee.data.getThumbId = self.old_get_thumb_id
      cloud_api_resource.projects().thumbnails().create().execute.return_value = {
          'name': 'thumbName'
      }
      self._base_image.getThumbURL({
          'dimensions': [13, 42],
          'region': json.dumps(self._geo_json),
      })

      _, kwargs = cloud_api_resource.projects().thumbnails().create.call_args
      self.assertEqual(
          kwargs['body']['expression'],
          serializer.encode(
              self._base_image.clipToBoundsAndScale(
                  geometry=self._expected_geometry, width=13, height=42
              )
          ),
      )
      self.assertEqual('projects/my-project', kwargs['parent'])

  def test_thumb_with_dimensions_list_coords(self):
    # Try it with the region as a list of coordinates.
    cloud_api_resource = mock.MagicMock()
    with apitestcase.UsingCloudApi(cloud_api_resource=cloud_api_resource):
      ee.data.getThumbId = self.old_get_thumb_id
      cloud_api_resource.projects().thumbnails().create().execute.return_value = {
          'name': 'thumbName'
      }
      self._base_image.getThumbURL({
          'dimensions': [13, 42],
          'region': [[-180, -90], [-180, 90], [180, 90]],
      })

      _, kwargs = cloud_api_resource.projects().thumbnails().create.call_args
      expected_geometry = ee.Geometry.Polygon(
          [[-180, -90], [-180, 90], [180, 90]], proj=None, geodesic=False)
      self.assertEqual(
          kwargs['body']['expression'],
          serializer.encode(
              self._base_image.clipToBoundsAndScale(
                  geometry=expected_geometry, width=13, height=42
              )
          ),
      )
      self.assertEqual('projects/my-project', kwargs['parent'])

  def test_thumb_with_dimensions_list_min_max(self):
    # Try it with the region as a list of coordinates.
    cloud_api_resource = mock.MagicMock()
    with apitestcase.UsingCloudApi(cloud_api_resource=cloud_api_resource):
      ee.data.getThumbId = self.old_get_thumb_id
      cloud_api_resource.projects().thumbnails().create().execute.return_value = {
          'name': 'thumbName'
      }
      self._base_image.getThumbURL({
          'dimensions': [13, 42],
          'region': [-180, -90, 180, 90],
      })

      _, kwargs = cloud_api_resource.projects().thumbnails().create.call_args
      expected_geometry = ee.Geometry.Rectangle(
          [-180, -90, 180, 90], proj=None, geodesic=False)
      self.assertEqual(
          kwargs['body']['expression'],
          serializer.encode(
              self._base_image.clipToBoundsAndScale(
                  geometry=expected_geometry, width=13, height=42
              )
          ),
      )
      self.assertEqual('projects/my-project', kwargs['parent'])

  def test_thumb_with_visualization_params(self):
    cloud_api_resource = mock.MagicMock()
    with apitestcase.UsingCloudApi(cloud_api_resource=cloud_api_resource):
      ee.data.getThumbId = self.old_get_thumb_id
      cloud_api_resource.projects().thumbnails().create().execute.return_value = {
          'name': 'thumbName'
      }
      self._base_image.getThumbURL(
          {'dimensions': [13, 42], 'region': self._geo_json, 'min': 0}
      )
      _, kwargs = cloud_api_resource.projects().thumbnails().create.call_args

      self.assertEqual(
          kwargs['body']['expression'],
          serializer.encode(
              self._base_image.clipToBoundsAndScale(
                  geometry=self._expected_geometry, width=13, height=42
              ).visualize(min=0)
          ),
      )

  def test_build_download_id_image_builds_image_per_band(self):
    test_image = ee.Image('foo')

    # Format is file per band and bands specified: build image out of individual
    # band images.
    params = {
        'format':
            'ZIPPED_GEO_TIFF_PER_BAND',
        'bands': [{
            'id': 'B1',
            'dimensions': 123,
        }, {
            'id': 'B2',
            'dimensions': 456,
        }, {
            'id': 'B3',
            'dimensions': 789,
        }],
    }
    image_str = test_image._build_download_id_image(params).serialize()
    self.assertEqual(2, image_str.count('addBands'))
    self.assertEqual(3, image_str.count('maxDimension'))
    self.assertEqual(1, image_str.count('123'))
    self.assertEqual(1, image_str.count('456'))
    self.assertEqual(1, image_str.count('789'))

    # Override the parameters supplied in the top level with the bands
    # parameters
    params = {
        'format': 'ZIPPED_GEO_TIFF_PER_BAND',
        'bands': [{
            'id': 'B1',
            'dimensions': 123,
        }, {
            'id': 'B2',
            'dimensions': 456,
        }, {
            'id': 'B3',
        }],
        'dimensions': 999,
    }
    image_str = test_image._build_download_id_image(params).serialize()
    self.assertEqual(2, image_str.count('addBands'))
    self.assertEqual(3, image_str.count('maxDimension'))
    self.assertEqual(1, image_str.count('123'))
    self.assertEqual(1, image_str.count('456'))
    self.assertEqual(0, image_str.count('789'))
    self.assertEqual(1, image_str.count('999'))

  def test_build_download_id_image_transforms_given_image(self):
    test_image = ee.Image('foo')

    # Format is file per band and bands specified: build image out of individual
    # band images.
    params = {
        'format': 'ZIPPED_GEO_TIFF_PER_BAND',
        'bands': [],
        'dimensions': 123,
    }
    image_str = test_image._build_download_id_image(params).serialize()
    self.assertEqual(0, image_str.count('addBands'))
    self.assertEqual(1, image_str.count('maxDimension'))
    self.assertEqual(1, image_str.count('123'))

    # Format is file per band and no bands specified: apply transforms directly
    # to image.
    params = {
        'format': 'ZIPPED_GEO_TIFF_PER_BAND',
        'dimensions': 123,
    }
    image_str = test_image._build_download_id_image(params).serialize()
    self.assertEqual(0, image_str.count('addBands'))
    self.assertEqual(1, image_str.count('maxDimension'))
    self.assertEqual(1, image_str.count('123'))

    # Format is a single tiff: apply transforms directly to image and ignore
    # band transformation properties.
    params = {
        'format': 'ZIPPED_GEO_TIFF',
        'bands': [{
            'id': 'B1',
            'dimensions': 123,
        }, {
            'id': 'B2',
            'dimensions': 456,
        }, {
            'id': 'B3',
            'dimensions': 789,
        }],
        'dimensions': 999,
    }
    image_str = test_image._build_download_id_image(params).serialize()
    self.assertEqual(0, image_str.count('addBands'))
    self.assertEqual(1, image_str.count('maxDimension'))
    self.assertEqual(0, image_str.count('123'))
    self.assertEqual(0, image_str.count('456'))
    self.assertEqual(0, image_str.count('789'))
    self.assertEqual(1, image_str.count('999'))

  def test_build_download_id_image_handles_invalid_parameters(self):
    # No band ID in band dictionary.
    params = {
        'format': 'ZIPPED_GEO_TIFF_PER_BAND',
        'bands': [{
            'id': 'B1',
            'dimensions': 123,
        }, {
            'id': 'B2',
            'dimensions': 456,
        }, {
            'dimensions': 789,
        }],
        'dimensions': 999,
    }
    with self.assertRaisesRegex(
        ee_exception.EEException, 'Each band dictionary must have an id.'
    ):
      ee.Image('foo')._build_download_id_image(params)

  def test_build_download_id_image_handles_dimensions_and_scale(self):
    test_image = ee.Image('foo')
    dimensions = 123
    scale = 456

    # File per band: ignores scale parameter if dimensions specified.
    params = {
        'format': 'ZIPPED_GEO_TIFF_PER_BAND',
        'dimensions': dimensions,
        'scale': scale,
    }
    image_str = test_image._build_download_id_image(params).serialize()
    self.assertEqual(1, image_str.count(str(dimensions)))
    self.assertEqual(0, image_str.count(str(scale)))

    # File per band: ignores scale parameter if dimensions specified in band.
    params = {
        'format': 'ZIPPED_GEO_TIFF_PER_BAND',
        'bands': [{
            'id': 'B1',
            'dimensions': dimensions
        }],
        'scale': scale,
    }
    image_str = test_image._build_download_id_image(params).serialize()
    self.assertEqual(1, image_str.count(str(dimensions)))
    self.assertEqual(0, image_str.count(str(scale)))

    # Single tiff: ignores scale parameter if dimensions specified.
    params = {
        'format': 'ZIPPED_GEO_TIFF',
        'dimensions': dimensions,
        'scale': scale,
    }
    image_str = test_image._build_download_id_image(params).serialize()
    self.assertEqual(1, image_str.count(str(dimensions)))
    self.assertEqual(0, image_str.count(str(scale)))

    # Single tiff: ignores all parameters in bands.
    params = {
        'format': 'ZIPPED_GEO_TIFF',
        'bands': [{
            'id': 'B1',
            'dimensions': dimensions
        }],
        'scale': scale,
    }
    image_str = test_image._build_download_id_image(params).serialize()
    self.assertEqual(0, image_str.count(str(dimensions)))
    self.assertEqual(1, image_str.count(str(scale)))

    # Single tiff: ignores all parameters in bands.
    params = {
        'format': 'ZIPPED_GEO_TIFF',
        'bands': [{
            'id': 'B1',
            'scale': scale
        }],
        'dimensions': dimensions,
    }
    image_str = test_image._build_download_id_image(params).serialize()
    self.assertEqual(1, image_str.count(str(dimensions)))
    self.assertEqual(0, image_str.count(str(scale)))

  def test_download_url(self):
    """Verifies that the getDownloadURL request is constructed correctly."""
    cloud_api_resource = mock.MagicMock()
    with apitestcase.UsingCloudApi(cloud_api_resource=cloud_api_resource):
      ee.data.getDownloadId = self.old_get_download_id
      cloud_api_resource.projects().thumbnails().create().execute.return_value = {
          'name': 'thumbName'
      }
      url = self._base_image.getDownloadURL()
      _, kwargs = cloud_api_resource.projects().thumbnails().create.call_args
      self.assertEqual(
          serializer.encode(self._base_image, for_cloud_api=True),
          kwargs['body']['expression'],
      )
      self.assertEqual('ZIPPED_GEO_TIFF_PER_BAND', kwargs['body']['fileFormat'])
      self.assertEqual('projects/my-project', kwargs['parent'])
      self.assertEqual(
          '/%s/thumbName:getPixels' % _cloud_api_utils.VERSION, url
      )

  def test_prepare_for_export_simple(self):
    """Verifies proper handling of export-related parameters."""

    with apitestcase.UsingCloudApi():
      image, params = self._base_image.prepare_for_export({'something': 'else'})
      self.assertImageEqual(self._base_image, image)
      self.assertEqual({'something': 'else'}, params)

  def test_prepare_for_export_with_crs_and_transform(self):
    with apitestcase.UsingCloudApi():
      image, params = self._base_image.prepare_for_export(
          {'crs': 'ABCD', 'crs_transform': '1,2,3,4,5,6'}
      )
      self.assertImageEqual(
          self._base_image.reproject(
              crs='ABCD', crsTransform=[1, 2, 3, 4, 5, 6]
          ),
          image,
      )
      self.assertEqual({}, params)

  def test_prepare_for_export_invalid_crs_and_transform(self):
    with apitestcase.UsingCloudApi():
      with self.assertRaises(ee_exception.EEException):
        self._base_image.prepare_for_export({'crs_transform': '1,2,3,4,5,6'})
      with self.assertRaises(ValueError):
        self._base_image.prepare_for_export(
            {'crs': 'ABCD', 'crs_transform': 'x'}
        )

  def test_prepare_for_export_with_polygon(self):
    with apitestcase.UsingCloudApi():
      polygon = ee.Geometry.Polygon(9, 8, 7, 6, 3, 2)
      image, params = self._base_image.prepare_for_export(
          {'dimensions': '3x2', 'region': polygon}
      )
      expected = self._base_image.clipToBoundsAndScale(
          width=3, height=2, geometry=polygon
      )
      self.assertImageEqual(expected, image)
      self.assertEqual({}, params)

  def test_prepare_for_export_with_scale_and_region(self):
    with apitestcase.UsingCloudApi():
      polygon = ee.Geometry.Polygon(9, 8, 7, 6, 3, 2)
      image, params = self._base_image.prepare_for_export(
          {'scale': 8, 'region': polygon.toGeoJSONString(), 'something': 'else'}
      )
      expected_polygon = ee.Geometry(polygon.toGeoJSON(), geodesic=False)
      self.assertImageEqual(
          self._base_image.clipToBoundsAndScale(
              scale=8, geometry=expected_polygon
          ),
          image,
      )
      self.assertEqual({'something': 'else'}, params)

  def test_prepare_for_export_with_region_dimensions_crs_and_transform(self):
    with apitestcase.UsingCloudApi():
      polygon = ee.Geometry.Polygon(9, 8, 7, 6, 3, 2)
      image, params = self._base_image.prepare_for_export({
          'crs': 'ABCD',
          'crs_transform': '[1,2,3,4,5,6]',
          'dimensions': [3, 2],
          'region': polygon.toGeoJSONString(),
          'something': 'else'
      })
      expected_polygon = ee.Geometry(polygon.toGeoJSON(), geodesic=False)
      projected = self._base_image.reproject(
          crs='ABCD', crsTransform=[1, 2, 3, 4, 5, 6]
      )

      self.assertImageEqual(
          projected.clipToBoundsAndScale(
              width=3, height=2, geometry=expected_polygon), image)
      self.assertEqual({'something': 'else'}, params)

  def test_prepare_for_export_with_dimensions_crs_and_transform(self):
    with apitestcase.UsingCloudApi():
      # Special case of crs+transform+two dimensions
      image, params = self._base_image.prepare_for_export({
          'crs': 'ABCD',
          'crs_transform': [1, 2, 3, 4, 5, 6],
          'dimensions': [3, 2],
          'something': 'else'
      })
      self.assertEqual({'something': 'else'}, params)

      reprojected_image = self._base_image.reproject(
          crs='ABCD', crsTransform=[1, 2, 3, 4, 5, 6]
      )

      expected_expression = reprojected_image.clipToBoundsAndScale(
          geometry=ee.Geometry.Rectangle(
              coords=[0, 0, 3, 2],
              proj=reprojected_image.projection(),
              geodesic=False,
              evenOdd=True,
          )
      )
      self.assertEqual(
          json.loads(image.serialize()),
          json.loads(expected_expression.serialize()),
      )

  def test_prepare_for_export_with_only_region(self):
    with apitestcase.UsingCloudApi():
      polygon = ee.Geometry.Polygon(9, 8, 7, 6, 3, 2)
      image, params = self._base_image.prepare_for_export(
          {'region': polygon, 'something': 'else'}
      )

      self.assertEqual(self._base_image.clip(polygon), image)
      self.assertEqual({'something': 'else'}, params)

  def test_prepare_for_export_with_crs_no_transform(self):
    with apitestcase.UsingCloudApi():
      # CRS with no crs_transform causes a "soft" reprojection. Make sure that
      # the (crs, crsTransform, dimensions) special case doesn't trigger.
      image, params = self._base_image.prepare_for_export(
          {'crs': 'ABCD', 'dimensions': [3, 2], 'something': 'else'}
      )
      self.assertEqual({'something': 'else'}, params)

      projected = self._base_image.setDefaultProjection(
          crs='ABCD', crsTransform=[1, 0, 0, 0, -1, 0]
      )

      expected_expression = projected.clipToBoundsAndScale(width=3, height=2)
      self.assertEqual(
          json.loads(image.serialize()),
          json.loads(expected_expression.serialize()),
      )

  def test_morphological_operators(self):
    """Verifies the focal operators are installed with aliases."""
    ee.Image(0).focal_min().focalMin()

  def test_select_opt_params(self):
    result = (
        ee.Image(1)
        .select(opt_selectors=['selector_a', 4], opt_names=['name_a', 'name_b'])
        .serialize()
    )
    self.assertIn(
        '"bandSelectors": {"constantValue": ["selector_a", 4]}', result
    )
    self.assertIn('"newNames": {"constantValue": ["name_a", "name_b"]}', result)

  def test_expression_opt_params(self):
    result = (
        ee.Image(1)
        .expression(expression='abc(0)', opt_map={'bcd': 'cef'})
        .serialize()
    )
    # The values are nested too deep to compare the entire node.
    self.assertIn('bcd', result)
    self.assertIn('cef', result)


class SerializeTest(apitestcase.ApiTestCase):

  def test_abs(self):
    expect = make_expression_graph({
        'arguments': {
            'value': IMAGE,
        },
        'functionName': 'Image.abs',
    })
    expression = ee.Image('a').abs()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_acos(self):
    expect = make_expression_graph({
        'arguments': {
            'value': IMAGE,
        },
        'functionName': 'Image.acos',
    })
    expression = ee.Image('a').acos()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_add(self):
    expect = make_expression_graph({
        'arguments': {
            'image1': IMAGE,
            'image2': IMAGE_B,
        },
        'functionName': 'Image.add',
    })
    expression = ee.Image('a').add('b')
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').add(image2='b')
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_add_bands(self):
    names = ['one', 'two']
    overwrite = True
    expect = make_expression_graph({
        'arguments': {
            'dstImg': IMAGE,
            'srcImg': IMAGE_B,
            'names': {'constantValue': names},
            'overwrite': {'constantValue': overwrite},
        },
        'functionName': 'Image.addBands',
    })
    expression = ee.Image('a').addBands('b', names, overwrite)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').addBands(
        srcImg='b', names=names, overwrite=overwrite
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_and(self):
    expect = make_expression_graph({
        'arguments': {
            'image1': IMAGE,
            'image2': IMAGE_B,
        },
        'functionName': 'Image.and',
    })
    expression = ee.Image('a').And('b')
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').And(image2='b')
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_array_accum(self):
    axis = 1
    reducer = ee.Reducer.sum()
    expect = make_expression_graph({
        'arguments': {
            'input': IMAGE,
            'axis': {'constantValue': axis},
            'reducer': {
                'functionInvocationValue': {
                    'functionName': 'Reducer.sum',
                    'arguments': {},
                }
            },
        },
        'functionName': 'Image.arrayAccum',
    })
    expression = ee.Image('a').arrayAccum(axis, reducer)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').arrayAccum(axis=axis, reducer=reducer)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_array_argmax(self):
    expect = make_expression_graph({
        'arguments': {
            'image': IMAGE,
        },
        'functionName': 'Image.arrayArgmax',
    })
    expression = ee.Image('a').arrayArgmax()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_array_cat(self):
    axis = 1
    expect = make_expression_graph({
        'arguments': {
            'image1': IMAGE,
            'image2': IMAGE_B,
            'axis': {'constantValue': axis},
        },
        'functionName': 'Image.arrayCat',
    })
    expression = ee.Image('a').arrayCat('b', axis)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').arrayCat(image2='b', axis=axis)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_array_dimensions(self):
    expect = make_expression_graph({
        'arguments': {
            'input': IMAGE,
        },
        'functionName': 'Image.arrayDimensions',
    })
    expression = ee.Image('a').arrayDimensions()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_array_dot_product(self):
    expect = make_expression_graph({
        'arguments': {
            'image1': IMAGE,
            'image2': IMAGE_B,
        },
        'functionName': 'Image.arrayDotProduct',
    })
    expression = ee.Image('a').arrayDotProduct('b')
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').arrayDotProduct(image2='b')
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_array_flatten(self):
    coordinate_labels = ['b', 'c']
    separator = 'a separator'
    expect = make_expression_graph({
        'arguments': {
            'image': IMAGE,
            'coordinateLabels': {'constantValue': coordinate_labels},
            'separator': {'constantValue': separator},
        },
        'functionName': 'Image.arrayFlatten',
    })
    expression = ee.Image('a').arrayFlatten(coordinate_labels, separator)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').arrayFlatten(
        coordinateLabels=coordinate_labels, separator=separator
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_array_get(self):
    expect = make_expression_graph({
        'arguments': {
            'image': IMAGE,
            'position': IMAGE_B,
        },
        'functionName': 'Image.arrayGet',
    })
    expression = ee.Image('a').arrayGet('b')
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').arrayGet(position='b')
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_array_length(self):
    axis = 1
    expect = make_expression_graph({
        'arguments': {
            'input': IMAGE,
            'axis': {'constantValue': axis},
        },
        'functionName': 'Image.arrayLength',
    })
    expression = ee.Image('a').arrayLength(axis)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').arrayLength(axis=axis)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_array_lengths(self):
    expect = make_expression_graph({
        'arguments': {
            'input': IMAGE,
        },
        'functionName': 'Image.arrayLengths',
    })
    expression = ee.Image('a').arrayLengths()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_array_mask(self):
    expect = make_expression_graph({
        'arguments': {
            'input': IMAGE,
            'mask': IMAGE_B,
        },
        'functionName': 'Image.arrayMask',
    })
    expression = ee.Image('a').arrayMask('b')
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').arrayMask(mask='b')
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_array_pad(self):
    lengths = [1, 2]
    pad = 3
    expect = make_expression_graph({
        'arguments': {
            'image': IMAGE,
            'lengths': {'constantValue': lengths},
            'pad': {'constantValue': pad},
        },
        'functionName': 'Image.arrayPad',
    })
    expression = ee.Image('a').arrayPad(lengths, pad)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').arrayPad(lengths=lengths, pad=pad)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_array_project(self):
    axes = [1, 2]
    expect = make_expression_graph({
        'arguments': {
            'input': IMAGE,
            'axes': {'constantValue': axes},
        },
        'functionName': 'Image.arrayProject',
    })
    expression = ee.Image('a').arrayProject(axes)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').arrayProject(axes=axes)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_array_reduce(self):
    reducer = ee.Reducer.sum()
    axes = [1, 2]
    field_axes = 3
    expect = make_expression_graph({
        'arguments': {
            'input': IMAGE,
            'reducer': {
                'functionInvocationValue': {
                    'functionName': 'Reducer.sum',
                    'arguments': {},
                }
            },
            'axes': {'constantValue': axes},
            'fieldAxis': {'constantValue': field_axes},
        },
        'functionName': 'Image.arrayReduce',
    })
    expression = ee.Image('a').arrayReduce(reducer, axes, field_axes)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').arrayReduce(
        reducer=reducer, axes=axes, fieldAxis=field_axes
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_array_repeat(self):
    axis = 1
    copies = 'b'
    expect = make_expression_graph({
        'arguments': {
            'input': IMAGE,
            'axis': {'constantValue': axis},
            'copies': IMAGE_B,
        },
        'functionName': 'Image.arrayRepeat',
    })
    expression = ee.Image('a').arrayRepeat(axis, copies)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').arrayRepeat(axis=axis, copies=copies)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_array_reshape(self):
    lengths = 'b'
    dimensions = 1
    expect = make_expression_graph({
        'arguments': {
            'image': IMAGE,
            'lengths': IMAGE_B,
            'dimensions': {'constantValue': dimensions},
        },
        'functionName': 'Image.arrayReshape',
    })
    expression = ee.Image('a').arrayReshape(lengths, dimensions)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').arrayReshape(
        lengths=lengths, dimensions=dimensions
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_array_slice(self):
    axis = 1
    start = 'b'
    end = 'c'
    step = 2
    expect = make_expression_graph({
        'arguments': {
            'input': IMAGE,
            'axis': {'constantValue': axis},
            'start': IMAGE_B,
            'end': IMAGE_C,
            'step': {'constantValue': step},
        },
        'functionName': 'Image.arraySlice',
    })
    expression = ee.Image('a').arraySlice(axis, start, end, step)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').arraySlice(
        axis=axis, start=start, end=end, step=step
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_array_sort(self):
    keys = 'b'
    expect = make_expression_graph({
        'arguments': {
            'image': IMAGE,
            'keys': IMAGE_B,
        },
        'functionName': 'Image.arraySort',
    })
    expression = ee.Image('a').arraySort(keys)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').arraySort(keys)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_array_transpose(self):
    axis1 = 1
    axis2 = 2
    expect = make_expression_graph({
        'arguments': {
            'input': IMAGE,
            'axis1': {'constantValue': axis1},
            'axis2': {'constantValue': axis2},
        },
        'functionName': 'Image.arrayTranspose',
    })
    expression = ee.Image('a').arrayTranspose(axis1, axis2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').arrayTranspose(axis1=axis1, axis2=axis2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_asin(self):
    expect = make_expression_graph({
        'arguments': {
            'value': IMAGE,
        },
        'functionName': 'Image.asin',
    })
    expression = ee.Image('a').asin()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_atan(self):
    expect = make_expression_graph({
        'arguments': {
            'value': IMAGE,
        },
        'functionName': 'Image.atan',
    })
    expression = ee.Image('a').atan()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_atan2(self):
    image2 = 'b'
    expect = make_expression_graph({
        'arguments': {
            'image1': IMAGE,
            'image2': IMAGE_B,
        },
        'functionName': 'Image.atan2',
    })
    expression = ee.Image('a').atan2(image2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').atan2(image2=image2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_band_names(self):
    expect = make_expression_graph({
        'arguments': {
            'image': IMAGE,
        },
        'functionName': 'Image.bandNames',
    })
    expression = ee.Image('a').bandNames()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_band_types(self):
    expect = make_expression_graph({
        'arguments': {
            'image': IMAGE,
        },
        'functionName': 'Image.bandTypes',
    })
    expression = ee.Image('a').bandTypes()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_bit_count(self):
    expect = make_expression_graph({
        'arguments': {
            'value': IMAGE,
        },
        'functionName': 'Image.bitCount',
    })
    expression = ee.Image('a').bitCount()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_bits_to_array_image(self):
    expect = make_expression_graph({
        'arguments': {
            'input': IMAGE,
        },
        'functionName': 'Image.bitsToArrayImage',
    })
    expression = ee.Image('a').bitsToArrayImage()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_bitwise_and(self):
    image2 = 'b'
    expect = make_expression_graph({
        'arguments': {
            'image1': IMAGE,
            'image2': IMAGE_B,
        },
        'functionName': 'Image.bitwiseAnd',
    })
    expression = ee.Image('a').bitwiseAnd(image2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').bitwiseAnd(image2=image2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_bitwise_not(self):
    expect = make_expression_graph({
        'arguments': {
            'value': IMAGE,
        },
        'functionName': 'Image.bitwiseNot',
    })
    expression = ee.Image('a').bitwiseNot()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_bitwise_or(self):
    image2 = 'b'
    expect = make_expression_graph({
        'arguments': {
            'image1': IMAGE,
            'image2': IMAGE_B,
        },
        'functionName': 'Image.bitwiseOr',
    })
    expression = ee.Image('a').bitwiseOr(image2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').bitwiseOr(image2=image2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_bitwise_xor(self):
    image2 = 'b'
    expect = make_expression_graph({
        'arguments': {
            'image1': IMAGE,
            'image2': IMAGE_B,
        },
        'functionName': 'Image.bitwiseXor',
    })
    expression = ee.Image('a').bitwiseXor(image2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').bitwiseXor(image2=image2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_blend(self):
    expect = make_expression_graph({
        'arguments': {
            'bottom': IMAGE,
            'top': IMAGE_B,
        },
        'functionName': 'Image.blend',
    })
    expression = ee.Image('a').blend('b')
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').blend('b')
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_byte(self):
    expect = make_expression_graph({
        'arguments': {
            'value': IMAGE,
        },
        'functionName': 'Image.byte',
    })
    expression = ee.Image('a').byte()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_cast(self):
    band_types = {'a': 'int16'}
    band_order = ['b', 'c']
    expect = make_expression_graph({
        'arguments': {
            'image': IMAGE,
            'bandTypes': {'constantValue': band_types},
            'bandOrder': {'constantValue': band_order},
        },
        'functionName': 'Image.cast',
    })
    expression = ee.Image('a').cast(band_types, band_order)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').cast(bandTypes=band_types, bandOrder=band_order)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_cat(self):
    images = ['a', 'b']
    expect = make_expression_graph({
        'arguments': {
            'dstImg': {
                'functionInvocationValue': {
                    'functionName': 'Image.load',
                    'arguments': {'id': {'constantValue': 'a'}},
                }
            },
            'srcImg': {
                'functionInvocationValue': {
                    'functionName': 'Image.load',
                    'arguments': {'id': {'constantValue': 'b'}},
                }
            },
        },
        # Note that this is not "cat".
        'functionName': 'Image.addBands',
    })
    expression = ee.Image.cat(images)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    # cat uses varargs, so no kwargs.

  def test_cbrt(self):
    expect = make_expression_graph({
        'arguments': {
            'value': IMAGE,
        },
        'functionName': 'Image.cbrt',
    })
    expression = ee.Image('a').cbrt()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_ceil(self):
    expect = make_expression_graph({
        'arguments': {
            'value': IMAGE,
        },
        'functionName': 'Image.ceil',
    })
    expression = ee.Image('a').ceil()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_change_proj(self):
    src_proj = EPSG_3857
    dst_proj = EPSG_4326
    expect = make_expression_graph({
        'arguments': {
            'input': IMAGE,
            'srcProj': {
                'functionInvocationValue': {
                    'functionName': 'Projection',
                    'arguments': {'crs': {'constantValue': EPSG_3857}},
                }
            },
            'dstProj': {
                'functionInvocationValue': {
                    'functionName': 'Projection',
                    'arguments': {'crs': {'constantValue': EPSG_4326}},
                }
            },
        },
        'functionName': 'Image.changeProj',
    })
    expression = ee.Image('a').changeProj(src_proj, dst_proj)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').changeProj(srcProj=src_proj, dstProj=dst_proj)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_clamp(self):
    low = 1
    high = 2
    expect = make_expression_graph({
        'arguments': {
            'input': IMAGE,
            'low': {'constantValue': low},
            'high': {'constantValue': high},
        },
        'functionName': 'Image.clamp',
    })
    expression = ee.Image('a').clamp(low, high)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').clamp(low=low, high=high)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_classify(self):
    classifier = ee.Classifier.decisionTree('')
    output_name = 'output name'
    expect = make_expression_graph({
        'arguments': {
            'image': IMAGE,
            'classifier': {
                'functionInvocationValue': {
                    'functionName': 'Classifier.decisionTree',
                    'arguments': {'treeString': {'constantValue': ''}},
                }
            },
            'outputName': {'constantValue': output_name},
        },
        'functionName': 'Image.classify',
    })
    expression = ee.Image('a').classify(classifier, output_name)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').classify(
        classifier=classifier, outputName=output_name
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_clip(self):
    point = ee.Geometry.Point([1, 2])
    expect = make_expression_graph({
        'arguments': {
            'input': IMAGE,
            'geometry': {
                'functionInvocationValue': {
                    'functionName': 'GeometryConstructors.Point',
                    'arguments': {'coordinates': {'constantValue': [1, 2]}},
                }
            },
        },
        'functionName': 'Image.clip',
    })
    expression = ee.Image('a').clip(point)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').clip(clip_geometry=point)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_clip_to_bounds_and_scale(self):
    point = ee.Geometry.Point([1, 2])
    width = 3
    height = 4
    max_dimension = 5
    scale = 6
    expect = make_expression_graph({
        'arguments': {
            'input': IMAGE,
            'geometry': {
                'functionInvocationValue': {
                    'functionName': 'GeometryConstructors.Point',
                    'arguments': {'coordinates': {'constantValue': [1, 2]}},
                }
            },
            'width': {'constantValue': width},
            'height': {'constantValue': height},
            'maxDimension': {'constantValue': max_dimension},
            'scale': {'constantValue': scale},
        },
        'functionName': 'Image.clipToBoundsAndScale',
    })
    expression = ee.Image('a').clipToBoundsAndScale(
        point, width, height, max_dimension, scale
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').clipToBoundsAndScale(
        geometry=point,
        width=width,
        height=height,
        maxDimension=max_dimension,
        scale=scale,
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_clip_to_collection(self):
    featurecollection = ee.FeatureCollection(ee.Feature(None))
    expect = make_expression_graph({
        'arguments': {
            'input': IMAGE,
            'collection': {
                'functionInvocationValue': {
                    'functionName': 'Collection',
                    'arguments': {
                        'features': {
                            'arrayValue': {
                                'values': [{
                                    'functionInvocationValue': {
                                        'functionName': 'Feature',
                                        'arguments': {},
                                    }
                                }]
                            }
                        }
                    },
                }
            },
        },
        'functionName': 'Image.clipToCollection',
    })
    expression = ee.Image('a').clipToCollection(featurecollection)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').clipToCollection(collection=featurecollection)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_cluster(self):
    clusterer = ee.Clusterer.wekaCobweb()
    output_name = 'output name'
    expect = make_expression_graph({
        'arguments': {
            'image': IMAGE,
            'clusterer': {
                'functionInvocationValue': {
                    'functionName': 'Clusterer.wekaCobweb',
                    'arguments': {},
                }
            },
            'outputName': {'constantValue': output_name},
        },
        'functionName': 'Image.cluster',
    })
    expression = ee.Image('a').cluster(clusterer, output_name)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').cluster(
        clusterer=clusterer, outputName=output_name
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_connected_components(self):
    connectedness = ee.Kernel.square(1)
    max_size = 2
    expect = make_expression_graph({
        'arguments': {
            'image': IMAGE,
            'connectedness': {
                'functionInvocationValue': {
                    'functionName': 'Kernel.square',
                    'arguments': {'radius': {'constantValue': 1}},
                }
            },
            'maxSize': {'constantValue': max_size},
        },
        'functionName': 'Image.connectedComponents',
    })
    expression = ee.Image('a').connectedComponents(connectedness, max_size)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').connectedComponents(
        connectedness=connectedness, maxSize=max_size
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_connected_pixel_count(self):
    max_size = 1
    eight_connected = True
    expect = make_expression_graph({
        'arguments': {
            'input': IMAGE,
            'maxSize': {'constantValue': max_size},
            'eightConnected': {'constantValue': eight_connected},
        },
        'functionName': 'Image.connectedPixelCount',
    })
    expression = ee.Image('a').connectedPixelCount(max_size, eight_connected)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').connectedPixelCount(
        maxSize=max_size, eightConnected=eight_connected
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_constant(self):
    value = 1
    expect = make_expression_graph({
        'arguments': {
            'value': {'constantValue': value},
        },
        'functionName': 'Image.constant',
    })
    expression = ee.Image('a').constant(value)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image.constant(value=value)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_convolve(self):
    kernel = ee.Kernel.square(1)
    expect = make_expression_graph({
        'arguments': {
            'image': IMAGE,
            'kernel': {
                'functionInvocationValue': {
                    'functionName': 'Kernel.square',
                    'arguments': {'radius': {'constantValue': 1}},
                }
            },
        },
        'functionName': 'Image.convolve',
    })
    expression = ee.Image('a').convolve(kernel)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').convolve(kernel=kernel)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_copy_properties(self):
    source = ee.Image('b')
    properties = ['c', 'd']
    exclude = ['e', 'f']
    expect = make_expression_graph({
        'arguments': {
            'destination': IMAGE,
            'source': IMAGE_B,
            'properties': {'constantValue': properties},
            'exclude': {'constantValue': exclude},
        },
        'functionName': 'Image.copyProperties',
    })
    expression = ee.Image('a').copyProperties(source, properties, exclude)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').copyProperties(
        source=source, properties=properties, exclude=exclude
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_cos(self):
    expect = make_expression_graph({
        'arguments': {
            'value': IMAGE,
        },
        'functionName': 'Image.cos',
    })
    expression = ee.Image('a').cos()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_cosh(self):
    expect = make_expression_graph({
        'arguments': {
            'value': IMAGE,
        },
        'functionName': 'Image.cosh',
    })
    expression = ee.Image('a').cosh()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_cumulative_cost(self):
    source = 'b'
    max_distance = 2
    geodetic_distance = 3
    expect = make_expression_graph({
        'arguments': {
            'cost': IMAGE,
            'source': IMAGE_B,
            'maxDistance': {'constantValue': max_distance},
            'geodeticDistance': {'constantValue': geodetic_distance},
        },
        'functionName': 'Image.cumulativeCost',
    })
    expression = ee.Image('a').cumulativeCost(
        source, max_distance, geodetic_distance
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').cumulativeCost(
        source=source,
        maxDistance=max_distance,
        geodeticDistance=geodetic_distance,
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_date(self):
    expect = make_expression_graph({
        'arguments': {
            'image': IMAGE,
        },
        'functionName': 'Image.date',
    })
    expression = ee.Image('a').date()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_derivative(self):
    expect = make_expression_graph({
        'arguments': {
            'image': IMAGE,
        },
        'functionName': 'Image.derivative',
    })
    expression = ee.Image('a').derivative()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_digamma(self):
    expect = make_expression_graph({
        'arguments': {
            'value': IMAGE,
        },
        'functionName': 'Image.digamma',
    })
    expression = ee.Image('a').digamma()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_directional_distance_transform(self):
    angle = 1
    max_distance = 2
    label_band = 'label band'
    expect = make_expression_graph({
        'arguments': {
            'source': IMAGE,
            'angle': {'constantValue': angle},
            'maxDistance': {'constantValue': max_distance},
            'labelBand': {'constantValue': label_band},
        },
        'functionName': 'Image.directionalDistanceTransform',
    })
    expression = ee.Image('a').directionalDistanceTransform(
        angle, max_distance, label_band
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').directionalDistanceTransform(
        angle=angle, maxDistance=max_distance, labelBand=label_band
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_displace(self):
    displacement = 'b'
    mode = 'bilinear'
    max_offset = 1
    expect = make_expression_graph({
        'arguments': {
            'image': IMAGE,
            'displacement': IMAGE_B,
            'mode': {'constantValue': mode},
            'maxOffset': {'constantValue': max_offset},
        },
        'functionName': 'Image.displace',
    })
    expression = ee.Image('a').displace(displacement, mode, max_offset)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').displace(
        displacement=displacement, mode=mode, maxOffset=max_offset
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_displacement(self):
    reference_image = 'b'
    max_offset = 1
    projection = EPSG_4326
    patch_width = 2
    stiffness = 3
    expect = make_expression_graph({
        'arguments': {
            'image': IMAGE,
            'referenceImage': IMAGE_B,
            'maxOffset': {'constantValue': max_offset},
            'projection': {
                'functionInvocationValue': {
                    'functionName': 'Projection',
                    'arguments': {'crs': {'constantValue': projection}},
                }
            },
            'patchWidth': {'constantValue': patch_width},
            'stiffness': {'constantValue': stiffness},
        },
        'functionName': 'Image.displacement',
    })
    expression = ee.Image('a').displacement(
        reference_image, max_offset, projection, patch_width, stiffness
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').displacement(
        referenceImage=reference_image,
        maxOffset=max_offset,
        projection=projection,
        patchWidth=patch_width,
        stiffness=stiffness,
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_distance(self):
    kernel = ee.Kernel.square(1)
    skip_masked = True
    expect = make_expression_graph({
        'arguments': {
            'image': IMAGE,
            'kernel': {
                'functionInvocationValue': {
                    'functionName': 'Kernel.square',
                    'arguments': {'radius': {'constantValue': 1}},
                }
            },
            'skipMasked': {'constantValue': skip_masked},
        },
        'functionName': 'Image.distance',
    })
    expression = ee.Image('a').distance(kernel, skip_masked)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').distance(kernel=kernel, skipMasked=skip_masked)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_divide(self):
    image2 = 'b'
    expect = make_expression_graph({
        'arguments': {
            'image1': IMAGE,
            'image2': IMAGE_B,
        },
        'functionName': 'Image.divide',
    })
    expression = ee.Image('a').divide(image2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').divide(image2=image2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_double(self):
    expect = make_expression_graph({
        'arguments': {
            'value': IMAGE,
        },
        'functionName': 'Image.double',
    })
    expression = ee.Image('a').double()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_entropy(self):
    kernel = ee.Kernel.square(1)
    expect = make_expression_graph({
        'arguments': {
            'image': IMAGE,
            'kernel': {
                'functionInvocationValue': {
                    'functionName': 'Kernel.square',
                    'arguments': {'radius': {'constantValue': 1}},
                }
            },
        },
        'functionName': 'Image.entropy',
    })
    expression = ee.Image('a').entropy(kernel)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').entropy(kernel=kernel)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_eq(self):
    image2 = 'b'
    expect = make_expression_graph({
        'arguments': {
            'image1': IMAGE,
            'image2': IMAGE_B,
        },
        'functionName': 'Image.eq',
    })
    expression = ee.Image('a').eq(image2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').eq(image2=image2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_erf(self):
    expect = make_expression_graph({
        'arguments': {
            'value': IMAGE,
        },
        'functionName': 'Image.erf',
    })
    expression = ee.Image('a').erf()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_erf_inv(self):
    expect = make_expression_graph({
        'arguments': {
            'value': IMAGE,
        },
        'functionName': 'Image.erfInv',
    })
    expression = ee.Image('a').erfInv()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_erfc(self):
    expect = make_expression_graph({
        'arguments': {
            'value': IMAGE,
        },
        'functionName': 'Image.erfc',
    })
    expression = ee.Image('a').erfc()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_erfc_inv(self):
    expect = make_expression_graph({
        'arguments': {
            'value': IMAGE,
        },
        'functionName': 'Image.erfcInv',
    })
    expression = ee.Image('a').erfcInv()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_exp(self):
    expect = make_expression_graph({
        'arguments': {
            'value': IMAGE,
        },
        'functionName': 'Image.exp',
    })
    expression = ee.Image('a').exp()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_fast_distance_transform(self):
    neighborhood = 1
    units = 'pixels'
    metric = 'manhattan'
    expect = make_expression_graph({
        'arguments': {
            'image': IMAGE,
            'neighborhood': {'constantValue': neighborhood},
            'units': {'constantValue': units},
            'metric': {'constantValue': metric},
        },
        'functionName': 'Image.fastDistanceTransform',
    })
    expression = ee.Image('a').fastDistanceTransform(
        neighborhood, units, metric
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').fastDistanceTransform(
        neighborhood=neighborhood, units=units, metric=metric
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_first(self):
    image2 = 'b'
    expect = make_expression_graph({
        'arguments': {
            'image1': IMAGE,
            'image2': IMAGE_B,
        },
        'functionName': 'Image.first',
    })
    expression = ee.Image('a').first(image2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').first(image2=image2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_first_non_zero(self):
    image2 = 'b'
    expect = make_expression_graph({
        'arguments': {
            'image1': IMAGE,
            'image2': IMAGE_B,
        },
        'functionName': 'Image.firstNonZero',
    })
    expression = ee.Image('a').firstNonZero(image2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').firstNonZero(image2=image2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_float(self):
    expect = make_expression_graph({
        'arguments': {
            'value': IMAGE,
        },
        'functionName': 'Image.float',
    })
    expression = ee.Image('a').float()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_floor(self):
    expect = make_expression_graph({
        'arguments': {
            'value': IMAGE,
        },
        'functionName': 'Image.floor',
    })
    expression = ee.Image('a').floor()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_focal_max(self):
    radius = 1
    kernel_type = 'plus'
    units = 'meters'
    iterations = 2
    kernel = ee.Kernel.square(1)
    expect = make_expression_graph({
        'arguments': {
            'image': IMAGE,
            'radius': {'constantValue': radius},
            'kernelType': {'constantValue': kernel_type},
            'units': {'constantValue': units},
            'iterations': {'constantValue': iterations},
            'kernel': {
                'functionInvocationValue': {
                    'functionName': 'Kernel.square',
                    'arguments': {'radius': {'constantValue': 1}},
                }
            },
        },
        'functionName': 'Image.focalMax',
    })
    expression = ee.Image('a').focalMax(
        radius, kernel_type, units, iterations, kernel
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').focalMax(
        radius=radius,
        kernelType=kernel_type,
        units=units,
        iterations=iterations,
        kernel=kernel,
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_focal_mean(self):
    radius = 1
    kernel_type = 'plus'
    units = 'meters'
    iterations = 2
    kernel = ee.Kernel.square(1)
    expect = make_expression_graph({
        'arguments': {
            'image': IMAGE,
            'radius': {'constantValue': radius},
            'kernelType': {'constantValue': kernel_type},
            'units': {'constantValue': units},
            'iterations': {'constantValue': iterations},
            'kernel': {
                'functionInvocationValue': {
                    'functionName': 'Kernel.square',
                    'arguments': {'radius': {'constantValue': 1}},
                }
            },
        },
        'functionName': 'Image.focalMean',
    })
    expression = ee.Image('a').focalMean(
        radius, kernel_type, units, iterations, kernel
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').focalMean(
        radius=radius,
        kernelType=kernel_type,
        units=units,
        iterations=iterations,
        kernel=kernel,
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_focal_median(self):
    radius = 1
    kernel_type = 'plus'
    units = 'meters'
    iterations = 2
    kernel = ee.Kernel.square(1)
    expect = make_expression_graph({
        'arguments': {
            'image': IMAGE,
            'radius': {'constantValue': radius},
            'kernelType': {'constantValue': kernel_type},
            'units': {'constantValue': units},
            'iterations': {'constantValue': iterations},
            'kernel': {
                'functionInvocationValue': {
                    'functionName': 'Kernel.square',
                    'arguments': {'radius': {'constantValue': 1}},
                }
            },
        },
        'functionName': 'Image.focalMedian',
    })
    expression = ee.Image('a').focalMedian(
        radius, kernel_type, units, iterations, kernel
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').focalMedian(
        radius=radius,
        kernelType=kernel_type,
        units=units,
        iterations=iterations,
        kernel=kernel,
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_focal_min(self):
    radius = 1
    kernel_type = 'plus'
    units = 'meters'
    iterations = 2
    kernel = ee.Kernel.square(1)
    expect = make_expression_graph({
        'arguments': {
            'image': IMAGE,
            'radius': {'constantValue': radius},
            'kernelType': {'constantValue': kernel_type},
            'units': {'constantValue': units},
            'iterations': {'constantValue': iterations},
            'kernel': {
                'functionInvocationValue': {
                    'functionName': 'Kernel.square',
                    'arguments': {'radius': {'constantValue': 1}},
                }
            },
        },
        'functionName': 'Image.focalMin',
    })
    expression = ee.Image('a').focalMin(
        radius, kernel_type, units, iterations, kernel
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').focalMin(
        radius=radius,
        kernelType=kernel_type,
        units=units,
        iterations=iterations,
        kernel=kernel,
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_focal_mode(self):
    radius = 1
    kernel_type = 'plus'
    units = 'meters'
    iterations = 2
    kernel = ee.Kernel.square(1)
    expect = make_expression_graph({
        'arguments': {
            'image': IMAGE,
            'radius': {'constantValue': radius},
            'kernelType': {'constantValue': kernel_type},
            'units': {'constantValue': units},
            'iterations': {'constantValue': iterations},
            'kernel': {
                'functionInvocationValue': {
                    'functionName': 'Kernel.square',
                    'arguments': {'radius': {'constantValue': 1}},
                }
            },
        },
        'functionName': 'Image.focalMode',
    })
    expression = ee.Image('a').focalMode(
        radius, kernel_type, units, iterations, kernel
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').focalMode(
        radius=radius,
        kernelType=kernel_type,
        units=units,
        iterations=iterations,
        kernel=kernel,
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_gamma(self):
    expect = make_expression_graph({
        'arguments': {
            'value': IMAGE,
        },
        'functionName': 'Image.gamma',
    })
    expression = ee.Image('a').gamma()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_gammainc(self):
    image2 = 'b'
    expect = make_expression_graph({
        'arguments': {
            'image1': IMAGE,
            'image2': IMAGE_B,
        },
        'functionName': 'Image.gammainc',
    })
    expression = ee.Image('a').gammainc(image2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').gammainc(image2=image2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_geometry(self):
    max_error = 1
    proj = EPSG_4326
    geodesics = True
    expect = make_expression_graph({
        'arguments': {
            'feature': IMAGE,
            'maxError': {
                'functionInvocationValue': {
                    'functionName': 'ErrorMargin',
                    'arguments': {'value': {'constantValue': 1}},
                }
            },
            'proj': {
                'functionInvocationValue': {
                    'functionName': 'Projection',
                    'arguments': {'crs': {'constantValue': proj}},
                }
            },
            'geodesics': {'constantValue': geodesics},
        },
        'functionName': 'Image.geometry',
    })
    expression = ee.Image('a').geometry(max_error, proj, geodesics)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').geometry(
        maxError=max_error, proj=proj, geodesics=geodesics
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_glcm_texture(self):
    size = 1
    kernel = ee.Kernel.square(1)
    average = True
    expect = make_expression_graph({
        'arguments': {
            'image': IMAGE,
            'size': {'constantValue': size},
            'kernel': {
                'functionInvocationValue': {
                    'functionName': 'Kernel.square',
                    'arguments': {'radius': {'constantValue': 1}},
                }
            },
            'average': {'constantValue': average},
        },
        'functionName': 'Image.glcmTexture',
    })
    expression = ee.Image('a').glcmTexture(size, kernel, average)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').glcmTexture(
        size=size, kernel=kernel, average=average
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_gradient(self):
    expect = make_expression_graph({
        'arguments': {
            'input': IMAGE,
        },
        'functionName': 'Image.gradient',
    })
    expression = ee.Image('a').gradient()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_gt(self):
    image2 = 'b'
    expect = make_expression_graph({
        'arguments': {
            'image1': IMAGE,
            'image2': IMAGE_B,
        },
        'functionName': 'Image.gt',
    })
    expression = ee.Image('a').gt(image2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').gt(image2=image2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_gte(self):
    image2 = 'b'
    expect = make_expression_graph({
        'arguments': {
            'image1': IMAGE,
            'image2': IMAGE_B,
        },
        'functionName': 'Image.gte',
    })
    expression = ee.Image('a').gte(image2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').gte(image2=image2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_hers_descriptor(self):
    selectors = ['b', 'c']
    buckets = 1
    peak_width_scale = 2
    expect = make_expression_graph({
        'arguments': {
            'element': IMAGE,
            'selectors': {'constantValue': selectors},
            'buckets': {'constantValue': buckets},
            'peakWidthScale': {'constantValue': peak_width_scale},
        },
        'functionName': 'Image.hersDescriptor',
    })
    expression = ee.Image('a').hersDescriptor(
        selectors, buckets, peak_width_scale
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').hersDescriptor(
        selectors=selectors, buckets=buckets, peakWidthScale=peak_width_scale
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_hers_feature(self):
    reference = {'b': 'c'}
    peak_width_scale = 1
    expect = make_expression_graph({
        'arguments': {
            'image': IMAGE,
            'reference': {'constantValue': reference},
            'peakWidthScale': {'constantValue': peak_width_scale},
        },
        'functionName': 'Image.hersFeature',
    })
    expression = ee.Image('a').hersFeature(reference, peak_width_scale)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').hersFeature(
        reference=reference, peakWidthScale=peak_width_scale
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_hers_image(self):
    image2 = 'b'
    radius = 1
    buckets = 2
    peak_width_scale = 3
    expect = make_expression_graph({
        'arguments': {
            'image': IMAGE,
            'image2': IMAGE_B,
            'radius': {'constantValue': radius},
            'buckets': {'constantValue': buckets},
            'peakWidthScale': {'constantValue': peak_width_scale},
        },
        'functionName': 'Image.hersImage',
    })
    expression = ee.Image('a').hersImage(
        image2, radius, buckets, peak_width_scale
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').hersImage(
        image2=image2,
        radius=radius,
        buckets=buckets,
        peakWidthScale=peak_width_scale,
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_hsv_to_rgb(self):
    expect = make_expression_graph({
        'arguments': {
            'image': IMAGE,
        },
        'functionName': 'Image.hsvToRgb',
    })
    expression = ee.Image('a').hsvToRgb()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_hypot(self):
    image2 = 'b'
    expect = make_expression_graph({
        'arguments': {
            'image1': IMAGE,
            'image2': IMAGE_B,
        },
        'functionName': 'Image.hypot',
    })
    expression = ee.Image('a').hypot(image2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').hypot(image2=image2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_id(self):
    expect = make_expression_graph({
        'arguments': {
            'element': IMAGE,
        },
        'functionName': 'Image.id',
    })
    expression = ee.Image('a').id()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_int(self):
    expect = make_expression_graph({
        'arguments': {
            'value': IMAGE,
        },
        'functionName': 'Image.int',
    })
    expression = ee.Image('a').int()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_int16(self):
    expect = make_expression_graph({
        'arguments': {
            'value': IMAGE,
        },
        'functionName': 'Image.int16',
    })
    expression = ee.Image('a').int16()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_int32(self):
    expect = make_expression_graph({
        'arguments': {
            'value': IMAGE,
        },
        'functionName': 'Image.int32',
    })
    expression = ee.Image('a').int32()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_int64(self):
    expect = make_expression_graph({
        'arguments': {
            'value': IMAGE,
        },
        'functionName': 'Image.int64',
    })
    expression = ee.Image('a').int64()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_int8(self):
    expect = make_expression_graph({
        'arguments': {
            'value': IMAGE,
        },
        'functionName': 'Image.int8',
    })
    expression = ee.Image('a').int8()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_interpolate(self):
    x = [1, 2]
    y = [3, 4]
    behavior = 'clamp'
    expect = make_expression_graph({
        'arguments': {
            'image': IMAGE,
            'x': {'constantValue': x},
            'y': {'constantValue': y},
            'behavior': {'constantValue': behavior},
        },
        'functionName': 'Image.interpolate',
    })
    expression = ee.Image('a').interpolate(x, y, behavior)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').interpolate(x=x, y=y, behavior=behavior)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_lanczos(self):
    expect = make_expression_graph({
        'arguments': {
            'value': IMAGE,
        },
        'functionName': 'Image.lanczos',
    })
    expression = ee.Image('a').lanczos()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_left_shift(self):
    image2 = 'b'
    expect = make_expression_graph({
        'arguments': {
            'image1': IMAGE,
            'image2': IMAGE_B,
        },
        'functionName': 'Image.leftShift',
    })
    expression = ee.Image('a').leftShift(image2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').leftShift(image2=image2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_link_collection(self):
    image_collection = ee.ImageCollection('b')
    linked_bands = 'a band'
    linked_properties = 'a property'
    match_property_name = 'a match property name'
    expect = make_expression_graph({
        'arguments': {
            'input': IMAGE,
            'imageCollection': {
                'functionInvocationValue': {
                    'functionName': 'ImageCollection.load',
                    'arguments': {'id': {'constantValue': 'b'}},
                }
            },
            'linkedBands': {'constantValue': linked_bands},
            'linkedProperties': {'constantValue': linked_properties},
            'matchPropertyName': {'constantValue': match_property_name},
        },
        'functionName': 'Image.linkCollection',
    })
    expression = ee.Image('a').linkCollection(
        image_collection, linked_bands, linked_properties, match_property_name
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').linkCollection(
        imageCollection=image_collection,
        linkedBands=linked_bands,
        linkedProperties=linked_properties,
        matchPropertyName=match_property_name,
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_load(self):
    asset_id = 'a'
    version = 1
    expect = make_expression_graph({
        'arguments': {
            'id': {'constantValue': asset_id},
            'version': {'constantValue': version},
        },
        'functionName': 'Image.load',
    })
    expression = ee.Image.load(asset_id, version)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image.load(id=asset_id, version=version)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_load_geotiff(self):
    uri = 'a'
    expect = make_expression_graph({
        'arguments': {
            'uri': {'constantValue': uri},
        },
        'functionName': 'Image.loadGeoTIFF',
    })
    expression = ee.Image.loadGeoTIFF(uri)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').loadGeoTIFF(uri=uri)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_log(self):
    expect = make_expression_graph({
        'arguments': {
            'value': IMAGE,
        },
        'functionName': 'Image.log',
    })
    expression = ee.Image('a').log()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_log10(self):
    expect = make_expression_graph({
        'arguments': {
            'value': IMAGE,
        },
        'functionName': 'Image.log10',
    })
    expression = ee.Image('a').log10()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_long(self):
    expect = make_expression_graph({
        'arguments': {
            'value': IMAGE,
        },
        'functionName': 'Image.long',
    })
    expression = ee.Image('a').long()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_lt(self):
    image2 = 'b'
    expect = make_expression_graph({
        'arguments': {
            'image1': IMAGE,
            'image2': IMAGE_B,
        },
        'functionName': 'Image.lt',
    })
    expression = ee.Image('a').lt(image2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').lt(image2=image2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_lte(self):
    image2 = 'b'
    expect = make_expression_graph({
        'arguments': {
            'image1': IMAGE,
            'image2': IMAGE_B,
        },
        'functionName': 'Image.lte',
    })
    expression = ee.Image('a').lte(image2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').lte(image2=image2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_mask(self):
    mask = 'b'
    expect = make_expression_graph({
        'arguments': {
            'image': IMAGE,
            'mask': IMAGE_B,
        },
        'functionName': 'Image.mask',
    })
    expression = ee.Image('a').mask(mask)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').mask(mask=mask)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_matrix_cholesky_decomposition(self):
    expect = make_expression_graph({
        'arguments': {
            'image': IMAGE,
        },
        'functionName': 'Image.matrixCholeskyDecomposition',
    })
    expression = ee.Image('a').matrixCholeskyDecomposition()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_matrix_determinant(self):
    expect = make_expression_graph({
        'arguments': {
            'value': IMAGE,
        },
        'functionName': 'Image.matrixDeterminant',
    })
    expression = ee.Image('a').matrixDeterminant()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_matrix_diagonal(self):
    expect = make_expression_graph({
        'arguments': {
            'value': IMAGE,
        },
        'functionName': 'Image.matrixDiagonal',
    })
    expression = ee.Image('a').matrixDiagonal()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_matrix_fnorm(self):
    expect = make_expression_graph({
        'arguments': {
            'value': IMAGE,
        },
        'functionName': 'Image.matrixFnorm',
    })
    expression = ee.Image('a').matrixFnorm()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_matrix_identity(self):
    size = 1
    expect = make_expression_graph({
        'arguments': {
            'size': {'constantValue': size},
        },
        'functionName': 'Image.matrixIdentity',
    })
    expression = ee.Image.matrixIdentity(size)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_matrix_inverse(self):
    expect = make_expression_graph({
        'arguments': {
            'value': IMAGE,
        },
        'functionName': 'Image.matrixInverse',
    })
    expression = ee.Image('a').matrixInverse()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_matrix_lu_decomposition(self):
    expect = make_expression_graph({
        'arguments': {
            'image': IMAGE,
        },
        'functionName': 'Image.matrixLUDecomposition',
    })
    expression = ee.Image('a').matrixLUDecomposition()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_matrix_multiply(self):
    image2 = 'b'
    expect = make_expression_graph({
        'arguments': {
            'image1': IMAGE,
            'image2': IMAGE_B,
        },
        'functionName': 'Image.matrixMultiply',
    })
    expression = ee.Image('a').matrixMultiply(image2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').matrixMultiply(image2=image2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_matrix_pseudo_inverse(self):
    expect = make_expression_graph({
        'arguments': {
            'value': IMAGE,
        },
        'functionName': 'Image.matrixPseudoInverse',
    })
    expression = ee.Image('a').matrixPseudoInverse()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_matrix_qr_decomposition(self):
    expect = make_expression_graph({
        'arguments': {
            'image': IMAGE,
        },
        'functionName': 'Image.matrixQRDecomposition',
    })
    expression = ee.Image('a').matrixQRDecomposition()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_matrix_singular_value_decomposition(self):
    expect = make_expression_graph({
        'arguments': {
            'image': IMAGE,
        },
        'functionName': 'Image.matrixSingularValueDecomposition',
    })
    expression = ee.Image('a').matrixSingularValueDecomposition()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_matrix_solve(self):
    image2 = 'b'
    expect = make_expression_graph({
        'arguments': {
            'image1': IMAGE,
            'image2': IMAGE_B,
        },
        'functionName': 'Image.matrixSolve',
    })
    expression = ee.Image('a').matrixSolve(image2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').matrixSolve(image2=image2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_matrix_to_diag(self):
    expect = make_expression_graph({
        'arguments': {
            'value': IMAGE,
        },
        'functionName': 'Image.matrixToDiag',
    })
    expression = ee.Image('a').matrixToDiag()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_matrix_trace(self):
    expect = make_expression_graph({
        'arguments': {
            'value': IMAGE,
        },
        'functionName': 'Image.matrixTrace',
    })
    expression = ee.Image('a').matrixTrace()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_matrix_transpose(self):
    axis1 = 1
    axis2 = 2
    expect = make_expression_graph({
        'arguments': {
            'input': IMAGE,
            'axis1': {'constantValue': axis1},
            'axis2': {'constantValue': axis2},
        },
        'functionName': 'Image.matrixTranspose',
    })
    expression = ee.Image('a').matrixTranspose(axis1, axis2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').matrixTranspose(axis1=axis1, axis2=axis2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_max(self):
    image2 = 'b'
    expect = make_expression_graph({
        'arguments': {
            'image1': IMAGE,
            'image2': IMAGE_B,
        },
        'functionName': 'Image.max',
    })
    expression = ee.Image('a').max(image2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').max(image2=image2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_medial_axis(self):
    neighborhood = 1
    units = 'pixels'
    expect = make_expression_graph({
        'arguments': {
            'image': IMAGE,
            'neighborhood': {'constantValue': neighborhood},
            'units': {'constantValue': units},
        },
        'functionName': 'Image.medialAxis',
    })
    expression = ee.Image('a').medialAxis(neighborhood, units)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').medialAxis(
        neighborhood=neighborhood, units=units
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_metadata(self):
    property = 'a property'
    name = 'a name'
    expect = make_expression_graph({
        'arguments': {
            'image': IMAGE,
            'property': {'constantValue': property},
            'name': {'constantValue': name},
        },
        'functionName': 'Image.metadata',
    })
    expression = ee.Image('a').metadata(property, name)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').metadata(property=property, name=name)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_min(self):
    image2 = 'b'
    expect = make_expression_graph({
        'arguments': {
            'image1': IMAGE,
            'image2': IMAGE_B,
        },
        'functionName': 'Image.min',
    })
    expression = ee.Image('a').min(image2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').min(image2=image2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_mod(self):
    image2 = 'b'
    expect = make_expression_graph({
        'arguments': {
            'image1': IMAGE,
            'image2': IMAGE_B,
        },
        'functionName': 'Image.mod',
    })
    expression = ee.Image('a').mod(image2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').mod(image2=image2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_multiply(self):
    image2 = 'b'
    expect = make_expression_graph({
        'arguments': {
            'image1': IMAGE,
            'image2': IMAGE_B,
        },
        'functionName': 'Image.multiply',
    })
    expression = ee.Image('a').multiply(image2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').multiply(image2=image2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_neighborhood_to_array(self):
    kernel = ee.Kernel.square(1)
    default_value = 1
    expect = make_expression_graph({
        'arguments': {
            'image': IMAGE,
            'kernel': {
                'functionInvocationValue': {
                    'functionName': 'Kernel.square',
                    'arguments': {'radius': {'constantValue': 1}},
                }
            },
            'defaultValue': {'constantValue': default_value},
        },
        'functionName': 'Image.neighborhoodToArray',
    })
    expression = ee.Image('a').neighborhoodToArray(kernel, default_value)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').neighborhoodToArray(
        kernel=kernel, defaultValue=default_value
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_neighborhood_to_bands(self):
    kernel = ee.Kernel.square(1)
    expect = make_expression_graph({
        'arguments': {
            'image': IMAGE,
            'kernel': {
                'functionInvocationValue': {
                    'functionName': 'Kernel.square',
                    'arguments': {'radius': {'constantValue': 1}},
                }
            },
        },
        'functionName': 'Image.neighborhoodToBands',
    })
    expression = ee.Image('a').neighborhoodToBands(kernel)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').neighborhoodToBands(kernel=kernel)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_neq(self):
    image2 = 'b'
    expect = make_expression_graph({
        'arguments': {
            'image1': IMAGE,
            'image2': IMAGE_B,
        },
        'functionName': 'Image.neq',
    })
    expression = ee.Image('a').neq(image2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').neq(image2=image2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_normalized_difference(self):
    band_names = ['b', 'c']
    expect = make_expression_graph({
        'arguments': {
            'input': IMAGE,
            'bandNames': {'constantValue': band_names},
        },
        'functionName': 'Image.normalizedDifference',
    })
    expression = ee.Image('a').normalizedDifference(band_names)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').normalizedDifference(bandNames=band_names)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_not(self):
    expect = make_expression_graph({
        'arguments': {
            'value': IMAGE,
        },
        'functionName': 'Image.not',
    })
    expression = ee.Image('a').Not()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_or(self):
    image2 = 'b'
    expect = make_expression_graph({
        'arguments': {
            'image1': IMAGE,
            'image2': IMAGE_B,
        },
        'functionName': 'Image.or',
    })
    expression = ee.Image('a').Or(image2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').Or(image2=image2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_paint(self):
    featurecollection = ee.FeatureCollection('b')
    color = 'cadetblue'
    width = 1
    expect = make_expression_graph({
        'arguments': {
            'image': IMAGE,
            'featureCollection': {
                'functionInvocationValue': {
                    'functionName': 'Collection.loadTable',
                    'arguments': {'tableId': {'constantValue': 'b'}},
                }
            },
            'color': {'constantValue': color},
            'width': {'constantValue': width},
        },
        'functionName': 'Image.paint',
    })
    expression = ee.Image('a').paint(featurecollection, color, width)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').paint(
        featureCollection=featurecollection, color=color, width=width
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_pixel_coordinates(self):
    projection = EPSG_4326
    expect = make_expression_graph({
        'arguments': {
            'projection': {
                'functionInvocationValue': {
                    'functionName': 'Projection',
                    'arguments': {'crs': {'constantValue': projection}},
                }
            }
        },
        'functionName': 'Image.pixelCoordinates',
    })
    expression = ee.Image('a').pixelCoordinates(projection)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').pixelCoordinates(projection=projection)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_polynomial(self):
    coefficients = [1, 2]
    expect = make_expression_graph({
        'arguments': {
            'image': IMAGE,
            'coefficients': {'constantValue': coefficients},
        },
        'functionName': 'Image.polynomial',
    })
    expression = ee.Image('a').polynomial(coefficients)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').polynomial(coefficients=coefficients)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_pow(self):
    image2 = 'b'
    expect = make_expression_graph({
        'arguments': {
            'image1': IMAGE,
            'image2': IMAGE_B,
        },
        'functionName': 'Image.pow',
    })
    expression = ee.Image('a').pow(image2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').pow(image2=image2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_projection(self):
    expect = make_expression_graph({
        'arguments': {
            'image': IMAGE,
        },
        'functionName': 'Image.projection',
    })
    expression = ee.Image('a').projection()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_random(self):
    seed = 1
    distribution = 'normal'
    expect = make_expression_graph({
        'arguments': {
            'seed': {'constantValue': seed},
            'distribution': {'constantValue': distribution},
        },
        'functionName': 'Image.random',
    })
    expression = ee.Image.random(seed, distribution)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image().random(seed=seed, distribution=distribution)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_random_default_args(self):
    expect = make_expression_graph({
        'arguments': {},
        'functionName': 'Image.random',
    })
    expression = ee.Image.random()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_random_visualizer(self):
    expect = make_expression_graph({
        'arguments': {
            'image': IMAGE,
        },
        'functionName': 'Image.randomVisualizer',
    })
    expression = ee.Image('a').randomVisualizer()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_reduce(self):
    reducer = ee.Reducer.sum()
    expect = make_expression_graph({
        'arguments': {
            'image': IMAGE,
            'reducer': {
                'functionInvocationValue': {
                    'functionName': 'Reducer.sum',
                    'arguments': {},
                }
            },
        },
        'functionName': 'Image.reduce',
    })
    expression = ee.Image('a').reduce(reducer)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').reduce(reducer=reducer)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_reduce_connected_components(self):
    reducer = ee.Reducer.sum()
    label_band = 'b'
    max_size = 1
    expect = make_expression_graph({
        'arguments': {
            'image': IMAGE,
            'reducer': {
                'functionInvocationValue': {
                    'functionName': 'Reducer.sum',
                    'arguments': {},
                }
            },
            'labelBand': {'constantValue': label_band},
            'maxSize': {'constantValue': max_size},
        },
        'functionName': 'Image.reduceConnectedComponents',
    })
    expression = ee.Image('a').reduceConnectedComponents(
        reducer, label_band, max_size
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').reduceConnectedComponents(
        reducer=reducer, labelBand=label_band, maxSize=max_size
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_reduce_neighborhood(self):
    reducer = ee.Reducer.sum()
    kernel = ee.Kernel.square(1)
    input_weight = 'mask'
    skip_masked = True
    optimization = 'boxcar'
    expect = make_expression_graph({
        'arguments': {
            'image': IMAGE,
            'reducer': {
                'functionInvocationValue': {
                    'functionName': 'Reducer.sum',
                    'arguments': {},
                }
            },
            'kernel': {
                'functionInvocationValue': {
                    'functionName': 'Kernel.square',
                    'arguments': {'radius': {'constantValue': 1}},
                }
            },
            'inputWeight': {'constantValue': input_weight},
            'skipMasked': {'constantValue': skip_masked},
            'optimization': {'constantValue': optimization},
        },
        'functionName': 'Image.reduceNeighborhood',
    })
    expression = ee.Image('a').reduceNeighborhood(
        reducer, kernel, input_weight, skip_masked, optimization
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').reduceNeighborhood(
        reducer=reducer,
        kernel=kernel,
        inputWeight=input_weight,
        skipMasked=skip_masked,
        optimization=optimization,
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_reduce_region(self):
    reducer = ee.Reducer.sum()
    geometry = ee.Geometry.Point([1, 2])
    scale = 1
    crs = EPSG_4326
    crs_transform = [3, 4, 5, 6, 7, 8]
    best_effort = True
    max_pixels = 9
    tile_scale = 10
    expect = make_expression_graph({
        'arguments': {
            'image': IMAGE,
            'reducer': {
                'functionInvocationValue': {
                    'functionName': 'Reducer.sum',
                    'arguments': {},
                }
            },
            'geometry': {
                'functionInvocationValue': {
                    'functionName': 'GeometryConstructors.Point',
                    'arguments': {'coordinates': {'constantValue': [1, 2]}},
                }
            },
            'scale': {'constantValue': scale},
            'crs': {
                'functionInvocationValue': {
                    'functionName': 'Projection',
                    'arguments': {'crs': {'constantValue': crs}},
                }
            },
            'crsTransform': {'constantValue': crs_transform},
            'bestEffort': {'constantValue': best_effort},
            'maxPixels': {'constantValue': max_pixels},
            'tileScale': {'constantValue': tile_scale},
        },
        'functionName': 'Image.reduceRegion',
    })
    expression = ee.Image('a').reduceRegion(
        reducer,
        geometry,
        scale,
        crs,
        crs_transform,
        best_effort,
        max_pixels,
        tile_scale,
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').reduceRegion(
        reducer=reducer,
        geometry=geometry,
        scale=scale,
        crs=crs,
        crsTransform=crs_transform,
        bestEffort=best_effort,
        maxPixels=max_pixels,
        tileScale=tile_scale,
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_reduce_regions(self):
    reducer = ee.Reducer.sum()
    featurecollection = ee.FeatureCollection(ee.Feature(None))
    scale = 1
    crs = EPSG_4326
    crs_transform = [3, 4, 5, 6, 7, 8]
    tile_scale = 10
    maxPixelsPerRegion = 11
    expect = make_expression_graph({
        'arguments': {
            'image': IMAGE,
            'collection': {
                'functionInvocationValue': {
                    'functionName': 'Collection',
                    'arguments': {
                        'features': {
                            'arrayValue': {
                                'values': [{
                                    'functionInvocationValue': {
                                        'functionName': 'Feature',
                                        'arguments': {},
                                    }
                                }]
                            }
                        }
                    },
                }
            },
            'reducer': {
                'functionInvocationValue': {
                    'functionName': 'Reducer.sum',
                    'arguments': {},
                }
            },
            'scale': {'constantValue': scale},
            'crs': {
                'functionInvocationValue': {
                    'functionName': 'Projection',
                    'arguments': {'crs': {'constantValue': crs}},
                }
            },
            'crsTransform': {'constantValue': crs_transform},
            'tileScale': {'constantValue': tile_scale},
            'maxPixelsPerRegion': {'constantValue': maxPixelsPerRegion},
        },
        'functionName': 'Image.reduceRegions',
    })
    expression = ee.Image('a').reduceRegions(
        featurecollection,
        reducer,
        scale,
        crs,
        crs_transform,
        tile_scale,
        maxPixelsPerRegion,
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').reduceRegions(
        collection=featurecollection,
        reducer=reducer,
        scale=scale,
        crs=crs,
        crsTransform=crs_transform,
        tileScale=tile_scale,
        maxPixelsPerRegion=maxPixelsPerRegion,
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_reduce_resolution(self):
    reducer = ee.Reducer.sum()
    best_effort = True
    max_pixels = 1
    expect = make_expression_graph({
        'arguments': {
            'image': IMAGE,
            'reducer': {
                'functionInvocationValue': {
                    'functionName': 'Reducer.sum',
                    'arguments': {},
                }
            },
            'bestEffort': {'constantValue': best_effort},
            'maxPixels': {'constantValue': max_pixels},
        },
        'functionName': 'Image.reduceResolution',
    })
    expression = ee.Image('a').reduceResolution(
        reducer, best_effort, max_pixels
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').reduceResolution(
        reducer=reducer, bestEffort=best_effort, maxPixels=max_pixels
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_reduce_to_vectors(self):
    reducer = ee.Reducer.sum()
    geometry = ee.Geometry.Point([1, 2])
    scale = 3
    geometry_type = 'bb'
    eight_connected = True
    label_property = 'a label property'
    crs = EPSG_4326
    crs_transform = [4, 5, 6, 7, 8, 9]
    best_effort = True
    max_pixels = 10
    tile_scale = 11
    geometry_in_native_projection = True
    expect = make_expression_graph({
        'arguments': {
            'image': IMAGE,
            'reducer': {
                'functionInvocationValue': {
                    'functionName': 'Reducer.sum',
                    'arguments': {},
                }
            },
            'geometry': {
                'functionInvocationValue': {
                    'functionName': 'GeometryConstructors.Point',
                    'arguments': {'coordinates': {'constantValue': [1, 2]}},
                }
            },
            'scale': {'constantValue': scale},
            'geometryType': {'constantValue': geometry_type},
            'eightConnected': {'constantValue': eight_connected},
            'labelProperty': {'constantValue': label_property},
            'crs': {
                'functionInvocationValue': {
                    'functionName': 'Projection',
                    'arguments': {'crs': {'constantValue': crs}},
                }
            },
            'crsTransform': {'constantValue': crs_transform},
            'bestEffort': {'constantValue': best_effort},
            'maxPixels': {'constantValue': max_pixels},
            'tileScale': {'constantValue': tile_scale},
            'geometryInNativeProjection': {
                'constantValue': geometry_in_native_projection
            },
        },
        'functionName': 'Image.reduceToVectors',
    })
    expression = ee.Image('a').reduceToVectors(
        reducer,
        geometry,
        scale,
        geometry_type,
        eight_connected,
        label_property,
        crs,
        crs_transform,
        best_effort,
        max_pixels,
        tile_scale,
        geometry_in_native_projection,
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').reduceToVectors(
        reducer=reducer,
        geometry=geometry,
        scale=scale,
        geometryType=geometry_type,
        eightConnected=eight_connected,
        labelProperty=label_property,
        crs=crs,
        crsTransform=crs_transform,
        bestEffort=best_effort,
        maxPixels=max_pixels,
        tileScale=tile_scale,
        geometryInNativeProjection=geometry_in_native_projection,
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_regexp_rename(self):
    regex = 'a regex'
    replacement = 'a replacement'
    all = True
    expect = make_expression_graph({
        'arguments': {
            'input': IMAGE,
            'regex': {'constantValue': regex},
            'replacement': {'constantValue': replacement},
            'all': {'constantValue': all},
        },
        'functionName': 'Image.regexpRename',
    })
    expression = ee.Image('a').regexpRename(regex, replacement, all)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').regexpRename(
        regex=regex, replacement=replacement, all=all
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_register(self):
    reference_image = 'b'
    max_offset = 1
    patch_width = 2
    stiffness = 3
    expect = make_expression_graph({
        'arguments': {
            'image': IMAGE,
            'referenceImage': IMAGE_B,
            'maxOffset': {'constantValue': max_offset},
            'patchWidth': {'constantValue': patch_width},
            'stiffness': {'constantValue': stiffness},
        },
        'functionName': 'Image.register',
    })
    expression = ee.Image('a').register(
        reference_image, max_offset, patch_width, stiffness
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').register(
        referenceImage=reference_image,
        maxOffset=max_offset,
        patchWidth=patch_width,
        stiffness=stiffness,
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_remap(self):
    # `from` is a reserved word.
    from_list = [1, 2]
    to = [3, 4]
    default_value = 5
    band_name = 'a band name'
    expect = make_expression_graph({
        'arguments': {
            'image': IMAGE,
            'from': {'constantValue': from_list},
            'to': {'constantValue': to},
            'defaultValue': {'constantValue': default_value},
            'bandName': {'constantValue': band_name},
        },
        'functionName': 'Image.remap',
    })
    expression = ee.Image('a').remap(from_list, to, default_value, band_name)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').remap(
        to=to,
        defaultValue=default_value,
        bandName=band_name,
        **{'from': from_list}
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_rename(self):
    names = ['b', 'c']
    expect = make_expression_graph({
        'arguments': {
            'input': IMAGE,
            'names': {'constantValue': names},
        },
        'functionName': 'Image.rename',
    })
    expression = ee.Image('a').rename(names)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    # var_args, so no kwargs

  def test_reproject(self):
    crs = EPSG_4326
    crs_transform = [1, 2, 3, 4, 5, 6]
    scale = 7
    expect = make_expression_graph({
        'arguments': {
            'image': IMAGE,
            'crs': {
                'functionInvocationValue': {
                    'functionName': 'Projection',
                    'arguments': {'crs': {'constantValue': crs}},
                }
            },
            'crsTransform': {'constantValue': crs_transform},
            'scale': {'constantValue': scale},
        },
        'functionName': 'Image.reproject',
    })
    expression = ee.Image('a').reproject(crs, crs_transform, scale)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').reproject(
        crs=crs, crsTransform=crs_transform, scale=scale
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_resample(self):
    mode = 'bicubic'
    expect = make_expression_graph({
        'arguments': {
            'image': IMAGE,
            'mode': {'constantValue': mode},
        },
        'functionName': 'Image.resample',
    })
    expression = ee.Image('a').resample(mode)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').resample(mode=mode)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_rgb_to_hsv(self):
    expect = make_expression_graph({
        'arguments': {
            'image': IMAGE,
        },
        'functionName': 'Image.rgbToHsv',
    })
    expression = ee.Image('a').rgbToHsv()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_right_shift(self):
    image2 = 'b'
    expect = make_expression_graph({
        'arguments': {
            'image1': IMAGE,
            'image2': IMAGE_B,
        },
        'functionName': 'Image.rightShift',
    })
    expression = ee.Image('a').rightShift(image2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').rightShift(image2=image2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_round(self):
    expect = make_expression_graph({
        'arguments': {
            'value': IMAGE,
        },
        'functionName': 'Image.round',
    })
    expression = ee.Image('a').round()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_rsed_transform(self):
    neighborhood = 1
    units = 'pixels'
    expect = make_expression_graph({
        'arguments': {
            'image': IMAGE,
            'neighborhood': {'constantValue': neighborhood},
            'units': {'constantValue': units},
        },
        'functionName': 'Image.rsedTransform',
    })
    expression = ee.Image('a').rsedTransform(neighborhood, units)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').rsedTransform(
        neighborhood=neighborhood, units=units
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_sample(self):
    region = ee.Geometry.Point([1, 2])
    scale = 3
    projection = EPSG_4326
    factor = 4
    num_pixels = 5
    seed = 6
    drop_nulls = True
    tile_scale = 7
    geometries = False
    expect = make_expression_graph({
        'arguments': {
            'image': IMAGE,
            'region': {
                'functionInvocationValue': {
                    'functionName': 'GeometryConstructors.Point',
                    'arguments': {'coordinates': {'constantValue': [1, 2]}},
                }
            },
            'scale': {'constantValue': scale},
            'projection': {
                'functionInvocationValue': {
                    'functionName': 'Projection',
                    'arguments': {'crs': {'constantValue': projection}},
                }
            },
            'factor': {'constantValue': factor},
            'numPixels': {'constantValue': num_pixels},
            'seed': {'constantValue': seed},
            'dropNulls': {'constantValue': drop_nulls},
            'tileScale': {'constantValue': tile_scale},
            'geometries': {'constantValue': geometries},
        },
        'functionName': 'Image.sample',
    })
    expression = ee.Image('a').sample(
        region,
        scale,
        projection,
        factor,
        num_pixels,
        seed,
        drop_nulls,
        tile_scale,
        geometries,
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').sample(
        region=region,
        scale=scale,
        projection=projection,
        factor=factor,
        numPixels=num_pixels,
        seed=seed,
        dropNulls=drop_nulls,
        tileScale=tile_scale,
        geometries=geometries,
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_sample_rectangle(self):
    point = [1, 2]
    region = ee.Geometry.Point(point)
    properties = ['b', 'c']
    default_value = 3
    default_array_value = [4, 5]
    expect = make_expression_graph({
        'arguments': {
            'image': IMAGE,
            'region': {
                'functionInvocationValue': {
                    'functionName': 'GeometryConstructors.Point',
                    'arguments': {'coordinates': {'constantValue': point}},
                }
            },
            'properties': {'constantValue': properties},
            'defaultValue': {'constantValue': default_value},
            'defaultArrayValue': {
                'functionInvocationValue': {
                    'functionName': 'Array',
                    'arguments': {
                        'values': {'constantValue': default_array_value}
                    },
                }
            },
        },
        'functionName': 'Image.sampleRectangle',
    })
    expression = ee.Image('a').sampleRectangle(
        region, properties, default_value, default_array_value
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').sampleRectangle(
        region=region,
        properties=properties,
        defaultValue=default_value,
        defaultArrayValue=default_array_value,
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_sample_regions(self):
    featurecollection = ee.FeatureCollection(ee.Feature(None))
    properties = ['b', 'c']
    scale = 3
    projection = EPSG_4326
    tile_scale = 4
    geometries = False

    expect = make_expression_graph({
        'arguments': {
            'image': IMAGE,
            'collection': {
                'functionInvocationValue': {
                    'functionName': 'Collection',
                    'arguments': {
                        'features': {
                            'arrayValue': {
                                'values': [{
                                    'functionInvocationValue': {
                                        'functionName': 'Feature',
                                        'arguments': {},
                                    }
                                }]
                            }
                        }
                    },
                }
            },
            'geometries': {'constantValue': geometries},
            'projection': {
                'functionInvocationValue': {
                    'functionName': 'Projection',
                    'arguments': {'crs': {'constantValue': projection}},
                }
            },
            'properties': {'constantValue': properties},
            'scale': {'constantValue': scale},
            'tileScale': {'constantValue': tile_scale},
        },
        'functionName': 'Image.sampleRegions',
    })
    expression = ee.Image('a').sampleRegions(
        featurecollection, properties, scale, projection, tile_scale, geometries
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').sampleRegions(
        collection=featurecollection,
        properties=properties,
        scale=scale,
        projection=projection,
        tileScale=tile_scale,
        geometries=geometries,
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_select(self):
    band_selectors = ['b', 'c']
    new_names = ['d', 'e']
    expect = make_expression_graph({
        'arguments': {
            'input': IMAGE,
            'bandSelectors': {'constantValue': band_selectors},
            'newNames': {'constantValue': new_names},
        },
        'functionName': 'Image.select',
    })
    expression = ee.Image('a').select(band_selectors, new_names)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  # var_args, so now kwargs.

  def test_self_mask(self):
    expect = make_expression_graph({
        'arguments': {
            'image': IMAGE,
        },
        'functionName': 'Image.selfMask',
    })
    expression = ee.Image('a').selfMask()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_set_default_projection(self):
    crs = EPSG_4326
    crs_transform = [1, 2, 3, 4, 5, 6]
    scale = 7
    expect = make_expression_graph({
        'arguments': {
            'image': IMAGE,
            'crs': {
                'functionInvocationValue': {
                    'functionName': 'Projection',
                    'arguments': {'crs': {'constantValue': crs}},
                }
            },
            'crsTransform': {'constantValue': crs_transform},
            'scale': {'constantValue': scale},
        },
        'functionName': 'Image.setDefaultProjection',
    })
    expression = ee.Image('a').setDefaultProjection(crs, crs_transform, scale)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').setDefaultProjection(
        crs=crs, crsTransform=crs_transform, scale=scale
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_short(self):
    expect = make_expression_graph({
        'arguments': {
            'value': IMAGE,
        },
        'functionName': 'Image.short',
    })
    expression = ee.Image('a').short()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_signum(self):
    expect = make_expression_graph({
        'arguments': {
            'value': IMAGE,
        },
        'functionName': 'Image.signum',
    })
    expression = ee.Image('a').signum()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_sin(self):
    expect = make_expression_graph({
        'arguments': {
            'value': IMAGE,
        },
        'functionName': 'Image.sin',
    })
    expression = ee.Image('a').sin()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_sinh(self):
    expect = make_expression_graph({
        'arguments': {
            'value': IMAGE,
        },
        'functionName': 'Image.sinh',
    })
    expression = ee.Image('a').sinh()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_sld_style(self):
    sld_xml = 'some xml'
    expect = make_expression_graph({
        'arguments': {
            'input': IMAGE,
            'sldXml': {'constantValue': sld_xml},
        },
        'functionName': 'Image.sldStyle',
    })
    expression = ee.Image('a').sldStyle(sld_xml)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').sldStyle(sldXml=sld_xml)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_slice(self):
    start = 1
    end = 2
    expect = make_expression_graph({
        'arguments': {
            'image': IMAGE,
            'start': {'constantValue': start},
            'end': {'constantValue': end},
        },
        'functionName': 'Image.slice',
    })
    expression = ee.Image('a').slice(start, end)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').slice(start=start, end=end)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_spectral_dilation(self):
    metric = 'sid'
    kernel = ee.Kernel.square(1)
    use_centroid = True
    expect = make_expression_graph({
        'arguments': {
            'image': IMAGE,
            'metric': {'constantValue': metric},
            'kernel': {
                'functionInvocationValue': {
                    'functionName': 'Kernel.square',
                    'arguments': {'radius': {'constantValue': 1}},
                }
            },
            'useCentroid': {'constantValue': use_centroid},
        },
        'functionName': 'Image.spectralDilation',
    })
    expression = ee.Image('a').spectralDilation(metric, kernel, use_centroid)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').spectralDilation(
        metric=metric, kernel=kernel, useCentroid=use_centroid
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_spectral_distance(self):
    image2 = 'b'
    metric = 'emd'
    expect = make_expression_graph({
        'arguments': {
            'image1': IMAGE,
            'image2': IMAGE_B,
            'metric': {'constantValue': metric},
        },
        'functionName': 'Image.spectralDistance',
    })
    expression = ee.Image('a').spectralDistance(image2, metric)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').spectralDistance(image2=image2, metric=metric)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_spectral_erosion(self):
    metric = 'sid'
    kernel = ee.Kernel.square(1)
    use_centroid = True
    expect = make_expression_graph({
        'arguments': {
            'image': IMAGE,
            'metric': {'constantValue': metric},
            'kernel': {
                'functionInvocationValue': {
                    'functionName': 'Kernel.square',
                    'arguments': {'radius': {'constantValue': 1}},
                }
            },
            'useCentroid': {'constantValue': use_centroid},
        },
        'functionName': 'Image.spectralErosion',
    })
    expression = ee.Image('a').spectralErosion(metric, kernel, use_centroid)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').spectralErosion(
        metric=metric, kernel=kernel, useCentroid=use_centroid
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_spectral_gradient(self):
    metric = 'sid'
    kernel = ee.Kernel.square(1)
    use_centroid = True
    expect = make_expression_graph({
        'arguments': {
            'image': IMAGE,
            'metric': {'constantValue': metric},
            'kernel': {
                'functionInvocationValue': {
                    'functionName': 'Kernel.square',
                    'arguments': {'radius': {'constantValue': 1}},
                }
            },
            'useCentroid': {'constantValue': use_centroid},
        },
        'functionName': 'Image.spectralGradient',
    })
    expression = ee.Image('a').spectralGradient(metric, kernel, use_centroid)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').spectralGradient(
        metric=metric, kernel=kernel, useCentroid=use_centroid
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_sqrt(self):
    expect = make_expression_graph({
        'arguments': {
            'value': IMAGE,
        },
        'functionName': 'Image.sqrt',
    })
    expression = ee.Image('a').sqrt()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_stratified_sample(self):
    num_points = 1
    class_band = 'band'
    point = [7, 8]
    region = ee.Geometry.Point(point)
    scale = 2
    projection = EPSG_4326
    seed = 3
    class_values = ['b', 'c']
    class_points = [4, 5]
    drop_nulls = False
    tile_scale = 6
    geometries = True
    expect = make_expression_graph({
        'arguments': {
            'image': IMAGE,
            'numPoints': {'constantValue': num_points},
            'classBand': {'constantValue': class_band},
            'region': {
                'functionInvocationValue': {
                    'functionName': 'GeometryConstructors.Point',
                    'arguments': {'coordinates': {'constantValue': point}},
                }
            },
            'scale': {'constantValue': scale},
            'projection': {
                'functionInvocationValue': {
                    'functionName': 'Projection',
                    'arguments': {'crs': {'constantValue': projection}},
                }
            },
            'seed': {'constantValue': seed},
            'classValues': {'constantValue': class_values},
            'classPoints': {'constantValue': class_points},
            'dropNulls': {'constantValue': drop_nulls},
            'tileScale': {'constantValue': tile_scale},
            'geometries': {'constantValue': geometries},
        },
        'functionName': 'Image.stratifiedSample',
    })
    expression = ee.Image('a').stratifiedSample(
        num_points,
        class_band,
        region,
        scale,
        projection,
        seed,
        class_values,
        class_points,
        drop_nulls,
        tile_scale,
        geometries,
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').stratifiedSample(
        numPoints=num_points,
        classBand=class_band,
        region=region,
        scale=scale,
        projection=projection,
        seed=seed,
        classValues=class_values,
        classPoints=class_points,
        dropNulls=drop_nulls,
        tileScale=tile_scale,
        geometries=geometries,
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_subtract(self):
    image2 = 'b'
    expect = make_expression_graph({
        'arguments': {
            'image1': IMAGE,
            'image2': IMAGE_B,
        },
        'functionName': 'Image.subtract',
    })
    expression = ee.Image('a').subtract(image2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').subtract(image2=image2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_tan(self):
    expect = make_expression_graph({
        'arguments': {
            'value': IMAGE,
        },
        'functionName': 'Image.tan',
    })
    expression = ee.Image('a').tan()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_tanh(self):
    expect = make_expression_graph({
        'arguments': {
            'value': IMAGE,
        },
        'functionName': 'Image.tanh',
    })
    expression = ee.Image('a').tanh()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_to_array(self):
    axis = 1
    expect = make_expression_graph({
        'arguments': {
            'image': IMAGE,
            'axis': {'constantValue': axis},
        },
        'functionName': 'Image.toArray',
    })
    expression = ee.Image('a').toArray(axis)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').toArray(axis=axis)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_to_byte(self):
    expect = make_expression_graph({
        'arguments': {
            'value': IMAGE,
        },
        'functionName': 'Image.toByte',
    })
    expression = ee.Image('a').toByte()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_to_double(self):
    expect = make_expression_graph({
        'arguments': {
            'value': IMAGE,
        },
        'functionName': 'Image.toDouble',
    })
    expression = ee.Image('a').toDouble()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_to_float(self):
    expect = make_expression_graph({
        'arguments': {
            'value': IMAGE,
        },
        'functionName': 'Image.toFloat',
    })
    expression = ee.Image('a').toFloat()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_to_int(self):
    expect = make_expression_graph({
        'arguments': {
            'value': IMAGE,
        },
        'functionName': 'Image.toInt',
    })
    expression = ee.Image('a').toInt()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_to_int16(self):
    expect = make_expression_graph({
        'arguments': {
            'value': IMAGE,
        },
        'functionName': 'Image.toInt16',
    })
    expression = ee.Image('a').toInt16()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_to_int32(self):
    expect = make_expression_graph({
        'arguments': {
            'value': IMAGE,
        },
        'functionName': 'Image.toInt32',
    })
    expression = ee.Image('a').toInt32()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_to_int64(self):
    expect = make_expression_graph({
        'arguments': {
            'value': IMAGE,
        },
        'functionName': 'Image.toInt64',
    })
    expression = ee.Image('a').toInt64()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_to_int8(self):
    expect = make_expression_graph({
        'arguments': {
            'value': IMAGE,
        },
        'functionName': 'Image.toInt8',
    })
    expression = ee.Image('a').toInt8()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_to_long(self):
    expect = make_expression_graph({
        'arguments': {
            'value': IMAGE,
        },
        'functionName': 'Image.toLong',
    })
    expression = ee.Image('a').toLong()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_to_short(self):
    expect = make_expression_graph({
        'arguments': {
            'value': IMAGE,
        },
        'functionName': 'Image.toShort',
    })
    expression = ee.Image('a').toShort()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_to_uint16(self):
    expect = make_expression_graph({
        'arguments': {
            'value': IMAGE,
        },
        'functionName': 'Image.toUint16',
    })
    expression = ee.Image('a').toUint16()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_to_uint32(self):
    expect = make_expression_graph({
        'arguments': {
            'value': IMAGE,
        },
        'functionName': 'Image.toUint32',
    })
    expression = ee.Image('a').toUint32()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_to_uint8(self):
    expect = make_expression_graph({
        'arguments': {
            'value': IMAGE,
        },
        'functionName': 'Image.toUint8',
    })
    expression = ee.Image('a').toUint8()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_translate(self):
    x = 1
    y = 2
    units = 'pixels'
    proj = EPSG_4326
    expect = make_expression_graph({
        'arguments': {
            'input': IMAGE,
            'x': {'constantValue': x},
            'y': {'constantValue': y},
            'units': {'constantValue': units},
            'proj': {
                'functionInvocationValue': {
                    'functionName': 'Projection',
                    'arguments': {'crs': {'constantValue': proj}},
                }
            },
        },
        'functionName': 'Image.translate',
    })
    expression = ee.Image('a').translate(x, y, units, proj)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').translate(x=x, y=y, units=units, proj=proj)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_trigamma(self):
    expect = make_expression_graph({
        'arguments': {
            'value': IMAGE,
        },
        'functionName': 'Image.trigamma',
    })
    expression = ee.Image('a').trigamma()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_uint16(self):
    expect = make_expression_graph({
        'arguments': {
            'value': IMAGE,
        },
        'functionName': 'Image.uint16',
    })
    expression = ee.Image('a').uint16()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_uint32(self):
    expect = make_expression_graph({
        'arguments': {
            'value': IMAGE,
        },
        'functionName': 'Image.uint32',
    })
    expression = ee.Image('a').uint32()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_uint8(self):
    expect = make_expression_graph({
        'arguments': {
            'value': IMAGE,
        },
        'functionName': 'Image.uint8',
    })
    expression = ee.Image('a').uint8()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_unit_scale(self):
    low = 1
    high = 2
    expect = make_expression_graph({
        'arguments': {
            'input': IMAGE,
            'low': {'constantValue': low},
            'high': {'constantValue': high},
        },
        'functionName': 'Image.unitScale',
    })
    expression = ee.Image('a').unitScale(low, high)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').unitScale(low=low, high=high)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_unmask(self):
    value = 'b'
    same_footprint = True
    expect = make_expression_graph({
        'arguments': {
            'input': IMAGE,
            'value': IMAGE_B,
            'sameFootprint': {'constantValue': same_footprint},
        },
        'functionName': 'Image.unmask',
    })
    expression = ee.Image('a').unmask(value, same_footprint)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').unmask(value=value, sameFootprint=same_footprint)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_unmix(self):
    endmembers = ['b', 'c']
    sum_to_one = False
    non_negative = True
    expect = make_expression_graph({
        'arguments': {
            'image': IMAGE,
            'endmembers': {'constantValue': endmembers},
            'nonNegative': {'constantValue': non_negative},
            'sumToOne': {'constantValue': sum_to_one},
        },
        'functionName': 'Image.unmix',
    })
    expression = ee.Image('a').unmix(endmembers, sum_to_one, non_negative)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').unmix(
        endmembers=endmembers, sumToOne=sum_to_one, nonNegative=non_negative
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_update_mask(self):
    mask = 'b'
    expect = make_expression_graph({
        'arguments': {
            'image': IMAGE,
            'mask': IMAGE_B,
        },
        'functionName': 'Image.updateMask',
    })
    expression = ee.Image('a').updateMask(mask)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').updateMask(mask=mask)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_visualize(self):
    bands = ['b', 'c']
    gain = [1, 2]
    bias = [3, 4]
    min_values = [5, 6]
    max_values = [7, 8]
    gamma = [9, 10]
    opacity = 11
    palette = ['red', 'blue']
    force_rgb_output = True

    expect = make_expression_graph({
        'arguments': {
            'image': IMAGE,
            'bands': {'constantValue': bands},
            'gain': {'constantValue': gain},
            'bias': {'constantValue': bias},
            'min': {'constantValue': min_values},
            'max': {'constantValue': max_values},
            'gamma': {'constantValue': gamma},
            'opacity': {'constantValue': opacity},
            'palette': {'constantValue': palette},
            'forceRgbOutput': {'constantValue': force_rgb_output},
        },
        'functionName': 'Image.visualize',
    })

    expression = ee.Image('a').visualize(
        bands,
        gain,
        bias,
        min_values,
        max_values,
        gamma,
        opacity,
        palette,
        force_rgb_output,
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').visualize(
        bands=bands,
        gain=gain,
        bias=bias,
        min=min_values,
        max=max_values,
        gamma=gamma,
        opacity=opacity,
        palette=palette,
        forceRgbOutput=force_rgb_output,
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_where(self):
    test = 'b'
    value = 'c'
    expect = make_expression_graph({
        'arguments': {
            'input': IMAGE,
            'test': IMAGE_B,
            'value': IMAGE_C,
        },
        'functionName': 'Image.where',
    })
    expression = ee.Image('a').where(test, value)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Image('a').where(test=test, value=value)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_zero_crossing(self):
    expect = make_expression_graph({
        'arguments': {
            'image': IMAGE,
        },
        'functionName': 'Image.zeroCrossing',
    })
    expression = ee.Image('a').zeroCrossing()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)


if __name__ == '__main__':
  unittest.main()
