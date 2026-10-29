// Compute the trend of nighttime lights from DMSP.

// Add a band containing image date as years since 1990.
function createTimeBand(img) {
  var year = img.date().difference(ee.Date('1990-01-01'), 'year');
  return ee.Image(year).float().addBands(img);
}

// Fit a linear trend to the nighttime lights collection.
var collection = ee.ImageCollection('NOAA/DMSP-OLS/CALIBRATED_LIGHTS_V4')
    .select('avg_vis')
    .map(createTimeBand);
var fit = collection.reduce(ee.Reducer.linearFit());

// Display a single image
Map.addLayer(ee.Image(collection.select('avg_vis').first()),
         {min: 0, max: 63},
         'stable lights first asset');

// Display trend in red/blue, brightness in green.
Map.setCenter(30, 45, 4);
Map.addLayer(fit,
         {min: 0, max: [0.18, 20, -0.18], bands: ['scale', 'offset', 'scale']},
         'stable lights trend');
