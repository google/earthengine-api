// Plot the most extreme recorded temperatures in U.S. states.

var extremeTemps =
    ee.FeatureCollection('ft:1dZ78QI6P_HrZ6oabSKitytOhWM__fI9O1ayP4AoI');
var COLOR = {
  HIGH: 'ff0000',
  LOW: '0000ff'
};

// Get the cities with the highest highs.
var hottestStates = extremeTemps.limit(6, 'high_record', false);
var hottestStatesChart = ui.Chart.feature.byFeature(
    hottestStates, 'state', ['high_record', 'low_record']);
hottestStatesChart.setChartType('LineChart');
hottestStatesChart.setOptions({
  title: 'States with Highest Record Temperatures',
  vAxis: {
    title: 'Temperature (Celsius)'
  },
  lineWidth: 1,
  pointSize: 4,
  series: {
    0: {color: COLOR.HIGH},
    1: {color: COLOR.LOW}
  }
});

// The Chart.feature helper functions plot property values in different ways.
// Chart.feature.byFeatures() allows us to plot *features* on the x-axis, with
// a separate series for each *property*. Chart.feature.byProperties() puts
// *properties* on the x-axis, with a separate series for each *feature*.
// Chart.feature.groups() gives us a little more flexibility. It lets us specify
// a custom xProperty and a custom seriesProperty. The *values* of these
// properties determine the x-axis and series values for each feature. In this
// case, to plot temperatures by their date, we need a separate feature for each
// low and each high. On the chart the X values are dates and the series names
// indicate record type (high or low).
var individualTemps = function(label) {
  return extremeTemps.map(function(feature) {
    return ee.Feature(ee.Geometry(feature.get(label + '_city'))).set({
      temp: feature.get(label + '_record'),
      date: feature.get(label + '_date'),
      series: 'Record ' + label
    });
  });
};
var highs = individualTemps('high');
var lows = individualTemps('low');
var tempsByDate = highs.merge(lows);
var tempsByDateChart =
    ui.Chart.feature.groups(tempsByDate, 'date', 'temp', 'series');
tempsByDateChart.setChartType('ScatterChart');
tempsByDateChart.setOptions({
  title: 'Dates of Extreme Temperatures in the 50 US States',
  hAxis: {
    title: 'Date Recorded'
  },
  vAxis: {
    title: 'Temperature (Celsius)'
  },
  pointSize: 4,
  series: {
    0: {color: COLOR.LOW},
    1: {color: COLOR.HIGH}
  }
});

print(hottestStatesChart);
print(tempsByDateChart);

Map.addLayer(highs, {color: COLOR.HIGH});
Map.addLayer(lows, {color: COLOR.LOW});
Map.setCenter(-98.5, 39.8, 4);
