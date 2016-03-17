// Mark pixels where the elevation crosses 1000m value and compare
// that to pixels that are exactly equal to 1000m.

var elev = ee.Image('srtm90_v4');
var image = elev.subtract(1000).zeroCrossing();

Map.setCenter(-121.68148, 37.50877, 13);
Map.addLayer(image, {min: 0, max: 1, opacity: 0.5}, 'Crossing 1000m');

var exact = elev.eq(1000);
Map.addLayer(
    exact.updateMask(exact), {min: 0, max: 1, palette: 'FF0000'}, 'Exactly 1000m');
