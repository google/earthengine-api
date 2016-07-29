// Count Features.
//
// Count Panoramio photos near SF that mention bridges.

var photosNearSF = ee.FeatureCollection(
    'ft:1qpKIcYQMBsXLA9RLWCaV9D0Hus2cMQHhI-ViKHo');
var bridgePhotos = photosNearSF.filter(ee.Filter.or(
    ee.Filter.stringContains('title', 'Bridge'),
    ee.Filter.stringContains('title', 'bridge')));

Map.addLayer(photosNearSF, {color: '0040b0'});
Map.addLayer(bridgePhotos, {color: 'e02070'});
Map.setCenter(-122.39, 37.7857, 12);

print('Number of bridge photos around SF:',
      bridgePhotos.size());
