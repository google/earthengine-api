// Draws 60 lat/long lines per degree using the pixelLonLat() function.

// Create an image in which the value of each pixel is its
// coordinates in minutes.
var img = ee.Image.pixelLonLat().multiply(60.0);

// Get the decimal part and check if it's less than a small delta.
img = img.subtract(img.floor()).lt(0.05);

// The pixels less than the delta are the grid, in both directions.
var grid = img.select('latitude').or(img.select('longitude'));

// Draw the grid.
Map.setCenter(-122.09228, 37.42330, 12);
Map.addLayer(grid.updateMask(grid), {palette: '008000'}, 'Graticule');
