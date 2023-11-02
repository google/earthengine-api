/**
 * @fileoverview Wrapper for the generated v1 API methods and types.
 *
 * Necessary so that we can include the module in goog.provide-style modules
 * without awkward goog.scope/goog.module.get incantations.
 */
goog.module('ee.api');
goog.module.declareLegacyNamespace();

const api = goog.require('eeapiclient.ee_api_client');

exports = api;
