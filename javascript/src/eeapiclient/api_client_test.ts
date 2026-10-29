import 'jasmine';

import {ApiClient} from './api_client';

class TestApiClient extends ApiClient {}

describe('ApiClient', () => {
  let apiClient: TestApiClient;

  beforeEach(() => {
    apiClient = new TestApiClient();
  });

  describe('$validateParameter', () => {
    describe('when enableStrictParameterValidation is false', () => {
      it('passes for a full match', () => {
        expect(() => {
          apiClient.$validateParameter('val123', /val\d+/);
        }).not.toThrow();
      });

      it('passes when only a prefix matches', () => {
        expect(() => {
          apiClient.$validateParameter('val123-extra', /val\d+/);
        }).not.toThrow();
      });

      it('passes when only a suffix matches', () => {
        expect(() => {
          apiClient.$validateParameter('extra-val123', /val\d+/);
        }).not.toThrow();
      });

      it('throws when there is no match', () => {
        expect(() => {
          apiClient.$validateParameter('no-match', /val\d+/);
        }).toThrowError(/does not match pattern/);
      });

      it('handles numeric parameters correctly after conversion to string', () => {
        expect(() => {
          apiClient.$validateParameter(123, /\d+/);
        }).not.toThrow();
      });
    });

    describe('when enableStrictParameterValidation is true', () => {
      beforeEach(() => {
        ApiClient.prototype.getEnableStrictParameterValidation = () => true;
      });

      it('passes for a full match', () => {
        expect(() => {
          apiClient.$validateParameter('val123', /val\d+/);
        }).not.toThrow();
      });

      it('throws when only a prefix matches', () => {
        expect(() => {
          apiClient.$validateParameter('val123-extra', /val\d+/);
        }).toThrowError(/does not match pattern/);
      });

      it('throws when only a suffix matches', () => {
        expect(() => {
          apiClient.$validateParameter('extra-val123', /val\d+/);
        }).toThrowError(/does not match pattern/);
      });

      it('throws when there is no match', () => {
        expect(() => {
          apiClient.$validateParameter('no-match', /val\d+/);
        }).toThrowError(/does not match pattern/);
      });

      it('handles numeric parameters correctly after conversion to string', () => {
        expect(() => {
          apiClient.$validateParameter(123, /\d+/);
        }).not.toThrow();
      });
    });
  });
});
