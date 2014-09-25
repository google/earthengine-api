// Plot Landsat 8 band value means in a section of San Francisco.

var sanFrancisco =
    ee.Geometry.Rectangle(-122.45, 37.74, -122.4, 37.8);

var landsat8Toa = ee.ImageCollection('LANDSAT/LC8_L1T_32DAY_TOA')
    .filterDate('2012-12-25', '2013-12-25')
    .select('B[1-7]');

var sfTimeSeries =
    Chart.image.series(landsat8Toa, sanFrancisco, ee.Reducer.mean(), 200);

print(sfTimeSeries);

Map.addLayer(sanFrancisco);
Map.setCenter(-122.47, 37.77, 9);
