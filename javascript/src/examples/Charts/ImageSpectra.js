// Plot band values at points in an image.
var landsat8Toa = ee.ImageCollection('LANDSAT/LC08/C01/T1_TOA');

var COLOR = {
  PARK: 'ff0000',
  FARM: '0000ff',
  URBAN: '00ff00'
};

// Three known locations.
var park = ee.Feature(
    ee.Geometry.Point(-99.25260, 19.32235), {'label': 'park'});
var farm = ee.Feature(
    ee.Geometry.Point(-99.08992, 19.27868), {'label': 'farm'});
var urban = ee.Feature(
    ee.Geometry.Point(-99.21135, 19.31860), {'label': 'urban'});

var mexicoPoints = ee.FeatureCollection([park, farm, urban]);
landsat8Toa = landsat8Toa.filterBounds(mexicoPoints);

var mexicoImage = ee.Image(landsat8Toa.first());

// Select bands B1 to B7.
mexicoImage = mexicoImage.select(['B[1-7]']);

var bandChart = ui.Chart.image.regions({
  image: mexicoImage,
  regions: mexicoPoints,
  scale: 30,
  seriesProperty: 'label'
});
bandChart.setChartType('LineChart');
bandChart.setOptions({
  title: 'Landsat 8 TOA band values at three points near Mexico City',
  hAxis: {
    title: 'Band'
  },
  vAxis: {
    title: 'Reflectance'
  },
  lineWidth: 1,
  pointSize: 4,
  series: {
    0: {color: COLOR.PARK},
    1: {color: COLOR.FARM},
    2: {color: COLOR.URBAN}
  }
});

// From: https://landsat.usgs.gov/what-are-best-spectral-bands-use-my-study
var wavelengths = [.44, .48, .56, .65, .86, 1.61, 2.2];

var spectraChart = ui.Chart.image.regions({
  image: mexicoImage,
  regions: mexicoPoints,
  scale: 30,
  seriesProperty: 'label',
  xLabels: wavelengths
});
spectraChart.setChartType('LineChart');
spectraChart.setOptions({
  title: 'Landsat 8 TOA spectra at three points near Mexico City',
  hAxis: {
    title: 'Wavelength (micrometers)'
  },
  vAxis: {
    title: 'Reflectance'
  },
  lineWidth: 1,
  pointSize: 4,
  series: {
    0: {color: COLOR.PARK},
    1: {color: COLOR.FARM},
    2: {color: COLOR.URBAN}
  }
});

print(bandChart);
print(spectraChart);

Map.addLayer(park, {color: COLOR.PARK});
Map.addLayer(farm, {color: COLOR.FARM});
Map.addLayer(urban, {color: COLOR.URBAN});
Map.setCenter(-99.25260, 19.32235, 11);
