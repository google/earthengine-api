/**
 * @fileoverview Wrapper for generated API methods and types.
 *
 * Necessary so that we can include the module in goog.provide-style modules
 * without awkward goog.scope/goog.module.get incantations.
 */
goog.module('ee.api');
goog.module.declareLegacyNamespace();

const eeApi = goog.require('eeapiclient.ee_api_client');

exports = eeApi;
