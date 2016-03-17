// Image.ConnectedPixelCount example.
//
// Split pixels of band 01 into "bright" (arbitrarily defined as
// reflectance > 0.3) and "dim". Highlight small (<30 pixels)
// standalone islands of "bright" or "dim" type.
var img = ee.Image('MOD09GA/MOD09GA_005_2012_03_09')
              .select('sur_refl_b01')
              .multiply(0.0001);

var bright = img.gt(.3);
// Compute connected pixel counts; stop searching for connected pixels
// once the size of the connected neightborhood reaches 30 pixels, and
// use 8-connected rules.
var conn = bright.connectedPixelCount(30 /* maxSize */,
                                      true /* eightConnected */);
var smallClusters = conn.lt(30);

Map.setCenter(-107.24304, 35.78663, 8);
Map.addLayer(img, {min: 0, max: 1}, 'original');
Map.addLayer(smallClusters.updateMask(smallClusters),
         {min: 0, max: 1, palette: 'FF0000'}, 'cc');
