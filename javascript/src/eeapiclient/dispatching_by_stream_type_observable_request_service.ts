/**
 * Defines DispatchingByStreamTypeObservableRequestService used to support
 * streaming end-points along side non-streaming end-points. This needs
 * a build rule configuration.
 */
import {MakeRequestParams, StreamingType} from './request_params';
import {ObservableRequestService} from './observable_request_service';
import {Observable} from 'rxjs';
import {map, switchMap} from 'rxjs/operators';

/**
 * Acts as a wrapper for ObservableRequestServices and uses the flag
 * StreamingType to decide which ObservableRequestService to use
 */
export class DispatchingByStreamTypeObservableRequestService extends
    ObservableRequestService {
  constructor(
      private readonly observableRequestService: ObservableRequestService,
      private readonly streamingObservableRequestService:
          ObservableRequestService) {
    super();
  }

  /**
   * makeRequest is called by the service object. Different services are called
   * depending on whether or not the response is streamed, and
   * an Observable of the data from the response is returned
   */
  makeRequest(params: MakeRequestParams): Observable<unknown> {
    if (params.streamingType === StreamingType.SERVER_SIDE) {
      return this.streamingObservableRequestService.makeRequest(params);
    }
    return this.observableRequestService.makeRequest(params);
  }
}
