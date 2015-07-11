Earth Engine Demo: Server-Side Authentication
=============================================

[Live Demo](https://server-auth-dot-ee-demos.appspot.com/)

This example shows how to build a simple Google App Engine web application that
communicates with Google Earth Engine.  Upon successful deployment, you will see
a webpage with a Google map showing the SRTM DEM zoomed into the east coast of
Australia.

Download the demo
-----------------

Download the Earth Engine API repository from GitHub:

    git clone https://github.com/google/earthengine-api.git

Navigate to the Server Auth example code:

    cd ./earthengine-api/demos/server-auth


Create your own project
-----------------------

Each App Engine app needs its own project. The project ID for
the default instance of this app is `ee-demos`. To deploy
your own instance, you'll need to create a new project with a
different ID.

To create an App Engine project for your app:

1. Open the [Google Developers Console](https://console.developers.google.com).
2. Click **Create Project**.
3. Enter a project name and a project ID.
4. Click **Create**.

Once you've selected a project ID, update your `app.yaml` file.


Set up a service account
------------------------

- [Create a service account](https://developers.google.com/earth-engine/service_account).
- Download a P12 private key from the Google Developers Console.
- Convert the private key of that service account to a `.pem` file:  
  `openssl pkcs12 -in downloaded-privatekey.p12 -nodes -nocerts > privatekey.pem`
- Copy the `.pem` file into the directory that has your app.yaml file.
- Update `config.py` file with your service account email address.


Build the app
-------------

On Mac OS X or Linux, from within the `server-auth` folder, run:

    . ./build.sh

This script will build the app and fetch all its dependencies.  It will also
install the [Google Cloud SDK](https://cloud.google.com/sdk/) if necessary.

On Windows, [try this](https://groups.google.com/d/msg/google-earth-engine-developers/aL5ufRsiWlA/s0dvAri0SGoJ).


Ensure that a crypto library is installed
-----------------------------------------

If the following command yields an error, then follow the crypto library
instructions in the [EE Python client library README](/python/README.md).

    python -c "from oauth2client import crypt"


Run the app!
------------

From within the `server-auth` folder, run:

    dev_appserver.py ./
