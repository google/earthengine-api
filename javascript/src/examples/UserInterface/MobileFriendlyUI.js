/**
 * Demonstrates a mobile friendly user interface with ui.root.onResize().
 */

// Create the map to be reused.
var waterMap = ui.Map();

// Add the water layer to the map.
var water = ee.ImageCollection('GLCF/GLS_WATER').select('water');

// Water class names.
var classNames = ['Land', 'Water', 'Snow/ice', 'Cloud shadow', 'Cloud'];
var palette = ['F0E68C', '00C5FF', 'FAFAFA', '828282', 'CCCCCC'];

// Fill the palette with white for the values between
// 4 (snow) and 200 (cloud shadow).
function fillPalette(times) {
  var resultPalette = palette.slice(0, 3);
  for (var i = 0; i < times; i++) {
    resultPalette.push('FAFAFA');
  }
  resultPalette.push('828282', 'CCCCCC');
  return resultPalette;
}

var waterVis = {
  min: 1.0,
  max: 201.0,
  palette: fillPalette(200 - 4 - 1),
};

waterMap.addLayer(water, waterVis, 'Water');

// Create the main panel with different sections.
var uiComponents = {};
uiComponents.initialize = function(mobileStyle) {
  // The introduction section.
  uiComponents.intro = {
    panel: ui.Panel({
      widgets: [
        ui.Label({
          value: 'Landsat Global Inland Water',
          style: {
            fontWeight: 'bold',
            fontSize: mobileStyle ? '22px' : '20px',
            margin: '10px 5px',
            textAlign: 'center',
          }
        }),
        ui.Label({
          value: 'The Global Inland Water dataset shows inland surface ' +
              'water bodies, including fresh and saline lakes, ' +
              'rivers, and reservoirs.',
          style: {
            fontSize: mobileStyle ? '18px' : '14px',
          }
        }),
        ui.Label({
          value: 'From the GLS 2000 epoch, 3,650,723 km2 of inland water ' +
              'were identified, around three quarters of which were ' +
              'in North America and Asia. Boreal forests and tundra ' +
              'hold the largest portion of inland water, about 40% of ' +
              'the global total. The data exhibits strong linear ' +
              'correlation with both the MODIS dataset as well as 30-m ' +
              'resolution datasets over the United States and Canada. ' +
              'Residual errors were due primarily to the seasonality ' +
              'of water cover, snow and ice, and residual clouds.',
          style: {
            fontSize: mobileStyle ? '18px' : '14px',
          }
        }),
        ui.Button({
          label: 'Close',
          style: {position: 'bottom-right', shown: mobileStyle ? true : false},
          // React to the button's click event.
          onClick: function() {
            ui.root.widgets().add(uiComponents.legend);
            waterMap.remove(uiComponents.intro.panel);
          }
        })
      ]
    }),

    // A Learn More button for mobile screens.
    learnMoreButton: ui.Button({
      label: 'Learn More',
      style: {
        position: 'top-left',
        padding: '0',
      },
      // React to the button's click event.
      onClick: function() {
        ui.root.widgets().remove(uiComponents.legend);
        waterMap.add(uiComponents.intro.panel);
      }
    }),
  };

  // Legend title.
  uiComponents.legendTitle = ui.Label({
    value: 'Water Class',
    style: {
      fontWeight: 'bold',
      fontSize: mobileStyle ? '18px' : '16px',
      margin: '50px 0 6px 0',
      padding: '0'
    }
  });

  // Legend panel
  uiComponents.legend = ui.Panel({
    style: mobileStyle ? {position: 'bottom-left', padding: '10px'} : {
      fontWeight: 'bold',
      fontSize: '10px',
      margin: '0 0 10px 12px',
      padding: '0'
    }
  });

  if (!mobileStyle) {
    uiComponents.legend.add(uiComponents.legendTitle);
  }

  // Creates and styles 1 row of the legend.
  var makeLegendRow = function(name, color, mobileStyle) {
    // Create the label that is actually the colored box.
    var colorBox = ui.Label({
      style: {
        backgroundColor: '#' + color,
        // Use padding to give the box height and width.
        padding: mobileStyle ? '10px' : '8px',
        margin: '0 0 4px 0',
        border: 'solid 0.5px',
      }
    });

    // Create the label filled with the description text.
    var description = ui.Label({
      value: name,
      style: {margin: '0 0 4px 6px', fontSize: mobileStyle ? '16px' : '12px'},
    });

    return ui.Panel({
      widgets: [colorBox, description],
      layout: ui.Panel.Layout.Flow('horizontal')
    });
  };

  for (var i = 0; i < classNames.length; i++) {
    uiComponents.legend.add(makeLegendRow(classNames[i], palette[i], mobileStyle));
  }
};

// The function that configures different devices according to screen sizes.
function configLayout(deviceInfo) {
  ui.root.clear();
  if (!deviceInfo.is_desktop || deviceInfo.width < 900) {
    // Configuration for mobile screen.
    uiComponents.initialize(true);
    waterMap.setControlVisibility(false);
    waterMap.setCenter(20, 30, 3);

    // Add "learn more" button if it hasn't been added to the map.
    if (waterMap.widgets().length() < 1) {
      waterMap.add(uiComponents.intro.learnMoreButton);
    }
    ui.root.widgets().reset([waterMap, uiComponents.legend]);
    ui.root.setLayout(ui.Panel.Layout.absolute());
  } else {
    // Web page configuration.
    uiComponents.initialize(false);
    waterMap.setControlVisibility(true);
    waterMap.setCenter(20, 30, 2);

    // Remove button if it has been added to the map.
    if (waterMap.widgets().length() > 0) {
      waterMap.widgets().reset();
    }

    var mainPanel = ui.Panel({
      widgets: [
        uiComponents.intro.panel,
        uiComponents.legend,
      ],
      style: {width: '320px', padding: '8px'}
    });
    ui.root.widgets().reset([mainPanel, waterMap]);
    ui.root.setLayout(ui.Panel.Layout.flow('horizontal'));
  }
}

ui.root.onResize(configLayout);
