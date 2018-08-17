// Modis Cloud Masking example.
// Calculate how frequently a location is labeled as clear (i.e. non-cloudy)
// according to the "internal cloud algorithm flag" of the MODIS "state 1km"
// QA band.

// A function to mask out pixels that did not have observations.
var maskEmptyPixels = function(image) {
  // Find pixels that had observations.
  var withObs = image.select('num_observations_1km').gt(0)
  return image.updateMask(withObs)
}

// A function to mask out cloudy pixels.
var maskClouds = function(image) {
  // Select the QA band.
  var QA = image.select('state_1km')
  // Make a mask to get bit 10, the internal_cloud_algorithm_flag bit.
  var bitMask = 1 << 10;
  // Return an image masking out cloudy areas.
  return image.updateMask(QA.bitwiseAnd(bitMask).eq(0))
}

// Start with an image collection for a 1 month period.
// and mask out areas that were not observed.
var collection = ee.ImageCollection('MODIS/006/MOD09GA')
        .filterDate('2010-04-01', '2010-05-01')
        .map(maskEmptyPixels)

// Get the total number of potential observations for the time interval.
var totalObsCount = collection
        .select('num_observations_1km')
        .count()

// Map the cloud masking function over the collection.
var collectionCloudMasked = collection.map(maskClouds)

// Get the total number of observations for non-cloudy pixels for the time
// interval.  The result is unmasked to set to unity so that all locations
// have counts, and the ratios later computed have values everywhere.
var clearObsCount = collectionCloudMasked
        .select('num_observations_1km')
        .count()
        .unmask(0)

Map.addLayer(
    collectionCloudMasked.median(),
    {bands: ['sur_refl_b01', 'sur_refl_b04', 'sur_refl_b03'],
     gain: 0.07,
     gamma: 1.4
    },
    'median of masked collection'
  )
Map.addLayer(
    totalObsCount,
    {min: 84, max: 92},
    'count of total observations',
    false
  )
Map.addLayer(
    clearObsCount,
    {min: 0, max: 90},
    'count of clear observations',
    false
  )
Map.addLayer(
    clearObsCount.toFloat().divide(totalObsCount),
    {min: 0, max: 1},
    'ratio of clear to total observations'
  )


