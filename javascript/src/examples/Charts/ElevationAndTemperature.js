// Plot elevation and seasonal temperatures along SF-Reno transect.

var reno = [-119.821944, 39.527222];
var sf = [-122.416667, 37.783333];
var transect = ee.Geometry.LineString([reno, sf]);

// Get brightness temperature data for 1 year.
var landsat8Toa = ee.ImageCollection('LANDSAT/LC08/C02/T1_TOA');
var temperature = landsat8Toa.filterBounds(transect)
    .select(['B10'], ['temp'])
    .map(function(image) {
      // Kelvin to Celsius.
      return image.subtract(273.15)
          .set('system:time_start', image.get('system:time_start'));
    });

// Calculate bands for seasonal temperatures and elevations; composite into
// a single image.
var summer = temperature.filterDate('2014-06-21', '2014-09-23')
    .reduce(ee.Reducer.mean())
    .select([0], ['summer']);
var winter = temperature.filterDate('2013-12-21', '2014-03-20')
    .reduce(ee.Reducer.mean())
    .select([0], ['winter']);
var elevation = ee.Image('USGS/NED');  // Extract the elevation profile.
var startingPoint = ee.FeatureCollection(ee.Geometry.Point(sf));
var distance = startingPoint.distance(500000);
var image = distance.addBands(elevation).addBands(winter).addBands(summer);

// Extract band values along the transect line.
var array = image.reduceRegion(ee.Reducer.toList(), transect, 1000)
                 .toArray(image.bandNames());

// Sort points along the transect by their distance from the starting point.
var distances = array.slice(0, 0, 1);
array = array.sort(distances);

// Create arrays for charting.
var elevationAndTemp = array.slice(0, 1);  // For the Y axis.
// Project distance slice to create a 1-D array for x-axis values.
var distance = array.slice(0, 0, 1).project([1]);

// Generate and style the chart.
var chart = ui.Chart.array.values(elevationAndTemp, 1, distance)
    .setChartType('LineChart')
    .setSeriesNames(['Elevation', 'Winter 2014', 'Summer 2014'])
    .setOptions({
      title: 'Elevation and temperatures along SF-to-Reno transect',
      vAxes: {
        0: {
          title: 'Average seasonal temperature (Celsius)'
        },
        1: {
          title: 'Elevation (meters)',
          baselineColor: 'transparent'
        }
      },
      hAxis: {
        title: 'Distance from SF (m)'
      },
      interpolateNulls: true,
      pointSize: 0,
      lineWidth: 1,
      // Our chart has two Y axes: one for temperature and one for elevation.
      // The Visualization API allows us to assign each series to a specific
      // Y axis, which we do here:
      series: {
        0: {targetAxisIndex: 1},
        1: {targetAxisIndex: 0},
        2: {targetAxisIndex: 0}
      }
    });

print(chart);
Map.setCenter(-121, 38.5, 7);
Map.addLayer(elevation, {min: 4000, max: 0});
Map.addLayer(transect, {color: 'FF0000'});
