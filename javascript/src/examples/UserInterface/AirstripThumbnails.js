// Step through thumbnails of an image collection showing the development
// of an airstrip developed for gold mining in the 1980's and 1990's.
var box = ee.Geometry.Polygon([[
               [-62.955, 2.433], [-62.830, 2.433],
               [-62.830, 2.559], [-62.955, 2.559]]]);

var visParams = {
  bands: ['B3', 'B2', 'B1'],
  min: 0,
  max: 1200,
  gamma: [1.1, 1.1, 1]
};

var images = ee.ImageCollection('LANDSAT/LT05/C01/T1_SR')
    .filterBounds(box)
    .filterDate('1984-01-01', '1991-01-01');

Map.centerObject(box);
Map.addLayer(ee.Image(images.first()), visParams, 'Landsat 5');
Map.addLayer(ee.Image().paint(box, 0, 1), {palette: 'FF0000'}, 'Box Outline');

var selectedIndex = 0;
var collectionLength = 0;

// Get the total number of images asynchronously, so we know how far to step.
images.size().evaluate(function(length) {
  collectionLength = length;
});

// Sets up next and previous buttons used to navigate through previews of the
// images in the collection.
var prevButton = new ui.Button('Previous', null, true, {margin: '0 auto 0 0'});
var nextButton = new ui.Button('Next', null, false, {margin: '0 0 0 auto'});
var buttonPanel = new ui.Panel(
    [prevButton, nextButton],
    ui.Panel.Layout.Flow('horizontal'));

// Build the thumbnail display panel
var introPanel = ui.Panel([
  ui.Label({
    value: 'Airstrip in Brazilian Amazon',
    style: {fontWeight: 'bold', fontSize: '24px', margin: '10px 5px'}
  }),
  ui.Label('Airstrip developed for gold mining in the 1980\'s and 1990\'s.')
]);

// Helper function to combine two JavaScript dictionaries.
function combine(a, b) {
  var c = {};
  for (var key in a) c[key] = a[key];
  for (var key in b) c[key] = b[key];
  return c;
}

// An empty thumbnail that gets filled in during the setImageByIndex callback.
var thumbnail = ui.Thumbnail({
  params: combine(visParams, {
    dimensions: '256x256',
    region: box.toGeoJSON(),
  }),
  style: {height: '300px', width: '300px'},
  onClick: function(widget) {
    // Add the whole scene to the map when the thumbnail is clicked.
    var layer = Map.layers().get(0);
    if (layer.get('eeObject') != thumbnail.getImage()) {
      layer.set('eeObject', thumbnail.getImage());
    }
  }
});

var imagePanel = ui.Panel([thumbnail]);
var dateLabel = ui.Label({style: {margin: '2px 0'}});
var idLabel = ui.Label({style: {margin: '2px 0'}});
var mainPanel = ui.Panel({
  widgets: [introPanel, buttonPanel, imagePanel, idLabel, dateLabel],
  style: {position: 'bottom-left', width: '330px'}
});
Map.add(mainPanel);

// Displays the thumbnail of the image at a particular index in the collection.
var setImageByIndex = function(index) {
  var image = ee.Image(images.toList(1, index).get(0));
  thumbnail.setImage(image);

  // Asynchronously update the image information.
  image.get('system:id').evaluate(function(id) {
    idLabel.setValue('ID: ' + id);
  });
  image.date().format("YYYY-MM-dd").evaluate(function(date) {
    dateLabel.setValue('Date: ' + date);
  });
};

// Gets the index of the next/previous image in the collection and sets the
// thumbnail to that image.  Disables the appropriate button when we hit an end.
var setImage = function(button, increment) {
  if (button.getDisabled()) return;
  setImageByIndex(selectedIndex += increment);
  nextButton.setDisabled(selectedIndex >= collectionLength - 1);
  prevButton.setDisabled(selectedIndex <= 0);
};

// Set up the next and previous buttons.
prevButton.onClick(function(button) { setImage(button, -1); });
nextButton.onClick(function(button) { setImage(button, 1); });

setImageByIndex(0);
