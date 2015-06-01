/**
 * @fileoverview Earth Engine Developer's Guide examples
 *   from 'Masking' section
 */

// [START cloud_masking]
// function to get NDVI from a Landsat 8 image
var addNDVI = function(image) {
  return image.addBands(image.normalizedDifference(['B5', 'B4']));
};

// function to mask cloudy pixels
var cloudMask = function(image) {
  var clouds = ee.Algorithms.Landsat.simpleCloudScore(image).select(['cloud']);
  return image.mask(clouds.lt(10));
};

// load a Landsat collection, map the NDVI and cloud masking functions over it
var collection = ee.ImageCollection('LANDSAT/LC8_L1T_TOA')
  .filterBounds(ee.Geometry.Point(-122.262, 37.8719))
  .filterDate('2014-03-01', '2014-05-31')
  .map(addNDVI)
  .map(cloudMask);

// reduce the collection to the mean in each pixel, display
var meanImage = collection.reduce(ee.Reducer.mean());
var vizParams = {bands: ['B5_mean', 'B4_mean', 'B3_mean'], min: 0, max: 0.5};
Map.addLayer(meanImage, vizParams, 'mean');

// load a region in which to compute the mean, display
var counties = ee.FeatureCollection ('ft:1S4EB6319wWW2sWQDPhDvmSBIVrD3iEmCLYB7nMM');
var santacruz = ee.Feature(counties.filterMetadata('FIPS', 'equals', 6087).first());
Map.addLayer(santacruz);

// get the mean of NDVI in the region
var mean = meanImage.select(['nd_mean']).reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: santacruz.geometry(),
  scale: 30
});
// [END cloud_masking]

print('Santa Cruz spring mean NDVI:', mean);
