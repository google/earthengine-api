// Copyright 2012 Google Inc. All Rights Reserved.

/**
 * @fileoverview Singleton for all of the library's communcation
 *  with the Earth Engine API.
 */

goog.provide('ee.data');
goog.require('ee');

goog.require('goog.Uri');
goog.require('goog.json');
goog.require('goog.net.XhrIo');
goog.require('goog.net.XmlHttp');

/**
 * Manages the data and API communication.
 * @constructor
 */
ee.data = function() {
};

/**
 * Load info for an asset, given an asset id.
 *
 * @param {string} id The asset to be retrieved.
 * @param {function(Object, string=)=} opt_callback An optional callback.
 *     If not supplied, the call is made synchronously.
 * @return {Object} The value call results.
 */
ee.data.getInfo = function(id, opt_callback) {
  return ee.data.send_('/info',
                       new goog.Uri.QueryData().add('id', id),
                       opt_callback);
};

/**
 * Get a list of contents for a collection asset.
 * @param {string} id The collection to be examined.
 * @param {function(Object, string=)=} opt_callback An optional callback.
 *     If not supplied, the call is made synchronously.
 * @return {Object} The list call results.
 */
ee.data.getList = function(id, opt_callback) {
  return ee.data.send_('/list',
                       new goog.Uri.QueryData().add('id', id),
                       opt_callback);
};

/**
 * @typedef {{
 *     mapid: string,
 *     token: string,
 *     image: ee.Image
 * }}
 */
ee.data.mapid;

/**
 * Get a Map Id for a given asset
 * @param {Object} params An object containing visualization
 *     options with the following possible values:
 *         version (number) Version number of image (or latest).
 *         bands (comma-seprated strings) Comma-delimited list of
 *             band names to be mapped to RGB.
 *         min (comma-separated numbers) Value (or one per band)
 *             to map onto 00.
 *         max (comma-separated numbers) Value (or one per band)
 *             to map onto FF.
 *         gain (comma-separated numbers) Gain (or one per band)
 *             to map onto 00-FF.
 *         bias (comma-separated numbers) Offset (or one per band)
 *             to map onto 00-FF.
 *         gamma (comma-separated numbers) Gamma correction
 *             factor (or one per band)
 *         palette (comma-separated strings) List of CSS-style color
 *             strings (single-band previews only).
 *         format (string) Either "jpg" or "png".
 * @param {function(Object, string=)=} opt_callback An optional callback.
 *     If not supplied, the call is made synchronously.
 * @return {ee.data.mapid} The mapId call results.
 */
ee.data.getMapId = function(params, opt_callback) {
  return (/** @type {ee.data.mapid} */
          ee.data.send_('/mapid',
                        ee.data.makeRequest_(params),
                        opt_callback));
};

/**
 * Generate a URL for map tiles from a mapid.
 * @param {ee.data.mapid} mapid The mapid to generate tiles for.
 * @param {number} x The tile x coordinate.
 * @param {number} y The tile y coordinate.
 * @param {number} z The tile zoom level.
 * @return {string} The tile url.
 */
ee.data.getTileUrl = function(mapid, x, y, z) {
  var width = Math.pow(2, z);
  x = x % width;
  if (x < 0) {
    x += width;
  }
  return [ee.tile_base_, 'map', mapid['mapid'], z, x, y].join('/') +
      '?token=' + mapid['token'];
};

/**
 * Retrieve a processed value from the front end.
 * @param {Object} params The value to be evaluated, with the following
 *     possible values:
 *        json (String) A JSON object to be evaluated.
 * @param {function(Object, string=)=} opt_callback An optional callback.
 *     If not supplied, the call is made synchronously.
 * @return {Object} The value call results.
 */
ee.data.getValue = function(params, opt_callback) {
  return ee.data.send_('/value', ee.data.makeRequest_(params), opt_callback);
};

/**
 * Get a Thumbnail Id for a given asset
 * @param {Object} params Parameters identical to those for the vizOptions for
 *     getMapId with the following additions:
 *         width (number) Width of the thumbnail to render, in pixels.
 *         height (number) Height of the thumbnail to render, in pixels.
 *         region (E,S,W,N or GeoJSON) Geospatial region of the image
 *             to render (or all).
 *         pixel_bb (X,Y,WIDTH,HEIGHT) Exact pixel region of the image
 *             to render (or all).
 *         format (string) Either 'png' (default) or 'jpg'.
 * @param {function(Object, string=)=} opt_callback An optional callback.
 *     If not supplied, the call is made synchronously.
 * @return {Object} The thumb call results, usually an image.
 */
ee.data.getThumbId = function(params, opt_callback) {
  var request = ee.data.makeRequest_(params).add('getid', '1');
  return ee.data.send_('/thumb', request, opt_callback);
};

/**
 * Get a Download Id.
 * @param {Object} params An object containing download options with the
 *     following possible values:
 *     id: The ID of the image to download.
 *     name: a base name to use when constructing filenames.
 *     bands: a description of the bands to download. Must be an array of
 *         dictionaries, each with the following keys:
 *       id: the name of the band, a string, required.
 *       crs: an optional CRS string defining the band projection.
 *       crs_transform: an optional array of 6 numbers specifying an affine
 *           transform from the specified CRS, in the order: xScale, yShearing,
 *           xShearing, yScale, xTranslation and yTranslation.
 *       dimensions: an optional array of two integers defining the width and
 *           height to which the band is cropped.
 *       scale: an optional number, specifying the scale in meters of the band;
 *              ignored if crs and crs_transform is specified.
 *     crs: a default CRS string to use for any bands that do not explicitly
 *         specify one.
 *     crs_transform: a default affine transform to use for any bands that do
 *         not specify one, of the same format as the crs_transform of bands.
 *     dimensions: default image cropping dimensions to use for any bands that
 *         do not specify them.
 *     scale: a default scale to use for any bands that do not specify one;
 *         ignored if crs and crs_transform is specified.
 *     region: a polygon specifying a region to download; ignored if crs
 *         and crs_transform is specified.
 * @param {function(Object, string=)=} opt_callback An optional callback.
 *     If not supplied, the call is made synchronously.
 * @return {{docid: string, token: string}} A download ID and token.
 */
ee.data.getDownloadId = function(params, opt_callback) {
  return /** @type {{docid: string, token: string}} */ (ee.data.send_(
      '/download',
      ee.data.makeRequest_(params),
      opt_callback));
};

/**
 * Create a download URL from a docid and token.
 * @param {{docid: string, token: string}} id A download ID and token.
 * @return {string} The download URL.
 */
ee.data.makeDownloadUrl = function(id) {
  return ee.url_base_ + '/download?docid=' + id['docid'] +
      '&token=' + id['token'];
};

/**
 *
 * Get the list of algorithms.
 *
 * @param {function(Object, string=)=} opt_callback An optional callback.
 *     If not supplied, the call is made synchronously.
 * @return {Object} The list of algorithm signatures.
 */
ee.data.getAlgorithms = function(opt_callback) {
  return ee.data.send_('/algorithms',
                       ee.data.makeRequest_({}),
                       opt_callback,
                       'GET');
};

/**
 * Send an API call.
 *
 * @param {string} path The API endpoint to call.
 * @param {?goog.Uri.QueryData} params The call parameters.
 * @param {function(Object, string=)=} opt_callback An optional callback.
 *     If not specified, the call is made synchronously and the response
 *     is returned.
 * @param {string=} opt_method The HTTPRequest method (GET or POST), default
 *     is POST.
 *
 * @return {?Object} The data object returned by the API call.
 * @private
 */
ee.data.send_ = function(path, params, opt_callback, opt_method) {
  opt_method = opt_method || 'POST';
  var url = ee.url_base_ + path;
  var requestData = params ? params.toString() : '';

  // Handle processing and dispatching a callback response.
  function handleResponse(responseText, opt_callback) {
    var jsonIsInvalid = false;
    try {
      var response = goog.json.parse(responseText);
      var data = response['data'];
      var error = response['error'];
    } catch (e) {
      jsonIsInvalid = true;
    }

    var errorMessage = undefined;

    // Totally malformed, with either invalid JSON or JSON with
    // neither a data nor an error property.
    if (jsonIsInvalid || (!data && !error)) {
      errorMessage = 'Malformed request: ' + responseText;
    }
    else if (error) {
      errorMessage = response['error']['message'];
    }
    if (opt_callback) {
      opt_callback(data, errorMessage);
    } else {
      if (!errorMessage) {
        return data;
      }
      throw new Error(errorMessage);
    }
  };

  if (opt_callback) {
    goog.net.XhrIo.send(
        url,
        function(e) {
          return handleResponse(e.target.getResponseText(), opt_callback);
        },
        opt_method,
        requestData);
  } else {
    // Construct a synchronous request.
    var xmlhttp = goog.net.XmlHttp();

    // Send request.
    xmlhttp.open(opt_method, url, false);
    xmlhttp.setRequestHeader(
        'Content-type', 'application/x-www-form-urlencoded');
    xmlhttp.send(requestData);
    return handleResponse(xmlhttp.responseText, null);
  }
};

/**
 * Convert an object into a goog.Uri.QueryData.
 *
 * @param {Object} params The params to convert.
 * @return {goog.Uri.QueryData} The converted parameters.
 * @private
 */
ee.data.makeRequest_ = function(params) {
  var request = new goog.Uri.QueryData();
  for (var item in params) {
    request.set(item, params[item]);
  }
  return request;
};

/**
 * Mock the networking calls used in send_.
 *
 * @param {Object=} opt_calls A dictionary containing the responses to return
 * for each URL, keyed to URL.
 */
ee.data.setupMockSend = function(opt_calls) {
  var calls = opt_calls || {};
  // Mock XhrIo.send for async calls.
  goog.net.XhrIo.send = function(url, callback, method, data) {
    // An anonymous class to simulate an event.  Closure doesn't like this.
    /** @constructor */
    var fakeEvent = function() {};
    var e = new fakeEvent();
    e.target = {};
    e.target.getResponseText = function() {
      // If the mock is set up with a string for this URL, return that.
      // Otherwise, assume it's a function and call it.  If there's nothing
      // set for this url, return an error response.
      if (url in calls) {
        if (goog.isString(calls[url])) {
          return calls[url];
        } else {
          return calls[url](url, callback, method, data);
        }
      } else {
        return '{"error": {}}';
      }
    }
    // Call the callback in a timeout to simulate asynchronous behavior.
    setTimeout(goog.bind(/** @type {function()} */ (callback), e, e), 0);
  }

  // Mock goog.net.XmlHttp for sync calls.
  /** @constructor */
  var fakeXmlHttp = function() {};
  var method = null;
  fakeXmlHttp.prototype.open = function(method, urlIn) {
    this.url = urlIn;
    this.method = method;
  };
  fakeXmlHttp.prototype.setRequestHeader = function() {};
  fakeXmlHttp.prototype.send = function(data) {
    if (this.url in calls) {
      if (goog.isString(calls[this.url])) {
        this.responseText = calls[this.url];
      } else {
        this.responseText = calls[this.url](this.url, this.method, data);
      }
    } else {
      // Return the input arguments.
      this.responseText = goog.json.serialize({
        'data': {
          'url': this.url,
          'method': this.method,
          'data': data
        }
      });
    }
  }
  goog.net.XmlHttp = function() {
    return /** @type {?} */ (new fakeXmlHttp());
  };
};

/**
 * A wrapper for json.parse that we can explictly make available for testing.
 * @param {string} str The string to be parsed.
 * @return {Object} The object resulting from the parse.
 */
ee.data.parse = function(str) {
  return goog.json.parse(str);
};

// Explicit exports
goog.exportSymbol('ee.data', ee.data);
goog.exportSymbol('ee.data.getInfo', ee.data.getInfo);
goog.exportSymbol('ee.data.getList', ee.data.getList);
goog.exportSymbol('ee.data.getMapId', ee.data.getMapId);
goog.exportSymbol('ee.data.getValue', ee.data.getValue);
goog.exportSymbol('ee.data.getThumbId', ee.data.getThumbId);
goog.exportSymbol('ee.data.getDownloadId',
                  ee.data.getDownloadId);
goog.exportSymbol('ee.data.makeDownloadUrl',
                  ee.data.makeDownloadUrl);
goog.exportSymbol('ee.data.send_', ee.data.send_);
goog.exportSymbol('ee.data.setupMockSend', ee.data.setupMockSend);
goog.exportSymbol('ee.data.parse', ee.data.parse);
