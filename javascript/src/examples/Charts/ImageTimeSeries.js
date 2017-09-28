// Plot Landsat 8 band value means in a section of San Francisco and
// demonstrate interactive charts.

var sanFrancisco =
    ee.Geometry.Rectangle(-122.45, 37.74, -122.4, 37.8);

var landsat8Toa = ee.ImageCollection('LANDSAT/LC08/C01/T1_TOA')
    .filterDate('2015-12-25', '2016-12-25')
    .select('B[1-7]');

// Create an image time series chart.
var chart = ui.Chart.image.series({
  imageCollection: landsat8Toa,
  region: sanFrancisco,
  reducer: ee.Reducer.mean(),
  scale: 200
});

// Add the chart to the map.
chart.style().set({
  position: 'bottom-right',
  width: '500px',
  height: '300px'
});
Map.add(chart);

// Outline and center San Francisco on the map.
var sfLayer = ui.Map.Layer(sanFrancisco, {color: 'FF0000'}, 'SF');
Map.layers().add(sfLayer);
Map.setCenter(-122.47, 37.7, 9);

// Create a label on the map.
var label = ui.Label('Click a point on the chart to show the image for that date.');
Map.add(label);

// When the chart is clicked, update the map and label.
chart.onClick(function(xValue, yValue, seriesName) {
  if (!xValue) return;  // Selection was cleared.

  // Show the image for the clicked date.
  var equalDate = ee.Filter.equals('system:time_start', xValue);
  var image = ee.Image(landsat8Toa.filter(equalDate).first());
  var l8Layer = ui.Map.Layer(image, {
    gamma: 1.3,
    min: 0,
    max: 0.3,
    bands: ['B4', 'B3', 'B2']
  });
  Map.layers().reset([l8Layer, sfLayer]);

  // Show a label with the date on the map.
  label.setValue((new Date(xValue)).toUTCString());
});
