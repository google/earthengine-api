// Plot average seasonal temperatures in US States.

// Import US state boundaries.
var states = ee.FeatureCollection('TIGER/2018/States');

// Import temperature normals and convert month features to bands.
var normClim = ee.ImageCollection('OREGONSTATE/PRISM/Norm81m')
  .select(['tmean'])
  .toBands();

// Calculate mean monthly temperature per state.
states = normClim.reduceRegions({
  collection: states,
  reducer: ee.Reducer.mean(),
  scale: 5e4})
  .filter(ee.Filter.notNull(['01_tmean']));

// Calculate Jan to Jul temperature difference per state and set as a property.
states = states.map(function(state) {
  var julyTemp = ee.Number(state.get('06_tmean'));
  var janTemp = ee.Number(state.get('01_tmean'));
  return state.set('seasonal_delta', julyTemp.subtract(janTemp));
});

// Select the extreme states.
var extremeStates =
  states.limit(1, '01_tmean')                 // Coldest.
  .merge(states.limit(1, '07_tmean', false))  // Hottest.
  .merge(states.limit(1, 'seasonal_delta'));  // Least variation.

// Define properties to chart.
var months = {
  '01_tmean': 1,
  '04_tmean': 4,
  '07_tmean': 7,
  '10_tmean': 10
};

// Prepare the chart.
var extremeTempsChart =
  ui.Chart.feature.byProperty(extremeStates, months, 'NAME')
    .setChartType('LineChart')
    .setOptions({
      title: 'Average Temperatures in U.S. States',
      hAxis: {
        title: 'Month',
        ticks: [{v: months['01_tmean'], f: 'January'},
                {v: months['04_tmean'], f: 'April'},
                {v: months['07_tmean'], f: 'July'},
                {v: months['10_tmean'], f: 'October'}]
      },
      vAxis: {
        title: 'Temperature (Celsius)'
      },
      lineWidth: 1,
      pointSize: 3
    });

print(extremeTempsChart);
