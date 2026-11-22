"""
marshland.py
============
Historical and modern satellite analysis for wetland / marshland sites.

Optimized for the Grand Kankakee Marsh cross-reference workflow:
  - Modern NDWI / MNDWI water-extent mapping from Landsat 8+9 or Sentinel-2.
  - Historical boundary alignment (e.g. 1834 GLO survey geometry as an
    ``ee.Geometry`` derived from digitised plat maps).
  - Temporal water-extent time series for trend analysis.
  - Median composites clipped to user-supplied or default Kankakee ROI.

Satellite support:
  - Landsat 8 + 9 merged (Collection 2 SR, 30 m) — maximises revisit to ~8 days.
  - Sentinel-2 SR Harmonised (10 m).
"""
from __future__ import annotations

import logging
from datetime import date
from typing import Any, Optional

import ee

from .constants import (
    KANKAKEE_MARSH_BBOX,
    MAX_COLLECTION_SIZE,
    MAX_PIXELS,
    SCALE_LANDSAT,
    SCALE_SENTINEL2,
    SENTINEL2_BANDS,
    SENTINEL2_SR_ID,
    LANDSAT_BANDS,
)
from .helpers import (
    _build_landsat_collection,
    _compute_mndwi,
    _compute_ndwi,
    _mask_sentinel2_clouds,
    _safe_getinfo,
)
from .models import (
    BandStatisticsModel,
    DateRangeModel,
    MarshlandAnalysisModel,
    WaterExtentTimeStepModel,
)

logger = logging.getLogger(__name__)

# MNDWI threshold for water classification (Xu 2006 recommends 0.0)
_WATER_THRESHOLD: float = 0.0


# ---------------------------------------------------------------------------
# MarshlandAnalyzer class
# ---------------------------------------------------------------------------

class MarshlandAnalyzer:
    """
    Water-extent and vegetation analyzer for wetland / marshland sites.

    When ``geometry`` is omitted the class defaults to the approximate
    bounding box of the historic Grand Kankakee Marsh (NW Indiana / NE
    Illinois), making it directly usable for the Kankakee cross-reference
    workflow without any additional configuration.

    Parameters
    ----------
    geometry:
        ``ee.Geometry`` for the analysis area.  Defaults to the Kankakee
        Marsh bounding box when ``None``.
    site_name:
        Human-readable label used in result models and PDF reports.
        Defaults to ``"Grand Kankakee Marsh"`` when ``geometry`` is ``None``.
    satellite:
        ``"LANDSAT"`` (30 m) or ``"SENTINEL2"`` (10 m).
    historical_reference:
        Descriptive label for the historical data cross-reference
        (e.g. ``"1834 General Land Office Survey"``).

    Examples
    --------
    >>> analyzer = MarshlandAnalyzer(
    ...     historical_reference="1834 GLO Survey",
    ... )
    >>> result = analyzer.run_full_analysis(date_range)
    """

    _DEFAULT_SITE = "Grand Kankakee Marsh"

    def __init__(
        self,
        geometry: Optional[ee.Geometry] = None,
        site_name: str = "",
        satellite: str = "LANDSAT",
        historical_reference: Optional[str] = None,
    ) -> None:
        sat = satellite.upper()
        if sat not in ("LANDSAT", "SENTINEL2"):
            raise ValueError("satellite must be 'LANDSAT' or 'SENTINEL2'.")

        if geometry is None:
            west, south, east, north = KANKAKEE_MARSH_BBOX
            geometry = ee.Geometry.Rectangle([west, south, east, north])
            # Only apply the default site name when no custom geometry was given.
            if not site_name:
                site_name = self._DEFAULT_SITE

        # If a custom geometry was passed without a site name, use a sensible default.
        if not site_name:
            site_name = "Custom Wetland Site"

        self.geometry = geometry
        self.site_name = site_name
        self.satellite = sat
        self.historical_reference = historical_reference

        if sat == "SENTINEL2":
            self._bands = SENTINEL2_BANDS
            self._scale = SCALE_SENTINEL2
        else:
            self._bands = LANDSAT_BANDS
            self._scale = SCALE_LANDSAT

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _build_collection(
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
        return _build_landsat_collection(
            geometry=self.geometry,
            start_str=date_range.start_str,
            end_str=date_range.end_str,
            cloud_cover_max=cloud_cover_max,
        )

    def _water_extent_for_image(self, img: ee.Image) -> dict[str, Any]:
        """
        Compute MNDWI-based water area (ha) and index means for one image.

        Returns:
            Dict with keys ``water_area_ha``, ``ndwi_mean``, ``mndwi_mean``.
        """
        green = self._bands["green"]
        nir = self._bands["nir"]
        swir1 = self._bands["swir1"]

        ndwi = _compute_ndwi(img, green, nir)
        mndwi = _compute_mndwi(img, green, swir1)

        # Pixels where MNDWI > threshold are classified as open water.
        water_mask = mndwi.gt(_WATER_THRESHOLD)

        # pixelArea() returns m²; divide by 10 000 → hectares.
        # The resulting single-band image is named "area".
        water_ha_image = (
            ee.Image.pixelArea()
            .divide(10_000)
            .updateMask(water_mask)
        )
        water_area_result = _safe_getinfo(
            water_ha_image.reduceRegion(
                reducer=ee.Reducer.sum(),
                geometry=self.geometry,
                scale=self._scale,
                maxPixels=MAX_PIXELS,
                bestEffort=True,
            )
        )
        # pixelArea() always names its band "area".
        water_ha = float(water_area_result.get("area") or 0.0)

        ndwi_result = _safe_getinfo(
            ndwi.reduceRegion(
                reducer=ee.Reducer.mean(),
                geometry=self.geometry,
                scale=self._scale,
                maxPixels=MAX_PIXELS,
                bestEffort=True,
            )
        )
        mndwi_result = _safe_getinfo(
            mndwi.reduceRegion(
                reducer=ee.Reducer.mean(),
                geometry=self.geometry,
                scale=self._scale,
                maxPixels=MAX_PIXELS,
                bestEffort=True,
            )
        )

        return {
            "water_area_ha": water_ha,
            "ndwi_mean": ndwi_result.get("NDWI"),
            "mndwi_mean": mndwi_result.get("MNDWI"),
        }

    # ------------------------------------------------------------------
    # Public methods
    # ------------------------------------------------------------------

    def get_water_extent_series(
        self,
        date_range: DateRangeModel,
        cloud_cover_max: float = 30.0,
    ) -> list[WaterExtentTimeStepModel]:
        """
        Return per-image MNDWI water-extent statistics for the date range.

        Args:
            date_range: Analysis period.
            cloud_cover_max: Maximum cloud cover % (0–100).

        Returns:
            List of WaterExtentTimeStepModel, sorted by date.
        """
        col = self._build_collection(date_range, cloud_cover_max)
        count = _safe_getinfo(col.size())

        if count == 0:
            logger.warning(
                "No imagery for '%s' [%s → %s].",
                self.site_name, date_range.start_str, date_range.end_str,
            )
            return []

        capped = min(count, MAX_COLLECTION_SIZE)
        if count > MAX_COLLECTION_SIZE:
            logger.warning(
                "%d images found; capped at %d.", count, MAX_COLLECTION_SIZE
            )

        image_list = col.toList(capped)
        results: list[WaterExtentTimeStepModel] = []

        for i in range(capped):
            img = ee.Image(image_list.get(i))
            try:
                ts_ms = _safe_getinfo(img.get("system:time_start"))
                if ts_ms is None:
                    continue
                img_date = date.fromtimestamp(ts_ms / 1000)
                img_id = _safe_getinfo(img.get("system:id"))
                water_data = self._water_extent_for_image(img)

                ndwi_val = water_data["ndwi_mean"]
                mndwi_val = water_data["mndwi_mean"]

                results.append(
                    WaterExtentTimeStepModel(
                        date=img_date,
                        water_area_ha=round(water_data["water_area_ha"], 2),
                        ndwi_mean=round(float(ndwi_val), 4) if ndwi_val is not None else None,
                        mndwi_mean=round(float(mndwi_val), 4) if mndwi_val is not None else None,
                        source_image_id=img_id,
                    )
                )
            except (ee.EEException, ValueError, TypeError) as exc:
                logger.warning("Skipping image %d / %d: %s", i + 1, capped, exc)

        results.sort(key=lambda s: s.date)
        logger.info(
            "Water extent series for '%s': %d images processed.",
            self.site_name, len(results),
        )
        return results

    def align_with_historical_boundary(
        self,
        historical_geometry: ee.Geometry,
        label: str = "Historical Boundary",
    ) -> ee.Image:
        """
        Create a binary mask image aligned to a historical survey boundary.

        Use this to clip any modern composite to the 1834-surveyed extent,
        enabling direct visual and statistical comparison against current
        satellite imagery.

        Args:
            historical_geometry: ``ee.Geometry`` digitised from the original
                                  GLO survey record.
            label: Band name for the resulting mask image.

        Returns:
            Single-band ``ee.Image`` (1 = inside boundary, masked = outside).
        """
        mask = ee.Image.constant(1).clip(historical_geometry).rename(label)
        logger.info("Historical boundary mask created: '%s'.", label)
        return mask

    def get_composite(
        self,
        date_range: DateRangeModel,
        cloud_cover_max: float = 30.0,
        historical_geometry: Optional[ee.Geometry] = None,
    ) -> ee.Image:
        """
        Return a median composite clipped to the ROI (or historical boundary).

        Args:
            date_range: Analysis period.
            cloud_cover_max: Cloud filter %.
            historical_geometry: If supplied, the composite is additionally
                                  masked to this historical boundary.

        Returns:
            Median ``ee.Image`` ready for visualisation or export.
        """
        composite = (
            self._build_collection(date_range, cloud_cover_max)
            .median()
            .clip(self.geometry)
        )
        if historical_geometry is not None:
            hist_mask = self.align_with_historical_boundary(historical_geometry)
            composite = composite.updateMask(hist_mask)
        return composite

    def compute_vegetation_band_stats(
        self,
        date_range: DateRangeModel,
        cloud_cover_max: float = 30.0,
    ) -> list[BandStatisticsModel]:
        """Compute median composite band statistics for vegetation-relevant bands."""
        bands = [
            self._bands["nir"],
            self._bands["green"],
            self._bands["swir1"],
            self._bands["red"],
        ]
        composite = (
            self._build_collection(date_range, cloud_cover_max)
            .select(bands)
            .median()
            .clip(self.geometry)
        )

        results: list[BandStatisticsModel] = []
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

    def run_full_analysis(
        self,
        date_range: DateRangeModel,
        cloud_cover_max: float = 30.0,
        include_vegetation_stats: bool = True,
    ) -> MarshlandAnalysisModel:
        """
        Execute the complete water-extent + vegetation analysis pipeline.

        Returns a fully validated ``MarshlandAnalysisModel`` ready for
        ``generate_pdf_report()``.

        Args:
            date_range: Analysis period.
            cloud_cover_max: Maximum cloud cover % to include images.
            include_vegetation_stats: Whether to compute median band statistics.
        """
        logger.info(
            "Marshland analysis started | site='%s' | %s → %s | sat=%s",
            self.site_name, date_range.start_str, date_range.end_str, self.satellite,
        )

        water_series = self.get_water_extent_series(date_range, cloud_cover_max)
        water_areas = [s.water_area_ha for s in water_series]

        # Total ROI area
        try:
            area_m2 = _safe_getinfo(self.geometry.area(maxError=1))
            total_area_ha = round(float(area_m2) / 10_000, 2)
        except (ee.EEException, TypeError):
            total_area_ha = None

        veg_stats: list[BandStatisticsModel] = []
        if include_vegetation_stats and water_series:
            veg_stats = self.compute_vegetation_band_stats(date_range, cloud_cover_max)

        logger.info(
            "Marshland analysis complete | site='%s' | images=%d | mean_water=%.1f ha",
            self.site_name,
            len(water_series),
            (sum(water_areas) / len(water_areas)) if water_areas else 0.0,
        )

        return MarshlandAnalysisModel(
            site_name=self.site_name,
            date_range=date_range,
            satellite=self.satellite,
            water_extent_time_series=water_series,
            historical_reference=self.historical_reference,
            total_analysis_area_ha=total_area_ha,
            max_water_extent_ha=round(max(water_areas), 2) if water_areas else None,
            min_water_extent_ha=round(min(water_areas), 2) if water_areas else None,
            mean_water_extent_ha=(
                round(sum(water_areas) / len(water_areas), 2) if water_areas else None
            ),
            vegetation_band_stats=veg_stats,
        )
