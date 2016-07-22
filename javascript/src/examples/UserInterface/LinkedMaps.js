// Display a grid of linked maps, each with a different visualization.

var image = ee.Image('LANDSAT/LC8_L1T_ANNUAL_TOA/2013');

var NAMES = [
  'Natural color (B4/B3/B2)',
  'Shortwave IR (B7/B5/B4)',
  'Color Infrared (B5/B4/B3)',
  'Agriculture (B6/B5/B2)'
];

var VIS_PARAMS = [
  {gamma: 1.3, min: 0, max: 0.3, bands: ['B4', 'B3', 'B2']},
  {gamma: 1.3, min: 0, max: 0.3, bands: ['B7', 'B5', 'B4']},
  {gamma: 1.3, min: 0, max: 0.3, bands: ['B5', 'B4', 'B3']},
  {gamma: 1.3, min: 0, max: 0.3, bands: ['B6', 'B5', 'B2']}
];

// Create a map for each visualization option.
var maps = [];
NAMES.forEach(function(name, index) {
  var map = ui.Map();
  map.add(ui.Label(name));
  map.addLayer(image, VIS_PARAMS[index], name);
  map.setControlVisibility(false);
  maps.push(map);
});

var linker = ui.Map.Linker(maps);

// Enable zooming on the top-left map.
maps[0].setControlVisibility({zoomControl: true});

// Show the scale (e.g. '500m') on the bottom-right map.
maps[3].setControlVisibility({scaleControl: true});

// Create a title.
var title = ui.Label('2013 Landat 8 TOA Visualizations', {
  stretch: 'horizontal',
  textAlign: 'center',
  fontWeight: 'bold',
  fontSize: '24px'
});

// Create a grid of maps.
var mapGrid = ui.Panel([
    ui.Panel([maps[0], maps[1]], null, {stretch: 'both'}),
    ui.Panel([maps[2], maps[3]], null, {stretch: 'both'})
  ],
  ui.Panel.Layout.Flow('horizontal'), {stretch: 'both'}
);

// Add the maps and title to the ui.root.
ui.root.widgets().reset([title, mapGrid]);
ui.root.setLayout(ui.Panel.Layout.Flow('vertical'));

// Center the maps near Sacramento.
maps[0].setCenter(-121.4291, 38.5868, 11);
