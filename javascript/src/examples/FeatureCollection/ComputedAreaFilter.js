// Computed area filter.
//
// Find US counties smaller than 3k square kilometers in area.

var counties = ee.FeatureCollection(
    'ft:1pjtcfSKIbYbj4wRcBjc0Bb6NB-sQRI-L2nIzHiU');
var countiesWithArea = counties.map(function(f) {
  return f.set({area: f.area()});
});
var smallCounties = countiesWithArea.filterMetadata('area', 'less_than', 3e9);

Map.addLayer(smallCounties, {color: '900000'});

Map.setCenter(-119.7, 38.26, 7);
