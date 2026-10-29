import {Serializable, serialize} from './domain_object';
import {GeneratedRequestParams} from './generated_types';
import {MultipartRequest} from './multipart_request';
import {MakeRequestParams, StreamingType} from './request_params';

/**
 * An abstract base class for Api Client, a library that helps TypeScript and
 * JavaScript web applications make HTTP and RPC calls to Google servers.
 */
export abstract class ApiClient {
  // tslint:disable-next-line:no-any
  $validateParameter(param: any, pattern: RegExp): void {
    const paramStr = String(param);

    const isParamValid = this.getEnableStrictParameterValidation()
      ? paramStr.match(pattern)?.[0] === paramStr
      : pattern.test(paramStr);

    // Server side validation uses full string matches, client side must have
    // matching full string validation behavior.
    if (!isParamValid) {
      throw new Error(
        `parameter [${paramStr}] does not match pattern [${pattern.toString()}]`,
      );
    }
  }

  /**
   * If true, enable strict parameter validation.
   *
   * This is a temporary property to allow for a gradual rollout of strict
   * parameter validation.
   *
   * It is set via the ts_api_client build rule.
   */
  enableStrictParameterValidation = false;

  /**
   * If true, enable strict parameter validation.
   *
   * This is a temporary method to allow for a gradual rollout of strict
   * parameter validation.
   *
   * You can override this method at runtime by setting it on the prototype:
   *
   * ```
   * ApiClient.prototype.getEnableStrictParameterValidation = () => true;
   * ```
   */
  getEnableStrictParameterValidation(): boolean {
    return this.enableStrictParameterValidation;
  }
}

export function toMakeRequestParams(
  requestParams: GeneratedRequestParams,
): MakeRequestParams {
  const body =
    requestParams.body instanceof Serializable
      ? serialize(requestParams.body)
      : requestParams.body;
  return {
    path: requestParams.path,
    httpMethod: requestParams.httpMethod,
    methodId: requestParams.methodId,
    body: body as Serializable,
    queryParams: requestParams.queryParams,
    streamingType:
      requestParams.streamingType &&
      (requestParams.streamingType as StreamingType),
  } as MakeRequestParams;
}

export function toMultipartMakeRequestParams(
  requestParams: GeneratedRequestParams,
): Promise<MakeRequestParams> {
  if (!(requestParams.body instanceof MultipartRequest)) {
    throw new Error(`${requestParams.path} request must be a MultipartRequest`);
  }

  const multipartRequest = requestParams.body;
  return multipartRequest.payloadPromise().then((body) => {
    const queryParams = requestParams.queryParams ?? {};
    return {
      path: requestParams.path,
      httpMethod: requestParams.httpMethod,
      methodId: requestParams.methodId,
      queryParams: {...queryParams, 'uploadType': 'multipart'},
      headers: {
        'X-Goog-Upload-Protocol': 'multipart',
        'Content-Type': `multipart/related; boundary=${multipartRequest.boundary()}`,
      },
      body,
    };
  });
}
