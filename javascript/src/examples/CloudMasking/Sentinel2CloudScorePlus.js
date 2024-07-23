// This example demonstrates how to use Cloud Score+ QA bands to generate a
// clear median composite for a specified date range.

// Harmonized Sentinel-2 Level 2A collection.
var s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED');

// Cloud Score+ image collection. Note Cloud Score+ is produced from Sentinel-2
// Level 1C data and can be applied to either L1C or L2A collections.
var csPlus = ee.ImageCollection('GOOGLE/CLOUD_SCORE_PLUS/V1/S2_HARMONIZED');

// Region of interest.
var ROI = ee.Geometry.Point(-119.9087, 37.4159);

// Use 'cs' or 'cs_cdf', depending on your use-case; see docs for guidance.
var QA_BAND = 'cs_cdf';

// The threshold for masking; values between 0.50 and 0.65 generally work well.
// Higher values will remove thin clouds, haze & cirrus shadows.
var CLEAR_THRESHOLD = 0.60;

// Make composite.
var composite = s2
    .filterBounds(ROI)
    .filterDate('2023-01-01', '2023-02-01')
    .linkCollection(csPlus, [QA_BAND])
    .map(function(img) {
      return img.updateMask(img.select(QA_BAND).gte(CLEAR_THRESHOLD));
    })
    .median();

// Sentinel-2 visualization parameters.
var s2Viz = {bands: ['B4', 'B3', 'B2'], min: 0, max: 2500};

Map.addLayer(composite, s2Viz, 'median composite');
Map.centerObject(ROI, 11);