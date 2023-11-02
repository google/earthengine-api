// Hillshade example.  This is a demonstration of computing
// a hillshade from terrain data and displaying multiple
// layers based on multiple view geometries.  Hillshade
// creation is also provided by ee.Terrain.hillshade().

// Define a function to convert from degrees to radians.
function radians(img) {
  return img.toFloat().multiply(Math.PI).divide(180);
}

// Define a function to compute a hillshade from terrain data
// for the given sun azimuth and elevation.
function hillshade(az, ze, slope, aspect) {
  // Convert angles to radians.
  var azimuth = radians(ee.Image(az));
  var zenith = radians(ee.Image(ze));
  // Note that methods on images are needed to do the computation.
  // i.e. JavaScript operators (e.g. +, -, /, *) do not work on images.
  // The following implements:
  // Hillshade = cos(Azimuth - Aspect) * sin(Slope) * sin(Zenith) +
  //     cos(Zenith) * cos(Slope)
  return azimuth.subtract(aspect).cos()
    .multiply(slope.sin())
    .multiply(zenith.sin())
    .add(
      zenith.cos().multiply(slope.cos()));
}

// Compute terrain measures from the SRTM DEM.
var terrain = ee.Algorithms.Terrain(ee.Image('CGIAR/SRTM90_V4'));
var slope = radians(terrain.select('slope'));
var aspect = radians(terrain.select('aspect'));

// For loops are needed for control-flow operations on client-side
// operations.  Here Map.addLayer() is a client operation that needs
// to be performed in a for loop.  In general, avoid for loops
// for any server-side operation.
Map.setCenter(-121.767, 46.852, 11);
for (var i = 0; i < 360; i += 60) {
  Map.addLayer(hillshade(i, 60, slope, aspect), {}, i + ' deg');
}
