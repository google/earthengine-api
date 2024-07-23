"""Converters used in the table data fetching methods."""

from typing import Any, Dict, Iterator, List, Optional, Type, Union


class TableConverter:
  """Base class for table data converters."""

  def do_conversion(self, features: Iterator[Any]) -> Any:
    raise NotImplementedError()


class PandasConverter(TableConverter):
  """Converter from a feature generator to a `pandas.DataFrame`."""

  def do_conversion(self, features: Iterator[Any]) -> Any:
    try:
      import pandas  # pylint: disable=g-import-not-at-top
    except ImportError as exc:
      raise ImportError(
          'Using format PANDAS_DATAFRAME requires pandas.'
      ) from exc
    return pandas.DataFrame.from_records(self._convert_to_records(features))

  def _convert_to_records(
      self, features: Iterator[Any]
  ) -> Iterator[Dict[str, Any]]:
    for feature in features:
      yield {
          'geo': feature.get('geometry'),
          **(feature.get('properties', {}) or {}),
      }


class GeoPandasConverter(TableConverter):
  """Converter from a feature generator to a `geopandas.GeoDataFrame`."""

  def do_conversion(self, features: Iterator[Any]) -> Any:
    try:
      import geopandas  # pylint: disable=g-import-not-at-top
    except ImportError as exc:
      raise ImportError(
          'Using format GEOPANDAS_GEODATAFRAME requires geopandas.'
      ) from exc
    return geopandas.GeoDataFrame.from_features(
        self._materialize_features(features)
    )

  def _materialize_features(self, features: Iterator[Any]) -> List[Any]:
    """Materializes the features, making several requests if necessary."""
    return list(features)


_TABLE_DATA_CONVERTERS: Dict[str, Type[TableConverter]] = {
    'PANDAS_DATAFRAME': PandasConverter,
    'GEOPANDAS_GEODATAFRAME': GeoPandasConverter,
}


def from_file_format(
    file_format: Union[str, TableConverter]
) -> Optional[TableConverter]:
  if isinstance(file_format, TableConverter):
    return file_format
  if file_format in _TABLE_DATA_CONVERTERS:
    return _TABLE_DATA_CONVERTERS[file_format.upper()]()
  return None
