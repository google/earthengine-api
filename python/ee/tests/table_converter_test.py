#!/usr/bin/env python3
"""Tests for the table_converter module."""

from typing import Any, Optional

from absl.testing import parameterized
import geopandas
from geopandas import testing
import pandas

import unittest
from ee import table_converter


class TableConverterTest(parameterized.TestCase):

  def _make_feature(
      self, geometry: dict[str, Any], properties: dict[str, Any]
  ) -> dict[str, Any]:
    return {'type': 'Feature', 'geometry': geometry, 'properties': properties}

  @parameterized.named_parameters(
      ('pd', 'PANDAS_DATAFRAME', table_converter.PandasConverter),
      ('gpd', 'GEOPANDAS_GEODATAFRAME', table_converter.GeoPandasConverter),
      ('mixed', 'pANDAs_DATAframe', None),
      ('invalid', 'UNKNOWN', None),
  )
  def test_from_file_format(
      self,
      data_format: str,
      expected: Optional[type[table_converter.TableConverter]],
  ) -> None:
    """Verifies `from_file_format` returns the correct converter class."""
    if expected is None:
      self.assertIsNone(table_converter.from_file_format(data_format))
    else:
      self.assertIsInstance(
          table_converter.from_file_format(data_format), expected
      )

  def test_pandas_converter(self) -> None:
    """Verifies `PandasConverter` does the correct conversion."""
    converter = table_converter.PandasConverter()

    dataframe = converter.do_conversion(
        iter([
            self._make_feature(
                geometry={'type': 'Point', 'coordinates': [0, 0]},
                properties={'colname': 'A', 'another-one': '10'},
            ),
            self._make_feature(
                geometry={'type': 'Point', 'coordinates': [1, 1]},
                properties={'colname': 'B'},
            ),
        ])
    )
    pandas.testing.assert_frame_equal(
        dataframe,
        pandas.DataFrame([
            {
                'geo': {'type': 'Point', 'coordinates': [0, 0]},
                'colname': 'A',
                'another-one': '10',
            },
            {
                'geo': {'type': 'Point', 'coordinates': [1, 1]},
                'colname': 'B',
            },
        ]),
    )

  def test_geopandas_converter(self) -> None:
    """Verifies `GeoPandasConverter` does the correct conversion."""
    converter = table_converter.GeoPandasConverter()

    dataframe = converter.do_conversion(
        iter([
            self._make_feature(
                geometry={'type': 'Point', 'coordinates': [0, 0]},
                properties={'colname': 'A', 'another-one': '10'},
            ),
            self._make_feature(
                geometry={'type': 'Point', 'coordinates': [1, 1]},
                properties={'colname': 'B'},
            ),
        ])
    )

    feature_coll = {
        'type': 'FeatureCollection',
        'features': [
            self._make_feature(
                geometry={'type': 'Point', 'coordinates': [0, 0]},
                properties={'colname': 'A', 'another-one': '10'},
            ),
            self._make_feature(
                geometry={'type': 'Point', 'coordinates': [1, 1]},
                properties={'colname': 'B'},
            ),
        ],
        'bbox': (1.0, 1.0, 2.0, 2.0),
    }
    testing.assert_geodataframe_equal(
        dataframe,
        geopandas.GeoDataFrame.from_features(feature_coll),
    )


if __name__ == '__main__':
  unittest.main()
