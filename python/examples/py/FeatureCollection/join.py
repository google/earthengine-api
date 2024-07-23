"""FeatureCollection Join example.

Show parks in San Francisco within 2 kilometers of a BART station.
"""

import ee
import ee.mapclient

ee.Initialize()
ee.mapclient.centerMap(-122.45, 37.75, 13)

bart = ee.FeatureCollection('GOOGLE/EE/DEMOS/bart-locations')
parks = ee.FeatureCollection('GOOGLE/EE/DEMOS/sf-parks')
buffered_bart = bart.map(lambda f: f.buffer(2000))

join_filter = ee.Filter.withinDistance(2000, '.geo', None, '.geo')
close_parks = ee.Join.simple().apply(parks, bart, join_filter)

ee.mapclient.addToMap(buffered_bart, {'color': 'b0b0b0'})
ee.mapclient.addToMap(close_parks, {'color': '008000'})
