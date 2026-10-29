# Earth Engine WMTS Proxy

This is an App Engine-based application that implements the Web Map Tile
Standard (WMTS) for Earth Engine. The server takes in WMTS requests in its
`/GetTile` endpoint and returns Earth Engine tiles.

For example, if the server were running on `some-wmts-server.appspot.com`, one
would request Earth Engine datasets as follows:

*   The name of the Earth Engine asset (e.g. `TIGER/2016/States`) is put in the
    `layer` parameter.
*   The spatial coordinates of the tile (`x`, `y`, `zoom`) are delineated by the
    `TileCol`, `TileRow`, and `TileMatrix` parameters.

Thus one would request for a tile at position (`1`, `1`, `3`) from the
`TIGER/2016/STATES` asset from
`/GetTile?layer=TIGER/2016/States&tileMatrix=3&tileRow=3&tileCol=1`.

Layers are taken from a central Google Cloud Storage bucket
`gs://earthengine-catalog`, maintained by Earth Engine. If the dataset is an
`ImageCollection`, the proxy will show only the first image.

## Setup

To run this app, first create an App Engine application as per the Developer
Docs instructions for [deploying an EE-based App Engine app][1].

## Deploying

This is to be run on Google App Engine and thus depends on the `gcloud` binary
to be installed. Install dependencies and deploy as follows:

```
$ chmod +x deploy.sh
$ ./deploy.sh <your app engine project id>
```

[1]: https://developers.google.com/earth-engine/app_engine_intro#deploying-app-engine-apps-with-earth-engine
[2]: https://cloud.google.com/appengine/docs/standard/python/config/appref
