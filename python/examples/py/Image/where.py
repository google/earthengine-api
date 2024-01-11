"""Where operator example.

Select the forest classes from the MODIS land cover image and intersect them
with elevations above 1000m.
"""

import ee
import ee.mapclient

ee.Initialize()
ee.mapclient.centerMap(-113.41842, 40.055489, 6)

elev = ee.Image('CGIAR/SRTM90_V4')
cover = ee.Image('MODIS/051/MCD12Q1/2001_01_01').select('Land_Cover_Type_1')
blank = ee.Image(0)

# Where (1 <= cover <= 4) and (elev > 1000), set the output to 1.
output = blank.where(
    cover.lte(4).And(cover.gte(1)).And(elev.gt(1000)),
    1)

# Output contains 0s and 1s.  Mask it with itself to get rid of the 0s.
result = output.mask(output)

ee.mapclient.addToMap(result, {'palette': '00AA00'})
