"""
constants.py
============
Dataset IDs, band name mappings, scale factors, and geographic constants
used across the ee_utils package.
"""

# ---------------------------------------------------------------------------
# Image Collection IDs
# ---------------------------------------------------------------------------

# Landsat Collection 2 Level-2 Surface Reflectance
LANDSAT8_ID = "LANDSAT/LC08/C02/T1_L2"
LANDSAT9_ID = "LANDSAT/LC09/C02/T1_L2"

# Sentinel-2 MSI Surface Reflectance (harmonised across processing baselines)
SENTINEL2_SR_ID = "COPERNICUS/S2_SR_HARMONIZED"

# Sentinel-1 SAR Ground Range (for SAR-based soil moisture proxies)
SENTINEL1_ID = "COPERNICUS/S1_GRD"

# NASA USDA SMAP soil moisture (surface & subsurface, 10 km, daily)
SMAP_SOIL_MOISTURE_ID = "NASA_USDA/HSL/SMAP10KM_soil_moisture"

# ---------------------------------------------------------------------------
# Band name mappings
# ---------------------------------------------------------------------------

# Landsat 8 / 9 – Collection 2 Surface Reflectance bands
LANDSAT_BANDS: dict[str, str] = {
    "blue": "SR_B2",
    "green": "SR_B3",
    "red": "SR_B4",
    "nir": "SR_B5",
    "swir1": "SR_B6",
    "swir2": "SR_B7",
    "thermal": "ST_B10",
}

# Sentinel-2 MSI – Surface Reflectance bands
SENTINEL2_BANDS: dict[str, str] = {
    "blue": "B2",
    "green": "B3",
    "red": "B4",
    "red_edge1": "B5",
    "red_edge2": "B6",
    "red_edge3": "B7",
    "nir": "B8",
    "nir_narrow": "B8A",
    "swir1": "B11",
    "swir2": "B12",
}

# ---------------------------------------------------------------------------
# Landsat Collection 2 scaling constants
# Converts DN to surface reflectance: reflectance = DN * scale + offset
# ---------------------------------------------------------------------------
LANDSAT_SR_SCALE: float = 0.0000275
LANDSAT_SR_OFFSET: float = -0.2

# ---------------------------------------------------------------------------
# Spatial resolution (meters)
# ---------------------------------------------------------------------------
SCALE_LANDSAT: int = 30
SCALE_SENTINEL2: int = 10
SCALE_SMAP: int = 10_000  # SMAP native ~10 km

# ---------------------------------------------------------------------------
# Computation safety limits
# ---------------------------------------------------------------------------
MAX_PIXELS: float = 1e9          # maxPixels for reduceRegion calls
MAX_COLLECTION_SIZE: int = 500   # guard against unexpectedly large collections

# ---------------------------------------------------------------------------
# Pasture health NDVI thresholds
# ---------------------------------------------------------------------------
PASTURE_HEALTH_THRESHOLDS: dict[str, float] = {
    "Excellent": 0.60,  # NDVI ≥ 0.60 → dense, healthy vegetation
    "Good": 0.40,       # NDVI ≥ 0.40 → moderate vegetation cover
    "Fair": 0.20,       # NDVI ≥ 0.20 → sparse or stressed vegetation
    "Poor": -1.0,       # sentinel – anything below Fair
}

# ---------------------------------------------------------------------------
# Geographic constants – Grand Kankakee Marsh
# Northwestern Indiana / Northeastern Illinois
# Reference: original ~1.4 million acre marsh; ~500,000 acres core wetland
# ---------------------------------------------------------------------------
# [west, south, east, north] in decimal degrees
KANKAKEE_MARSH_BBOX: list[float] = [-87.50, 41.00, -86.50, 41.50]
