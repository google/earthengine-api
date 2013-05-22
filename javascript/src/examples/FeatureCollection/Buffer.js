// Buffer
// #section FeatureCollection:5
//
// Display the area within 2 kilometers of any San Francisco BART station.

var bartStations = ee.FeatureCollection(
    'ft:1xCCZkVn8DIkB7i7RVkvsYWxAxsdsQZ6SbD9PCXw');
var buffered = bartStations.map_buffer(2000);
var unioned = buffered.union();

addToMap(unioned, {color: '800080'});

centerMap(-122.4, 37.7, 11);
