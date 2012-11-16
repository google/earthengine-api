// Where operator
// #section Image:5
//
// Select the forest classes from the MODIS land cover image and intersect them
// with elevations above 1000m.

var elev = ee.Image('srtm90_v4');
var cover = ee.Image('MCD12Q1/MCD12Q1_005_2001_01_01')
    .select('Land_Cover_Type_1');

var blank = ee.Image(0);

// Where (1 <= cover <= 4) and (elev > 1000), set the output to 1.
var output = blank.where(
    cover.lte(4).and(cover.gte(1)).and(elev.gt(1000)),
    1);

// Output contains 0s and 1s.  Mask it with itself to get rid of the 0s.
var result = output.mask(output);

addToMap(result, {palette: '00AA00'});
centerMap(-113.41842, 40.055489, 6);
