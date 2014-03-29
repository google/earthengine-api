// Display an image given its ID.

var image = ee.Image('srtm90_v4');
centerMap(-110, 40, 5);
addToMap(image, {min: 0, max: 3000});
