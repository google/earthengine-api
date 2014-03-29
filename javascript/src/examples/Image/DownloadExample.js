// Download example.
//
// This displays a link containing the URL of the image to download.

var image = ee.Image('srtm90_v4');
var path = image.getDownloadURL({
  'scale': 30,
  'crs': 'EPSG:4326',
  'region': '[[-120, 35], [-119, 35], [-119, 34], [-120, 34]]'
});
print(path);
