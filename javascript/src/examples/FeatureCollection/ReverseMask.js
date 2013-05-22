// Reverse mask a region
// #section FeatureCollection:4
//
// Create an image that masks everything except for the specified polygon.

var fc = ee.FeatureCollection('ft:1Ec8IWsP8asxN-ywSqgXWMuBaxI6pPaeh6hC64lA')
    .filter(ee.Filter().eq('ECO_NAME', 'Great Basin shrub steppe'));

// Start with a black image.
var empty = ee.Image(0).toByte();
// Fill and outline the polygons in two colors
var filled = empty.paint(fc, 2);
var both = filled.paint(fc, 1, 5);
// Mask off everything that matches the fill color.
var result = both.mask(filled.neq(2));

addToMap(result, {
  palette: '000000,FF0000',
  max: 1,
  opacity: 0.5
});
centerMap(-100, 40, 4);
