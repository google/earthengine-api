// Create and render a feature collection from polygons.

// Construct a FeatureCollection from a list of features.
var fc = ee.FeatureCollection([
  // Create each feature with a geometry and properties.
  ee.Feature(
      ee.Geometry.Polygon({
        coords: [[-109.05, 41], [-109.05, 37], [-102.05, 37], [-102.05, 41]],
        geodesic: false, // The state boundaries are not geodesic.
        maxError: 1000 // Make the error margin large; we don't need accuracy.
      }), {name: 'Colorado', fill: 1}), // Pass properties as a dictionary.
  ee.Feature(
      ee.Geometry.Polygon({
        coords: [
          [-114.05, 37.0], [-109.05, 37.0], [-109.05, 41.0],
          [-111.05, 41.0], [-111.05, 42.0], [-114.05, 42.0]
        ],
        geodesic: false,
        maxError: 1000
      }), {name: 'Utah', fill: 2})
]);

// Fill, then outline the polygons into a blank image.
var image = ee.Image()
    .paint(fc, 'fill') // Get color from property named 'fill'
    .paint(fc, 3, 5) // Outline using color 3, width 5.
    .toByte();

Map.addLayer(image, {
    palette: ['000000', 'FF0000', '00FF00', '0000FF'],
    max: 3,
    opacity: 0.5
});

Map.setCenter(-107, 41, 6);
