/**
 * server.js
 *
 * Works in the local development environment and when deployed. If successful,
 * shows a single web page with the SRTM DEM displayed in a Google Map. See
 * accompanying README file for instructions on how to set up authentication.
 */
const ee = require('@google/earthengine');
const express = require('express');
const handlebars  = require('express-handlebars');

const app = express()
  .engine('.hbs', handlebars({extname: '.hbs', cache: false}))
  .set('view engine', '.hbs')
  .use('/static', express.static('static'))
  .get('/', (request, response) => {

    const image = ee.Image('srtm90_v4');
    image.getMap({min: 0, max: 1000}, ({mapid, token}) => {
      response.render('index', {layout: false, mapid, token});
    });

  });

// Private key, in `.json` format, for an Earth Engine service account.
const PRIVATE_KEY = require('./privatekey.json');
const PORT = process.env.PORT || 3000;

console.log('Authenticating server-side EE API calls via private key...');

ee.data.authenticateViaPrivateKey(
    PRIVATE_KEY,
    () => {
      console.log('Authentication succeeded.');
      ee.initialize(
          null, null,
          () => {
            console.log('Successfully initialized the EE client library.');
            app.listen(PORT);
            console.log(`Listening on port ${PORT}`);
          },
          (err) => {
            console.log(err);
            console.log(
                `Please make sure you have created a service account and have been approved.
Visit https://developers.google.com/earth-engine/service_account#how-do-i-create-a-service-account to learn more.`);
          });
    },
    (err) => {
      console.log(err);
    });
