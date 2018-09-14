#!/usr/bin/env python
"""Test for the ee.geometry module."""



import unittest

import ee
from ee import apitestcase


class GeometryTest(apitestcase.ApiTestCase):

  def testValid_Point(self):
    """Verifies Point constructor behavior with valid arguments."""
    self.assertValid(1, ee.Geometry.Point, [1, 2])
    self.assertValid(1, ee.Geometry.Point, 1, 2)

  def testValid_MultiPoint(self):
    """Verifies MultiPoint constructor behavior with valid arguments."""
    self.assertValid(2, ee.Geometry.MultiPoint, 1, 2, 3, 4, 5, 6)
    self.assertValid(1, ee.Geometry.MultiPoint)

  def testValid_LineString(self):
    """Verifies LineString constructor behavior with valid arguments."""
    self.assertValid(2, ee.Geometry.LineString, 1, 2, 3, 4, 5, 6)

  def testValid_LinearRing(self):
    """Verifies LinearRing constructor behavior with valid arguments."""
    self.assertValid(2, ee.Geometry.LinearRing, 1, 2, 3, 4, 5, 6)

  def testValid_MultiLineString(self):
    """Verifies MultiLineString constructor behavior with valid arguments."""
    self.assertValid(3, ee.Geometry.MultiLineString, 1, 2, 3, 4, 5, 6)
    self.assertValid(1, ee.Geometry.MultiLineString)

  def testValid_Polygon(self):
    """Verifies Polygon constructor behavior with valid arguments."""
    self.assertValid(3, ee.Geometry.Polygon, 1, 2, 3, 4, 5, 6)

  def testValid_Rectangle(self):
    """Verifies Rectangle constructor behavior with valid arguments."""
    self.assertValid(3, ee.Geometry.Rectangle, 1, 2, 5, 6)

  def testValid_MultiPolygon(self):
    """Verifies MultiPolygon constructor behavior with valid arguments."""
    self.assertValid(4, ee.Geometry.MultiPolygon, 1, 2, 3, 4, 5, 6)
    self.assertValid(1, ee.Geometry.MultiPolygon)

  def testValid_GeometryCollection(self):
    """Verifies GeometryCollection constructor behavior with valid arguments."""
    geometry = ee.Geometry({
        'type':
            'GeometryCollection',
        'geometries': [{
            'type': 'Polygon',
            'coordinates': [[[-1, -1], [0, 1], [1, -1]]],
            'geodesic': True,
            'evenOdd': True
        }, {
            'type': 'Point',
            'coordinates': [0, 0]
        }, {
            'type':
                'GeometryCollection',
            'geometries': [{
                'type': 'Point',
                'coordinates': [1, 2]
            }, {
                'type': 'Point',
                'coordinates': [2, 1]
            }]
        }],
        'coordinates': []
    })
    self.assertTrue(isinstance(geometry, ee.Geometry))

  def testInvalid_MultiPoint(self):
    """Verifies MultiPoint constructor behavior with invalid arguments."""
    f = ee.Geometry.MultiPoint
    self.assertInvalid(
        f, 'Invalid number of coordinates: 5', 1, 2, 3, 4, 5)
    self.assertInvalid(f, 'Invalid number of coordinates: 5', [1, 2, 3, 4, 5])
    self.assertInvalid(f, 'Invalid geometry', [[1, 2], [3, 4], 5])
    # Too many nesting levels.
    self.assertInvalid(f, 'Invalid geometry', [[[1, 2], [3, 4]]])

  def testInvalid_LineString(self):
    """Verifies LineString constructor behavior with invalid arguments."""
    f = ee.Geometry.LineString
    self.assertInvalid(
        f, 'Invalid number of coordinates: 5', 1, 2, 3, 4, 5)
    self.assertInvalid(f, 'Invalid number of coordinates: 5', [1, 2, 3, 4, 5])
    self.assertInvalid(f, 'Invalid geometry', [[1, 2], [3, 4], 5])
    # Too many nesting levels.
    self.assertInvalid(f, 'Invalid geometry', [[[1, 2], [3, 4]]])

  def testInvalid_LinearRing(self):
    """Verifies LinearRing constructor behavior with invalid arguments."""
    f = ee.Geometry.LinearRing
    self.assertInvalid(
        f, 'Invalid number of coordinates: 5', 1, 2, 3, 4, 5)
    self.assertInvalid(f, 'Invalid number of coordinates: 5', [1, 2, 3, 4, 5])
    self.assertInvalid(f, 'Invalid geometry', [[1, 2], [3, 4], 5])
    # Too many nesting levels.
    self.assertInvalid(f, 'Invalid geometry', [[[1, 2], [3, 4]]])

  def testInvalid_MultiLineString(self):
    """Verifies MultiLineString constructor behavior with invalid arguments."""
    f = ee.Geometry.MultiLineString
    self.assertInvalid(
        f, 'Invalid number of coordinates: 5', 1, 2, 3, 4, 5)
    self.assertInvalid(f, 'Invalid number of coordinates: 5', [1, 2, 3, 4, 5])
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
    self.assertInvalid(f, 'Invalid number of coordinates: 5', [1, 2, 3, 4, 5])
    self.assertInvalid(f, 'Invalid geometry', [[1, 2], [3, 4], 5])
    # Too many nesting levels.
    self.assertInvalid(f, 'Invalid geometry', [[[[1, 2], [3, 4], [5, 6]]]])
    # Bad nesting
    self.assertInvalid(f, 'Invalid geometry', [[[1, 2], [3, 4]], [1, 2]])

  def testInvalid_MultiPolygon(self):
    """Verifies MultiPolygon constructor behavior with invalid arguments."""
    f = ee.Geometry.MultiPolygon
    self.assertInvalid(f, 'Invalid number of coordinates: 5', 1, 2, 3, 4, 5)
    self.assertInvalid(f, 'Invalid number of coordinates: 5', [1, 2, 3, 4, 5])
    self.assertInvalid(f, 'Invalid geometry', [[1, 2], [3, 4], 5])
    # Too many nesting levels.
    self.assertInvalid(f, 'Invalid geometry', [[[[[1, 2], [3, 4], [5, 6]]]]])
    # Bad nesting
    self.assertInvalid(f, 'Invalid geometry', [[[[1, 2], [3, 4]], [1, 2]]])

  def testEvenOddPolygon(self):
    poly1 = ee.Geometry.Polygon([0, 0, 0, 5, 5, 0])
    self.assertTrue(poly1.toGeoJSON()['evenOdd'])
    poly2 = ee.Geometry.Polygon([0, 0, 0, 5, 5, 0], None, None, None, False)
    self.assertFalse(poly2.toGeoJSON()['evenOdd'])

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

  def testConstructor(self):
    """Check the behavior of the Geometry constructor.

    There are 5 options:
      1) A geoJSON object.
      2) A not-computed geometry.
      3) A not-computed geometry with overrides.
      4) A computed geometry.
      5) something to cast to geometry.
    """
    line = ee.Geometry.LineString(1, 2, 3, 4)

    # GeoJSON.
    from_json = ee.Geometry(line.toGeoJSON())
    self.assertEquals(from_json.func, None)
    self.assertEquals(from_json._type, 'LineString')
    self.assertEquals(from_json._coordinates, [[1, 2], [3, 4]])

    # GeoJSON with a CRS specified.
    json_with_crs = line.toGeoJSON()
    json_with_crs['crs'] = {
        'type': 'name',
        'properties': {
            'name': 'SR-ORG:6974'
        }
    }
    from_json_with_crs = ee.Geometry(json_with_crs)
    self.assertEquals(from_json_with_crs.func, None)
    self.assertEquals(from_json_with_crs._type, 'LineString')
    self.assertEquals(from_json_with_crs._proj, 'SR-ORG:6974')

    # A not-computed geometry.
    self.assertEquals(ee.Geometry(line), line)

    # A not-computed geometry with an override.
    with_override = ee.Geometry(line, 'SR-ORG:6974')
    self.assertEquals(with_override._proj, 'SR-ORG:6974')

    # A computed geometry.
    self.assertEquals(ee.Geometry(line.bounds()), line.bounds())

    # Something to cast to a geometry.
    computed = ee.ComputedObject(ee.Function(), {'a': 1})
    geom = ee.Geometry(computed)
    self.assertEquals(computed.func, geom.func)
    self.assertEquals(computed.args, geom.args)

  def testComputedGeometries(self):
    """Verifies the computed object behavior of the Geometry constructor."""
    line = ee.Geometry.LineString(1, 2, 3, 4)
    bounds = line.bounds()

    self.assertTrue(isinstance(bounds, ee.Geometry))
    self.assertEquals(
        ee.ApiFunction.lookup('Geometry.bounds'), bounds.func)
    self.assertEquals(line, bounds.args['geometry'])
    self.assertTrue(hasattr(bounds, 'bounds'))

  def testComputedCoordinate(self):
    """Verifies that a computed coordinate produces a computed geometry."""
    coords = [1, ee.Number(1).add(1)]
    p = ee.Geometry.Point(coords)

    self.assertTrue(isinstance(p, ee.Geometry))
    self.assertEquals(
        ee.ApiFunction.lookup('GeometryConstructors.Point'), p.func)
    self.assertEquals({'coordinates': ee.List(coords)}, p.args)

  def testComputedList(self):
    """Verifies that a computed coordinate produces a computed geometry."""
    lst = ee.List([1, 2, 3, 4]).slice(0, 2)
    p = ee.Geometry.Point(lst)

    self.assertTrue(isinstance(p, ee.Geometry))
    self.assertEquals(
        ee.ApiFunction.lookup('GeometryConstructors.Point'), p.func)
    self.assertEquals({'coordinates': lst}, p.args)

  def testComputedProjection(self):
    """Verifies that a geometry with a projection can be constructed."""
    p = ee.Geometry.Point([1, 2], 'epsg:4326')

    self.assertTrue(isinstance(p, ee.Geometry))
    self.assertEquals(
        ee.ApiFunction.lookup('GeometryConstructors.Point'), p.func)
    expected_args = {
        'coordinates': ee.List([1, 2]),
        'crs': ee.ApiFunction.lookup('Projection').call('epsg:4326')
    }
    self.assertEquals(expected_args, p.args)

  def testGeometryInputs(self):
    """Verifies that a geometry with geometry inputs can be constructed."""
    p1 = ee.Geometry.Point([1, 2])
    p2 = ee.Geometry.Point([3, 4])
    line = ee.Geometry.LineString([p1, p2])

    self.assertTrue(isinstance(line, ee.Geometry))
    self.assertEquals(
        ee.ApiFunction.lookup('GeometryConstructors.LineString'), line.func)
    self.assertEquals({'coordinates': ee.List([p1, p2])}, line.args)

  def testOldPointKeywordArgs(self):
    """Verifies that Points still allow keyword lon/lat args."""
    self.assertEquals(ee.Geometry.Point(1, 2), ee.Geometry.Point(lon=1, lat=2))
    self.assertEquals(ee.Geometry.Point(1, 2), ee.Geometry.Point(1, lat=2))

  def testOldRectangleKeywordArgs(self):
    """Verifies that Rectangles still allow keyword xlo/ylo/xhi/yhi args."""
    self.assertEquals(ee.Geometry.Rectangle(1, 2, 3, 4),
                      ee.Geometry.Rectangle(xlo=1, ylo=2, xhi=3, yhi=4))
    self.assertEquals(ee.Geometry.Rectangle(1, 2, 3, 4),
                      ee.Geometry.Rectangle(1, 2, xhi=3, yhi=4))

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
    with self.assertRaisesRegexp(ee.EEException, msg):
      ctor(*coords)

  def testInternals(self):
    """Test eq(), ne() and hash()."""
    a = ee.Geometry.Point(1, 2)
    b = ee.Geometry.Point(2, 1)
    c = ee.Geometry.Point(1, 2)

    self.assertEquals(a, a)
    self.assertNotEquals(a, b)
    self.assertEquals(a, c)
    self.assertNotEquals(b, c)
    self.assertNotEquals(hash(a), hash(b))


if __name__ == '__main__':
  unittest.main()
