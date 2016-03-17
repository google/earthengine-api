// HDR Landsat.
//
// Display portions of an image with different dynamic ranges.
// The land areas are displayed normally, but the water areas
// are streched to show more details.

// Filter the L7 collection to a single date.
var collection = ee.ImageCollection('LE7_L1T')
        .filterDate('2002-11-08', '2002-11-09');
var image = collection.mosaic().select('B3', 'B2', 'B1');

// Display the image normally.
Map.addLayer(image, {gain: '1.6, 1.4, 1.1'}, 'Land');

// Add and stretch the water.  Once where the elevation is masked,
// and again where the elevation is zero.
var elev = ee.Image('srtm90_v4');
var mask1 = elev.mask().eq(0);
var mask2 = elev.eq(0);
Map.addLayer(image.updateMask(mask1), {gain: '6.0', bias: -200}, 'Water: Masked');
Map.addLayer(image.updateMask(mask2), {gain: '6.0', bias: -200}, 'Water: Elev 0');

Map.setCenter(-95.738, 18.453, 9);
