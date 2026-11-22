"""
models.py
=========
Pydantic v2 data validation models for all EE query results.

Covers coordinate/geometry input, date ranges, per-image band statistics,
NDVI time series, water extent time series, and the top-level PDF report
container.
"""
from __future__ import annotations

import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator, model_validator


# ---------------------------------------------------------------------------
# Input / geometry models
# ---------------------------------------------------------------------------

class CoordinateModel(BaseModel):
    """A single WGS-84 point."""

    latitude: float = Field(..., ge=-90.0, le=90.0, description="Decimal degrees north.")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Decimal degrees east.")


class PolygonGeometryModel(BaseModel):
    """
    GeoJSON-style polygon geometry.

    ``coordinates`` is a list of rings, each ring being a closed sequence of
    (longitude, latitude) tuples.  At minimum one exterior ring is required.
    """

    coordinates: list[list[tuple[float, float]]] = Field(
        ..., min_length=1, description="List of rings: [(lon, lat), …] (closed)."
    )
    crs: str = Field(default="EPSG:4326")

    @field_validator("coordinates")
    @classmethod
    def validate_rings(
        cls, rings: list[list[tuple[float, float]]]
    ) -> list[list[tuple[float, float]]]:
        for idx, ring in enumerate(rings):
            if len(ring) < 4:
                raise ValueError(
                    f"Ring {idx} has {len(ring)} points; minimum is 4 (closed ring)."
                )
            if ring[0] != ring[-1]:
                raise ValueError(
                    f"Ring {idx} is not closed: first and last coordinates differ."
                )
        return rings


# ---------------------------------------------------------------------------
# Date range model
# ---------------------------------------------------------------------------

class DateRangeModel(BaseModel):
    """Validated, ordered date range for EE image collection filtering."""

    start_date: datetime.date
    end_date: datetime.date

    @model_validator(mode="after")
    def check_order(self) -> "DateRangeModel":
        if self.end_date <= self.start_date:
            raise ValueError(
                f"end_date ({self.end_date}) must be strictly after "
                f"start_date ({self.start_date})."
            )
        return self

    @property
    def start_str(self) -> str:
        """ISO 8601 start date string, as expected by EE filterDate."""
        return self.start_date.isoformat()

    @property
    def end_str(self) -> str:
        """ISO 8601 end date string, as expected by EE filterDate."""
        return self.end_date.isoformat()

    @property
    def duration_days(self) -> int:
        return (self.end_date - self.start_date).days


# ---------------------------------------------------------------------------
# Band statistics model (generic)
# ---------------------------------------------------------------------------

class BandStatisticsModel(BaseModel):
    """Descriptive statistics for a single image band over an ROI."""

    band_name: str
    mean: Optional[float] = None
    minimum: Optional[float] = None
    maximum: Optional[float] = None
    std_dev: Optional[float] = None
    pixel_count: Optional[int] = Field(default=None, ge=0)


# ---------------------------------------------------------------------------
# Agricultural / NDVI models
# ---------------------------------------------------------------------------

class NDVITimeStepModel(BaseModel):
    """NDVI statistics for one satellite image over the analysis polygon."""

    date: datetime.date
    ndvi_mean: float = Field(..., ge=-1.0, le=1.0)
    ndvi_min: float = Field(..., ge=-1.0, le=1.0)
    ndvi_max: float = Field(..., ge=-1.0, le=1.0)
    # SMAP surface soil moisture (mm); None when coarse SMAP pixel doesn't
    # overlap the parcel or no image exists for that date.
    soil_moisture_mean: Optional[float] = Field(default=None, ge=0.0)
    source_image_id: Optional[str] = None
    cloud_cover_pct: Optional[float] = Field(default=None, ge=0.0, le=100.0)

    @model_validator(mode="after")
    def check_ndvi_range_consistency(self) -> "NDVITimeStepModel":
        if self.ndvi_min > self.ndvi_mean:
            raise ValueError("ndvi_min must be ≤ ndvi_mean.")
        if self.ndvi_max < self.ndvi_mean:
            raise ValueError("ndvi_max must be ≥ ndvi_mean.")
        return self


class AgriculturalAnalysisModel(BaseModel):
    """Complete NDVI + soil-moisture analysis result for a single polygon parcel."""

    geometry_id: str = Field(..., description="Human-readable parcel identifier.")
    date_range: DateRangeModel
    satellite: str = Field(..., description="'LANDSAT' or 'SENTINEL2'.")
    ndvi_time_series: list[NDVITimeStepModel] = Field(default_factory=list)
    ndvi_overall_mean: Optional[float] = Field(default=None, ge=-1.0, le=1.0)
    soil_moisture_overall_mean: Optional[float] = Field(default=None, ge=0.0)
    # Qualitative rating derived from ndvi_overall_mean.
    pasture_health_rating: Optional[str] = None
    band_statistics: list[BandStatisticsModel] = Field(default_factory=list)
    notes: str = ""

    @field_validator("satellite")
    @classmethod
    def validate_satellite(cls, v: str) -> str:
        allowed = {"LANDSAT", "SENTINEL2"}
        if v.upper() not in allowed:
            raise ValueError(f"satellite must be one of {allowed}; got '{v}'.")
        return v.upper()


# ---------------------------------------------------------------------------
# Marshland / water extent models
# ---------------------------------------------------------------------------

class WaterExtentTimeStepModel(BaseModel):
    """Water extent statistics for one image over the analysis area."""

    date: datetime.date
    water_area_ha: float = Field(..., ge=0.0, description="Open-water area in hectares.")
    ndwi_mean: Optional[float] = Field(
        default=None, ge=-1.0, le=1.0,
        description="McFeeters NDWI mean over the ROI."
    )
    mndwi_mean: Optional[float] = Field(
        default=None, ge=-1.0, le=1.0,
        description="Xu Modified NDWI mean over the ROI."
    )
    source_image_id: Optional[str] = None


class MarshlandAnalysisModel(BaseModel):
    """Complete water extent + vegetation result for a wetland / marshland site."""

    site_name: str
    date_range: DateRangeModel
    satellite: str
    water_extent_time_series: list[WaterExtentTimeStepModel] = Field(default_factory=list)
    # e.g. "1834 General Land Office Survey" – cross-reference label for the report.
    historical_reference: Optional[str] = None
    total_analysis_area_ha: Optional[float] = Field(default=None, ge=0.0)
    max_water_extent_ha: Optional[float] = Field(default=None, ge=0.0)
    min_water_extent_ha: Optional[float] = Field(default=None, ge=0.0)
    mean_water_extent_ha: Optional[float] = Field(default=None, ge=0.0)
    vegetation_band_stats: list[BandStatisticsModel] = Field(default_factory=list)
    notes: str = ""

    @field_validator("satellite")
    @classmethod
    def validate_satellite(cls, v: str) -> str:
        allowed = {"LANDSAT", "SENTINEL2"}
        if v.upper() not in allowed:
            raise ValueError(f"satellite must be one of {allowed}; got '{v}'.")
        return v.upper()


# ---------------------------------------------------------------------------
# Top-level report container
# ---------------------------------------------------------------------------

class FullAnalysisReportModel(BaseModel):
    """
    Container that bundles one or more agricultural and marshland analyses
    into a single validated object, ready for PDF rendering.
    """

    report_title: str
    generated_at: datetime.datetime = Field(
        default_factory=lambda: datetime.datetime.now(datetime.timezone.utc),
        description="UTC timestamp of report generation.",
    )
    agricultural_analyses: list[AgriculturalAnalysisModel] = Field(default_factory=list)
    marshland_analyses: list[MarshlandAnalysisModel] = Field(default_factory=list)
    summary_notes: str = ""

    @model_validator(mode="after")
    def require_at_least_one_analysis(self) -> "FullAnalysisReportModel":
        if not self.agricultural_analyses and not self.marshland_analyses:
            raise ValueError(
                "A report must contain at least one agricultural or marshland analysis."
            )
        return self
