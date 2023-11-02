// This example demonstrates how to use Cloud Score+ QA bands to generate and
// display a collection of monthly clear median composites.
//

// Region of interest.
var roi = ee.Geometry.Rectangle([-120.3388, 37.4074, -119.2732, 38.1012]);

// Cloud Score+ image collection. Note Cloud Score+ is produced
// from Sentinel-2 Level 1C data and can be applied to either L1C
// or L2A collections.
var csPlus = ee.ImageCollection('GOOGLE/CLOUD_SCORE_PLUS/V1/S2_HARMONIZED');

// Harmonized Sentinel-2 Level 2A collection.
var s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED');

// Link S2 and CS+ results.
var linkedCollection =
    s2.linkCollection(csPlus, ['cs', 'cs_cdf']).filterBounds(roi);

// Year to generate composites for.
var year = 2022;
var months = ee.List.sequence(1, 12);

// Masks pixels with low CS+ QA scores.
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

// Generate a collection of monthly median composites.
var composites = ee.ImageCollection(months.map(function(month) {
  return linkedCollection.filter(ee.Filter.calendarRange(month, month, 'month'))
      .map(maskLowQA)
      .map(function(image) {
        return image.toFloat();
      })
      .median()
      .set('month', month);
}));

// Sentinel-2 visualization parameters.
var s2Viz = {bands: ['B4', 'B3', 'B2'], min: 0, max: 3000};

for (var month = 1; month <= 12; month++) {
  var composite = composites.filter(ee.Filter.eq('month', month));
  Map.addLayer(composite, s2Viz, 'composite ' + month);
}

Map.centerObject(roi, 12);