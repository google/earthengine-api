// HDR Landsat
// #section Image:6
//
// Display portions of an image with different dynamic ranges.
// The land areas are displayed normally, but the water areas
// are streched to show more details.

// Filter the L7 collection to a single date.
var collection = ee.ImageCollection('L7_L1T')
        .filterDate(new Date('11/8/2002'), new Date('11/9/2002'));
var image = collection.mosaic().select('30', '20', '10');

// Display the image normally.
addToMap(image, {gain: '1.6, 1.4, 1.1'}, 'Land');

// Add and stretch the water.  Once where the elevation is masked,
// and again where the elevation is zero.
var elev = ee.Image('srtm90_v4');
var mask1 = elev.mask().eq(0).and(image.mask());
var mask2 = elev.eq(0).and(image.mask());
addToMap(image.mask(mask1), {gain: '6.0', bias: -200}, 'Water: Masked');
addToMap(image.mask(mask2), {gain: '6.0', bias: -200}, 'Water: Elev 0');

centerMap(-95.738, 18.453, 9);
