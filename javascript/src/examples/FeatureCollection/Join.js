// Simple Join example.
// Show parks in San Francisco within 2 kilometers of a BART station.

// Load fusion tables for BART station locations and local parks.
var bart = ee.FeatureCollection('ft:1xCCZkVn8DIkB7i7RVkvsYWxAxsdsQZ6SbD9PCXw');
var parks = ee.FeatureCollection('ft:10KC6VfBWMUvNcuxU7mbSEg__F_4UVe9uDkCldBw');

// Create a filter to pass the left features within 2km of the right features.
var joinFilter = ee.Filter.withinDistance({
  distance: 2000,
  leftField: '.geo',
  rightField: '.geo'
});

// Apply the join.  The leftFeild corresponds to the primary collection
// and the rightField corresponds to the secondary collection.  The
// matching condition is specified by the filter.
var closeParks = ee.Join.simple().apply({
  primary: parks,
  secondary: bart,
  condition: joinFilter
});

// Buffer the bart stations by 2km for display purposes.
var bufferedBart = bart.map(function(f) { return f.buffer(2000, 100); });
Map.setCenter(-122.45, 37.75, 13);
Map.addLayer(bufferedBart, {color: 'b0b0b0'});
Map.addLayer(closeParks, {color: '008000'});
