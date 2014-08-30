// Create and render a feature collection from polygons.

var fc = new ee.FeatureCollection([
    ee.Feature(
        ee.Geometry.Polygon(
            [[-109.05, 41], [-109.05, 37], [-102.05, 37], [-102.05, 41]]),
        {name: 'Colorado', fill: 1}),
    ee.Feature(
        ee.Geometry.Polygon(
            [[-114.05, 37.0], [-109.05, 37.0], [-109.05, 41.0],
            [-111.05, 41.0], [-111.05, 42.0], [-114.05, 42.0]]),
        {name: 'Utah', fill: 2})
    ]);

// Fill, then outline the polygons into a blank image.
var image = ee.Image().toByte()
    .paint(fc, 'fill')       // Get color from property named 'fill'
    .paint(fc, 3, 5);        // Outline using color 3, width 5.

Map.addLayer(image, {
    palette: '000000,FF0000,00FF00,0000FF',
    max: 3,
    opacity: 0.5
});

Map.setCenter(-107, 41, 6);
