// Map an expression over a collection.
//
// Computes the mean NDVI and SAVI by mapping an expression over a collection
// and taking the mean.  This intentionally exercises both variants of
// Image.expression.

// Filter the L7 collection to a single month.
var collection = ee.ImageCollection('LANDSAT/LE07/C01/T1_TOA')
    .filterDate('2002-11-01', '2002-12-01');

// A function to compute NDVI.
var NDVI = function(image) {
  return image.expression('float(b("B4") - b("B3")) / (b("B4") + b("B3"))');
};

// A function to compute Soil Adjusted Vegetation Index.
var SAVI = function(image) {
  return image.expression(
      '(1 + L) * float(nir - red)/ (nir + red + L)',
      {
        'nir': image.select('B4'),
        'red': image.select('B3'),
        'L': 0.2
      });
};

// Shared visualization parameters.
var vis = {
  min: 0,
  max: 1,
  palette: [
      'FFFFFF', 'CE7E45', 'DF923D', 'F1B555', 'FCD163', '99B718',
      '74A901', '66A000', '529400', '3E8601', '207401', '056201',
      '004C00', '023B01', '012E01', '011D01', '011301'
  ]
};

Map.setCenter(-93.7848, 30.3252, 11);

// Map the functions over the collection, reduce to mean and display.
Map.addLayer(collection.map(NDVI).mean(), vis, 'Mean NDVI');
Map.addLayer(collection.map(SAVI).mean(), vis, 'Mean SAVI');
