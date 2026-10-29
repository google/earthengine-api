// Use the NASA NEX-DCP30 dataset to create a visualization of projected
// climate in the San Joaquin watershed of California, USA
// https://cds.nccs.nasa.gov/wp-content/uploads/2014/04/NEX-DCP30_Tech_Note_v0.pdf
// http://www.nasa.gov/content/nasa-supercomputer-generates-closer-look-at-future-climate-conditions-in-us

var imgCol = ee.ImageCollection('NASA/NEX-DCP30_ENSEMBLE_STATS')
    .select(['tasmax_median', 'tasmax_quartile25', 'tasmax_quartile75'])
    .filterDate('2010-01-01', '2100-01-01');

var january = imgCol.filter(ee.Filter.calendarRange({
  start: 7,
  field: 'month'
}));

// Convert temperature to Celsius.
january = january.map(function(image) {
  return image.select().addBands(image.subtract(273.15), null, true);
});
var rcp26 = january.filter('scenario == "rcp26"');
var rcp45 = january.filter('scenario == "rcp45"');
var rcp60 = january.filter('scenario == "rcp60"');
var rcp85 = january.filter('scenario == "rcp85"');

var roi = ee.FeatureCollection('USGS/WBD/2017/HUC06')
  .filter('huc6 == "180400"');  // San Joaquin watershed

var labelBands = function(collection, scenario) {
  return collection.select(
    ['tasmax_median', 'tasmax_quartile25', 'tasmax_quartile75'],
    ['RCP' + scenario + '_tasmax_p50',
     'RCP' + scenario + '_tasmax_p25',
     'RCP' + scenario + '_tasmax_p75']);
};

var combined = labelBands(rcp26, '26').merge(labelBands(rcp85, '85'));

var chart = ui.Chart.image.series({
  imageCollection: combined,
  region: roi,
  reducer: ee.Reducer.mean(),
  scale: 200,
  xProperty: 'system:time_start'
}).setChartType('LineChart')
  .setSeriesNames(['RCP2.6 p25', 'RCP2.6 p50', 'RCP2.6 p75',
                   'RCP8.5 p25', 'RCP8.5 p50', 'RCP8.5 p75'])
  .setOptions({
    title: 'Predicted January Temperature - San Joaquin Watershed',
    vAxis: {
      title: 'Daily Maximum Near-Surface Air Temperature [Celsius]'
    },
    lineWidth: 2,
    colors: ['6BAED6', '3182BD', '08519C', 'FD8d3C', 'E6550D', 'A63603'],
    curveType:'function',
    interpolateNulls: true
  });
print(chart);

var visParams = {
  bands: ['tasmax_median'],
  min: 17.5,
  max: 40,
  palette: ['000004', '320A5A', '781B6C', 'BB3654', 'EC6824', 'FBB41A', 'FCFFA4']
};

var rcp26Year2050 = rcp26.filterDate('2050', '2051').first();

Map.centerObject(roi);
Map.addLayer(rcp26Year2050, visParams, 'RCP2.6 2050 tasmax_median', true);
Map.addLayer(roi, {color: 'FFFFFF'}, 'Region of Interest');
