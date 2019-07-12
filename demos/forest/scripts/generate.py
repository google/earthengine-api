#!/usr/bin/env python
"""Generates data for the Global Forest Change Explorer web app.
"""



import analysis
import ingestion
import thumbnails
import ee


def main():
  """Generates data for the Global Forest Change Explorer."""
  ee.Initialize()
  destinations = ingestion.LoadDestinations()

  print 'Starting export of GlobalForestChangeExplorerGeometries.kml to Drive.'
  analysis.ExportGeometriesKml(destinations)

  print 'Generating static/destinations/index.json.'
  analysis.GenerateIndexJson(destinations)

  print 'Generating static/destinations/details.json.'
  analysis.GenerateDetailsJson(destinations)

  print 'Generating static/thumbnails/*.'
  thumbnails.GenerateThumbnails(destinations)

if __name__ == '__main__':
  main()

