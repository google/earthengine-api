// Hillshade
// #section Image:7

function radians(img) {
  return img.toFloat().multiply(Math.PI).divide(180);
}

// Compute hillshade for the given illumination az, el.
function hillshade(az, ze, slope, aspect) {
  var azimuth = radians(ee.Image(az));
  var zenith = radians(ee.Image(ze));
  // Hillshade = cos(Azimuth - Aspect) * sin(Slope) * sin(Zenith) +
  //     cos(Zenith) * cos(Slope)
  return azimuth.subtract(aspect).cos()
    .multiply(slope.sin())
    .multiply(zenith.sin())
    .add(
      zenith.cos().multiply(slope.cos()));
}

var terrain = ee.call('Terrain', ee.Image('srtm90_v4'));
var slope = radians(terrain.select('slope'));
var aspect = radians(terrain.select('aspect'));

for (var i = 0; i < 360; i += 60) {
  addToMap(hillshade(i, 60, slope, aspect), {}, i + ' deg');
}
centerMap(-121.767, 46.852, 11);

