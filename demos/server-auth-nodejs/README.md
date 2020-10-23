# Earth Engine Demo: Server-Side Authentication in Node.js

This example shows how to build a simple Google App Engine web application that
communicates with Google Earth Engine. Upon successful deployment, you will see
a webpage with an interactive map showing terrain slope zoomed into the east
coast of Australia.

To set the app up yourself, download the Earth Engine API repository from
GitHub:

```
git clone https://github.com/google/earthengine-api.git
```

Navigate to the Node.js Server Auth example code:

```
cd ./earthengine-api/demos/server-auth-nodejs
```

Then follow the instructions in the Developer Docs to
[deploy an EE-based App Engine app](https://developers.google.com/earth-engine/app_engine_intro#deploying-app-engine-apps-with-earth-engine).
For the credentials section, you'll need a Service Account, not an OAuth2 Client
ID. Next:

1.  Rename the downloaded Service Account JSON private key file to
    `.private-key.json` and move it into the `demos/server-auth-nodejs` folder.
2.  [Create an API key](https://developers.google.com/maps/documentation/javascript/get-api-key)
    and include it in `index.html` to properly initialize the Google Maps API.

