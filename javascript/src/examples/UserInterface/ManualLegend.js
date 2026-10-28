// Display a legend explaining the colors assigned to a MODIS land cover
// classification image.
var BAND_NAME = 'LC_Type1';

var image = ee.Image('MODIS/061/MCD12Q1/2001_01_01')
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

// List of IGBP class palette colors and class names for LC_Type1.
var palette = [
  '05450a', '086a10', '54a708', '78d203', '009900', 'c6b044', 'dcd159',
  'dade48', 'fbff13', 'b6ff05', '27ff87', 'c24f44', 'a5a5a5', 'ff6d4c',
  '69fff8', 'f9ffa4', '1c0dff'
];
var names = [
  'Evergreen Needleleaf Forests',
  'Evergreen Broadleaf Forests',
  'Deciduous Needleleaf Forests',
  'Deciduous Broadleaf Forests',
  'Mixed Forests',
  'Closed Shrublands',
  'Open Shrublands',
  'Woody Savannas',
  'Savannas',
  'Grasslands',
  'Permanent Wetlands',
  'Croplands',
  'Urban and Built-up Lands',
  'Cropland/Natural Vegetation Mosaics',
  'Permanent Snow and Ice',
  'Barren',
  'Water Bodies'
];
loading.style().set('shown', false);

for (var i = 0; i < names.length; i++) {
  legend.add(makeRow(palette[i], names[i]));
}
Map.addLayer(
    image, {min: 1, max: 17, palette: palette}, 'IGBP classification');

// Add the legend to the map.
Map.setCenter(-113.41842, 40.055489, 6);
Map.add(legend);
