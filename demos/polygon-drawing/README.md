Earth Engine Demo: Polygon Drawing
==================================

[Live Demo](https://polygon-drawing-dot-ee-demos.appspot.com/)

This example demonstrates how to use polygons drawn on a Google Map with
the Earth Engine JavaScript client library. To set up:

Create an OAuth Client ID
-------------------------

The authentication flow requires an OAuth Client ID for your application.
You can generate one by creating a project in the
[Google Developers Console](https://console.developers.google.com) and
then clicking "APIs & auth" > "Credentials" in the left column.

You must also specify authorized JavaScript origins, for example:

    http://localhost:8080/
    https://<your-application-id>.appspot.com/

And authorized redirect URIs, for example:

    http://localhost:8080/oauth2callback
    https://<your-application-id>.appspot.com/oauth2callback

Then update `static/script.js` to use your client ID.
Check out the [Google Identity OAuth documentation](
https://developers.google.com/identity/protocols/OAuth2UserAgent)
for a more detailed explanation of OAuth.

Include the EE JavaScript Client Library Binary
-----------------------------------------------

Ensure [ee_api_js.js](https://github.com/google/earthengine-api/blob/master/javascript/build/ee_api_js.js)
is available in the `/static/` directory. You can download it directly from GitHub
or, if you cloned the entire EE API repo, move it from `earthengine-api/javascript/build`
on your local filesystem.

Run and Deploy
--------------

Once you have a client ID and `ee_api_js.js`, you can run the demo locally
with Python:

    cd ~/path/to/polygon-drawing/static
    python -m SimpleHTTPServer 8080

And then navigate to the site in your web browser:

    http://localhost:8080

To run locally using [Google App Engine](https://cloud.google.com/appengine/docs),
navigate to the root directory (not `static`) and use the
[App Engine Python SDK](https://cloud.google.com/appengine/downloads):

    cd ~/path/to/polygon-drawing
    dev_appserver.py ./

To deploy to App Engine, ensure your application ID is set in `app.yaml` and run:

    appcfg.py update ./

Check out the [App Engine Docs](https://cloud.google.com/appengine/docs/python/config/appconfig)
for more information.
