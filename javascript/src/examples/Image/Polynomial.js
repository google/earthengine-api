// Applies a non-linear contrast enhancement to a MODIS image using
// function -1.2x^2 + 2.4x - 0.2.

var img = ee.Image('MOD09GA/MOD09GA_005_2012_03_09')
              .select(['sur_refl_b01', 'sur_refl_b04', 'sur_refl_b03'])
              .multiply(0.0001);
var adj = img.polynomial([-0.2, 2.4, -1.2]);

Map.setCenter(-107.24304, 35.78663, 8);
Map.addLayer(img, {min: 0, max: 1}, 'original');
Map.addLayer(adj, {min: 0, max: 1}, 'adjusted');
