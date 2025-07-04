#!/usr/bin/env python3
"""Test for the ee.geometry module Point methods."""

import json
from typing import Any
from unittest import mock

import unittest
import ee
from ee import apitestcase

X = 1
Y = 2
POINT = {
    'functionInvocationValue': {
        'functionName': 'GeometryConstructors.Point',
        'arguments': {'coordinates': {'constantValue': [X, Y]}},
    }
}

X2 = X + 2
Y2 = Y + 2
POINT2 = {
    'functionInvocationValue': {
        'functionName': 'GeometryConstructors.Point',
        'arguments': {'coordinates': {'constantValue': [X2, Y2]}},
    }
}

MAX_ERROR_VAL = 1.8
MAX_ERROR = {
    'functionInvocationValue': {
        'functionName': 'ErrorMargin',
        'arguments': {'value': {'constantValue': MAX_ERROR_VAL}},
    }
}

EPSG = 'EPSG:4326'
PROJ = {
    'functionInvocationValue': {
        'functionName': 'Projection',
        'arguments': {'crs': {'constantValue': EPSG}},
    }
}


def make_expression_graph_geom(
    function_name: str, args: dict[str, Any]
) -> dict[str, Any]:
  return {
      'result': '0',
      'values': {
          '0': {
              'functionInvocationValue': {
                  'functionName': 'Geometry.' + function_name,
                  'arguments': args,
              }
          }
      },
  }


class GeometryPointTest(apitestcase.ApiTestCase):

  def setUp(self):
    super().setUp()
    self.point = ee.Geometry.Point(X, Y)
    self.point2 = ee.Geometry.Point(X2, Y2)

  def test_area(self):
    expect = make_expression_graph_geom(
        'area', {'geometry': POINT, 'maxError': MAX_ERROR, 'proj': PROJ}
    )
    actual = json.loads(self.point.area(MAX_ERROR_VAL, EPSG).serialize())
    self.assertEqual(actual, expect)

    actual = json.loads(
        self.point.area(maxError=MAX_ERROR_VAL, proj=EPSG).serialize()
    )
    self.assertEqual(actual, expect)

  def test_aside(self):
    mock_function = mock.Mock(return_value=None)
    self.assertIs(self.point, self.point.aside(mock_function))
    mock_function.assert_called_once_with(self.point)

  def test_bounds(self):
    expect = make_expression_graph_geom(
        'bounds', {'geometry': POINT, 'maxError': MAX_ERROR, 'proj': PROJ}
    )
    actual = json.loads(self.point.bounds(MAX_ERROR_VAL, EPSG).serialize())
    self.assertEqual(actual, expect)

    actual = json.loads(
        self.point.bounds(maxError=MAX_ERROR_VAL, proj=EPSG).serialize()
    )
    self.assertEqual(actual, expect)

  def test_buffer(self):
    distance = 2
    expect = make_expression_graph_geom(
        'buffer',
        {
            'distance': {'constantValue': distance},
            'geometry': POINT,
            'maxError': MAX_ERROR,
            'proj': PROJ,
        },
    )
    actual = json.loads(
        self.point.buffer(distance, MAX_ERROR_VAL, EPSG).serialize()
    )
    self.assertEqual(actual, expect)

    actual = json.loads(
        self.point.buffer(
            distance=distance, maxError=MAX_ERROR_VAL, proj=EPSG
        ).serialize()
    )
    self.assertEqual(actual, expect)

  def test_centroid(self):
    expect = make_expression_graph_geom(
        'centroid', {'geometry': POINT, 'maxError': MAX_ERROR, 'proj': PROJ}
    )
    actual = json.loads(self.point.centroid(MAX_ERROR_VAL, EPSG).serialize())
    self.assertEqual(actual, expect)

    actual = json.loads(
        self.point.centroid(maxError=MAX_ERROR_VAL, proj=EPSG).serialize()
    )
    self.assertEqual(actual, expect)

  def test_closest_point(self):
    expect = make_expression_graph_geom(
        'closestPoint',
        {'left': POINT, 'right': POINT2, 'maxError': MAX_ERROR, 'proj': PROJ},
    )
    actual = json.loads(
        self.point.closestPoint(self.point2, MAX_ERROR_VAL, EPSG).serialize()
    )
    self.assertEqual(actual, expect)

    actual = json.loads(
        self.point.closestPoint(
            right=self.point2, maxError=MAX_ERROR_VAL, proj=EPSG
        ).serialize()
    )
    self.assertEqual(actual, expect)

  def test_closest_points(self):
    expect = make_expression_graph_geom(
        'closestPoints',
        {'left': POINT, 'right': POINT2, 'maxError': MAX_ERROR, 'proj': PROJ},
    )
    actual = json.loads(
        self.point.closestPoints(self.point2, MAX_ERROR_VAL, EPSG).serialize()
    )
    self.assertEqual(actual, expect)

    actual = json.loads(
        self.point.closestPoints(
            right=self.point2, maxError=MAX_ERROR_VAL, proj=EPSG
        ).serialize()
    )
    self.assertEqual(actual, expect)

  def test_contained_in(self):
    expect = make_expression_graph_geom(
        'containedIn',
        {'left': POINT, 'right': POINT2, 'maxError': MAX_ERROR, 'proj': PROJ},
    )
    actual = json.loads(
        self.point.containedIn(self.point2, MAX_ERROR_VAL, EPSG).serialize()
    )
    self.assertEqual(actual, expect)

    actual = json.loads(
        self.point.containedIn(
            right=self.point2, maxError=MAX_ERROR_VAL, proj=EPSG
        ).serialize()
    )
    self.assertEqual(actual, expect)

  def test_contains(self):
    expect = make_expression_graph_geom(
        'contains',
        {'left': POINT, 'right': POINT2, 'maxError': MAX_ERROR, 'proj': PROJ},
    )
    actual = json.loads(
        self.point.contains(self.point2, MAX_ERROR_VAL, EPSG).serialize()
    )
    self.assertEqual(actual, expect)

    actual = json.loads(
        self.point.contains(
            right=self.point2, maxError=MAX_ERROR_VAL, proj=EPSG
        ).serialize()
    )
    self.assertEqual(actual, expect)

  def test_convex_hull(self):
    expect = make_expression_graph_geom(
        'convexHull', {'geometry': POINT, 'maxError': MAX_ERROR, 'proj': PROJ}
    )
    actual = json.loads(self.point.convexHull(MAX_ERROR_VAL, EPSG).serialize())
    self.assertEqual(actual, expect)

    actual = json.loads(
        self.point.convexHull(maxError=MAX_ERROR_VAL, proj=EPSG).serialize()
    )
    self.assertEqual(actual, expect)

  def test_coordinates(self):
    expect = make_expression_graph_geom('coordinates', {'geometry': POINT})
    actual = json.loads(self.point.coordinates().serialize())
    self.assertEqual(actual, expect)

  def test_covering_grid(self):
    scale = 8.7
    expect = make_expression_graph_geom(
        'coveringGrid',
        {'geometry': POINT, 'proj': PROJ, 'scale': {'constantValue': scale}},
    )
    actual = json.loads(self.point.coveringGrid(EPSG, scale).serialize())
    self.assertEqual(actual, expect)

    actual = json.loads(
        self.point.coveringGrid(proj=EPSG, scale=scale).serialize()
    )
    self.assertEqual(actual, expect)

  def test_cut_lines(self):
    distances = [2.2, 3.3]
    expect = make_expression_graph_geom(
        'cutLines',
        {
            'geometry': POINT,
            'distances': {'constantValue': distances},
            'maxError': MAX_ERROR,
            'proj': PROJ,
        },
    )
    actual = json.loads(
        self.point.cutLines(distances, MAX_ERROR_VAL, EPSG).serialize()
    )
    self.assertEqual(actual, expect)

    actual = json.loads(
        self.point.cutLines(
            distances=distances, maxError=MAX_ERROR_VAL, proj=EPSG
        ).serialize()
    )
    self.assertEqual(actual, expect)

  def test_difference(self):
    expect = make_expression_graph_geom(
        'difference',
        {'left': POINT, 'right': POINT2, 'maxError': MAX_ERROR, 'proj': PROJ},
    )
    actual = json.loads(
        self.point.difference(self.point2, MAX_ERROR_VAL, EPSG).serialize()
    )
    self.assertEqual(actual, expect)

    actual = json.loads(
        self.point.difference(
            right=self.point2, maxError=MAX_ERROR_VAL, proj=EPSG
        ).serialize()
    )
    self.assertEqual(actual, expect)

  def test_disjoint(self):
    expect = make_expression_graph_geom(
        'disjoint',
        {'left': POINT, 'right': POINT2, 'maxError': MAX_ERROR, 'proj': PROJ},
    )
    actual = json.loads(
        self.point.disjoint(self.point2, MAX_ERROR_VAL, EPSG).serialize()
    )
    self.assertEqual(actual, expect)

    actual = json.loads(
        self.point.disjoint(
            right=self.point2, maxError=MAX_ERROR_VAL, proj=EPSG
        ).serialize()
    )
    self.assertEqual(actual, expect)

  def test_dissolve(self):
    expect = make_expression_graph_geom(
        'dissolve', {'geometry': POINT, 'maxError': MAX_ERROR, 'proj': PROJ}
    )
    actual = json.loads(self.point.dissolve(MAX_ERROR_VAL, EPSG).serialize())
    self.assertEqual(actual, expect)

    actual = json.loads(
        self.point.dissolve(maxError=MAX_ERROR_VAL, proj=EPSG).serialize()
    )
    self.assertEqual(actual, expect)

  def test_distance(self):
    spherical = True
    expect = make_expression_graph_geom(
        'distance',
        {
            'left': POINT,
            'right': POINT2,
            'maxError': MAX_ERROR,
            'proj': PROJ,
            'spherical': {'constantValue': spherical},
        },
    )
    actual = json.loads(
        self.point.distance(
            self.point2, MAX_ERROR_VAL, EPSG, spherical
        ).serialize()
    )
    self.assertEqual(actual, expect)

    actual = json.loads(
        self.point.distance(
            right=self.point2,
            maxError=MAX_ERROR_VAL,
            proj=EPSG,
            spherical=spherical,
        ).serialize()
    )
    self.assertEqual(actual, expect)

  def test_edges_are_geodesics(self):
    expect = make_expression_graph_geom(
        'edgesAreGeodesics', {'geometry': POINT}
    )
    actual = json.loads(self.point.edgesAreGeodesics().serialize())
    self.assertEqual(actual, expect)

  def test_geodesic(self):
    expect = make_expression_graph_geom('geodesic', {'geometry': POINT})
    actual = json.loads(self.point.geodesic().serialize())
    self.assertEqual(actual, expect)

  def test_geometries(self):
    expect = make_expression_graph_geom('geometries', {'geometry': POINT})
    actual = json.loads(self.point.geometries().serialize())
    self.assertEqual(actual, expect)

  def test_intersection(self):
    expect = make_expression_graph_geom(
        'intersection',
        {'left': POINT, 'right': POINT2, 'maxError': MAX_ERROR, 'proj': PROJ},
    )
    actual = json.loads(
        self.point.intersection(self.point2, MAX_ERROR_VAL, EPSG).serialize()
    )
    self.assertEqual(actual, expect)

    actual = json.loads(
        self.point.intersection(
            right=self.point2, maxError=MAX_ERROR_VAL, proj=EPSG
        ).serialize()
    )
    self.assertEqual(actual, expect)

  def test_intersects(self):
    expect = make_expression_graph_geom(
        'intersects',
        {'left': POINT, 'right': POINT2, 'maxError': MAX_ERROR, 'proj': PROJ},
    )
    actual = json.loads(
        self.point.intersects(self.point2, MAX_ERROR_VAL, EPSG).serialize()
    )
    self.assertEqual(actual, expect)

    actual = json.loads(
        self.point.intersects(
            right=self.point2, maxError=MAX_ERROR_VAL, proj=EPSG
        ).serialize()
    )
    self.assertEqual(actual, expect)

  def test_is_unbounded(self):
    expect = make_expression_graph_geom('isUnbounded', {'geometry': POINT})
    actual = json.loads(self.point.isUnbounded().serialize())
    self.assertEqual(actual, expect)

  def test_length(self):
    expect = make_expression_graph_geom(
        'length',
        {'geometry': POINT, 'maxError': MAX_ERROR, 'proj': PROJ},
    )
    actual = json.loads(self.point.length(MAX_ERROR_VAL, EPSG).serialize())
    self.assertEqual(actual, expect)

    actual = json.loads(
        self.point.length(maxError=MAX_ERROR_VAL, proj=EPSG).serialize()
    )
    self.assertEqual(actual, expect)

  def test_perimeter(self):
    expect = make_expression_graph_geom(
        'perimeter', {'geometry': POINT, 'maxError': MAX_ERROR, 'proj': PROJ}
    )
    actual = json.loads(self.point.perimeter(MAX_ERROR_VAL, EPSG).serialize())
    self.assertEqual(actual, expect)

    actual = json.loads(
        self.point.perimeter(maxError=MAX_ERROR_VAL, proj=EPSG).serialize()
    )
    self.assertEqual(actual, expect)

  def test_projection(self):
    expect = make_expression_graph_geom('projection', {'geometry': POINT})
    actual = json.loads(self.point.projection().serialize())
    self.assertEqual(actual, expect)

  def test_simplify(self):
    expect = make_expression_graph_geom(
        'simplify', {'geometry': POINT, 'maxError': MAX_ERROR, 'proj': PROJ}
    )
    actual = json.loads(self.point.simplify(MAX_ERROR_VAL, EPSG).serialize())
    self.assertEqual(actual, expect)

    actual = json.loads(
        self.point.simplify(maxError=MAX_ERROR_VAL, proj=EPSG).serialize()
    )
    self.assertEqual(actual, expect)

  def test_symmetric_difference(self):
    expect = make_expression_graph_geom(
        'symmetricDifference',
        {'left': POINT, 'right': POINT2, 'maxError': MAX_ERROR, 'proj': PROJ},
    )
    actual = json.loads(
        self.point.symmetricDifference(
            self.point2, MAX_ERROR_VAL, EPSG
        ).serialize()
    )
    self.assertEqual(actual, expect)

    actual = json.loads(
        self.point.symmetricDifference(
            right=self.point2, maxError=MAX_ERROR_VAL, proj=EPSG
        ).serialize()
    )
    self.assertEqual(actual, expect)

  def test_transform(self):
    expect = make_expression_graph_geom(
        'transform', {'geometry': POINT, 'proj': PROJ, 'maxError': MAX_ERROR}
    )
    actual = json.loads(self.point.transform(EPSG, MAX_ERROR_VAL).serialize())
    self.assertEqual(actual, expect)

    actual = json.loads(
        self.point.transform(maxError=MAX_ERROR_VAL, proj=EPSG).serialize()
    )
    self.assertEqual(actual, expect)

  def test_type(self):
    expect = make_expression_graph_geom('type', {'geometry': POINT})
    actual = json.loads(self.point.type().serialize())
    self.assertEqual(actual, expect)

  def test_union(self):
    expect = make_expression_graph_geom(
        'union',
        {'left': POINT, 'right': POINT2, 'maxError': MAX_ERROR, 'proj': PROJ},
    )
    actual = json.loads(
        self.point.union(self.point2, MAX_ERROR_VAL, EPSG).serialize()
    )
    self.assertEqual(actual, expect)

    actual = json.loads(
        self.point.union(
            right=self.point2, maxError=MAX_ERROR_VAL, proj=EPSG
        ).serialize()
    )
    self.assertEqual(actual, expect)

  def test_within_distance(self):
    distance = 2.2
    expect = make_expression_graph_geom(
        'withinDistance',
        {
            'left': POINT,
            'right': POINT2,
            'distance': {'constantValue': distance},
            'maxError': MAX_ERROR,
            'proj': PROJ,
        },
    )
    actual = json.loads(
        self.point.withinDistance(
            self.point2, distance, MAX_ERROR_VAL, EPSG
        ).serialize()
    )
    self.assertEqual(actual, expect)

    actual = json.loads(
        self.point.withinDistance(
            right=self.point2,
            distance=distance,
            maxError=MAX_ERROR_VAL,
            proj=EPSG,
        ).serialize()
    )
    self.assertEqual(actual, expect)


if __name__ == '__main__':
  unittest.main()
