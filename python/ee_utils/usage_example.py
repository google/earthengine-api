"""
usage_example.py
================
End-to-end demonstration of the ee_utils custom utility layer.

Covers:
  1. EE initialisation.
  2. Agricultural / pasture NDVI + soil-moisture analysis on a sample parcel.
  3. Grand Kankakee Marsh water-extent + vegetation analysis.
  4. Historical boundary alignment (stub showing the API surface).
  5. PDF report generation.

Run from the ``python/`` directory with EE credentials already configured:

    python -m ee_utils.usage_example
"""
from __future__ import annotations

import sys
from datetime import date
from pathlib import Path

# ---------------------------------------------------------------------------
# 0. Ensure the package root is on sys.path when run directly
# ---------------------------------------------------------------------------
_PKG_ROOT = Path(__file__).resolve().parent.parent
if str(_PKG_ROOT) not in sys.path:
    sys.path.insert(0, str(_PKG_ROOT))

import ee
import ee_utils


# ---------------------------------------------------------------------------
# 1. Initialisation
# ---------------------------------------------------------------------------
def main() -> None:
    print("Initialising Earth Engine…")
    ee_utils.initialize_ee(
        # project="your-gcp-project-id",  # uncomment and set your project
        # service_account="sa@project.iam.gserviceaccount.com",
        # key_file=Path("path/to/keyfile.json"),
    )
    print("EE initialised.\n")

    # -----------------------------------------------------------------------
    # 2. Agricultural / pasture analysis
    # -----------------------------------------------------------------------
    # Example parcel: a small field in Kankakee County, Illinois
    # Replace with your actual parcel coordinates.
    parcel_ring: list[tuple[float, float]] = [
        (-87.20, 41.12),
        (-87.15, 41.12),
        (-87.15, 41.08),
        (-87.20, 41.08),
        (-87.20, 41.12),  # closed ring
    ]

    print("Running agricultural analysis on sample parcel…")
    ag_result = ee_utils.analyze_pasture(
        coordinates=[parcel_ring],
        start_date=date(2023, 5, 1),
        end_date=date(2023, 9, 30),
        geometry_id="kankakee_county_field",
        satellite="LANDSAT",
        cloud_cover_max=30.0,
        include_band_stats=True,
    )

    print(f"  Satellite      : {ag_result.satellite}")
    print(f"  Images         : {len(ag_result.ndvi_time_series)}")
    print(f"  NDVI mean      : {ag_result.ndvi_overall_mean}")
    print(f"  Soil moist mean: {ag_result.soil_moisture_overall_mean}")
    print(f"  Health rating  : {ag_result.pasture_health_rating}\n")

    # -----------------------------------------------------------------------
    # 3. Grand Kankakee Marsh water-extent analysis
    # -----------------------------------------------------------------------
    print("Running Grand Kankakee Marsh analysis (2020–2023)…")
    marsh_result = ee_utils.analyze_kankakee_marsh(
        start_date=date(2020, 3, 1),
        end_date=date(2023, 11, 30),
        satellite="LANDSAT",
        historical_reference="1834 General Land Office (GLO) Survey",
        cloud_cover_max=20.0,
        include_vegetation_stats=True,
    )

    print(f"  Site           : {marsh_result.site_name}")
    print(f"  Images         : {len(marsh_result.water_extent_time_series)}")
    print(f"  Total area     : {marsh_result.total_analysis_area_ha:,.0f} ha")
    print(f"  Max water      : {marsh_result.max_water_extent_ha:,.1f} ha")
    print(f"  Mean water     : {marsh_result.mean_water_extent_ha:,.1f} ha\n")

    # -----------------------------------------------------------------------
    # 4. Historical boundary alignment (API demonstration)
    # -----------------------------------------------------------------------
    # In practice, digitise the 1834 GLO boundary from scanned plat maps and
    # supply it here as an ee.Geometry.Polygon.
    print("Demonstrating historical boundary alignment…")
    analyzer = ee_utils.MarshlandAnalyzer(
        historical_reference="1834 GLO Survey",
    )
    # Approximate 1834 marsh core polygon (stub; replace with actual digitised boundary)
    historical_poly = ee.Geometry.Rectangle([-87.30, 41.05, -86.80, 41.40])
    hist_mask = analyzer.align_with_historical_boundary(
        historical_geometry=historical_poly,
        label="GLO_1834_Boundary",
    )
    print(f"  Historical mask image info: {hist_mask.bandNames().getInfo()}\n")

    # Median composite aligned to the 1834 boundary
    composite = analyzer.get_composite(
        date_range=ee_utils.DateRangeModel(
            start_date=date(2023, 6, 1), end_date=date(2023, 9, 1)
        ),
        historical_geometry=historical_poly,
    )
    print(f"  Composite band count: {composite.bandNames().size().getInfo()}\n")

    # -----------------------------------------------------------------------
    # 5. PDF report generation
    # -----------------------------------------------------------------------
    output_pdf = Path("reports") / "kankakee_land_analysis.pdf"
    print(f"Generating PDF report → {output_pdf}…")

    pdf_path = ee_utils.build_full_report(
        agricultural_analyses=[ag_result],
        marshland_analyses=[marsh_result],
        report_title="Kankakee Basin Land Analysis – 2023",
        output_path=output_pdf,
        summary_notes=(
            "This report covers NDVI-based pasture health and SMAP soil moisture "
            "for a sample field in Kankakee County, alongside a multi-year water-extent "
            "analysis of the Grand Kankakee Marsh cross-referenced against the 1834 "
            "General Land Office survey."
        ),
    )
    print(f"Report saved: {pdf_path}\n")
    print("Done.")


if __name__ == "__main__":
    main()
