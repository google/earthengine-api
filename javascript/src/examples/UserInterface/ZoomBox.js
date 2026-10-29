// Compute the trend of nighttime lights from DMSP.

// Add a band containing image date as years since 1991.
function createTimeBand(img) {
  var year = ee.Date(img.get('system:time_start')).get('year').subtract(1991);
  return ee.Image(year).byte().addBands(img);
}

// Fit a linear trend to the nighttime lights collection.
var collection = ee.ImageCollection('NOAA/DMSP-OLS/NIGHTTIME_LIGHTS')
    .select('stable_lights')
    .map(createTimeBand);
var fit = collection.reduce(ee.Reducer.linearFit());

// Display trend in red/blue, brightness in green.
var visParams = {
  min: 0,
  max: [0.18, 20, -0.18],
  bands: ['scale', 'offset', 'scale']
};
Map.addLayer(fit, visParams);

Map.style().set('cursor', 'crosshair');
Map.setCenter(-95, 38, 4);

// Create a map to be used as the zoom box.
var zoomBox = ui.Map({style: {stretch: 'both'}});
zoomBox.setControlVisibility(false);
zoomBox.addLayer(fit, visParams);
zoomBox.setCenter(-115.13, 36.18, 8);

// Instruction label.
var instructionLabel = ui.Label('Click the main map to move this view', {
  position: 'top-center',
  padding: '8px',
  color: 'black',
  backgroundColor: 'rgba(255, 255, 255, 0.8)',
  fontWeight: 'bold',
  fontSize: '12px'
});
zoomBox.add(instructionLabel);

// Bounds logic.
var isMapReady = false;
var isFirstClick = true;

var updateOutline = function() {
  var bounds = zoomBox.getBounds();
  if (!bounds || !Array.isArray(bounds)) return;

  try {
    var outline = ee.Geometry.Rectangle(bounds);
    var layer = ui.Map.Layer(outline, {color: 'FFFFFF'}, 'Zoom Box Bounds');
    Map.layers().set(1, layer);
  } catch (e) {
    // Ignore geometry errors during initialization
  }
};

zoomBox.onChangeBounds(function() {
  if (!isMapReady) return;
  updateOutline();
});

// Delay initial bounds drawing to allow map to initialize.
ui.util.setTimeout(function() {
  isMapReady = true;
  updateOutline();
}, 1000);

// Interaction.
Map.onClick(function(coords) {
  if (isFirstClick) {
    zoomBox.remove(instructionLabel);
    isFirstClick = false;
  }
  zoomBox.setCenter(coords.lon, coords.lat, 8);
});

// Layout.
var panel = ui.Panel({
  widgets: [zoomBox],
  style: {
    position: 'top-right',
    height: '300px',
    width: '300px',
    border: '1px solid white',
    padding: '0'
  }
});

Map.add(ui.Label('Night Light Trends'));
Map.add(panel);