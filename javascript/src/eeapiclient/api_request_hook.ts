import {GeneratedRequestParams} from './generated_types';

export interface ApiClientRequestHook {
  /** Called once before each API send. */
  onBeforeSend(): void;
  /** Called after each successful API response. */
  onSuccess<T>(response: T): void;
  /**  Called after each unsuccessful API response. */
  onError(error: {}): void;
}

export abstract class ApiClientHookFactory {
  abstract getRequestHook(requestParams: GeneratedRequestParams):
      ApiClientRequestHook;
}

export interface ApiClientHookFactoryCtor {
  // tslint:disable-next-line:no-any ctor args are of any type
  new(...args: any[]): ApiClientHookFactory;
}

export class DefaultApiClientHookFactory implements ApiClientHookFactory {
  getRequestHook(requestParams: GeneratedRequestParams): ApiClientRequestHook {
    return {
      onBeforeSend() {},
      onSuccess<T>(response: T) {},
      onError(error: {}) {},
    } as ApiClientRequestHook;
  }
}

/**
 * Null aware way to generate an {@link ApiClientRequestHook}
 * from a {@link ApiClientHookFactory}.
 */
export function getRequestHook(
    factory: ApiClientHookFactory|null|undefined,
    requestParams: GeneratedRequestParams): ApiClientRequestHook|null {
  if (factory == null) {
    return null;
  }
  const hook = factory.getRequestHook(requestParams);
  if (hook == null) {
    return null;
  }
  return hook;
}
