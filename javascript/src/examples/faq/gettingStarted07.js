/**
 * @fileoverview Earth Engine Developer's Guide examples
 *   from 'Mapping (what to do instead of a for-loop)' section
 */

// [START property_compute]
// function to compute a new property from existing properties
var addField = function(feature) {
  var p3 = ee.Number(feature.get('property1')).add(feature.get('property2'));
  return feature.set({'property3': p3});
};

// create a FeatureCollection from a list of Features
var features = ee.FeatureCollection([
  ee.Feature(ee.Geometry.Point(-122.4536, 37.7403),
    {property1: 100, property2: 100}),
    ee.Feature(ee.Geometry.Point(-118.2294, 34.039),
    {property1: 200, property2: 300}),
]);

// map the function over the collection
var featureCollection = features.map(addField);
// [END property_compute]

// print the FeatureCollection
print(featureCollection);
