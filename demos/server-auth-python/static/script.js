const EE_MAP_PATH = 'https://earthengine.googleapis.com/v1alpha';

/**
 * Initialize the Google Map and add our custom layer overlay.
 * @param {string} mapid
 * @param {string} token
 */
const initialize = (mapid, token) => {
  // Create an ImageOverlay using the MapID and token we got from App Engine.
  const tileSource = new ee.layers.EarthEngineTileSource({
    mapid,
    token,
    formatTileUrl: (x, y, z) =>
        `${EE_MAP_PATH}/${mapid}/tiles/${z}/${x}/${y}`
  });
  const layer = new ee.layers.ImageOverlay(tileSource);

  const myLatLng = new google.maps.LatLng(-34.397, 150.644);
  const mapOptions = {
    center: myLatLng,
    zoom: 8,
    maxZoom: 10,
    streetViewControl: false,
  };

  // Create the base Google Map.
  const map = new google.maps.Map(document.getElementById('map'), mapOptions);

  // Add the EE layer to the map.
  map.overlayMapTypes.push(layer);
};
