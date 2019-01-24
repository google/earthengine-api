// Plot histogram of biome names for the world's ecoregions.

var ecoregions = ee.FeatureCollection('RESOLVE/ECOREGIONS/2017');

// Prepare the chart.  Specifying a minBucketWidth makes for nice bucket sizes.
var histogram =
    ui.Chart.feature
        .histogram(
            {features: ecoregions, property: 'BIOME_NAME', minBucketWidth: 300})
        .setOptions({title: 'Histogram of Ecoregion Biomes'});

print(histogram);

Map.addLayer(ecoregions);
Map.setCenter(0, 0, 2);
