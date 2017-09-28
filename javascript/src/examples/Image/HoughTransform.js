// An example finding linear features using the HoughTransform.

var image = ee.Image('LANDSAT/LC08/C01/T1_TOA/LC08_033032_20170719');
var ndvi = image.normalizedDifference(['B5', 'B4']);
var canny = ee.Algorithms.CannyEdgeDetector(ndvi, 0.4, 1).multiply(255);
var h = ee.Algorithms.HoughTransform(canny, 256, 50, 100);

var vizParams = {'bands': ['B4', 'B3', 'B2'], 'max': 0.4, 'gamma': 1.6};

Map.setCenter(-103.80140, 40.21729, 13);
Map.addLayer(image, vizParams, 'source_image');
Map.addLayer(canny.updateMask(canny.gt(0)), {min: 0, max: 1, palette: '00FF00'},
         'canny');
Map.addLayer(h.updateMask(h.gt(0)), {min: 0, max: 1, palette: 'FF0000'}, 'hough');

