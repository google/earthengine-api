// Filter an image collection by date and region to make a
// median pixel composite.
//
// See also: ClippedComposite, which crops the output image
// instead of filtering the input collection.

// Filter to only include images within the colorado and utah boundaries.
var polygon = ee.Geometry.Polygon([[
  [-109.05, 37.0], [-102.05, 37.0], [-102.05, 41.0],   // colorado
  [-109.05, 41.0], [-111.05, 41.0], [-111.05, 42.0],   // utah
  [-114.05, 42.0], [-114.05, 37.0], [-109.05, 37.0]]]);

// Create a Landsat 7 composite for Spring of 2000, and filter by
// the bounds of the FeatureCollection.
var collection = ee.ImageCollection('LE7_L1T')
    .filterDate('2000-04-01', '2000-07-01')
    .filterBounds(polygon);

// Select the median pixel.
var median = collection.median();

// Select the red, green and blue bands.
var result = median.select('B3', 'B2', 'B1');
addToMap(result, {gain: '1.4, 1.4, 1.1'});
centerMap(-110, 40, 5);
