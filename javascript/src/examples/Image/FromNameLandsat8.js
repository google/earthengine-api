// Display a Landsat 8 image given its ID.

// 2013-06-03 Landsat 8 scene.
var image = ee.Image('LC8_L1T/LC80440342013154LGN00');
// Define visualization parameters for a true color image.
var vizParams = {'bands': 'B4,B3,B2',
                 'min': 5000,
                 'max': 30000,
                 'gamma': 1.6};
Map.setCenter(-122.24487, 37.52280, 8);
Map.addLayer(image, vizParams);
