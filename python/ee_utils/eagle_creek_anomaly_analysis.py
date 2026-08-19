"""
eagle_creek_anomaly_analysis.py
================================
Sub-surface and bare-earth anomaly detection for the Eagle Creek Township
farm site, Lake County, Indiana (Township Sections 28 & 33).

Layers produced
---------------
1.  **USGS 3DEP 1-m Bare-Earth DEM** — multidirectional hillshade optimised
    for micro-topography: micro-ridges, swales, old foundations, buried
    channels, and glacial landforms (drumlins, kame terraces, relict shorelines).

2.  **Sentinel-1 SAR composite** — dry-summer VV/VH backscatter and the
    VV-VH ratio band.  SAR C-band (~5.6 cm wavelength) penetrates sparse
    canopy and provides a few centimetres of soil penetration, revealing
    subsurface moisture contrasts that can indicate buried channels, drainage
    tiles, and compaction anomalies (potential artifact concentrations).

3.  **OpenLandMap / ISRIC soil texture** — sand and clay fraction at 0–5 cm
    depth (250 m).  Layered over the DEM to distinguish glacially deposited
    sand/gravel lenses (chert float, copper-bearing gravels) from lacustrine
    clay basins — the substrate difference that concentrates surface finds.

Export options
--------------
* ``export_to_drive()``      — submits three separate GeoTIFF Export tasks
                               to Google Drive (non-blocking; monitor in the
                               EE Tasks panel or via ``ee.batch.Task.list()``).
* ``build_folium_map()``     — returns an interactive ``folium.Map`` with
                               four toggle-able tile layers (basemap +
                               hillshade + SAR VV/VH + soil texture).

Historical context
------------------
Eagle Creek Township sits inside the former Grand Kankakee Marsh drainage
basin.  The 1834 General Land Office surveys recorded extensive wetlands,
floating bogs, and Native American travel routes in Sections 28/33.  Glacial
outwash deposited chert-bearing gravels; post-glacial lake plains left fine
lacustrine clays.  Micro-topographic ridges visible in bare-earth LiDAR often
mark former beach ridges, animal trails hardened into paths, or borrow-pit
spoil from 19th-century drainage ditching.

Usage
-----
    python -m ee_utils.eagle_creek_anomaly_analysis

    # or inside a Jupyter notebook:
    from ee_utils.eagle_creek_anomaly_analysis import run_full_pipeline
    m = run_full_pipeline(export=False, folium_map=True)
    m  # renders inline
"""
from __future__ import annotations

import logging
import math
import sys
from pathlib import Path
from typing import Optional

# ---------------------------------------------------------------------------
# Ensure the package root is on sys.path when executed directly
# ---------------------------------------------------------------------------
_PKG_ROOT = Path(__file__).resolve().parent.parent
if str(_PKG_ROOT) not in sys.path:
    sys.path.insert(0, str(_PKG_ROOT))

import ee

from ee_utils.helpers import _safe_getinfo

logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


# ===========================================================================
# Section 1 — EE Dataset IDs (centralised; no magic strings in logic code)
# ===========================================================================

# USGS 3DEP 1-metre bare-earth DEM (LiDAR-derived, CONUS)
_3DEP_1M_ID = "USGS/3DEP/1m"

# Sentinel-1 SAR Ground-Range Detected (IW, dual-pol)
_S1_GRD_ID = "COPERNICUS/S1_GRD"

# OpenLandMap ISRIC-derived soil texture fractions (250 m, v02)
#   Band "b0"  = 0–5 cm  |  Band "b10" = 10–30 cm  (% × 10, i.e. divide by 10 → %)
_OPENLANDMAP_SAND_ID = "OpenLandMap/SOL/SOL_SAND-WFRACTION_USDA-3A1A1A_M/v02"
_OPENLANDMAP_CLAY_ID = "OpenLandMap/SOL/SOL_CLAY-WFRACTION_USDA-3A1A1A_M/v02"

# Spatial scales (metres) for EE computations
_SCALE_3DEP = 1        # native LiDAR 1 m
_SCALE_SAR = 10        # Sentinel-1 native
_SCALE_SOIL = 250      # OpenLandMap native

# Dry-summer date window used to maximise SAR ground penetration
# (minimal vegetation water content → less canopy attenuation)
_SAR_DRY_START = "2020-07-01"
_SAR_DRY_END = "2023-09-01"


# ===========================================================================
# Section 2 — Area of Interest
# ===========================================================================

def build_aoi() -> ee.Geometry.BoundingBox:
    """
    Return the bounding box for Eagle Creek Township, Sections 28 & 33,
    Lake County, Indiana.

    Coordinate derivation
    ---------------------
    Lake County, Indiana Township / Range grid (6th Principal Meridian).
    Eagle Creek Township ≈ T31N R9W.  Sections 28 and 33 are in the southern
    half of the township.  The box below adds a 500-m buffer on each side so
    that DEM hillshade edge effects and the 250-m soil grid align cleanly.

    WGS-84 decimal degrees:
        West  : -87.490  (roughly the west edge of Section 33)
        South : 41.460  (south line of Section 33)
        East  : -87.370  (east edge of Section 28)
        North : 41.510  (north line of Section 28, with buffer)

    Tip — refine with a shapefile
    ------------------------------
    If you have a parcel shapefile or digitised section boundaries, replace
    this geometry with:
        aoi = ee.FeatureCollection("users/<your-username>/eagle_creek_sections")
                  .geometry()
    """
    west, south, east, north = -87.490, 41.460, -87.370, 41.510
    aoi = ee.Geometry.BoundingBox(west, south, east, north)
    logger.info(
        "AOI set: Eagle Creek Twp Sections 28/33 "
        "[W%.3f S%.3f E%.3f N%.3f]",
        west, south, east, north,
    )
    return aoi


# ===========================================================================
# Section 3 — Layer 1: USGS 3DEP 1-m DEM + Multidirectional Hillshade
# ===========================================================================

def _compute_single_hillshade(
    dem: ee.Image,
    azimuth_deg: float,
    zenith_deg: float,
    weight: float,
) -> ee.Image:
    """
    Compute a single-direction hillshade (Lambertian reflectance model) and
    return it multiplied by a weight for compositing.

    Implements the standard shading equation:
        shade = cos(z) · cos(s)  +  sin(z) · sin(s) · cos(a - aspect)
    where z = solar zenith, s = slope, a = solar azimuth.

    Args:
        dem:          Single-band elevation image (metres).
        azimuth_deg:  Solar azimuth in degrees (0 = north, clockwise).
        zenith_deg:   Solar zenith angle in degrees (0 = overhead, 90 = horizon).
        weight:       Contribution weight for the multi-direction composite.

    Returns:
        Weighted hillshade image, values in [0, 1].
    """
    azimuth_rad = math.radians(azimuth_deg)
    zenith_rad = math.radians(zenith_deg)

    # Terrain derivatives (EE terrain algorithms work in radians internally)
    terrain = ee.Terrain.products(dem)
    slope_rad = terrain.select("slope").multiply(math.pi / 180.0)
    aspect_rad = terrain.select("aspect").multiply(math.pi / 180.0)

    cos_z = math.cos(zenith_rad)
    sin_z = math.sin(zenith_rad)

    # Hill-shade formula: clamped to [0, 1] (negative = self-shadow = 0)
    shade = (
        slope_rad.cos().multiply(cos_z)
        .add(
            slope_rad.sin()
            .multiply(sin_z)
            .multiply(
                aspect_rad.subtract(azimuth_rad).cos()
            )
        )
        .clamp(0.0, 1.0)
        .multiply(weight)
    )
    return shade


def build_3dep_hillshade(aoi: ee.Geometry) -> ee.Image:
    """
    Fetch the USGS 3DEP 1-m DEM and return a multidirectional hillshade.

    Multidirectional illumination
    ------------------------------
    A single azimuth (e.g. 315° NW) hides features aligned parallel to the
    light direction.  The multidirectional hillshade (MDHS) composites shading
    from six azimuths spread evenly around the compass so that *all* linear
    features — regardless of orientation — cast visible shadows.

    This is the critical technique for:
    * Revealing micro-ridges parallel to former shorelines
    * Detecting the subtle positive relief of Native American mounds
    * Exposing linear ditching scars from 19th-century tile drainage
    * Identifying borrow pits, cellar holes, and stone-row alignments

    The illumination angle (zenith = 60°) is intentionally low — a high sun
    flattens micro-relief; a 30°-zenith sun exaggerates noise.  60° is the
    archaeological mapping standard.

    Mosaic strategy
    ---------------
    3DEP 1-m tiles are stored as individual image files.  ``mosaic()`` on a
    date-sorted collection stitches them seamlessly across tile boundaries.

    Returns:
        ee.Image with bands:
          "hillshade"  — multidirectional shade, uint8 [0, 255]
          "elevation"  — raw DEM elevation in metres
    """
    logger.info("Building 3DEP 1-m DEM mosaic …")

    # Mosaic all available 1-m tiles covering the AOI (sorted newest first
    # so the most recent lidar survey fills gaps from older tiles).
    dem = (
        ee.ImageCollection(_3DEP_1M_ID)
        .filterBounds(aoi)
        .mosaic()
        .clip(aoi)
        .rename("elevation")
    )

    # --- Multidirectional hillshade (6-azimuth composite, zenith 60°) --------
    # Azimuths at 0°, 60°, 120°, 180°, 240°, 300° — equal angular spacing.
    # Weights sum to 1.0; all directions treated equally for anomaly detection.
    azimuths = [0.0, 60.0, 120.0, 180.0, 240.0, 300.0]
    zenith = 60.0
    weight = 1.0 / len(azimuths)

    # Start with a zero image; accumulate weighted shading from each direction
    combined = ee.Image.constant(0.0)
    for az in azimuths:
        combined = combined.add(
            _compute_single_hillshade(dem, az, zenith, weight)
        )

    # Scale to uint8 [0–255] — standard for hillshade export and display
    hillshade = (
        combined
        .multiply(255)
        .uint8()
        .rename("hillshade")
    )

    logger.info("3DEP multidirectional hillshade ready.")
    return hillshade.addBands(dem)


# ===========================================================================
# Section 4 — Layer 2: Sentinel-1 SAR Backscatter
# ===========================================================================

def build_sar_composite(aoi: ee.Geometry) -> ee.Image:
    """
    Build a dry-summer median Sentinel-1 SAR composite for soil/subsurface
    anomaly detection.

    Why SAR for archaeology and geology
    ------------------------------------
    C-band SAR (5.6 cm wavelength, ~5.4 GHz) does not image bedrock at
    metre depth; it operates on the upper few centimetres of soil.  Its
    archaeological utility comes from:

    * **Soil moisture contrast** — saturated buried channels or compacted
      features retain moisture differently than surrounding matrix, which
      changes backscatter intensity.
    * **Roughness contrast** — ploughed soil over a buried stone wall or
      cobble deposit has different micro-roughness than undisturbed soil.
    * **VV vs VH polarisation split** — VV (like-polarised) is more
      sensitive to surface roughness and specular returns from wet soil.
      VH (cross-polarised) is more sensitive to volume scattering and
      sub-canopy structure.
    * **VV−VH difference** — anomalously low VH relative to VV signals a
      smooth, dense subsurface (compacted fill, stone, dense clay) rather
      than loose organic/sandy matrix.

    Dry-window selection
    --------------------
    Summer images (July–August) minimise vegetation water content, which
    attenuates the signal and swamps subtle soil returns.  The multi-year
    median further suppresses agricultural noise (tillage, crop cycles).

    Parameters returned
    -------------------
    ``ee.Image`` with three bands:
      "VV"       — median VV backscatter, dB
      "VH"       — median VH backscatter, dB
      "VV_VH"    — VV − VH ratio, dB  (high = smooth/dense surface)
    """
    logger.info("Building Sentinel-1 SAR dry-summer composite …")

    collection = (
        ee.ImageCollection(_S1_GRD_ID)
        .filterBounds(aoi)
        .filterDate(_SAR_DRY_START, _SAR_DRY_END)
        # Interferometric Wide swath — best spatial resolution (10 m)
        .filter(ee.Filter.eq("instrumentMode", "IW"))
        # Require dual-pol (VV + VH) images only
        .filter(ee.Filter.listContains("transmitterReceiverPolarisation", "VV"))
        .filter(ee.Filter.listContains("transmitterReceiverPolarisation", "VH"))
        # Both ascending and descending passes capture different incidence
        # angles; keeping both strengthens the anomaly signal through
        # independent looks.
        .select(["VV", "VH"])
    )

    count = _safe_getinfo(collection.size())
    logger.info("  SAR: %d images in dry-summer window.", count)
    if count == 0:
        logger.warning(
            "No Sentinel-1 images found for AOI in %s → %s. "
            "Check AOI coordinates and date range.",
            _SAR_DRY_START, _SAR_DRY_END,
        )

    median = collection.median().clip(aoi)

    # VV − VH highlights polarimetric contrast; convert from dB space subtraction
    # (dB subtraction ≡ log ratio — dimensionless, preserved in dB units here)
    vv_vh_ratio = median.select("VV").subtract(median.select("VH")).rename("VV_VH")

    composite = median.addBands(vv_vh_ratio)
    logger.info("SAR composite ready (VV, VH, VV_VH bands).")
    return composite


# ===========================================================================
# Section 5 — Layer 3: OpenLandMap Soil Texture (Sand + Clay Fraction)
# ===========================================================================

def build_soil_texture(aoi: ee.Geometry) -> ee.Image:
    """
    Return sand and clay fraction images at 0–5 cm depth from OpenLandMap
    (ISRIC SoilGrids 250 m v02).

    Geological interpretation guide
    --------------------------------
    In the Eagle Creek / Kankakee Marsh region, the glacial stratigraphy
    creates a predictable pattern:

    * **High sand fraction (>65%)** — outwash channels, beach ridges, kame
      terraces.  These are the high-probability zones for chert float, copper
      nuggets, and lithic debitage: water-sorted gravels concentrated cobbles.
    * **Low sand / high clay (>55% clay)** — lacustrine deposits (old lake
      bottom), peat accumulations, ancient marsh basins.  These zones often
      preserve organic material and may contain bone or wooden artefacts.
    * **Mixed (loam, silt-loam)** — till matrix; background.

    When draped over the 3DEP hillshade, sharp sand/clay transitions that
    align with micro-ridges on the DEM indicate a buried shoreline or channel
    margin — the exact type of ecotone zone where Native American camps were
    typically located.

    Band scaling
    ------------
    Raw values are stored as % × 10 (to fit uint8).  Divide by 10 to recover
    weight fractions as percentages.  Both output bands are already rescaled
    to % here for display clarity.

    Returns:
        ee.Image with two bands:
          "sand_pct"  — sand weight fraction, % (0–100)
          "clay_pct"  — clay weight fraction, % (0–100)
    """
    logger.info("Fetching OpenLandMap soil texture (sand + clay) …")

    # Select 0–5 cm depth band ("b0"); divide by 10 → true % value
    sand = (
        ee.Image(_OPENLANDMAP_SAND_ID)
        .select("b0")
        .divide(10.0)
        .clip(aoi)
        .rename("sand_pct")
    )
    clay = (
        ee.Image(_OPENLANDMAP_CLAY_ID)
        .select("b0")
        .divide(10.0)
        .clip(aoi)
        .rename("clay_pct")
    )

    logger.info("Soil texture layers ready.")
    return sand.addBands(clay)


# ===========================================================================
# Section 6 — Google Drive Export
# ===========================================================================

def export_to_drive(
    hillshade_image: ee.Image,
    sar_image: ee.Image,
    soil_image: ee.Image,
    aoi: ee.Geometry,
    drive_folder: str = "EagleCreek_GeoAnalysis",
    crs: str = "EPSG:26916",  # UTM Zone 16N — native zone for Lake County, IN
) -> list[ee.batch.Task]:
    """
    Submit three asynchronous GeoTIFF export tasks to Google Drive.

    All layers are exported to UTM Zone 16N (EPSG:26916) so that distances
    on-screen are in metres, which is essential for measuring feature
    dimensions in GIS software.

    Resolution choices
    ------------------
    * DEM hillshade    → 1 m  (3DEP native; ~200 MB for a township section)
    * SAR composite    → 10 m (Sentinel-1 native)
    * Soil texture     → 250 m (OpenLandMap native; upsampling adds no information)

    Monitoring tasks
    ----------------
    The function returns the task objects.  Check status with:
        for t in tasks:
            print(t.status())
    Or watch them in https://code.earthengine.google.com/tasks

    Args:
        hillshade_image:  Output of ``build_3dep_hillshade()``.
        sar_image:        Output of ``build_sar_composite()``.
        soil_image:       Output of ``build_soil_texture()``.
        aoi:              The analysis bounding box.
        drive_folder:     Target folder name in Google Drive (created if absent).
        crs:              Output coordinate reference system.

    Returns:
        List of three ``ee.batch.Task`` objects (already started).
    """
    logger.info("Submitting Google Drive export tasks …")

    region = aoi.bounds()

    tasks: list[ee.batch.Task] = []

    # ---- 1. DEM hillshade + elevation ----------------------------------------
    task_dem = ee.batch.Export.image.toDrive(
        image=hillshade_image.toFloat(),
        description="EagleCreek_3DEP_Hillshade_1m",
        folder=drive_folder,
        fileNamePrefix="eagle_creek_dem_hillshade",
        region=region,
        scale=_SCALE_3DEP,
        crs=crs,
        maxPixels=int(1e10),
        fileFormat="GeoTIFF",
    )
    task_dem.start()
    tasks.append(task_dem)
    logger.info("  [1/3] DEM hillshade export task started.")

    # ---- 2. SAR composite (VV, VH, VV_VH) ------------------------------------
    task_sar = ee.batch.Export.image.toDrive(
        image=sar_image.toFloat(),
        description="EagleCreek_S1_SAR_Composite_10m",
        folder=drive_folder,
        fileNamePrefix="eagle_creek_sar_composite",
        region=region,
        scale=_SCALE_SAR,
        crs=crs,
        maxPixels=int(1e10),
        fileFormat="GeoTIFF",
    )
    task_sar.start()
    tasks.append(task_sar)
    logger.info("  [2/3] SAR composite export task started.")

    # ---- 3. Soil texture (sand_pct, clay_pct) ---------------------------------
    task_soil = ee.batch.Export.image.toDrive(
        image=soil_image.toFloat(),
        description="EagleCreek_SoilTexture_250m",
        folder=drive_folder,
        fileNamePrefix="eagle_creek_soil_texture",
        region=region,
        scale=_SCALE_SOIL,
        crs=crs,
        maxPixels=int(1e8),
        fileFormat="GeoTIFF",
    )
    task_soil.start()
    tasks.append(task_soil)
    logger.info("  [3/3] Soil texture export task started.")

    logger.info(
        "All 3 export tasks submitted to Drive folder '%s'. "
        "Monitor at https://code.earthengine.google.com/tasks",
        drive_folder,
    )
    return tasks


# ===========================================================================
# Section 7 — Folium Interactive Map
# ===========================================================================

def _ee_tile_url(image: ee.Image, vis_params: dict) -> str:
    """
    Return a tile URL for an EE image to be loaded into a Folium TileLayer.

    Uses ``ee.Image.getMapId()`` which requires EE to be already initialised.
    """
    map_id = image.getMapId(vis_params)
    return map_id["tile_fetcher"].url_format


def build_folium_map(
    hillshade_image: ee.Image,
    sar_image: ee.Image,
    soil_image: ee.Image,
    aoi: ee.Geometry,
) -> "folium.Map":  # type: ignore[name-defined]
    """
    Build a Folium interactive map with four toggle-able layers.

    Layers
    ------
    1. **ESRI World Imagery** — high-res aerial basemap for visual context.
    2. **3DEP Multidirectional Hillshade** — grey-scale bare-earth topography.
       Toggle on to trace micro-ridges; toggle off to compare with imagery.
    3. **SAR VV Band** — C-band radar backscatter.  Bright pixels = rough/wet
       surface; dark pixels = smooth/dry.  Overlay on hillshade to identify
       SAR anomalies that align with micro-topographic features.
    4. **SAR VV−VH Ratio** — polarimetric contrast. Hot-spot = high VV
       relative to VH (dense/smooth subsurface signal).
    5. **Soil Sand Fraction** — colour ramp from white (low sand / clay-rich)
       to dark orange (high sand / outwash).

    Colour ramp choices
    -------------------
    * Hillshade: greyscale ("black,white") — keeps natural shadow appearance.
    * VV:  white-to-black palette — low backscatter is dark (moisture channel).
    * VV_VH: RdYlGn diverging — red = high ratio (dense feature),
             green = low ratio (loose organic).
    * Sand %: "ffffff,fee8c8,fdd49e,fdbb84,fc8d59,e34a33,b30000" (YlOrRd).

    Args:
        hillshade_image:  Output of ``build_3dep_hillshade()``.
        sar_image:        Output of ``build_sar_composite()``.
        soil_image:       Output of ``build_soil_texture()``.
        aoi:              The analysis bounding box (used to centre the map).

    Returns:
        ``folium.Map`` object.  Call ``.save("map.html")`` or display
        inline in Jupyter with ``display(m)``.

    Raises:
        ImportError: If ``folium`` is not installed.
                     Install with:  pip install folium
    """
    try:
        import folium
    except ImportError as exc:
        raise ImportError(
            "folium is required for interactive maps.  "
            "Install it with:  pip install folium"
        ) from exc

    # Compute map centre from the AOI bounding box
    bbox_info = _safe_getinfo(aoi.bounds().coordinates())
    # coordinates() returns [[[W,S],[E,S],[E,N],[W,N],[W,S]]]
    coords = bbox_info[0]
    lons = [c[0] for c in coords]
    lats = [c[1] for c in coords]
    centre_lat = (min(lats) + max(lats)) / 2.0
    centre_lon = (min(lons) + max(lons)) / 2.0

    # ------------------------------------------------------------------
    # Base map
    # ------------------------------------------------------------------
    m = folium.Map(
        location=[centre_lat, centre_lon],
        zoom_start=15,
        # ESRI World Imagery gives the best aerial context for field survey
        tiles=(
            "https://server.arcgisonline.com/ArcGIS/rest/services/"
            "World_Imagery/MapServer/tile/{z}/{y}/{x}"
        ),
        attr="ESRI World Imagery",
        name="ESRI World Imagery (basemap)",
    )

    # OpenStreetMap as an alternative basemap
    folium.TileLayer(
        tiles="OpenStreetMap",
        name="OpenStreetMap (basemap)",
        overlay=False,
        control=True,
    ).add_to(m)

    # ------------------------------------------------------------------
    # Layer 1 — 3DEP Multidirectional Hillshade
    # ------------------------------------------------------------------
    hillshade_vis = {
        "bands": ["hillshade"],
        "min": 50,
        "max": 220,
        "palette": ["000000", "ffffff"],  # black → white greyscale
        "gamma": 1.2,
    }
    folium.TileLayer(
        tiles=_ee_tile_url(hillshade_image, hillshade_vis),
        attr="USGS 3DEP 1m LiDAR (multidirectional hillshade)",
        name="3DEP Bare-Earth Hillshade",
        overlay=True,
        control=True,
        opacity=0.85,
    ).add_to(m)

    # ------------------------------------------------------------------
    # Layer 2 — SAR VV Backscatter
    # ------------------------------------------------------------------
    sar_vv_vis = {
        "bands": ["VV"],
        "min": -25,   # dB — very low return (smooth water / wet depression)
        "max": 0,     # dB — strong return (rough/dense surface)
        "palette": ["000033", "0000ff", "00ffff", "ffffff"],
    }
    folium.TileLayer(
        tiles=_ee_tile_url(sar_image, sar_vv_vis),
        attr="Copernicus Sentinel-1 GRD (dry-summer median VV)",
        name="SAR VV Backscatter",
        overlay=True,
        control=True,
        opacity=0.70,
    ).add_to(m)

    # ------------------------------------------------------------------
    # Layer 3 — SAR VV−VH Ratio (polarimetric contrast)
    # ------------------------------------------------------------------
    sar_ratio_vis = {
        "bands": ["VV_VH"],
        "min": 4,   # dB — low ratio (volume scatterer, organic, loose)
        "max": 12,  # dB — high ratio (smooth/dense subsurface)
        "palette": ["1a9641", "a6d96a", "ffffbf", "fdae61", "d7191c"],
    }
    folium.TileLayer(
        tiles=_ee_tile_url(sar_image, sar_ratio_vis),
        attr="Copernicus Sentinel-1 GRD (VV−VH dB ratio)",
        name="SAR VV\u2212VH Ratio (density anomaly)",
        overlay=True,
        control=True,
        opacity=0.65,
    ).add_to(m)

    # ------------------------------------------------------------------
    # Layer 4 — Soil Sand Fraction
    # ------------------------------------------------------------------
    soil_vis = {
        "bands": ["sand_pct"],
        "min": 10,
        "max": 90,
        # YlOrRd: light = clay-rich basin; dark red = sandy outwash/gravel
        "palette": ["ffffff", "fee8c8", "fdd49e", "fdbb84",
                    "fc8d59", "e34a33", "b30000"],
    }
    folium.TileLayer(
        tiles=_ee_tile_url(soil_image, soil_vis),
        attr="OpenLandMap ISRIC SoilGrids 250m (sand % at 0\u20135 cm)",
        name="Soil Sand Fraction 0\u20135 cm",
        overlay=True,
        control=True,
        opacity=0.60,
    ).add_to(m)

    # ------------------------------------------------------------------
    # AOI boundary polygon overlay
    # ------------------------------------------------------------------
    aoi_geojson = _safe_getinfo(aoi)
    folium.GeoJson(
        aoi_geojson,
        name="AOI Boundary (Eagle Creek Twp S28/S33)",
        style_function=lambda _: {
            "color": "#ff0000",
            "weight": 2,
            "fillOpacity": 0.0,
        },
    ).add_to(m)

    # Layer control (toggle switches in the map corner)
    folium.LayerControl(collapsed=False).add_to(m)

    logger.info(
        "Folium map built.  Centre: (%.4f, %.4f).  Zoom: 15.",
        centre_lat, centre_lon,
    )
    return m


# ===========================================================================
# Section 8 — Interpretation guide printed to console
# ===========================================================================

_INTERPRETATION_GUIDE = """
╔══════════════════════════════════════════════════════════════════════════════╗
║  EAGLE CREEK ANOMALY ANALYSIS — FIELD INTERPRETATION GUIDE                 ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  HILLSHADE ANOMALIES (3DEP 1-m)                                             ║
║  ─────────────────────────────                                               ║
║  • Subtle linear ridges (0.3–0.8 m relief) on an otherwise flat plain       ║
║    → Former beach ridges or Kankakee marsh levées                            ║
║  • Circular or oval depressions, 5–20 m diameter                            ║
║    → Kettle holes (glacial); check for soil darkening at centre              ║
║  • Rectangular or sub-rectangular low spots, <1 m deep, 6–10 m across      ║
║    → Possible cellar holes / structure footprints from early settlement      ║
║  • Paired parallel ridges 0.5–2 m apart running across the grain            ║
║    → 19th-century tile-drainage spoil rows (confirms pre-survey tillage)    ║
║  • Faint sinuous positive ridge, 0.2–0.5 m, following topographic contour  ║
║    → Buried midden ridge or hardened trail surface                           ║
║                                                                              ║
║  SAR ANOMALIES (Sentinel-1 dry-summer)                                      ║
║  ─────────────────────────────────────                                       ║
║  • Dark (low VV) streak across dry-period image aligned with hillshade      ║
║    channel depression                                                        ║
║    → Active or recently active buried drainage; moisture-retaining fill      ║
║  • High VV−VH ratio (red on ratio layer) patch with NO surface topographic  ║
║    expression on DEM                                                         ║
║    → Candidate for dense subsurface — cobble lens, compacted midden,        ║
║      or buried stone feature                                                  ║
║  • Abrupt boundary in VH texture not matching any known field boundary      ║
║    → Change in sub-soil composition; investigate with shovel test            ║
║                                                                              ║
║  SOIL TEXTURE ANOMALIES (OpenLandMap 250 m)                                ║
║  ──────────────────────────────────────────                                  ║
║  • High sand % (> 70) coinciding with a hillshade ridge                     ║
║    → Outwash or beach deposit — high probability zone for chert, float       ║
║      copper, and lithic scatter                                               ║
║  • Abrupt sand/clay transition aligned with a sinuous hillshade feature     ║
║    → Buried shoreline; ecotone camps are typically on the sandy side        ║
║  • Clay-dominated basin (< 20% sand) with dark SAR VV                      ║
║    → Former standing-water wetland; organic preservation potential          ║
║                                                                              ║
║  CROSS-REFERENCE WITH 1834 GLO SURVEY NOTES                                ║
║  ──────────────────────────────────────────                                  ║
║  The original Land Office survey bearing trees and witness-tree notes for   ║
║  Sections 28/33 should be digitised and loaded as a point layer in QGIS     ║
║  alongside these GeoTIFFs.  "Wet Prairie", "Marsh", and "Tamarack Swamp"    ║
║  notations on the 1834 plat indicate low-clay basins that are now dry —     ║
║  these are the highest-priority shovel-test locations.                       ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""


# ===========================================================================
# Section 9 — Full Pipeline Entry Point
# ===========================================================================

def run_full_pipeline(
    gcp_project: Optional[str] = None,
    export: bool = True,
    folium_map: bool = True,
    drive_folder: str = "EagleCreek_GeoAnalysis",
    save_html: Optional[str] = "eagle_creek_map.html",
) -> Optional["folium.Map"]:  # type: ignore[name-defined]
    """
    End-to-end pipeline: initialise EE, build all three layers, optionally
    export to Drive, and optionally return an interactive Folium map.

    Args:
        gcp_project:  GCP project ID.  If ``None``, uses whatever project is
                      configured in the cached application-default credentials.
        export:       If ``True``, submit three GeoTIFF export tasks to Drive.
        folium_map:   If ``True``, build and return a Folium map object.
        drive_folder: Google Drive folder for GeoTIFF exports.
        save_html:    If a path string is given, save the Folium map as an
                      HTML file at that location.  Pass ``None`` to skip.

    Returns:
        ``folium.Map`` if ``folium_map=True``, otherwise ``None``.
    """
    # --- EE initialisation ---------------------------------------------------
    try:
        ee.Initialize(project=gcp_project)
        logger.info("EE initialised with cached credentials.")
    except ee.EEException:
        logger.info("Cached credentials absent — running ee.Authenticate().")
        ee.Authenticate()
        ee.Initialize(project=gcp_project)
        logger.info("EE initialised after interactive authentication.")

    # --- Area of interest ----------------------------------------------------
    aoi = build_aoi()

    # --- Build layers --------------------------------------------------------
    hillshade = build_3dep_hillshade(aoi)
    sar = build_sar_composite(aoi)
    soil = build_soil_texture(aoi)

    # --- Print interpretation guide ------------------------------------------
    print(_INTERPRETATION_GUIDE)

    # --- Export to Drive (non-blocking) --------------------------------------
    if export:
        tasks = export_to_drive(hillshade, sar, soil, aoi, drive_folder)
        logger.info("Export tasks submitted: %d task(s) running.", len(tasks))

    # --- Build Folium map ----------------------------------------------------
    if folium_map:
        m = build_folium_map(hillshade, sar, soil, aoi)
        if save_html:
            out = Path(save_html)
            out.parent.mkdir(parents=True, exist_ok=True)
            m.save(str(out))
            logger.info("Folium map saved → %s", out.resolve())
        return m

    return None


# ===========================================================================
# Section 10 — CLI entry point
# ===========================================================================

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="Eagle Creek anomaly analysis — 3DEP, SAR, and soil layers.",
    )
    parser.add_argument(
        "--project",
        default=None,
        metavar="GCP_PROJECT_ID",
        help="Google Cloud project ID for EE initialisation.",
    )
    parser.add_argument(
        "--no-export",
        action="store_true",
        help="Skip Google Drive export (useful for map-only runs).",
    )
    parser.add_argument(
        "--no-map",
        action="store_true",
        help="Skip Folium map generation (useful for export-only runs).",
    )
    parser.add_argument(
        "--folder",
        default="EagleCreek_GeoAnalysis",
        help="Google Drive folder name for GeoTIFF exports.",
    )
    parser.add_argument(
        "--html",
        default="eagle_creek_map.html",
        metavar="PATH",
        help="Output path for the Folium HTML map (default: eagle_creek_map.html).",
    )
    args = parser.parse_args()

    run_full_pipeline(
        gcp_project=args.project,
        export=not args.no_export,
        folium_map=not args.no_map,
        drive_folder=args.folder,
        save_html=args.html if not args.no_map else None,
    )
