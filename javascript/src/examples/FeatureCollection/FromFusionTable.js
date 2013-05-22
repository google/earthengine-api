// From a fusion table
// #section FeatureCollection:2
//
// Select the 'Sonoran desert' feature from the TNC Ecoregions fusion table.

var fc = ee.FeatureCollection('ft:1Ec8IWsP8asxN-ywSqgXWMuBaxI6pPaeh6hC64lA')
  .filter(ee.Filter.eq('ECO_NAME', 'Sonoran desert'));

// Paint it into a blank image.
var image1 = ee.Image(0).mask(0);
addToMap(image1.paint(fc, 0 /* color */, 5 /* width */));

centerMap(-93, 40, 4);
