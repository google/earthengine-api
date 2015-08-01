// Composite 6 months of Landsat 8.

// Pick a spot with lots of clouds.
Map.setCenter(-47.6735, -0.6344, 12);

var L8 = ee.ImageCollection('LANDSAT/LC8_L1T');

// "asFloat: true" gives proper (floating-point) TOA output instead of
// the mangled-to-UINT8 outputs of the original simpleComposite().
var composite = ee.Algorithms.Landsat.simpleComposite({
  collection: L8.filterDate('2015-1-1', '2015-7-1'),
  asFloat: true});

Map.addLayer(composite, {bands: 'B7,B6,B1', max: [0.3, 0.4, 0.3]});
