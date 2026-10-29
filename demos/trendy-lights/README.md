Earth Engine Demo: Trendy Lights
================================

This is an example [Google App Engine](https://cloud.google.com/appengine/docs)
web app that communicates with [Google Earth Engine](https://earthengine.google.org).
It uses memcache to cache results and avoid exceeding request quotas.


To set up the app yourself, download the Earth Engine API repository from GitHub:

    git clone https://github.com/google/earthengine-api.git

Navigate to the Trendy Lights example code:

    cd ./earthengine-api/demos/trendy-lights/

Then follow the instructions in the Developer Docs to
[deploy an EE-based App Engine app](
    https://developers.google.com/earth-engine/app_engine_intro#deploying-app-engine-apps-with-earth-engine).
For the credentials section, you'll need a Service Account, not an OAuth2 Client ID.

