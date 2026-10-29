// Wrap our code in a self-executing anonymous function to isolate scope.
(function() {

  // The client ID from the Google Developers Console.
  var CLIENT_ID = '<your-client-id>';

  // Our Google map.
  var map;

  // Runs a simple EE analysis and output the results to the web page.
  var runAnalysis = function() {
    ee.initialize();
    var mapId = ee.Image('srtm90_v4').getMap({'min': 0, 'max': 1000});
    var eeTileSource = new ee.layers.EarthEngineTileSource(mapId);
    var overlay = new ee.layers.ImageOverlay(eeTileSource);

    // Show a count of the number of map tiles remaining.
    overlay.addTileCallback(function(event) {
      $('.tiles-loading').text(event.count + ' tiles remaining.');
      if (event.count === 0) {
        $('.tiles-loading').empty();
      }
    });

    // Show the EE map on the Google Map.
    map.overlayMapTypes.push(overlay);
  };

  $(document).ready(function() {
    // Create the base Google Map.
    map = new google.maps.Map($('.map').get(0), {
          center: { lat: -34.397, lng: 150.644},
          zoom: 8
        });

    // Shows a button prompting the user to log in.
    var onImmediateFailed = function() {
      $('.g-sign-in').removeClass('hidden');
      $('.output').text('(Log in to see the result.)');
      $('.g-sign-in .button').click(function() {
        ee.data.authenticateViaPopup(function() {
          // If the login succeeds, hide the login button and run the analysis.
          $('.g-sign-in').addClass('hidden');
          runAnalysis();
        });
      });
    };

    // Attempt to authenticate using existing credentials.
    ee.data.authenticate(CLIENT_ID, runAnalysis, null, null, onImmediateFailed);
  });
})();
