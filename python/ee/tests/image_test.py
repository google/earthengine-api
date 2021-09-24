#!/usr/bin/env python
"""Test for the ee.image module."""



import json
from unittest import mock

import unittest

import ee
from ee import _cloud_api_utils
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
    self.assertIsInstance(from_variable, ee.Image)
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
        self.last_mapid_call['data']['image'].serialize())

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
    ee.Image(1).getDownloadURL()

    self.assertEqual('/download', self.last_download_call['url'])
    self.assertEqual(
        ee.Image(1).serialize(),
        self.last_download_call['data']['image'].serialize())


class CloudThumbnailAndExportImageTests(apitestcase.ApiTestCase):

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
    self.expected_geometry = ee.Geometry(self.geo_json, opt_geodesic=False)

  def assertImageEqual(self, expected, actual):
    self.assertDictEqual(
        serializer.encode(expected),
        serializer.encode(actual))

  def testThumb_withDimensionsRegionCrs(self):
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
                  crs='EPSG:4326',
                  crsTransform=[1, 0, 0, 0, -1, 0]).clipToBoundsAndScale(
                      geometry=ee.Geometry(self.geo_json, opt_geodesic=False),
                      width=13,
                      height=42)))
      self.assertEqual(kwargs['parent'], 'projects/earthengine-legacy')

  def testThumb_withDimensionsRegionJson(self):
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

  def testThumb_withDimensionsListCoords(self):
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

  def testThumb_withDimensionsListMinMax(self):
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

  def testThumb_withVisualizationParams(self):
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

  def testBuildDownloadIdImage_buildsImagePerBand(self):
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

  def testBuildDownloadIdImage_transformsGivenImage(self):
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

  def testBuildDownloadIdImage_handlesInvalidParameters(self):
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
    with self.assertRaisesWithLiteralMatch(
        ee_exception.EEException, 'Each band dictionary must have an id.'):
      ee.Image('foo')._build_download_id_image(params)

  def testBuildDownloadIdImage_handlesDimensionsAndScale(self):
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

  def testDownloadURL(self):
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

  def testPrepareForExport_simple(self):
    """Verifies proper handling of export-related parameters."""

    with apitestcase.UsingCloudApi():
      image, params = self.base_image.prepare_for_export({'something': 'else'})
      self.assertImageEqual(self.base_image, image)
      self.assertEqual({'something': 'else'}, params)

  def testPrepareForExport_withCrsAndTransform(self):
    with apitestcase.UsingCloudApi():
      image, params = self.base_image.prepare_for_export({
          'crs': 'ABCD',
          'crs_transform': '1,2,3,4,5,6'
      })
      self.assertImageEqual(
          self.base_image.reproject(
              crs='ABCD', crsTransform=[1, 2, 3, 4, 5, 6]), image)
      self.assertEqual({}, params)

  def testPrepareForExport_invalidCrsAndTransform(self):
    with apitestcase.UsingCloudApi():
      with self.assertRaises(ee_exception.EEException):
        self.base_image.prepare_for_export({'crs_transform': '1,2,3,4,5,6'})
      with self.assertRaises(ValueError):
        self.base_image.prepare_for_export({
            'crs': 'ABCD',
            'crs_transform': 'x'
        })

  def testPrepareForExport_withPolygon(self):
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

  def testPrepareForExport_withScaleAndRegion(self):
    with apitestcase.UsingCloudApi():
      polygon = ee.Geometry.Polygon(9, 8, 7, 6, 3, 2)
      image, params = self.base_image.prepare_for_export({
          'scale': 8,
          'region': polygon.toGeoJSONString(),
          'something': 'else'
      })
      expected_polygon = ee.Geometry(polygon.toGeoJSON(), opt_geodesic=False)
      self.assertImageEqual(
          self.base_image.clipToBoundsAndScale(
              scale=8, geometry=expected_polygon), image)
      self.assertEqual({'something': 'else'}, params)

  def testPrepareForExport_withRegionDimensionsCrsAndTransform(self):
    with apitestcase.UsingCloudApi():
      polygon = ee.Geometry.Polygon(9, 8, 7, 6, 3, 2)
      image, params = self.base_image.prepare_for_export({
          'crs': 'ABCD',
          'crs_transform': '[1,2,3,4,5,6]',
          'dimensions': [3, 2],
          'region': polygon.toGeoJSONString(),
          'something': 'else'
      })
      expected_polygon = ee.Geometry(polygon.toGeoJSON(), opt_geodesic=False)
      projected = self.base_image.reproject(
          crs='ABCD', crsTransform=[1, 2, 3, 4, 5, 6])

      self.assertImageEqual(
          projected.clipToBoundsAndScale(
              width=3, height=2, geometry=expected_polygon), image)
      self.assertEqual({'something': 'else'}, params)

  def testPrepareForExport_withDimensionsCrsAndTransform(self):
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

  def testPrepareForExport_withOnlyRegion(self):
    with apitestcase.UsingCloudApi():
      polygon = ee.Geometry.Polygon(9, 8, 7, 6, 3, 2)
      image, params = self.base_image.prepare_for_export({
          'region': polygon,
          'something': 'else'
      })

      self.assertEqual(
          self.base_image.clip(polygon), image)
      self.assertEqual({'something': 'else'}, params)

  def testPrepareForExport_withCrsNoTransform(self):
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

  def testMorphologicalOperators(self):
    """Verifies the focal operators are installed with aliases."""
    ee.Image(0).focal_min().focalMin()

if __name__ == '__main__':
  unittest.main()
