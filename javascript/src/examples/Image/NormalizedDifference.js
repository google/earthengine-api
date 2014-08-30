// NormalizedDifference example.
//
// Compute Normalized Difference Vegetation Index over MOD09GA product.
// NDVI = (NIR - RED) / (NIR + RED), where
// RED is sur_refl_b01, 620-670nm
// NIR is sur_refl_b02, 841-876nm

var img = ee.Image('MOD09GA/MOD09GA_005_2012_03_09');
var ndvi = img.normalizedDifference(['sur_refl_b02', 'sur_refl_b01']);
var palette = ['FFFFFF', 'CE7E45', 'DF923D', 'F1B555', 'FCD163', '99B718',
               '74A901', '66A000', '529400', '3E8601', '207401', '056201',
               '004C00', '023B01', '012E01', '011D01', '011301'];

Map.setCenter(-94.84497, 39.01918, 8);
Map.addLayer(img.select(['sur_refl_b01', 'sur_refl_b04', 'sur_refl_b03']),
         {gain: '0.1, 0.1, 0.1'}, 'MODIS bands 1/4/3');
Map.addLayer(ndvi, {min: 0, max: 1, palette: palette}, 'NDVI');

