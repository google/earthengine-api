Google Earth Engine API
=======================

Python and JavaScript client libraries for calling the Earth Engine API.

_**Important Note: Access to Google Earth Engine is currently only available to
trusted testers. The API is in active development, and users should expect the
API to change.  When (not if) API changes occur, applications that use the API
will likely need to be updated.**_

- [Earth Engine Homepage](https://earthengine.google.org/)
- [Playground Web IDE](https://ee-api.appspot.com/)
- [Python Installation](python/README.md)

Here's an example screenshot and the corresponding Playground JavaScript code:

![Trendy Lights Image](https://raw.github.com/google/earthengine-api/master/trendy-lights.png)

    // Compute the trend of nighttime lights from DMSP.

    // Add a band containing image date as years since 1991.
    function createTimeBand(img) {
      var year = ee.Date(img.get('system:time_start')).get('year').subtract(1991);
      return ee.Image(year).byte().addBands(img);
    }

    // Fit a linear trend to the nighttime lights collection.
    var collection = ee.ImageCollection('NOAA/DMSP-OLS/NIGHTTIME_LIGHTS')
        .select('stable_lights')
        .map(createTimeBand);

    // Display trend in red/blue, brightness in green.
    Map.addLayer(
        collection.reduce(ee.Reducer.linearFit()),
        {min: 0, max: [0.18, 20, -0.18], bands: ['scale', 'offset', 'scale']},
        'stable lights trend');
