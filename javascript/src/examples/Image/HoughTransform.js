// An example finding linear features using the HoughTransform.

// Load an image and compute NDVI.
var image = ee.Image('LANDSAT/LC08/C02/T1_TOA/LC08_033032_20170719');
var ndvi = image.normalizedDifference(['B5', 'B4']);

// Apply a Canny edge detector.
var canny = ee.Algorithms.CannyEdgeDetector({
  image: ndvi,
  threshold: 0.4
}).multiply(255);

// Apply the Hough transform.
var h = ee.Algorithms.HoughTransform({
  image: canny,
  gridSize: 256,
  inputThreshold: 50,
  lineThreshold: 100
});

// Display.
Map.setCenter(-103.80140, 40.21729, 13);
Map.addLayer(image, {bands: ['B4', 'B3', 'B2'], max: 0.3}, 'source_image');
Map.addLayer(canny.updateMask(canny), {min: 0, max: 1, palette: 'blue'}, 'canny');
Map.addLayer(h.updateMask(h), {min: 0, max: 1, palette: 'red'}, 'hough');
