// Displays the decreasing area covered by a single pixel at
// higher lattitudes using the Image.pixelArea() function.

var img = ee.Image.pixelArea();
centerMap(0, 0, 3);
addToMap(img, {min: 2e8, max: 4e8, opacity: 0.85});
