/**
 * @fileoverview Earth Engine Developer's Guide examples
 *   from 'Reducing' section
 */

// [START spatial_reduce]
// load and display a precomputed NDVI composite
var ndviImage = ee.Image('LANDSAT/LC8_L1T_ANNUAL_NDVI/2014');
Map.addLayer(ndviImage);

// create an arbitrary rectangle as a region, display
var region = ee.Geometry.Rectangle(-122.0828, 36.9631, -121.7807, 37.2303);
Map.addLayer(region);

// get a dictionary of means in the region, keys are bandnames
var mean = ndviImage.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: region,
  scale: 30
});
// [END spatial_reduce]

print('mean NDVI:', mean);
