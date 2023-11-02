// This example demonstrates how to use Cloud Score+ QA bands to
// create a clear Sentinel-2 median composite.
//


// Region of interest.
var roi = ee.Geometry.Rectangle([-124.8697, 35.5806, -119.9917, 39.9554]);

// Harmonized Sentinel-2 Level 2A collection.
var s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED');

// Cloud Score+ image collection. Note Cloud Score+ is produced
// from Sentinel-2 Level 1C data and can be applied to either L1C
// or L2A collections.
var csPlus = ee.ImageCollection('GOOGLE/CLOUD_SCORE_PLUS/V1/S2_HARMONIZED');

// Get list of Sentinel-2 bands.
var csPlusBands = csPlus.first().bandNames();

// Link S2 and CS+ results.
var linkedCollection = s2.linkCollection(csPlus, csPlusBands);
// Date range for median composite.
var dateStart = '2023-03-01';
var dateEnd = '2023-09-01';

/**
 * Masks pixels with low CS+ QA scores.
 * @param {ee.Image} image Sentinel-2 image
 * @return {ee.Image} masked Sentinel-2 image
 */
function maskLowQA(image) {
  // CS+ QA band to use for masking. Options are 'cs' and 'cs_cdf'.
  var qaBand = 'cs';

  // Adjustable threshold for converting CS+ QA to a binary mask.
  // Higher thresholds will mask out partial occlusions like thin clouds, haze &
  // cirrus shadows. Lower thresholds will be more permissive of these
  // occlusions.
  var clearThreshold = 0.60;
  var mask = image.select(qaBand).gte(clearThreshold);

  return image.updateMask(mask);
}


// Filter collection, mask pixels with low QA scores, and
// generate median composite.
var composite = linkedCollection.filterBounds(roi)
                    .filterDate(dateStart, dateEnd)
                    .map(maskLowQA)
                    .median();

// Sentinel-2 visualization parameters.
var s2Viz = {bands: ['B4', 'B3', 'B2'], min: 0, max: 3000};

Map.addLayer(composite, s2Viz, 'median composite');
Map.centerObject(roi, 11);