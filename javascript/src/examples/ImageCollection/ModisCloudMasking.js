// ModisCloudMasking
//
// Calculate how frequently a location is labeled as clear (i.e. non-cloudy)
// according to the "internal cloud algorithm flag" of the MODIS "state 1km"
// QA band.

/*
 * Returns an image containing just the specified QA bits.
 *
 * Args:
 *   image - The QA Image to get bits from.
 *   start - The first bit position, 0-based.
 *   end   - The last bit position, inclusive.
 *   name  - A name for the output image.
 */
var getQABits = function(image, start, end, newName) {
    // Compute the bits we need to extract.
    var pattern = 0;
    for (var i = start; i <= end; i++) {
       pattern += Math.pow(2, i);
    }
    // Return a single band image of the extracted QA bits, giving the band
    // a new name.
    return image.select([0], [newName])
                  .bitwise_and(pattern)
                  .right_shift(start);
};

// Mask out pixels that did not have observations.
var maskEmptyPixels = function(image) {
  // Find pixels that had observations.
  var withObs = image.select('num_observations_1km').gt(0);
  return image.mask(withObs);
};

// Mask out cloudy pixels.
var maskClouds = function(image) {
  // Select the QA band.
  var QA = image.select('state_1km');
  // Get the internal_cloud_algorithm_flag bit.
  var internalCloud = getQABits(QA, 10, 10, 'internal_cloud_algorithm_flag');
  // Return an image masking out cloudy areas.
  return image.mask(internalCloud.eq(0));
};

// Start with an image collection for a 3 month period.
var collection = ee.ImageCollection('MOD09GA')
                   .filterDate(new Date('4/1/2011'), new Date('7/1/2011'));

// Mask out areas that were not observed.
var collection = collection.map(maskEmptyPixels);

// Get the total number of potential observations for the time interval.
var totalObsCount = collection.count()
                              .select('num_observations_1km');

// Map the cloud masking function over the collection.
var collectionCloudMasked = collection.map(maskClouds);

// Get the total number of observations for non-cloudy pixels for the time
// interval.  The mask is set to unity so that all locations have counts, and
// the ratios later computed have values everywhere.
var clearObsCount = collectionCloudMasked.count()
                                         .select('num_observations_1km')
                                         .mask(1);

addToMap(
    collectionCloudMasked.median(),
    {bands: 'sur_refl_b01, sur_refl_b04, sur_refl_b03', gain: 0.07, gamma: 1.4},
    'median of masked collection',
  );
addToMap(
    totalObsCount,
    {min: 84, max: 92},
    'count of total observations',
    false
  );
addToMap(
    clearObsCount,
    {min: 0, max: 90},
    'count of clear observations',
    false
  );
addToMap(
    clearObsCount.toFloat().divide(totalObsCount),
    {min: 0, max: 1},
    'ratio of clear to total observations',
  );
