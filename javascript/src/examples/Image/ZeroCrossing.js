// ZeroCrossing
//
// Mark pixels where the elevation crosses 1000m value.
var elev = ee.Image('srtm90_v4');
var image = elev.subtract(1000).zeroCrossing();
centerMap(-121.91734, 37.88170, 15);
addToMap(image, {min: 0, max: 1, opacity: 0.5}, '1000m');
