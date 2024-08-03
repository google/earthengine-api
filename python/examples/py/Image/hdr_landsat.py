"""HDR Landsat.

Display portions of an image with different dynamic ranges.
The land areas are displayed normally, but the water areas
are stretched to show more details.
"""

import datetime
import ee
import ee.mapclient

ee.Initialize()
ee.mapclient.centerMap(-95.738, 18.453, 9)

# Filter the LE7 collection to a single date.
collection = ee.ImageCollection('LANDSAT/LE07/C02/T1').filterDate(
    datetime.datetime(2002, 11, 8), datetime.datetime(2002, 11, 9)
)
image = collection.mosaic().select('B3', 'B2', 'B1')

# Display the image normally.
ee.mapclient.addToMap(image, {'gain': '1.6, 1.4, 1.1'}, 'Land')

# Add and stretch the water.  Once where the elevation is masked,
# and again where the elevation is zero.
elev = ee.Image('CGIAR/SRTM90_V4')
mask1 = elev.mask().eq(0).And(image.mask())
mask2 = elev.eq(0).And(image.mask())
ee.mapclient.addToMap(
    image.mask(mask1), {'gain': 6.0, 'bias': -200}, 'Water: Masked')
ee.mapclient.addToMap(
    image.mask(mask2), {'gain': 6.0, 'bias': -200}, 'Water: Elev 0')
