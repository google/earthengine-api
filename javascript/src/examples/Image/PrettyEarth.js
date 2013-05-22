// Pretty Earth
// #section Image:8
//
// This is a link to a version that shows all the annual layers as well.
// https://ee.googleplex.com/#9c41d8f4c7abefc04174e8699e84dda4

var image120 = ee.Image('hansen_71_120_modis_metrics');
var viz = {gain: '1.4,1.4,1.2'};
var name = 'p50';

addToMap(image120.select(name + '_30', name + '_20', name + '_10'), viz, name);
centerMap(-120.10, 38.465, 7);
