"""Composite an image collection and clip it to a boundary from a table.

See also: Filtered Seasonal Composite, which filters the
collection by bounds instead.
"""

import datetime
import ee
import ee.mapclient

ee.Initialize()
ee.mapclient.centerMap(-120, 37, 6)

# Create a Landsat 7, median-pixel composite for Spring of 2000.
collection = ee.ImageCollection('LANDSAT/LE07/C02/T1').filterDate(
    datetime.datetime(2000, 4, 1), datetime.datetime(2000, 7, 1)
)
image1 = collection.median()

# Clip to the output image to the California state boundary.
fc = (ee.FeatureCollection('TIGER/2018/States')
      .filter(ee.Filter().eq('NAME', 'California')))
image2 = image1.clipToCollection(fc)

# Select the red, green and blue bands.
image = image2.select('B3', 'B2', 'B1')
ee.mapclient.addToMap(image, {'gain': [1.4, 1.4, 1.1]})
