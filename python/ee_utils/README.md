# ee_utils — Custom Earth Engine Utility Layer

A modular Python utility package built on top of the Google Earth Engine API,
designed for agricultural monitoring, historical wetland analysis, and automated
PDF reporting.

---

## Folder Structure

```
earthengine-api/
└── python/
    ├── ee/                        ← upstream EE Python API (do not modify)
    └── ee_utils/                  ← custom utility layer (your code lives here)
        ├── __init__.py            ← public surface; re-exports all top-level symbols
        ├── ee_custom_utils.py     ← one-call orchestration entry points
        │                            (initialize_ee, analyze_pasture,
        │                             analyze_kankakee_marsh, build_full_report)
        ├── agriculture.py         ← AgriculturalMonitor class
        │                            NDVI + SMAP soil-moisture time series
        │                            Pasture health rating (Excellent/Good/Fair/Poor)
        ├── marshland.py           ← MarshlandAnalyzer class
        │                            NDWI / MNDWI water-extent time series
        │                            Historical boundary alignment (1834 GLO)
        ├── models.py              ← Pydantic v2 validation models
        │                            CoordinateModel, PolygonGeometryModel,
        │                            DateRangeModel, NDVITimeStepModel,
        │                            AgriculturalAnalysisModel,
        │                            WaterExtentTimeStepModel,
        │                            MarshlandAnalysisModel,
        │                            FullAnalysisReportModel
        ├── reporting.py           ← ReportLab PDF renderer
        │                            generate_pdf_report(report, output_path)
        ├── helpers.py             ← shared EE image-processing helpers
        │                            cloud masks, spectral indices, Landsat 8+9
        │                            merged collection builder, retry-safe getInfo
        ├── constants.py           ← dataset IDs, band mappings, NDVI thresholds,
        │                            spatial scales, Kankakee Marsh bbox
        └── usage_example.py       ← runnable end-to-end demonstration
```

---

## Quick Start

```python
import ee_utils
from datetime import date

# 1. Authenticate and initialise
ee_utils.initialize_ee(project="my-gcp-project")

# 2. NDVI + soil-moisture analysis for a pasture parcel
result = ee_utils.analyze_pasture(
    coordinates=[[
        (-87.20, 41.12),
        (-87.15, 41.12),
        (-87.15, 41.08),
        (-87.20, 41.08),
        (-87.20, 41.12),   # closed ring — first == last point
    ]],
    start_date=date(2024, 4, 1),
    end_date=date(2024, 9, 30),
    geometry_id="north_pasture",
    satellite="LANDSAT",   # or "SENTINEL2"
)
print(result.pasture_health_rating)   # → "Good", "Excellent", etc.

# 3. Grand Kankakee Marsh water-extent analysis
marsh = ee_utils.analyze_kankakee_marsh(
    start_date=date(2020, 1, 1),
    end_date=date(2024, 12, 31),
    historical_reference="1834 General Land Office Survey",
)

# 4. Generate a PDF report
pdf_path = ee_utils.build_full_report(
    agricultural_analyses=[result],
    marshland_analyses=[marsh],
    report_title="Kankakee Basin Land Analysis 2024",
    output_path="reports/analysis_2024.pdf",
    summary_notes="Seasonal NDVI + multi-year marsh water extent.",
)
print(f"Report saved: {pdf_path}")
```

---

## Dependencies

Install alongside the editable EE API:

```bash
pip install pydantic reportlab
```

---

## Key Design Decisions

| Decision | Rationale |
|---|---|
| **Landsat 8 + 9 merged** | Doubles revisit from ~16 days to ~8 days by merging both missions; both share identical C2 band names and scale factors |
| **Shared `helpers.py`** | Eliminates copy-paste of cloud masks, spectral indices, and retry logic across `agriculture.py` and `marshland.py` |
| **MNDWI > NDWI for water** | Xu (2006) MNDWI suppresses built-up-land false positives better than McFeeters NDWI; NDWI is still computed for comparison |
| **SMAP ±1-day date window** | Avoids missed moisture values caused by UTC-midnight timestamp differences between SMAP and optical sensors |
| **Pydantic v2 validation** | All EE query results pass through Pydantic models before reaching report generation, catching out-of-range or structurally invalid data early |
| **`KeepTogether` in PDF** | Wraps each analysis section so ReportLab never splits a parcel's summary table across a page boundary |

---

## Historical Kankakee Workflow

```python
import ee
from datetime import date
import ee_utils
from ee_utils import DateRangeModel

ee_utils.initialize_ee()

analyzer = ee_utils.MarshlandAnalyzer(
    historical_reference="1834 GLO Survey",
)

# Digitise the 1834 boundary from a scanned plat map and supply as ee.Geometry.
# The rectangle below is a placeholder — replace with your actual digitised polygon.
historical_poly = ee.Geometry.Polygon([[
    [-87.40, 41.05], [-86.70, 41.05],
    [-86.70, 41.45], [-87.40, 41.45],
    [-87.40, 41.05],
]])

# Get a modern composite clipped to the 1834 survey boundary
composite = analyzer.get_composite(
    date_range=DateRangeModel(
        start_date=date(2023, 6, 1),
        end_date=date(2023, 9, 1),
    ),
    historical_geometry=historical_poly,
)

# The composite is an ee.Image you can export or inspect directly
print(composite.bandNames().getInfo())
```

---

## Running the Example

```bash
cd python/
python -m ee_utils.usage_example
```

Credentials are loaded automatically from `gcloud auth application-default login`
or a service-account key file supplied to `initialize_ee()`.
