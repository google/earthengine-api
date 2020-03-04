// Wrap our code in a self-executing anonymous function to isolate scope.
(function() {

  // The client ID from the Google Developers Console.
  var CLIENT_ID = '<your-client-id>';

  // The Google Map.
  var map;

  // The Drawing Manager for the Google Map.
  var drawingManager;

  // The Google Map feature for the currently drawn polygon, if any.
  var currentPolygon;

  // The Earth Engine image on the map.
  var image;

  // The scale to use for reduce regions.
  var REDUCTION_SCALE = 200;

  // Clears the current polygon and cancels any outstanding analysis.
  var clearPolygon = function() {
    if (currentPolygon) {
      currentPolygon.setMap(null);
      currentPolygon = undefined;
    }
    $('.polygon-details .result').empty();
    $('.polygon-details').addClass('hidden');
    drawingManager.setOptions(
        {drawingMode: google.maps.drawing.OverlayType.POLYGON});
  };

  // Sets the current polygon and kicks off an EE analysis.
  var setPolygon = function(newPolygon) {
    clearPolygon();
    currentPolygon = newPolygon;
    $('.polygon-details').removeClass('hidden');
    drawingManager.setOptions({drawingMode: null});
    var eePolygon = ee.Geometry.Polygon(getCoordinates(currentPolygon));
    var mean = image.reduceRegion(
        ee.Reducer.mean(), eePolygon, REDUCTION_SCALE);
    $('.polygon-details .result').text('Loading...');
    mean.getInfo(function(data, error) {
      // Ensure that the polygon hasn't changed since we sent the request.
      if (currentPolygon != newPolygon) return;
      $('.polygon-details .result').text(
          JSON.stringify(data || error, null, ' '));
    });
  };

  // Extract an array of coordinates for the given polygon.
  var getCoordinates = function(polygon) {
    var points = currentPolygon.getPath().getArray();
    return points.map(function(point) {
      return [point.lng(), point.lat()];
    });
  };

  // Runs a simple EE analysis and output the results to the web page.
  var loadMap = function() {
    // Create the base Google Map.
    map = new google.maps.Map($('.map').get(0), {
      center: { lat: -34.397, lng: 150.644},
      zoom: 8,
      streetViewControl: false
    });

    ee.initialize();
    image = ee.Image('srtm90_v4');
    var eeMapConfig = image.getMap({'min': 0, 'max': 1000});
    var eeTileSource = new ee.layers.EarthEngineTileSource(eeMapConfig);
    var overlay = new ee.layers.ImageOverlay(eeTileSource);

    // Show a count of the number of map tiles remaining.
    overlay.addTileCallback(function(event) {
      $('.tiles-loading').text(event.count + ' tiles remaining.');
      if (event.count === 0) {
        $('.tiles-loading').empty();
      }
    });

    // Create a Google Maps Drawing Manager for drawing polygons.
    drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: google.maps.drawing.OverlayType.POLYGON,
      drawingControl: false,
      polygonOptions: {
        fillColor: '#ff0000',
        strokeColor: '#ff0000'
      }
    });

    // Respond when a new polygon is drawn.
    google.maps.event.addListener(drawingManager, 'overlaycomplete',
        function(event) {
          setPolygon(event.overlay);
        });

    // Clear the current polygon when the user clicks the "Draw new" button.
    $('.polygon-details .draw-new').click(clearPolygon);

    drawingManager.setMap(map);

    // Show the EE map on the Google Map.
    map.overlayMapTypes.push(overlay);
  };

  $(document).ready(function() {
    // Shows a button prompting the user to log in.
    var onImmediateFailed = function() {
      $('.g-sign-in').removeClass('hidden');
      $('.output').text('Please log in to use the app.');
      $('.g-sign-in .button').click(function() {
        ee.data.authenticateViaPopup(function() {
          // If the login succeeds, hide the login button and run the analysis.
          $('.g-sign-in').addClass('hidden');
          loadMap();
        });
      });
    };

    // Attempt to authenticate using existing credentials.
    ee.data.authenticate(CLIENT_ID, loadMap, null, null, onImmediateFailed);
  });
})();
