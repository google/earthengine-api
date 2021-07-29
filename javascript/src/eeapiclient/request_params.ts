import * as httpCors from 'goog:goog.net.rpc.HttpCors';

import {GeneratedQueryParams} from './generated_types';

/** Available HTTP methods supported by Google APIs */
export type HttpMethod = 'GET'|'POST'|'PUT'|'PATCH'|'DELETE';

/**
 * {@link HttpMethod} come directly from the discovery file as strings. The code
 * generator passes them along as such. This enum is to help
 * {@link PromiseRequestService} implementers check the type of
 * {@link MakeRequestParams#httpMethod}.
 */
export enum HttpMethodEnum {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
}

/**
 * AuthType for the request. This can be used to override GAPI's current
 * settings.
 *
 * See: gapi.js
 *
 * TODO: Remove and depend on explicit GAPI typings. Currently these do not
 * exist but adding them is in discussion, b/135768663.
 */
export enum AuthType {
  AUTO = 'auto',
  NONE = 'none',
  OAUTH2 = 'oauth2',
  FIRST_PARTY = '1p',
}

/**
 * Type of the streaming RPC method. A string enum is used to make it easier
 * to compare string values to the enum values.
 */
export enum StreamingType {
  NONE = 'NONE',
  CLIENT_SIDE = 'CLIENT_SIDE',
  SERVER_SIDE = 'SERVER_SIDE',
  BIDIRECTONAL = 'BIDIRECTONAL'
}

/**
 * Request parameters as described by the Discovery doc. Will need to be
 * translated to the appropriate type for any specific transport.
 */
export interface MakeRequestParams {
  path: string;
  /**
   * The reason this is a union type is because apis are allowed to define
   * custom HTTP methods. You can use {@link HttpMethodEnum#isHttpMethod}
   * to check if the httpMethod is of type {@link HttpMethod}.
   */
  httpMethod: HttpMethod|string;
  /** The id of the called method, from discovery. */
  methodId?: string;
  // tslint:disable-next-line:no-any
  queryParams?: {[key: string]: any};
  body?: {};
  headers?: {[key: string]: string};
  authType?: AuthType;
  /** The ID of the API that the request belongs to. */
  apiId?: string;
  streamingType?: StreamingType;
}

/**
 * Filters out undefined query parameters.
 */
export function processParams(params: MakeRequestParams) {
  if (params.queryParams != null) {
    // tslint:disable-next-line:no-any
    const filteredQueryParams: {[key: string]: any} = {};
    for (const key in params.queryParams) {
      if (params.queryParams[key] !== void 0) {
        filteredQueryParams[key] = params.queryParams[key];
      }
    }
    params.queryParams = filteredQueryParams;
  }
}

/**
 * Given a parameters map (possibly an empty object, but never undefined)
 * and a ParameterSet (= Record<jsName: string, paramName: string>) this builds
 * the query params object by populating it with all the parameters which are
 * not undefined in params.
 *
 * Note that the types were checked at the call to the specific API method;
 * therefore this function can be loose about type-checking the fields.
 */
export function buildQueryParams(
    params: {}, mapping: Record<string, string>,
    passthroughParams: Record<string, string> = {}): GeneratedQueryParams {
  const paramsMap = params as unknown as GeneratedQueryParams;

  const urlQueryParams: GeneratedQueryParams = passthroughParams;
  for (const [jsName, urlQueryParamName] of Object.entries(mapping)) {
    if (jsName in paramsMap) {
      urlQueryParams[urlQueryParamName] = paramsMap[jsName];
    }
  }
  return urlQueryParams;
}

const simpleCorsAllowedHeaders: string[] =
    ['accept', 'accept-language', 'content-language'];

const simpleCorsAllowedMethods: string[] = ['GET', 'HEAD', 'POST'];

/**
 * Note: This function only works for One Platform APIs.
 * Manipulates the request options such that it will not trigger a CORS
 * preflight request. Removes the headers that were moved into the magic
 * parameter from the map.
 *
 * For more info on exactly what may trigger CORS preflight, see
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS.
 * Basically, there are three restrictions:
 *
 * 1. The only HTTP methods always allowed without are 'GET', 'HEAD', 'POST'.
 * If the request uses another method, it'll need to be encoded in the URL.
 *
 * 2. There are only a few request headers that won't trigger preflight:
 * 'Accept', 'Accept-Language', 'Content-Language' & 'Content-Type', if the
 * values are well-formed (we will assume they are).
 *
 * 3. 'Content-Type' specifically is restricted to
 * 'application/x-www-form-urlencoded', 'multipart/form-data', and
 * 'text/plain'. If 'Content-Type' ends up in the URL, there will be no
 * 'Content-Type' header added in the request (depending on the HTTP method,
 * a 'Content-Type' of 'text/plain;charset=UTF-8' will be automatically added
 * by the browser.
 */
// TODO(user): Return a changed copy of params.
export function bypassCorsPreflight(params: MakeRequestParams) {
  const safeHeaders: {[key: string]: string} = {};
  const unsafeHeaders: {[key: string]: string} = {};
  let hasUnsafeHeaders = false;
  let hasSafeHeaders = false;
  let hasContentType = false;

  if (params.headers) {
    hasContentType = params.headers['Content-Type'] != null;
    for (const [key, value] of Object.entries(params.headers)) {
      if (simpleCorsAllowedHeaders.includes(key)) {
        safeHeaders[key] = value;
        hasSafeHeaders = true;
      } else {
        unsafeHeaders[key] = value;
        hasUnsafeHeaders = true;
      }
    }
  }

  if (params.body != null || params.httpMethod === 'PUT' ||
      params.httpMethod === 'POST') {
    // Normally, HttpClient detects the application/json Content-Type based on
    // the body of the request. We need to explicitly set it in the
    // pre-generateEncodedHttpHeadersOverwriteParam so that the header
    // overwriting query param contains the correct Content-Type and the raw
    // request Content-Type can be text/plain, thus avoiding the OPTIONS
    // preflight request.
    if (!hasContentType) {
      unsafeHeaders['Content-Type'] = 'application/json';
      hasUnsafeHeaders = true;
    }
    safeHeaders['Content-Type'] = 'text/plain';
    hasSafeHeaders = true;
  }

  if (hasUnsafeHeaders) {
    const finalParam =
        httpCors.generateEncodedHttpHeadersOverwriteParam(unsafeHeaders);
    addQueryParameter(params, httpCors.HTTP_HEADERS_PARAM_NAME, finalParam);
  }
  if (hasSafeHeaders) {
    params.headers = safeHeaders;
  }

  if (!simpleCorsAllowedMethods.includes(params.httpMethod)) {
    addQueryParameter(
        params, httpCors.HTTP_METHOD_PARAM_NAME, params.httpMethod);
    params.httpMethod = 'POST';
  }
}

function addQueryParameter(
    params: MakeRequestParams, key: string, value: string) {
  if (params.queryParams) {
    params.queryParams[key] = value;
  } else {
    params.queryParams = {[key]: value};
  }
}
