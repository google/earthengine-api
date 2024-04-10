import {
  deserialize,
  Serializable,
  SerializableCtor,
} from './domain_object';
import {
  MakeRequestParams,
  processParams,
} from './request_params';

export abstract class PromiseRequestService {
  send<T extends Serializable>(
    params: MakeRequestParams,
    responseCtor?: SerializableCtor<T>,
  ): Promise<T> {
    processParams(params);
    return this.makeRequest(params).then((response) =>
      responseCtor ? deserialize(responseCtor, response) : (response as T),
    );
  }

  abstract makeRequest(params: MakeRequestParams): Promise<unknown>;
}
