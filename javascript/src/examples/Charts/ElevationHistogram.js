// Plot a histogram of elevation in Colorado.

var elevation = ee.Image('srtm90_v4');
var colorado = ee.Geometry.Rectangle(-109.05, 37, -102.05, 41);

// Generate the histogram data.  Use minBucketWidth for nice sized buckets.
var coloradoElevationHistogram =
    Chart.image.histogram(elevation, colorado, 200, null, 300);
coloradoElevationHistogram = coloradoElevationHistogram.setOptions({
  title: 'Histogram of Elevation in Colorado (meters)'
});

print(coloradoElevationHistogram);

Map.addLayer(elevation.clip(colorado));
Map.setCenter(-107, 39, 6);
