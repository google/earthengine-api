// From name
// #section Image:1
//
// Display an image given its ID.

var image = ee.Image('srtm90_v4');
addToMap(image, {min: 0, max: 3000});
