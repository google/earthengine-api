// CannyEdgeDetector

var image = ee.Image('L5_L1T_8DAY_EVI/20110618');
var canny = ee.call('CannyEdgeDetector', image, 0.7);

centerMap(-101.05259, 37.93418, 13);
addToMap(image, {min: 0, max: 1}, 'Landsat EVI');
addToMap(canny.mask(canny), {min: 0, max: 1, palette: 'FF0000'},
         'Canny Edges');

