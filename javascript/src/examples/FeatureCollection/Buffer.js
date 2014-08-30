// Feature buffer example.
//
// Display the area within 2 kilometers of any San Francisco BART station.

var bartStations = ee.FeatureCollection(
    'ft:1xCCZkVn8DIkB7i7RVkvsYWxAxsdsQZ6SbD9PCXw');
var buffered = bartStations.map(function(f) { return f.buffer(2000); });
var unioned = buffered.union();

Map.addLayer(unioned, {color: '800080'});

Map.setCenter(-122.4, 37.7, 11);
