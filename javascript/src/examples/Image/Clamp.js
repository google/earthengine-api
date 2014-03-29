// Image.clamp example.
//
// Clamp the values of all bands in an image to lie within the specified range.
// Values below the low value of that range are set to low value, values above
// the high value of that range are set to the high value.
//
// Usage: image.clamp(low, high)
//

var image = ee.Image('srtm90_v4');
var clamped = image.clamp(1000, 2000);

centerMap(-121.753, 46.855, 9);
addToMap(image, {min: 0, max: 4300}, 'Full stretch');
addToMap(clamped, {min: 0, max: 4300}, 'Clamped');
