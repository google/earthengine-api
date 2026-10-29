/**
 * @fileoverview Earth Engine Developer's Guide examples contained in
 *   the Global Surface Water tutorial, page 4.
 */

// [START 04_final_script]
//////////////////////////////////////////////////////////////
// Asset List
//////////////////////////////////////////////////////////////

var gsw = ee.Image('JRC/GSW1_0/GlobalSurfaceWater');
var occurrence = gsw.select('occurrence');
var change = gsw.select("change_abs");
// [START define_transition]
var transition = gsw.select('transition');
// [END define_transition]
var roi = ee.Geometry.Polygon(
        [[[105.531921, 10.412183],
          [105.652770, 10.285193],
          [105.949401, 10.520218],
          [105.809326, 10.666006]]]);
//////////////////////////////////////////////////////////////
// Constants
//////////////////////////////////////////////////////////////

var VIS_OCCURRENCE = {
    min: 0,
    max: 100,
    palette: ['red', 'blue']
};
var VIS_CHANGE = {
    min: -50,
    max: 50,
    palette: ['red', 'black', 'limegreen']
};
var VIS_WATER_MASK = {
  palette: ['white', 'black']
};

// [START define_helper_functions]
//////////////////////////////////////////////////////////////
// Helper functions
//////////////////////////////////////////////////////////////

// Create a feature for a transition class that includes the area covered.
function createFeature(transition_class_stats) {
  transition_class_stats = ee.Dictionary(transition_class_stats);
  var class_number = transition_class_stats.get('transition_class_value');
  var result = {
      transition_class_number: class_number,
      transition_class_name: lookup_names.get(class_number),
      transition_class_palette: lookup_palette.get(class_number),
      area_m2: transition_class_stats.get('sum')
  };
  return ee.Feature(null, result);   // Creates a feature without a geometry.
}

// Create a JSON dictionary that defines piechart colors based on the
// transition class palette.
// https://developers.google.com/chart/interactive/docs/gallery/piechart
function createPieChartSliceDictionary(fc) {
  return ee.List(fc.aggregate_array("transition_class_palette"))
    .map(function(p) { return {'color': p}; }).getInfo();
}

// Convert a number to a string. Used for constructing dictionary key lists
// from computed number objects.
function numToString(num) {
  return ee.Number(num).format();
}
// [END define_helper_functions]

// [START define_lookup_dictionaries]
//////////////////////////////////////////////////////////////
// Calculations
//////////////////////////////////////////////////////////////

// Create a dictionary for looking up names of transition classes.
var lookup_names = ee.Dictionary.fromLists(
    ee.List(gsw.get('transition_class_values')).map(numToString),
    gsw.get('transition_class_names')
);
// Create a dictionary for looking up colors of transition classes.
var lookup_palette = ee.Dictionary.fromLists(
    ee.List(gsw.get('transition_class_values')).map(numToString),
    gsw.get('transition_class_palette')
);
// [END define_lookup_dictionaries]

// Create a water mask layer, and set the image mask so that non-water areas
// are transparent.
var water_mask = occurrence.gt(90).mask(1);

// Generate a histogram object and print it to the console tab.
var histogram = ui.Chart.image.histogram({
  image: change,
  region: roi,
  scale: 30,
  minBucketWidth: 10
});
histogram.setOptions({
  title: 'Histogram of surface water change intensity.'
});
print(histogram);

// Summarize transition classes in a region of interest.
// [START define_transition_with_area]
var area_image_with_transition_class = ee.Image.pixelArea().addBands(transition);
// [END define_transition_with_area]
// [START define_transition_group_reducer]
var reduction_results = area_image_with_transition_class.reduceRegion({
  reducer: ee.Reducer.sum().group({
    groupField: 1,
    groupName: 'transition_class_value',
  }),
  geometry: roi,
  scale: 30,
  bestEffort: true,
});
print('reduction_results', reduction_results);
// [END define_transition_group_reducer]

// [START define_roi_stats]
var roi_stats = ee.List(reduction_results.get('groups'));
// [END define_roi_stats]

// [START map_create_feature]
var transition_fc = ee.FeatureCollection(roi_stats.map(createFeature));
print('transition_fc', transition_fc);
// [END map_create_feature]

// [START add_summary_chart]
// Add a summary chart.
var transition_summary_chart = ui.Chart.feature.byFeature({
    features: transition_fc,
    xProperty: 'transition_class_name',
    yProperties: ['area_m2', 'transition_class_number']
  })
  .setChartType('PieChart')
  .setOptions({
    title: 'Summary of transition class areas',
    slices: createPieChartSliceDictionary(transition_fc),
    sliceVisibilityThreshold: 0  // Don't group small slices.
  });
print(transition_summary_chart);
// [END add_summary_chart]

//////////////////////////////////////////////////////////////
// Initialize Map Location
//////////////////////////////////////////////////////////////

// Uncomment one of the following statements to center the map on
// a particular location.
// Map.setCenter(-90.162, 29.8597, 10);   // New Orleans, USA
// Map.setCenter(-114.9774, 31.9254, 10); // Mouth of the Colorado River, Mexico
// Map.setCenter(-111.1871, 37.0963, 11); // Lake Powell, USA
// Map.setCenter(149.412, -35.0789, 11);  // Lake George, Australia
// [START addLayer_transition]
Map.setCenter(105.26, 11.2134, 9);     // Mekong River Basin, SouthEast Asia
// [END addLayer_transition]
// Map.setCenter(90.6743, 22.7382, 10);   // Meghna River, Bangladesh
// Map.setCenter(81.2714, 16.5079, 11);   // Godavari River Basin Irrigation Project, India
// Map.setCenter(14.7035, 52.0985, 12);   // River Oder, Germany & Poland
// Map.setCenter(-59.1696, -33.8111, 9);  // Buenos Aires, Argentina
// Map.setCenter(-74.4557, -8.4289, 11);  // Ucayali River, Peru

//////////////////////////////////////////////////////////////
// Map Layers
//////////////////////////////////////////////////////////////

Map.addLayer({
  eeObject: water_mask,
  visParams: VIS_WATER_MASK,
  name: '90% occurrence water mask',
  shown: false
});
Map.addLayer({
  eeObject: occurrence.updateMask(occurrence.divide(100)),
  name: "Water Occurrence (1984-2015)",
  visParams: VIS_OCCURRENCE,
  shown: false
});
Map.addLayer({
  eeObject: change,
  visParams: VIS_CHANGE,
  name: 'occurrence change intensity',
  shown: false
});
// [START addLayer_transition]
Map.addLayer({
  eeObject: transition,
  name: 'Transition classes (1984-2015)',
});
// [END addLayer_transition]
// [END 04_final_script]
