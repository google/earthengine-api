/**
 * @fileoverview Earth Engine Developer's Guide examples
 *   from 'Adding data to the map' section
 */

// [START image_display]
var image = ee.Image('LANDSAT/LC8_L1T/LC80440342014077LGN00');
Map.centerObject(image, 9);
Map.addLayer(image);
// [END image_display]

// [START image_visualization]
var image = ee.Image('LANDSAT/LC8_L1T/LC80440342014077LGN00');
// define visualization parameters in an object literal
var vizParams = {bands: ['B5', 'B4', 'B3'], min: 5000, max: 15000, gamma: 1.3};
Map.centerObject(image, 9);
Map.addLayer(image, vizParams, 'Landsat 8 false color');
// [END image_visualization]

// [START fc_display]
var counties = ee.FeatureCollection('ft:1S4EB6319wWW2sWQDPhDvmSBIVrD3iEmCLYB7nMM');
Map.addLayer(counties, {}, 'counties');
// [END fc_display]
