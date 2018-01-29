// Mark pixels where the elevation crosses 1000m value and compare
// that to pixels that are exactly equal to 1000m.

var elev = ee.Image('CGIAR/SRTM90_V4');

// A zero-crossing is defined as any pixel where the right,
// bottom, or diagonal bottom-right pixel has the opposite sign.
var image = elev.subtract(1000).zeroCrossing();

Map.setCenter(-121.68148, 37.50877, 13);
Map.addLayer(image, {min: 0, max: 1, opacity: 0.5}, 'Crossing 1000m');

var exact = elev.eq(1000);
Map.addLayer(exact.updateMask(exact), {palette: 'red'}, 'Exactly 1000m');
