// This example demonstrates the use of the Landsat 4, 5 or 7
// surface reflectance QA band to mask clouds.

var cloudMaskL457 = function(image) {
  var qa = image.select('pixel_qa');
  // If the cloud bit (5) is set and the cloud confidence (7) is high
  // or the cloud shadow bit is set (3), then it's a bad pixel.
  var cloud = qa.bitwiseAnd(1 << 5)
          .and(qa.bitwiseAnd(1 << 7))
          .or(qa.bitwiseAnd(1 << 3))
  // Remove edge pixels that don't occur in all bands
  var mask2 = image.mask().reduce(ee.Reducer.min());
  return image.updateMask(cloud.not()).updateMask(mask2);
};

// Map the function over the collection and take the median.
var collection = ee.ImageCollection('LANDSAT/LT05/C01/T1_SR')
    .filterDate('2010-04-01', '2010-07-30')

var composite = collection
    .map(cloudMaskL457)
    .median();

// Display the results in a cloudy place.
Map.setCenter(-6.2622, 53.3473, 12);
Map.addLayer(composite, {bands: ['B3', 'B2', 'B1'], min: 0, max: 3000});
