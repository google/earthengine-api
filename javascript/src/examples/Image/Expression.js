// Compute Enhanced Vegetation Index over the MODIS MOD09GA product using
// an expression.
var img = ee.Image('MOD09GA/MOD09GA_005_2012_03_09').multiply(0.0001);

var evi = img.expression(
    '2.5 * (nir - red) / (nir + 6 * red - 7.5 * blue + 1)',
    {
        red: img.select('sur_refl_b01'),    // 620-670nm, RED
        nir: img.select('sur_refl_b02'),    // 841-876nm, NIR
        blue: img.select('sur_refl_b03')    // 459-479nm, BLUE
    });

Map.setCenter(-94.84497, 39.01918, 8);
Map.addLayer(img.select(['sur_refl_b01', 'sur_refl_b04', 'sur_refl_b03']),
         {min: 0, max: 0.2}, 'MODIS bands 1/4/3');
Map.addLayer(evi, {min: 0, max: 1}, 'EVI');

