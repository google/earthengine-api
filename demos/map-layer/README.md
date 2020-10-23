# Map Layer Demo App

This example demonstrates how to use the `ee.layers.ImageOverlay` class to
render Earth Engine map tiles to a Google Map. `ee.layers.ImageOverlay`
implements the
[google.maps.MapType](https://developers.google.com/maps/documentation/javascript/examples/maptype-overlay)
interface for map layers on top of a base Google Map. It offers two features
beyond the basic overlay type:

1. Canceling obsolete tile requests as the user pans or zooms the map.
2. Allowing callbacks to be registered to be called each time a map tile is loaded.

To set up, follow the instructions in the Developer Docs to
[deploy an EE-based App Engine app](
    https://developers.google.com/earth-engine/app_engine_intro#deploying-app-engine-apps-with-earth-engine).
For the credentials section, you'll need an OAuth2 Client ID, not a Service Account.
