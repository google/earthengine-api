// An example finding linear features using the HoughTransform.

var image = ee.Image('LT5_L1T_8DAY_NDVI/19850720');
var canny = ee.Algorithms.CannyEdgeDetector(image, 0.4, 1).multiply(255);
var h = ee.Algorithms.HoughTransform(canny, 256, 50, 100);

Map.setCenter(-103.80140, 40.21729, 13);
Map.addLayer(image, {min: 0, max: 1}, 'source_image');
Map.addLayer(canny.updateMask(canny.gt(0)), {min: 0, max: 1, palette: '00FF00'},
         'canny');
Map.addLayer(h.updateMask(h.gt(0)), {min: 0, max: 1, palette: 'FF0000'}, 'hough');

