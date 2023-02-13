// This script allows you to interactively explore the effects
// of mosaicking different Landsat 8 TOA images using ee.Reducer.median().


/*
 * Style defaults
 */

var colors = {'cyan': '#24C1E0', 'transparent': '#11ffee00', 'gray': '#F8F9FA'};

var TITLE_STYLE = {
  fontWeight: '100',
  fontSize: '32px',
  padding: '10px',
  color: '#616161',
  backgroundColor: colors.transparent,
};

var PARAGRAPH_STYLE = {
  fontSize: '14px',
  fontWeight: '50',
  color: '#9E9E9E',
  padding: '8px',
  backgroundColor: colors.transparent,
};

var LABEL_STYLE = {
  fontWeight: '50',
  textAlign: 'center',
  fontSize: '11px',
  backgroundColor: colors.transparent,
};

var THUMBNAIL_WIDTH = 128;

var BORDER_STYLE = '4px solid rgba(97, 97, 97, 0.05)';


/*
 * Collection display defaults
 */

// Landsat 8 TOA.
var COLLECTION_ID = 'LANDSAT/LC08/C02/T1_TOA';
var START_DATE = '2017-01-01';
var END_DATE = '2018-01-01';
var VIZ_PARAMS = {bands: ['B4', 'B3', 'B2'], min: 0, max: 0.4, gamma: 1.5};

var BASE_COLLECTION = ee.ImageCollection(COLLECTION_ID)
                          .filter(ee.Filter.lte('CLOUD_COVER', 50))
                          .filterDate(START_DATE, END_DATE);

// Max number of images to use when generating a mosaic.
var MAX_MOSAIC_SIZE = 20;


/*
 * Side panel setup
 */

/**
 * Return the main side panel, populated with title and app description.
 */
function makeSidePanel() {
  // Create the base side panel, into which other widgets will be added.
  var mainPanel = ui.Panel({
    layout: ui.Panel.Layout.flow('vertical', true),
    style: {
      stretch: 'horizontal',
      height: '100%',
      width: '550px',
      backgroundColor: colors.gray,
      border: BORDER_STYLE,
    }
  });

  // Add the app title to the side panel.
  var titleLabel = ui.Label('Collection Mosaic Editor', TITLE_STYLE);
  mainPanel.add(titleLabel);

  // Add the app description to the main panel.
  var descriptionText =
      'This app allows you to interactively explore the effects of ' +
      'mosaicking different Landsat 8 TOA images using ee.Reducer.median(). ' +
      'To change which tiles are included in the mosaick, check or uncheck ' +
      'the thumbnails. To mosaic another area, pan/zoom and click on the map.';
  var descriptionLabel = ui.Label(descriptionText, PARAGRAPH_STYLE);
  mainPanel.add(descriptionLabel);

  return mainPanel;
}


/*
 * Thumbnail setup
 */

/**
 * Return the grid panel where thumbnails will be added.
 */
function makeThumbnailGrid() {
  return ui.Panel({
    layout: ui.Panel.Layout.flow('horizontal', true),
    style: {
      stretch: 'vertical',
      backgroundColor: colors.transparent,
    }
  });
}

/**
 * Return a panel containing the thumbnail and label for an image with
 * the given ID and geometry.
 * @param {string} id The id of the image from which to make the thumbnail.
 * @param {Function} onChangeFunc The function to call when thumbnail is checked/unchecked.
 */
function makeThumbnail(id, onChangeFunc) {
  var thumbnailContainer = ui.Panel({
    layout: ui.Panel.Layout.flow('vertical'),
    style: {
      backgroundColor: colors.transparent,
      border: BORDER_STYLE,
      padding: '4px',
      margin: '5px',
    },
  });

  // Add an image label to the thumbnail container.
  var idPieces = id.split('/');
  var shortImageId = idPieces[idPieces.length - 1];
  var imageLabel = ui.Label(shortImageId, LABEL_STYLE);
  thumbnailContainer.add(imageLabel);

  // Add the thumbnail itself to the container.
  var thumbnail = ui.Thumbnail({
    image: ee.Image(id).visualize(VIZ_PARAMS),
    params: {dimensions: THUMBNAIL_WIDTH, crs: 'EPSG:3857', format: 'jpg'},
    style: {
      width: THUMBNAIL_WIDTH + 'px',
      maxHeight: THUMBNAIL_WIDTH + 25 + 'px',
      backgroundColor: colors.transparent,
    }
  });
  thumbnailContainer.add(thumbnail);

  // Add the checkbox to specify which thumbnails to include in the mosaic.
  var checkbox = ui.Checkbox('Include', true, onChangeFunc, false, LABEL_STYLE);
  thumbnailContainer.add(checkbox);

  return thumbnailContainer;
}


/*
 * Map panel setup
 */

/** Returns a ui.Map with some UI configuration in place. */
function makeMapPanel() {
  var map = ui.Map();
  // Add an informational label
  map.add(ui.Label('Click the map to compute a mosaic at that location'));
  map.style().set('cursor', 'crosshair');
  // Don't show the layer list for this app.
  map.setControlVisibility({layerList: false});
  return map;
}


/*
 * Helper methods
 */

/**
 * Recomputes a mosaic with the supplied IDs and adds it to the mapPanel.
 */
function updateMosaic(ids, mapPanel) {
  if (ids.length === 0) {
    mapPanel.layers().set(0, ee.Image());
    return;
  }
  var mosaickedImage = ee.ImageCollection(ids).median();
  mapPanel.layers().set(0, mosaickedImage.visualize(VIZ_PARAMS));
}


/**
 * Given a thumbnailGrid widget, determines which thumbnails have been selected
 * by the user to include in a new mosaic.
 */
function findSelectedThumbnails(thumbnailGrid) {
  var thumbs = thumbnailGrid.widgets();
  var ids = [];
  thumbs.forEach(function f(e) {
    var id = e.widgets().get(0).getValue();
    var checked = e.widgets().get(2).getValue();
    if (checked) {
      ids.push(COLLECTION_ID + '/' + id);
    }
  });
  return ids;
}

/**
 * Updates the mapPanel and thumbnailGrid widgets when a new bounding box has
 * been chosen on the map.
 */
function updateUI(geometry, mapPanel, thumbnailGrid) {
  var images = BASE_COLLECTION.filterBounds(geometry);
  var first = ee.Image(images.first());
  images = images.filterBounds(first.geometry().centroid());

  // Repopulate the thumbnail grid with new thumbnails.
  thumbnailGrid.clear();
  images.limit(MAX_MOSAIC_SIZE)
      .aggregate_array('system:id')
      .evaluate(function(ids) {
        // Sometimes there are no images where the user has clicked.
        if (ids === undefined) {
          return;
        }

        // Define the function to be called when thumbnails are clicked or
        // unclicked.
        var remosaicFunc = function() {
          var ids = findSelectedThumbnails(thumbnailGrid);
          updateMosaic(ids, mapPanel);
        };

        ids.forEach(function(id) {
          var thumb = makeThumbnail(id, remosaicFunc);
          thumbnailGrid.add(thumb);
        });

        // Recompute the mosaic from the new image IDs and add to the mapPanel.
        updateMosaic(ids, mapPanel);

        // Center the map to the new mosaic.
        mapPanel.centerObject(first);
      });
}


/*
 * Main app initialization
 */

// Clear the default UI since we're adding our own side and map panels.
ui.root.clear();

// Create the app's two panels and add them to the ui.root
var sidePanel = makeSidePanel();
var mapPanel = makeMapPanel();

// Use a SplitPanel so it's possible to resize the two panels.
ui.root.add(ui.SplitPanel(sidePanel, mapPanel));

// Add the thumbnail grid to the side panel.
var thumbnailGrid = makeThumbnailGrid();
sidePanel.add(thumbnailGrid);

// Add a click event to the map panel.
mapPanel.onClick(function(coords) {
  var point = ee.Geometry.Point(coords.lon, coords.lat);
  var dot = ui.Map.Layer(point, {color: colors.cyan});
  point.evaluate(function(geometryBbox) {
    updateUI(geometryBbox, mapPanel, thumbnailGrid);
  });
  // Set the dot to 1 so it's visible on top of the mosaic.
  mapPanel.layers().set(1, dot);
});

// Launch the app with an initial point pre-selected.
var initGeometry = ee.Geometry.Point([-79.91, 43.62]);
mapPanel.centerObject(initGeometry);
updateUI(initGeometry, mapPanel, thumbnailGrid);
