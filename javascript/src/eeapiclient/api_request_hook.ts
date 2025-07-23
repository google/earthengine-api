import {GeneratedRequestParams} from './generated_types';

/**
 * Interface for a hook that can be used to intercept and modify API requests
 * and responses.
 */
export interface ApiClientRequestHook {
  /**
   * Called once before each API send.
   */
  onBeforeSend(): void;
  /**
   * Called after each successful API response.
   */
  onSuccess<T>(response: T): void;
  /**
   * Called after each unsuccessful API response.
   */
  onError(error: {}): void;
  /**
   * Called after each API request is finalized.
   * In some cases, the caller may cancel the API call which will not trigger
   * any of the success or error callbacks. To handle such cases, the onFinalize
   * callback can be used.
   * OnFinalize will have equal number of calls as onBeforeSend.
   */
  onFinalize?: () => void;
}

/**
 * Interface for a factory that can be used to create {@link
 * ApiClientRequestHook} instances.
 */
export abstract class ApiClientHookFactory {
  abstract getRequestHook(
    requestParams: GeneratedRequestParams,
  ): ApiClientRequestHook;
}

/**
 * Interface for a constructor that can be used to create {@link
 * ApiClientHookFactory} instances.
 */
export interface ApiClientHookFactoryCtor {
  // tslint:disable-next-line:no-any ctor args are of any type
  new (...args: any[]): ApiClientHookFactory;
}

/**
 * Default implementation of {@link ApiClientHookFactory} that does nothing.
 */
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
  factory: ApiClientHookFactory | null | undefined,
  requestParams: GeneratedRequestParams,
): ApiClientRequestHook | null {
  if (factory == null) {
    return null;
  }
  const hook = factory.getRequestHook(requestParams);
  if (hook == null) {
    return null;
  }
  return hook;
}
