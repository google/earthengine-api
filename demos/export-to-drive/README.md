# Earth Engine Demo: Export to Drive

This is an example [Google App Engine](https://cloud.google.com/appengine/docs)
web app that communicates with
[Google Earth Engine](https://earthengine.google.org). It allows users to view
night-time lights for different years and export drawn regions to
[Google Drive](https://www.google.com/drive/).

## Set up Google Cloud command-line tools

The [gcloud](https://cloud.google.com/sdk/gcloud/) utility is needed to run an
instance of the sample app on your machine. The same utility can be helpful in
pushing things into the production App Engine cloud.

1.  Download and install the [Google Cloud SDK](https://cloud.google.com/sdk/).
2.  Authenticate to Google Cloud Platform by running `gcloud auth login`.
3.  Configure the command line tools to use your cloud project by running:
    `gcloud config set project <project-id>`

## Set up the repo

To set up yourself, download the Earth Engine API repository from GitHub:

```
git clone https://github.com/google/earthengine-api.git
```

Navigate to this demo:

```
cd ./earthengine-api/demos/export-to-drive/
```

Then follow the instructions in the Developer Docs to
[deploy an EE-based App Engine app](https://developers.google.com/earth-engine/app_engine_intro#deploying-app-engine-apps-with-earth-engine).
For the credentials section, you'll need both a Service Account and an OAuth2
Client ID.
