#!/usr/bin/env python
"""Select rows from a fusion table."""

import ee
import ee.mapclient

ee.Initialize()
ee.mapclient.centerMap(-93, 40, 4)

# Select the 'Sonoran desert' feature from the TNC Ecoregions fusion table.

fc = (ee.FeatureCollection('ft:1Ec8IWsP8asxN-ywSqgXWMuBaxI6pPaeh6hC64lA')
      .filter(ee.Filter().eq('ECO_NAME', 'Sonoran desert')))

# Paint it into a blank image.
image1 = ee.Image(0).mask(0)
ee.mapclient.addToMap(image1.paint(fc, 0, 5))
