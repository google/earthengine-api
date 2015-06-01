/**
 * @fileoverview Earth Engine Developer's Guide examples
 *   from 'Earth Engine Algorithms' section.
 */

// placeholded imports
var dem = ee.Image('USGS/SRTMGL1_003');
var collection1 = ee.ImageCollection('NOAA/DMSP-OLS/NIGHTTIME_LIGHTS');

// dummy variables
var image1 = ee.Image(1);
var image2 = ee.Image(2);

// [START image_add_method]
var image3 = image1.add(image2);
// [END image_add_method]

// [START ee_algo]
var terrainImage = ee.Algorithms.Terrain(dem);
// [END ee_algo]

// [START user_function]
var myFunction = function(args) {
  // do something
  return something;
};
// [END user_function]

// dummy function
var aFunction = function(image) {
  return image;
};

// [START collection_map]
var collection2 = collection1.map(aFunction);
// [END collection_map]
