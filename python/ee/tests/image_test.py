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

  def setUp(self):  # pylint: disable=g-missing-super-call
    self.InitializeApi(should_mock=False)
    self.cloud_api_resource = mock.MagicMock()
    self.cloud_api_resource.projects().thumbnails().create(
    ).execute.return_value = {
        'name': 'thumbName'
    }

    self.base_image = ee.Image(1)
    self.geo_json = {
        'type':
            'Polygon',
        'coordinates': [[
            [-112.587890625, 44.94924926661151],
            [-114.873046875, 39.48708498168749],
            [-103.623046875, 41.82045509614031],
        ]],
    }
    self.expected_geometry = ee.Geometry(self.geo_json, geodesic=False)

  def assertImageEqual(self, expected, actual):
    self.assertDictEqual(
        serializer.encode(expected),
        serializer.encode(actual))

  @unittest.skip('Does not work on github')
  def test_thumb_with_dimensions_region_crs(self):
    """Verifies Thumbnail ID and URL generation in the Cloud API."""

    with apitestcase.UsingCloudApi(cloud_api_resource=self.cloud_api_resource):
      url = self.base_image.getThumbURL({
          'dimensions': [13, 42],
          'region': self.geo_json,
          'crs': 'EPSG:4326',
      })

      self.assertEqual('None/%s/thumbName:getPixels' % _cloud_api_utils.VERSION,
                       url)
      _, kwargs = self.cloud_api_resource.projects().thumbnails(
      ).create.call_args
      self.assertEqual(
          kwargs['body']['expression'],
          serializer.encode(
              self.base_image.setDefaultProjection(
                  crs='EPSG:4326', crsTransform=[1, 0, 0, 0, -1, 0]
              ).clipToBoundsAndScale(
                  geometry=ee.Geometry(self.geo_json, geodesic=False),
                  width=13,
                  height=42,
              )
          ),
      )
      self.assertEqual(kwargs['parent'], 'projects/earthengine-legacy')

  @unittest.skip('Does not work on github')
  def test_thumb_with_dimensions_region_json(self):
    # Try it with the region as a GeoJSON string.
    with apitestcase.UsingCloudApi(cloud_api_resource=self.cloud_api_resource):
      self.base_image.getThumbURL({
          'dimensions': [13, 42],
          'region': json.dumps(self.geo_json),
      })

      _, kwargs = self.cloud_api_resource.projects().thumbnails(
      ).create.call_args
      self.assertEqual(
          kwargs['body']['expression'],
          serializer.encode(
              self.base_image.clipToBoundsAndScale(
                  geometry=self.expected_geometry, width=13, height=42)))
      self.assertEqual(kwargs['parent'], 'projects/earthengine-legacy')

  @unittest.skip('Does not work on github')
  def test_thumb_with_dimensions_list_coords(self):
    # Try it with the region as a list of coordinates.
    with apitestcase.UsingCloudApi(cloud_api_resource=self.cloud_api_resource):
      self.base_image.getThumbURL({
          'dimensions': [13, 42],
          'region': [[-180, -90], [-180, 90], [180, 90]],
      })

      _, kwargs = self.cloud_api_resource.projects().thumbnails(
      ).create.call_args
      expected_geometry = ee.Geometry.Polygon(
          [[-180, -90], [-180, 90], [180, 90]], proj=None, geodesic=False)
      self.assertEqual(
          kwargs['body']['expression'],
          serializer.encode(
              self.base_image.clipToBoundsAndScale(
                  geometry=expected_geometry, width=13, height=42)))
      self.assertEqual(kwargs['parent'], 'projects/earthengine-legacy')

  @unittest.skip('Does not work on github')
  def test_thumb_with_dimensions_list_min_max(self):
    # Try it with the region as a list of coordinates.
    with apitestcase.UsingCloudApi(cloud_api_resource=self.cloud_api_resource):
      self.base_image.getThumbURL({
          'dimensions': [13, 42],
          'region': [-180, -90, 180, 90],
      })

      _, kwargs = self.cloud_api_resource.projects().thumbnails(
      ).create.call_args
      expected_geometry = ee.Geometry.Rectangle(
          [-180, -90, 180, 90], proj=None, geodesic=False)
      self.assertEqual(
          kwargs['body']['expression'],
          serializer.encode(
              self.base_image.clipToBoundsAndScale(
                  geometry=expected_geometry, width=13, height=42)))
      self.assertEqual(kwargs['parent'], 'projects/earthengine-legacy')

  @unittest.skip('Does not work on github')
  def test_thumb_with_visualization_params(self):
    with apitestcase.UsingCloudApi(cloud_api_resource=self.cloud_api_resource):
      self.base_image.getThumbURL({
          'dimensions': [13, 42],
          'region': self.geo_json,
          'min': 0
      })
      _, kwargs = self.cloud_api_resource.projects().thumbnails(
      ).create.call_args

      self.assertEqual(
          kwargs['body']['expression'],
          serializer.encode(
              self.base_image.clipToBoundsAndScale(
                  geometry=self.expected_geometry, width=13,
                  height=42).visualize(min=0)))

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

  @unittest.skip('Does not work on github')
  def test_download_url(self):
    """Verifies that the getDownloadURL request is constructed correctly."""

    with apitestcase.UsingCloudApi(cloud_api_resource=self.cloud_api_resource):
      url = self.base_image.getDownloadURL()
      _, kwargs = self.cloud_api_resource.projects().thumbnails(
      ).create.call_args
      self.assertEqual(
          serializer.encode(self.base_image, for_cloud_api=True),
          kwargs['body']['expression'])
      self.assertEqual('ZIPPED_GEO_TIFF_PER_BAND', kwargs['body']['fileFormat'])
      self.assertEqual('projects/earthengine-legacy', kwargs['parent'])
      self.assertEqual('None/%s/thumbName:getPixels' % _cloud_api_utils.VERSION,
                       url)

  def test_prepare_for_export_simple(self):
    """Verifies proper handling of export-related parameters."""

    with apitestcase.UsingCloudApi():
      image, params = self.base_image.prepare_for_export({'something': 'else'})
      self.assertImageEqual(self.base_image, image)
      self.assertEqual({'something': 'else'}, params)

  def test_prepare_for_export_with_crs_and_transform(self):
    with apitestcase.UsingCloudApi():
      image, params = self.base_image.prepare_for_export({
          'crs': 'ABCD',
          'crs_transform': '1,2,3,4,5,6'
      })
      self.assertImageEqual(
          self.base_image.reproject(
              crs='ABCD', crsTransform=[1, 2, 3, 4, 5, 6]), image)
      self.assertEqual({}, params)

  def test_prepare_for_export_invalid_crs_and_transform(self):
    with apitestcase.UsingCloudApi():
      with self.assertRaises(ee_exception.EEException):
        self.base_image.prepare_for_export({'crs_transform': '1,2,3,4,5,6'})
      with self.assertRaises(ValueError):
        self.base_image.prepare_for_export({
            'crs': 'ABCD',
            'crs_transform': 'x'
        })

  def test_prepare_for_export_with_polygon(self):
    with apitestcase.UsingCloudApi():
      polygon = ee.Geometry.Polygon(9, 8, 7, 6, 3, 2)
      image, params = self.base_image.prepare_for_export({
          'dimensions': '3x2',
          'region': polygon
      })
      expected = self.base_image.clipToBoundsAndScale(
          width=3, height=2, geometry=polygon)
      self.assertImageEqual(expected, image)
      self.assertEqual({}, params)

  def test_prepare_for_export_with_scale_and_region(self):
    with apitestcase.UsingCloudApi():
      polygon = ee.Geometry.Polygon(9, 8, 7, 6, 3, 2)
      image, params = self.base_image.prepare_for_export({
          'scale': 8,
          'region': polygon.toGeoJSONString(),
          'something': 'else'
      })
      expected_polygon = ee.Geometry(polygon.toGeoJSON(), geodesic=False)
      self.assertImageEqual(
          self.base_image.clipToBoundsAndScale(
              scale=8, geometry=expected_polygon), image)
      self.assertEqual({'something': 'else'}, params)

  def test_prepare_for_export_with_region_dimensions_crs_and_transform(self):
    with apitestcase.UsingCloudApi():
      polygon = ee.Geometry.Polygon(9, 8, 7, 6, 3, 2)
      image, params = self.base_image.prepare_for_export({
          'crs': 'ABCD',
          'crs_transform': '[1,2,3,4,5,6]',
          'dimensions': [3, 2],
          'region': polygon.toGeoJSONString(),
          'something': 'else'
      })
      expected_polygon = ee.Geometry(polygon.toGeoJSON(), geodesic=False)
      projected = self.base_image.reproject(
          crs='ABCD', crsTransform=[1, 2, 3, 4, 5, 6])

      self.assertImageEqual(
          projected.clipToBoundsAndScale(
              width=3, height=2, geometry=expected_polygon), image)
      self.assertEqual({'something': 'else'}, params)

  def test_prepare_for_export_with_dimensions_crs_and_transform(self):
    with apitestcase.UsingCloudApi():
      # Special case of crs+transform+two dimensions
      image, params = self.base_image.prepare_for_export({
          'crs': 'ABCD',
          'crs_transform': [1, 2, 3, 4, 5, 6],
          'dimensions': [3, 2],
          'something': 'else'
      })
      reprojected_image = self.base_image.reproject(
          crs='ABCD', crsTransform=[1, 2, 3, 4, 5, 6])

      self.assertEqual(
          reprojected_image.clipToBoundsAndScale(
              geometry=ee.Geometry.Rectangle(
                  coords=[0, 0, 3, 2],
                  proj=reprojected_image.projection(),
                  geodesic=False,
                  evenOdd=True)), image)
      self.assertEqual({'something': 'else'}, params)

  def test_prepare_for_export_with_only_region(self):
    with apitestcase.UsingCloudApi():
      polygon = ee.Geometry.Polygon(9, 8, 7, 6, 3, 2)
      image, params = self.base_image.prepare_for_export({
          'region': polygon,
          'something': 'else'
      })

      self.assertEqual(
          self.base_image.clip(polygon), image)
      self.assertEqual({'something': 'else'}, params)

  def test_prepare_for_export_with_crs_no_transform(self):
    with apitestcase.UsingCloudApi():
      # CRS with no crs_transform causes a "soft" reprojection. Make sure that
      # the (crs, crsTransform, dimensions) special case doesn't trigger.
      image, params = self.base_image.prepare_for_export({
          'crs': 'ABCD',
          'dimensions': [3, 2],
          'something': 'else'
      })
      projected = self.base_image.setDefaultProjection(
          crs='ABCD', crsTransform=[1, 0, 0, 0, -1, 0])

      self.assertEqual(projected.clipToBoundsAndScale(width=3, height=2), image)
      self.assertEqual({'something': 'else'}, params)

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
    src_proj = 'EPSG:3857'
    dst_proj = 'EPSG:4326'
    expect = make_expression_graph({
        'arguments': {
            'input': IMAGE,
            'srcProj': {
                'functionInvocationValue': {
                    'functionName': 'Projection',
                    'arguments': {'crs': {'constantValue': 'EPSG:3857'}},
                }
            },
            'dstProj': {
                'functionInvocationValue': {
                    'functionName': 'Projection',
                    'arguments': {'crs': {'constantValue': 'EPSG:4326'}},
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


if __name__ == '__main__':
  unittest.main()
