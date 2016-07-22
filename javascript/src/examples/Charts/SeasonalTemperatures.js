// Plot average seasonal temperatures in U.S. cities.

var seasonalTemps =
    ee.FeatureCollection('ft:1G3RZbWoTiCiYv_LEwc7xKZq8aYoPZlL5_KuVhyDM');

// Compute the annual temperature delta.
seasonalTemps = seasonalTemps.map(function(city) {
  var julyTemp = ee.Number(city.get('avg_temp_jul'));
  var janTemp = ee.Number(city.get('avg_temp_jan'));
  return city.set('seasonal_delta', julyTemp.subtract(janTemp));
});

// Select the extreme cities.
var extremeCities =
    seasonalTemps.limit(1, 'avg_temp_jan')                 // Coldest.
    .merge(seasonalTemps.limit(1, 'avg_temp_jul', false))  // Hottest.
    .merge(seasonalTemps.limit(1, 'seasonal_delta'));      // Least variation.

var months = {
  avg_temp_jan: 1,
  avg_temp_apr: 4,
  avg_temp_jul: 7,
  avg_temp_oct: 10
};

// Prepare the chart.
var extremeSeasonalTemps = ui.Chart.feature.byProperty(
    extremeCities, months, 'city_name');
extremeSeasonalTemps.setChartType('LineChart');
extremeSeasonalTemps.setOptions({
  title: 'Average Temperatures in U.S. Cities',
  hAxis: {
    title: 'Month',
    ticks: [{v: months.avg_temp_jan, f: 'January'},
            {v: months.avg_temp_apr, f: 'April'},
            {v: months.avg_temp_jul, f: 'July'},
            {v: months.avg_temp_oct, f: 'October'}]
  },
  vAxis: {
    title: 'Temperature (Celsius)'
  },
  lineWidth: 1,
  pointSize: 3
});

print(extremeSeasonalTemps);

Map.addLayer(extremeCities);
Map.setCenter(-98.5, 39.8, 4);
