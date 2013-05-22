// Dictionary.get example
//
// Compute the mean and standard deviation of an image,
// and stretch the image using those values without needing
// to transfer them to the client.

var img = ee.Image('srtm90_v4');
var meanReducer = ee.call('Reducer.mean');
var sigmaReducer = ee.call('Reducer.std_dev');
var region = ee.Geometry.Rectangle(9, 9, 10, 10);
var scale = 10000;       // 10km pixels.

// Extract the mean and standard deviation properties.
// These come back from reduceRegion in a dictionary,
// with a key that's the name of the band it came from.
var mean = ee.call('Dictionary.get',
  img.reduceRegion(meanReducer, region, scale),
  'elevation');

var sigma = ee.call('Dictionary.get',
  img.reduceRegion(sigmaReducer, region, scale),
  'elevation');

// Stretch with the stats to normalize the image so that
// 3*sigma fits within [0:1].
var stretch = function(img, mean, sigma) {
  return ee.Image(0).expression(
    '((img - mean) / sigma) / 3 + 0.5', {
      'img': img,
      'mean': ee.Image.constant(mean),
      'sigma': ee.Image.constant(sigma)
    });
};


centerMap(9.5, 9.5, 9);
addToMap(stretch(img, mean, sigma), {min: -3, max: 3});
