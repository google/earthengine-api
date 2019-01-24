// Use the NASA NEX-DCP30 dataset to create a visualization of projected
// climate in the San Joaquin watershed of California, USA
// https://cds.nccs.nasa.gov/wp-content/uploads/2014/04/NEX-DCP30_Tech_Note_v0.pdf
// http://www.nasa.gov/content/nasa-supercomputer-generates-closer-look-at-future-climate-conditions-in-us

var geometry1 = /* color: #98ff00 */ee.Geometry.MultiPoint();

var base_collection = ee.ImageCollection('NASA/NEX-DCP30_ENSEMBLE_STATS')
    .select(['tasmax_median', 'tasmax_quartile25', 'tasmax_quartile75'])
    .filterDate('2010-01-01', '2100-01-01');

var january = base_collection.filter(ee.Filter.calendarRange({
  start: 7,
  field: 'month'
}));

// Convert temperature to Celsius.
january = january.map(function(image) {
  return image.subtract(273.15)
      .copyProperties(image, ['system:time_start', 'scenario']);
});
var rcp26 = january.filterMetadata('scenario', 'equals', 'rcp26');
var rcp45 = january.filterMetadata('scenario', 'equals', 'rcp45');
var rcp60 = january.filterMetadata('scenario', 'equals', 'rcp60');
var rcp85 = january.filterMetadata('scenario', 'equals', 'rcp85');

var forest = ee.Feature(
    ee.Geometry.Rectangle(-121, 39.4, -120.8, 39.8),
    {label: 'Tahoe National Forest'});

var roi = ee.Feature(
    ee.FeatureCollection('USGS/WBD/2017/HUC06')
        .filterMetadata('huc6', 'equals', '180400')  // San Joaquin watershed
        .first());

var options = {
  title: 'Daily Maximum Near-Surface Air Temperature',
  vAxis: {
    title: 'Daily Maximum Near-Surface Air Temperature [Celsius]'
  },
  lineWidth: 1,
  pointSize: 4
};

var chartScenario = function(scenario, name) {
  var chart = Chart.image.series({
    imageCollection: scenario,
    region: roi,
    reducer: ee.Reducer.mean(),
    scale: 200,
    xProperty: 'system:time_start'
  }).setChartType('LineChart')
    .setOptions({
      title: 'tasmax median value over time (scenario ' + name + ')',
      vAxis: {
        title: 'tasmax value'
      },
      intervals: {'style': 'area'},
      lineWidth: 1,
      curveType:'function',
      legend: {position: 'none'}
  }).transform(function(chartArgs) {
    var newChartArgs = JSON.parse(JSON.stringify(chartArgs));
    newChartArgs.dataTable.cols[1] = {
      type: 'number',
      id: 'tasmax_median',
      label: 'tasmax_median'
    };
    newChartArgs.dataTable.cols[2] = {
      type: 'number',
      id: 'tasmax_quartile25',
      label: 'tasmax_quartile25',
      role: 'interval'
    };
    newChartArgs.dataTable.cols[3] = {
      type: 'number',
      id: 'tasmax_quartile75',
      label: 'tasmax_quartile75',
      role: 'interval'
    };
    return newChartArgs;
  });
  print(chart);
};

var labelBands = function(collection, scenario) {
  return collection.select(
    ['tasmax_median', 'tasmax_quartile25', 'tasmax_quartile75'],
    ['rcp' + scenario + '_tasmax_median',
     'rcp' + scenario + '_tasmax_quartile25',
     'rcp' + scenario + '_tasmax_quartile75']);
};

var combined = labelBands(rcp26, '26').merge(labelBands(rcp85, '85'));

var chart = Chart.image.series({
  imageCollection: combined,
  region: roi,
  reducer: ee.Reducer.mean(),
  scale: 200,
  xProperty: 'system:time_start'
}).setChartType('LineChart')
  .setOptions({
  title: 'Predicted January Temperature - San Joaquin Watershed',
  vAxis: {
    title: 'Daily Maximum Near-Surface Air Temperature [Celsius]'
  },
  interval: {
    rcp26_tasmax_quartile: {'style':'area'},
    rcp85_tasmax_quartile: {'style':'area'},
  },
  lineWidth: 1,
  curveType:'function',
  interpolateNulls: true
}).transform(function(chartArgs) {
  var newChartArgs = JSON.parse(JSON.stringify(chartArgs));
  print(newChartArgs);
  var i = 1;
  var scenarios = ['rcp26', 'rcp85'];
  scenarios.forEach(function(scenario) {
    newChartArgs.dataTable.cols[i++] = {
      type: 'number',
      id: scenario + '_tasmax_median',
      label: scenario + '_tasmax_median'

    };
    newChartArgs.dataTable.cols[i++] = {
      type: 'number',
      id: scenario + '_tasmax_quartile',
      label: scenario + 'tasmax_quartile',
      role: 'interval'};
    newChartArgs.dataTable.cols[i++] = {
      type: 'number',
      id: scenario + '_tasmax_quartile',
      label: scenario + 'tasmax_quartile',
      role: 'interval'
    };
  });
  return newChartArgs;
});
chart = chart.setSeriesNames('RPC2.6', 0);
chart = chart.setSeriesNames('RPC8.5', 3);
print(chart);

var sld =
'<RasterSymbolizer>' +
  '<ColorMap>' +
    '<ColorMapEntry color="#110092" quantity="17.5" label="17.5"/>' +
    '<ColorMapEntry color="#0C00FF" quantity="20.0" label="20.0" />' +
    '<ColorMapEntry color="#0E66FF" quantity="22.5" label="22.5" />' +
    '<ColorMapEntry color="#0DDFFB" quantity="25.0" label="25.0" />' +
    '<ColorMapEntry color="#52AA92" quantity="27.5" label="27.5" />' +
    '<ColorMapEntry color="#A9EE35" quantity="30.0" label="30.0" />' +
    '<ColorMapEntry color="#FFDE00" quantity="32.5" label="32.5" />' +
    '<ColorMapEntry color="#FF6E00" quantity="35.0" label="35.0" />' +
    '<ColorMapEntry color="#F90000" quantity="37.5" label="37.5" />' +
    '<ColorMapEntry color="#770B11" quantity="40.0" label="40.0" />' +
  '</ColorMap>' +
'</RasterSymbolizer>';

var image2 = ee.Image(rcp26.filterDate('2050-01-01', '2051-01-01').first())
    .select('tasmax_median');

Map.centerObject(roi);
Map.addLayer(image2,
             {bands:'tasmax_median', min:-2, max:8},
             'historical_195001 tasmax_median', false);
Map.addLayer(image2.sldStyle(sld), {}, "tasmax_median (styled)", true);
Map.addLayer(roi, {}, 'Region of Interest');
