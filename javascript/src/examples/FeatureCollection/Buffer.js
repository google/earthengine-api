// Feature buffer example.
// Display the area within 2 kilometers of any San Francisco BART station.

// Load a Fusion Table of BART locations (points).
var bartStations = ee.FeatureCollection('ft:1xCCZkVn8DIkB7i7RVkvsYWxAxsdsQZ6SbD9PCXw');

// Map a function over the collection to buffer each feature.
var buffered = bartStations.map(function(f) {
  return f.buffer(2000, 100); // Note that the errorMargin is set to 100.
});

Map.addLayer(buffered, {color: '800080'});

Map.setCenter(-122.4, 37.7, 11);
