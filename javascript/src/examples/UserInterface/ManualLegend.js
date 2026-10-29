// Display a legend explaining the colors assigned to a MODIS land cover
// classification image.
var BAND_NAME = 'Land_Cover_Type_1';

var image = ee.Image('MODIS/051/MCD12Q1/2001_01_01')
            .select(BAND_NAME);

// Create the panel for the legend items.
var legend = ui.Panel({
  style: {
    position: 'bottom-left',
    padding: '8px 15px'
  }
});

// Create and add the legend title.
var legendTitle = ui.Label({
  value: 'MODIS Land Cover',
  style: {
    fontWeight: 'bold',
    fontSize: '18px',
    margin: '0 0 4px 0',
    padding: '0'
  }
});
legend.add(legendTitle);

var loading = ui.Label('Loading legend...', {margin: '2px 0 4px 0'});
legend.add(loading);

// Creates and styles 1 row of the legend.
var makeRow = function(color, name) {
  // Create the label that is actually the colored box.
  var colorBox = ui.Label({
    style: {
      backgroundColor: '#' + color,
      // Use padding to give the box height and width.
      padding: '8px',
      margin: '0 0 4px 0'
    }
  });

  // Create the label filled with the description text.
  var description = ui.Label({
    value: name,
    style: {margin: '0 0 4px 6px'}
  });

  return ui.Panel({
    widgets: [colorBox, description],
    layout: ui.Panel.Layout.Flow('horizontal')
  });
};

// Get the list of palette colors and class names from the image.
image.toDictionary().select([BAND_NAME + ".*"]).evaluate(function(result) {
  var palette = result[BAND_NAME + "_class_palette"];
  var names = result[BAND_NAME + "_class_names"];
  loading.style().set('shown', false);

  for (var i = 0; i < names.length; i++) {
    legend.add(makeRow(palette[i], names[i]));
  }
  Map.addLayer(image, {min: 0, max: 17, palette: palette}, 'IGBP classification');
});

// Add the legend to the map.
Map.setCenter(-113.41842, 40.055489, 6);
Map.add(legend);
