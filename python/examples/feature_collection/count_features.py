"""Count features example.

Count Panoramio photos near SF that mention bridges.
"""

import ee
import ee.mapclient

ee.Initialize()
ee.mapclient.centerMap(-122.39, 37.7857, 12)

photos_near_sf = ee.FeatureCollection(
    'ft:1qpKIcYQMBsXLA9RLWCaV9D0Hus2cMQHhI-ViKHo')
bridge_photos = photos_near_sf.filter(ee.Filter().contains('title', 'Bridge'))

ee.mapclient.addToMap(photos_near_sf, {'color': '0040b0'})
ee.mapclient.addToMap(bridge_photos, {'color': 'e02070'})

print ('There are %d bridge photos around SF.' %
       bridge_photos.aggregate_count('.all').getInfo())
