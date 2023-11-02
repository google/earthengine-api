# Google Earth Engine API

Python and JavaScript client libraries for calling the Google Earth Engine API.

_**Important Note: Access to Google Earth Engine is currently only available to
registered users. The API is in active development, and users should expect the
API to change.  When (not if) API changes occur, applications that use the API
will likely need to be updated.**_

-   [Earth Engine Homepage](https://earthengine.google.com/)
-   [Web Code Editor](https://code.earthengine.google.com/)
-   [Python
    Installation](https://developers.google.com/earth-engine/python_install)

Here's an example screenshot and the corresponding Code Editor JavaScript code:

![Trendy Lights Image](https://raw.github.com/google/earthengine-api/master/trendy-lights.png)

```javascript
// Compute the trend of night-time lights.

// Adds a band containing image date as years since 1991.
function createTimeBand(img) {
  var year = ee.Date(img.get('system:time_start')).get('year').subtract(1991);
  return ee.Image(year).byte().addBands(img);
}

// Map the time band creation helper over the night-time lights collection.
// https://developers.google.com/earth-engine/datasets/catalog/NOAA_DMSP-OLS_NIGHTTIME_LIGHTS
var collection = ee.ImageCollection('NOAA/DMSP-OLS/NIGHTTIME_LIGHTS')
    .select('stable_lights')
    .map(createTimeBand);

// Compute a linear fit over the series of values at each pixel, visualizing
// the y-intercept in green, and positive/negative slopes as red/blue.
Map.addLayer(
    collection.reduce(ee.Reducer.linearFit()),
    {min: 0, max: [0.18, 20, -0.18], bands: ['scale', 'offset', 'scale']},
    'stable lights trend');
```

## NOTICE

In order to be more responsive to bug reports and feature requests, we are
currently using the Google Issue Tracker rather than the GitHub Issue tracker.
Please see the [Get Help](https://developers.google.com/earth-engine/help) page
of the Earth Engine documentation for details on how to browse and submit issues
to Issue Tracker.
