// Compute Enhanced Vegetation Index (EVI) over the MODIS MOD09GA product
// using an expression.

// Load a MODIS image and apply the scaling factor.
var img = ee.Image('MODIS/006/MOD09GA/2012_03_09').multiply(0.0001);

// Compute EVI using an expression.  The second argument is a map from
// variable name to band name in the input image.
var evi = img.expression(
    '2.5 * (nir - red) / (nir + 6 * red - 7.5 * blue + 1)',
    {
        red: img.select('sur_refl_b01'),    // 620-670nm, RED
        nir: img.select('sur_refl_b02'),    // 841-876nm, NIR
        blue: img.select('sur_refl_b03')    // 459-479nm, BLUE
    });

// Center the map.
Map.setCenter(-94.84497, 39.01918, 8);

// Display the input image and the EVI computed from it.
Map.addLayer(img.select(['sur_refl_b01', 'sur_refl_b04', 'sur_refl_b03']),
         {min: 0, max: 0.2}, 'MODIS bands 1/4/3');
Map.addLayer(evi, {min: 0, max: 1}, 'EVI');
