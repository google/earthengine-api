// Plot elevation at waypoints along the Mt. Rainier summit trail.

var elevation = ee.Image('CGIAR/SRTM90_V4');
var rainierWaypoints =
    ee.FeatureCollection('ft:14q5k1isVmMMBepZAm4YIExnI7y5hE8P3Mi33WwO0');

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
