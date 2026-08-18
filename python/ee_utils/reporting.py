"""
reporting.py
============
ReportLab PDF report generation for Earth Engine land analysis results.

Takes validated Pydantic models from ``models.py`` and renders a clean,
multi-section PDF document covering:
  - Agricultural / pasture NDVI + soil moisture time series.
  - Historical marshland water extent time series.
  - Summary statistics tables for all sites / parcels.

Usage
-----
    from ee_utils.reporting import generate_pdf_report
    from ee_utils.models import FullAnalysisReportModel

    report = FullAnalysisReportModel(
        report_title="Kankakee Basin Land Analysis – Summer 2024",
        agricultural_analyses=[ag_result],
        marshland_analyses=[marsh_result],
    )
    pdf_path = generate_pdf_report(report, "output/report.pdf")
"""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Union

from reportlab.lib import colors
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    HRFlowable,
    KeepTogether,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from .models import (
    AgriculturalAnalysisModel,
    BandStatisticsModel,
    FullAnalysisReportModel,
    MarshlandAnalysisModel,
)

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Design tokens
# ---------------------------------------------------------------------------
_C_NAVY = colors.HexColor("#154360")        # page header / section rule
_C_BLUE = colors.HexColor("#1a5276")        # table header bg
_C_GREEN = colors.HexColor("#1e8449")       # accent rule under subsection
_C_ROW_ALT = colors.HexColor("#eaf4fb")    # alternating table row
_C_GREY_TEXT = colors.HexColor("#555555")
_C_WHITE = colors.white


# ---------------------------------------------------------------------------
# Style factory
# ---------------------------------------------------------------------------

def _make_styles() -> dict[str, ParagraphStyle]:
    base = getSampleStyleSheet()
    return {
        "cover_title": ParagraphStyle(
            "CoverTitle",
            parent=base["Title"],
            fontSize=22,
            leading=28,
            textColor=_C_NAVY,
            spaceAfter=4,
        ),
        "meta": ParagraphStyle(
            "MetaText",
            parent=base["Normal"],
            fontSize=8,
            textColor=_C_GREY_TEXT,
            spaceAfter=2,
        ),
        "section_h1": ParagraphStyle(
            "SectionH1",
            parent=base["Heading1"],
            fontSize=14,
            leading=18,
            textColor=_C_NAVY,
            spaceBefore=16,
            spaceAfter=4,
        ),
        "section_h2": ParagraphStyle(
            "SectionH2",
            parent=base["Heading2"],
            fontSize=11,
            leading=14,
            textColor=_C_BLUE,
            spaceBefore=10,
            spaceAfter=3,
        ),
        "body": ParagraphStyle(
            "BodyText",
            parent=base["BodyText"],
            fontSize=9,
            leading=13,
            spaceAfter=4,
        ),
        "kv": ParagraphStyle(
            "KVPair",
            parent=base["BodyText"],
            fontSize=9,
            leading=13,
            leftIndent=14,
        ),
        "small": ParagraphStyle(
            "SmallItalic",
            parent=base["Normal"],
            fontSize=7,
            leading=10,
            textColor=_C_GREY_TEXT,
            fontName="Helvetica-Oblique",
        ),
        "no_data": ParagraphStyle(
            "NoData",
            parent=base["Normal"],
            fontSize=9,
            textColor=_C_GREY_TEXT,
            fontName="Helvetica-Oblique",
            leftIndent=14,
            spaceAfter=6,
        ),
    }


# ---------------------------------------------------------------------------
# Table helpers
# ---------------------------------------------------------------------------

def _table_style() -> TableStyle:
    return TableStyle([
        # Header row
        ("BACKGROUND", (0, 0), (-1, 0), _C_BLUE),
        ("TEXTCOLOR", (0, 0), (-1, 0), _C_WHITE),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        # Data rows
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [_C_ROW_ALT, _C_WHITE]),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("LEADING", (0, 0), (-1, -1), 11),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("GRID", (0, 0), (-1, -1), 0.3, colors.lightgrey),
        ("LINEBELOW", (0, 0), (-1, 0), 1.0, _C_NAVY),
    ])


def _band_stats_table(stats: list[BandStatisticsModel]) -> Table | None:
    if not stats:
        return None
    headers = ["Band", "Mean", "Min", "Max", "Std Dev"]
    rows = [headers]
    for s in stats:
        rows.append([
            s.band_name,
            f"{s.mean:.5f}" if s.mean is not None else "—",
            f"{s.minimum:.5f}" if s.minimum is not None else "—",
            f"{s.maximum:.5f}" if s.maximum is not None else "—",
            f"{s.std_dev:.5f}" if s.std_dev is not None else "—",
        ])
    tbl = Table(rows, repeatRows=1)
    tbl.setStyle(_table_style())
    return tbl


# ---------------------------------------------------------------------------
# Section builders
# ---------------------------------------------------------------------------

def _build_agricultural_section(
    analysis: AgriculturalAnalysisModel,
    styles: dict[str, ParagraphStyle],
) -> list:
    """Render all story elements for one agricultural parcel result."""
    elems = []
    elems.append(Paragraph(f"Parcel: <b>{analysis.geometry_id}</b>", styles["section_h2"]))
    elems.append(HRFlowable(width="100%", thickness=1, color=_C_GREEN, spaceAfter=4))

    # Key/value summary
    health = analysis.pasture_health_rating or "N/A"
    health_color = {
        "Excellent": "#1e8449", "Good": "#2980b9",
        "Fair": "#d4ac0d", "Poor": "#c0392b",
    }.get(health, "#555555")

    kv_rows = [
        f"<b>Satellite:</b> {analysis.satellite}",
        (
            f"<b>Analysis Period:</b> "
            f"{analysis.date_range.start_str} → {analysis.date_range.end_str} "
            f"({analysis.date_range.duration_days} days)"
        ),
        (
            f"<b>Overall NDVI Mean:</b> "
            f"{analysis.ndvi_overall_mean:.4f}"
            if analysis.ndvi_overall_mean is not None
            else "<b>Overall NDVI Mean:</b> N/A"
        ),
        (
            f"<b>Soil Moisture Mean (mm):</b> "
            f"{analysis.soil_moisture_overall_mean:.2f}"
            if analysis.soil_moisture_overall_mean is not None
            else "<b>Soil Moisture Mean:</b> N/A"
        ),
        (
            f'<b>Pasture Health Rating:</b> '
            f'<font color="{health_color}"><b>{health}</b></font>'
        ),
        f"<b>Images Processed:</b> {len(analysis.ndvi_time_series)}",
    ]
    for line in kv_rows:
        elems.append(Paragraph(line, styles["kv"]))
    elems.append(Spacer(1, 6))

    # NDVI time series table
    elems.append(Paragraph("NDVI Time Series", styles["section_h2"]))
    if analysis.ndvi_time_series:
        headers = ["Date", "NDVI Mean", "NDVI Min", "NDVI Max", "Soil Moist. (mm)", "Cloud %"]
        rows = [headers]
        for step in analysis.ndvi_time_series:
            sm = f"{step.soil_moisture_mean:.2f}" if step.soil_moisture_mean is not None else "—"
            cc = f"{step.cloud_cover_pct:.1f}" if step.cloud_cover_pct is not None else "—"
            rows.append([
                str(step.date),
                f"{step.ndvi_mean:.4f}",
                f"{step.ndvi_min:.4f}",
                f"{step.ndvi_max:.4f}",
                sm,
                cc,
            ])
        tbl = Table(rows, repeatRows=1)
        tbl.setStyle(_table_style())
        elems.append(tbl)
    else:
        elems.append(Paragraph("No NDVI data found for this period.", styles["no_data"]))

    # Band statistics table
    if analysis.band_statistics:
        elems.append(Spacer(1, 6))
        elems.append(Paragraph("Median Composite Band Statistics", styles["section_h2"]))
        tbl = _band_stats_table(analysis.band_statistics)
        if tbl:
            elems.append(tbl)

    if analysis.notes:
        elems.append(Spacer(1, 4))
        elems.append(Paragraph(f"Notes: {analysis.notes}", styles["small"]))

    return elems


def _build_marshland_section(
    analysis: MarshlandAnalysisModel,
    styles: dict[str, ParagraphStyle],
) -> list:
    """Render all story elements for one marshland site result."""
    elems = []
    elems.append(Paragraph(f"Site: <b>{analysis.site_name}</b>", styles["section_h2"]))
    elems.append(HRFlowable(width="100%", thickness=1, color=_C_GREEN, spaceAfter=4))

    def _fmt_ha(val: float | None) -> str:
        return f"{val:,.2f} ha" if val is not None else "N/A"

    kv_rows = [
        f"<b>Satellite:</b> {analysis.satellite}",
        (
            f"<b>Analysis Period:</b> "
            f"{analysis.date_range.start_str} → {analysis.date_range.end_str} "
            f"({analysis.date_range.duration_days} days)"
        ),
        f"<b>Historical Reference:</b> {analysis.historical_reference or 'N/A'}",
        f"<b>Total Analysis Area:</b> {_fmt_ha(analysis.total_analysis_area_ha)}",
        f"<b>Max Water Extent:</b> {_fmt_ha(analysis.max_water_extent_ha)}",
        f"<b>Min Water Extent:</b> {_fmt_ha(analysis.min_water_extent_ha)}",
        f"<b>Mean Water Extent:</b> {_fmt_ha(analysis.mean_water_extent_ha)}",
        f"<b>Images Processed:</b> {len(analysis.water_extent_time_series)}",
    ]
    if analysis.total_analysis_area_ha and analysis.mean_water_extent_ha:
        pct = (analysis.mean_water_extent_ha / analysis.total_analysis_area_ha) * 100
        kv_rows.append(f"<b>Mean Inundation (% of ROI):</b> {pct:.1f}%")

    for line in kv_rows:
        elems.append(Paragraph(line, styles["kv"]))
    elems.append(Spacer(1, 6))

    # Water extent time series table
    elems.append(Paragraph("Water Extent Time Series", styles["section_h2"]))
    if analysis.water_extent_time_series:
        col_widths = [0.95 * inch, 1.1 * inch, 0.9 * inch, 0.95 * inch, None]
        headers = ["Date", "Water (ha)", "NDWI", "MNDWI", "Source Image"]
        rows = [headers]
        for step in analysis.water_extent_time_series:
            ndwi = f"{step.ndwi_mean:.4f}" if step.ndwi_mean is not None else "—"
            mndwi = f"{step.mndwi_mean:.4f}" if step.mndwi_mean is not None else "—"
            # Truncate long image IDs for readability
            img_id = (step.source_image_id or "—")
            if len(img_id) > 40:
                img_id = "…" + img_id[-37:]
            rows.append([str(step.date), f"{step.water_area_ha:,.2f}", ndwi, mndwi, img_id])
        tbl = Table(rows, repeatRows=1, colWidths=col_widths)
        tbl.setStyle(_table_style())
        elems.append(tbl)
    else:
        elems.append(Paragraph("No water extent data found for this period.", styles["no_data"]))

    # Vegetation band statistics
    if analysis.vegetation_band_stats:
        elems.append(Spacer(1, 6))
        elems.append(Paragraph("Median Composite Vegetation Band Statistics", styles["section_h2"]))
        tbl = _band_stats_table(analysis.vegetation_band_stats)
        if tbl:
            elems.append(tbl)

    if analysis.notes:
        elems.append(Spacer(1, 4))
        elems.append(Paragraph(f"Notes: {analysis.notes}", styles["small"]))

    return elems


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def generate_pdf_report(
    report: FullAnalysisReportModel,
    output_path: Union[str, Path],
) -> Path:
    """
    Render a ``FullAnalysisReportModel`` to a PDF file using ReportLab.

    The output document contains:
      - Cover section with title, generation timestamp, and summary notes.
      - One subsection per agricultural parcel (NDVI + soil moisture tables).
      - One subsection per marshland site (water extent + vegetation tables).

    Args:
        report: Validated report container from ``models.FullAnalysisReportModel``.
        output_path: Destination file path.  Parent directories are created
                     automatically.

    Returns:
        Resolved ``pathlib.Path`` of the written PDF.

    Raises:
        OSError: If the output directory cannot be created.
        Exception: Propagated from ReportLab on rendering errors.
    """
    output_path = Path(output_path).resolve()
    output_path.parent.mkdir(parents=True, exist_ok=True)

    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=LETTER,
        rightMargin=0.75 * inch,
        leftMargin=0.75 * inch,
        topMargin=0.80 * inch,
        bottomMargin=0.75 * inch,
        title=report.report_title,
        author="ee_utils / Earth Engine Custom Utilities",
        subject="GIS Land Analysis Report",
    )

    styles = _make_styles()
    story = []

    # ------------------------------------------------------------------
    # Cover section
    # ------------------------------------------------------------------
    story.append(Paragraph(report.report_title, styles["cover_title"]))
    story.append(
        Paragraph(
            f"Generated: {report.generated_at.strftime('%Y-%m-%d %H:%M UTC')}  |  "
            f"Parcels: {len(report.agricultural_analyses)}  |  "
            f"Wetland sites: {len(report.marshland_analyses)}",
            styles["meta"],
        )
    )
    story.append(
        HRFlowable(width="100%", thickness=2, color=_C_NAVY, spaceBefore=6, spaceAfter=10)
    )

    if report.summary_notes:
        story.append(Paragraph("Executive Summary", styles["section_h1"]))
        story.append(Paragraph(report.summary_notes, styles["body"]))
        story.append(Spacer(1, 10))

    # ------------------------------------------------------------------
    # Agricultural section
    # ------------------------------------------------------------------
    if report.agricultural_analyses:
        story.append(Paragraph("Agricultural & Pasture Analysis", styles["section_h1"]))
        story.append(
            HRFlowable(width="100%", thickness=1.5, color=_C_NAVY, spaceAfter=6)
        )
        for analysis in report.agricultural_analyses:
            story.append(KeepTogether(_build_agricultural_section(analysis, styles)))
            story.append(Spacer(1, 14))

    # ------------------------------------------------------------------
    # Marshland section
    # ------------------------------------------------------------------
    if report.marshland_analyses:
        story.append(Paragraph("Historical & Marshland Analysis", styles["section_h1"]))
        story.append(
            HRFlowable(width="100%", thickness=1.5, color=_C_NAVY, spaceAfter=6)
        )
        for analysis in report.marshland_analyses:
            story.append(KeepTogether(_build_marshland_section(analysis, styles)))
            story.append(Spacer(1, 14))

    # ------------------------------------------------------------------
    # Footer note
    # ------------------------------------------------------------------
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.lightgrey))
    story.append(
        Paragraph(
            "Data sourced from Google Earth Engine. Soil moisture from NASA USDA SMAP "
            "(10 km resolution). Water extent mapped using MNDWI ≥ 0 threshold. "
            "NDVI clamped to [−1, 1].",
            styles["small"],
        )
    )

    doc.build(story)
    logger.info("PDF report written → %s", output_path)
    return output_path
