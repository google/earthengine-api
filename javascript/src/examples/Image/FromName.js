// Display an image given its ID.

var image = ee.Image('srtm90_v4');
Map.setCenter(-110, 40, 5);
Map.addLayer(image, {min: 0, max: 3000});
