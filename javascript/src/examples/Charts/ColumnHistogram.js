// Plot histogram of plant species counts in the world's deserts.

var ecoregions =
    ee.FeatureCollection('ft:1Vzl5xYdsbL2GkUhf8w5FhQ8ucGjp4V-Qevigwnd6');

// Select desert ecoregions.
var deserts = ecoregions.filter(ee.Filter.stringContains('ECO_NAME', 'desert'))
    .distinct('ECO_NAME');

// Prepare the chart.  Specifying a minBucketWidth makes for nice bucket sizes.
var histogram = ui.Chart.feature.histogram({
  features: deserts,
  property: 'plant_spcs',
  minBucketWidth: 300
}).setOptions({
  title: 'Histogram of Desert Plant Species Counts'
});

print(histogram);

Map.addLayer(deserts);
Map.setCenter(0, 0, 2);
