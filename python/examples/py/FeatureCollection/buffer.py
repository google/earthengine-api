"""Buffer Example.

Display the area within 2 kilometers of any San Francisco BART station.
"""

import ee
import ee.mapclient

ee.Initialize()
ee.mapclient.centerMap(-122.4, 37.7, 11)

bart_stations = ee.FeatureCollection('GOOGLE/EE/DEMOS/bart-locations')
buffered = bart_stations.map(lambda f: f.buffer(2000))
unioned = buffered.union()

ee.mapclient.addToMap(unioned, {'color': '800080'})
