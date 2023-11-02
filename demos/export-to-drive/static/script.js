/**
 * @fileoverview Runs the application. The code is executed in
 * the user's browser. It communicates with the App Engine backend, renders
 * output to the screen, and handles user interactions.
 */


exporter = {};  // Our namespace.


/**
 * Starts the application. The main entry point for the app.
 * @param {string} channelToken The token used for Channel API communication
 *     with the App Engine backend.
 * @param {string} clientId The ID of this client for the Channel API.
 */
exporter.boot = function(channelToken, clientId) {
  var app = new exporter.App(channelToken, clientId);
};


///////////////////////////////////////////////////////////////////////////////
//                               The application.                            //
///////////////////////////////////////////////////////////////////////////////


/**
 * The main application.
 * This constructor renders the UI and sets up event handling.
 * @unrestricted
 */
exporter.App = class {
  /**
   * @param {string} channelToken The token used for Channel API communication
   *     with the App Engine backend.
   * @param {string} clientId The ID of this client for the Channel API.
   */
  constructor(channelToken, clientId) {
    // The Google Map.
    this.map = exporter.App.createMap($('.map').get(0));

    // The drawing manager, for drawing on the Google Map.
    this.drawingManager = exporter.App.createDrawingManager(this.map);

    // Outstanding map ID requests, keyed by layer name.
    // Used to cancel no-longer-needed requests if the user changes dates before
    // an outstanding map ID is returned.
    this.layerRequests = {};

    // Outstanding URL paths for the current map IDs, keyed by layer name.
    // Used to avoid needlessly changing the layer when the layer requested is
    // the same as the current layer.
    this.layerPaths = {};

    // The ID of this client for socket communication with App Engine.
    this.clientId = clientId;

    // The channel used for communication with our App Engine backend.
    this.channel = new goog.appengine.Channel(channelToken);

    // Initialize the UI components.
    this.initDatePicker();
    this.initRegionPicker();
    this.initExport();

    // Load the default image.
    this.refreshImage();
  }

  //////////////////////////////////////////////////////////////////////////////
  //                               Date picker.                               //
  //////////////////////////////////////////////////////////////////////////////

  /** Initializes the date picker. */
  initDatePicker() {
    // Create the date pickers.
    $('.date-picker').datepicker({
      format: ' yyyy',  // Notice the Extra space at the beginning
      viewMode: 'years',
      minViewMode: 'years',
      autoclose: true,
      startDate: new Date('1992'),
      endDate: new Date('2013')
    });

    // Set default date.
    $('.date-picker').datepicker('update', '2000');

    // Respond when the user updates the dates.
    $('.date-picker').change(this.refreshImage.bind(this));
  }

  /**
   * Returns the currently selected year as a parameter.
   * @return {Object} The current year in a dictionary.
   */
  getYearParam() {
    return {year: parseInt($('.date-picker').val())};
  }

  //////////////////////////////////////////////////////////////////////////////
  //                           Region selection.                              //
  //////////////////////////////////////////////////////////////////////////////

  /** Initializes the region picker. */
  initRegionPicker() {
    // Respond when the user chooses to draw a polygon.
    $('.region .draw').click(this.setDrawingModeEnabled.bind(this, true));

    // Respond when the user draws a polygon on the map.
    google.maps.event.addListener(
        this.drawingManager, 'overlaycomplete',
        (function(event) {
          if (this.getDrawingModeEnabled()) {
            this.handleNewPolygon(event.overlay);
          } else {
            event.overlay.setMap(null);
          }
        }).bind(this));

    // Cancel drawing mode if the user presses escape.
    $(document).keydown((function(event) {
                          if (event.which == 27)
                            this.setDrawingModeEnabled(false);
                        }).bind(this));

    // Respond when the user cancels polygon drawing.
    $('.region .cancel').click(this.setDrawingModeEnabled.bind(this, false));

    // Respond when the user clears the polygon.
    $('.region .clear').click(this.clearPolygon.bind(this));
  }

  /**
   * Returns the coordinates of the currently drawn polygon.
   * @return {Array<Array<number>>} A list of coordinates describing
   *     the currently drawn polygon (or null if no polygon is drawn).
   */
  getPolygonCoordinates() {
    var points = this.currentPolygon.getPath().getArray();
    var twoDimensionalArray = points.map(function(point) {
      return [point.lng(), point.lat()];
    });
    return twoDimensionalArray;
  }

  /**
   * Sets whether drawing on the map is enabled.
   * @param {boolean} enabled Whether drawing mode is enabled.
   */
  setDrawingModeEnabled(enabled) {
    $('.region').toggleClass('drawing', enabled);
    var mode = enabled ? google.maps.drawing.OverlayType.POLYGON : null;
    this.drawingManager.setOptions({drawingMode: mode});
  }

  /**
   * Sets whether drawing on the map is enabled.
   * @return {boolean} Whether drawing mode is enabled.
   */
  getDrawingModeEnabled() {
    return $('.region').hasClass('drawing');
  }

  /** Clears the current polygon from the map and enables drawing. */
  clearPolygon() {
    this.currentPolygon.setMap(null);
    $('.region').removeClass('selected');
    $('.export').attr('disabled', true);
  }

  /**
   * Stores the current polygon drawn on the map and disables drawing.
   * @param {Object} opt_overlay The new polygon drawn on the map. If
   *     undefined, the default polygon is treated as the new polygon.
   */
  handleNewPolygon(opt_overlay) {
    this.currentPolygon = opt_overlay;
    $('.region').addClass('selected');
    $('.export').attr('disabled', false);
    this.setDrawingModeEnabled(false);
  }

  //////////////////////////////////////////////////////////////////////////////
  //                                   Alerts.                                //
  //////////////////////////////////////////////////////////////////////////////

  /**
   * Sets the alert with the given name to the have the class and content given.
   * The alert is created if it doesn't already exist.
   * @param {string} name The name of the alert to set.
   * @param {string} cls The type of the alert for Bootstrap CSS styling.
   * @param {string} line1 The first line of the alert text.
   * @param {string=} opt_line2 The second line of the alert text.
   */
  setAlert(name, cls, line1, opt_line2) {
    var alert;
    var existing = this.findAlert(name);
    if (existing) {
      // Replace the contents of the existing alert, if any.
      $('.alert[data-alert-name="' + name + '"] p').remove();
      alert = existing.removeClass().addClass(
          'alert alert-dismissable alert-' + cls);
    } else {
      // Create a new alert if needed.
      alert = $('.templates .alert')
                  .clone()
                  .addClass('alert-' + cls)
                  .attr('data-alert-name', name);
      $('.alerts').append(alert);
    }
    alert.append($('<p/>').append(line1))
        .append($('<p/>', {class: 'line2'}).append(opt_line2))
        .addClass('visible');
  }

  /**
   * Removes the alert with the given name.
   * @param {string} name The name of the alert to remove.
   */
  removeAlert(name) {
    var cur = this.findAlert(name);
    if (cur) {
      cur.removeClass('visible');
      // Remove the alert once its animation finishes.
      cur.on('transitionend', function() {
        if (!cur.hasClass('visible')) {
          cur.remove();
        }
      });
    }
  }

  /**
   * Finds the alert with the given name, if any.
   * @param {string} name The name of the alert to find.
   * @return {Object} The jQuery DOM wrapper for the alert with the given name.
   */
  findAlert(name) {
    var existing = $('.alert[data-alert-name="' + name + '"]');
    return existing.length ? existing : undefined;
  }

  //////////////////////////////////////////////////////////////////////////////
  //                             Layer management.                            //
  //////////////////////////////////////////////////////////////////////////////

  /** Updates the image based on the current control panel config. */
  refreshImage() {
    var name = 'lights';
    var params = $.param(this.getYearParam());
    var path = '/mapid?' + params;
    if (this.layerPaths[name] == path) {
      return;  // If the map hasn't changed since the last update, exit early.
    } else {
      this.removeLayer(name);
      // Encode the parameters in the URL.
      this.setLayer(name, path, false);
    }
  }

  /**
   * Sets the layer with the given name to the map returned by mapIdPath. The
   * layer is created if it doesn't already exist.
   * @param {string} name The name of the layer to set.
   * @param {string} mapIdPath The URL path at which to request
   * @param {boolean} addOnTop Whether to add this layer on top.
   */
  setLayer(name, mapIdPath, addOnTop) {
    this.removeLayer(name);
    var showLoadingFn = this.setAlert.bind(
        this, name, 'warning', 'Map layer "' + name + '" is loading.');

    var onError = (function(error) {
                    delete this.layerPaths[name];
                    this.setAlert(
                        name, 'danger',
                        'Map layer "' + name + '" failed to load.', error);
                  }).bind(this);

    var onDone = (function(data) {
                   // Create the layer.
                   const tileSource = new ee.layers.EarthEngineTileSource(data);
                   const layer =
                       new ee.layers.ImageOverlay(tileSource, {name: name});

                   // Add the layer to the map.
                   if (addOnTop) {
                     this.map.overlayMapTypes.push(layer);
                   } else {
                     this.map.overlayMapTypes.insertAt(0, layer);
                   }

                   // Hide and show the 'layer loading' alert as needed.
                   layer.addTileCallback(
                       (function(event) {
                         showLoadingFn(event.count + ' tiles remaining.');
                         if (event.count === 0) {
                           this.removeAlert(name);
                         }
                       }).bind(this));
                 }).bind(this);

    showLoadingFn();
    this.layerPaths[name] = mapIdPath;
    this.layerRequests[name] =
        exporter.App.handleRequest($.get(mapIdPath), onDone, onError);
  }

  /**
   * Removes the map layer(s) with the given name.
   * @param {string} name The name of the layer(s) to remove.
   */
  removeLayer(name) {
    // Cancel any outstanding requests to avoid calling the callback (which
    // would add the now-obsolete layer to the map).
    if (this.layerRequests[name]) {
      this.layerRequests[name].abort();
      delete this.layerRequests[name];
    }
    // Delete the current path.
    delete this.layerPaths[name];
    this.removeAlert(name);
    this.map.overlayMapTypes.forEach((function(mapType, index) {
                                       if (mapType && mapType.name == name) {
                                         this.map.overlayMapTypes.removeAt(
                                             index);
                                       }
                                     }).bind(this));
  }

  //////////////////////////////////////////////////////////////////////////////
  //                                Exporting.                                //
  //////////////////////////////////////////////////////////////////////////////

  /** Initializes export functionality. */
  initExport() {
    this.channel.open({
      'onmessage': (function(message) {
                     var data = JSON.parse(message.data);
                     var filename = data.filename;
                     var alertId = 'export-' + filename;
                     if (data.error) {
                       this.setAlert(
                           alertId, 'danger',
                           'Export of "' + filename + '" failed.', data.error);
                     } else {
                       var link = $('<a/>', {
                         href: data.link,
                         target: '_blank',
                         text: 'Open in Google Drive'
                       });

                       var isMultipleFiles =
                           data.link.indexOf('open?id=') == -1;
                       var line2;
                       if (isMultipleFiles) {
                         line2 = $('<span/>').append(link).append(
                             '<span class="multifile">(multiple files)</span>');
                       } else {
                         line2 = link;
                       }

                       this.setAlert(
                           alertId, 'success',
                           'Export of "' + filename + '" complete.', line2);
                     }
                   }).bind(this),
      'onopen': $.noop,
      'onerror': $.noop,
      'onclose': $.noop
    });

    // Respond when the user clicks export.
    $('.export').click(this.exportImage.bind(this));
  }

  /**
   * Returns the filename entered in the input box or a generated default
   * filename if none.
   * @return {string} The name to give the exported file in the user's Drive.
   */
  getFilename() {
    var userProvidedFilename = $('.filename').val();
    if (userProvidedFilename) {
      return userProvidedFilename;
    } else {
      return 'Lights_Export_' +
          (new Date()).toISOString().replace(/[^0-9]/g, '');
    }
  }

  /**
   * Exports the currently configured image to Drive.
   * When the exported image is ready, it will be shared with the current user.
   */
  exportImage() {
    var filename = this.getFilename();
    var params = this.getYearParam();
    params.coordinates = JSON.stringify(this.getPolygonCoordinates());
    params.filename = filename;
    params.client_id = this.clientId;
    this.setAlert(
        'export-' + filename, 'info',
        'Export of "' + filename + '" in progress.');
    exporter.App.handleRequest(
        $.post('/export', params), null,
        this.setAlert.bind(
            this, 'export-' + filename, 'danger', 'Export failed.'));
  }

  //////////////////////////////////////////////////////////////////////////////
  //                        Static helpers & constants.                       //
  //////////////////////////////////////////////////////////////////////////////

  /**
   * Creates a Google Map with the given map type rendered.
   * The map is anchored to the DOM element with the CSS class 'map'.
   * @param {Element} el The element to render the map into.
   * @return {google.maps.Map} A map instance with the map type rendered.
   */
  static createMap(el) {
    var mapOptions = {
      center: exporter.App.DEFAULT_CENTER,
      zoom: exporter.App.DEFAULT_ZOOM,
      streetViewControl: false,
      backgroundColor: '#000000',
      styles: [
        {stylers: [{lightness: -100}]}, {
          featureType: 'road',
          elementType: 'labels',
          stylers: [{visibility: 'off'}]
        }
      ]
    };
    var mapEl = $('.map').get(0);
    var map = new google.maps.Map(el, mapOptions);
    return map;
  }

  /**
   * Creates a drawing manager for the passed-in map.
   * @param {google.maps.Map} map The map for which to create a drawing
   *     manager.
   * @return {google.maps.drawing.DrawingManager} A drawing manager for
   *     the given map.
   */
  static createDrawingManager(map) {
    var drawingManager = new google.maps.drawing.DrawingManager({
      drawingControl: false,
      polygonOptions: {fillColor: '#ff0000', strokeColor: '#ff0000'}
    });
    drawingManager.setMap(map);
    return drawingManager;
  }

  /**
   * Handles the success or failure of the data request.
   * @param {Object} request The jqXHR sent.
   * @param {function(Object)} onDone The function to call if the request
   *     succeeds, with the data object as an argument.
   * @param {function(string)} onError The function to call if the request
   *     fails, with an error message as an argument.
   * @return {Object} The original request, against which further callbacks
   *     can be registered.
   */
  static handleRequest(request, onDone, onError) {
    request
        .done(function(data) {
          if (data && data.error) {
            onError(data.error);
          } else {
            if (onDone) onDone(data);
          }
        })
        .fail(function(_, textStatus) {
          onError(textStatus);
        });
    return request;
  }
};


/** @type {number} The default zoom level for the map. */
exporter.App.DEFAULT_ZOOM = 5;


/** @type {Object} The default center of the map. */
exporter.App.DEFAULT_CENTER = {
  lng: -91.6,
  lat: 38.5
};


/** @type {string} The default date format. */
exporter.App.DATE_FORMAT = 'yyyy-mm-dd';


/**
 * @type {Array} An array of Google Map styles. See:
 *     https://developers.google.com/maps/documentation/javascript/styling
 */
exporter.App.BASE_MAP_STYLES = [
  {featureType: 'road', elementType: 'labels', stylers: [{visibility: 'off'}]}
];
