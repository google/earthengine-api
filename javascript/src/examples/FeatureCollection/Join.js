// Simple Join example.
//
// Show parks in San Francisco within 2 kilometers of a BART station.

var bart = ee.FeatureCollection('ft:1xCCZkVn8DIkB7i7RVkvsYWxAxsdsQZ6SbD9PCXw');
var parks = ee.FeatureCollection('ft:10KC6VfBWMUvNcuxU7mbSEg__F_4UVe9uDkCldBw');

// Join the two collection on their geometries if they're within 2km.
var joinFilter = ee.Filter.withinDistance(2000, '.geo', null, '.geo');
var closeParks = ee.Join.simple().apply(parks, bart, joinFilter);

// Buffer the bart stations by 2km for display purposes.
var bufferedBart = bart.map(function(f) { return f.buffer(2000); });
Map.addLayer(bufferedBart, {color: 'b0b0b0'});
Map.addLayer(closeParks, {color: '008000'});

Map.setCenter(-122.45, 37.75, 13);
