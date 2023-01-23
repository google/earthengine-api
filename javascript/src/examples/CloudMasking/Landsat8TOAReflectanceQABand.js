// This example demonstrates the use of the Landsat 8 QA band to mask clouds.

// Function to mask clouds using the quality band of Landsat 8.
var maskL8 = function(image) {
  var qa = image.select('QA_PIXEL');
  /// Check that the cloud bit is off.
  // See https://www.usgs.gov/media/files/landsat-8-9-olitirs-collection-2-level-1-data-format-control-book
  var mask = qa.bitwiseAnd(1 << 3).eq(0);
  return image.updateMask(mask);
};

// Map the function over one year of Landsat 8 TOA data and take the median.
var composite = ee.ImageCollection('LANDSAT/LC08/C02/T1_TOA')
    .filterDate('2016-01-01', '2016-12-31')
    .map(maskL8)
    .median();

// Display the results in a cloudy place.
Map.setCenter(114.1689, 22.2986, 12);
Map.addLayer(composite, {bands: ['B4', 'B3', 'B2'], max: 0.3});
