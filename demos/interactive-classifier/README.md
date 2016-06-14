Earth Engine Demo: Interactive Classifier
=========================================

This example shows how to build a simple Google App Engine web application that
communicates with Google Earth Engine and allows a user to change parameters of
a classifier using a basic form and the Google Maps API.  Upon successful
deployment, you will see a webpage with a Google map that lets you draw a
rectangle, select a number of training points to use and then plot three layers
(MODIS lancover, Landsat and upscaled MODIS landcover based on the classifier).

To set the app up yourself, download the Earth Engine API repository from
GitHub:

    git clone https://github.com/google/earthengine-api.git

Navigate to the Interactive Classifier example code:

    cd ./earthengine-api/demos/interactive-classifier

Then follow the instructions in the Developer Docs to
[deploy an EE-based App Engine app](
    https://developers.google.com/earth-engine/app_engine_intro#deploying-app-engine-apps-with-earth-engine).
For the credentials section, you'll need a Service Account, not an OAuth2
Client ID.
