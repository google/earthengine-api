// Composite 6 months of Landsat 8.

// Note that the input to simpleComposite is raw data.
var l8 = ee.ImageCollection('LANDSAT/LC08/C01/T1');

// The asFloat parameter gives floating-point TOA output instead of
// the UINT8 outputs of the default simpleComposite().
var composite = ee.Algorithms.Landsat.simpleComposite({
  collection: l8.filterDate('2015-1-1', '2015-7-1'),
  asFloat: true
});

// Pick a spot with lots of clouds.
Map.setCenter(-47.6735, -0.6344, 12);
// Display a composite with a band combination chosen from:
// https://landsat.usgs.gov/how-do-landsat-8-band-combinations-differ-landsat-7-or-landsat-5-satellite-data
Map.addLayer(composite, {bands: ['B6', 'B5', 'B4'], max: [0.3, 0.4, 0.3]});
