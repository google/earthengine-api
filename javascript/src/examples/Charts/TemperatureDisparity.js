// Plot min to max temperature disparity in US states.

// Import US state boundaries.
var states = ee.FeatureCollection('TIGER/2018/States');

// Import temperature normals and calculate annual mean of monthly min and max.
var normClim = ee.ImageCollection('OREGONSTATE/PRISM/Norm81m')
  .select(['tmin', 'tmax'])
  .mean();

// Calculate mean max and min temperature per state.
states = normClim.reduceRegions({
  collection: states,
  reducer: ee.Reducer.mean(),
  scale: 5e4})
  .filter(ee.Filter.notNull(['tmax', 'tmin']));

// Calculate max to min temperature difference per state and set as a property.
states = states.map(function(state){
  var dif = state.getNumber('tmax').subtract(state.getNumber('tmin'));
  return state.set('tdif', dif);
})
.filter(ee.Filter.notNull(['tdif']));

// Get states with the greatest mean max and min temperature disparity.
var greatestDif = states.limit(6, 'tdif', false);

// Define color properties for chart series.
var color = {
  high: 'ff0000',
  low: '0000ff'
};

// Prepare the chart.
var greatestDifChart =
  ui.Chart.feature.byFeature(greatestDif, 'NAME', ['tmax', 'tmin'])
    .setChartType('LineChart')
    .setOptions({
      title: 'States with Greatest Temperature Disparity',
      vAxis: {
        title: 'Temperature (Celsius)'
      },
      lineWidth: 1,
      pointSize: 4,
      series: {
        0: {color: color.high},
        1: {color: color.low}
      }
    });



// The Chart.feature helper functions plot property values in different ways.
// Chart.feature.byFeatures() allows us to plot *features* on the x-axis, with
// a separate series for each *property*. Chart.feature.byProperties() puts
// *properties* on the x-axis, with a separate series for each *feature*.
// Chart.feature.groups() gives us a little more flexibility. It lets us specify
// a custom xProperty and a custom seriesProperty. The *values* of these
// properties determine the x-axis and series values for each feature. In this
// case, to plot min and max temps in by disparity, we need a separate feature
// for each low and each high. On the chart the X values are difference and the
// series names indicates low and high temperature.

// Define a function to set a temp and series property.
var individualTemps = function(label) {
  return states.map(function(feature) {
    return feature.set({
      temp: feature.get(label),
      series: label
    });
  });
};

// Make min and max collections using and merge them.
var highs = individualTemps('tmax');
var lows = individualTemps('tmin');
var tempsByDif = highs.merge(lows);

// Prepare the chart.
var tempsByDifChart =
  ui.Chart.feature.groups(tempsByDif, 'tdif', 'temp', 'series')
    .setChartType('ScatterChart')
    .setOptions({
      title: 'Mean Temperature Disparity US States',
      hAxis: {
        title: 'Temperature disparity'
      },
      vAxis: {
        title: 'Temperature (Celsius)'
      },
      pointSize: 4,
      series: {
        0: {color: color.high},
        1: {color: color.low}
      }
    });

print(greatestDifChart);
print(tempsByDifChart);
