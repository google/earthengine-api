// Plot histogram of plant species counts in the world's deserts.

var ecoregions =
    ee.FeatureCollection('ft:1Vzl5xYdsbL2GkUhf8w5FhQ8ucGjp4V-Qevigwnd6');

// Select desert ecoregions.
var deserts = ecoregions.filter(ee.Filter.contains('ECO_NAME', 'desert'))
    .distinct('ECO_NAME');

// Prepare the chart.  Specifying a minBucketWidth makes for nice bucket sizes.
var plantHistogram = Chart.feature.histogram(deserts, 'plant_spcs', null, 300);
Chart.print(plantHistogram, 'ColumnChart', {
  title: 'Histogram of Desert Plant Species Counts'
});

Map.addLayer(deserts);
Map.setCenter(0, 0, 2);
