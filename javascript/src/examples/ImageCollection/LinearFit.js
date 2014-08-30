// Compute the trend of nighttime lights from DMSP.

// Add a band containing image date as years since 1991.
function createTimeBand(img) {
  var year = ee.Date(img.get('system:time_start')).get('year').subtract(1991);
  return ee.Image(year).byte().addBands(img);
}

// Fit a linear trend to the nighttime lights collection.
var collection = ee.ImageCollection('NOAA/DMSP-OLS/NIGHTTIME_LIGHTS')
    .select('stable_lights')
    .map(createTimeBand);
var fit = collection.reduce(ee.Reducer.linearFit());

// Display a single image
Map.setCenter(30, 45, 4);
Map.addLayer(ee.Image(collection.select('stable_lights').first()),
         {min: 0, max: 63},
         'stable lights first asset');

// Display trend in red/blue, brightness in green.
Map.addLayer(fit,
         {min: 0, max: [0.18, 20, -0.18], bands: ['scale', 'offset', 'scale']},
         'stable lights trend');
