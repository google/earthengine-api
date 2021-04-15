// Demonstrates how to efficiently display a number of layers of a dataset along
// with a legend for each layer, and some visualization controls.


/*
 * Configure layers and locations
 */
var hansen = ee.Image('UMD/hansen/global_forest_change_2017_v1_5');
var layerProperties = {
  'Year of Loss': {
    name: 'lossyear',
    visParams: {min: 0, max: 17, palette: ['yellow', 'orange', 'red']},
    legend: [
      {'2016': 'red'}, {'...': 'orange'}, {'2000': 'yellow'},
      {'No loss': 'black'}, {'Water or no data': 'grey'}
    ],
    defaultVisibility: true
  },
  'Loss': {
    name: 'loss',
    visParams: {min: 0, max: 1, palette: ['black', 'red']},
    legend:
        [{'Loss': 'red'}, {'No loss': 'black'}, {'Water or no data': 'grey'}],
    defaultVisibility: false
  },
  'Percent Tree Cover': {
    name: 'treecover2000',
    visParams: {min: 0, max: 100, palette: ['black', 'green']},
    legend: [
      {'75-100%': '#00ff00'}, {'50-75%': '#00aa00'}, {'25-50%': '#005500'},
      {'0-25%': '#000000'}, {'Water or no data': '#404040'}
    ],
    defaultVisibility: false
  }
};

// Some pre-set locations of interest that will be loaded into a pulldown menu.
var locationDict = {
  'Deforestation in Paraguay': {lon: -60.3726, lat: -21.7416, zoom: 8},
  'Tornado in Alabama': {lon: -87.332, lat: 33.313, zoom: 11}
};


/*
 * Map panel configuration
 */

// Now let's do some overall layout.
// Create a map panel.
var mapPanel = ui.Map();

// Take all tools off the map except the zoom and mapTypeControl tools.
mapPanel.setControlVisibility(
    {all: false, zoomControl: true, mapTypeControl: true});

// Center the map
var defaultLocation = locationDict['Deforestation in Paraguay'];
mapPanel.setCenter(
    defaultLocation.lon, defaultLocation.lat, defaultLocation.zoom);

// Add these to the interface.
ui.root.widgets().reset([mapPanel]);
ui.root.setLayout(ui.Panel.Layout.flow('horizontal'));

// Add layers to the map and center it.
for (var key in layerProperties) {
  var layer = layerProperties[key];
  var image = hansen.select(layer.name).visualize(layer.visParams);
  var masked = addZeroAndWaterMask(image, hansen.select(layer.name));
  mapPanel.add(ui.Map.Layer(masked, {}, key, layer.defaultVisibility));
}

// Draws black and gray overlays for nodata/water/zero values.
function addZeroAndWaterMask(visualized, original) {
  // Places where there is nodata or water are drawn in gray.
  var water =
      hansen.select('datamask').neq(1).selfMask().visualize({palette: 'gray'});
  // Places where the underlying value is zero are drawn in black.
  var zero = original.eq(0).selfMask().visualize({palette: 'black'});
  // Stack the images, with the gray on top, black next, and the original below.
  return ee.ImageCollection([visualized, zero, water]).mosaic();
}


/*
 * Additional component configuration
 */

// Add a title and some explanatory text to a side panel.
var header = ui.Label('Global Forest Change', {fontSize: '36px', color: 'red'});
var text = ui.Label(
    'Results from analysis of Landsat images characterizing forest extent and change.',
    {fontSize: '11px'});

var toolPanel = ui.Panel([header, text], 'flow', {width: '300px'});
ui.root.widgets().add(toolPanel);

// Create a hyperlink to an external reference.
var link = ui.Label(
    'Science paper by Hansen, Potapov, Moore, Hancher et al.', {},
    'http://science.sciencemag.org/content/342/6160/850');
var linkPanel = ui.Panel(
    [ui.Label('For more information', {fontWeight: 'bold'}), link]);
toolPanel.add(linkPanel);

// Create a layer selector pulldown.
// The elements of the pulldown are the keys of the layerProperties dictionary.
var selectItems = Object.keys(layerProperties);

// Define the pulldown menu.  Changing the pulldown menu changes the map layer
// and legend.
var layerSelect = ui.Select({
  items: selectItems,
  value: selectItems[0],
  onChange: function(selected) {
    // Loop through the map layers and compare the selected element to the name
    // of the layer. If they're the same, show the layer and set the
    // corresponding legend.  Hide the others.
    mapPanel.layers().forEach(function(element, index) {
      element.setShown(selected == element.getName());
    });
    setLegend(layerProperties[selected].legend);
  }
});

// Add the select to the toolPanel with some explanatory text.
toolPanel.add(ui.Label('View Different Layers', {'font-size': '24px'}));
toolPanel.add(layerSelect);

// Create the legend.
// Define a panel for the legend and give it a tile.
var legendPanel = ui.Panel({
  style:
      {fontWeight: 'bold', fontSize: '10px', margin: '0 0 0 8px', padding: '0'}
});
toolPanel.add(legendPanel);

var legendTitle = ui.Label(
    'Legend',
    {fontWeight: 'bold', fontSize: '10px', margin: '0 0 4px 0', padding: '0'});
legendPanel.add(legendTitle);

// Define an area for the legend key itself.
// This area will be replaced every time the layer pulldown is changed.
var keyPanel = ui.Panel();
legendPanel.add(keyPanel);

function setLegend(legend) {
  // Loop through all the items in a layer's key property,
  // creates the item, and adds it to the key panel.
  keyPanel.clear();
  for (var i = 0; i < legend.length; i++) {
    var item = legend[i];
    var name = Object.keys(item)[0];
    var color = item[name];
    var colorBox = ui.Label('', {
      backgroundColor: color,
      // Use padding to give the box height and width.
      padding: '8px',
      margin: '0'
    });
    // Create the label with the description text.
    var description = ui.Label(name, {margin: '0 0 4px 6px'});
    keyPanel.add(
        ui.Panel([colorBox, description], ui.Panel.Layout.Flow('horizontal')));
  }
}

// Set the initial legend.
setLegend(layerProperties[layerSelect.getValue()].legend);

// Create a visibility checkbox and an opacity slider.
//
// If the checkbox is clicked off, disable the layer pulldown and turn all the
// layers off. Otherwise, enable the select, and turn on the selected layer.
var checkbox = ui.Checkbox({
  label: 'Opacity',
  value: true,
  onChange: function(value) {
    var selected = layerSelect.getValue();
    // Loop through the layers in the mapPanel. For each layer,
    // if the layer's name is the same as the name selected in the layer
    // pulldown, set the visibility of the layer equal to the value of the
    // checkbox. Otherwise, set the visibility to false.
    mapPanel.layers().forEach(function(element, index) {
      element.setShown(selected == element.getName() ? value : false);
    });

    // If the checkbox is on, the layer pulldown should be enabled, otherwise,
    // it's disabled.
    layerSelect.setDisabled(!value);
  }
});

// Create an opacity slider. This tool will change the opacity for each layer.
// That way switching to a new layer will maintain the chosen opacity.
var opacitySlider = ui.Slider({
  min: 0,
  max: 1,
  value: 1,
  step: 0.01,
});
opacitySlider.onSlide(function(value) {
  mapPanel.layers().forEach(function(element, index) {
    element.setOpacity(value);
  });
});

var viewPanel =
    ui.Panel([checkbox, opacitySlider], ui.Panel.Layout.Flow('horizontal'));
toolPanel.add(viewPanel);

// Create the location pulldown.
var locations = Object.keys(locationDict);
var locationSelect = ui.Select({
  items: locations,
  value: locations[0],
  onChange: function(value) {
    var location = locationDict[value];
    mapPanel.setCenter(location.lon, location.lat, location.zoom);
  }
});

var locationPanel = ui.Panel([
  ui.Label('Visit Example Locations', {'font-size': '24px'}), locationSelect
]);
toolPanel.add(locationPanel);
