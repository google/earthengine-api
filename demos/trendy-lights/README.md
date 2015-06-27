Trendy Lights EE Demo App
=========================

This is an example [Google App Engine](https://cloud.google.com/appengine/docs)
web app that communicates with [Google Earth Engine](https://earthengine.google.org).
It uses memcache to cache results and avoid exceeding request quotas.


Download Trendy Lights
----------------------

Download the Earth Engine API repository from GitHub:

    git clone https://github.com/google/earthengine-api.git

Navigate to the Trendy Lights example code:

    cd ./earthengine-api/python/examples/AppEngine/trendy-lights/


Create your own project
-----------------------

Each App Engine app needs its own project. The project ID for
the default instance of this app is `trendy-lights`. To deploy
your own instance, you'll need to create a new project with a
different ID.

To create an App Engine project for your app:

1. Open the [Google Developers Console](//console.developers.google.com).
2. Click **Create Project**.
3. Enter a project name and a project ID.
4. Click **Create**.

Once you've selected a project ID, update your `app.yaml` file.


Set up a service account
------------------------

- [Create a service account](https://sites.google.com/site/earthengineapidocs/creating-oauth2-service-account).
- Download a P12 private key from the Google Developers Console.
- Convert the private key of that service account to a `.pem` file:  
  `openssl pkcs12 -in downloaded-privatekey.p12 -nodes -nocerts > privatekey.pem`
- Copy the `.pem` file into the directory that has your app.yaml file.
- Update `config.py` file with your service account email address.


Build the app
-------------

From within the trendy-lights folder, run:

    . ./build.sh

This script will build the app and fetch all its dependencies.  It will also
install the [Google Cloud SDK](https://cloud.google.com/sdk/) if necessary.


Run the app!
------------

From within the trendy-lights folder, run:

    dev_appserver.py ./
