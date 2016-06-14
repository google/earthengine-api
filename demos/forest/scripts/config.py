#!/usr/bin/env python
"""Constants specific to the forest app."""

# Destination Fusion Table details for vector rendering.
GEOMETRY_TABLE_ID = 'ft:1duSTqER6uEqSAnu0Ra_kHW_GYfTN3QSBNXiOZMTz'
FT_GEOMETRY_COLUMN = 'geometry'
FT_ID_COLUMN = 'id'

# Source data Fusion Table IDs.
HOTSPOTS_TABLE_ID = 'ft:1OLESL3YZRTRjDV8NSbWyfXb5pqmMu3xSziDMIAx2'
COUNTRIES_TABLE_ID = 'ft:1jCnx50Qb7dTG6fURnpvT2QXiUzewJti8ApBPO8dg'
ECOREGIONS_TABLE_ID = 'ft:11SfWB6oBS1iWGiQxEOqF_wUgBJL7Bux-pWU-mqd5'

# The root file path from the working directory during generate.py execution.
FILEPATH_ROOT = '../frontend/'

# The global forest change raster on which to base analysis.
HANSEN_IMAGE_ID = 'UMD/hansen/global_forest_change_2015'
HANSEN_FIRST_YEAR = 0  # 2000
HANSEN_LAST_YEAR = 15  # 2015
