// Plot elevation at waypoints along the Mt. Rainier summit trail.

var elevation = ee.Image('srtm90_v4');
var rainierWaypoints =
    ee.FeatureCollection('ft:14q5k1isVmMMBepZAm4YIExnI7y5hE8P3Mi33WwO0');

var waypointElevations = Chart.image.byRegion(
    elevation, rainierWaypoints, null, 200, 'name');
waypointElevations = waypointElevations.setOptions({
  title: 'Mt. Rainier Summit Trail Elevation',
  vAxis: {
    title: 'Elevation (meters)'
  },
  legend: 'none',
  lineWidth: 1,
  pointSize: 4
});

print(waypointElevations);

Map.addLayer(rainierWaypoints);
Map.setCenter(-121.75976, 46.85257, 11);
