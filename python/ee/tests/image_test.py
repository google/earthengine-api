#!/usr/bin/env python
"""Test for the ee.image module."""



import json

import unittest

import ee
from ee import apitestcase


class ImageTestCase(apitestcase.ApiTestCase):

  def testConstructors(self):
    """Verifies that constructors understand valid parameters."""
    from_constant = ee.Image(1)
    self.assertEquals(ee.ApiFunction.lookup('Image.constant'),
                      from_constant.func)
    self.assertEquals({'value': 1}, from_constant.args)

    array_constant = ee.Array([1, 2])
    from_array_constant = ee.Image(array_constant)
    self.assertEquals(ee.ApiFunction.lookup('Image.constant'),
                      from_array_constant.func)
    self.assertEquals({'value': array_constant}, from_array_constant.args)

    from_id = ee.Image('abcd')
    self.assertEquals(ee.ApiFunction.lookup('Image.load'), from_id.func)
    self.assertEquals({'id': 'abcd'}, from_id.args)

    from_array = ee.Image([1, 2])
    self.assertEquals(ee.ApiFunction.lookup('Image.addBands'), from_array.func)
    self.assertEquals({'dstImg': ee.Image(1), 'srcImg': ee.Image(2)},
                      from_array.args)

    from_computed_object = ee.Image(ee.ComputedObject(None, {'x': 'y'}))
    self.assertEquals({'x': 'y'}, from_computed_object.args)

    original = ee.Image(1)
    from_other_image = ee.Image(original)
    self.assertEquals(from_other_image, original)

    from_nothing = ee.Image()
    self.assertEquals(ee.ApiFunction.lookup('Image.mask'), from_nothing.func)
    self.assertEquals({'image': ee.Image(0), 'mask': ee.Image(0)},
                      from_nothing.args)

    from_id_and_version = ee.Image('abcd', 123)
    self.assertEquals(ee.ApiFunction.lookup('Image.load'),
                      from_id_and_version.func)
    self.assertEquals({'id': 'abcd', 'version': 123},
                      from_id_and_version.args)

    from_variable = ee.Image(ee.CustomFunction.variable(None, 'foo'))
    self.assertTrue(isinstance(from_variable, ee.Image))
    self.assertEquals({'type': 'ArgumentRef', 'value': 'foo'},
                      from_variable.encode(None))

  def testImageSignatures(self):
    """Verifies that the API functions are added to ee.Image."""
    self.assertTrue(hasattr(ee.Image(1), 'addBands'))

  def testImperativeFunctions(self):
    """Verifies that imperative functions return ready values."""
    image = ee.Image(1)
    self.assertEquals({'value': 'fakeValue'}, image.getInfo())
    map_id = image.getMapId()
    self.assertEquals('fakeMapId', map_id['mapid'])
    self.assertEquals(image, map_id['image'])

  def testGetMapIdVisualization(self):
    """Verifies that imperative functions return ready values."""
    image = ee.Image(1)
    image.getMapId({'min': 0})

    self.assertEquals(
        ee.Image(1).visualize(min=0).serialize(),
        self.last_mapid_call['data']['image'])

  def testCombine(self):
    """Verifies the behavior of ee.Image.combine_()."""
    image1 = ee.Image([1, 2])
    image2 = ee.Image([3, 4])
    combined = ee.Image.combine_([image1, image2], ['a', 'b', 'c', 'd'])

    self.assertEquals(ee.ApiFunction.lookup('Image.select'), combined.func)
    self.assertEquals(ee.List(['.*']), combined.args['bandSelectors'])
    self.assertEquals(ee.List(['a', 'b', 'c', 'd']), combined.args['newNames'])
    self.assertEquals(ee.ApiFunction.lookup('Image.addBands'),
                      combined.args['input'].func)
    self.assertEquals({'dstImg': image1, 'srcImg': image2},
                      combined.args['input'].args)

  def testSelect(self):
    """Verifies regression in the behavior of empty ee.Image.select()."""
    image = ee.Image([1, 2]).select()
    self.assertEquals(ee.ApiFunction.lookup('Image.select'), image.func)
    self.assertEquals(ee.List([]), image.args['bandSelectors'])

  def testRename(self):
    """Verifies image.rename varargs handling."""
    image = ee.Image([1, 2]).rename('a', 'b')
    self.assertEquals(ee.ApiFunction.lookup('Image.rename'), image.func)
    self.assertEquals(ee.List(['a', 'b']), image.args['names'])

    image = ee.Image([1, 2]).rename(['a', 'b'])
    self.assertEquals(ee.ApiFunction.lookup('Image.rename'), image.func)
    self.assertEquals(ee.List(['a', 'b']), image.args['names'])

    image = ee.Image([1]).rename('a')
    self.assertEquals(ee.ApiFunction.lookup('Image.rename'), image.func)
    self.assertEquals(ee.List(['a']), image.args['names'])

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

    self.assertEquals(
        {
            'type': 'Invocation',
            'functionName': 'Image.parseExpression',
            'arguments': {
                'expression': 'a',
                'argName': 'DEFAULT_EXPRESSION_IMAGE',
                'vars': ['DEFAULT_EXPRESSION_IMAGE', 'b']
            }
        },
        dummy_encoder(expression_func))

  def testDownload(self):
    """Verifies Download ID and URL generation."""
    url = ee.Image(1).getDownloadURL()

    self.assertEquals('/download', self.last_download_call['url'])
    self.assertEquals(
        {
            'image': ee.Image(1).serialize(),
            'json_format': 'v2'
        },
        self.last_download_call['data'])
    self.assertEquals('/api/download?docid=1&token=2', url)

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

    self.assertEquals('/thumb', self.last_thumb_call['url'])
    self.assertEquals({
        'image': ee.Image(1).serialize(),
        'json_format': 'v2',
        'size': '13x42',
        'getid': '1',
        'region': json.dumps(geo_json),
    }, self.last_thumb_call['data'])
    self.assertEquals('/api/thumb?thumbid=3&token=4', url)

    # Again with visualization parameters
    url = ee.Image(1).getThumbURL({
        'size': [13, 42],
        'region': geo_json,
        'min': 0
    })
    self.assertEquals(
        ee.Image(1).visualize(min=0).serialize(),
        self.last_thumb_call['data']['image'])


if __name__ == '__main__':
  unittest.main()
