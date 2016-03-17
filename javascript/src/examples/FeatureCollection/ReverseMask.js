// Reverse mask a region.
//
// Create an image that masks off the interior of the specified polygon.

var fc = ee.FeatureCollection('ft:1Ec8IWsP8asxN-ywSqgXWMuBaxI6pPaeh6hC64lA')
    .filter(ee.Filter().eq('ECO_NAME', 'Great Basin shrub steppe'));

// Fill and outline the polygons in two colors
var region = ee.Image(0).byte()
    .paint(fc, 2)       // Fill with 2
    .paint(fc, 1, 2);   // Outline with 1, width 2.

// Mask off everything that matches the fill color.
var result = region.updateMask(region.neq(2));

Map.addLayer(result, {
  palette: '000000,FF0000',
  max: 1,
  opacity: 0.5
});
Map.setCenter(-100, 40, 4);
