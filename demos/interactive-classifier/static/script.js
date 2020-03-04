$(function() {
  // Basic options for the Google Map.
  var mapOptions = {
    center: new google.maps.LatLng(31.1, 31.1),
    zoom: 9,
    streetViewControl: false
  };

  // Create the base Google Map, set up a drawing manager and listen for updates
  // to the training area rectangle.
  var map = new google.maps.Map(document.getElementById('map'), mapOptions);

  var drawingManager = new google.maps.drawing.DrawingManager({
    drawingMode: google.maps.drawing.OverlayType.RECTANGLE,
    drawingControl: false
  });
  drawingManager.setMap(map);

  var rectangle = null;

  google.maps.event.addListener(
      drawingManager, 'overlaycomplete', function(event) {
        rectangle = event.overlay;
        drawingManager.setOptions({drawingMode: null});
      });

  // Add event listeners to form elements.
  $('#draw').click(function() {
    if(rectangle) {
      rectangle.setMap(null);
      rectangle = null;
    }
    drawingManager.setOptions(
        {drawingMode: google.maps.drawing.OverlayType.RECTANGLE});
  });

  $('#get').click(function() {
    if(!rectangle) {
      alert('Please draw a training area rectangle.');
      return;
    }

    $.getJSON(
        '/getmapdata',
        {
          points: $('#points').val(),
          rectangle: getCoordinates(rectangle)
        },
        function(data) {
          // Clear out any old layers.
          map.overlayMapTypes.clear();
          $('#layers').empty();

          data.forEach(function(layer, i) {
            // Configuration for the image map type. The Google Maps API calls
            // getTileUrl when it tries to display a map tile. Our method will
            // provide a valid URL to an Earth Engine map tile based on the
            // mapid and token.
            var eeMapOptions = {
              getTileUrl: buildGetTileUrl(layer),
              tileSize: new google.maps.Size(256, 256)
            };

            // Create the map type.
            var mapType = new google.maps.ImageMapType(eeMapOptions);

            // Add the EE layer to the map.
            map.overlayMapTypes.push(mapType);

            // Hide the layer if it is not the last result, show one layer at a
            // time.
            if(i + 1 < data.length) {
              map.overlayMapTypes.getAt(i).setOpacity(0);
            }

            // Add layer to the layer dropdown.
            var option = document.createElement('option');
            option.label = layer.label;
            option.value = i;
            // This causes the last item to be selected.
            option.selected = true;
            $('#layers').append(option);
          });
        });
  });

  $('#layers').change(function() {
    var index = $('#layers').find('option:selected').val();
    map.overlayMapTypes.forEach(function(overlay, i) {
      if(i == index) {
        overlay.setOpacity(100);
      } else {
        overlay.setOpacity(0);
      }
    });
  });

  // Returns a string of the bounds of the given rectangle
  // (xMin,yMin,xMax,yMax).
  function getCoordinates(rect) {
    var bounds = rect.getBounds();
    return [
      bounds.getSouthWest().lng(),
      bounds.getSouthWest().lat(),
      bounds.getNorthEast().lng(),
      bounds.getNorthEast().lat(),
    ].join(',');
  }

  // Returns a function that builds a valid tile URL to Earth Engine based on
  // the mapid and token.
  function buildGetTileUrl(layer) {
    return function(tile, zoom) {
      // We haven't loaded the ee client library, so we process the template
      // explicitly instead of calling ee.data.getTileUrl(layer, x, y, zoom).
      return layer.urlFormat.replace('{x}', tile.x).replace('{y}', tile.y)
          .replace('{z}', zoom);
    };
  }
});
