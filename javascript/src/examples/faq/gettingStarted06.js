/**
 * @fileoverview Earth Engine Developer's Guide examples
 *   from 'Mapping (what to do instead of a for-loop)' section
 */

// [START map_function]
// function to get NDVI from Landsat 8 imagery
var addNDVI = function(image) {
  return image.addBands(image.normalizedDifference(['B5', 'B4']));
};

// load the Landsat 8 raw data, filter by location and date
var collection = ee.ImageCollection('LANDSAT/LC8_L1T')
  .filterBounds(ee.Geometry.Point(-122.262, 37.8719))
  .filterDate('2014-06-01', '2014-10-01');

// map the function over the collection
var ndviCollection = collection.map(addNDVI);
// [END map_function]

// display the result
var vizParams = {bands: ['nd'], min: -0.5, max: 1, palette: ['FF0000', '00FF00']};
var image = ee.Image(ndviCollection.mosaic());
Map.addLayer(image, vizParams, 'NDVI');
