"""Display an image given its ID."""

import ee
import ee.mapclient

image = ee.Image('srtm90_v4')
ee.mapclient.addToMap(image, {'min': 0, 'max': 3000})
