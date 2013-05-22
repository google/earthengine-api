// Join
// #section FeatureCollection:6
//
// Show parks in San Francisco within 2 kilometers of a BART station.

var bart = ee.FeatureCollection('ft:1xCCZkVn8DIkB7i7RVkvsYWxAxsdsQZ6SbD9PCXw');
var parks = ee.FeatureCollection('ft:10KC6VfBWMUvNcuxU7mbSEg__F_4UVe9uDkCldBw');
var bufferedBart = bart.map_buffer(2000);
var closeParks = parks.filterBounds(bufferedBart);

addToMap(bufferedBart, {color: 'b0b0b0'});
addToMap(closeParks, {color: '008000'});

centerMap(-122.45, 37.75, 13);
