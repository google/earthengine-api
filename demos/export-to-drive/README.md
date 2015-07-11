Earth Engine Demo: Export to Drive
==================================

[Live Demo](https://export-to-drive-dot-ee-demos.appspot.com)

This is an example [Google App Engine](https://cloud.google.com/appengine/docs)
web app that communicates with [Google Earth Engine](https://earthengine.google.org).
It allows users to view night-time lights for different years and export drawn regions
to [Google Drive](https://www.google.com/drive/).


Download the demo
-----------------

Download the Earth Engine API repository from GitHub:

    git clone https://github.com/google/earthengine-api.git

Navigate to this demo:

    cd ./earthengine-api/demos/export-to-drive/


Create your own project
-----------------------

Each App Engine app needs its own project. To deploy
your own instance, you'll need to create a new project with a
unique ID (e.g. `export-to-drive-foo`).

To create an App Engine project for your app:

1. Open the [Google Developers Console](https://console.developers.google.com).
2. Click **Create Project**.
3. Enter a project name and a project ID.
4. Click **Create**.

Once you've selected a project ID, update your `app.yaml` file.


Set up a service account
------------------------

The service account is used to authorize requests to Earth Engine.
The EE backend places the exported files into the service account's Drive folder.

- [Create and authorize a service account](https://developers.google.com/earth-engine/service_account).
- Download a P12 private key from the Google Developers Console.
- Convert the private key of that service account to PEM format:  
  `openssl pkcs12 -in downloaded-privatekey.p12 -nodes -nocerts > privatekey.pem`
- Copy `privatekey.pem` into the directory that has contains `app.yaml`.
- Update `config.py` with your service account email address.


Set up OAuth
------------

To put an exported file into a user's Drive, the app needs write access to it.
This is granted through [OAuth](http://en.wikipedia.org/wiki/OAuth), which allows
us to request write access from the user.

Once the user grants us access, we use it to copy from the service account's
Drive folder into the user's. Enable OAuth by [creating a client ID and secret](
https://developers.google.com/drive/web/auth/web-server) and adding them to
`config.py`. Follow the steps for the "Web Application" Client ID type.


Build the app
-------------

From within the export-to-drive folder, run:

    . ./build.sh

This script will build the app and fetch Python dependencies.  It will also
install the [Google Cloud SDK](https://cloud.google.com/sdk/) if necessary.


Include the EE JavaScript Client Library Binary
-----------------------------------------------

Ensure [ee_api_js.js](https://github.com/google/earthengine-api/blob/master/javascript/build/ee_api_js.js)
is available in the `/static/` directory. You can download it directly from GitHub
or, if you cloned the entire EE API repo, move it from `earthengine-api/javascript/build`
on your local filesystem.


Ensure that a crypto library is installed
-----------------------------------------

If the following command yields an error, then follow the crypto library
instructions in the [EE Python client library README](/python/README.md).

    python -c "from oauth2client import crypt"


Run the app!
------------

From within the export-to-drive folder, run:

    dev_appserver.py ./
