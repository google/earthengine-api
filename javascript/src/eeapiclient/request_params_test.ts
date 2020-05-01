import 'jasmine';

import {buildQueryParams} from './request_params';

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
