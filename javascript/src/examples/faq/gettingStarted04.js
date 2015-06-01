/**
 * @fileoverview Earth Engine Developer's Guide examples
 *   from 'Finding ImageCollections and FeatureCollections' and
 *   'Filtering and Sorting' sections
 */

// [START collection_load]
var collection = ee.ImageCollection('LANDSAT/LC8_L1T');
// [END collection_load]
print(collection.first());

// [START make_point]
var point = ee.Geometry.Point(-122.262, 37.8719);
// [END make_point]

// [START date_range]
var start = ee.Date('2014-06-01');
var finish = ee.Date('2014-10-01');
// [END date_range]

// [START filter_ic]
var filteredCollection = ee.ImageCollection('LANDSAT/LC8_L1T')
  .filterBounds(point)
  .filterDate(start, finish)
  .sort('CLOUD_COVER', true);
// [END filter_ic]
print(filteredCollection);

// [START get_first]
var first = filteredCollection.first();
// [END get_first]
print(first);

// [START filter_fc]
var featureCollection = ee.FeatureCollection('ft:1fRY18cjsHzDgGiJiS2nnpUU3v9JPDc2HNaR7Xk8');
var filteredFC = featureCollection.filter(ee.Filter.eq('Name', 'California'));
Map.addLayer(filteredFC, {}, 'California');
// [END filter_fc]
