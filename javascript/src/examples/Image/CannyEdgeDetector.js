// Canny Edge Detector example.

// Load an image and compute NDVI from it.
var image = ee.Image('LANDSAT/LT05/C01/T1_TOA/LT05_031034_20110619');
var ndvi = image.normalizedDifference(['B4','B3']);

// Detect edges in the composite.
var canny = ee.Algorithms.CannyEdgeDetector(ndvi, 0.7);

// Mask the image with itself to get rid of areas with no edges.
canny = canny.updateMask(canny);

Map.setCenter(-101.05259, 37.93418, 13);
Map.addLayer(ndvi, {min: 0, max: 1}, 'Landsat NDVI');
Map.addLayer(canny, {min: 0, max: 1, palette: 'FF0000'}, 'Canny Edges');
