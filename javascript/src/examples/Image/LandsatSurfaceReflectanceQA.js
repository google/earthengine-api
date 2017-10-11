// Landsat Surface Reflectance Pixel QA Flags

// The main scene.
var scene = ee.Image('LANDSAT/LE07/C01/T1_SR/LE07_023039_20000604');

Map.setCenter(-91.5, 30.25, 11);

// Surface reflectance is a unitless ratio scaled to the range 0-10000
// and typically less than 2000.
Map.addLayer(scene, {min: 0, max: 2000, bands: ['B3', 'B2', 'B1']},
             'Surface Reflectance');

// The "pixel_qa" and "sr_cloud_qa" bands have various flags encoded in
// different bits.  We extract some of them as individual mask bands.
// Note: Cloud masking information is present in both "pixel_qa" and
// "sr_cloud_qa", but the former is likely to present more accurate results.
// pixel_qa Bit 1: Clear pixel indicator.
// pixel_qa Bit 2: Water indicator.
// pixel_qa Bit 3: Cloud shadow indicator.
// pixel_qa Bit 5: Cloud indicator.
// pixel_qa Bits 6-7: Cloud confidence.
// sr_cloud_qa Bit 1: Dense dark vegetation.


var clear = scene.select('pixel_qa').bitwiseAnd(2).neq(0);
clear = clear.updateMask(clear);

var cloud = scene.select('pixel_qa').bitwiseAnd(32).neq(0);
cloud = cloud.updateMask(cloud);

var cloud_shadow = scene.select('pixel_qa').bitwiseAnd(8).neq(0);
cloud_shadow = cloud_shadow.updateMask(cloud_shadow);

var water = scene.select('pixel_qa').bitwiseAnd(4).neq(0);
water = water.updateMask(water);

var ddv = scene.select('sr_cloud_qa').bitwiseAnd(1).neq(0);
ddv = ddv.updateMask(ddv);

// Cloud confidence is comprised of bits 6-7.
// Add the two bits and interpolate them to a range from 0-3.
// 0 = None, 1 = Low, 2 = Medium, 3 = High.
var cloud_conf = scene.select('pixel_qa').bitwiseAnd(64)
    .add(scene.select('pixel_qa').bitwiseAnd(128))
    .interpolate([0, 64, 128, 192], [0, 1, 2, 3], 'clamp').int();
var cloud_conf_vis_param = {
    min: 0, max: 3, palette: ['000000', '666666', '999999', 'ffffff']
};

// Show various bits from the pixel_qa and sr_cloud_qa bands.
Map.addLayer(clear, {palette: '000000,ff0000'}, 'Clear');
Map.addLayer(cloud, {palette: '000000,ffffff'}, 'Cloud');
Map.addLayer(cloud_shadow, {palette: '000000,ffff00'}, 'Cloud Shadow');
Map.addLayer(water, {palette: '000000,0000ff'}, 'Water');
Map.addLayer(ddv, {palette: '000000,008800'}, 'Dark Dense Vegetation');
Map.addLayer(cloud_conf, cloud_conf_vis_param, 'Cloud Confidence');
