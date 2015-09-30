Earth Engine Demo: Export to Drive
==================================

[Live Demo](https://export-to-drive-dot-ee-demos.appspot.com)

This is an example [Google App Engine](https://cloud.google.com/appengine/docs)
web app that communicates with [Google Earth Engine](https://earthengine.google.org).
It allows users to view night-time lights for different years and export drawn regions
to [Google Drive](https://www.google.com/drive/).

Set up
------

To set up yourself, download the Earth Engine API repository from GitHub:

    git clone https://github.com/google/earthengine-api.git

Navigate to this demo:

    cd ./earthengine-api/demos/export-to-drive/

Then follow the instructions in the Developer Docs to
[deploy an EE-based App Engine app](
    https://developers.google.com/earth-engine/app_engine_intro#deploying-app-engine-apps-with-earth-engine).
For the credentials section, you'll need both a Service Account and an OAuth2 Client ID.
