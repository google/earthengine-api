"""Test for the ee.image module."""



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
    self.assertEquals({'mapid': 'fakeMapId', 'image': image}, image.getMapId())

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

  def testDownload(self):
    """Verifies Download ID and URL generation."""
    url = ee.Image(1).getDownloadUrl()

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
    url = ee.Image(1).getThumbUrl({'size': [13, 42]})

    self.assertEquals('/thumb', self.last_thumb_call['url'])
    self.assertEquals(
        {
            'image': ee.Image(1).serialize(),
            'json_format': 'v2',
            'size': '13x42',
            'getid': '1'
        },
        self.last_thumb_call['data'])
    self.assertEquals('/api/thumb?thumbid=3&token=4', url)


if __name__ == '__main__':
  unittest.main()
