// Desmontrate asynchronous updating of UI elements through evaluate().

// Filter a collection to a time of interest.
var l8 = ee.ImageCollection('LANDSAT/LC08/C01/T1_TOA')
    .filterDate('2014-06-01', '2015-06-01');

var ndvi = l8.map(function(image) {
  return image.select().addBands(image.normalizedDifference(['B5', 'B4']));
});

// Nice visualization parameters for a vegetation index.
var vis = {min: 0, max: 1, palette: [
  'FFFFFF', 'CE7E45', 'FCD163', '66A000', '207401',
  '056201', '004C00', '023B01', '012E01', '011301']};
Map.addLayer(ndvi, vis, 'NDVI');
Map.setCenter(-94.84497, 39.01918, 8);

// Create an inspector panel with a horizontal layout.
var inspector = ui.Panel({
  layout: ui.Panel.Layout.flow('horizontal')
});

// Add a label to the panel.
inspector.add(ui.Label('Click to get mean NDVI'));

// Add the panel to the default map.
Map.add(inspector);

// Set the default map's cursor to a "crosshair".
Map.style().set('cursor', 'crosshair');

// Register a callback on the map to be invoked when the map is clicked.
Map.onClick(function(coords) {
  // Clear the panel and show a loading message.
  inspector.clear();
  inspector.style().set('shown', true);
  inspector.add(ui.Label('Loading...', {color: 'gray'}));

  // Compute the mean NDVI; a potentially long-running server operation.
  var point = ee.Geometry.Point(coords.lon, coords.lat);
  var temporalMean = ndvi.reduce(ee.Reducer.mean());
  var sampledPoint = temporalMean.reduceRegion(ee.Reducer.mean(), point, 30);
  var computedValue = sampledPoint.get('nd_mean');

  // Request the value from the server and use the results in a function.
  computedValue.evaluate(function(result) {
    inspector.clear();

    // Add a label with the results from the server.
    inspector.add(ui.Label({
      value: 'Mean NDVI: ' + result.toFixed(2),
      style: {stretch: 'vertical'}
    }));

    // Add a button to hide the Panel.
    inspector.add(ui.Button({
      label: 'Close',
      onClick: function() {
        inspector.style().set('shown', false);
      }
    }));
  });
});
