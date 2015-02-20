// Visualize example

/**
 * A Landsat 8 image is used to derive spectral indices NDVI and NDWI.
 * The true-color bands of the image are linearly stretched to the
 * 5th and 95th percentiles to create a visualization image.  A palettized
 * NDWI layer is visualized and combined with the true-color image
 * for exporting a multi-layer overlay as a single RGB image.
 */

var image = ee.Image('LANDSAT/LC8_L1T_TOA/LC80440342014077LGN00');
Map.setCenter(-122.1899, 37.5010, 10); // SF Bay

// Return the percentile values for each band in an image.
var getPercentile = function(image, percentile) {
  return image.reduceRegion({
      reducer: ee.Reducer.percentile([percentile]),
      bestEffort: true
  });
};

// Get the percentile values for each band.
var p05 = getPercentile(image, 5);
var p95 = getPercentile(image, 95);

// define the visualization bands (true color)
var bands = ['B4', 'B3', 'B2'];
// linear stretch between the 5th and 95th percentiles
var vizParams = {
  bands: bands,
  min: p05.values(bands),
  max: p95.values(bands),
};
// create a true-color visualization image
var rgb = image.visualize(vizParams);
Map.addLayer(rgb, {}, 'vis');

// create an NDVI image
var ndvi = image.normalizedDifference(['B5', 'B4']);
Map.addLayer(ndvi, {min: -1, max: 1, palette: ['FF0000', '00FF00']}, 'NDVI', false);

// create an NDWI image, see:
// http://www.tandfonline.com/doi/abs/10.1080/01431169608948714#.VMpommR4oeE
var ndwi = image.normalizedDifference(['B3', 'B5']);
var ndwiViz = {min: 0.5, max: 1, palette: ['00FFFF', '0000FF']};
Map.addLayer(ndwi, ndwiViz, 'NDWI', false);
// mask the non-watery parts of the NDWI image, create a visualization layer
var ndwiRGB = ndwi.mask(ndwi.gte(0.4)).visualize(ndwiViz);
Map.addLayer(ndwiRGB, {}, 'NDWI-vis');

// Mosaic the true-color visualization and the NDWI visualization.
// The order of images in the collection determines rendering order.
// Specifically, the latter images in the collection will be "on top."
// Masks can be used to control which parts of an image are visible.
var flattenedImage = ee.ImageCollection([rgb, ndwiRGB]).mosaic();

Map.addLayer(flattenedImage, {}, 'flattened');
