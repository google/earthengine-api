import {XhrFactory} from '@angular/common';
import {HttpErrorResponse, HttpHeaders} from '@angular/common/http';
import {MakeRequestParams} from './request_params';
import {Config} from './angular_2_http_client_request_service';
import {ObservableRequestService} from './observable_request_service';
import {concatUrl} from './url';
import {from as observableFrom, Observable, Observer} from 'rxjs';
import {map, switchMap} from 'rxjs/operators';

/**
 * Error response header key for internal errors at Google.
 */
export const GOOGLE_STATUS_ERROR = 'google-status-error-message';

/**
 *  Executes HTTP requests for streaming based endpoints that use length
 *  prefixed JSON encoding strategy. Collects chunks and emits objects from
 *  the Observable as they're ready
 */
export class LengthPrefixedJsonStreamingObservableRequestService extends
    ObservableRequestService {
  protected config: Observable<Config>;
  constructor(
      config: Config|Promise<Config>, private readonly xhrFactory: XhrFactory) {
    super();
    this.config = observableFrom(Promise.resolve(config));
  }

  /**
   * makeRequest is called by the service object.
   * Returns a promise of the data from the response.
   */
  makeRequest<T>(params: MakeRequestParams): Observable<T> {
    return this.config.pipe(
        switchMap(config => this.executeHttpRequest(config, params)),
        map(response => response as T));
  }

  /**
   * The function to execute an http request using the Http client.
   * Returns the promise of the Http response.
   */
  // TODO(kloveless): This should be protected. Currently exposed just
  // for testing.
  executeHttpRequest(config: Config, params: MakeRequestParams):
      Observable<{}> {
    return new Observable((observer: Observer<{}>) => {
      const headers = this.mergeHeaders(params.headers, config.headers);
      const xhr = this.xhrFactory.build();

      if (!!config.withCredentials) {
        xhr.withCredentials = true;
      }

      // Total number of bytes that have been received
      let seenBytes = 0;
      // Size of the next object expected to be read in
      let bytesInNextObject = 0;
      // Bytes that have been received, but not yet parsed into an object
      let charactersToBeParsed = '';

      // This method assumes the encoding for the response will be UTF-8, the
      // default for TextEncoder and TextDecoder
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();

      // This is called on Open, Send, every time data is received, and when the
      // operation is complete
      xhr.onreadystatechange = () => {
        // If this is Open or Send (xhr.OPENED or xhr.HEADERS_RECEIVED), there
        // is no data to parse yet
        if (xhr.readyState <= xhr.HEADERS_RECEIVED) {
          return;
        }

        // Handle errors
        if (xhr.status >= 400) {
          observer.error(
              this.buildHttpErrorResponse(xhr.getAllResponseHeaders()));
          return;
        }

        // We receive data in chunks, but xhr.responseText contains the complete
        // set of data we receive. Thus, we monitor the number of bytes seen to
        // determine if xhr.responseText contains new data
        if (seenBytes < xhr.responseText.length) {
          charactersToBeParsed += xhr.responseText.substr(seenBytes);
          seenBytes = xhr.responseText.length;

          // We loop here in case one chunk contains multiple objects that can
          // be parsed
          while (charactersToBeParsed.length > 0) {
            // If bytesInNextObject is 0, then the foremost characters to be
            // parsed must be the length of the next object
            if (bytesInNextObject === 0) {
              // Get the first integer from a string that starts with an integer
              // Pick the first matched number.
              const nextObjectSize: string|undefined =
                  (charactersToBeParsed.trim().match(/^\d+/) || [])[0];
              bytesInNextObject = Number(nextObjectSize);

              if (!nextObjectSize || isNaN(bytesInNextObject)) {
                // Since the downstream error handlers expect HttpErrorResponse
                // and a specific header, use that as well for client-side
                // parsing errors.
                observer.error(this.buildHttpErrorResponse({
                  [GOOGLE_STATUS_ERROR]:
                      'Length in length prefixed encoding not specified'
                }));
                return;
              }

              charactersToBeParsed =
                  charactersToBeParsed.substr(nextObjectSize.length);
            }

            // If the whole object has been received, parse it into an object
            // emit it, and then set bytesInNextObject to 0 so the next length
            // can be read in.

            // Since there is a possibility of non-ascii characters in the
            // response, the number of bytes does not always equal the number
            // of characters. To ensure we are consuming the correct number of
            // bytes, we use TextEncoder and TextDecoder to work with byte
            // arrays instead of characters.

            // Switch from character space to byte space since the size returned
            // by the server is bytes not characters.
            const byteArray = encoder.encode(charactersToBeParsed);

            if (byteArray.length >= bytesInNextObject) {
              // Select just the single message in byte-space.
              const byteMessage = byteArray.slice(0, bytesInNextObject);

              // Switch back to a string representation that JSON parsing
              // requires.
              const stringMessage = decoder.decode(byteMessage);
              if (stringMessage.startsWith('ERROR=')) {
                // Used to signify errors in the application, without needing
                // to have errors as a field in the proto response.
                observer.error(this.buildHttpErrorResponse({
                  [GOOGLE_STATUS_ERROR]:
                      // Take the part after 'ERROR='.
                      stringMessage.substr(6)
                }));
                // Assumes that if we have hit an error at this layer, then
                // nothing more is to be handled.
                return;
              }

              let nextObject = {};
              try {
                nextObject = JSON.parse(stringMessage) as {};
              } catch (exception) {
                const message: string = exception.message;
                observer.error(this.buildHttpErrorResponse({
                  [GOOGLE_STATUS_ERROR]:
                      'Failed to parse JSON stream: ' + message
                }));
                return;
              }

              observer.next(nextObject);

              // Remove the same number of characters as the character size of
              // the byte message handled.
              charactersToBeParsed =
                  charactersToBeParsed.slice(stringMessage.length);

              // Reset bytesInNextObject so it will be read in for the next
              // object
              bytesInNextObject = 0;
            } else {
              // If not enough bytes have been read to construct the next object
              // we can exit the loop and wait for the next chunk
              break;
            }
          }
        }

        if (xhr.readyState === xhr.DONE) {
          observer.complete();
        }
      };

      xhr.open(params.httpMethod, concatUrl(config.gapiUrl, params.path));
      for (const key of headers.keys()) {
        xhr.setRequestHeader(key, headers.get(key) || '');
      }
      xhr.send(JSON.stringify(params.body || null));
    });
  }

  protected buildHttpErrorResponse(headerParams?: string|
                                   Record<string, string>): HttpErrorResponse {
    const headers = new HttpHeaders(headerParams);
    return new HttpErrorResponse({headers});
  }

  protected mergeHeaders(
      baseHeaders?: Record<string, string>,
      customHeaders?: Record<string, string>): HttpHeaders {
    const headers = {...baseHeaders, ...customHeaders};
    return new HttpHeaders(headers);
  }
}
