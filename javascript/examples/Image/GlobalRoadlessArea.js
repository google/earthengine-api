// Global roadless area
// #section Image:8

centerMap(-100, 50, 4);

// Constants.
var MAX_DISTANCE = 100000;
var MIN_DISTANCE = 1000;

// Set masked pixels to MAX_DISTANCE
var base = ee.ImageCollection('ROADDISTANCE').mosaic();
var origMask = base.mask().neq(1);
var image = base.mask(1).where(origMask, MAX_DISTANCE);

// Map values under MIN_DISTANCE to 0, and values between MIN_DISTANCE and
// MAX_DISTANCE to the range [0.5, 1], where the palette values will give us a
// nice gradient effect.
var mapped = image.unitScale(MIN_DISTANCE, MAX_DISTANCE)
    .divide(2).add(0.5)
    .where(image.lte(MIN_DISTANCE), 0);

// Mask out water using a MODIS land cover asset.
var waterMask = ee.Image('MCD12Q1_005_2004_01_01')
    .select(['Land_Cover_Type_1']).neq(0);

// Mask out South Korea.
var EXTRA_MASK = ee.Feature.Polygon(
    [[[125.641022, 37.684907], [126.193085, 37.726194], [126.195831, 37.819548],
    [126.410065, 37.845579], [126.592712, 37.764201], [126.665497, 37.786996],
    [126.677856, 37.948529], [126.853638, 38.042684], [127.066498, 38.325498],
    [128.106079, 38.325498], [128.28598, 38.443909], [128.357391, 38.650126],
    [131.660156, 37.649034], [129.556274, 35.003003], [127.666626, 33.559707],
    [127.045898, 32.644], [123.95874, 33.137551]]]);

var finalMask = waterMask.paint(new ee.FeatureCollection([EXTRA_MASK]), 0);

// Apply mask.
var finalImage = mapped.mask(finalMask);
addToMap(finalImage,
    {min: 0.0, max: 1.0, palette: ['FFFFFF', '00AA00', '003300']});

