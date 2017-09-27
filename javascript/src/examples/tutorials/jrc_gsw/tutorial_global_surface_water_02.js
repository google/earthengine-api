/**
 * @fileoverview Earth Engine Developer's Guide examples contained in
 *   the Global Surface Water tutorial, page 2.
 */

// [START initial_script]
var gsw = ee.Image('JRC/GSW1_0/GlobalSurfaceWater');
var occurrence = gsw.select('occurrence');
Map.addLayer(occurrence);
// [END initial_script]

// [START addLayer_occurrence_v1]
Map.addLayer({
    eeObject: occurrence,
    name: "Water Occurrence (1984-2015)"
});
// [END addLayer_occurrence_v1]

// [START addLayer_watermask]
Map.addLayer({
  eeObject: water_mask,
  visParams: VIS_WATER_MASK,
  name: '90% occurrence water mask'
});
// [END addLayer_watermask]

// [START final_script]
//////////////////////////////////////////////////////////////
// Asset List
//////////////////////////////////////////////////////////////

var gsw = ee.Image('JRC/GSW1_0/GlobalSurfaceWater');
var occurrence = gsw.select('occurrence');

//////////////////////////////////////////////////////////////
// Constants
//////////////////////////////////////////////////////////////

// [START occurrence_visualization]
var VIS_OCCURRENCE = {
  min:0,
  max:100,
  palette: ['red', 'blue']
};
// [END occurrence_visualization]
// [START watermask_visualization]
var VIS_WATER_MASK = {
  palette: ['white', 'black']
};
// [END watermask_visualization]

//////////////////////////////////////////////////////////////
// Calculations
//////////////////////////////////////////////////////////////

// [START watermask_definition]
// Create a water mask layer, and set the image mask so that non-water areas
// are opaque.
var water_mask = occurrence.gt(90).unmask(0);
// [END watermask_definition]

//////////////////////////////////////////////////////////////
// Initialize Map Location
//////////////////////////////////////////////////////////////

// [START interesting_locations]
// Uncomment one of the following statements to center the map.
// Map.setCenter(-90.162, 29.8597, 10);   // New Orleans, USA
// Map.setCenter(-114.9774, 31.9254, 10); // Mouth of the Colorado River, Mexico
// Map.setCenter(-111.1871, 37.0963, 11); // Lake Powell, USA
// Map.setCenter(149.412, -35.0789, 11);  // Lake George, Australia
// Map.setCenter(105.26, 11.2134, 9);     // Mekong River Basin, SouthEast Asia
// Map.setCenter(90.6743, 22.7382, 10);   // Meghna River, Bangladesh
// Map.setCenter(81.2714, 16.5079, 11);   // Godavari River Basin Irrigation Project, India
// Map.setCenter(14.7035, 52.0985, 12);   // River Oder, Germany & Poland
// Map.setCenter(-59.1696, -33.8111, 9);  // Buenos Aires, Argentina
Map.setCenter(-74.4557, -8.4289, 11);  // Ucayali River, Peru
// [END interesting_locations]

//////////////////////////////////////////////////////////////
// Map Layers
//////////////////////////////////////////////////////////////

Map.addLayer({
  eeObject: water_mask,
  visParams: VIS_WATER_MASK,
  name: '90% occurrence water mask',
  shown: false
});
// [START addLayer_occurrence_v2]
Map.addLayer({
  eeObject: occurrence.updateMask(occurrence.divide(100)),
  name: "Water Occurrence (1984-2015)",
  visParams: VIS_OCCURRENCE
});
// [END addLayer_occurrence_v2]
// [START final_script]
