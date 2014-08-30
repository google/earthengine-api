// Displays the decreasing area covered by a single pixel at
// higher lattitudes using the Image.pixelArea() function.

var img = ee.Image.pixelArea();
Map.setCenter(0, 0, 3);
Map.addLayer(img, {min: 2e8, max: 4e8, opacity: 0.85});
