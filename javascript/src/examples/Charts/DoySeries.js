// Generate day-of-year charts from Landsat 8 images.

var city = ee.Feature(    // San Francisco.
    ee.Geometry.Rectangle(-122.42, 37.78, -122.4, 37.8),
    {label: 'City'});
var forest = ee.Feature(  // Tahoe National Forest.
    ee.Geometry.Rectangle(-121, 39.4, -120.99, 39.45),
    {label: 'Forest'});
var desert = ee.Feature(  // Black Rock Desert.
    ee.Geometry.Rectangle(-119.02, 40.95, -119, 41),
    {label: 'Desert'});
var westernRegions = new ee.FeatureCollection([city, forest, desert]);

var landsat8Toa = ee.ImageCollection('LANDSAT/LC8_L1T_32DAY_TOA');
landsat8Toa = landsat8Toa.select('B[1-7]');

var bands = Chart.image.doySeries(landsat8Toa, forest, null, 200);
print(bands);

var years = Chart.image.doySeriesByYear(landsat8Toa, 'B1', forest, null, 200);
print(years);

var regions = Chart.image.doySeriesByRegion(
    landsat8Toa, 'B1', westernRegions, null, 500, null, 'label');
print(regions);

Map.addLayer(westernRegions);
Map.setCenter(-121, 39.4, 6);
