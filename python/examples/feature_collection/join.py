"""FeatureCollection Join example.

Show parks in San Francisco within 2 kilometers of a BART station.
"""

import ee
import ee.mapclient

ee.Initialize()
ee.mapclient.centerMap(-122.45, 37.75, 13)

bart = ee.FeatureCollection('ft:1xCCZkVn8DIkB7i7RVkvsYWxAxsdsQZ6SbD9PCXw')
parks = ee.FeatureCollection('ft:10KC6VfBWMUvNcuxU7mbSEg__F_4UVe9uDkCldBw')
buffered_bart = bart.map_buffer(2000)
close_parks = parks.filterBounds(buffered_bart)

ee.mapclient.addToMap(buffered_bart, {'color': 'b0b0b0'})
ee.mapclient.addToMap(close_parks, {'color': '008000'})
