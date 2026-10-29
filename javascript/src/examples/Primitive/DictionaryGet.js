// Extract values from a dictionary returned by reduceRegion.
//
// This example computes the mean and standard deviation of an image
// and then stretches the image with those values.

var img = ee.Image('CGIAR/SRTM90_V4');
var meanReducer = ee.Reducer.mean();
var sigmaReducer = ee.Reducer.stdDev();
var region = ee.Geometry.Rectangle(9, 9, 10, 10);
var scale = 10000;       // 10km pixels.

// Extract the mean and standard deviation properties.
// These come back from reduceRegion in a dictionary,
// with a key that's the name of the band it came from.
var mean = img.reduceRegion(meanReducer, region, scale).get('elevation');
var sigma = img.reduceRegion(sigmaReducer, region, scale).get('elevation');

// Stretch with the stats to normalize the image so that
// 3*sigma fits within [0:1].
var stretch = function(img, mean, sigma) {
  return ee.Image(0).expression(
    '((img - mean) / (sigma * 3)) + 0.5', {
      'img': img,
      'mean': ee.Image.constant(mean),
      'sigma': ee.Image.constant(sigma)
    });
};

Map.setCenter(9.5, 9.5, 9);
Map.addLayer(stretch(img, mean, sigma), {min: 0, max: 1});
