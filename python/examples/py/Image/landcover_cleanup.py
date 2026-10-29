"""Landcover cleanup.

Display the MODIS land cover classification image with appropriate colors.
"""

import ee
import ee.mapclient

ee.Initialize()
ee.mapclient.centerMap(-113.41842, 40.055489, 6)

# Force projection of 500 meters/pixel, which is the native MODIS resolution.
VECTORIZATION_SCALE = 500

image1 = ee.Image('MODIS/051/MCD12Q1/2001_01_01')
image2 = image1.select(['Land_Cover_Type_1'])
image3 = image2.reproject('EPSG:4326', None, 500)
image4 = image3.focal_mode()
image5 = image4.focal_max(3).focal_min(5).focal_max(3)
image6 = image5.reproject('EPSG:4326', None, 500)

PALETTE = [
    'aec3d4',  # water
    '152106', '225129', '369b47', '30eb5b', '387242',  # forest
    '6a2325', 'c3aa69', 'b76031', 'd9903d', '91af40',  # shrub, grass, savannah
    '111149',  # wetlands
    'cdb33b',  # croplands
    'cc0013',  # urban
    '33280d',  # crop mosaic
    'd7cdcc',  # snow and ice
    'f7e084',  # barren
    '6f6f6f'   # tundra
    ]

vis_params = {'min': 0, 'max': 17, 'palette': PALETTE}

ee.mapclient.addToMap(image2, vis_params, 'IGBP classification')
ee.mapclient.addToMap(image3, vis_params, 'Reprojected')
ee.mapclient.addToMap(image4, vis_params, 'Mode')
ee.mapclient.addToMap(image5, vis_params, 'Smooth')
ee.mapclient.addToMap(image6, vis_params, 'Smooth')
