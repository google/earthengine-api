const hexGrid = require('@turf/hex-grid').default;
const ee = require('@google/earthengine');

const PRIVATE_KEY = require('./.private-key.json');

const DEGREES_LATITUDE_TO_MILES = 69;

/**
 * HTTP Cloud Function to compute population data for a given viewport, and
 * return it aggregated into hex bins in GeoJSON format.
 *
 * @param {!Object} req Cloud Function request context.
 * @param {!Object} res Cloud Function response context.
 */
exports.hexPopHttp = function hexPopHttp(req, res) {
  // Enable CORS, allowing client in Cloud Storage to see response data.
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET');

  // Get viewport bounds from client request.
  const bounds = [
    Number(req.query.minLng), Number(req.query.minLat),
    Number(req.query.maxLng), Number(req.query.maxLat)
  ];

  ee.data.authenticateViaPrivateKey(PRIVATE_KEY, () => {
    ee.initialize(null, null, () => {
      // Load an image estimating number of persons per 30 arc-second grid cell.
      const image = ee.Image('CIESIN/GPWv4/population-count/2015');

      // Create a hexgrid covering the viewport, with TurfJS.
      const cellDiameter =
          200 * Math.abs(bounds[3] - bounds[1]) / DEGREES_LATITUDE_TO_MILES;
      const gridGeoJson = hexGrid(bounds, cellDiameter, 'miles');
      const gridFeatures = ee.FeatureCollection(gridGeoJson.features);

      // Compute sum of population values for each hex cell.
      const reducedFeatures =
          image.reduceRegions(gridFeatures, ee.call('Reducer.sum'));
      reducedFeatures.evaluate((geojson) => res.send(geojson));
    });
  });
};
