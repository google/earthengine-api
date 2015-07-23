// HSV-based Pan-Sharpening.

// Grab a sample L7 image and pull out the RGB and pan bands
// in the range (0, 1).  (The range of the pan band values was
// chosen to roughly match the other bands.)
var image1 = ee.Image('LANDSAT/LE7/LE72300681999227EDC00');

var rgb = image1.select('B3', 'B2', 'B1').unitScale(0, 255);
var gray = image1.select('B8').unitScale(0, 155);

// Convert to HSV, swap in the pan band, and convert back to RGB.
var huesat = rgb.rgbToHsv().select('hue', 'saturation');
var upres = ee.Image.cat(huesat, gray).hsvToRgb();

// Display before and after layers using the same vis parameters.
var visparams = {min: [0.15, 0.15, 0.25],
                 max: [1, 0.9, 0.9],
                 gamma: 1.6};
Map.addLayer(rgb, visparams, 'Original');
Map.addLayer(upres, visparams, 'Pansharpened');

// There are many fine places to look; here is one.  Comment
// this out if you want to twiddle knobs while panning around.
Map.setCenter(-61.61625, -11.64273, 14);
