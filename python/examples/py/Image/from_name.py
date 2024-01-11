"""Display an image given its ID."""

import ee
import ee.mapclient

image = ee.Image('CGIAR/SRTM90_V4')
ee.mapclient.addToMap(image, {'min': 0, 'max': 3000})
