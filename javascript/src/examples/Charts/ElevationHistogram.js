// Plot a histogram of elevation in Colorado.

var elevation = ee.Image('CGIAR/SRTM90_V4');
var colorado = ee.Geometry.Rectangle(-109.05, 37, -102.05, 41);

// Generate the histogram data.  Use minBucketWidth for nice sized buckets.
var histogram = ui.Chart.image.histogram({
  image: elevation,
  region: colorado,
  scale: 200,
  minBucketWidth: 300
});
histogram.setOptions({
  title: 'Histogram of Elevation in Colorado (meters)'
});

print(histogram);

Map.addLayer(elevation.clip(colorado));
Map.setCenter(-107, 39, 6);
