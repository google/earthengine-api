# Global Forest Change Explorer Data

To update destinations data:
<br>

1) Edit the source data.

  * [Hotspots](https://www.google.com/fusiontables/DataSource?docid=1OLESL3YZRTRjDV8NSbWyfXb5pqmMu3xSziDMIAx2)
    - Note that the hotspots are the only type that has question data.
  * [Countries](https://www.google.com/fusiontables/DataSource?docid=1jCnx50Qb7dTG6fURnpvT2QXiUzewJti8ApBPO8dg)
  * [Ecoregions](https://www.google.com/fusiontables/DataSource?docid=11SfWB6oBS1iWGiQxEOqF_wUgBJL7Bux-pWU-mqd5)

2) Generating data.

  * If you haven't, set up EE credentials [0].
  * Delete obsolete destination and index data.
  ```
    $ rm demos/forest/static/destinations/*.json
  ```
  * Delete obsolete thumbnails. Existing thumbnails will not be overwritten;
    thumbnails will be generated only if there's no
    static/thumbnail/<destination-id>.png file for a given destination-id.
  ```
    $ rm demos/forest/static/thumbnails/*
  ```
  * Go to the scripts/ directory.
  ```
  $ cd demos/forest/scripts
  ```
  * Run the `generate.py` script to generate new local files for serving
    with the app.
      * Note that a batch task will be started to export destination geometries
        to a KML file in your Google Drive.
  ```
  $ python generate.py
  ```

3) Upload the exported geometry KML file into a new Fusion Table.

  * Download the GlobalForestChangeExplorerGeometries.kml file from Drive.
    (You can track progress in your Code Editor [1] "Tasks" tab.)
  * Create a new Fusion Table by uploading the file.
  * Delete the `description`, `name`, and `system:index` columns,
    which are auto-created but unneeded.
  * "Edit" => "Change Columns" provides a UI for deleting columns.
  * Set the sharing permissions to be publicly accessible.
  * Update the GEOMETRY_TABLE_ID value in `config.py` with your Fusion Table ID.
  * Re-run the script in #2 to generate the correct Fusion Table queries in the
    details.json (shouldn't take too long; existing thumbnails will be skipped).

[0] https://developers.google.com/earth-engine/python_install#setting-up-authentication-credentials
<br>
[1] https://code.earthengine.google.com
