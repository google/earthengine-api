// Plot elevation at waypoints along the Mt. Rainier summit trail.

var elevation = ee.Image('CGIAR/SRTM90_V4');
var waypoints = [
  ee.Feature(
      ee.Geometry.Point([-121.7353, 46.78622]),
      {'name': 'Paradise Ranger Station'}),
  ee.Feature(
      ee.Geometry.Point([-121.72529, 46.8093]), {'name': 'Pebble Creek'}),
  ee.Feature(
      ee.Geometry.Point([-121.72585, 46.8102899]),
      {'name': 'Start of Glacier'}),
  ee.Feature(
      ee.Geometry.Point([-121.7252699, 46.81202]), {'name': 'Glacier Point 1'}),
  ee.Feature(
      ee.Geometry.Point([-121.72453, 46.81661]), {'name': 'Glacier Point 2'}),
  ee.Feature(
      ee.Geometry.Point([-121.72508, 46.82262]), {'name': 'Little Africa'}),
  ee.Feature(
      ee.Geometry.Point([-121.7278699, 46.82648]), {'name': 'Moon Rocks'}),
  ee.Feature(ee.Geometry.Point([-121.73281, 46.8354]), {'name': 'Camp Muir'}),
  ee.Feature(ee.Geometry.Point([-121.75976, 46.85257]), {'name': 'Summit'})
];

var rainierWaypoints = ee.FeatureCollection(waypoints);

var chart = ui.Chart.image.byRegion({
  image: elevation,
  regions: rainierWaypoints,
  scale: 200,
  xProperty: 'name'
});
chart.setOptions({
  title: 'Mt. Rainier Summit Trail Elevation',
  vAxis: {
    title: 'Elevation (meters)'
  },
  legend: 'none',
  lineWidth: 1,
  pointSize: 4
});

print(chart);

Map.addLayer(elevation, {min: 500, max: 4500});
Map.addLayer(rainierWaypoints, {color: 'FF0000'});
Map.setCenter(-121.75976, 46.85257, 11);
