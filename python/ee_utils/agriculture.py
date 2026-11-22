"""
agriculture.py
==============
NDVI and soil-moisture monitoring for agricultural parcels and pasture land.

Designed for:
  - Evaluating pasture health and vegetable-crop viability.
  - Estimating livestock watering needs from soil-moisture data.
  - Time-series analysis over user-defined polygon geometries.

Satellite support:
  - Landsat 8 + 9 merged (Collection 2 SR, 30 m) — maximises revisit to ~8 days.
  - Sentinel-2 SR Harmonised (10 m).

Soil moisture: NASA USDA SMAP 10 km daily composite.
"""
from __future__ import annotations

import logging
from datetime import date, timedelta
from typing import Any, Optional

import ee

from .constants import (
    MAX_COLLECTION_SIZE,
    MAX_PIXELS,
    PASTURE_HEALTH_THRESHOLDS,
    SCALE_LANDSAT,
    SCALE_SENTINEL2,
    SCALE_SMAP,
    SENTINEL2_BANDS,
    SENTINEL2_SR_ID,
    SMAP_SOIL_MOISTURE_ID,
    LANDSAT_BANDS,
)
from .helpers import (
    _build_landsat_collection,
    _compute_ndvi,
    _mask_sentinel2_clouds,
    _safe_getinfo,
)
from .models import (
    AgriculturalAnalysisModel,
    BandStatisticsModel,
    DateRangeModel,
    NDVITimeStepModel,
)

logger = logging.getLogger(__name__)

# Window (days) used when matching SMAP dates to optical image dates.
# SMAP is a ~10 km daily composite; a ±1-day window handles minor timestamp
# offsets between the two datasets without introducing erroneous matches.
_SMAP_DATE_WINDOW_DAYS: int = 1


# ---------------------------------------------------------------------------
# AgriculturalMonitor class
# ---------------------------------------------------------------------------

class AgriculturalMonitor:
    """
    Computes NDVI and soil-moisture time series for a polygon parcel.

    Parameters
    ----------
    geometry:
        An ``ee.Geometry`` representing the analysis polygon.
    geometry_id:
        Human-readable label (written into the result model and PDF report).
    satellite:
        ``"LANDSAT"`` (30 m, Landsat 8/9 C2 SR) or ``"SENTINEL2"`` (10 m).

    Examples
    --------
    >>> monitor = AgriculturalMonitor(
    ...     geometry=ee.Geometry.Polygon([...]),
    ...     geometry_id="north_pasture",
    ...     satellite="LANDSAT",
    ... )
    >>> result = monitor.run_full_analysis(date_range)
    """

    def __init__(
        self,
        geometry: ee.Geometry,
        geometry_id: str = "unnamed_parcel",
        satellite: str = "LANDSAT",
    ) -> None:
        sat = satellite.upper()
        if sat not in ("LANDSAT", "SENTINEL2"):
            raise ValueError("satellite must be 'LANDSAT' or 'SENTINEL2'.")

        self.geometry = geometry
        self.geometry_id = geometry_id
        self.satellite = sat

        if sat == "SENTINEL2":
            self._bands = SENTINEL2_BANDS
            self._scale = SCALE_SENTINEL2
        else:
            # Landsat: both L8 and L9 share the same band names and scale
            self._bands = LANDSAT_BANDS
            self._scale = SCALE_LANDSAT

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _build_optical_collection(
        self, date_range: DateRangeModel, cloud_cover_max: float
    ) -> ee.ImageCollection:
        """
        Filter, cloud-mask, and scale-correct the imagery collection.

        For Landsat, merges Landsat 8 and Landsat 9 to achieve ~8-day
        revisit (compared to ~16 days from a single mission).
        """
        if self.satellite == "SENTINEL2":
            return (
                ee.ImageCollection(SENTINEL2_SR_ID)
                .filterBounds(self.geometry)
                .filterDate(date_range.start_str, date_range.end_str)
                .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", cloud_cover_max))
                .map(_mask_sentinel2_clouds)
            )
        # Merged Landsat 8 + 9
        return _build_landsat_collection(
            geometry=self.geometry,
            start_str=date_range.start_str,
            end_str=date_range.end_str,
            cloud_cover_max=cloud_cover_max,
        )

    def _build_smap_collection(self, date_range: DateRangeModel) -> ee.ImageCollection:
        return (
            ee.ImageCollection(SMAP_SOIL_MOISTURE_ID)
            .filterBounds(self.geometry)
            .filterDate(date_range.start_str, date_range.end_str)
            .select("ssm")  # surface soil moisture in mm
        )

    def _reduce_band(
        self, image: ee.Image, band: str, scale: Optional[int] = None
    ) -> dict[str, Any]:
        """reduceRegion for mean + min/max over the parcel geometry."""
        s = scale or self._scale
        return _safe_getinfo(
            image.select(band).reduceRegion(
                reducer=(
                    ee.Reducer.mean()
                    .combine(ee.Reducer.minMax(), sharedInputs=True)
                ),
                geometry=self.geometry,
                scale=s,
                maxPixels=MAX_PIXELS,
                bestEffort=True,
            )
        )

    # ------------------------------------------------------------------
    # Public methods
    # ------------------------------------------------------------------

    def compute_ndvi_time_series(
        self,
        date_range: DateRangeModel,
        cloud_cover_max: float = 30.0,
    ) -> list[NDVITimeStepModel]:
        """
        Return per-image NDVI statistics for every image in the date range.

        Args:
            date_range: Validated DateRangeModel.
            cloud_cover_max: Maximum cloud cover percentage (0–100).

        Returns:
            List of NDVITimeStepModel, one per usable image, sorted by date.
        """
        nir = self._bands["nir"]
        red = self._bands["red"]

        def add_ndvi(img: ee.Image) -> ee.Image:
            return img.addBands(_compute_ndvi(img, nir, red))

        col = self._build_optical_collection(date_range, cloud_cover_max).map(add_ndvi)
        count = _safe_getinfo(col.size())

        if count == 0:
            logger.warning(
                "No images found for '%s' [%s → %s] with ≤%.0f%% cloud cover.",
                self.geometry_id, date_range.start_str, date_range.end_str, cloud_cover_max,
            )
            return []

        if count > MAX_COLLECTION_SIZE:
            logger.warning(
                "%d images found; capped at %d to avoid EE memory limits.",
                count, MAX_COLLECTION_SIZE,
            )
            count = MAX_COLLECTION_SIZE

        image_list = col.toList(count)
        results: list[NDVITimeStepModel] = []

        for i in range(count):
            img = ee.Image(image_list.get(i))
            try:
                ts_ms = _safe_getinfo(img.get("system:time_start"))
                if ts_ms is None:
                    continue
                img_date = date.fromtimestamp(ts_ms / 1000)
                img_id = _safe_getinfo(img.get("system:id"))

                cloud_pct = None
                if self.satellite == "SENTINEL2":
                    cloud_pct = _safe_getinfo(img.get("CLOUDY_PIXEL_PERCENTAGE"))
                else:
                    cloud_pct = _safe_getinfo(img.get("CLOUD_COVER"))

                stats = self._reduce_band(img, "NDVI")
                ndvi_mean = stats.get("NDVI_mean") or stats.get("NDVI")
                ndvi_min = stats.get("NDVI_min", ndvi_mean)
                ndvi_max = stats.get("NDVI_max", ndvi_mean)

                if ndvi_mean is None:
                    logger.debug("No NDVI pixels in parcel for %s; skipping.", img_date)
                    continue

                results.append(
                    NDVITimeStepModel(
                        date=img_date,
                        ndvi_mean=round(float(ndvi_mean), 4),
                        ndvi_min=round(float(ndvi_min), 4),
                        ndvi_max=round(float(ndvi_max), 4),
                        source_image_id=img_id,
                        cloud_cover_pct=(
                            round(float(cloud_pct), 1) if cloud_pct is not None else None
                        ),
                    )
                )
            except (ee.EEException, ValueError, TypeError) as exc:
                logger.warning("Skipping image %d / %d: %s", i + 1, count, exc)

        results.sort(key=lambda s: s.date)
        logger.info(
            "NDVI time series for '%s': %d images processed.", self.geometry_id, len(results)
        )
        return results

    def compute_soil_moisture_series(
        self, date_range: DateRangeModel
    ) -> list[tuple[date, float]]:
        """
        Return SMAP surface soil moisture (mm) per available daily image.

        Note: SMAP resolution is ~10 km.  For small parcels the value
        represents the containing pixel, not a parcel average.

        Returns:
            List of (date, soil_moisture_mm) tuples, sorted by date.
        """
        col = self._build_smap_collection(date_range)
        count = _safe_getinfo(col.size())

        if count == 0:
            logger.warning(
                "No SMAP data found for '%s' [%s → %s].",
                self.geometry_id, date_range.start_str, date_range.end_str,
            )
            return []

        image_list = col.toList(min(count, MAX_COLLECTION_SIZE))
        results: list[tuple[date, float]] = []

        for i in range(min(count, MAX_COLLECTION_SIZE)):
            img = ee.Image(image_list.get(i))
            try:
                ts_ms = _safe_getinfo(img.get("system:time_start"))
                if ts_ms is None:
                    continue
                img_date = date.fromtimestamp(ts_ms / 1000)
                stats = _safe_getinfo(
                    img.reduceRegion(
                        reducer=ee.Reducer.mean(),
                        geometry=self.geometry,
                        scale=SCALE_SMAP,
                        maxPixels=MAX_PIXELS,
                        bestEffort=True,
                    )
                )
                ssm = stats.get("ssm")
                if ssm is not None:
                    results.append((img_date, round(float(ssm), 3)))
            except (ee.EEException, ValueError, TypeError) as exc:
                logger.warning("Skipping SMAP image %d: %s", i + 1, exc)

        results.sort(key=lambda x: x[0])
        return results

    def compute_band_statistics(
        self,
        date_range: DateRangeModel,
        bands: Optional[list[str]] = None,
        cloud_cover_max: float = 30.0,
    ) -> list[BandStatisticsModel]:
        """
        Return median-composite band statistics for the given bands.

        Args:
            date_range: Analysis period.
            bands: List of band names (defaults to NIR, Red, SWIR1, Green).
            cloud_cover_max: Cloud filter threshold.

        Returns:
            List of BandStatisticsModel, one per band.
        """
        if bands is None:
            bands = [
                self._bands["nir"],
                self._bands["red"],
                self._bands["swir1"],
                self._bands["green"],
            ]

        composite = (
            self._build_optical_collection(date_range, cloud_cover_max)
            .select(bands)
            .median()
            .clip(self.geometry)
        )

        results = []
        for band in bands:
            try:
                stats = _safe_getinfo(
                    composite.select(band).reduceRegion(
                        reducer=(
                            ee.Reducer.mean()
                            .combine(ee.Reducer.minMax(), sharedInputs=True)
                            .combine(ee.Reducer.stdDev(), sharedInputs=True)
                        ),
                        geometry=self.geometry,
                        scale=self._scale,
                        maxPixels=MAX_PIXELS,
                        bestEffort=True,
                    )
                )
                results.append(
                    BandStatisticsModel(
                        band_name=band,
                        mean=stats.get(f"{band}_mean"),
                        minimum=stats.get(f"{band}_min"),
                        maximum=stats.get(f"{band}_max"),
                        std_dev=stats.get(f"{band}_stdDev"),
                    )
                )
            except (ee.EEException, ValueError) as exc:
                logger.warning("Band stats failed for '%s': %s", band, exc)

        return results

    @staticmethod
    def _rate_pasture_health(ndvi_mean: float) -> str:
        """Map a mean NDVI value to a qualitative pasture health category."""
        if ndvi_mean >= PASTURE_HEALTH_THRESHOLDS["Excellent"]:
            return "Excellent"
        if ndvi_mean >= PASTURE_HEALTH_THRESHOLDS["Good"]:
            return "Good"
        if ndvi_mean >= PASTURE_HEALTH_THRESHOLDS["Fair"]:
            return "Fair"
        return "Poor"

    def run_full_analysis(
        self,
        date_range: DateRangeModel,
        cloud_cover_max: float = 30.0,
        include_band_stats: bool = True,
    ) -> AgriculturalAnalysisModel:
        """
        Execute the complete NDVI + soil-moisture analysis pipeline.

        Returns a fully validated ``AgriculturalAnalysisModel`` ready for
        direct use with ``generate_pdf_report()``.

        Args:
            date_range: Analysis period (validated DateRangeModel).
            cloud_cover_max: Maximum cloud cover % to include images.
            include_band_stats: Whether to compute median band statistics.
        """
        logger.info(
            "Agricultural analysis started | parcel='%s' | %s → %s | sat=%s",
            self.geometry_id, date_range.start_str, date_range.end_str, self.satellite,
        )

        ndvi_series = self.compute_ndvi_time_series(date_range, cloud_cover_max)
        sm_series = self.compute_soil_moisture_series(date_range)

        # Merge soil-moisture values into NDVI time steps using a ±N-day
        # window, not exact equality.  SMAP is a daily composite but its
        # system:time_start timestamp can differ from the optical image
        # timestamp by up to a day, especially across UTC midnight.
        sm_by_date: dict[date, float] = dict(sm_series)
        window = timedelta(days=_SMAP_DATE_WINDOW_DAYS)
        for step in ndvi_series:
            # Exact match first; fall back to nearest within window.
            if step.date in sm_by_date:
                step.soil_moisture_mean = sm_by_date[step.date]
            else:
                candidates = [
                    (abs((d - step.date).days), v)
                    for d, v in sm_by_date.items()
                    if abs((d - step.date).days) <= _SMAP_DATE_WINDOW_DAYS
                ]
                if candidates:
                    step.soil_moisture_mean = min(candidates, key=lambda x: x[0])[1]

        ndvi_means = [s.ndvi_mean for s in ndvi_series]
        sm_values = [v for _, v in sm_series]

        overall_ndvi = (
            round(sum(ndvi_means) / len(ndvi_means), 4) if ndvi_means else None
        )
        overall_sm = (
            round(sum(sm_values) / len(sm_values), 3) if sm_values else None
        )
        health_rating = (
            self._rate_pasture_health(overall_ndvi)
            if overall_ndvi is not None
            else None
        )

        band_stats: list[BandStatisticsModel] = []
        if include_band_stats:
            band_stats = self.compute_band_statistics(date_range, cloud_cover_max=cloud_cover_max)

        logger.info(
            "Agricultural analysis complete | parcel='%s' | images=%d | "
            "NDVI_mean=%.4f | health=%s",
            self.geometry_id,
            len(ndvi_series),
            overall_ndvi or 0.0,
            health_rating or "N/A",
        )

        return AgriculturalAnalysisModel(
            geometry_id=self.geometry_id,
            date_range=date_range,
            satellite=self.satellite,
            ndvi_time_series=ndvi_series,
            ndvi_overall_mean=overall_ndvi,
            soil_moisture_overall_mean=overall_sm,
            pasture_health_rating=health_rating,
            band_statistics=band_stats,
        )
