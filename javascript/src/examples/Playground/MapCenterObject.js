// Center the map on an image.

var image = ee.Image('LC8_L1T/LC80440342013154LGN00');
Map.addLayer(image, {bands: 'B4,B3,B2', max:20000});
Map.centerObject(image);
