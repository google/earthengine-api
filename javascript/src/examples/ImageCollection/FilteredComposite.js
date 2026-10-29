// Filter an image collection by date and region to make a
// median pixel composite.
//
// See also: ClippedComposite, which crops the output image
// instead of filtering the input collection.

// Filter to only include images intersecting Colorado or Utah.
var polygon = ee.Geometry.Polygon({
  coords: [[[-109.05, 37.0], [-102.05, 37.0], [-102.05, 41.0], // Colorado
            [-109.05, 41.0], [-111.05, 41.0], [-111.05, 42.0], // Utah
            [-114.05, 42.0], [-114.05, 37.0], [-109.05, 37.0]]],
  geodesic: false
});

// Create a Landsat 7 composite for Spring of 2000, and filter by
// the bounds of the FeatureCollection.
var collection = ee.ImageCollection('LANDSAT/LE07/C02/T1')
    .filterDate('2000-04-01', '2000-07-01')
    .filterBounds(polygon);

// Compute the median in each band, in each pixel.
var median = collection.median();

// Select the red, green and blue bands.
var result = median.select('B3', 'B2', 'B1');
Map.addLayer(result, {gain: [1.4, 1.4, 1.1]});
Map.setCenter(-110, 40, 5);
