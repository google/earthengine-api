"""Composite an image collection and clip it to a boundary from a fusion table.

See also: Filtered Seasonal Composite, which filters the
collection by bounds instead.
"""

import datetime
import ee
import ee.mapclient

ee.Initialize()
ee.mapclient.centerMap(-110, 40, 5)

# Create a Landsat 7, median-pixel composite for Spring of 2000.
collection = (ee.ImageCollection('L7_L1T')
              .filterDate(datetime.datetime(2000, 4, 1),
                          datetime.datetime(2000, 7, 1)))
image1 = collection.median()

# Clip to the output image to the California state boundary.
fc = (ee.FeatureCollection('ft:1fRY18cjsHzDgGiJiS2nnpUU3v9JPDc2HNaR7Xk8')
      .filter(ee.Filter().eq('Name', 'California')))
image2 = image1.clip(fc)

# Select the red, green and blue bands.
image = image2.select('30', '20', '10')
ee.mapclient.addToMap(image, {'gain': [1.4, 1.4, 1.1]})
