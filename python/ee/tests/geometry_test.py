"""Test for the ee.geometry module."""



import unittest

import ee


class GeometryTest(unittest.TestCase):

  def testValid_Point(self):
    """Verifies Point constructor behavior with valid arguments."""
    self.assertValid(1, ee.Geometry.Point, [1, 2])
    self.assertValid(1, ee.Geometry.Point, 1, 2)

  def testValid_MultiPoint(self):
    """Verifies MultiPoint constructor behavior with valid arguments."""
    self.assertValid(2, ee.Geometry.MultiPoint, 1, 2, 3, 4, 5, 6)

  def testValid_LineString(self):
    """Verifies LineString constructor behavior with valid arguments."""
    self.assertValid(2, ee.Geometry.LineString, 1, 2, 3, 4, 5, 6)

  def testValid_LinearRing(self):
    """Verifies LinearRing constructor behavior with valid arguments."""
    self.assertValid(2, ee.Geometry.LinearRing, 1, 2, 3, 4, 5, 6)

  def testValid_MultiLineString(self):
    """Verifies MultiLineString constructor behavior with valid arguments."""
    self.assertValid(3, ee.Geometry.MultiLineString, 1, 2, 3, 4, 5, 6)

  def testValid_Polygon(self):
    """Verifies Polygon constructor behavior with valid arguments."""
    self.assertValid(3, ee.Geometry.Polygon, 1, 2, 3, 4, 5, 6)

  def testValid_Rectangle(self):
    """Verifies Rectangle constructor behavior with valid arguments."""
    self.assertValid(3, ee.Geometry.Rectangle, 1, 2, 5, 6)

  def testValid_MultiPolygon(self):
    """Verifies MultiPolygon constructor behavior with valid arguments."""
    self.assertValid(4, ee.Geometry.MultiPolygon, 1, 2, 3, 4, 5, 6)

  def testInvalid_MultiPoint(self):
    """Verifies MultiPoint constructor behavior with invalid arguments."""
    f = ee.Geometry.MultiPoint
    self.assertInvalid(
        f, 'Invalid number of coordinates: 5', 1, 2, 3, 4, 5)
    self.assertInvalid(f, 'Invalid geometry', [1, 2, 3, 4, 5])
    self.assertInvalid(f, 'Invalid geometry', [[1, 2], [3, 4], 5])
    # Too many nesting levels.
    self.assertInvalid(f, 'Invalid geometry', [[[1, 2], [3, 4]]])

  def testInvalid_LineString(self):
    """Verifies LineString constructor behavior with invalid arguments."""
    f = ee.Geometry.LineString
    self.assertInvalid(
        f, 'Invalid number of coordinates: 5', 1, 2, 3, 4, 5)
    self.assertInvalid(f, 'Invalid geometry', [1, 2, 3, 4, 5])
    self.assertInvalid(f, 'Invalid geometry', [[1, 2], [3, 4], 5])
    # Too many nesting levels.
    self.assertInvalid(f, 'Invalid geometry', [[[1, 2], [3, 4]]])

  def testInvalid_LinearRing(self):
    """Verifies LinearRing constructor behavior with invalid arguments."""
    f = ee.Geometry.LinearRing
    self.assertInvalid(
        f, 'Invalid number of coordinates: 5', 1, 2, 3, 4, 5)
    self.assertInvalid(f, 'Invalid geometry', [1, 2, 3, 4, 5])
    self.assertInvalid(f, 'Invalid geometry', [[1, 2], [3, 4], 5])
    # Too many nesting levels.
    self.assertInvalid(f, 'Invalid geometry', [[[1, 2], [3, 4]]])

  def testInvalid_MultiLineString(self):
    """Verifies MultiLineString constructor behavior with invalid arguments."""
    f = ee.Geometry.MultiLineString
    self.assertInvalid(
        f, 'Invalid number of coordinates: 5', 1, 2, 3, 4, 5)
    self.assertInvalid(f, 'Invalid geometry', [1, 2, 3, 4, 5])
    self.assertInvalid(f, 'Invalid geometry', [[1, 2], [3, 4], 5])
    # Too many nesting levels.
    self.assertInvalid(f, 'Invalid geometry', [[[[1, 2], [3, 4]]]])
    # Bad nesting
    self.assertInvalid(f, 'Invalid geometry', [[[1, 2], [3, 4]], [1, 2]])

  def testInvalid_Polygon(self):
    """Verifies Polygon constructor behavior with invalid arguments."""
    f = ee.Geometry.Polygon
    self.assertInvalid(
        f, 'Invalid number of coordinates: 5', 1, 2, 3, 4, 5)
    self.assertInvalid(f, 'Invalid geometry', [1, 2, 3, 4, 5])
    self.assertInvalid(f, 'Invalid geometry', [[1, 2], [3, 4], 5])
    # Too many nesting levels.
    self.assertInvalid(f, 'Invalid geometry', [[[[1, 2], [3, 4], [5, 6]]]])
    # Bad nesting
    self.assertInvalid(f, 'Invalid geometry', [[[1, 2], [3, 4]], [1, 2]])

  def testInvalid_MultiPolygon(self):
    """Verifies MultiPolygon constructor behavior with invalid arguments."""
    f = ee.Geometry.MultiPolygon
    self.assertInvalid(f, 'Invalid number of coordinates: 5', 1, 2, 3, 4, 5)
    self.assertInvalid(f, 'Invalid geometry', [1, 2, 3, 4, 5])
    self.assertInvalid(f, 'Invalid geometry', [[1, 2], [3, 4], 5])
    # Too many nesting levels.
    self.assertInvalid(f, 'Invalid geometry', [[[[[1, 2], [3, 4], [5, 6]]]]])
    # Bad nesting
    self.assertInvalid(f, 'Invalid geometry', [[[[1, 2], [3, 4]], [1, 2]]])

  def testArrayConstructors(self):
    """Verifies that constructors that take arrays fix nesting."""
    get_coordinates_count = lambda g: len(g.toGeoJSON()['coordinates'])

    point = ee.Geometry.Point([1, 2])
    self.assertEquals(2, get_coordinates_count(point))

    multipoint = ee.Geometry.MultiPoint([[1, 2], [3, 4], [5, 6]])
    self.assertEquals(3, get_coordinates_count(multipoint))

    line = ee.Geometry.LineString([[1, 2], [3, 4], [5, 6]])
    self.assertEquals(3, get_coordinates_count(line))

    ring = ee.Geometry.LinearRing([[1, 2], [3, 4], [5, 6]])
    self.assertEquals(3, get_coordinates_count(ring))

    multiline = ee.Geometry.MultiLineString(
        [[[1, 2], [3, 4]],
         [[5, 6], [7, 8]]])
    self.assertEquals(2, get_coordinates_count(multiline))

    polygon = ee.Geometry.Polygon([[[1, 2], [3, 4], [5, 6]]])
    self.assertEquals(1, get_coordinates_count(polygon))

    mpolygon = ee.Geometry.MultiPolygon(
        [[[[1, 2], [3, 4], [5, 6]]],
         [[[1, 2], [3, 4], [5, 6]]]])
    self.assertEquals(2, get_coordinates_count(mpolygon))

  def testGeodesicFlag(self):
    """Verifies that JSON parsing and generation preserves the geodesic flag."""
    geodesic = ee.Geometry({
        'type': 'LineString',
        'coordinates': [[1, 2], [3, 4]],
        'geodesic': True
    })
    projected = ee.Geometry({
        'type': 'LineString',
        'coordinates': [[1, 2], [3, 4]],
        'geodesic': False
    })
    self.assertTrue(geodesic.toGeoJSON()['geodesic'])
    self.assertFalse(projected.toGeoJSON()['geodesic'])

  def assertValid(self, nesting, ctor, *coords):
    """Checks that geometry is valid and has the expected nesting level.

    Args:
      nesting: The expected coordinate nesting level.
      ctor: The geometry constructor function, e.g. ee.Geometry.MultiPoint.
      *coords: The coordinates of the geometry.
    """
    # The constructor already does a validity check.
    geometry = ctor(*coords)
    self.assertTrue(isinstance(geometry, ee.Geometry))
    self.assertTrue(isinstance(geometry.toGeoJSON(), dict))
    final_coords = geometry.toGeoJSON()['coordinates']
    self.assertEquals(nesting, ee.Geometry._isValidCoordinates(final_coords))

  def assertInvalid(self, ctor, msg, *coords):
    """Verifies that geometry is invalid.

    Calls the given constructor with whatever arguments have been passed,
    and verifies that the given error message is thrown.

    Args:
      ctor: The geometry constructor function, e.g. ee.Geometry.MultiPoint.
      msg: The expected error message in the thrown exception.
      *coords: The coordinates of the geometry.
    """
    try:
      ctor(*coords)
    except ee.EEException as e:
      self.assertTrue(msg in str(e))
    else:
      self.fail('Expected an exception.')


if __name__ == '__main__':
  unittest.main()
