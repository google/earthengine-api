/**
 * Initialize the Google Map and add our custom layer overlay.
 * @param  {string} mapId
 * @param  {string} token
 */
const initialize = (mapId, token) => {
  // The Google Maps API calls getTileUrl() when it tries to display a map
  // tile. This is a good place to swap in the MapID and token we got from
  // the Node.js script. The other values describe other properties of the
  // custom map type.
  const eeMapOptions = {
    getTileUrl: (tile, zoom) => {
      const baseUrl = 'https://earthengine.googleapis.com/map';
      const url = [baseUrl, mapId, zoom, tile.x, tile.y].join('/');
      return `${url}?token=${token}`;
    },
    tileSize: new google.maps.Size(256, 256)
  };

  // Create the map type.
  const mapType = new google.maps.ImageMapType(eeMapOptions);

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
  map.overlayMapTypes.push(mapType);
};
