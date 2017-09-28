// Display a Landsat 8 image given its ID.

// 2013-06-03 Landsat 8 scene.
var image = ee.Image('LANDSAT/LC08/C01/T1/LC08_044034_20170614');
// Define visualization parameters for a true color image.
var vizParams = {'bands': 'B4,B3,B2',
                 'min': 5000,
                 'max': 30000,
                 'gamma': 1.6};
Map.centerObject(image);
Map.addLayer(image, vizParams);
