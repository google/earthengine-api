// Morphological processing of land cover.  This example
// includes spatial smoothing (neighborhood mode) followed by
// dilation, erosion and dilation again.  Reprojection is
// used to force these operations to be performed at the
// native scale of the input (rather than variable pixel
// sizes based on zoom level).

// Force projection of 500 meters/pixel, which is the native MODIS resolution.
var SCALE = 500;

// Load a 2001 MODIS land cover image.
var image1 = ee.Image('MODIS/051/MCD12Q1/2001_01_01');
// Select the classification band of interest.
var image2 = image1.select(['Land_Cover_Type_1']);
// Reproject to WGS84 to force the image to be reprojected on load.
// This is just for display purposes, to visualize the input to
// the following operations.  The next reproject is sufficient
// to force the computation to occur at native scale.
var image3 = image2.reproject('EPSG:4326', null, SCALE);
// Smooth with a mode filter.
var image4 = image3.focal_mode();
// Use erosion and dilation to get rid of small islands.
var image5 = image4.focal_max(3).focal_min(5).focal_max(3);
// Reproject to force the operations to be performed at SCALE.
var image6 = image5.reproject('EPSG:4326', null, SCALE);

// Define display paramaters with appropriate colors for the MODIS
// land cover classification image.
var PALETTE = [
    'aec3d4', // water
    '152106', '225129', '369b47', '30eb5b', '387242', // forest
    '6a2325', 'c3aa69', 'b76031', 'd9903d', '91af40', // shrub, grass, savannah
    '111149', // wetlands
    'cdb33b', // croplands
    'cc0013', // urban
    '33280d', // crop mosaic
    'd7cdcc', // snow and ice
    'f7e084', // barren
    '6f6f6f'  // tundra
].join(',');

var vis_params = {min: 0, max: 17, palette: PALETTE};

// Display each step of the computation.
Map.setCenter(-113.41842, 40.055489, 6);
Map.addLayer(image2, vis_params, 'IGBP classification');
Map.addLayer(image3, vis_params, 'Reprojected');
Map.addLayer(image4, vis_params, 'Mode');
Map.addLayer(image5, vis_params, 'Smooth');
Map.addLayer(image6, vis_params, 'Smooth');
