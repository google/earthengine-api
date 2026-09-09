"""
ee_utils — Custom Earth Engine utility layer.
=============================================

Public surface
--------------
    initialize_ee()          — authenticate & init the EE API
    analyze_pasture()        — one-call NDVI + soil-moisture pipeline
    analyze_kankakee_marsh() — one-call Kankakee water-extent pipeline
    build_full_report()      — generate a PDF from analysis results

    AgriculturalMonitor      — low-level NDVI / soil-moisture class
    MarshlandAnalyzer        — low-level water-extent / vegetation class

    DateRangeModel           — validated date range (Pydantic)
    AgriculturalAnalysisModel — validated ag result
    MarshlandAnalysisModel   — validated marshland result
    FullAnalysisReportModel  — validated report container
    generate_pdf_report()    — ReportLab PDF renderer

Package layout
--------------
    ee_utils/
    ├── __init__.py          — public surface (this file)
    ├── ee_custom_utils.py   — one-call orchestration entry points
    ├── agriculture.py       — AgriculturalMonitor (NDVI + SMAP)
    ├── marshland.py         — MarshlandAnalyzer (NDWI / MNDWI)
    ├── models.py            — Pydantic v2 validation models
    ├── reporting.py         — ReportLab PDF renderer
    ├── helpers.py           — shared EE image helpers (cloud masks, indices)
    ├── constants.py         — dataset IDs, band maps, thresholds, bbox
    └── usage_example.py     — runnable end-to-end demonstration
"""
from .ee_custom_utils import (
    AgriculturalMonitor,
    AgriculturalAnalysisModel,
    DateRangeModel,
    FullAnalysisReportModel,
    MarshlandAnalyzer,
    MarshlandAnalysisModel,
    PolygonGeometryModel,
    analyze_kankakee_marsh,
    analyze_pasture,
    build_full_report,
    generate_pdf_report,
    initialize_ee,
)

__all__ = [
    "initialize_ee",
    "analyze_pasture",
    "analyze_kankakee_marsh",
    "build_full_report",
    "AgriculturalMonitor",
    "MarshlandAnalyzer",
    "DateRangeModel",
    "PolygonGeometryModel",
    "AgriculturalAnalysisModel",
    "MarshlandAnalysisModel",
    "FullAnalysisReportModel",
    "generate_pdf_report",
]
