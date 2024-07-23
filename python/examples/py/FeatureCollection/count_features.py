"""Count features example.

Count Panoramio photos near SF that mention bridges.
"""
import ee
import ee.mapclient

ee.Initialize()
ee.mapclient.centerMap(-122.39, 37.7857, 12)

photos_near_sf = ee.FeatureCollection('GOOGLE/EE/DEMOS/sf-photo-locations')
bridge_photos = photos_near_sf.filter(
    ee.Filter().Or(ee.Filter.stringContains('title', 'Bridge'),
                   ee.Filter.stringContains('title', 'bridge')))

ee.mapclient.addToMap(photos_near_sf, {'color': '0040b0'})
ee.mapclient.addToMap(bridge_photos, {'color': 'e02070'})

print('There are {} bridge photos around SF.'
      .format(bridge_photos.size().getInfo()))
