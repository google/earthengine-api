// Clipped composite (FT)
// #section ImageCollection:2
//
// Composite an image collection and clip it to a boundary.
// See also: Filtered Seasonal Composite, which filters the
// collection by bounds instead.

// Create a Landsat 7, median-pixel composite for Spring of 2000.
var collection = ee.ImageCollection('L7_L1T')
    .filterDate(new Date('4/1/2000'), new Date('7/1/2000'));
var image1 = collection.median();

// Clip to the output image to the Nevada and Arizona state boundaries.
var fc = ee.FeatureCollection('ft:1fRY18cjsHzDgGiJiS2nnpUU3v9JPDc2HNaR7Xk8')
    .filter(ee.Filter.or(
         ee.Filter.eq('Name', 'Nevada'),
         ee.Filter.eq('Name', 'Arizona')));
var image2 = image1.clip(fc);

// Select the red, green and blue bands.
var image = image2.select('30', '20', '10');
addToMap(image, {gain: '1.4, 1.4, 1.1'});
centerMap(-110, 40, 5);
