// Canny Edge Detector example.

var image = ee.Image('LT5_L1T_8DAY_EVI/20110618');
var canny = ee.Algorithms.CannyEdgeDetector(image, 0.7);
// Mask the image with itself to get rid of 0 pixels.
canny = canny.updateMask(canny);

Map.setCenter(-101.05259, 37.93418, 13);
Map.addLayer(image, {min: 0, max: 1}, 'Landsat EVI');
Map.addLayer(canny, {min: 0, max: 1, palette: 'FF0000'}, 'Canny Edges');
