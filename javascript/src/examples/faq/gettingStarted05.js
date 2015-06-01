/**
 * @fileoverview Earth Engine Developer's Guide examples
 *   from 'Band Math' and 'Masking' sections
 */

// [START band_math]
// function to get NDVI from Landsat 5 imagery
var getNDVI = function(image) {
  return image.normalizedDifference(['B4', 'B3']);
};

// two Landsat 5 images, 20 years apart
var image1 = ee.Image('LT5_L1T_TOA/LT50440341990155XXX03');
var image2 = ee.Image('LT5_L1T_TOA/LT50440342010162EDC00');

// compute NDVI from the scenes
var ndvi1 = getNDVI(image1);
var ndvi2 = getNDVI(image2);

// compute the difference in NDVI
var ndviDifference = ndvi2.subtract(ndvi1);
// [END band_math]

// [START masking]

// land mask from the SRTM DEM
var landMask = ee.Image('CGIAR/SRTM90_V4').mask();
// combine the land mask with the original image mask
var mask = ndviDifference.mask().and(landMask);
// apply the mask to the NDVI difference
var maskedDifference = ndviDifference.mask(mask);

// display the masked result
var vizParams = {min: -0.5, max: 0.5, palette: ['FF0000', 'FFFFFF', '0000FF']};
Map.setCenter(-122.2531, 37.6295, 9);
Map.addLayer(maskedDifference, vizParams, 'NDVI difference');
// [END masking]
