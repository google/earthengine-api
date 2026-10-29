#!/usr/bin/env python3
"""Tests for the table_converter module."""

import builtins
from typing import Any
from unittest import mock

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
      expected: type[table_converter.TableConverter] | None,
  ):
    """Verifies `from_file_format` returns the correct converter class."""
    if expected is None:
      self.assertIsNone(table_converter.from_file_format(data_format))
    else:
      self.assertIsInstance(
          table_converter.from_file_format(data_format), expected
      )

  def test_from_file_format_instance(self):
    """Verifies `from_file_format` returns the same instance."""
    converter = table_converter.PandasConverter()
    self.assertIs(table_converter.from_file_format(converter), converter)

  def test_table_converter_fails(self):
    """Verifies `TableConverter` cannot be used for conversion."""
    with self.assertRaises(NotImplementedError):
      table_converter.TableConverter().do_conversion(iter([]))

  def test_pandas_converter(self):
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

  def test_pandas_converter_importerror(self):
    """Ensures ImportError is raised when pandas is not available."""
    real_import = builtins.__import__

    def mock_import(name, globals=None, locals=None, fromlist=(), level=0):
      if name == 'pandas':
        raise ImportError
      return real_import(name, globals, locals, fromlist, level)

    with mock.patch('builtins.__import__', mock_import):
      converter = table_converter.PandasConverter()
      with self.assertRaisesRegex(
          ImportError, 'Using format PANDAS_DATAFRAME requires pandas.'
      ):
        converter.do_conversion(iter([]))

  def test_geopandas_converter(self):
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

  def test_geopandas_converter_importerror(self):
    """Ensures ImportError is raised when geopandas is not available."""
    real_import = builtins.__import__

    def mock_import(name, globals=None, locals=None, fromlist=(), level=0):
      if name == 'geopandas':
        raise ImportError
      return real_import(name, globals, locals, fromlist, level)

    with mock.patch('builtins.__import__', mock_import):
      converter = table_converter.GeoPandasConverter()
      with self.assertRaisesRegex(
          ImportError, 'Using format GEOPANDAS_GEODATAFRAME requires geopandas.'
      ):
        converter.do_conversion(iter([]))


if __name__ == '__main__':
  unittest.main()
