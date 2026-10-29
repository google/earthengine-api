// Create a FeatureCollection from an Earth Engine Table.

// Load census roads.
var roads = ee.FeatureCollection('TIGER/2016/Roads');

// Get only interstates.
var interstates = roads.filter(ee.Filter.eq('rttyp', 'I'));

// Get only surface roads.
var surfaceRoads = roads.filter(ee.Filter.eq('rttyp', 'M'));

// Display the roads in different colors.
Map.addLayer(surfaceRoads, {color: 'gray'}, 'surface roads');
Map.addLayer(interstates, {color: 'red'}, 'interstates');

