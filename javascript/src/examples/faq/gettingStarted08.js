/**
 * @fileoverview Earth Engine Developer's Guide examples
 *   from 'Mapping (what to do instead of a for-loop)' section
 */

// [START convert_collection]
// function to get the image centroid
var getGeom = function(image) {
  return ee.Feature(image.geometry().centroid(), {foo: 1});
};

// Landsat 8 collection
var collection = ee.ImageCollection('LANDSAT/LC8_L1T')
  .filterBounds(ee.Geometry.Point(-122.262, 37.8719))
  .filterDate('2014-06-01', '2014-10-01');

// map the function over the ImageCollection
var featureCollection = ee.FeatureCollection(collection.map(getGeom));
// [END convert_collection]

print(featureCollection);
