// Ledaps Surface Reflectance.

// The main scene.
var scene = ee.Image('LE7_L1T/LE70230391999217GNC00');

// The LEDAPS precomputed image products for our scene of interest.
var precomputed = ee.Image('LEDAPS/L7_PRE/LE70230391999217GNC00');

// Ancillary data.
var surfaceWv = [ee.Image('NCEP_RE/surface_wv/pr_wtr_eatm_1999080500'),
                 ee.Image('NCEP_RE/surface_wv/pr_wtr_eatm_1999080506'),
                 ee.Image('NCEP_RE/surface_wv/pr_wtr_eatm_1999080512'),
                 ee.Image('NCEP_RE/surface_wv/pr_wtr_eatm_1999080518')];
var pressure = [ee.Image('NCEP_RE/sea_level_pressure/slp_1999080500'),
                ee.Image('NCEP_RE/sea_level_pressure/slp_1999080506'),
                ee.Image('NCEP_RE/sea_level_pressure/slp_1999080512'),
                ee.Image('NCEP_RE/sea_level_pressure/slp_1999080518')];
var surfaceTemp = [ee.Image('NCEP_RE/surface_temp/air_sig995_1999080500'),
                   ee.Image('NCEP_RE/surface_temp/air_sig995_1999080506'),
                   ee.Image('NCEP_RE/surface_temp/air_sig995_1999080512'),
                   ee.Image('NCEP_RE/surface_temp/air_sig995_1999080518')];
var ozone = ee.Image('TOMS/MERGED/L3_ozone_epc_19990805');
var dem = ee.Image('srtm90_v4');

// Compute the Surface Reflectance result using default auxilary data.
var ee_sr = ee.Algorithms.Landsat.surfaceReflectance(
        scene,
        precomputed,
        surfaceWv,
        pressure,
        surfaceTemp,
        ozone,
        dem);

Map.setCenter(-90.7945, 30.0958, 11);

// Surface reflectance is a unitless ratio scaled to the range 0-10000
// and typically less than 2000.
Map.addLayer(ee_sr, {min: 0, max: 2000}, 'EE Surface Reflectance');

// The "QA" band has various flags encoded in different bits.  We extract
// some of them as individual mask bands.
// QA Bit 2: Invalid pixel indicator.
// QA Bit 3: Cloud indicator.
// QA Bit 5: Water indicator.  (0 == water).
// QA Bit 6: Pixel used as "dense dark vegetation"

var invalid = ee_sr.select('QA').bitwiseAnd(2).neq(0);
invalid = invalid.updateMask(invalid);

var cloud = ee_sr.select('QA').bitwiseAnd(4).neq(0);
cloud = cloud.updateMask(cloud);

// This flag is technically a "not water" flag, so we check for it
// being unset (eq(0)) instead of set (neq(0)).
var water = ee_sr.select('QA').bitwiseAnd(32).eq(0);
water = water.updateMask(water);

var dense_dark_vegetation = ee_sr.select('QA').bitwiseAnd(64).neq(0);
dense_dark_vegetation = dense_dark_vegetation.updateMask(dense_dark_vegetation);

// Show various bits from the QA Mask Band.
Map.addLayer(invalid, {palette: '000000,ff0000'}, 'Invalid');
Map.addLayer(cloud, {palette: '000000,ffffff'}, 'Cloud');
Map.addLayer(water, {palette: '000000,0000ff'}, 'Not Land');
Map.addLayer(dense_dark_vegetation, {palette: '000000,00ff00'},
         'Dense Dark Vegetation');
