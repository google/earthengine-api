// Interactive exploration of population and elevation.
// Allows filtering based on constraints and a popup info window.

// Set up the overall structure of the app, with a control panel to the left
// of a full-screen map.
ui.root.clear();
var panel = ui.Panel({style: {width: '250px'}});
var map = ui.Map();
ui.root.add(panel).add(map);
map.setCenter(120.1685, 31.2175, 8);
map.style().set('cursor', 'crosshair');

// Define some constants.
var POPULATION = 'Population';
var ELEVATION = 'Elevation';
var SLOPE = 'Slope';
var GREATER_THAN = 'Greater than';
var LESS_THAN = 'Less than';

// Create an empty list of filter constraints.
var constraints = [];

// Load the WorldPop 2015 UN-adjusted population density estimates.
// (Note that these are only available for some countries, e.g. not the US.)
var pop = ee.ImageCollection('WorldPop/POP')
  .filter(ee.Filter.equals('year', 2015))
  .filter(ee.Filter.equals('UNadj', 'yes'))
  .mosaic();
var popVis = pop.where(pop.gt(0), pop.log())
  .visualize({min:0, max:6, palette: ['0000C0', 'FFFF80', 'C00000']});

// Load SRTM 30m elevation and compute local terrain slope.
var elevation = ee.Image('USGS/SRTMGL1_003');
var elevationVis = elevation.visualize({min: 0, max: 600, gamma: 2});
var slope = ee.Terrain.slope(elevation);
var slopeVis = slope.visualize({min: 0, max: 30, gamma: 2});

// Create a layer selector that dictates which layer is visible on the map.
var select = ui.Select({
  items: [POPULATION, ELEVATION, SLOPE],
  value: POPULATION,
  onChange: redraw,
});
panel.add(ui.Label('Display Value:')).add(select);

// Check-boxes to control which layers are shown in the inspector.
panel.add(ui.Label('Info box fields:'));
var popCheck = ui.Checkbox(POPULATION).setValue(true);
panel.add(popCheck);
var elevationCheck = ui.Checkbox(ELEVATION).setValue(true);
panel.add(elevationCheck);
var slopeCheck = ui.Checkbox(SLOPE).setValue(false);
panel.add(slopeCheck);

// Create the inspector panel, initially hiding it.
var inspector = ui.Panel({style: {shown: false}});
map.add(inspector);

// Register an onClick handler that populates and shows the inspector panel.
map.onClick(function(coords) {
  // Gather the image bands into a single Image that we can asynchronously sample.
  var point = ee.Geometry.Point(coords.lon, coords.lat);
  var sample = ee.Image.cat(pop, elevation, slope)
      .unmask(0).sample(point, 30).first().toDictionary();
  sample.evaluate(function(values) {
    inspector.clear();

    // Display a label that corresponds to a checked checkbox.
    if (popCheck.getValue()) {
      inspector.add(ui.Label('Population: ' + values.population + ' people/cell'));
    }
    if (elevationCheck.getValue()) {
      inspector.add(ui.Label('Elevation: ' + values.elevation + ' meters'));
    }
    if (slopeCheck.getValue()) {
      inspector.add(ui.Label('Slope: ' + values.slope + ' degrees'));
    }
    inspector.add(ui.Button('Close', function() {
      inspector.style().set({shown: false});
    }));
    inspector.style().set({shown: true});
  });
});

// Add a label and select to enable adding a new filter.
panel.add(ui.Label('Filter by Value:'));
var constraint = ui.Select({
  items: [POPULATION, ELEVATION, SLOPE],
  placeholder: '[Choose a Variable...]',
  onChange: selectConstraint,
});
panel.add(constraint);

// Create a function that configures a new constraint.
function addConstraint(name, image, defaultValue) {
  panel.add(ui.Label('Filter by ' + name + ':'));
  var subpanel = ui.Panel({layout: ui.Panel.Layout.flow('horizontal')});
  // Create a greater-than / less-than selector.
  var mode = ui.Select({
    items: [GREATER_THAN, LESS_THAN],
    value: GREATER_THAN,
    onChange: redraw,
  });
  subpanel.add(mode);

  // Create a textbox for the filter threshold.
  var input = ui.Textbox({
    value: defaultValue,
    style: {width: '100px'},
    onChange: redraw,
  });
  subpanel.add(input);
  panel.add(subpanel);

  // Add this constraint to the global list so we can access the
  // constraints from the redraw() function in the future.
  constraints.push({
    image: image,
    mode: mode,
    value: input,
  });
  redraw();
}

// Create a function that adds a constraint of the requested type.
function selectConstraint(name) {
  if (name == POPULATION) {
    addConstraint(name, pop, 50);
  } else if (name == ELEVATION) {
    addConstraint(name, elevation, 100);
  } else if (name == SLOPE) {
    addConstraint(name, slope, 3);
  }
  constraint.setValue(null);
}

// Create a function to render a map layer configured by the user inputs.
function redraw() {
  map.layers().reset();
  var layer = select.getValue();
  var image;
  if (layer == ELEVATION) {
    image = elevationVis;
  } else if (layer == SLOPE) {
    image = slopeVis;
  } else if (layer == POPULATION) {
    image = popVis;
  }
  for (var i = 0; i < constraints.length; ++i) {
    var constraint = constraints[i];
    var mode = constraint.mode.getValue();
    var value = parseFloat(constraint.value.getValue());
    if (mode == GREATER_THAN) {
      image = image.updateMask(constraint.image.gt(value));
    } else {
      image = image.updateMask(constraint.image.lt(value));
    }
  }
  map.addLayer(image, {}, layer);
}

// Invoke the redraw function once at start up to initialize the map.
redraw();
