// The purpose of this script is to fit a first-order
// harmonic model to a time series of MODSI EVI data.
// The linear regression reducer is used to estimate
// harmonic terms and a long-term trend in the data.

// Load the input collection and select the  EVI band.
var c = ee.ImageCollection('MODIS/006/MOD13A1').select('EVI');

// A function to compute the independent variables (namely a
// first-order Fourier model plus a linear model) based on
// the scene start time extracted from the image metadata.

// The linear regression reducer (below) expects to see images
// with all the independent values followed by all the dependent
// values.  In this case, all the independent variables are
// derived purely from image metadata, and thus are constant
// across pixels.
function addIndependentVariables(image) {
  // Get start time from image metadata.
  var date = ee.Date(image.get('system:time_start'));
  var phase = date.getFraction('year').multiply(2 * Math.PI);
  var sin = phase.sin();
  var cos = phase.cos();
  var time = date.difference(ee.Date('2000-01-01'), 'year');
  // Assemble the four independent variables as image bands.
  var independent = ee.Image([sin, cos, time, 1]).double();
  // Add 'EVI' from the input image as the last band.
  return independent.addBands(image);
}

// Perform the linear regression, which returns an array-valued
// image, and then expand that back out to a four-band image
// for later convenience.
var regression = c.map(addIndependentVariables)
  // Reduce the collection.
  .reduce(ee.Reducer.linearRegression(4))
  // Select the coefficients (array) band from the output.
  .select('coefficients')
  // 2D -> 1D by keeping the 0-axis.
  .arrayProject([0])
  // 1D -> multi-band image; supply band names with a list.
  .arrayFlatten([['sin', 'cos', 'slope', 'offset']])
  // Scale the result.
  .divide(10000);

// Pull out the three bands we're going to visualize.
var sin = regression.select('sin');
var cos = regression.select('cos');
var slope = regression.select('slope');
var offset = regression.select('offset');

// Do some math to turn the first-order Fourier model into
// hue, saturation, and value in the range[0,1].
var sat = cos.hypot(sin).multiply(2.5);
var hue = sin.atan2(cos).unitScale(-Math.PI, Math.PI);
var val = offset.multiply(1.5);

// Make a background of dark blue, for cartographic effect.
var background = ee.Image(1).visualize({palette: '000022'});
Map.addLayer(background, {}, 'background');

// Turn the HSV data into an RGB image and add it to the map.
var seasonality = ee.Image.cat(hue, sat, val).hsvToRgb();
Map.addLayer(seasonality, {}, 'Seasonality');

// Display decreasing EVI in red, increasing in blue and offset in green.
var trendVis = {
  bands: ['slope', 'offset', 'slope'],
  min: 0,
  max: [-0.005, 1, 0.005]
};
Map.addLayer(regression, trendVis, 'Trend');


// Visualize the images as they look on screen:
var seasonalityExportImage = ee.ImageCollection([
  background,
  seasonality.multiply(255).byte().rename(['vis-red', 'vis-green', 'vis-blue'])
]).mosaic();

var trendExportImage = ee.ImageCollection([
  background,
  regression.visualize(trendVis)
]).mosaic();

// Export with maps Mercator projection at 10 km scale.
var exportRegion = ee.Geometry.Rectangle([-180, -70, 180, 79], null, false);
var exportParams = {scale: 10000, region: exportRegion, crs: 'EPSG:3857'};

Export.image(seasonalityExportImage, 'Global_pheno', exportParams);
Export.image(trendExportImage, 'Global_trend', exportParams);


