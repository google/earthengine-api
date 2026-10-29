import {
  ApiClient,
  toMakeRequestParams,
  toMultipartMakeRequestParams,
} from './api_client';
import {
  ApiClientHookFactory,
  getRequestHook,
} from './api_request_hook';
import {Serializable} from './domain_object';
import {
  GeneratedInterface,
  GeneratedRequestParams,
} from './generated_types';

import {PromiseRequestService} from './promise_request_service';

export class PromiseApiClient extends ApiClient {
  constructor(
    protected requestService: PromiseRequestService,
    protected hookFactory: ApiClientHookFactory | null = null,
  ) {
    super();
  }

  protected $addHooksToRequest<T>(
    requestParams: GeneratedRequestParams,
    promise: Promise<T>,
  ): Promise<T> {
    const hook = getRequestHook(this.hookFactory, requestParams);
    if (hook == null) {
      return promise;
    }

    hook.onBeforeSend();
    return promise
      .then(
        (response) => {
          hook.onSuccess(response);
          return response;
        },
        (error) => {
          hook.onError(error);
          throw error;
        },
      )
      .finally(() => {
        hook.onFinalize?.();
      });
  }

  /** Converts a gapi.client.Request to an Promise<T>. */
  $request<T extends Serializable | GeneratedInterface>(
    requestParams: GeneratedRequestParams,
  ): Promise<T> {
    const responseCtor = requestParams.responseCtor || void 0;
    return this.$addHooksToRequest<T>(
      requestParams,
      this.requestService.send(
        toMakeRequestParams(requestParams),
        responseCtor,
      ) as Promise<T>,
    );
  }

  $uploadRequest<T extends Serializable | GeneratedInterface>(
    requestParams: GeneratedRequestParams,
  ): Promise<T> {
    const responseCtor = requestParams.responseCtor || void 0;
    return this.$addHooksToRequest<T>(
      requestParams,
      toMultipartMakeRequestParams(requestParams).then(
        (params) =>
          this.requestService.send(params, responseCtor) as Promise<T>,
      ),
    );
  }
}
