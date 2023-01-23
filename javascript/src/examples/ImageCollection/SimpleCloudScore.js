// SimpleCloudScore, an example of computing a cloud-free composite with L8
// by selecting the least-cloudy pixel from the collection.

// A mapping from a common name to the sensor-specific bands.
var LC8_BANDS = ['B2',   'B3',    'B4',  'B5',  'B6',    'B7',    'B10'];
var STD_NAMES = ['blue', 'green', 'red', 'nir', 'swir1', 'swir2', 'temp'];

// Compute a cloud score.  This expects the input image to have the common
// band names: ["red", "blue", etc], so it can work across sensors.
var cloudScore = function(img) {
  // A helper to apply an expression and linearly rescale the output.
  var rescale = function(img, exp, thresholds) {
    return img.expression(exp, {img: img})
        .subtract(thresholds[0]).divide(thresholds[1] - thresholds[0]);
  };

  // Compute several indicators of cloudyness and take the minimum of them.
  var score = ee.Image(1.0);
  // Clouds are reasonably bright in the blue band.
  score = score.min(rescale(img, 'img.blue', [0.1, 0.3]));

  // Clouds are reasonably bright in all visible bands.
  score = score.min(rescale(img, 'img.red + img.green + img.blue', [0.2, 0.8]));

  // Clouds are reasonably bright in all infrared bands.
  score = score.min(
      rescale(img, 'img.nir + img.swir1 + img.swir2', [0.3, 0.8]));

  // Clouds are reasonably cool in temperature.
  score = score.min(rescale(img, 'img.temp', [300, 290]));

  // However, clouds are not snow.
  var ndsi = img.normalizedDifference(['green', 'swir1']);
  return score.min(rescale(ndsi, 'img', [0.8, 0.6]));
};

// Filter the TOA collection to a time-range and add the cloudscore band.
var collection = ee.ImageCollection('LANDSAT/LC08/C02/T1_TOA')
    .filterDate('2017-05-01', '2017-07-01')
    .map(function(img) {
      // Invert the cloudscore so 1 is least cloudy, and rename the band.
      var score = cloudScore(img.select(LC8_BANDS, STD_NAMES));
      score = ee.Image(1).subtract(score).select([0], ['cloudscore']);
      return img.addBands(score);
    });

// Define visualization parameters for a true color image.
var vizParams = {bands: ['B4', 'B3', 'B2'], max: 0.4, gamma: 1.6};
Map.setCenter(-120.24487, 37.52280, 8);
Map.addLayer(collection.qualityMosaic('cloudscore'), vizParams);
