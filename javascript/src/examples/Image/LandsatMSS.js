// Compare MSS images from L1 through L5

var sfPoint = ee.Geometry.Point(-122.223, 37.892);
Map.setCenter(-122.223, 37.892, 10);

for (var i = 1; i <= 5; ++i) {
  var collection = ee.ImageCollection('LM' + i + '_L1T');
  var image = ee.Image(collection.filterBounds(sfPoint).first());
  var toa = ee.Algorithms.Landsat.TOA(image);
  var date = ee.Date(image.get('system:time_start')).format('MMM yyyy');
  var bands = (i <= 3) ? ['B6', 'B5', 'B4'] : ['B3', 'B2', 'B1'];
  // This is one of the rare places where we need to use getInfo() in the
  // middle of a script, since layer names must be client-side strings.
  var label = 'Landsat' + i + ' (' + date.getInfo() + ')';
  Map.addLayer(toa, {bands: bands, min: 0, max: 0.4}, label);
}
