"""
helpers.py
==========
Shared, low-level Earth Engine image-processing utilities used by both
``agriculture.py`` and ``marshland.py``.

Keeping these helpers in one place eliminates code duplication and ensures
that any bug fix or retry-logic update propagates to every consumer module.

Public surface (imported by sibling modules):
    _apply_landsat_sr_scaling   — Collection 2 DN → surface reflectance
    _mask_landsat_clouds        — QA_PIXEL cloud/shadow masking
    _mask_sentinel2_clouds      — SCL-based cloud masking
    _compute_ndvi               — Normalised Difference Vegetation Index
    _compute_ndwi               — McFeeters (1996) water index
    _compute_mndwi              — Xu (2006) modified water index
    _build_landsat_collection   — Merged Landsat 8 + 9 filtered collection
    _safe_getinfo               — .getInfo() with exponential-backoff retries
"""
from __future__ import annotations

import logging
import time
from typing import Any

import ee

from .constants import (
    LANDSAT8_ID,
    LANDSAT9_ID,
    LANDSAT_SR_OFFSET,
    LANDSAT_SR_SCALE,
)

logger = logging.getLogger(__name__)

# Maximum retries on transient EE quota / server errors
_MAX_RETRIES: int = 3
_RETRY_BACKOFF_S: float = 5.0


# ---------------------------------------------------------------------------
# Landsat Collection 2 scaling and cloud masking
# ---------------------------------------------------------------------------

def _apply_landsat_sr_scaling(image: ee.Image) -> ee.Image:
    """
    Apply Collection 2 DN → surface-reflectance scale factor and offset.

    Converts all ``SR_B*`` bands from integer DN to floating-point
    surface reflectance in the range [~0, ~1].
    """
    optical = (
        image.select("SR_B.*")
        .multiply(LANDSAT_SR_SCALE)
        .add(LANDSAT_SR_OFFSET)
    )
    return image.addBands(optical, overwrite=True)


def _mask_landsat_clouds(image: ee.Image) -> ee.Image:
    """
    Mask cloud and cloud-shadow pixels using the QA_PIXEL band.

    Bit 3 = cloud; Bit 4 = cloud shadow (Landsat Collection 2).
    """
    qa = image.select("QA_PIXEL")
    clear = (
        qa.bitwiseAnd(1 << 3).eq(0)        # cloud
        .And(qa.bitwiseAnd(1 << 4).eq(0))  # cloud shadow
    )
    return image.updateMask(clear)


# ---------------------------------------------------------------------------
# Sentinel-2 cloud masking
# ---------------------------------------------------------------------------

def _mask_sentinel2_clouds(image: ee.Image) -> ee.Image:
    """
    Mask cloud, cloud-shadow, and cirrus using the SCL scene-classification band.

    Retained classes: vegetation (4), bare soil (5), water (6), unclassified (7).
    """
    scl = image.select("SCL")
    valid = (
        scl.neq(3)    # cloud shadow
        .And(scl.neq(8))    # medium-probability cloud
        .And(scl.neq(9))    # high-probability cloud
        .And(scl.neq(10))   # thin cirrus
    )
    return image.updateMask(valid)


# ---------------------------------------------------------------------------
# Spectral index helpers
# ---------------------------------------------------------------------------

def _compute_ndvi(image: ee.Image, nir_band: str, red_band: str) -> ee.Image:
    """
    Return NDVI image clamped to [−1, 1] with band name ``'NDVI'``.

    NDVI = (NIR − Red) / (NIR + Red)
    """
    return (
        image.normalizedDifference([nir_band, red_band])
        .rename("NDVI")
        .clamp(-1.0, 1.0)
    )


def _compute_ndwi(image: ee.Image, green_band: str, nir_band: str) -> ee.Image:
    """
    McFeeters (1996) NDWI: (Green − NIR) / (Green + NIR).

    Values > 0 indicate open water.
    """
    return (
        image.normalizedDifference([green_band, nir_band])
        .rename("NDWI")
        .clamp(-1.0, 1.0)
    )


def _compute_mndwi(image: ee.Image, green_band: str, swir1_band: str) -> ee.Image:
    """
    Xu (2006) Modified NDWI: (Green − SWIR1) / (Green + SWIR1).

    Values > 0 indicate open water; suppresses built-up-land false positives
    better than classic NDWI.
    """
    return (
        image.normalizedDifference([green_band, swir1_band])
        .rename("MNDWI")
        .clamp(-1.0, 1.0)
    )


# ---------------------------------------------------------------------------
# Multi-mission Landsat collection builder
# ---------------------------------------------------------------------------

def _build_landsat_collection(
    geometry: ee.Geometry,
    start_str: str,
    end_str: str,
    cloud_cover_max: float,
) -> ee.ImageCollection:
    """
    Build a cloud-filtered, SR-scaled, merged Landsat 8 + 9 collection.

    Merging both missions maximises temporal density (L8 and L9 share the
    same WRS-2 orbit path, offset by ~8 days, giving ~8-day revisit jointly).

    Args:
        geometry: EE geometry used for ``filterBounds``.
        start_str: ISO date string (``"YYYY-MM-DD"``).
        end_str: ISO date string (exclusive end).
        cloud_cover_max: Maximum ``CLOUD_COVER`` metadata value (0–100).

    Returns:
        Merged, cloud-masked, SR-scaled ``ee.ImageCollection``.
    """
    def _prep(collection_id: str) -> ee.ImageCollection:
        return (
            ee.ImageCollection(collection_id)
            .filterBounds(geometry)
            .filterDate(start_str, end_str)
            .filter(ee.Filter.lt("CLOUD_COVER", cloud_cover_max))
            .map(_mask_landsat_clouds)
            .map(_apply_landsat_sr_scaling)
        )

    return _prep(LANDSAT8_ID).merge(_prep(LANDSAT9_ID))


# ---------------------------------------------------------------------------
# Retry-aware getInfo
# ---------------------------------------------------------------------------

def _safe_getinfo(obj: Any, retries: int = _MAX_RETRIES) -> Any:
    """
    Call ``.getInfo()`` with exponential-backoff retries for transient EE errors.

    Retries only on recognisable transient conditions (quota exhaustion,
    rate-limiting, timeouts, and temporary server unavailability).  Any other
    ``ee.EEException`` is re-raised immediately.

    Args:
        obj: Any EE server-side object (``ee.Image``, ``ee.Number``, etc.).
        retries: Maximum number of attempts before giving up.

    Raises:
        ee.EEException: After all retries are exhausted, or immediately for
                        non-transient errors.
    """
    for attempt in range(1, retries + 1):
        try:
            return obj.getInfo()
        except ee.EEException as exc:
            msg = str(exc).lower()
            is_transient = any(
                keyword in msg
                for keyword in ("quota", "too many", "timeout", "unavailable", "rate")
            )
            if is_transient and attempt < retries:
                wait = _RETRY_BACKOFF_S * attempt
                logger.warning(
                    "EE transient error (attempt %d/%d): %s — retrying in %.0fs.",
                    attempt, retries, exc, wait,
                )
                time.sleep(wait)
                continue
            raise
    # Unreachable, but satisfies type checkers.
    raise RuntimeError("_safe_getinfo: unexpected exit from retry loop.")
