// Simple regression of year versus NDVI.

// Define the start date and position to get images covering Montezuma Castle,
// Arizona, from 2000-2010.
var start = '2000-01-01';
var end = '2010-01-01';
var lng = -111.83533;
var lat = 34.57499;
var region = ee.Geometry.Point(lng, lat);

// Filter to Landsat 7 images in the given time and place, filter to a regular
// time of year to avoid seasonal affects, and for each image create the bands
// we will regress on:
// 1. A 1, so the resulting array has a column of ones to capture the offset.
// 2. Fractional year past 2000-01-01.
// 3. NDVI.
var images = ee.ImageCollection('LANDSAT/LE07/C01/T1')
  .filterDate(start, end)
  .filter(ee.Filter.dayOfYear(160, 240))
  .filterBounds(region)
  .map(function(image) {
    var date = ee.Date(image.get('system:time_start'));
    var yearOffset = date.difference(ee.Date(start), 'year');
    var ndvi = image.normalizedDifference(['B4', 'B3']);
    return ee.Image(1).addBands(yearOffset).addBands(ndvi).toDouble();
  });

// Convert to an array. Give the axes names for more readable code.
var array = images.toArray();
var imageAxis = 0;
var bandAxis = 1;

// Slice off the year and ndvi, and solve for the coefficients.
var x = array.arraySlice(bandAxis, 0, 2);
var y = array.arraySlice(bandAxis, 2);
var fit = x.matrixSolve(y);

// Get the coefficient for the year, effectively the slope of the long-term
// NDVI trend.
var slope = fit.arrayGet([1, 0]);

Map.setCenter(lng, lat, 12);
Map.addLayer(slope, {min: -0.03, max: 0.03}, 'Slope');

