import 'jasmine';

import {
  buildQueryParams,
  bypassCorsPreflight,
  MakeRequestParams,
} from './request_params';

describe('buildQueryParams', () => {
  const PARAMS_MAP = {
    foo: 'foo',
    bar: 'bar',
    quux: 'qu.ux',
  };

  it('handles an empty input', () => {
    expect(buildQueryParams({}, PARAMS_MAP)).toEqual({});
  });

  it('includes matching parameters, mapped', () => {
    const params = {
      bar: 'exam',
      quux: 'kittens',
    };
    expect(buildQueryParams(params, PARAMS_MAP)).toEqual({
      'bar': 'exam',
      'qu.ux': 'kittens',
    });
  });

  it('drops unknown parameters', () => {
    const params = {
      bar: 'exam',
      someThingElse: 'extra field',
    };

    expect(buildQueryParams(params, PARAMS_MAP)).toEqual({'bar': 'exam'});
  });

  it('works for objects with getters', () => {
    class FancyParams {
      foo = 'regular param';
      get bar(): string {
        return 'getter';
      }
    }

    expect(buildQueryParams(new FancyParams(), PARAMS_MAP)).toEqual({
      bar: 'getter',
      foo: 'regular param',
    });
  });

  it('works for fields deeper in the prototype chain', () => {
    const proto = {foo: 'prototype field'};
    const params = Object.create(proto);
    params.bar = 'my own field';

    expect(params.foo).toBe('prototype field');
    expect(params.hasOwnProperty('foo')).toBe(false);

    expect(buildQueryParams(params, PARAMS_MAP)).toEqual({
      'foo': 'prototype field',
      'bar': 'my own field',
    });
  });
});

describe('bypassCorsPreflight', () => {
  it('handles an optional headers', () => {
    const params: MakeRequestParams = {
      path: 'v1/whatever',
      httpMethod: 'GET',
      methodId: 'someservice.whatever.get',
    };
    bypassCorsPreflight(params);
    expect(params.headers).toEqual({});
    expect(params.httpMethod).toEqual('GET');
    expect(params.queryParams).toBeUndefined();
  });

  it('handles an empty headers', () => {
    const params: MakeRequestParams = {
      path: 'v1/whatever',
      httpMethod: 'GET',
      methodId: 'someservice.whatever.get',
      headers: {},
      queryParams: {},
    };
    bypassCorsPreflight(params);
    expect(params.headers).toEqual({});
    expect(params.httpMethod).toEqual('GET');
    expect(params.queryParams).toEqual({});
  });

  it('sets a default Content-Type in a POST request', () => {
    const params: MakeRequestParams = {
      path: 'v1/whatever',
      httpMethod: 'POST',
      methodId: 'someservice.whatever.post',
    };
    bypassCorsPreflight(params);
    expect(params.headers).toEqual({'Content-Type': 'text/plain'});
    expect(params.httpMethod).toEqual('POST');
    expect(params.queryParams).toEqual({
      '$httpHeaders': 'Content-Type%3Aapplication%2Fjson%0D%0A',
    });
  });

  it('uses the given Content-Type in a POST request', () => {
    const params: MakeRequestParams = {
      path: 'v1/whatever',
      httpMethod: 'POST',
      methodId: 'someservice.whatever.post',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      },
    };
    bypassCorsPreflight(params);
    expect(params.headers).toEqual({'Content-Type': 'text/plain'});
    expect(params.httpMethod).toEqual('POST');
    expect(params.queryParams).toEqual({
      '$httpHeaders':
        'Content-Type%3Aapplication%2Fx-www-form-urlencoded%3Bcharset%3DUTF-8%0D%0A',
    });
  });

  it('handles would-trigger-preflight cors method', () => {
    const params: MakeRequestParams = {
      path: 'v1/whatever',
      httpMethod: 'PUT',
      methodId: 'someservice.whatever.put',
      headers: {},
      queryParams: {},
    };
    bypassCorsPreflight(params);
    expect(params.headers).toEqual({'Content-Type': 'text/plain'});
    expect(params.httpMethod).toEqual('POST');
    expect(params.queryParams).toEqual({
      '$httpMethod': 'PUT',
      '$httpHeaders': 'Content-Type%3Aapplication%2Fjson%0D%0A',
    });
  });

  it('handles would-trigger-preflight cors method with optional query params', () => {
    const params: MakeRequestParams = {
      path: 'v1/whatever',
      httpMethod: 'PUT',
      methodId: 'someservice.whatever.put',
      headers: {},
    };
    bypassCorsPreflight(params);
    expect(params.headers).toEqual({'Content-Type': 'text/plain'});
    expect(params.httpMethod).toEqual('POST');
    expect(params.queryParams).toEqual({
      '$httpMethod': 'PUT',
      '$httpHeaders': 'Content-Type%3Aapplication%2Fjson%0D%0A',
    });
  });

  it('handles simple cors headers', () => {
    const params: MakeRequestParams = {
      path: 'v1/whatever',
      httpMethod: 'GET',
      methodId: 'someservice.whatever.get',
      headers: {'accept-language': 'de'},
      queryParams: {},
    };
    bypassCorsPreflight(params);
    expect(params.headers).toEqual({'accept-language': 'de'});
    expect(params.httpMethod).toEqual('GET');
    expect(params.queryParams).toEqual({});
  });

  it('handles simple cors headers', () => {
    const params: MakeRequestParams = {
      path: 'v1/whatever',
      httpMethod: 'GET',
      methodId: 'someservice.whatever.get',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    };
    bypassCorsPreflight(params);
    expect(params.headers).toEqual({
      'Content-Type': 'application/x-www-form-urlencoded',
    });
    expect(params.httpMethod).toEqual('GET');
  });

  it('handles would-trigger-preflight cors headers', () => {
    const params: MakeRequestParams = {
      path: 'v1/whatever',
      httpMethod: 'GET',
      methodId: 'someservice.whatever.get',
      headers: {'accept-language': 'de', 'foo': 'bar'},
      queryParams: {},
    };
    bypassCorsPreflight(params);
    expect(params.headers).toEqual({'accept-language': 'de'});
    expect(params.httpMethod).toEqual('GET');
    expect(params.queryParams).toEqual({'$httpHeaders': 'foo%3Abar%0D%0A'});
  });

  it('handles would-trigger-preflight cors headers without safe headers', () => {
    const params: MakeRequestParams = {
      path: 'v1/whatever',
      httpMethod: 'GET',
      methodId: 'someservice.whatever.get',
      headers: {'foo': 'bar'},
      queryParams: {},
    };
    bypassCorsPreflight(params);
    expect(params.headers).toEqual({});
    expect(params.httpMethod).toEqual('GET');
    expect(params.queryParams).toEqual({'$httpHeaders': 'foo%3Abar%0D%0A'});
  });

  it('handles would-trigger-preflight cors headers with existing query params', () => {
    const params: MakeRequestParams = {
      path: 'v1/whatever',
      httpMethod: 'GET',
      methodId: 'someservice.whatever.get',
      headers: {'accept-language': 'de', 'foo': 'bar', 'a': 'b'},
      queryParams: {'hello': 'world'},
    };
    bypassCorsPreflight(params);
    expect(params.headers).toEqual({'accept-language': 'de'});
    expect(params.httpMethod).toEqual('GET');
    expect(params.queryParams).toEqual({
      'hello': 'world',
      '$httpHeaders': 'foo%3Abar%0D%0Aa%3Ab%0D%0A',
    });
  });

  it('handles would-trigger-preflight cors headers and method with existing query params', () => {
    const params: MakeRequestParams = {
      path: 'v1/whatever',
      httpMethod: 'PUT',
      methodId: 'someservice.whatever.put',
      headers: {'accept-language': 'de', 'foo': 'bar'},
      queryParams: {'hello': 'world'},
    };
    bypassCorsPreflight(params);
    expect(params.headers).toEqual({
      'accept-language': 'de',
      'Content-Type': 'text/plain',
    });
    expect(params.httpMethod).toEqual('POST');
    expect(params.queryParams).toEqual({
      'hello': 'world',
      '$httpHeaders': 'foo%3Abar%0D%0AContent-Type%3Aapplication%2Fjson%0D%0A',
      '$httpMethod': 'PUT',
    });
  });
});
