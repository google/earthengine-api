#!/usr/bin/env python3
"""Test for the ee.geometry module.

The API objects, like ee.Geometry, are usually tested by comparing the
serialized object to a golden. To be brief, the tests in this file just validate
the Geometry function's arguments instead of the serialized object.
"""

import math

from absl.testing import parameterized

import unittest
import ee
from ee import apitestcase


_EPSILON = 1e-5


class GeometryTest(apitestcase.ApiTestCase, parameterized.TestCase):

  def epsg4326_rectangle(self, west, south, east, north):
    # If we call ee.Geometry.Rectangle with geodesic=False we would get a
    # computed call.
    return ee.Geometry({
        'coordinates': [
            [[west, north], [west, south], [east, south], [east, north]]
        ],
        'type': 'Polygon',
        'geodesic': False,
    })

  @parameterized.named_parameters(
      ('_simple', (-10, -20, 10, 20), (-10, -20, 10, 20)),
      (
          '_latitude_widerThanPolesClamped_south',
          (-10, -90, 10, 73),
          (-10, -1000, 10, 73),
      ),
      (
          '_latitude_widerThanPolesClamped_north',
          (-10, -34, 10, 90),
          (-10, -34, 10, 10000),
      ),
      ('_latitude_zeroSpan', (-10, 20, 10, 20), (-10, 20, 10, 20)),
      (
          '_longitude_crossingMeridianWithOppositeSigns',
          (170, -20, 190, 20),
          (170, -20, -170, 20),
      ),
      (
          '_longitude_crossingMeridianWithNegativeSigns',
          (170, -20, 190, 20),
          (-190, -20, -170, 20),
      ),
      (
          '_longitude_crossingMeridianWithPositiveSigns',
          (170, -20, 190, 20),
          (170, -20, 190, 20),
      ),
      ('_longitude_exactlyGlobal', (-180, -20, 180, 20), (-180, -20, 180, 20)),
      (
          '_longitude_excessOfGlobalIsClamped',
          (-180, -20, 180, 20),
          (-180 - _EPSILON, -20, 180 + _EPSILON, 20),
      ),
      ('_longitude_zeroSpan', (10, -20, 10, 20), (10, -20, 10, 20)),
      (
          '_infinity_validDirection_isClamped_west',
          (-180, -20, 180, 20),
          (-math.inf, -20, 10, 20),
      ),
      (
          '_infinity_validDirection_isClamped_east',
          (-180, -20, 180, 20),
          (-10, -20, math.inf, 20),
      ),
      (
          '_infinity_validDirection_isClamped_south',
          (-10, -90, 10, 20),
          (-10, -math.inf, 10, 20),
      ),
      (
          '_infinity_validDirection_isClamped_north',
          (-10, -20, 10, 90),
          (-10, -20, 10, math.inf),
      ),
  )
  def testBBox(self, expected, coords):
    self.assertEqual(
        self.epsg4326_rectangle(*expected),
        ee.Geometry.BBox(*coords),
    )

  def testBBox_computedArgs(self):
    ten = ee.Number(5).add(5)
    box = ee.Geometry.BBox(-10, -20, ten, 20)
    func = ee.ApiFunction.lookup('GeometryConstructors.BBox')

    self.assertIsInstance(box, ee.Geometry)
    self.assertEqual(func, box.func)
    expected_args = {
        'west': ee.Number(-10),
        'south': ee.Number(-20),
        'east': ten,
        'north': ee.Number(20),
    }
    self.assertEqual(expected_args, box.args)

  @parameterized.named_parameters(
      # Reject cases which, if we clamped them instead, would move a box whose
      # bounds lie past a pole to being a point at the pole.
      (
          '_latitude_notBeyondPoles_north',
          (-10, -100, 10, -95),
          r'Geometry\.BBox: north must be at least -90°, but was -95°',
      ),
      (
          '_latitude_notBeyondPoles_south',
          (-10, 95, 10, 100),
          r'Geometry\.BBox: south must be at most \+90°, but was 95°',
      ),
      # NaN is rejected.
      (
          '_NaN_isRejected_west',
          (math.nan, -20, 10, 20),
          r'Geometry\.BBox: west must not be nan',
      ),
      (
          '_NaN_isRejected_south',
          (-10, math.nan, 10, 20),
          r'Geometry\.BBox: south must be at most \+90°, but was nan°',
      ),
      (
          '_NaN_isRejected_east',
          (-10, -20, math.nan, 20),
          r'Geometry\.BBox: east must not be nan',
      ),
      (
          '_NaN_isRejected_north',
          (-10, -20, 10, math.nan),
          r'Geometry.BBox: north must be at least -90°, but was nan°',
      ),
      # Infinities in the wrong direction are rejected.
      (
          '_infinity_invalidDirection_isRejected_west',
          (math.inf, -20, 10, 20),
          r'Geometry\.BBox: west must not be inf',
      ),
      (
          '_infinity_invalidDirection_isRejected_south',
          (-10, math.inf, 10, 20),
          r'Geometry\.BBox: south must be at most \+90°, but was inf°',
      ),
      (
          '_infinity_invalidDirection_isRejected_east',
          (-10, -20, -math.inf, 20),
          r'Geometry\.BBox: east must not be -inf',
      ),
      (
          '_infinity_invalidDirection_isRejected_north',
          (-10, -20, 10, -math.inf),
          r'Geometry\.BBox: north must be at least -90°, but was -inf°',
      ),
  )
  def testBBoxInvalid(self, coords, message):
    with self.assertRaisesRegex(ee.EEException, message):
      ee.Geometry.BBox(*coords)

  def testLineString(self):
    coords = [1, 2, 3, 4]
    proj = 'EPSG:4326'
    max_error = 1000
    func = ee.ApiFunction.lookup('GeometryConstructors.LineString')

    geometry = ee.Geometry.LineString(coords, proj, True, max_error)
    self.assertEqual(func, geometry.func)
    self.assertEqual(
        {
            'coordinates': ee.List(coords),
            'crs': ee.Projection(proj),
            'geodesic': True,
            'maxError': ee.ErrorMargin(max_error),
        },
        geometry.args,
    )

  def testLineString_kwargs(self):
    coords = [1, 2, 3, 4]
    func = ee.ApiFunction.lookup('GeometryConstructors.LineString')

    geometry = ee.Geometry.LineString(coords, geodesic=True)
    self.assertEqual(func, geometry.func)
    self.assertEqual(
        {'coordinates': ee.List(coords), 'geodesic': True},
        geometry.args,
    )

  def testLineString_computedArgs(self):
    """Verifies that a LineString with computed inputs can be constructed."""
    p1 = ee.Geometry.Point([1, 2])
    p2 = ee.Geometry.Point([3, 4])
    line = ee.Geometry.LineString([p1, p2])

    self.assertIsInstance(line, ee.Geometry)
    self.assertEqual(
        ee.ApiFunction.lookup('GeometryConstructors.LineString'), line.func
    )
    self.assertEqual({'coordinates': ee.List([p1, p2])}, line.args)

  @parameterized.named_parameters(
      ('_coords', (1, 2, 3, 4, 5), 'Invalid number of coordinates: 5'),
      ('_coordsList', [[1, 2, 3, 4, 5]], 'Invalid number of coordinates: 5'),
      ('_geometry', [[[1, 2], [3, 4], 5]], 'Invalid geometry'),
      ('_nesting', [[[[1, 2], [3, 4]]]], 'Invalid geometry'),
  )
  def testLineStringInvalid(self, coords, message):
    with self.assertRaisesRegex(ee.EEException, message):
      ee.Geometry.LineString(*coords)

  def testLinearRing(self):
    coords = [1, 2, 3, 4]
    proj = 'EPSG:4326'
    geodesic = True
    max_error = 1000
    func = ee.ApiFunction.lookup('GeometryConstructors.LinearRing')

    geometry = ee.Geometry.LinearRing(coords, proj, geodesic, max_error)
    self.assertEqual(func, geometry.func)
    self.assertEqual(
        {
            'coordinates': ee.List(coords),
            'crs': ee.Projection(proj),
            'geodesic': geodesic,
            'maxError': ee.ErrorMargin(max_error),
        },
        geometry.args,
    )

  def testLinearRing_kwargs(self):
    coords = [1, 2, 3, 4]
    func = ee.ApiFunction.lookup('GeometryConstructors.LinearRing')
    geodesic = True

    geometry = ee.Geometry.LinearRing(coords, geodesic=geodesic)
    self.assertEqual(func, geometry.func)
    self.assertEqual(
        {'coordinates': ee.List(coords), 'geodesic': geodesic},
        geometry.args,
    )

  def testLinearRing_computedArgs(self):
    """Verifies that a LinearRing with computed inputs can be constructed."""
    p1 = ee.Geometry.Point([1, 2])
    p2 = ee.Geometry.Point([3, 4])
    ring = ee.Geometry.LinearRing([p1, p2])

    self.assertIsInstance(ring, ee.Geometry)
    self.assertEqual(
        ee.ApiFunction.lookup('GeometryConstructors.LinearRing'), ring.func
    )
    self.assertEqual({'coordinates': ee.List([p1, p2])}, ring.args)

  @parameterized.named_parameters(
      ('_coords', (1, 2, 3, 4, 5), 'Invalid number of coordinates: 5'),
      ('_coordsList', [[1, 2, 3, 4, 5]], 'Invalid number of coordinates: 5'),
      ('_geometry', [[[1, 2], [3, 4], 5]], 'Invalid geometry'),
      ('_nesting', [[[[1, 2], [3, 4]]]], 'Invalid geometry'),
  )
  def testLinearRingInvalid(self, coords, message):
    with self.assertRaisesRegex(ee.EEException, message):
      ee.Geometry.LinearRing(*coords)

  def testMultiLineString(self):
    coords = [1, 2, 3, 4]
    proj = 'EPSG:4326'
    geodesic = True
    max_error = 1000
    func = ee.ApiFunction.lookup('GeometryConstructors.MultiLineString')

    geometry = ee.Geometry.MultiLineString(coords, proj, geodesic, max_error)
    self.assertEqual(func, geometry.func)
    self.assertEqual(
        {
            'coordinates': ee.List(coords),
            'crs': ee.Projection(proj),
            'geodesic': geodesic,
            'maxError': ee.ErrorMargin(max_error),
        },
        geometry.args,
    )

  def testMultiLineString_kwargs(self):
    coords = [1, 2, 3, 4]
    func = ee.ApiFunction.lookup('GeometryConstructors.MultiLineString')
    geodesic = True

    geometry = ee.Geometry.MultiLineString(coords, geodesic=geodesic)
    self.assertEqual(func, geometry.func)
    self.assertEqual(
        {'coordinates': ee.List(coords), 'geodesic': geodesic},
        geometry.args,
    )

  def testMultiLineString_computedArgs(self):
    """Verifies that a MultiLineString with computed inputs can be constructed."""
    p1 = ee.Geometry.Point([1, 2])
    p2 = ee.Geometry.Point([3, 4])
    line = ee.Geometry.MultiLineString([p1, p2])

    self.assertIsInstance(line, ee.Geometry)
    self.assertEqual(
        ee.ApiFunction.lookup('GeometryConstructors.MultiLineString'), line.func
    )
    self.assertEqual({'coordinates': ee.List([p1, p2])}, line.args)

  @parameterized.named_parameters(
      ('_coords', (1, 2, 3, 4, 5), 'Invalid number of coordinates: 5'),
      ('_coordsList', [[1, 2, 3, 4, 5]], 'Invalid number of coordinates: 5'),
      ('_geometry', [[[1, 2], [3, 4], 5]], 'Invalid geometry'),
      ('_nesting', [[[[[1, 2], [3, 4]]]]], 'Invalid geometry'),
  )
  def testMultiLineStringInvalid(self, coords, message):
    """Verifies MultiLineString constructor behavior with invalid arguments."""
    with self.assertRaisesRegex(ee.EEException, message):
      ee.Geometry.MultiLineString(*coords)

  def testMultiPoint(self):
    coords = [1, 2, 3, 4]
    proj = 'EPSG:4326'
    func = ee.ApiFunction.lookup('GeometryConstructors.MultiPoint')

    geometry = ee.Geometry.MultiPoint(coords, proj)
    self.assertEqual(func, geometry.func)
    self.assertEqual(
        {
            'coordinates': ee.List(coords),
            'crs': ee.Projection(proj),
        },
        geometry.args,
    )

  def testMultiPoint_kwargs(self):
    coords = [1, 2, 3, 4]
    func = ee.ApiFunction.lookup('GeometryConstructors.MultiPoint')
    proj = 'EPSG:4326'

    geometry = ee.Geometry.MultiPoint(coords, proj=proj)
    self.assertEqual(func, geometry.func)
    self.assertEqual(
        {'coordinates': ee.List(coords), 'crs': ee.Projection(proj)},
        geometry.args,
    )

  def testMultiPoint_computedArgs(self):
    """Verifies that a MultiPoint with computed inputs can be constructed."""
    p1 = ee.Geometry.Point([1, 2])
    p2 = ee.Geometry.Point([3, 4])
    point = ee.Geometry.MultiPoint([p1, p2])

    self.assertIsInstance(point, ee.Geometry)
    self.assertEqual(
        ee.ApiFunction.lookup('GeometryConstructors.MultiPoint'), point.func
    )
    self.assertEqual({'coordinates': ee.List([p1, p2])}, point.args)

  @parameterized.named_parameters(
      ('_coords', (1, 2, 3, 4, 5), 'Invalid number of coordinates: 5'),
      ('_coordsList', [[1, 2, 3, 4, 5]], 'Invalid number of coordinates: 5'),
      ('_geometry', [[[1, 2], [3, 4], 5]], 'Invalid geometry'),
      ('_nesting', [[[[1, 2], [3, 4]]]], 'Invalid geometry'),
  )
  def testMultiPointInvalid(self, coords, message):
    """Verifies MultiPoint constructor behavior with invalid arguments."""
    with self.assertRaisesRegex(ee.EEException, message):
      ee.Geometry.MultiPoint(*coords)

  def testMultiPolygon(self):
    coords = [1, 2, 3, 4]
    proj = 'EPSG:4326'
    geodesic = True
    max_error = 1000
    even_odd = True
    func = ee.ApiFunction.lookup('GeometryConstructors.MultiPolygon')

    geometry = ee.Geometry.MultiPolygon(
        coords, proj, geodesic, max_error, even_odd
    )
    self.assertEqual(func, geometry.func)
    self.assertEqual(
        {
            'coordinates': ee.List(coords),
            'crs': ee.Projection(proj),
            'geodesic': geodesic,
            'maxError': ee.ErrorMargin(max_error),
            'evenOdd': even_odd,
        },
        geometry.args,
    )

  def testMultiPolygon_kwargs(self):
    coords = [1, 2, 3, 4]
    func = ee.ApiFunction.lookup('GeometryConstructors.MultiPolygon')
    geodesic = True

    geometry = ee.Geometry.MultiPolygon(coords, geodesic=geodesic)
    self.assertEqual(func, geometry.func)
    self.assertEqual(
        {'coordinates': ee.List(coords), 'geodesic': geodesic},
        geometry.args,
    )

  def testMultiPolygon_computedArgs(self):
    """Verifies that a MultiPolygon with computed inputs can be constructed."""
    p1 = ee.Geometry.Point([1, 2])
    p2 = ee.Geometry.Point([3, 4])
    line = ee.Geometry.MultiPolygon([p1, p2])

    self.assertIsInstance(line, ee.Geometry)
    self.assertEqual(
        ee.ApiFunction.lookup('GeometryConstructors.MultiPolygon'), line.func
    )
    self.assertEqual({'coordinates': ee.List([p1, p2])}, line.args)

  @parameterized.named_parameters(
      ('_coords', (1, 2, 3, 4, 5), 'Invalid number of coordinates: 5'),
      ('_coordsList', [[1, 2, 3, 4, 5]], 'Invalid number of coordinates: 5'),
      ('_geometry', [[[[[[1, 2], [3, 4], [5, 6]]]]]], 'Invalid geometry'),
      ('_nesting', [[[[[1, 2], [3, 4]], [1, 2]]]], 'Invalid geometry'),
  )
  def testMultiPolygonInvalid(self, coords, message):
    """Verifies MultiPolygon constructor behavior with invalid arguments."""
    with self.assertRaisesRegex(ee.EEException, message):
      ee.Geometry.MultiPolygon(*coords)

  def testPoint(self):
    coords = [1, 2, 3, 4]
    proj = 'EPSG:4326'
    func = ee.ApiFunction.lookup('GeometryConstructors.Point')

    geometry = ee.Geometry.Point(coords, proj)
    self.assertEqual(func, geometry.func)
    self.assertEqual(
        {
            'coordinates': ee.List(coords),
            'crs': ee.Projection(proj),
        },
        geometry.args,
    )

  def testPoint_kwargs(self):
    coords = [1, 2, 3, 4]
    func = ee.ApiFunction.lookup('GeometryConstructors.Point')
    proj = 'EPSG:4326'

    geometry = ee.Geometry.Point(coords, proj=proj)
    self.assertEqual(func, geometry.func)
    self.assertEqual(
        {'coordinates': ee.List(coords), 'crs': ee.Projection(proj)},
        geometry.args,
    )

  def testPoint_oldKeywordArgs(self):
    """Verifies that Points still allow keyword lon/lat args."""
    self.assertEqual(ee.Geometry.Point(1, 2), ee.Geometry.Point(lon=1, lat=2))
    self.assertEqual(ee.Geometry.Point(1, 2), ee.Geometry.Point(1, lat=2))

  def testPoint_computedArgs(self):
    """Verifies that a Point with computed inputs can be constructed."""
    v1 = ee.Number(1)
    v2 = ee.Number(2)
    point = ee.Geometry.Point([v1, v2])

    self.assertIsInstance(point, ee.Geometry)
    self.assertEqual(
        ee.ApiFunction.lookup('GeometryConstructors.Point'), point.func
    )
    self.assertEqual({'coordinates': ee.List([v1, v2])}, point.args)

  @parameterized.named_parameters(
      ('_geometry', [['-78.204948', '40.966539']], 'Invalid geometry'),
  )
  def testPointInvalid(self, coords, message):
    """Verifies Point constructor behavior with invalid arguments."""
    with self.assertRaisesRegex(ee.EEException, message):
      ee.Geometry.Point(*coords)

  def testPolygon(self):
    coords = [1, 2, 3, 4]
    proj = 'EPSG:4326'
    geodesic = True
    max_error = 1000
    even_odd = True
    func = ee.ApiFunction.lookup('GeometryConstructors.Polygon')

    geometry = ee.Geometry.Polygon(coords, proj, geodesic, max_error, even_odd)
    self.assertEqual(func, geometry.func)
    self.assertEqual(
        {
            'coordinates': ee.List(coords),
            'crs': ee.Projection(proj),
            'geodesic': geodesic,
            'maxError': ee.ErrorMargin(max_error),
            'evenOdd': even_odd,
        },
        geometry.args,
    )

  def testPolygon_kwargs(self):
    coords = [1, 2, 3, 4]
    func = ee.ApiFunction.lookup('GeometryConstructors.Polygon')
    geodesic = True

    geometry = ee.Geometry.Polygon(coords, geodesic=geodesic)
    self.assertEqual(func, geometry.func)
    self.assertEqual(
        {'coordinates': ee.List(coords), 'geodesic': geodesic},
        geometry.args,
    )

  def testPolygon_computedArgs(self):
    """Verifies that a Polygon with computed inputs can be constructed."""
    p1 = ee.Geometry.Point([1, 2])
    p2 = ee.Geometry.Point([3, 4])
    line = ee.Geometry.Polygon([p1, p2])

    self.assertIsInstance(line, ee.Geometry)
    self.assertEqual(
        ee.ApiFunction.lookup('GeometryConstructors.Polygon'), line.func
    )
    self.assertEqual({'coordinates': ee.List([p1, p2])}, line.args)

  def testPolygon_evenOdd(self):
    poly1 = ee.Geometry.Polygon([0, 0, 0, 5, 5, 0])
    self.assertTrue(poly1.toGeoJSON()['evenOdd'])

    # TODO: Use kwargs instead of positional args for evenOdd.
    poly2 = ee.Geometry.Polygon([0, 0, 0, 5, 5, 0], None, None, None, False)
    self.assertFalse(poly2.toGeoJSON()['evenOdd'])

  @parameterized.named_parameters(
      ('_coords', (1, 2, 3, 4, 5), 'Invalid number of coordinates: 5'),
      ('_coordsList', [[1, 2, 3, 4, 5]], 'Invalid number of coordinates: 5'),
      ('_geometry', [[[1, 2], [3, 4], 5]], 'Invalid geometry'),
      ('_tooMuchNesting', [[[[[1, 2], [3, 4], [5, 6]]]]], 'Invalid geometry'),
      ('_badNesting', [[[[1, 2], [3, 4]], [1, 2]]], 'Invalid geometry'),
  )
  def testPolygonInvalid(self, coords, message):
    """Verifies Polygon constructor behavior with invalid arguments."""
    with self.assertRaisesRegex(ee.EEException, message):
      ee.Geometry.Polygon(*coords)

  def testRectangle(self):
    coords = [1, 2, 3, 4]
    proj = 'EPSG:4326'
    geodesic = True
    even_odd = True
    func = ee.ApiFunction.lookup('GeometryConstructors.Rectangle')

    geometry = ee.Geometry.Rectangle(coords, proj, geodesic, even_odd)
    self.assertEqual(func, geometry.func)
    self.assertEqual(
        {
            'coordinates': ee.List(coords),
            'crs': ee.Projection(proj),
            'geodesic': geodesic,
            'evenOdd': even_odd,
        },
        geometry.args,
    )

  def testRectangle_kwargs(self):
    coords = [1, 2, 3, 4]
    func = ee.ApiFunction.lookup('GeometryConstructors.Rectangle')
    geodesic = True

    geometry = ee.Geometry.Rectangle(coords, geodesic=geodesic)
    self.assertEqual(func, geometry.func)
    self.assertEqual(
        {'coordinates': ee.List(coords), 'geodesic': geodesic},
        geometry.args,
    )

  def testRectangle_oldKeywordArgs(self):
    """Verifies that Rectangles still allow keyword xlo/ylo/xhi/yhi args."""
    self.assertEqual(
        ee.Geometry.Rectangle(1, 2, 3, 4),
        ee.Geometry.Rectangle(xlo=1, ylo=2, xhi=3, yhi=4),
    )
    self.assertEqual(
        ee.Geometry.Rectangle(1, 2, 3, 4),
        ee.Geometry.Rectangle(1, 2, xhi=3, yhi=4),
    )

  def testRectangle_computedArgs(self):
    """Verifies that a Rectangle with computed inputs can be constructed."""
    p1 = ee.Geometry.Point([1, 2])
    p2 = ee.Geometry.Point([3, 4])
    line = ee.Geometry.Rectangle([p1, p2])

    self.assertIsInstance(line, ee.Geometry)
    self.assertEqual(
        ee.ApiFunction.lookup('GeometryConstructors.Rectangle'), line.func
    )
    self.assertEqual({'coordinates': ee.List([p1, p2])}, line.args)

  @parameterized.named_parameters(
      ('_coords', (1, 2, 3, 4, 5), 'Invalid number of coordinates: 5'),
      ('_coordsList', [[1, 2, 3, 4, 5]], 'Invalid number of coordinates: 5'),
      ('_geometry', [[[1, 2], [3, 4], 5]], 'Invalid geometry'),
      ('_tooMuchNesting', [[[[1, 2], [3, 4]]]], 'Invalid geometry'),
  )
  def testRectangleInvalid(self, coords, message):
    """Verifies Rectangle constructor behavior with invalid arguments."""
    with self.assertRaisesRegex(ee.EEException, message):
      ee.Geometry.Rectangle(*coords)

  def testValid_GeometryCollection(self):
    """Verifies GeometryCollection constructor behavior with valid arguments."""
    geometry = ee.Geometry({
        'type': 'GeometryCollection',
        'geometries': [
            {
                'type': 'Polygon',
                'coordinates': [[[-1, -1], [0, 1], [1, -1]]],
                'geodesic': True,
                'evenOdd': True,
            },
            {'type': 'Point', 'coordinates': [0, 0]},
            {
                'type': 'GeometryCollection',
                'geometries': [
                    {'type': 'Point', 'coordinates': [1, 2]},
                    {'type': 'Point', 'coordinates': [2, 1]},
                ],
            },
        ],
        'coordinates': [],
    })
    self.assertIsInstance(geometry, ee.Geometry)

  def testArrayConstructors(self):
    """Verifies that constructors that take arrays fix nesting."""
    get_coordinates_count = lambda g: len(g.toGeoJSON()['coordinates'])

    point = ee.Geometry.Point([1, 2])
    self.assertEqual(2, get_coordinates_count(point))

    multipoint = ee.Geometry.MultiPoint([[1, 2], [3, 4], [5, 6]])
    self.assertEqual(3, get_coordinates_count(multipoint))

    line = ee.Geometry.LineString([[1, 2], [3, 4], [5, 6]])
    self.assertEqual(3, get_coordinates_count(line))

    ring = ee.Geometry.LinearRing([[1, 2], [3, 4], [5, 6]])
    self.assertEqual(3, get_coordinates_count(ring))

    multiline = ee.Geometry.MultiLineString(
        [[[1, 2], [3, 4]], [[5, 6], [7, 8]]]
    )
    self.assertEqual(2, get_coordinates_count(multiline))

    polygon = ee.Geometry.Polygon([[[1, 2], [3, 4], [5, 6]]])
    self.assertEqual(1, get_coordinates_count(polygon))

    mpolygon = ee.Geometry.MultiPolygon(
        [[[[1, 2], [3, 4], [5, 6]]], [[[1, 2], [3, 4], [5, 6]]]]
    )
    self.assertEqual(2, get_coordinates_count(mpolygon))

  def testGeodesicFlag(self):
    """Verifies that JSON parsing and generation preserves the geodesic flag."""
    geodesic = ee.Geometry({
        'type': 'LineString',
        'coordinates': [[1, 2], [3, 4]],
        'geodesic': True,
    })
    projected = ee.Geometry({
        'type': 'LineString',
        'coordinates': [[1, 2], [3, 4]],
        'geodesic': False,
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
    self.assertIsNone(from_json.func)
    self.assertEqual(from_json._type, 'LineString')
    self.assertEqual(from_json._coordinates, [[1, 2], [3, 4]])

    # GeoJSON with a CRS specified.
    json_with_crs = line.toGeoJSON()
    json_with_crs['crs'] = {
        'type': 'name',
        'properties': {'name': 'SR-ORG:6974'},
    }
    from_json_with_crs = ee.Geometry(json_with_crs)
    self.assertIsNone(from_json_with_crs.func)
    self.assertEqual(from_json_with_crs._type, 'LineString')
    self.assertEqual(from_json_with_crs._proj, 'SR-ORG:6974')

    # A not-computed geometry.
    self.assertEqual(ee.Geometry(line), line)

    # A not-computed geometry with an override.
    with_override = ee.Geometry(line, 'SR-ORG:6974')
    self.assertEqual(with_override._proj, 'SR-ORG:6974')

    # A computed geometry.
    self.assertEqual(ee.Geometry(line.bounds()), line.bounds())

    # Something to cast to a geometry.
    computed = ee.ComputedObject(ee.Function(), {'a': 1})
    geom = ee.Geometry(computed)
    self.assertEqual(computed.func, geom.func)
    self.assertEqual(computed.args, geom.args)

  def testComputedGeometries(self):
    """Verifies the computed object behavior of the Geometry constructor."""
    line = ee.Geometry.LineString(1, 2, 3, 4)
    bounds = line.bounds()

    self.assertIsInstance(bounds, ee.Geometry)
    self.assertEqual(ee.ApiFunction.lookup('Geometry.bounds'), bounds.func)
    self.assertEqual(line, bounds.args['geometry'])
    self.assertTrue(hasattr(bounds, 'bounds'))

  def testComputedCoordinate(self):
    """Verifies that a computed coordinate produces a computed geometry."""
    coords = [1, ee.Number(1).add(1)]
    p = ee.Geometry.Point(coords)

    self.assertIsInstance(p, ee.Geometry)
    self.assertEqual(
        ee.ApiFunction.lookup('GeometryConstructors.Point'), p.func
    )
    self.assertEqual({'coordinates': ee.List(coords)}, p.args)

  def testComputedList(self):
    """Verifies that a computed coordinate produces a computed geometry."""
    lst = ee.List([1, 2, 3, 4]).slice(0, 2)
    p = ee.Geometry.Point(lst)

    self.assertIsInstance(p, ee.Geometry)
    self.assertEqual(
        ee.ApiFunction.lookup('GeometryConstructors.Point'), p.func
    )
    self.assertEqual({'coordinates': lst}, p.args)

  def testComputedProjection(self):
    """Verifies that a geometry with a projection can be constructed."""
    p = ee.Geometry.Point([1, 2], 'epsg:4326')

    self.assertIsInstance(p, ee.Geometry)
    self.assertEqual(
        ee.ApiFunction.lookup('GeometryConstructors.Point'), p.func
    )
    expected_args = {
        'coordinates': ee.List([1, 2]),
        'crs': ee.ApiFunction.lookup('Projection').call('epsg:4326'),
    }
    self.assertEqual(expected_args, p.args)

  def testInvalidCrs(self):
    geo_json = ee.Geometry.LineString(1, 2, 3, 4).toGeoJSON()
    geo_json['crs'] = {'something': 'invalid-crs'}
    with self.assertRaisesRegex(ee.EEException, 'Invalid CRS declaration'):
      ee.Geometry(geo_json)

  def testInternals(self):
    """Test eq(), ne() and hash()."""
    a = ee.Geometry.Point(1, 2)
    b = ee.Geometry.Point(2, 1)
    c = ee.Geometry.Point(1, 2)

    self.assertEqual(a, a)
    self.assertNotEqual(a, b)
    self.assertEqual(a, c)
    self.assertNotEqual(b, c)
    self.assertNotEqual(hash(a), hash(b))

  def testInit_optParams(self):
    result = ee.Geometry(
        geo_json={'type': 'Polygon', 'coordinates': [[[-2, 1]]]},
        opt_proj='abc',
        opt_geodesic=True,
        opt_evenOdd=True,
    ).serialize()
    self.assertIn('"crs": {"constantValue": "abc"}', result)
    self.assertIn('"geodesic": {"constantValue": true}', result)
    self.assertIn('"evenOdd": {"constantValue": true}', result)

  @parameterized.named_parameters(
      (
          'BBox',
          lambda: ee.Geometry.BBox(1, 2, 3, 4),
          dict(
              coordinates=[[[1, 4], [1, 2], [3, 2], [3, 4]]],
              geodesic=False,
              type='Polygon',
          ),
      ),
      (
          'LineString',
          lambda: ee.Geometry.LineString(1, 2, 3, 4),
          dict(coordinates=[[1, 2], [3, 4]], type='LineString'),
      ),
      (
          'LinearRing',
          lambda: ee.Geometry.LinearRing(1, 2, 3, 4),
          dict(coordinates=[[1, 2], [3, 4]], type='LinearRing'),
      ),
      (
          'MultiLineString',
          lambda: ee.Geometry.MultiLineString(1, 2, 3, 4),
          dict(coordinates=[[[1, 2], [3, 4]]], type='MultiLineString'),
      ),
      (
          'MultiLineString_Empty',
          lambda: ee.Geometry.MultiLineString(),  # pylint: disable=unnecessary-lambda
          dict(coordinates=[], type='MultiLineString'),
      ),
      (
          'MultiPoint',
          lambda: ee.Geometry.MultiPoint(1, 2, 3, 4),
          dict(coordinates=[[1, 2], [3, 4]], type='MultiPoint'),
      ),
      (
          'MultiPoint_Empty',
          lambda: ee.Geometry.MultiPoint(),  # pylint: disable=unnecessary-lambda
          dict(coordinates=[], type='MultiPoint'),
      ),
      (
          'MultiPolygon',
          lambda: ee.Geometry.MultiPolygon(1, 2, 3, 4),
          dict(
              coordinates=[[[[1, 2], [3, 4]]]],
              evenOdd=True,
              type='MultiPolygon',
          ),
      ),
      (
          'MultiPolygon_Empty',
          lambda: ee.Geometry.MultiPolygon(),  # pylint: disable=unnecessary-lambda
          dict(coordinates=[], evenOdd=True, type='MultiPolygon'),
      ),
      (
          'Point',
          lambda: ee.Geometry.Point(coords=[1, 2]),
          dict(coordinates=[1, 2], type='Point'),
      ),
      (
          'Polygon',
          lambda: ee.Geometry.Polygon(1, 2, 3, 4),
          dict(
              coordinates=[[[1, 2], [3, 4]]],
              evenOdd=True,
              type='Polygon',
          ),
      ),
      (
          'Rectangle',
          lambda: ee.Geometry.Rectangle(1, 2, 3, 4),
          dict(
              coordinates=[[[1, 4], [1, 2], [3, 2], [3, 4]]],
              evenOdd=True,
              type='Polygon',
          ),
      ),
  )
  def testToGeoJSON(self, geometry_func, expected_geojson):
    self.assertEqual(expected_geojson, geometry_func().toGeoJSON())

  @parameterized.named_parameters(
      # BBox doesn't have any other arguments.
      ('LineString', lambda: ee.Geometry.LineString([], 'EPSG:4326')),
      ('LinearRing', lambda: ee.Geometry.LinearRing([], 'EPSG:4326')),
      ('MultiLineString', lambda: ee.Geometry.MultiLineString([], 'EPSG:4326')),
      ('MultiPoint', lambda: ee.Geometry.MultiPoint([], 'EPSG:4326')),
      ('MultiPolygon', lambda: ee.Geometry.MultiPolygon([], 'EPSG:4326')),
      ('Point', lambda: ee.Geometry.Point([], 'EPSG:4326')),
      ('Polygon', lambda: ee.Geometry.Polygon([], 'EPSG:4326')),
      ('Rectangle', lambda: ee.Geometry.Rectangle([], 'EPSG:4326')),
  )
  def testToGeoJSON_FailsOnComputed(self, geometry_func):
    message = 'Cannot convert a computed geometry to GeoJSON'
    with self.assertRaisesRegex(ee.EEException, message):
      geometry_func().toGeoJSON()


if __name__ == '__main__':
  unittest.main()
