// Computed area filter
// #section FeatureCollection:7
//
// Find US counties smaller than 3k square kilometers in area.

var counties = ee.FeatureCollection(
    'ft:1pjtcfSKIbYbj4wRcBjc0Bb6NB-sQRI-L2nIzHiU');
var countiesWithArea = counties.map_area();
var smallCounties = countiesWithArea.filterMetadata('area', 'less_than', 3e9);

addToMap(smallCounties, {color: '900000'});

centerMap(-119.7, 38.26, 7);
