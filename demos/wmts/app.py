#!/usr/bin/env python
"""Handle the routing for the application."""


import cachetools
import collections
import httplib
import json
import os
from absl import logging
import cloudstorage as gcs
import threading
import requests
import flask
from flask import request
from flask_wtf import csrf
from xml.etree import ElementTree

from google.appengine.api import app_identity
from google.appengine.api import urlfetch
from google.cloud import storage
from google.auth import app_engine

import config
import ee

# Initialization of Flask application.
server = flask.Flask(__name__)

server.config["WTF_CSRF_TIME_LIMIT"] = config.CSRF_TIME_LIMIT

# Turn on CSRF protection and grab the instance so we can exempt
# the error handler.
csrf_instance = csrf.CsrfProtect(server)

urlfetch.set_default_fetch_deadline(250)


@server.before_first_request
def setup_catalog_bucket():
  gae_credentials = app_engine.Credentials()
  client = storage.Client(credentials=gae_credentials)
  config.CATALOG_BUCKET = client.get_bucket("earthengine-catalog")


@server.before_first_request
def setup_ee():
  """Sets up Earth Engine authentication."""
  with open("privatekey.json") as keyfile:
    extracted_key_data = keyfile.read()
    credentials = ee.ServiceAccountCredentials(config.EE_SERVICE_ACCOUNT,
                                               key_data=extracted_key_data)
  ee.Initialize(credentials, use_cloud_api=True)


@server.after_request
def restrict_frames(response):
  response.headers["X-Frame-Options"] = "DENY"
  return response


@csrf_instance.error_handler
def csrf_error():
  return flask.make_response(
      flask.jsonify(error="CSRF token is expired; please refresh the page."),
      httplib.BAD_REQUEST)


@server.errorhandler(httplib.BAD_REQUEST)
def bad_request(error):
  return flask.make_response(
      flask.jsonify(error=error.description),
      httplib.BAD_REQUEST)


def _getint(d, key, default=None):
  try:
    return int(d.get(key, default))
  except TypeError:
    return None


################################################################################
# Route handlers for entry points
################################################################################


@server.route("/", methods=["GET"])
def serve_external_index():
  return "server running!"


@server.route("/GetCapabilities", methods=["GET"])
def serve_wmts_get_capabilities():
  """WMTS GetCapabilities."""

  contents_elt = ElementTree.Element("Contents")
  index_blob = config.CATALOG_BUCKET.get_blob("index.json")
  index_contents = json.loads(index_blob.download_as_string())
  for dataset_id in index_contents["layers"]:
    layer_elt = ElementTree.Element("Layer")
    identifier_elt = ElementTree.Element("ows:Identifier")
    identifier_elt.text = dataset_id
    layer_elt.insert(1, identifier_elt)
    contents_elt.append(layer_elt)

  xml = ElementTree.Element("Capabilities")
  xml.set("xmlns:ows", "http://www.opengis.net/ows/1.1")
  ElementTree.register_namespace("ows", "http://www.opengis.net/ows/1.1")

  xml.insert(1, contents_elt)
  return flask.Response(ElementTree.tostring(xml), mimetype="text/xml")


locks = collections.defaultdict(threading.Lock)
ttl_cache = cachetools.TTLCache(128, ttl=86400)


def get_map_id_threadsafe(asset, vis_params):
  key = json.dumps({"asset": str(asset), "vis_params": vis_params})
  if key in ttl_cache:
    return ttl_cache[key]
  with locks[key]:
    mapid = asset.getMapId(vis_params=vis_params)
    ttl_cache[key] = mapid
    return mapid

# TODO(user): cache assets as well as map IDs.


def get_table_asset(dataset_name, vis_metadata):
  """Gets table visualization asset and visualization parameters."""
  polygon_vis = vis_metadata.get("polygonVisualization")
  table_vis = vis_metadata.get("tableVisualization")
  if polygon_vis is not None:
    poly_vis_property = polygon_vis["propertyName"]
    vis_metadata = polygon_vis["propertyVis"]

    asset = ee.Image().float().paint(
        ee.FeatureCollection(dataset_name), poly_vis_property)
  elif table_vis is not None:
    asset = ee.FeatureCollection(dataset_name).style(**table_vis)
  else:
    asset = ee.FeatureCollection(dataset_name)

  return (asset, vis_metadata)


@server.route("/GetTile", methods=["GET"])
def serve_wmts_get_tile():
  """Serves a WMTS tile from Earth Engine."""

  # Currently unused parameters: Service, request, Version, style, Format

  wmts_layer = request.args.get("layer")
  wmts_tile_matrix = _getint(request.args, "TileMatrix", 1)
  wmts_tile_row = _getint(request.args, "TileRow", 0)
  wmts_tile_col = _getint(request.args, "TileCol", 0)

  if not wmts_layer:
    return flask.Response(
        "Need to specify a layer name for GetTile.", status=400)

  try:
    dataset_blob = config.CATALOG_BUCKET.get_blob(
        wmts_layer.replace("/", "-") + ".json")
    dd_json = dataset_blob.download_as_string()
  except gcs.errors.NotFoundError:
    return flask.Response(
        "Resource {} not found.".format(wmts_layer), status=404)

  dataset = json.loads(dd_json)

  csl_info = dataset.get("cloudStorageLayer")
  if csl_info:
    gcs_client = storage.Client(credentials=app_engine.Credentials())
    tile_gs_bucket = gcs_client.get_bucket(csl_info["bucket"])
    tile_path = config.EE_CSL_TILEURL_TEMPLATE.format(
        z=wmts_tile_matrix,
        x=wmts_tile_col,
        y=wmts_tile_row,
        **csl_info)  # csl_info contains: path, suffix
    tile_blob = tile_gs_bucket.get_blob(tile_path)
    tile_content = tile_blob.download_as_string()

    mimetype = None
    if csl_info["suffix"] == ".png":
      mimetype = "image/png"
    elif csl_info["suffix"] == ".jpeg":
      mimetype = "image/jpeg"

    return flask.Response(tile_content, mimetype=mimetype)

  try:
    vis_params = dataset["dataset"]["visualizations"][0]
  except KeyError:
    vis_params = {}

  vis_metadata = vis_params

  if dataset.get("table"):
    asset, vis_metadata = get_table_asset(wmts_layer, vis_metadata)
    mapid = get_map_id_threadsafe(asset, vis_metadata)
  elif dataset.get("imageCollection") is not None:
    mapid = get_map_id_threadsafe(
        ee.ImageCollection(wmts_layer).first(), vis_params)
  else:
    mapid = get_map_id_threadsafe(ee.Image(wmts_layer), vis_params)

  tile_url = ee.data.getTileUrl(
      mapid,
      wmts_tile_col, wmts_tile_row, wmts_tile_matrix)  # x, y, z
  ee_tile_resp = requests.get(tile_url)

  return flask.Response(
      ee_tile_resp.content, mimetype=ee_tile_resp.headers["Content-Type"])
