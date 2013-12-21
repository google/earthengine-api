This example shows how to build a simple Google App Engine web application that
communicates with Google Earth Engine.  Upon successful deployment, you will see
a webpage with a Google map showing the SRTM DEM zoomed into the east coast of
Australia.

You can deploy this application to an App Engine instance, or run it in your
local App Engine development environment.  Instructions for how to configure
each are below.

In all cases, the Python environment running the code will need to access
the oauth2client, httplib2, pycrypto, and ee libraries.  When running locally,
make sure your Python environment contains these libraries (yolk is a useful
tool for this).  When running in App Engine, you will need to include the
oauth2client, httplib2, and ee libraries in the directory containing the
app.yaml file. Instructions for downloading the libraries are at the end of
this file.

For local development using a personal service account:
* Set up a service account as described here:
  https://sites.google.com/site/earthengineapidocs/creating-oauth2-service-account
* Email the service account email address to your google contact.
* Convert the private key of that service account to a pem file:
  openssl pkcs12 -in downloaded-privatekey.p12 -nodes -nocerts > privatekey.pem
* Old versions of oauth2client will require you to delete the first few
  lines of the of the .pem file so it begins with
  ---BEGIN
  We recommend you update to the most recent version of the libraries.
* Copy the pem file into the directory that has your app.yaml file.
* Update the included config.py file with your service account email
  address.
* Use appcfg.py or the App Engine Launcher to run in your local App Engine
  development environment.

To give your App Engine account access using a personal service account:
* Follow the instructions for local development.
* Create an App Engine instance.
* Update the end of the config.py file to use your private credentials.
* Update the included app.yaml file with the id of your App Engine instance.
  If your instance is at my-app.appspot.com, the id of the instance is my-app.
* Use appcfg.py or the App Engine Launcher to deploy your application to
  App Engine.

To give your App Engine account access using an App Engine service account:
* Go to your App Engine console (http://appengine.google.com) and choose the
  instance you want to authenticate.
* Look under application settings - you'll find a link under 'Administration'
  on the left hand side of the screen.
* Email the Service Account Name to your Google contact, who will whitelist
  your application.
* Update the included app.yaml file with the id of your App Engine instance.
* Use appcfg.py or the App Engine Launcher to deploy your application to
  App Engine.

Dependencies

oauth2client:
* hg clone https://code.google.com/p/google-api-python-client/
* mv google-api-python-client/oauth2client/ into the directory
  containing app.yaml

Earth Engine
* follow the instructions at:
  https://code.google.com/p/earthengine-api/source/checkout
* move ee into the directory containing app.yaml

httplib2
* hg clone https://code.google.com/p/httplib2/
* move httplib2/python2/httplib2 into the directory containing app.yaml

pycrypto:
* download from https://www.dlitz.net/software/pycrypto/
* python setup.py build
* python setup.py install
