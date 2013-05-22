// Landcover cleanup
// #section Image:3
//
// Display the MODIS land cover classification image with appropriate colors.

// Force projection of 500 meters/pixel, which is the native MODIS resolution.
var VECTORIZATION_SCALE = 500;

var image1 = ee.Image('MCD12Q1/MCD12Q1_005_2001_01_01');
var image2 = image1.select(['Land_Cover_Type_1']);
var image3 = image2.reproject('EPSG:4326', null, 500);
var image4 = image3.focal_mode();
var image5 = image4.focal_max(3).focal_min(5).focal_max(3);
var image6 = image5.reproject('EPSG:4326', null, 500);

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

centerMap(-113.41842, 40.055489, 6);
addToMap(image2, vis_params, 'IGBP classification');
addToMap(image3, vis_params, 'Reprojected');
addToMap(image4, vis_params, 'Mode');
addToMap(image5, vis_params, 'Smooth');
addToMap(image6, vis_params, 'Smooth');
