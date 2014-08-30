// Collection.distance example.
//
// Computes the distance to the nearest feature in a collection.

var fc = ee.FeatureCollection([
  ee.Geometry.Point(-72.94411, 41.32902),
  ee.Geometry.Point(-72.94411, 41.33402),
  ee.Geometry.Point(-72.94411, 41.33902),
  ee.Geometry.LineString(
      -72.93411, 41.30902, -72.93411, 41.31902, -72.94411, 41.31902)
]);

Map.setCenter(-72.94, 41.32, 13);
Map.addLayer(fc.distance(1000),
             {min: 0, max: 1000, palette: ['FFFF00', 'FF0000']});
Map.addLayer(fc);
