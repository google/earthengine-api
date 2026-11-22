"""
ee_custom_utils.py
==================
High-level orchestration entry point for the ``ee_utils`` package.

Provides single-call convenience functions that wire together the
agricultural monitor, marshland analyzer, Pydantic models, and PDF
reporter into complete end-to-end workflows.

Quick start
-----------
    import ee_utils
    from datetime import date

    ee_utils.initialize_ee(project="my-gcp-project")

    # 1. Analyze a pasture parcel
    result = ee_utils.analyze_pasture(
        coordinates=[[(lon, lat), ...]],   # closed ring
        start_date=date(2024, 4, 1),
        end_date=date(2024, 9, 30),
        geometry_id="north_pasture",
    )

    # 2. Analyze the Kankakee Marsh
    marsh = ee_utils.analyze_kankakee_marsh(
        start_date=date(2020, 1, 1),
        end_date=date(2024, 12, 31),
    )

    # 3. Generate a PDF report
    pdf = ee_utils.build_full_report(
        agricultural_analyses=[result],
        marshland_analyses=[marsh],
        report_title="Basin Land Analysis 2024",
        output_path="reports/analysis_2024.pdf",
    )
    print(f"Report saved: {pdf}")
"""
from __future__ import annotations

import logging
from datetime import date
from pathlib import Path
from typing import Optional, Union

import ee

from .agriculture import AgriculturalMonitor
from .marshland import MarshlandAnalyzer
from .models import (
    AgriculturalAnalysisModel,
    DateRangeModel,
    FullAnalysisReportModel,
    MarshlandAnalysisModel,
    PolygonGeometryModel,
)
from .reporting import generate_pdf_report

__all__ = [
    # Initialisation
    "initialize_ee",
    # One-call workflows
    "analyze_pasture",
    "analyze_kankakee_marsh",
    "build_full_report",
    # Low-level classes (for advanced use)
    "AgriculturalMonitor",
    "MarshlandAnalyzer",
    # Pydantic models (re-exported for convenience)
    "DateRangeModel",
    "PolygonGeometryModel",
    "AgriculturalAnalysisModel",
    "MarshlandAnalysisModel",
    "FullAnalysisReportModel",
    # Reporting
    "generate_pdf_report",
]

logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Initialisation
# ---------------------------------------------------------------------------

def initialize_ee(
    project: Optional[str] = None,
    service_account: Optional[str] = None,
    key_file: Optional[Union[str, Path]] = None,
    use_high_volume: bool = False,
) -> None:
    """
    Authenticate and initialise the Earth Engine API.

    Authentication priority
    -----------------------
    1. **Service-account key file** — for non-interactive / server environments.
       Both ``service_account`` and ``key_file`` must be supplied.
    2. **Application-default credentials** — for interactive local development.
       Calls ``ee.Authenticate()`` only when credentials are absent; subsequent
       runs reuse the cached token.

    Args:
        project: GCP project ID.  Required for the high-volume endpoint and
                 recommended for all production use.
        service_account: Service account email address (e.g.
                         ``"my-sa@project.iam.gserviceaccount.com"``).
        key_file: Path to the JSON private-key file for the service account.
        use_high_volume: Enable the EE high-volume endpoint, which raises
                         per-request pixel limits.  Requires a billing-enabled
                         GCP project.

    Raises:
        ee.EEException: On authentication failure or invalid project.
        FileNotFoundError: If ``key_file`` is supplied but does not exist.
    """
    if service_account and key_file:
        key_path = Path(key_file)
        if not key_path.is_file():
            raise FileNotFoundError(f"EE key file not found: {key_path}")
        credentials = ee.ServiceAccountCredentials(service_account, str(key_path))
        ee.Initialize(credentials=credentials, project=project)
        logger.info("EE initialised with service account: %s", service_account)
    else:
        try:
            ee.Initialize(project=project)
            logger.info("EE initialised with cached application-default credentials.")
        except ee.EEException:
            logger.info("Cached credentials absent; running ee.Authenticate().")
            ee.Authenticate()
            ee.Initialize(project=project)
            logger.info("EE initialised after interactive authentication.")

    if use_high_volume:
        if hasattr(ee.data, "setCloudApiEnabled"):
            ee.data.setCloudApiEnabled(True)
            logger.info("EE high-volume Cloud API endpoint enabled.")
        else:
            logger.warning(
                "The installed Earth Engine client does not expose "
                "setCloudApiEnabled(); continuing without the high-volume "
                "Cloud API endpoint."
            )


# ---------------------------------------------------------------------------
# One-call workflows
# ---------------------------------------------------------------------------

def analyze_pasture(
    coordinates: list[list[tuple[float, float]]],
    start_date: date,
    end_date: date,
    geometry_id: str = "parcel",
    satellite: str = "LANDSAT",
    cloud_cover_max: float = 30.0,
    include_band_stats: bool = True,
) -> AgriculturalAnalysisModel:
    """
    Full NDVI + soil-moisture analysis for a single polygon parcel.

    The function validates all inputs through the Pydantic model layer before
    issuing any EE requests.

    Args:
        coordinates: GeoJSON-style polygon ring list, e.g.
                     ``[[(lon, lat), (lon, lat), …, (lon, lat)]]``.
                     The outer ring must be closed (first == last point).
        start_date: Analysis start date (inclusive).
        end_date: Analysis end date (exclusive, following EE convention).
        geometry_id: Human-readable parcel label for reports.
        satellite: ``"LANDSAT"`` (30 m) or ``"SENTINEL2"`` (10 m).
        cloud_cover_max: Maximum cloud cover percentage for image inclusion.
        include_band_stats: If ``True``, compute median composite band
                            statistics in addition to the time series.

    Returns:
        Validated ``AgriculturalAnalysisModel``.

    Raises:
        pydantic.ValidationError: On invalid coordinates or date range.
        ee.EEException: On EE quota or server errors after retries.
    """
    # Validate geometry via Pydantic before touching EE
    PolygonGeometryModel(coordinates=coordinates)
    date_range = DateRangeModel(start_date=start_date, end_date=end_date)

    # EE Geometry.Polygon expects [[lon, lat], ...] per ring
    ee_rings = [[list(pt) for pt in ring] for ring in coordinates]
    geometry = ee.Geometry.Polygon(ee_rings)

    monitor = AgriculturalMonitor(
        geometry=geometry,
        geometry_id=geometry_id,
        satellite=satellite,
    )
    return monitor.run_full_analysis(
        date_range,
        cloud_cover_max=cloud_cover_max,
        include_band_stats=include_band_stats,
    )


def analyze_kankakee_marsh(
    start_date: date,
    end_date: date,
    custom_geometry: Optional[ee.Geometry] = None,
    custom_geometry_coordinates: Optional[list[list[tuple[float, float]]]] = None,
    satellite: str = "LANDSAT",
    historical_reference: str = "1834 General Land Office Survey",
    cloud_cover_max: float = 30.0,
    include_vegetation_stats: bool = True,
) -> MarshlandAnalysisModel:
    """
    Water-extent + vegetation analysis for the Grand Kankakee Marsh.

    When neither ``custom_geometry`` nor ``custom_geometry_coordinates`` is
    provided the analysis defaults to the approximate bounding box of the
    historic Grand Kankakee Marsh (NW Indiana / NE Illinois), making this
    the zero-configuration Kankakee workflow entry point.

    For the historical cross-reference workflow, supply the 1834 GLO boundary
    as an ``ee.Geometry`` (digitised from scanned plat maps) to
    ``MarshlandAnalyzer.get_composite(historical_geometry=…)`` after calling
    this function.

    Args:
        start_date: Analysis start date.
        end_date: Analysis end date.
        custom_geometry: Pre-built ``ee.Geometry`` override.
        custom_geometry_coordinates: Polygon ring list (same format as
                                      ``analyze_pasture``).  Ignored when
                                      ``custom_geometry`` is provided.
        satellite: ``"LANDSAT"`` (30 m) or ``"SENTINEL2"`` (10 m).
        historical_reference: Label cross-referenced in the PDF report.
        cloud_cover_max: Maximum cloud cover % for image inclusion.
        include_vegetation_stats: Whether to compute median band statistics.

    Returns:
        Validated ``MarshlandAnalysisModel``.

    Raises:
        pydantic.ValidationError: On invalid date range.
        ee.EEException: On EE quota or server errors after retries.
    """
    date_range = DateRangeModel(start_date=start_date, end_date=end_date)

    geometry: Optional[ee.Geometry] = custom_geometry
    if geometry is None and custom_geometry_coordinates is not None:
        PolygonGeometryModel(coordinates=custom_geometry_coordinates)
        ee_rings = [[list(pt) for pt in ring] for ring in custom_geometry_coordinates]
        geometry = ee.Geometry.Polygon(ee_rings)

    analyzer = MarshlandAnalyzer(
        geometry=geometry,
        satellite=satellite,
        historical_reference=historical_reference,
    )
    return analyzer.run_full_analysis(
        date_range,
        cloud_cover_max=cloud_cover_max,
        include_vegetation_stats=include_vegetation_stats,
    )


def build_full_report(
    agricultural_analyses: list[AgriculturalAnalysisModel],
    marshland_analyses: list[MarshlandAnalysisModel],
    report_title: str,
    output_path: Union[str, Path],
    summary_notes: str = "",
) -> Path:
    """
    Bundle analysis results into a validated report and render a PDF.

    Args:
        agricultural_analyses: Results from ``analyze_pasture()`` calls.
        marshland_analyses: Results from ``analyze_kankakee_marsh()`` calls.
        report_title: Title displayed on the PDF cover page.
        output_path: Destination path for the PDF (directories auto-created).
        summary_notes: Optional executive-summary text for the cover page.

    Returns:
        Resolved ``Path`` of the written PDF file.

    Raises:
        pydantic.ValidationError: If both analysis lists are empty.
        OSError: If the output directory cannot be created.
    """
    report = FullAnalysisReportModel(
        report_title=report_title,
        agricultural_analyses=agricultural_analyses,
        marshland_analyses=marshland_analyses,
        summary_notes=summary_notes,
    )
    return generate_pdf_report(report, output_path)
