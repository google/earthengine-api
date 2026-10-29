// Array-based spectral unmixing.

// Create a mosaic of Landsat 5 images from June through September, 2007.
var allBandMosaic = ee.ImageCollection('LANDSAT/LT05/C02/T1')
  .filterDate('2007-06-01', '2007-09-30')
  .select('B[0-7]')
  .median();

// Create some representative endmembers computed previously by sampling
// the Landsat 5 mosaic.
var urbanEndmember = [88, 42, 48, 38, 86, 115, 59];
var vegEndmember = [50, 21, 20, 35, 50, 110, 23];
var waterEndmember = [51, 20, 14, 9, 7, 116, 4];

// Compute the 3x7 pseudo inverse.
var endmembers = ee.Array([urbanEndmember, vegEndmember, waterEndmember]);
var inverse = ee.Image(endmembers.matrixPseudoInverse().transpose());

// Convert the bands to a 2D 7x1 array. The toArray() call concatenates
// pixels from each band along the default axis 0 into a 1D vector per
// pixel, and the toArray(1) call concatenates each band (in this case
// just the one band of 1D vectors) along axis 1, forming a 2D array.
var inputValues = allBandMosaic.toArray().toArray(1);

// Matrix multiply the pseudo inverse of the endmembers by the pixels to
// get a 3x1 set of endmembers fractions from 0 to 1.
var unmixed = inverse.matrixMultiply(inputValues);

// Create and show a colored image of the endmember fractions. Since we know
// the result has size 3x1, project down to 1D vectors at each pixel (since the
// second axis is pointless now), and then flatten back to a regular scalar
// image.
var colored = unmixed
  .arrayProject([0])
  .arrayFlatten([['urban', 'veg', 'water']]);
Map.setCenter(-98.4, 19, 11);

// Load a hillshade to use as a backdrop.
Map.addLayer(ee.Algorithms.Terrain(ee.Image('CGIAR/SRTM90_V4')).select('hillshade'));
Map.addLayer(colored, {min: 0, max: 1},
  'Unmixed (red=urban, green=veg, blue=water)');
