// This example demonstrates the use of the
// COPERNICUS/S2_CLOUD_PROBABILITY dataset, the
// ee.Algorithms.Sentinel2.CDI() method for computing a
// cloud displacement index and directionalDistanceTransform()
// for computing cloud shadows.
//
// See a similar script for the Python API here:
// https://developers.google.com/earth-engine/tutorials/community/sentinel-2-s2cloudless


// Sentinel-2 Level 1C data.  Bands B7, B8, B8A and B10 from this
// dataset are needed as input to CDI and the cloud mask function.
var s2 = ee.ImageCollection('COPERNICUS/S2');
// Cloud probability dataset.  The probability band is used in
// the cloud mask function.
var s2c = ee.ImageCollection('COPERNICUS/S2_CLOUD_PROBABILITY');
// Sentinel-2 surface reflectance data for the composite.
var s2Sr = ee.ImageCollection('COPERNICUS/S2_SR');

// The ROI is determined from the map.
var roi = ee.Geometry.Point([-122.4431, 37.7498]);
Map.centerObject(roi, 11);

// Dates over which to create a median composite.
var start = ee.Date('2019-03-01');
var end = ee.Date('2019-09-01');

// S2 L1C for Cloud Displacement Index (CDI) bands.
s2 = s2.filterBounds(roi).filterDate(start, end)
    .select(['B7', 'B8', 'B8A', 'B10']);
// S2Cloudless for the cloud probability band.
s2c = s2c.filterDate(start, end).filterBounds(roi);
// S2 L2A for surface reflectance bands.
s2Sr = s2Sr.filterDate(start, end).filterBounds(roi)
    .select(['B2', 'B3', 'B4', 'B5']);

// Join two collections on their 'system:index' property.
// The propertyName parameter is the name of the property
// that references the joined image.
function indexJoin(collectionA, collectionB, propertyName) {
  var joined = ee.ImageCollection(ee.Join.saveFirst(propertyName).apply({
    primary: collectionA,
    secondary: collectionB,
    condition: ee.Filter.equals({
      leftField: 'system:index',
      rightField: 'system:index'})
  }));
  // Merge the bands of the joined image.
  return joined.map(function(image) {
    return image.addBands(ee.Image(image.get(propertyName)));
  });
}

// Aggressively mask clouds and shadows.
function maskImage(image) {
  // Compute the cloud displacement index from the L1C bands.
  var cdi = ee.Algorithms.Sentinel2.CDI(image);
  var s2c = image.select('probability');
  var cirrus = image.select('B10').multiply(0.0001);

  // Assume low-to-mid atmospheric clouds to be pixels where probability
  // is greater than 65%, and CDI is less than -0.5. For higher atmosphere
  // cirrus clouds, assume the cirrus band is greater than 0.01.
  // The final cloud mask is one or both of these conditions.
  var isCloud = s2c.gt(65).and(cdi.lt(-0.5)).or(cirrus.gt(0.01));

  // Reproject is required to perform spatial operations at 20m scale.
  // 20m scale is for speed, and assumes clouds don't require 10m precision.
  isCloud = isCloud.focal_min(3).focal_max(16);
  isCloud = isCloud.reproject({crs: cdi.projection(), scale: 20});

  // Project shadows from clouds we found in the last step. This assumes we're working in
  // a UTM projection.
  var shadowAzimuth = ee.Number(90)
      .subtract(ee.Number(image.get('MEAN_SOLAR_AZIMUTH_ANGLE')));

  // With the following reproject, the shadows are projected 5km.
  isCloud = isCloud.directionalDistanceTransform(shadowAzimuth, 50);
  isCloud = isCloud.reproject({crs: cdi.projection(), scale: 100});

  isCloud = isCloud.select('distance').mask();
  return image.select('B2', 'B3', 'B4').updateMask(isCloud.not());
}

// Join the cloud probability dataset to surface reflectance.
var withCloudProbability = indexJoin(s2Sr, s2c, 'cloud_probability');
// Join the L1C data to get the bands needed for CDI.
var withS2L1C = indexJoin(withCloudProbability, s2, 'l1c');

// Map the cloud masking function over the joined collection.
var masked = ee.ImageCollection(withS2L1C.map(maskImage));

// Take the median, specifying a tileScale to avoid memory errors.
var median = masked.reduce(ee.Reducer.median(), 8);

// Display the results.
var viz = {bands: ['B4_median', 'B3_median', 'B2_median'], min: 0, max: 3000};
Map.addLayer(median, viz, 'median');
