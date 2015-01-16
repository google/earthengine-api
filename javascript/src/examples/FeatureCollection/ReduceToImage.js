// Example of FeatureCollection.reduceToImage()

// Define a feature collection with a value we want to average.
var fc = new ee.FeatureCollection([
  ee.Feature(
    ee.Geometry.Rectangle(
      -122.4550, 37.8035,
      -122.4781, 37.7935),
    {'value': 0}),
  ee.Feature(
    ee.Geometry.Polygon([
      [-122.4427, 37.8027],
      [-122.4587, 37.7987],
      [-122.4440, 37.7934]]),
    {'value': 1})
  ]);

// Reduce the collection to an image, where each pixel
// is the mean of the 'value' property in all features
// intersecting that pixel.
var image_reduced = fc.reduceToImage(['value'], 'mean');

Map.setCenter(-122.4561, 37.7983, 14);
Map.addLayer(image_reduced, {
  min: 0,
  max: 1,
  palette: ['008800', '00FF00']});
