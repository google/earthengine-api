// Simple Join example.
// Show parks in San Francisco within 2 kilometers of a BART station.

// Load tables for BART station locations and local parks.
var bart = ee.FeatureCollection('GOOGLE/EE/DEMOS/bart-locations');
var parks = ee.FeatureCollection('GOOGLE/EE/DEMOS/sf-parks');

// Create a filter to pass the left features within 2km of the right features.
var joinFilter = ee.Filter.withinDistance({
  distance: 2000,
  leftField: '.geo',
  rightField: '.geo'
});

// Apply the join.  The leftField corresponds to the primary collection
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
