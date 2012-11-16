// Filtered composite
// #section ImageCollection:1
//
// Filter an image collection by date and region to make a
// median pixel composite.
//
// See also: Clipped composite, which crops the output image
// instead of filtering the input collection.

// Filter to only include images within the colorado and utah boundaries.
var polygon = ee.Feature.Polygon([[
  [-109.05, 37.0], [-102.05, 37.0], [-102.05, 41.0],   // colorado
  [-109.05, 41.0], [-111.05, 41.0], [-111.05, 42.0],   // utah
  [-114.05, 42.0], [-114.05, 37.0], [-109.05, 37.0]]]);

// Create a Landsat 7 composite for Spring of 2000, and filter by
// the bounds of the FeatureCollection.
var collection = ee.ImageCollection('L7_L1T')
    .filterDate(new Date('4/1/2000'), new Date('7/1/2000'))
    .filterBounds(polygon);

// Select the median pixel.
var image1 = collection.median();

// Select the red, green and blue bands.
var image = image1.select('30', '20', '10');
addToMap(image, {gain: '1.4, 1.4, 1.1'});
centerMap(-110, 40, 5);
