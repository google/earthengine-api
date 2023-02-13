// Composite 6 months of Landsat 8.

// Note that the input to simpleComposite is raw data.
var l8_filtered = ee.ImageCollection('LANDSAT/LC08/C02/T1')
  .filterDate('2015-1-1', '2015-7-1');

// The asFloat parameter gives floating-point TOA output instead of
// the UINT8 outputs of the default simpleComposite().
var composite = ee.Algorithms.Landsat.simpleComposite({
  collection: l8_filtered,
  asFloat: true
});

// Pick a spot with lots of clouds.
Map.setCenter(-47.6735, -0.6344, 12);
// Display a composite with a band combination chosen from:
// https://landsat.usgs.gov/how-do-landsat-8-band-combinations-differ-landsat-7-or-landsat-5-satellite-data
var viz = {bands: ['B6', 'B5', 'B4'], max: [0.3, 0.4, 0.3]};
Map.addLayer(composite, viz, 'ee.Algorithms.Landsat.simpleComposite');

// For reference, below is the code equivalent to
// the server-side implementation of ee.Algorithms.simpleComposite().

function TOAComposite(collection,
                      asFloat,
                      percentile,
                      cloudScoreRange,
                      maxDepth) {

  // Select a sufficient set of images, and compute TOA and cloudScore.
  var prepared =
      ee.Algorithms.Landsat.pathRowLimit(collection, maxDepth, 4 * maxDepth)
                   .map(ee.Algorithms.Landsat.TOA)
                   .map(ee.Algorithms.Landsat.simpleCloudScore);

  // Determine the per-pixel cloud score threshold.
  var cloudThreshold = prepared.reduce(ee.Reducer.min())
                               .select('cloud_min')
                               .add(cloudScoreRange);

  // Mask out pixels above the cloud score threshold, and update the mask of
  // the remaining pixels to be no higher than the cloud score mask.
  function updateMask(image) {
    var cloud = image.select('cloud');
    var cloudMask = cloud.mask().min(cloud.lte(cloudThreshold));
    // Drop the cloud band and QA bands.
    image = image.select('B[0-9].*');
    return image.mask(image.mask().min(cloudMask));
  }
  var masked = prepared.map(updateMask);

  // Take the (mask-weighted) median (or other percentile)
  // of the good pixels.
  var result = masked.reduce(ee.Reducer.percentile([percentile]));

  // Force the mask up to 1 if it's non-zero, to hide L7 SLC artifacts.
  result = result.mask(result.mask().gt(0));

  // Clean up the band names by removing the suffix that reduce() added.
  var badNames = result.bandNames();
  var goodNames = badNames.map(
          function(x) { return ee.String(x).replace('_[^_]*$', ''); });
  result = result.select(badNames, goodNames);

  if (!asFloat) {
    // Scale reflective bands by 255, and offset thermal bands by -100.
    // These lists are only correct for Landsat 8; different lists are
    // used for the other instruments.
    var scale = [ 255, 255, 255, 255, 255, 255, 255, 255, 255, 1, 1 ];
    var offset = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, -100, -100 ];
    result = result.multiply(scale).add(offset).round().uint8();
  }
  return result;
}

// Example of TOAComposite usage.
var composite_in_js = TOAComposite(l8_filtered, true, 50, 10, 40);
Map.addLayer(
    composite_in_js, viz,
    'Same TOA composite implemented in Javascript', false);
