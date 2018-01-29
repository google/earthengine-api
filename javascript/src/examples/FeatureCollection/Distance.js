// Collection.distance example.
// Computes the distance to the nearest feature in a collection.

// Construct a FeatureCollection from a list of geometries.
var fc = ee.FeatureCollection([
  ee.Geometry.Point(-72.94411, 41.32902),
  ee.Geometry.Point(-72.94411, 41.33402),
  ee.Geometry.Point(-72.94411, 41.33902),
  // The geometries do not need to be the same type.
  ee.Geometry.LineString(
      -72.93411, 41.30902, -72.93411, 41.31902, -72.94411, 41.31902)
]);

// Compute distance from the dfeatures, to a max of 1000 meters.
var distance = fc.distance(1000, 100);

Map.setCenter(-72.94, 41.32, 13);
Map.addLayer(distance, {min: 0, max: 1000, palette: ['yellow', 'red']});
Map.addLayer(fc);
