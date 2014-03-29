// Count Features.
//
// Count Panoramio photos near SF that mention bridges.

var photosNearSF = ee.FeatureCollection(
    'ft:1qpKIcYQMBsXLA9RLWCaV9D0Hus2cMQHhI-ViKHo');
var bridgePhotos = photosNearSF.filter(ee.Filter.or(
    ee.Filter.contains('title', 'Bridge'),
    ee.Filter.contains('title', 'bridge')));

addToMap(photosNearSF, {color: '0040b0'});
addToMap(bridgePhotos, {color: 'e02070'});
centerMap(-122.39, 37.7857, 12);

print('There are ' +
      bridgePhotos.aggregate_count('.all').getInfo() +
      ' bridge photos around SF.');
