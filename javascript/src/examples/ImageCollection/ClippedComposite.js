// Composite an image collection and clip it to a boundary.
// See also: FilteredComposite, which filters the collection by bounds instead.

// Create a Landsat 7, median-pixel composite for Spring of 2000.
var collection = ee.ImageCollection('LE7_L1T')
    .filterDate('2000-04-01', '2000-07-01');
var median = collection.median();

// Clip to the output image to the Nevada and Arizona state boundaries.
var fc = ee.FeatureCollection('ft:1fRY18cjsHzDgGiJiS2nnpUU3v9JPDc2HNaR7Xk8')
    .filter(ee.Filter.or(
         ee.Filter.eq('Name', 'Nevada'),
         ee.Filter.eq('Name', 'Arizona')));
var clipped = median.clipToCollection(fc);

// Select the red, green and blue bands.
var result = clipped.select('B3', 'B2', 'B1');
Map.addLayer(result, {gain: '1.4, 1.4, 1.1'});
Map.setCenter(-110, 40, 5);
