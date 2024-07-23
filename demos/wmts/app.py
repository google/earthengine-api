#!/usr/bin/env python3
"""Handle the routing for the application."""

import collections
import json
import os
import threading
from xml.etree import ElementTree

from absl import logging
import cachetools
import cloudstorage as gcs
import flask
from flask import request
from flask_wtf import csrf
from google.appengine.api import app_identity
from google.appengine.api import urlfetch
from google.auth import app_engine
from google.cloud import storage
import requests

import ee
import config

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
    credentials = ee.ServiceAccountCredentials(
        config.EE_SERVICE_ACCOUNT, key_data=extracted_key_data)
  ee.Initialize(credentials)


@server.after_request
def restrict_frames(response):
  response.headers["X-Frame-Options"] = "DENY"
  return response


@csrf_instance.error_handler
def csrf_error():
  return flask.make_response(
      flask.jsonify(error="CSRF token is expired; please refresh the page."),
      400)


@server.errorhandler(400)
def bad_request(error):
  return flask.make_response(
      flask.jsonify(error=error.description),
      400)


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


# The following functions {_get_map_id_threadsafe, _get_dd_json_threadsafe}
# follow a similar locking control flow in order to perform caching operations
# in a thread-safe manner.
#
# First, a lock needs to be acquired to access a dictionary of locks associated
# with each item key. Then, a lock needs to be acquired for the particular cache
# item that is to be checked. Upon acquiring this, the function then has to
# acquire another lock, to access the normally thread-unsafe cachetools.TTLCache
# structure. This locking is to ensure that more than one thread does not access
# the cache and miss, causing the expensive server-side operation to be
# performed more than once.
#
# Upon acquiring the TTLCache lock, the function then checks if the cache
# contains a value associated with the key of interest.
#
# If there is a cache hit, then both locks are discarded and the value is
# returned.
#
# If there is a cache miss, then the function discards the TTLCache lock and
# computes the value in its own specific manner. The function then reacquires
# the TTLCache lock and writes the value to the cache, then discards the lock
# and returns the computed value.
#
# In summary the locking mechanism is as follows:
#
#   with {dictionary lock}:
#     acquire item lock
#
#   with {item lock}:
#     with {TTLCache lock}:
#       (check TTLCache)
#       if cache hit: return value
#
#     (compute value)
#     with {TTLCache lock}:
#       (write value to TTLCache)
#
#     return value


def _get_lock(lock_dict_lock, lock_dict, key):
  """Acquires a lock from a lock dictionary."""
  with lock_dict_lock:
    return lock_dict[key]


_map_id_lock_dict_lock = threading.Lock()
_map_id_locks = collections.defaultdict(threading.Lock)
_map_id_ttl_cache_lock = threading.Lock()
_map_id_ttl_cache = cachetools.TTLCache(128, ttl=86400)


def _get_map_id_threadsafe(asset, vis_params):
  """Gets the map id associated with an EE asset and its vis params."""
  key = json.dumps({"asset": str(asset), "vis_params": vis_params})
  with _get_lock(_map_id_lock_dict_lock, _map_id_locks, key):
    with _map_id_ttl_cache_lock:
      if key in _map_id_ttl_cache:
        return _map_id_ttl_cache[key]
    mapid = asset.getMapId(vis_params=vis_params)
    with _map_id_ttl_cache_lock:
      _map_id_ttl_cache[key] = mapid
      return mapid


_dd_json_lock_dict_lock = threading.Lock()
_dd_json_locks = collections.defaultdict(threading.Lock)
_dd_json_ttl_cache_lock = threading.Lock()
_dd_json_ttl_cache = cachetools.TTLCache(128, ttl=86400)


def _get_dd_json_threadsafe(blob_name):
  """Gets the Earth Engine dataset metadata from cloud storage."""
  key = blob_name
  with _get_lock(_dd_json_lock_dict_lock, _dd_json_locks, key):
    with _dd_json_ttl_cache_lock:
      if key in _dd_json_ttl_cache:
        return _dd_json_ttl_cache[key]
    dataset_blob = config.CATALOG_BUCKET.get_blob(blob_name)
    if not dataset_blob:
      return None
    blob_contents = json.loads(dataset_blob.download_as_string())
    with _dd_json_ttl_cache_lock:
      _dd_json_ttl_cache[key] = blob_contents
    return blob_contents


def _get_asset(dataset_name, dataset, vis_metadata):
  """Gets the corresponding Earth Engine asset for a given dataset/params."""
  if dataset.get("table"):
    asset, vis_metadata = _get_table_asset(dataset_name, vis_metadata)
  elif dataset.get("imageCollection") is not None:
    asset = ee.ImageCollection(dataset_name).first()
  else:
    maybe_vis_metadata = vis_metadata.get("imageVisualization")
    if maybe_vis_metadata:
      vis_metadata = maybe_vis_metadata.get("bandVis", maybe_vis_metadata)
    asset = ee.Image(dataset_name)

  return (asset, vis_metadata)


def _get_table_asset(dataset_name, vis_metadata):
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

  dataset = _get_dd_json_threadsafe(wmts_layer.replace("/", "-") + ".json")
  if not dataset:
    return flask.Response(
        "Resource {} not found.".format(wmts_layer), status=404)

  try:
    vis_params = dataset["dataset"]["visualizations"][0]
  except KeyError:
    vis_params = {}

  vis_metadata = vis_params

  if dataset.get("table"):
    # Check if the table resource is available in Cloud Storage Layers
    if config.EE_CSL_ENABLED:
      timestamp = ee.data.getInfo(wmts_layer).get("updateTime")
      if timestamp:
        timestamp = timestamp.replace(":", "")
      tile_blob = config.CATALOG_BUCKET.get_blob(
          config.EE_CSL_TILEURL_TEMPLATE.format(
              path="%s-%s" % (wmts_layer.replace("/", "-"), timestamp),
              x=wmts_tile_col,
              y=wmts_tile_row,
              z=wmts_tile_matrix,
              suffix=".png"))
      if tile_blob:
        tile_content = tile_blob.download_as_string()
        return flask.Response(tile_content, mimetype="image/png")

  asset, vis_metadata = _get_asset(wmts_layer, dataset, vis_metadata)
  mapid = _get_map_id_threadsafe(asset, vis_metadata)

  tile_url = ee.data.getTileUrl(
      mapid,
      wmts_tile_col, wmts_tile_row, wmts_tile_matrix)  # x, y, z
  ee_tile_resp = requests.get(tile_url)

  return flask.Response(
      ee_tile_resp.content, mimetype=ee_tile_resp.headers["Content-Type"])


def clear_cache():
  """Clear saved cache."""
  _dd_json_ttl_cache.clear()
  _map_id_ttl_cache.clear()
