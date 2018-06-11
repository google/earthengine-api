const debounce = require('debounce');
const d3 = require('d3-scale');

const CLOUD_FN_ENDPOINT =
    'https://us-central1-ee-demos.cloudfunctions.net/hexPopHttp';

/** Creates the map. Called by the Maps API after it has finished loading. */
window.initMap = function() {
  const spinnerEl = document.querySelector('#spinner');
  const mapEl = document.querySelector('#map');
  const map = new google.maps.Map(
      mapEl, {center: {lat: 4.10, lng: 112.32}, zoom: 5, minZoom: 3});

  // Apply a light basemap theme.
  fetch('./map-styles.json', {credentials: 'include'})
      .then((response) => response.json())
      .then((styles) => map.setOptions({styles}));

  // When viewport moves, update hexbin overlay.
  map.addListener('bounds_changed', debounce(onBoundsChanged, 400));

  let lastRequestId = 0;

  function onBoundsChanged() {
    // Construct URL to pass current viewport to Cloud Function endpoint.
    const bounds = map.getBounds();
    let hexBinsUrl = CLOUD_FN_ENDPOINT;
    hexBinsUrl += `?minLng=${bounds.getSouthWest().lng()}`;
    hexBinsUrl += `&minLat=${bounds.getSouthWest().lat()}`;
    hexBinsUrl += `&maxLng=${bounds.getNorthEast().lng()}`;
    hexBinsUrl += `&maxLat=${bounds.getNorthEast().lat()}`;

    const currentRequestId = ++lastRequestId;
    spinnerEl.style.display = '';

    // Request GeoJSON from Cloud Function endpoint.
    fetch(hexBinsUrl).then((response) => response.json()).then((geojson) => {
      if (currentRequestId !== lastRequestId) {
        return;
      }
      spinnerEl.style.display = 'none';

      // Remove old hexbin overlay and add new hexbins.
      map.data.forEach((feature) => map.data.remove(feature));
      map.data.addGeoJson(geojson);

      // Create color scale from visible min/max, using D3.js.
      const values = [];
      map.data.forEach((feature) => values.push(feature.getProperty('sum')));
      const color =
          d3.scalePow()
              .exponent(0.4)
              .domain([Math.min(...values), Math.max(...values)])
              .range(['#d0d1e6', '#016c59']);

      // Apply cell styles with Google Maps API.
      map.data.setStyle((feature) => {
        return {
          strokeWeight: feature.getProperty('state') === 'hover' ? 2 : 0.5,
          strokeColor: '#fff',
          zIndex: feature.getProperty('state') === 'hover' ? 2 : 1,
          fillColor: color(feature.getProperty('sum')),
          fillOpacity: 0.75,
          visible: !!feature.getProperty('sum')
        };
      });
    });
  }

  // Show tooltip on hover.
  map.data.addListener('mouseover', ({feature}) => {
    feature.setProperty('state', 'hover');
    mapEl.setAttribute(
        'title', `Population: ${Math.round(feature.getProperty('sum'))}`);
  });
  map.data.addListener('mouseout', ({feature}) => {
    feature.setProperty('state', 'normal');
    mapEl.removeAttribute('title');
  });
};
