/**
 * @fileoverview Runs the Trendy Lights application. The code is executed in the
 * user's browser. It communicates with the App Engine backend, renders output
 * to the screen, and handles user interactions.
 */


trendy = {};  // Our namespace.


/**
 * Starts the Trendy Lights application. The main entry point for the app.
 * @param {string} mapUrlFormat The Earth Engine map url template.
 * @param {string} serializedPolygonIds A serialized array of the IDs of the
 *     polygons to show on the map. For example: "['poland', 'moldova']".
 */
trendy.boot = function(mapUrlFormat, serializedPolygonIds) {
  // Create the Trendy Lights app.
  google.charts.load('current', {
    packages: ['corechart'],
    callback: function() {
      var mapType = trendy.App.getEeMapType(mapUrlFormat);
      var app = new trendy.App(mapType, JSON.parse(serializedPolygonIds));
    }
  });
};


///////////////////////////////////////////////////////////////////////////////
//                               The application.                            //
///////////////////////////////////////////////////////////////////////////////


/**
 * The main Trendy Lights application.
 * This constructor renders the UI and sets up event handling.
 * @unrestricted
 */
trendy.App = class {
  /**
   * @param {google.maps.ImageMapType} mapType The map type to render on the
   *     map.
   * @param {Array<string>} polygonIds The IDs of the polygons to show on the
   *     map. For example ['poland', 'moldova'].
   */
  constructor(mapType, polygonIds) {
    // Create and display the map.
    this.map = this.createMap(mapType);

    // Add the polygons to the map.
    this.addPolygons(polygonIds);

    // Register a click handler to show a panel when the user clicks on a place.
    this.map.data.addListener('click', this.handlePolygonClick.bind(this));

    // Register a click handler to hide the panel when the user clicks close.
    $('.panel .close').click(this.hidePanel.bind(this));

    // Register a click handler to expand the panel when the user taps on
    // toggle.
    $('.panel .toggler').click((function() {
                                 $('.panel').toggleClass('expanded');
                               }).bind(this));
  }

  /**
   * Creates a Google Map with a black background the given map type rendered.
   * The map is anchored to the DOM element with the CSS class 'map'.
   * @param {google.maps.ImageMapType} mapType The map type to include on the
   *     map.
   * @return {google.maps.Map} A map instance with the map type rendered.
   */
  createMap(mapType) {
    var mapOptions = {
      backgroundColor: '#000000',
      center: trendy.App.DEFAULT_CENTER,
      disableDefaultUI: true,
      zoom: trendy.App.DEFAULT_ZOOM
    };
    var mapEl = $('.map').get(0);
    var map = new google.maps.Map(mapEl, mapOptions);
    map.setOptions({styles: trendy.App.BLACK_BASE_MAP_STYLES});
    map.overlayMapTypes.push(mapType);
    return map;
  }

  /**
   * Adds the polygons with the passed-in IDs to the map.
   * @param {Array<string>} polygonIds The IDs of the polygons to show on the
   *     map. For example ['poland', 'moldova'].
   */
  addPolygons(polygonIds) {
    polygonIds.forEach((function(polygonId) {
                         this.map.data.loadGeoJson(
                             'static/polygons/' + polygonId + '.json');
                       }).bind(this));
    this.map.data.setStyle(function(feature) {
      return {fillColor: 'white', strokeColor: 'white', strokeWeight: 3};
    });
  }

  /**
   * Handles a on click a polygon. Highlights the polygon and shows details
   * about it in a panel.
   * @param {Object} event The event object, which contains details about the
   *     polygon clicked.
   */
  handlePolygonClick(event) {
    this.clear();
    var feature = event.feature;

    // Instantly highlight the polygon and show the title of the polygon.
    this.map.data.overrideStyle(feature, {strokeWeight: 8});
    var title = feature.getProperty('title');
    $('.panel').show();
    $('.panel .title').show().text(title);

    // Asynchronously load and show details about the polygon.
    var id = feature.getProperty('id');
    $.get('/details?polygon_id=' + id)
        .done((function(data) {
                if (data['error']) {
                  $('.panel .error').show().html(data['error']);
                } else {
                  $('.panel .wiki-url').show().attr('href', data['wikiUrl']);
                  this.showChart(data['timeSeries']);
                }
              }).bind(this));
  }

  /** Clears the details panel and selected polygon. */
  clear() {
    $('.panel .title').empty().hide();
    $('.panel .wiki-url').hide().attr('href', '');
    $('.panel .chart').empty().hide();
    $('.panel .error').empty().hide();
    $('.panel').hide();
    this.map.data.revertStyle();
  }

  /** Hides the details panel. */
  hidePanel() {
    $('.panel').hide();
    this.clear();
  }

  /**
   * Shows a chart with the given timeseries.
   * @param {Array<Array<number>>} timeseries The timeseries data
   *     to plot in the chart.
   */
  showChart(timeseries) {
    timeseries.forEach(function(point) {
      point[0] = new Date(parseInt(point[0], 10));
    });
    var data = new google.visualization.DataTable();
    data.addColumn('date');
    data.addColumn('number');
    data.addRows(timeseries);
    var wrapper = new google.visualization.ChartWrapper({
      chartType: 'LineChart',
      dataTable: data,
      options: {
        title: 'Brightness over time',
        curveType: 'function',
        legend: {position: 'none'},
        titleTextStyle: {fontName: 'Roboto'}
      }
    });
    $('.panel .chart').show();
    var chartEl = $('.chart').get(0);
    wrapper.setContainerId(chartEl);
    wrapper.draw();
  }

  /**
   * Generates a Google Maps map type (or layer) for the passed-in EE map id.
   * See:
   * https://developers.google.com/maps/documentation/javascript/maptypes#ImageMapTypes
   * @param {string} mapUrlFormat The Earth Engine map url template.
   * @return {google.maps.ImageMapType} A Google Maps ImageMapType object for
   *     the EE map with the given ID and token.
   */
  static getEeMapType(mapUrlFormat) {
    var eeMapOptions = {
      getTileUrl: function(tile, zoom) {
        // We haven't loaded the ee client library, so we process the template
        // explicitly instead of calling ee.data.getTileUrl(mapid, x, y, zoom).
        return mapUrlFormat.replace('{x}', tile.x)
            .replace('{y}', tile.y)
            .replace('{z}', zoom);
      },
      tileSize: new google.maps.Size(256, 256)
    };
    return new google.maps.ImageMapType(eeMapOptions);
  }
};


///////////////////////////////////////////////////////////////////////////////
//                        Static helpers and constants.                      //
///////////////////////////////////////////////////////////////////////////////


/** @type {number} The default zoom level for the map. */
trendy.App.DEFAULT_ZOOM = 4;


/** @type {Object} The default center of the map. */
trendy.App.DEFAULT_CENTER = {
  lng: 5,
  lat: 50
};


/**
 * @type {Array} An array of Google Map styles. See:
 *     https://developers.google.com/maps/documentation/javascript/styling
 */
trendy.App.BLACK_BASE_MAP_STYLES = [
  {stylers: [{lightness: -100}]},
  {featureType: 'road', elementType: 'labels', stylers: [{visibility: 'off'}]}
];
