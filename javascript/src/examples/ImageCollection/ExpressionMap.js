// Map an expression
//
// Computes the mean NDVI and SAVI by mapping an expression over a collection
// and taking the mean.  This intentionally exercises both variants of
// Image.expression.

// Filter the L7 collection to a single month.
var collection = ee.ImageCollection('L7_L1T_TOA')
    .filterDate(new Date('2002/11/1'), new Date('2002/12/1'));

// A function to compute NDVI.
var ndvi = function(image) {
  return image.expression('float(b("40") - b("30")) / (b("40") + b("30"))');
};

// A function to compute Soil Adjusted Vegetation Index.
var savi = function(image) {
  return ee.Image(0).expression(
      '(1 + L) * float(nir - red)/ (nir + red + L)',
      {
        'nir': image.select('40'),
        'red': image.select('30'),
        'L': 0.2
      });
};

var vis = {
  min: 0,
  max: 1,
  palette: [
      'FFFFFF', 'CE7E45', 'DF923D', 'F1B555', 'FCD163', '99B718',
      '74A901', '66A000', '529400', '3E8601', '207401', '056201',
      '004C00', '023B01', '012E01', '011D01', '011301'
  ]
};

centerMap(-93.7848, 30.3252, 11);
addToMap(collection.map(ndvi).mean(), vis, 'Mean NDVI');
addToMap(collection.map(savi).mean(), vis, 'Mean SAVI');
