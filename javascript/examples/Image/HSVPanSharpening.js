// HSV-based Pan-Sharpening
// #section: Image:5

// Grab a sample L7 image and pull out the RGB and pan bands
// in the range (0, 1).  (The range of the pan band values was
// chosen to roughly match the other bands.)
var image1 = ee.Image('LANDSAT/L7/LE72300681999227EDC00');

rgb = image1.select('30', '20', '10').unitScale(0, 255);
gray = image1.select('80').unitScale(0, 155);

// Convert to HSV, swap in the pan band, and convert back to RGB.
huesat = rgb.rgbtohsv().select('hue', 'saturation');
upres = ee.Image.cat(huesat, gray).hsvtorgb();

// Display before and after layers using the same vis parameters.
visparams = {min: [.15, .15, .25], max: [1, .9, .9], gamma: 1.6};
addToMap(rgb, visparams, 'Orignal');
addToMap(upres, visparams, 'Pansharpened');

// There are many fine places to look; here is one.  Comment
// this out if you want to twiddle knobs while panning around.
centerMap(-61.61625, -11.64273, 14);
