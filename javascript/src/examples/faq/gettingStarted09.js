/**
 * @fileoverview Earth Engine Developer's Guide examples
 *   from 'Reducing' section
 */

// [START temporal_reduce]
// load a Landsat 8 collection, sort by increasing cloudiness
var collection = ee.ImageCollection('LANDSAT/LC8_L1T')
  .filterBounds(ee.Geometry.Point(-122.262, 37.8719))
  .filterDate('2014-01-01', '2014-12-31')
  .sort('CLOUD_COVER');

// median in each pixel, each band of the 5 least cloudy scenes
var median = collection.limit(5).reduce(ee.Reducer.median());
// [END temporal_reduce]

// display
var vizParams = {
  bands: ['B5_median', 'B4_median', 'B3_median'], min: 5000, max: 15000
};
Map.addLayer(median, vizParams, 'median false color');
