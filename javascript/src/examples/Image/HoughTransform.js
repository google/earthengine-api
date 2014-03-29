// An example finding linear features using the HoughTransform.

var image = ee.Image('LT5_L1T_8DAY_NDVI/19850720');
var canny = ee.Algorithms.CannyEdgeDetector(image, 0.4, 1).multiply(255);
var h = ee.Algorithms.HoughTransform(canny, 256, 50, 100);

centerMap(-103.80140, 40.21729, 13);
addToMap(image, {min: 0, max: 1}, 'source_image');
addToMap(canny.mask(canny.gt(0)), {min: 0, max: 1, palette: '00FF00'},
         'canny');
addToMap(h.mask(h.gt(0)), {min: 0, max: 1, palette: 'FF0000'}, 'hough');

