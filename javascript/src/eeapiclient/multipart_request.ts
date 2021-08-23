import {Serializable, serialize} from './domain_object';

export class MultipartRequest {
  private _boundary: string;
  private _metadataPayload = '';
  private _payloadPromise: Promise<string>;

  constructor(private files: File[], private _metadata?: {}|null) {
    this._boundary = Date.now().toString();
    if (_metadata) {
      this.addMetadata(_metadata);
    }
    this._payloadPromise = this.build();
  }

  boundary(): string {
    return this._boundary;
  }

  metadata(): {}|undefined|null {
    return this._metadata;
  }

  payloadPromise(): Promise<string> {
    return this._payloadPromise;
  }

  private addMetadata(metadata: {}): void {
    const json =
        (metadata instanceof Serializable) ? serialize(metadata) : metadata;
    this._metadataPayload +=
        'Content-Type: application/json; charset=utf-8\r\n\r\n' +
        JSON.stringify(json) + `\r\n--${this._boundary}\r\n`;
  }

  private build(): Promise<string> {
    let payload = `--${this._boundary}\r\n`;
    payload += this._metadataPayload;
    return Promise.all(this.files.map(f => this.encodeFile(f)))
        .then(filePayloads => {
          for (const filePayload of filePayloads) {
            payload += filePayload;
          }
          payload += `\r\n--${this._boundary}--`;
          return payload;
        });
  }

  private encodeFile(file: File): Promise<string> {
    return this.base64EncodeFile(file).then(
        base64Str => `Content-Type: ${file.type}\r\n` +
            `Content-Disposition: form-data; name="file"; filename="${
                         encodeURIComponent(file.name)}"\r\n` +
            'Content-Transfer-Encoding: base64\r\n\r\n' + base64Str);
  }

  private base64EncodeFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const file = (ev.target as FileReader).result as string;
          const toResolve = file.substr(file.indexOf(',') + 1);
          resolve(toResolve);
        } catch (e) {
          reject(e);
        }
      };
      reader.readAsDataURL(file);
    });
  }
}
