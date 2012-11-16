// Download example
// #section Image:8
//
// Display an image given its ID.

var image1 = ee.Image('srtm90_v4');
var path = image1.getDownloadURL({
  'scale': 30,
  'crs': 'EPSG:4326',
  'region': '[[-120, 35], [-119, 35], [-119, 34], [-120, 34]]'
});
alert('https://earthengine.googleapis.com' + path);
