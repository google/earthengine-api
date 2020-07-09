/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Default entry point for App Engine Node.js runtime. Defines a
 * web service which returns the mapid to be used by clients to display map
 * tiles showing slope computed in real time from SRTM DEM data. See
 * accompanying README file for instructions on how to set up authentication.
 */
const ee = require('@google/earthengine');
const express = require('express');
const privateKey = require('./.private-key.json');
const port = process.env.PORT || 3000;

// Define endpoint at /mapid.
const app = express().get('/mapid', (_, response) => {
  const srtm = ee.Image('CGIAR/SRTM90_V4');
  const slope = ee.Terrain.slope(srtm);
  slope.getMap({min: 0, max: 60}, ({mapid}) => response.send(mapid));
});

console.log('Authenticating Earth Engine API using private key...');
ee.data.authenticateViaPrivateKey(
    privateKey,
    () => {
      console.log('Authentication successful.');
      ee.initialize(
          null, null,
          () => {
            console.log('Earth Engine client library initialized.');
            app.listen(port);
            console.log(`Listening on port ${port}`);
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
