import {GeneratedQueryParams} from './generated_types';

export type HttpMethod = 'GET'|'POST'|'PUT'|'PATCH'|'DELETE';

/**
 * {@link HttpMethod} come directly from the discovery file as strings. The code
 * generator passes them along as such. This static class is to help
 * {@link PromiseRequestService} implementers check the type of
 * {@link MakeRequestParams#httpMethod}.
 */
// tslint:disable-next-line:class-as-namespace
export class HttpMethodEnum {
  static readonly GET: HttpMethod = 'GET';
  static readonly POST: HttpMethod = 'POST';
  static readonly PUT: HttpMethod = 'PUT';
  static readonly PATCH: HttpMethod = 'PATCH';
  static readonly DELETE: HttpMethod = 'DELETE';

  /** Returns true if the httpMethod is of type {@link HttpMethod}. */
  static isHttpMethod(method: HttpMethod|string) {
    return method === HttpMethodEnum.GET || method === HttpMethodEnum.POST ||
        method === HttpMethodEnum.PUT || method === HttpMethodEnum.PATCH ||
        method === HttpMethodEnum.DELETE;
  }
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
    params: {}, mapping: Record<string, string>): GeneratedQueryParams {
  const paramsMap = params as unknown as GeneratedQueryParams;
  const urlQueryParams: GeneratedQueryParams = {};
  for (const [jsName, urlQueryParamName] of Object.entries(mapping)) {
    if (jsName in paramsMap) {
      urlQueryParams[urlQueryParamName] = paramsMap[jsName];
    }
  }
  return urlQueryParams;
}
