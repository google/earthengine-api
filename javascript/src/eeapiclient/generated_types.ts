import {Serializable, SerializableCtor} from './domain_object';
import {MultipartRequest} from './multipart_request';

/**
 * Used to signal that an argument can be an instance of an interface generated
 * in interface-only mode.
 *
 * Because of structural typing this has no real effect, but it hopefully
 * clarifies method signatures.
 *
 * TODO(user): Figure out ways to enforce stronger typing.
 */
export interface GeneratedInterface {}

/** Type for the optional queryParams map: string-indexed primitive values. */
export interface GeneratedQueryParams {
  [key: string]:
    | number
    | ReadonlyArray<number>
    | string
    | ReadonlyArray<string>
    | boolean
    | ReadonlyArray<boolean>
    | undefined;
}

export interface GeneratedRequestParams {
  path: string;
  httpMethod: string;
  /** The id of the called method, from discovery. */
  methodId?: string;
  queryParams?: GeneratedQueryParams;
  body?: Serializable | GeneratedInterface | MultipartRequest | null;
  responseCtor?: SerializableCtor<Serializable>;
  /**
   * Whether the end-point is a streaming end-point and its type e.g.
   * 'SERVER_SIDE'.
   */
  streamingType?: string;
}

/** Type for a generic string-keyed object. */
export interface ApiClientObjectMap<T> {
  [key: string]: T;
}
