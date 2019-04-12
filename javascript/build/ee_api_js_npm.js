var $jscomp = $jscomp || {};
$jscomp.scope = {};
$jscomp.arrayIteratorImpl = function(array) {
  var index = 0;
  return function() {
    return index < array.length ? {done:!1, value:array[index++]} : {done:!0};
  };
};
$jscomp.arrayIterator = function(array) {
  return {next:$jscomp.arrayIteratorImpl(array)};
};
$jscomp.makeIterator = function(iterable) {
  var iteratorFunction = "undefined" != typeof Symbol && Symbol.iterator && iterable[Symbol.iterator];
  return iteratorFunction ? iteratorFunction.call(iterable) : $jscomp.arrayIterator(iterable);
};
$jscomp.ASSUME_ES5 = !1;
$jscomp.ASSUME_NO_NATIVE_MAP = !1;
$jscomp.ASSUME_NO_NATIVE_SET = !1;
$jscomp.SIMPLE_FROUND_POLYFILL = !1;
$jscomp.objectCreate = $jscomp.ASSUME_ES5 || "function" == typeof Object.create ? Object.create : function(prototype) {
  var ctor = function() {
  };
  ctor.prototype = prototype;
  return new ctor;
};
$jscomp.underscoreProtoCanBeSet = function() {
  var x = {a:!0}, y = {};
  try {
    return y.__proto__ = x, y.a;
  } catch (e) {
  }
  return !1;
};
$jscomp.setPrototypeOf = "function" == typeof Object.setPrototypeOf ? Object.setPrototypeOf : $jscomp.underscoreProtoCanBeSet() ? function(target, proto) {
  target.__proto__ = proto;
  if (target.__proto__ !== proto) {
    throw new TypeError(target + " is not extensible");
  }
  return target;
} : null;
$jscomp.inherits = function(childCtor, parentCtor) {
  childCtor.prototype = $jscomp.objectCreate(parentCtor.prototype);
  childCtor.prototype.constructor = childCtor;
  if ($jscomp.setPrototypeOf) {
    var setPrototypeOf = $jscomp.setPrototypeOf;
    setPrototypeOf(childCtor, parentCtor);
  } else {
    for (var p in parentCtor) {
      if ("prototype" != p) {
        if (Object.defineProperties) {
          var descriptor = Object.getOwnPropertyDescriptor(parentCtor, p);
          descriptor && Object.defineProperty(childCtor, p, descriptor);
        } else {
          childCtor[p] = parentCtor[p];
        }
      }
    }
  }
  childCtor.superClass_ = parentCtor.prototype;
};
$jscomp.findInternal = function(array, callback, thisArg) {
  array instanceof String && (array = String(array));
  for (var len = array.length, i = 0; i < len; i++) {
    var value = array[i];
    if (callback.call(thisArg, value, i, array)) {
      return {i:i, v:value};
    }
  }
  return {i:-1, v:void 0};
};
$jscomp.defineProperty = $jscomp.ASSUME_ES5 || "function" == typeof Object.defineProperties ? Object.defineProperty : function(target, property, descriptor) {
  target != Array.prototype && target != Object.prototype && (target[property] = descriptor.value);
};
$jscomp.getGlobal = function(maybeGlobal) {
  return "undefined" != typeof window && window === maybeGlobal ? maybeGlobal : "undefined" != typeof global && null != global ? global : maybeGlobal;
};
$jscomp.global = $jscomp.getGlobal(this);
$jscomp.polyfill = function(target, polyfill, fromLang, toLang) {
  if (polyfill) {
    for (var obj = $jscomp.global, split = target.split("."), i = 0; i < split.length - 1; i++) {
      var key = split[i];
      key in obj || (obj[key] = {});
      obj = obj[key];
    }
    var property = split[split.length - 1], orig = obj[property], impl = polyfill(orig);
    impl != orig && null != impl && $jscomp.defineProperty(obj, property, {configurable:!0, writable:!0, value:impl});
  }
};
$jscomp.polyfill("Array.prototype.find", function(orig) {
  return orig ? orig : function(callback, opt_thisArg) {
    return $jscomp.findInternal(this, callback, opt_thisArg).v;
  };
}, "es6", "es3");
$jscomp.checkStringArgs = function(thisArg, arg, func) {
  if (null == thisArg) {
    throw new TypeError("The 'this' value for String.prototype." + func + " must not be null or undefined");
  }
  if (arg instanceof RegExp) {
    throw new TypeError("First argument to String.prototype." + func + " must not be a regular expression");
  }
  return thisArg + "";
};
$jscomp.polyfill("String.prototype.repeat", function(orig) {
  return orig ? orig : function(copies) {
    var string = $jscomp.checkStringArgs(this, null, "repeat");
    if (0 > copies || 1342177279 < copies) {
      throw new RangeError("Invalid count value");
    }
    copies |= 0;
    for (var result = ""; copies;) {
      if (copies & 1 && (result += string), copies >>>= 1) {
        string += string;
      }
    }
    return result;
  };
}, "es6", "es3");
$jscomp.SYMBOL_PREFIX = "jscomp_symbol_";
$jscomp.initSymbol = function() {
  $jscomp.initSymbol = function() {
  };
  $jscomp.global.Symbol || ($jscomp.global.Symbol = $jscomp.Symbol);
};
$jscomp.SymbolClass = function(id, opt_description) {
  this.$jscomp$symbol$id_ = id;
  $jscomp.defineProperty(this, "description", {configurable:!0, writable:!0, value:opt_description});
};
$jscomp.SymbolClass.prototype.toString = function() {
  return this.$jscomp$symbol$id_;
};
$jscomp.Symbol = function() {
  function Symbol(opt_description) {
    if (this instanceof Symbol) {
      throw new TypeError("Symbol is not a constructor");
    }
    return new $jscomp.SymbolClass($jscomp.SYMBOL_PREFIX + (opt_description || "") + "_" + counter++, opt_description);
  }
  var counter = 0;
  return Symbol;
}();
$jscomp.initSymbolIterator = function() {
  $jscomp.initSymbol();
  var symbolIterator = $jscomp.global.Symbol.iterator;
  symbolIterator || (symbolIterator = $jscomp.global.Symbol.iterator = $jscomp.global.Symbol("Symbol.iterator"));
  "function" != typeof Array.prototype[symbolIterator] && $jscomp.defineProperty(Array.prototype, symbolIterator, {configurable:!0, writable:!0, value:function() {
    return $jscomp.iteratorPrototype($jscomp.arrayIteratorImpl(this));
  }});
  $jscomp.initSymbolIterator = function() {
  };
};
$jscomp.initSymbolAsyncIterator = function() {
  $jscomp.initSymbol();
  var symbolAsyncIterator = $jscomp.global.Symbol.asyncIterator;
  symbolAsyncIterator || (symbolAsyncIterator = $jscomp.global.Symbol.asyncIterator = $jscomp.global.Symbol("Symbol.asyncIterator"));
  $jscomp.initSymbolAsyncIterator = function() {
  };
};
$jscomp.iteratorPrototype = function(next) {
  $jscomp.initSymbolIterator();
  var iterator = {next:next};
  iterator[$jscomp.global.Symbol.iterator] = function() {
    return this;
  };
  return iterator;
};
$jscomp.iteratorFromArray = function(array, transform) {
  $jscomp.initSymbolIterator();
  array instanceof String && (array += "");
  var i = 0, iter = {next:function() {
    if (i < array.length) {
      var index = i++;
      return {value:transform(index, array[index]), done:!1};
    }
    iter.next = function() {
      return {done:!0, value:void 0};
    };
    return iter.next();
  }};
  iter[Symbol.iterator] = function() {
    return iter;
  };
  return iter;
};
$jscomp.polyfill("Object.is", function(orig) {
  return orig ? orig : function(left, right) {
    return left === right ? 0 !== left || 1 / left === 1 / right : left !== left && right !== right;
  };
}, "es6", "es3");
$jscomp.polyfill("Array.prototype.includes", function(orig) {
  return orig ? orig : function(searchElement, opt_fromIndex) {
    var array = this;
    array instanceof String && (array = String(array));
    var len = array.length, i = opt_fromIndex || 0;
    for (0 > i && (i = Math.max(i + len, 0)); i < len; i++) {
      var element = array[i];
      if (element === searchElement || Object.is(element, searchElement)) {
        return !0;
      }
    }
    return !1;
  };
}, "es7", "es3");
$jscomp.polyfill("String.prototype.includes", function(orig) {
  return orig ? orig : function(searchString, opt_position) {
    return -1 !== $jscomp.checkStringArgs(this, searchString, "includes").indexOf(searchString, opt_position || 0);
  };
}, "es6", "es3");
$jscomp.owns = function(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
};
$jscomp.polyfill("Object.entries", function(orig) {
  return orig ? orig : function(obj) {
    var result = [], key;
    for (key in obj) {
      $jscomp.owns(obj, key) && result.push([key, obj[key]]);
    }
    return result;
  };
}, "es8", "es3");
$jscomp.polyfill("Array.prototype.values", function(orig) {
  return orig ? orig : function() {
    return $jscomp.iteratorFromArray(this, function(k, v) {
      return v;
    });
  };
}, "es8", "es3");
$jscomp.polyfill("Object.values", function(orig) {
  return orig ? orig : function(obj) {
    var result = [], key;
    for (key in obj) {
      $jscomp.owns(obj, key) && result.push(obj[key]);
    }
    return result;
  };
}, "es8", "es3");
$jscomp.FORCE_POLYFILL_PROMISE = !1;
$jscomp.polyfill("Promise", function(NativePromise) {
  function AsyncExecutor() {
    this.batch_ = null;
  }
  function isObject(value) {
    switch(typeof value) {
      case "object":
        return null != value;
      case "function":
        return !0;
      default:
        return !1;
    }
  }
  function resolvingPromise(opt_value) {
    return opt_value instanceof PolyfillPromise ? opt_value : new PolyfillPromise(function(resolve, reject) {
      resolve(opt_value);
    });
  }
  if (NativePromise && !$jscomp.FORCE_POLYFILL_PROMISE) {
    return NativePromise;
  }
  AsyncExecutor.prototype.asyncExecute = function(f) {
    if (null == this.batch_) {
      this.batch_ = [];
      var self = this;
      this.asyncExecuteFunction(function() {
        self.executeBatch_();
      });
    }
    this.batch_.push(f);
  };
  var nativeSetTimeout = $jscomp.global.setTimeout;
  AsyncExecutor.prototype.asyncExecuteFunction = function(f) {
    nativeSetTimeout(f, 0);
  };
  AsyncExecutor.prototype.executeBatch_ = function() {
    for (; this.batch_ && this.batch_.length;) {
      var executingBatch = this.batch_;
      this.batch_ = [];
      for (var i = 0; i < executingBatch.length; ++i) {
        var f = executingBatch[i];
        executingBatch[i] = null;
        try {
          f();
        } catch (error) {
          this.asyncThrow_(error);
        }
      }
    }
    this.batch_ = null;
  };
  AsyncExecutor.prototype.asyncThrow_ = function(exception) {
    this.asyncExecuteFunction(function() {
      throw exception;
    });
  };
  var PromiseState = {PENDING:0, FULFILLED:1, REJECTED:2}, PolyfillPromise = function(executor) {
    this.state_ = PromiseState.PENDING;
    this.result_ = void 0;
    this.onSettledCallbacks_ = [];
    var resolveAndReject = this.createResolveAndReject_();
    try {
      executor(resolveAndReject.resolve, resolveAndReject.reject);
    } catch (e) {
      resolveAndReject.reject(e);
    }
  };
  PolyfillPromise.prototype.createResolveAndReject_ = function() {
    function firstCallWins(method) {
      return function(x) {
        alreadyCalled || (alreadyCalled = !0, method.call(thisPromise, x));
      };
    }
    var thisPromise = this, alreadyCalled = !1;
    return {resolve:firstCallWins(this.resolveTo_), reject:firstCallWins(this.reject_)};
  };
  PolyfillPromise.prototype.resolveTo_ = function(value) {
    value === this ? this.reject_(new TypeError("A Promise cannot resolve to itself")) : value instanceof PolyfillPromise ? this.settleSameAsPromise_(value) : isObject(value) ? this.resolveToNonPromiseObj_(value) : this.fulfill_(value);
  };
  PolyfillPromise.prototype.resolveToNonPromiseObj_ = function(obj) {
    var thenMethod = void 0;
    try {
      thenMethod = obj.then;
    } catch (error) {
      this.reject_(error);
      return;
    }
    "function" == typeof thenMethod ? this.settleSameAsThenable_(thenMethod, obj) : this.fulfill_(obj);
  };
  PolyfillPromise.prototype.reject_ = function(reason) {
    this.settle_(PromiseState.REJECTED, reason);
  };
  PolyfillPromise.prototype.fulfill_ = function(value) {
    this.settle_(PromiseState.FULFILLED, value);
  };
  PolyfillPromise.prototype.settle_ = function(settledState, valueOrReason) {
    if (this.state_ != PromiseState.PENDING) {
      throw Error("Cannot settle(" + settledState + ", " + valueOrReason + "): Promise already settled in state" + this.state_);
    }
    this.state_ = settledState;
    this.result_ = valueOrReason;
    this.executeOnSettledCallbacks_();
  };
  PolyfillPromise.prototype.executeOnSettledCallbacks_ = function() {
    if (null != this.onSettledCallbacks_) {
      for (var i = 0; i < this.onSettledCallbacks_.length; ++i) {
        asyncExecutor.asyncExecute(this.onSettledCallbacks_[i]);
      }
      this.onSettledCallbacks_ = null;
    }
  };
  var asyncExecutor = new AsyncExecutor;
  PolyfillPromise.prototype.settleSameAsPromise_ = function(promise) {
    var methods = this.createResolveAndReject_();
    promise.callWhenSettled_(methods.resolve, methods.reject);
  };
  PolyfillPromise.prototype.settleSameAsThenable_ = function(thenMethod, thenable) {
    var methods = this.createResolveAndReject_();
    try {
      thenMethod.call(thenable, methods.resolve, methods.reject);
    } catch (error) {
      methods.reject(error);
    }
  };
  PolyfillPromise.prototype.then = function(onFulfilled, onRejected) {
    function createCallback(paramF, defaultF) {
      return "function" == typeof paramF ? function(x) {
        try {
          resolveChild(paramF(x));
        } catch (error) {
          rejectChild(error);
        }
      } : defaultF;
    }
    var resolveChild, rejectChild, childPromise = new PolyfillPromise(function(resolve, reject) {
      resolveChild = resolve;
      rejectChild = reject;
    });
    this.callWhenSettled_(createCallback(onFulfilled, resolveChild), createCallback(onRejected, rejectChild));
    return childPromise;
  };
  PolyfillPromise.prototype["catch"] = function(onRejected) {
    return this.then(void 0, onRejected);
  };
  PolyfillPromise.prototype.callWhenSettled_ = function(onFulfilled, onRejected) {
    function callback() {
      switch(thisPromise.state_) {
        case PromiseState.FULFILLED:
          onFulfilled(thisPromise.result_);
          break;
        case PromiseState.REJECTED:
          onRejected(thisPromise.result_);
          break;
        default:
          throw Error("Unexpected state: " + thisPromise.state_);
      }
    }
    var thisPromise = this;
    null == this.onSettledCallbacks_ ? asyncExecutor.asyncExecute(callback) : this.onSettledCallbacks_.push(callback);
  };
  PolyfillPromise.resolve = resolvingPromise;
  PolyfillPromise.reject = function(opt_reason) {
    return new PolyfillPromise(function(resolve, reject) {
      reject(opt_reason);
    });
  };
  PolyfillPromise.race = function(thenablesOrValues) {
    return new PolyfillPromise(function(resolve, reject) {
      for (var iterator = $jscomp.makeIterator(thenablesOrValues), iterRec = iterator.next(); !iterRec.done; iterRec = iterator.next()) {
        resolvingPromise(iterRec.value).callWhenSettled_(resolve, reject);
      }
    });
  };
  PolyfillPromise.all = function(thenablesOrValues) {
    var iterator = $jscomp.makeIterator(thenablesOrValues), iterRec = iterator.next();
    return iterRec.done ? resolvingPromise([]) : new PolyfillPromise(function(resolveAll, rejectAll) {
      function onFulfilled(i) {
        return function(ithResult) {
          resultsArray[i] = ithResult;
          unresolvedCount--;
          0 == unresolvedCount && resolveAll(resultsArray);
        };
      }
      var resultsArray = [], unresolvedCount = 0;
      do {
        resultsArray.push(void 0), unresolvedCount++, resolvingPromise(iterRec.value).callWhenSettled_(onFulfilled(resultsArray.length - 1), rejectAll), iterRec = iterator.next();
      } while (!iterRec.done);
    });
  };
  return PolyfillPromise;
}, "es6", "es3");
$jscomp.assign = "function" == typeof Object.assign ? Object.assign : function(target, var_args) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];
    if (source) {
      for (var key in source) {
        $jscomp.owns(source, key) && (target[key] = source[key]);
      }
    }
  }
  return target;
};
$jscomp.polyfill("Object.assign", function(orig) {
  return orig || $jscomp.assign;
}, "es6", "es3");
$jscomp.stringPadding = function(padString, padLength) {
  var padding = void 0 !== padString ? String(padString) : " ";
  return 0 < padLength && padding ? padding.repeat(Math.ceil(padLength / padding.length)).substring(0, padLength) : "";
};
$jscomp.polyfill("String.prototype.padStart", function(orig) {
  return orig ? orig : function(targetLength, opt_padString) {
    var string = $jscomp.checkStringArgs(this, null, "padStart");
    return $jscomp.stringPadding(opt_padString, targetLength - string.length) + string;
  };
}, "es8", "es3");
$jscomp.checkEs6ConformanceViaProxy = function() {
  try {
    var proxied = {}, proxy = Object.create(new $jscomp.global.Proxy(proxied, {get:function(target, key, receiver) {
      return target == proxied && "q" == key && receiver == proxy;
    }}));
    return !0 === proxy.q;
  } catch (err) {
    return !1;
  }
};
$jscomp.USE_PROXY_FOR_ES6_CONFORMANCE_CHECKS = !1;
$jscomp.ES6_CONFORMANCE = $jscomp.USE_PROXY_FOR_ES6_CONFORMANCE_CHECKS && $jscomp.checkEs6ConformanceViaProxy();
$jscomp.polyfill("WeakMap", function(NativeWeakMap) {
  function isConformant() {
    if (!NativeWeakMap || !Object.seal) {
      return !1;
    }
    try {
      var x = Object.seal({}), y = Object.seal({}), map = new NativeWeakMap([[x, 2], [y, 3]]);
      if (2 != map.get(x) || 3 != map.get(y)) {
        return !1;
      }
      map["delete"](x);
      map.set(y, 4);
      return !map.has(x) && 4 == map.get(y);
    } catch (err) {
      return !1;
    }
  }
  function WeakMapMembership() {
  }
  function insert(target) {
    if (!$jscomp.owns(target, prop)) {
      var obj = new WeakMapMembership;
      $jscomp.defineProperty(target, prop, {value:obj});
    }
  }
  function patch(name) {
    var prev = Object[name];
    prev && (Object[name] = function(target) {
      if (target instanceof WeakMapMembership) {
        return target;
      }
      insert(target);
      return prev(target);
    });
  }
  if ($jscomp.USE_PROXY_FOR_ES6_CONFORMANCE_CHECKS) {
    if (NativeWeakMap && $jscomp.ES6_CONFORMANCE) {
      return NativeWeakMap;
    }
  } else {
    if (isConformant()) {
      return NativeWeakMap;
    }
  }
  var prop = "$jscomp_hidden_" + Math.random();
  patch("freeze");
  patch("preventExtensions");
  patch("seal");
  var index = 0, PolyfillWeakMap = function(opt_iterable) {
    this.id_ = (index += Math.random() + 1).toString();
    if (opt_iterable) {
      for (var iter = $jscomp.makeIterator(opt_iterable), entry; !(entry = iter.next()).done;) {
        var item = entry.value;
        this.set(item[0], item[1]);
      }
    }
  };
  PolyfillWeakMap.prototype.set = function(key, value) {
    insert(key);
    if (!$jscomp.owns(key, prop)) {
      throw Error("WeakMap key fail: " + key);
    }
    key[prop][this.id_] = value;
    return this;
  };
  PolyfillWeakMap.prototype.get = function(key) {
    return $jscomp.owns(key, prop) ? key[prop][this.id_] : void 0;
  };
  PolyfillWeakMap.prototype.has = function(key) {
    return $jscomp.owns(key, prop) && $jscomp.owns(key[prop], this.id_);
  };
  PolyfillWeakMap.prototype["delete"] = function(key) {
    return $jscomp.owns(key, prop) && $jscomp.owns(key[prop], this.id_) ? delete key[prop][this.id_] : !1;
  };
  return PolyfillWeakMap;
}, "es6", "es3");
$jscomp.MapEntry = function() {
};
$jscomp.polyfill("Map", function(NativeMap) {
  function isConformant() {
    if ($jscomp.ASSUME_NO_NATIVE_MAP || !NativeMap || "function" != typeof NativeMap || !NativeMap.prototype.entries || "function" != typeof Object.seal) {
      return !1;
    }
    try {
      var key = Object.seal({x:4}), map = new NativeMap($jscomp.makeIterator([[key, "s"]]));
      if ("s" != map.get(key) || 1 != map.size || map.get({x:4}) || map.set({x:4}, "t") != map || 2 != map.size) {
        return !1;
      }
      var iter = map.entries(), item = iter.next();
      if (item.done || item.value[0] != key || "s" != item.value[1]) {
        return !1;
      }
      item = iter.next();
      return item.done || 4 != item.value[0].x || "t" != item.value[1] || !iter.next().done ? !1 : !0;
    } catch (err) {
      return !1;
    }
  }
  if ($jscomp.USE_PROXY_FOR_ES6_CONFORMANCE_CHECKS) {
    if (NativeMap && $jscomp.ES6_CONFORMANCE) {
      return NativeMap;
    }
  } else {
    if (isConformant()) {
      return NativeMap;
    }
  }
  $jscomp.initSymbolIterator();
  var idMap = new WeakMap, PolyfillMap = function(opt_iterable) {
    this.data_ = {};
    this.head_ = createHead();
    this.size = 0;
    if (opt_iterable) {
      for (var iter = $jscomp.makeIterator(opt_iterable), entry; !(entry = iter.next()).done;) {
        var item = entry.value;
        this.set(item[0], item[1]);
      }
    }
  };
  PolyfillMap.prototype.set = function(key, value) {
    key = 0 === key ? 0 : key;
    var r = maybeGetEntry(this, key);
    r.list || (r.list = this.data_[r.id] = []);
    r.entry ? r.entry.value = value : (r.entry = {next:this.head_, previous:this.head_.previous, head:this.head_, key:key, value:value}, r.list.push(r.entry), this.head_.previous.next = r.entry, this.head_.previous = r.entry, this.size++);
    return this;
  };
  PolyfillMap.prototype["delete"] = function(key) {
    var r = maybeGetEntry(this, key);
    return r.entry && r.list ? (r.list.splice(r.index, 1), r.list.length || delete this.data_[r.id], r.entry.previous.next = r.entry.next, r.entry.next.previous = r.entry.previous, r.entry.head = null, this.size--, !0) : !1;
  };
  PolyfillMap.prototype.clear = function() {
    this.data_ = {};
    this.head_ = this.head_.previous = createHead();
    this.size = 0;
  };
  PolyfillMap.prototype.has = function(key) {
    return !!maybeGetEntry(this, key).entry;
  };
  PolyfillMap.prototype.get = function(key) {
    var entry = maybeGetEntry(this, key).entry;
    return entry && entry.value;
  };
  PolyfillMap.prototype.entries = function() {
    return makeIterator(this, function(entry) {
      return [entry.key, entry.value];
    });
  };
  PolyfillMap.prototype.keys = function() {
    return makeIterator(this, function(entry) {
      return entry.key;
    });
  };
  PolyfillMap.prototype.values = function() {
    return makeIterator(this, function(entry) {
      return entry.value;
    });
  };
  PolyfillMap.prototype.forEach = function(callback, opt_thisArg) {
    for (var iter = this.entries(), item; !(item = iter.next()).done;) {
      var entry = item.value;
      callback.call(opt_thisArg, entry[1], entry[0], this);
    }
  };
  PolyfillMap.prototype[Symbol.iterator] = PolyfillMap.prototype.entries;
  var maybeGetEntry = function(map, key) {
    var id = getId(key), list = map.data_[id];
    if (list && $jscomp.owns(map.data_, id)) {
      for (var index = 0; index < list.length; index++) {
        var entry = list[index];
        if (key !== key && entry.key !== entry.key || key === entry.key) {
          return {id:id, list:list, index:index, entry:entry};
        }
      }
    }
    return {id:id, list:list, index:-1, entry:void 0};
  }, makeIterator = function(map, func) {
    var entry = map.head_;
    return $jscomp.iteratorPrototype(function() {
      if (entry) {
        for (; entry.head != map.head_;) {
          entry = entry.previous;
        }
        for (; entry.next != entry.head;) {
          return entry = entry.next, {done:!1, value:func(entry)};
        }
        entry = null;
      }
      return {done:!0, value:void 0};
    });
  }, createHead = function() {
    var head = {};
    return head.previous = head.next = head.head = head;
  }, mapIndex = 0, getId = function(obj) {
    var type = obj && typeof obj;
    if ("object" == type || "function" == type) {
      if (!idMap.has(obj)) {
        var id = "" + ++mapIndex;
        idMap.set(obj, id);
        return id;
      }
      return idMap.get(obj);
    }
    return "p_" + obj;
  };
  return PolyfillMap;
}, "es6", "es3");
var goog = goog || {};
goog.global = this;
goog.isDef = function(val) {
  return void 0 !== val;
};
goog.isString = function(val) {
  return "string" == typeof val;
};
goog.isBoolean = function(val) {
  return "boolean" == typeof val;
};
goog.isNumber = function(val) {
  return "number" == typeof val;
};
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split("."), cur = opt_objectToExportTo || goog.global;
  parts[0] in cur || "undefined" == typeof cur.execScript || cur.execScript("var " + parts[0]);
  for (var part; parts.length && (part = parts.shift());) {
    !parts.length && goog.isDef(opt_object) ? cur[part] = opt_object : cur = cur[part] && cur[part] !== Object.prototype[part] ? cur[part] : cur[part] = {};
  }
};
goog.define = function(name, defaultValue) {
  var defines, uncompiledDefines;
  goog.exportPath_(name, defaultValue);
  return defaultValue;
};
goog.FEATURESET_YEAR = 2012;
goog.DEBUG = !0;
goog.LOCALE = "en";
goog.TRUSTED_SITE = !0;
goog.STRICT_MODE_COMPATIBLE = !1;
goog.DISALLOW_TEST_ONLY_CODE = !goog.DEBUG;
goog.ENABLE_CHROME_APP_SAFE_SCRIPT_LOADING = !1;
goog.provide = function(name) {
  if (goog.isInModuleLoader_()) {
    throw Error("goog.provide cannot be used within a module.");
  }
  goog.constructNamespace_(name);
};
goog.constructNamespace_ = function(name, opt_obj) {
  var namespace;
  goog.exportPath_(name, opt_obj);
};
goog.getScriptNonce = function(opt_window) {
  if (opt_window && opt_window != goog.global) {
    return goog.getScriptNonce_(opt_window.document);
  }
  null === goog.cspNonce_ && (goog.cspNonce_ = goog.getScriptNonce_(goog.global.document));
  return goog.cspNonce_;
};
goog.NONCE_PATTERN_ = /^[\w+/_-]+[=]{0,2}$/;
goog.cspNonce_ = null;
goog.getScriptNonce_ = function(doc) {
  var script = doc.querySelector && doc.querySelector("script[nonce]");
  if (script) {
    var nonce = script.nonce || script.getAttribute("nonce");
    if (nonce && goog.NONCE_PATTERN_.test(nonce)) {
      return nonce;
    }
  }
  return "";
};
goog.VALID_MODULE_RE_ = /^[a-zA-Z_$][a-zA-Z0-9._$]*$/;
goog.module = function(name) {
  if (!goog.isString(name) || !name || -1 == name.search(goog.VALID_MODULE_RE_)) {
    throw Error("Invalid module identifier");
  }
  if (!goog.isInGoogModuleLoader_()) {
    throw Error("Module " + name + " has been loaded incorrectly. Note, modules cannot be loaded as normal scripts. They require some kind of pre-processing step. You're likely trying to load a module via a script tag or as a part of a concatenated bundle without rewriting the module. For more info see: https://github.com/google/closure-library/wiki/goog.module:-an-ES6-module-like-alternative-to-goog.provide.");
  }
  if (goog.moduleLoaderState_.moduleName) {
    throw Error("goog.module may only be called once per module.");
  }
  goog.moduleLoaderState_.moduleName = name;
};
goog.module.get = function(name) {
  return goog.module.getInternal_(name);
};
goog.module.getInternal_ = function(name) {
  var ns;
  return null;
};
goog.ModuleType = {ES6:"es6", GOOG:"goog"};
goog.moduleLoaderState_ = null;
goog.isInModuleLoader_ = function() {
  return goog.isInGoogModuleLoader_() || goog.isInEs6ModuleLoader_();
};
goog.isInGoogModuleLoader_ = function() {
  return !!goog.moduleLoaderState_ && goog.moduleLoaderState_.type == goog.ModuleType.GOOG;
};
goog.isInEs6ModuleLoader_ = function() {
  if (goog.moduleLoaderState_ && goog.moduleLoaderState_.type == goog.ModuleType.ES6) {
    return !0;
  }
  var jscomp = goog.global.$jscomp;
  return jscomp ? "function" != typeof jscomp.getCurrentModulePath ? !1 : !!jscomp.getCurrentModulePath() : !1;
};
goog.module.declareLegacyNamespace = function() {
  goog.moduleLoaderState_.declareLegacyNamespace = !0;
};
goog.declareModuleId = function(namespace) {
  if (goog.moduleLoaderState_) {
    goog.moduleLoaderState_.moduleName = namespace;
  } else {
    var jscomp = goog.global.$jscomp;
    if (!jscomp || "function" != typeof jscomp.getCurrentModulePath) {
      throw Error('Module with namespace "' + namespace + '" has been loaded incorrectly.');
    }
    var exports = jscomp.require(jscomp.getCurrentModulePath());
    goog.loadedModules_[namespace] = {exports:exports, type:goog.ModuleType.ES6, moduleId:namespace};
  }
};
goog.setTestOnly = function(opt_message) {
  if (goog.DISALLOW_TEST_ONLY_CODE) {
    throw opt_message = opt_message || "", Error("Importing test-only code into non-debug environment" + (opt_message ? ": " + opt_message : "."));
  }
};
goog.forwardDeclare = function(name) {
};
goog.getObjectByName = function(name, opt_obj) {
  for (var parts = name.split("."), cur = opt_obj || goog.global, i = 0; i < parts.length; i++) {
    if (cur = cur[parts[i]], !goog.isDefAndNotNull(cur)) {
      return null;
    }
  }
  return cur;
};
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global, x;
  for (x in obj) {
    global[x] = obj[x];
  }
};
goog.addDependency = function(relPath, provides, requires, opt_loadFlags) {
};
goog.useStrictRequires = !1;
goog.ENABLE_DEBUG_LOADER = !0;
goog.logToConsole_ = function(msg) {
  goog.global.console && goog.global.console.error(msg);
};
goog.require = function(namespace) {
  var moduleLoaderState;
};
goog.requireType = function(namespace) {
  return {};
};
goog.basePath = "";
goog.nullFunction = function() {
};
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(ctor) {
  ctor.instance_ = void 0;
  ctor.getInstance = function() {
    if (ctor.instance_) {
      return ctor.instance_;
    }
    goog.DEBUG && (goog.instantiatedSingletons_[goog.instantiatedSingletons_.length] = ctor);
    return ctor.instance_ = new ctor;
  };
};
goog.instantiatedSingletons_ = [];
goog.LOAD_MODULE_USING_EVAL = !0;
goog.SEAL_MODULE_EXPORTS = goog.DEBUG;
goog.loadedModules_ = {};
goog.DEPENDENCIES_ENABLED = !1;
goog.TRANSPILE = "detect";
goog.ASSUME_ES_MODULES_TRANSPILED = !1;
goog.TRANSPILE_TO_LANGUAGE = "";
goog.TRANSPILER = "transpile.js";
goog.hasBadLetScoping = null;
goog.useSafari10Workaround = function() {
  if (null == goog.hasBadLetScoping) {
    try {
      var hasBadLetScoping = !eval('"use strict";let x = 1; function f() { return typeof x; };f() == "number";');
    } catch (e) {
      hasBadLetScoping = !1;
    }
    goog.hasBadLetScoping = hasBadLetScoping;
  }
  return goog.hasBadLetScoping;
};
goog.workaroundSafari10EvalBug = function(moduleDef) {
  return "(function(){" + moduleDef + "\n;})();\n";
};
goog.loadModule = function(moduleDef) {
  var previousState = goog.moduleLoaderState_;
  try {
    goog.moduleLoaderState_ = {moduleName:"", declareLegacyNamespace:!1, type:goog.ModuleType.GOOG};
    if (goog.isFunction(moduleDef)) {
      var exports = moduleDef.call(void 0, {});
    } else {
      if (goog.isString(moduleDef)) {
        goog.useSafari10Workaround() && (moduleDef = goog.workaroundSafari10EvalBug(moduleDef)), exports = goog.loadModuleFromSource_.call(void 0, moduleDef);
      } else {
        throw Error("Invalid module definition");
      }
    }
    var moduleName = goog.moduleLoaderState_.moduleName;
    if (goog.isString(moduleName) && moduleName) {
      goog.moduleLoaderState_.declareLegacyNamespace ? goog.constructNamespace_(moduleName, exports) : goog.SEAL_MODULE_EXPORTS && Object.seal && "object" == typeof exports && null != exports && Object.seal(exports), goog.loadedModules_[moduleName] = {exports:exports, type:goog.ModuleType.GOOG, moduleId:goog.moduleLoaderState_.moduleName};
    } else {
      throw Error('Invalid module name "' + moduleName + '"');
    }
  } finally {
    goog.moduleLoaderState_ = previousState;
  }
};
goog.loadModuleFromSource_ = function(JSCompiler_OptimizeArgumentsArray_p0) {
  eval(JSCompiler_OptimizeArgumentsArray_p0);
  return {};
};
goog.normalizePath_ = function(path) {
  for (var components = path.split("/"), i = 0; i < components.length;) {
    "." == components[i] ? components.splice(i, 1) : i && ".." == components[i] && components[i - 1] && ".." != components[i - 1] ? components.splice(--i, 2) : i++;
  }
  return components.join("/");
};
goog.loadFileSync_ = function(src) {
  if (goog.global.CLOSURE_LOAD_FILE_SYNC) {
    return goog.global.CLOSURE_LOAD_FILE_SYNC(src);
  }
  try {
    var xhr = new goog.global.XMLHttpRequest;
    xhr.open("get", src, !1);
    xhr.send();
    return 0 == xhr.status || 200 == xhr.status ? xhr.responseText : null;
  } catch (err) {
    return null;
  }
};
goog.transpile_ = function(code$jscomp$0, path$jscomp$0, target) {
  var jscomp = goog.global.$jscomp;
  jscomp || (goog.global.$jscomp = jscomp = {});
  var transpile = jscomp.transpile;
  if (!transpile) {
    var transpilerPath = goog.basePath + goog.TRANSPILER, transpilerCode = goog.loadFileSync_(transpilerPath);
    if (transpilerCode) {
      (function() {
        eval(transpilerCode + "\n//# sourceURL=" + transpilerPath);
      }).call(goog.global);
      if (goog.global.$gwtExport && goog.global.$gwtExport.$jscomp && !goog.global.$gwtExport.$jscomp.transpile) {
        throw Error('The transpiler did not properly export the "transpile" method. $gwtExport: ' + JSON.stringify(goog.global.$gwtExport));
      }
      goog.global.$jscomp.transpile = goog.global.$gwtExport.$jscomp.transpile;
      jscomp = goog.global.$jscomp;
      transpile = jscomp.transpile;
    }
  }
  if (!transpile) {
    var suffix = " requires transpilation but no transpiler was found.";
    suffix += ' Please add "//javascript/closure:transpiler" as a data dependency to ensure it is included.';
    transpile = jscomp.transpile = function(code, path) {
      goog.logToConsole_(path + suffix);
      return code;
    };
  }
  return transpile(code$jscomp$0, path$jscomp$0, target);
};
goog.typeOf = function(value) {
  var s = typeof value;
  if ("object" == s) {
    if (value) {
      if (value instanceof Array) {
        return "array";
      }
      if (value instanceof Object) {
        return s;
      }
      var className = Object.prototype.toString.call(value);
      if ("[object Window]" == className) {
        return "object";
      }
      if ("[object Array]" == className || "number" == typeof value.length && "undefined" != typeof value.splice && "undefined" != typeof value.propertyIsEnumerable && !value.propertyIsEnumerable("splice")) {
        return "array";
      }
      if ("[object Function]" == className || "undefined" != typeof value.call && "undefined" != typeof value.propertyIsEnumerable && !value.propertyIsEnumerable("call")) {
        return "function";
      }
    } else {
      return "null";
    }
  } else {
    if ("function" == s && "undefined" == typeof value.call) {
      return "object";
    }
  }
  return s;
};
goog.isNull = function(val) {
  return null === val;
};
goog.isDefAndNotNull = function(val) {
  return null != val;
};
goog.isArray = function(val) {
  return "array" == goog.typeOf(val);
};
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return "array" == type || "object" == type && "number" == typeof val.length;
};
goog.isDateLike = function(val) {
  return goog.isObject(val) && "function" == typeof val.getFullYear;
};
goog.isFunction = function(val) {
  return "function" == goog.typeOf(val);
};
goog.isObject = function(val) {
  var type = typeof val;
  return "object" == type && null != val || "function" == type;
};
goog.getUid = function(obj) {
  return obj[goog.UID_PROPERTY_] || (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_);
};
goog.hasUid = function(obj) {
  return !!obj[goog.UID_PROPERTY_];
};
goog.removeUid = function(obj) {
  null !== obj && "removeAttribute" in obj && obj.removeAttribute(goog.UID_PROPERTY_);
  try {
    delete obj[goog.UID_PROPERTY_];
  } catch (ex) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + (1e9 * Math.random() >>> 0);
goog.uidCounter_ = 0;
goog.getHashCode = goog.getUid;
goog.removeHashCode = goog.removeUid;
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if ("object" == type || "array" == type) {
    if ("function" === typeof obj.clone) {
      return obj.clone();
    }
    var clone = "array" == type ? [] : {}, key;
    for (key in obj) {
      clone[key] = goog.cloneObject(obj[key]);
    }
    return clone;
  }
  return obj;
};
goog.bindNative_ = function(fn, selfObj, var_args) {
  return fn.call.apply(fn.bind, arguments);
};
goog.bindJs_ = function(fn, selfObj, var_args) {
  if (!fn) {
    throw Error();
  }
  if (2 < arguments.length) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(selfObj, newArgs);
    };
  }
  return function() {
    return fn.apply(selfObj, arguments);
  };
};
goog.bind = function(fn, selfObj, var_args) {
  Function.prototype.bind && -1 != Function.prototype.bind.toString().indexOf("native code") ? goog.bind = goog.bindNative_ : goog.bind = goog.bindJs_;
  return goog.bind.apply(null, arguments);
};
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = args.slice();
    newArgs.push.apply(newArgs, arguments);
    return fn.apply(this, newArgs);
  };
};
goog.mixin = function(target, source) {
  for (var x in source) {
    target[x] = source[x];
  }
};
goog.now = goog.TRUSTED_SITE && Date.now || function() {
  return +new Date;
};
goog.globalEval = function(script) {
  if (goog.global.execScript) {
    goog.global.execScript(script, "JavaScript");
  } else {
    if (goog.global.eval) {
      if (null == goog.evalWorksForGlobals_) {
        try {
          goog.global.eval("var _evalTest_ = 1;");
        } catch (ignore) {
        }
        if ("undefined" != typeof goog.global._evalTest_) {
          try {
            delete goog.global._evalTest_;
          } catch (ignore$12) {
          }
          goog.evalWorksForGlobals_ = !0;
        } else {
          goog.evalWorksForGlobals_ = !1;
        }
      }
      if (goog.evalWorksForGlobals_) {
        goog.global.eval(script);
      } else {
        var doc = goog.global.document, scriptElt = doc.createElement("SCRIPT");
        scriptElt.type = "text/javascript";
        scriptElt.defer = !1;
        scriptElt.appendChild(doc.createTextNode(script));
        doc.head.appendChild(scriptElt);
        doc.head.removeChild(scriptElt);
      }
    } else {
      throw Error("goog.globalEval not available");
    }
  }
};
goog.evalWorksForGlobals_ = null;
goog.getCssName = function(className, opt_modifier) {
  if ("." == String(className).charAt(0)) {
    throw Error('className passed in goog.getCssName must not start with ".". You passed: ' + className);
  }
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName;
  }, renameByParts = function(cssName) {
    for (var parts = cssName.split("-"), mapped = [], i = 0; i < parts.length; i++) {
      mapped.push(getMapping(parts[i]));
    }
    return mapped.join("-");
  };
  var rename = goog.cssNameMapping_ ? "BY_WHOLE" == goog.cssNameMappingStyle_ ? getMapping : renameByParts : function(a) {
    return a;
  };
  var result = opt_modifier ? className + "-" + rename(opt_modifier) : rename(className);
  return goog.global.CLOSURE_CSS_NAME_MAP_FN ? goog.global.CLOSURE_CSS_NAME_MAP_FN(result) : result;
};
goog.setCssNameMapping = function(mapping, opt_style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = opt_style;
};
goog.getMsg = function(str, opt_values) {
  opt_values && (str = str.replace(/\{\$([^}]+)}/g, function(match, key) {
    return null != opt_values && key in opt_values ? opt_values[key] : match;
  }));
  return str;
};
goog.getMsgWithFallback = function(a, b) {
  return a;
};
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo);
};
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol;
};
goog.inherits = function(childCtor, parentCtor) {
  function tempCtor() {
  }
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor;
  childCtor.prototype.constructor = childCtor;
  childCtor.base = function(me, methodName, var_args) {
    for (var args = Array(arguments.length - 2), i = 2; i < arguments.length; i++) {
      args[i - 2] = arguments[i];
    }
    return parentCtor.prototype[methodName].apply(me, args);
  };
};
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if (goog.STRICT_MODE_COMPATIBLE || goog.DEBUG && !caller) {
    throw Error("arguments.caller not defined.  goog.base() cannot be used with strict mode code. See http://www.ecma-international.org/ecma-262/5.1/#sec-C");
  }
  if ("undefined" !== typeof caller.superClass_) {
    for (var ctorArgs = Array(arguments.length - 1), i = 1; i < arguments.length; i++) {
      ctorArgs[i - 1] = arguments[i];
    }
    return caller.superClass_.constructor.apply(me, ctorArgs);
  }
  if ("string" != typeof opt_methodName && "symbol" != typeof opt_methodName) {
    throw Error("method names provided to goog.base must be a string or a symbol");
  }
  var args = Array(arguments.length - 2);
  for (i = 2; i < arguments.length; i++) {
    args[i - 2] = arguments[i];
  }
  for (var foundCaller = !1, ctor = me.constructor; ctor; ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if (ctor.prototype[opt_methodName] === caller) {
      foundCaller = !0;
    } else {
      if (foundCaller) {
        return ctor.prototype[opt_methodName].apply(me, args);
      }
    }
  }
  if (me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args);
  }
  throw Error("goog.base called from a method of one name to a method of a different name");
};
goog.scope = function(fn) {
  if (goog.isInModuleLoader_()) {
    throw Error("goog.scope is not supported within a module.");
  }
  fn.call(goog.global);
};
goog.defineClass = function(superClass, def) {
  var constructor = def.constructor, statics = def.statics;
  constructor && constructor != Object.prototype.constructor || (constructor = function() {
    throw Error("cannot instantiate an interface (no constructor defined).");
  });
  var cls = goog.defineClass.createSealingConstructor_(constructor, superClass);
  superClass && goog.inherits(cls, superClass);
  delete def.constructor;
  delete def.statics;
  goog.defineClass.applyProperties_(cls.prototype, def);
  null != statics && (statics instanceof Function ? statics(cls) : goog.defineClass.applyProperties_(cls, statics));
  return cls;
};
goog.defineClass.SEAL_CLASS_INSTANCES = goog.DEBUG;
goog.defineClass.createSealingConstructor_ = function(ctr, superClass) {
  if (!goog.defineClass.SEAL_CLASS_INSTANCES) {
    return ctr;
  }
  var superclassSealable = !goog.defineClass.isUnsealable_(superClass), wrappedCtr = function() {
    var instance = ctr.apply(this, arguments) || this;
    instance[goog.UID_PROPERTY_] = instance[goog.UID_PROPERTY_];
    this.constructor === wrappedCtr && superclassSealable && Object.seal instanceof Function && Object.seal(instance);
    return instance;
  };
  return wrappedCtr;
};
goog.defineClass.isUnsealable_ = function(ctr) {
  return ctr && ctr.prototype && ctr.prototype[goog.UNSEALABLE_CONSTRUCTOR_PROPERTY_];
};
goog.defineClass.OBJECT_PROTOTYPE_FIELDS_ = "constructor hasOwnProperty isPrototypeOf propertyIsEnumerable toLocaleString toString valueOf".split(" ");
goog.defineClass.applyProperties_ = function(target, source) {
  for (var key in source) {
    Object.prototype.hasOwnProperty.call(source, key) && (target[key] = source[key]);
  }
  for (var i = 0; i < goog.defineClass.OBJECT_PROTOTYPE_FIELDS_.length; i++) {
    key = goog.defineClass.OBJECT_PROTOTYPE_FIELDS_[i], Object.prototype.hasOwnProperty.call(source, key) && (target[key] = source[key]);
  }
};
goog.tagUnsealableClass = function(ctr) {
};
goog.UNSEALABLE_CONSTRUCTOR_PROPERTY_ = "goog_defineClass_legacy_unsealable";
goog.TRUSTED_TYPES_POLICY_NAME = "";
goog.identity_ = function(s) {
  return s;
};
goog.createTrustedTypesPolicy = function(name) {
  return "undefined" !== typeof TrustedTypes && TrustedTypes.createPolicy ? TrustedTypes.createPolicy(name, {createHTML:goog.identity_, createScript:goog.identity_, createScriptURL:goog.identity_, createURL:goog.identity_}) : null;
};
goog.TRUSTED_TYPES_POLICY_ = goog.TRUSTED_TYPES_POLICY_NAME ? goog.createTrustedTypesPolicy(goog.TRUSTED_TYPES_POLICY_NAME + "#base") : null;
goog.disposable = {};
goog.disposable.IDisposable = function() {
};
goog.Disposable = function() {
  goog.Disposable.MONITORING_MODE != goog.Disposable.MonitoringMode.OFF && (goog.Disposable.INCLUDE_STACK_ON_CREATION && (this.creationStack = Error().stack), goog.Disposable.instances_[goog.getUid(this)] = this);
  this.disposed_ = this.disposed_;
  this.onDisposeCallbacks_ = this.onDisposeCallbacks_;
};
goog.Disposable.MonitoringMode = {OFF:0, PERMANENT:1, INTERACTIVE:2};
goog.Disposable.MONITORING_MODE = 0;
goog.Disposable.INCLUDE_STACK_ON_CREATION = !0;
goog.Disposable.instances_ = {};
goog.Disposable.getUndisposedObjects = function() {
  var ret = [], id;
  for (id in goog.Disposable.instances_) {
    goog.Disposable.instances_.hasOwnProperty(id) && ret.push(goog.Disposable.instances_[Number(id)]);
  }
  return ret;
};
goog.Disposable.clearUndisposedObjects = function() {
  goog.Disposable.instances_ = {};
};
goog.Disposable.prototype.disposed_ = !1;
goog.Disposable.prototype.isDisposed = function() {
  return this.disposed_;
};
goog.Disposable.prototype.getDisposed = goog.Disposable.prototype.isDisposed;
goog.Disposable.prototype.dispose = function() {
  if (!this.disposed_ && (this.disposed_ = !0, this.disposeInternal(), goog.Disposable.MONITORING_MODE != goog.Disposable.MonitoringMode.OFF)) {
    var uid = goog.getUid(this);
    if (goog.Disposable.MONITORING_MODE == goog.Disposable.MonitoringMode.PERMANENT && !goog.Disposable.instances_.hasOwnProperty(uid)) {
      throw Error(this + " did not call the goog.Disposable base constructor or was disposed of after a clearUndisposedObjects call");
    }
    if (goog.Disposable.MONITORING_MODE != goog.Disposable.MonitoringMode.OFF && this.onDisposeCallbacks_ && 0 < this.onDisposeCallbacks_.length) {
      throw Error(this + " did not empty its onDisposeCallbacks queue. This probably means it overrode dispose() or disposeInternal() without calling the superclass' method.");
    }
    delete goog.Disposable.instances_[uid];
  }
};
goog.Disposable.prototype.registerDisposable = function(disposable) {
  this.addOnDisposeCallback(goog.partial(goog.dispose, disposable));
};
goog.Disposable.prototype.addOnDisposeCallback = function(callback, opt_scope) {
  this.disposed_ ? goog.isDef(opt_scope) ? callback.call(opt_scope) : callback() : (this.onDisposeCallbacks_ || (this.onDisposeCallbacks_ = []), this.onDisposeCallbacks_.push(goog.isDef(opt_scope) ? goog.bind(callback, opt_scope) : callback));
};
goog.Disposable.prototype.disposeInternal = function() {
  if (this.onDisposeCallbacks_) {
    for (; this.onDisposeCallbacks_.length;) {
      this.onDisposeCallbacks_.shift()();
    }
  }
};
goog.Disposable.isDisposed = function(obj) {
  return obj && "function" == typeof obj.isDisposed ? obj.isDisposed() : !1;
};
goog.dispose = function(obj) {
  obj && "function" == typeof obj.dispose && obj.dispose();
};
goog.disposeAll = function(var_args) {
  for (var i = 0, len = arguments.length; i < len; ++i) {
    var disposable = arguments[i];
    goog.isArrayLike(disposable) ? goog.disposeAll.apply(null, disposable) : goog.dispose(disposable);
  }
};
goog.events = {};
goog.events.EventId = function(eventId) {
  this.id = eventId;
};
goog.events.EventId.prototype.toString = function() {
  return this.id;
};
goog.events.Event = function(type, opt_target) {
  this.type = type instanceof goog.events.EventId ? String(type) : type;
  this.currentTarget = this.target = opt_target;
  this.defaultPrevented = this.propagationStopped_ = !1;
  this.returnValue_ = !0;
};
goog.events.Event.prototype.stopPropagation = function() {
  this.propagationStopped_ = !0;
};
goog.events.Event.prototype.preventDefault = function() {
  this.defaultPrevented = !0;
  this.returnValue_ = !1;
};
goog.events.Event.stopPropagation = function(e) {
  e.stopPropagation();
};
goog.events.Event.preventDefault = function(e) {
  e.preventDefault();
};
goog.debug = {};
goog.debug.Error = function(opt_msg) {
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, goog.debug.Error);
  } else {
    var stack = Error().stack;
    stack && (this.stack = stack);
  }
  opt_msg && (this.message = String(opt_msg));
  this.reportErrorToServer = !0;
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
goog.dom = {};
goog.dom.NodeType = {ELEMENT:1, ATTRIBUTE:2, TEXT:3, CDATA_SECTION:4, ENTITY_REFERENCE:5, ENTITY:6, PROCESSING_INSTRUCTION:7, COMMENT:8, DOCUMENT:9, DOCUMENT_TYPE:10, DOCUMENT_FRAGMENT:11, NOTATION:12};
goog.asserts = {};
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  goog.debug.Error.call(this, goog.asserts.subs_(messagePattern, messageArgs));
  this.messagePattern = messagePattern;
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);
goog.asserts.AssertionError.prototype.name = "AssertionError";
goog.asserts.DEFAULT_ERROR_HANDLER = function(e) {
  throw e;
};
goog.asserts.errorHandler_ = goog.asserts.DEFAULT_ERROR_HANDLER;
goog.asserts.subs_ = function(pattern, subs) {
  for (var splitParts = pattern.split("%s"), returnString = "", subLast = splitParts.length - 1, i = 0; i < subLast; i++) {
    returnString += splitParts[i] + (i < subs.length ? subs[i] : "%s");
  }
  return returnString + splitParts[subLast];
};
goog.asserts.doAssertFailure_ = function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = "Assertion failed";
  if (givenMessage) {
    message += ": " + givenMessage;
    var args = givenArgs;
  } else {
    defaultMessage && (message += ": " + defaultMessage, args = defaultArgs);
  }
  var e = new goog.asserts.AssertionError("" + message, args || []);
  goog.asserts.errorHandler_(e);
};
goog.asserts.setErrorHandler = function(errorHandler) {
  goog.asserts.ENABLE_ASSERTS && (goog.asserts.errorHandler_ = errorHandler);
};
goog.asserts.assert = function(condition, opt_message, var_args) {
  goog.asserts.ENABLE_ASSERTS && !condition && goog.asserts.doAssertFailure_("", null, opt_message, Array.prototype.slice.call(arguments, 2));
  return condition;
};
goog.asserts.fail = function(opt_message, var_args) {
  goog.asserts.ENABLE_ASSERTS && goog.asserts.errorHandler_(new goog.asserts.AssertionError("Failure" + (opt_message ? ": " + opt_message : ""), Array.prototype.slice.call(arguments, 1)));
};
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value) && goog.asserts.doAssertFailure_("Expected number but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2));
  return value;
};
goog.asserts.assertString = function(value, opt_message, var_args) {
  goog.asserts.ENABLE_ASSERTS && !goog.isString(value) && goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2));
  return value;
};
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value) && goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2));
  return value;
};
goog.asserts.assertObject = function(value, opt_message, var_args) {
  goog.asserts.ENABLE_ASSERTS && !goog.isObject(value) && goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2));
  return value;
};
goog.asserts.assertArray = function(value, opt_message, var_args) {
  goog.asserts.ENABLE_ASSERTS && !goog.isArray(value) && goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2));
  return value;
};
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value) && goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2));
  return value;
};
goog.asserts.assertElement = function(value, opt_message, var_args) {
  !goog.asserts.ENABLE_ASSERTS || goog.isObject(value) && value.nodeType == goog.dom.NodeType.ELEMENT || goog.asserts.doAssertFailure_("Expected Element but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2));
  return value;
};
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  !goog.asserts.ENABLE_ASSERTS || value instanceof type || goog.asserts.doAssertFailure_("Expected instanceof %s but got %s.", [goog.asserts.getType_(type), goog.asserts.getType_(value)], opt_message, Array.prototype.slice.call(arguments, 3));
  return value;
};
goog.asserts.assertFinite = function(value, opt_message, var_args) {
  !goog.asserts.ENABLE_ASSERTS || "number" == typeof value && isFinite(value) || goog.asserts.doAssertFailure_("Expected %s to be a finite number but it is not.", [value], opt_message, Array.prototype.slice.call(arguments, 2));
  return value;
};
goog.asserts.assertObjectPrototypeIsIntact = function() {
  for (var key in Object.prototype) {
    goog.asserts.fail(key + " should not be enumerable in Object.prototype.");
  }
};
goog.asserts.getType_ = function(value) {
  return value instanceof Function ? value.displayName || value.name || "unknown type name" : value instanceof Object ? value.constructor.displayName || value.constructor.name || Object.prototype.toString.call(value) : null === value ? "null" : typeof value;
};
goog.debug.entryPointRegistry = {};
goog.debug.EntryPointMonitor = function() {
};
goog.debug.entryPointRegistry.refList_ = [];
goog.debug.entryPointRegistry.monitors_ = [];
goog.debug.entryPointRegistry.monitorsMayExist_ = !1;
goog.debug.entryPointRegistry.register = function(callback) {
  goog.debug.entryPointRegistry.refList_[goog.debug.entryPointRegistry.refList_.length] = callback;
  if (goog.debug.entryPointRegistry.monitorsMayExist_) {
    for (var monitors = goog.debug.entryPointRegistry.monitors_, i = 0; i < monitors.length; i++) {
      callback(goog.bind(monitors[i].wrap, monitors[i]));
    }
  }
};
goog.debug.entryPointRegistry.monitorAll = function(monitor) {
  goog.debug.entryPointRegistry.monitorsMayExist_ = !0;
  for (var transformer = goog.bind(monitor.wrap, monitor), i = 0; i < goog.debug.entryPointRegistry.refList_.length; i++) {
    goog.debug.entryPointRegistry.refList_[i](transformer);
  }
  goog.debug.entryPointRegistry.monitors_.push(monitor);
};
goog.debug.entryPointRegistry.unmonitorAllIfPossible = function(monitor) {
  var monitors = goog.debug.entryPointRegistry.monitors_;
  goog.asserts.assert(monitor == monitors[monitors.length - 1], "Only the most recent monitor can be unwrapped.");
  for (var transformer = goog.bind(monitor.unwrap, monitor), i = 0; i < goog.debug.entryPointRegistry.refList_.length; i++) {
    goog.debug.entryPointRegistry.refList_[i](transformer);
  }
  monitors.length--;
};
goog.array = {};
goog.NATIVE_ARRAY_PROTOTYPES = goog.TRUSTED_SITE;
goog.array.ASSUME_NATIVE_FUNCTIONS = !1;
goog.array.peek = function(array) {
  return array[array.length - 1];
};
goog.array.last = goog.array.peek;
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES && (goog.array.ASSUME_NATIVE_FUNCTIONS || Array.prototype.indexOf) ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(null != arr.length);
  return Array.prototype.indexOf.call(arr, obj, opt_fromIndex);
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = null == opt_fromIndex ? 0 : 0 > opt_fromIndex ? Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex;
  if (goog.isString(arr)) {
    return goog.isString(obj) && 1 == obj.length ? arr.indexOf(obj, fromIndex) : -1;
  }
  for (var i = fromIndex; i < arr.length; i++) {
    if (i in arr && arr[i] === obj) {
      return i;
    }
  }
  return -1;
};
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES && (goog.array.ASSUME_NATIVE_FUNCTIONS || Array.prototype.lastIndexOf) ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(null != arr.length);
  return Array.prototype.lastIndexOf.call(arr, obj, null == opt_fromIndex ? arr.length - 1 : opt_fromIndex);
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = null == opt_fromIndex ? arr.length - 1 : opt_fromIndex;
  0 > fromIndex && (fromIndex = Math.max(0, arr.length + fromIndex));
  if (goog.isString(arr)) {
    return goog.isString(obj) && 1 == obj.length ? arr.lastIndexOf(obj, fromIndex) : -1;
  }
  for (var i = fromIndex; 0 <= i; i--) {
    if (i in arr && arr[i] === obj) {
      return i;
    }
  }
  return -1;
};
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES && (goog.array.ASSUME_NATIVE_FUNCTIONS || Array.prototype.forEach) ? function(arr, f, opt_obj) {
  goog.asserts.assert(null != arr.length);
  Array.prototype.forEach.call(arr, f, opt_obj);
} : function(arr, f, opt_obj) {
  for (var l = arr.length, arr2 = goog.isString(arr) ? arr.split("") : arr, i = 0; i < l; i++) {
    i in arr2 && f.call(opt_obj, arr2[i], i, arr);
  }
};
goog.array.forEachRight = function(arr, f, opt_obj) {
  for (var l = arr.length, arr2 = goog.isString(arr) ? arr.split("") : arr, i = l - 1; 0 <= i; --i) {
    i in arr2 && f.call(opt_obj, arr2[i], i, arr);
  }
};
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES && (goog.array.ASSUME_NATIVE_FUNCTIONS || Array.prototype.filter) ? function(arr, f, opt_obj) {
  goog.asserts.assert(null != arr.length);
  return Array.prototype.filter.call(arr, f, opt_obj);
} : function(arr, f, opt_obj) {
  for (var l = arr.length, res = [], resLength = 0, arr2 = goog.isString(arr) ? arr.split("") : arr, i = 0; i < l; i++) {
    if (i in arr2) {
      var val = arr2[i];
      f.call(opt_obj, val, i, arr) && (res[resLength++] = val);
    }
  }
  return res;
};
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES && (goog.array.ASSUME_NATIVE_FUNCTIONS || Array.prototype.map) ? function(arr, f, opt_obj) {
  goog.asserts.assert(null != arr.length);
  return Array.prototype.map.call(arr, f, opt_obj);
} : function(arr, f, opt_obj) {
  for (var l = arr.length, res = Array(l), arr2 = goog.isString(arr) ? arr.split("") : arr, i = 0; i < l; i++) {
    i in arr2 && (res[i] = f.call(opt_obj, arr2[i], i, arr));
  }
  return res;
};
goog.array.reduce = goog.NATIVE_ARRAY_PROTOTYPES && (goog.array.ASSUME_NATIVE_FUNCTIONS || Array.prototype.reduce) ? function(arr, f, val, opt_obj) {
  goog.asserts.assert(null != arr.length);
  opt_obj && (f = goog.bind(f, opt_obj));
  return Array.prototype.reduce.call(arr, f, val);
} : function(arr, f, val$jscomp$0, opt_obj) {
  var rval = val$jscomp$0;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr);
  });
  return rval;
};
goog.array.reduceRight = goog.NATIVE_ARRAY_PROTOTYPES && (goog.array.ASSUME_NATIVE_FUNCTIONS || Array.prototype.reduceRight) ? function(arr, f, val, opt_obj) {
  goog.asserts.assert(null != arr.length);
  goog.asserts.assert(null != f);
  opt_obj && (f = goog.bind(f, opt_obj));
  return Array.prototype.reduceRight.call(arr, f, val);
} : function(arr, f, val$jscomp$0, opt_obj) {
  var rval = val$jscomp$0;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr);
  });
  return rval;
};
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES && (goog.array.ASSUME_NATIVE_FUNCTIONS || Array.prototype.some) ? function(arr, f, opt_obj) {
  goog.asserts.assert(null != arr.length);
  return Array.prototype.some.call(arr, f, opt_obj);
} : function(arr, f, opt_obj) {
  for (var l = arr.length, arr2 = goog.isString(arr) ? arr.split("") : arr, i = 0; i < l; i++) {
    if (i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return !0;
    }
  }
  return !1;
};
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES && (goog.array.ASSUME_NATIVE_FUNCTIONS || Array.prototype.every) ? function(arr, f, opt_obj) {
  goog.asserts.assert(null != arr.length);
  return Array.prototype.every.call(arr, f, opt_obj);
} : function(arr, f, opt_obj) {
  for (var l = arr.length, arr2 = goog.isString(arr) ? arr.split("") : arr, i = 0; i < l; i++) {
    if (i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
      return !1;
    }
  }
  return !0;
};
goog.array.count = function(arr$jscomp$0, f, opt_obj) {
  var count = 0;
  goog.array.forEach(arr$jscomp$0, function(element, index, arr) {
    f.call(opt_obj, element, index, arr) && ++count;
  }, opt_obj);
  return count;
};
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return 0 > i ? null : goog.isString(arr) ? arr.charAt(i) : arr[i];
};
goog.array.findIndex = function(arr, f, opt_obj) {
  for (var l = arr.length, arr2 = goog.isString(arr) ? arr.split("") : arr, i = 0; i < l; i++) {
    if (i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i;
    }
  }
  return -1;
};
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return 0 > i ? null : goog.isString(arr) ? arr.charAt(i) : arr[i];
};
goog.array.findIndexRight = function(arr, f, opt_obj) {
  for (var l = arr.length, arr2 = goog.isString(arr) ? arr.split("") : arr, i = l - 1; 0 <= i; i--) {
    if (i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i;
    }
  }
  return -1;
};
goog.array.contains = function(arr, obj) {
  return 0 <= goog.array.indexOf(arr, obj);
};
goog.array.isEmpty = function(arr) {
  return 0 == arr.length;
};
goog.array.clear = function(arr) {
  if (!goog.isArray(arr)) {
    for (var i = arr.length - 1; 0 <= i; i--) {
      delete arr[i];
    }
  }
  arr.length = 0;
};
goog.array.insert = function(arr, obj) {
  goog.array.contains(arr, obj) || arr.push(obj);
};
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj);
};
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd);
};
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  2 == arguments.length || 0 > (i = goog.array.indexOf(arr, opt_obj2)) ? arr.push(obj) : goog.array.insertAt(arr, obj, i);
};
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj), rv;
  (rv = 0 <= i) && goog.array.removeAt(arr, i);
  return rv;
};
goog.array.removeLast = function(arr, obj) {
  var i = goog.array.lastIndexOf(arr, obj);
  return 0 <= i ? (goog.array.removeAt(arr, i), !0) : !1;
};
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(null != arr.length);
  return 1 == Array.prototype.splice.call(arr, i, 1).length;
};
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return 0 <= i ? (goog.array.removeAt(arr, i), !0) : !1;
};
goog.array.removeAllIf = function(arr, f, opt_obj) {
  var removedCount = 0;
  goog.array.forEachRight(arr, function(val, index) {
    f.call(opt_obj, val, index, arr) && goog.array.removeAt(arr, index) && removedCount++;
  });
  return removedCount;
};
goog.array.concat = function(var_args) {
  return Array.prototype.concat.apply([], arguments);
};
goog.array.join = function(var_args) {
  return Array.prototype.concat.apply([], arguments);
};
goog.array.toArray = function(object) {
  var length = object.length;
  if (0 < length) {
    for (var rv = Array(length), i = 0; i < length; i++) {
      rv[i] = object[i];
    }
    return rv;
  }
  return [];
};
goog.array.clone = goog.array.toArray;
goog.array.extend = function(arr1, var_args) {
  for (var i = 1; i < arguments.length; i++) {
    var arr2 = arguments[i];
    if (goog.isArrayLike(arr2)) {
      var len1 = arr1.length || 0, len2 = arr2.length || 0;
      arr1.length = len1 + len2;
      for (var j = 0; j < len2; j++) {
        arr1[len1 + j] = arr2[j];
      }
    } else {
      arr1.push(arr2);
    }
  }
};
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(null != arr.length);
  return Array.prototype.splice.apply(arr, goog.array.slice(arguments, 1));
};
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(null != arr.length);
  return 2 >= arguments.length ? Array.prototype.slice.call(arr, start) : Array.prototype.slice.call(arr, start, opt_end);
};
goog.array.removeDuplicates = function(arr, opt_rv, opt_hashFn) {
  for (var returnArray = opt_rv || arr, defaultHashFn = function(item) {
    return goog.isObject(item) ? "o" + goog.getUid(item) : (typeof item).charAt(0) + item;
  }, hashFn = opt_hashFn || defaultHashFn, seen = {}, cursorInsert = 0, cursorRead = 0; cursorRead < arr.length;) {
    var current = arr[cursorRead++], key = hashFn(current);
    Object.prototype.hasOwnProperty.call(seen, key) || (seen[key] = !0, returnArray[cursorInsert++] = current);
  }
  returnArray.length = cursorInsert;
};
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr, opt_compareFn || goog.array.defaultCompare, !1, target);
};
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, !0, void 0, opt_obj);
};
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target, opt_selfObj) {
  for (var left = 0, right = arr.length, found; left < right;) {
    var middle = left + right >> 1;
    var compareResult = isEvaluator ? compareFn.call(opt_selfObj, arr[middle], middle, arr) : compareFn(opt_target, arr[middle]);
    0 < compareResult ? left = middle + 1 : (right = middle, found = !compareResult);
  }
  return found ? left : ~left;
};
goog.array.sort = function(arr, opt_compareFn) {
  arr.sort(opt_compareFn || goog.array.defaultCompare);
};
goog.array.stableSort = function(arr, opt_compareFn) {
  for (var compArr = Array(arr.length), i = 0; i < arr.length; i++) {
    compArr[i] = {index:i, value:arr[i]};
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(compArr, function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index;
  });
  for (i = 0; i < arr.length; i++) {
    arr[i] = compArr[i].value;
  }
};
goog.array.sortByKey = function(arr, keyFn, opt_compareFn) {
  var keyCompareFn = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return keyCompareFn(keyFn(a), keyFn(b));
  });
};
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  goog.array.sortByKey(arr, function(obj) {
    return obj[key];
  }, opt_compareFn);
};
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  for (var compare = opt_compareFn || goog.array.defaultCompare, i = 1; i < arr.length; i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if (0 < compareResult || 0 == compareResult && opt_strict) {
      return !1;
    }
  }
  return !0;
};
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if (!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) || arr1.length != arr2.length) {
    return !1;
  }
  for (var l = arr1.length, equalsFn = opt_equalsFn || goog.array.defaultCompareEquality, i = 0; i < l; i++) {
    if (!equalsFn(arr1[i], arr2[i])) {
      return !1;
    }
  }
  return !0;
};
goog.array.compare3 = function(arr1, arr2, opt_compareFn) {
  for (var compare = opt_compareFn || goog.array.defaultCompare, l = Math.min(arr1.length, arr2.length), i = 0; i < l; i++) {
    var result = compare(arr1[i], arr2[i]);
    if (0 != result) {
      return result;
    }
  }
  return goog.array.defaultCompare(arr1.length, arr2.length);
};
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0;
};
goog.array.inverseDefaultCompare = function(a, b) {
  return -goog.array.defaultCompare(a, b);
};
goog.array.defaultCompareEquality = function(a, b) {
  return a === b;
};
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return 0 > index ? (goog.array.insertAt(array, value, -(index + 1)), !0) : !1;
};
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return 0 <= index ? goog.array.removeAt(array, index) : !1;
};
goog.array.bucket = function(array, sorter, opt_obj) {
  for (var buckets = {}, i = 0; i < array.length; i++) {
    var value = array[i], key = sorter.call(opt_obj, value, i, array);
    goog.isDef(key) && (buckets[key] || (buckets[key] = [])).push(value);
  }
  return buckets;
};
goog.array.toObject = function(arr, keyFunc, opt_obj) {
  var ret = {};
  goog.array.forEach(arr, function(element, index) {
    ret[keyFunc.call(opt_obj, element, index, arr)] = element;
  });
  return ret;
};
goog.array.range = function(startOrEnd, opt_end, opt_step) {
  var array = [], start = 0, end = startOrEnd, step = opt_step || 1;
  void 0 !== opt_end && (start = startOrEnd, end = opt_end);
  if (0 > step * (end - start)) {
    return [];
  }
  if (0 < step) {
    for (var i = start; i < end; i += step) {
      array.push(i);
    }
  } else {
    for (i = start; i > end; i += step) {
      array.push(i);
    }
  }
  return array;
};
goog.array.repeat = function(value, n) {
  for (var array = [], i = 0; i < n; i++) {
    array[i] = value;
  }
  return array;
};
goog.array.flatten = function(var_args) {
  for (var result = [], i = 0; i < arguments.length; i++) {
    var element = arguments[i];
    if (goog.isArray(element)) {
      for (var c = 0; c < element.length; c += 8192) {
        for (var chunk = goog.array.slice(element, c, c + 8192), recurseResult = goog.array.flatten.apply(null, chunk), r = 0; r < recurseResult.length; r++) {
          result.push(recurseResult[r]);
        }
      }
    } else {
      result.push(element);
    }
  }
  return result;
};
goog.array.rotate = function(array, n) {
  goog.asserts.assert(null != array.length);
  array.length && (n %= array.length, 0 < n ? Array.prototype.unshift.apply(array, array.splice(-n, n)) : 0 > n && Array.prototype.push.apply(array, array.splice(0, -n)));
  return array;
};
goog.array.moveItem = function(arr, fromIndex, toIndex) {
  goog.asserts.assert(0 <= fromIndex && fromIndex < arr.length);
  goog.asserts.assert(0 <= toIndex && toIndex < arr.length);
  var removedItems = Array.prototype.splice.call(arr, fromIndex, 1);
  Array.prototype.splice.call(arr, toIndex, 0, removedItems[0]);
};
goog.array.zip = function(var_args) {
  if (!arguments.length) {
    return [];
  }
  for (var result = [], minLen = arguments[0].length, i = 1; i < arguments.length; i++) {
    arguments[i].length < minLen && (minLen = arguments[i].length);
  }
  for (i = 0; i < minLen; i++) {
    for (var value = [], j = 0; j < arguments.length; j++) {
      value.push(arguments[j][i]);
    }
    result.push(value);
  }
  return result;
};
goog.array.shuffle = function(arr, opt_randFn) {
  for (var randFn = opt_randFn || Math.random, i = arr.length - 1; 0 < i; i--) {
    var j = Math.floor(randFn() * (i + 1)), tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
};
goog.array.copyByIndex = function(arr, index_arr) {
  var result = [];
  goog.array.forEach(index_arr, function(index) {
    result.push(arr[index]);
  });
  return result;
};
goog.array.concatMap = function(arr, f, opt_obj) {
  return goog.array.concat.apply([], goog.array.map(arr, f, opt_obj));
};
goog.debug.errorcontext = {};
goog.debug.errorcontext.addErrorContext = function(err, contextKey, contextValue) {
  err[goog.debug.errorcontext.CONTEXT_KEY_] || (err[goog.debug.errorcontext.CONTEXT_KEY_] = {});
  err[goog.debug.errorcontext.CONTEXT_KEY_][contextKey] = contextValue;
};
goog.debug.errorcontext.getErrorContext = function(err) {
  return err[goog.debug.errorcontext.CONTEXT_KEY_] || {};
};
goog.debug.errorcontext.CONTEXT_KEY_ = "__closure__error__context__984382";
goog.string = {};
goog.string.internal = {};
goog.string.internal.startsWith = function(str, prefix) {
  return 0 == str.lastIndexOf(prefix, 0);
};
goog.string.internal.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return 0 <= l && str.indexOf(suffix, l) == l;
};
goog.string.internal.caseInsensitiveStartsWith = function(str, prefix) {
  return 0 == goog.string.internal.caseInsensitiveCompare(prefix, str.substr(0, prefix.length));
};
goog.string.internal.caseInsensitiveEndsWith = function(str, suffix) {
  return 0 == goog.string.internal.caseInsensitiveCompare(suffix, str.substr(str.length - suffix.length, suffix.length));
};
goog.string.internal.caseInsensitiveEquals = function(str1, str2) {
  return str1.toLowerCase() == str2.toLowerCase();
};
goog.string.internal.isEmptyOrWhitespace = function(str) {
  return /^[\s\xa0]*$/.test(str);
};
goog.string.internal.trim = goog.TRUSTED_SITE && String.prototype.trim ? function(str) {
  return str.trim();
} : function(str) {
  return /^[\s\xa0]*([\s\S]*?)[\s\xa0]*$/.exec(str)[1];
};
goog.string.internal.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase(), test2 = String(str2).toLowerCase();
  return test1 < test2 ? -1 : test1 == test2 ? 0 : 1;
};
goog.string.internal.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? "<br />" : "<br>");
};
goog.string.internal.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {
  if (opt_isLikelyToContainHtmlChars) {
    str = str.replace(goog.string.internal.AMP_RE_, "&amp;").replace(goog.string.internal.LT_RE_, "&lt;").replace(goog.string.internal.GT_RE_, "&gt;").replace(goog.string.internal.QUOT_RE_, "&quot;").replace(goog.string.internal.SINGLE_QUOTE_RE_, "&#39;").replace(goog.string.internal.NULL_RE_, "&#0;");
  } else {
    if (!goog.string.internal.ALL_RE_.test(str)) {
      return str;
    }
    -1 != str.indexOf("&") && (str = str.replace(goog.string.internal.AMP_RE_, "&amp;"));
    -1 != str.indexOf("<") && (str = str.replace(goog.string.internal.LT_RE_, "&lt;"));
    -1 != str.indexOf(">") && (str = str.replace(goog.string.internal.GT_RE_, "&gt;"));
    -1 != str.indexOf('"') && (str = str.replace(goog.string.internal.QUOT_RE_, "&quot;"));
    -1 != str.indexOf("'") && (str = str.replace(goog.string.internal.SINGLE_QUOTE_RE_, "&#39;"));
    -1 != str.indexOf("\x00") && (str = str.replace(goog.string.internal.NULL_RE_, "&#0;"));
  }
  return str;
};
goog.string.internal.AMP_RE_ = /&/g;
goog.string.internal.LT_RE_ = /</g;
goog.string.internal.GT_RE_ = />/g;
goog.string.internal.QUOT_RE_ = /"/g;
goog.string.internal.SINGLE_QUOTE_RE_ = /'/g;
goog.string.internal.NULL_RE_ = /\x00/g;
goog.string.internal.ALL_RE_ = /[\x00&<>"']/;
goog.string.internal.whitespaceEscape = function(str, opt_xml) {
  return goog.string.internal.newLineToBr(str.replace(/  /g, " &#160;"), opt_xml);
};
goog.string.internal.contains = function(str, subString) {
  return -1 != str.indexOf(subString);
};
goog.string.internal.caseInsensitiveContains = function(str, subString) {
  return goog.string.internal.contains(str.toLowerCase(), subString.toLowerCase());
};
goog.string.internal.compareVersions = function(version1, version2) {
  for (var order = 0, v1Subs = goog.string.internal.trim(String(version1)).split("."), v2Subs = goog.string.internal.trim(String(version2)).split("."), subCount = Math.max(v1Subs.length, v2Subs.length), subIdx = 0; 0 == order && subIdx < subCount; subIdx++) {
    var v1Sub = v1Subs[subIdx] || "", v2Sub = v2Subs[subIdx] || "";
    do {
      var v1Comp = /(\d*)(\D*)(.*)/.exec(v1Sub) || ["", "", "", ""], v2Comp = /(\d*)(\D*)(.*)/.exec(v2Sub) || ["", "", "", ""];
      if (0 == v1Comp[0].length && 0 == v2Comp[0].length) {
        break;
      }
      order = goog.string.internal.compareElements_(0 == v1Comp[1].length ? 0 : parseInt(v1Comp[1], 10), 0 == v2Comp[1].length ? 0 : parseInt(v2Comp[1], 10)) || goog.string.internal.compareElements_(0 == v1Comp[2].length, 0 == v2Comp[2].length) || goog.string.internal.compareElements_(v1Comp[2], v2Comp[2]);
      v1Sub = v1Comp[3];
      v2Sub = v2Comp[3];
    } while (0 == order);
  }
  return order;
};
goog.string.internal.compareElements_ = function(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
};
goog.labs = {};
goog.labs.userAgent = {};
goog.labs.userAgent.util = {};
goog.labs.userAgent.util.getNativeUserAgentString_ = function() {
  var navigator = goog.labs.userAgent.util.getNavigator_();
  if (navigator) {
    var userAgent = navigator.userAgent;
    if (userAgent) {
      return userAgent;
    }
  }
  return "";
};
goog.labs.userAgent.util.getNavigator_ = function() {
  return goog.global.navigator;
};
goog.labs.userAgent.util.userAgent_ = goog.labs.userAgent.util.getNativeUserAgentString_();
goog.labs.userAgent.util.setUserAgent = function(opt_userAgent) {
  goog.labs.userAgent.util.userAgent_ = opt_userAgent || goog.labs.userAgent.util.getNativeUserAgentString_();
};
goog.labs.userAgent.util.getUserAgent = function() {
  return goog.labs.userAgent.util.userAgent_;
};
goog.labs.userAgent.util.matchUserAgent = function(str) {
  return goog.string.internal.contains(goog.labs.userAgent.util.getUserAgent(), str);
};
goog.labs.userAgent.util.matchUserAgentIgnoreCase = function(str) {
  return goog.string.internal.caseInsensitiveContains(goog.labs.userAgent.util.getUserAgent(), str);
};
goog.labs.userAgent.util.extractVersionTuples = function(userAgent) {
  for (var versionRegExp = /(\w[\w ]+)\/([^\s]+)\s*(?:\((.*?)\))?/g, data = [], match; match = versionRegExp.exec(userAgent);) {
    data.push([match[1], match[2], match[3] || void 0]);
  }
  return data;
};
goog.object = {};
goog.object.is = function(v, v2) {
  return v === v2 ? 0 !== v || 1 / v === 1 / v2 : v !== v && v2 !== v2;
};
goog.object.forEach = function(obj, f, opt_obj) {
  for (var key in obj) {
    f.call(opt_obj, obj[key], key, obj);
  }
};
goog.object.filter = function(obj, f, opt_obj) {
  var res = {}, key;
  for (key in obj) {
    f.call(opt_obj, obj[key], key, obj) && (res[key] = obj[key]);
  }
  return res;
};
goog.object.map = function(obj, f, opt_obj) {
  var res = {}, key;
  for (key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj);
  }
  return res;
};
goog.object.some = function(obj, f, opt_obj) {
  for (var key in obj) {
    if (f.call(opt_obj, obj[key], key, obj)) {
      return !0;
    }
  }
  return !1;
};
goog.object.every = function(obj, f, opt_obj) {
  for (var key in obj) {
    if (!f.call(opt_obj, obj[key], key, obj)) {
      return !1;
    }
  }
  return !0;
};
goog.object.getCount = function(obj) {
  var rv = 0, key;
  for (key in obj) {
    rv++;
  }
  return rv;
};
goog.object.getAnyKey = function(obj) {
  for (var key in obj) {
    return key;
  }
};
goog.object.getAnyValue = function(obj) {
  for (var key in obj) {
    return obj[key];
  }
};
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val);
};
goog.object.getValues = function(obj) {
  var res = [], i = 0, key;
  for (key in obj) {
    res[i++] = obj[key];
  }
  return res;
};
goog.object.getKeys = function(obj) {
  var res = [], i = 0, key;
  for (key in obj) {
    res[i++] = key;
  }
  return res;
};
goog.object.getValueByKeys = function(obj, var_args) {
  for (var isArrayLike = goog.isArrayLike(var_args), keys = isArrayLike ? var_args : arguments, i = isArrayLike ? 0 : 1; i < keys.length; i++) {
    if (null == obj) {
      return;
    }
    obj = obj[keys[i]];
  }
  return obj;
};
goog.object.containsKey = function(obj, key) {
  return null !== obj && key in obj;
};
goog.object.containsValue = function(obj, val) {
  for (var key in obj) {
    if (obj[key] == val) {
      return !0;
    }
  }
  return !1;
};
goog.object.findKey = function(obj, f, opt_this) {
  for (var key in obj) {
    if (f.call(opt_this, obj[key], key, obj)) {
      return key;
    }
  }
};
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key];
};
goog.object.isEmpty = function(obj) {
  for (var key in obj) {
    return !1;
  }
  return !0;
};
goog.object.clear = function(obj) {
  for (var i in obj) {
    delete obj[i];
  }
};
goog.object.remove = function(obj, key) {
  var rv;
  (rv = key in obj) && delete obj[key];
  return rv;
};
goog.object.add = function(obj, key, val) {
  if (null !== obj && key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val);
};
goog.object.get = function(obj, key, opt_val) {
  return null !== obj && key in obj ? obj[key] : opt_val;
};
goog.object.set = function(obj, key, value) {
  obj[key] = value;
};
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : obj[key] = value;
};
goog.object.setWithReturnValueIfNotSet = function(obj, key, f) {
  if (key in obj) {
    return obj[key];
  }
  var val = f();
  return obj[key] = val;
};
goog.object.equals = function(a, b) {
  for (var k in a) {
    if (!(k in b) || a[k] !== b[k]) {
      return !1;
    }
  }
  for (k in b) {
    if (!(k in a)) {
      return !1;
    }
  }
  return !0;
};
goog.object.clone = function(obj) {
  var res = {}, key;
  for (key in obj) {
    res[key] = obj[key];
  }
  return res;
};
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if ("object" == type || "array" == type) {
    if (goog.isFunction(obj.clone)) {
      return obj.clone();
    }
    var clone = "array" == type ? [] : {}, key;
    for (key in obj) {
      clone[key] = goog.object.unsafeClone(obj[key]);
    }
    return clone;
  }
  return obj;
};
goog.object.transpose = function(obj) {
  var transposed = {}, key;
  for (key in obj) {
    transposed[obj[key]] = key;
  }
  return transposed;
};
goog.object.PROTOTYPE_FIELDS_ = "constructor hasOwnProperty isPrototypeOf propertyIsEnumerable toLocaleString toString valueOf".split(" ");
goog.object.extend = function(target, var_args) {
  for (var key, source, i = 1; i < arguments.length; i++) {
    source = arguments[i];
    for (key in source) {
      target[key] = source[key];
    }
    for (var j = 0; j < goog.object.PROTOTYPE_FIELDS_.length; j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j], Object.prototype.hasOwnProperty.call(source, key) && (target[key] = source[key]);
    }
  }
};
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if (1 == argLength && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0]);
  }
  if (argLength % 2) {
    throw Error("Uneven number of arguments");
  }
  for (var rv = {}, i = 0; i < argLength; i += 2) {
    rv[arguments[i]] = arguments[i + 1];
  }
  return rv;
};
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if (1 == argLength && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0]);
  }
  for (var rv = {}, i = 0; i < argLength; i++) {
    rv[arguments[i]] = !0;
  }
  return rv;
};
goog.object.createImmutableView = function(obj) {
  var result = obj;
  Object.isFrozen && !Object.isFrozen(obj) && (result = Object.create(obj), Object.freeze(result));
  return result;
};
goog.object.isImmutableView = function(obj) {
  return !!Object.isFrozen && Object.isFrozen(obj);
};
goog.object.getAllPropertyNames = function(obj, opt_includeObjectPrototype, opt_includeFunctionPrototype) {
  if (!obj) {
    return [];
  }
  if (!Object.getOwnPropertyNames || !Object.getPrototypeOf) {
    return goog.object.getKeys(obj);
  }
  for (var visitedSet = {}, proto = obj; proto && (proto !== Object.prototype || opt_includeObjectPrototype) && (proto !== Function.prototype || opt_includeFunctionPrototype);) {
    for (var names = Object.getOwnPropertyNames(proto), i = 0; i < names.length; i++) {
      visitedSet[names[i]] = !0;
    }
    proto = Object.getPrototypeOf(proto);
  }
  return goog.object.getKeys(visitedSet);
};
goog.labs.userAgent.browser = {};
goog.labs.userAgent.browser.matchOpera_ = function() {
  return goog.labs.userAgent.util.matchUserAgent("Opera");
};
goog.labs.userAgent.browser.matchIE_ = function() {
  return goog.labs.userAgent.util.matchUserAgent("Trident") || goog.labs.userAgent.util.matchUserAgent("MSIE");
};
goog.labs.userAgent.browser.matchEdge_ = function() {
  return goog.labs.userAgent.util.matchUserAgent("Edge");
};
goog.labs.userAgent.browser.matchFirefox_ = function() {
  return goog.labs.userAgent.util.matchUserAgent("Firefox") || goog.labs.userAgent.util.matchUserAgent("FxiOS");
};
goog.labs.userAgent.browser.matchSafari_ = function() {
  return goog.labs.userAgent.util.matchUserAgent("Safari") && !(goog.labs.userAgent.browser.matchChrome_() || goog.labs.userAgent.browser.matchCoast_() || goog.labs.userAgent.browser.matchOpera_() || goog.labs.userAgent.browser.matchEdge_() || goog.labs.userAgent.browser.matchFirefox_() || goog.labs.userAgent.browser.isSilk() || goog.labs.userAgent.util.matchUserAgent("Android"));
};
goog.labs.userAgent.browser.matchCoast_ = function() {
  return goog.labs.userAgent.util.matchUserAgent("Coast");
};
goog.labs.userAgent.browser.matchIosWebview_ = function() {
  return (goog.labs.userAgent.util.matchUserAgent("iPad") || goog.labs.userAgent.util.matchUserAgent("iPhone")) && !goog.labs.userAgent.browser.matchSafari_() && !goog.labs.userAgent.browser.matchChrome_() && !goog.labs.userAgent.browser.matchCoast_() && !goog.labs.userAgent.browser.matchFirefox_() && goog.labs.userAgent.util.matchUserAgent("AppleWebKit");
};
goog.labs.userAgent.browser.matchChrome_ = function() {
  return (goog.labs.userAgent.util.matchUserAgent("Chrome") || goog.labs.userAgent.util.matchUserAgent("CriOS")) && !goog.labs.userAgent.browser.matchEdge_();
};
goog.labs.userAgent.browser.matchAndroidBrowser_ = function() {
  return goog.labs.userAgent.util.matchUserAgent("Android") && !(goog.labs.userAgent.browser.isChrome() || goog.labs.userAgent.browser.isFirefox() || goog.labs.userAgent.browser.isOpera() || goog.labs.userAgent.browser.isSilk());
};
goog.labs.userAgent.browser.isOpera = goog.labs.userAgent.browser.matchOpera_;
goog.labs.userAgent.browser.isIE = goog.labs.userAgent.browser.matchIE_;
goog.labs.userAgent.browser.isEdge = goog.labs.userAgent.browser.matchEdge_;
goog.labs.userAgent.browser.isFirefox = goog.labs.userAgent.browser.matchFirefox_;
goog.labs.userAgent.browser.isSafari = goog.labs.userAgent.browser.matchSafari_;
goog.labs.userAgent.browser.isCoast = goog.labs.userAgent.browser.matchCoast_;
goog.labs.userAgent.browser.isIosWebview = goog.labs.userAgent.browser.matchIosWebview_;
goog.labs.userAgent.browser.isChrome = goog.labs.userAgent.browser.matchChrome_;
goog.labs.userAgent.browser.isAndroidBrowser = goog.labs.userAgent.browser.matchAndroidBrowser_;
goog.labs.userAgent.browser.isSilk = function() {
  return goog.labs.userAgent.util.matchUserAgent("Silk");
};
goog.labs.userAgent.browser.getVersion = function() {
  function lookUpValueWithKeys(keys) {
    var key = goog.array.find(keys, versionMapHasKey);
    return versionMap[key] || "";
  }
  var userAgentString = goog.labs.userAgent.util.getUserAgent();
  if (goog.labs.userAgent.browser.isIE()) {
    return goog.labs.userAgent.browser.getIEVersion_(userAgentString);
  }
  var versionTuples = goog.labs.userAgent.util.extractVersionTuples(userAgentString), versionMap = {};
  goog.array.forEach(versionTuples, function(tuple) {
    versionMap[tuple[0]] = tuple[1];
  });
  var versionMapHasKey = goog.partial(goog.object.containsKey, versionMap);
  if (goog.labs.userAgent.browser.isOpera()) {
    return lookUpValueWithKeys(["Version", "Opera"]);
  }
  if (goog.labs.userAgent.browser.isEdge()) {
    return lookUpValueWithKeys(["Edge"]);
  }
  if (goog.labs.userAgent.browser.isChrome()) {
    return lookUpValueWithKeys(["Chrome", "CriOS"]);
  }
  var tuple = versionTuples[2];
  return tuple && tuple[1] || "";
};
goog.labs.userAgent.browser.isVersionOrHigher = function(version) {
  return 0 <= goog.string.internal.compareVersions(goog.labs.userAgent.browser.getVersion(), version);
};
goog.labs.userAgent.browser.getIEVersion_ = function(userAgent) {
  var rv = /rv: *([\d\.]*)/.exec(userAgent);
  if (rv && rv[1]) {
    return rv[1];
  }
  var version = "", msie = /MSIE +([\d\.]+)/.exec(userAgent);
  if (msie && msie[1]) {
    var tridentVersion = /Trident\/(\d.\d)/.exec(userAgent);
    if ("7.0" == msie[1]) {
      if (tridentVersion && tridentVersion[1]) {
        switch(tridentVersion[1]) {
          case "4.0":
            version = "8.0";
            break;
          case "5.0":
            version = "9.0";
            break;
          case "6.0":
            version = "10.0";
            break;
          case "7.0":
            version = "11.0";
        }
      } else {
        version = "7.0";
      }
    } else {
      version = msie[1];
    }
  }
  return version;
};
goog.string.DETECT_DOUBLE_ESCAPING = !1;
goog.string.FORCE_NON_DOM_HTML_UNESCAPING = !1;
goog.string.Unicode = {NBSP:"\u00a0"};
goog.string.startsWith = goog.string.internal.startsWith;
goog.string.endsWith = goog.string.internal.endsWith;
goog.string.caseInsensitiveStartsWith = goog.string.internal.caseInsensitiveStartsWith;
goog.string.caseInsensitiveEndsWith = goog.string.internal.caseInsensitiveEndsWith;
goog.string.caseInsensitiveEquals = goog.string.internal.caseInsensitiveEquals;
goog.string.subs = function(str, var_args) {
  for (var splitParts = str.split("%s"), returnString = "", subsArguments = Array.prototype.slice.call(arguments, 1); subsArguments.length && 1 < splitParts.length;) {
    returnString += splitParts.shift() + subsArguments.shift();
  }
  return returnString + splitParts.join("%s");
};
goog.string.collapseWhitespace = function(str) {
  return str.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "");
};
goog.string.isEmptyOrWhitespace = goog.string.internal.isEmptyOrWhitespace;
goog.string.isEmptyString = function(str) {
  return 0 == str.length;
};
goog.string.isEmpty = goog.string.isEmptyOrWhitespace;
goog.string.isEmptyOrWhitespaceSafe = function(str) {
  return goog.string.isEmptyOrWhitespace(goog.string.makeSafe(str));
};
goog.string.isEmptySafe = goog.string.isEmptyOrWhitespaceSafe;
goog.string.isBreakingWhitespace = function(str) {
  return !/[^\t\n\r ]/.test(str);
};
goog.string.isAlpha = function(str) {
  return !/[^a-zA-Z]/.test(str);
};
goog.string.isNumeric = function(str) {
  return !/[^0-9]/.test(str);
};
goog.string.isAlphaNumeric = function(str) {
  return !/[^a-zA-Z0-9]/.test(str);
};
goog.string.isSpace = function(ch) {
  return " " == ch;
};
goog.string.isUnicodeChar = function(ch) {
  return 1 == ch.length && " " <= ch && "~" >= ch || "\u0080" <= ch && "\ufffd" >= ch;
};
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, " ");
};
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, "\n");
};
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, " ");
};
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, " ");
};
goog.string.collapseBreakingSpaces = function(str) {
  return str.replace(/[\t\r\n ]+/g, " ").replace(/^[\t\r\n ]+|[\t\r\n ]+$/g, "");
};
goog.string.trim = goog.string.internal.trim;
goog.string.trimLeft = function(str) {
  return str.replace(/^[\s\xa0]+/, "");
};
goog.string.trimRight = function(str) {
  return str.replace(/[\s\xa0]+$/, "");
};
goog.string.caseInsensitiveCompare = goog.string.internal.caseInsensitiveCompare;
goog.string.numberAwareCompare_ = function(str1, str2, tokenizerRegExp) {
  if (str1 == str2) {
    return 0;
  }
  if (!str1) {
    return -1;
  }
  if (!str2) {
    return 1;
  }
  for (var tokens1 = str1.toLowerCase().match(tokenizerRegExp), tokens2 = str2.toLowerCase().match(tokenizerRegExp), count = Math.min(tokens1.length, tokens2.length), i = 0; i < count; i++) {
    var a = tokens1[i], b = tokens2[i];
    if (a != b) {
      var num1 = parseInt(a, 10);
      if (!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if (!isNaN(num2) && num1 - num2) {
          return num1 - num2;
        }
      }
      return a < b ? -1 : 1;
    }
  }
  return tokens1.length != tokens2.length ? tokens1.length - tokens2.length : str1 < str2 ? -1 : 1;
};
goog.string.intAwareCompare = function(str1, str2) {
  return goog.string.numberAwareCompare_(str1, str2, /\d+|\D+/g);
};
goog.string.floatAwareCompare = function(str1, str2) {
  return goog.string.numberAwareCompare_(str1, str2, /\d+|\.\d+|\D+/g);
};
goog.string.numerateCompare = goog.string.floatAwareCompare;
goog.string.urlEncode = function(str) {
  return encodeURIComponent(String(str));
};
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, " "));
};
goog.string.newLineToBr = goog.string.internal.newLineToBr;
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {
  str = goog.string.internal.htmlEscape(str, opt_isLikelyToContainHtmlChars);
  goog.string.DETECT_DOUBLE_ESCAPING && (str = str.replace(goog.string.E_RE_, "&#101;"));
  return str;
};
goog.string.E_RE_ = /e/g;
goog.string.unescapeEntities = function(str) {
  return goog.string.contains(str, "&") ? !goog.string.FORCE_NON_DOM_HTML_UNESCAPING && "document" in goog.global ? goog.string.unescapeEntitiesUsingDom_(str) : goog.string.unescapePureXmlEntities_(str) : str;
};
goog.string.unescapeEntitiesWithDocument = function(str, document) {
  return goog.string.contains(str, "&") ? goog.string.unescapeEntitiesUsingDom_(str, document) : str;
};
goog.string.unescapeEntitiesUsingDom_ = function(str, opt_document) {
  var seen = {"&amp;":"&", "&lt;":"<", "&gt;":">", "&quot;":'"'};
  var div = opt_document ? opt_document.createElement("div") : goog.global.document.createElement("div");
  return str.replace(goog.string.HTML_ENTITY_PATTERN_, function(s, entity) {
    var value = seen[s];
    if (value) {
      return value;
    }
    if ("#" == entity.charAt(0)) {
      var n = Number("0" + entity.substr(1));
      isNaN(n) || (value = String.fromCharCode(n));
    }
    value || (div.innerHTML = s + " ", value = div.firstChild.nodeValue.slice(0, -1));
    return seen[s] = value;
  });
};
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch(entity) {
      case "amp":
        return "&";
      case "lt":
        return "<";
      case "gt":
        return ">";
      case "quot":
        return '"';
      default:
        if ("#" == entity.charAt(0)) {
          var n = Number("0" + entity.substr(1));
          if (!isNaN(n)) {
            return String.fromCharCode(n);
          }
        }
        return s;
    }
  });
};
goog.string.HTML_ENTITY_PATTERN_ = /&([^;\s<&]+);?/g;
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, " &#160;"), opt_xml);
};
goog.string.preserveSpaces = function(str) {
  return str.replace(/(^|[\n ]) /g, "$1" + goog.string.Unicode.NBSP);
};
goog.string.stripQuotes = function(str, quoteChars) {
  for (var length = quoteChars.length, i = 0; i < length; i++) {
    var quoteChar = 1 == length ? quoteChars : quoteChars.charAt(i);
    if (str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1);
    }
  }
  return str;
};
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  opt_protectEscapedCharacters && (str = goog.string.unescapeEntities(str));
  str.length > chars && (str = str.substring(0, chars - 3) + "...");
  opt_protectEscapedCharacters && (str = goog.string.htmlEscape(str));
  return str;
};
goog.string.truncateMiddle = function(str, chars, opt_protectEscapedCharacters, opt_trailingChars) {
  opt_protectEscapedCharacters && (str = goog.string.unescapeEntities(str));
  if (opt_trailingChars && str.length > chars) {
    opt_trailingChars > chars && (opt_trailingChars = chars), str = str.substring(0, chars - opt_trailingChars) + "..." + str.substring(str.length - opt_trailingChars);
  } else {
    if (str.length > chars) {
      var half = Math.floor(chars / 2);
      str = str.substring(0, half + chars % 2) + "..." + str.substring(str.length - half);
    }
  }
  opt_protectEscapedCharacters && (str = goog.string.htmlEscape(str));
  return str;
};
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\b":"\\b", "\f":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\x0B", '"':'\\"', "\\":"\\\\", "<":"<"};
goog.string.jsEscapeCache_ = {"'":"\\'"};
goog.string.quote = function(s) {
  s = String(s);
  for (var sb = ['"'], i = 0; i < s.length; i++) {
    var ch = s.charAt(i), cc = ch.charCodeAt(0);
    sb[i + 1] = goog.string.specialEscapeChars_[ch] || (31 < cc && 127 > cc ? ch : goog.string.escapeChar(ch));
  }
  sb.push('"');
  return sb.join("");
};
goog.string.escapeString = function(str) {
  for (var sb = [], i = 0; i < str.length; i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i));
  }
  return sb.join("");
};
goog.string.escapeChar = function(c) {
  if (c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c];
  }
  if (c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c];
  }
  var rv = c, cc = c.charCodeAt(0);
  if (31 < cc && 127 > cc) {
    rv = c;
  } else {
    if (256 > cc) {
      if (rv = "\\x", 16 > cc || 256 < cc) {
        rv += "0";
      }
    } else {
      rv = "\\u", 4096 > cc && (rv += "0");
    }
    rv += cc.toString(16).toUpperCase();
  }
  return goog.string.jsEscapeCache_[c] = rv;
};
goog.string.contains = goog.string.internal.contains;
goog.string.caseInsensitiveContains = goog.string.internal.caseInsensitiveContains;
goog.string.countOf = function(s, ss) {
  return s && ss ? s.split(ss).length - 1 : 0;
};
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  0 <= index && index < s.length && 0 < stringLength && (resultStr = s.substr(0, index) + s.substr(index + stringLength, s.length - index - stringLength));
  return resultStr;
};
goog.string.remove = function(str, substr) {
  return str.replace(substr, "");
};
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "g");
  return s.replace(re, "");
};
goog.string.replaceAll = function(s, ss, replacement) {
  var re = new RegExp(goog.string.regExpEscape(ss), "g");
  return s.replace(re, replacement.replace(/\$/g, "$$$$"));
};
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08");
};
goog.string.repeat = String.prototype.repeat ? function(string, length) {
  return string.repeat(length);
} : function(string, length) {
  return Array(length + 1).join(string);
};
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num), index = s.indexOf(".");
  -1 == index && (index = s.length);
  return goog.string.repeat("0", Math.max(0, length - index)) + s;
};
goog.string.makeSafe = function(obj) {
  return null == obj ? "" : String(obj);
};
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, "");
};
goog.string.getRandomString = function() {
  return Math.floor(2147483648 * Math.random()).toString(36) + Math.abs(Math.floor(2147483648 * Math.random()) ^ goog.now()).toString(36);
};
goog.string.compareVersions = goog.string.internal.compareVersions;
goog.string.hashCode = function(str) {
  for (var result = 0, i = 0; i < str.length; ++i) {
    result = 31 * result + str.charCodeAt(i) >>> 0;
  }
  return result;
};
goog.string.uniqueStringCounter_ = 2147483648 * Math.random() | 0;
goog.string.createUniqueString = function() {
  return "goog_" + goog.string.uniqueStringCounter_++;
};
goog.string.toNumber = function(str) {
  var num = Number(str);
  return 0 == num && goog.string.isEmptyOrWhitespace(str) ? NaN : num;
};
goog.string.isLowerCamelCase = function(str) {
  return /^[a-z]+([A-Z][a-z]*)*$/.test(str);
};
goog.string.isUpperCamelCase = function(str) {
  return /^([A-Z][a-z]*)+$/.test(str);
};
goog.string.toCamelCase = function(str) {
  return String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase();
  });
};
goog.string.toSelectorCase = function(str) {
  return String(str).replace(/([A-Z])/g, "-$1").toLowerCase();
};
goog.string.toTitleCase = function(str, opt_delimiters) {
  var delimiters = goog.isString(opt_delimiters) ? goog.string.regExpEscape(opt_delimiters) : "\\s";
  return str.replace(new RegExp("(^" + (delimiters ? "|[" + delimiters + "]+" : "") + ")([a-z])", "g"), function(all, p1, p2) {
    return p1 + p2.toUpperCase();
  });
};
goog.string.capitalize = function(str) {
  return String(str.charAt(0)).toUpperCase() + String(str.substr(1)).toLowerCase();
};
goog.string.parseInt = function(value) {
  isFinite(value) && (value = String(value));
  return goog.isString(value) ? /^\s*-?0x/i.test(value) ? parseInt(value, 16) : parseInt(value, 10) : NaN;
};
goog.string.splitLimit = function(str, separator, limit) {
  for (var parts = str.split(separator), returnVal = []; 0 < limit && parts.length;) {
    returnVal.push(parts.shift()), limit--;
  }
  parts.length && returnVal.push(parts.join(separator));
  return returnVal;
};
goog.string.lastComponent = function(str, separators) {
  if (separators) {
    "string" == typeof separators && (separators = [separators]);
  } else {
    return str;
  }
  for (var lastSeparatorIndex = -1, i = 0; i < separators.length; i++) {
    if ("" != separators[i]) {
      var currentSeparatorIndex = str.lastIndexOf(separators[i]);
      currentSeparatorIndex > lastSeparatorIndex && (lastSeparatorIndex = currentSeparatorIndex);
    }
  }
  return -1 == lastSeparatorIndex ? str : str.slice(lastSeparatorIndex + 1);
};
goog.string.editDistance = function(a, b) {
  var v0 = [], v1 = [];
  if (a == b) {
    return 0;
  }
  if (!a.length || !b.length) {
    return Math.max(a.length, b.length);
  }
  for (var i = 0; i < b.length + 1; i++) {
    v0[i] = i;
  }
  for (i = 0; i < a.length; i++) {
    v1[0] = i + 1;
    for (var j = 0; j < b.length; j++) {
      v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + Number(a[i] != b[j]));
    }
    for (j = 0; j < v0.length; j++) {
      v0[j] = v1[j];
    }
  }
  return v1[b.length];
};
goog.labs.userAgent.engine = {};
goog.labs.userAgent.engine.isPresto = function() {
  return goog.labs.userAgent.util.matchUserAgent("Presto");
};
goog.labs.userAgent.engine.isTrident = function() {
  return goog.labs.userAgent.util.matchUserAgent("Trident") || goog.labs.userAgent.util.matchUserAgent("MSIE");
};
goog.labs.userAgent.engine.isEdge = function() {
  return goog.labs.userAgent.util.matchUserAgent("Edge");
};
goog.labs.userAgent.engine.isWebKit = function() {
  return goog.labs.userAgent.util.matchUserAgentIgnoreCase("WebKit") && !goog.labs.userAgent.engine.isEdge();
};
goog.labs.userAgent.engine.isGecko = function() {
  return goog.labs.userAgent.util.matchUserAgent("Gecko") && !goog.labs.userAgent.engine.isWebKit() && !goog.labs.userAgent.engine.isTrident() && !goog.labs.userAgent.engine.isEdge();
};
goog.labs.userAgent.engine.getVersion = function() {
  var userAgentString = goog.labs.userAgent.util.getUserAgent();
  if (userAgentString) {
    var tuples = goog.labs.userAgent.util.extractVersionTuples(userAgentString), engineTuple = goog.labs.userAgent.engine.getEngineTuple_(tuples);
    if (engineTuple) {
      return "Gecko" == engineTuple[0] ? goog.labs.userAgent.engine.getVersionForKey_(tuples, "Firefox") : engineTuple[1];
    }
    var browserTuple = tuples[0], info;
    if (browserTuple && (info = browserTuple[2])) {
      var match = /Trident\/([^\s;]+)/.exec(info);
      if (match) {
        return match[1];
      }
    }
  }
  return "";
};
goog.labs.userAgent.engine.getEngineTuple_ = function(tuples) {
  if (!goog.labs.userAgent.engine.isEdge()) {
    return tuples[1];
  }
  for (var i = 0; i < tuples.length; i++) {
    var tuple = tuples[i];
    if ("Edge" == tuple[0]) {
      return tuple;
    }
  }
};
goog.labs.userAgent.engine.isVersionOrHigher = function(version) {
  return 0 <= goog.string.compareVersions(goog.labs.userAgent.engine.getVersion(), version);
};
goog.labs.userAgent.engine.getVersionForKey_ = function(tuples, key) {
  var pair = goog.array.find(tuples, function(pair) {
    return key == pair[0];
  });
  return pair && pair[1] || "";
};
goog.labs.userAgent.platform = {};
goog.labs.userAgent.platform.isAndroid = function() {
  return goog.labs.userAgent.util.matchUserAgent("Android");
};
goog.labs.userAgent.platform.isIpod = function() {
  return goog.labs.userAgent.util.matchUserAgent("iPod");
};
goog.labs.userAgent.platform.isIphone = function() {
  return goog.labs.userAgent.util.matchUserAgent("iPhone") && !goog.labs.userAgent.util.matchUserAgent("iPod") && !goog.labs.userAgent.util.matchUserAgent("iPad");
};
goog.labs.userAgent.platform.isIpad = function() {
  return goog.labs.userAgent.util.matchUserAgent("iPad");
};
goog.labs.userAgent.platform.isIos = function() {
  return goog.labs.userAgent.platform.isIphone() || goog.labs.userAgent.platform.isIpad() || goog.labs.userAgent.platform.isIpod();
};
goog.labs.userAgent.platform.isMacintosh = function() {
  return goog.labs.userAgent.util.matchUserAgent("Macintosh");
};
goog.labs.userAgent.platform.isLinux = function() {
  return goog.labs.userAgent.util.matchUserAgent("Linux");
};
goog.labs.userAgent.platform.isWindows = function() {
  return goog.labs.userAgent.util.matchUserAgent("Windows");
};
goog.labs.userAgent.platform.isChromeOS = function() {
  return goog.labs.userAgent.util.matchUserAgent("CrOS");
};
goog.labs.userAgent.platform.isChromecast = function() {
  return goog.labs.userAgent.util.matchUserAgent("CrKey");
};
goog.labs.userAgent.platform.isKaiOS = function() {
  return goog.labs.userAgent.util.matchUserAgentIgnoreCase("KaiOS");
};
goog.labs.userAgent.platform.isGo2Phone = function() {
  return goog.labs.userAgent.util.matchUserAgentIgnoreCase("GAFP");
};
goog.labs.userAgent.platform.getVersion = function() {
  var userAgentString = goog.labs.userAgent.util.getUserAgent(), version = "";
  if (goog.labs.userAgent.platform.isWindows()) {
    var re = /Windows (?:NT|Phone) ([0-9.]+)/;
    var match = re.exec(userAgentString);
    version = match ? match[1] : "0.0";
  } else {
    goog.labs.userAgent.platform.isIos() ? (re = /(?:iPhone|iPod|iPad|CPU)\s+OS\s+(\S+)/, version = (match = re.exec(userAgentString)) && match[1].replace(/_/g, ".")) : goog.labs.userAgent.platform.isMacintosh() ? (re = /Mac OS X ([0-9_.]+)/, version = (match = re.exec(userAgentString)) ? match[1].replace(/_/g, ".") : "10") : goog.labs.userAgent.platform.isAndroid() ? (re = /Android\s+([^\);]+)(\)|;)/, version = (match = re.exec(userAgentString)) && match[1]) : goog.labs.userAgent.platform.isChromeOS() && 
    (re = /(?:CrOS\s+(?:i686|x86_64)\s+([0-9.]+))/, version = (match = re.exec(userAgentString)) && match[1]);
  }
  return version || "";
};
goog.labs.userAgent.platform.isVersionOrHigher = function(version) {
  return 0 <= goog.string.compareVersions(goog.labs.userAgent.platform.getVersion(), version);
};
goog.reflect = {};
goog.reflect.object = function(type, object) {
  return object;
};
goog.reflect.objectProperty = function(prop, object) {
  return prop;
};
goog.reflect.sinkValue = function(x) {
  goog.reflect.sinkValue[" "](x);
  return x;
};
goog.reflect.sinkValue[" "] = goog.nullFunction;
goog.reflect.canAccessProperty = function(obj, prop) {
  try {
    return goog.reflect.sinkValue(obj[prop]), !0;
  } catch (e) {
  }
  return !1;
};
goog.reflect.cache = function(cacheObj, key, valueFn, opt_keyFn) {
  var storedKey = opt_keyFn ? opt_keyFn(key) : key;
  return Object.prototype.hasOwnProperty.call(cacheObj, storedKey) ? cacheObj[storedKey] : cacheObj[storedKey] = valueFn(key);
};
goog.userAgent = {};
goog.userAgent.ASSUME_IE = !1;
goog.userAgent.ASSUME_EDGE = !1;
goog.userAgent.ASSUME_GECKO = !1;
goog.userAgent.ASSUME_WEBKIT = !1;
goog.userAgent.ASSUME_MOBILE_WEBKIT = !1;
goog.userAgent.ASSUME_OPERA = !1;
goog.userAgent.ASSUME_ANY_VERSION = !1;
goog.userAgent.BROWSER_KNOWN_ = goog.userAgent.ASSUME_IE || goog.userAgent.ASSUME_EDGE || goog.userAgent.ASSUME_GECKO || goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_OPERA;
goog.userAgent.getUserAgentString = function() {
  return goog.labs.userAgent.util.getUserAgent();
};
goog.userAgent.getNavigatorTyped = function() {
  return goog.global.navigator || null;
};
goog.userAgent.getNavigator = function() {
  return goog.userAgent.getNavigatorTyped();
};
goog.userAgent.OPERA = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_OPERA : goog.labs.userAgent.browser.isOpera();
goog.userAgent.IE = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_IE : goog.labs.userAgent.browser.isIE();
goog.userAgent.EDGE = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_EDGE : goog.labs.userAgent.engine.isEdge();
goog.userAgent.EDGE_OR_IE = goog.userAgent.EDGE || goog.userAgent.IE;
goog.userAgent.GECKO = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_GECKO : goog.labs.userAgent.engine.isGecko();
goog.userAgent.WEBKIT = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_MOBILE_WEBKIT : goog.labs.userAgent.engine.isWebKit();
goog.userAgent.isMobile_ = function() {
  return goog.userAgent.WEBKIT && goog.labs.userAgent.util.matchUserAgent("Mobile");
};
goog.userAgent.MOBILE = goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.isMobile_();
goog.userAgent.SAFARI = goog.userAgent.WEBKIT;
goog.userAgent.determinePlatform_ = function() {
  var navigator = goog.userAgent.getNavigatorTyped();
  return navigator && navigator.platform || "";
};
goog.userAgent.PLATFORM = goog.userAgent.determinePlatform_();
goog.userAgent.ASSUME_MAC = !1;
goog.userAgent.ASSUME_WINDOWS = !1;
goog.userAgent.ASSUME_LINUX = !1;
goog.userAgent.ASSUME_X11 = !1;
goog.userAgent.ASSUME_ANDROID = !1;
goog.userAgent.ASSUME_IPHONE = !1;
goog.userAgent.ASSUME_IPAD = !1;
goog.userAgent.ASSUME_IPOD = !1;
goog.userAgent.ASSUME_KAIOS = !1;
goog.userAgent.ASSUME_GO2PHONE = !1;
goog.userAgent.PLATFORM_KNOWN_ = goog.userAgent.ASSUME_MAC || goog.userAgent.ASSUME_WINDOWS || goog.userAgent.ASSUME_LINUX || goog.userAgent.ASSUME_X11 || goog.userAgent.ASSUME_ANDROID || goog.userAgent.ASSUME_IPHONE || goog.userAgent.ASSUME_IPAD || goog.userAgent.ASSUME_IPOD;
goog.userAgent.MAC = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_MAC : goog.labs.userAgent.platform.isMacintosh();
goog.userAgent.WINDOWS = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_WINDOWS : goog.labs.userAgent.platform.isWindows();
goog.userAgent.isLegacyLinux_ = function() {
  return goog.labs.userAgent.platform.isLinux() || goog.labs.userAgent.platform.isChromeOS();
};
goog.userAgent.LINUX = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_LINUX : goog.userAgent.isLegacyLinux_();
goog.userAgent.isX11_ = function() {
  var navigator = goog.userAgent.getNavigatorTyped();
  return !!navigator && goog.string.contains(navigator.appVersion || "", "X11");
};
goog.userAgent.X11 = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_X11 : goog.userAgent.isX11_();
goog.userAgent.ANDROID = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_ANDROID : goog.labs.userAgent.platform.isAndroid();
goog.userAgent.IPHONE = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_IPHONE : goog.labs.userAgent.platform.isIphone();
goog.userAgent.IPAD = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_IPAD : goog.labs.userAgent.platform.isIpad();
goog.userAgent.IPOD = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_IPOD : goog.labs.userAgent.platform.isIpod();
goog.userAgent.IOS = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_IPHONE || goog.userAgent.ASSUME_IPAD || goog.userAgent.ASSUME_IPOD : goog.labs.userAgent.platform.isIos();
goog.userAgent.KAIOS = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_KAIOS : goog.labs.userAgent.platform.isKaiOS();
goog.userAgent.GO2PHONE = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_GO2PHONE : goog.labs.userAgent.platform.isGo2Phone();
goog.userAgent.determineVersion_ = function() {
  var version = "", arr = goog.userAgent.getVersionRegexResult_();
  arr && (version = arr ? arr[1] : "");
  if (goog.userAgent.IE) {
    var docMode = goog.userAgent.getDocumentMode_();
    if (null != docMode && docMode > parseFloat(version)) {
      return String(docMode);
    }
  }
  return version;
};
goog.userAgent.getVersionRegexResult_ = function() {
  var userAgent = goog.userAgent.getUserAgentString();
  if (goog.userAgent.GECKO) {
    return /rv:([^\);]+)(\)|;)/.exec(userAgent);
  }
  if (goog.userAgent.EDGE) {
    return /Edge\/([\d\.]+)/.exec(userAgent);
  }
  if (goog.userAgent.IE) {
    return /\b(?:MSIE|rv)[: ]([^\);]+)(\)|;)/.exec(userAgent);
  }
  if (goog.userAgent.WEBKIT) {
    return /WebKit\/(\S+)/.exec(userAgent);
  }
  if (goog.userAgent.OPERA) {
    return /(?:Version)[ \/]?(\S+)/.exec(userAgent);
  }
};
goog.userAgent.getDocumentMode_ = function() {
  var doc = goog.global.document;
  return doc ? doc.documentMode : void 0;
};
goog.userAgent.VERSION = goog.userAgent.determineVersion_();
goog.userAgent.compare = function(v1, v2) {
  return goog.string.compareVersions(v1, v2);
};
goog.userAgent.isVersionOrHigherCache_ = {};
goog.userAgent.isVersionOrHigher = function(version) {
  return goog.userAgent.ASSUME_ANY_VERSION || goog.reflect.cache(goog.userAgent.isVersionOrHigherCache_, version, function() {
    return 0 <= goog.string.compareVersions(goog.userAgent.VERSION, version);
  });
};
goog.userAgent.isVersion = goog.userAgent.isVersionOrHigher;
goog.userAgent.isDocumentModeOrHigher = function(documentMode) {
  return Number(goog.userAgent.DOCUMENT_MODE) >= documentMode;
};
goog.userAgent.isDocumentMode = goog.userAgent.isDocumentModeOrHigher;
goog.userAgent.DOCUMENT_MODE = function() {
  var doc = goog.global.document;
  if (doc && goog.userAgent.IE) {
    return goog.userAgent.getDocumentMode_() || ("CSS1Compat" == doc.compatMode ? parseInt(goog.userAgent.VERSION, 10) : 5);
  }
}();
goog.debug.LOGGING_ENABLED = goog.DEBUG;
goog.debug.FORCE_SLOPPY_STACKS = !1;
goog.debug.catchErrors = function(logFunc, opt_cancel, opt_target) {
  var target = opt_target || goog.global, oldErrorHandler = target.onerror, retVal = !!opt_cancel;
  goog.userAgent.WEBKIT && !goog.userAgent.isVersionOrHigher("535.3") && (retVal = !retVal);
  target.onerror = function(message, url, line, opt_col, opt_error) {
    oldErrorHandler && oldErrorHandler(message, url, line, opt_col, opt_error);
    logFunc({message:message, fileName:url, line:line, lineNumber:line, col:opt_col, error:opt_error});
    return retVal;
  };
};
goog.debug.expose = function(obj, opt_showFn) {
  if ("undefined" == typeof obj) {
    return "undefined";
  }
  if (null == obj) {
    return "NULL";
  }
  var str = [], x;
  for (x in obj) {
    if (opt_showFn || !goog.isFunction(obj[x])) {
      var s = x + " = ";
      try {
        s += obj[x];
      } catch (e) {
        s += "*** " + e + " ***";
      }
      str.push(s);
    }
  }
  return str.join("\n");
};
goog.debug.deepExpose = function(obj$jscomp$0, opt_showFn) {
  var str$jscomp$0 = [], uidsToCleanup = [], ancestorUids = {}, helper = function(obj, space) {
    var nestspace = space + "  ", indentMultiline = function(str) {
      return str.replace(/\n/g, "\n" + space);
    };
    try {
      if (goog.isDef(obj)) {
        if (goog.isNull(obj)) {
          str$jscomp$0.push("NULL");
        } else {
          if (goog.isString(obj)) {
            str$jscomp$0.push('"' + indentMultiline(obj) + '"');
          } else {
            if (goog.isFunction(obj)) {
              str$jscomp$0.push(indentMultiline(String(obj)));
            } else {
              if (goog.isObject(obj)) {
                goog.hasUid(obj) || uidsToCleanup.push(obj);
                var uid = goog.getUid(obj);
                if (ancestorUids[uid]) {
                  str$jscomp$0.push("*** reference loop detected (id=" + uid + ") ***");
                } else {
                  ancestorUids[uid] = !0;
                  str$jscomp$0.push("{");
                  for (var x in obj) {
                    if (opt_showFn || !goog.isFunction(obj[x])) {
                      str$jscomp$0.push("\n"), str$jscomp$0.push(nestspace), str$jscomp$0.push(x + " = "), helper(obj[x], nestspace);
                    }
                  }
                  str$jscomp$0.push("\n" + space + "}");
                  delete ancestorUids[uid];
                }
              } else {
                str$jscomp$0.push(obj);
              }
            }
          }
        }
      } else {
        str$jscomp$0.push("undefined");
      }
    } catch (e) {
      str$jscomp$0.push("*** " + e + " ***");
    }
  };
  helper(obj$jscomp$0, "");
  for (var i = 0; i < uidsToCleanup.length; i++) {
    goog.removeUid(uidsToCleanup[i]);
  }
  return str$jscomp$0.join("");
};
goog.debug.exposeArray = function(arr) {
  for (var str = [], i = 0; i < arr.length; i++) {
    goog.isArray(arr[i]) ? str.push(goog.debug.exposeArray(arr[i])) : str.push(arr[i]);
  }
  return "[ " + str.join(", ") + " ]";
};
goog.debug.normalizeErrorObject = function(err) {
  var href = goog.getObjectByName("window.location.href");
  null == err && (err = 'Unknown Error of type "null/undefined"');
  if (goog.isString(err)) {
    return {message:err, name:"Unknown error", lineNumber:"Not available", fileName:href, stack:"Not available"};
  }
  var threwError = !1;
  try {
    var lineNumber = err.lineNumber || err.line || "Not available";
  } catch (e) {
    lineNumber = "Not available", threwError = !0;
  }
  try {
    var fileName = err.fileName || err.filename || err.sourceURL || goog.global.$googDebugFname || href;
  } catch (e$13) {
    fileName = "Not available", threwError = !0;
  }
  if (!(!threwError && err.lineNumber && err.fileName && err.stack && err.message && err.name)) {
    var message = err.message;
    null == message && (message = err.constructor && err.constructor instanceof Function ? 'Unknown Error of type "' + (err.constructor.name ? err.constructor.name : goog.debug.getFunctionName(err.constructor)) + '"' : "Unknown Error of unknown type");
    return {message:message, name:err.name || "UnknownError", lineNumber:lineNumber, fileName:fileName, stack:err.stack || "Not available"};
  }
  return err;
};
goog.debug.enhanceError = function(err, opt_message) {
  if (err instanceof Error) {
    var error = err;
  } else {
    error = Error(err), Error.captureStackTrace && Error.captureStackTrace(error, goog.debug.enhanceError);
  }
  error.stack || (error.stack = goog.debug.getStacktrace(goog.debug.enhanceError));
  if (opt_message) {
    for (var x = 0; error["message" + x];) {
      ++x;
    }
    error["message" + x] = String(opt_message);
  }
  return error;
};
goog.debug.enhanceErrorWithContext = function(err, opt_context) {
  var error = goog.debug.enhanceError(err);
  if (opt_context) {
    for (var key in opt_context) {
      goog.debug.errorcontext.addErrorContext(error, key, opt_context[key]);
    }
  }
  return error;
};
goog.debug.getStacktraceSimple = function(opt_depth) {
  if (!goog.debug.FORCE_SLOPPY_STACKS) {
    var stack = goog.debug.getNativeStackTrace_(goog.debug.getStacktraceSimple);
    if (stack) {
      return stack;
    }
  }
  for (var sb = [], fn = arguments.callee.caller, depth = 0; fn && (!opt_depth || depth < opt_depth);) {
    sb.push(goog.debug.getFunctionName(fn));
    sb.push("()\n");
    try {
      fn = fn.caller;
    } catch (e) {
      sb.push("[exception trying to get caller]\n");
      break;
    }
    depth++;
    if (depth >= goog.debug.MAX_STACK_DEPTH) {
      sb.push("[...long stack...]");
      break;
    }
  }
  opt_depth && depth >= opt_depth ? sb.push("[...reached max depth limit...]") : sb.push("[end]");
  return sb.join("");
};
goog.debug.MAX_STACK_DEPTH = 50;
goog.debug.getNativeStackTrace_ = function(fn) {
  var tempErr = Error();
  if (Error.captureStackTrace) {
    return Error.captureStackTrace(tempErr, fn), String(tempErr.stack);
  }
  try {
    throw tempErr;
  } catch (e) {
    tempErr = e;
  }
  var stack = tempErr.stack;
  return stack ? String(stack) : null;
};
goog.debug.getStacktrace = function(fn) {
  var stack;
  goog.debug.FORCE_SLOPPY_STACKS || (stack = goog.debug.getNativeStackTrace_(fn || goog.debug.getStacktrace));
  stack || (stack = goog.debug.getStacktraceHelper_(fn || arguments.callee.caller, []));
  return stack;
};
goog.debug.getStacktraceHelper_ = function(fn, visited) {
  var sb = [];
  if (goog.array.contains(visited, fn)) {
    sb.push("[...circular reference...]");
  } else {
    if (fn && visited.length < goog.debug.MAX_STACK_DEPTH) {
      sb.push(goog.debug.getFunctionName(fn) + "(");
      for (var args = fn.arguments, i = 0; args && i < args.length; i++) {
        0 < i && sb.push(", ");
        var arg = args[i];
        switch(typeof arg) {
          case "object":
            var argDesc = arg ? "object" : "null";
            break;
          case "string":
            argDesc = arg;
            break;
          case "number":
            argDesc = String(arg);
            break;
          case "boolean":
            argDesc = arg ? "true" : "false";
            break;
          case "function":
            argDesc = (argDesc = goog.debug.getFunctionName(arg)) ? argDesc : "[fn]";
            break;
          default:
            argDesc = typeof arg;
        }
        40 < argDesc.length && (argDesc = argDesc.substr(0, 40) + "...");
        sb.push(argDesc);
      }
      visited.push(fn);
      sb.push(")\n");
      try {
        sb.push(goog.debug.getStacktraceHelper_(fn.caller, visited));
      } catch (e) {
        sb.push("[exception trying to get caller]\n");
      }
    } else {
      fn ? sb.push("[...long stack...]") : sb.push("[end]");
    }
  }
  return sb.join("");
};
goog.debug.getFunctionName = function(fn) {
  if (goog.debug.fnNameCache_[fn]) {
    return goog.debug.fnNameCache_[fn];
  }
  var functionSource = String(fn);
  if (!goog.debug.fnNameCache_[functionSource]) {
    var matches = /function\s+([^\(]+)/m.exec(functionSource);
    goog.debug.fnNameCache_[functionSource] = matches ? matches[1] : "[Anonymous]";
  }
  return goog.debug.fnNameCache_[functionSource];
};
goog.debug.makeWhitespaceVisible = function(string) {
  return string.replace(/ /g, "[_]").replace(/\f/g, "[f]").replace(/\n/g, "[n]\n").replace(/\r/g, "[r]").replace(/\t/g, "[t]");
};
goog.debug.runtimeType = function(value) {
  return value instanceof Function ? value.displayName || value.name || "unknown type name" : value instanceof Object ? value.constructor.displayName || value.constructor.name || Object.prototype.toString.call(value) : null === value ? "null" : typeof value;
};
goog.debug.fnNameCache_ = {};
goog.debug.freezeInternal_ = goog.DEBUG && Object.freeze || function(arg) {
  return arg;
};
goog.debug.freeze = function(arg) {
  return function() {
    return goog.debug.freezeInternal_(arg);
  }();
};
$jscomp.scope.purify = function(fn) {
  return {valueOf:fn}.valueOf();
};
goog.events.BrowserFeature = {HAS_W3C_BUTTON:!goog.userAgent.IE || goog.userAgent.isDocumentModeOrHigher(9), HAS_W3C_EVENT_SUPPORT:!goog.userAgent.IE || goog.userAgent.isDocumentModeOrHigher(9), SET_KEY_CODE_TO_PREVENT_DEFAULT:goog.userAgent.IE && !goog.userAgent.isVersionOrHigher("9"), HAS_NAVIGATOR_ONLINE_PROPERTY:!goog.userAgent.WEBKIT || goog.userAgent.isVersionOrHigher("528"), HAS_HTML5_NETWORK_EVENT_SUPPORT:goog.userAgent.GECKO && goog.userAgent.isVersionOrHigher("1.9b") || goog.userAgent.IE && 
goog.userAgent.isVersionOrHigher("8") || goog.userAgent.OPERA && goog.userAgent.isVersionOrHigher("9.5") || goog.userAgent.WEBKIT && goog.userAgent.isVersionOrHigher("528"), HTML5_NETWORK_EVENTS_FIRE_ON_BODY:goog.userAgent.GECKO && !goog.userAgent.isVersionOrHigher("8") || goog.userAgent.IE && !goog.userAgent.isVersionOrHigher("9"), TOUCH_ENABLED:"ontouchstart" in goog.global || !!(goog.global.document && document.documentElement && "ontouchstart" in document.documentElement) || !(!goog.global.navigator || 
!goog.global.navigator.maxTouchPoints && !goog.global.navigator.msMaxTouchPoints), POINTER_EVENTS:"PointerEvent" in goog.global, MSPOINTER_EVENTS:"MSPointerEvent" in goog.global && !(!goog.global.navigator || !goog.global.navigator.msPointerEnabled), PASSIVE_EVENTS:(0,$jscomp.scope.purify)(function() {
  if (!goog.global.addEventListener || !Object.defineProperty) {
    return !1;
  }
  var passive = !1, options = Object.defineProperty({}, "passive", {get:function() {
    passive = !0;
  }});
  try {
    goog.global.addEventListener("test", goog.nullFunction, options), goog.global.removeEventListener("test", goog.nullFunction, options);
  } catch (e) {
  }
  return passive;
})};
goog.events.getVendorPrefixedName_ = function(eventName) {
  return goog.userAgent.WEBKIT ? "webkit" + eventName : goog.userAgent.OPERA ? "o" + eventName.toLowerCase() : eventName.toLowerCase();
};
goog.events.EventType = {CLICK:"click", RIGHTCLICK:"rightclick", DBLCLICK:"dblclick", AUXCLICK:"auxclick", MOUSEDOWN:"mousedown", MOUSEUP:"mouseup", MOUSEOVER:"mouseover", MOUSEOUT:"mouseout", MOUSEMOVE:"mousemove", MOUSEENTER:"mouseenter", MOUSELEAVE:"mouseleave", MOUSECANCEL:"mousecancel", SELECTIONCHANGE:"selectionchange", SELECTSTART:"selectstart", WHEEL:"wheel", KEYPRESS:"keypress", KEYDOWN:"keydown", KEYUP:"keyup", BLUR:"blur", FOCUS:"focus", DEACTIVATE:"deactivate", FOCUSIN:"focusin", FOCUSOUT:"focusout", 
CHANGE:"change", RESET:"reset", SELECT:"select", SUBMIT:"submit", INPUT:"input", PROPERTYCHANGE:"propertychange", DRAGSTART:"dragstart", DRAG:"drag", DRAGENTER:"dragenter", DRAGOVER:"dragover", DRAGLEAVE:"dragleave", DROP:"drop", DRAGEND:"dragend", TOUCHSTART:"touchstart", TOUCHMOVE:"touchmove", TOUCHEND:"touchend", TOUCHCANCEL:"touchcancel", BEFOREUNLOAD:"beforeunload", CONSOLEMESSAGE:"consolemessage", CONTEXTMENU:"contextmenu", DEVICECHANGE:"devicechange", DEVICEMOTION:"devicemotion", DEVICEORIENTATION:"deviceorientation", 
DOMCONTENTLOADED:"DOMContentLoaded", ERROR:"error", HELP:"help", LOAD:"load", LOSECAPTURE:"losecapture", ORIENTATIONCHANGE:"orientationchange", READYSTATECHANGE:"readystatechange", RESIZE:"resize", SCROLL:"scroll", UNLOAD:"unload", CANPLAY:"canplay", CANPLAYTHROUGH:"canplaythrough", DURATIONCHANGE:"durationchange", EMPTIED:"emptied", ENDED:"ended", LOADEDDATA:"loadeddata", LOADEDMETADATA:"loadedmetadata", PAUSE:"pause", PLAY:"play", PLAYING:"playing", RATECHANGE:"ratechange", SEEKED:"seeked", SEEKING:"seeking", 
STALLED:"stalled", SUSPEND:"suspend", TIMEUPDATE:"timeupdate", VOLUMECHANGE:"volumechange", WAITING:"waiting", SOURCEOPEN:"sourceopen", SOURCEENDED:"sourceended", SOURCECLOSED:"sourceclosed", ABORT:"abort", UPDATE:"update", UPDATESTART:"updatestart", UPDATEEND:"updateend", HASHCHANGE:"hashchange", PAGEHIDE:"pagehide", PAGESHOW:"pageshow", POPSTATE:"popstate", COPY:"copy", PASTE:"paste", CUT:"cut", BEFORECOPY:"beforecopy", BEFORECUT:"beforecut", BEFOREPASTE:"beforepaste", ONLINE:"online", OFFLINE:"offline", 
MESSAGE:"message", CONNECT:"connect", INSTALL:"install", ACTIVATE:"activate", FETCH:"fetch", FOREIGNFETCH:"foreignfetch", MESSAGEERROR:"messageerror", STATECHANGE:"statechange", UPDATEFOUND:"updatefound", CONTROLLERCHANGE:"controllerchange", ANIMATIONSTART:goog.events.getVendorPrefixedName_("AnimationStart"), ANIMATIONEND:goog.events.getVendorPrefixedName_("AnimationEnd"), ANIMATIONITERATION:goog.events.getVendorPrefixedName_("AnimationIteration"), TRANSITIONEND:goog.events.getVendorPrefixedName_("TransitionEnd"), 
POINTERDOWN:"pointerdown", POINTERUP:"pointerup", POINTERCANCEL:"pointercancel", POINTERMOVE:"pointermove", POINTEROVER:"pointerover", POINTEROUT:"pointerout", POINTERENTER:"pointerenter", POINTERLEAVE:"pointerleave", GOTPOINTERCAPTURE:"gotpointercapture", LOSTPOINTERCAPTURE:"lostpointercapture", MSGESTURECHANGE:"MSGestureChange", MSGESTUREEND:"MSGestureEnd", MSGESTUREHOLD:"MSGestureHold", MSGESTURESTART:"MSGestureStart", MSGESTURETAP:"MSGestureTap", MSGOTPOINTERCAPTURE:"MSGotPointerCapture", MSINERTIASTART:"MSInertiaStart", 
MSLOSTPOINTERCAPTURE:"MSLostPointerCapture", MSPOINTERCANCEL:"MSPointerCancel", MSPOINTERDOWN:"MSPointerDown", MSPOINTERENTER:"MSPointerEnter", MSPOINTERHOVER:"MSPointerHover", MSPOINTERLEAVE:"MSPointerLeave", MSPOINTERMOVE:"MSPointerMove", MSPOINTEROUT:"MSPointerOut", MSPOINTEROVER:"MSPointerOver", MSPOINTERUP:"MSPointerUp", TEXT:"text", TEXTINPUT:goog.userAgent.IE ? "textinput" : "textInput", COMPOSITIONSTART:"compositionstart", COMPOSITIONUPDATE:"compositionupdate", COMPOSITIONEND:"compositionend", 
BEFOREINPUT:"beforeinput", EXIT:"exit", LOADABORT:"loadabort", LOADCOMMIT:"loadcommit", LOADREDIRECT:"loadredirect", LOADSTART:"loadstart", LOADSTOP:"loadstop", RESPONSIVE:"responsive", SIZECHANGED:"sizechanged", UNRESPONSIVE:"unresponsive", VISIBILITYCHANGE:"visibilitychange", STORAGE:"storage", DOMSUBTREEMODIFIED:"DOMSubtreeModified", DOMNODEINSERTED:"DOMNodeInserted", DOMNODEREMOVED:"DOMNodeRemoved", DOMNODEREMOVEDFROMDOCUMENT:"DOMNodeRemovedFromDocument", DOMNODEINSERTEDINTODOCUMENT:"DOMNodeInsertedIntoDocument", 
DOMATTRMODIFIED:"DOMAttrModified", DOMCHARACTERDATAMODIFIED:"DOMCharacterDataModified", BEFOREPRINT:"beforeprint", AFTERPRINT:"afterprint", BEFOREINSTALLPROMPT:"beforeinstallprompt", APPINSTALLED:"appinstalled"};
goog.events.getPointerFallbackEventName_ = function(pointerEventName, msPointerEventName, fallbackEventName) {
  return goog.events.BrowserFeature.POINTER_EVENTS ? pointerEventName : goog.events.BrowserFeature.MSPOINTER_EVENTS ? msPointerEventName : fallbackEventName;
};
goog.events.PointerFallbackEventType = {POINTERDOWN:goog.events.getPointerFallbackEventName_(goog.events.EventType.POINTERDOWN, goog.events.EventType.MSPOINTERDOWN, goog.events.EventType.MOUSEDOWN), POINTERUP:goog.events.getPointerFallbackEventName_(goog.events.EventType.POINTERUP, goog.events.EventType.MSPOINTERUP, goog.events.EventType.MOUSEUP), POINTERCANCEL:goog.events.getPointerFallbackEventName_(goog.events.EventType.POINTERCANCEL, goog.events.EventType.MSPOINTERCANCEL, goog.events.EventType.MOUSECANCEL), 
POINTERMOVE:goog.events.getPointerFallbackEventName_(goog.events.EventType.POINTERMOVE, goog.events.EventType.MSPOINTERMOVE, goog.events.EventType.MOUSEMOVE), POINTEROVER:goog.events.getPointerFallbackEventName_(goog.events.EventType.POINTEROVER, goog.events.EventType.MSPOINTEROVER, goog.events.EventType.MOUSEOVER), POINTEROUT:goog.events.getPointerFallbackEventName_(goog.events.EventType.POINTEROUT, goog.events.EventType.MSPOINTEROUT, goog.events.EventType.MOUSEOUT), POINTERENTER:goog.events.getPointerFallbackEventName_(goog.events.EventType.POINTERENTER, 
goog.events.EventType.MSPOINTERENTER, goog.events.EventType.MOUSEENTER), POINTERLEAVE:goog.events.getPointerFallbackEventName_(goog.events.EventType.POINTERLEAVE, goog.events.EventType.MSPOINTERLEAVE, goog.events.EventType.MOUSELEAVE)};
goog.events.PointerTouchFallbackEventType = {POINTERDOWN:goog.events.getPointerFallbackEventName_(goog.events.EventType.POINTERDOWN, goog.events.EventType.MSPOINTERDOWN, goog.events.EventType.TOUCHSTART), POINTERUP:goog.events.getPointerFallbackEventName_(goog.events.EventType.POINTERUP, goog.events.EventType.MSPOINTERUP, goog.events.EventType.TOUCHEND), POINTERCANCEL:goog.events.getPointerFallbackEventName_(goog.events.EventType.POINTERCANCEL, goog.events.EventType.MSPOINTERCANCEL, goog.events.EventType.TOUCHCANCEL), 
POINTERMOVE:goog.events.getPointerFallbackEventName_(goog.events.EventType.POINTERMOVE, goog.events.EventType.MSPOINTERMOVE, goog.events.EventType.TOUCHMOVE)};
goog.events.PointerAsMouseEventType = {MOUSEDOWN:goog.events.PointerFallbackEventType.POINTERDOWN, MOUSEUP:goog.events.PointerFallbackEventType.POINTERUP, MOUSECANCEL:goog.events.PointerFallbackEventType.POINTERCANCEL, MOUSEMOVE:goog.events.PointerFallbackEventType.POINTERMOVE, MOUSEOVER:goog.events.PointerFallbackEventType.POINTEROVER, MOUSEOUT:goog.events.PointerFallbackEventType.POINTEROUT, MOUSEENTER:goog.events.PointerFallbackEventType.POINTERENTER, MOUSELEAVE:goog.events.PointerFallbackEventType.POINTERLEAVE};
goog.events.MouseAsMouseEventType = {MOUSEDOWN:goog.events.EventType.MOUSEDOWN, MOUSEUP:goog.events.EventType.MOUSEUP, MOUSECANCEL:goog.events.EventType.MOUSECANCEL, MOUSEMOVE:goog.events.EventType.MOUSEMOVE, MOUSEOVER:goog.events.EventType.MOUSEOVER, MOUSEOUT:goog.events.EventType.MOUSEOUT, MOUSEENTER:goog.events.EventType.MOUSEENTER, MOUSELEAVE:goog.events.EventType.MOUSELEAVE};
goog.events.PointerAsTouchEventType = {TOUCHCANCEL:goog.events.PointerTouchFallbackEventType.POINTERCANCEL, TOUCHEND:goog.events.PointerTouchFallbackEventType.POINTERUP, TOUCHMOVE:goog.events.PointerTouchFallbackEventType.POINTERMOVE, TOUCHSTART:goog.events.PointerTouchFallbackEventType.POINTERDOWN};
goog.events.USE_LAYER_XY_AS_OFFSET_XY = !1;
goog.events.BrowserEvent = function(opt_e, opt_currentTarget) {
  goog.events.Event.call(this, opt_e ? opt_e.type : "");
  this.relatedTarget = this.currentTarget = this.target = null;
  this.button = this.screenY = this.screenX = this.clientY = this.clientX = this.offsetY = this.offsetX = 0;
  this.key = "";
  this.charCode = this.keyCode = 0;
  this.metaKey = this.shiftKey = this.altKey = this.ctrlKey = !1;
  this.state = null;
  this.platformModifierKey = !1;
  this.pointerId = 0;
  this.pointerType = "";
  this.event_ = null;
  opt_e && this.init(opt_e, opt_currentTarget);
};
goog.inherits(goog.events.BrowserEvent, goog.events.Event);
goog.events.BrowserEvent.MouseButton = {LEFT:0, MIDDLE:1, RIGHT:2};
goog.events.BrowserEvent.PointerType = {MOUSE:"mouse", PEN:"pen", TOUCH:"touch"};
goog.events.BrowserEvent.IEButtonMap = goog.debug.freeze([1, 4, 2]);
goog.events.BrowserEvent.IE_BUTTON_MAP = goog.events.BrowserEvent.IEButtonMap;
goog.events.BrowserEvent.IE_POINTER_TYPE_MAP = goog.debug.freeze({2:goog.events.BrowserEvent.PointerType.TOUCH, 3:goog.events.BrowserEvent.PointerType.PEN, 4:goog.events.BrowserEvent.PointerType.MOUSE});
goog.events.BrowserEvent.prototype.init = function(e, opt_currentTarget) {
  var type = this.type = e.type, relevantTouch = e.changedTouches && e.changedTouches.length ? e.changedTouches[0] : null;
  this.target = e.target || e.srcElement;
  this.currentTarget = opt_currentTarget;
  var relatedTarget = e.relatedTarget;
  relatedTarget ? goog.userAgent.GECKO && (goog.reflect.canAccessProperty(relatedTarget, "nodeName") || (relatedTarget = null)) : type == goog.events.EventType.MOUSEOVER ? relatedTarget = e.fromElement : type == goog.events.EventType.MOUSEOUT && (relatedTarget = e.toElement);
  this.relatedTarget = relatedTarget;
  relevantTouch ? (this.clientX = void 0 !== relevantTouch.clientX ? relevantTouch.clientX : relevantTouch.pageX, this.clientY = void 0 !== relevantTouch.clientY ? relevantTouch.clientY : relevantTouch.pageY, this.screenX = relevantTouch.screenX || 0, this.screenY = relevantTouch.screenY || 0) : (goog.events.USE_LAYER_XY_AS_OFFSET_XY ? (this.offsetX = void 0 !== e.layerX ? e.layerX : e.offsetX, this.offsetY = void 0 !== e.layerY ? e.layerY : e.offsetY) : (this.offsetX = goog.userAgent.WEBKIT || void 0 !== 
  e.offsetX ? e.offsetX : e.layerX, this.offsetY = goog.userAgent.WEBKIT || void 0 !== e.offsetY ? e.offsetY : e.layerY), this.clientX = void 0 !== e.clientX ? e.clientX : e.pageX, this.clientY = void 0 !== e.clientY ? e.clientY : e.pageY, this.screenX = e.screenX || 0, this.screenY = e.screenY || 0);
  this.button = e.button;
  this.keyCode = e.keyCode || 0;
  this.key = e.key || "";
  this.charCode = e.charCode || ("keypress" == type ? e.keyCode : 0);
  this.ctrlKey = e.ctrlKey;
  this.altKey = e.altKey;
  this.shiftKey = e.shiftKey;
  this.metaKey = e.metaKey;
  this.platformModifierKey = goog.userAgent.MAC ? e.metaKey : e.ctrlKey;
  this.pointerId = e.pointerId || 0;
  this.pointerType = goog.events.BrowserEvent.getPointerType_(e);
  this.state = e.state;
  this.event_ = e;
  e.defaultPrevented && this.preventDefault();
};
goog.events.BrowserEvent.prototype.isButton = function(button) {
  return goog.events.BrowserFeature.HAS_W3C_BUTTON ? this.event_.button == button : "click" == this.type ? button == goog.events.BrowserEvent.MouseButton.LEFT : !!(this.event_.button & goog.events.BrowserEvent.IE_BUTTON_MAP[button]);
};
goog.events.BrowserEvent.prototype.isMouseActionButton = function() {
  return this.isButton(goog.events.BrowserEvent.MouseButton.LEFT) && !(goog.userAgent.WEBKIT && goog.userAgent.MAC && this.ctrlKey);
};
goog.events.BrowserEvent.prototype.stopPropagation = function() {
  goog.events.BrowserEvent.superClass_.stopPropagation.call(this);
  this.event_.stopPropagation ? this.event_.stopPropagation() : this.event_.cancelBubble = !0;
};
goog.events.BrowserEvent.prototype.preventDefault = function() {
  goog.events.BrowserEvent.superClass_.preventDefault.call(this);
  var be = this.event_;
  if (be.preventDefault) {
    be.preventDefault();
  } else {
    if (be.returnValue = !1, goog.events.BrowserFeature.SET_KEY_CODE_TO_PREVENT_DEFAULT) {
      try {
        if (be.ctrlKey || 112 <= be.keyCode && 123 >= be.keyCode) {
          be.keyCode = -1;
        }
      } catch (ex) {
      }
    }
  }
};
goog.events.BrowserEvent.prototype.getBrowserEvent = function() {
  return this.event_;
};
goog.events.BrowserEvent.getPointerType_ = function(e) {
  return goog.isString(e.pointerType) ? e.pointerType : goog.events.BrowserEvent.IE_POINTER_TYPE_MAP[e.pointerType] || "";
};
goog.events.Listenable = function() {
};
goog.events.Listenable.IMPLEMENTED_BY_PROP = "closure_listenable_" + (1e6 * Math.random() | 0);
goog.events.Listenable.addImplementation = function(cls) {
  cls.prototype[goog.events.Listenable.IMPLEMENTED_BY_PROP] = !0;
};
goog.events.Listenable.isImplementedBy = function(obj) {
  return !(!obj || !obj[goog.events.Listenable.IMPLEMENTED_BY_PROP]);
};
goog.events.ListenableKey = function() {
};
goog.events.ListenableKey.counter_ = 0;
goog.events.ListenableKey.reserveKey = function() {
  return ++goog.events.ListenableKey.counter_;
};
goog.events.Listener = function(listener, proxy, src, type, capture, opt_handler) {
  goog.events.Listener.ENABLE_MONITORING && (this.creationStack = Error().stack);
  this.listener = listener;
  this.proxy = proxy;
  this.src = src;
  this.type = type;
  this.capture = !!capture;
  this.handler = opt_handler;
  this.key = goog.events.ListenableKey.reserveKey();
  this.removed = this.callOnce = !1;
};
goog.events.Listener.ENABLE_MONITORING = !1;
goog.events.Listener.prototype.markAsRemoved = function() {
  this.removed = !0;
  this.handler = this.src = this.proxy = this.listener = null;
};
goog.events.ListenerMap = function(src) {
  this.src = src;
  this.listeners = {};
  this.typeCount_ = 0;
};
goog.events.ListenerMap.prototype.getTypeCount = function() {
  return this.typeCount_;
};
goog.events.ListenerMap.prototype.getListenerCount = function() {
  var count = 0, type;
  for (type in this.listeners) {
    count += this.listeners[type].length;
  }
  return count;
};
goog.events.ListenerMap.prototype.add = function(type, listener, callOnce, opt_useCapture, opt_listenerScope) {
  var typeStr = type.toString(), listenerArray = this.listeners[typeStr];
  listenerArray || (listenerArray = this.listeners[typeStr] = [], this.typeCount_++);
  var index = goog.events.ListenerMap.findListenerIndex_(listenerArray, listener, opt_useCapture, opt_listenerScope);
  if (-1 < index) {
    var listenerObj = listenerArray[index];
    callOnce || (listenerObj.callOnce = !1);
  } else {
    listenerObj = new goog.events.Listener(listener, null, this.src, typeStr, !!opt_useCapture, opt_listenerScope), listenerObj.callOnce = callOnce, listenerArray.push(listenerObj);
  }
  return listenerObj;
};
goog.events.ListenerMap.prototype.remove = function(type, listener, opt_useCapture, opt_listenerScope) {
  var typeStr = type.toString();
  if (!(typeStr in this.listeners)) {
    return !1;
  }
  var listenerArray = this.listeners[typeStr], index = goog.events.ListenerMap.findListenerIndex_(listenerArray, listener, opt_useCapture, opt_listenerScope);
  return -1 < index ? (listenerArray[index].markAsRemoved(), goog.array.removeAt(listenerArray, index), 0 == listenerArray.length && (delete this.listeners[typeStr], this.typeCount_--), !0) : !1;
};
goog.events.ListenerMap.prototype.removeByKey = function(listener) {
  var type = listener.type;
  if (!(type in this.listeners)) {
    return !1;
  }
  var removed = goog.array.remove(this.listeners[type], listener);
  removed && (listener.markAsRemoved(), 0 == this.listeners[type].length && (delete this.listeners[type], this.typeCount_--));
  return removed;
};
goog.events.ListenerMap.prototype.removeAll = function(opt_type) {
  var typeStr = opt_type && opt_type.toString(), count = 0, type;
  for (type in this.listeners) {
    if (!typeStr || type == typeStr) {
      for (var listenerArray = this.listeners[type], i = 0; i < listenerArray.length; i++) {
        ++count, listenerArray[i].markAsRemoved();
      }
      delete this.listeners[type];
      this.typeCount_--;
    }
  }
  return count;
};
goog.events.ListenerMap.prototype.getListeners = function(type, capture) {
  var listenerArray = this.listeners[type.toString()], rv = [];
  if (listenerArray) {
    for (var i = 0; i < listenerArray.length; ++i) {
      var listenerObj = listenerArray[i];
      listenerObj.capture == capture && rv.push(listenerObj);
    }
  }
  return rv;
};
goog.events.ListenerMap.prototype.getListener = function(type, listener, capture, opt_listenerScope) {
  var listenerArray = this.listeners[type.toString()], i = -1;
  listenerArray && (i = goog.events.ListenerMap.findListenerIndex_(listenerArray, listener, capture, opt_listenerScope));
  return -1 < i ? listenerArray[i] : null;
};
goog.events.ListenerMap.prototype.hasListener = function(opt_type, opt_capture) {
  var hasType = goog.isDef(opt_type), typeStr = hasType ? opt_type.toString() : "", hasCapture = goog.isDef(opt_capture);
  return goog.object.some(this.listeners, function(listenerArray, type) {
    for (var i = 0; i < listenerArray.length; ++i) {
      if (!(hasType && listenerArray[i].type != typeStr || hasCapture && listenerArray[i].capture != opt_capture)) {
        return !0;
      }
    }
    return !1;
  });
};
goog.events.ListenerMap.findListenerIndex_ = function(listenerArray, listener, opt_useCapture, opt_listenerScope) {
  for (var i = 0; i < listenerArray.length; ++i) {
    var listenerObj = listenerArray[i];
    if (!listenerObj.removed && listenerObj.listener == listener && listenerObj.capture == !!opt_useCapture && listenerObj.handler == opt_listenerScope) {
      return i;
    }
  }
  return -1;
};
goog.events.LISTENER_MAP_PROP_ = "closure_lm_" + (1e6 * Math.random() | 0);
goog.events.onString_ = "on";
goog.events.onStringMap_ = {};
goog.events.CaptureSimulationMode = {OFF_AND_FAIL:0, OFF_AND_SILENT:1, ON:2};
goog.events.CAPTURE_SIMULATION_MODE = 2;
goog.events.listenerCountEstimate_ = 0;
goog.events.listen = function(src, type, listener, opt_options, opt_handler) {
  if (opt_options && opt_options.once) {
    return goog.events.listenOnce(src, type, listener, opt_options, opt_handler);
  }
  if (goog.isArray(type)) {
    for (var i = 0; i < type.length; i++) {
      goog.events.listen(src, type[i], listener, opt_options, opt_handler);
    }
    return null;
  }
  listener = goog.events.wrapListener(listener);
  return goog.events.Listenable.isImplementedBy(src) ? src.listen(type, listener, goog.isObject(opt_options) ? !!opt_options.capture : !!opt_options, opt_handler) : goog.events.listen_(src, type, listener, !1, opt_options, opt_handler);
};
goog.events.listen_ = function(src, type, listener, callOnce, opt_options, opt_handler) {
  if (!type) {
    throw Error("Invalid event type");
  }
  var capture = goog.isObject(opt_options) ? !!opt_options.capture : !!opt_options;
  if (capture && !goog.events.BrowserFeature.HAS_W3C_EVENT_SUPPORT) {
    if (goog.events.CAPTURE_SIMULATION_MODE == goog.events.CaptureSimulationMode.OFF_AND_FAIL) {
      return goog.asserts.fail("Can not register capture listener in IE8-."), null;
    }
    if (goog.events.CAPTURE_SIMULATION_MODE == goog.events.CaptureSimulationMode.OFF_AND_SILENT) {
      return null;
    }
  }
  var listenerMap = goog.events.getListenerMap_(src);
  listenerMap || (src[goog.events.LISTENER_MAP_PROP_] = listenerMap = new goog.events.ListenerMap(src));
  var listenerObj = listenerMap.add(type, listener, callOnce, capture, opt_handler);
  if (listenerObj.proxy) {
    return listenerObj;
  }
  var proxy = goog.events.getProxy();
  listenerObj.proxy = proxy;
  proxy.src = src;
  proxy.listener = listenerObj;
  if (src.addEventListener) {
    goog.events.BrowserFeature.PASSIVE_EVENTS || (opt_options = capture), void 0 === opt_options && (opt_options = !1), src.addEventListener(type.toString(), proxy, opt_options);
  } else {
    if (src.attachEvent) {
      src.attachEvent(goog.events.getOnString_(type.toString()), proxy);
    } else {
      if (src.addListener && src.removeListener) {
        goog.asserts.assert("change" === type, "MediaQueryList only has a change event"), src.addListener(proxy);
      } else {
        throw Error("addEventListener and attachEvent are unavailable.");
      }
    }
  }
  goog.events.listenerCountEstimate_++;
  return listenerObj;
};
goog.events.getProxy = function() {
  var proxyCallbackFunction = goog.events.handleBrowserEvent_, f = goog.events.BrowserFeature.HAS_W3C_EVENT_SUPPORT ? function(eventObject) {
    return proxyCallbackFunction.call(f.src, f.listener, eventObject);
  } : function(eventObject) {
    var v = proxyCallbackFunction.call(f.src, f.listener, eventObject);
    if (!v) {
      return v;
    }
  };
  return f;
};
goog.events.listenOnce = function(src, type, listener, opt_options, opt_handler) {
  if (goog.isArray(type)) {
    for (var i = 0; i < type.length; i++) {
      goog.events.listenOnce(src, type[i], listener, opt_options, opt_handler);
    }
    return null;
  }
  listener = goog.events.wrapListener(listener);
  return goog.events.Listenable.isImplementedBy(src) ? src.listenOnce(type, listener, goog.isObject(opt_options) ? !!opt_options.capture : !!opt_options, opt_handler) : goog.events.listen_(src, type, listener, !0, opt_options, opt_handler);
};
goog.events.listenWithWrapper = function(src, wrapper, listener, opt_capt, opt_handler) {
  wrapper.listen(src, listener, opt_capt, opt_handler);
};
goog.events.unlisten = function(src, type, listener, opt_options, opt_handler) {
  if (goog.isArray(type)) {
    for (var i = 0; i < type.length; i++) {
      goog.events.unlisten(src, type[i], listener, opt_options, opt_handler);
    }
    return null;
  }
  var capture = goog.isObject(opt_options) ? !!opt_options.capture : !!opt_options;
  listener = goog.events.wrapListener(listener);
  if (goog.events.Listenable.isImplementedBy(src)) {
    return src.unlisten(type, listener, capture, opt_handler);
  }
  if (!src) {
    return !1;
  }
  var listenerMap = goog.events.getListenerMap_(src);
  if (listenerMap) {
    var listenerObj = listenerMap.getListener(type, listener, capture, opt_handler);
    if (listenerObj) {
      return goog.events.unlistenByKey(listenerObj);
    }
  }
  return !1;
};
goog.events.unlistenByKey = function(key) {
  if (goog.isNumber(key) || !key || key.removed) {
    return !1;
  }
  var src = key.src;
  if (goog.events.Listenable.isImplementedBy(src)) {
    return src.unlistenByKey(key);
  }
  var type = key.type, proxy = key.proxy;
  src.removeEventListener ? src.removeEventListener(type, proxy, key.capture) : src.detachEvent ? src.detachEvent(goog.events.getOnString_(type), proxy) : src.addListener && src.removeListener && src.removeListener(proxy);
  goog.events.listenerCountEstimate_--;
  var listenerMap = goog.events.getListenerMap_(src);
  listenerMap ? (listenerMap.removeByKey(key), 0 == listenerMap.getTypeCount() && (listenerMap.src = null, src[goog.events.LISTENER_MAP_PROP_] = null)) : key.markAsRemoved();
  return !0;
};
goog.events.unlistenWithWrapper = function(src, wrapper, listener, opt_capt, opt_handler) {
  wrapper.unlisten(src, listener, opt_capt, opt_handler);
};
goog.events.removeAll = function(obj, opt_type) {
  if (!obj) {
    return 0;
  }
  if (goog.events.Listenable.isImplementedBy(obj)) {
    return obj.removeAllListeners(opt_type);
  }
  var listenerMap = goog.events.getListenerMap_(obj);
  if (!listenerMap) {
    return 0;
  }
  var count = 0, typeStr = opt_type && opt_type.toString(), type;
  for (type in listenerMap.listeners) {
    if (!typeStr || type == typeStr) {
      for (var listeners = listenerMap.listeners[type].concat(), i = 0; i < listeners.length; ++i) {
        goog.events.unlistenByKey(listeners[i]) && ++count;
      }
    }
  }
  return count;
};
goog.events.getListeners = function(obj, type, capture) {
  if (goog.events.Listenable.isImplementedBy(obj)) {
    return obj.getListeners(type, capture);
  }
  if (!obj) {
    return [];
  }
  var listenerMap = goog.events.getListenerMap_(obj);
  return listenerMap ? listenerMap.getListeners(type, capture) : [];
};
goog.events.getListener = function(src, type, listener, opt_capt, opt_handler) {
  listener = goog.events.wrapListener(listener);
  var capture = !!opt_capt;
  if (goog.events.Listenable.isImplementedBy(src)) {
    return src.getListener(type, listener, capture, opt_handler);
  }
  if (!src) {
    return null;
  }
  var listenerMap = goog.events.getListenerMap_(src);
  return listenerMap ? listenerMap.getListener(type, listener, capture, opt_handler) : null;
};
goog.events.hasListener = function(obj, opt_type, opt_capture) {
  if (goog.events.Listenable.isImplementedBy(obj)) {
    return obj.hasListener(opt_type, opt_capture);
  }
  var listenerMap = goog.events.getListenerMap_(obj);
  return !!listenerMap && listenerMap.hasListener(opt_type, opt_capture);
};
goog.events.expose = function(e) {
  var str = [], key;
  for (key in e) {
    e[key] && e[key].id ? str.push(key + " = " + e[key] + " (" + e[key].id + ")") : str.push(key + " = " + e[key]);
  }
  return str.join("\n");
};
goog.events.getOnString_ = function(type) {
  return type in goog.events.onStringMap_ ? goog.events.onStringMap_[type] : goog.events.onStringMap_[type] = goog.events.onString_ + type;
};
goog.events.fireListeners = function(obj, type, capture, eventObject) {
  return goog.events.Listenable.isImplementedBy(obj) ? obj.fireListeners(type, capture, eventObject) : goog.events.fireListeners_(obj, type, capture, eventObject);
};
goog.events.fireListeners_ = function(obj, type, capture, eventObject) {
  var retval = !0, listenerMap = goog.events.getListenerMap_(obj);
  if (listenerMap) {
    var listenerArray = listenerMap.listeners[type.toString()];
    if (listenerArray) {
      listenerArray = listenerArray.concat();
      for (var i = 0; i < listenerArray.length; i++) {
        var listener = listenerArray[i];
        if (listener && listener.capture == capture && !listener.removed) {
          var result = goog.events.fireListener(listener, eventObject);
          retval = retval && !1 !== result;
        }
      }
    }
  }
  return retval;
};
goog.events.fireListener = function(listener, eventObject) {
  var listenerFn = listener.listener, listenerHandler = listener.handler || listener.src;
  listener.callOnce && goog.events.unlistenByKey(listener);
  return listenerFn.call(listenerHandler, eventObject);
};
goog.events.getTotalListenerCount = function() {
  return goog.events.listenerCountEstimate_;
};
goog.events.dispatchEvent = function(src, e) {
  goog.asserts.assert(goog.events.Listenable.isImplementedBy(src), "Can not use goog.events.dispatchEvent with non-goog.events.Listenable instance.");
  return src.dispatchEvent(e);
};
goog.events.protectBrowserEventEntryPoint = function(errorHandler) {
  goog.events.handleBrowserEvent_ = errorHandler.protectEntryPoint(goog.events.handleBrowserEvent_);
};
goog.events.handleBrowserEvent_ = function(listener, opt_evt) {
  if (listener.removed) {
    return !0;
  }
  if (!goog.events.BrowserFeature.HAS_W3C_EVENT_SUPPORT) {
    var ieEvent = opt_evt || goog.getObjectByName("window.event"), evt = new goog.events.BrowserEvent(ieEvent, this), retval = !0;
    if (goog.events.CAPTURE_SIMULATION_MODE == goog.events.CaptureSimulationMode.ON) {
      if (!goog.events.isMarkedIeEvent_(ieEvent)) {
        goog.events.markIeEvent_(ieEvent);
        for (var ancestors = [], parent = evt.currentTarget; parent; parent = parent.parentNode) {
          ancestors.push(parent);
        }
        for (var type = listener.type, i = ancestors.length - 1; !evt.propagationStopped_ && 0 <= i; i--) {
          evt.currentTarget = ancestors[i];
          var result = goog.events.fireListeners_(ancestors[i], type, !0, evt);
          retval = retval && result;
        }
        for (i = 0; !evt.propagationStopped_ && i < ancestors.length; i++) {
          evt.currentTarget = ancestors[i], result = goog.events.fireListeners_(ancestors[i], type, !1, evt), retval = retval && result;
        }
      }
    } else {
      retval = goog.events.fireListener(listener, evt);
    }
    return retval;
  }
  return goog.events.fireListener(listener, new goog.events.BrowserEvent(opt_evt, this));
};
goog.events.markIeEvent_ = function(e) {
  var useReturnValue = !1;
  if (0 == e.keyCode) {
    try {
      e.keyCode = -1;
      return;
    } catch (ex) {
      useReturnValue = !0;
    }
  }
  if (useReturnValue || void 0 == e.returnValue) {
    e.returnValue = !0;
  }
};
goog.events.isMarkedIeEvent_ = function(e) {
  return 0 > e.keyCode || void 0 != e.returnValue;
};
goog.events.uniqueIdCounter_ = 0;
goog.events.getUniqueId = function(identifier) {
  return identifier + "_" + goog.events.uniqueIdCounter_++;
};
goog.events.getListenerMap_ = function(src) {
  var listenerMap = src[goog.events.LISTENER_MAP_PROP_];
  return listenerMap instanceof goog.events.ListenerMap ? listenerMap : null;
};
goog.events.LISTENER_WRAPPER_PROP_ = "__closure_events_fn_" + (1e9 * Math.random() >>> 0);
goog.events.wrapListener = function(listener) {
  goog.asserts.assert(listener, "Listener can not be null.");
  if (goog.isFunction(listener)) {
    return listener;
  }
  goog.asserts.assert(listener.handleEvent, "An object listener must have handleEvent method.");
  listener[goog.events.LISTENER_WRAPPER_PROP_] || (listener[goog.events.LISTENER_WRAPPER_PROP_] = function(e) {
    return listener.handleEvent(e);
  });
  return listener[goog.events.LISTENER_WRAPPER_PROP_];
};
goog.debug.entryPointRegistry.register(function(transformer) {
  goog.events.handleBrowserEvent_ = transformer(goog.events.handleBrowserEvent_);
});
goog.events.EventTarget = function() {
  goog.Disposable.call(this);
  this.eventTargetListeners_ = new goog.events.ListenerMap(this);
  this.actualEventTarget_ = this;
  this.parentEventTarget_ = null;
};
goog.inherits(goog.events.EventTarget, goog.Disposable);
goog.events.Listenable.addImplementation(goog.events.EventTarget);
goog.events.EventTarget.MAX_ANCESTORS_ = 1000;
goog.events.EventTarget.prototype.getParentEventTarget = function() {
  return this.parentEventTarget_;
};
goog.events.EventTarget.prototype.setParentEventTarget = function(parent) {
  this.parentEventTarget_ = parent;
};
goog.events.EventTarget.prototype.addEventListener = function(type, handler, opt_capture, opt_handlerScope) {
  goog.events.listen(this, type, handler, opt_capture, opt_handlerScope);
};
goog.events.EventTarget.prototype.removeEventListener = function(type, handler, opt_capture, opt_handlerScope) {
  goog.events.unlisten(this, type, handler, opt_capture, opt_handlerScope);
};
goog.events.EventTarget.prototype.dispatchEvent = function(e) {
  this.assertInitialized_();
  var ancestor = this.getParentEventTarget();
  if (ancestor) {
    var ancestorsTree = [];
    for (var ancestorCount = 1; ancestor; ancestor = ancestor.getParentEventTarget()) {
      ancestorsTree.push(ancestor), goog.asserts.assert(++ancestorCount < goog.events.EventTarget.MAX_ANCESTORS_, "infinite loop");
    }
  }
  return goog.events.EventTarget.dispatchEventInternal_(this.actualEventTarget_, e, ancestorsTree);
};
goog.events.EventTarget.prototype.disposeInternal = function() {
  goog.events.EventTarget.superClass_.disposeInternal.call(this);
  this.removeAllListeners();
  this.parentEventTarget_ = null;
};
goog.events.EventTarget.prototype.listen = function(type, listener, opt_useCapture, opt_listenerScope) {
  this.assertInitialized_();
  return this.eventTargetListeners_.add(String(type), listener, !1, opt_useCapture, opt_listenerScope);
};
goog.events.EventTarget.prototype.listenOnce = function(type, listener, opt_useCapture, opt_listenerScope) {
  return this.eventTargetListeners_.add(String(type), listener, !0, opt_useCapture, opt_listenerScope);
};
goog.events.EventTarget.prototype.unlisten = function(type, listener, opt_useCapture, opt_listenerScope) {
  return this.eventTargetListeners_.remove(String(type), listener, opt_useCapture, opt_listenerScope);
};
goog.events.EventTarget.prototype.unlistenByKey = function(key) {
  return this.eventTargetListeners_.removeByKey(key);
};
goog.events.EventTarget.prototype.removeAllListeners = function(opt_type) {
  return this.eventTargetListeners_ ? this.eventTargetListeners_.removeAll(opt_type) : 0;
};
goog.events.EventTarget.prototype.fireListeners = function(type, capture, eventObject) {
  var listenerArray = this.eventTargetListeners_.listeners[String(type)];
  if (!listenerArray) {
    return !0;
  }
  listenerArray = listenerArray.concat();
  for (var rv = !0, i = 0; i < listenerArray.length; ++i) {
    var listener = listenerArray[i];
    if (listener && !listener.removed && listener.capture == capture) {
      var listenerFn = listener.listener, listenerHandler = listener.handler || listener.src;
      listener.callOnce && this.unlistenByKey(listener);
      rv = !1 !== listenerFn.call(listenerHandler, eventObject) && rv;
    }
  }
  return rv && 0 != eventObject.returnValue_;
};
goog.events.EventTarget.prototype.getListeners = function(type, capture) {
  return this.eventTargetListeners_.getListeners(String(type), capture);
};
goog.events.EventTarget.prototype.getListener = function(type, listener, capture, opt_listenerScope) {
  return this.eventTargetListeners_.getListener(String(type), listener, capture, opt_listenerScope);
};
goog.events.EventTarget.prototype.hasListener = function(opt_type, opt_capture) {
  return this.eventTargetListeners_.hasListener(goog.isDef(opt_type) ? String(opt_type) : void 0, opt_capture);
};
goog.events.EventTarget.prototype.setTargetForTesting = function(target) {
  this.actualEventTarget_ = target;
};
goog.events.EventTarget.prototype.assertInitialized_ = function() {
  goog.asserts.assert(this.eventTargetListeners_, "Event target is not initialized. Did you call the superclass (goog.events.EventTarget) constructor?");
};
goog.events.EventTarget.dispatchEventInternal_ = function(target, e, opt_ancestorsTree) {
  var type = e.type || e;
  if (goog.isString(e)) {
    e = new goog.events.Event(e, target);
  } else {
    if (e instanceof goog.events.Event) {
      e.target = e.target || target;
    } else {
      var oldEvent = e;
      e = new goog.events.Event(type, target);
      goog.object.extend(e, oldEvent);
    }
  }
  var rv = !0;
  if (opt_ancestorsTree) {
    for (var i = opt_ancestorsTree.length - 1; !e.propagationStopped_ && 0 <= i; i--) {
      var currentTarget = e.currentTarget = opt_ancestorsTree[i];
      rv = currentTarget.fireListeners(type, !0, e) && rv;
    }
  }
  e.propagationStopped_ || (currentTarget = e.currentTarget = target, rv = currentTarget.fireListeners(type, !0, e) && rv, e.propagationStopped_ || (rv = currentTarget.fireListeners(type, !1, e) && rv));
  if (opt_ancestorsTree) {
    for (i = 0; !e.propagationStopped_ && i < opt_ancestorsTree.length; i++) {
      currentTarget = e.currentTarget = opt_ancestorsTree[i], rv = currentTarget.fireListeners(type, !1, e) && rv;
    }
  }
  return rv;
};
goog.structs = {};
goog.structs.Collection = function() {
};
goog.functions = {};
goog.functions.constant = function(retValue) {
  return function() {
    return retValue;
  };
};
goog.functions.FALSE = function() {
  return !1;
};
goog.functions.TRUE = function() {
  return !0;
};
goog.functions.NULL = function() {
  return null;
};
goog.functions.identity = function(opt_returnValue, var_args) {
  return opt_returnValue;
};
goog.functions.error = function(message) {
  return function() {
    throw Error(message);
  };
};
goog.functions.fail = function(err) {
  return function() {
    throw err;
  };
};
goog.functions.lock = function(f, opt_numArgs) {
  opt_numArgs = opt_numArgs || 0;
  return function() {
    return f.apply(this, Array.prototype.slice.call(arguments, 0, opt_numArgs));
  };
};
goog.functions.nth = function(n) {
  return function() {
    return arguments[n];
  };
};
goog.functions.partialRight = function(fn, var_args) {
  var rightArgs = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.push.apply(newArgs, rightArgs);
    return fn.apply(this, newArgs);
  };
};
goog.functions.withReturnValue = function(f, retValue) {
  return goog.functions.sequence(f, goog.functions.constant(retValue));
};
goog.functions.equalTo = function(value, opt_useLooseComparison) {
  return function(other) {
    return opt_useLooseComparison ? value == other : value === other;
  };
};
goog.functions.compose = function(fn, var_args) {
  var functions = arguments, length = functions.length;
  return function() {
    var result;
    length && (result = functions[length - 1].apply(this, arguments));
    for (var i = length - 2; 0 <= i; i--) {
      result = functions[i].call(this, result);
    }
    return result;
  };
};
goog.functions.sequence = function(var_args) {
  var functions = arguments, length = functions.length;
  return function() {
    for (var result, i = 0; i < length; i++) {
      result = functions[i].apply(this, arguments);
    }
    return result;
  };
};
goog.functions.and = function(var_args) {
  var functions = arguments, length = functions.length;
  return function() {
    for (var i = 0; i < length; i++) {
      if (!functions[i].apply(this, arguments)) {
        return !1;
      }
    }
    return !0;
  };
};
goog.functions.or = function(var_args) {
  var functions = arguments, length = functions.length;
  return function() {
    for (var i = 0; i < length; i++) {
      if (functions[i].apply(this, arguments)) {
        return !0;
      }
    }
    return !1;
  };
};
goog.functions.not = function(f) {
  return function() {
    return !f.apply(this, arguments);
  };
};
goog.functions.create = function(constructor, var_args) {
  var temp = function() {
  };
  temp.prototype = constructor.prototype;
  var obj = new temp;
  constructor.apply(obj, Array.prototype.slice.call(arguments, 1));
  return obj;
};
goog.functions.CACHE_RETURN_VALUE = !0;
goog.functions.cacheReturnValue = function(fn) {
  var called = !1, value;
  return function() {
    if (!goog.functions.CACHE_RETURN_VALUE) {
      return fn();
    }
    called || (value = fn(), called = !0);
    return value;
  };
};
goog.functions.once = function(f) {
  var inner = f;
  return function() {
    if (inner) {
      var tmp = inner;
      inner = null;
      tmp();
    }
  };
};
goog.functions.debounce = function(f, interval, opt_scope) {
  var timeout = 0;
  return function(var_args) {
    goog.global.clearTimeout(timeout);
    var args = arguments;
    timeout = goog.global.setTimeout(function() {
      f.apply(opt_scope, args);
    }, interval);
  };
};
goog.functions.throttle = function(f, interval, opt_scope) {
  var timeout = 0, shouldFire = !1, args = [], handleTimeout = function() {
    timeout = 0;
    shouldFire && (shouldFire = !1, fire());
  }, fire = function() {
    timeout = goog.global.setTimeout(handleTimeout, interval);
    f.apply(opt_scope, args);
  };
  return function(var_args) {
    args = arguments;
    timeout ? shouldFire = !0 : fire();
  };
};
goog.functions.rateLimit = function(f, interval, opt_scope) {
  var timeout = 0, handleTimeout = function() {
    timeout = 0;
  };
  return function(var_args) {
    timeout || (timeout = goog.global.setTimeout(handleTimeout, interval), f.apply(opt_scope, arguments));
  };
};
goog.math = {};
goog.math.randomInt = function(a) {
  return Math.floor(Math.random() * a);
};
goog.math.uniformRandom = function(a, b) {
  return a + Math.random() * (b - a);
};
goog.math.clamp = function(value, min, max) {
  return Math.min(Math.max(value, min), max);
};
goog.math.modulo = function(a, b) {
  var r = a % b;
  return 0 > r * b ? r + b : r;
};
goog.math.lerp = function(a, b, x) {
  return a + x * (b - a);
};
goog.math.nearlyEquals = function(a, b, opt_tolerance) {
  return Math.abs(a - b) <= (opt_tolerance || 0.000001);
};
goog.math.standardAngle = function(angle) {
  return goog.math.modulo(angle, 360);
};
goog.math.standardAngleInRadians = function(angle) {
  return goog.math.modulo(angle, 2 * Math.PI);
};
goog.math.toRadians = function(angleDegrees) {
  return angleDegrees * Math.PI / 180;
};
goog.math.toDegrees = function(angleRadians) {
  return 180 * angleRadians / Math.PI;
};
goog.math.angleDx = function(degrees, radius) {
  return radius * Math.cos(goog.math.toRadians(degrees));
};
goog.math.angleDy = function(degrees, radius) {
  return radius * Math.sin(goog.math.toRadians(degrees));
};
goog.math.angle = function(x1, y1, x2, y2) {
  return goog.math.standardAngle(goog.math.toDegrees(Math.atan2(y2 - y1, x2 - x1)));
};
goog.math.angleDifference = function(startAngle, endAngle) {
  var d = goog.math.standardAngle(endAngle) - goog.math.standardAngle(startAngle);
  180 < d ? d -= 360 : -180 >= d && (d = 360 + d);
  return d;
};
goog.math.sign = function(x) {
  return 0 < x ? 1 : 0 > x ? -1 : x;
};
goog.math.longestCommonSubsequence = function(array1, array2, opt_compareFn, opt_collectorFn) {
  for (var compare = opt_compareFn || function(a, b) {
    return a == b;
  }, collect = opt_collectorFn || function(i1, i2) {
    return array1[i1];
  }, length1 = array1.length, length2 = array2.length, arr = [], i = 0; i < length1 + 1; i++) {
    arr[i] = [], arr[i][0] = 0;
  }
  for (var j = 0; j < length2 + 1; j++) {
    arr[0][j] = 0;
  }
  for (i = 1; i <= length1; i++) {
    for (j = 1; j <= length2; j++) {
      compare(array1[i - 1], array2[j - 1]) ? arr[i][j] = arr[i - 1][j - 1] + 1 : arr[i][j] = Math.max(arr[i - 1][j], arr[i][j - 1]);
    }
  }
  var result = [];
  i = length1;
  for (j = length2; 0 < i && 0 < j;) {
    compare(array1[i - 1], array2[j - 1]) ? (result.unshift(collect(i - 1, j - 1)), i--, j--) : arr[i - 1][j] > arr[i][j - 1] ? i-- : j--;
  }
  return result;
};
goog.math.sum = function(var_args) {
  return goog.array.reduce(arguments, function(sum, value) {
    return sum + value;
  }, 0);
};
goog.math.average = function(var_args) {
  return goog.math.sum.apply(null, arguments) / arguments.length;
};
goog.math.sampleVariance = function(var_args) {
  var sampleSize = arguments.length;
  if (2 > sampleSize) {
    return 0;
  }
  var mean = goog.math.average.apply(null, arguments);
  return goog.math.sum.apply(null, goog.array.map(arguments, function(val) {
    return Math.pow(val - mean, 2);
  })) / (sampleSize - 1);
};
goog.math.standardDeviation = function(var_args) {
  return Math.sqrt(goog.math.sampleVariance.apply(null, arguments));
};
goog.math.isInt = function(num) {
  return isFinite(num) && 0 == num % 1;
};
goog.math.isFiniteNumber = function(num) {
  return isFinite(num);
};
goog.math.isNegativeZero = function(num) {
  return 0 == num && 0 > 1 / num;
};
goog.math.log10Floor = function(num) {
  if (0 < num) {
    var x = Math.round(Math.log(num) * Math.LOG10E);
    return x - (parseFloat("1e" + x) > num ? 1 : 0);
  }
  return 0 == num ? -Infinity : NaN;
};
goog.math.safeFloor = function(num, opt_epsilon) {
  goog.asserts.assert(!goog.isDef(opt_epsilon) || 0 < opt_epsilon);
  return Math.floor(num + (opt_epsilon || 2e-15));
};
goog.math.safeCeil = function(num, opt_epsilon) {
  goog.asserts.assert(!goog.isDef(opt_epsilon) || 0 < opt_epsilon);
  return Math.ceil(num - (opt_epsilon || 2e-15));
};
goog.iter = {};
goog.iter.StopIteration = "StopIteration" in goog.global ? goog.global.StopIteration : {message:"StopIteration", stack:""};
goog.iter.Iterator = function() {
};
goog.iter.Iterator.prototype.next = function() {
  throw goog.iter.StopIteration;
};
goog.iter.Iterator.prototype.__iterator__ = function(opt_keys) {
  return this;
};
goog.iter.toIterator = function(iterable) {
  if (iterable instanceof goog.iter.Iterator) {
    return iterable;
  }
  if ("function" == typeof iterable.__iterator__) {
    return iterable.__iterator__(!1);
  }
  if (goog.isArrayLike(iterable)) {
    var i = 0, newIter = new goog.iter.Iterator;
    newIter.next = function() {
      for (;;) {
        if (i >= iterable.length) {
          throw goog.iter.StopIteration;
        }
        if (i in iterable) {
          return iterable[i++];
        }
        i++;
      }
    };
    return newIter;
  }
  throw Error("Not implemented");
};
goog.iter.forEach = function(iterable, f, opt_obj) {
  if (goog.isArrayLike(iterable)) {
    try {
      goog.array.forEach(iterable, f, opt_obj);
    } catch (ex) {
      if (ex !== goog.iter.StopIteration) {
        throw ex;
      }
    }
  } else {
    iterable = goog.iter.toIterator(iterable);
    try {
      for (;;) {
        f.call(opt_obj, iterable.next(), void 0, iterable);
      }
    } catch (ex$14) {
      if (ex$14 !== goog.iter.StopIteration) {
        throw ex$14;
      }
    }
  }
};
goog.iter.filter = function(iterable, f, opt_obj) {
  var iterator = goog.iter.toIterator(iterable), newIter = new goog.iter.Iterator;
  newIter.next = function() {
    for (;;) {
      var val = iterator.next();
      if (f.call(opt_obj, val, void 0, iterator)) {
        return val;
      }
    }
  };
  return newIter;
};
goog.iter.filterFalse = function(iterable, f, opt_obj) {
  return goog.iter.filter(iterable, goog.functions.not(f), opt_obj);
};
goog.iter.range = function(startOrStop, opt_stop, opt_step) {
  var start = 0, stop = startOrStop, step = opt_step || 1;
  1 < arguments.length && (start = startOrStop, stop = +opt_stop);
  if (0 == step) {
    throw Error("Range step argument must not be zero");
  }
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    if (0 < step && start >= stop || 0 > step && start <= stop) {
      throw goog.iter.StopIteration;
    }
    var rv = start;
    start += step;
    return rv;
  };
  return newIter;
};
goog.iter.join = function(iterable, deliminator) {
  return goog.iter.toArray(iterable).join(deliminator);
};
goog.iter.map = function(iterable, f, opt_obj) {
  var iterator = goog.iter.toIterator(iterable), newIter = new goog.iter.Iterator;
  newIter.next = function() {
    var val = iterator.next();
    return f.call(opt_obj, val, void 0, iterator);
  };
  return newIter;
};
goog.iter.reduce = function(iterable, f, val$jscomp$0, opt_obj) {
  var rval = val$jscomp$0;
  goog.iter.forEach(iterable, function(val) {
    rval = f.call(opt_obj, rval, val);
  });
  return rval;
};
goog.iter.some = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  try {
    for (;;) {
      if (f.call(opt_obj, iterable.next(), void 0, iterable)) {
        return !0;
      }
    }
  } catch (ex) {
    if (ex !== goog.iter.StopIteration) {
      throw ex;
    }
  }
  return !1;
};
goog.iter.every = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  try {
    for (;;) {
      if (!f.call(opt_obj, iterable.next(), void 0, iterable)) {
        return !1;
      }
    }
  } catch (ex) {
    if (ex !== goog.iter.StopIteration) {
      throw ex;
    }
  }
  return !0;
};
goog.iter.chain = function(var_args) {
  return goog.iter.chainFromIterable(arguments);
};
goog.iter.chainFromIterable = function(iterable) {
  var iterator = goog.iter.toIterator(iterable), iter = new goog.iter.Iterator, current = null;
  iter.next = function() {
    for (;;) {
      if (null == current) {
        var it = iterator.next();
        current = goog.iter.toIterator(it);
      }
      try {
        return current.next();
      } catch (ex) {
        if (ex !== goog.iter.StopIteration) {
          throw ex;
        }
        current = null;
      }
    }
  };
  return iter;
};
goog.iter.dropWhile = function(iterable, f, opt_obj) {
  var iterator = goog.iter.toIterator(iterable), newIter = new goog.iter.Iterator, dropping = !0;
  newIter.next = function() {
    for (;;) {
      var val = iterator.next();
      if (!dropping || !f.call(opt_obj, val, void 0, iterator)) {
        return dropping = !1, val;
      }
    }
  };
  return newIter;
};
goog.iter.takeWhile = function(iterable, f, opt_obj) {
  var iterator = goog.iter.toIterator(iterable), iter = new goog.iter.Iterator;
  iter.next = function() {
    var val = iterator.next();
    if (f.call(opt_obj, val, void 0, iterator)) {
      return val;
    }
    throw goog.iter.StopIteration;
  };
  return iter;
};
goog.iter.toArray = function(iterable) {
  if (goog.isArrayLike(iterable)) {
    return goog.array.toArray(iterable);
  }
  iterable = goog.iter.toIterator(iterable);
  var array = [];
  goog.iter.forEach(iterable, function(val) {
    array.push(val);
  });
  return array;
};
goog.iter.equals = function(iterable1, iterable2, opt_equalsFn) {
  var pairs = goog.iter.zipLongest({}, iterable1, iterable2), equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  return goog.iter.every(pairs, function(pair) {
    return equalsFn(pair[0], pair[1]);
  });
};
goog.iter.nextOrValue = function(iterable, defaultValue) {
  try {
    return goog.iter.toIterator(iterable).next();
  } catch (e) {
    if (e != goog.iter.StopIteration) {
      throw e;
    }
    return defaultValue;
  }
};
goog.iter.product = function(var_args) {
  if (goog.array.some(arguments, function(arr) {
    return !arr.length;
  }) || !arguments.length) {
    return new goog.iter.Iterator;
  }
  var iter = new goog.iter.Iterator, arrays = arguments, indicies = goog.array.repeat(0, arrays.length);
  iter.next = function() {
    if (indicies) {
      for (var retVal = goog.array.map(indicies, function(valueIndex, arrayIndex) {
        return arrays[arrayIndex][valueIndex];
      }), i = indicies.length - 1; 0 <= i; i--) {
        goog.asserts.assert(indicies);
        if (indicies[i] < arrays[i].length - 1) {
          indicies[i]++;
          break;
        }
        if (0 == i) {
          indicies = null;
          break;
        }
        indicies[i] = 0;
      }
      return retVal;
    }
    throw goog.iter.StopIteration;
  };
  return iter;
};
goog.iter.cycle = function(iterable) {
  var baseIterator = goog.iter.toIterator(iterable), cache = [], cacheIndex = 0, iter = new goog.iter.Iterator, useCache = !1;
  iter.next = function() {
    var returnElement = null;
    if (!useCache) {
      try {
        return returnElement = baseIterator.next(), cache.push(returnElement), returnElement;
      } catch (e) {
        if (e != goog.iter.StopIteration || goog.array.isEmpty(cache)) {
          throw e;
        }
        useCache = !0;
      }
    }
    returnElement = cache[cacheIndex];
    cacheIndex = (cacheIndex + 1) % cache.length;
    return returnElement;
  };
  return iter;
};
goog.iter.count = function(opt_start, opt_step) {
  var counter = opt_start || 0, step = goog.isDef(opt_step) ? opt_step : 1, iter = new goog.iter.Iterator;
  iter.next = function() {
    var returnValue = counter;
    counter += step;
    return returnValue;
  };
  return iter;
};
goog.iter.repeat = function(value) {
  var iter = new goog.iter.Iterator;
  iter.next = goog.functions.constant(value);
  return iter;
};
goog.iter.accumulate = function(iterable) {
  var iterator = goog.iter.toIterator(iterable), total = 0, iter = new goog.iter.Iterator;
  iter.next = function() {
    return total += iterator.next();
  };
  return iter;
};
goog.iter.zip = function(var_args) {
  var args = arguments, iter = new goog.iter.Iterator;
  if (0 < args.length) {
    var iterators = goog.array.map(args, goog.iter.toIterator);
    iter.next = function() {
      return goog.array.map(iterators, function(it) {
        return it.next();
      });
    };
  }
  return iter;
};
goog.iter.zipLongest = function(fillValue, var_args) {
  var args = goog.array.slice(arguments, 1), iter = new goog.iter.Iterator;
  if (0 < args.length) {
    var iterators = goog.array.map(args, goog.iter.toIterator);
    iter.next = function() {
      var iteratorsHaveValues = !1, arr = goog.array.map(iterators, function(it) {
        try {
          var returnValue = it.next();
          iteratorsHaveValues = !0;
        } catch (ex) {
          if (ex !== goog.iter.StopIteration) {
            throw ex;
          }
          returnValue = fillValue;
        }
        return returnValue;
      });
      if (!iteratorsHaveValues) {
        throw goog.iter.StopIteration;
      }
      return arr;
    };
  }
  return iter;
};
goog.iter.compress = function(iterable, selectors) {
  var selectorIterator = goog.iter.toIterator(selectors);
  return goog.iter.filter(iterable, function() {
    return !!selectorIterator.next();
  });
};
goog.iter.GroupByIterator_ = function(iterable, opt_keyFunc) {
  this.iterator = goog.iter.toIterator(iterable);
  this.keyFunc = opt_keyFunc || goog.functions.identity;
};
goog.inherits(goog.iter.GroupByIterator_, goog.iter.Iterator);
goog.iter.GroupByIterator_.prototype.next = function() {
  for (; this.currentKey == this.targetKey;) {
    this.currentValue = this.iterator.next(), this.currentKey = this.keyFunc(this.currentValue);
  }
  this.targetKey = this.currentKey;
  return [this.currentKey, this.groupItems_(this.targetKey)];
};
goog.iter.GroupByIterator_.prototype.groupItems_ = function(targetKey) {
  for (var arr = []; this.currentKey == targetKey;) {
    arr.push(this.currentValue);
    try {
      this.currentValue = this.iterator.next();
    } catch (ex) {
      if (ex !== goog.iter.StopIteration) {
        throw ex;
      }
      break;
    }
    this.currentKey = this.keyFunc(this.currentValue);
  }
  return arr;
};
goog.iter.groupBy = function(iterable, opt_keyFunc) {
  return new goog.iter.GroupByIterator_(iterable, opt_keyFunc);
};
goog.iter.starMap = function(iterable, f, opt_obj) {
  var iterator = goog.iter.toIterator(iterable), iter = new goog.iter.Iterator;
  iter.next = function() {
    var args = goog.iter.toArray(iterator.next());
    return f.apply(opt_obj, goog.array.concat(args, void 0, iterator));
  };
  return iter;
};
goog.iter.tee = function(iterable, opt_num) {
  var iterator = goog.iter.toIterator(iterable), num = goog.isNumber(opt_num) ? opt_num : 2, buffers = goog.array.map(goog.array.range(num), function() {
    return [];
  }), addNextIteratorValueToBuffers = function() {
    var val = iterator.next();
    goog.array.forEach(buffers, function(buffer) {
      buffer.push(val);
    });
  };
  return goog.array.map(buffers, function(buffer) {
    var iter = new goog.iter.Iterator;
    iter.next = function() {
      goog.array.isEmpty(buffer) && addNextIteratorValueToBuffers();
      goog.asserts.assert(!goog.array.isEmpty(buffer));
      return buffer.shift();
    };
    return iter;
  });
};
goog.iter.enumerate = function(iterable, opt_start) {
  return goog.iter.zip(goog.iter.count(opt_start), iterable);
};
goog.iter.limit = function(iterable, limitSize) {
  goog.asserts.assert(goog.math.isInt(limitSize) && 0 <= limitSize);
  var iterator = goog.iter.toIterator(iterable), iter = new goog.iter.Iterator, remaining = limitSize;
  iter.next = function() {
    if (0 < remaining--) {
      return iterator.next();
    }
    throw goog.iter.StopIteration;
  };
  return iter;
};
goog.iter.consume = function(iterable, count) {
  goog.asserts.assert(goog.math.isInt(count) && 0 <= count);
  for (var iterator = goog.iter.toIterator(iterable); 0 < count--;) {
    goog.iter.nextOrValue(iterator, null);
  }
  return iterator;
};
goog.iter.slice = function(iterable, start, opt_end) {
  goog.asserts.assert(goog.math.isInt(start) && 0 <= start);
  var iterator = goog.iter.consume(iterable, start);
  goog.isNumber(opt_end) && (goog.asserts.assert(goog.math.isInt(opt_end) && opt_end >= start), iterator = goog.iter.limit(iterator, opt_end - start));
  return iterator;
};
goog.iter.hasDuplicates_ = function(arr) {
  var deduped = [];
  goog.array.removeDuplicates(arr, deduped);
  return arr.length != deduped.length;
};
goog.iter.permutations = function(iterable, opt_length) {
  var elements = goog.iter.toArray(iterable), length = goog.isNumber(opt_length) ? opt_length : elements.length, sets = goog.array.repeat(elements, length), product = goog.iter.product.apply(void 0, sets);
  return goog.iter.filter(product, function(arr) {
    return !goog.iter.hasDuplicates_(arr);
  });
};
goog.iter.combinations = function(iterable, length) {
  function getIndexFromElements(index) {
    return elements[index];
  }
  var elements = goog.iter.toArray(iterable), indexes = goog.iter.range(elements.length), indexIterator = goog.iter.permutations(indexes, length), sortedIndexIterator = goog.iter.filter(indexIterator, function(arr) {
    return goog.array.isSorted(arr);
  }), iter = new goog.iter.Iterator;
  iter.next = function() {
    return goog.array.map(sortedIndexIterator.next(), getIndexFromElements);
  };
  return iter;
};
goog.iter.combinationsWithReplacement = function(iterable, length) {
  function getIndexFromElements(index) {
    return elements[index];
  }
  var elements = goog.iter.toArray(iterable), indexes = goog.array.range(elements.length), sets = goog.array.repeat(indexes, length), indexIterator = goog.iter.product.apply(void 0, sets), sortedIndexIterator = goog.iter.filter(indexIterator, function(arr) {
    return goog.array.isSorted(arr);
  }), iter = new goog.iter.Iterator;
  iter.next = function() {
    return goog.array.map(sortedIndexIterator.next(), getIndexFromElements);
  };
  return iter;
};
goog.structs.Map = function(opt_map, var_args) {
  this.map_ = {};
  this.keys_ = [];
  this.version_ = this.count_ = 0;
  var argLength = arguments.length;
  if (1 < argLength) {
    if (argLength % 2) {
      throw Error("Uneven number of arguments");
    }
    for (var i = 0; i < argLength; i += 2) {
      this.set(arguments[i], arguments[i + 1]);
    }
  } else {
    opt_map && this.addAll(opt_map);
  }
};
goog.structs.Map.prototype.getCount = function() {
  return this.count_;
};
goog.structs.Map.prototype.getValues = function() {
  this.cleanupKeysArray_();
  for (var rv = [], i = 0; i < this.keys_.length; i++) {
    rv.push(this.map_[this.keys_[i]]);
  }
  return rv;
};
goog.structs.Map.prototype.getKeys = function() {
  this.cleanupKeysArray_();
  return this.keys_.concat();
};
goog.structs.Map.prototype.containsKey = function(key) {
  return goog.structs.Map.hasKey_(this.map_, key);
};
goog.structs.Map.prototype.containsValue = function(val) {
  for (var i = 0; i < this.keys_.length; i++) {
    var key = this.keys_[i];
    if (goog.structs.Map.hasKey_(this.map_, key) && this.map_[key] == val) {
      return !0;
    }
  }
  return !1;
};
goog.structs.Map.prototype.equals = function(otherMap, opt_equalityFn) {
  if (this === otherMap) {
    return !0;
  }
  if (this.count_ != otherMap.getCount()) {
    return !1;
  }
  var equalityFn = opt_equalityFn || goog.structs.Map.defaultEquals;
  this.cleanupKeysArray_();
  for (var key, i = 0; key = this.keys_[i]; i++) {
    if (!equalityFn(this.get(key), otherMap.get(key))) {
      return !1;
    }
  }
  return !0;
};
goog.structs.Map.defaultEquals = function(a, b) {
  return a === b;
};
goog.structs.Map.prototype.isEmpty = function() {
  return 0 == this.count_;
};
goog.structs.Map.prototype.clear = function() {
  this.map_ = {};
  this.version_ = this.count_ = this.keys_.length = 0;
};
goog.structs.Map.prototype.remove = function(key) {
  return goog.structs.Map.hasKey_(this.map_, key) ? (delete this.map_[key], this.count_--, this.version_++, this.keys_.length > 2 * this.count_ && this.cleanupKeysArray_(), !0) : !1;
};
goog.structs.Map.prototype.cleanupKeysArray_ = function() {
  if (this.count_ != this.keys_.length) {
    for (var srcIndex = 0, destIndex = 0; srcIndex < this.keys_.length;) {
      var key = this.keys_[srcIndex];
      goog.structs.Map.hasKey_(this.map_, key) && (this.keys_[destIndex++] = key);
      srcIndex++;
    }
    this.keys_.length = destIndex;
  }
  if (this.count_ != this.keys_.length) {
    var seen = {};
    for (destIndex = srcIndex = 0; srcIndex < this.keys_.length;) {
      key = this.keys_[srcIndex], goog.structs.Map.hasKey_(seen, key) || (this.keys_[destIndex++] = key, seen[key] = 1), srcIndex++;
    }
    this.keys_.length = destIndex;
  }
};
goog.structs.Map.prototype.get = function(key, opt_val) {
  return goog.structs.Map.hasKey_(this.map_, key) ? this.map_[key] : opt_val;
};
goog.structs.Map.prototype.set = function(key, value) {
  goog.structs.Map.hasKey_(this.map_, key) || (this.count_++, this.keys_.push(key), this.version_++);
  this.map_[key] = value;
};
goog.structs.Map.prototype.addAll = function(map) {
  if (map instanceof goog.structs.Map) {
    for (var keys = map.getKeys(), i = 0; i < keys.length; i++) {
      this.set(keys[i], map.get(keys[i]));
    }
  } else {
    for (var key in map) {
      this.set(key, map[key]);
    }
  }
};
goog.structs.Map.prototype.forEach = function(f, opt_obj) {
  for (var keys = this.getKeys(), i = 0; i < keys.length; i++) {
    var key = keys[i], value = this.get(key);
    f.call(opt_obj, value, key, this);
  }
};
goog.structs.Map.prototype.clone = function() {
  return new goog.structs.Map(this);
};
goog.structs.Map.prototype.transpose = function() {
  for (var transposed = new goog.structs.Map, i = 0; i < this.keys_.length; i++) {
    var key = this.keys_[i];
    transposed.set(this.map_[key], key);
  }
  return transposed;
};
goog.structs.Map.prototype.toObject = function() {
  this.cleanupKeysArray_();
  for (var obj = {}, i = 0; i < this.keys_.length; i++) {
    var key = this.keys_[i];
    obj[key] = this.map_[key];
  }
  return obj;
};
goog.structs.Map.prototype.getKeyIterator = function() {
  return this.__iterator__(!0);
};
goog.structs.Map.prototype.getValueIterator = function() {
  return this.__iterator__(!1);
};
goog.structs.Map.prototype.__iterator__ = function(opt_keys) {
  this.cleanupKeysArray_();
  var i = 0, version = this.version_, selfObj = this, newIter = new goog.iter.Iterator;
  newIter.next = function() {
    if (version != selfObj.version_) {
      throw Error("The map has changed since the iterator was created");
    }
    if (i >= selfObj.keys_.length) {
      throw goog.iter.StopIteration;
    }
    var key = selfObj.keys_[i++];
    return opt_keys ? key : selfObj.map_[key];
  };
  return newIter;
};
goog.structs.Map.hasKey_ = function(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
};
goog.structs.getCount = function(col) {
  return col.getCount && "function" == typeof col.getCount ? col.getCount() : goog.isArrayLike(col) || goog.isString(col) ? col.length : goog.object.getCount(col);
};
goog.structs.getValues = function(col) {
  if (col.getValues && "function" == typeof col.getValues) {
    return col.getValues();
  }
  if (goog.isString(col)) {
    return col.split("");
  }
  if (goog.isArrayLike(col)) {
    for (var rv = [], l = col.length, i = 0; i < l; i++) {
      rv.push(col[i]);
    }
    return rv;
  }
  return goog.object.getValues(col);
};
goog.structs.getKeys = function(col) {
  if (col.getKeys && "function" == typeof col.getKeys) {
    return col.getKeys();
  }
  if (!col.getValues || "function" != typeof col.getValues) {
    if (goog.isArrayLike(col) || goog.isString(col)) {
      for (var rv = [], l = col.length, i = 0; i < l; i++) {
        rv.push(i);
      }
      return rv;
    }
    return goog.object.getKeys(col);
  }
};
goog.structs.contains = function(col, val) {
  return col.contains && "function" == typeof col.contains ? col.contains(val) : col.containsValue && "function" == typeof col.containsValue ? col.containsValue(val) : goog.isArrayLike(col) || goog.isString(col) ? goog.array.contains(col, val) : goog.object.containsValue(col, val);
};
goog.structs.isEmpty = function(col) {
  return col.isEmpty && "function" == typeof col.isEmpty ? col.isEmpty() : goog.isArrayLike(col) || goog.isString(col) ? goog.array.isEmpty(col) : goog.object.isEmpty(col);
};
goog.structs.clear = function(col) {
  col.clear && "function" == typeof col.clear ? col.clear() : goog.isArrayLike(col) ? goog.array.clear(col) : goog.object.clear(col);
};
goog.structs.forEach = function(col, f, opt_obj) {
  if (col.forEach && "function" == typeof col.forEach) {
    col.forEach(f, opt_obj);
  } else {
    if (goog.isArrayLike(col) || goog.isString(col)) {
      goog.array.forEach(col, f, opt_obj);
    } else {
      for (var keys = goog.structs.getKeys(col), values = goog.structs.getValues(col), l = values.length, i = 0; i < l; i++) {
        f.call(opt_obj, values[i], keys && keys[i], col);
      }
    }
  }
};
goog.structs.filter = function(col, f, opt_obj) {
  if ("function" == typeof col.filter) {
    return col.filter(f, opt_obj);
  }
  if (goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.filter(col, f, opt_obj);
  }
  var keys = goog.structs.getKeys(col), values = goog.structs.getValues(col), l = values.length;
  if (keys) {
    var rv = {};
    for (var i = 0; i < l; i++) {
      f.call(opt_obj, values[i], keys[i], col) && (rv[keys[i]] = values[i]);
    }
  } else {
    for (rv = [], i = 0; i < l; i++) {
      f.call(opt_obj, values[i], void 0, col) && rv.push(values[i]);
    }
  }
  return rv;
};
goog.structs.map = function(col, f, opt_obj) {
  if ("function" == typeof col.map) {
    return col.map(f, opt_obj);
  }
  if (goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.map(col, f, opt_obj);
  }
  var keys = goog.structs.getKeys(col), values = goog.structs.getValues(col), l = values.length;
  if (keys) {
    var rv = {};
    for (var i = 0; i < l; i++) {
      rv[keys[i]] = f.call(opt_obj, values[i], keys[i], col);
    }
  } else {
    for (rv = [], i = 0; i < l; i++) {
      rv[i] = f.call(opt_obj, values[i], void 0, col);
    }
  }
  return rv;
};
goog.structs.some = function(col, f, opt_obj) {
  if ("function" == typeof col.some) {
    return col.some(f, opt_obj);
  }
  if (goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.some(col, f, opt_obj);
  }
  for (var keys = goog.structs.getKeys(col), values = goog.structs.getValues(col), l = values.length, i = 0; i < l; i++) {
    if (f.call(opt_obj, values[i], keys && keys[i], col)) {
      return !0;
    }
  }
  return !1;
};
goog.structs.every = function(col, f, opt_obj) {
  if ("function" == typeof col.every) {
    return col.every(f, opt_obj);
  }
  if (goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.every(col, f, opt_obj);
  }
  for (var keys = goog.structs.getKeys(col), values = goog.structs.getValues(col), l = values.length, i = 0; i < l; i++) {
    if (!f.call(opt_obj, values[i], keys && keys[i], col)) {
      return !1;
    }
  }
  return !0;
};
goog.structs.Set = function(opt_values) {
  this.map_ = new goog.structs.Map;
  opt_values && this.addAll(opt_values);
};
goog.structs.Set.getUid_ = goog.getUid;
goog.structs.Set.getKey_ = function(val) {
  var type = typeof val;
  return "object" == type && val || "function" == type ? "o" + goog.structs.Set.getUid_(val) : type.substr(0, 1) + val;
};
goog.structs.Set.prototype.getCount = function() {
  return this.map_.getCount();
};
goog.structs.Set.prototype.add = function(element) {
  this.map_.set(goog.structs.Set.getKey_(element), element);
};
goog.structs.Set.prototype.addAll = function(col) {
  for (var values = goog.structs.getValues(col), l = values.length, i = 0; i < l; i++) {
    this.add(values[i]);
  }
};
goog.structs.Set.prototype.removeAll = function(col) {
  for (var values = goog.structs.getValues(col), l = values.length, i = 0; i < l; i++) {
    this.remove(values[i]);
  }
};
goog.structs.Set.prototype.remove = function(element) {
  return this.map_.remove(goog.structs.Set.getKey_(element));
};
goog.structs.Set.prototype.clear = function() {
  this.map_.clear();
};
goog.structs.Set.prototype.isEmpty = function() {
  return this.map_.isEmpty();
};
goog.structs.Set.prototype.contains = function(element) {
  return this.map_.containsKey(goog.structs.Set.getKey_(element));
};
goog.structs.Set.prototype.containsAll = function(col) {
  return goog.structs.every(col, this.contains, this);
};
goog.structs.Set.prototype.intersection = function(col) {
  for (var result = new goog.structs.Set, values = goog.structs.getValues(col), i = 0; i < values.length; i++) {
    var value = values[i];
    this.contains(value) && result.add(value);
  }
  return result;
};
goog.structs.Set.prototype.difference = function(col) {
  var result = this.clone();
  result.removeAll(col);
  return result;
};
goog.structs.Set.prototype.getValues = function() {
  return this.map_.getValues();
};
goog.structs.Set.prototype.clone = function() {
  return new goog.structs.Set(this);
};
goog.structs.Set.prototype.equals = function(col) {
  return this.getCount() == goog.structs.getCount(col) && this.isSubsetOf(col);
};
goog.structs.Set.prototype.isSubsetOf = function(col) {
  var colCount = goog.structs.getCount(col);
  if (this.getCount() > colCount) {
    return !1;
  }
  !(col instanceof goog.structs.Set) && 5 < colCount && (col = new goog.structs.Set(col));
  return goog.structs.every(this, function(value) {
    return goog.structs.contains(col, value);
  });
};
goog.structs.Set.prototype.__iterator__ = function(opt_keys) {
  return this.map_.__iterator__(!1);
};
var ee = {AbstractOverlay:function(url, mapId, token, opt_init, opt_profiler) {
  goog.events.EventTarget.call(this);
  this.mapId = mapId;
  this.token = token;
  this.tilesLoading = [];
  this.tilesFailed = new goog.structs.Set;
  this.tileCounter = 0;
  this.url = url;
}};
goog.inherits(ee.AbstractOverlay, goog.events.EventTarget);
ee.AbstractOverlay.EventType = {TILE_LOADED:"tileevent"};
ee.AbstractOverlay.prototype.getTileId = function(coord, zoom) {
  var maxCoord = 1 << zoom, x = coord.x % maxCoord;
  0 > x && (x += maxCoord);
  return [this.mapId, zoom, x, coord.y].join("/");
};
ee.AbstractOverlay.prototype.getLoadingTilesCount = function() {
  return this.tilesLoading.length;
};
ee.AbstractOverlay.prototype.getFailedTilesCount = function() {
  return this.tilesFailed.getCount();
};
ee.TileEvent = function(count) {
  goog.events.Event.call(this, ee.AbstractOverlay.EventType.TILE_LOADED);
  this.count = count;
};
goog.inherits(ee.TileEvent, goog.events.Event);
var googleapidiscovery = {earthengine:{}};
googleapidiscovery.earthengine.v1 = {};
googleapidiscovery.earthengine.v1.rest = {kind:"discovery#restDescription", name:"earthengine", version:"v1", rootUrl:"https://earthengine.googleapis.com/", servicePath:"", batchPath:"batch", id:"earthengine:v1", parameters:{"$.xgafv":{location:"query", required:!1}, access_token:{location:"query", required:!1}, alt:{location:"query", required:!1}, callback:{location:"query", required:!1}, fields:{location:"query", required:!1}, key:{location:"query", required:!1}, oauth_token:{location:"query", 
required:!1}, prettyPrint:{location:"query", required:!1}, quotaUser:{location:"query", required:!1}, uploadType:{location:"query", required:!1}, upload_protocol:{location:"query", required:!1}}, resources:{algorithms:{methods:{list:{id:"earthengine.algorithms.list", path:"v1/algorithms", httpMethod:"GET"}}}, assets:{methods:{copy:{id:"earthengine.assets.copy", path:"v1/{+sourceName}:copy", httpMethod:"POST", request:{$ref:"CopyAssetRequest"}, parameters:{sourceName:{location:"path", required:!0}}}, 
create:{id:"earthengine.assets.create", path:"v1/assets", httpMethod:"POST", request:{$ref:"EarthEngineAsset"}, parameters:{parent:{location:"query", required:!1}, assetId:{location:"query", required:!1}, overwrite:{location:"query", required:!1}}}, "delete":{id:"earthengine.assets.delete", path:"v1/{+name}", httpMethod:"DELETE", parameters:{name:{location:"path", required:!0}}}, get:{id:"earthengine.assets.get", path:"v1/{+name}", httpMethod:"GET", parameters:{name:{location:"path", required:!0}, 
path:{location:"query", required:!1}}}, getPixels:{id:"earthengine.assets.getPixels", path:"v1/{+name}:getPixels", httpMethod:"POST", request:{$ref:"GetPixelsRequest"}, parameters:{name:{location:"path", required:!0}}}, ingestImage:{id:"earthengine.assets.ingestImage", path:"v1/assets:ingestImage", httpMethod:"POST", request:{$ref:"IngestImageRequest"}}, ingestTable:{id:"earthengine.assets.ingestTable", path:"v1/assets:ingestTable", httpMethod:"POST", request:{$ref:"IngestTableRequest"}}, list:{id:"earthengine.assets.list", 
path:"v1/{+name}:list", httpMethod:"GET", parameters:{name:{location:"path", required:!0}, parentPath:{location:"query", required:!1}, pageSize:{location:"query", required:!1}, pageToken:{location:"query", required:!1}}}, listFeatures:{id:"earthengine.assets.listFeatures", path:"v1/{+name}:listFeatures", httpMethod:"GET", parameters:{name:{location:"path", required:!0}, pageSize:{location:"query", required:!1}, pageToken:{location:"query", required:!1}, region:{location:"query", required:!1}, filter:{location:"query", 
required:!1}}}, listImages:{id:"earthengine.assets.listImages", path:"v1/{+name}:listImages", httpMethod:"GET", parameters:{name:{location:"path", required:!0}, parentPath:{location:"query", required:!1}, pageSize:{location:"query", required:!1}, pageToken:{location:"query", required:!1}, startTime:{location:"query", required:!1}, endTime:{location:"query", required:!1}, region:{location:"query", required:!1}, filter:{location:"query", required:!1}, view:{location:"query", required:!1}}}, move:{id:"earthengine.assets.move", 
path:"v1/{+sourceName}:move", httpMethod:"POST", request:{$ref:"MoveAssetRequest"}, parameters:{sourceName:{location:"path", required:!0}}}, patch:{id:"earthengine.assets.patch", path:"v1/{+name}", httpMethod:"PATCH", request:{$ref:"UpdateAssetRequest"}, parameters:{name:{location:"path", required:!0}}}}}, image:{methods:{compute:{id:"earthengine.image.compute", path:"v1/image:compute", httpMethod:"POST", request:{$ref:"ComputeImageRequest"}}, "export":{id:"earthengine.image.export", path:"v1/image:export", 
httpMethod:"POST", request:{$ref:"ExportImageRequest"}}, ingest:{id:"earthengine.image.ingest", path:"v1/image:ingest", httpMethod:"POST", request:{$ref:"IngestImageRequest"}}}}, map:{methods:{"export":{id:"earthengine.map.export", path:"v1/map:export", httpMethod:"POST", request:{$ref:"ExportMapRequest"}}}}, operations:{methods:{cancel:{id:"earthengine.operations.cancel", path:"v1/{+name}:cancel", httpMethod:"POST", request:{$ref:"CancelOperationRequest"}, parameters:{name:{location:"path", required:!0}}}, 
"delete":{id:"earthengine.operations.delete", path:"v1/{+name}", httpMethod:"DELETE", parameters:{name:{location:"path", required:!0}}}, get:{id:"earthengine.operations.get", path:"v1/{+name}", httpMethod:"GET", parameters:{name:{location:"path", required:!0}}}, list:{id:"earthengine.operations.list", path:"v1/{+name}", httpMethod:"GET", parameters:{name:{location:"path", required:!0}, filter:{location:"query", required:!1}, pageSize:{location:"query", required:!1}, pageToken:{location:"query", required:!1}}}, 
wait:{id:"earthengine.operations.wait", path:"v1/{+name}:wait", httpMethod:"POST", request:{$ref:"WaitOperationRequest"}, parameters:{name:{location:"path", required:!0}}}}}, projects:{methods:{}, resources:{assets:{methods:{copy:{id:"earthengine.projects.assets.copy", path:"v1/{+sourceName}:copy", httpMethod:"POST", request:{$ref:"CopyAssetRequest"}, parameters:{sourceName:{location:"path", required:!0}}}, create:{id:"earthengine.projects.assets.create", path:"v1/{+parent}/assets", httpMethod:"POST", 
request:{$ref:"EarthEngineAsset"}, parameters:{parent:{location:"path", required:!0}, assetId:{location:"query", required:!1}, overwrite:{location:"query", required:!1}}}, "delete":{id:"earthengine.projects.assets.delete", path:"v1/{+name}", httpMethod:"DELETE", parameters:{name:{location:"path", required:!0}}}, get:{id:"earthengine.projects.assets.get", path:"v1/{+name}", httpMethod:"GET", parameters:{name:{location:"path", required:!0}, path:{location:"query", required:!1}}}, getIamPolicy:{id:"earthengine.projects.assets.getIamPolicy", 
path:"v1/{+resource}:getIamPolicy", httpMethod:"POST", request:{$ref:"GetIamPolicyRequest"}, parameters:{resource:{location:"path", required:!0}}}, getPixels:{id:"earthengine.projects.assets.getPixels", path:"v1/{+name}:getPixels", httpMethod:"POST", request:{$ref:"GetPixelsRequest"}, parameters:{name:{location:"path", required:!0}}}, list:{id:"earthengine.projects.assets.list", path:"v1/{+name}:list", httpMethod:"GET", parameters:{name:{location:"path", required:!0}, parentPath:{location:"query", 
required:!1}, pageSize:{location:"query", required:!1}, pageToken:{location:"query", required:!1}}}, listFeatures:{id:"earthengine.projects.assets.listFeatures", path:"v1/{+name}:listFeatures", httpMethod:"GET", parameters:{name:{location:"path", required:!0}, pageSize:{location:"query", required:!1}, pageToken:{location:"query", required:!1}, region:{location:"query", required:!1}, filter:{location:"query", required:!1}}}, listImages:{id:"earthengine.projects.assets.listImages", path:"v1/{+name}:listImages", 
httpMethod:"GET", parameters:{name:{location:"path", required:!0}, parentPath:{location:"query", required:!1}, pageSize:{location:"query", required:!1}, pageToken:{location:"query", required:!1}, startTime:{location:"query", required:!1}, endTime:{location:"query", required:!1}, region:{location:"query", required:!1}, filter:{location:"query", required:!1}, view:{location:"query", required:!1}}}, move:{id:"earthengine.projects.assets.move", path:"v1/{+sourceName}:move", httpMethod:"POST", request:{$ref:"MoveAssetRequest"}, 
parameters:{sourceName:{location:"path", required:!0}}}, patch:{id:"earthengine.projects.assets.patch", path:"v1/{+name}", httpMethod:"PATCH", request:{$ref:"UpdateAssetRequest"}, parameters:{name:{location:"path", required:!0}}}, setIamPolicy:{id:"earthengine.projects.assets.setIamPolicy", path:"v1/{+resource}:setIamPolicy", httpMethod:"POST", request:{$ref:"SetIamPolicyRequest"}, parameters:{resource:{location:"path", required:!0}}}, testIamPermissions:{id:"earthengine.projects.assets.testIamPermissions", 
path:"v1/{+resource}:testIamPermissions", httpMethod:"POST", request:{$ref:"TestIamPermissionsRequest"}, parameters:{resource:{location:"path", required:!0}}}}}, filmstripThumbnails:{methods:{create:{id:"earthengine.projects.filmstripThumbnails.create", path:"v1/{+parent}/filmstripThumbnails", httpMethod:"POST", request:{$ref:"FilmstripThumbnail"}, parameters:{parent:{location:"path", required:!0}}}, getPixels:{id:"earthengine.projects.filmstripThumbnails.getPixels", path:"v1/{+name}:getPixels", 
httpMethod:"GET", parameters:{name:{location:"path", required:!0}}}}}, maps:{methods:{create:{id:"earthengine.projects.maps.create", path:"v1/{+parent}/maps", httpMethod:"POST", request:{$ref:"EarthEngineMap"}, parameters:{parent:{location:"path", required:!0}}}}, resources:{tiles:{methods:{get:{id:"earthengine.projects.maps.tiles.get", path:"v1/{+parent}/tiles/{zoom}/{x}/{y}", httpMethod:"GET", parameters:{parent:{location:"path", required:!0}, zoom:{location:"path", required:!0}, x:{location:"path", 
required:!0}, y:{location:"path", required:!0}}}}}}}, thumbnails:{methods:{create:{id:"earthengine.projects.thumbnails.create", path:"v1/{+parent}/thumbnails", httpMethod:"POST", request:{$ref:"Thumbnail"}, parameters:{parent:{location:"path", required:!0}}}, getPixels:{id:"earthengine.projects.thumbnails.getPixels", path:"v1/{+name}:getPixels", httpMethod:"GET", parameters:{name:{location:"path", required:!0}}}}}, videoThumbnails:{methods:{create:{id:"earthengine.projects.videoThumbnails.create", 
path:"v1/{+parent}/videoThumbnails", httpMethod:"POST", request:{$ref:"VideoThumbnail"}, parameters:{parent:{location:"path", required:!0}}}, getPixels:{id:"earthengine.projects.videoThumbnails.getPixels", path:"v1/{+name}:getPixels", httpMethod:"GET", parameters:{name:{location:"path", required:!0}}}}}}}, table:{methods:{compute:{id:"earthengine.table.compute", path:"v1/table:compute", httpMethod:"POST", request:{$ref:"ComputeTableRequest"}}, "export":{id:"earthengine.table.export", path:"v1/table:export", 
httpMethod:"POST", request:{$ref:"ExportTableRequest"}}, ingest:{id:"earthengine.table.ingest", path:"v1/table:ingest", httpMethod:"POST", request:{$ref:"IngestTableRequest"}}}}, v1:{methods:{computeImage:{id:"earthengine.computeImage", path:"v1:computeImage", httpMethod:"POST", request:{$ref:"ComputeImageRequest"}}, computeTable:{id:"earthengine.computeTable", path:"v1:computeTable", httpMethod:"POST", request:{$ref:"ComputeTableRequest"}}, computeValue:{id:"earthengine.computeValue", path:"v1:computeValue", 
httpMethod:"POST", request:{$ref:"ComputeValueRequest"}}, exportImage:{id:"earthengine.exportImage", path:"v1:exportImage", httpMethod:"POST", request:{$ref:"ExportImageRequest"}}, exportMap:{id:"earthengine.exportMap", path:"v1:exportMap", httpMethod:"POST", request:{$ref:"ExportMapRequest"}}, exportTable:{id:"earthengine.exportTable", path:"v1:exportTable", httpMethod:"POST", request:{$ref:"ExportTableRequest"}}, exportVideo:{id:"earthengine.exportVideo", path:"v1:exportVideo", httpMethod:"POST", 
request:{$ref:"ExportVideoRequest"}}, exportVideoMap:{id:"earthengine.exportVideoMap", path:"v1:exportVideoMap", httpMethod:"POST", request:{$ref:"ExportVideoMapRequest"}}, ingestImage:{id:"earthengine.ingestImage", path:"v1:ingestImage", httpMethod:"POST", request:{$ref:"IngestImageRequest"}}, ingestTable:{id:"earthengine.ingestTable", path:"v1:ingestTable", httpMethod:"POST", request:{$ref:"IngestTableRequest"}}, listBuckets:{id:"earthengine.listBuckets", path:"v1:listBuckets", httpMethod:"GET"}}}, 
value:{methods:{compute:{id:"earthengine.value.compute", path:"v1/value:compute", httpMethod:"POST", request:{$ref:"ComputeValueRequest"}}}}, video:{methods:{"export":{id:"earthengine.video.export", path:"v1/video:export", httpMethod:"POST", request:{$ref:"ExportVideoRequest"}}}}, videoMap:{methods:{"export":{id:"earthengine.videoMap.export", path:"v1/videoMap:export", httpMethod:"POST", request:{$ref:"ExportVideoMapRequest"}}}}, videoThumbnails:{methods:{create:{id:"earthengine.videoThumbnails.create", 
path:"v1/videoThumbnails", httpMethod:"POST", request:{$ref:"VideoThumbnail"}, parameters:{parent:{location:"query", required:!1}}}, getPixels:{id:"earthengine.videoThumbnails.getPixels", path:"v1/{+name}:getPixels", httpMethod:"GET", parameters:{name:{location:"path", required:!0}}}}}}, methods:{}};
ee.rpc_proto = {};
ee.Encodable = function() {
};
ee.rpc_node = {};
ee.rpc_node.constant = function(obj) {
  return {constantValue:obj};
};
ee.rpc_node.reference = function(ref) {
  return {valueReference:ref};
};
ee.rpc_node.array = function(values) {
  return {arrayValue:{values:values}};
};
ee.rpc_node.dictionary = function(values) {
  return {dictionaryValue:{values:values}};
};
ee.rpc_node.functionByName = function(name, args) {
  return {functionInvocationValue:{functionName:name, arguments:args}};
};
ee.rpc_node.functionByReference = function(ref, args) {
  return {functionInvocationValue:{arguments:args, functionReference:ref}};
};
ee.rpc_node.functionDefinition = function(argumentNames, body) {
  return {functionDefinitionValue:{argumentNames:argumentNames, body:body}};
};
ee.rpc_node.argumentReference = function(ref) {
  return {argumentReference:ref};
};
ee.rpc_proto.CreateAssetRequest = function() {
};
ee.rpc_proto.ListAssetsRequest = function() {
};
ee.rpc_proto.ListImagesRequest = function() {
};
ee.rpc_proto.ListOperationsRequest = function() {
};
var nameOnlyRequest_ = function() {
};
ee.rpc_proto.GetAssetRequest = nameOnlyRequest_;
ee.rpc_proto.DeleteAssetRequest = nameOnlyRequest_;
ee.rpc_proto.GetOperationRequest = nameOnlyRequest_;
ee.rpc_proto.CancelOperationRequest = nameOnlyRequest_;
ee.rpc_proto.IamPolicy = function() {
};
ee.rpc_proto.Binding = function() {
};
ee.rpc_proto.Operation = function() {
};
ee.rpc_proto.Status = function() {
};
ee.rpc_convert = {};
ee.rpc_convert.fileFormat = function(format) {
  if (!format) {
    return "AUTO_PNG_JPEG";
  }
  var upper = format.toUpperCase();
  switch(upper) {
    case "JPG":
      return "JPEG";
    case "AUTO":
      return "AUTO_PNG_JPEG";
    case "TIF":
    case "TIFF":
    case "GEOTIF":
    case "GEOTIFF":
      return "GEO_TIFF";
    case "TF_RECORD":
    case "TFRECORD":
      return "TF_RECORD_IMAGE";
    case "NUMPY":
      return "NPY";
    default:
      return upper;
  }
};
ee.rpc_convert.tableFileFormat = function(format) {
  if (!format) {
    return "CSV";
  }
  var upper = format.toUpperCase();
  switch(upper) {
    case "TF_RECORD":
    case "TFRECORD":
      return "TF_RECORD_TABLE";
    case "JSON":
    case "GEOJSON":
      return "GEO_JSON";
    default:
      return upper;
  }
};
ee.rpc_convert.bandList = function(bands) {
  if (!bands) {
    return [];
  }
  if (goog.isString(bands)) {
    return bands.split(",");
  }
  if (goog.isArray(bands)) {
    return bands;
  }
  throw Error("Invalid band list " + bands);
};
ee.rpc_convert.visualizationOptions = function(params) {
  var result = {};
  if ("palette" in params) {
    var pal = params.palette;
    result.paletteColors = goog.isString(pal) ? pal.split(",") : pal;
  }
  var ranges = [];
  if ("gain" in params || "bias" in params) {
    if ("min" in params || "max" in params) {
      throw Error("Gain and bias can't be specified with min and max");
    }
    var valueRange = result.paletteColors ? result.paletteColors.length - 1 : 255;
    ranges = ee.rpc_convert.pairedValues(params, "bias", "gain").map(function(pair) {
      var min = -pair.bias / pair.gain;
      return {min:min, max:valueRange / pair.gain + min};
    });
  } else {
    if ("min" in params || "max" in params) {
      ranges = ee.rpc_convert.pairedValues(params, "min", "max");
    }
  }
  0 !== ranges.length && (result.ranges = ranges);
  var gammas = ee.rpc_convert.csvToNumbers(params.gamma);
  if (1 < gammas.length) {
    throw Error("Only one gamma value is supported");
  }
  1 === gammas.length && (result.gamma = {value:gammas[0]});
  return goog.object.isEmpty(result) ? null : result;
};
ee.rpc_convert.csvToNumbers = function(csv) {
  return csv ? csv.split(",").map(Number) : [];
};
ee.rpc_convert.pairedValues = function(obj, a, b) {
  var aValues = ee.rpc_convert.csvToNumbers(obj[a]), bValues = ee.rpc_convert.csvToNumbers(obj[b]);
  if (0 === aValues.length) {
    return bValues.map(function(value) {
      var $jscomp$compprop1 = {};
      return $jscomp$compprop1[a] = 0, $jscomp$compprop1[b] = value, $jscomp$compprop1;
    });
  }
  if (0 === bValues.length) {
    return aValues.map(function(value) {
      var $jscomp$compprop2 = {};
      return $jscomp$compprop2[a] = value, $jscomp$compprop2[b] = 1, $jscomp$compprop2;
    });
  }
  if (aValues.length !== bValues.length) {
    throw Error("Length of " + a + " and " + b + " must match.");
  }
  return aValues.map(function(value, index) {
    var $jscomp$compprop3 = {};
    return $jscomp$compprop3[a] = value, $jscomp$compprop3[b] = bValues[index], $jscomp$compprop3;
  });
};
ee.rpc_convert.algorithms = function(result) {
  for (var convertArgument = function(argument) {
    var internalArgument = {};
    internalArgument.description = argument.description || "";
    internalArgument.type = argument.type || "";
    goog.isDefAndNotNull(argument.argumentName) && (internalArgument.name = argument.argumentName);
    void 0 !== argument.defaultValue && (internalArgument["default"] = argument.defaultValue);
    goog.isDefAndNotNull(argument.optional) && (internalArgument.optional = argument.optional);
    return internalArgument;
  }, convertAlgorithm = function(algorithm) {
    var internalAlgorithm = {};
    internalAlgorithm.args = (algorithm.arguments || []).map(convertArgument);
    internalAlgorithm.description = algorithm.description || "";
    internalAlgorithm.returns = algorithm.returnType || "";
    goog.isDefAndNotNull(algorithm.hidden) && (internalAlgorithm.hidden = algorithm.hidden);
    algorithm.deprecated && (internalAlgorithm.deprecated = algorithm.deprecationReason);
    return internalAlgorithm;
  }, internalAlgorithms = {}, $jscomp$iter$4 = $jscomp.makeIterator(result.algorithms || []), $jscomp$key$algorithm = $jscomp$iter$4.next(); !$jscomp$key$algorithm.done; $jscomp$key$algorithm = $jscomp$iter$4.next()) {
    var algorithm$jscomp$0 = $jscomp$key$algorithm.value, name = algorithm$jscomp$0.name.replace(/^algorithms\//, "");
    internalAlgorithms[name] = convertAlgorithm(algorithm$jscomp$0);
  }
  return internalAlgorithms;
};
ee.rpc_convert.projectParentFromPath = function(path) {
  var matches = /^(projects\/[a-z][a-z0-9\-]{4,28}[a-z0-9])\/.*/.exec(path);
  return matches ? matches[1] : "projects/earthengine-legacy";
};
ee.rpc_convert.assetIdToAssetName = function(param) {
  return /^projects\/[a-z][a-z0-9\-]{4,28}[a-z0-9]\/assets\/.*/.exec(param) ? param : /^(users|projects)\/.*/.exec(param) ? "projects/earthengine-legacy/assets/" + param : "projects/earthengine-public/assets/" + param;
};
ee.rpc_convert.assetTypeForCreate = function(param) {
  switch(param) {
    case "ImageCollection":
      return "IMAGE_COLLECTION";
    case "Folder":
      return "FOLDER";
    default:
      return param;
  }
};
ee.rpc_convert.getListToListAssets = function(param) {
  var assetsRequest = {};
  param.id && (assetsRequest.name = ee.rpc_convert.assetIdToAssetName(param.id));
  param.num && (assetsRequest.pageSize = param.num);
  for (var allKeys = ["id", "num"], $jscomp$iter$5 = $jscomp.makeIterator(Object.keys(param).filter(function(k) {
    return !allKeys.includes(k);
  })), $jscomp$key$key = $jscomp$iter$5.next(); !$jscomp$key$key.done; $jscomp$key$key = $jscomp$iter$5.next()) {
    console.warn("Unrecognized key " + $jscomp$key$key.value + " ignored");
  }
  return assetsRequest;
};
ee.rpc_convert.listAssetsToGetList = function(result) {
  return (result.assets || []).map(ee.rpc_convert.assetToGetListResult);
};
ee.rpc_convert.listImagesToGetList = function(result) {
  return (result.assets || []).map(ee.rpc_convert.assetToGetListResult);
};
ee.rpc_convert.listBucketsToGetList = function(result) {
  return (result.buckets || []).map(ee.rpc_convert.assetToGetListResult);
};
ee.rpc_convert.assetToGetListResult = function(result) {
  var internalAsset = {type:function(type) {
    switch(type) {
      case "IMAGE":
        return "Image";
      case "IMAGE_COLLECTION":
        return "ImageCollection";
      case "FOLDER":
        return "Folder";
      case "TABLE":
        return "Table";
      default:
        return "Unknown";
    }
  }(result.type)};
  goog.isDefAndNotNull(result.path) && (internalAsset.id = result.path);
  return internalAsset;
};
ee.rpc_convert.getListToListImages = function(param) {
  var imagesRequest = {}, toTimestamp = function(msec) {
    return (new Date(msec)).toISOString();
  };
  param.id && (imagesRequest.name = ee.rpc_convert.assetIdToAssetName(param.id));
  param.num && (imagesRequest.pageSize = param.num);
  param.starttime && (imagesRequest.startTime = toTimestamp(param.starttime));
  param.endtime && (imagesRequest.endTime = toTimestamp(param.endtime));
  param.bbox && (imagesRequest.region = ee.rpc_convert.boundingBoxToGeoJson(param.bbox));
  param.region && (imagesRequest.region = param.region);
  param.bbox && param.region && console.warn("Multiple request parameters converted to region");
  for (var allKeys = "id num starttime endtime bbox region".split(" "), $jscomp$iter$6 = $jscomp.makeIterator(Object.keys(param).filter(function(k) {
    return !allKeys.includes(k);
  })), $jscomp$key$key = $jscomp$iter$6.next(); !$jscomp$key$key.done; $jscomp$key$key = $jscomp$iter$6.next()) {
    console.warn("Unrecognized key " + $jscomp$key$key.value + " ignored");
  }
  return imagesRequest;
};
ee.rpc_convert.boundingBoxToGeoJson = function(bbox) {
  return '{"type":"Polygon","coordinates":[[[' + [[0, 1], [2, 1], [2, 3], [0, 3], [0, 1]].map(function(i) {
    return bbox[i[0]] + "," + bbox[i[1]];
  }).join("],[") + "]]]}";
};
ee.rpc_convert.iamPolicyToAcl = function(result) {
  var bindingMap = {};
  (result.bindings || []).forEach(function(binding) {
    bindingMap[binding.role] = binding.members;
  });
  var toAcl = function(member) {
    return member.replace(/^group:|^user:/, "");
  }, readersWithAll = bindingMap["roles/viewer"] || [], readers = readersWithAll.filter(function(reader) {
    return "allUsers" !== reader;
  }), internalAcl = {owners:(bindingMap["roles/owner"] || []).map(toAcl), writers:(bindingMap["roles/editor"] || []).map(toAcl), readers:readers.map(toAcl)};
  readersWithAll.length != readers.length && (internalAcl.all_users_can_read = !0);
  return internalAcl;
};
ee.rpc_convert.aclToIamPolicy = function(param) {
  return {bindings:[{role:"roles/owner", members:param.owners || []}, {role:"roles/viewer", members:(param.readers || []).concat(param.all_users_can_read ? ["allUsers"] : [])}, {role:"roles/editor", members:param.writers || []}].filter(function(binding) {
    return binding.members.length;
  }), etag:null};
};
ee.rpc_convert.taskIdToOperationName = function(param) {
  return "operations/" + param;
};
ee.rpc_convert.operationNameToTaskId = function(result) {
  return result.replace(/^operations\//, "");
};
ee.rpc_convert.operationToTask = function(result) {
  var internalTask = {}, assignTimestamp = function(field, timestamp) {
    goog.isDefAndNotNull(timestamp) && (internalTask[field] = Date.parse(timestamp));
  }, convertState = function(state) {
    switch(state) {
      case "PENDING":
        return "READY";
      case "RUNNING":
        return "RUNNING";
      case "CANCELLING":
        return "CANCEL_REQUESTED";
      case "SUCCEEDED":
        return "COMPLETED";
      case "CANCELLED":
        return "CANCELLED";
      case "FAILED":
        return "FAILED";
      default:
        return "UNKNOWN";
    }
  }, metadata = result.metadata;
  goog.isDefAndNotNull(metadata.description) && (internalTask.description = metadata.description);
  goog.isDefAndNotNull(metadata.state) && (internalTask.state = convertState(metadata.state));
  assignTimestamp("creation_timestamp_ms", metadata.createTime);
  assignTimestamp("update_timestamp_ms", metadata.updateTime);
  assignTimestamp("start_timestamp_ms", metadata.startTime);
  result.done && goog.isDefAndNotNull(result.error) && (internalTask.error_message = result.error.message);
  goog.isDefAndNotNull(result.name) && (internalTask.id = ee.rpc_convert.operationNameToTaskId(result.name));
  internalTask.task_type = "UNKNOWN";
  return internalTask;
};
ee.rpc_convert.operationToProcessingResponse = function(operation) {
  var result = {started:"OK"};
  operation.name && (result.taskId = ee.rpc_convert.operationNameToTaskId(operation.name));
  operation.error && (result.note = operation.error.message);
  return result;
};
goog.crypt = {};
goog.crypt.Hash = function() {
  this.blockSize = -1;
};
goog.crypt.Md5 = function() {
  goog.crypt.Hash.call(this);
  this.blockSize = 64;
  this.chain_ = Array(4);
  this.block_ = Array(this.blockSize);
  this.totalLength_ = this.blockLength_ = 0;
  this.reset();
};
goog.inherits(goog.crypt.Md5, goog.crypt.Hash);
goog.crypt.Md5.prototype.reset = function() {
  this.chain_[0] = 1732584193;
  this.chain_[1] = 4023233417;
  this.chain_[2] = 2562383102;
  this.chain_[3] = 271733878;
  this.totalLength_ = this.blockLength_ = 0;
};
goog.crypt.Md5.prototype.compress_ = function(buf, opt_offset) {
  opt_offset || (opt_offset = 0);
  var X = Array(16);
  if (goog.isString(buf)) {
    for (var i = 0; 16 > i; ++i) {
      X[i] = buf.charCodeAt(opt_offset++) | buf.charCodeAt(opt_offset++) << 8 | buf.charCodeAt(opt_offset++) << 16 | buf.charCodeAt(opt_offset++) << 24;
    }
  } else {
    for (i = 0; 16 > i; ++i) {
      X[i] = buf[opt_offset++] | buf[opt_offset++] << 8 | buf[opt_offset++] << 16 | buf[opt_offset++] << 24;
    }
  }
  var A = this.chain_[0], B = this.chain_[1], C = this.chain_[2], D = this.chain_[3], sum = 0;
  sum = A + (D ^ B & (C ^ D)) + X[0] + 3614090360 & 4294967295;
  A = B + (sum << 7 & 4294967295 | sum >>> 25);
  sum = D + (C ^ A & (B ^ C)) + X[1] + 3905402710 & 4294967295;
  D = A + (sum << 12 & 4294967295 | sum >>> 20);
  sum = C + (B ^ D & (A ^ B)) + X[2] + 606105819 & 4294967295;
  C = D + (sum << 17 & 4294967295 | sum >>> 15);
  sum = B + (A ^ C & (D ^ A)) + X[3] + 3250441966 & 4294967295;
  B = C + (sum << 22 & 4294967295 | sum >>> 10);
  sum = A + (D ^ B & (C ^ D)) + X[4] + 4118548399 & 4294967295;
  A = B + (sum << 7 & 4294967295 | sum >>> 25);
  sum = D + (C ^ A & (B ^ C)) + X[5] + 1200080426 & 4294967295;
  D = A + (sum << 12 & 4294967295 | sum >>> 20);
  sum = C + (B ^ D & (A ^ B)) + X[6] + 2821735955 & 4294967295;
  C = D + (sum << 17 & 4294967295 | sum >>> 15);
  sum = B + (A ^ C & (D ^ A)) + X[7] + 4249261313 & 4294967295;
  B = C + (sum << 22 & 4294967295 | sum >>> 10);
  sum = A + (D ^ B & (C ^ D)) + X[8] + 1770035416 & 4294967295;
  A = B + (sum << 7 & 4294967295 | sum >>> 25);
  sum = D + (C ^ A & (B ^ C)) + X[9] + 2336552879 & 4294967295;
  D = A + (sum << 12 & 4294967295 | sum >>> 20);
  sum = C + (B ^ D & (A ^ B)) + X[10] + 4294925233 & 4294967295;
  C = D + (sum << 17 & 4294967295 | sum >>> 15);
  sum = B + (A ^ C & (D ^ A)) + X[11] + 2304563134 & 4294967295;
  B = C + (sum << 22 & 4294967295 | sum >>> 10);
  sum = A + (D ^ B & (C ^ D)) + X[12] + 1804603682 & 4294967295;
  A = B + (sum << 7 & 4294967295 | sum >>> 25);
  sum = D + (C ^ A & (B ^ C)) + X[13] + 4254626195 & 4294967295;
  D = A + (sum << 12 & 4294967295 | sum >>> 20);
  sum = C + (B ^ D & (A ^ B)) + X[14] + 2792965006 & 4294967295;
  C = D + (sum << 17 & 4294967295 | sum >>> 15);
  sum = B + (A ^ C & (D ^ A)) + X[15] + 1236535329 & 4294967295;
  B = C + (sum << 22 & 4294967295 | sum >>> 10);
  sum = A + (C ^ D & (B ^ C)) + X[1] + 4129170786 & 4294967295;
  A = B + (sum << 5 & 4294967295 | sum >>> 27);
  sum = D + (B ^ C & (A ^ B)) + X[6] + 3225465664 & 4294967295;
  D = A + (sum << 9 & 4294967295 | sum >>> 23);
  sum = C + (A ^ B & (D ^ A)) + X[11] + 643717713 & 4294967295;
  C = D + (sum << 14 & 4294967295 | sum >>> 18);
  sum = B + (D ^ A & (C ^ D)) + X[0] + 3921069994 & 4294967295;
  B = C + (sum << 20 & 4294967295 | sum >>> 12);
  sum = A + (C ^ D & (B ^ C)) + X[5] + 3593408605 & 4294967295;
  A = B + (sum << 5 & 4294967295 | sum >>> 27);
  sum = D + (B ^ C & (A ^ B)) + X[10] + 38016083 & 4294967295;
  D = A + (sum << 9 & 4294967295 | sum >>> 23);
  sum = C + (A ^ B & (D ^ A)) + X[15] + 3634488961 & 4294967295;
  C = D + (sum << 14 & 4294967295 | sum >>> 18);
  sum = B + (D ^ A & (C ^ D)) + X[4] + 3889429448 & 4294967295;
  B = C + (sum << 20 & 4294967295 | sum >>> 12);
  sum = A + (C ^ D & (B ^ C)) + X[9] + 568446438 & 4294967295;
  A = B + (sum << 5 & 4294967295 | sum >>> 27);
  sum = D + (B ^ C & (A ^ B)) + X[14] + 3275163606 & 4294967295;
  D = A + (sum << 9 & 4294967295 | sum >>> 23);
  sum = C + (A ^ B & (D ^ A)) + X[3] + 4107603335 & 4294967295;
  C = D + (sum << 14 & 4294967295 | sum >>> 18);
  sum = B + (D ^ A & (C ^ D)) + X[8] + 1163531501 & 4294967295;
  B = C + (sum << 20 & 4294967295 | sum >>> 12);
  sum = A + (C ^ D & (B ^ C)) + X[13] + 2850285829 & 4294967295;
  A = B + (sum << 5 & 4294967295 | sum >>> 27);
  sum = D + (B ^ C & (A ^ B)) + X[2] + 4243563512 & 4294967295;
  D = A + (sum << 9 & 4294967295 | sum >>> 23);
  sum = C + (A ^ B & (D ^ A)) + X[7] + 1735328473 & 4294967295;
  C = D + (sum << 14 & 4294967295 | sum >>> 18);
  sum = B + (D ^ A & (C ^ D)) + X[12] + 2368359562 & 4294967295;
  B = C + (sum << 20 & 4294967295 | sum >>> 12);
  sum = A + (B ^ C ^ D) + X[5] + 4294588738 & 4294967295;
  A = B + (sum << 4 & 4294967295 | sum >>> 28);
  sum = D + (A ^ B ^ C) + X[8] + 2272392833 & 4294967295;
  D = A + (sum << 11 & 4294967295 | sum >>> 21);
  sum = C + (D ^ A ^ B) + X[11] + 1839030562 & 4294967295;
  C = D + (sum << 16 & 4294967295 | sum >>> 16);
  sum = B + (C ^ D ^ A) + X[14] + 4259657740 & 4294967295;
  B = C + (sum << 23 & 4294967295 | sum >>> 9);
  sum = A + (B ^ C ^ D) + X[1] + 2763975236 & 4294967295;
  A = B + (sum << 4 & 4294967295 | sum >>> 28);
  sum = D + (A ^ B ^ C) + X[4] + 1272893353 & 4294967295;
  D = A + (sum << 11 & 4294967295 | sum >>> 21);
  sum = C + (D ^ A ^ B) + X[7] + 4139469664 & 4294967295;
  C = D + (sum << 16 & 4294967295 | sum >>> 16);
  sum = B + (C ^ D ^ A) + X[10] + 3200236656 & 4294967295;
  B = C + (sum << 23 & 4294967295 | sum >>> 9);
  sum = A + (B ^ C ^ D) + X[13] + 681279174 & 4294967295;
  A = B + (sum << 4 & 4294967295 | sum >>> 28);
  sum = D + (A ^ B ^ C) + X[0] + 3936430074 & 4294967295;
  D = A + (sum << 11 & 4294967295 | sum >>> 21);
  sum = C + (D ^ A ^ B) + X[3] + 3572445317 & 4294967295;
  C = D + (sum << 16 & 4294967295 | sum >>> 16);
  sum = B + (C ^ D ^ A) + X[6] + 76029189 & 4294967295;
  B = C + (sum << 23 & 4294967295 | sum >>> 9);
  sum = A + (B ^ C ^ D) + X[9] + 3654602809 & 4294967295;
  A = B + (sum << 4 & 4294967295 | sum >>> 28);
  sum = D + (A ^ B ^ C) + X[12] + 3873151461 & 4294967295;
  D = A + (sum << 11 & 4294967295 | sum >>> 21);
  sum = C + (D ^ A ^ B) + X[15] + 530742520 & 4294967295;
  C = D + (sum << 16 & 4294967295 | sum >>> 16);
  sum = B + (C ^ D ^ A) + X[2] + 3299628645 & 4294967295;
  B = C + (sum << 23 & 4294967295 | sum >>> 9);
  sum = A + (C ^ (B | ~D)) + X[0] + 4096336452 & 4294967295;
  A = B + (sum << 6 & 4294967295 | sum >>> 26);
  sum = D + (B ^ (A | ~C)) + X[7] + 1126891415 & 4294967295;
  D = A + (sum << 10 & 4294967295 | sum >>> 22);
  sum = C + (A ^ (D | ~B)) + X[14] + 2878612391 & 4294967295;
  C = D + (sum << 15 & 4294967295 | sum >>> 17);
  sum = B + (D ^ (C | ~A)) + X[5] + 4237533241 & 4294967295;
  B = C + (sum << 21 & 4294967295 | sum >>> 11);
  sum = A + (C ^ (B | ~D)) + X[12] + 1700485571 & 4294967295;
  A = B + (sum << 6 & 4294967295 | sum >>> 26);
  sum = D + (B ^ (A | ~C)) + X[3] + 2399980690 & 4294967295;
  D = A + (sum << 10 & 4294967295 | sum >>> 22);
  sum = C + (A ^ (D | ~B)) + X[10] + 4293915773 & 4294967295;
  C = D + (sum << 15 & 4294967295 | sum >>> 17);
  sum = B + (D ^ (C | ~A)) + X[1] + 2240044497 & 4294967295;
  B = C + (sum << 21 & 4294967295 | sum >>> 11);
  sum = A + (C ^ (B | ~D)) + X[8] + 1873313359 & 4294967295;
  A = B + (sum << 6 & 4294967295 | sum >>> 26);
  sum = D + (B ^ (A | ~C)) + X[15] + 4264355552 & 4294967295;
  D = A + (sum << 10 & 4294967295 | sum >>> 22);
  sum = C + (A ^ (D | ~B)) + X[6] + 2734768916 & 4294967295;
  C = D + (sum << 15 & 4294967295 | sum >>> 17);
  sum = B + (D ^ (C | ~A)) + X[13] + 1309151649 & 4294967295;
  B = C + (sum << 21 & 4294967295 | sum >>> 11);
  sum = A + (C ^ (B | ~D)) + X[4] + 4149444226 & 4294967295;
  A = B + (sum << 6 & 4294967295 | sum >>> 26);
  sum = D + (B ^ (A | ~C)) + X[11] + 3174756917 & 4294967295;
  D = A + (sum << 10 & 4294967295 | sum >>> 22);
  sum = C + (A ^ (D | ~B)) + X[2] + 718787259 & 4294967295;
  C = D + (sum << 15 & 4294967295 | sum >>> 17);
  sum = B + (D ^ (C | ~A)) + X[9] + 3951481745 & 4294967295;
  this.chain_[0] = this.chain_[0] + A & 4294967295;
  this.chain_[1] = this.chain_[1] + (C + (sum << 21 & 4294967295 | sum >>> 11)) & 4294967295;
  this.chain_[2] = this.chain_[2] + C & 4294967295;
  this.chain_[3] = this.chain_[3] + D & 4294967295;
};
goog.crypt.Md5.prototype.update = function(bytes, opt_length) {
  goog.isDef(opt_length) || (opt_length = bytes.length);
  for (var lengthMinusBlock = opt_length - this.blockSize, block = this.block_, blockLength = this.blockLength_, i = 0; i < opt_length;) {
    if (0 == blockLength) {
      for (; i <= lengthMinusBlock;) {
        this.compress_(bytes, i), i += this.blockSize;
      }
    }
    if (goog.isString(bytes)) {
      for (; i < opt_length;) {
        if (block[blockLength++] = bytes.charCodeAt(i++), blockLength == this.blockSize) {
          this.compress_(block);
          blockLength = 0;
          break;
        }
      }
    } else {
      for (; i < opt_length;) {
        if (block[blockLength++] = bytes[i++], blockLength == this.blockSize) {
          this.compress_(block);
          blockLength = 0;
          break;
        }
      }
    }
  }
  this.blockLength_ = blockLength;
  this.totalLength_ += opt_length;
};
goog.crypt.Md5.prototype.digest = function() {
  var pad = Array((56 > this.blockLength_ ? this.blockSize : 2 * this.blockSize) - this.blockLength_);
  pad[0] = 128;
  for (var i = 1; i < pad.length - 8; ++i) {
    pad[i] = 0;
  }
  var totalBits = 8 * this.totalLength_;
  for (i = pad.length - 8; i < pad.length; ++i) {
    pad[i] = totalBits & 255, totalBits /= 256;
  }
  this.update(pad);
  var digest = Array(16), n = 0;
  for (i = 0; 4 > i; ++i) {
    for (var j = 0; 32 > j; j += 8) {
      digest[n++] = this.chain_[i] >>> j & 255;
    }
  }
  return digest;
};
goog.json = {};
goog.json.USE_NATIVE_JSON = !1;
goog.json.TRY_NATIVE_JSON = !1;
goog.json.isValid = function(s) {
  return /^\s*$/.test(s) ? !1 : /^[\],:{}\s\u2028\u2029]*$/.test(s.replace(/\\["\\\/bfnrtu]/g, "@").replace(/(?:"[^"\\\n\r\u2028\u2029\x00-\x08\x0a-\x1f]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)[\s\u2028\u2029]*(?=:|,|]|}|$)/g, "]").replace(/(?:^|:|,)(?:[\s\u2028\u2029]*\[)+/g, ""));
};
goog.json.errorLogger_ = goog.nullFunction;
goog.json.setErrorLogger = function(errorLogger) {
  goog.json.errorLogger_ = errorLogger;
};
goog.json.parse = goog.json.USE_NATIVE_JSON ? goog.global.JSON.parse : function(s) {
  if (goog.json.TRY_NATIVE_JSON) {
    try {
      return goog.global.JSON.parse(s);
    } catch (ex) {
      var error = ex;
    }
  }
  var o = String(s);
  if (goog.json.isValid(o)) {
    try {
      var result = eval("(" + o + ")");
      error && goog.json.errorLogger_("Invalid JSON: " + o, error);
      return result;
    } catch (ex$15) {
    }
  }
  throw Error("Invalid JSON string: " + o);
};
goog.json.serialize = goog.json.USE_NATIVE_JSON ? goog.global.JSON.stringify : function(object, opt_replacer) {
  return (new goog.json.Serializer(opt_replacer)).serialize(object);
};
goog.json.Serializer = function(opt_replacer) {
  this.replacer_ = opt_replacer;
};
goog.json.Serializer.prototype.serialize = function(object) {
  var sb = [];
  this.serializeInternal(object, sb);
  return sb.join("");
};
goog.json.Serializer.prototype.serializeInternal = function(object, sb) {
  if (null == object) {
    sb.push("null");
  } else {
    if ("object" == typeof object) {
      if (goog.isArray(object)) {
        this.serializeArray(object, sb);
        return;
      }
      if (object instanceof String || object instanceof Number || object instanceof Boolean) {
        object = object.valueOf();
      } else {
        this.serializeObject_(object, sb);
        return;
      }
    }
    switch(typeof object) {
      case "string":
        this.serializeString_(object, sb);
        break;
      case "number":
        this.serializeNumber_(object, sb);
        break;
      case "boolean":
        sb.push(String(object));
        break;
      case "function":
        sb.push("null");
        break;
      default:
        throw Error("Unknown type: " + typeof object);
    }
  }
};
goog.json.Serializer.charToJsonCharCache_ = {'"':'\\"', "\\":"\\\\", "/":"\\/", "\b":"\\b", "\f":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\u000b"};
goog.json.Serializer.charsToReplace_ = /\uffff/.test("\uffff") ? /[\\"\x00-\x1f\x7f-\uffff]/g : /[\\"\x00-\x1f\x7f-\xff]/g;
goog.json.Serializer.prototype.serializeString_ = function(s, sb) {
  sb.push('"', s.replace(goog.json.Serializer.charsToReplace_, function(c) {
    var rv = goog.json.Serializer.charToJsonCharCache_[c];
    rv || (rv = "\\u" + (c.charCodeAt(0) | 65536).toString(16).substr(1), goog.json.Serializer.charToJsonCharCache_[c] = rv);
    return rv;
  }), '"');
};
goog.json.Serializer.prototype.serializeNumber_ = function(n, sb) {
  sb.push(isFinite(n) && !isNaN(n) ? String(n) : "null");
};
goog.json.Serializer.prototype.serializeArray = function(arr, sb) {
  var l = arr.length;
  sb.push("[");
  for (var sep = "", i = 0; i < l; i++) {
    sb.push(sep);
    var value = arr[i];
    this.serializeInternal(this.replacer_ ? this.replacer_.call(arr, String(i), value) : value, sb);
    sep = ",";
  }
  sb.push("]");
};
goog.json.Serializer.prototype.serializeObject_ = function(obj, sb) {
  sb.push("{");
  var sep = "", key;
  for (key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      var value = obj[key];
      "function" != typeof value && (sb.push(sep), this.serializeString_(key, sb), sb.push(":"), this.serializeInternal(this.replacer_ ? this.replacer_.call(obj, key, value) : value, sb), sep = ",");
    }
  }
  sb.push("}");
};
ee.Serializer = function(opt_isCompound) {
  this.HASH_KEY = "__ee_hash__";
  this.isCompound_ = !1 !== opt_isCompound;
  this.scope_ = [];
  this.encoded_ = {};
  this.withHashes_ = [];
};
goog.exportSymbol("ee.Serializer", ee.Serializer);
ee.Serializer.jsonSerializer_ = new goog.json.Serializer;
ee.Serializer.hash_ = new goog.crypt.Md5;
ee.Serializer.encode = function(obj, opt_isCompound) {
  return (new ee.Serializer(goog.isDef(opt_isCompound) ? opt_isCompound : !0)).encode_(obj);
};
ee.Serializer.toJSON = function(obj) {
  return ee.Serializer.jsonSerializer_.serialize(ee.Serializer.encode(obj));
};
ee.Serializer.toReadableJSON = function(obj) {
  return ee.Serializer.stringify(ee.Serializer.encode(obj, !1));
};
ee.Serializer.stringify = function(encoded) {
  return "JSON" in goog.global ? goog.global.JSON.stringify(encoded, null, "  ") : ee.Serializer.jsonSerializer_.serialize(encoded);
};
ee.Serializer.prototype.encode_ = function(object) {
  var value = this.encodeValue_(object);
  this.isCompound_ && (value = goog.isObject(value) && "ValueRef" == value.type && 1 == this.scope_.length ? this.scope_[0][1] : {type:"CompoundValue", scope:this.scope_, value:value}, this.scope_ = [], goog.array.forEach(this.withHashes_, goog.bind(function(obj) {
    delete obj[this.HASH_KEY];
  }, this)), this.withHashes_ = [], this.encoded_ = {});
  return value;
};
ee.Serializer.prototype.encodeValue_ = function(object) {
  if (!goog.isDef(object)) {
    throw Error("Can't encode an undefined value.");
  }
  var hash = goog.isObject(object) ? object[this.HASH_KEY] : null;
  if (this.isCompound_ && null != hash && this.encoded_[hash]) {
    return {type:"ValueRef", value:this.encoded_[hash]};
  }
  if (null === object || goog.isBoolean(object) || goog.isNumber(object) || goog.isString(object)) {
    return object;
  }
  if (goog.isDateLike(object)) {
    return {type:"Invocation", functionName:"Date", arguments:{value:Math.floor(object.getTime())}};
  }
  if (object instanceof ee.Encodable) {
    var result = object.encode(goog.bind(this.encodeValue_, this));
    if (!(goog.isArray(result) || goog.isObject(result) && "ArgumentRef" != result.type)) {
      return result;
    }
  } else {
    if (goog.isArray(object)) {
      result = goog.array.map(object, function(element) {
        return this.encodeValue_(element);
      }, this);
    } else {
      if (goog.isObject(object) && !goog.isFunction(object)) {
        var encodedObject = goog.object.map(object, function(element) {
          if (!goog.isFunction(element)) {
            return this.encodeValue_(element);
          }
        }, this);
        goog.object.remove(encodedObject, this.HASH_KEY);
        result = {type:"Dictionary", value:encodedObject};
      } else {
        throw Error("Can't encode object: " + object);
      }
    }
  }
  if (this.isCompound_) {
    hash = ee.Serializer.computeHash(result);
    if (this.encoded_[hash]) {
      var name = this.encoded_[hash];
    } else {
      name = String(this.scope_.length), this.scope_.push([name, result]), this.encoded_[hash] = name;
    }
    object[this.HASH_KEY] = hash;
    this.withHashes_.push(object);
    return {type:"ValueRef", value:name};
  }
  return result;
};
ee.Serializer.computeHash = function(obj) {
  ee.Serializer.hash_.reset();
  ee.Serializer.hash_.update(ee.Serializer.jsonSerializer_.serialize(obj));
  return ee.Serializer.hash_.digest().toString();
};
ee.Serializer.encodeCloudApi = function(obj) {
  return (new ee.Serializer(!0)).encodeForCloudApi_(obj);
};
ee.Serializer.encodeCloudApiPretty = function(obj) {
  var encoded = (new ee.Serializer(!1)).encodeForCloudApi_(obj), values = encoded.values, walkObject = function(object) {
    if (!goog.isObject(object)) {
      return object;
    }
    for (var ret = goog.isArray(object) ? [] : {}, $jscomp$iter$7 = $jscomp.makeIterator(Object.entries(object)), $jscomp$key$ = $jscomp$iter$7.next(); !$jscomp$key$.done; $jscomp$key$ = $jscomp$iter$7.next()) {
      var $jscomp$destructuring$var1 = $jscomp.makeIterator($jscomp$key$.value), key = $jscomp$destructuring$var1.next().value, val = $jscomp$destructuring$var1.next().value;
      ret[key] = "functionDefinitionValue" === key && goog.isDefAndNotNull(val.body) ? {argumentNames:val.argumentNames, body:walkObject(values[val.body])} : "functionInvocationValue" === key && goog.isDefAndNotNull(val.functionReference) ? {arguments:val.arguments.map(walkObject), functionReference:walkObject(values[val.functionReference])} : "constantValue" === key ? val : walkObject(val);
    }
    return ret;
  };
  return walkObject(values[encoded.result]);
};
ee.Serializer.toReadableCloudApiJSON = function(obj) {
  return ee.Serializer.stringify(ee.Serializer.encodeCloudApiPretty(obj));
};
ee.Serializer.prototype.encodeForCloudApi_ = function(obj$jscomp$0) {
  var $jscomp$this = this;
  try {
    var result = this.makeCloudApiReference_(obj$jscomp$0);
    return (new ExpressionOptimizer(result, this.scope_, this.isCompound_)).optimize();
  } finally {
    this.withHashes_.forEach(function(obj) {
      return delete obj[$jscomp$this.HASH_KEY];
    }), this.withHashes_ = [], this.encoded_ = {}, this.scope_ = [];
  }
};
ee.Serializer.prototype.makeCloudApiReference_ = function(obj) {
  var $jscomp$this = this, makeRef = function(result) {
    var hash = ee.Serializer.computeHash(result);
    if ($jscomp$this.encoded_[hash]) {
      return $jscomp$this.encoded_[hash];
    }
    var name = String($jscomp$this.scope_.length);
    $jscomp$this.scope_.push([name, result]);
    $jscomp$this.encoded_[hash] = name;
    goog.isObject(obj) && (obj[$jscomp$this.HASH_KEY] = hash, $jscomp$this.withHashes_.push(obj));
    return name;
  };
  if (goog.isObject(obj) && this.encoded_[obj[this.HASH_KEY]]) {
    return this.encoded_[obj[this.HASH_KEY]];
  }
  if (null === obj || goog.isBoolean(obj) || goog.isString(obj) || goog.isNumber(obj)) {
    return makeRef(ee.rpc_node.constant(obj));
  }
  if (goog.isDateLike(obj)) {
    return makeRef(ee.rpc_node.functionByName("Date", {value:ee.rpc_node.constant(Math.floor(obj.getTime()))}));
  }
  if (obj instanceof ee.Encodable) {
    return makeRef(obj.encodeCloudValue(function(x) {
      return $jscomp$this.makeCloudApiReference_(x);
    }));
  }
  if (goog.isArray(obj)) {
    return makeRef(ee.rpc_node.array(obj.map(function(x) {
      return ee.rpc_node.reference($jscomp$this.makeCloudApiReference_(x));
    })));
  }
  if (goog.isObject(obj) && !goog.isFunction(obj)) {
    var values = {};
    Object.keys(obj).sort().forEach(function(k) {
      values[k] = ee.rpc_node.reference($jscomp$this.makeCloudApiReference_(obj[k]));
    });
    return makeRef(ee.rpc_node.dictionary(values));
  }
  throw Error("Can't encode object: " + obj);
};
var ExpressionOptimizer = function(rootReference, values, isCompound) {
  var $jscomp$this = this;
  this.rootReference = rootReference;
  this.values = {};
  values.forEach(function(tuple) {
    return $jscomp$this.values[tuple[0]] = tuple[1];
  });
  this.referenceCounts = isCompound ? this.countReferences() : null;
  this.optimizedValues = {};
  this.referenceMap = {};
  this.nextMappedRef = 0;
};
ExpressionOptimizer.prototype.optimize = function() {
  return {result:this.optimizeReference(this.rootReference), values:this.optimizedValues};
};
ExpressionOptimizer.prototype.optimizeReference = function(ref) {
  if (ref in this.referenceMap) {
    return this.referenceMap[ref];
  }
  var mappedRef = String(this.nextMappedRef++);
  this.referenceMap[ref] = mappedRef;
  this.optimizedValues[mappedRef] = this.optimizeValue(this.values[ref]);
  return mappedRef;
};
ExpressionOptimizer.prototype.optimizeValue = function(value) {
  var $jscomp$this = this, isConst = function(v) {
    return void 0 !== v.constantValue;
  };
  if (isConst(value) || goog.isDefAndNotNull(value.integerValue) || goog.isDefAndNotNull(value.bytesValue) || goog.isDefAndNotNull(value.argumentReference)) {
    return value;
  }
  if (goog.isDefAndNotNull(value.valueReference)) {
    var val = this.values[value.valueReference];
    return null === this.referenceCounts || 1 === this.referenceCounts[value.valueReference] ? this.optimizeValue(val) : ExpressionOptimizer.isAlwaysLiftable(val) ? val : ee.rpc_node.reference(this.optimizeReference(value.valueReference));
  }
  if (goog.isDefAndNotNull(value.arrayValue)) {
    var arr = value.arrayValue.values.map(function(v) {
      return $jscomp$this.optimizeValue(v);
    });
    return arr.every(isConst) ? ee.rpc_node.constant(arr.map(function(v) {
      return v.constantValue;
    })) : ee.rpc_node.array(arr);
  }
  if (goog.isDefAndNotNull(value.dictionaryValue)) {
    for (var values = {}, constantValues = {}, $jscomp$iter$8 = $jscomp.makeIterator(Object.entries(value.dictionaryValue.values || {})), $jscomp$key$ = $jscomp$iter$8.next(); !$jscomp$key$.done; $jscomp$key$ = $jscomp$iter$8.next()) {
      var $jscomp$destructuring$var3 = $jscomp.makeIterator($jscomp$key$.value), k = $jscomp$destructuring$var3.next().value, v$jscomp$0 = $jscomp$destructuring$var3.next().value;
      values[k] = this.optimizeValue(v$jscomp$0);
      null !== constantValues && isConst(values[k]) ? constantValues[k] = values[k].constantValue : constantValues = null;
    }
    return null !== constantValues ? ee.rpc_node.constant(constantValues) : ee.rpc_node.dictionary(values);
  }
  if (goog.isDefAndNotNull(value.functionDefinitionValue)) {
    var def = value.functionDefinitionValue;
    return ee.rpc_node.functionDefinition(def.argumentNames || [], this.optimizeReference(def.body || ""));
  }
  if (goog.isDefAndNotNull(value.functionInvocationValue)) {
    for (var inv = value.functionInvocationValue, args = {}, $jscomp$iter$9 = $jscomp.makeIterator(Object.keys(inv.arguments || {})), $jscomp$key$k = $jscomp$iter$9.next(); !$jscomp$key$k.done; $jscomp$key$k = $jscomp$iter$9.next()) {
      var k$16 = $jscomp$key$k.value;
      args[k$16] = this.optimizeValue(inv.arguments[k$16]);
    }
    return inv.functionName ? ee.rpc_node.functionByName(inv.functionName, args) : ee.rpc_node.functionByReference(this.optimizeReference(inv.functionReference || ""), args);
  }
  throw Error("Can't optimize value: " + value);
};
ExpressionOptimizer.isAlwaysLiftable = function(value) {
  var constant = value.constantValue;
  return void 0 !== constant ? null === constant || goog.isNumber(constant) || goog.isBoolean(constant) : goog.isDefAndNotNull(value.argumentReference);
};
ExpressionOptimizer.prototype.countReferences = function() {
  var $jscomp$this = this, counts = {}, visitReference = function(reference) {
    counts[reference] ? counts[reference]++ : (counts[reference] = 1, visitValue($jscomp$this.values[reference]));
  }, visitValue = function(value) {
    if (goog.isDefAndNotNull(value.arrayValue)) {
      value.arrayValue.values.forEach(visitValue);
    } else {
      if (goog.isDefAndNotNull(value.dictionaryValue)) {
        Object.values(value.dictionaryValue.values).forEach(visitValue);
      } else {
        if (goog.isDefAndNotNull(value.functionDefinitionValue)) {
          visitReference(value.functionDefinitionValue.body);
        } else {
          if (goog.isDefAndNotNull(value.functionInvocationValue)) {
            var inv = value.functionInvocationValue;
            goog.isDefAndNotNull(inv.functionReference) && visitReference(inv.functionReference);
            Object.values(inv.arguments).forEach(visitValue);
          } else {
            goog.isDefAndNotNull(value.valueReference) && visitReference(value.valueReference);
          }
        }
      }
    }
  };
  visitReference(this.rootReference);
  return counts;
};
ee.rpc_convert_batch = {};
ee.rpc_convert_batch.ExportDestination = {DRIVE:"DRIVE", GCS:"GOOGLE_CLOUD_STORAGE", ASSET:"ASSET"};
ee.rpc_convert_batch.taskToExportImageRequest = function(params) {
  if (!goog.isDefAndNotNull(params.element)) {
    throw Error('"element" not found in params ' + params);
  }
  var result = {expression:ee.Serializer.encodeCloudApi(params.element), description:stringOrNull_(params.description), fileExportOptions:null, assetExportOptions:null, grid:null, maxPixels:stringOrNull_(params.maxPixels), requestId:stringOrNull_(params.id)}, destination = ee.rpc_convert_batch.guessDestination_(params);
  switch(destination) {
    case ee.rpc_convert_batch.ExportDestination.GCS:
    case ee.rpc_convert_batch.ExportDestination.DRIVE:
      result.fileExportOptions = ee.rpc_convert_batch.buildImageFileExportOptions_(params, destination);
      break;
    case ee.rpc_convert_batch.ExportDestination.ASSET:
      result.assetExportOptions = ee.rpc_convert_batch.buildImageAssetExportOptions_(params);
      break;
    default:
      throw Error('Export destination "' + destination + '" unknown');
  }
  return result;
};
ee.rpc_convert_batch.taskToExportTableRequest = function(params) {
  if (!goog.isDefAndNotNull(params.element)) {
    throw Error('"element" not found in params ' + params);
  }
  var selectors = params.selectors || null;
  goog.isDefAndNotNull(selectors) && goog.isString(selectors) && (selectors = selectors.split(","));
  var result = {expression:ee.Serializer.encodeCloudApi(params.element), description:stringOrNull_(params.description), fileExportOptions:null, assetExportOptions:null, selectors:selectors, requestId:stringOrNull_(params.id)}, destination = ee.rpc_convert_batch.guessDestination_(params);
  switch(destination) {
    case ee.rpc_convert_batch.ExportDestination.GCS:
    case ee.rpc_convert_batch.ExportDestination.DRIVE:
      result.fileExportOptions = ee.rpc_convert_batch.buildTableFileExportOptions_(params, destination);
      break;
    case ee.rpc_convert_batch.ExportDestination.ASSET:
      result.assetExportOptions = ee.rpc_convert_batch.buildTableAssetExportOptions_(params);
      break;
    default:
      throw Error('Export destination "' + destination + '" unknown');
  }
  return result;
};
ee.rpc_convert_batch.taskToExportVideoRequest = function(params) {
  if (!goog.isDefAndNotNull(params.element)) {
    throw Error('"element" not found in params ' + params);
  }
  var result = {expression:ee.Serializer.encodeCloudApi(params.element), description:stringOrNull_(params.description), videoOptions:ee.rpc_convert_batch.buildVideoOptions_(params), fileExportOptions:null, requestId:stringOrNull_(params.id)};
  result.fileExportOptions = ee.rpc_convert_batch.buildVideoFileExportOptions_(params, ee.rpc_convert_batch.guessDestination_(params));
  return result;
};
ee.rpc_convert_batch.taskToExportMapRequest = function(params) {
  if (!goog.isDefAndNotNull(params.element)) {
    throw Error('"element" not found in params ' + params);
  }
  return {expression:ee.Serializer.encodeCloudApi(params.element), description:stringOrNull_(params.description), tileOptions:ee.rpc_convert_batch.buildTileOptions_(params), tileExportOptions:ee.rpc_convert_batch.buildImageFileExportOptions_(params, ee.rpc_convert_batch.ExportDestination.GCS), requestId:stringOrNull_(params.id)};
};
ee.rpc_convert_batch.taskToExportVideoMapRequest = function(params) {
  if (!goog.isDefAndNotNull(params.element)) {
    throw Error('"element" not found in params ' + params);
  }
  return {expression:ee.Serializer.encodeCloudApi(params.element), description:stringOrNull_(params.description), videoOptions:ee.rpc_convert_batch.buildVideoOptions_(params), tileOptions:ee.rpc_convert_batch.buildTileOptions_(params), tileExportOptions:ee.rpc_convert_batch.buildVideoFileExportOptions_(params, ee.rpc_convert_batch.ExportDestination.GCS), requestId:stringOrNull_(params.id)};
};
function stringOrNull_(value) {
  return goog.isDefAndNotNull(value) ? String(value) : null;
}
function numberOrNull_(value) {
  return goog.isDefAndNotNull(value) ? Number(value) : null;
}
ee.rpc_convert_batch.guessDestination_ = function(params) {
  var destination = ee.rpc_convert_batch.ExportDestination.DRIVE;
  if (!goog.isDefAndNotNull(params)) {
    return destination;
  }
  goog.isDefAndNotNull(params.outputBucket) || goog.isDefAndNotNull(params.outputPrefix) ? destination = ee.rpc_convert_batch.ExportDestination.GCS : goog.isDefAndNotNull(params.assetId) && (destination = ee.rpc_convert_batch.ExportDestination.ASSET);
  return destination;
};
ee.rpc_convert_batch.buildGeoTiffFormatOptions_ = function(params) {
  return {cloudOptimized:!!params.tiffCloudOptimized, skipEmptyFiles:!!params.tiffSkipEmptyFiles, tileDimensions:ee.rpc_convert_batch.buildGridDimensions_(params.tiffFileDimensions)};
};
ee.rpc_convert_batch.buildTfRecordFormatOptions_ = function(params) {
  var tfRecordOptions = {compress:!!params.tfrecordCompressed, maxSizeBytes:stringOrNull_(params.tfrecordMaxFileSize), sequenceData:!!params.tfrecordSequenceData, collapseBands:!!params.tfrecordCollapseBands, maxMaskedRatio:numberOrNull_(params.tfrecordMaskedThreshold), defaultValue:numberOrNull_(params.tfrecordDefaultValue), tileDimensions:ee.rpc_convert_batch.buildGridDimensions_(params.tfrecordFileDimensions), marginDimensions:ee.rpc_convert_batch.buildGridDimensions_(params.tfrecordKernelSize), 
  tensorDepths:null}, tensorDepths = params.tfrecordTensorDepths;
  if (goog.isDefAndNotNull(tensorDepths)) {
    if (goog.isObject(tensorDepths)) {
      var result = {};
      goog.object.forEach(tensorDepths, function(v, k) {
        if (!goog.isString(k) || !goog.isNumber(v)) {
          throw Error('"tensorDepths" option must be an object of type Object<string, number>');
        }
        result[k] = v;
      });
      tfRecordOptions.tensorDepths = result;
    } else {
      throw Error('"tensorDepths" option needs to have the form Object<string, number>.');
    }
  }
  return tfRecordOptions;
};
ee.rpc_convert_batch.buildImageFileExportOptions_ = function(params, destination) {
  var result = {cloudStorageDestination:null, driveDestination:null, geoTiffOptions:null, tfRecordOptions:null, fileFormat:ee.rpc_convert.fileFormat(params.fileFormat)};
  "GEO_TIFF" === result.fileFormat ? result.geoTiffOptions = ee.rpc_convert_batch.buildGeoTiffFormatOptions_(params) : "TF_RECORD_IMAGE" === result.fileFormat && (result.tfRecordOptions = ee.rpc_convert_batch.buildTfRecordFormatOptions_(params));
  destination === ee.rpc_convert_batch.ExportDestination.GCS ? result.cloudStorageDestination = ee.rpc_convert_batch.buildCloudExportDestination_(params) : result.driveDestination = ee.rpc_convert_batch.buildDriveExportDestination_(params);
  return result;
};
ee.rpc_convert_batch.buildImageAssetExportOptions_ = function(params) {
  return {destination:ee.rpc_convert_batch.buildEarthEngineExportDestination_(params), pyramidingPolicy:String(params.pyramidingPolicy || "PYRAMIDING_POLICY_UNSPECIFIED"), pyramidingPolicyOverrides:null};
};
ee.rpc_convert_batch.buildTableFileExportOptions_ = function(params, destination) {
  var result = {cloudStorageDestination:null, driveDestination:null, fileFormat:ee.rpc_convert.tableFileFormat(params.fileFormat)};
  destination === ee.rpc_convert_batch.ExportDestination.GCS ? result.cloudStorageDestination = ee.rpc_convert_batch.buildCloudExportDestination_(params) : result.driveDestination = ee.rpc_convert_batch.buildDriveExportDestination_(params);
  return result;
};
ee.rpc_convert_batch.buildTableAssetExportOptions_ = function(params) {
  return {destination:ee.rpc_convert_batch.buildEarthEngineExportDestination_(params)};
};
ee.rpc_convert_batch.buildVideoFileExportOptions_ = function(params, destination) {
  var result = {cloudStorageDestination:null, driveDestination:null, fileFormat:"MP4"};
  destination === ee.rpc_convert_batch.ExportDestination.GCS ? result.cloudStorageDestination = ee.rpc_convert_batch.buildCloudExportDestination_(params) : result.driveDestination = ee.rpc_convert_batch.buildDriveExportDestination_(params);
  return result;
};
ee.rpc_convert_batch.buildVideoOptions_ = function(params) {
  return {framesPerSecond:numberOrNull_(params.framesPerSecond), maxFrames:numberOrNull_(params.maxFrames), maxPixelsPerFrame:stringOrNull_(params.maxPixels)};
};
ee.rpc_convert_batch.buildTileOptions_ = function(params) {
  return {maxZoom:numberOrNull_(params.maxZoom), scale:numberOrNull_(params.scale), minZoom:numberOrNull_(params.minZoom), skipEmptyTiles:!!params.skipEmptyTiles, mapsApiKey:stringOrNull_(params.mapsApiKey), tileDimensions:ee.rpc_convert_batch.buildGridDimensions_(params.tileDimensions)};
};
ee.rpc_convert_batch.buildGridDimensions_ = function(dimensions) {
  if (!goog.isDefAndNotNull(dimensions)) {
    return null;
  }
  var result = {height:0, width:0};
  goog.isString(dimensions) && (dimensions = dimensions.split("x").map(Number));
  if (goog.isArray(dimensions)) {
    if (2 === dimensions.length) {
      result.height = dimensions[0], result.width = dimensions[1];
    } else {
      if (1 === dimensions.length) {
        result.height = dimensions[0], result.width = dimensions[0];
      } else {
        throw Error("Unable to construct grid from dimensions: " + dimensions);
      }
    }
  } else {
    if (goog.isObject(dimensions) && goog.isDefAndNotNull(dimensions.height) && goog.isDefAndNotNull(dimensions.width)) {
      result.height = dimensions.height, result.width = dimensions.width;
    } else {
      throw Error("Unable to construct grid from dimensions: " + dimensions);
    }
  }
  return result;
};
ee.rpc_convert_batch.buildCloudExportDestination_ = function(params) {
  return {bucket:stringOrNull_(params.outputBucket), filenamePrefix:stringOrNull_(params.outputPrefix), bucketCorsUris:null, permissions:null};
};
ee.rpc_convert_batch.buildDriveExportDestination_ = function(params) {
  return {folder:stringOrNull_(params.driveFolder), filenamePrefix:stringOrNull_(params.driveFileNamePrefix)};
};
ee.rpc_convert_batch.buildEarthEngineExportDestination_ = function(params) {
  return {name:stringOrNull_(params.assetId)};
};
var jspb = {BinaryConstants:{}, ConstBinaryMessage:function() {
}, BinaryMessage:function() {
}};
jspb.BinaryConstants.FieldType = {INVALID:-1, DOUBLE:1, FLOAT:2, INT64:3, UINT64:4, INT32:5, FIXED64:6, FIXED32:7, BOOL:8, STRING:9, GROUP:10, MESSAGE:11, BYTES:12, UINT32:13, ENUM:14, SFIXED32:15, SFIXED64:16, SINT32:17, SINT64:18, FHASH64:30, VHASH64:31};
jspb.BinaryConstants.WireType = {INVALID:-1, VARINT:0, FIXED64:1, DELIMITED:2, START_GROUP:3, END_GROUP:4, FIXED32:5};
jspb.BinaryConstants.FieldTypeToWireType = function(fieldType) {
  var fieldTypes = jspb.BinaryConstants.FieldType, wireTypes = jspb.BinaryConstants.WireType;
  switch(fieldType) {
    case fieldTypes.INT32:
    case fieldTypes.INT64:
    case fieldTypes.UINT32:
    case fieldTypes.UINT64:
    case fieldTypes.SINT32:
    case fieldTypes.SINT64:
    case fieldTypes.BOOL:
    case fieldTypes.ENUM:
    case fieldTypes.VHASH64:
      return wireTypes.VARINT;
    case fieldTypes.DOUBLE:
    case fieldTypes.FIXED64:
    case fieldTypes.SFIXED64:
    case fieldTypes.FHASH64:
      return wireTypes.FIXED64;
    case fieldTypes.STRING:
    case fieldTypes.MESSAGE:
    case fieldTypes.BYTES:
      return wireTypes.DELIMITED;
    case fieldTypes.FLOAT:
    case fieldTypes.FIXED32:
    case fieldTypes.SFIXED32:
      return wireTypes.FIXED32;
    default:
      return wireTypes.INVALID;
  }
};
jspb.BinaryConstants.INVALID_FIELD_NUMBER = -1;
jspb.BinaryConstants.FLOAT32_EPS = 1.401298464324817e-45;
jspb.BinaryConstants.FLOAT32_MIN = 1.1754943508222875e-38;
jspb.BinaryConstants.FLOAT32_MAX = 3.4028234663852886e+38;
jspb.BinaryConstants.FLOAT64_EPS = 5e-324;
jspb.BinaryConstants.FLOAT64_MIN = 2.2250738585072014e-308;
jspb.BinaryConstants.FLOAT64_MAX = 1.7976931348623157e+308;
jspb.BinaryConstants.TWO_TO_20 = 1048576;
jspb.BinaryConstants.TWO_TO_23 = 8388608;
jspb.BinaryConstants.TWO_TO_31 = 2147483648;
jspb.BinaryConstants.TWO_TO_32 = 4294967296;
jspb.BinaryConstants.TWO_TO_52 = 4503599627370496;
jspb.BinaryConstants.TWO_TO_63 = 9223372036854775808;
jspb.BinaryConstants.TWO_TO_64 = 18446744073709551616;
jspb.BinaryConstants.ZERO_HASH = "\x00\x00\x00\x00\x00\x00\x00\x00";
goog.crypt.stringToByteArray = function(str) {
  for (var output = [], p = 0, i = 0; i < str.length; i++) {
    var c = str.charCodeAt(i);
    255 < c && (output[p++] = c & 255, c >>= 8);
    output[p++] = c;
  }
  return output;
};
goog.crypt.byteArrayToString = function(bytes) {
  if (8192 >= bytes.length) {
    return String.fromCharCode.apply(null, bytes);
  }
  for (var str = "", i = 0; i < bytes.length; i += 8192) {
    var chunk = goog.array.slice(bytes, i, i + 8192);
    str += String.fromCharCode.apply(null, chunk);
  }
  return str;
};
goog.crypt.byteArrayToHex = function(array, opt_separator) {
  return goog.array.map(array, function(numByte) {
    var hexByte = numByte.toString(16);
    return 1 < hexByte.length ? hexByte : "0" + hexByte;
  }).join(opt_separator || "");
};
goog.crypt.hexToByteArray = function(hexString) {
  goog.asserts.assert(0 == hexString.length % 2, "Key string length must be multiple of 2");
  for (var arr = [], i = 0; i < hexString.length; i += 2) {
    arr.push(parseInt(hexString.substring(i, i + 2), 16));
  }
  return arr;
};
goog.crypt.stringToUtf8ByteArray = function(str) {
  for (var out = [], p = 0, i = 0; i < str.length; i++) {
    var c = str.charCodeAt(i);
    128 > c ? out[p++] = c : (2048 > c ? out[p++] = c >> 6 | 192 : (55296 == (c & 64512) && i + 1 < str.length && 56320 == (str.charCodeAt(i + 1) & 64512) ? (c = 65536 + ((c & 1023) << 10) + (str.charCodeAt(++i) & 1023), out[p++] = c >> 18 | 240, out[p++] = c >> 12 & 63 | 128) : out[p++] = c >> 12 | 224, out[p++] = c >> 6 & 63 | 128), out[p++] = c & 63 | 128);
  }
  return out;
};
goog.crypt.utf8ByteArrayToString = function(bytes) {
  for (var out = [], pos = 0, c = 0; pos < bytes.length;) {
    var c1 = bytes[pos++];
    if (128 > c1) {
      out[c++] = String.fromCharCode(c1);
    } else {
      if (191 < c1 && 224 > c1) {
        var c2 = bytes[pos++];
        out[c++] = String.fromCharCode((c1 & 31) << 6 | c2 & 63);
      } else {
        if (239 < c1 && 365 > c1) {
          c2 = bytes[pos++];
          var c3 = bytes[pos++], c4 = bytes[pos++], u = ((c1 & 7) << 18 | (c2 & 63) << 12 | (c3 & 63) << 6 | c4 & 63) - 65536;
          out[c++] = String.fromCharCode(55296 + (u >> 10));
          out[c++] = String.fromCharCode(56320 + (u & 1023));
        } else {
          c2 = bytes[pos++], c3 = bytes[pos++], out[c++] = String.fromCharCode((c1 & 15) << 12 | (c2 & 63) << 6 | c3 & 63);
        }
      }
    }
  }
  return out.join("");
};
goog.crypt.xorByteArray = function(bytes1, bytes2) {
  goog.asserts.assert(bytes1.length == bytes2.length, "XOR array lengths must match");
  for (var result = [], i = 0; i < bytes1.length; i++) {
    result.push(bytes1[i] ^ bytes2[i]);
  }
  return result;
};
goog.userAgent.product = {};
goog.userAgent.product.ASSUME_FIREFOX = !1;
goog.userAgent.product.ASSUME_IPHONE = !1;
goog.userAgent.product.ASSUME_IPAD = !1;
goog.userAgent.product.ASSUME_ANDROID = !1;
goog.userAgent.product.ASSUME_CHROME = !1;
goog.userAgent.product.ASSUME_SAFARI = !1;
goog.userAgent.product.PRODUCT_KNOWN_ = goog.userAgent.ASSUME_IE || goog.userAgent.ASSUME_EDGE || goog.userAgent.ASSUME_OPERA || goog.userAgent.product.ASSUME_FIREFOX || goog.userAgent.product.ASSUME_IPHONE || goog.userAgent.product.ASSUME_IPAD || goog.userAgent.product.ASSUME_ANDROID || goog.userAgent.product.ASSUME_CHROME || goog.userAgent.product.ASSUME_SAFARI;
goog.userAgent.product.OPERA = goog.userAgent.OPERA;
goog.userAgent.product.IE = goog.userAgent.IE;
goog.userAgent.product.EDGE = goog.userAgent.EDGE;
goog.userAgent.product.FIREFOX = goog.userAgent.product.PRODUCT_KNOWN_ ? goog.userAgent.product.ASSUME_FIREFOX : goog.labs.userAgent.browser.isFirefox();
goog.userAgent.product.isIphoneOrIpod_ = function() {
  return goog.labs.userAgent.platform.isIphone() || goog.labs.userAgent.platform.isIpod();
};
goog.userAgent.product.IPHONE = goog.userAgent.product.PRODUCT_KNOWN_ ? goog.userAgent.product.ASSUME_IPHONE : goog.userAgent.product.isIphoneOrIpod_();
goog.userAgent.product.IPAD = goog.userAgent.product.PRODUCT_KNOWN_ ? goog.userAgent.product.ASSUME_IPAD : goog.labs.userAgent.platform.isIpad();
goog.userAgent.product.ANDROID = goog.userAgent.product.PRODUCT_KNOWN_ ? goog.userAgent.product.ASSUME_ANDROID : goog.labs.userAgent.browser.isAndroidBrowser();
goog.userAgent.product.CHROME = goog.userAgent.product.PRODUCT_KNOWN_ ? goog.userAgent.product.ASSUME_CHROME : goog.labs.userAgent.browser.isChrome();
goog.userAgent.product.isSafariDesktop_ = function() {
  return goog.labs.userAgent.browser.isSafari() && !goog.labs.userAgent.platform.isIos();
};
goog.userAgent.product.SAFARI = goog.userAgent.product.PRODUCT_KNOWN_ ? goog.userAgent.product.ASSUME_SAFARI : goog.userAgent.product.isSafariDesktop_();
goog.crypt.base64 = {};
goog.crypt.base64.byteToCharMap_ = null;
goog.crypt.base64.charToByteMap_ = null;
goog.crypt.base64.byteToCharMapWebSafe_ = null;
goog.crypt.base64.ENCODED_VALS_BASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
goog.crypt.base64.ENCODED_VALS = goog.crypt.base64.ENCODED_VALS_BASE + "+/=";
goog.crypt.base64.ENCODED_VALS_WEBSAFE = goog.crypt.base64.ENCODED_VALS_BASE + "-_.";
goog.crypt.base64.ASSUME_NATIVE_SUPPORT_ = goog.userAgent.GECKO || goog.userAgent.WEBKIT && !goog.userAgent.product.SAFARI || goog.userAgent.OPERA;
goog.crypt.base64.HAS_NATIVE_ENCODE_ = goog.crypt.base64.ASSUME_NATIVE_SUPPORT_ || "function" == typeof goog.global.btoa;
goog.crypt.base64.HAS_NATIVE_DECODE_ = goog.crypt.base64.ASSUME_NATIVE_SUPPORT_ || !goog.userAgent.product.SAFARI && !goog.userAgent.IE && "function" == typeof goog.global.atob;
goog.crypt.base64.encodeByteArray = function(input, opt_webSafe) {
  goog.asserts.assert(goog.isArrayLike(input), "encodeByteArray takes an array as a parameter");
  goog.crypt.base64.init_();
  for (var byteToCharMap = opt_webSafe ? goog.crypt.base64.byteToCharMapWebSafe_ : goog.crypt.base64.byteToCharMap_, output = [], i = 0; i < input.length; i += 3) {
    var byte1 = input[i], haveByte2 = i + 1 < input.length, byte2 = haveByte2 ? input[i + 1] : 0, haveByte3 = i + 2 < input.length, byte3 = haveByte3 ? input[i + 2] : 0, outByte1 = byte1 >> 2, outByte2 = (byte1 & 3) << 4 | byte2 >> 4, outByte3 = (byte2 & 15) << 2 | byte3 >> 6, outByte4 = byte3 & 63;
    haveByte3 || (outByte4 = 64, haveByte2 || (outByte3 = 64));
    output.push(byteToCharMap[outByte1], byteToCharMap[outByte2], byteToCharMap[outByte3], byteToCharMap[outByte4]);
  }
  return output.join("");
};
goog.crypt.base64.encodeString = function(input, opt_webSafe) {
  return goog.crypt.base64.HAS_NATIVE_ENCODE_ && !opt_webSafe ? goog.global.btoa(input) : goog.crypt.base64.encodeByteArray(goog.crypt.stringToByteArray(input), opt_webSafe);
};
goog.crypt.base64.decodeString = function(input, opt_webSafe) {
  if (goog.crypt.base64.HAS_NATIVE_DECODE_ && !opt_webSafe) {
    return goog.global.atob(input);
  }
  var output = "";
  goog.crypt.base64.decodeStringInternal_(input, function pushByte(b) {
    output += String.fromCharCode(b);
  });
  return output;
};
goog.crypt.base64.decodeStringToByteArray = function(input, opt_ignored) {
  var output = [];
  goog.crypt.base64.decodeStringInternal_(input, function pushByte(b) {
    output.push(b);
  });
  return output;
};
goog.crypt.base64.decodeStringToUint8Array = function(input) {
  goog.asserts.assert(!goog.userAgent.IE || goog.userAgent.isVersionOrHigher("10"), "Browser does not support typed arrays");
  var len = input.length, placeholders = 0;
  "=" === input[len - 2] ? placeholders = 2 : "=" === input[len - 1] && (placeholders = 1);
  var output = new Uint8Array(Math.ceil(3 * len / 4) - placeholders), outLen = 0;
  goog.crypt.base64.decodeStringInternal_(input, function pushByte(b) {
    output[outLen++] = b;
  });
  return output.subarray(0, outLen);
};
goog.crypt.base64.decodeStringInternal_ = function(input, pushByte) {
  function getByte(default_val) {
    for (; nextCharIndex < input.length;) {
      var ch = input.charAt(nextCharIndex++), b = goog.crypt.base64.charToByteMap_[ch];
      if (null != b) {
        return b;
      }
      if (!goog.string.isEmptyOrWhitespace(ch)) {
        throw Error("Unknown base64 encoding at char: " + ch);
      }
    }
    return default_val;
  }
  goog.crypt.base64.init_();
  for (var nextCharIndex = 0;;) {
    var byte1 = getByte(-1), byte2 = getByte(0), byte3 = getByte(64), byte4 = getByte(64);
    if (64 === byte4 && -1 === byte1) {
      break;
    }
    pushByte(byte1 << 2 | byte2 >> 4);
    64 != byte3 && (pushByte(byte2 << 4 & 240 | byte3 >> 2), 64 != byte4 && pushByte(byte3 << 6 & 192 | byte4));
  }
};
goog.crypt.base64.init_ = function() {
  if (!goog.crypt.base64.byteToCharMap_) {
    goog.crypt.base64.byteToCharMap_ = {};
    goog.crypt.base64.charToByteMap_ = {};
    goog.crypt.base64.byteToCharMapWebSafe_ = {};
    for (var i = 0; i < goog.crypt.base64.ENCODED_VALS.length; i++) {
      goog.crypt.base64.byteToCharMap_[i] = goog.crypt.base64.ENCODED_VALS.charAt(i), goog.crypt.base64.charToByteMap_[goog.crypt.base64.byteToCharMap_[i]] = i, goog.crypt.base64.byteToCharMapWebSafe_[i] = goog.crypt.base64.ENCODED_VALS_WEBSAFE.charAt(i), i >= goog.crypt.base64.ENCODED_VALS_BASE.length && (goog.crypt.base64.charToByteMap_[goog.crypt.base64.ENCODED_VALS_WEBSAFE.charAt(i)] = i);
    }
  }
};
jspb.utils = {};
jspb.utils.split64Low = 0;
jspb.utils.split64High = 0;
jspb.utils.splitUint64 = function(value) {
  var lowBits = value >>> 0, highBits = Math.floor((value - lowBits) / jspb.BinaryConstants.TWO_TO_32) >>> 0;
  jspb.utils.split64Low = lowBits;
  jspb.utils.split64High = highBits;
};
jspb.utils.splitInt64 = function(value) {
  var sign = 0 > value;
  value = Math.abs(value);
  var lowBits = value >>> 0, highBits = Math.floor((value - lowBits) / jspb.BinaryConstants.TWO_TO_32);
  highBits >>>= 0;
  sign && (highBits = ~highBits >>> 0, lowBits = (~lowBits >>> 0) + 1, 4294967295 < lowBits && (lowBits = 0, highBits++, 4294967295 < highBits && (highBits = 0)));
  jspb.utils.split64Low = lowBits;
  jspb.utils.split64High = highBits;
};
jspb.utils.splitZigzag64 = function(value) {
  var sign = 0 > value;
  value = 2 * Math.abs(value);
  jspb.utils.splitUint64(value);
  var lowBits = jspb.utils.split64Low, highBits = jspb.utils.split64High;
  sign && (0 == lowBits ? 0 == highBits ? highBits = lowBits = 4294967295 : (highBits--, lowBits = 4294967295) : lowBits--);
  jspb.utils.split64Low = lowBits;
  jspb.utils.split64High = highBits;
};
jspb.utils.splitFloat32 = function(value) {
  var sign = 0 > value ? 1 : 0;
  value = sign ? -value : value;
  if (0 === value) {
    0 < 1 / value ? (jspb.utils.split64High = 0, jspb.utils.split64Low = 0) : (jspb.utils.split64High = 0, jspb.utils.split64Low = 2147483648);
  } else {
    if (isNaN(value)) {
      jspb.utils.split64High = 0, jspb.utils.split64Low = 2147483647;
    } else {
      if (value > jspb.BinaryConstants.FLOAT32_MAX) {
        jspb.utils.split64High = 0, jspb.utils.split64Low = (sign << 31 | 2139095040) >>> 0;
      } else {
        if (value < jspb.BinaryConstants.FLOAT32_MIN) {
          var mant = Math.round(value / Math.pow(2, -149));
          jspb.utils.split64High = 0;
          jspb.utils.split64Low = (sign << 31 | mant) >>> 0;
        } else {
          var exp = Math.floor(Math.log(value) / Math.LN2);
          mant = value * Math.pow(2, -exp);
          mant = Math.round(mant * jspb.BinaryConstants.TWO_TO_23) & 8388607;
          jspb.utils.split64High = 0;
          jspb.utils.split64Low = (sign << 31 | exp + 127 << 23 | mant) >>> 0;
        }
      }
    }
  }
};
jspb.utils.splitFloat64 = function(value) {
  var sign = 0 > value ? 1 : 0;
  value = sign ? -value : value;
  if (0 === value) {
    jspb.utils.split64High = 0 < 1 / value ? 0 : 2147483648, jspb.utils.split64Low = 0;
  } else {
    if (isNaN(value)) {
      jspb.utils.split64High = 2147483647, jspb.utils.split64Low = 4294967295;
    } else {
      if (value > jspb.BinaryConstants.FLOAT64_MAX) {
        jspb.utils.split64High = (sign << 31 | 2146435072) >>> 0, jspb.utils.split64Low = 0;
      } else {
        if (value < jspb.BinaryConstants.FLOAT64_MIN) {
          var mant = value / Math.pow(2, -1074), mantHigh = mant / jspb.BinaryConstants.TWO_TO_32;
          jspb.utils.split64High = (sign << 31 | mantHigh) >>> 0;
          jspb.utils.split64Low = mant >>> 0;
        } else {
          var exp = Math.floor(Math.log(value) / Math.LN2);
          1024 == exp && (exp = 1023);
          mant = value * Math.pow(2, -exp);
          mantHigh = mant * jspb.BinaryConstants.TWO_TO_20 & 1048575;
          var mantLow = mant * jspb.BinaryConstants.TWO_TO_52 >>> 0;
          jspb.utils.split64High = (sign << 31 | exp + 1023 << 20 | mantHigh) >>> 0;
          jspb.utils.split64Low = mantLow;
        }
      }
    }
  }
};
jspb.utils.splitHash64 = function(hash) {
  var e = hash.charCodeAt(4), f = hash.charCodeAt(5), g = hash.charCodeAt(6), h = hash.charCodeAt(7);
  jspb.utils.split64Low = hash.charCodeAt(0) + (hash.charCodeAt(1) << 8) + (hash.charCodeAt(2) << 16) + (hash.charCodeAt(3) << 24) >>> 0;
  jspb.utils.split64High = e + (f << 8) + (g << 16) + (h << 24) >>> 0;
};
jspb.utils.joinUint64 = function(bitsLow, bitsHigh) {
  return bitsHigh * jspb.BinaryConstants.TWO_TO_32 + bitsLow;
};
jspb.utils.joinInt64 = function(bitsLow, bitsHigh) {
  var sign = bitsHigh & 2147483648;
  sign && (bitsLow = ~bitsLow + 1 >>> 0, bitsHigh = ~bitsHigh >>> 0, 0 == bitsLow && (bitsHigh = bitsHigh + 1 >>> 0));
  var result = jspb.utils.joinUint64(bitsLow, bitsHigh);
  return sign ? -result : result;
};
jspb.utils.joinZigzag64 = function(bitsLow, bitsHigh) {
  var sign = bitsLow & 1;
  bitsLow = (bitsLow >>> 1 | bitsHigh << 31) >>> 0;
  bitsHigh >>>= 1;
  sign && (bitsLow = bitsLow + 1 >>> 0, 0 == bitsLow && (bitsHigh = bitsHigh + 1 >>> 0));
  var result = jspb.utils.joinUint64(bitsLow, bitsHigh);
  return sign ? -result : result;
};
jspb.utils.joinFloat32 = function(bitsLow, bitsHigh) {
  var sign = 2 * (bitsLow >> 31) + 1, exp = bitsLow >>> 23 & 255, mant = bitsLow & 8388607;
  return 255 == exp ? mant ? NaN : Infinity * sign : 0 == exp ? sign * Math.pow(2, -149) * mant : sign * Math.pow(2, exp - 150) * (mant + Math.pow(2, 23));
};
jspb.utils.joinFloat64 = function(bitsLow, bitsHigh) {
  var sign = 2 * (bitsHigh >> 31) + 1, exp = bitsHigh >>> 20 & 2047, mant = jspb.BinaryConstants.TWO_TO_32 * (bitsHigh & 1048575) + bitsLow;
  return 2047 == exp ? mant ? NaN : Infinity * sign : 0 == exp ? sign * Math.pow(2, -1074) * mant : sign * Math.pow(2, exp - 1075) * (mant + jspb.BinaryConstants.TWO_TO_52);
};
jspb.utils.joinHash64 = function(bitsLow, bitsHigh) {
  return String.fromCharCode(bitsLow >>> 0 & 255, bitsLow >>> 8 & 255, bitsLow >>> 16 & 255, bitsLow >>> 24 & 255, bitsHigh >>> 0 & 255, bitsHigh >>> 8 & 255, bitsHigh >>> 16 & 255, bitsHigh >>> 24 & 255);
};
jspb.utils.DIGITS = "0123456789abcdef".split("");
jspb.utils.joinUnsignedDecimalString = function(bitsLow, bitsHigh) {
  function emit(digit) {
    for (var temp = 10000000, i = 0; 7 > i; i++) {
      temp /= 10;
      var decimalDigit = digit / temp % 10 >>> 0;
      if (0 != decimalDigit || start) {
        start = !0, result += table[decimalDigit];
      }
    }
  }
  if (2097151 >= bitsHigh) {
    return "" + (jspb.BinaryConstants.TWO_TO_32 * bitsHigh + bitsLow);
  }
  var mid = (bitsLow >>> 24 | bitsHigh << 8) >>> 0 & 16777215, high = bitsHigh >> 16 & 65535, digitA = (bitsLow & 16777215) + 6777216 * mid + 6710656 * high, digitB = mid + 8147497 * high, digitC = 2 * high;
  10000000 <= digitA && (digitB += Math.floor(digitA / 10000000), digitA %= 10000000);
  10000000 <= digitB && (digitC += Math.floor(digitB / 10000000), digitB %= 10000000);
  var table = jspb.utils.DIGITS, start = !1, result = "";
  (digitC || start) && emit(digitC);
  (digitB || start) && emit(digitB);
  (digitA || start) && emit(digitA);
  return result;
};
jspb.utils.joinSignedDecimalString = function(bitsLow, bitsHigh) {
  var negative = bitsHigh & 2147483648;
  negative && (bitsLow = ~bitsLow + 1 >>> 0, bitsHigh = ~bitsHigh + (0 == bitsLow ? 1 : 0) >>> 0);
  var result = jspb.utils.joinUnsignedDecimalString(bitsLow, bitsHigh);
  return negative ? "-" + result : result;
};
jspb.utils.hash64ToDecimalString = function(hash, signed) {
  jspb.utils.splitHash64(hash);
  var bitsLow = jspb.utils.split64Low, bitsHigh = jspb.utils.split64High;
  return signed ? jspb.utils.joinSignedDecimalString(bitsLow, bitsHigh) : jspb.utils.joinUnsignedDecimalString(bitsLow, bitsHigh);
};
jspb.utils.hash64ArrayToDecimalStrings = function(hashes, signed) {
  for (var result = Array(hashes.length), i = 0; i < hashes.length; i++) {
    result[i] = jspb.utils.hash64ToDecimalString(hashes[i], signed);
  }
  return result;
};
jspb.utils.decimalStringToHash64 = function(dec) {
  function muladd(m, c) {
    for (var i = 0; 8 > i && (1 !== m || 0 < c); i++) {
      var r = m * resultBytes[i] + c;
      resultBytes[i] = r & 255;
      c = r >>> 8;
    }
  }
  function neg() {
    for (var i = 0; 8 > i; i++) {
      resultBytes[i] = ~resultBytes[i] & 255;
    }
  }
  goog.asserts.assert(0 < dec.length);
  var minus = !1;
  "-" === dec[0] && (minus = !0, dec = dec.slice(1));
  for (var resultBytes = [0, 0, 0, 0, 0, 0, 0, 0], i$jscomp$0 = 0; i$jscomp$0 < dec.length; i$jscomp$0++) {
    muladd(10, jspb.utils.DIGITS.indexOf(dec[i$jscomp$0]));
  }
  minus && (neg(), muladd(1, 1));
  return goog.crypt.byteArrayToString(resultBytes);
};
jspb.utils.splitDecimalString = function(value) {
  jspb.utils.splitHash64(jspb.utils.decimalStringToHash64(value));
};
jspb.utils.hash64ToHexString = function(hash) {
  var temp = Array(18);
  temp[0] = "0";
  temp[1] = "x";
  for (var i = 0; 8 > i; i++) {
    var c = hash.charCodeAt(7 - i);
    temp[2 * i + 2] = jspb.utils.DIGITS[c >> 4];
    temp[2 * i + 3] = jspb.utils.DIGITS[c & 15];
  }
  return temp.join("");
};
jspb.utils.hexStringToHash64 = function(hex) {
  hex = hex.toLowerCase();
  goog.asserts.assert(18 == hex.length);
  goog.asserts.assert("0" == hex[0]);
  goog.asserts.assert("x" == hex[1]);
  for (var result = "", i = 0; 8 > i; i++) {
    var hi = jspb.utils.DIGITS.indexOf(hex[2 * i + 2]), lo = jspb.utils.DIGITS.indexOf(hex[2 * i + 3]);
    result = String.fromCharCode(16 * hi + lo) + result;
  }
  return result;
};
jspb.utils.hash64ToNumber = function(hash, signed) {
  jspb.utils.splitHash64(hash);
  var bitsLow = jspb.utils.split64Low, bitsHigh = jspb.utils.split64High;
  return signed ? jspb.utils.joinInt64(bitsLow, bitsHigh) : jspb.utils.joinUint64(bitsLow, bitsHigh);
};
jspb.utils.numberToHash64 = function(value) {
  jspb.utils.splitInt64(value);
  return jspb.utils.joinHash64(jspb.utils.split64Low, jspb.utils.split64High);
};
jspb.utils.countVarints = function(buffer, start, end) {
  for (var count = 0, i = start; i < end; i++) {
    count += buffer[i] >> 7;
  }
  return end - start - count;
};
jspb.utils.countVarintFields = function(buffer, start, end, field) {
  var count = 0, cursor = start, tag = 8 * field + jspb.BinaryConstants.WireType.VARINT;
  if (128 > tag) {
    for (; cursor < end && buffer[cursor++] == tag;) {
      for (count++;;) {
        var x = buffer[cursor++];
        if (0 == (x & 128)) {
          break;
        }
      }
    }
  } else {
    for (; cursor < end;) {
      for (var temp = tag; 128 < temp;) {
        if (buffer[cursor] != (temp & 127 | 128)) {
          return count;
        }
        cursor++;
        temp >>= 7;
      }
      if (buffer[cursor++] != temp) {
        break;
      }
      for (count++; x = buffer[cursor++], 0 != (x & 128);) {
      }
    }
  }
  return count;
};
jspb.utils.countFixedFields_ = function(buffer, start, end, tag, stride) {
  var count = 0, cursor = start;
  if (128 > tag) {
    for (; cursor < end && buffer[cursor++] == tag;) {
      count++, cursor += stride;
    }
  } else {
    for (; cursor < end;) {
      for (var temp = tag; 128 < temp;) {
        if (buffer[cursor++] != (temp & 127 | 128)) {
          return count;
        }
        temp >>= 7;
      }
      if (buffer[cursor++] != temp) {
        break;
      }
      count++;
      cursor += stride;
    }
  }
  return count;
};
jspb.utils.countFixed32Fields = function(buffer, start, end, field) {
  return jspb.utils.countFixedFields_(buffer, start, end, 8 * field + jspb.BinaryConstants.WireType.FIXED32, 4);
};
jspb.utils.countFixed64Fields = function(buffer, start, end, field) {
  return jspb.utils.countFixedFields_(buffer, start, end, 8 * field + jspb.BinaryConstants.WireType.FIXED64, 8);
};
jspb.utils.countDelimitedFields = function(buffer, start, end, field) {
  for (var count = 0, cursor = start, tag = 8 * field + jspb.BinaryConstants.WireType.DELIMITED; cursor < end;) {
    for (var temp = tag; 128 < temp;) {
      if (buffer[cursor++] != (temp & 127 | 128)) {
        return count;
      }
      temp >>= 7;
    }
    if (buffer[cursor++] != temp) {
      break;
    }
    count++;
    for (var length = 0, shift = 1; temp = buffer[cursor++], length += (temp & 127) * shift, shift *= 128, 0 != (temp & 128);) {
    }
    cursor += length;
  }
  return count;
};
jspb.utils.debugBytesToTextFormat = function(byteSource) {
  var s = '"';
  if (byteSource) {
    for (var bytes = jspb.utils.byteSourceToUint8Array(byteSource), i = 0; i < bytes.length; i++) {
      s += "\\x", 16 > bytes[i] && (s += "0"), s += bytes[i].toString(16);
    }
  }
  return s + '"';
};
jspb.utils.debugScalarToTextFormat = function(scalar) {
  return goog.isString(scalar) ? goog.string.quote(scalar) : scalar.toString();
};
jspb.utils.stringToByteArray = function(str) {
  for (var arr = new Uint8Array(str.length), i = 0; i < str.length; i++) {
    var codepoint = str.charCodeAt(i);
    if (255 < codepoint) {
      throw Error("Conversion error: string contains codepoint outside of byte range");
    }
    arr[i] = codepoint;
  }
  return arr;
};
jspb.utils.byteSourceToUint8Array = function(data) {
  if (data.constructor === Uint8Array) {
    return data;
  }
  if (data.constructor === ArrayBuffer) {
    return new Uint8Array(data);
  }
  if (data.constructor === Array) {
    return new Uint8Array(data);
  }
  if (data.constructor === String) {
    return goog.crypt.base64.decodeStringToUint8Array(data);
  }
  goog.asserts.fail("Type not convertible to Uint8Array.");
  return new Uint8Array(0);
};
jspb.BinaryIterator = function(opt_decoder, opt_next, opt_elements) {
  this.elements_ = this.nextMethod_ = this.decoder_ = null;
  this.cursor_ = 0;
  this.nextValue_ = null;
  this.atEnd_ = !0;
  this.init_(opt_decoder, opt_next, opt_elements);
};
jspb.BinaryIterator.prototype.init_ = function(opt_decoder, opt_next, opt_elements) {
  opt_decoder && opt_next && (this.decoder_ = opt_decoder, this.nextMethod_ = opt_next);
  this.elements_ = opt_elements || null;
  this.cursor_ = 0;
  this.nextValue_ = null;
  this.atEnd_ = !this.decoder_ && !this.elements_;
  this.next();
};
jspb.BinaryIterator.instanceCache_ = [];
jspb.BinaryIterator.alloc = function(opt_decoder, opt_next, opt_elements) {
  if (jspb.BinaryIterator.instanceCache_.length) {
    var iterator = jspb.BinaryIterator.instanceCache_.pop();
    iterator.init_(opt_decoder, opt_next, opt_elements);
    return iterator;
  }
  return new jspb.BinaryIterator(opt_decoder, opt_next, opt_elements);
};
jspb.BinaryIterator.prototype.free = function() {
  this.clear();
  100 > jspb.BinaryIterator.instanceCache_.length && jspb.BinaryIterator.instanceCache_.push(this);
};
jspb.BinaryIterator.prototype.clear = function() {
  this.decoder_ && this.decoder_.free();
  this.elements_ = this.nextMethod_ = this.decoder_ = null;
  this.cursor_ = 0;
  this.nextValue_ = null;
  this.atEnd_ = !0;
};
jspb.BinaryIterator.prototype.get = function() {
  return this.nextValue_;
};
jspb.BinaryIterator.prototype.atEnd = function() {
  return this.atEnd_;
};
jspb.BinaryIterator.prototype.next = function() {
  var lastValue = this.nextValue_;
  this.decoder_ ? this.decoder_.atEnd() ? (this.nextValue_ = null, this.atEnd_ = !0) : this.nextValue_ = this.nextMethod_.call(this.decoder_) : this.elements_ && (this.cursor_ == this.elements_.length ? (this.nextValue_ = null, this.atEnd_ = !0) : this.nextValue_ = this.elements_[this.cursor_++]);
  return lastValue;
};
jspb.BinaryDecoder = function(opt_bytes, opt_start, opt_length) {
  this.bytes_ = null;
  this.tempHigh_ = this.tempLow_ = this.cursor_ = this.end_ = this.start_ = 0;
  this.error_ = !1;
  opt_bytes && this.setBlock(opt_bytes, opt_start, opt_length);
};
jspb.BinaryDecoder.instanceCache_ = [];
jspb.BinaryDecoder.alloc = function(opt_bytes, opt_start, opt_length) {
  if (jspb.BinaryDecoder.instanceCache_.length) {
    var newDecoder = jspb.BinaryDecoder.instanceCache_.pop();
    opt_bytes && newDecoder.setBlock(opt_bytes, opt_start, opt_length);
    return newDecoder;
  }
  return new jspb.BinaryDecoder(opt_bytes, opt_start, opt_length);
};
jspb.BinaryDecoder.prototype.free = function() {
  this.clear();
  100 > jspb.BinaryDecoder.instanceCache_.length && jspb.BinaryDecoder.instanceCache_.push(this);
};
jspb.BinaryDecoder.prototype.clone = function() {
  return jspb.BinaryDecoder.alloc(this.bytes_, this.start_, this.end_ - this.start_);
};
jspb.BinaryDecoder.prototype.clear = function() {
  this.bytes_ = null;
  this.cursor_ = this.end_ = this.start_ = 0;
  this.error_ = !1;
};
jspb.BinaryDecoder.prototype.getBuffer = function() {
  return this.bytes_;
};
jspb.BinaryDecoder.prototype.setBlock = function(data, opt_start, opt_length) {
  this.bytes_ = jspb.utils.byteSourceToUint8Array(data);
  this.start_ = goog.isDef(opt_start) ? opt_start : 0;
  this.end_ = goog.isDef(opt_length) ? this.start_ + opt_length : this.bytes_.length;
  this.cursor_ = this.start_;
};
jspb.BinaryDecoder.prototype.getEnd = function() {
  return this.end_;
};
jspb.BinaryDecoder.prototype.setEnd = function(end) {
  this.end_ = end;
};
jspb.BinaryDecoder.prototype.reset = function() {
  this.cursor_ = this.start_;
};
jspb.BinaryDecoder.prototype.getCursor = function() {
  return this.cursor_;
};
jspb.BinaryDecoder.prototype.setCursor = function(cursor) {
  this.cursor_ = cursor;
};
jspb.BinaryDecoder.prototype.advance = function(count) {
  this.cursor_ += count;
  goog.asserts.assert(this.cursor_ <= this.end_);
};
jspb.BinaryDecoder.prototype.atEnd = function() {
  return this.cursor_ == this.end_;
};
jspb.BinaryDecoder.prototype.pastEnd = function() {
  return this.cursor_ > this.end_;
};
jspb.BinaryDecoder.prototype.getError = function() {
  return this.error_ || 0 > this.cursor_ || this.cursor_ > this.end_;
};
jspb.BinaryDecoder.prototype.readSplitVarint64_ = function() {
  for (var temp, lowBits = 0, highBits, i = 0; 4 > i; i++) {
    if (temp = this.bytes_[this.cursor_++], lowBits |= (temp & 127) << 7 * i, 128 > temp) {
      this.tempLow_ = lowBits >>> 0;
      this.tempHigh_ = 0;
      return;
    }
  }
  temp = this.bytes_[this.cursor_++];
  lowBits |= (temp & 127) << 28;
  highBits = 0 | (temp & 127) >> 4;
  if (128 > temp) {
    this.tempLow_ = lowBits >>> 0, this.tempHigh_ = highBits >>> 0;
  } else {
    for (i = 0; 5 > i; i++) {
      if (temp = this.bytes_[this.cursor_++], highBits |= (temp & 127) << 7 * i + 3, 128 > temp) {
        this.tempLow_ = lowBits >>> 0;
        this.tempHigh_ = highBits >>> 0;
        return;
      }
    }
    goog.asserts.fail("Failed to read varint, encoding is invalid.");
    this.error_ = !0;
  }
};
jspb.BinaryDecoder.prototype.skipVarint = function() {
  for (; this.bytes_[this.cursor_] & 128;) {
    this.cursor_++;
  }
  this.cursor_++;
};
jspb.BinaryDecoder.prototype.unskipVarint = function(value) {
  for (; 128 < value;) {
    this.cursor_--, value >>>= 7;
  }
  this.cursor_--;
};
jspb.BinaryDecoder.prototype.readUnsignedVarint32 = function() {
  var bytes = this.bytes_;
  var temp = bytes[this.cursor_ + 0];
  var x = temp & 127;
  if (128 > temp) {
    return this.cursor_ += 1, goog.asserts.assert(this.cursor_ <= this.end_), x;
  }
  temp = bytes[this.cursor_ + 1];
  x |= (temp & 127) << 7;
  if (128 > temp) {
    return this.cursor_ += 2, goog.asserts.assert(this.cursor_ <= this.end_), x;
  }
  temp = bytes[this.cursor_ + 2];
  x |= (temp & 127) << 14;
  if (128 > temp) {
    return this.cursor_ += 3, goog.asserts.assert(this.cursor_ <= this.end_), x;
  }
  temp = bytes[this.cursor_ + 3];
  x |= (temp & 127) << 21;
  if (128 > temp) {
    return this.cursor_ += 4, goog.asserts.assert(this.cursor_ <= this.end_), x;
  }
  temp = bytes[this.cursor_ + 4];
  x |= (temp & 15) << 28;
  if (128 > temp) {
    return this.cursor_ += 5, goog.asserts.assert(this.cursor_ <= this.end_), x >>> 0;
  }
  this.cursor_ += 5;
  128 <= bytes[this.cursor_++] && 128 <= bytes[this.cursor_++] && 128 <= bytes[this.cursor_++] && 128 <= bytes[this.cursor_++] && 128 <= bytes[this.cursor_++] && goog.asserts.assert(!1);
  goog.asserts.assert(this.cursor_ <= this.end_);
  return x;
};
jspb.BinaryDecoder.prototype.readSignedVarint32 = jspb.BinaryDecoder.prototype.readUnsignedVarint32;
jspb.BinaryDecoder.prototype.readUnsignedVarint32String = function() {
  return this.readUnsignedVarint32().toString();
};
jspb.BinaryDecoder.prototype.readSignedVarint32String = function() {
  return this.readSignedVarint32().toString();
};
jspb.BinaryDecoder.prototype.readZigzagVarint32 = function() {
  var result = this.readUnsignedVarint32();
  return result >>> 1 ^ -(result & 1);
};
jspb.BinaryDecoder.prototype.readUnsignedVarint64 = function() {
  this.readSplitVarint64_();
  return jspb.utils.joinUint64(this.tempLow_, this.tempHigh_);
};
jspb.BinaryDecoder.prototype.readUnsignedVarint64String = function() {
  this.readSplitVarint64_();
  return jspb.utils.joinUnsignedDecimalString(this.tempLow_, this.tempHigh_);
};
jspb.BinaryDecoder.prototype.readSignedVarint64 = function() {
  this.readSplitVarint64_();
  return jspb.utils.joinInt64(this.tempLow_, this.tempHigh_);
};
jspb.BinaryDecoder.prototype.readSignedVarint64String = function() {
  this.readSplitVarint64_();
  return jspb.utils.joinSignedDecimalString(this.tempLow_, this.tempHigh_);
};
jspb.BinaryDecoder.prototype.readZigzagVarint64 = function() {
  this.readSplitVarint64_();
  return jspb.utils.joinZigzag64(this.tempLow_, this.tempHigh_);
};
jspb.BinaryDecoder.prototype.readZigzagVarint64String = function() {
  return this.readZigzagVarint64().toString();
};
jspb.BinaryDecoder.prototype.readUint8 = function() {
  var a = this.bytes_[this.cursor_ + 0];
  this.cursor_ += 1;
  goog.asserts.assert(this.cursor_ <= this.end_);
  return a;
};
jspb.BinaryDecoder.prototype.readUint16 = function() {
  var a = this.bytes_[this.cursor_ + 0], b = this.bytes_[this.cursor_ + 1];
  this.cursor_ += 2;
  goog.asserts.assert(this.cursor_ <= this.end_);
  return a << 0 | b << 8;
};
jspb.BinaryDecoder.prototype.readUint32 = function() {
  var a = this.bytes_[this.cursor_ + 0], b = this.bytes_[this.cursor_ + 1], c = this.bytes_[this.cursor_ + 2], d = this.bytes_[this.cursor_ + 3];
  this.cursor_ += 4;
  goog.asserts.assert(this.cursor_ <= this.end_);
  return (a << 0 | b << 8 | c << 16 | d << 24) >>> 0;
};
jspb.BinaryDecoder.prototype.readUint64 = function() {
  var bitsLow = this.readUint32(), bitsHigh = this.readUint32();
  return jspb.utils.joinUint64(bitsLow, bitsHigh);
};
jspb.BinaryDecoder.prototype.readUint64String = function() {
  var bitsLow = this.readUint32(), bitsHigh = this.readUint32();
  return jspb.utils.joinUnsignedDecimalString(bitsLow, bitsHigh);
};
jspb.BinaryDecoder.prototype.readInt8 = function() {
  var a = this.bytes_[this.cursor_ + 0];
  this.cursor_ += 1;
  goog.asserts.assert(this.cursor_ <= this.end_);
  return a << 24 >> 24;
};
jspb.BinaryDecoder.prototype.readInt16 = function() {
  var a = this.bytes_[this.cursor_ + 0], b = this.bytes_[this.cursor_ + 1];
  this.cursor_ += 2;
  goog.asserts.assert(this.cursor_ <= this.end_);
  return (a << 0 | b << 8) << 16 >> 16;
};
jspb.BinaryDecoder.prototype.readInt32 = function() {
  var a = this.bytes_[this.cursor_ + 0], b = this.bytes_[this.cursor_ + 1], c = this.bytes_[this.cursor_ + 2], d = this.bytes_[this.cursor_ + 3];
  this.cursor_ += 4;
  goog.asserts.assert(this.cursor_ <= this.end_);
  return a << 0 | b << 8 | c << 16 | d << 24;
};
jspb.BinaryDecoder.prototype.readInt64 = function() {
  var bitsLow = this.readUint32(), bitsHigh = this.readUint32();
  return jspb.utils.joinInt64(bitsLow, bitsHigh);
};
jspb.BinaryDecoder.prototype.readInt64String = function() {
  var bitsLow = this.readUint32(), bitsHigh = this.readUint32();
  return jspb.utils.joinSignedDecimalString(bitsLow, bitsHigh);
};
jspb.BinaryDecoder.prototype.readFloat = function() {
  var bitsLow = this.readUint32();
  return jspb.utils.joinFloat32(bitsLow, 0);
};
jspb.BinaryDecoder.prototype.readDouble = function() {
  var bitsLow = this.readUint32(), bitsHigh = this.readUint32();
  return jspb.utils.joinFloat64(bitsLow, bitsHigh);
};
jspb.BinaryDecoder.prototype.readBool = function() {
  return !!this.bytes_[this.cursor_++];
};
jspb.BinaryDecoder.prototype.readEnum = function() {
  return this.readSignedVarint32();
};
jspb.BinaryDecoder.prototype.readString = function(length) {
  for (var bytes = this.bytes_, cursor = this.cursor_, end = cursor + length, codeUnits = [], result = ""; cursor < end;) {
    var c = bytes[cursor++];
    if (128 > c) {
      codeUnits.push(c);
    } else {
      if (192 > c) {
        continue;
      } else {
        if (224 > c) {
          var c2 = bytes[cursor++];
          codeUnits.push((c & 31) << 6 | c2 & 63);
        } else {
          if (240 > c) {
            c2 = bytes[cursor++];
            var c3 = bytes[cursor++];
            codeUnits.push((c & 15) << 12 | (c2 & 63) << 6 | c3 & 63);
          } else {
            if (248 > c) {
              c2 = bytes[cursor++];
              c3 = bytes[cursor++];
              var c4 = bytes[cursor++], codepoint = (c & 7) << 18 | (c2 & 63) << 12 | (c3 & 63) << 6 | c4 & 63;
              codepoint -= 65536;
              codeUnits.push((codepoint >> 10 & 1023) + 55296, (codepoint & 1023) + 56320);
            }
          }
        }
      }
    }
    8192 <= codeUnits.length && (result += String.fromCharCode.apply(null, codeUnits), codeUnits.length = 0);
  }
  result += goog.crypt.byteArrayToString(codeUnits);
  this.cursor_ = cursor;
  return result;
};
jspb.BinaryDecoder.prototype.readStringWithLength = function() {
  var length = this.readUnsignedVarint32();
  return this.readString(length);
};
jspb.BinaryDecoder.prototype.readBytes = function(length) {
  if (0 > length || this.cursor_ + length > this.bytes_.length) {
    return this.error_ = !0, goog.asserts.fail("Invalid byte length!"), new Uint8Array(0);
  }
  var result = this.bytes_.subarray(this.cursor_, this.cursor_ + length);
  this.cursor_ += length;
  goog.asserts.assert(this.cursor_ <= this.end_);
  return result;
};
jspb.BinaryDecoder.prototype.readVarintHash64 = function() {
  this.readSplitVarint64_();
  return jspb.utils.joinHash64(this.tempLow_, this.tempHigh_);
};
jspb.BinaryDecoder.prototype.readFixedHash64 = function() {
  var bytes = this.bytes_, cursor = this.cursor_, a = bytes[cursor + 0], b = bytes[cursor + 1], c = bytes[cursor + 2], d = bytes[cursor + 3], e = bytes[cursor + 4], f = bytes[cursor + 5], g = bytes[cursor + 6], h = bytes[cursor + 7];
  this.cursor_ += 8;
  return String.fromCharCode(a, b, c, d, e, f, g, h);
};
jspb.BinaryReader = function(opt_bytes, opt_start, opt_length) {
  this.decoder_ = jspb.BinaryDecoder.alloc(opt_bytes, opt_start, opt_length);
  this.fieldCursor_ = this.decoder_.getCursor();
  this.nextField_ = jspb.BinaryConstants.INVALID_FIELD_NUMBER;
  this.nextWireType_ = jspb.BinaryConstants.WireType.INVALID;
  this.error_ = !1;
  this.readCallbacks_ = null;
};
jspb.BinaryReader.instanceCache_ = [];
jspb.BinaryReader.alloc = function(opt_bytes, opt_start, opt_length) {
  if (jspb.BinaryReader.instanceCache_.length) {
    var newReader = jspb.BinaryReader.instanceCache_.pop();
    opt_bytes && newReader.decoder_.setBlock(opt_bytes, opt_start, opt_length);
    return newReader;
  }
  return new jspb.BinaryReader(opt_bytes, opt_start, opt_length);
};
jspb.BinaryReader.prototype.alloc = jspb.BinaryReader.alloc;
jspb.BinaryReader.prototype.free = function() {
  this.decoder_.clear();
  this.nextField_ = jspb.BinaryConstants.INVALID_FIELD_NUMBER;
  this.nextWireType_ = jspb.BinaryConstants.WireType.INVALID;
  this.error_ = !1;
  this.readCallbacks_ = null;
  100 > jspb.BinaryReader.instanceCache_.length && jspb.BinaryReader.instanceCache_.push(this);
};
jspb.BinaryReader.prototype.getFieldCursor = function() {
  return this.fieldCursor_;
};
jspb.BinaryReader.prototype.getCursor = function() {
  return this.decoder_.getCursor();
};
jspb.BinaryReader.prototype.getBuffer = function() {
  return this.decoder_.getBuffer();
};
jspb.BinaryReader.prototype.getFieldNumber = function() {
  return this.nextField_;
};
jspb.BinaryReader.prototype.getWireType = function() {
  return this.nextWireType_;
};
jspb.BinaryReader.prototype.isEndGroup = function() {
  return this.nextWireType_ == jspb.BinaryConstants.WireType.END_GROUP;
};
jspb.BinaryReader.prototype.getError = function() {
  return this.error_ || this.decoder_.getError();
};
jspb.BinaryReader.prototype.setBlock = function(bytes, start, length) {
  this.decoder_.setBlock(bytes, start, length);
  this.nextField_ = jspb.BinaryConstants.INVALID_FIELD_NUMBER;
  this.nextWireType_ = jspb.BinaryConstants.WireType.INVALID;
};
jspb.BinaryReader.prototype.reset = function() {
  this.decoder_.reset();
  this.nextField_ = jspb.BinaryConstants.INVALID_FIELD_NUMBER;
  this.nextWireType_ = jspb.BinaryConstants.WireType.INVALID;
};
jspb.BinaryReader.prototype.advance = function(count) {
  this.decoder_.advance(count);
};
jspb.BinaryReader.prototype.nextField = function() {
  if (this.decoder_.atEnd()) {
    return !1;
  }
  if (this.getError()) {
    return goog.asserts.fail("Decoder hit an error"), !1;
  }
  this.fieldCursor_ = this.decoder_.getCursor();
  var header = this.decoder_.readUnsignedVarint32(), nextField = header >>> 3, nextWireType = header & 7;
  if (nextWireType != jspb.BinaryConstants.WireType.VARINT && nextWireType != jspb.BinaryConstants.WireType.FIXED32 && nextWireType != jspb.BinaryConstants.WireType.FIXED64 && nextWireType != jspb.BinaryConstants.WireType.DELIMITED && nextWireType != jspb.BinaryConstants.WireType.START_GROUP && nextWireType != jspb.BinaryConstants.WireType.END_GROUP) {
    return goog.asserts.fail("Invalid wire type: %s (at position %s)", nextWireType, this.fieldCursor_), this.error_ = !0, !1;
  }
  this.nextField_ = nextField;
  this.nextWireType_ = nextWireType;
  return !0;
};
jspb.BinaryReader.prototype.unskipHeader = function() {
  this.decoder_.unskipVarint(this.nextField_ << 3 | this.nextWireType_);
};
jspb.BinaryReader.prototype.skipMatchingFields = function() {
  var field = this.nextField_;
  for (this.unskipHeader(); this.nextField() && this.getFieldNumber() == field;) {
    this.skipField();
  }
  this.decoder_.atEnd() || this.unskipHeader();
};
jspb.BinaryReader.prototype.skipVarintField = function() {
  this.nextWireType_ != jspb.BinaryConstants.WireType.VARINT ? (goog.asserts.fail("Invalid wire type for skipVarintField"), this.skipField()) : this.decoder_.skipVarint();
};
jspb.BinaryReader.prototype.skipDelimitedField = function() {
  if (this.nextWireType_ != jspb.BinaryConstants.WireType.DELIMITED) {
    goog.asserts.fail("Invalid wire type for skipDelimitedField"), this.skipField();
  } else {
    var length = this.decoder_.readUnsignedVarint32();
    this.decoder_.advance(length);
  }
};
jspb.BinaryReader.prototype.skipFixed32Field = function() {
  this.nextWireType_ != jspb.BinaryConstants.WireType.FIXED32 ? (goog.asserts.fail("Invalid wire type for skipFixed32Field"), this.skipField()) : this.decoder_.advance(4);
};
jspb.BinaryReader.prototype.skipFixed64Field = function() {
  this.nextWireType_ != jspb.BinaryConstants.WireType.FIXED64 ? (goog.asserts.fail("Invalid wire type for skipFixed64Field"), this.skipField()) : this.decoder_.advance(8);
};
jspb.BinaryReader.prototype.skipGroup = function() {
  var previousField = this.nextField_;
  do {
    if (!this.nextField()) {
      goog.asserts.fail("Unmatched start-group tag: stream EOF");
      this.error_ = !0;
      break;
    }
    if (this.nextWireType_ == jspb.BinaryConstants.WireType.END_GROUP) {
      this.nextField_ != previousField && (goog.asserts.fail("Unmatched end-group tag"), this.error_ = !0);
      break;
    }
    this.skipField();
  } while (1);
};
jspb.BinaryReader.prototype.skipField = function() {
  switch(this.nextWireType_) {
    case jspb.BinaryConstants.WireType.VARINT:
      this.skipVarintField();
      break;
    case jspb.BinaryConstants.WireType.FIXED64:
      this.skipFixed64Field();
      break;
    case jspb.BinaryConstants.WireType.DELIMITED:
      this.skipDelimitedField();
      break;
    case jspb.BinaryConstants.WireType.FIXED32:
      this.skipFixed32Field();
      break;
    case jspb.BinaryConstants.WireType.START_GROUP:
      this.skipGroup();
      break;
    default:
      goog.asserts.fail("Invalid wire encoding for field.");
  }
};
jspb.BinaryReader.prototype.registerReadCallback = function(callbackName, callback) {
  goog.isNull(this.readCallbacks_) && (this.readCallbacks_ = {});
  goog.asserts.assert(!this.readCallbacks_[callbackName]);
  this.readCallbacks_[callbackName] = callback;
};
jspb.BinaryReader.prototype.runReadCallback = function(callbackName) {
  goog.asserts.assert(!goog.isNull(this.readCallbacks_));
  var callback = this.readCallbacks_[callbackName];
  goog.asserts.assert(callback);
  return callback(this);
};
jspb.BinaryReader.prototype.readAny = function(fieldType) {
  this.nextWireType_ = jspb.BinaryConstants.FieldTypeToWireType(fieldType);
  var fieldTypes = jspb.BinaryConstants.FieldType;
  switch(fieldType) {
    case fieldTypes.DOUBLE:
      return this.readDouble();
    case fieldTypes.FLOAT:
      return this.readFloat();
    case fieldTypes.INT64:
      return this.readInt64();
    case fieldTypes.UINT64:
      return this.readUint64();
    case fieldTypes.INT32:
      return this.readInt32();
    case fieldTypes.FIXED64:
      return this.readFixed64();
    case fieldTypes.FIXED32:
      return this.readFixed32();
    case fieldTypes.BOOL:
      return this.readBool();
    case fieldTypes.STRING:
      return this.readString();
    case fieldTypes.GROUP:
      goog.asserts.fail("Group field type not supported in readAny()");
    case fieldTypes.MESSAGE:
      goog.asserts.fail("Message field type not supported in readAny()");
    case fieldTypes.BYTES:
      return this.readBytes();
    case fieldTypes.UINT32:
      return this.readUint32();
    case fieldTypes.ENUM:
      return this.readEnum();
    case fieldTypes.SFIXED32:
      return this.readSfixed32();
    case fieldTypes.SFIXED64:
      return this.readSfixed64();
    case fieldTypes.SINT32:
      return this.readSint32();
    case fieldTypes.SINT64:
      return this.readSint64();
    case fieldTypes.FHASH64:
      return this.readFixedHash64();
    case fieldTypes.VHASH64:
      return this.readVarintHash64();
    default:
      goog.asserts.fail("Invalid field type in readAny()");
  }
  return 0;
};
jspb.BinaryReader.prototype.readMessage = function(message, reader) {
  goog.asserts.assert(this.nextWireType_ == jspb.BinaryConstants.WireType.DELIMITED);
  var oldEnd = this.decoder_.getEnd(), length = this.decoder_.readUnsignedVarint32(), newEnd = this.decoder_.getCursor() + length;
  this.decoder_.setEnd(newEnd);
  reader(message, this);
  this.decoder_.setCursor(newEnd);
  this.decoder_.setEnd(oldEnd);
};
jspb.BinaryReader.prototype.readGroup = function(field, message, reader) {
  goog.asserts.assert(this.nextWireType_ == jspb.BinaryConstants.WireType.START_GROUP);
  goog.asserts.assert(this.nextField_ == field);
  reader(message, this);
  this.error_ || this.nextWireType_ == jspb.BinaryConstants.WireType.END_GROUP || (goog.asserts.fail("Group submessage did not end with an END_GROUP tag"), this.error_ = !0);
};
jspb.BinaryReader.prototype.getFieldDecoder = function() {
  goog.asserts.assert(this.nextWireType_ == jspb.BinaryConstants.WireType.DELIMITED);
  var length = this.decoder_.readUnsignedVarint32(), start = this.decoder_.getCursor(), end = start + length, innerDecoder = jspb.BinaryDecoder.alloc(this.decoder_.getBuffer(), start, length);
  this.decoder_.setCursor(end);
  return innerDecoder;
};
jspb.BinaryReader.prototype.readInt32 = function() {
  goog.asserts.assert(this.nextWireType_ == jspb.BinaryConstants.WireType.VARINT);
  return this.decoder_.readSignedVarint32();
};
jspb.BinaryReader.prototype.readInt32String = function() {
  goog.asserts.assert(this.nextWireType_ == jspb.BinaryConstants.WireType.VARINT);
  return this.decoder_.readSignedVarint32String();
};
jspb.BinaryReader.prototype.readInt64 = function() {
  goog.asserts.assert(this.nextWireType_ == jspb.BinaryConstants.WireType.VARINT);
  return this.decoder_.readSignedVarint64();
};
jspb.BinaryReader.prototype.readInt64String = function() {
  goog.asserts.assert(this.nextWireType_ == jspb.BinaryConstants.WireType.VARINT);
  return this.decoder_.readSignedVarint64String();
};
jspb.BinaryReader.prototype.readUint32 = function() {
  goog.asserts.assert(this.nextWireType_ == jspb.BinaryConstants.WireType.VARINT);
  return this.decoder_.readUnsignedVarint32();
};
jspb.BinaryReader.prototype.readUint32String = function() {
  goog.asserts.assert(this.nextWireType_ == jspb.BinaryConstants.WireType.VARINT);
  return this.decoder_.readUnsignedVarint32String();
};
jspb.BinaryReader.prototype.readUint64 = function() {
  goog.asserts.assert(this.nextWireType_ == jspb.BinaryConstants.WireType.VARINT);
  return this.decoder_.readUnsignedVarint64();
};
jspb.BinaryReader.prototype.readUint64String = function() {
  goog.asserts.assert(this.nextWireType_ == jspb.BinaryConstants.WireType.VARINT);
  return this.decoder_.readUnsignedVarint64String();
};
jspb.BinaryReader.prototype.readSint32 = function() {
  goog.asserts.assert(this.nextWireType_ == jspb.BinaryConstants.WireType.VARINT);
  return this.decoder_.readZigzagVarint32();
};
jspb.BinaryReader.prototype.readSint64 = function() {
  goog.asserts.assert(this.nextWireType_ == jspb.BinaryConstants.WireType.VARINT);
  return this.decoder_.readZigzagVarint64();
};
jspb.BinaryReader.prototype.readSint64String = function() {
  goog.asserts.assert(this.nextWireType_ == jspb.BinaryConstants.WireType.VARINT);
  return this.decoder_.readZigzagVarint64String();
};
jspb.BinaryReader.prototype.readFixed32 = function() {
  goog.asserts.assert(this.nextWireType_ == jspb.BinaryConstants.WireType.FIXED32);
  return this.decoder_.readUint32();
};
jspb.BinaryReader.prototype.readFixed64 = function() {
  goog.asserts.assert(this.nextWireType_ == jspb.BinaryConstants.WireType.FIXED64);
  return this.decoder_.readUint64();
};
jspb.BinaryReader.prototype.readFixed64String = function() {
  goog.asserts.assert(this.nextWireType_ == jspb.BinaryConstants.WireType.FIXED64);
  return this.decoder_.readUint64String();
};
jspb.BinaryReader.prototype.readSfixed32 = function() {
  goog.asserts.assert(this.nextWireType_ == jspb.BinaryConstants.WireType.FIXED32);
  return this.decoder_.readInt32();
};
jspb.BinaryReader.prototype.readSfixed32String = function() {
  goog.asserts.assert(this.nextWireType_ == jspb.BinaryConstants.WireType.FIXED32);
  return this.decoder_.readInt32().toString();
};
jspb.BinaryReader.prototype.readSfixed64 = function() {
  goog.asserts.assert(this.nextWireType_ == jspb.BinaryConstants.WireType.FIXED64);
  return this.decoder_.readInt64();
};
jspb.BinaryReader.prototype.readSfixed64String = function() {
  goog.asserts.assert(this.nextWireType_ == jspb.BinaryConstants.WireType.FIXED64);
  return this.decoder_.readInt64String();
};
jspb.BinaryReader.prototype.readFloat = function() {
  goog.asserts.assert(this.nextWireType_ == jspb.BinaryConstants.WireType.FIXED32);
  return this.decoder_.readFloat();
};
jspb.BinaryReader.prototype.readDouble = function() {
  goog.asserts.assert(this.nextWireType_ == jspb.BinaryConstants.WireType.FIXED64);
  return this.decoder_.readDouble();
};
jspb.BinaryReader.prototype.readBool = function() {
  goog.asserts.assert(this.nextWireType_ == jspb.BinaryConstants.WireType.VARINT);
  return !!this.decoder_.readUnsignedVarint32();
};
jspb.BinaryReader.prototype.readEnum = function() {
  goog.asserts.assert(this.nextWireType_ == jspb.BinaryConstants.WireType.VARINT);
  return this.decoder_.readSignedVarint64();
};
jspb.BinaryReader.prototype.readString = function() {
  goog.asserts.assert(this.nextWireType_ == jspb.BinaryConstants.WireType.DELIMITED);
  var length = this.decoder_.readUnsignedVarint32();
  return this.decoder_.readString(length);
};
jspb.BinaryReader.prototype.readBytes = function() {
  goog.asserts.assert(this.nextWireType_ == jspb.BinaryConstants.WireType.DELIMITED);
  var length = this.decoder_.readUnsignedVarint32();
  return this.decoder_.readBytes(length);
};
jspb.BinaryReader.prototype.readVarintHash64 = function() {
  goog.asserts.assert(this.nextWireType_ == jspb.BinaryConstants.WireType.VARINT);
  return this.decoder_.readVarintHash64();
};
jspb.BinaryReader.prototype.readFixedHash64 = function() {
  goog.asserts.assert(this.nextWireType_ == jspb.BinaryConstants.WireType.FIXED64);
  return this.decoder_.readFixedHash64();
};
jspb.BinaryReader.prototype.readPackedField_ = function(decodeMethod) {
  goog.asserts.assert(this.nextWireType_ == jspb.BinaryConstants.WireType.DELIMITED);
  for (var length = this.decoder_.readUnsignedVarint32(), end = this.decoder_.getCursor() + length, result = []; this.decoder_.getCursor() < end;) {
    result.push(decodeMethod.call(this.decoder_));
  }
  return result;
};
jspb.BinaryReader.prototype.readPackedInt32 = function() {
  return this.readPackedField_(this.decoder_.readSignedVarint32);
};
jspb.BinaryReader.prototype.readPackedInt32String = function() {
  return this.readPackedField_(this.decoder_.readSignedVarint32String);
};
jspb.BinaryReader.prototype.readPackedInt64 = function() {
  return this.readPackedField_(this.decoder_.readSignedVarint64);
};
jspb.BinaryReader.prototype.readPackedInt64String = function() {
  return this.readPackedField_(this.decoder_.readSignedVarint64String);
};
jspb.BinaryReader.prototype.readPackedUint32 = function() {
  return this.readPackedField_(this.decoder_.readUnsignedVarint32);
};
jspb.BinaryReader.prototype.readPackedUint32String = function() {
  return this.readPackedField_(this.decoder_.readUnsignedVarint32String);
};
jspb.BinaryReader.prototype.readPackedUint64 = function() {
  return this.readPackedField_(this.decoder_.readUnsignedVarint64);
};
jspb.BinaryReader.prototype.readPackedUint64String = function() {
  return this.readPackedField_(this.decoder_.readUnsignedVarint64String);
};
jspb.BinaryReader.prototype.readPackedSint32 = function() {
  return this.readPackedField_(this.decoder_.readZigzagVarint32);
};
jspb.BinaryReader.prototype.readPackedSint64 = function() {
  return this.readPackedField_(this.decoder_.readZigzagVarint64);
};
jspb.BinaryReader.prototype.readPackedSint64String = function() {
  return this.readPackedField_(this.decoder_.readZigzagVarint64String);
};
jspb.BinaryReader.prototype.readPackedFixed32 = function() {
  return this.readPackedField_(this.decoder_.readUint32);
};
jspb.BinaryReader.prototype.readPackedFixed64 = function() {
  return this.readPackedField_(this.decoder_.readUint64);
};
jspb.BinaryReader.prototype.readPackedFixed64String = function() {
  return this.readPackedField_(this.decoder_.readUint64String);
};
jspb.BinaryReader.prototype.readPackedSfixed32 = function() {
  return this.readPackedField_(this.decoder_.readInt32);
};
jspb.BinaryReader.prototype.readPackedSfixed64 = function() {
  return this.readPackedField_(this.decoder_.readInt64);
};
jspb.BinaryReader.prototype.readPackedSfixed64String = function() {
  return this.readPackedField_(this.decoder_.readInt64String);
};
jspb.BinaryReader.prototype.readPackedFloat = function() {
  return this.readPackedField_(this.decoder_.readFloat);
};
jspb.BinaryReader.prototype.readPackedDouble = function() {
  return this.readPackedField_(this.decoder_.readDouble);
};
jspb.BinaryReader.prototype.readPackedBool = function() {
  return this.readPackedField_(this.decoder_.readBool);
};
jspb.BinaryReader.prototype.readPackedEnum = function() {
  return this.readPackedField_(this.decoder_.readEnum);
};
jspb.BinaryReader.prototype.readPackedVarintHash64 = function() {
  return this.readPackedField_(this.decoder_.readVarintHash64);
};
jspb.BinaryReader.prototype.readPackedFixedHash64 = function() {
  return this.readPackedField_(this.decoder_.readFixedHash64);
};
jspb.arith = {};
jspb.arith.UInt64 = function(lo, hi) {
  this.lo = lo;
  this.hi = hi;
};
jspb.arith.UInt64.prototype.cmp = function(other) {
  return this.hi < other.hi || this.hi == other.hi && this.lo < other.lo ? -1 : this.hi == other.hi && this.lo == other.lo ? 0 : 1;
};
jspb.arith.UInt64.prototype.rightShift = function() {
  return new jspb.arith.UInt64((this.lo >>> 1 | (this.hi & 1) << 31) >>> 0, this.hi >>> 1 >>> 0);
};
jspb.arith.UInt64.prototype.leftShift = function() {
  return new jspb.arith.UInt64(this.lo << 1 >>> 0, (this.hi << 1 | this.lo >>> 31) >>> 0);
};
jspb.arith.UInt64.prototype.msb = function() {
  return !!(this.hi & 2147483648);
};
jspb.arith.UInt64.prototype.lsb = function() {
  return !!(this.lo & 1);
};
jspb.arith.UInt64.prototype.zero = function() {
  return 0 == this.lo && 0 == this.hi;
};
jspb.arith.UInt64.prototype.add = function(other) {
  return new jspb.arith.UInt64((this.lo + other.lo & 4294967295) >>> 0 >>> 0, ((this.hi + other.hi & 4294967295) >>> 0) + (4294967296 <= this.lo + other.lo ? 1 : 0) >>> 0);
};
jspb.arith.UInt64.prototype.sub = function(other) {
  return new jspb.arith.UInt64((this.lo - other.lo & 4294967295) >>> 0 >>> 0, ((this.hi - other.hi & 4294967295) >>> 0) - (0 > this.lo - other.lo ? 1 : 0) >>> 0);
};
jspb.arith.UInt64.mul32x32 = function(a, b) {
  for (var aLow = a & 65535, aHigh = a >>> 16, bLow = b & 65535, bHigh = b >>> 16, productLow = aLow * bLow + 65536 * (aLow * bHigh & 65535) + 65536 * (aHigh * bLow & 65535), productHigh = aHigh * bHigh + (aLow * bHigh >>> 16) + (aHigh * bLow >>> 16); 4294967296 <= productLow;) {
    productLow -= 4294967296, productHigh += 1;
  }
  return new jspb.arith.UInt64(productLow >>> 0, productHigh >>> 0);
};
jspb.arith.UInt64.prototype.mul = function(a) {
  var lo = jspb.arith.UInt64.mul32x32(this.lo, a), hi = jspb.arith.UInt64.mul32x32(this.hi, a);
  hi.hi = hi.lo;
  hi.lo = 0;
  return lo.add(hi);
};
jspb.arith.UInt64.prototype.div = function(_divisor) {
  if (0 == _divisor) {
    return [];
  }
  for (var quotient = new jspb.arith.UInt64(0, 0), remainder = new jspb.arith.UInt64(this.lo, this.hi), divisor = new jspb.arith.UInt64(_divisor, 0), unit = new jspb.arith.UInt64(1, 0); !divisor.msb();) {
    divisor = divisor.leftShift(), unit = unit.leftShift();
  }
  for (; !unit.zero();) {
    0 >= divisor.cmp(remainder) && (quotient = quotient.add(unit), remainder = remainder.sub(divisor)), divisor = divisor.rightShift(), unit = unit.rightShift();
  }
  return [quotient, remainder];
};
jspb.arith.UInt64.prototype.toString = function() {
  for (var result = "", num = this; !num.zero();) {
    var divResult = num.div(10), quotient = divResult[0];
    result = divResult[1].lo + result;
    num = quotient;
  }
  "" == result && (result = "0");
  return result;
};
jspb.arith.UInt64.fromString = function(s) {
  for (var result = new jspb.arith.UInt64(0, 0), digit64 = new jspb.arith.UInt64(0, 0), i = 0; i < s.length; i++) {
    if ("0" > s[i] || "9" < s[i]) {
      return null;
    }
    digit64.lo = parseInt(s[i], 10);
    result = result.mul(10).add(digit64);
  }
  return result;
};
jspb.arith.UInt64.prototype.clone = function() {
  return new jspb.arith.UInt64(this.lo, this.hi);
};
jspb.arith.Int64 = function(lo, hi) {
  this.lo = lo;
  this.hi = hi;
};
jspb.arith.Int64.prototype.add = function(other) {
  return new jspb.arith.Int64((this.lo + other.lo & 4294967295) >>> 0 >>> 0, ((this.hi + other.hi & 4294967295) >>> 0) + (4294967296 <= this.lo + other.lo ? 1 : 0) >>> 0);
};
jspb.arith.Int64.prototype.sub = function(other) {
  return new jspb.arith.Int64((this.lo - other.lo & 4294967295) >>> 0 >>> 0, ((this.hi - other.hi & 4294967295) >>> 0) - (0 > this.lo - other.lo ? 1 : 0) >>> 0);
};
jspb.arith.Int64.prototype.clone = function() {
  return new jspb.arith.Int64(this.lo, this.hi);
};
jspb.arith.Int64.prototype.toString = function() {
  var sign = 0 != (this.hi & 2147483648), num = new jspb.arith.UInt64(this.lo, this.hi);
  sign && (num = (new jspb.arith.UInt64(0, 0)).sub(num));
  return (sign ? "-" : "") + num.toString();
};
jspb.arith.Int64.fromString = function(s) {
  var hasNegative = 0 < s.length && "-" == s[0];
  hasNegative && (s = s.substring(1));
  var num = jspb.arith.UInt64.fromString(s);
  if (null === num) {
    return null;
  }
  hasNegative && (num = (new jspb.arith.UInt64(0, 0)).sub(num));
  return new jspb.arith.Int64(num.lo, num.hi);
};
jspb.BinaryEncoder = function() {
  this.buffer_ = [];
};
jspb.BinaryEncoder.prototype.length = function() {
  return this.buffer_.length;
};
jspb.BinaryEncoder.prototype.end = function() {
  var buffer = this.buffer_;
  this.buffer_ = [];
  return buffer;
};
jspb.BinaryEncoder.prototype.writeSplitVarint64 = function(lowBits, highBits) {
  goog.asserts.assert(lowBits == Math.floor(lowBits));
  goog.asserts.assert(highBits == Math.floor(highBits));
  goog.asserts.assert(0 <= lowBits && lowBits < jspb.BinaryConstants.TWO_TO_32);
  for (goog.asserts.assert(0 <= highBits && highBits < jspb.BinaryConstants.TWO_TO_32); 0 < highBits || 127 < lowBits;) {
    this.buffer_.push(lowBits & 127 | 128), lowBits = (lowBits >>> 7 | highBits << 25) >>> 0, highBits >>>= 7;
  }
  this.buffer_.push(lowBits);
};
jspb.BinaryEncoder.prototype.writeSplitFixed64 = function(lowBits, highBits) {
  goog.asserts.assert(lowBits == Math.floor(lowBits));
  goog.asserts.assert(highBits == Math.floor(highBits));
  goog.asserts.assert(0 <= lowBits && lowBits < jspb.BinaryConstants.TWO_TO_32);
  goog.asserts.assert(0 <= highBits && highBits < jspb.BinaryConstants.TWO_TO_32);
  this.writeUint32(lowBits);
  this.writeUint32(highBits);
};
jspb.BinaryEncoder.prototype.writeUnsignedVarint32 = function(value) {
  goog.asserts.assert(value == Math.floor(value));
  for (goog.asserts.assert(0 <= value && value < jspb.BinaryConstants.TWO_TO_32); 127 < value;) {
    this.buffer_.push(value & 127 | 128), value >>>= 7;
  }
  this.buffer_.push(value);
};
jspb.BinaryEncoder.prototype.writeSignedVarint32 = function(value) {
  goog.asserts.assert(value == Math.floor(value));
  goog.asserts.assert(value >= -jspb.BinaryConstants.TWO_TO_31 && value < jspb.BinaryConstants.TWO_TO_31);
  if (0 <= value) {
    this.writeUnsignedVarint32(value);
  } else {
    for (var i = 0; 9 > i; i++) {
      this.buffer_.push(value & 127 | 128), value >>= 7;
    }
    this.buffer_.push(1);
  }
};
jspb.BinaryEncoder.prototype.writeUnsignedVarint64 = function(value) {
  goog.asserts.assert(value == Math.floor(value));
  goog.asserts.assert(0 <= value && value < jspb.BinaryConstants.TWO_TO_64);
  jspb.utils.splitInt64(value);
  this.writeSplitVarint64(jspb.utils.split64Low, jspb.utils.split64High);
};
jspb.BinaryEncoder.prototype.writeSignedVarint64 = function(value) {
  goog.asserts.assert(value == Math.floor(value));
  goog.asserts.assert(value >= -jspb.BinaryConstants.TWO_TO_63 && value < jspb.BinaryConstants.TWO_TO_63);
  jspb.utils.splitInt64(value);
  this.writeSplitVarint64(jspb.utils.split64Low, jspb.utils.split64High);
};
jspb.BinaryEncoder.prototype.writeZigzagVarint32 = function(value) {
  goog.asserts.assert(value == Math.floor(value));
  goog.asserts.assert(value >= -jspb.BinaryConstants.TWO_TO_31 && value < jspb.BinaryConstants.TWO_TO_31);
  this.writeUnsignedVarint32((value << 1 ^ value >> 31) >>> 0);
};
jspb.BinaryEncoder.prototype.writeZigzagVarint64 = function(value) {
  goog.asserts.assert(value == Math.floor(value));
  goog.asserts.assert(value >= -jspb.BinaryConstants.TWO_TO_63 && value < jspb.BinaryConstants.TWO_TO_63);
  jspb.utils.splitZigzag64(value);
  this.writeSplitVarint64(jspb.utils.split64Low, jspb.utils.split64High);
};
jspb.BinaryEncoder.prototype.writeZigzagVarint64String = function(value) {
  this.writeZigzagVarint64(parseInt(value, 10));
};
jspb.BinaryEncoder.prototype.writeUint8 = function(value) {
  goog.asserts.assert(value == Math.floor(value));
  goog.asserts.assert(0 <= value && 256 > value);
  this.buffer_.push(value >>> 0 & 255);
};
jspb.BinaryEncoder.prototype.writeUint16 = function(value) {
  goog.asserts.assert(value == Math.floor(value));
  goog.asserts.assert(0 <= value && 65536 > value);
  this.buffer_.push(value >>> 0 & 255);
  this.buffer_.push(value >>> 8 & 255);
};
jspb.BinaryEncoder.prototype.writeUint32 = function(value) {
  goog.asserts.assert(value == Math.floor(value));
  goog.asserts.assert(0 <= value && value < jspb.BinaryConstants.TWO_TO_32);
  this.buffer_.push(value >>> 0 & 255);
  this.buffer_.push(value >>> 8 & 255);
  this.buffer_.push(value >>> 16 & 255);
  this.buffer_.push(value >>> 24 & 255);
};
jspb.BinaryEncoder.prototype.writeUint64 = function(value) {
  goog.asserts.assert(value == Math.floor(value));
  goog.asserts.assert(0 <= value && value < jspb.BinaryConstants.TWO_TO_64);
  jspb.utils.splitUint64(value);
  this.writeUint32(jspb.utils.split64Low);
  this.writeUint32(jspb.utils.split64High);
};
jspb.BinaryEncoder.prototype.writeInt8 = function(value) {
  goog.asserts.assert(value == Math.floor(value));
  goog.asserts.assert(-128 <= value && 128 > value);
  this.buffer_.push(value >>> 0 & 255);
};
jspb.BinaryEncoder.prototype.writeInt16 = function(value) {
  goog.asserts.assert(value == Math.floor(value));
  goog.asserts.assert(-32768 <= value && 32768 > value);
  this.buffer_.push(value >>> 0 & 255);
  this.buffer_.push(value >>> 8 & 255);
};
jspb.BinaryEncoder.prototype.writeInt32 = function(value) {
  goog.asserts.assert(value == Math.floor(value));
  goog.asserts.assert(value >= -jspb.BinaryConstants.TWO_TO_31 && value < jspb.BinaryConstants.TWO_TO_31);
  this.buffer_.push(value >>> 0 & 255);
  this.buffer_.push(value >>> 8 & 255);
  this.buffer_.push(value >>> 16 & 255);
  this.buffer_.push(value >>> 24 & 255);
};
jspb.BinaryEncoder.prototype.writeInt64 = function(value) {
  goog.asserts.assert(value == Math.floor(value));
  goog.asserts.assert(value >= -jspb.BinaryConstants.TWO_TO_63 && value < jspb.BinaryConstants.TWO_TO_63);
  jspb.utils.splitInt64(value);
  this.writeSplitFixed64(jspb.utils.split64Low, jspb.utils.split64High);
};
jspb.BinaryEncoder.prototype.writeInt64String = function(value) {
  goog.asserts.assert(value == Math.floor(value));
  goog.asserts.assert(+value >= -jspb.BinaryConstants.TWO_TO_63 && +value < jspb.BinaryConstants.TWO_TO_63);
  jspb.utils.splitHash64(jspb.utils.decimalStringToHash64(value));
  this.writeSplitFixed64(jspb.utils.split64Low, jspb.utils.split64High);
};
jspb.BinaryEncoder.prototype.writeFloat = function(value) {
  goog.asserts.assert(value >= -jspb.BinaryConstants.FLOAT32_MAX && value <= jspb.BinaryConstants.FLOAT32_MAX);
  jspb.utils.splitFloat32(value);
  this.writeUint32(jspb.utils.split64Low);
};
jspb.BinaryEncoder.prototype.writeDouble = function(value) {
  goog.asserts.assert(value >= -jspb.BinaryConstants.FLOAT64_MAX && value <= jspb.BinaryConstants.FLOAT64_MAX);
  jspb.utils.splitFloat64(value);
  this.writeUint32(jspb.utils.split64Low);
  this.writeUint32(jspb.utils.split64High);
};
jspb.BinaryEncoder.prototype.writeBool = function(value) {
  goog.asserts.assert(goog.isBoolean(value) || goog.isNumber(value));
  this.buffer_.push(value ? 1 : 0);
};
jspb.BinaryEncoder.prototype.writeEnum = function(value) {
  goog.asserts.assert(value == Math.floor(value));
  goog.asserts.assert(value >= -jspb.BinaryConstants.TWO_TO_31 && value < jspb.BinaryConstants.TWO_TO_31);
  this.writeSignedVarint32(value);
};
jspb.BinaryEncoder.prototype.writeBytes = function(bytes) {
  this.buffer_.push.apply(this.buffer_, bytes);
};
jspb.BinaryEncoder.prototype.writeVarintHash64 = function(hash) {
  jspb.utils.splitHash64(hash);
  this.writeSplitVarint64(jspb.utils.split64Low, jspb.utils.split64High);
};
jspb.BinaryEncoder.prototype.writeFixedHash64 = function(hash) {
  jspb.utils.splitHash64(hash);
  this.writeUint32(jspb.utils.split64Low);
  this.writeUint32(jspb.utils.split64High);
};
jspb.BinaryEncoder.prototype.writeString = function(value) {
  for (var oldLength = this.buffer_.length, i = 0; i < value.length; i++) {
    var c = value.charCodeAt(i);
    if (128 > c) {
      this.buffer_.push(c);
    } else {
      if (2048 > c) {
        this.buffer_.push(c >> 6 | 192), this.buffer_.push(c & 63 | 128);
      } else {
        if (65536 > c) {
          if (55296 <= c && 56319 >= c && i + 1 < value.length) {
            var second = value.charCodeAt(i + 1);
            56320 <= second && 57343 >= second && (c = 1024 * (c - 55296) + second - 56320 + 65536, this.buffer_.push(c >> 18 | 240), this.buffer_.push(c >> 12 & 63 | 128), this.buffer_.push(c >> 6 & 63 | 128), this.buffer_.push(c & 63 | 128), i++);
          } else {
            this.buffer_.push(c >> 12 | 224), this.buffer_.push(c >> 6 & 63 | 128), this.buffer_.push(c & 63 | 128);
          }
        }
      }
    }
  }
  return this.buffer_.length - oldLength;
};
jspb.BinaryWriter = function() {
  this.blocks_ = [];
  this.totalLength_ = 0;
  this.encoder_ = new jspb.BinaryEncoder;
  this.bookmarks_ = [];
};
jspb.BinaryWriter.prototype.appendUint8Array_ = function(arr) {
  var temp = this.encoder_.end();
  this.blocks_.push(temp);
  this.blocks_.push(arr);
  this.totalLength_ += temp.length + arr.length;
};
jspb.BinaryWriter.prototype.beginDelimited_ = function(field) {
  this.writeFieldHeader_(field, jspb.BinaryConstants.WireType.DELIMITED);
  var bookmark = this.encoder_.end();
  this.blocks_.push(bookmark);
  this.totalLength_ += bookmark.length;
  bookmark.push(this.totalLength_);
  return bookmark;
};
jspb.BinaryWriter.prototype.endDelimited_ = function(bookmark) {
  var oldLength = bookmark.pop(), messageLength = this.totalLength_ + this.encoder_.length() - oldLength;
  for (goog.asserts.assert(0 <= messageLength); 127 < messageLength;) {
    bookmark.push(messageLength & 127 | 128), messageLength >>>= 7, this.totalLength_++;
  }
  bookmark.push(messageLength);
  this.totalLength_++;
};
jspb.BinaryWriter.prototype.writeSerializedMessage = function(bytes, start, end) {
  this.appendUint8Array_(bytes.subarray(start, end));
};
jspb.BinaryWriter.prototype.maybeWriteSerializedMessage = function(bytes, start, end) {
  null != bytes && null != start && null != end && this.writeSerializedMessage(bytes, start, end);
};
jspb.BinaryWriter.prototype.reset = function() {
  this.blocks_ = [];
  this.encoder_.end();
  this.totalLength_ = 0;
  this.bookmarks_ = [];
};
jspb.BinaryWriter.prototype.getResultBuffer = function() {
  goog.asserts.assert(0 == this.bookmarks_.length);
  for (var flat = new Uint8Array(this.totalLength_ + this.encoder_.length()), blocks = this.blocks_, blockCount = blocks.length, offset = 0, i = 0; i < blockCount; i++) {
    var block = blocks[i];
    flat.set(block, offset);
    offset += block.length;
  }
  var tail = this.encoder_.end();
  flat.set(tail, offset);
  offset += tail.length;
  goog.asserts.assert(offset == flat.length);
  this.blocks_ = [flat];
  return flat;
};
jspb.BinaryWriter.prototype.getResultBase64String = function(opt_webSafe) {
  return goog.crypt.base64.encodeByteArray(this.getResultBuffer(), opt_webSafe);
};
jspb.BinaryWriter.prototype.beginSubMessage = function(field) {
  this.bookmarks_.push(this.beginDelimited_(field));
};
jspb.BinaryWriter.prototype.endSubMessage = function() {
  goog.asserts.assert(0 <= this.bookmarks_.length);
  this.endDelimited_(this.bookmarks_.pop());
};
jspb.BinaryWriter.prototype.writeFieldHeader_ = function(field, wireType) {
  goog.asserts.assert(1 <= field && field == Math.floor(field));
  this.encoder_.writeUnsignedVarint32(8 * field + wireType);
};
jspb.BinaryWriter.prototype.writeAny = function(fieldType, field, value) {
  var fieldTypes = jspb.BinaryConstants.FieldType;
  switch(fieldType) {
    case fieldTypes.DOUBLE:
      this.writeDouble(field, value);
      break;
    case fieldTypes.FLOAT:
      this.writeFloat(field, value);
      break;
    case fieldTypes.INT64:
      this.writeInt64(field, value);
      break;
    case fieldTypes.UINT64:
      this.writeUint64(field, value);
      break;
    case fieldTypes.INT32:
      this.writeInt32(field, value);
      break;
    case fieldTypes.FIXED64:
      this.writeFixed64(field, value);
      break;
    case fieldTypes.FIXED32:
      this.writeFixed32(field, value);
      break;
    case fieldTypes.BOOL:
      this.writeBool(field, value);
      break;
    case fieldTypes.STRING:
      this.writeString(field, value);
      break;
    case fieldTypes.GROUP:
      goog.asserts.fail("Group field type not supported in writeAny()");
      break;
    case fieldTypes.MESSAGE:
      goog.asserts.fail("Message field type not supported in writeAny()");
      break;
    case fieldTypes.BYTES:
      this.writeBytes(field, value);
      break;
    case fieldTypes.UINT32:
      this.writeUint32(field, value);
      break;
    case fieldTypes.ENUM:
      this.writeEnum(field, value);
      break;
    case fieldTypes.SFIXED32:
      this.writeSfixed32(field, value);
      break;
    case fieldTypes.SFIXED64:
      this.writeSfixed64(field, value);
      break;
    case fieldTypes.SINT32:
      this.writeSint32(field, value);
      break;
    case fieldTypes.SINT64:
      this.writeSint64(field, value);
      break;
    case fieldTypes.FHASH64:
      this.writeFixedHash64(field, value);
      break;
    case fieldTypes.VHASH64:
      this.writeVarintHash64(field, value);
      break;
    default:
      goog.asserts.fail("Invalid field type in writeAny()");
  }
};
jspb.BinaryWriter.prototype.writeUnsignedVarint32_ = function(field, value) {
  null != value && (this.writeFieldHeader_(field, jspb.BinaryConstants.WireType.VARINT), this.encoder_.writeUnsignedVarint32(value));
};
jspb.BinaryWriter.prototype.writeSignedVarint32_ = function(field, value) {
  null != value && (this.writeFieldHeader_(field, jspb.BinaryConstants.WireType.VARINT), this.encoder_.writeSignedVarint32(value));
};
jspb.BinaryWriter.prototype.writeUnsignedVarint64_ = function(field, value) {
  null != value && (this.writeFieldHeader_(field, jspb.BinaryConstants.WireType.VARINT), this.encoder_.writeUnsignedVarint64(value));
};
jspb.BinaryWriter.prototype.writeSignedVarint64_ = function(field, value) {
  null != value && (this.writeFieldHeader_(field, jspb.BinaryConstants.WireType.VARINT), this.encoder_.writeSignedVarint64(value));
};
jspb.BinaryWriter.prototype.writeZigzagVarint32_ = function(field, value) {
  null != value && (this.writeFieldHeader_(field, jspb.BinaryConstants.WireType.VARINT), this.encoder_.writeZigzagVarint32(value));
};
jspb.BinaryWriter.prototype.writeZigzagVarint64_ = function(field, value) {
  null != value && (this.writeFieldHeader_(field, jspb.BinaryConstants.WireType.VARINT), this.encoder_.writeZigzagVarint64(value));
};
jspb.BinaryWriter.prototype.writeZigzagVarint64String_ = function(field, value) {
  null != value && (this.writeFieldHeader_(field, jspb.BinaryConstants.WireType.VARINT), this.encoder_.writeZigzagVarint64String(value));
};
jspb.BinaryWriter.prototype.writeInt32 = function(field, value) {
  null != value && (goog.asserts.assert(value >= -jspb.BinaryConstants.TWO_TO_31 && value < jspb.BinaryConstants.TWO_TO_31), this.writeSignedVarint32_(field, value));
};
jspb.BinaryWriter.prototype.writeInt32String = function(field, value) {
  if (null != value) {
    var intValue = parseInt(value, 10);
    goog.asserts.assert(intValue >= -jspb.BinaryConstants.TWO_TO_31 && intValue < jspb.BinaryConstants.TWO_TO_31);
    this.writeSignedVarint32_(field, intValue);
  }
};
jspb.BinaryWriter.prototype.writeInt64 = function(field, value) {
  null != value && (goog.asserts.assert(value >= -jspb.BinaryConstants.TWO_TO_63 && value < jspb.BinaryConstants.TWO_TO_63), this.writeSignedVarint64_(field, value));
};
jspb.BinaryWriter.prototype.writeInt64String = function(field, value) {
  if (null != value) {
    var num = jspb.arith.Int64.fromString(value);
    this.writeFieldHeader_(field, jspb.BinaryConstants.WireType.VARINT);
    this.encoder_.writeSplitVarint64(num.lo, num.hi);
  }
};
jspb.BinaryWriter.prototype.writeUint32 = function(field, value) {
  null != value && (goog.asserts.assert(0 <= value && value < jspb.BinaryConstants.TWO_TO_32), this.writeUnsignedVarint32_(field, value));
};
jspb.BinaryWriter.prototype.writeUint32String = function(field, value) {
  if (null != value) {
    var intValue = parseInt(value, 10);
    goog.asserts.assert(0 <= intValue && intValue < jspb.BinaryConstants.TWO_TO_32);
    this.writeUnsignedVarint32_(field, intValue);
  }
};
jspb.BinaryWriter.prototype.writeUint64 = function(field, value) {
  null != value && (goog.asserts.assert(0 <= value && value < jspb.BinaryConstants.TWO_TO_64), this.writeUnsignedVarint64_(field, value));
};
jspb.BinaryWriter.prototype.writeUint64String = function(field, value) {
  if (null != value) {
    var num = jspb.arith.UInt64.fromString(value);
    this.writeFieldHeader_(field, jspb.BinaryConstants.WireType.VARINT);
    this.encoder_.writeSplitVarint64(num.lo, num.hi);
  }
};
jspb.BinaryWriter.prototype.writeSint32 = function(field, value) {
  null != value && (goog.asserts.assert(value >= -jspb.BinaryConstants.TWO_TO_31 && value < jspb.BinaryConstants.TWO_TO_31), this.writeZigzagVarint32_(field, value));
};
jspb.BinaryWriter.prototype.writeSint64 = function(field, value) {
  null != value && (goog.asserts.assert(value >= -jspb.BinaryConstants.TWO_TO_63 && value < jspb.BinaryConstants.TWO_TO_63), this.writeZigzagVarint64_(field, value));
};
jspb.BinaryWriter.prototype.writeSint64String = function(field, value) {
  null != value && (goog.asserts.assert(+value >= -jspb.BinaryConstants.TWO_TO_63 && +value < jspb.BinaryConstants.TWO_TO_63), this.writeZigzagVarint64String_(field, value));
};
jspb.BinaryWriter.prototype.writeFixed32 = function(field, value) {
  null != value && (goog.asserts.assert(0 <= value && value < jspb.BinaryConstants.TWO_TO_32), this.writeFieldHeader_(field, jspb.BinaryConstants.WireType.FIXED32), this.encoder_.writeUint32(value));
};
jspb.BinaryWriter.prototype.writeFixed64 = function(field, value) {
  null != value && (goog.asserts.assert(0 <= value && value < jspb.BinaryConstants.TWO_TO_64), this.writeFieldHeader_(field, jspb.BinaryConstants.WireType.FIXED64), this.encoder_.writeUint64(value));
};
jspb.BinaryWriter.prototype.writeFixed64String = function(field, value) {
  if (null != value) {
    var num = jspb.arith.UInt64.fromString(value);
    this.writeFieldHeader_(field, jspb.BinaryConstants.WireType.FIXED64);
    this.encoder_.writeSplitFixed64(num.lo, num.hi);
  }
};
jspb.BinaryWriter.prototype.writeSfixed32 = function(field, value) {
  null != value && (goog.asserts.assert(value >= -jspb.BinaryConstants.TWO_TO_31 && value < jspb.BinaryConstants.TWO_TO_31), this.writeFieldHeader_(field, jspb.BinaryConstants.WireType.FIXED32), this.encoder_.writeInt32(value));
};
jspb.BinaryWriter.prototype.writeSfixed64 = function(field, value) {
  null != value && (goog.asserts.assert(value >= -jspb.BinaryConstants.TWO_TO_63 && value < jspb.BinaryConstants.TWO_TO_63), this.writeFieldHeader_(field, jspb.BinaryConstants.WireType.FIXED64), this.encoder_.writeInt64(value));
};
jspb.BinaryWriter.prototype.writeSfixed64String = function(field, value) {
  if (null != value) {
    var num = jspb.arith.Int64.fromString(value);
    this.writeFieldHeader_(field, jspb.BinaryConstants.WireType.FIXED64);
    this.encoder_.writeSplitFixed64(num.lo, num.hi);
  }
};
jspb.BinaryWriter.prototype.writeFloat = function(field, value) {
  null != value && (this.writeFieldHeader_(field, jspb.BinaryConstants.WireType.FIXED32), this.encoder_.writeFloat(value));
};
jspb.BinaryWriter.prototype.writeDouble = function(field, value) {
  null != value && (this.writeFieldHeader_(field, jspb.BinaryConstants.WireType.FIXED64), this.encoder_.writeDouble(value));
};
jspb.BinaryWriter.prototype.writeBool = function(field, value) {
  null != value && (goog.asserts.assert(goog.isBoolean(value) || goog.isNumber(value)), this.writeFieldHeader_(field, jspb.BinaryConstants.WireType.VARINT), this.encoder_.writeBool(value));
};
jspb.BinaryWriter.prototype.writeEnum = function(field, value) {
  null != value && (goog.asserts.assert(value >= -jspb.BinaryConstants.TWO_TO_31 && value < jspb.BinaryConstants.TWO_TO_31), this.writeFieldHeader_(field, jspb.BinaryConstants.WireType.VARINT), this.encoder_.writeSignedVarint32(value));
};
jspb.BinaryWriter.prototype.writeString = function(field, value) {
  if (null != value) {
    var bookmark = this.beginDelimited_(field);
    this.encoder_.writeString(value);
    this.endDelimited_(bookmark);
  }
};
jspb.BinaryWriter.prototype.writeBytes = function(field, value) {
  if (null != value) {
    var bytes = jspb.utils.byteSourceToUint8Array(value);
    this.writeFieldHeader_(field, jspb.BinaryConstants.WireType.DELIMITED);
    this.encoder_.writeUnsignedVarint32(bytes.length);
    this.appendUint8Array_(bytes);
  }
};
jspb.BinaryWriter.prototype.writeMessage = function(field, value, writerCallback) {
  if (null != value) {
    var bookmark = this.beginDelimited_(field);
    writerCallback(value, this);
    this.endDelimited_(bookmark);
  }
};
jspb.BinaryWriter.prototype.writeMessageSet = function(field, value, writerCallback) {
  if (null != value) {
    this.writeFieldHeader_(1, jspb.BinaryConstants.WireType.START_GROUP);
    this.writeFieldHeader_(2, jspb.BinaryConstants.WireType.VARINT);
    this.encoder_.writeSignedVarint32(field);
    var bookmark = this.beginDelimited_(3);
    writerCallback(value, this);
    this.endDelimited_(bookmark);
    this.writeFieldHeader_(1, jspb.BinaryConstants.WireType.END_GROUP);
  }
};
jspb.BinaryWriter.prototype.writeGroup = function(field, value, writerCallback) {
  null != value && (this.writeFieldHeader_(field, jspb.BinaryConstants.WireType.START_GROUP), writerCallback(value, this), this.writeFieldHeader_(field, jspb.BinaryConstants.WireType.END_GROUP));
};
jspb.BinaryWriter.prototype.writeFixedHash64 = function(field, value) {
  null != value && (goog.asserts.assert(8 == value.length), this.writeFieldHeader_(field, jspb.BinaryConstants.WireType.FIXED64), this.encoder_.writeFixedHash64(value));
};
jspb.BinaryWriter.prototype.writeVarintHash64 = function(field, value) {
  null != value && (goog.asserts.assert(8 == value.length), this.writeFieldHeader_(field, jspb.BinaryConstants.WireType.VARINT), this.encoder_.writeVarintHash64(value));
};
jspb.BinaryWriter.prototype.writeRepeatedInt32 = function(field, value) {
  if (null != value) {
    for (var i = 0; i < value.length; i++) {
      this.writeSignedVarint32_(field, value[i]);
    }
  }
};
jspb.BinaryWriter.prototype.writeRepeatedInt32String = function(field, value) {
  if (null != value) {
    for (var i = 0; i < value.length; i++) {
      this.writeInt32String(field, value[i]);
    }
  }
};
jspb.BinaryWriter.prototype.writeRepeatedInt64 = function(field, value) {
  if (null != value) {
    for (var i = 0; i < value.length; i++) {
      this.writeSignedVarint64_(field, value[i]);
    }
  }
};
jspb.BinaryWriter.prototype.writeRepeatedInt64String = function(field, value) {
  if (null != value) {
    for (var i = 0; i < value.length; i++) {
      this.writeInt64String(field, value[i]);
    }
  }
};
jspb.BinaryWriter.prototype.writeRepeatedUint32 = function(field, value) {
  if (null != value) {
    for (var i = 0; i < value.length; i++) {
      this.writeUnsignedVarint32_(field, value[i]);
    }
  }
};
jspb.BinaryWriter.prototype.writeRepeatedUint32String = function(field, value) {
  if (null != value) {
    for (var i = 0; i < value.length; i++) {
      this.writeUint32String(field, value[i]);
    }
  }
};
jspb.BinaryWriter.prototype.writeRepeatedUint64 = function(field, value) {
  if (null != value) {
    for (var i = 0; i < value.length; i++) {
      this.writeUnsignedVarint64_(field, value[i]);
    }
  }
};
jspb.BinaryWriter.prototype.writeRepeatedUint64String = function(field, value) {
  if (null != value) {
    for (var i = 0; i < value.length; i++) {
      this.writeUint64String(field, value[i]);
    }
  }
};
jspb.BinaryWriter.prototype.writeRepeatedSint32 = function(field, value) {
  if (null != value) {
    for (var i = 0; i < value.length; i++) {
      this.writeZigzagVarint32_(field, value[i]);
    }
  }
};
jspb.BinaryWriter.prototype.writeRepeatedSint64 = function(field, value) {
  if (null != value) {
    for (var i = 0; i < value.length; i++) {
      this.writeZigzagVarint64_(field, value[i]);
    }
  }
};
jspb.BinaryWriter.prototype.writeRepeatedSint64String = function(field, value) {
  if (null != value) {
    for (var i = 0; i < value.length; i++) {
      this.writeZigzagVarint64String_(field, value[i]);
    }
  }
};
jspb.BinaryWriter.prototype.writeRepeatedFixed32 = function(field, value) {
  if (null != value) {
    for (var i = 0; i < value.length; i++) {
      this.writeFixed32(field, value[i]);
    }
  }
};
jspb.BinaryWriter.prototype.writeRepeatedFixed64 = function(field, value) {
  if (null != value) {
    for (var i = 0; i < value.length; i++) {
      this.writeFixed64(field, value[i]);
    }
  }
};
jspb.BinaryWriter.prototype.writeRepeatedFixed64String = function(field, value) {
  if (null != value) {
    for (var i = 0; i < value.length; i++) {
      this.writeFixed64String(field, value[i]);
    }
  }
};
jspb.BinaryWriter.prototype.writeRepeatedSfixed32 = function(field, value) {
  if (null != value) {
    for (var i = 0; i < value.length; i++) {
      this.writeSfixed32(field, value[i]);
    }
  }
};
jspb.BinaryWriter.prototype.writeRepeatedSfixed64 = function(field, value) {
  if (null != value) {
    for (var i = 0; i < value.length; i++) {
      this.writeSfixed64(field, value[i]);
    }
  }
};
jspb.BinaryWriter.prototype.writeRepeatedSfixed64String = function(field, value) {
  if (null != value) {
    for (var i = 0; i < value.length; i++) {
      this.writeSfixed64String(field, value[i]);
    }
  }
};
jspb.BinaryWriter.prototype.writeRepeatedFloat = function(field, value) {
  if (null != value) {
    for (var i = 0; i < value.length; i++) {
      this.writeFloat(field, value[i]);
    }
  }
};
jspb.BinaryWriter.prototype.writeRepeatedDouble = function(field, value) {
  if (null != value) {
    for (var i = 0; i < value.length; i++) {
      this.writeDouble(field, value[i]);
    }
  }
};
jspb.BinaryWriter.prototype.writeRepeatedBool = function(field, value) {
  if (null != value) {
    for (var i = 0; i < value.length; i++) {
      this.writeBool(field, value[i]);
    }
  }
};
jspb.BinaryWriter.prototype.writeRepeatedEnum = function(field, value) {
  if (null != value) {
    for (var i = 0; i < value.length; i++) {
      this.writeEnum(field, value[i]);
    }
  }
};
jspb.BinaryWriter.prototype.writeRepeatedString = function(field, value) {
  if (null != value) {
    for (var i = 0; i < value.length; i++) {
      this.writeString(field, value[i]);
    }
  }
};
jspb.BinaryWriter.prototype.writeRepeatedBytes = function(field, value) {
  if (null != value) {
    for (var i = 0; i < value.length; i++) {
      this.writeBytes(field, value[i]);
    }
  }
};
jspb.BinaryWriter.prototype.writeRepeatedMessage = function(field, value, writerCallback) {
  if (null != value) {
    for (var i = 0; i < value.length; i++) {
      var bookmark = this.beginDelimited_(field);
      writerCallback(value[i], this);
      this.endDelimited_(bookmark);
    }
  }
};
jspb.BinaryWriter.prototype.writeRepeatedGroup = function(field, value, writerCallback) {
  if (null != value) {
    for (var i = 0; i < value.length; i++) {
      this.writeFieldHeader_(field, jspb.BinaryConstants.WireType.START_GROUP), writerCallback(value[i], this), this.writeFieldHeader_(field, jspb.BinaryConstants.WireType.END_GROUP);
    }
  }
};
jspb.BinaryWriter.prototype.writeRepeatedFixedHash64 = function(field, value) {
  if (null != value) {
    for (var i = 0; i < value.length; i++) {
      this.writeFixedHash64(field, value[i]);
    }
  }
};
jspb.BinaryWriter.prototype.writeRepeatedVarintHash64 = function(field, value) {
  if (null != value) {
    for (var i = 0; i < value.length; i++) {
      this.writeVarintHash64(field, value[i]);
    }
  }
};
jspb.BinaryWriter.prototype.writePackedInt32 = function(field, value) {
  if (null != value && value.length) {
    for (var bookmark = this.beginDelimited_(field), i = 0; i < value.length; i++) {
      this.encoder_.writeSignedVarint32(value[i]);
    }
    this.endDelimited_(bookmark);
  }
};
jspb.BinaryWriter.prototype.writePackedInt32String = function(field, value) {
  if (null != value && value.length) {
    for (var bookmark = this.beginDelimited_(field), i = 0; i < value.length; i++) {
      this.encoder_.writeSignedVarint32(parseInt(value[i], 10));
    }
    this.endDelimited_(bookmark);
  }
};
jspb.BinaryWriter.prototype.writePackedInt64 = function(field, value) {
  if (null != value && value.length) {
    for (var bookmark = this.beginDelimited_(field), i = 0; i < value.length; i++) {
      this.encoder_.writeSignedVarint64(value[i]);
    }
    this.endDelimited_(bookmark);
  }
};
jspb.BinaryWriter.prototype.writePackedInt64String = function(field, value) {
  if (null != value && value.length) {
    for (var bookmark = this.beginDelimited_(field), i = 0; i < value.length; i++) {
      var num = jspb.arith.Int64.fromString(value[i]);
      this.encoder_.writeSplitVarint64(num.lo, num.hi);
    }
    this.endDelimited_(bookmark);
  }
};
jspb.BinaryWriter.prototype.writePackedUint32 = function(field, value) {
  if (null != value && value.length) {
    for (var bookmark = this.beginDelimited_(field), i = 0; i < value.length; i++) {
      this.encoder_.writeUnsignedVarint32(value[i]);
    }
    this.endDelimited_(bookmark);
  }
};
jspb.BinaryWriter.prototype.writePackedUint32String = function(field, value) {
  if (null != value && value.length) {
    for (var bookmark = this.beginDelimited_(field), i = 0; i < value.length; i++) {
      this.encoder_.writeUnsignedVarint32(parseInt(value[i], 10));
    }
    this.endDelimited_(bookmark);
  }
};
jspb.BinaryWriter.prototype.writePackedUint64 = function(field, value) {
  if (null != value && value.length) {
    for (var bookmark = this.beginDelimited_(field), i = 0; i < value.length; i++) {
      this.encoder_.writeUnsignedVarint64(value[i]);
    }
    this.endDelimited_(bookmark);
  }
};
jspb.BinaryWriter.prototype.writePackedUint64String = function(field, value) {
  if (null != value && value.length) {
    for (var bookmark = this.beginDelimited_(field), i = 0; i < value.length; i++) {
      var num = jspb.arith.UInt64.fromString(value[i]);
      this.encoder_.writeSplitVarint64(num.lo, num.hi);
    }
    this.endDelimited_(bookmark);
  }
};
jspb.BinaryWriter.prototype.writePackedSint32 = function(field, value) {
  if (null != value && value.length) {
    for (var bookmark = this.beginDelimited_(field), i = 0; i < value.length; i++) {
      this.encoder_.writeZigzagVarint32(value[i]);
    }
    this.endDelimited_(bookmark);
  }
};
jspb.BinaryWriter.prototype.writePackedSint64 = function(field, value) {
  if (null != value && value.length) {
    for (var bookmark = this.beginDelimited_(field), i = 0; i < value.length; i++) {
      this.encoder_.writeZigzagVarint64(value[i]);
    }
    this.endDelimited_(bookmark);
  }
};
jspb.BinaryWriter.prototype.writePackedSint64String = function(field, value) {
  if (null != value && value.length) {
    for (var bookmark = this.beginDelimited_(field), i = 0; i < value.length; i++) {
      this.encoder_.writeZigzagVarint64(parseInt(value[i], 10));
    }
    this.endDelimited_(bookmark);
  }
};
jspb.BinaryWriter.prototype.writePackedFixed32 = function(field, value) {
  if (null != value && value.length) {
    this.writeFieldHeader_(field, jspb.BinaryConstants.WireType.DELIMITED);
    this.encoder_.writeUnsignedVarint32(4 * value.length);
    for (var i = 0; i < value.length; i++) {
      this.encoder_.writeUint32(value[i]);
    }
  }
};
jspb.BinaryWriter.prototype.writePackedFixed64 = function(field, value) {
  if (null != value && value.length) {
    this.writeFieldHeader_(field, jspb.BinaryConstants.WireType.DELIMITED);
    this.encoder_.writeUnsignedVarint32(8 * value.length);
    for (var i = 0; i < value.length; i++) {
      this.encoder_.writeUint64(value[i]);
    }
  }
};
jspb.BinaryWriter.prototype.writePackedFixed64String = function(field, value) {
  if (null != value && value.length) {
    this.writeFieldHeader_(field, jspb.BinaryConstants.WireType.DELIMITED);
    this.encoder_.writeUnsignedVarint32(8 * value.length);
    for (var i = 0; i < value.length; i++) {
      var num = jspb.arith.UInt64.fromString(value[i]);
      this.encoder_.writeSplitFixed64(num.lo, num.hi);
    }
  }
};
jspb.BinaryWriter.prototype.writePackedSfixed32 = function(field, value) {
  if (null != value && value.length) {
    this.writeFieldHeader_(field, jspb.BinaryConstants.WireType.DELIMITED);
    this.encoder_.writeUnsignedVarint32(4 * value.length);
    for (var i = 0; i < value.length; i++) {
      this.encoder_.writeInt32(value[i]);
    }
  }
};
jspb.BinaryWriter.prototype.writePackedSfixed64 = function(field, value) {
  if (null != value && value.length) {
    this.writeFieldHeader_(field, jspb.BinaryConstants.WireType.DELIMITED);
    this.encoder_.writeUnsignedVarint32(8 * value.length);
    for (var i = 0; i < value.length; i++) {
      this.encoder_.writeInt64(value[i]);
    }
  }
};
jspb.BinaryWriter.prototype.writePackedSfixed64String = function(field, value) {
  if (null != value && value.length) {
    this.writeFieldHeader_(field, jspb.BinaryConstants.WireType.DELIMITED);
    this.encoder_.writeUnsignedVarint32(8 * value.length);
    for (var i = 0; i < value.length; i++) {
      this.encoder_.writeInt64String(value[i]);
    }
  }
};
jspb.BinaryWriter.prototype.writePackedFloat = function(field, value) {
  if (null != value && value.length) {
    this.writeFieldHeader_(field, jspb.BinaryConstants.WireType.DELIMITED);
    this.encoder_.writeUnsignedVarint32(4 * value.length);
    for (var i = 0; i < value.length; i++) {
      this.encoder_.writeFloat(value[i]);
    }
  }
};
jspb.BinaryWriter.prototype.writePackedDouble = function(field, value) {
  if (null != value && value.length) {
    this.writeFieldHeader_(field, jspb.BinaryConstants.WireType.DELIMITED);
    this.encoder_.writeUnsignedVarint32(8 * value.length);
    for (var i = 0; i < value.length; i++) {
      this.encoder_.writeDouble(value[i]);
    }
  }
};
jspb.BinaryWriter.prototype.writePackedBool = function(field, value) {
  if (null != value && value.length) {
    this.writeFieldHeader_(field, jspb.BinaryConstants.WireType.DELIMITED);
    this.encoder_.writeUnsignedVarint32(value.length);
    for (var i = 0; i < value.length; i++) {
      this.encoder_.writeBool(value[i]);
    }
  }
};
jspb.BinaryWriter.prototype.writePackedEnum = function(field, value) {
  if (null != value && value.length) {
    for (var bookmark = this.beginDelimited_(field), i = 0; i < value.length; i++) {
      this.encoder_.writeEnum(value[i]);
    }
    this.endDelimited_(bookmark);
  }
};
jspb.BinaryWriter.prototype.writePackedFixedHash64 = function(field, value) {
  if (null != value && value.length) {
    this.writeFieldHeader_(field, jspb.BinaryConstants.WireType.DELIMITED);
    this.encoder_.writeUnsignedVarint32(8 * value.length);
    for (var i = 0; i < value.length; i++) {
      this.encoder_.writeFixedHash64(value[i]);
    }
  }
};
jspb.BinaryWriter.prototype.writePackedVarintHash64 = function(field, value) {
  if (null != value && value.length) {
    for (var bookmark = this.beginDelimited_(field), i = 0; i < value.length; i++) {
      this.encoder_.writeVarintHash64(value[i]);
    }
    this.endDelimited_(bookmark);
  }
};
jspb.Map = function(arr, opt_valueCtor) {
  this.arr_ = arr;
  this.valueCtor_ = opt_valueCtor;
  this.map_ = {};
  this.arrClean = !0;
  0 < this.arr_.length && this.loadFromArray_();
};
jspb.Map.prototype.loadFromArray_ = function() {
  for (var i = 0; i < this.arr_.length; i++) {
    var record = this.arr_[i], key = record[0];
    this.map_[key.toString()] = new jspb.Map.Entry_(key, record[1]);
  }
  this.arrClean = !0;
};
jspb.Map.prototype.toArray = function() {
  if (this.arrClean) {
    if (this.valueCtor_) {
      var m = this.map_, p;
      for (p in m) {
        if (Object.prototype.hasOwnProperty.call(m, p)) {
          var valueWrapper = m[p].valueWrapper;
          valueWrapper && valueWrapper.toArray();
        }
      }
    }
  } else {
    this.arr_.length = 0;
    var strKeys = this.stringKeys_();
    strKeys.sort();
    for (var i = 0; i < strKeys.length; i++) {
      var entry = this.map_[strKeys[i]];
      (valueWrapper = entry.valueWrapper) && valueWrapper.toArray();
      this.arr_.push([entry.key, entry.value]);
    }
    this.arrClean = !0;
  }
  return this.arr_;
};
jspb.Map.prototype.toObject = function(includeInstance, valueToObject) {
  for (var rawArray = this.toArray(), entries = [], i = 0; i < rawArray.length; i++) {
    var entry = this.map_[rawArray[i][0].toString()];
    this.wrapEntry_(entry);
    var valueWrapper = entry.valueWrapper;
    valueWrapper ? (goog.asserts.assert(valueToObject), entries.push([entry.key, valueToObject(includeInstance, valueWrapper)])) : entries.push([entry.key, entry.value]);
  }
  return entries;
};
jspb.Map.fromObject = function(entries, valueCtor, valueFromObject) {
  for (var result = new jspb.Map([], valueCtor), i = 0; i < entries.length; i++) {
    var key = entries[i][0], value = valueFromObject(entries[i][1]);
    result.set(key, value);
  }
  return result;
};
jspb.Map.ArrayIteratorIterable_ = function(arr) {
  this.idx_ = 0;
  this.arr_ = arr;
};
jspb.Map.ArrayIteratorIterable_.prototype.next = function() {
  return this.idx_ < this.arr_.length ? {done:!1, value:this.arr_[this.idx_++]} : {done:!0, value:void 0};
};
"undefined" != typeof Symbol && (jspb.Map.ArrayIteratorIterable_.prototype[Symbol.iterator] = function() {
  return this;
});
jspb.Map.prototype.getLength = function() {
  return this.stringKeys_().length;
};
jspb.Map.prototype.clear = function() {
  this.map_ = {};
  this.arrClean = !1;
};
jspb.Map.prototype.del = function(key) {
  var keyValue = key.toString(), hadKey = this.map_.hasOwnProperty(keyValue);
  delete this.map_[keyValue];
  this.arrClean = !1;
  return hadKey;
};
jspb.Map.prototype.getEntryList = function() {
  var entries = [], strKeys = this.stringKeys_();
  strKeys.sort();
  for (var i = 0; i < strKeys.length; i++) {
    var entry = this.map_[strKeys[i]];
    entries.push([entry.key, entry.value]);
  }
  return entries;
};
jspb.Map.prototype.entries = function() {
  var entries = [], strKeys = this.stringKeys_();
  strKeys.sort();
  for (var i = 0; i < strKeys.length; i++) {
    var entry = this.map_[strKeys[i]];
    entries.push([entry.key, this.wrapEntry_(entry)]);
  }
  return new jspb.Map.ArrayIteratorIterable_(entries);
};
jspb.Map.prototype.keys = function() {
  var keys = [], strKeys = this.stringKeys_();
  strKeys.sort();
  for (var i = 0; i < strKeys.length; i++) {
    keys.push(this.map_[strKeys[i]].key);
  }
  return new jspb.Map.ArrayIteratorIterable_(keys);
};
jspb.Map.prototype.values = function() {
  var values = [], strKeys = this.stringKeys_();
  strKeys.sort();
  for (var i = 0; i < strKeys.length; i++) {
    values.push(this.wrapEntry_(this.map_[strKeys[i]]));
  }
  return new jspb.Map.ArrayIteratorIterable_(values);
};
jspb.Map.prototype.forEach = function(cb, opt_thisArg) {
  var strKeys = this.stringKeys_();
  strKeys.sort();
  for (var i = 0; i < strKeys.length; i++) {
    var entry = this.map_[strKeys[i]];
    cb.call(opt_thisArg, this.wrapEntry_(entry), entry.key, this);
  }
};
jspb.Map.prototype.set = function(key, value) {
  var entry = new jspb.Map.Entry_(key);
  this.valueCtor_ ? (entry.valueWrapper = value, entry.value = value.toArray()) : entry.value = value;
  this.map_[key.toString()] = entry;
  this.arrClean = !1;
  return this;
};
jspb.Map.prototype.wrapEntry_ = function(entry) {
  return this.valueCtor_ ? (entry.valueWrapper || (entry.valueWrapper = new this.valueCtor_(entry.value)), entry.valueWrapper) : entry.value;
};
jspb.Map.prototype.get = function(key) {
  var entry = this.map_[key.toString()];
  if (entry) {
    return this.wrapEntry_(entry);
  }
};
jspb.Map.prototype.has = function(key) {
  return key.toString() in this.map_;
};
jspb.Map.prototype.serializeBinary = function(fieldNumber, writer, keyWriterFn, valueWriterFn, opt_valueWriterCallback) {
  var strKeys = this.stringKeys_();
  strKeys.sort();
  for (var i = 0; i < strKeys.length; i++) {
    var entry = this.map_[strKeys[i]];
    writer.beginSubMessage(fieldNumber);
    keyWriterFn.call(writer, 1, entry.key);
    this.valueCtor_ ? valueWriterFn.call(writer, 2, this.wrapEntry_(entry), opt_valueWriterCallback) : valueWriterFn.call(writer, 2, entry.value);
    writer.endSubMessage();
  }
};
jspb.Map.deserializeBinary = function(map, reader, keyReaderFn, valueReaderFn, opt_valueReaderCallback, opt_defaultKey) {
  for (var key = opt_defaultKey, value = void 0; reader.nextField() && !reader.isEndGroup();) {
    var field = reader.getFieldNumber();
    1 == field ? key = keyReaderFn.call(reader) : 2 == field && (map.valueCtor_ ? (goog.asserts.assert(opt_valueReaderCallback), value = new map.valueCtor_, valueReaderFn.call(reader, value, opt_valueReaderCallback)) : value = valueReaderFn.call(reader));
  }
  goog.asserts.assert(void 0 != key);
  goog.asserts.assert(void 0 != value);
  map.set(key, value);
};
jspb.Map.prototype.stringKeys_ = function() {
  var m = this.map_, ret = [], p;
  for (p in m) {
    Object.prototype.hasOwnProperty.call(m, p) && ret.push(p);
  }
  return ret;
};
jspb.Map.Entry_ = function(key, opt_value) {
  this.key = key;
  this.value = opt_value;
  this.valueWrapper = void 0;
};
jspb.ExtensionFieldInfo = function(fieldNumber, fieldName, ctor, toObjectFn, isRepeated) {
  this.fieldIndex = fieldNumber;
  this.fieldName = fieldName;
  this.ctor = ctor;
  this.toObjectFn = toObjectFn;
  this.isRepeated = isRepeated;
};
jspb.ExtensionFieldBinaryInfo = function(fieldInfo, binaryReaderFn, binaryWriterFn, opt_binaryMessageSerializeFn, opt_binaryMessageDeserializeFn, opt_isPacked) {
  this.fieldInfo = fieldInfo;
  this.binaryReaderFn = binaryReaderFn;
  this.binaryWriterFn = binaryWriterFn;
  this.binaryMessageSerializeFn = opt_binaryMessageSerializeFn;
  this.binaryMessageDeserializeFn = opt_binaryMessageDeserializeFn;
  this.isPacked = opt_isPacked;
};
jspb.ExtensionFieldInfo.prototype.isMessageType = function() {
  return !!this.ctor;
};
jspb.Message = function() {
};
jspb.Message.GENERATE_TO_OBJECT = !0;
jspb.Message.GENERATE_FROM_OBJECT = !goog.DISALLOW_TEST_ONLY_CODE;
jspb.Message.GENERATE_TO_STRING = !0;
jspb.Message.ASSUME_LOCAL_ARRAYS = !1;
jspb.Message.SERIALIZE_EMPTY_TRAILING_FIELDS = !0;
jspb.Message.SUPPORTS_UINT8ARRAY_ = "function" == typeof Uint8Array;
jspb.Message.prototype.getJsPbMessageId = function() {
  return this.messageId_;
};
jspb.Message.getIndex_ = function(msg, fieldNumber) {
  return fieldNumber + msg.arrayIndexOffset_;
};
jspb.Message.hiddenES6Property_ = function() {
};
jspb.Message.getFieldNumber_ = function(msg, index) {
  return index - msg.arrayIndexOffset_;
};
jspb.Message.initialize = function(msg, data, messageId, suggestedPivot, repeatedFields, opt_oneofFields) {
  msg.wrappers_ = null;
  data || (data = messageId ? [messageId] : []);
  msg.messageId_ = messageId ? String(messageId) : void 0;
  msg.arrayIndexOffset_ = 0 === messageId ? -1 : 0;
  msg.array = data;
  jspb.Message.initPivotAndExtensionObject_(msg, suggestedPivot);
  msg.convertedPrimitiveFields_ = {};
  jspb.Message.SERIALIZE_EMPTY_TRAILING_FIELDS || (msg.repeatedFields = repeatedFields);
  if (repeatedFields) {
    for (var i = 0; i < repeatedFields.length; i++) {
      var fieldNumber = repeatedFields[i];
      if (fieldNumber < msg.pivot_) {
        var index = jspb.Message.getIndex_(msg, fieldNumber);
        msg.array[index] = msg.array[index] || jspb.Message.EMPTY_LIST_SENTINEL_;
      } else {
        jspb.Message.maybeInitEmptyExtensionObject_(msg), msg.extensionObject_[fieldNumber] = msg.extensionObject_[fieldNumber] || jspb.Message.EMPTY_LIST_SENTINEL_;
      }
    }
  }
  if (opt_oneofFields && opt_oneofFields.length) {
    for (i = 0; i < opt_oneofFields.length; i++) {
      jspb.Message.computeOneofCase(msg, opt_oneofFields[i]);
    }
  }
};
jspb.Message.EMPTY_LIST_SENTINEL_ = goog.DEBUG && Object.freeze ? Object.freeze([]) : [];
jspb.Message.isArray_ = function(o) {
  return jspb.Message.ASSUME_LOCAL_ARRAYS ? o instanceof Array : goog.isArray(o);
};
jspb.Message.isExtensionObject_ = function(o) {
  return null !== o && "object" == typeof o && !jspb.Message.isArray_(o) && !(jspb.Message.SUPPORTS_UINT8ARRAY_ && o instanceof Uint8Array);
};
jspb.Message.initPivotAndExtensionObject_ = function(msg, suggestedPivot) {
  var msgLength = msg.array.length, lastIndex = -1;
  if (msgLength) {
    lastIndex = msgLength - 1;
    var obj = msg.array[lastIndex];
    if (jspb.Message.isExtensionObject_(obj)) {
      msg.pivot_ = jspb.Message.getFieldNumber_(msg, lastIndex);
      msg.extensionObject_ = obj;
      return;
    }
  }
  -1 < suggestedPivot ? (msg.pivot_ = Math.max(suggestedPivot, jspb.Message.getFieldNumber_(msg, lastIndex + 1)), msg.extensionObject_ = null) : msg.pivot_ = Number.MAX_VALUE;
};
jspb.Message.maybeInitEmptyExtensionObject_ = function(msg) {
  var pivotIndex = jspb.Message.getIndex_(msg, msg.pivot_);
  msg.array[pivotIndex] || (msg.extensionObject_ = msg.array[pivotIndex] = {});
};
jspb.Message.toObjectList = function(field, toObjectFn, opt_includeInstance) {
  for (var result = [], i = 0; i < field.length; i++) {
    result[i] = toObjectFn.call(field[i], opt_includeInstance, field[i]);
  }
  return result;
};
jspb.Message.toObjectExtension = function(proto, obj, extensions, getExtensionFn, opt_includeInstance) {
  for (var fieldNumber in extensions) {
    var fieldInfo = extensions[fieldNumber], value = getExtensionFn.call(proto, fieldInfo);
    if (null != value) {
      for (var name in fieldInfo.fieldName) {
        if (fieldInfo.fieldName.hasOwnProperty(name)) {
          break;
        }
      }
      obj[name] = fieldInfo.toObjectFn ? fieldInfo.isRepeated ? jspb.Message.toObjectList(value, fieldInfo.toObjectFn, opt_includeInstance) : fieldInfo.toObjectFn(opt_includeInstance, value) : value;
    }
  }
};
jspb.Message.serializeBinaryExtensions = function(proto, writer, extensions, getExtensionFn) {
  for (var fieldNumber in extensions) {
    var binaryFieldInfo = extensions[fieldNumber], fieldInfo = binaryFieldInfo.fieldInfo;
    if (!binaryFieldInfo.binaryWriterFn) {
      throw Error("Message extension present that was generated without binary serialization support");
    }
    var value = getExtensionFn.call(proto, fieldInfo);
    if (null != value) {
      if (fieldInfo.isMessageType()) {
        if (binaryFieldInfo.binaryMessageSerializeFn) {
          binaryFieldInfo.binaryWriterFn.call(writer, fieldInfo.fieldIndex, value, binaryFieldInfo.binaryMessageSerializeFn);
        } else {
          throw Error("Message extension present holding submessage without binary support enabled, and message is being serialized to binary format");
        }
      } else {
        binaryFieldInfo.binaryWriterFn.call(writer, fieldInfo.fieldIndex, value);
      }
    }
  }
};
jspb.Message.readBinaryExtensionMessageSet = function(msg, reader, extensions, getExtensionFn, setExtensionFn) {
  if (1 == reader.getFieldNumber() && reader.getWireType() == jspb.BinaryConstants.WireType.START_GROUP) {
    for (var fieldNumber = 0, rawBytes = null; reader.nextField() && (0 != reader.getWireType() || 0 != reader.getFieldNumber());) {
      if (reader.getWireType() == jspb.BinaryConstants.WireType.VARINT && 2 == reader.getFieldNumber()) {
        fieldNumber = reader.readUint32();
      } else {
        if (reader.getWireType() == jspb.BinaryConstants.WireType.DELIMITED && 3 == reader.getFieldNumber()) {
          rawBytes = reader.readBytes();
        } else {
          if (reader.getWireType() == jspb.BinaryConstants.WireType.END_GROUP) {
            break;
          } else {
            reader.skipField();
          }
        }
      }
    }
    if (1 != reader.getFieldNumber() || reader.getWireType() != jspb.BinaryConstants.WireType.END_GROUP || null == rawBytes || 0 == fieldNumber) {
      throw Error("Malformed binary bytes for message set");
    }
    var binaryFieldInfo = extensions[fieldNumber];
    if (binaryFieldInfo) {
      var fieldInfo = binaryFieldInfo.fieldInfo, newValue = new fieldInfo.ctor;
      binaryFieldInfo.binaryMessageDeserializeFn.call(newValue, newValue, new jspb.BinaryReader(rawBytes));
      setExtensionFn.call(msg, fieldInfo, newValue);
    }
  } else {
    reader.skipField();
  }
};
jspb.Message.readBinaryExtension = function(msg, reader, extensions, getExtensionFn, setExtensionFn) {
  var binaryFieldInfo = extensions[reader.getFieldNumber()];
  if (binaryFieldInfo) {
    var fieldInfo = binaryFieldInfo.fieldInfo;
    if (!binaryFieldInfo.binaryReaderFn) {
      throw Error("Deserializing extension whose generated code does not support binary format");
    }
    if (fieldInfo.isMessageType()) {
      var value = new fieldInfo.ctor;
      binaryFieldInfo.binaryReaderFn.call(reader, value, binaryFieldInfo.binaryMessageDeserializeFn);
    } else {
      value = binaryFieldInfo.binaryReaderFn.call(reader);
    }
    if (fieldInfo.isRepeated && !binaryFieldInfo.isPacked) {
      var currentList = getExtensionFn.call(msg, fieldInfo);
      currentList ? currentList.push(value) : setExtensionFn.call(msg, fieldInfo, [value]);
    } else {
      setExtensionFn.call(msg, fieldInfo, value);
    }
  } else {
    reader.skipField();
  }
};
jspb.Message.getField = function(msg, fieldNumber) {
  if (fieldNumber < msg.pivot_) {
    var index = jspb.Message.getIndex_(msg, fieldNumber), val = msg.array[index];
    return val === jspb.Message.EMPTY_LIST_SENTINEL_ ? msg.array[index] = [] : val;
  }
  if (msg.extensionObject_) {
    return val = msg.extensionObject_[fieldNumber], val === jspb.Message.EMPTY_LIST_SENTINEL_ ? msg.extensionObject_[fieldNumber] = [] : val;
  }
};
jspb.Message.getRepeatedField = function(msg, fieldNumber) {
  return jspb.Message.getField(msg, fieldNumber);
};
jspb.Message.getOptionalFloatingPointField = function(msg, fieldNumber) {
  var value = jspb.Message.getField(msg, fieldNumber);
  return null == value ? value : +value;
};
jspb.Message.getBooleanField = function(msg, fieldNumber) {
  var value = jspb.Message.getField(msg, fieldNumber);
  return null == value ? value : !!value;
};
jspb.Message.getRepeatedFloatingPointField = function(msg, fieldNumber) {
  var values = jspb.Message.getRepeatedField(msg, fieldNumber);
  msg.convertedPrimitiveFields_ || (msg.convertedPrimitiveFields_ = {});
  if (!msg.convertedPrimitiveFields_[fieldNumber]) {
    for (var i = 0; i < values.length; i++) {
      values[i] = +values[i];
    }
    msg.convertedPrimitiveFields_[fieldNumber] = !0;
  }
  return values;
};
jspb.Message.getRepeatedBooleanField = function(msg, fieldNumber) {
  var values = jspb.Message.getRepeatedField(msg, fieldNumber);
  msg.convertedPrimitiveFields_ || (msg.convertedPrimitiveFields_ = {});
  if (!msg.convertedPrimitiveFields_[fieldNumber]) {
    for (var i = 0; i < values.length; i++) {
      values[i] = !!values[i];
    }
    msg.convertedPrimitiveFields_[fieldNumber] = !0;
  }
  return values;
};
jspb.Message.bytesAsB64 = function(value) {
  if (null == value || goog.isString(value)) {
    return value;
  }
  if (jspb.Message.SUPPORTS_UINT8ARRAY_ && value instanceof Uint8Array) {
    return goog.crypt.base64.encodeByteArray(value);
  }
  goog.asserts.fail("Cannot coerce to b64 string: " + goog.typeOf(value));
  return null;
};
jspb.Message.bytesAsU8 = function(value) {
  if (null == value || value instanceof Uint8Array) {
    return value;
  }
  if (goog.isString(value)) {
    return goog.crypt.base64.decodeStringToUint8Array(value);
  }
  goog.asserts.fail("Cannot coerce to Uint8Array: " + goog.typeOf(value));
  return null;
};
jspb.Message.bytesListAsB64 = function(value) {
  jspb.Message.assertConsistentTypes_(value);
  return !value.length || goog.isString(value[0]) ? value : goog.array.map(value, jspb.Message.bytesAsB64);
};
jspb.Message.bytesListAsU8 = function(value) {
  jspb.Message.assertConsistentTypes_(value);
  return !value.length || value[0] instanceof Uint8Array ? value : goog.array.map(value, jspb.Message.bytesAsU8);
};
jspb.Message.assertConsistentTypes_ = function(array) {
  if (goog.DEBUG && array && 1 < array.length) {
    var expected = goog.typeOf(array[0]);
    goog.array.forEach(array, function(e) {
      goog.typeOf(e) != expected && goog.asserts.fail("Inconsistent type in JSPB repeated field array. Got " + goog.typeOf(e) + " expected " + expected);
    });
  }
};
jspb.Message.getFieldWithDefault = function(msg, fieldNumber, defaultValue) {
  var value = jspb.Message.getField(msg, fieldNumber);
  return null == value ? defaultValue : value;
};
jspb.Message.getBooleanFieldWithDefault = function(msg, fieldNumber, defaultValue) {
  var value = jspb.Message.getBooleanField(msg, fieldNumber);
  return null == value ? defaultValue : value;
};
jspb.Message.getFloatingPointFieldWithDefault = function(msg, fieldNumber, defaultValue) {
  var value = jspb.Message.getOptionalFloatingPointField(msg, fieldNumber);
  return null == value ? defaultValue : value;
};
jspb.Message.getFieldProto3 = jspb.Message.getFieldWithDefault;
jspb.Message.getMapField = function(msg, fieldNumber, noLazyCreate, opt_valueCtor) {
  msg.wrappers_ || (msg.wrappers_ = {});
  if (fieldNumber in msg.wrappers_) {
    return msg.wrappers_[fieldNumber];
  }
  if (!noLazyCreate) {
    var arr = jspb.Message.getField(msg, fieldNumber);
    arr || (arr = [], jspb.Message.setField(msg, fieldNumber, arr));
    return msg.wrappers_[fieldNumber] = new jspb.Map(arr, opt_valueCtor);
  }
};
jspb.Message.setField = function(msg, fieldNumber, value) {
  fieldNumber < msg.pivot_ ? msg.array[jspb.Message.getIndex_(msg, fieldNumber)] = value : (jspb.Message.maybeInitEmptyExtensionObject_(msg), msg.extensionObject_[fieldNumber] = value);
};
jspb.Message.setProto3IntField = function(msg, fieldNumber, value) {
  jspb.Message.setFieldIgnoringDefault_(msg, fieldNumber, value, 0);
};
jspb.Message.setProto3FloatField = function(msg, fieldNumber, value) {
  jspb.Message.setFieldIgnoringDefault_(msg, fieldNumber, value, 0.0);
};
jspb.Message.setProto3BooleanField = function(msg, fieldNumber, value) {
  jspb.Message.setFieldIgnoringDefault_(msg, fieldNumber, value, !1);
};
jspb.Message.setProto3StringField = function(msg, fieldNumber, value) {
  jspb.Message.setFieldIgnoringDefault_(msg, fieldNumber, value, "");
};
jspb.Message.setProto3BytesField = function(msg, fieldNumber, value) {
  jspb.Message.setFieldIgnoringDefault_(msg, fieldNumber, value, "");
};
jspb.Message.setProto3EnumField = function(msg, fieldNumber, value) {
  jspb.Message.setFieldIgnoringDefault_(msg, fieldNumber, value, 0);
};
jspb.Message.setProto3StringIntField = function(msg, fieldNumber, value) {
  jspb.Message.setFieldIgnoringDefault_(msg, fieldNumber, value, "0");
};
jspb.Message.setFieldIgnoringDefault_ = function(msg, fieldNumber, value, defaultValue) {
  value !== defaultValue ? jspb.Message.setField(msg, fieldNumber, value) : msg.array[jspb.Message.getIndex_(msg, fieldNumber)] = null;
};
jspb.Message.addToRepeatedField = function(msg, fieldNumber, value, opt_index) {
  var arr = jspb.Message.getRepeatedField(msg, fieldNumber);
  void 0 != opt_index ? arr.splice(opt_index, 0, value) : arr.push(value);
};
jspb.Message.setOneofField = function(msg, fieldNumber, oneof, value) {
  var currentCase = jspb.Message.computeOneofCase(msg, oneof);
  currentCase && currentCase !== fieldNumber && void 0 !== value && (msg.wrappers_ && currentCase in msg.wrappers_ && (msg.wrappers_[currentCase] = void 0), jspb.Message.setField(msg, currentCase, void 0));
  jspb.Message.setField(msg, fieldNumber, value);
};
jspb.Message.computeOneofCase = function(msg, oneof) {
  for (var oneofField, oneofValue, i = 0; i < oneof.length; i++) {
    var fieldNumber = oneof[i], value = jspb.Message.getField(msg, fieldNumber);
    null != value && (oneofField = fieldNumber, oneofValue = value, jspb.Message.setField(msg, fieldNumber, void 0));
  }
  return oneofField ? (jspb.Message.setField(msg, oneofField, oneofValue), oneofField) : 0;
};
jspb.Message.getWrapperField = function(msg, ctor, fieldNumber, opt_required) {
  msg.wrappers_ || (msg.wrappers_ = {});
  if (!msg.wrappers_[fieldNumber]) {
    var data = jspb.Message.getField(msg, fieldNumber);
    if (opt_required || data) {
      msg.wrappers_[fieldNumber] = new ctor(data);
    }
  }
  return msg.wrappers_[fieldNumber];
};
jspb.Message.getRepeatedWrapperField = function(msg, ctor, fieldNumber) {
  jspb.Message.wrapRepeatedField_(msg, ctor, fieldNumber);
  var val = msg.wrappers_[fieldNumber];
  val == jspb.Message.EMPTY_LIST_SENTINEL_ && (val = msg.wrappers_[fieldNumber] = []);
  return val;
};
jspb.Message.wrapRepeatedField_ = function(msg, ctor, fieldNumber) {
  msg.wrappers_ || (msg.wrappers_ = {});
  if (!msg.wrappers_[fieldNumber]) {
    for (var data = jspb.Message.getRepeatedField(msg, fieldNumber), wrappers = [], i = 0; i < data.length; i++) {
      wrappers[i] = new ctor(data[i]);
    }
    msg.wrappers_[fieldNumber] = wrappers;
  }
};
jspb.Message.setWrapperField = function(msg, fieldNumber, value) {
  msg.wrappers_ || (msg.wrappers_ = {});
  var data = value ? value.toArray() : value;
  msg.wrappers_[fieldNumber] = value;
  jspb.Message.setField(msg, fieldNumber, data);
};
jspb.Message.setOneofWrapperField = function(msg, fieldNumber, oneof, value) {
  msg.wrappers_ || (msg.wrappers_ = {});
  var data = value ? value.toArray() : value;
  msg.wrappers_[fieldNumber] = value;
  jspb.Message.setOneofField(msg, fieldNumber, oneof, data);
};
jspb.Message.setRepeatedWrapperField = function(msg, fieldNumber, value) {
  msg.wrappers_ || (msg.wrappers_ = {});
  value = value || [];
  for (var data = [], i = 0; i < value.length; i++) {
    data[i] = value[i].toArray();
  }
  msg.wrappers_[fieldNumber] = value;
  jspb.Message.setField(msg, fieldNumber, data);
};
jspb.Message.addToRepeatedWrapperField = function(msg, fieldNumber, value, ctor, index) {
  jspb.Message.wrapRepeatedField_(msg, ctor, fieldNumber);
  var wrapperArray = msg.wrappers_[fieldNumber];
  wrapperArray || (wrapperArray = msg.wrappers_[fieldNumber] = []);
  var insertedValue = value ? value : new ctor, array = jspb.Message.getRepeatedField(msg, fieldNumber);
  void 0 != index ? (wrapperArray.splice(index, 0, insertedValue), array.splice(index, 0, insertedValue.toArray())) : (wrapperArray.push(insertedValue), array.push(insertedValue.toArray()));
  return insertedValue;
};
jspb.Message.toMap = function(field, mapKeyGetterFn, opt_toObjectFn, opt_includeInstance) {
  for (var result = {}, i = 0; i < field.length; i++) {
    result[mapKeyGetterFn.call(field[i])] = opt_toObjectFn ? opt_toObjectFn.call(field[i], opt_includeInstance, field[i]) : field[i];
  }
  return result;
};
jspb.Message.prototype.syncMapFields_ = function() {
  if (this.wrappers_) {
    for (var fieldNumber in this.wrappers_) {
      var val = this.wrappers_[fieldNumber];
      if (goog.isArray(val)) {
        for (var i = 0; i < val.length; i++) {
          val[i] && val[i].toArray();
        }
      } else {
        val && val.toArray();
      }
    }
  }
};
jspb.Message.prototype.toArray = function() {
  this.syncMapFields_();
  return this.array;
};
jspb.Message.prototype.serialize = jspb.Message.SUPPORTS_UINT8ARRAY_ ? function() {
  var old_toJSON = Uint8Array.prototype.toJSON;
  Uint8Array.prototype.toJSON = function() {
    return goog.crypt.base64.encodeByteArray(this);
  };
  try {
    return JSON.stringify(this.array && jspb.Message.prepareForSerialize_(this.toArray(), this), jspb.Message.serializeSpecialNumbers_);
  } finally {
    Uint8Array.prototype.toJSON = old_toJSON;
  }
} : function() {
  return JSON.stringify(this.array && jspb.Message.prepareForSerialize_(this.toArray(), this), jspb.Message.serializeSpecialNumbers_);
};
jspb.Message.prepareForSerialize_ = function(array, msg) {
  if (jspb.Message.SERIALIZE_EMPTY_TRAILING_FIELDS) {
    return array;
  }
  for (var result, length = array.length, needsCopy = !1, extension, i = array.length; i--;) {
    var value = array[i];
    if (jspb.Message.isArray_(value)) {
      var nestedMsg = goog.isArray(msg) ? msg[i] : msg && msg.wrappers_ ? msg.wrappers_[jspb.Message.getFieldNumber_(msg, i)] : void 0;
      value = jspb.Message.prepareForSerialize_(value, nestedMsg);
      !value.length && msg && (goog.isArray(msg) || msg.repeatedFields && -1 != msg.repeatedFields.indexOf(jspb.Message.getFieldNumber_(msg, i)) && (value = null));
      value != array[i] && (needsCopy = !0);
    } else {
      if (jspb.Message.isExtensionObject_(value)) {
        extension = jspb.Message.prepareExtensionForSerialize_(value, msg && goog.asserts.assertInstanceof(msg, jspb.Message));
        extension != value && (needsCopy = !0);
        length--;
        continue;
      }
    }
    null == value && length == i + 1 ? (needsCopy = !0, length--) : needsCopy && (result || (result = array.slice(0, length)), result[i] = value);
  }
  if (!needsCopy) {
    return array;
  }
  result || (result = array.slice(0, length));
  extension && result.push(extension);
  return result;
};
jspb.Message.prepareExtensionForSerialize_ = function(extension, msg) {
  var result = {}, changed = !1, key;
  for (key in extension) {
    var value = extension[key];
    if (jspb.Message.isArray_(value)) {
      var prepared = jspb.Message.prepareForSerialize_(value, msg && msg.wrappers_ && msg.wrappers_[key]);
      !prepared.length && msg && msg.repeatedFields && -1 != msg.repeatedFields.indexOf(+key) || (result[key] = prepared);
      result[key] != value && (changed = !0);
    } else {
      null != value ? result[key] = value : changed = !0;
    }
  }
  if (!changed) {
    return extension;
  }
  for (key in result) {
    return result;
  }
  return null;
};
jspb.Message.serializeSpecialNumbers_ = function(key, value) {
  return goog.isNumber(value) && (isNaN(value) || Infinity === value || -Infinity === value) ? String(value) : value;
};
jspb.Message.deserialize = function(ctor, data) {
  var msg = new ctor(data ? JSON.parse(data) : null);
  goog.asserts.assertInstanceof(msg, jspb.Message);
  return msg;
};
jspb.Message.buildMessageFromArray = function(data) {
  var messageCtor = jspb.Message.registry_[data[0]];
  if (!messageCtor) {
    throw Error("Unknown JsPb message type: " + data[0]);
  }
  return new messageCtor(data);
};
jspb.Message.GENERATE_TO_STRING && (jspb.Message.prototype.toString = function() {
  this.syncMapFields_();
  return this.array.toString();
});
jspb.Message.prototype.getExtension = function(fieldInfo) {
  if (this.extensionObject_) {
    this.wrappers_ || (this.wrappers_ = {});
    var fieldNumber = fieldInfo.fieldIndex;
    if (fieldInfo.isRepeated) {
      if (fieldInfo.isMessageType()) {
        return this.wrappers_[fieldNumber] || (this.wrappers_[fieldNumber] = goog.array.map(this.extensionObject_[fieldNumber] || [], function(arr) {
          return new fieldInfo.ctor(arr);
        })), this.wrappers_[fieldNumber];
      }
    } else {
      if (fieldInfo.isMessageType()) {
        return !this.wrappers_[fieldNumber] && this.extensionObject_[fieldNumber] && (this.wrappers_[fieldNumber] = new fieldInfo.ctor(this.extensionObject_[fieldNumber])), this.wrappers_[fieldNumber];
      }
    }
    return this.extensionObject_[fieldNumber];
  }
};
jspb.Message.prototype.setExtension = function(fieldInfo, value) {
  this.wrappers_ || (this.wrappers_ = {});
  jspb.Message.maybeInitEmptyExtensionObject_(this);
  var fieldNumber = fieldInfo.fieldIndex;
  fieldInfo.isRepeated ? (value = value || [], fieldInfo.isMessageType() ? (this.wrappers_[fieldNumber] = value, this.extensionObject_[fieldNumber] = goog.array.map(value, function(msg) {
    return msg.toArray();
  })) : this.extensionObject_[fieldNumber] = value) : fieldInfo.isMessageType() ? (this.wrappers_[fieldNumber] = value, this.extensionObject_[fieldNumber] = value ? value.toArray() : value) : this.extensionObject_[fieldNumber] = value;
  return this;
};
jspb.Message.difference = function(m1, m2) {
  if (!(m1 instanceof m2.constructor)) {
    throw Error("Messages have different types.");
  }
  var arr1 = m1.toArray(), arr2 = m2.toArray(), res = [], start = 0, length = arr1.length > arr2.length ? arr1.length : arr2.length;
  m1.getJsPbMessageId() && (res[0] = m1.getJsPbMessageId(), start = 1);
  for (var i = start; i < length; i++) {
    jspb.Message.compareFields(arr1[i], arr2[i]) || (res[i] = arr2[i]);
  }
  return new m1.constructor(res);
};
jspb.Message.equals = function(m1, m2) {
  return m1 == m2 || !(!m1 || !m2) && m1 instanceof m2.constructor && jspb.Message.compareFields(m1.toArray(), m2.toArray());
};
jspb.Message.compareExtensions = function(extension1, extension2) {
  extension1 = extension1 || {};
  extension2 = extension2 || {};
  var keys = {}, name;
  for (name in extension1) {
    keys[name] = 0;
  }
  for (name in extension2) {
    keys[name] = 0;
  }
  for (name in keys) {
    if (!jspb.Message.compareFields(extension1[name], extension2[name])) {
      return !1;
    }
  }
  return !0;
};
jspb.Message.compareFields = function(field1, field2) {
  if (field1 == field2) {
    return !0;
  }
  if (!goog.isObject(field1) || !goog.isObject(field2)) {
    return goog.isNumber(field1) && isNaN(field1) || goog.isNumber(field2) && isNaN(field2) ? String(field1) == String(field2) : !1;
  }
  if (field1.constructor != field2.constructor) {
    return !1;
  }
  if (jspb.Message.SUPPORTS_UINT8ARRAY_ && field1.constructor === Uint8Array) {
    if (field1.length != field2.length) {
      return !1;
    }
    for (var i = 0; i < field1.length; i++) {
      if (field1[i] != field2[i]) {
        return !1;
      }
    }
    return !0;
  }
  if (field1.constructor === Array) {
    var extension1 = void 0, extension2 = void 0, length = Math.max(field1.length, field2.length);
    for (i = 0; i < length; i++) {
      var val1 = field1[i], val2 = field2[i];
      val1 && val1.constructor == Object && (goog.asserts.assert(void 0 === extension1), goog.asserts.assert(i === field1.length - 1), extension1 = val1, val1 = void 0);
      val2 && val2.constructor == Object && (goog.asserts.assert(void 0 === extension2), goog.asserts.assert(i === field2.length - 1), extension2 = val2, val2 = void 0);
      if (!jspb.Message.compareFields(val1, val2)) {
        return !1;
      }
    }
    return extension1 || extension2 ? (extension1 = extension1 || {}, extension2 = extension2 || {}, jspb.Message.compareExtensions(extension1, extension2)) : !0;
  }
  if (field1.constructor === Object) {
    return jspb.Message.compareExtensions(field1, field2);
  }
  throw Error("Invalid type in JSPB array");
};
jspb.Message.prototype.cloneMessage = function() {
  return jspb.Message.cloneMessage(this);
};
jspb.Message.prototype.clone = function() {
  return jspb.Message.cloneMessage(this);
};
jspb.Message.clone = function(msg) {
  return jspb.Message.cloneMessage(msg);
};
jspb.Message.cloneMessage = function(msg) {
  return new msg.constructor(jspb.Message.clone_(msg.toArray()));
};
jspb.Message.copyInto = function(fromMessage, toMessage) {
  goog.asserts.assertInstanceof(fromMessage, jspb.Message);
  goog.asserts.assertInstanceof(toMessage, jspb.Message);
  goog.asserts.assert(fromMessage.constructor == toMessage.constructor, "Copy source and target message should have the same type.");
  for (var copyOfFrom = jspb.Message.clone(fromMessage), to = toMessage.toArray(), from = copyOfFrom.toArray(), i = to.length = 0; i < from.length; i++) {
    to[i] = from[i];
  }
  toMessage.wrappers_ = copyOfFrom.wrappers_;
  toMessage.extensionObject_ = copyOfFrom.extensionObject_;
};
jspb.Message.clone_ = function(obj) {
  if (goog.isArray(obj)) {
    for (var clonedArray = Array(obj.length), i = 0; i < obj.length; i++) {
      var o = obj[i];
      null != o && (clonedArray[i] = "object" == typeof o ? jspb.Message.clone_(goog.asserts.assert(o)) : o);
    }
    return clonedArray;
  }
  if (jspb.Message.SUPPORTS_UINT8ARRAY_ && obj instanceof Uint8Array) {
    return new Uint8Array(obj);
  }
  var clone = {}, key;
  for (key in obj) {
    o = obj[key], null != o && (clone[key] = "object" == typeof o ? jspb.Message.clone_(goog.asserts.assert(o)) : o);
  }
  return clone;
};
jspb.Message.registerMessageType = function(id, constructor) {
  jspb.Message.registry_[id] = constructor;
  constructor.messageId = id;
};
jspb.Message.registry_ = {};
jspb.Message.messageSetExtensions = {};
jspb.Message.messageSetExtensionsBinary = {};
var proto = {google:{}};
proto.google.protobuf = {};
proto.google.protobuf.Struct = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.google.protobuf.Struct, jspb.Message);
proto.google.protobuf.Value = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, proto.google.protobuf.Value.oneofGroups_);
};
goog.inherits(proto.google.protobuf.Value, jspb.Message);
proto.google.protobuf.ListValue = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.google.protobuf.ListValue.repeatedFields_, null);
};
goog.inherits(proto.google.protobuf.ListValue, jspb.Message);
jspb.Message.GENERATE_TO_OBJECT && (proto.google.protobuf.Struct.prototype.toObject = function(opt_includeInstance) {
  return proto.google.protobuf.Struct.toObject(opt_includeInstance, this);
}, proto.google.protobuf.Struct.toObject = function(includeInstance, msg) {
  var f, obj = {fieldsMap:(f = msg.getFieldsMap()) ? f.toObject(includeInstance, proto.google.protobuf.Value.toObject) : []};
  includeInstance && (obj.$jspbMessageInstance = msg);
  return obj;
});
jspb.Message.GENERATE_FROM_OBJECT && (proto.google.protobuf.Struct.ObjectFormat = function() {
}, proto.google.protobuf.Struct.fromObject = function(obj) {
  var msg = new proto.google.protobuf.Struct;
  obj.fieldsMap && jspb.Message.setWrapperField(msg, 1, jspb.Map.fromObject(obj.fieldsMap, proto.google.protobuf.Value, proto.google.protobuf.Value.fromObject));
  return msg;
});
proto.google.protobuf.Struct.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes), msg = new proto.google.protobuf.Struct;
  return proto.google.protobuf.Struct.deserializeBinaryFromReader(msg, reader);
};
proto.google.protobuf.Struct.deserializeBinaryFromReader = function(msg, reader$jscomp$0) {
  for (; reader$jscomp$0.nextField() && !reader$jscomp$0.isEndGroup();) {
    switch(reader$jscomp$0.getFieldNumber()) {
      case 1:
        var value = msg.getFieldsMap();
        reader$jscomp$0.readMessage(value, function(message, reader) {
          jspb.Map.deserializeBinary(message, reader, jspb.BinaryReader.prototype.readString, jspb.BinaryReader.prototype.readMessage, proto.google.protobuf.Value.deserializeBinaryFromReader, "");
        });
        break;
      default:
        reader$jscomp$0.skipField();
    }
  }
  return msg;
};
proto.google.protobuf.Struct.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter;
  proto.google.protobuf.Struct.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};
proto.google.protobuf.Struct.serializeBinaryToWriter = function(message, writer) {
  var f = void 0;
  (f = message.getFieldsMap(!0)) && 0 < f.getLength() && f.serializeBinary(1, writer, jspb.BinaryWriter.prototype.writeString, jspb.BinaryWriter.prototype.writeMessage, proto.google.protobuf.Value.serializeBinaryToWriter);
};
proto.google.protobuf.Struct.prototype.getFieldsMap = function(opt_noLazyCreate) {
  return jspb.Message.getMapField(this, 1, opt_noLazyCreate, proto.google.protobuf.Value);
};
proto.google.protobuf.Struct.prototype.clearFieldsMap = function() {
  this.getFieldsMap().clear();
};
proto.google.protobuf.Struct.deserialize = function(data) {
  return jspb.Message.deserialize(proto.google.protobuf.Struct, data);
};
proto.google.protobuf.Value.oneofGroups_ = [[1, 2, 3, 4, 5, 6]];
proto.google.protobuf.Value.KindCase = {KIND_NOT_SET:0, NULL_VALUE:1, NUMBER_VALUE:2, STRING_VALUE:3, BOOL_VALUE:4, STRUCT_VALUE:5, LIST_VALUE:6};
proto.google.protobuf.Value.prototype.getKindCase = function() {
  return jspb.Message.computeOneofCase(this, proto.google.protobuf.Value.oneofGroups_[0]);
};
jspb.Message.GENERATE_TO_OBJECT && (proto.google.protobuf.Value.prototype.toObject = function(opt_includeInstance) {
  return proto.google.protobuf.Value.toObject(opt_includeInstance, this);
}, proto.google.protobuf.Value.toObject = function(includeInstance, msg) {
  var f, obj = {nullValue:jspb.Message.getFieldWithDefault(msg, 1, 0), numberValue:jspb.Message.getFloatingPointFieldWithDefault(msg, 2, 0.0), stringValue:jspb.Message.getFieldWithDefault(msg, 3, ""), boolValue:jspb.Message.getBooleanFieldWithDefault(msg, 4, !1), structValue:(f = msg.getStructValue()) && proto.google.protobuf.Struct.toObject(includeInstance, f), listValue:(f = msg.getListValue()) && proto.google.protobuf.ListValue.toObject(includeInstance, f)};
  includeInstance && (obj.$jspbMessageInstance = msg);
  return obj;
});
jspb.Message.GENERATE_FROM_OBJECT && (proto.google.protobuf.Value.ObjectFormat = function() {
}, proto.google.protobuf.Value.fromObject = function(obj) {
  var msg = new proto.google.protobuf.Value;
  null != obj.nullValue && jspb.Message.setField(msg, 1, obj.nullValue);
  null != obj.numberValue && jspb.Message.setField(msg, 2, obj.numberValue);
  null != obj.stringValue && jspb.Message.setField(msg, 3, obj.stringValue);
  null != obj.boolValue && jspb.Message.setField(msg, 4, obj.boolValue);
  obj.structValue && jspb.Message.setWrapperField(msg, 5, proto.google.protobuf.Struct.fromObject(obj.structValue));
  obj.listValue && jspb.Message.setWrapperField(msg, 6, proto.google.protobuf.ListValue.fromObject(obj.listValue));
  return msg;
});
proto.google.protobuf.Value.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes), msg = new proto.google.protobuf.Value;
  return proto.google.protobuf.Value.deserializeBinaryFromReader(msg, reader);
};
proto.google.protobuf.Value.deserializeBinaryFromReader = function(msg, reader) {
  for (; reader.nextField() && !reader.isEndGroup();) {
    switch(reader.getFieldNumber()) {
      case 1:
        var value = reader.readEnum();
        msg.setNullValue(value);
        break;
      case 2:
        value = reader.readDouble();
        msg.setNumberValue(value);
        break;
      case 3:
        value = reader.readString();
        msg.setStringValue(value);
        break;
      case 4:
        value = reader.readBool();
        msg.setBoolValue(value);
        break;
      case 5:
        value = new proto.google.protobuf.Struct;
        reader.readMessage(value, proto.google.protobuf.Struct.deserializeBinaryFromReader);
        msg.setStructValue(value);
        break;
      case 6:
        value = new proto.google.protobuf.ListValue;
        reader.readMessage(value, proto.google.protobuf.ListValue.deserializeBinaryFromReader);
        msg.setListValue(value);
        break;
      default:
        reader.skipField();
    }
  }
  return msg;
};
proto.google.protobuf.Value.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter;
  proto.google.protobuf.Value.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};
proto.google.protobuf.Value.serializeBinaryToWriter = function(message, writer) {
  var f = void 0;
  f = jspb.Message.getField(message, 1);
  null != f && writer.writeEnum(1, f);
  f = jspb.Message.getField(message, 2);
  null != f && writer.writeDouble(2, f);
  f = jspb.Message.getField(message, 3);
  null != f && writer.writeString(3, f);
  f = jspb.Message.getField(message, 4);
  null != f && writer.writeBool(4, f);
  f = message.getStructValue();
  null != f && writer.writeMessage(5, f, proto.google.protobuf.Struct.serializeBinaryToWriter);
  f = message.getListValue();
  null != f && writer.writeMessage(6, f, proto.google.protobuf.ListValue.serializeBinaryToWriter);
};
proto.google.protobuf.Value.prototype.getNullValue = function() {
  return jspb.Message.getFieldWithDefault(this, 1, 0);
};
proto.google.protobuf.Value.prototype.setNullValue = function(value) {
  jspb.Message.setOneofField(this, 1, proto.google.protobuf.Value.oneofGroups_[0], value);
};
proto.google.protobuf.Value.prototype.clearNullValue = function() {
  jspb.Message.setOneofField(this, 1, proto.google.protobuf.Value.oneofGroups_[0], void 0);
};
proto.google.protobuf.Value.prototype.hasNullValue = function() {
  return null != jspb.Message.getField(this, 1);
};
proto.google.protobuf.Value.prototype.getNumberValue = function() {
  return jspb.Message.getFloatingPointFieldWithDefault(this, 2, 0.0);
};
proto.google.protobuf.Value.prototype.setNumberValue = function(value) {
  jspb.Message.setOneofField(this, 2, proto.google.protobuf.Value.oneofGroups_[0], value);
};
proto.google.protobuf.Value.prototype.clearNumberValue = function() {
  jspb.Message.setOneofField(this, 2, proto.google.protobuf.Value.oneofGroups_[0], void 0);
};
proto.google.protobuf.Value.prototype.hasNumberValue = function() {
  return null != jspb.Message.getField(this, 2);
};
proto.google.protobuf.Value.prototype.getStringValue = function() {
  return jspb.Message.getFieldWithDefault(this, 3, "");
};
proto.google.protobuf.Value.prototype.setStringValue = function(value) {
  jspb.Message.setOneofField(this, 3, proto.google.protobuf.Value.oneofGroups_[0], value);
};
proto.google.protobuf.Value.prototype.clearStringValue = function() {
  jspb.Message.setOneofField(this, 3, proto.google.protobuf.Value.oneofGroups_[0], void 0);
};
proto.google.protobuf.Value.prototype.hasStringValue = function() {
  return null != jspb.Message.getField(this, 3);
};
proto.google.protobuf.Value.prototype.getBoolValue = function() {
  return jspb.Message.getBooleanFieldWithDefault(this, 4, !1);
};
proto.google.protobuf.Value.prototype.setBoolValue = function(value) {
  jspb.Message.setOneofField(this, 4, proto.google.protobuf.Value.oneofGroups_[0], value);
};
proto.google.protobuf.Value.prototype.clearBoolValue = function() {
  jspb.Message.setOneofField(this, 4, proto.google.protobuf.Value.oneofGroups_[0], void 0);
};
proto.google.protobuf.Value.prototype.hasBoolValue = function() {
  return null != jspb.Message.getField(this, 4);
};
proto.google.protobuf.Value.prototype.getStructValue = function() {
  return jspb.Message.getWrapperField(this, proto.google.protobuf.Struct, 5);
};
proto.google.protobuf.Value.prototype.setStructValue = function(value) {
  jspb.Message.setOneofWrapperField(this, 5, proto.google.protobuf.Value.oneofGroups_[0], value);
};
proto.google.protobuf.Value.prototype.clearStructValue = function() {
  this.setStructValue(void 0);
};
proto.google.protobuf.Value.prototype.hasStructValue = function() {
  return null != jspb.Message.getField(this, 5);
};
proto.google.protobuf.Value.prototype.getListValue = function() {
  return jspb.Message.getWrapperField(this, proto.google.protobuf.ListValue, 6);
};
proto.google.protobuf.Value.prototype.setListValue = function(value) {
  jspb.Message.setOneofWrapperField(this, 6, proto.google.protobuf.Value.oneofGroups_[0], value);
};
proto.google.protobuf.Value.prototype.clearListValue = function() {
  this.setListValue(void 0);
};
proto.google.protobuf.Value.prototype.hasListValue = function() {
  return null != jspb.Message.getField(this, 6);
};
proto.google.protobuf.Value.deserialize = function(data) {
  return jspb.Message.deserialize(proto.google.protobuf.Value, data);
};
proto.google.protobuf.ListValue.repeatedFields_ = [1];
jspb.Message.GENERATE_TO_OBJECT && (proto.google.protobuf.ListValue.prototype.toObject = function(opt_includeInstance) {
  return proto.google.protobuf.ListValue.toObject(opt_includeInstance, this);
}, proto.google.protobuf.ListValue.toObject = function(includeInstance, msg) {
  var f, obj = {valuesList:jspb.Message.toObjectList(msg.getValuesList(), proto.google.protobuf.Value.toObject, includeInstance)};
  includeInstance && (obj.$jspbMessageInstance = msg);
  return obj;
});
jspb.Message.GENERATE_FROM_OBJECT && (proto.google.protobuf.ListValue.ObjectFormat = function() {
}, proto.google.protobuf.ListValue.fromObject = function(obj) {
  var msg = new proto.google.protobuf.ListValue;
  obj.valuesList && jspb.Message.setRepeatedWrapperField(msg, 1, obj.valuesList.map(proto.google.protobuf.Value.fromObject));
  return msg;
});
proto.google.protobuf.ListValue.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes), msg = new proto.google.protobuf.ListValue;
  return proto.google.protobuf.ListValue.deserializeBinaryFromReader(msg, reader);
};
proto.google.protobuf.ListValue.deserializeBinaryFromReader = function(msg, reader) {
  for (; reader.nextField() && !reader.isEndGroup();) {
    switch(reader.getFieldNumber()) {
      case 1:
        var value = new proto.google.protobuf.Value;
        reader.readMessage(value, proto.google.protobuf.Value.deserializeBinaryFromReader);
        msg.addValues(value);
        break;
      default:
        reader.skipField();
    }
  }
  return msg;
};
proto.google.protobuf.ListValue.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter;
  proto.google.protobuf.ListValue.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};
proto.google.protobuf.ListValue.serializeBinaryToWriter = function(message, writer) {
  var f = void 0;
  f = message.getValuesList();
  0 < f.length && writer.writeRepeatedMessage(1, f, proto.google.protobuf.Value.serializeBinaryToWriter);
};
proto.google.protobuf.ListValue.prototype.getValuesList = function() {
  return jspb.Message.getRepeatedWrapperField(this, proto.google.protobuf.Value, 1);
};
proto.google.protobuf.ListValue.prototype.setValuesList = function(value) {
  jspb.Message.setRepeatedWrapperField(this, 1, value);
};
proto.google.protobuf.ListValue.prototype.addValues = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 1, opt_value, proto.google.protobuf.Value, opt_index);
};
proto.google.protobuf.ListValue.prototype.clearValuesList = function() {
  this.setValuesList([]);
};
proto.google.protobuf.ListValue.deserialize = function(data) {
  return jspb.Message.deserialize(proto.google.protobuf.ListValue, data);
};
proto.google.protobuf.NullValue = {NULL_VALUE:0};
proto.google.protobuf.Value.prototype.toJavaScript = function() {
  var kindCase = proto.google.protobuf.Value.KindCase;
  switch(this.getKindCase()) {
    case kindCase.NULL_VALUE:
      return null;
    case kindCase.NUMBER_VALUE:
      return this.getNumberValue();
    case kindCase.STRING_VALUE:
      return this.getStringValue();
    case kindCase.BOOL_VALUE:
      return this.getBoolValue();
    case kindCase.STRUCT_VALUE:
      return this.getStructValue().toJavaScript();
    case kindCase.LIST_VALUE:
      return this.getListValue().toJavaScript();
    default:
      throw Error("Unexpected struct type");
  }
};
proto.google.protobuf.Value.fromJavaScript = function(value) {
  var ret = new proto.google.protobuf.Value;
  switch(goog.typeOf(value)) {
    case "string":
      ret.setStringValue(value);
      break;
    case "number":
      ret.setNumberValue(value);
      break;
    case "boolean":
      ret.setBoolValue(value);
      break;
    case "null":
      ret.setNullValue(proto.google.protobuf.NullValue.NULL_VALUE);
      break;
    case "array":
      ret.setListValue(proto.google.protobuf.ListValue.fromJavaScript(value));
      break;
    case "object":
      ret.setStructValue(proto.google.protobuf.Struct.fromJavaScript(value));
      break;
    default:
      throw Error("Unexpected struct type.");
  }
  return ret;
};
proto.google.protobuf.ListValue.prototype.toJavaScript = function() {
  for (var ret = [], values = this.getValuesList(), i = 0; i < values.length; i++) {
    ret[i] = values[i].toJavaScript();
  }
  return ret;
};
proto.google.protobuf.ListValue.fromJavaScript = function(array) {
  for (var ret = new proto.google.protobuf.ListValue, i = 0; i < array.length; i++) {
    ret.addValues(proto.google.protobuf.Value.fromJavaScript(array[i]));
  }
  return ret;
};
proto.google.protobuf.Struct.prototype.toJavaScript = function() {
  var ret = {};
  this.getFieldsMap().forEach(function(value, key) {
    ret[key] = value.toJavaScript();
  });
  return ret;
};
proto.google.protobuf.Struct.fromJavaScript = function(obj) {
  var ret = new proto.google.protobuf.Struct, map = ret.getFieldsMap(), property;
  for (property in obj) {
    map.set(property, proto.google.protobuf.Value.fromJavaScript(obj[property]));
  }
  return ret;
};
goog.async = {};
goog.async.FreeList = function(create, reset, limit) {
  this.limit_ = limit;
  this.create_ = create;
  this.reset_ = reset;
  this.occupants_ = 0;
  this.head_ = null;
};
goog.async.FreeList.prototype.get = function() {
  if (0 < this.occupants_) {
    this.occupants_--;
    var item = this.head_;
    this.head_ = item.next;
    item.next = null;
  } else {
    item = this.create_();
  }
  return item;
};
goog.async.FreeList.prototype.put = function(item) {
  this.reset_(item);
  this.occupants_ < this.limit_ && (this.occupants_++, item.next = this.head_, this.head_ = item);
};
goog.async.FreeList.prototype.occupants = function() {
  return this.occupants_;
};
goog.dom.HtmlElement = function() {
};
goog.dom.TagName = function(tagName) {
  this.tagName_ = tagName;
};
goog.dom.TagName.prototype.toString = function() {
  return this.tagName_;
};
goog.dom.TagName.A = new goog.dom.TagName("A");
goog.dom.TagName.ABBR = new goog.dom.TagName("ABBR");
goog.dom.TagName.ACRONYM = new goog.dom.TagName("ACRONYM");
goog.dom.TagName.ADDRESS = new goog.dom.TagName("ADDRESS");
goog.dom.TagName.APPLET = new goog.dom.TagName("APPLET");
goog.dom.TagName.AREA = new goog.dom.TagName("AREA");
goog.dom.TagName.ARTICLE = new goog.dom.TagName("ARTICLE");
goog.dom.TagName.ASIDE = new goog.dom.TagName("ASIDE");
goog.dom.TagName.AUDIO = new goog.dom.TagName("AUDIO");
goog.dom.TagName.B = new goog.dom.TagName("B");
goog.dom.TagName.BASE = new goog.dom.TagName("BASE");
goog.dom.TagName.BASEFONT = new goog.dom.TagName("BASEFONT");
goog.dom.TagName.BDI = new goog.dom.TagName("BDI");
goog.dom.TagName.BDO = new goog.dom.TagName("BDO");
goog.dom.TagName.BIG = new goog.dom.TagName("BIG");
goog.dom.TagName.BLOCKQUOTE = new goog.dom.TagName("BLOCKQUOTE");
goog.dom.TagName.BODY = new goog.dom.TagName("BODY");
goog.dom.TagName.BR = new goog.dom.TagName("BR");
goog.dom.TagName.BUTTON = new goog.dom.TagName("BUTTON");
goog.dom.TagName.CANVAS = new goog.dom.TagName("CANVAS");
goog.dom.TagName.CAPTION = new goog.dom.TagName("CAPTION");
goog.dom.TagName.CENTER = new goog.dom.TagName("CENTER");
goog.dom.TagName.CITE = new goog.dom.TagName("CITE");
goog.dom.TagName.CODE = new goog.dom.TagName("CODE");
goog.dom.TagName.COL = new goog.dom.TagName("COL");
goog.dom.TagName.COLGROUP = new goog.dom.TagName("COLGROUP");
goog.dom.TagName.COMMAND = new goog.dom.TagName("COMMAND");
goog.dom.TagName.DATA = new goog.dom.TagName("DATA");
goog.dom.TagName.DATALIST = new goog.dom.TagName("DATALIST");
goog.dom.TagName.DD = new goog.dom.TagName("DD");
goog.dom.TagName.DEL = new goog.dom.TagName("DEL");
goog.dom.TagName.DETAILS = new goog.dom.TagName("DETAILS");
goog.dom.TagName.DFN = new goog.dom.TagName("DFN");
goog.dom.TagName.DIALOG = new goog.dom.TagName("DIALOG");
goog.dom.TagName.DIR = new goog.dom.TagName("DIR");
goog.dom.TagName.DIV = new goog.dom.TagName("DIV");
goog.dom.TagName.DL = new goog.dom.TagName("DL");
goog.dom.TagName.DT = new goog.dom.TagName("DT");
goog.dom.TagName.EM = new goog.dom.TagName("EM");
goog.dom.TagName.EMBED = new goog.dom.TagName("EMBED");
goog.dom.TagName.FIELDSET = new goog.dom.TagName("FIELDSET");
goog.dom.TagName.FIGCAPTION = new goog.dom.TagName("FIGCAPTION");
goog.dom.TagName.FIGURE = new goog.dom.TagName("FIGURE");
goog.dom.TagName.FONT = new goog.dom.TagName("FONT");
goog.dom.TagName.FOOTER = new goog.dom.TagName("FOOTER");
goog.dom.TagName.FORM = new goog.dom.TagName("FORM");
goog.dom.TagName.FRAME = new goog.dom.TagName("FRAME");
goog.dom.TagName.FRAMESET = new goog.dom.TagName("FRAMESET");
goog.dom.TagName.H1 = new goog.dom.TagName("H1");
goog.dom.TagName.H2 = new goog.dom.TagName("H2");
goog.dom.TagName.H3 = new goog.dom.TagName("H3");
goog.dom.TagName.H4 = new goog.dom.TagName("H4");
goog.dom.TagName.H5 = new goog.dom.TagName("H5");
goog.dom.TagName.H6 = new goog.dom.TagName("H6");
goog.dom.TagName.HEAD = new goog.dom.TagName("HEAD");
goog.dom.TagName.HEADER = new goog.dom.TagName("HEADER");
goog.dom.TagName.HGROUP = new goog.dom.TagName("HGROUP");
goog.dom.TagName.HR = new goog.dom.TagName("HR");
goog.dom.TagName.HTML = new goog.dom.TagName("HTML");
goog.dom.TagName.I = new goog.dom.TagName("I");
goog.dom.TagName.IFRAME = new goog.dom.TagName("IFRAME");
goog.dom.TagName.IMG = new goog.dom.TagName("IMG");
goog.dom.TagName.INPUT = new goog.dom.TagName("INPUT");
goog.dom.TagName.INS = new goog.dom.TagName("INS");
goog.dom.TagName.ISINDEX = new goog.dom.TagName("ISINDEX");
goog.dom.TagName.KBD = new goog.dom.TagName("KBD");
goog.dom.TagName.KEYGEN = new goog.dom.TagName("KEYGEN");
goog.dom.TagName.LABEL = new goog.dom.TagName("LABEL");
goog.dom.TagName.LEGEND = new goog.dom.TagName("LEGEND");
goog.dom.TagName.LI = new goog.dom.TagName("LI");
goog.dom.TagName.LINK = new goog.dom.TagName("LINK");
goog.dom.TagName.MAIN = new goog.dom.TagName("MAIN");
goog.dom.TagName.MAP = new goog.dom.TagName("MAP");
goog.dom.TagName.MARK = new goog.dom.TagName("MARK");
goog.dom.TagName.MATH = new goog.dom.TagName("MATH");
goog.dom.TagName.MENU = new goog.dom.TagName("MENU");
goog.dom.TagName.MENUITEM = new goog.dom.TagName("MENUITEM");
goog.dom.TagName.META = new goog.dom.TagName("META");
goog.dom.TagName.METER = new goog.dom.TagName("METER");
goog.dom.TagName.NAV = new goog.dom.TagName("NAV");
goog.dom.TagName.NOFRAMES = new goog.dom.TagName("NOFRAMES");
goog.dom.TagName.NOSCRIPT = new goog.dom.TagName("NOSCRIPT");
goog.dom.TagName.OBJECT = new goog.dom.TagName("OBJECT");
goog.dom.TagName.OL = new goog.dom.TagName("OL");
goog.dom.TagName.OPTGROUP = new goog.dom.TagName("OPTGROUP");
goog.dom.TagName.OPTION = new goog.dom.TagName("OPTION");
goog.dom.TagName.OUTPUT = new goog.dom.TagName("OUTPUT");
goog.dom.TagName.P = new goog.dom.TagName("P");
goog.dom.TagName.PARAM = new goog.dom.TagName("PARAM");
goog.dom.TagName.PICTURE = new goog.dom.TagName("PICTURE");
goog.dom.TagName.PRE = new goog.dom.TagName("PRE");
goog.dom.TagName.PROGRESS = new goog.dom.TagName("PROGRESS");
goog.dom.TagName.Q = new goog.dom.TagName("Q");
goog.dom.TagName.RP = new goog.dom.TagName("RP");
goog.dom.TagName.RT = new goog.dom.TagName("RT");
goog.dom.TagName.RTC = new goog.dom.TagName("RTC");
goog.dom.TagName.RUBY = new goog.dom.TagName("RUBY");
goog.dom.TagName.S = new goog.dom.TagName("S");
goog.dom.TagName.SAMP = new goog.dom.TagName("SAMP");
goog.dom.TagName.SCRIPT = new goog.dom.TagName("SCRIPT");
goog.dom.TagName.SECTION = new goog.dom.TagName("SECTION");
goog.dom.TagName.SELECT = new goog.dom.TagName("SELECT");
goog.dom.TagName.SMALL = new goog.dom.TagName("SMALL");
goog.dom.TagName.SOURCE = new goog.dom.TagName("SOURCE");
goog.dom.TagName.SPAN = new goog.dom.TagName("SPAN");
goog.dom.TagName.STRIKE = new goog.dom.TagName("STRIKE");
goog.dom.TagName.STRONG = new goog.dom.TagName("STRONG");
goog.dom.TagName.STYLE = new goog.dom.TagName("STYLE");
goog.dom.TagName.SUB = new goog.dom.TagName("SUB");
goog.dom.TagName.SUMMARY = new goog.dom.TagName("SUMMARY");
goog.dom.TagName.SUP = new goog.dom.TagName("SUP");
goog.dom.TagName.SVG = new goog.dom.TagName("SVG");
goog.dom.TagName.TABLE = new goog.dom.TagName("TABLE");
goog.dom.TagName.TBODY = new goog.dom.TagName("TBODY");
goog.dom.TagName.TD = new goog.dom.TagName("TD");
goog.dom.TagName.TEMPLATE = new goog.dom.TagName("TEMPLATE");
goog.dom.TagName.TEXTAREA = new goog.dom.TagName("TEXTAREA");
goog.dom.TagName.TFOOT = new goog.dom.TagName("TFOOT");
goog.dom.TagName.TH = new goog.dom.TagName("TH");
goog.dom.TagName.THEAD = new goog.dom.TagName("THEAD");
goog.dom.TagName.TIME = new goog.dom.TagName("TIME");
goog.dom.TagName.TITLE = new goog.dom.TagName("TITLE");
goog.dom.TagName.TR = new goog.dom.TagName("TR");
goog.dom.TagName.TRACK = new goog.dom.TagName("TRACK");
goog.dom.TagName.TT = new goog.dom.TagName("TT");
goog.dom.TagName.U = new goog.dom.TagName("U");
goog.dom.TagName.UL = new goog.dom.TagName("UL");
goog.dom.TagName.VAR = new goog.dom.TagName("VAR");
goog.dom.TagName.VIDEO = new goog.dom.TagName("VIDEO");
goog.dom.TagName.WBR = new goog.dom.TagName("WBR");
goog.async.throwException = function(exception) {
  goog.global.setTimeout(function() {
    throw exception;
  }, 0);
};
goog.async.nextTick = function(callback, opt_context, opt_useSetImmediate) {
  var cb = callback;
  opt_context && (cb = goog.bind(callback, opt_context));
  cb = goog.async.nextTick.wrapCallback_(cb);
  goog.isFunction(goog.global.setImmediate) && (opt_useSetImmediate || goog.async.nextTick.useSetImmediate_()) ? goog.global.setImmediate(cb) : (goog.async.nextTick.setImmediate_ || (goog.async.nextTick.setImmediate_ = goog.async.nextTick.getSetImmediateEmulator_()), goog.async.nextTick.setImmediate_(cb));
};
goog.async.nextTick.useSetImmediate_ = function() {
  return goog.global.Window && goog.global.Window.prototype && !goog.labs.userAgent.browser.isEdge() && goog.global.Window.prototype.setImmediate == goog.global.setImmediate ? !1 : !0;
};
goog.async.nextTick.getSetImmediateEmulator_ = function() {
  var Channel = goog.global.MessageChannel;
  "undefined" === typeof Channel && "undefined" !== typeof window && window.postMessage && window.addEventListener && !goog.labs.userAgent.engine.isPresto() && (Channel = function() {
    var iframe = document.createElement("IFRAME");
    iframe.style.display = "none";
    iframe.src = "";
    document.documentElement.appendChild(iframe);
    var win = iframe.contentWindow, doc = win.document;
    doc.open();
    doc.write("");
    doc.close();
    var message = "callImmediate" + Math.random(), origin = "file:" == win.location.protocol ? "*" : win.location.protocol + "//" + win.location.host, onmessage = goog.bind(function(e) {
      if (("*" == origin || e.origin == origin) && e.data == message) {
        this.port1.onmessage();
      }
    }, this);
    win.addEventListener("message", onmessage, !1);
    this.port1 = {};
    this.port2 = {postMessage:function() {
      win.postMessage(message, origin);
    }};
  });
  if ("undefined" !== typeof Channel && !goog.labs.userAgent.browser.isIE()) {
    var channel = new Channel, head = {}, tail = head;
    channel.port1.onmessage = function() {
      if (goog.isDef(head.next)) {
        head = head.next;
        var cb = head.cb;
        head.cb = null;
        cb();
      }
    };
    return function(cb) {
      tail.next = {cb:cb};
      tail = tail.next;
      channel.port2.postMessage(0);
    };
  }
  return "undefined" !== typeof document && "onreadystatechange" in document.createElement("SCRIPT") ? function(cb) {
    var script = document.createElement("SCRIPT");
    script.onreadystatechange = function() {
      script.onreadystatechange = null;
      script.parentNode.removeChild(script);
      script = null;
      cb();
      cb = null;
    };
    document.documentElement.appendChild(script);
  } : function(cb) {
    goog.global.setTimeout(cb, 0);
  };
};
goog.async.nextTick.wrapCallback_ = goog.functions.identity;
goog.debug.entryPointRegistry.register(function(transformer) {
  goog.async.nextTick.wrapCallback_ = transformer;
});
goog.async.WorkQueue = function() {
  this.workTail_ = this.workHead_ = null;
};
goog.async.WorkQueue.DEFAULT_MAX_UNUSED = 100;
goog.async.WorkQueue.freelist_ = new goog.async.FreeList(function() {
  return new goog.async.WorkItem;
}, function(item) {
  item.reset();
}, goog.async.WorkQueue.DEFAULT_MAX_UNUSED);
goog.async.WorkQueue.prototype.add = function(fn, scope) {
  var item = this.getUnusedItem_();
  item.set(fn, scope);
  this.workTail_ ? this.workTail_.next = item : (goog.asserts.assert(!this.workHead_), this.workHead_ = item);
  this.workTail_ = item;
};
goog.async.WorkQueue.prototype.remove = function() {
  var item = null;
  this.workHead_ && (item = this.workHead_, this.workHead_ = this.workHead_.next, this.workHead_ || (this.workTail_ = null), item.next = null);
  return item;
};
goog.async.WorkQueue.prototype.returnUnused = function(item) {
  goog.async.WorkQueue.freelist_.put(item);
};
goog.async.WorkQueue.prototype.getUnusedItem_ = function() {
  return goog.async.WorkQueue.freelist_.get();
};
goog.async.WorkItem = function() {
  this.next = this.scope = this.fn = null;
};
goog.async.WorkItem.prototype.set = function(fn, scope) {
  this.fn = fn;
  this.scope = scope;
  this.next = null;
};
goog.async.WorkItem.prototype.reset = function() {
  this.next = this.scope = this.fn = null;
};
goog.ASSUME_NATIVE_PROMISE = !1;
goog.async.run = function(callback, opt_context) {
  goog.async.run.schedule_ || goog.async.run.initializeRunner_();
  goog.async.run.workQueueScheduled_ || (goog.async.run.schedule_(), goog.async.run.workQueueScheduled_ = !0);
  goog.async.run.workQueue_.add(callback, opt_context);
};
goog.async.run.initializeRunner_ = function() {
  if (goog.ASSUME_NATIVE_PROMISE || goog.global.Promise && goog.global.Promise.resolve) {
    var promise = goog.global.Promise.resolve(void 0);
    goog.async.run.schedule_ = function() {
      promise.then(goog.async.run.processWorkQueue);
    };
  } else {
    goog.async.run.schedule_ = function() {
      goog.async.nextTick(goog.async.run.processWorkQueue);
    };
  }
};
goog.async.run.forceNextTick = function(opt_realSetTimeout) {
  goog.async.run.schedule_ = function() {
    goog.async.nextTick(goog.async.run.processWorkQueue);
    opt_realSetTimeout && opt_realSetTimeout(goog.async.run.processWorkQueue);
  };
};
goog.async.run.workQueueScheduled_ = !1;
goog.async.run.workQueue_ = new goog.async.WorkQueue;
goog.DEBUG && (goog.async.run.resetQueue = function() {
  goog.async.run.workQueueScheduled_ = !1;
  goog.async.run.workQueue_ = new goog.async.WorkQueue;
});
goog.async.run.processWorkQueue = function() {
  for (var item = null; item = goog.async.run.workQueue_.remove();) {
    try {
      item.fn.call(item.scope);
    } catch (e) {
      goog.async.throwException(e);
    }
    goog.async.run.workQueue_.returnUnused(item);
  }
  goog.async.run.workQueueScheduled_ = !1;
};
goog.promise = {};
goog.promise.Resolver = function() {
};
goog.Thenable = function() {
};
goog.Thenable.prototype.then = function(opt_onFulfilled, opt_onRejected, opt_context) {
};
goog.Thenable.IMPLEMENTED_BY_PROP = "$goog_Thenable";
goog.Thenable.addImplementation = function(ctor) {
  ctor.prototype[goog.Thenable.IMPLEMENTED_BY_PROP] = !0;
};
goog.Thenable.isImplementedBy = function(object) {
  if (!object) {
    return !1;
  }
  try {
    return !!object[goog.Thenable.IMPLEMENTED_BY_PROP];
    return !!object.$goog_Thenable;
  } catch (e) {
    return !1;
  }
};
goog.Promise = function(resolver, opt_context) {
  this.state_ = goog.Promise.State_.PENDING;
  this.result_ = void 0;
  this.callbackEntriesTail_ = this.callbackEntries_ = this.parent_ = null;
  this.executing_ = !1;
  0 < goog.Promise.UNHANDLED_REJECTION_DELAY ? this.unhandledRejectionId_ = 0 : 0 == goog.Promise.UNHANDLED_REJECTION_DELAY && (this.hadUnhandledRejection_ = !1);
  goog.Promise.LONG_STACK_TRACES && (this.stack_ = [], this.addStackTrace_(Error("created")), this.currentStep_ = 0);
  if (resolver != goog.nullFunction) {
    try {
      var self = this;
      resolver.call(opt_context, function(value) {
        self.resolve_(goog.Promise.State_.FULFILLED, value);
      }, function(reason) {
        if (goog.DEBUG && !(reason instanceof goog.Promise.CancellationError)) {
          try {
            if (reason instanceof Error) {
              throw reason;
            }
            throw Error("Promise rejected.");
          } catch (e) {
          }
        }
        self.resolve_(goog.Promise.State_.REJECTED, reason);
      });
    } catch (e) {
      this.resolve_(goog.Promise.State_.REJECTED, e);
    }
  }
};
goog.Promise.LONG_STACK_TRACES = !1;
goog.Promise.UNHANDLED_REJECTION_DELAY = 0;
goog.Promise.State_ = {PENDING:0, BLOCKED:1, FULFILLED:2, REJECTED:3};
goog.Promise.CallbackEntry_ = function() {
  this.next = this.context = this.onRejected = this.onFulfilled = this.child = null;
  this.always = !1;
};
goog.Promise.CallbackEntry_.prototype.reset = function() {
  this.context = this.onRejected = this.onFulfilled = this.child = null;
  this.always = !1;
};
goog.Promise.DEFAULT_MAX_UNUSED = 100;
goog.Promise.freelist_ = new goog.async.FreeList(function() {
  return new goog.Promise.CallbackEntry_;
}, function(item) {
  item.reset();
}, goog.Promise.DEFAULT_MAX_UNUSED);
goog.Promise.getCallbackEntry_ = function(onFulfilled, onRejected, context) {
  var entry = goog.Promise.freelist_.get();
  entry.onFulfilled = onFulfilled;
  entry.onRejected = onRejected;
  entry.context = context;
  return entry;
};
goog.Promise.returnEntry_ = function(entry) {
  goog.Promise.freelist_.put(entry);
};
goog.Promise.resolve = function(opt_value) {
  if (opt_value instanceof goog.Promise) {
    return opt_value;
  }
  var promise = new goog.Promise(goog.nullFunction);
  promise.resolve_(goog.Promise.State_.FULFILLED, opt_value);
  return promise;
};
goog.Promise.reject = function(opt_reason) {
  return new goog.Promise(function(resolve, reject) {
    reject(opt_reason);
  });
};
goog.Promise.resolveThen_ = function(value, onFulfilled, onRejected) {
  goog.Promise.maybeThen_(value, onFulfilled, onRejected, null) || goog.async.run(goog.partial(onFulfilled, value));
};
goog.Promise.race = function(promises) {
  return new goog.Promise(function(resolve, reject) {
    promises.length || resolve(void 0);
    for (var i = 0, promise; i < promises.length; i++) {
      promise = promises[i], goog.Promise.resolveThen_(promise, resolve, reject);
    }
  });
};
goog.Promise.all = function(promises) {
  return new goog.Promise(function(resolve, reject) {
    var toFulfill = promises.length, values = [];
    if (toFulfill) {
      for (var onFulfill = function(index, value) {
        toFulfill--;
        values[index] = value;
        0 == toFulfill && resolve(values);
      }, onReject = function(reason) {
        reject(reason);
      }, i = 0, promise; i < promises.length; i++) {
        promise = promises[i], goog.Promise.resolveThen_(promise, goog.partial(onFulfill, i), onReject);
      }
    } else {
      resolve(values);
    }
  });
};
goog.Promise.allSettled = function(promises) {
  return new goog.Promise(function(resolve, reject) {
    var toSettle = promises.length, results = [];
    if (toSettle) {
      for (var onSettled = function(index, fulfilled, result) {
        toSettle--;
        results[index] = fulfilled ? {fulfilled:!0, value:result} : {fulfilled:!1, reason:result};
        0 == toSettle && resolve(results);
      }, i = 0, promise; i < promises.length; i++) {
        promise = promises[i], goog.Promise.resolveThen_(promise, goog.partial(onSettled, i, !0), goog.partial(onSettled, i, !1));
      }
    } else {
      resolve(results);
    }
  });
};
goog.Promise.firstFulfilled = function(promises) {
  return new goog.Promise(function(resolve, reject) {
    var toReject = promises.length, reasons = [];
    if (toReject) {
      for (var onFulfill = function(value) {
        resolve(value);
      }, onReject = function(index, reason) {
        toReject--;
        reasons[index] = reason;
        0 == toReject && reject(reasons);
      }, i = 0, promise; i < promises.length; i++) {
        promise = promises[i], goog.Promise.resolveThen_(promise, onFulfill, goog.partial(onReject, i));
      }
    } else {
      resolve(void 0);
    }
  });
};
goog.Promise.withResolver = function() {
  var resolve, reject, promise = new goog.Promise(function(rs, rj) {
    resolve = rs;
    reject = rj;
  });
  return new goog.Promise.Resolver_(promise, resolve, reject);
};
goog.Promise.prototype.then = function(opt_onFulfilled, opt_onRejected, opt_context) {
  null != opt_onFulfilled && goog.asserts.assertFunction(opt_onFulfilled, "opt_onFulfilled should be a function.");
  null != opt_onRejected && goog.asserts.assertFunction(opt_onRejected, "opt_onRejected should be a function. Did you pass opt_context as the second argument instead of the third?");
  goog.Promise.LONG_STACK_TRACES && this.addStackTrace_(Error("then"));
  return this.addChildPromise_(goog.isFunction(opt_onFulfilled) ? opt_onFulfilled : null, goog.isFunction(opt_onRejected) ? opt_onRejected : null, opt_context);
};
goog.Thenable.addImplementation(goog.Promise);
goog.Promise.prototype.thenVoid = function(opt_onFulfilled, opt_onRejected, opt_context) {
  null != opt_onFulfilled && goog.asserts.assertFunction(opt_onFulfilled, "opt_onFulfilled should be a function.");
  null != opt_onRejected && goog.asserts.assertFunction(opt_onRejected, "opt_onRejected should be a function. Did you pass opt_context as the second argument instead of the third?");
  goog.Promise.LONG_STACK_TRACES && this.addStackTrace_(Error("then"));
  this.addCallbackEntry_(goog.Promise.getCallbackEntry_(opt_onFulfilled || goog.nullFunction, opt_onRejected || null, opt_context));
};
goog.Promise.prototype.thenAlways = function(onSettled, opt_context) {
  goog.Promise.LONG_STACK_TRACES && this.addStackTrace_(Error("thenAlways"));
  var entry = goog.Promise.getCallbackEntry_(onSettled, onSettled, opt_context);
  entry.always = !0;
  this.addCallbackEntry_(entry);
  return this;
};
goog.Promise.prototype.thenCatch = function(onRejected, opt_context) {
  goog.Promise.LONG_STACK_TRACES && this.addStackTrace_(Error("thenCatch"));
  return this.addChildPromise_(null, onRejected, opt_context);
};
goog.Promise.prototype.cancel = function(opt_message) {
  this.state_ == goog.Promise.State_.PENDING && goog.async.run(function() {
    var err = new goog.Promise.CancellationError(opt_message);
    this.cancelInternal_(err);
  }, this);
};
goog.Promise.prototype.cancelInternal_ = function(err) {
  this.state_ == goog.Promise.State_.PENDING && (this.parent_ ? (this.parent_.cancelChild_(this, err), this.parent_ = null) : this.resolve_(goog.Promise.State_.REJECTED, err));
};
goog.Promise.prototype.cancelChild_ = function(childPromise, err) {
  if (this.callbackEntries_) {
    for (var childCount = 0, childEntry = null, beforeChildEntry = null, entry = this.callbackEntries_; entry && (entry.always || (childCount++, entry.child == childPromise && (childEntry = entry), !(childEntry && 1 < childCount))); entry = entry.next) {
      childEntry || (beforeChildEntry = entry);
    }
    childEntry && (this.state_ == goog.Promise.State_.PENDING && 1 == childCount ? this.cancelInternal_(err) : (beforeChildEntry ? this.removeEntryAfter_(beforeChildEntry) : this.popEntry_(), this.executeCallback_(childEntry, goog.Promise.State_.REJECTED, err)));
  }
};
goog.Promise.prototype.addCallbackEntry_ = function(callbackEntry) {
  this.hasEntry_() || this.state_ != goog.Promise.State_.FULFILLED && this.state_ != goog.Promise.State_.REJECTED || this.scheduleCallbacks_();
  this.queueEntry_(callbackEntry);
};
goog.Promise.prototype.addChildPromise_ = function(onFulfilled, onRejected, opt_context) {
  var callbackEntry = goog.Promise.getCallbackEntry_(null, null, null);
  callbackEntry.child = new goog.Promise(function(resolve, reject) {
    callbackEntry.onFulfilled = onFulfilled ? function(value) {
      try {
        var result = onFulfilled.call(opt_context, value);
        resolve(result);
      } catch (err) {
        reject(err);
      }
    } : resolve;
    callbackEntry.onRejected = onRejected ? function(reason) {
      try {
        var result = onRejected.call(opt_context, reason);
        !goog.isDef(result) && reason instanceof goog.Promise.CancellationError ? reject(reason) : resolve(result);
      } catch (err) {
        reject(err);
      }
    } : reject;
  });
  callbackEntry.child.parent_ = this;
  this.addCallbackEntry_(callbackEntry);
  return callbackEntry.child;
};
goog.Promise.prototype.unblockAndFulfill_ = function(value) {
  goog.asserts.assert(this.state_ == goog.Promise.State_.BLOCKED);
  this.state_ = goog.Promise.State_.PENDING;
  this.resolve_(goog.Promise.State_.FULFILLED, value);
};
goog.Promise.prototype.unblockAndReject_ = function(reason) {
  goog.asserts.assert(this.state_ == goog.Promise.State_.BLOCKED);
  this.state_ = goog.Promise.State_.PENDING;
  this.resolve_(goog.Promise.State_.REJECTED, reason);
};
goog.Promise.prototype.resolve_ = function(state, x) {
  this.state_ == goog.Promise.State_.PENDING && (this === x && (state = goog.Promise.State_.REJECTED, x = new TypeError("Promise cannot resolve to itself")), this.state_ = goog.Promise.State_.BLOCKED, goog.Promise.maybeThen_(x, this.unblockAndFulfill_, this.unblockAndReject_, this) || (this.result_ = x, this.state_ = state, this.parent_ = null, this.scheduleCallbacks_(), state != goog.Promise.State_.REJECTED || x instanceof goog.Promise.CancellationError || goog.Promise.addUnhandledRejection_(this, 
  x)));
};
goog.Promise.maybeThen_ = function(value, onFulfilled, onRejected, context) {
  if (value instanceof goog.Promise) {
    return value.thenVoid(onFulfilled, onRejected, context), !0;
  }
  if (goog.Thenable.isImplementedBy(value)) {
    return value.then(onFulfilled, onRejected, context), !0;
  }
  if (goog.isObject(value)) {
    try {
      var then = value.then;
      if (goog.isFunction(then)) {
        return goog.Promise.tryThen_(value, then, onFulfilled, onRejected, context), !0;
      }
    } catch (e) {
      return onRejected.call(context, e), !0;
    }
  }
  return !1;
};
goog.Promise.tryThen_ = function(thenable, then, onFulfilled, onRejected, context) {
  var called = !1, resolve = function(value) {
    called || (called = !0, onFulfilled.call(context, value));
  }, reject = function(reason) {
    called || (called = !0, onRejected.call(context, reason));
  };
  try {
    then.call(thenable, resolve, reject);
  } catch (e) {
    reject(e);
  }
};
goog.Promise.prototype.scheduleCallbacks_ = function() {
  this.executing_ || (this.executing_ = !0, goog.async.run(this.executeCallbacks_, this));
};
goog.Promise.prototype.hasEntry_ = function() {
  return !!this.callbackEntries_;
};
goog.Promise.prototype.queueEntry_ = function(entry) {
  goog.asserts.assert(null != entry.onFulfilled);
  this.callbackEntriesTail_ ? this.callbackEntriesTail_.next = entry : this.callbackEntries_ = entry;
  this.callbackEntriesTail_ = entry;
};
goog.Promise.prototype.popEntry_ = function() {
  var entry = null;
  this.callbackEntries_ && (entry = this.callbackEntries_, this.callbackEntries_ = entry.next, entry.next = null);
  this.callbackEntries_ || (this.callbackEntriesTail_ = null);
  null != entry && goog.asserts.assert(null != entry.onFulfilled);
  return entry;
};
goog.Promise.prototype.removeEntryAfter_ = function(previous) {
  goog.asserts.assert(this.callbackEntries_);
  goog.asserts.assert(null != previous);
  previous.next == this.callbackEntriesTail_ && (this.callbackEntriesTail_ = previous);
  previous.next = previous.next.next;
};
goog.Promise.prototype.executeCallbacks_ = function() {
  for (var entry = null; entry = this.popEntry_();) {
    goog.Promise.LONG_STACK_TRACES && this.currentStep_++, this.executeCallback_(entry, this.state_, this.result_);
  }
  this.executing_ = !1;
};
goog.Promise.prototype.executeCallback_ = function(callbackEntry, state, result) {
  state == goog.Promise.State_.REJECTED && callbackEntry.onRejected && !callbackEntry.always && this.removeUnhandledRejection_();
  if (callbackEntry.child) {
    callbackEntry.child.parent_ = null, goog.Promise.invokeCallback_(callbackEntry, state, result);
  } else {
    try {
      callbackEntry.always ? callbackEntry.onFulfilled.call(callbackEntry.context) : goog.Promise.invokeCallback_(callbackEntry, state, result);
    } catch (err) {
      goog.Promise.handleRejection_.call(null, err);
    }
  }
  goog.Promise.returnEntry_(callbackEntry);
};
goog.Promise.invokeCallback_ = function(callbackEntry, state, result) {
  state == goog.Promise.State_.FULFILLED ? callbackEntry.onFulfilled.call(callbackEntry.context, result) : callbackEntry.onRejected && callbackEntry.onRejected.call(callbackEntry.context, result);
};
goog.Promise.prototype.addStackTrace_ = function(err) {
  if (goog.Promise.LONG_STACK_TRACES && goog.isString(err.stack)) {
    var trace = err.stack.split("\n", 4)[3], message = err.message;
    message += Array(11 - message.length).join(" ");
    this.stack_.push(message + trace);
  }
};
goog.Promise.prototype.appendLongStack_ = function(err) {
  if (goog.Promise.LONG_STACK_TRACES && err && goog.isString(err.stack) && this.stack_.length) {
    for (var longTrace = ["Promise trace:"], promise = this; promise; promise = promise.parent_) {
      for (var i = this.currentStep_; 0 <= i; i--) {
        longTrace.push(promise.stack_[i]);
      }
      longTrace.push("Value: [" + (promise.state_ == goog.Promise.State_.REJECTED ? "REJECTED" : "FULFILLED") + "] <" + String(promise.result_) + ">");
    }
    err.stack += "\n\n" + longTrace.join("\n");
  }
};
goog.Promise.prototype.removeUnhandledRejection_ = function() {
  if (0 < goog.Promise.UNHANDLED_REJECTION_DELAY) {
    for (var p = this; p && p.unhandledRejectionId_; p = p.parent_) {
      goog.global.clearTimeout(p.unhandledRejectionId_), p.unhandledRejectionId_ = 0;
    }
  } else {
    if (0 == goog.Promise.UNHANDLED_REJECTION_DELAY) {
      for (p = this; p && p.hadUnhandledRejection_; p = p.parent_) {
        p.hadUnhandledRejection_ = !1;
      }
    }
  }
};
goog.Promise.addUnhandledRejection_ = function(promise, reason) {
  0 < goog.Promise.UNHANDLED_REJECTION_DELAY ? promise.unhandledRejectionId_ = goog.global.setTimeout(function() {
    promise.appendLongStack_(reason);
    goog.Promise.handleRejection_.call(null, reason);
  }, goog.Promise.UNHANDLED_REJECTION_DELAY) : 0 == goog.Promise.UNHANDLED_REJECTION_DELAY && (promise.hadUnhandledRejection_ = !0, goog.async.run(function() {
    promise.hadUnhandledRejection_ && (promise.appendLongStack_(reason), goog.Promise.handleRejection_.call(null, reason));
  }));
};
goog.Promise.handleRejection_ = goog.async.throwException;
goog.Promise.setUnhandledRejectionHandler = function(handler) {
  goog.Promise.handleRejection_ = handler;
};
goog.Promise.CancellationError = function(opt_message) {
  goog.debug.Error.call(this, opt_message);
};
goog.inherits(goog.Promise.CancellationError, goog.debug.Error);
goog.Promise.CancellationError.prototype.name = "cancel";
goog.Promise.Resolver_ = function(promise, resolve, reject) {
  this.promise = promise;
  this.resolve = resolve;
  this.reject = reject;
};
goog.Timer = function(opt_interval, opt_timerObject) {
  goog.events.EventTarget.call(this);
  this.interval_ = opt_interval || 1;
  this.timerObject_ = opt_timerObject || goog.Timer.defaultTimerObject;
  this.boundTick_ = goog.bind(this.tick_, this);
  this.last_ = goog.now();
};
goog.inherits(goog.Timer, goog.events.EventTarget);
goog.Timer.MAX_TIMEOUT_ = 2147483647;
goog.Timer.INVALID_TIMEOUT_ID_ = -1;
goog.Timer.prototype.enabled = !1;
goog.Timer.defaultTimerObject = goog.global;
goog.Timer.intervalScale = 0.8;
goog.Timer.prototype.timer_ = null;
goog.Timer.prototype.getInterval = function() {
  return this.interval_;
};
goog.Timer.prototype.setInterval = function(interval) {
  this.interval_ = interval;
  this.timer_ && this.enabled ? (this.stop(), this.start()) : this.timer_ && this.stop();
};
goog.Timer.prototype.tick_ = function() {
  if (this.enabled) {
    var elapsed = goog.now() - this.last_;
    0 < elapsed && elapsed < this.interval_ * goog.Timer.intervalScale ? this.timer_ = this.timerObject_.setTimeout(this.boundTick_, this.interval_ - elapsed) : (this.timer_ && (this.timerObject_.clearTimeout(this.timer_), this.timer_ = null), this.dispatchTick(), this.enabled && (this.stop(), this.start()));
  }
};
goog.Timer.prototype.dispatchTick = function() {
  this.dispatchEvent(goog.Timer.TICK);
};
goog.Timer.prototype.start = function() {
  this.enabled = !0;
  this.timer_ || (this.timer_ = this.timerObject_.setTimeout(this.boundTick_, this.interval_), this.last_ = goog.now());
};
goog.Timer.prototype.stop = function() {
  this.enabled = !1;
  this.timer_ && (this.timerObject_.clearTimeout(this.timer_), this.timer_ = null);
};
goog.Timer.prototype.disposeInternal = function() {
  goog.Timer.superClass_.disposeInternal.call(this);
  this.stop();
  delete this.timerObject_;
};
goog.Timer.TICK = "tick";
goog.Timer.callOnce = function(listener, opt_delay, opt_handler) {
  if (goog.isFunction(listener)) {
    opt_handler && (listener = goog.bind(listener, opt_handler));
  } else {
    if (listener && "function" == typeof listener.handleEvent) {
      listener = goog.bind(listener.handleEvent, listener);
    } else {
      throw Error("Invalid listener argument");
    }
  }
  return Number(opt_delay) > goog.Timer.MAX_TIMEOUT_ ? goog.Timer.INVALID_TIMEOUT_ID_ : goog.Timer.defaultTimerObject.setTimeout(listener, opt_delay || 0);
};
goog.Timer.clear = function(timerId) {
  goog.Timer.defaultTimerObject.clearTimeout(timerId);
};
goog.Timer.promise = function(delay, opt_result) {
  var timerKey = null;
  return (new goog.Promise(function(resolve, reject) {
    timerKey = goog.Timer.callOnce(function() {
      resolve(opt_result);
    }, delay);
    timerKey == goog.Timer.INVALID_TIMEOUT_ID_ && reject(Error("Failed to schedule timer."));
  })).thenCatch(function(error) {
    goog.Timer.clear(timerKey);
    throw error;
  });
};
goog.async.Throttle = function(listener, interval, opt_handler) {
  goog.Disposable.call(this);
  this.listener_ = null != opt_handler ? goog.bind(listener, opt_handler) : listener;
  this.interval_ = interval;
  this.callback_ = goog.bind(this.onTimer_, this);
  this.args_ = [];
};
goog.inherits(goog.async.Throttle, goog.Disposable);
goog.Throttle = goog.async.Throttle;
goog.async.Throttle.prototype.shouldFire_ = !1;
goog.async.Throttle.prototype.pauseCount_ = 0;
goog.async.Throttle.prototype.timer_ = null;
goog.async.Throttle.prototype.fire = function(var_args) {
  this.args_ = arguments;
  this.timer_ || this.pauseCount_ ? this.shouldFire_ = !0 : this.doAction_();
};
goog.async.Throttle.prototype.stop = function() {
  this.timer_ && (goog.Timer.clear(this.timer_), this.timer_ = null, this.shouldFire_ = !1, this.args_ = []);
};
goog.async.Throttle.prototype.pause = function() {
  this.pauseCount_++;
};
goog.async.Throttle.prototype.resume = function() {
  this.pauseCount_--;
  this.pauseCount_ || !this.shouldFire_ || this.timer_ || (this.shouldFire_ = !1, this.doAction_());
};
goog.async.Throttle.prototype.disposeInternal = function() {
  goog.async.Throttle.superClass_.disposeInternal.call(this);
  this.stop();
};
goog.async.Throttle.prototype.onTimer_ = function() {
  this.timer_ = null;
  this.shouldFire_ && !this.pauseCount_ && (this.shouldFire_ = !1, this.doAction_());
};
goog.async.Throttle.prototype.doAction_ = function() {
  this.timer_ = goog.Timer.callOnce(this.callback_, this.interval_);
  this.listener_.apply(null, this.args_);
};
goog.html = {};
goog.html.trustedtypes = {};
goog.html.trustedtypes.PRIVATE_DO_NOT_ACCESS_OR_ELSE_POLICY = goog.TRUSTED_TYPES_POLICY_NAME ? goog.createTrustedTypesPolicy(goog.TRUSTED_TYPES_POLICY_NAME + "#html") : null;
goog.i18n = {};
goog.i18n.bidi = {};
goog.i18n.bidi.FORCE_RTL = !1;
goog.i18n.bidi.IS_RTL = goog.i18n.bidi.FORCE_RTL || ("ar" == goog.LOCALE.substring(0, 2).toLowerCase() || "fa" == goog.LOCALE.substring(0, 2).toLowerCase() || "he" == goog.LOCALE.substring(0, 2).toLowerCase() || "iw" == goog.LOCALE.substring(0, 2).toLowerCase() || "ps" == goog.LOCALE.substring(0, 2).toLowerCase() || "sd" == goog.LOCALE.substring(0, 2).toLowerCase() || "ug" == goog.LOCALE.substring(0, 2).toLowerCase() || "ur" == goog.LOCALE.substring(0, 2).toLowerCase() || "yi" == goog.LOCALE.substring(0, 
2).toLowerCase()) && (2 == goog.LOCALE.length || "-" == goog.LOCALE.substring(2, 3) || "_" == goog.LOCALE.substring(2, 3)) || 3 <= goog.LOCALE.length && "ckb" == goog.LOCALE.substring(0, 3).toLowerCase() && (3 == goog.LOCALE.length || "-" == goog.LOCALE.substring(3, 4) || "_" == goog.LOCALE.substring(3, 4)) || 7 <= goog.LOCALE.length && ("-" == goog.LOCALE.substring(2, 3) || "_" == goog.LOCALE.substring(2, 3)) && ("adlm" == goog.LOCALE.substring(3, 7).toLowerCase() || "arab" == goog.LOCALE.substring(3, 
7).toLowerCase() || "hebr" == goog.LOCALE.substring(3, 7).toLowerCase() || "nkoo" == goog.LOCALE.substring(3, 7).toLowerCase() || "rohg" == goog.LOCALE.substring(3, 7).toLowerCase() || "thaa" == goog.LOCALE.substring(3, 7).toLowerCase()) || 8 <= goog.LOCALE.length && ("-" == goog.LOCALE.substring(3, 4) || "_" == goog.LOCALE.substring(3, 4)) && ("adlm" == goog.LOCALE.substring(4, 8).toLowerCase() || "arab" == goog.LOCALE.substring(4, 8).toLowerCase() || "hebr" == goog.LOCALE.substring(4, 8).toLowerCase() || 
"nkoo" == goog.LOCALE.substring(4, 8).toLowerCase() || "rohg" == goog.LOCALE.substring(4, 8).toLowerCase() || "thaa" == goog.LOCALE.substring(4, 8).toLowerCase());
goog.i18n.bidi.Format = {LRE:"\u202a", RLE:"\u202b", PDF:"\u202c", LRM:"\u200e", RLM:"\u200f"};
goog.i18n.bidi.Dir = {LTR:1, RTL:-1, NEUTRAL:0};
goog.i18n.bidi.RIGHT = "right";
goog.i18n.bidi.LEFT = "left";
goog.i18n.bidi.I18N_RIGHT = goog.i18n.bidi.IS_RTL ? goog.i18n.bidi.LEFT : goog.i18n.bidi.RIGHT;
goog.i18n.bidi.I18N_LEFT = goog.i18n.bidi.IS_RTL ? goog.i18n.bidi.RIGHT : goog.i18n.bidi.LEFT;
goog.i18n.bidi.toDir = function(givenDir, opt_noNeutral) {
  return "number" == typeof givenDir ? 0 < givenDir ? goog.i18n.bidi.Dir.LTR : 0 > givenDir ? goog.i18n.bidi.Dir.RTL : opt_noNeutral ? null : goog.i18n.bidi.Dir.NEUTRAL : null == givenDir ? null : givenDir ? goog.i18n.bidi.Dir.RTL : goog.i18n.bidi.Dir.LTR;
};
goog.i18n.bidi.ltrChars_ = "A-Za-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02b8\u0300-\u0590\u0900-\u1fff\u200e\u2c00-\ud801\ud804-\ud839\ud83c-\udbff\uf900-\ufb1c\ufe00-\ufe6f\ufefd-\uffff";
goog.i18n.bidi.rtlChars_ = "\u0591-\u06ef\u06fa-\u08ff\u200f\ud802-\ud803\ud83a-\ud83b\ufb1d-\ufdff\ufe70-\ufefc";
goog.i18n.bidi.htmlSkipReg_ = /<[^>]*>|&[^;]+;/g;
goog.i18n.bidi.stripHtmlIfNeeded_ = function(str, opt_isStripNeeded) {
  return opt_isStripNeeded ? str.replace(goog.i18n.bidi.htmlSkipReg_, "") : str;
};
goog.i18n.bidi.rtlCharReg_ = new RegExp("[" + goog.i18n.bidi.rtlChars_ + "]");
goog.i18n.bidi.ltrCharReg_ = new RegExp("[" + goog.i18n.bidi.ltrChars_ + "]");
goog.i18n.bidi.hasAnyRtl = function(str, opt_isHtml) {
  return goog.i18n.bidi.rtlCharReg_.test(goog.i18n.bidi.stripHtmlIfNeeded_(str, opt_isHtml));
};
goog.i18n.bidi.hasRtlChar = goog.i18n.bidi.hasAnyRtl;
goog.i18n.bidi.hasAnyLtr = function(str, opt_isHtml) {
  return goog.i18n.bidi.ltrCharReg_.test(goog.i18n.bidi.stripHtmlIfNeeded_(str, opt_isHtml));
};
goog.i18n.bidi.ltrRe_ = new RegExp("^[" + goog.i18n.bidi.ltrChars_ + "]");
goog.i18n.bidi.rtlRe_ = new RegExp("^[" + goog.i18n.bidi.rtlChars_ + "]");
goog.i18n.bidi.isRtlChar = function(str) {
  return goog.i18n.bidi.rtlRe_.test(str);
};
goog.i18n.bidi.isLtrChar = function(str) {
  return goog.i18n.bidi.ltrRe_.test(str);
};
goog.i18n.bidi.isNeutralChar = function(str) {
  return !goog.i18n.bidi.isLtrChar(str) && !goog.i18n.bidi.isRtlChar(str);
};
goog.i18n.bidi.ltrDirCheckRe_ = new RegExp("^[^" + goog.i18n.bidi.rtlChars_ + "]*[" + goog.i18n.bidi.ltrChars_ + "]");
goog.i18n.bidi.rtlDirCheckRe_ = new RegExp("^[^" + goog.i18n.bidi.ltrChars_ + "]*[" + goog.i18n.bidi.rtlChars_ + "]");
goog.i18n.bidi.startsWithRtl = function(str, opt_isHtml) {
  return goog.i18n.bidi.rtlDirCheckRe_.test(goog.i18n.bidi.stripHtmlIfNeeded_(str, opt_isHtml));
};
goog.i18n.bidi.isRtlText = goog.i18n.bidi.startsWithRtl;
goog.i18n.bidi.startsWithLtr = function(str, opt_isHtml) {
  return goog.i18n.bidi.ltrDirCheckRe_.test(goog.i18n.bidi.stripHtmlIfNeeded_(str, opt_isHtml));
};
goog.i18n.bidi.isLtrText = goog.i18n.bidi.startsWithLtr;
goog.i18n.bidi.isRequiredLtrRe_ = /^http:\/\/.*/;
goog.i18n.bidi.isNeutralText = function(str, opt_isHtml) {
  str = goog.i18n.bidi.stripHtmlIfNeeded_(str, opt_isHtml);
  return goog.i18n.bidi.isRequiredLtrRe_.test(str) || !goog.i18n.bidi.hasAnyLtr(str) && !goog.i18n.bidi.hasAnyRtl(str);
};
goog.i18n.bidi.ltrExitDirCheckRe_ = new RegExp("[" + goog.i18n.bidi.ltrChars_ + "][^" + goog.i18n.bidi.rtlChars_ + "]*$");
goog.i18n.bidi.rtlExitDirCheckRe_ = new RegExp("[" + goog.i18n.bidi.rtlChars_ + "][^" + goog.i18n.bidi.ltrChars_ + "]*$");
goog.i18n.bidi.endsWithLtr = function(str, opt_isHtml) {
  return goog.i18n.bidi.ltrExitDirCheckRe_.test(goog.i18n.bidi.stripHtmlIfNeeded_(str, opt_isHtml));
};
goog.i18n.bidi.isLtrExitText = goog.i18n.bidi.endsWithLtr;
goog.i18n.bidi.endsWithRtl = function(str, opt_isHtml) {
  return goog.i18n.bidi.rtlExitDirCheckRe_.test(goog.i18n.bidi.stripHtmlIfNeeded_(str, opt_isHtml));
};
goog.i18n.bidi.isRtlExitText = goog.i18n.bidi.endsWithRtl;
goog.i18n.bidi.rtlLocalesRe_ = /^(ar|ckb|dv|he|iw|fa|nqo|ps|sd|ug|ur|yi|.*[-_](Adlm|Arab|Hebr|Nkoo|Rohg|Thaa))(?!.*[-_](Latn|Cyrl)($|-|_))($|-|_)/i;
goog.i18n.bidi.isRtlLanguage = function(lang) {
  return goog.i18n.bidi.rtlLocalesRe_.test(lang);
};
goog.i18n.bidi.bracketGuardTextRe_ = /(\(.*?\)+)|(\[.*?\]+)|(\{.*?\}+)|(<.*?>+)/g;
goog.i18n.bidi.guardBracketInText = function(s, opt_isRtlContext) {
  var mark = (void 0 === opt_isRtlContext ? goog.i18n.bidi.hasAnyRtl(s) : opt_isRtlContext) ? goog.i18n.bidi.Format.RLM : goog.i18n.bidi.Format.LRM;
  return s.replace(goog.i18n.bidi.bracketGuardTextRe_, mark + "$&" + mark);
};
goog.i18n.bidi.enforceRtlInHtml = function(html) {
  return "<" == html.charAt(0) ? html.replace(/<\w+/, "$& dir=rtl") : "\n<span dir=rtl>" + html + "</span>";
};
goog.i18n.bidi.enforceRtlInText = function(text) {
  return goog.i18n.bidi.Format.RLE + text + goog.i18n.bidi.Format.PDF;
};
goog.i18n.bidi.enforceLtrInHtml = function(html) {
  return "<" == html.charAt(0) ? html.replace(/<\w+/, "$& dir=ltr") : "\n<span dir=ltr>" + html + "</span>";
};
goog.i18n.bidi.enforceLtrInText = function(text) {
  return goog.i18n.bidi.Format.LRE + text + goog.i18n.bidi.Format.PDF;
};
goog.i18n.bidi.dimensionsRe_ = /:\s*([.\d][.\w]*)\s+([.\d][.\w]*)\s+([.\d][.\w]*)\s+([.\d][.\w]*)/g;
goog.i18n.bidi.leftRe_ = /left/gi;
goog.i18n.bidi.rightRe_ = /right/gi;
goog.i18n.bidi.tempRe_ = /%%%%/g;
goog.i18n.bidi.mirrorCSS = function(cssStr) {
  return cssStr.replace(goog.i18n.bidi.dimensionsRe_, ":$1 $4 $3 $2").replace(goog.i18n.bidi.leftRe_, "%%%%").replace(goog.i18n.bidi.rightRe_, goog.i18n.bidi.LEFT).replace(goog.i18n.bidi.tempRe_, goog.i18n.bidi.RIGHT);
};
goog.i18n.bidi.doubleQuoteSubstituteRe_ = /([\u0591-\u05f2])"/g;
goog.i18n.bidi.singleQuoteSubstituteRe_ = /([\u0591-\u05f2])'/g;
goog.i18n.bidi.normalizeHebrewQuote = function(str) {
  return str.replace(goog.i18n.bidi.doubleQuoteSubstituteRe_, "$1\u05f4").replace(goog.i18n.bidi.singleQuoteSubstituteRe_, "$1\u05f3");
};
goog.i18n.bidi.wordSeparatorRe_ = /\s+/;
goog.i18n.bidi.hasNumeralsRe_ = /[\d\u06f0-\u06f9]/;
goog.i18n.bidi.rtlDetectionThreshold_ = 0.40;
goog.i18n.bidi.estimateDirection = function(str, opt_isHtml) {
  for (var rtlCount = 0, totalCount = 0, hasWeaklyLtr = !1, tokens = goog.i18n.bidi.stripHtmlIfNeeded_(str, opt_isHtml).split(goog.i18n.bidi.wordSeparatorRe_), i = 0; i < tokens.length; i++) {
    var token = tokens[i];
    goog.i18n.bidi.startsWithRtl(token) ? (rtlCount++, totalCount++) : goog.i18n.bidi.isRequiredLtrRe_.test(token) ? hasWeaklyLtr = !0 : goog.i18n.bidi.hasAnyLtr(token) ? totalCount++ : goog.i18n.bidi.hasNumeralsRe_.test(token) && (hasWeaklyLtr = !0);
  }
  return 0 == totalCount ? hasWeaklyLtr ? goog.i18n.bidi.Dir.LTR : goog.i18n.bidi.Dir.NEUTRAL : rtlCount / totalCount > goog.i18n.bidi.rtlDetectionThreshold_ ? goog.i18n.bidi.Dir.RTL : goog.i18n.bidi.Dir.LTR;
};
goog.i18n.bidi.detectRtlDirectionality = function(str, opt_isHtml) {
  return goog.i18n.bidi.estimateDirection(str, opt_isHtml) == goog.i18n.bidi.Dir.RTL;
};
goog.i18n.bidi.setElementDirAndAlign = function(element, dir) {
  element && (dir = goog.i18n.bidi.toDir(dir)) && (element.style.textAlign = dir == goog.i18n.bidi.Dir.RTL ? goog.i18n.bidi.RIGHT : goog.i18n.bidi.LEFT, element.dir = dir == goog.i18n.bidi.Dir.RTL ? "rtl" : "ltr");
};
goog.i18n.bidi.setElementDirByTextDirectionality = function(element, text) {
  switch(goog.i18n.bidi.estimateDirection(text)) {
    case goog.i18n.bidi.Dir.LTR:
      element.dir = "ltr";
      break;
    case goog.i18n.bidi.Dir.RTL:
      element.dir = "rtl";
      break;
    default:
      element.removeAttribute("dir");
  }
};
goog.i18n.bidi.DirectionalString = function() {
};
goog.string.TypedString = function() {
};
goog.string.Const = function(opt_token, opt_content) {
  this.stringConstValueWithSecurityContract__googStringSecurityPrivate_ = opt_token === goog.string.Const.GOOG_STRING_CONSTRUCTOR_TOKEN_PRIVATE_ && opt_content || "";
  this.STRING_CONST_TYPE_MARKER__GOOG_STRING_SECURITY_PRIVATE_ = goog.string.Const.TYPE_MARKER_;
};
goog.string.Const.prototype.implementsGoogStringTypedString = !0;
goog.string.Const.prototype.getTypedStringValue = function() {
  return this.stringConstValueWithSecurityContract__googStringSecurityPrivate_;
};
goog.string.Const.prototype.toString = function() {
  return "Const{" + this.stringConstValueWithSecurityContract__googStringSecurityPrivate_ + "}";
};
goog.string.Const.unwrap = function(stringConst) {
  if (stringConst instanceof goog.string.Const && stringConst.constructor === goog.string.Const && stringConst.STRING_CONST_TYPE_MARKER__GOOG_STRING_SECURITY_PRIVATE_ === goog.string.Const.TYPE_MARKER_) {
    return stringConst.stringConstValueWithSecurityContract__googStringSecurityPrivate_;
  }
  goog.asserts.fail("expected object of type Const, got '" + stringConst + "'");
  return "type_error:Const";
};
goog.string.Const.from = function(s) {
  return new goog.string.Const(goog.string.Const.GOOG_STRING_CONSTRUCTOR_TOKEN_PRIVATE_, s);
};
goog.string.Const.TYPE_MARKER_ = {};
goog.string.Const.GOOG_STRING_CONSTRUCTOR_TOKEN_PRIVATE_ = {};
goog.string.Const.EMPTY = goog.string.Const.from("");
goog.html.TrustedResourceUrl = function() {
  this.privateDoNotAccessOrElseTrustedResourceUrlWrappedValue_ = "";
  this.trustedURL_ = null;
  this.TRUSTED_RESOURCE_URL_TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_ = goog.html.TrustedResourceUrl.TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_;
};
goog.html.TrustedResourceUrl.prototype.implementsGoogStringTypedString = !0;
goog.html.TrustedResourceUrl.prototype.getTypedStringValue = function() {
  return this.privateDoNotAccessOrElseTrustedResourceUrlWrappedValue_.toString();
};
goog.html.TrustedResourceUrl.prototype.implementsGoogI18nBidiDirectionalString = !0;
goog.html.TrustedResourceUrl.prototype.getDirection = function() {
  return goog.i18n.bidi.Dir.LTR;
};
goog.html.TrustedResourceUrl.prototype.cloneWithParams = function(searchParams, opt_hashParams) {
  var url = goog.html.TrustedResourceUrl.unwrap(this), parts = goog.html.TrustedResourceUrl.URL_PARAM_PARSER_.exec(url), urlHash = parts[3] || "";
  return goog.html.TrustedResourceUrl.createTrustedResourceUrlSecurityPrivateDoNotAccessOrElse(parts[1] + goog.html.TrustedResourceUrl.stringifyParams_("?", parts[2] || "", searchParams) + goog.html.TrustedResourceUrl.stringifyParams_("#", urlHash, opt_hashParams));
};
goog.DEBUG && (goog.html.TrustedResourceUrl.prototype.toString = function() {
  return "TrustedResourceUrl{" + this.privateDoNotAccessOrElseTrustedResourceUrlWrappedValue_ + "}";
});
goog.html.TrustedResourceUrl.unwrap = function(trustedResourceUrl) {
  return goog.html.TrustedResourceUrl.unwrapTrustedScriptURL(trustedResourceUrl).toString();
};
goog.html.TrustedResourceUrl.unwrapTrustedScriptURL = function(trustedResourceUrl) {
  if (trustedResourceUrl instanceof goog.html.TrustedResourceUrl && trustedResourceUrl.constructor === goog.html.TrustedResourceUrl && trustedResourceUrl.TRUSTED_RESOURCE_URL_TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_ === goog.html.TrustedResourceUrl.TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_) {
    return trustedResourceUrl.privateDoNotAccessOrElseTrustedResourceUrlWrappedValue_;
  }
  goog.asserts.fail("expected object of type TrustedResourceUrl, got '" + trustedResourceUrl + "' of type " + goog.typeOf(trustedResourceUrl));
  return "type_error:TrustedResourceUrl";
};
goog.html.TrustedResourceUrl.unwrapTrustedURL = function(trustedResourceUrl) {
  return trustedResourceUrl.trustedURL_ ? trustedResourceUrl.trustedURL_ : goog.html.TrustedResourceUrl.unwrap(trustedResourceUrl);
};
goog.html.TrustedResourceUrl.format = function(format, args) {
  var formatStr = goog.string.Const.unwrap(format);
  if (!goog.html.TrustedResourceUrl.BASE_URL_.test(formatStr)) {
    throw Error("Invalid TrustedResourceUrl format: " + formatStr);
  }
  var result = formatStr.replace(goog.html.TrustedResourceUrl.FORMAT_MARKER_, function(match, id) {
    if (!Object.prototype.hasOwnProperty.call(args, id)) {
      throw Error('Found marker, "' + id + '", in format string, "' + formatStr + '", but no valid label mapping found in args: ' + JSON.stringify(args));
    }
    var arg = args[id];
    return arg instanceof goog.string.Const ? goog.string.Const.unwrap(arg) : encodeURIComponent(String(arg));
  });
  return goog.html.TrustedResourceUrl.createTrustedResourceUrlSecurityPrivateDoNotAccessOrElse(result);
};
goog.html.TrustedResourceUrl.FORMAT_MARKER_ = /%{(\w+)}/g;
goog.html.TrustedResourceUrl.BASE_URL_ = /^((https:)?\/\/[0-9a-z.:[\]-]+\/|\/[^/\\]|[^:/\\%]+\/|[^:/\\%]*[?#]|about:blank#)/i;
goog.html.TrustedResourceUrl.URL_PARAM_PARSER_ = /^([^?#]*)(\?[^#]*)?(#[\s\S]*)?/;
goog.html.TrustedResourceUrl.formatWithParams = function(format, args, searchParams, opt_hashParams) {
  return goog.html.TrustedResourceUrl.format(format, args).cloneWithParams(searchParams, opt_hashParams);
};
goog.html.TrustedResourceUrl.fromConstant = function(url) {
  return goog.html.TrustedResourceUrl.createTrustedResourceUrlSecurityPrivateDoNotAccessOrElse(goog.string.Const.unwrap(url));
};
goog.html.TrustedResourceUrl.fromConstants = function(parts) {
  for (var unwrapped = "", i = 0; i < parts.length; i++) {
    unwrapped += goog.string.Const.unwrap(parts[i]);
  }
  return goog.html.TrustedResourceUrl.createTrustedResourceUrlSecurityPrivateDoNotAccessOrElse(unwrapped);
};
goog.html.TrustedResourceUrl.TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_ = {};
goog.html.TrustedResourceUrl.createTrustedResourceUrlSecurityPrivateDoNotAccessOrElse = function(url) {
  var trustedResourceUrl = new goog.html.TrustedResourceUrl;
  trustedResourceUrl.privateDoNotAccessOrElseTrustedResourceUrlWrappedValue_ = goog.html.trustedtypes.PRIVATE_DO_NOT_ACCESS_OR_ELSE_POLICY ? goog.html.trustedtypes.PRIVATE_DO_NOT_ACCESS_OR_ELSE_POLICY.createScriptURL(url) : url;
  goog.html.trustedtypes.PRIVATE_DO_NOT_ACCESS_OR_ELSE_POLICY && (trustedResourceUrl.trustedURL_ = goog.html.trustedtypes.PRIVATE_DO_NOT_ACCESS_OR_ELSE_POLICY.createURL(url));
  return trustedResourceUrl;
};
goog.html.TrustedResourceUrl.stringifyParams_ = function(prefix, currentString, params) {
  if (null == params) {
    return currentString;
  }
  if (goog.isString(params)) {
    return params ? prefix + encodeURIComponent(params) : "";
  }
  for (var key in params) {
    for (var value = params[key], outputValues = goog.isArray(value) ? value : [value], i = 0; i < outputValues.length; i++) {
      var outputValue = outputValues[i];
      null != outputValue && (currentString || (currentString = prefix), currentString += (currentString.length > prefix.length ? "&" : "") + encodeURIComponent(key) + "=" + encodeURIComponent(String(outputValue)));
    }
  }
  return currentString;
};
goog.dom.BrowserFeature = {CAN_ADD_NAME_OR_TYPE_ATTRIBUTES:!goog.userAgent.IE || goog.userAgent.isDocumentModeOrHigher(9), CAN_USE_CHILDREN_ATTRIBUTE:!goog.userAgent.GECKO && !goog.userAgent.IE || goog.userAgent.IE && goog.userAgent.isDocumentModeOrHigher(9) || goog.userAgent.GECKO && goog.userAgent.isVersionOrHigher("1.9.1"), CAN_USE_INNER_TEXT:goog.userAgent.IE && !goog.userAgent.isVersionOrHigher("9"), CAN_USE_PARENT_ELEMENT_PROPERTY:goog.userAgent.IE || goog.userAgent.OPERA || goog.userAgent.WEBKIT, 
INNER_HTML_NEEDS_SCOPED_ELEMENT:goog.userAgent.IE, LEGACY_IE_RANGES:goog.userAgent.IE && !goog.userAgent.isDocumentModeOrHigher(9)};
goog.dom.asserts = {};
goog.dom.asserts.assertIsLocation = function(o) {
  if (goog.asserts.ENABLE_ASSERTS) {
    var win = goog.dom.asserts.getWindow_(o);
    "undefined" != typeof win.Location && "undefined" != typeof win.Element && goog.asserts.assert(o && (o instanceof win.Location || !(o instanceof win.Element)), "Argument is not a Location (or a non-Element mock); got: %s", goog.dom.asserts.debugStringForType_(o));
  }
  return o;
};
goog.dom.asserts.assertIsElementType_ = function(o, typename) {
  if (goog.asserts.ENABLE_ASSERTS) {
    var win = goog.dom.asserts.getWindow_(o);
    "undefined" != typeof win[typename] && "undefined" != typeof win.Location && "undefined" != typeof win.Element && goog.asserts.assert(o && (o instanceof win[typename] || !(o instanceof win.Location || o instanceof win.Element)), "Argument is not a %s (or a non-Element, non-Location mock); got: %s", typename, goog.dom.asserts.debugStringForType_(o));
  }
  return o;
};
goog.dom.asserts.assertIsHTMLAnchorElement = function(o) {
  return goog.dom.asserts.assertIsElementType_(o, "HTMLAnchorElement");
};
goog.dom.asserts.assertIsHTMLButtonElement = function(o) {
  return goog.dom.asserts.assertIsElementType_(o, "HTMLButtonElement");
};
goog.dom.asserts.assertIsHTMLLinkElement = function(o) {
  return goog.dom.asserts.assertIsElementType_(o, "HTMLLinkElement");
};
goog.dom.asserts.assertIsHTMLImageElement = function(o) {
  return goog.dom.asserts.assertIsElementType_(o, "HTMLImageElement");
};
goog.dom.asserts.assertIsHTMLAudioElement = function(o) {
  return goog.dom.asserts.assertIsElementType_(o, "HTMLAudioElement");
};
goog.dom.asserts.assertIsHTMLVideoElement = function(o) {
  return goog.dom.asserts.assertIsElementType_(o, "HTMLVideoElement");
};
goog.dom.asserts.assertIsHTMLInputElement = function(o) {
  return goog.dom.asserts.assertIsElementType_(o, "HTMLInputElement");
};
goog.dom.asserts.assertIsHTMLTextAreaElement = function(o) {
  return goog.dom.asserts.assertIsElementType_(o, "HTMLTextAreaElement");
};
goog.dom.asserts.assertIsHTMLCanvasElement = function(o) {
  return goog.dom.asserts.assertIsElementType_(o, "HTMLCanvasElement");
};
goog.dom.asserts.assertIsHTMLEmbedElement = function(o) {
  return goog.dom.asserts.assertIsElementType_(o, "HTMLEmbedElement");
};
goog.dom.asserts.assertIsHTMLFormElement = function(o) {
  return goog.dom.asserts.assertIsElementType_(o, "HTMLFormElement");
};
goog.dom.asserts.assertIsHTMLFrameElement = function(o) {
  return goog.dom.asserts.assertIsElementType_(o, "HTMLFrameElement");
};
goog.dom.asserts.assertIsHTMLIFrameElement = function(o) {
  return goog.dom.asserts.assertIsElementType_(o, "HTMLIFrameElement");
};
goog.dom.asserts.assertIsHTMLObjectElement = function(o) {
  return goog.dom.asserts.assertIsElementType_(o, "HTMLObjectElement");
};
goog.dom.asserts.assertIsHTMLScriptElement = function(o) {
  return goog.dom.asserts.assertIsElementType_(o, "HTMLScriptElement");
};
goog.dom.asserts.debugStringForType_ = function(value) {
  return goog.isObject(value) ? value.constructor.displayName || value.constructor.name || Object.prototype.toString.call(value) : void 0 === value ? "undefined" : null === value ? "null" : typeof value;
};
goog.dom.asserts.getWindow_ = function(o) {
  var doc = o && o.ownerDocument;
  return doc && (doc.defaultView || doc.parentWindow) || goog.global;
};
goog.dom.tags = {};
goog.dom.tags.VOID_TAGS_ = {area:!0, base:!0, br:!0, col:!0, command:!0, embed:!0, hr:!0, img:!0, input:!0, keygen:!0, link:!0, meta:!0, param:!0, source:!0, track:!0, wbr:!0};
goog.dom.tags.isVoidTag = function(tagName) {
  return !0 === goog.dom.tags.VOID_TAGS_[tagName];
};
goog.html.SafeScript = function() {
  this.privateDoNotAccessOrElseSafeScriptWrappedValue_ = "";
  this.SAFE_SCRIPT_TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_ = goog.html.SafeScript.TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_;
};
goog.html.SafeScript.prototype.implementsGoogStringTypedString = !0;
goog.html.SafeScript.TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_ = {};
goog.html.SafeScript.fromConstant = function(script) {
  var scriptString = goog.string.Const.unwrap(script);
  return 0 === scriptString.length ? goog.html.SafeScript.EMPTY : goog.html.SafeScript.createSafeScriptSecurityPrivateDoNotAccessOrElse(scriptString);
};
goog.html.SafeScript.fromConstantAndArgs = function(code, var_args) {
  for (var args = [], i = 1; i < arguments.length; i++) {
    args.push(goog.html.SafeScript.stringify_(arguments[i]));
  }
  return goog.html.SafeScript.createSafeScriptSecurityPrivateDoNotAccessOrElse("(" + goog.string.Const.unwrap(code) + ")(" + args.join(", ") + ");");
};
goog.html.SafeScript.fromJson = function(val) {
  return goog.html.SafeScript.createSafeScriptSecurityPrivateDoNotAccessOrElse(goog.html.SafeScript.stringify_(val));
};
goog.html.SafeScript.prototype.getTypedStringValue = function() {
  return this.privateDoNotAccessOrElseSafeScriptWrappedValue_.toString();
};
goog.DEBUG && (goog.html.SafeScript.prototype.toString = function() {
  return "SafeScript{" + this.privateDoNotAccessOrElseSafeScriptWrappedValue_ + "}";
});
goog.html.SafeScript.unwrap = function(safeScript) {
  return goog.html.SafeScript.unwrapTrustedScript(safeScript).toString();
};
goog.html.SafeScript.unwrapTrustedScript = function(safeScript) {
  if (safeScript instanceof goog.html.SafeScript && safeScript.constructor === goog.html.SafeScript && safeScript.SAFE_SCRIPT_TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_ === goog.html.SafeScript.TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_) {
    return safeScript.privateDoNotAccessOrElseSafeScriptWrappedValue_;
  }
  goog.asserts.fail("expected object of type SafeScript, got '" + safeScript + "' of type " + goog.typeOf(safeScript));
  return "type_error:SafeScript";
};
goog.html.SafeScript.stringify_ = function(val) {
  return JSON.stringify(val).replace(/</g, "\\x3c");
};
goog.html.SafeScript.createSafeScriptSecurityPrivateDoNotAccessOrElse = function(script) {
  return (new goog.html.SafeScript).initSecurityPrivateDoNotAccessOrElse_(script);
};
goog.html.SafeScript.prototype.initSecurityPrivateDoNotAccessOrElse_ = function(script) {
  this.privateDoNotAccessOrElseSafeScriptWrappedValue_ = goog.html.trustedtypes.PRIVATE_DO_NOT_ACCESS_OR_ELSE_POLICY ? goog.html.trustedtypes.PRIVATE_DO_NOT_ACCESS_OR_ELSE_POLICY.createScript(script) : script;
  return this;
};
goog.html.SafeScript.EMPTY = goog.html.SafeScript.createSafeScriptSecurityPrivateDoNotAccessOrElse("");
goog.fs = {};
goog.fs.url = {};
goog.fs.url.createObjectUrl = function(blob) {
  return goog.fs.url.getUrlObject_().createObjectURL(blob);
};
goog.fs.url.revokeObjectUrl = function(url) {
  goog.fs.url.getUrlObject_().revokeObjectURL(url);
};
goog.fs.url.getUrlObject_ = function() {
  var urlObject = goog.fs.url.findUrlObject_();
  if (null != urlObject) {
    return urlObject;
  }
  throw Error("This browser doesn't seem to support blob URLs");
};
goog.fs.url.findUrlObject_ = function() {
  return goog.isDef(goog.global.URL) && goog.isDef(goog.global.URL.createObjectURL) ? goog.global.URL : goog.isDef(goog.global.webkitURL) && goog.isDef(goog.global.webkitURL.createObjectURL) ? goog.global.webkitURL : goog.isDef(goog.global.createObjectURL) ? goog.global : null;
};
goog.fs.url.browserSupportsObjectUrls = function() {
  return null != goog.fs.url.findUrlObject_();
};
goog.html.SafeUrl = function() {
  this.privateDoNotAccessOrElseSafeUrlWrappedValue_ = "";
  this.SAFE_URL_TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_ = goog.html.SafeUrl.TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_;
};
goog.html.SafeUrl.INNOCUOUS_STRING = "about:invalid#zClosurez";
goog.html.SafeUrl.prototype.implementsGoogStringTypedString = !0;
goog.html.SafeUrl.prototype.getTypedStringValue = function() {
  return this.privateDoNotAccessOrElseSafeUrlWrappedValue_.toString();
};
goog.html.SafeUrl.prototype.implementsGoogI18nBidiDirectionalString = !0;
goog.html.SafeUrl.prototype.getDirection = function() {
  return goog.i18n.bidi.Dir.LTR;
};
goog.DEBUG && (goog.html.SafeUrl.prototype.toString = function() {
  return "SafeUrl{" + this.privateDoNotAccessOrElseSafeUrlWrappedValue_ + "}";
});
goog.html.SafeUrl.unwrap = function(safeUrl) {
  return goog.html.SafeUrl.unwrapTrustedURL(safeUrl).toString();
};
goog.html.SafeUrl.unwrapTrustedURL = function(safeUrl) {
  if (safeUrl instanceof goog.html.SafeUrl && safeUrl.constructor === goog.html.SafeUrl && safeUrl.SAFE_URL_TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_ === goog.html.SafeUrl.TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_) {
    return safeUrl.privateDoNotAccessOrElseSafeUrlWrappedValue_;
  }
  goog.asserts.fail("expected object of type SafeUrl, got '" + safeUrl + "' of type " + goog.typeOf(safeUrl));
  return "type_error:SafeUrl";
};
goog.html.SafeUrl.fromConstant = function(url) {
  return goog.html.SafeUrl.createSafeUrlSecurityPrivateDoNotAccessOrElse(goog.string.Const.unwrap(url));
};
goog.html.SAFE_MIME_TYPE_PATTERN_ = /^(?:audio\/(?:3gpp2|3gpp|aac|L16|midi|mp3|mp4|mpeg|oga|ogg|opus|x-m4a|x-wav|wav|webm)|image\/(?:bmp|gif|jpeg|jpg|png|tiff|webp|x-icon)|text\/csv|video\/(?:mpeg|mp4|ogg|webm|quicktime))$/i;
goog.html.SafeUrl.isSafeMimeType = function(mimeType) {
  return goog.html.SAFE_MIME_TYPE_PATTERN_.test(mimeType);
};
goog.html.SafeUrl.fromBlob = function(blob) {
  var url = goog.html.SAFE_MIME_TYPE_PATTERN_.test(blob.type) ? goog.fs.url.createObjectUrl(blob) : goog.html.SafeUrl.INNOCUOUS_STRING;
  return goog.html.SafeUrl.createSafeUrlSecurityPrivateDoNotAccessOrElse(url);
};
goog.html.DATA_URL_PATTERN_ = /^data:([^;,]*);base64,[a-z0-9+\/]+=*$/i;
goog.html.SafeUrl.fromDataUrl = function(dataUrl) {
  var filteredDataUrl = dataUrl.replace(/(%0A|%0D)/g, ""), match = filteredDataUrl.match(goog.html.DATA_URL_PATTERN_), valid = match && goog.html.SAFE_MIME_TYPE_PATTERN_.test(match[1]);
  return goog.html.SafeUrl.createSafeUrlSecurityPrivateDoNotAccessOrElse(valid ? filteredDataUrl : goog.html.SafeUrl.INNOCUOUS_STRING);
};
goog.html.SafeUrl.fromTelUrl = function(telUrl) {
  goog.string.internal.caseInsensitiveStartsWith(telUrl, "tel:") || (telUrl = goog.html.SafeUrl.INNOCUOUS_STRING);
  return goog.html.SafeUrl.createSafeUrlSecurityPrivateDoNotAccessOrElse(telUrl);
};
goog.html.SIP_URL_PATTERN_ = /^sip[s]?:[+a-z0-9_.!$%&'*\/=^`{|}~-]+@([a-z0-9-]+\.)+[a-z0-9]{2,63}$/i;
goog.html.SafeUrl.fromSipUrl = function(sipUrl) {
  goog.html.SIP_URL_PATTERN_.test(decodeURIComponent(sipUrl)) || (sipUrl = goog.html.SafeUrl.INNOCUOUS_STRING);
  return goog.html.SafeUrl.createSafeUrlSecurityPrivateDoNotAccessOrElse(sipUrl);
};
goog.html.SafeUrl.fromFacebookMessengerUrl = function(facebookMessengerUrl) {
  goog.string.internal.caseInsensitiveStartsWith(facebookMessengerUrl, "fb-messenger://share") || (facebookMessengerUrl = goog.html.SafeUrl.INNOCUOUS_STRING);
  return goog.html.SafeUrl.createSafeUrlSecurityPrivateDoNotAccessOrElse(facebookMessengerUrl);
};
goog.html.SafeUrl.fromSmsUrl = function(smsUrl) {
  goog.string.internal.caseInsensitiveStartsWith(smsUrl, "sms:") && goog.html.SafeUrl.isSmsUrlBodyValid_(smsUrl) || (smsUrl = goog.html.SafeUrl.INNOCUOUS_STRING);
  return goog.html.SafeUrl.createSafeUrlSecurityPrivateDoNotAccessOrElse(smsUrl);
};
goog.html.SafeUrl.isSmsUrlBodyValid_ = function(smsUrl) {
  var hash = smsUrl.indexOf("#");
  0 < hash && (smsUrl = smsUrl.substring(0, hash));
  var bodyParams = smsUrl.match(/[?&]body=/gi);
  if (!bodyParams) {
    return !0;
  }
  if (1 < bodyParams.length) {
    return !1;
  }
  var bodyValue = smsUrl.match(/[?&]body=([^&]*)/)[1];
  if (!bodyValue) {
    return !0;
  }
  try {
    decodeURIComponent(bodyValue);
  } catch (error) {
    return !1;
  }
  return /^(?:[a-z0-9\-_.~]|%[0-9a-f]{2})+$/i.test(bodyValue);
};
goog.html.SafeUrl.fromSshUrl = function(sshUrl) {
  goog.string.internal.caseInsensitiveStartsWith(sshUrl, "ssh://") || (sshUrl = goog.html.SafeUrl.INNOCUOUS_STRING);
  return goog.html.SafeUrl.createSafeUrlSecurityPrivateDoNotAccessOrElse(sshUrl);
};
goog.html.SafeUrl.sanitizeChromeExtensionUrl = function(url, extensionId) {
  return goog.html.SafeUrl.sanitizeExtensionUrl_(/^chrome-extension:\/\/([^\/]+)\//, url, extensionId);
};
goog.html.SafeUrl.sanitizeFirefoxExtensionUrl = function(url, extensionId) {
  return goog.html.SafeUrl.sanitizeExtensionUrl_(/^moz-extension:\/\/([^\/]+)\//, url, extensionId);
};
goog.html.SafeUrl.sanitizeEdgeExtensionUrl = function(url, extensionId) {
  return goog.html.SafeUrl.sanitizeExtensionUrl_(/^ms-browser-extension:\/\/([^\/]+)\//, url, extensionId);
};
goog.html.SafeUrl.sanitizeExtensionUrl_ = function(scheme, url, extensionId) {
  var matches = scheme.exec(url);
  if (matches) {
    var extractedExtensionId = matches[1];
    -1 == (extensionId instanceof goog.string.Const ? [goog.string.Const.unwrap(extensionId)] : extensionId.map(function unwrap(x) {
      return goog.string.Const.unwrap(x);
    })).indexOf(extractedExtensionId) && (url = goog.html.SafeUrl.INNOCUOUS_STRING);
  } else {
    url = goog.html.SafeUrl.INNOCUOUS_STRING;
  }
  return goog.html.SafeUrl.createSafeUrlSecurityPrivateDoNotAccessOrElse(url);
};
goog.html.SafeUrl.fromTrustedResourceUrl = function(trustedResourceUrl) {
  return goog.html.SafeUrl.createSafeUrlSecurityPrivateDoNotAccessOrElse(goog.html.TrustedResourceUrl.unwrap(trustedResourceUrl));
};
goog.html.SAFE_URL_PATTERN_ = /^(?:(?:https?|mailto|ftp):|[^:/?#]*(?:[/?#]|$))/i;
goog.html.SafeUrl.SAFE_URL_PATTERN = goog.html.SAFE_URL_PATTERN_;
goog.html.SafeUrl.sanitize = function(url) {
  if (url instanceof goog.html.SafeUrl) {
    return url;
  }
  url = "object" == typeof url && url.implementsGoogStringTypedString ? url.getTypedStringValue() : String(url);
  goog.html.SAFE_URL_PATTERN_.test(url) || (url = goog.html.SafeUrl.INNOCUOUS_STRING);
  return goog.html.SafeUrl.createSafeUrlSecurityPrivateDoNotAccessOrElse(url);
};
goog.html.SafeUrl.sanitizeAssertUnchanged = function(url, opt_allowDataUrl) {
  if (url instanceof goog.html.SafeUrl) {
    return url;
  }
  url = "object" == typeof url && url.implementsGoogStringTypedString ? url.getTypedStringValue() : String(url);
  if (opt_allowDataUrl && /^data:/i.test(url)) {
    var safeUrl = goog.html.SafeUrl.fromDataUrl(url);
    if (safeUrl.getTypedStringValue() == url) {
      return safeUrl;
    }
  }
  goog.asserts.assert(goog.html.SAFE_URL_PATTERN_.test(url), "%s does not match the safe URL pattern", url) || (url = goog.html.SafeUrl.INNOCUOUS_STRING);
  return goog.html.SafeUrl.createSafeUrlSecurityPrivateDoNotAccessOrElse(url);
};
goog.html.SafeUrl.TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_ = {};
goog.html.SafeUrl.createSafeUrlSecurityPrivateDoNotAccessOrElse = function(url) {
  var safeUrl = new goog.html.SafeUrl;
  safeUrl.privateDoNotAccessOrElseSafeUrlWrappedValue_ = goog.html.trustedtypes.PRIVATE_DO_NOT_ACCESS_OR_ELSE_POLICY ? goog.html.trustedtypes.PRIVATE_DO_NOT_ACCESS_OR_ELSE_POLICY.createURL(url) : url;
  return safeUrl;
};
goog.html.SafeUrl.ABOUT_BLANK = goog.html.SafeUrl.createSafeUrlSecurityPrivateDoNotAccessOrElse("about:blank");
goog.html.SafeStyle = function() {
  this.privateDoNotAccessOrElseSafeStyleWrappedValue_ = "";
  this.SAFE_STYLE_TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_ = goog.html.SafeStyle.TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_;
};
goog.html.SafeStyle.prototype.implementsGoogStringTypedString = !0;
goog.html.SafeStyle.TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_ = {};
goog.html.SafeStyle.fromConstant = function(style) {
  var styleString = goog.string.Const.unwrap(style);
  if (0 === styleString.length) {
    return goog.html.SafeStyle.EMPTY;
  }
  goog.asserts.assert(goog.string.internal.endsWith(styleString, ";"), "Last character of style string is not ';': " + styleString);
  goog.asserts.assert(goog.string.internal.contains(styleString, ":"), "Style string must contain at least one ':', to specify a \"name: value\" pair: " + styleString);
  return goog.html.SafeStyle.createSafeStyleSecurityPrivateDoNotAccessOrElse(styleString);
};
goog.html.SafeStyle.prototype.getTypedStringValue = function() {
  return this.privateDoNotAccessOrElseSafeStyleWrappedValue_;
};
goog.DEBUG && (goog.html.SafeStyle.prototype.toString = function() {
  return "SafeStyle{" + this.privateDoNotAccessOrElseSafeStyleWrappedValue_ + "}";
});
goog.html.SafeStyle.unwrap = function(safeStyle) {
  if (safeStyle instanceof goog.html.SafeStyle && safeStyle.constructor === goog.html.SafeStyle && safeStyle.SAFE_STYLE_TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_ === goog.html.SafeStyle.TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_) {
    return safeStyle.privateDoNotAccessOrElseSafeStyleWrappedValue_;
  }
  goog.asserts.fail("expected object of type SafeStyle, got '" + safeStyle + "' of type " + goog.typeOf(safeStyle));
  return "type_error:SafeStyle";
};
goog.html.SafeStyle.createSafeStyleSecurityPrivateDoNotAccessOrElse = function(style) {
  return (new goog.html.SafeStyle).initSecurityPrivateDoNotAccessOrElse_(style);
};
goog.html.SafeStyle.prototype.initSecurityPrivateDoNotAccessOrElse_ = function(style) {
  this.privateDoNotAccessOrElseSafeStyleWrappedValue_ = style;
  return this;
};
goog.html.SafeStyle.EMPTY = goog.html.SafeStyle.createSafeStyleSecurityPrivateDoNotAccessOrElse("");
goog.html.SafeStyle.INNOCUOUS_STRING = "zClosurez";
goog.html.SafeStyle.create = function(map) {
  var style = "", name;
  for (name in map) {
    if (!/^[-_a-zA-Z0-9]+$/.test(name)) {
      throw Error("Name allows only [-_a-zA-Z0-9], got: " + name);
    }
    var value = map[name];
    null != value && (value = goog.isArray(value) ? goog.array.map(value, goog.html.SafeStyle.sanitizePropertyValue_).join(" ") : goog.html.SafeStyle.sanitizePropertyValue_(value), style += name + ":" + value + ";");
  }
  return style ? goog.html.SafeStyle.createSafeStyleSecurityPrivateDoNotAccessOrElse(style) : goog.html.SafeStyle.EMPTY;
};
goog.html.SafeStyle.sanitizePropertyValue_ = function(value) {
  if (value instanceof goog.html.SafeUrl) {
    return 'url("' + goog.html.SafeUrl.unwrap(value).replace(/</g, "%3c").replace(/[\\"]/g, "\\$&") + '")';
  }
  var result = value instanceof goog.string.Const ? goog.string.Const.unwrap(value) : goog.html.SafeStyle.sanitizePropertyValueString_(String(value));
  if (/[{;}]/.test(result)) {
    throw new goog.asserts.AssertionError("Value does not allow [{;}], got: %s.", [result]);
  }
  return result;
};
goog.html.SafeStyle.sanitizePropertyValueString_ = function(value) {
  var valueWithoutFunctions = value.replace(goog.html.SafeStyle.FUNCTIONS_RE_, "$1").replace(goog.html.SafeStyle.FUNCTIONS_RE_, "$1").replace(goog.html.SafeStyle.URL_RE_, "url");
  if (goog.html.SafeStyle.VALUE_RE_.test(valueWithoutFunctions)) {
    if (goog.html.SafeStyle.COMMENT_RE_.test(value)) {
      return goog.asserts.fail("String value disallows comments, got: " + value), goog.html.SafeStyle.INNOCUOUS_STRING;
    }
    if (!goog.html.SafeStyle.hasBalancedQuotes_(value)) {
      return goog.asserts.fail("String value requires balanced quotes, got: " + value), goog.html.SafeStyle.INNOCUOUS_STRING;
    }
    if (!goog.html.SafeStyle.hasBalancedSquareBrackets_(value)) {
      return goog.asserts.fail("String value requires balanced square brackets and one identifier per pair of brackets, got: " + value), goog.html.SafeStyle.INNOCUOUS_STRING;
    }
  } else {
    return goog.asserts.fail("String value allows only " + goog.html.SafeStyle.VALUE_ALLOWED_CHARS_ + " and simple functions, got: " + value), goog.html.SafeStyle.INNOCUOUS_STRING;
  }
  return goog.html.SafeStyle.sanitizeUrl_(value);
};
goog.html.SafeStyle.hasBalancedQuotes_ = function(value) {
  for (var outsideSingle = !0, outsideDouble = !0, i = 0; i < value.length; i++) {
    var c = value.charAt(i);
    "'" == c && outsideDouble ? outsideSingle = !outsideSingle : '"' == c && outsideSingle && (outsideDouble = !outsideDouble);
  }
  return outsideSingle && outsideDouble;
};
goog.html.SafeStyle.hasBalancedSquareBrackets_ = function(value) {
  for (var outside = !0, tokenRe = /^[-_a-zA-Z0-9]$/, i = 0; i < value.length; i++) {
    var c = value.charAt(i);
    if ("]" == c) {
      if (outside) {
        return !1;
      }
      outside = !0;
    } else {
      if ("[" == c) {
        if (!outside) {
          return !1;
        }
        outside = !1;
      } else {
        if (!outside && !tokenRe.test(c)) {
          return !1;
        }
      }
    }
  }
  return outside;
};
goog.html.SafeStyle.VALUE_ALLOWED_CHARS_ = "[-,.\"'%_!# a-zA-Z0-9\\[\\]]";
goog.html.SafeStyle.VALUE_RE_ = new RegExp("^" + goog.html.SafeStyle.VALUE_ALLOWED_CHARS_ + "+$");
goog.html.SafeStyle.URL_RE_ = /\b(url\([ \t\n]*)('[ -&(-\[\]-~]*'|"[ !#-\[\]-~]*"|[!#-&*-\[\]-~]*)([ \t\n]*\))/g;
goog.html.SafeStyle.FUNCTIONS_RE_ = /\b(hsl|hsla|rgb|rgba|matrix|calc|minmax|fit-content|repeat|(rotate|scale|translate)(X|Y|Z|3d)?)\([-+*/0-9a-z.%\[\], ]+\)/g;
goog.html.SafeStyle.COMMENT_RE_ = /\/\*/;
goog.html.SafeStyle.sanitizeUrl_ = function(value) {
  return value.replace(goog.html.SafeStyle.URL_RE_, function(match$jscomp$0, before, url, after) {
    var quote = "";
    url = url.replace(/^(['"])(.*)\1$/, function(match, start, inside) {
      quote = start;
      return inside;
    });
    var sanitized = goog.html.SafeUrl.sanitize(url).getTypedStringValue();
    return before + quote + sanitized + quote + after;
  });
};
goog.html.SafeStyle.concat = function(var_args) {
  var style = "", addArgument = function(argument) {
    goog.isArray(argument) ? goog.array.forEach(argument, addArgument) : style += goog.html.SafeStyle.unwrap(argument);
  };
  goog.array.forEach(arguments, addArgument);
  return style ? goog.html.SafeStyle.createSafeStyleSecurityPrivateDoNotAccessOrElse(style) : goog.html.SafeStyle.EMPTY;
};
goog.html.SafeStyleSheet = function() {
  this.privateDoNotAccessOrElseSafeStyleSheetWrappedValue_ = "";
  this.SAFE_STYLE_SHEET_TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_ = goog.html.SafeStyleSheet.TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_;
};
goog.html.SafeStyleSheet.prototype.implementsGoogStringTypedString = !0;
goog.html.SafeStyleSheet.TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_ = {};
goog.html.SafeStyleSheet.createRule = function(selector, style) {
  if (goog.string.internal.contains(selector, "<")) {
    throw Error("Selector does not allow '<', got: " + selector);
  }
  var selectorToCheck = selector.replace(/('|")((?!\1)[^\r\n\f\\]|\\[\s\S])*\1/g, "");
  if (!/^[-_a-zA-Z0-9#.:* ,>+~[\]()=^$|]+$/.test(selectorToCheck)) {
    throw Error("Selector allows only [-_a-zA-Z0-9#.:* ,>+~[\\]()=^$|] and strings, got: " + selector);
  }
  if (!goog.html.SafeStyleSheet.hasBalancedBrackets_(selectorToCheck)) {
    throw Error("() and [] in selector must be balanced, got: " + selector);
  }
  style instanceof goog.html.SafeStyle || (style = goog.html.SafeStyle.create(style));
  var styleSheet = selector + "{" + goog.html.SafeStyle.unwrap(style).replace(/</g, "\\3C ") + "}";
  return goog.html.SafeStyleSheet.createSafeStyleSheetSecurityPrivateDoNotAccessOrElse(styleSheet);
};
goog.html.SafeStyleSheet.hasBalancedBrackets_ = function(s) {
  for (var brackets = {"(":")", "[":"]"}, expectedBrackets = [], i = 0; i < s.length; i++) {
    var ch = s[i];
    if (brackets[ch]) {
      expectedBrackets.push(brackets[ch]);
    } else {
      if (goog.object.contains(brackets, ch) && expectedBrackets.pop() != ch) {
        return !1;
      }
    }
  }
  return 0 == expectedBrackets.length;
};
goog.html.SafeStyleSheet.concat = function(var_args) {
  var result = "", addArgument = function(argument) {
    goog.isArray(argument) ? goog.array.forEach(argument, addArgument) : result += goog.html.SafeStyleSheet.unwrap(argument);
  };
  goog.array.forEach(arguments, addArgument);
  return goog.html.SafeStyleSheet.createSafeStyleSheetSecurityPrivateDoNotAccessOrElse(result);
};
goog.html.SafeStyleSheet.fromConstant = function(styleSheet) {
  var styleSheetString = goog.string.Const.unwrap(styleSheet);
  if (0 === styleSheetString.length) {
    return goog.html.SafeStyleSheet.EMPTY;
  }
  goog.asserts.assert(!goog.string.internal.contains(styleSheetString, "<"), "Forbidden '<' character in style sheet string: " + styleSheetString);
  return goog.html.SafeStyleSheet.createSafeStyleSheetSecurityPrivateDoNotAccessOrElse(styleSheetString);
};
goog.html.SafeStyleSheet.prototype.getTypedStringValue = function() {
  return this.privateDoNotAccessOrElseSafeStyleSheetWrappedValue_;
};
goog.DEBUG && (goog.html.SafeStyleSheet.prototype.toString = function() {
  return "SafeStyleSheet{" + this.privateDoNotAccessOrElseSafeStyleSheetWrappedValue_ + "}";
});
goog.html.SafeStyleSheet.unwrap = function(safeStyleSheet) {
  if (safeStyleSheet instanceof goog.html.SafeStyleSheet && safeStyleSheet.constructor === goog.html.SafeStyleSheet && safeStyleSheet.SAFE_STYLE_SHEET_TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_ === goog.html.SafeStyleSheet.TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_) {
    return safeStyleSheet.privateDoNotAccessOrElseSafeStyleSheetWrappedValue_;
  }
  goog.asserts.fail("expected object of type SafeStyleSheet, got '" + safeStyleSheet + "' of type " + goog.typeOf(safeStyleSheet));
  return "type_error:SafeStyleSheet";
};
goog.html.SafeStyleSheet.createSafeStyleSheetSecurityPrivateDoNotAccessOrElse = function(styleSheet) {
  return (new goog.html.SafeStyleSheet).initSecurityPrivateDoNotAccessOrElse_(styleSheet);
};
goog.html.SafeStyleSheet.prototype.initSecurityPrivateDoNotAccessOrElse_ = function(styleSheet) {
  this.privateDoNotAccessOrElseSafeStyleSheetWrappedValue_ = styleSheet;
  return this;
};
goog.html.SafeStyleSheet.EMPTY = goog.html.SafeStyleSheet.createSafeStyleSheetSecurityPrivateDoNotAccessOrElse("");
goog.html.SafeHtml = function() {
  this.privateDoNotAccessOrElseSafeHtmlWrappedValue_ = "";
  this.SAFE_HTML_TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_ = goog.html.SafeHtml.TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_;
  this.dir_ = null;
};
goog.html.SafeHtml.prototype.implementsGoogI18nBidiDirectionalString = !0;
goog.html.SafeHtml.prototype.getDirection = function() {
  return this.dir_;
};
goog.html.SafeHtml.prototype.implementsGoogStringTypedString = !0;
goog.html.SafeHtml.prototype.getTypedStringValue = function() {
  return this.privateDoNotAccessOrElseSafeHtmlWrappedValue_.toString();
};
goog.DEBUG && (goog.html.SafeHtml.prototype.toString = function() {
  return "SafeHtml{" + this.privateDoNotAccessOrElseSafeHtmlWrappedValue_ + "}";
});
goog.html.SafeHtml.unwrap = function(safeHtml) {
  return goog.html.SafeHtml.unwrapTrustedHTML(safeHtml).toString();
};
goog.html.SafeHtml.unwrapTrustedHTML = function(safeHtml) {
  if (safeHtml instanceof goog.html.SafeHtml && safeHtml.constructor === goog.html.SafeHtml && safeHtml.SAFE_HTML_TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_ === goog.html.SafeHtml.TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_) {
    return safeHtml.privateDoNotAccessOrElseSafeHtmlWrappedValue_;
  }
  goog.asserts.fail("expected object of type SafeHtml, got '" + safeHtml + "' of type " + goog.typeOf(safeHtml));
  return "type_error:SafeHtml";
};
goog.html.SafeHtml.htmlEscape = function(textOrHtml) {
  if (textOrHtml instanceof goog.html.SafeHtml) {
    return textOrHtml;
  }
  var textIsObject = "object" == typeof textOrHtml, dir = null;
  textIsObject && textOrHtml.implementsGoogI18nBidiDirectionalString && (dir = textOrHtml.getDirection());
  return goog.html.SafeHtml.createSafeHtmlSecurityPrivateDoNotAccessOrElse(goog.string.internal.htmlEscape(textIsObject && textOrHtml.implementsGoogStringTypedString ? textOrHtml.getTypedStringValue() : String(textOrHtml)), dir);
};
goog.html.SafeHtml.htmlEscapePreservingNewlines = function(textOrHtml) {
  if (textOrHtml instanceof goog.html.SafeHtml) {
    return textOrHtml;
  }
  var html = goog.html.SafeHtml.htmlEscape(textOrHtml);
  return goog.html.SafeHtml.createSafeHtmlSecurityPrivateDoNotAccessOrElse(goog.string.internal.newLineToBr(goog.html.SafeHtml.unwrap(html)), html.getDirection());
};
goog.html.SafeHtml.htmlEscapePreservingNewlinesAndSpaces = function(textOrHtml) {
  if (textOrHtml instanceof goog.html.SafeHtml) {
    return textOrHtml;
  }
  var html = goog.html.SafeHtml.htmlEscape(textOrHtml);
  return goog.html.SafeHtml.createSafeHtmlSecurityPrivateDoNotAccessOrElse(goog.string.internal.whitespaceEscape(goog.html.SafeHtml.unwrap(html)), html.getDirection());
};
goog.html.SafeHtml.from = goog.html.SafeHtml.htmlEscape;
goog.html.SafeHtml.VALID_NAMES_IN_TAG_ = /^[a-zA-Z0-9-]+$/;
goog.html.SafeHtml.URL_ATTRIBUTES_ = {action:!0, cite:!0, data:!0, formaction:!0, href:!0, manifest:!0, poster:!0, src:!0};
goog.html.SafeHtml.NOT_ALLOWED_TAG_NAMES_ = {APPLET:!0, BASE:!0, EMBED:!0, IFRAME:!0, LINK:!0, MATH:!0, META:!0, OBJECT:!0, SCRIPT:!0, STYLE:!0, SVG:!0, TEMPLATE:!0};
goog.html.SafeHtml.create = function(tagName, opt_attributes, opt_content) {
  goog.html.SafeHtml.verifyTagName(String(tagName));
  return goog.html.SafeHtml.createSafeHtmlTagSecurityPrivateDoNotAccessOrElse(String(tagName), opt_attributes, opt_content);
};
goog.html.SafeHtml.verifyTagName = function(tagName) {
  if (!goog.html.SafeHtml.VALID_NAMES_IN_TAG_.test(tagName)) {
    throw Error("Invalid tag name <" + tagName + ">.");
  }
  if (tagName.toUpperCase() in goog.html.SafeHtml.NOT_ALLOWED_TAG_NAMES_) {
    throw Error("Tag name <" + tagName + "> is not allowed for SafeHtml.");
  }
};
goog.html.SafeHtml.createIframe = function(opt_src, opt_srcdoc, opt_attributes, opt_content) {
  opt_src && goog.html.TrustedResourceUrl.unwrap(opt_src);
  var fixedAttributes = {};
  fixedAttributes.src = opt_src || null;
  fixedAttributes.srcdoc = opt_srcdoc && goog.html.SafeHtml.unwrap(opt_srcdoc);
  var attributes = goog.html.SafeHtml.combineAttributes(fixedAttributes, {sandbox:""}, opt_attributes);
  return goog.html.SafeHtml.createSafeHtmlTagSecurityPrivateDoNotAccessOrElse("iframe", attributes, opt_content);
};
goog.html.SafeHtml.createSandboxIframe = function(opt_src, opt_srcdoc, opt_attributes, opt_content) {
  if (!goog.html.SafeHtml.canUseSandboxIframe()) {
    throw Error("The browser does not support sandboxed iframes.");
  }
  var fixedAttributes = {};
  fixedAttributes.src = opt_src ? goog.html.SafeUrl.unwrap(goog.html.SafeUrl.sanitize(opt_src)) : null;
  fixedAttributes.srcdoc = opt_srcdoc || null;
  fixedAttributes.sandbox = "";
  var attributes = goog.html.SafeHtml.combineAttributes(fixedAttributes, {}, opt_attributes);
  return goog.html.SafeHtml.createSafeHtmlTagSecurityPrivateDoNotAccessOrElse("iframe", attributes, opt_content);
};
goog.html.SafeHtml.canUseSandboxIframe = function() {
  return goog.global.HTMLIFrameElement && "sandbox" in goog.global.HTMLIFrameElement.prototype;
};
goog.html.SafeHtml.createScriptSrc = function(src, opt_attributes) {
  goog.html.TrustedResourceUrl.unwrap(src);
  var attributes = goog.html.SafeHtml.combineAttributes({src:src}, {}, opt_attributes);
  return goog.html.SafeHtml.createSafeHtmlTagSecurityPrivateDoNotAccessOrElse("script", attributes);
};
goog.html.SafeHtml.createScript = function(script, opt_attributes) {
  for (var attr in opt_attributes) {
    var attrLower = attr.toLowerCase();
    if ("language" == attrLower || "src" == attrLower || "text" == attrLower || "type" == attrLower) {
      throw Error('Cannot set "' + attrLower + '" attribute');
    }
  }
  var content = "";
  script = goog.array.concat(script);
  for (var i = 0; i < script.length; i++) {
    content += goog.html.SafeScript.unwrap(script[i]);
  }
  var htmlContent = goog.html.SafeHtml.createSafeHtmlSecurityPrivateDoNotAccessOrElse(content, goog.i18n.bidi.Dir.NEUTRAL);
  return goog.html.SafeHtml.createSafeHtmlTagSecurityPrivateDoNotAccessOrElse("script", opt_attributes, htmlContent);
};
goog.html.SafeHtml.createStyle = function(styleSheet, opt_attributes) {
  var attributes = goog.html.SafeHtml.combineAttributes({type:"text/css"}, {}, opt_attributes), content = "";
  styleSheet = goog.array.concat(styleSheet);
  for (var i = 0; i < styleSheet.length; i++) {
    content += goog.html.SafeStyleSheet.unwrap(styleSheet[i]);
  }
  var htmlContent = goog.html.SafeHtml.createSafeHtmlSecurityPrivateDoNotAccessOrElse(content, goog.i18n.bidi.Dir.NEUTRAL);
  return goog.html.SafeHtml.createSafeHtmlTagSecurityPrivateDoNotAccessOrElse("style", attributes, htmlContent);
};
goog.html.SafeHtml.createMetaRefresh = function(url, opt_secs) {
  var unwrappedUrl = goog.html.SafeUrl.unwrap(goog.html.SafeUrl.sanitize(url));
  (goog.labs.userAgent.browser.isIE() || goog.labs.userAgent.browser.isEdge()) && goog.string.internal.contains(unwrappedUrl, ";") && (unwrappedUrl = "'" + unwrappedUrl.replace(/'/g, "%27") + "'");
  return goog.html.SafeHtml.createSafeHtmlTagSecurityPrivateDoNotAccessOrElse("meta", {"http-equiv":"refresh", content:(opt_secs || 0) + "; url=" + unwrappedUrl});
};
goog.html.SafeHtml.getAttrNameAndValue_ = function(tagName, name, value) {
  if (value instanceof goog.string.Const) {
    value = goog.string.Const.unwrap(value);
  } else {
    if ("style" == name.toLowerCase()) {
      value = goog.html.SafeHtml.getStyleValue_(value);
    } else {
      if (/^on/i.test(name)) {
        throw Error('Attribute "' + name + '" requires goog.string.Const value, "' + value + '" given.');
      }
      if (name.toLowerCase() in goog.html.SafeHtml.URL_ATTRIBUTES_) {
        if (value instanceof goog.html.TrustedResourceUrl) {
          value = goog.html.TrustedResourceUrl.unwrap(value);
        } else {
          if (value instanceof goog.html.SafeUrl) {
            value = goog.html.SafeUrl.unwrap(value);
          } else {
            if (goog.isString(value)) {
              value = goog.html.SafeUrl.sanitize(value).getTypedStringValue();
            } else {
              throw Error('Attribute "' + name + '" on tag "' + tagName + '" requires goog.html.SafeUrl, goog.string.Const, or string, value "' + value + '" given.');
            }
          }
        }
      }
    }
  }
  value.implementsGoogStringTypedString && (value = value.getTypedStringValue());
  goog.asserts.assert(goog.isString(value) || goog.isNumber(value), "String or number value expected, got " + typeof value + " with value: " + value);
  return name + '="' + goog.string.internal.htmlEscape(String(value)) + '"';
};
goog.html.SafeHtml.getStyleValue_ = function(value) {
  if (!goog.isObject(value)) {
    throw Error('The "style" attribute requires goog.html.SafeStyle or map of style properties, ' + typeof value + " given: " + value);
  }
  value instanceof goog.html.SafeStyle || (value = goog.html.SafeStyle.create(value));
  return goog.html.SafeStyle.unwrap(value);
};
goog.html.SafeHtml.createWithDir = function(dir, tagName, opt_attributes, opt_content) {
  var html = goog.html.SafeHtml.create(tagName, opt_attributes, opt_content);
  html.dir_ = dir;
  return html;
};
goog.html.SafeHtml.join = function(separator, parts) {
  var separatorHtml = goog.html.SafeHtml.htmlEscape(separator), dir = separatorHtml.getDirection(), content = [], addArgument = function(argument) {
    if (goog.isArray(argument)) {
      goog.array.forEach(argument, addArgument);
    } else {
      var html = goog.html.SafeHtml.htmlEscape(argument);
      content.push(goog.html.SafeHtml.unwrap(html));
      var htmlDir = html.getDirection();
      dir == goog.i18n.bidi.Dir.NEUTRAL ? dir = htmlDir : htmlDir != goog.i18n.bidi.Dir.NEUTRAL && dir != htmlDir && (dir = null);
    }
  };
  goog.array.forEach(parts, addArgument);
  return goog.html.SafeHtml.createSafeHtmlSecurityPrivateDoNotAccessOrElse(content.join(goog.html.SafeHtml.unwrap(separatorHtml)), dir);
};
goog.html.SafeHtml.concat = function(var_args) {
  return goog.html.SafeHtml.join(goog.html.SafeHtml.EMPTY, Array.prototype.slice.call(arguments));
};
goog.html.SafeHtml.concatWithDir = function(dir, var_args) {
  var html = goog.html.SafeHtml.concat(goog.array.slice(arguments, 1));
  html.dir_ = dir;
  return html;
};
goog.html.SafeHtml.TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_ = {};
goog.html.SafeHtml.createSafeHtmlSecurityPrivateDoNotAccessOrElse = function(html, dir) {
  return (new goog.html.SafeHtml).initSecurityPrivateDoNotAccessOrElse_(html, dir);
};
goog.html.SafeHtml.prototype.initSecurityPrivateDoNotAccessOrElse_ = function(html, dir) {
  this.privateDoNotAccessOrElseSafeHtmlWrappedValue_ = goog.html.trustedtypes.PRIVATE_DO_NOT_ACCESS_OR_ELSE_POLICY ? goog.html.trustedtypes.PRIVATE_DO_NOT_ACCESS_OR_ELSE_POLICY.createHTML(html) : html;
  this.dir_ = dir;
  return this;
};
goog.html.SafeHtml.createSafeHtmlTagSecurityPrivateDoNotAccessOrElse = function(tagName, opt_attributes, opt_content) {
  var dir = null;
  var result = "<" + tagName + goog.html.SafeHtml.stringifyAttributes(tagName, opt_attributes);
  var content = opt_content;
  goog.isDefAndNotNull(content) ? goog.isArray(content) || (content = [content]) : content = [];
  if (goog.dom.tags.isVoidTag(tagName.toLowerCase())) {
    goog.asserts.assert(!content.length, "Void tag <" + tagName + "> does not allow content."), result += ">";
  } else {
    var html = goog.html.SafeHtml.concat(content);
    result += ">" + goog.html.SafeHtml.unwrap(html) + "</" + tagName + ">";
    dir = html.getDirection();
  }
  var dirAttribute = opt_attributes && opt_attributes.dir;
  dirAttribute && (dir = /^(ltr|rtl|auto)$/i.test(dirAttribute) ? goog.i18n.bidi.Dir.NEUTRAL : null);
  return goog.html.SafeHtml.createSafeHtmlSecurityPrivateDoNotAccessOrElse(result, dir);
};
goog.html.SafeHtml.stringifyAttributes = function(tagName, opt_attributes) {
  var result = "";
  if (opt_attributes) {
    for (var name in opt_attributes) {
      if (!goog.html.SafeHtml.VALID_NAMES_IN_TAG_.test(name)) {
        throw Error('Invalid attribute name "' + name + '".');
      }
      var value = opt_attributes[name];
      goog.isDefAndNotNull(value) && (result += " " + goog.html.SafeHtml.getAttrNameAndValue_(tagName, name, value));
    }
  }
  return result;
};
goog.html.SafeHtml.combineAttributes = function(fixedAttributes, defaultAttributes, opt_attributes) {
  var combinedAttributes = {}, name;
  for (name in fixedAttributes) {
    goog.asserts.assert(name.toLowerCase() == name, "Must be lower case"), combinedAttributes[name] = fixedAttributes[name];
  }
  for (name in defaultAttributes) {
    goog.asserts.assert(name.toLowerCase() == name, "Must be lower case"), combinedAttributes[name] = defaultAttributes[name];
  }
  for (name in opt_attributes) {
    var nameLower = name.toLowerCase();
    if (nameLower in fixedAttributes) {
      throw Error('Cannot override "' + nameLower + '" attribute, got "' + name + '" with value "' + opt_attributes[name] + '"');
    }
    nameLower in defaultAttributes && delete combinedAttributes[nameLower];
    combinedAttributes[name] = opt_attributes[name];
  }
  return combinedAttributes;
};
goog.html.SafeHtml.DOCTYPE_HTML = goog.html.SafeHtml.createSafeHtmlSecurityPrivateDoNotAccessOrElse("<!DOCTYPE html>", goog.i18n.bidi.Dir.NEUTRAL);
goog.html.SafeHtml.EMPTY = goog.html.SafeHtml.createSafeHtmlSecurityPrivateDoNotAccessOrElse("", goog.i18n.bidi.Dir.NEUTRAL);
goog.html.SafeHtml.BR = goog.html.SafeHtml.createSafeHtmlSecurityPrivateDoNotAccessOrElse("<br>", goog.i18n.bidi.Dir.NEUTRAL);
goog.html.uncheckedconversions = {};
goog.html.uncheckedconversions.safeHtmlFromStringKnownToSatisfyTypeContract = function(justification, html, opt_dir) {
  goog.asserts.assertString(goog.string.Const.unwrap(justification), "must provide justification");
  goog.asserts.assert(!goog.string.internal.isEmptyOrWhitespace(goog.string.Const.unwrap(justification)), "must provide non-empty justification");
  return goog.html.SafeHtml.createSafeHtmlSecurityPrivateDoNotAccessOrElse(html, opt_dir || null);
};
goog.html.uncheckedconversions.safeScriptFromStringKnownToSatisfyTypeContract = function(justification, script) {
  goog.asserts.assertString(goog.string.Const.unwrap(justification), "must provide justification");
  goog.asserts.assert(!goog.string.internal.isEmptyOrWhitespace(goog.string.Const.unwrap(justification)), "must provide non-empty justification");
  return goog.html.SafeScript.createSafeScriptSecurityPrivateDoNotAccessOrElse(script);
};
goog.html.uncheckedconversions.safeStyleFromStringKnownToSatisfyTypeContract = function(justification, style) {
  goog.asserts.assertString(goog.string.Const.unwrap(justification), "must provide justification");
  goog.asserts.assert(!goog.string.internal.isEmptyOrWhitespace(goog.string.Const.unwrap(justification)), "must provide non-empty justification");
  return goog.html.SafeStyle.createSafeStyleSecurityPrivateDoNotAccessOrElse(style);
};
goog.html.uncheckedconversions.safeStyleSheetFromStringKnownToSatisfyTypeContract = function(justification, styleSheet) {
  goog.asserts.assertString(goog.string.Const.unwrap(justification), "must provide justification");
  goog.asserts.assert(!goog.string.internal.isEmptyOrWhitespace(goog.string.Const.unwrap(justification)), "must provide non-empty justification");
  return goog.html.SafeStyleSheet.createSafeStyleSheetSecurityPrivateDoNotAccessOrElse(styleSheet);
};
goog.html.uncheckedconversions.safeUrlFromStringKnownToSatisfyTypeContract = function(justification, url) {
  goog.asserts.assertString(goog.string.Const.unwrap(justification), "must provide justification");
  goog.asserts.assert(!goog.string.internal.isEmptyOrWhitespace(goog.string.Const.unwrap(justification)), "must provide non-empty justification");
  return goog.html.SafeUrl.createSafeUrlSecurityPrivateDoNotAccessOrElse(url);
};
goog.html.uncheckedconversions.trustedResourceUrlFromStringKnownToSatisfyTypeContract = function(justification, url) {
  goog.asserts.assertString(goog.string.Const.unwrap(justification), "must provide justification");
  goog.asserts.assert(!goog.string.internal.isEmptyOrWhitespace(goog.string.Const.unwrap(justification)), "must provide non-empty justification");
  return goog.html.TrustedResourceUrl.createTrustedResourceUrlSecurityPrivateDoNotAccessOrElse(url);
};
goog.dom.safe = {};
goog.dom.safe.InsertAdjacentHtmlPosition = {AFTERBEGIN:"afterbegin", AFTEREND:"afterend", BEFOREBEGIN:"beforebegin", BEFOREEND:"beforeend"};
goog.dom.safe.insertAdjacentHtml = function(node, position, html) {
  node.insertAdjacentHTML(position, goog.html.SafeHtml.unwrapTrustedHTML(html));
};
goog.dom.safe.SET_INNER_HTML_DISALLOWED_TAGS_ = {MATH:!0, SCRIPT:!0, STYLE:!0, SVG:!0, TEMPLATE:!0};
goog.dom.safe.isInnerHtmlCleanupRecursive_ = goog.functions.cacheReturnValue(function() {
  if (goog.DEBUG && "undefined" === typeof document) {
    return !1;
  }
  var div = document.createElement("div"), childDiv = document.createElement("div");
  childDiv.appendChild(document.createElement("div"));
  div.appendChild(childDiv);
  if (goog.DEBUG && !div.firstChild) {
    return !1;
  }
  var innerChild = div.firstChild.firstChild;
  div.innerHTML = goog.html.SafeHtml.unwrapTrustedHTML(goog.html.SafeHtml.EMPTY);
  return !innerChild.parentElement;
});
goog.dom.safe.unsafeSetInnerHtmlDoNotUseOrElse = function(elem, html) {
  if (goog.dom.safe.isInnerHtmlCleanupRecursive_()) {
    for (; elem.lastChild;) {
      elem.removeChild(elem.lastChild);
    }
  }
  elem.innerHTML = goog.html.SafeHtml.unwrapTrustedHTML(html);
};
goog.dom.safe.setInnerHtml = function(elem, html) {
  if (goog.asserts.ENABLE_ASSERTS && goog.dom.safe.SET_INNER_HTML_DISALLOWED_TAGS_[elem.tagName.toUpperCase()]) {
    throw Error("goog.dom.safe.setInnerHtml cannot be used to set content of " + elem.tagName + ".");
  }
  goog.dom.safe.unsafeSetInnerHtmlDoNotUseOrElse(elem, html);
};
goog.dom.safe.setOuterHtml = function(elem, html) {
  elem.outerHTML = goog.html.SafeHtml.unwrapTrustedHTML(html);
};
goog.dom.safe.setFormElementAction = function(form, url) {
  var safeUrl = url instanceof goog.html.SafeUrl ? url : goog.html.SafeUrl.sanitizeAssertUnchanged(url);
  goog.dom.asserts.assertIsHTMLFormElement(form).action = goog.html.SafeUrl.unwrapTrustedURL(safeUrl);
};
goog.dom.safe.setButtonFormAction = function(button, url) {
  var safeUrl = url instanceof goog.html.SafeUrl ? url : goog.html.SafeUrl.sanitizeAssertUnchanged(url);
  goog.dom.asserts.assertIsHTMLButtonElement(button).formAction = goog.html.SafeUrl.unwrapTrustedURL(safeUrl);
};
goog.dom.safe.setInputFormAction = function(input, url) {
  var safeUrl = url instanceof goog.html.SafeUrl ? url : goog.html.SafeUrl.sanitizeAssertUnchanged(url);
  goog.dom.asserts.assertIsHTMLInputElement(input).formAction = goog.html.SafeUrl.unwrapTrustedURL(safeUrl);
};
goog.dom.safe.setStyle = function(elem, style) {
  elem.style.cssText = goog.html.SafeStyle.unwrap(style);
};
goog.dom.safe.documentWrite = function(doc, html) {
  doc.write(goog.html.SafeHtml.unwrapTrustedHTML(html));
};
goog.dom.safe.setAnchorHref = function(anchor, url) {
  goog.dom.asserts.assertIsHTMLAnchorElement(anchor);
  var safeUrl = url instanceof goog.html.SafeUrl ? url : goog.html.SafeUrl.sanitizeAssertUnchanged(url);
  anchor.href = goog.html.SafeUrl.unwrapTrustedURL(safeUrl);
};
goog.dom.safe.setImageSrc = function(imageElement, url) {
  goog.dom.asserts.assertIsHTMLImageElement(imageElement);
  if (url instanceof goog.html.SafeUrl) {
    var safeUrl = url;
  } else {
    var allowDataUrl = /^data:image\//i.test(url);
    safeUrl = goog.html.SafeUrl.sanitizeAssertUnchanged(url, allowDataUrl);
  }
  imageElement.src = goog.html.SafeUrl.unwrapTrustedURL(safeUrl);
};
goog.dom.safe.setAudioSrc = function(audioElement, url) {
  goog.dom.asserts.assertIsHTMLAudioElement(audioElement);
  if (url instanceof goog.html.SafeUrl) {
    var safeUrl = url;
  } else {
    var allowDataUrl = /^data:audio\//i.test(url);
    safeUrl = goog.html.SafeUrl.sanitizeAssertUnchanged(url, allowDataUrl);
  }
  audioElement.src = goog.html.SafeUrl.unwrapTrustedURL(safeUrl);
};
goog.dom.safe.setVideoSrc = function(videoElement, url) {
  goog.dom.asserts.assertIsHTMLVideoElement(videoElement);
  if (url instanceof goog.html.SafeUrl) {
    var safeUrl = url;
  } else {
    var allowDataUrl = /^data:video\//i.test(url);
    safeUrl = goog.html.SafeUrl.sanitizeAssertUnchanged(url, allowDataUrl);
  }
  videoElement.src = goog.html.SafeUrl.unwrapTrustedURL(safeUrl);
};
goog.dom.safe.setEmbedSrc = function(embed, url) {
  goog.dom.asserts.assertIsHTMLEmbedElement(embed);
  embed.src = goog.html.TrustedResourceUrl.unwrapTrustedScriptURL(url);
};
goog.dom.safe.setFrameSrc = function(frame, url) {
  goog.dom.asserts.assertIsHTMLFrameElement(frame);
  frame.src = goog.html.TrustedResourceUrl.unwrapTrustedURL(url);
};
goog.dom.safe.setIframeSrc = function(iframe, url) {
  goog.dom.asserts.assertIsHTMLIFrameElement(iframe);
  iframe.src = goog.html.TrustedResourceUrl.unwrapTrustedURL(url);
};
goog.dom.safe.setIframeSrcdoc = function(iframe, html) {
  goog.dom.asserts.assertIsHTMLIFrameElement(iframe);
  iframe.srcdoc = goog.html.SafeHtml.unwrapTrustedHTML(html);
};
goog.dom.safe.setLinkHrefAndRel = function(link, url, rel) {
  goog.dom.asserts.assertIsHTMLLinkElement(link);
  link.rel = rel;
  goog.string.internal.caseInsensitiveContains(rel, "stylesheet") ? (goog.asserts.assert(url instanceof goog.html.TrustedResourceUrl, 'URL must be TrustedResourceUrl because "rel" contains "stylesheet"'), link.href = goog.html.TrustedResourceUrl.unwrapTrustedURL(url)) : link.href = url instanceof goog.html.TrustedResourceUrl ? goog.html.TrustedResourceUrl.unwrapTrustedURL(url) : url instanceof goog.html.SafeUrl ? goog.html.SafeUrl.unwrapTrustedURL(url) : goog.html.SafeUrl.unwrapTrustedURL(goog.html.SafeUrl.sanitizeAssertUnchanged(url));
};
goog.dom.safe.setObjectData = function(object, url) {
  goog.dom.asserts.assertIsHTMLObjectElement(object);
  object.data = goog.html.TrustedResourceUrl.unwrapTrustedScriptURL(url);
};
goog.dom.safe.setScriptSrc = function(script, url) {
  goog.dom.asserts.assertIsHTMLScriptElement(script);
  script.src = goog.html.TrustedResourceUrl.unwrapTrustedScriptURL(url);
  var nonce = goog.getScriptNonce();
  nonce && script.setAttribute("nonce", nonce);
};
goog.dom.safe.setScriptContent = function(script, content) {
  goog.dom.asserts.assertIsHTMLScriptElement(script);
  script.text = goog.html.SafeScript.unwrapTrustedScript(content);
  var nonce = goog.getScriptNonce();
  nonce && script.setAttribute("nonce", nonce);
};
goog.dom.safe.setLocationHref = function(loc, url) {
  goog.dom.asserts.assertIsLocation(loc);
  var safeUrl = url instanceof goog.html.SafeUrl ? url : goog.html.SafeUrl.sanitizeAssertUnchanged(url);
  loc.href = goog.html.SafeUrl.unwrapTrustedURL(safeUrl);
};
goog.dom.safe.assignLocation = function(loc, url) {
  goog.dom.asserts.assertIsLocation(loc);
  var safeUrl = url instanceof goog.html.SafeUrl ? url : goog.html.SafeUrl.sanitizeAssertUnchanged(url);
  loc.assign(goog.html.SafeUrl.unwrapTrustedURL(safeUrl));
};
goog.dom.safe.replaceLocation = function(loc, url) {
  goog.dom.asserts.assertIsLocation(loc);
  var safeUrl = url instanceof goog.html.SafeUrl ? url : goog.html.SafeUrl.sanitizeAssertUnchanged(url);
  loc.replace(goog.html.SafeUrl.unwrapTrustedURL(safeUrl));
};
goog.dom.safe.openInWindow = function(url, opt_openerWin, opt_name, opt_specs, opt_replace) {
  var safeUrl = url instanceof goog.html.SafeUrl ? url : goog.html.SafeUrl.sanitizeAssertUnchanged(url);
  return (opt_openerWin || window).open(goog.html.SafeUrl.unwrapTrustedURL(safeUrl), opt_name ? goog.string.Const.unwrap(opt_name) : "", opt_specs, opt_replace);
};
goog.dom.safe.parseFromStringHtml = function(parser, html) {
  return goog.dom.safe.parseFromString(parser, html, "text/html");
};
goog.dom.safe.parseFromString = function(parser, content, type) {
  return parser.parseFromString(goog.html.SafeHtml.unwrapTrustedHTML(content), type);
};
goog.dom.safe.createImageFromBlob = function(blob) {
  if (!/^image\/.*/g.test(blob.type)) {
    throw Error("goog.dom.safe.createImageFromBlob only accepts MIME type image/.*.");
  }
  var objectUrl = window.URL.createObjectURL(blob), image = new Image;
  image.onload = function() {
    window.URL.revokeObjectURL(objectUrl);
  };
  goog.dom.safe.setImageSrc(image, goog.html.uncheckedconversions.safeUrlFromStringKnownToSatisfyTypeContract(goog.string.Const.from("Image blob URL."), objectUrl));
  return image;
};
goog.math.Coordinate = function(opt_x, opt_y) {
  this.x = goog.isDef(opt_x) ? opt_x : 0;
  this.y = goog.isDef(opt_y) ? opt_y : 0;
};
goog.math.Coordinate.prototype.clone = function() {
  return new goog.math.Coordinate(this.x, this.y);
};
goog.DEBUG && (goog.math.Coordinate.prototype.toString = function() {
  return "(" + this.x + ", " + this.y + ")";
});
goog.math.Coordinate.prototype.equals = function(other) {
  return other instanceof goog.math.Coordinate && goog.math.Coordinate.equals(this, other);
};
goog.math.Coordinate.equals = function(a, b) {
  return a == b ? !0 : a && b ? a.x == b.x && a.y == b.y : !1;
};
goog.math.Coordinate.distance = function(a, b) {
  var dx = a.x - b.x, dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
};
goog.math.Coordinate.magnitude = function(a) {
  return Math.sqrt(a.x * a.x + a.y * a.y);
};
goog.math.Coordinate.azimuth = function(a) {
  return goog.math.angle(0, 0, a.x, a.y);
};
goog.math.Coordinate.squaredDistance = function(a, b) {
  var dx = a.x - b.x, dy = a.y - b.y;
  return dx * dx + dy * dy;
};
goog.math.Coordinate.difference = function(a, b) {
  return new goog.math.Coordinate(a.x - b.x, a.y - b.y);
};
goog.math.Coordinate.sum = function(a, b) {
  return new goog.math.Coordinate(a.x + b.x, a.y + b.y);
};
goog.math.Coordinate.prototype.ceil = function() {
  this.x = Math.ceil(this.x);
  this.y = Math.ceil(this.y);
  return this;
};
goog.math.Coordinate.prototype.floor = function() {
  this.x = Math.floor(this.x);
  this.y = Math.floor(this.y);
  return this;
};
goog.math.Coordinate.prototype.round = function() {
  this.x = Math.round(this.x);
  this.y = Math.round(this.y);
  return this;
};
goog.math.Coordinate.prototype.translate = function(tx, opt_ty) {
  tx instanceof goog.math.Coordinate ? (this.x += tx.x, this.y += tx.y) : (this.x += Number(tx), goog.isNumber(opt_ty) && (this.y += opt_ty));
  return this;
};
goog.math.Coordinate.prototype.scale = function(sx, opt_sy) {
  var sy = goog.isNumber(opt_sy) ? opt_sy : sx;
  this.x *= sx;
  this.y *= sy;
  return this;
};
goog.math.Coordinate.prototype.rotateRadians = function(radians, opt_center) {
  var center = opt_center || new goog.math.Coordinate(0, 0), x = this.x, y = this.y, cos = Math.cos(radians), sin = Math.sin(radians);
  this.x = (x - center.x) * cos - (y - center.y) * sin + center.x;
  this.y = (x - center.x) * sin + (y - center.y) * cos + center.y;
};
goog.math.Coordinate.prototype.rotateDegrees = function(degrees, opt_center) {
  this.rotateRadians(goog.math.toRadians(degrees), opt_center);
};
goog.math.Size = function(width, height) {
  this.width = width;
  this.height = height;
};
goog.math.Size.equals = function(a, b) {
  return a == b ? !0 : a && b ? a.width == b.width && a.height == b.height : !1;
};
goog.math.Size.prototype.clone = function() {
  return new goog.math.Size(this.width, this.height);
};
goog.DEBUG && (goog.math.Size.prototype.toString = function() {
  return "(" + this.width + " x " + this.height + ")";
});
goog.math.Size.prototype.getLongest = function() {
  return Math.max(this.width, this.height);
};
goog.math.Size.prototype.getShortest = function() {
  return Math.min(this.width, this.height);
};
goog.math.Size.prototype.area = function() {
  return this.width * this.height;
};
goog.math.Size.prototype.perimeter = function() {
  return 2 * (this.width + this.height);
};
goog.math.Size.prototype.aspectRatio = function() {
  return this.width / this.height;
};
goog.math.Size.prototype.isEmpty = function() {
  return !this.area();
};
goog.math.Size.prototype.ceil = function() {
  this.width = Math.ceil(this.width);
  this.height = Math.ceil(this.height);
  return this;
};
goog.math.Size.prototype.fitsInside = function(target) {
  return this.width <= target.width && this.height <= target.height;
};
goog.math.Size.prototype.floor = function() {
  this.width = Math.floor(this.width);
  this.height = Math.floor(this.height);
  return this;
};
goog.math.Size.prototype.round = function() {
  this.width = Math.round(this.width);
  this.height = Math.round(this.height);
  return this;
};
goog.math.Size.prototype.scale = function(sx, opt_sy) {
  var sy = goog.isNumber(opt_sy) ? opt_sy : sx;
  this.width *= sx;
  this.height *= sy;
  return this;
};
goog.math.Size.prototype.scaleToCover = function(target) {
  var s = this.aspectRatio() <= target.aspectRatio() ? target.width / this.width : target.height / this.height;
  return this.scale(s);
};
goog.math.Size.prototype.scaleToFit = function(target) {
  var s = this.aspectRatio() > target.aspectRatio() ? target.width / this.width : target.height / this.height;
  return this.scale(s);
};
goog.dom.ASSUME_QUIRKS_MODE = !1;
goog.dom.ASSUME_STANDARDS_MODE = !1;
goog.dom.COMPAT_MODE_KNOWN_ = goog.dom.ASSUME_QUIRKS_MODE || goog.dom.ASSUME_STANDARDS_MODE;
goog.dom.getDomHelper = function(opt_element) {
  return opt_element ? new goog.dom.DomHelper(goog.dom.getOwnerDocument(opt_element)) : goog.dom.defaultDomHelper_ || (goog.dom.defaultDomHelper_ = new goog.dom.DomHelper);
};
goog.dom.getDocument = function() {
  return document;
};
goog.dom.getElement = function(element) {
  return goog.dom.getElementHelper_(document, element);
};
goog.dom.getElementHelper_ = function(doc, element) {
  return goog.isString(element) ? doc.getElementById(element) : element;
};
goog.dom.getRequiredElement = function(id) {
  return goog.dom.getRequiredElementHelper_(document, id);
};
goog.dom.getRequiredElementHelper_ = function(doc, id) {
  goog.asserts.assertString(id);
  var element = goog.dom.getElementHelper_(doc, id);
  return element = goog.asserts.assertElement(element, "No element found with id: " + id);
};
goog.dom.$ = goog.dom.getElement;
goog.dom.getElementsByTagName = function(tagName, opt_parent) {
  return (opt_parent || document).getElementsByTagName(String(tagName));
};
goog.dom.getElementsByTagNameAndClass = function(opt_tag, opt_class, opt_el) {
  return goog.dom.getElementsByTagNameAndClass_(document, opt_tag, opt_class, opt_el);
};
goog.dom.getElementByTagNameAndClass = function(opt_tag, opt_class, opt_el) {
  return goog.dom.getElementByTagNameAndClass_(document, opt_tag, opt_class, opt_el);
};
goog.dom.getElementsByClass = function(className, opt_el) {
  var parent = opt_el || document;
  return goog.dom.canUseQuerySelector_(parent) ? parent.querySelectorAll("." + className) : goog.dom.getElementsByTagNameAndClass_(document, "*", className, opt_el);
};
goog.dom.getElementByClass = function(className, opt_el) {
  var parent = opt_el || document, retVal = null;
  return (retVal = parent.getElementsByClassName ? parent.getElementsByClassName(className)[0] : goog.dom.getElementByTagNameAndClass_(document, "*", className, opt_el)) || null;
};
goog.dom.getRequiredElementByClass = function(className, opt_root) {
  var retValue = goog.dom.getElementByClass(className, opt_root);
  return goog.asserts.assert(retValue, "No element found with className: " + className);
};
goog.dom.canUseQuerySelector_ = function(parent) {
  return !(!parent.querySelectorAll || !parent.querySelector);
};
goog.dom.getElementsByTagNameAndClass_ = function(doc, opt_tag, opt_class, opt_el) {
  var parent = opt_el || doc, tagName = opt_tag && "*" != opt_tag ? String(opt_tag).toUpperCase() : "";
  if (goog.dom.canUseQuerySelector_(parent) && (tagName || opt_class)) {
    return parent.querySelectorAll(tagName + (opt_class ? "." + opt_class : ""));
  }
  if (opt_class && parent.getElementsByClassName) {
    var els = parent.getElementsByClassName(opt_class);
    if (tagName) {
      for (var arrayLike = {}, len = 0, i = 0, el; el = els[i]; i++) {
        tagName == el.nodeName && (arrayLike[len++] = el);
      }
      arrayLike.length = len;
      return arrayLike;
    }
    return els;
  }
  els = parent.getElementsByTagName(tagName || "*");
  if (opt_class) {
    arrayLike = {};
    for (i = len = 0; el = els[i]; i++) {
      var className = el.className;
      "function" == typeof className.split && goog.array.contains(className.split(/\s+/), opt_class) && (arrayLike[len++] = el);
    }
    arrayLike.length = len;
    return arrayLike;
  }
  return els;
};
goog.dom.getElementByTagNameAndClass_ = function(doc, opt_tag, opt_class, opt_el) {
  var parent = opt_el || doc, tag = opt_tag && "*" != opt_tag ? String(opt_tag).toUpperCase() : "";
  return goog.dom.canUseQuerySelector_(parent) && (tag || opt_class) ? parent.querySelector(tag + (opt_class ? "." + opt_class : "")) : goog.dom.getElementsByTagNameAndClass_(doc, opt_tag, opt_class, opt_el)[0] || null;
};
goog.dom.$$ = goog.dom.getElementsByTagNameAndClass;
goog.dom.setProperties = function(element, properties) {
  goog.object.forEach(properties, function(val, key) {
    val && "object" == typeof val && val.implementsGoogStringTypedString && (val = val.getTypedStringValue());
    "style" == key ? element.style.cssText = val : "class" == key ? element.className = val : "for" == key ? element.htmlFor = val : goog.dom.DIRECT_ATTRIBUTE_MAP_.hasOwnProperty(key) ? element.setAttribute(goog.dom.DIRECT_ATTRIBUTE_MAP_[key], val) : goog.string.startsWith(key, "aria-") || goog.string.startsWith(key, "data-") ? element.setAttribute(key, val) : element[key] = val;
  });
};
goog.dom.DIRECT_ATTRIBUTE_MAP_ = {cellpadding:"cellPadding", cellspacing:"cellSpacing", colspan:"colSpan", frameborder:"frameBorder", height:"height", maxlength:"maxLength", nonce:"nonce", role:"role", rowspan:"rowSpan", type:"type", usemap:"useMap", valign:"vAlign", width:"width"};
goog.dom.getViewportSize = function(opt_window) {
  return goog.dom.getViewportSize_(opt_window || window);
};
goog.dom.getViewportSize_ = function(win) {
  var doc = win.document, el = goog.dom.isCss1CompatMode_(doc) ? doc.documentElement : doc.body;
  return new goog.math.Size(el.clientWidth, el.clientHeight);
};
goog.dom.getDocumentHeight = function() {
  return goog.dom.getDocumentHeight_(window);
};
goog.dom.getDocumentHeightForWindow = function(win) {
  return goog.dom.getDocumentHeight_(win);
};
goog.dom.getDocumentHeight_ = function(win) {
  var doc = win.document, height = 0;
  if (doc) {
    var body = doc.body, docEl = doc.documentElement;
    if (!docEl || !body) {
      return 0;
    }
    var vh = goog.dom.getViewportSize_(win).height;
    if (goog.dom.isCss1CompatMode_(doc) && docEl.scrollHeight) {
      height = docEl.scrollHeight != vh ? docEl.scrollHeight : docEl.offsetHeight;
    } else {
      var sh = docEl.scrollHeight, oh = docEl.offsetHeight;
      docEl.clientHeight != oh && (sh = body.scrollHeight, oh = body.offsetHeight);
      height = sh > vh ? sh > oh ? sh : oh : sh < oh ? sh : oh;
    }
  }
  return height;
};
goog.dom.getPageScroll = function(opt_window) {
  return goog.dom.getDomHelper((opt_window || goog.global || window).document).getDocumentScroll();
};
goog.dom.getDocumentScroll = function() {
  return goog.dom.getDocumentScroll_(document);
};
goog.dom.getDocumentScroll_ = function(doc) {
  var el = goog.dom.getDocumentScrollElement_(doc), win = goog.dom.getWindow_(doc);
  return goog.userAgent.IE && goog.userAgent.isVersionOrHigher("10") && win.pageYOffset != el.scrollTop ? new goog.math.Coordinate(el.scrollLeft, el.scrollTop) : new goog.math.Coordinate(win.pageXOffset || el.scrollLeft, win.pageYOffset || el.scrollTop);
};
goog.dom.getDocumentScrollElement = function() {
  return goog.dom.getDocumentScrollElement_(document);
};
goog.dom.getDocumentScrollElement_ = function(doc) {
  return doc.scrollingElement ? doc.scrollingElement : !goog.userAgent.WEBKIT && goog.dom.isCss1CompatMode_(doc) ? doc.documentElement : doc.body || doc.documentElement;
};
goog.dom.getWindow = function(opt_doc) {
  return opt_doc ? goog.dom.getWindow_(opt_doc) : window;
};
goog.dom.getWindow_ = function(doc) {
  return doc.parentWindow || doc.defaultView;
};
goog.dom.createDom = function(tagName, opt_attributes, var_args) {
  return goog.dom.createDom_(document, arguments);
};
goog.dom.createDom_ = function(doc, args) {
  var tagName = String(args[0]), attributes = args[1];
  if (!goog.dom.BrowserFeature.CAN_ADD_NAME_OR_TYPE_ATTRIBUTES && attributes && (attributes.name || attributes.type)) {
    var tagNameArr = ["<", tagName];
    attributes.name && tagNameArr.push(' name="', goog.string.htmlEscape(attributes.name), '"');
    if (attributes.type) {
      tagNameArr.push(' type="', goog.string.htmlEscape(attributes.type), '"');
      var clone = {};
      goog.object.extend(clone, attributes);
      delete clone.type;
      attributes = clone;
    }
    tagNameArr.push(">");
    tagName = tagNameArr.join("");
  }
  var element = doc.createElement(tagName);
  attributes && (goog.isString(attributes) ? element.className = attributes : goog.isArray(attributes) ? element.className = attributes.join(" ") : goog.dom.setProperties(element, attributes));
  2 < args.length && goog.dom.append_(doc, element, args, 2);
  return element;
};
goog.dom.append_ = function(doc, parent, args, startIndex) {
  function childHandler(child) {
    child && parent.appendChild(goog.isString(child) ? doc.createTextNode(child) : child);
  }
  for (var i = startIndex; i < args.length; i++) {
    var arg = args[i];
    goog.isArrayLike(arg) && !goog.dom.isNodeLike(arg) ? goog.array.forEach(goog.dom.isNodeList(arg) ? goog.array.toArray(arg) : arg, childHandler) : childHandler(arg);
  }
};
goog.dom.$dom = goog.dom.createDom;
goog.dom.createElement = function(name) {
  return goog.dom.createElement_(document, name);
};
goog.dom.createElement_ = function(doc, name) {
  return doc.createElement(String(name));
};
goog.dom.createTextNode = function(content) {
  return document.createTextNode(String(content));
};
goog.dom.createTable = function(rows, columns, opt_fillWithNbsp) {
  return goog.dom.createTable_(document, rows, columns, !!opt_fillWithNbsp);
};
goog.dom.createTable_ = function(doc, rows, columns, fillWithNbsp) {
  for (var table = goog.dom.createElement_(doc, "TABLE"), tbody = table.appendChild(goog.dom.createElement_(doc, "TBODY")), i = 0; i < rows; i++) {
    for (var tr = goog.dom.createElement_(doc, "TR"), j = 0; j < columns; j++) {
      var td = goog.dom.createElement_(doc, "TD");
      fillWithNbsp && goog.dom.setTextContent(td, goog.string.Unicode.NBSP);
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  return table;
};
goog.dom.constHtmlToNode = function(var_args) {
  var stringArray = goog.array.map(arguments, goog.string.Const.unwrap), safeHtml = goog.html.uncheckedconversions.safeHtmlFromStringKnownToSatisfyTypeContract(goog.string.Const.from("Constant HTML string, that gets turned into a Node later, so it will be automatically balanced."), stringArray.join(""));
  return goog.dom.safeHtmlToNode(safeHtml);
};
goog.dom.safeHtmlToNode = function(html) {
  return goog.dom.safeHtmlToNode_(document, html);
};
goog.dom.safeHtmlToNode_ = function(doc, html) {
  var tempDiv = goog.dom.createElement_(doc, "DIV");
  goog.dom.BrowserFeature.INNER_HTML_NEEDS_SCOPED_ELEMENT ? (goog.dom.safe.setInnerHtml(tempDiv, goog.html.SafeHtml.concat(goog.html.SafeHtml.BR, html)), tempDiv.removeChild(goog.asserts.assert(tempDiv.firstChild))) : goog.dom.safe.setInnerHtml(tempDiv, html);
  return goog.dom.childrenToNode_(doc, tempDiv);
};
goog.dom.childrenToNode_ = function(doc, tempDiv) {
  if (1 == tempDiv.childNodes.length) {
    return tempDiv.removeChild(goog.asserts.assert(tempDiv.firstChild));
  }
  for (var fragment = doc.createDocumentFragment(); tempDiv.firstChild;) {
    fragment.appendChild(tempDiv.firstChild);
  }
  return fragment;
};
goog.dom.isCss1CompatMode = function() {
  return goog.dom.isCss1CompatMode_(document);
};
goog.dom.isCss1CompatMode_ = function(doc) {
  return goog.dom.COMPAT_MODE_KNOWN_ ? goog.dom.ASSUME_STANDARDS_MODE : "CSS1Compat" == doc.compatMode;
};
goog.dom.canHaveChildren = function(node) {
  if (node.nodeType != goog.dom.NodeType.ELEMENT) {
    return !1;
  }
  switch(node.tagName) {
    case "APPLET":
    case "AREA":
    case "BASE":
    case "BR":
    case "COL":
    case "COMMAND":
    case "EMBED":
    case "FRAME":
    case "HR":
    case "IMG":
    case "INPUT":
    case "IFRAME":
    case "ISINDEX":
    case "KEYGEN":
    case "LINK":
    case "NOFRAMES":
    case "NOSCRIPT":
    case "META":
    case "OBJECT":
    case "PARAM":
    case "SCRIPT":
    case "SOURCE":
    case "STYLE":
    case "TRACK":
    case "WBR":
      return !1;
  }
  return !0;
};
goog.dom.appendChild = function(parent, child) {
  goog.asserts.assert(null != parent && null != child, "goog.dom.appendChild expects non-null arguments");
  parent.appendChild(child);
};
goog.dom.append = function(parent, var_args) {
  goog.dom.append_(goog.dom.getOwnerDocument(parent), parent, arguments, 1);
};
goog.dom.removeChildren = function(node) {
  for (var child; child = node.firstChild;) {
    node.removeChild(child);
  }
};
goog.dom.insertSiblingBefore = function(newNode, refNode) {
  goog.asserts.assert(null != newNode && null != refNode, "goog.dom.insertSiblingBefore expects non-null arguments");
  refNode.parentNode && refNode.parentNode.insertBefore(newNode, refNode);
};
goog.dom.insertSiblingAfter = function(newNode, refNode) {
  goog.asserts.assert(null != newNode && null != refNode, "goog.dom.insertSiblingAfter expects non-null arguments");
  refNode.parentNode && refNode.parentNode.insertBefore(newNode, refNode.nextSibling);
};
goog.dom.insertChildAt = function(parent, child, index) {
  goog.asserts.assert(null != parent, "goog.dom.insertChildAt expects a non-null parent");
  parent.insertBefore(child, parent.childNodes[index] || null);
};
goog.dom.removeNode = function(node) {
  return node && node.parentNode ? node.parentNode.removeChild(node) : null;
};
goog.dom.replaceNode = function(newNode, oldNode) {
  goog.asserts.assert(null != newNode && null != oldNode, "goog.dom.replaceNode expects non-null arguments");
  var parent = oldNode.parentNode;
  parent && parent.replaceChild(newNode, oldNode);
};
goog.dom.flattenElement = function(element) {
  var child, parent = element.parentNode;
  if (parent && parent.nodeType != goog.dom.NodeType.DOCUMENT_FRAGMENT) {
    if (element.removeNode) {
      return element.removeNode(!1);
    }
    for (; child = element.firstChild;) {
      parent.insertBefore(child, element);
    }
    return goog.dom.removeNode(element);
  }
};
goog.dom.getChildren = function(element) {
  return goog.dom.BrowserFeature.CAN_USE_CHILDREN_ATTRIBUTE && void 0 != element.children ? element.children : goog.array.filter(element.childNodes, function(node) {
    return node.nodeType == goog.dom.NodeType.ELEMENT;
  });
};
goog.dom.getFirstElementChild = function(node) {
  return goog.isDef(node.firstElementChild) ? node.firstElementChild : goog.dom.getNextElementNode_(node.firstChild, !0);
};
goog.dom.getLastElementChild = function(node) {
  return goog.isDef(node.lastElementChild) ? node.lastElementChild : goog.dom.getNextElementNode_(node.lastChild, !1);
};
goog.dom.getNextElementSibling = function(node) {
  return goog.isDef(node.nextElementSibling) ? node.nextElementSibling : goog.dom.getNextElementNode_(node.nextSibling, !0);
};
goog.dom.getPreviousElementSibling = function(node) {
  return goog.isDef(node.previousElementSibling) ? node.previousElementSibling : goog.dom.getNextElementNode_(node.previousSibling, !1);
};
goog.dom.getNextElementNode_ = function(node, forward) {
  for (; node && node.nodeType != goog.dom.NodeType.ELEMENT;) {
    node = forward ? node.nextSibling : node.previousSibling;
  }
  return node;
};
goog.dom.getNextNode = function(node) {
  if (!node) {
    return null;
  }
  if (node.firstChild) {
    return node.firstChild;
  }
  for (; node && !node.nextSibling;) {
    node = node.parentNode;
  }
  return node ? node.nextSibling : null;
};
goog.dom.getPreviousNode = function(node) {
  if (!node) {
    return null;
  }
  if (!node.previousSibling) {
    return node.parentNode;
  }
  for (node = node.previousSibling; node && node.lastChild;) {
    node = node.lastChild;
  }
  return node;
};
goog.dom.isNodeLike = function(obj) {
  return goog.isObject(obj) && 0 < obj.nodeType;
};
goog.dom.isElement = function(obj) {
  return goog.isObject(obj) && obj.nodeType == goog.dom.NodeType.ELEMENT;
};
goog.dom.isWindow = function(obj) {
  return goog.isObject(obj) && obj.window == obj;
};
goog.dom.getParentElement = function(element) {
  var parent;
  if (goog.dom.BrowserFeature.CAN_USE_PARENT_ELEMENT_PROPERTY && !(goog.userAgent.IE && goog.userAgent.isVersionOrHigher("9") && !goog.userAgent.isVersionOrHigher("10") && goog.global.SVGElement && element instanceof goog.global.SVGElement) && (parent = element.parentElement)) {
    return parent;
  }
  parent = element.parentNode;
  return goog.dom.isElement(parent) ? parent : null;
};
goog.dom.contains = function(parent, descendant) {
  if (!parent || !descendant) {
    return !1;
  }
  if (parent.contains && descendant.nodeType == goog.dom.NodeType.ELEMENT) {
    return parent == descendant || parent.contains(descendant);
  }
  if ("undefined" != typeof parent.compareDocumentPosition) {
    return parent == descendant || !!(parent.compareDocumentPosition(descendant) & 16);
  }
  for (; descendant && parent != descendant;) {
    descendant = descendant.parentNode;
  }
  return descendant == parent;
};
goog.dom.compareNodeOrder = function(node1, node2) {
  if (node1 == node2) {
    return 0;
  }
  if (node1.compareDocumentPosition) {
    return node1.compareDocumentPosition(node2) & 2 ? 1 : -1;
  }
  if (goog.userAgent.IE && !goog.userAgent.isDocumentModeOrHigher(9)) {
    if (node1.nodeType == goog.dom.NodeType.DOCUMENT) {
      return -1;
    }
    if (node2.nodeType == goog.dom.NodeType.DOCUMENT) {
      return 1;
    }
  }
  if ("sourceIndex" in node1 || node1.parentNode && "sourceIndex" in node1.parentNode) {
    var isElement1 = node1.nodeType == goog.dom.NodeType.ELEMENT, isElement2 = node2.nodeType == goog.dom.NodeType.ELEMENT;
    if (isElement1 && isElement2) {
      return node1.sourceIndex - node2.sourceIndex;
    }
    var parent1 = node1.parentNode, parent2 = node2.parentNode;
    return parent1 == parent2 ? goog.dom.compareSiblingOrder_(node1, node2) : !isElement1 && goog.dom.contains(parent1, node2) ? -1 * goog.dom.compareParentsDescendantNodeIe_(node1, node2) : !isElement2 && goog.dom.contains(parent2, node1) ? goog.dom.compareParentsDescendantNodeIe_(node2, node1) : (isElement1 ? node1.sourceIndex : parent1.sourceIndex) - (isElement2 ? node2.sourceIndex : parent2.sourceIndex);
  }
  var doc = goog.dom.getOwnerDocument(node1);
  var range1 = doc.createRange();
  range1.selectNode(node1);
  range1.collapse(!0);
  var range2 = doc.createRange();
  range2.selectNode(node2);
  range2.collapse(!0);
  return range1.compareBoundaryPoints(goog.global.Range.START_TO_END, range2);
};
goog.dom.compareParentsDescendantNodeIe_ = function(textNode, node) {
  var parent = textNode.parentNode;
  if (parent == node) {
    return -1;
  }
  for (var sibling = node; sibling.parentNode != parent;) {
    sibling = sibling.parentNode;
  }
  return goog.dom.compareSiblingOrder_(sibling, textNode);
};
goog.dom.compareSiblingOrder_ = function(node1, node2) {
  for (var s = node2; s = s.previousSibling;) {
    if (s == node1) {
      return -1;
    }
  }
  return 1;
};
goog.dom.findCommonAncestor = function(var_args) {
  var i, count = arguments.length;
  if (!count) {
    return null;
  }
  if (1 == count) {
    return arguments[0];
  }
  var paths = [], minLength = Infinity;
  for (i = 0; i < count; i++) {
    for (var ancestors = [], node = arguments[i]; node;) {
      ancestors.unshift(node), node = node.parentNode;
    }
    paths.push(ancestors);
    minLength = Math.min(minLength, ancestors.length);
  }
  var output = null;
  for (i = 0; i < minLength; i++) {
    for (var first = paths[0][i], j = 1; j < count; j++) {
      if (first != paths[j][i]) {
        return output;
      }
    }
    output = first;
  }
  return output;
};
goog.dom.isInDocument = function(node) {
  return 16 == (node.ownerDocument.compareDocumentPosition(node) & 16);
};
goog.dom.getOwnerDocument = function(node) {
  goog.asserts.assert(node, "Node cannot be null or undefined.");
  return node.nodeType == goog.dom.NodeType.DOCUMENT ? node : node.ownerDocument || node.document;
};
goog.dom.getFrameContentDocument = function(frame) {
  return frame.contentDocument || frame.contentWindow.document;
};
goog.dom.getFrameContentWindow = function(frame) {
  try {
    return frame.contentWindow || (frame.contentDocument ? goog.dom.getWindow(frame.contentDocument) : null);
  } catch (e) {
  }
  return null;
};
goog.dom.setTextContent = function(node, text) {
  goog.asserts.assert(null != node, "goog.dom.setTextContent expects a non-null value for node");
  if ("textContent" in node) {
    node.textContent = text;
  } else {
    if (node.nodeType == goog.dom.NodeType.TEXT) {
      node.data = String(text);
    } else {
      if (node.firstChild && node.firstChild.nodeType == goog.dom.NodeType.TEXT) {
        for (; node.lastChild != node.firstChild;) {
          node.removeChild(goog.asserts.assert(node.lastChild));
        }
        node.firstChild.data = String(text);
      } else {
        goog.dom.removeChildren(node);
        var doc = goog.dom.getOwnerDocument(node);
        node.appendChild(doc.createTextNode(String(text)));
      }
    }
  }
};
goog.dom.getOuterHtml = function(element) {
  goog.asserts.assert(null !== element, "goog.dom.getOuterHtml expects a non-null value for element");
  if ("outerHTML" in element) {
    return element.outerHTML;
  }
  var doc = goog.dom.getOwnerDocument(element), div = goog.dom.createElement_(doc, "DIV");
  div.appendChild(element.cloneNode(!0));
  return div.innerHTML;
};
goog.dom.findNode = function(root, p) {
  var rv = [];
  return goog.dom.findNodes_(root, p, rv, !0) ? rv[0] : void 0;
};
goog.dom.findNodes = function(root, p) {
  var rv = [];
  goog.dom.findNodes_(root, p, rv, !1);
  return rv;
};
goog.dom.findNodes_ = function(root, p, rv, findOne) {
  if (null != root) {
    for (var child = root.firstChild; child;) {
      if (p(child) && (rv.push(child), findOne) || goog.dom.findNodes_(child, p, rv, findOne)) {
        return !0;
      }
      child = child.nextSibling;
    }
  }
  return !1;
};
goog.dom.findElement = function(root, pred) {
  for (var stack = goog.dom.getChildrenReverse_(root); 0 < stack.length;) {
    var next = stack.pop();
    if (pred(next)) {
      return next;
    }
    for (var c = next.lastElementChild; c; c = c.previousElementSibling) {
      stack.push(c);
    }
  }
  return null;
};
goog.dom.findElements = function(root, pred) {
  for (var result = [], stack = goog.dom.getChildrenReverse_(root); 0 < stack.length;) {
    var next = stack.pop();
    pred(next) && result.push(next);
    for (var c = next.lastElementChild; c; c = c.previousElementSibling) {
      stack.push(c);
    }
  }
  return result;
};
goog.dom.getChildrenReverse_ = function(node) {
  if (node.nodeType == goog.dom.NodeType.DOCUMENT) {
    return [node.documentElement];
  }
  for (var children = [], c = node.lastElementChild; c; c = c.previousElementSibling) {
    children.push(c);
  }
  return children;
};
goog.dom.TAGS_TO_IGNORE_ = {SCRIPT:1, STYLE:1, HEAD:1, IFRAME:1, OBJECT:1};
goog.dom.PREDEFINED_TAG_VALUES_ = {IMG:" ", BR:"\n"};
goog.dom.isFocusableTabIndex = function(element) {
  return goog.dom.hasSpecifiedTabIndex_(element) && goog.dom.isTabIndexFocusable_(element);
};
goog.dom.setFocusableTabIndex = function(element, enable) {
  enable ? element.tabIndex = 0 : (element.tabIndex = -1, element.removeAttribute("tabIndex"));
};
goog.dom.isFocusable = function(element) {
  var focusable;
  return (focusable = goog.dom.nativelySupportsFocus_(element) ? !element.disabled && (!goog.dom.hasSpecifiedTabIndex_(element) || goog.dom.isTabIndexFocusable_(element)) : goog.dom.isFocusableTabIndex(element)) && goog.userAgent.IE ? goog.dom.hasNonZeroBoundingRect_(element) : focusable;
};
goog.dom.hasSpecifiedTabIndex_ = function(element) {
  if (goog.userAgent.IE && !goog.userAgent.isVersionOrHigher("9")) {
    var attrNode = element.getAttributeNode("tabindex");
    return goog.isDefAndNotNull(attrNode) && attrNode.specified;
  }
  return element.hasAttribute("tabindex");
};
goog.dom.isTabIndexFocusable_ = function(element) {
  var index = element.tabIndex;
  return goog.isNumber(index) && 0 <= index && 32768 > index;
};
goog.dom.nativelySupportsFocus_ = function(element) {
  return "A" == element.tagName && element.hasAttribute("href") || "INPUT" == element.tagName || "TEXTAREA" == element.tagName || "SELECT" == element.tagName || "BUTTON" == element.tagName;
};
goog.dom.hasNonZeroBoundingRect_ = function(element) {
  var rect = !goog.isFunction(element.getBoundingClientRect) || goog.userAgent.IE && null == element.parentElement ? {height:element.offsetHeight, width:element.offsetWidth} : element.getBoundingClientRect();
  return goog.isDefAndNotNull(rect) && 0 < rect.height && 0 < rect.width;
};
goog.dom.getTextContent = function(node) {
  if (goog.dom.BrowserFeature.CAN_USE_INNER_TEXT && null !== node && "innerText" in node) {
    var textContent = goog.string.canonicalizeNewlines(node.innerText);
  } else {
    var buf = [];
    goog.dom.getTextContent_(node, buf, !0);
    textContent = buf.join("");
  }
  textContent = textContent.replace(/ \xAD /g, " ").replace(/\xAD/g, "");
  textContent = textContent.replace(/\u200B/g, "");
  goog.dom.BrowserFeature.CAN_USE_INNER_TEXT || (textContent = textContent.replace(/ +/g, " "));
  " " != textContent && (textContent = textContent.replace(/^\s*/, ""));
  return textContent;
};
goog.dom.getRawTextContent = function(node) {
  var buf = [];
  goog.dom.getTextContent_(node, buf, !1);
  return buf.join("");
};
goog.dom.getTextContent_ = function(node, buf, normalizeWhitespace) {
  if (!(node.nodeName in goog.dom.TAGS_TO_IGNORE_)) {
    if (node.nodeType == goog.dom.NodeType.TEXT) {
      normalizeWhitespace ? buf.push(String(node.nodeValue).replace(/(\r\n|\r|\n)/g, "")) : buf.push(node.nodeValue);
    } else {
      if (node.nodeName in goog.dom.PREDEFINED_TAG_VALUES_) {
        buf.push(goog.dom.PREDEFINED_TAG_VALUES_[node.nodeName]);
      } else {
        for (var child = node.firstChild; child;) {
          goog.dom.getTextContent_(child, buf, normalizeWhitespace), child = child.nextSibling;
        }
      }
    }
  }
};
goog.dom.getNodeTextLength = function(node) {
  return goog.dom.getTextContent(node).length;
};
goog.dom.getNodeTextOffset = function(node, opt_offsetParent) {
  for (var root = opt_offsetParent || goog.dom.getOwnerDocument(node).body, buf = []; node && node != root;) {
    for (var cur = node; cur = cur.previousSibling;) {
      buf.unshift(goog.dom.getTextContent(cur));
    }
    node = node.parentNode;
  }
  return goog.string.trimLeft(buf.join("")).replace(/ +/g, " ").length;
};
goog.dom.getNodeAtOffset = function(parent, offset, opt_result) {
  for (var stack = [parent], pos = 0, cur = null; 0 < stack.length && pos < offset;) {
    if (cur = stack.pop(), !(cur.nodeName in goog.dom.TAGS_TO_IGNORE_)) {
      if (cur.nodeType == goog.dom.NodeType.TEXT) {
        var text = cur.nodeValue.replace(/(\r\n|\r|\n)/g, "").replace(/ +/g, " ");
        pos += text.length;
      } else {
        if (cur.nodeName in goog.dom.PREDEFINED_TAG_VALUES_) {
          pos += goog.dom.PREDEFINED_TAG_VALUES_[cur.nodeName].length;
        } else {
          for (var i = cur.childNodes.length - 1; 0 <= i; i--) {
            stack.push(cur.childNodes[i]);
          }
        }
      }
    }
  }
  goog.isObject(opt_result) && (opt_result.remainder = cur ? cur.nodeValue.length + offset - pos - 1 : 0, opt_result.node = cur);
  return cur;
};
goog.dom.isNodeList = function(val) {
  if (val && "number" == typeof val.length) {
    if (goog.isObject(val)) {
      return "function" == typeof val.item || "string" == typeof val.item;
    }
    if (goog.isFunction(val)) {
      return "function" == typeof val.item;
    }
  }
  return !1;
};
goog.dom.getAncestorByTagNameAndClass = function(element, opt_tag, opt_class, opt_maxSearchSteps) {
  if (!opt_tag && !opt_class) {
    return null;
  }
  var tagName = opt_tag ? String(opt_tag).toUpperCase() : null;
  return goog.dom.getAncestor(element, function(node) {
    return (!tagName || node.nodeName == tagName) && (!opt_class || goog.isString(node.className) && goog.array.contains(node.className.split(/\s+/), opt_class));
  }, !0, opt_maxSearchSteps);
};
goog.dom.getAncestorByClass = function(element, className, opt_maxSearchSteps) {
  return goog.dom.getAncestorByTagNameAndClass(element, null, className, opt_maxSearchSteps);
};
goog.dom.getAncestor = function(element, matcher, opt_includeNode, opt_maxSearchSteps) {
  element && !opt_includeNode && (element = element.parentNode);
  for (var steps = 0; element && (null == opt_maxSearchSteps || steps <= opt_maxSearchSteps);) {
    goog.asserts.assert("parentNode" != element.name);
    if (matcher(element)) {
      return element;
    }
    element = element.parentNode;
    steps++;
  }
  return null;
};
goog.dom.getActiveElement = function(doc) {
  try {
    var activeElement = doc && doc.activeElement;
    return activeElement && activeElement.nodeName ? activeElement : null;
  } catch (e) {
    return null;
  }
};
goog.dom.getPixelRatio = function() {
  var win = goog.dom.getWindow();
  return goog.isDef(win.devicePixelRatio) ? win.devicePixelRatio : win.matchMedia ? goog.dom.matchesPixelRatio_(3) || goog.dom.matchesPixelRatio_(2) || goog.dom.matchesPixelRatio_(1.5) || goog.dom.matchesPixelRatio_(1) || .75 : 1;
};
goog.dom.matchesPixelRatio_ = function(pixelRatio) {
  return goog.dom.getWindow().matchMedia("(min-resolution: " + pixelRatio + "dppx),(min--moz-device-pixel-ratio: " + pixelRatio + "),(min-resolution: " + 96 * pixelRatio + "dpi)").matches ? pixelRatio : 0;
};
goog.dom.getCanvasContext2D = function(canvas) {
  return canvas.getContext("2d");
};
goog.dom.DomHelper = function(opt_document) {
  this.document_ = opt_document || goog.global.document || document;
};
goog.dom.DomHelper.prototype.getDomHelper = goog.dom.getDomHelper;
goog.dom.DomHelper.prototype.setDocument = function(document) {
  this.document_ = document;
};
goog.dom.DomHelper.prototype.getDocument = function() {
  return this.document_;
};
goog.dom.DomHelper.prototype.getElement = function(element) {
  return goog.dom.getElementHelper_(this.document_, element);
};
goog.dom.DomHelper.prototype.getRequiredElement = function(id) {
  return goog.dom.getRequiredElementHelper_(this.document_, id);
};
goog.dom.DomHelper.prototype.$ = goog.dom.DomHelper.prototype.getElement;
goog.dom.DomHelper.prototype.getElementsByTagName = function(tagName, opt_parent) {
  return (opt_parent || this.document_).getElementsByTagName(String(tagName));
};
goog.dom.DomHelper.prototype.getElementsByTagNameAndClass = function(opt_tag, opt_class, opt_el) {
  return goog.dom.getElementsByTagNameAndClass_(this.document_, opt_tag, opt_class, opt_el);
};
goog.dom.DomHelper.prototype.getElementByTagNameAndClass = function(opt_tag, opt_class, opt_el) {
  return goog.dom.getElementByTagNameAndClass_(this.document_, opt_tag, opt_class, opt_el);
};
goog.dom.DomHelper.prototype.getElementsByClass = function(className, opt_el) {
  return goog.dom.getElementsByClass(className, opt_el || this.document_);
};
goog.dom.DomHelper.prototype.getElementByClass = function(className, opt_el) {
  return goog.dom.getElementByClass(className, opt_el || this.document_);
};
goog.dom.DomHelper.prototype.getRequiredElementByClass = function(className, opt_root) {
  return goog.dom.getRequiredElementByClass(className, opt_root || this.document_);
};
goog.dom.DomHelper.prototype.$$ = goog.dom.DomHelper.prototype.getElementsByTagNameAndClass;
goog.dom.DomHelper.prototype.setProperties = goog.dom.setProperties;
goog.dom.DomHelper.prototype.getViewportSize = function(opt_window) {
  return goog.dom.getViewportSize(opt_window || this.getWindow());
};
goog.dom.DomHelper.prototype.getDocumentHeight = function() {
  return goog.dom.getDocumentHeight_(this.getWindow());
};
goog.dom.DomHelper.prototype.createDom = function(tagName, opt_attributes, var_args) {
  return goog.dom.createDom_(this.document_, arguments);
};
goog.dom.DomHelper.prototype.$dom = goog.dom.DomHelper.prototype.createDom;
goog.dom.DomHelper.prototype.createElement = function(name) {
  return goog.dom.createElement_(this.document_, name);
};
goog.dom.DomHelper.prototype.createTextNode = function(content) {
  return this.document_.createTextNode(String(content));
};
goog.dom.DomHelper.prototype.createTable = function(rows, columns, opt_fillWithNbsp) {
  return goog.dom.createTable_(this.document_, rows, columns, !!opt_fillWithNbsp);
};
goog.dom.DomHelper.prototype.safeHtmlToNode = function(html) {
  return goog.dom.safeHtmlToNode_(this.document_, html);
};
goog.dom.DomHelper.prototype.isCss1CompatMode = function() {
  return goog.dom.isCss1CompatMode_(this.document_);
};
goog.dom.DomHelper.prototype.getWindow = function() {
  return goog.dom.getWindow_(this.document_);
};
goog.dom.DomHelper.prototype.getDocumentScrollElement = function() {
  return goog.dom.getDocumentScrollElement_(this.document_);
};
goog.dom.DomHelper.prototype.getDocumentScroll = function() {
  return goog.dom.getDocumentScroll_(this.document_);
};
goog.dom.DomHelper.prototype.getActiveElement = function(opt_doc) {
  return goog.dom.getActiveElement(opt_doc || this.document_);
};
goog.dom.DomHelper.prototype.appendChild = goog.dom.appendChild;
goog.dom.DomHelper.prototype.append = goog.dom.append;
goog.dom.DomHelper.prototype.canHaveChildren = goog.dom.canHaveChildren;
goog.dom.DomHelper.prototype.removeChildren = goog.dom.removeChildren;
goog.dom.DomHelper.prototype.insertSiblingBefore = goog.dom.insertSiblingBefore;
goog.dom.DomHelper.prototype.insertSiblingAfter = goog.dom.insertSiblingAfter;
goog.dom.DomHelper.prototype.insertChildAt = goog.dom.insertChildAt;
goog.dom.DomHelper.prototype.removeNode = goog.dom.removeNode;
goog.dom.DomHelper.prototype.replaceNode = goog.dom.replaceNode;
goog.dom.DomHelper.prototype.flattenElement = goog.dom.flattenElement;
goog.dom.DomHelper.prototype.getChildren = goog.dom.getChildren;
goog.dom.DomHelper.prototype.getFirstElementChild = goog.dom.getFirstElementChild;
goog.dom.DomHelper.prototype.getLastElementChild = goog.dom.getLastElementChild;
goog.dom.DomHelper.prototype.getNextElementSibling = goog.dom.getNextElementSibling;
goog.dom.DomHelper.prototype.getPreviousElementSibling = goog.dom.getPreviousElementSibling;
goog.dom.DomHelper.prototype.getNextNode = goog.dom.getNextNode;
goog.dom.DomHelper.prototype.getPreviousNode = goog.dom.getPreviousNode;
goog.dom.DomHelper.prototype.isNodeLike = goog.dom.isNodeLike;
goog.dom.DomHelper.prototype.isElement = goog.dom.isElement;
goog.dom.DomHelper.prototype.isWindow = goog.dom.isWindow;
goog.dom.DomHelper.prototype.getParentElement = goog.dom.getParentElement;
goog.dom.DomHelper.prototype.contains = goog.dom.contains;
goog.dom.DomHelper.prototype.compareNodeOrder = goog.dom.compareNodeOrder;
goog.dom.DomHelper.prototype.findCommonAncestor = goog.dom.findCommonAncestor;
goog.dom.DomHelper.prototype.getOwnerDocument = goog.dom.getOwnerDocument;
goog.dom.DomHelper.prototype.getFrameContentDocument = goog.dom.getFrameContentDocument;
goog.dom.DomHelper.prototype.getFrameContentWindow = goog.dom.getFrameContentWindow;
goog.dom.DomHelper.prototype.setTextContent = goog.dom.setTextContent;
goog.dom.DomHelper.prototype.getOuterHtml = goog.dom.getOuterHtml;
goog.dom.DomHelper.prototype.findNode = goog.dom.findNode;
goog.dom.DomHelper.prototype.findNodes = goog.dom.findNodes;
goog.dom.DomHelper.prototype.isFocusableTabIndex = goog.dom.isFocusableTabIndex;
goog.dom.DomHelper.prototype.setFocusableTabIndex = goog.dom.setFocusableTabIndex;
goog.dom.DomHelper.prototype.isFocusable = goog.dom.isFocusable;
goog.dom.DomHelper.prototype.getTextContent = goog.dom.getTextContent;
goog.dom.DomHelper.prototype.getNodeTextLength = goog.dom.getNodeTextLength;
goog.dom.DomHelper.prototype.getNodeTextOffset = goog.dom.getNodeTextOffset;
goog.dom.DomHelper.prototype.getNodeAtOffset = goog.dom.getNodeAtOffset;
goog.dom.DomHelper.prototype.isNodeList = goog.dom.isNodeList;
goog.dom.DomHelper.prototype.getAncestorByTagNameAndClass = goog.dom.getAncestorByTagNameAndClass;
goog.dom.DomHelper.prototype.getAncestorByClass = goog.dom.getAncestorByClass;
goog.dom.DomHelper.prototype.getAncestor = goog.dom.getAncestor;
goog.dom.DomHelper.prototype.getCanvasContext2D = goog.dom.getCanvasContext2D;
/*
 Portions of this code are from MochiKit, received by
 The Closure Authors under the MIT license. All other code is Copyright
 2005-2009 The Closure Authors. All Rights Reserved.
*/
goog.async.Deferred = function(opt_onCancelFunction, opt_defaultScope) {
  this.sequence_ = [];
  this.onCancelFunction_ = opt_onCancelFunction;
  this.defaultScope_ = opt_defaultScope || null;
  this.hadError_ = this.fired_ = !1;
  this.result_ = void 0;
  this.silentlyCanceled_ = this.blocking_ = this.blocked_ = !1;
  this.unhandledErrorId_ = 0;
  this.parent_ = null;
  this.branches_ = 0;
  if (goog.async.Deferred.LONG_STACK_TRACES && (this.constructorStack_ = null, Error.captureStackTrace)) {
    var target = {stack:""};
    Error.captureStackTrace(target, goog.async.Deferred);
    "string" == typeof target.stack && (this.constructorStack_ = target.stack.replace(/^[^\n]*\n/, ""));
  }
};
goog.async.Deferred.STRICT_ERRORS = !1;
goog.async.Deferred.LONG_STACK_TRACES = !1;
goog.async.Deferred.prototype.cancel = function(opt_deepCancel) {
  if (this.hasFired()) {
    this.result_ instanceof goog.async.Deferred && this.result_.cancel();
  } else {
    if (this.parent_) {
      var parent = this.parent_;
      delete this.parent_;
      opt_deepCancel ? parent.cancel(opt_deepCancel) : parent.branchCancel_();
    }
    this.onCancelFunction_ ? this.onCancelFunction_.call(this.defaultScope_, this) : this.silentlyCanceled_ = !0;
    this.hasFired() || this.errback(new goog.async.Deferred.CanceledError(this));
  }
};
goog.async.Deferred.prototype.branchCancel_ = function() {
  this.branches_--;
  0 >= this.branches_ && this.cancel();
};
goog.async.Deferred.prototype.continue_ = function(isSuccess, res) {
  this.blocked_ = !1;
  this.updateResult_(isSuccess, res);
};
goog.async.Deferred.prototype.updateResult_ = function(isSuccess, res) {
  this.fired_ = !0;
  this.result_ = res;
  this.hadError_ = !isSuccess;
  this.fire_();
};
goog.async.Deferred.prototype.check_ = function() {
  if (this.hasFired()) {
    if (!this.silentlyCanceled_) {
      throw new goog.async.Deferred.AlreadyCalledError(this);
    }
    this.silentlyCanceled_ = !1;
  }
};
goog.async.Deferred.prototype.callback = function(opt_result) {
  this.check_();
  this.assertNotDeferred_(opt_result);
  this.updateResult_(!0, opt_result);
};
goog.async.Deferred.prototype.errback = function(opt_result) {
  this.check_();
  this.assertNotDeferred_(opt_result);
  this.makeStackTraceLong_(opt_result);
  this.updateResult_(!1, opt_result);
};
goog.async.Deferred.prototype.makeStackTraceLong_ = function(error) {
  goog.async.Deferred.LONG_STACK_TRACES && this.constructorStack_ && goog.isObject(error) && error.stack && /^[^\n]+(\n   [^\n]+)+/.test(error.stack) && (error.stack = error.stack + "\nDEFERRED OPERATION:\n" + this.constructorStack_);
};
goog.async.Deferred.prototype.assertNotDeferred_ = function(obj) {
  goog.asserts.assert(!(obj instanceof goog.async.Deferred), "An execution sequence may not be initiated with a blocking Deferred.");
};
goog.async.Deferred.prototype.addCallback = function(cb, opt_scope) {
  return this.addCallbacks(cb, null, opt_scope);
};
goog.async.Deferred.prototype.addErrback = function(eb, opt_scope) {
  return this.addCallbacks(null, eb, opt_scope);
};
goog.async.Deferred.prototype.addBoth = function(f, opt_scope) {
  return this.addCallbacks(f, f, opt_scope);
};
goog.async.Deferred.prototype.addFinally = function(f, opt_scope) {
  return this.addCallbacks(f, function(err) {
    var result = f.call(this, err);
    if (!goog.isDef(result)) {
      throw err;
    }
    return result;
  }, opt_scope);
};
goog.async.Deferred.prototype.addCallbacks = function(cb, eb, opt_scope) {
  goog.asserts.assert(!this.blocking_, "Blocking Deferreds can not be re-used");
  this.sequence_.push([cb, eb, opt_scope]);
  this.hasFired() && this.fire_();
  return this;
};
goog.async.Deferred.prototype.then = function(opt_onFulfilled, opt_onRejected, opt_context) {
  var resolve, reject, promise = new goog.Promise(function(res, rej) {
    resolve = res;
    reject = rej;
  });
  this.addCallbacks(resolve, function(reason) {
    reason instanceof goog.async.Deferred.CanceledError ? promise.cancel() : reject(reason);
  });
  return promise.then(opt_onFulfilled, opt_onRejected, opt_context);
};
goog.Thenable.addImplementation(goog.async.Deferred);
goog.async.Deferred.prototype.chainDeferred = function(otherDeferred) {
  this.addCallbacks(otherDeferred.callback, otherDeferred.errback, otherDeferred);
  return this;
};
goog.async.Deferred.prototype.awaitDeferred = function(otherDeferred) {
  return otherDeferred instanceof goog.async.Deferred ? this.addCallback(goog.bind(otherDeferred.branch, otherDeferred)) : this.addCallback(function() {
    return otherDeferred;
  });
};
goog.async.Deferred.prototype.branch = function(opt_propagateCancel) {
  var d = new goog.async.Deferred;
  this.chainDeferred(d);
  opt_propagateCancel && (d.parent_ = this, this.branches_++);
  return d;
};
goog.async.Deferred.prototype.hasFired = function() {
  return this.fired_;
};
goog.async.Deferred.prototype.isError = function(res) {
  return res instanceof Error;
};
goog.async.Deferred.prototype.hasErrback_ = function() {
  return goog.array.some(this.sequence_, function(sequenceRow) {
    return goog.isFunction(sequenceRow[1]);
  });
};
goog.async.Deferred.prototype.fire_ = function() {
  this.unhandledErrorId_ && this.hasFired() && this.hasErrback_() && (goog.async.Deferred.unscheduleError_(this.unhandledErrorId_), this.unhandledErrorId_ = 0);
  this.parent_ && (this.parent_.branches_--, delete this.parent_);
  for (var res = this.result_, unhandledException = !1, isNewlyBlocked = !1; this.sequence_.length && !this.blocked_;) {
    var sequenceEntry = this.sequence_.shift(), callback = sequenceEntry[0], errback = sequenceEntry[1], scope = sequenceEntry[2], f = this.hadError_ ? errback : callback;
    if (f) {
      try {
        var ret = f.call(scope || this.defaultScope_, res);
        goog.isDef(ret) && (this.hadError_ = this.hadError_ && (ret == res || this.isError(ret)), this.result_ = res = ret);
        if (goog.Thenable.isImplementedBy(res) || "function" === typeof goog.global.Promise && res instanceof goog.global.Promise) {
          this.blocked_ = isNewlyBlocked = !0;
        }
      } catch (ex) {
        res = ex, this.hadError_ = !0, this.makeStackTraceLong_(res), this.hasErrback_() || (unhandledException = !0);
      }
    }
  }
  this.result_ = res;
  if (isNewlyBlocked) {
    var onCallback = goog.bind(this.continue_, this, !0), onErrback = goog.bind(this.continue_, this, !1);
    res instanceof goog.async.Deferred ? (res.addCallbacks(onCallback, onErrback), res.blocking_ = !0) : res.then(onCallback, onErrback);
  } else {
    !goog.async.Deferred.STRICT_ERRORS || !this.isError(res) || res instanceof goog.async.Deferred.CanceledError || (unhandledException = this.hadError_ = !0);
  }
  unhandledException && (this.unhandledErrorId_ = goog.async.Deferred.scheduleError_(res));
};
goog.async.Deferred.succeed = function(opt_result) {
  var d = new goog.async.Deferred;
  d.callback(opt_result);
  return d;
};
goog.async.Deferred.fromPromise = function(promise) {
  var d = new goog.async.Deferred;
  promise.then(function(value) {
    d.callback(value);
  }, function(error) {
    d.errback(error);
  });
  return d;
};
goog.async.Deferred.fail = function(res) {
  var d = new goog.async.Deferred;
  d.errback(res);
  return d;
};
goog.async.Deferred.canceled = function() {
  var d = new goog.async.Deferred;
  d.cancel();
  return d;
};
goog.async.Deferred.when = function(value, callback, opt_scope) {
  return value instanceof goog.async.Deferred ? value.branch(!0).addCallback(callback, opt_scope) : goog.async.Deferred.succeed(value).addCallback(callback, opt_scope);
};
goog.async.Deferred.AlreadyCalledError = function(deferred) {
  goog.debug.Error.call(this);
  this.deferred = deferred;
};
goog.inherits(goog.async.Deferred.AlreadyCalledError, goog.debug.Error);
goog.async.Deferred.AlreadyCalledError.prototype.message = "Deferred has already fired";
goog.async.Deferred.AlreadyCalledError.prototype.name = "AlreadyCalledError";
goog.async.Deferred.CanceledError = function(deferred) {
  goog.debug.Error.call(this);
  this.deferred = deferred;
};
goog.inherits(goog.async.Deferred.CanceledError, goog.debug.Error);
goog.async.Deferred.CanceledError.prototype.message = "Deferred was canceled";
goog.async.Deferred.CanceledError.prototype.name = "CanceledError";
goog.async.Deferred.Error_ = function(error) {
  this.id_ = goog.global.setTimeout(goog.bind(this.throwError, this), 0);
  this.error_ = error;
};
goog.async.Deferred.Error_.prototype.throwError = function() {
  goog.asserts.assert(goog.async.Deferred.errorMap_[this.id_], "Cannot throw an error that is not scheduled.");
  delete goog.async.Deferred.errorMap_[this.id_];
  throw this.error_;
};
goog.async.Deferred.Error_.prototype.resetTimer = function() {
  goog.global.clearTimeout(this.id_);
};
goog.async.Deferred.errorMap_ = {};
goog.async.Deferred.scheduleError_ = function(error) {
  var deferredError = new goog.async.Deferred.Error_(error);
  goog.async.Deferred.errorMap_[deferredError.id_] = deferredError;
  return deferredError.id_;
};
goog.async.Deferred.unscheduleError_ = function(id) {
  var error = goog.async.Deferred.errorMap_[id];
  error && (error.resetTimer(), delete goog.async.Deferred.errorMap_[id]);
};
goog.async.Deferred.assertNoErrors = function() {
  var map = goog.async.Deferred.errorMap_, key;
  for (key in map) {
    var error = map[key];
    error.resetTimer();
    error.throwError();
  }
};
goog.net = {};
goog.net.jsloader = {};
goog.net.jsloader.GLOBAL_VERIFY_OBJS_ = "closure_verification";
goog.net.jsloader.DEFAULT_TIMEOUT = 5000;
goog.net.jsloader.scriptsToLoad_ = [];
goog.net.jsloader.safeLoadMany = function(trustedUris, opt_options) {
  if (!trustedUris.length) {
    return goog.async.Deferred.succeed(null);
  }
  var isAnotherModuleLoading = goog.net.jsloader.scriptsToLoad_.length;
  goog.array.extend(goog.net.jsloader.scriptsToLoad_, trustedUris);
  if (isAnotherModuleLoading) {
    return goog.net.jsloader.scriptLoadingDeferred_;
  }
  trustedUris = goog.net.jsloader.scriptsToLoad_;
  var popAndLoadNextScript = function() {
    var trustedUri = trustedUris.shift(), deferred = goog.net.jsloader.safeLoad(trustedUri, opt_options);
    trustedUris.length && deferred.addBoth(popAndLoadNextScript);
    return deferred;
  };
  goog.net.jsloader.scriptLoadingDeferred_ = popAndLoadNextScript();
  return goog.net.jsloader.scriptLoadingDeferred_;
};
goog.net.jsloader.safeLoad = function(trustedUri, opt_options) {
  var options = opt_options || {}, doc = options.document || document, uri = goog.html.TrustedResourceUrl.unwrap(trustedUri), script = goog.dom.createElement("SCRIPT"), request = {script_:script, timeout_:void 0}, deferred = new goog.async.Deferred(goog.net.jsloader.cancel_, request), timeout = null, timeoutDuration = goog.isDefAndNotNull(options.timeout) ? options.timeout : goog.net.jsloader.DEFAULT_TIMEOUT;
  0 < timeoutDuration && (timeout = window.setTimeout(function() {
    goog.net.jsloader.cleanup_(script, !0);
    deferred.errback(new goog.net.jsloader.Error(goog.net.jsloader.ErrorCode.TIMEOUT, "Timeout reached for loading script " + uri));
  }, timeoutDuration), request.timeout_ = timeout);
  script.onload = script.onreadystatechange = function() {
    script.readyState && "loaded" != script.readyState && "complete" != script.readyState || (goog.net.jsloader.cleanup_(script, options.cleanupWhenDone || !1, timeout), deferred.callback(null));
  };
  script.onerror = function() {
    goog.net.jsloader.cleanup_(script, !0, timeout);
    deferred.errback(new goog.net.jsloader.Error(goog.net.jsloader.ErrorCode.LOAD_ERROR, "Error while loading script " + uri));
  };
  var properties = options.attributes || {};
  goog.object.extend(properties, {type:"text/javascript", charset:"UTF-8"});
  goog.dom.setProperties(script, properties);
  goog.dom.safe.setScriptSrc(script, trustedUri);
  goog.net.jsloader.getScriptParentElement_(doc).appendChild(script);
  return deferred;
};
goog.net.jsloader.safeLoadAndVerify = function(trustedUri, verificationObjName, options) {
  goog.global[goog.net.jsloader.GLOBAL_VERIFY_OBJS_] || (goog.global[goog.net.jsloader.GLOBAL_VERIFY_OBJS_] = {});
  var verifyObjs = goog.global[goog.net.jsloader.GLOBAL_VERIFY_OBJS_], uri = goog.html.TrustedResourceUrl.unwrap(trustedUri);
  if (goog.isDef(verifyObjs[verificationObjName])) {
    return goog.async.Deferred.fail(new goog.net.jsloader.Error(goog.net.jsloader.ErrorCode.VERIFY_OBJECT_ALREADY_EXISTS, "Verification object " + verificationObjName + " already defined."));
  }
  var sendDeferred = goog.net.jsloader.safeLoad(trustedUri, options), deferred = new goog.async.Deferred(goog.bind(sendDeferred.cancel, sendDeferred));
  sendDeferred.addCallback(function() {
    var result = verifyObjs[verificationObjName];
    goog.isDef(result) ? (deferred.callback(result), delete verifyObjs[verificationObjName]) : deferred.errback(new goog.net.jsloader.Error(goog.net.jsloader.ErrorCode.VERIFY_ERROR, "Script " + uri + " loaded, but verification object " + verificationObjName + " was not defined."));
  });
  sendDeferred.addErrback(function(error) {
    goog.isDef(verifyObjs[verificationObjName]) && delete verifyObjs[verificationObjName];
    deferred.errback(error);
  });
  return deferred;
};
goog.net.jsloader.getScriptParentElement_ = function(doc) {
  var headElements = goog.dom.getElementsByTagName("HEAD", doc);
  return !headElements || goog.array.isEmpty(headElements) ? doc.documentElement : headElements[0];
};
goog.net.jsloader.cancel_ = function() {
  if (this && this.script_) {
    var scriptNode = this.script_;
    scriptNode && "SCRIPT" == scriptNode.tagName && goog.net.jsloader.cleanup_(scriptNode, !0, this.timeout_);
  }
};
goog.net.jsloader.cleanup_ = function(scriptNode, removeScriptNode, opt_timeout) {
  goog.isDefAndNotNull(opt_timeout) && goog.global.clearTimeout(opt_timeout);
  scriptNode.onload = goog.nullFunction;
  scriptNode.onerror = goog.nullFunction;
  scriptNode.onreadystatechange = goog.nullFunction;
  removeScriptNode && window.setTimeout(function() {
    goog.dom.removeNode(scriptNode);
  }, 0);
};
goog.net.jsloader.ErrorCode = {LOAD_ERROR:0, TIMEOUT:1, VERIFY_ERROR:2, VERIFY_OBJECT_ALREADY_EXISTS:3};
goog.net.jsloader.Error = function(code, opt_message) {
  var msg = "Jsloader error (code #" + code + ")";
  opt_message && (msg += ": " + opt_message);
  goog.debug.Error.call(this, msg);
  this.code = code;
};
goog.inherits(goog.net.jsloader.Error, goog.debug.Error);
goog.json.hybrid = {};
goog.json.hybrid.stringify = goog.json.USE_NATIVE_JSON ? goog.global.JSON.stringify : function(obj) {
  if (goog.global.JSON) {
    try {
      return goog.global.JSON.stringify(obj);
    } catch (e) {
    }
  }
  return goog.json.serialize(obj);
};
goog.json.hybrid.parse_ = function(jsonString, fallbackParser) {
  if (goog.global.JSON) {
    try {
      var obj = goog.global.JSON.parse(jsonString);
      goog.asserts.assert("object" == typeof obj);
      return obj;
    } catch (e) {
    }
  }
  return fallbackParser(jsonString);
};
goog.json.hybrid.parse = goog.json.USE_NATIVE_JSON ? goog.global.JSON.parse : function(jsonString) {
  return goog.json.hybrid.parse_(jsonString, goog.json.parse);
};
goog.debug.LogRecord = function(level, msg, loggerName, opt_time, opt_sequenceNumber) {
  this.reset(level, msg, loggerName, opt_time, opt_sequenceNumber);
};
goog.debug.LogRecord.prototype.sequenceNumber_ = 0;
goog.debug.LogRecord.prototype.exception_ = null;
goog.debug.LogRecord.ENABLE_SEQUENCE_NUMBERS = !0;
goog.debug.LogRecord.nextSequenceNumber_ = 0;
goog.debug.LogRecord.prototype.reset = function(level, msg, loggerName, opt_time, opt_sequenceNumber) {
  goog.debug.LogRecord.ENABLE_SEQUENCE_NUMBERS && (this.sequenceNumber_ = "number" == typeof opt_sequenceNumber ? opt_sequenceNumber : goog.debug.LogRecord.nextSequenceNumber_++);
  this.time_ = opt_time || goog.now();
  this.level_ = level;
  this.msg_ = msg;
  this.loggerName_ = loggerName;
  delete this.exception_;
};
goog.debug.LogRecord.prototype.getLoggerName = function() {
  return this.loggerName_;
};
goog.debug.LogRecord.prototype.getException = function() {
  return this.exception_;
};
goog.debug.LogRecord.prototype.setException = function(exception) {
  this.exception_ = exception;
};
goog.debug.LogRecord.prototype.setLoggerName = function(loggerName) {
  this.loggerName_ = loggerName;
};
goog.debug.LogRecord.prototype.getLevel = function() {
  return this.level_;
};
goog.debug.LogRecord.prototype.setLevel = function(level) {
  this.level_ = level;
};
goog.debug.LogRecord.prototype.getMessage = function() {
  return this.msg_;
};
goog.debug.LogRecord.prototype.setMessage = function(msg) {
  this.msg_ = msg;
};
goog.debug.LogRecord.prototype.getMillis = function() {
  return this.time_;
};
goog.debug.LogRecord.prototype.setMillis = function(time) {
  this.time_ = time;
};
goog.debug.LogRecord.prototype.getSequenceNumber = function() {
  return this.sequenceNumber_;
};
goog.debug.LogBuffer = function() {
  goog.asserts.assert(goog.debug.LogBuffer.isBufferingEnabled(), "Cannot use goog.debug.LogBuffer without defining goog.debug.LogBuffer.CAPACITY.");
  this.clear();
};
goog.debug.LogBuffer.getInstance = function() {
  goog.debug.LogBuffer.instance_ || (goog.debug.LogBuffer.instance_ = new goog.debug.LogBuffer);
  return goog.debug.LogBuffer.instance_;
};
goog.debug.LogBuffer.CAPACITY = 0;
goog.debug.LogBuffer.prototype.addRecord = function(level, msg, loggerName) {
  var curIndex = (this.curIndex_ + 1) % goog.debug.LogBuffer.CAPACITY;
  this.curIndex_ = curIndex;
  if (this.isFull_) {
    var ret = this.buffer_[curIndex];
    ret.reset(level, msg, loggerName);
    return ret;
  }
  this.isFull_ = curIndex == goog.debug.LogBuffer.CAPACITY - 1;
  return this.buffer_[curIndex] = new goog.debug.LogRecord(level, msg, loggerName);
};
goog.debug.LogBuffer.isBufferingEnabled = function() {
  return 0 < goog.debug.LogBuffer.CAPACITY;
};
goog.debug.LogBuffer.prototype.clear = function() {
  this.buffer_ = Array(goog.debug.LogBuffer.CAPACITY);
  this.curIndex_ = -1;
  this.isFull_ = !1;
};
goog.debug.LogBuffer.prototype.forEachRecord = function(func) {
  var buffer = this.buffer_;
  if (buffer[0]) {
    var curIndex = this.curIndex_, i = this.isFull_ ? curIndex : -1;
    do {
      i = (i + 1) % goog.debug.LogBuffer.CAPACITY, func(buffer[i]);
    } while (i != curIndex);
  }
};
goog.debug.Logger = function(name) {
  this.name_ = name;
  this.handlers_ = this.children_ = this.level_ = this.parent_ = null;
};
goog.debug.Logger.ROOT_LOGGER_NAME = "";
goog.debug.Logger.ENABLE_HIERARCHY = !0;
goog.debug.Logger.ENABLE_PROFILER_LOGGING = !1;
goog.debug.Logger.ENABLE_HIERARCHY || (goog.debug.Logger.rootHandlers_ = []);
goog.debug.Logger.Level = function(name, value) {
  this.name = name;
  this.value = value;
};
goog.debug.Logger.Level.prototype.toString = function() {
  return this.name;
};
goog.debug.Logger.Level.OFF = new goog.debug.Logger.Level("OFF", Infinity);
goog.debug.Logger.Level.SHOUT = new goog.debug.Logger.Level("SHOUT", 1200);
goog.debug.Logger.Level.SEVERE = new goog.debug.Logger.Level("SEVERE", 1000);
goog.debug.Logger.Level.WARNING = new goog.debug.Logger.Level("WARNING", 900);
goog.debug.Logger.Level.INFO = new goog.debug.Logger.Level("INFO", 800);
goog.debug.Logger.Level.CONFIG = new goog.debug.Logger.Level("CONFIG", 700);
goog.debug.Logger.Level.FINE = new goog.debug.Logger.Level("FINE", 500);
goog.debug.Logger.Level.FINER = new goog.debug.Logger.Level("FINER", 400);
goog.debug.Logger.Level.FINEST = new goog.debug.Logger.Level("FINEST", 300);
goog.debug.Logger.Level.ALL = new goog.debug.Logger.Level("ALL", 0);
goog.debug.Logger.Level.PREDEFINED_LEVELS = [goog.debug.Logger.Level.OFF, goog.debug.Logger.Level.SHOUT, goog.debug.Logger.Level.SEVERE, goog.debug.Logger.Level.WARNING, goog.debug.Logger.Level.INFO, goog.debug.Logger.Level.CONFIG, goog.debug.Logger.Level.FINE, goog.debug.Logger.Level.FINER, goog.debug.Logger.Level.FINEST, goog.debug.Logger.Level.ALL];
goog.debug.Logger.Level.predefinedLevelsCache_ = null;
goog.debug.Logger.Level.createPredefinedLevelsCache_ = function() {
  goog.debug.Logger.Level.predefinedLevelsCache_ = {};
  for (var i = 0, level; level = goog.debug.Logger.Level.PREDEFINED_LEVELS[i]; i++) {
    goog.debug.Logger.Level.predefinedLevelsCache_[level.value] = level, goog.debug.Logger.Level.predefinedLevelsCache_[level.name] = level;
  }
};
goog.debug.Logger.Level.getPredefinedLevel = function(name) {
  goog.debug.Logger.Level.predefinedLevelsCache_ || goog.debug.Logger.Level.createPredefinedLevelsCache_();
  return goog.debug.Logger.Level.predefinedLevelsCache_[name] || null;
};
goog.debug.Logger.Level.getPredefinedLevelByValue = function(value) {
  goog.debug.Logger.Level.predefinedLevelsCache_ || goog.debug.Logger.Level.createPredefinedLevelsCache_();
  if (value in goog.debug.Logger.Level.predefinedLevelsCache_) {
    return goog.debug.Logger.Level.predefinedLevelsCache_[value];
  }
  for (var i = 0; i < goog.debug.Logger.Level.PREDEFINED_LEVELS.length; ++i) {
    var level = goog.debug.Logger.Level.PREDEFINED_LEVELS[i];
    if (level.value <= value) {
      return level;
    }
  }
  return null;
};
goog.debug.Logger.getLogger = function(name) {
  return goog.debug.LogManager.getLogger(name);
};
goog.debug.Logger.logToProfilers = function(msg) {
  if (goog.debug.Logger.ENABLE_PROFILER_LOGGING) {
    var msWriteProfilerMark = goog.global.msWriteProfilerMark;
    if (msWriteProfilerMark) {
      msWriteProfilerMark(msg);
    } else {
      var console = goog.global.console;
      console && console.timeStamp && console.timeStamp(msg);
    }
  }
};
goog.debug.Logger.prototype.getName = function() {
  return this.name_;
};
goog.debug.Logger.prototype.addHandler = function(handler) {
  goog.debug.LOGGING_ENABLED && (goog.debug.Logger.ENABLE_HIERARCHY ? (this.handlers_ || (this.handlers_ = []), this.handlers_.push(handler)) : (goog.asserts.assert(!this.name_, "Cannot call addHandler on a non-root logger when goog.debug.Logger.ENABLE_HIERARCHY is false."), goog.debug.Logger.rootHandlers_.push(handler)));
};
goog.debug.Logger.prototype.removeHandler = function(handler) {
  if (goog.debug.LOGGING_ENABLED) {
    var handlers = goog.debug.Logger.ENABLE_HIERARCHY ? this.handlers_ : goog.debug.Logger.rootHandlers_;
    return !!handlers && goog.array.remove(handlers, handler);
  }
  return !1;
};
goog.debug.Logger.prototype.getParent = function() {
  return this.parent_;
};
goog.debug.Logger.prototype.getChildren = function() {
  this.children_ || (this.children_ = {});
  return this.children_;
};
goog.debug.Logger.prototype.setLevel = function(level) {
  goog.debug.LOGGING_ENABLED && (goog.debug.Logger.ENABLE_HIERARCHY ? this.level_ = level : (goog.asserts.assert(!this.name_, "Cannot call setLevel() on a non-root logger when goog.debug.Logger.ENABLE_HIERARCHY is false."), goog.debug.Logger.rootLevel_ = level));
};
goog.debug.Logger.prototype.getLevel = function() {
  return goog.debug.LOGGING_ENABLED ? this.level_ : goog.debug.Logger.Level.OFF;
};
goog.debug.Logger.prototype.getEffectiveLevel = function() {
  if (!goog.debug.LOGGING_ENABLED) {
    return goog.debug.Logger.Level.OFF;
  }
  if (!goog.debug.Logger.ENABLE_HIERARCHY) {
    return goog.debug.Logger.rootLevel_;
  }
  if (this.level_) {
    return this.level_;
  }
  if (this.parent_) {
    return this.parent_.getEffectiveLevel();
  }
  goog.asserts.fail("Root logger has no level set.");
  return null;
};
goog.debug.Logger.prototype.isLoggable = function(level) {
  return goog.debug.LOGGING_ENABLED && level.value >= this.getEffectiveLevel().value;
};
goog.debug.Logger.prototype.log = function(level, msg, opt_exception) {
  goog.debug.LOGGING_ENABLED && this.isLoggable(level) && (goog.isFunction(msg) && (msg = msg()), this.doLogRecord_(this.getLogRecord(level, msg, opt_exception)));
};
goog.debug.Logger.prototype.getLogRecord = function(level, msg, opt_exception) {
  var logRecord = goog.debug.LogBuffer.isBufferingEnabled() ? goog.debug.LogBuffer.getInstance().addRecord(level, msg, this.name_) : new goog.debug.LogRecord(level, String(msg), this.name_);
  opt_exception && logRecord.setException(opt_exception);
  return logRecord;
};
goog.debug.Logger.prototype.shout = function(msg, opt_exception) {
  goog.debug.LOGGING_ENABLED && this.log(goog.debug.Logger.Level.SHOUT, msg, opt_exception);
};
goog.debug.Logger.prototype.severe = function(msg, opt_exception) {
  goog.debug.LOGGING_ENABLED && this.log(goog.debug.Logger.Level.SEVERE, msg, opt_exception);
};
goog.debug.Logger.prototype.warning = function(msg, opt_exception) {
  goog.debug.LOGGING_ENABLED && this.log(goog.debug.Logger.Level.WARNING, msg, opt_exception);
};
goog.debug.Logger.prototype.info = function(msg, opt_exception) {
  goog.debug.LOGGING_ENABLED && this.log(goog.debug.Logger.Level.INFO, msg, opt_exception);
};
goog.debug.Logger.prototype.config = function(msg, opt_exception) {
  goog.debug.LOGGING_ENABLED && this.log(goog.debug.Logger.Level.CONFIG, msg, opt_exception);
};
goog.debug.Logger.prototype.fine = function(msg, opt_exception) {
  goog.debug.LOGGING_ENABLED && this.log(goog.debug.Logger.Level.FINE, msg, opt_exception);
};
goog.debug.Logger.prototype.finer = function(msg, opt_exception) {
  goog.debug.LOGGING_ENABLED && this.log(goog.debug.Logger.Level.FINER, msg, opt_exception);
};
goog.debug.Logger.prototype.finest = function(msg, opt_exception) {
  goog.debug.LOGGING_ENABLED && this.log(goog.debug.Logger.Level.FINEST, msg, opt_exception);
};
goog.debug.Logger.prototype.logRecord = function(logRecord) {
  goog.debug.LOGGING_ENABLED && this.isLoggable(logRecord.getLevel()) && this.doLogRecord_(logRecord);
};
goog.debug.Logger.prototype.doLogRecord_ = function(logRecord) {
  goog.debug.Logger.ENABLE_PROFILER_LOGGING && goog.debug.Logger.logToProfilers("log:" + logRecord.getMessage());
  if (goog.debug.Logger.ENABLE_HIERARCHY) {
    for (var target = this; target;) {
      target.callPublish_(logRecord), target = target.getParent();
    }
  } else {
    for (var i = 0, handler; handler = goog.debug.Logger.rootHandlers_[i++];) {
      handler(logRecord);
    }
  }
};
goog.debug.Logger.prototype.callPublish_ = function(logRecord) {
  if (this.handlers_) {
    for (var i = 0, handler; handler = this.handlers_[i]; i++) {
      handler(logRecord);
    }
  }
};
goog.debug.Logger.prototype.setParent_ = function(parent) {
  this.parent_ = parent;
};
goog.debug.Logger.prototype.addChild_ = function(name, logger) {
  this.getChildren()[name] = logger;
};
goog.debug.LogManager = {};
goog.debug.LogManager.loggers_ = {};
goog.debug.LogManager.rootLogger_ = null;
goog.debug.LogManager.initialize = function() {
  goog.debug.LogManager.rootLogger_ || (goog.debug.LogManager.rootLogger_ = new goog.debug.Logger(goog.debug.Logger.ROOT_LOGGER_NAME), goog.debug.LogManager.loggers_[goog.debug.Logger.ROOT_LOGGER_NAME] = goog.debug.LogManager.rootLogger_, goog.debug.LogManager.rootLogger_.setLevel(goog.debug.Logger.Level.CONFIG));
};
goog.debug.LogManager.getLoggers = function() {
  return goog.debug.LogManager.loggers_;
};
goog.debug.LogManager.getRoot = function() {
  goog.debug.LogManager.initialize();
  return goog.debug.LogManager.rootLogger_;
};
goog.debug.LogManager.getLogger = function(name) {
  goog.debug.LogManager.initialize();
  return goog.debug.LogManager.loggers_[name] || goog.debug.LogManager.createLogger_(name);
};
goog.debug.LogManager.createFunctionForCatchErrors = function(opt_logger) {
  return function(info) {
    (opt_logger || goog.debug.LogManager.getRoot()).severe("Error: " + info.message + " (" + info.fileName + " @ Line: " + info.line + ")");
  };
};
goog.debug.LogManager.createLogger_ = function(name) {
  var logger = new goog.debug.Logger(name);
  if (goog.debug.Logger.ENABLE_HIERARCHY) {
    var lastDotIndex = name.lastIndexOf("."), leafName = name.substr(lastDotIndex + 1), parentLogger = goog.debug.LogManager.getLogger(name.substr(0, lastDotIndex));
    parentLogger.addChild_(leafName, logger);
    logger.setParent_(parentLogger);
  }
  return goog.debug.LogManager.loggers_[name] = logger;
};
goog.log = {};
goog.log.ENABLED = goog.debug.LOGGING_ENABLED;
goog.log.ROOT_LOGGER_NAME = goog.debug.Logger.ROOT_LOGGER_NAME;
goog.log.Logger = goog.debug.Logger;
goog.log.Level = goog.debug.Logger.Level;
goog.log.LogRecord = goog.debug.LogRecord;
goog.log.getLogger = function(name, opt_level) {
  if (goog.log.ENABLED) {
    var logger = goog.debug.LogManager.getLogger(name);
    opt_level && logger && logger.setLevel(opt_level);
    return logger;
  }
  return null;
};
goog.log.addHandler = function(logger, handler) {
  goog.log.ENABLED && logger && logger.addHandler(handler);
};
goog.log.removeHandler = function(logger, handler) {
  return goog.log.ENABLED && logger ? logger.removeHandler(handler) : !1;
};
goog.log.log = function(logger, level, msg, opt_exception) {
  goog.log.ENABLED && logger && logger.log(level, msg, opt_exception);
};
goog.log.error = function(logger, msg, opt_exception) {
  goog.log.ENABLED && logger && logger.severe(msg, opt_exception);
};
goog.log.warning = function(logger, msg, opt_exception) {
  goog.log.ENABLED && logger && logger.warning(msg, opt_exception);
};
goog.log.info = function(logger, msg, opt_exception) {
  goog.log.ENABLED && logger && logger.info(msg, opt_exception);
};
goog.log.fine = function(logger, msg, opt_exception) {
  goog.log.ENABLED && logger && logger.fine(msg, opt_exception);
};
goog.net.ErrorCode = {NO_ERROR:0, ACCESS_DENIED:1, FILE_NOT_FOUND:2, FF_SILENT_ERROR:3, CUSTOM_ERROR:4, EXCEPTION:5, HTTP_ERROR:6, ABORT:7, TIMEOUT:8, OFFLINE:9};
goog.net.ErrorCode.getDebugMessage = function(errorCode) {
  switch(errorCode) {
    case goog.net.ErrorCode.NO_ERROR:
      return "No Error";
    case goog.net.ErrorCode.ACCESS_DENIED:
      return "Access denied to content document";
    case goog.net.ErrorCode.FILE_NOT_FOUND:
      return "File not found";
    case goog.net.ErrorCode.FF_SILENT_ERROR:
      return "Firefox silently errored";
    case goog.net.ErrorCode.CUSTOM_ERROR:
      return "Application custom error";
    case goog.net.ErrorCode.EXCEPTION:
      return "An exception occurred";
    case goog.net.ErrorCode.HTTP_ERROR:
      return "Http response at 400 or 500 level";
    case goog.net.ErrorCode.ABORT:
      return "Request was aborted";
    case goog.net.ErrorCode.TIMEOUT:
      return "Request timed out";
    case goog.net.ErrorCode.OFFLINE:
      return "The resource is not available offline";
    default:
      return "Unrecognized error code";
  }
};
goog.net.EventType = {COMPLETE:"complete", SUCCESS:"success", ERROR:"error", ABORT:"abort", READY:"ready", READY_STATE_CHANGE:"readystatechange", TIMEOUT:"timeout", INCREMENTAL_DATA:"incrementaldata", PROGRESS:"progress", DOWNLOAD_PROGRESS:"downloadprogress", UPLOAD_PROGRESS:"uploadprogress"};
goog.net.HttpStatus = {CONTINUE:100, SWITCHING_PROTOCOLS:101, OK:200, CREATED:201, ACCEPTED:202, NON_AUTHORITATIVE_INFORMATION:203, NO_CONTENT:204, RESET_CONTENT:205, PARTIAL_CONTENT:206, MULTI_STATUS:207, MULTIPLE_CHOICES:300, MOVED_PERMANENTLY:301, FOUND:302, SEE_OTHER:303, NOT_MODIFIED:304, USE_PROXY:305, TEMPORARY_REDIRECT:307, PERMANENT_REDIRECT:308, BAD_REQUEST:400, UNAUTHORIZED:401, PAYMENT_REQUIRED:402, FORBIDDEN:403, NOT_FOUND:404, METHOD_NOT_ALLOWED:405, NOT_ACCEPTABLE:406, PROXY_AUTHENTICATION_REQUIRED:407, 
REQUEST_TIMEOUT:408, CONFLICT:409, GONE:410, LENGTH_REQUIRED:411, PRECONDITION_FAILED:412, REQUEST_ENTITY_TOO_LARGE:413, REQUEST_URI_TOO_LONG:414, UNSUPPORTED_MEDIA_TYPE:415, REQUEST_RANGE_NOT_SATISFIABLE:416, EXPECTATION_FAILED:417, UNPROCESSABLE_ENTITY:422, LOCKED:423, FAILED_DEPENDENCY:424, PRECONDITION_REQUIRED:428, TOO_MANY_REQUESTS:429, REQUEST_HEADER_FIELDS_TOO_LARGE:431, INTERNAL_SERVER_ERROR:500, NOT_IMPLEMENTED:501, BAD_GATEWAY:502, SERVICE_UNAVAILABLE:503, GATEWAY_TIMEOUT:504, HTTP_VERSION_NOT_SUPPORTED:505, 
INSUFFICIENT_STORAGE:507, NETWORK_AUTHENTICATION_REQUIRED:511, QUIRK_IE_NO_CONTENT:1223};
goog.net.HttpStatus.isSuccess = function(status) {
  switch(status) {
    case goog.net.HttpStatus.OK:
    case goog.net.HttpStatus.CREATED:
    case goog.net.HttpStatus.ACCEPTED:
    case goog.net.HttpStatus.NO_CONTENT:
    case goog.net.HttpStatus.PARTIAL_CONTENT:
    case goog.net.HttpStatus.NOT_MODIFIED:
    case goog.net.HttpStatus.QUIRK_IE_NO_CONTENT:
      return !0;
    default:
      return !1;
  }
};
goog.net.XhrLike = function() {
};
goog.net.XhrLike.prototype.open = function(method, url, opt_async, opt_user, opt_password) {
};
goog.net.XhrLike.prototype.send = function(opt_data) {
};
goog.net.XhrLike.prototype.abort = function() {
};
goog.net.XhrLike.prototype.setRequestHeader = function(header, value) {
};
goog.net.XhrLike.prototype.getResponseHeader = function(header) {
};
goog.net.XhrLike.prototype.getAllResponseHeaders = function() {
};
goog.net.XmlHttpFactory = function() {
};
goog.net.XmlHttpFactory.prototype.cachedOptions_ = null;
goog.net.XmlHttpFactory.prototype.getOptions = function() {
  return this.cachedOptions_ || (this.cachedOptions_ = this.internalGetOptions());
};
goog.net.WrapperXmlHttpFactory = function(xhrFactory, optionsFactory) {
  this.xhrFactory_ = xhrFactory;
  this.optionsFactory_ = optionsFactory;
};
goog.inherits(goog.net.WrapperXmlHttpFactory, goog.net.XmlHttpFactory);
goog.net.WrapperXmlHttpFactory.prototype.createInstance = function() {
  return this.xhrFactory_();
};
goog.net.WrapperXmlHttpFactory.prototype.getOptions = function() {
  return this.optionsFactory_();
};
goog.net.XmlHttp = function() {
  return goog.net.XmlHttp.factory_.createInstance();
};
goog.net.XmlHttp.ASSUME_NATIVE_XHR = !1;
goog.net.XmlHttpDefines = {};
goog.net.XmlHttpDefines.ASSUME_NATIVE_XHR = !1;
goog.net.XmlHttp.getOptions = function() {
  return goog.net.XmlHttp.factory_.getOptions();
};
goog.net.XmlHttp.OptionType = {USE_NULL_FUNCTION:0, LOCAL_REQUEST_ERROR:1};
goog.net.XmlHttp.ReadyState = {UNINITIALIZED:0, LOADING:1, LOADED:2, INTERACTIVE:3, COMPLETE:4};
goog.net.XmlHttp.setFactory = function(factory, optionsFactory) {
  goog.net.XmlHttp.setGlobalFactory(new goog.net.WrapperXmlHttpFactory(goog.asserts.assert(factory), goog.asserts.assert(optionsFactory)));
};
goog.net.XmlHttp.setGlobalFactory = function(factory) {
  goog.net.XmlHttp.factory_ = factory;
};
goog.net.DefaultXmlHttpFactory = function() {
};
goog.inherits(goog.net.DefaultXmlHttpFactory, goog.net.XmlHttpFactory);
goog.net.DefaultXmlHttpFactory.prototype.createInstance = function() {
  var progId = this.getProgId_();
  return progId ? new ActiveXObject(progId) : new XMLHttpRequest;
};
goog.net.DefaultXmlHttpFactory.prototype.internalGetOptions = function() {
  var options = {};
  this.getProgId_() && (options[goog.net.XmlHttp.OptionType.USE_NULL_FUNCTION] = !0, options[goog.net.XmlHttp.OptionType.LOCAL_REQUEST_ERROR] = !0);
  return options;
};
goog.net.DefaultXmlHttpFactory.prototype.getProgId_ = function() {
  if (goog.net.XmlHttp.ASSUME_NATIVE_XHR || goog.net.XmlHttpDefines.ASSUME_NATIVE_XHR) {
    return "";
  }
  if (!this.ieProgId_ && "undefined" == typeof XMLHttpRequest && "undefined" != typeof ActiveXObject) {
    for (var ACTIVE_X_IDENTS = ["MSXML2.XMLHTTP.6.0", "MSXML2.XMLHTTP.3.0", "MSXML2.XMLHTTP", "Microsoft.XMLHTTP"], i = 0; i < ACTIVE_X_IDENTS.length; i++) {
      var candidate = ACTIVE_X_IDENTS[i];
      try {
        return new ActiveXObject(candidate), this.ieProgId_ = candidate;
      } catch (e) {
      }
    }
    throw Error("Could not create ActiveXObject. ActiveX might be disabled, or MSXML might not be installed");
  }
  return this.ieProgId_;
};
goog.net.XmlHttp.setGlobalFactory(new goog.net.DefaultXmlHttpFactory);
goog.uri = {};
goog.uri.utils = {};
goog.uri.utils.CharCode_ = {AMPERSAND:38, EQUAL:61, HASH:35, QUESTION:63};
goog.uri.utils.buildFromEncodedParts = function(opt_scheme, opt_userInfo, opt_domain, opt_port, opt_path, opt_queryData, opt_fragment) {
  var out = "";
  opt_scheme && (out += opt_scheme + ":");
  opt_domain && (out += "//", opt_userInfo && (out += opt_userInfo + "@"), out += opt_domain, opt_port && (out += ":" + opt_port));
  opt_path && (out += opt_path);
  opt_queryData && (out += "?" + opt_queryData);
  opt_fragment && (out += "#" + opt_fragment);
  return out;
};
goog.uri.utils.splitRe_ = /^(?:([^:/?#.]+):)?(?:\/\/(?:([^/?#]*)@)?([^/#?]*?)(?::([0-9]+))?(?=[/#?]|$))?([^?#]+)?(?:\?([^#]*))?(?:#([\s\S]*))?$/;
goog.uri.utils.ComponentIndex = {SCHEME:1, USER_INFO:2, DOMAIN:3, PORT:4, PATH:5, QUERY_DATA:6, FRAGMENT:7};
goog.uri.utils.split = function(uri) {
  return uri.match(goog.uri.utils.splitRe_);
};
goog.uri.utils.decodeIfPossible_ = function(uri, opt_preserveReserved) {
  return uri ? opt_preserveReserved ? decodeURI(uri) : decodeURIComponent(uri) : uri;
};
goog.uri.utils.getComponentByIndex_ = function(componentIndex, uri) {
  return goog.uri.utils.split(uri)[componentIndex] || null;
};
goog.uri.utils.getScheme = function(uri) {
  return goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.SCHEME, uri);
};
goog.uri.utils.getEffectiveScheme = function(uri) {
  var scheme = goog.uri.utils.getScheme(uri);
  if (!scheme && goog.global.self && goog.global.self.location) {
    var protocol = goog.global.self.location.protocol;
    scheme = protocol.substr(0, protocol.length - 1);
  }
  return scheme ? scheme.toLowerCase() : "";
};
goog.uri.utils.getUserInfoEncoded = function(uri) {
  return goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.USER_INFO, uri);
};
goog.uri.utils.getUserInfo = function(uri) {
  return goog.uri.utils.decodeIfPossible_(goog.uri.utils.getUserInfoEncoded(uri));
};
goog.uri.utils.getDomainEncoded = function(uri) {
  return goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.DOMAIN, uri);
};
goog.uri.utils.getDomain = function(uri) {
  return goog.uri.utils.decodeIfPossible_(goog.uri.utils.getDomainEncoded(uri), !0);
};
goog.uri.utils.getPort = function(uri) {
  return Number(goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.PORT, uri)) || null;
};
goog.uri.utils.getPathEncoded = function(uri) {
  return goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.PATH, uri);
};
goog.uri.utils.getPath = function(uri) {
  return goog.uri.utils.decodeIfPossible_(goog.uri.utils.getPathEncoded(uri), !0);
};
goog.uri.utils.getQueryData = function(uri) {
  return goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.QUERY_DATA, uri);
};
goog.uri.utils.getFragmentEncoded = function(uri) {
  var hashIndex = uri.indexOf("#");
  return 0 > hashIndex ? null : uri.substr(hashIndex + 1);
};
goog.uri.utils.setFragmentEncoded = function(uri, fragment) {
  return goog.uri.utils.removeFragment(uri) + (fragment ? "#" + fragment : "");
};
goog.uri.utils.getFragment = function(uri) {
  return goog.uri.utils.decodeIfPossible_(goog.uri.utils.getFragmentEncoded(uri));
};
goog.uri.utils.getHost = function(uri) {
  var pieces = goog.uri.utils.split(uri);
  return goog.uri.utils.buildFromEncodedParts(pieces[goog.uri.utils.ComponentIndex.SCHEME], pieces[goog.uri.utils.ComponentIndex.USER_INFO], pieces[goog.uri.utils.ComponentIndex.DOMAIN], pieces[goog.uri.utils.ComponentIndex.PORT]);
};
goog.uri.utils.getOrigin = function(uri) {
  var pieces = goog.uri.utils.split(uri);
  return goog.uri.utils.buildFromEncodedParts(pieces[goog.uri.utils.ComponentIndex.SCHEME], null, pieces[goog.uri.utils.ComponentIndex.DOMAIN], pieces[goog.uri.utils.ComponentIndex.PORT]);
};
goog.uri.utils.getPathAndAfter = function(uri) {
  var pieces = goog.uri.utils.split(uri);
  return goog.uri.utils.buildFromEncodedParts(null, null, null, null, pieces[goog.uri.utils.ComponentIndex.PATH], pieces[goog.uri.utils.ComponentIndex.QUERY_DATA], pieces[goog.uri.utils.ComponentIndex.FRAGMENT]);
};
goog.uri.utils.removeFragment = function(uri) {
  var hashIndex = uri.indexOf("#");
  return 0 > hashIndex ? uri : uri.substr(0, hashIndex);
};
goog.uri.utils.haveSameDomain = function(uri1, uri2) {
  var pieces1 = goog.uri.utils.split(uri1), pieces2 = goog.uri.utils.split(uri2);
  return pieces1[goog.uri.utils.ComponentIndex.DOMAIN] == pieces2[goog.uri.utils.ComponentIndex.DOMAIN] && pieces1[goog.uri.utils.ComponentIndex.SCHEME] == pieces2[goog.uri.utils.ComponentIndex.SCHEME] && pieces1[goog.uri.utils.ComponentIndex.PORT] == pieces2[goog.uri.utils.ComponentIndex.PORT];
};
goog.uri.utils.assertNoFragmentsOrQueries_ = function(uri) {
  goog.asserts.assert(0 > uri.indexOf("#") && 0 > uri.indexOf("?"), "goog.uri.utils: Fragment or query identifiers are not supported: [%s]", uri);
};
goog.uri.utils.parseQueryData = function(encodedQuery, callback) {
  if (encodedQuery) {
    for (var pairs = encodedQuery.split("&"), i = 0; i < pairs.length; i++) {
      var indexOfEquals = pairs[i].indexOf("="), name = null, value = null;
      0 <= indexOfEquals ? (name = pairs[i].substring(0, indexOfEquals), value = pairs[i].substring(indexOfEquals + 1)) : name = pairs[i];
      callback(name, value ? goog.string.urlDecode(value) : "");
    }
  }
};
goog.uri.utils.splitQueryData_ = function(uri) {
  var hashIndex = uri.indexOf("#");
  0 > hashIndex && (hashIndex = uri.length);
  var questionIndex = uri.indexOf("?");
  if (0 > questionIndex || questionIndex > hashIndex) {
    questionIndex = hashIndex;
    var queryData = "";
  } else {
    queryData = uri.substring(questionIndex + 1, hashIndex);
  }
  return [uri.substr(0, questionIndex), queryData, uri.substr(hashIndex)];
};
goog.uri.utils.joinQueryData_ = function(parts) {
  return parts[0] + (parts[1] ? "?" + parts[1] : "") + parts[2];
};
goog.uri.utils.appendQueryData_ = function(queryData, newData) {
  return newData ? queryData ? queryData + "&" + newData : newData : queryData;
};
goog.uri.utils.appendQueryDataToUri_ = function(uri, queryData) {
  if (!queryData) {
    return uri;
  }
  var parts = goog.uri.utils.splitQueryData_(uri);
  parts[1] = goog.uri.utils.appendQueryData_(parts[1], queryData);
  return goog.uri.utils.joinQueryData_(parts);
};
goog.uri.utils.appendKeyValuePairs_ = function(key, value, pairs) {
  goog.asserts.assertString(key);
  if (goog.isArray(value)) {
    goog.asserts.assertArray(value);
    for (var j = 0; j < value.length; j++) {
      goog.uri.utils.appendKeyValuePairs_(key, String(value[j]), pairs);
    }
  } else {
    null != value && pairs.push(key + ("" === value ? "" : "=" + goog.string.urlEncode(value)));
  }
};
goog.uri.utils.buildQueryData = function(keysAndValues, opt_startIndex) {
  goog.asserts.assert(0 == Math.max(keysAndValues.length - (opt_startIndex || 0), 0) % 2, "goog.uri.utils: Key/value lists must be even in length.");
  for (var params = [], i = opt_startIndex || 0; i < keysAndValues.length; i += 2) {
    goog.uri.utils.appendKeyValuePairs_(keysAndValues[i], keysAndValues[i + 1], params);
  }
  return params.join("&");
};
goog.uri.utils.buildQueryDataFromMap = function(map) {
  var params = [], key;
  for (key in map) {
    goog.uri.utils.appendKeyValuePairs_(key, map[key], params);
  }
  return params.join("&");
};
goog.uri.utils.appendParams = function(uri, var_args) {
  var queryData = 2 == arguments.length ? goog.uri.utils.buildQueryData(arguments[1], 0) : goog.uri.utils.buildQueryData(arguments, 1);
  return goog.uri.utils.appendQueryDataToUri_(uri, queryData);
};
goog.uri.utils.appendParamsFromMap = function(uri, map) {
  var queryData = goog.uri.utils.buildQueryDataFromMap(map);
  return goog.uri.utils.appendQueryDataToUri_(uri, queryData);
};
goog.uri.utils.appendParam = function(uri, key, opt_value) {
  var value = goog.isDefAndNotNull(opt_value) ? "=" + goog.string.urlEncode(opt_value) : "";
  return goog.uri.utils.appendQueryDataToUri_(uri, key + value);
};
goog.uri.utils.findParam_ = function(uri, startIndex, keyEncoded, hashOrEndIndex) {
  for (var index = startIndex, keyLength = keyEncoded.length; 0 <= (index = uri.indexOf(keyEncoded, index)) && index < hashOrEndIndex;) {
    var precedingChar = uri.charCodeAt(index - 1);
    if (precedingChar == goog.uri.utils.CharCode_.AMPERSAND || precedingChar == goog.uri.utils.CharCode_.QUESTION) {
      var followingChar = uri.charCodeAt(index + keyLength);
      if (!followingChar || followingChar == goog.uri.utils.CharCode_.EQUAL || followingChar == goog.uri.utils.CharCode_.AMPERSAND || followingChar == goog.uri.utils.CharCode_.HASH) {
        return index;
      }
    }
    index += keyLength + 1;
  }
  return -1;
};
goog.uri.utils.hashOrEndRe_ = /#|$/;
goog.uri.utils.hasParam = function(uri, keyEncoded) {
  return 0 <= goog.uri.utils.findParam_(uri, 0, keyEncoded, uri.search(goog.uri.utils.hashOrEndRe_));
};
goog.uri.utils.getParamValue = function(uri, keyEncoded) {
  var hashOrEndIndex = uri.search(goog.uri.utils.hashOrEndRe_), foundIndex = goog.uri.utils.findParam_(uri, 0, keyEncoded, hashOrEndIndex);
  if (0 > foundIndex) {
    return null;
  }
  var endPosition = uri.indexOf("&", foundIndex);
  if (0 > endPosition || endPosition > hashOrEndIndex) {
    endPosition = hashOrEndIndex;
  }
  foundIndex += keyEncoded.length + 1;
  return goog.string.urlDecode(uri.substr(foundIndex, endPosition - foundIndex));
};
goog.uri.utils.getParamValues = function(uri, keyEncoded) {
  for (var hashOrEndIndex = uri.search(goog.uri.utils.hashOrEndRe_), position = 0, foundIndex, result = []; 0 <= (foundIndex = goog.uri.utils.findParam_(uri, position, keyEncoded, hashOrEndIndex));) {
    position = uri.indexOf("&", foundIndex);
    if (0 > position || position > hashOrEndIndex) {
      position = hashOrEndIndex;
    }
    foundIndex += keyEncoded.length + 1;
    result.push(goog.string.urlDecode(uri.substr(foundIndex, position - foundIndex)));
  }
  return result;
};
goog.uri.utils.trailingQueryPunctuationRe_ = /[?&]($|#)/;
goog.uri.utils.removeParam = function(uri, keyEncoded) {
  for (var hashOrEndIndex = uri.search(goog.uri.utils.hashOrEndRe_), position = 0, foundIndex, buffer = []; 0 <= (foundIndex = goog.uri.utils.findParam_(uri, position, keyEncoded, hashOrEndIndex));) {
    buffer.push(uri.substring(position, foundIndex)), position = Math.min(uri.indexOf("&", foundIndex) + 1 || hashOrEndIndex, hashOrEndIndex);
  }
  buffer.push(uri.substr(position));
  return buffer.join("").replace(goog.uri.utils.trailingQueryPunctuationRe_, "$1");
};
goog.uri.utils.setParam = function(uri, keyEncoded, value) {
  return goog.uri.utils.appendParam(goog.uri.utils.removeParam(uri, keyEncoded), keyEncoded, value);
};
goog.uri.utils.setParamsFromMap = function(uri, params) {
  var parts = goog.uri.utils.splitQueryData_(uri), queryData = parts[1], buffer = [];
  queryData && goog.array.forEach(queryData.split("&"), function(pair) {
    var indexOfEquals = pair.indexOf("=");
    params.hasOwnProperty(0 <= indexOfEquals ? pair.substr(0, indexOfEquals) : pair) || buffer.push(pair);
  });
  parts[1] = goog.uri.utils.appendQueryData_(buffer.join("&"), goog.uri.utils.buildQueryDataFromMap(params));
  return goog.uri.utils.joinQueryData_(parts);
};
goog.uri.utils.appendPath = function(baseUri, path) {
  goog.uri.utils.assertNoFragmentsOrQueries_(baseUri);
  goog.string.endsWith(baseUri, "/") && (baseUri = baseUri.substr(0, baseUri.length - 1));
  goog.string.startsWith(path, "/") && (path = path.substr(1));
  return goog.string.buildString(baseUri, "/", path);
};
goog.uri.utils.setPath = function(uri, path) {
  goog.string.startsWith(path, "/") || (path = "/" + path);
  var parts = goog.uri.utils.split(uri);
  return goog.uri.utils.buildFromEncodedParts(parts[goog.uri.utils.ComponentIndex.SCHEME], parts[goog.uri.utils.ComponentIndex.USER_INFO], parts[goog.uri.utils.ComponentIndex.DOMAIN], parts[goog.uri.utils.ComponentIndex.PORT], path, parts[goog.uri.utils.ComponentIndex.QUERY_DATA], parts[goog.uri.utils.ComponentIndex.FRAGMENT]);
};
goog.uri.utils.StandardQueryParam = {RANDOM:"zx"};
goog.uri.utils.makeUnique = function(uri) {
  return goog.uri.utils.setParam(uri, goog.uri.utils.StandardQueryParam.RANDOM, goog.string.getRandomString());
};
goog.net.XhrIo = function(opt_xmlHttpFactory) {
  goog.events.EventTarget.call(this);
  this.headers = new goog.structs.Map;
  this.xmlHttpFactory_ = opt_xmlHttpFactory || null;
  this.active_ = !1;
  this.xhrOptions_ = this.xhr_ = null;
  this.lastMethod_ = this.lastUri_ = "";
  this.lastErrorCode_ = goog.net.ErrorCode.NO_ERROR;
  this.lastError_ = "";
  this.inAbort_ = this.inOpen_ = this.inSend_ = this.errorDispatched_ = !1;
  this.timeoutInterval_ = 0;
  this.timeoutId_ = null;
  this.responseType_ = goog.net.XhrIo.ResponseType.DEFAULT;
  this.useXhr2Timeout_ = this.progressEventsEnabled_ = this.withCredentials_ = !1;
};
goog.inherits(goog.net.XhrIo, goog.events.EventTarget);
goog.net.XhrIo.ResponseType = {DEFAULT:"", TEXT:"text", DOCUMENT:"document", BLOB:"blob", ARRAY_BUFFER:"arraybuffer"};
goog.net.XhrIo.prototype.logger_ = goog.log.getLogger("goog.net.XhrIo");
goog.net.XhrIo.CONTENT_TYPE_HEADER = "Content-Type";
goog.net.XhrIo.CONTENT_TRANSFER_ENCODING = "Content-Transfer-Encoding";
goog.net.XhrIo.HTTP_SCHEME_PATTERN = /^https?$/i;
goog.net.XhrIo.METHODS_WITH_FORM_DATA = ["POST", "PUT"];
goog.net.XhrIo.FORM_CONTENT_TYPE = "application/x-www-form-urlencoded;charset=utf-8";
goog.net.XhrIo.XHR2_TIMEOUT_ = "timeout";
goog.net.XhrIo.XHR2_ON_TIMEOUT_ = "ontimeout";
goog.net.XhrIo.sendInstances_ = [];
goog.net.XhrIo.send = function(url, opt_callback, opt_method, opt_content, opt_headers, opt_timeoutInterval, opt_withCredentials) {
  var x = new goog.net.XhrIo;
  goog.net.XhrIo.sendInstances_.push(x);
  opt_callback && x.listen(goog.net.EventType.COMPLETE, opt_callback);
  x.listenOnce(goog.net.EventType.READY, x.cleanupSend_);
  opt_timeoutInterval && x.setTimeoutInterval(opt_timeoutInterval);
  opt_withCredentials && x.setWithCredentials(opt_withCredentials);
  x.send(url, opt_method, opt_content, opt_headers);
  return x;
};
goog.net.XhrIo.cleanup = function() {
  for (var instances = goog.net.XhrIo.sendInstances_; instances.length;) {
    instances.pop().dispose();
  }
};
goog.net.XhrIo.protectEntryPoints = function(errorHandler) {
  goog.net.XhrIo.prototype.onReadyStateChangeEntryPoint_ = errorHandler.protectEntryPoint(goog.net.XhrIo.prototype.onReadyStateChangeEntryPoint_);
};
goog.net.XhrIo.prototype.cleanupSend_ = function() {
  this.dispose();
  goog.array.remove(goog.net.XhrIo.sendInstances_, this);
};
goog.net.XhrIo.prototype.getTimeoutInterval = function() {
  return this.timeoutInterval_;
};
goog.net.XhrIo.prototype.setTimeoutInterval = function(ms) {
  this.timeoutInterval_ = Math.max(0, ms);
};
goog.net.XhrIo.prototype.setResponseType = function(type) {
  this.responseType_ = type;
};
goog.net.XhrIo.prototype.getResponseType = function() {
  return this.responseType_;
};
goog.net.XhrIo.prototype.setWithCredentials = function(withCredentials) {
  this.withCredentials_ = withCredentials;
};
goog.net.XhrIo.prototype.getWithCredentials = function() {
  return this.withCredentials_;
};
goog.net.XhrIo.prototype.setProgressEventsEnabled = function(enabled) {
  this.progressEventsEnabled_ = enabled;
};
goog.net.XhrIo.prototype.getProgressEventsEnabled = function() {
  return this.progressEventsEnabled_;
};
goog.net.XhrIo.prototype.send = function(url, opt_method, opt_content, opt_headers) {
  if (this.xhr_) {
    throw Error("[goog.net.XhrIo] Object is active with another request=" + this.lastUri_ + "; newUri=" + url);
  }
  var method = opt_method ? opt_method.toUpperCase() : "GET";
  this.lastUri_ = url;
  this.lastError_ = "";
  this.lastErrorCode_ = goog.net.ErrorCode.NO_ERROR;
  this.lastMethod_ = method;
  this.errorDispatched_ = !1;
  this.active_ = !0;
  this.xhr_ = this.createXhr();
  this.xhrOptions_ = this.xmlHttpFactory_ ? this.xmlHttpFactory_.getOptions() : goog.net.XmlHttp.getOptions();
  this.xhr_.onreadystatechange = goog.bind(this.onReadyStateChange_, this);
  this.getProgressEventsEnabled() && "onprogress" in this.xhr_ && (this.xhr_.onprogress = goog.bind(function(e) {
    this.onProgressHandler_(e, !0);
  }, this), this.xhr_.upload && (this.xhr_.upload.onprogress = goog.bind(this.onProgressHandler_, this)));
  try {
    goog.log.fine(this.logger_, this.formatMsg_("Opening Xhr")), this.inOpen_ = !0, this.xhr_.open(method, String(url), !0), this.inOpen_ = !1;
  } catch (err) {
    goog.log.fine(this.logger_, this.formatMsg_("Error opening Xhr: " + err.message));
    this.error_(goog.net.ErrorCode.EXCEPTION, err);
    return;
  }
  var content = opt_content || "", headers = this.headers.clone();
  opt_headers && goog.structs.forEach(opt_headers, function(value, key) {
    headers.set(key, value);
  });
  var contentTypeKey = goog.array.find(headers.getKeys(), goog.net.XhrIo.isContentTypeHeader_), contentIsFormData = goog.global.FormData && content instanceof goog.global.FormData;
  !goog.array.contains(goog.net.XhrIo.METHODS_WITH_FORM_DATA, method) || contentTypeKey || contentIsFormData || headers.set(goog.net.XhrIo.CONTENT_TYPE_HEADER, goog.net.XhrIo.FORM_CONTENT_TYPE);
  headers.forEach(function(value, key) {
    this.xhr_.setRequestHeader(key, value);
  }, this);
  this.responseType_ && (this.xhr_.responseType = this.responseType_);
  "withCredentials" in this.xhr_ && this.xhr_.withCredentials !== this.withCredentials_ && (this.xhr_.withCredentials = this.withCredentials_);
  try {
    this.cleanUpTimeoutTimer_(), 0 < this.timeoutInterval_ && (this.useXhr2Timeout_ = goog.net.XhrIo.shouldUseXhr2Timeout_(this.xhr_), goog.log.fine(this.logger_, this.formatMsg_("Will abort after " + this.timeoutInterval_ + "ms if incomplete, xhr2 " + this.useXhr2Timeout_)), this.useXhr2Timeout_ ? (this.xhr_[goog.net.XhrIo.XHR2_TIMEOUT_] = this.timeoutInterval_, this.xhr_[goog.net.XhrIo.XHR2_ON_TIMEOUT_] = goog.bind(this.timeout_, this)) : this.timeoutId_ = goog.Timer.callOnce(this.timeout_, this.timeoutInterval_, 
    this)), goog.log.fine(this.logger_, this.formatMsg_("Sending request")), this.inSend_ = !0, this.xhr_.send(content), this.inSend_ = !1;
  } catch (err$17) {
    goog.log.fine(this.logger_, this.formatMsg_("Send error: " + err$17.message)), this.error_(goog.net.ErrorCode.EXCEPTION, err$17);
  }
};
goog.net.XhrIo.shouldUseXhr2Timeout_ = function(xhr) {
  return goog.userAgent.IE && goog.userAgent.isVersionOrHigher(9) && goog.isNumber(xhr[goog.net.XhrIo.XHR2_TIMEOUT_]) && goog.isDef(xhr[goog.net.XhrIo.XHR2_ON_TIMEOUT_]);
};
goog.net.XhrIo.isContentTypeHeader_ = function(header) {
  return goog.string.caseInsensitiveEquals(goog.net.XhrIo.CONTENT_TYPE_HEADER, header);
};
goog.net.XhrIo.prototype.createXhr = function() {
  return this.xmlHttpFactory_ ? this.xmlHttpFactory_.createInstance() : goog.net.XmlHttp();
};
goog.net.XhrIo.prototype.timeout_ = function() {
  "undefined" != typeof goog && this.xhr_ && (this.lastError_ = "Timed out after " + this.timeoutInterval_ + "ms, aborting", this.lastErrorCode_ = goog.net.ErrorCode.TIMEOUT, goog.log.fine(this.logger_, this.formatMsg_(this.lastError_)), this.dispatchEvent(goog.net.EventType.TIMEOUT), this.abort(goog.net.ErrorCode.TIMEOUT));
};
goog.net.XhrIo.prototype.error_ = function(errorCode, err) {
  this.active_ = !1;
  this.xhr_ && (this.inAbort_ = !0, this.xhr_.abort(), this.inAbort_ = !1);
  this.lastError_ = err;
  this.lastErrorCode_ = errorCode;
  this.dispatchErrors_();
  this.cleanUpXhr_();
};
goog.net.XhrIo.prototype.dispatchErrors_ = function() {
  this.errorDispatched_ || (this.errorDispatched_ = !0, this.dispatchEvent(goog.net.EventType.COMPLETE), this.dispatchEvent(goog.net.EventType.ERROR));
};
goog.net.XhrIo.prototype.abort = function(opt_failureCode) {
  this.xhr_ && this.active_ && (goog.log.fine(this.logger_, this.formatMsg_("Aborting")), this.active_ = !1, this.inAbort_ = !0, this.xhr_.abort(), this.inAbort_ = !1, this.lastErrorCode_ = opt_failureCode || goog.net.ErrorCode.ABORT, this.dispatchEvent(goog.net.EventType.COMPLETE), this.dispatchEvent(goog.net.EventType.ABORT), this.cleanUpXhr_());
};
goog.net.XhrIo.prototype.disposeInternal = function() {
  this.xhr_ && (this.active_ && (this.active_ = !1, this.inAbort_ = !0, this.xhr_.abort(), this.inAbort_ = !1), this.cleanUpXhr_(!0));
  goog.net.XhrIo.superClass_.disposeInternal.call(this);
};
goog.net.XhrIo.prototype.onReadyStateChange_ = function() {
  if (!this.isDisposed()) {
    if (this.inOpen_ || this.inSend_ || this.inAbort_) {
      this.onReadyStateChangeHelper_();
    } else {
      this.onReadyStateChangeEntryPoint_();
    }
  }
};
goog.net.XhrIo.prototype.onReadyStateChangeEntryPoint_ = function() {
  this.onReadyStateChangeHelper_();
};
goog.net.XhrIo.prototype.onReadyStateChangeHelper_ = function() {
  if (this.active_ && "undefined" != typeof goog) {
    if (this.xhrOptions_[goog.net.XmlHttp.OptionType.LOCAL_REQUEST_ERROR] && this.getReadyState() == goog.net.XmlHttp.ReadyState.COMPLETE && 2 == this.getStatus()) {
      goog.log.fine(this.logger_, this.formatMsg_("Local request error detected and ignored"));
    } else {
      if (this.inSend_ && this.getReadyState() == goog.net.XmlHttp.ReadyState.COMPLETE) {
        goog.Timer.callOnce(this.onReadyStateChange_, 0, this);
      } else {
        if (this.dispatchEvent(goog.net.EventType.READY_STATE_CHANGE), this.isComplete()) {
          goog.log.fine(this.logger_, this.formatMsg_("Request complete"));
          this.active_ = !1;
          try {
            this.isSuccess() ? (this.dispatchEvent(goog.net.EventType.COMPLETE), this.dispatchEvent(goog.net.EventType.SUCCESS)) : (this.lastErrorCode_ = goog.net.ErrorCode.HTTP_ERROR, this.lastError_ = this.getStatusText() + " [" + this.getStatus() + "]", this.dispatchErrors_());
          } finally {
            this.cleanUpXhr_();
          }
        }
      }
    }
  }
};
goog.net.XhrIo.prototype.onProgressHandler_ = function(e, opt_isDownload) {
  goog.asserts.assert(e.type === goog.net.EventType.PROGRESS, "goog.net.EventType.PROGRESS is of the same type as raw XHR progress.");
  this.dispatchEvent(goog.net.XhrIo.buildProgressEvent_(e, goog.net.EventType.PROGRESS));
  this.dispatchEvent(goog.net.XhrIo.buildProgressEvent_(e, opt_isDownload ? goog.net.EventType.DOWNLOAD_PROGRESS : goog.net.EventType.UPLOAD_PROGRESS));
};
goog.net.XhrIo.buildProgressEvent_ = function(e, eventType) {
  return {type:eventType, lengthComputable:e.lengthComputable, loaded:e.loaded, total:e.total};
};
goog.net.XhrIo.prototype.cleanUpXhr_ = function(opt_fromDispose) {
  if (this.xhr_) {
    this.cleanUpTimeoutTimer_();
    var xhr = this.xhr_, clearedOnReadyStateChange = this.xhrOptions_[goog.net.XmlHttp.OptionType.USE_NULL_FUNCTION] ? goog.nullFunction : null;
    this.xhrOptions_ = this.xhr_ = null;
    opt_fromDispose || this.dispatchEvent(goog.net.EventType.READY);
    try {
      xhr.onreadystatechange = clearedOnReadyStateChange;
    } catch (e) {
      goog.log.error(this.logger_, "Problem encountered resetting onreadystatechange: " + e.message);
    }
  }
};
goog.net.XhrIo.prototype.cleanUpTimeoutTimer_ = function() {
  this.xhr_ && this.useXhr2Timeout_ && (this.xhr_[goog.net.XhrIo.XHR2_ON_TIMEOUT_] = null);
  this.timeoutId_ && (goog.Timer.clear(this.timeoutId_), this.timeoutId_ = null);
};
goog.net.XhrIo.prototype.isActive = function() {
  return !!this.xhr_;
};
goog.net.XhrIo.prototype.isComplete = function() {
  return this.getReadyState() == goog.net.XmlHttp.ReadyState.COMPLETE;
};
goog.net.XhrIo.prototype.isSuccess = function() {
  var status = this.getStatus();
  return goog.net.HttpStatus.isSuccess(status) || 0 === status && !this.isLastUriEffectiveSchemeHttp_();
};
goog.net.XhrIo.prototype.isLastUriEffectiveSchemeHttp_ = function() {
  var scheme = goog.uri.utils.getEffectiveScheme(String(this.lastUri_));
  return goog.net.XhrIo.HTTP_SCHEME_PATTERN.test(scheme);
};
goog.net.XhrIo.prototype.getReadyState = function() {
  return this.xhr_ ? this.xhr_.readyState : goog.net.XmlHttp.ReadyState.UNINITIALIZED;
};
goog.net.XhrIo.prototype.getStatus = function() {
  try {
    return this.getReadyState() > goog.net.XmlHttp.ReadyState.LOADED ? this.xhr_.status : -1;
  } catch (e) {
    return -1;
  }
};
goog.net.XhrIo.prototype.getStatusText = function() {
  try {
    return this.getReadyState() > goog.net.XmlHttp.ReadyState.LOADED ? this.xhr_.statusText : "";
  } catch (e) {
    return goog.log.fine(this.logger_, "Can not get status: " + e.message), "";
  }
};
goog.net.XhrIo.prototype.getLastUri = function() {
  return String(this.lastUri_);
};
goog.net.XhrIo.prototype.getResponseText = function() {
  try {
    return this.xhr_ ? this.xhr_.responseText : "";
  } catch (e) {
    return goog.log.fine(this.logger_, "Can not get responseText: " + e.message), "";
  }
};
goog.net.XhrIo.prototype.getResponseBody = function() {
  try {
    if (this.xhr_ && "responseBody" in this.xhr_) {
      return this.xhr_.responseBody;
    }
  } catch (e) {
    goog.log.fine(this.logger_, "Can not get responseBody: " + e.message);
  }
  return null;
};
goog.net.XhrIo.prototype.getResponseXml = function() {
  try {
    return this.xhr_ ? this.xhr_.responseXML : null;
  } catch (e) {
    return goog.log.fine(this.logger_, "Can not get responseXML: " + e.message), null;
  }
};
goog.net.XhrIo.prototype.getResponseJson = function(opt_xssiPrefix) {
  if (this.xhr_) {
    var responseText = this.xhr_.responseText;
    opt_xssiPrefix && 0 == responseText.indexOf(opt_xssiPrefix) && (responseText = responseText.substring(opt_xssiPrefix.length));
    return goog.json.hybrid.parse(responseText);
  }
};
goog.net.XhrIo.prototype.getResponse = function() {
  try {
    if (!this.xhr_) {
      return null;
    }
    if ("response" in this.xhr_) {
      return this.xhr_.response;
    }
    switch(this.responseType_) {
      case goog.net.XhrIo.ResponseType.DEFAULT:
      case goog.net.XhrIo.ResponseType.TEXT:
        return this.xhr_.responseText;
      case goog.net.XhrIo.ResponseType.ARRAY_BUFFER:
        if ("mozResponseArrayBuffer" in this.xhr_) {
          return this.xhr_.mozResponseArrayBuffer;
        }
    }
    goog.log.error(this.logger_, "Response type " + this.responseType_ + " is not supported on this browser");
    return null;
  } catch (e) {
    return goog.log.fine(this.logger_, "Can not get response: " + e.message), null;
  }
};
goog.net.XhrIo.prototype.getResponseHeader = function(key) {
  if (this.xhr_ && this.isComplete()) {
    var value = this.xhr_.getResponseHeader(key);
    return goog.isNull(value) ? void 0 : value;
  }
};
goog.net.XhrIo.prototype.getAllResponseHeaders = function() {
  return this.xhr_ && this.isComplete() ? this.xhr_.getAllResponseHeaders() || "" : "";
};
goog.net.XhrIo.prototype.getResponseHeaders = function() {
  for (var headersObject = {}, headersArray = this.getAllResponseHeaders().split("\r\n"), i = 0; i < headersArray.length; i++) {
    if (!goog.string.isEmptyOrWhitespace(headersArray[i])) {
      var keyValue = goog.string.splitLimit(headersArray[i], ":", 1), key = keyValue[0], value = keyValue[1];
      if (goog.isString(value)) {
        value = value.trim();
        var values$jscomp$0 = headersObject[key] || [];
        headersObject[key] = values$jscomp$0;
        values$jscomp$0.push(value);
      }
    }
  }
  return goog.object.map(headersObject, function(values) {
    return values.join(", ");
  });
};
goog.net.XhrIo.prototype.getStreamingResponseHeader = function(key) {
  return this.xhr_ ? this.xhr_.getResponseHeader(key) : null;
};
goog.net.XhrIo.prototype.getAllStreamingResponseHeaders = function() {
  return this.xhr_ ? this.xhr_.getAllResponseHeaders() : "";
};
goog.net.XhrIo.prototype.getLastErrorCode = function() {
  return this.lastErrorCode_;
};
goog.net.XhrIo.prototype.getLastError = function() {
  return goog.isString(this.lastError_) ? this.lastError_ : String(this.lastError_);
};
goog.net.XhrIo.prototype.formatMsg_ = function(msg) {
  return msg + " [" + this.lastMethod_ + " " + this.lastUri_ + " " + this.getStatus() + "]";
};
goog.debug.entryPointRegistry.register(function(transformer) {
  goog.net.XhrIo.prototype.onReadyStateChangeEntryPoint_ = transformer(goog.net.XhrIo.prototype.onReadyStateChangeEntryPoint_);
});
goog.Uri = function(opt_uri, opt_ignoreCase) {
  this.domain_ = this.userInfo_ = this.scheme_ = "";
  this.port_ = null;
  this.fragment_ = this.path_ = "";
  this.ignoreCase_ = this.isReadOnly_ = !1;
  var m;
  opt_uri instanceof goog.Uri ? (this.ignoreCase_ = goog.isDef(opt_ignoreCase) ? opt_ignoreCase : opt_uri.getIgnoreCase(), this.setScheme(opt_uri.getScheme()), this.setUserInfo(opt_uri.getUserInfo()), this.setDomain(opt_uri.getDomain()), this.setPort(opt_uri.getPort()), this.setPath(opt_uri.getPath()), this.setQueryData(opt_uri.getQueryData().clone()), this.setFragment(opt_uri.getFragment())) : opt_uri && (m = goog.uri.utils.split(String(opt_uri))) ? (this.ignoreCase_ = !!opt_ignoreCase, this.setScheme(m[goog.uri.utils.ComponentIndex.SCHEME] || 
  "", !0), this.setUserInfo(m[goog.uri.utils.ComponentIndex.USER_INFO] || "", !0), this.setDomain(m[goog.uri.utils.ComponentIndex.DOMAIN] || "", !0), this.setPort(m[goog.uri.utils.ComponentIndex.PORT]), this.setPath(m[goog.uri.utils.ComponentIndex.PATH] || "", !0), this.setQueryData(m[goog.uri.utils.ComponentIndex.QUERY_DATA] || "", !0), this.setFragment(m[goog.uri.utils.ComponentIndex.FRAGMENT] || "", !0)) : (this.ignoreCase_ = !!opt_ignoreCase, this.queryData_ = new goog.Uri.QueryData(null, null, 
  this.ignoreCase_));
};
goog.Uri.RANDOM_PARAM = goog.uri.utils.StandardQueryParam.RANDOM;
goog.Uri.prototype.toString = function() {
  var out = [], scheme = this.getScheme();
  scheme && out.push(goog.Uri.encodeSpecialChars_(scheme, goog.Uri.reDisallowedInSchemeOrUserInfo_, !0), ":");
  var domain = this.getDomain();
  if (domain || "file" == scheme) {
    out.push("//");
    var userInfo = this.getUserInfo();
    userInfo && out.push(goog.Uri.encodeSpecialChars_(userInfo, goog.Uri.reDisallowedInSchemeOrUserInfo_, !0), "@");
    out.push(goog.Uri.removeDoubleEncoding_(goog.string.urlEncode(domain)));
    var port = this.getPort();
    null != port && out.push(":", String(port));
  }
  var path = this.getPath();
  path && (this.hasDomain() && "/" != path.charAt(0) && out.push("/"), out.push(goog.Uri.encodeSpecialChars_(path, "/" == path.charAt(0) ? goog.Uri.reDisallowedInAbsolutePath_ : goog.Uri.reDisallowedInRelativePath_, !0)));
  var query = this.getEncodedQuery();
  query && out.push("?", query);
  var fragment = this.getFragment();
  fragment && out.push("#", goog.Uri.encodeSpecialChars_(fragment, goog.Uri.reDisallowedInFragment_));
  return out.join("");
};
goog.Uri.prototype.resolve = function(relativeUri) {
  var absoluteUri = this.clone(), overridden = relativeUri.hasScheme();
  overridden ? absoluteUri.setScheme(relativeUri.getScheme()) : overridden = relativeUri.hasUserInfo();
  overridden ? absoluteUri.setUserInfo(relativeUri.getUserInfo()) : overridden = relativeUri.hasDomain();
  overridden ? absoluteUri.setDomain(relativeUri.getDomain()) : overridden = relativeUri.hasPort();
  var path = relativeUri.getPath();
  if (overridden) {
    absoluteUri.setPort(relativeUri.getPort());
  } else {
    if (overridden = relativeUri.hasPath()) {
      if ("/" != path.charAt(0)) {
        if (this.hasDomain() && !this.hasPath()) {
          path = "/" + path;
        } else {
          var lastSlashIndex = absoluteUri.getPath().lastIndexOf("/");
          -1 != lastSlashIndex && (path = absoluteUri.getPath().substr(0, lastSlashIndex + 1) + path);
        }
      }
      path = goog.Uri.removeDotSegments(path);
    }
  }
  overridden ? absoluteUri.setPath(path) : overridden = relativeUri.hasQuery();
  overridden ? absoluteUri.setQueryData(relativeUri.getQueryData().clone()) : overridden = relativeUri.hasFragment();
  overridden && absoluteUri.setFragment(relativeUri.getFragment());
  return absoluteUri;
};
goog.Uri.prototype.clone = function() {
  return new goog.Uri(this);
};
goog.Uri.prototype.getScheme = function() {
  return this.scheme_;
};
goog.Uri.prototype.setScheme = function(newScheme, opt_decode) {
  this.enforceReadOnly();
  if (this.scheme_ = opt_decode ? goog.Uri.decodeOrEmpty_(newScheme, !0) : newScheme) {
    this.scheme_ = this.scheme_.replace(/:$/, "");
  }
  return this;
};
goog.Uri.prototype.hasScheme = function() {
  return !!this.scheme_;
};
goog.Uri.prototype.getUserInfo = function() {
  return this.userInfo_;
};
goog.Uri.prototype.setUserInfo = function(newUserInfo, opt_decode) {
  this.enforceReadOnly();
  this.userInfo_ = opt_decode ? goog.Uri.decodeOrEmpty_(newUserInfo) : newUserInfo;
  return this;
};
goog.Uri.prototype.hasUserInfo = function() {
  return !!this.userInfo_;
};
goog.Uri.prototype.getDomain = function() {
  return this.domain_;
};
goog.Uri.prototype.setDomain = function(newDomain, opt_decode) {
  this.enforceReadOnly();
  this.domain_ = opt_decode ? goog.Uri.decodeOrEmpty_(newDomain, !0) : newDomain;
  return this;
};
goog.Uri.prototype.hasDomain = function() {
  return !!this.domain_;
};
goog.Uri.prototype.getPort = function() {
  return this.port_;
};
goog.Uri.prototype.setPort = function(newPort) {
  this.enforceReadOnly();
  if (newPort) {
    newPort = Number(newPort);
    if (isNaN(newPort) || 0 > newPort) {
      throw Error("Bad port number " + newPort);
    }
    this.port_ = newPort;
  } else {
    this.port_ = null;
  }
  return this;
};
goog.Uri.prototype.hasPort = function() {
  return null != this.port_;
};
goog.Uri.prototype.getPath = function() {
  return this.path_;
};
goog.Uri.prototype.setPath = function(newPath, opt_decode) {
  this.enforceReadOnly();
  this.path_ = opt_decode ? goog.Uri.decodeOrEmpty_(newPath, !0) : newPath;
  return this;
};
goog.Uri.prototype.hasPath = function() {
  return !!this.path_;
};
goog.Uri.prototype.hasQuery = function() {
  return "" !== this.queryData_.toString();
};
goog.Uri.prototype.setQueryData = function(queryData, opt_decode) {
  this.enforceReadOnly();
  queryData instanceof goog.Uri.QueryData ? (this.queryData_ = queryData, this.queryData_.setIgnoreCase(this.ignoreCase_)) : (opt_decode || (queryData = goog.Uri.encodeSpecialChars_(queryData, goog.Uri.reDisallowedInQuery_)), this.queryData_ = new goog.Uri.QueryData(queryData, null, this.ignoreCase_));
  return this;
};
goog.Uri.prototype.setQuery = function(newQuery, opt_decode) {
  return this.setQueryData(newQuery, opt_decode);
};
goog.Uri.prototype.getEncodedQuery = function() {
  return this.queryData_.toString();
};
goog.Uri.prototype.getDecodedQuery = function() {
  return this.queryData_.toDecodedString();
};
goog.Uri.prototype.getQueryData = function() {
  return this.queryData_;
};
goog.Uri.prototype.getQuery = function() {
  return this.getEncodedQuery();
};
goog.Uri.prototype.setParameterValue = function(key, value) {
  this.enforceReadOnly();
  this.queryData_.set(key, value);
  return this;
};
goog.Uri.prototype.setParameterValues = function(key, values) {
  this.enforceReadOnly();
  goog.isArray(values) || (values = [String(values)]);
  this.queryData_.setValues(key, values);
  return this;
};
goog.Uri.prototype.getParameterValues = function(name) {
  return this.queryData_.getValues(name);
};
goog.Uri.prototype.getParameterValue = function(paramName) {
  return this.queryData_.get(paramName);
};
goog.Uri.prototype.getFragment = function() {
  return this.fragment_;
};
goog.Uri.prototype.setFragment = function(newFragment, opt_decode) {
  this.enforceReadOnly();
  this.fragment_ = opt_decode ? goog.Uri.decodeOrEmpty_(newFragment) : newFragment;
  return this;
};
goog.Uri.prototype.hasFragment = function() {
  return !!this.fragment_;
};
goog.Uri.prototype.hasSameDomainAs = function(uri2) {
  return (!this.hasDomain() && !uri2.hasDomain() || this.getDomain() == uri2.getDomain()) && (!this.hasPort() && !uri2.hasPort() || this.getPort() == uri2.getPort());
};
goog.Uri.prototype.makeUnique = function() {
  this.enforceReadOnly();
  this.setParameterValue(goog.Uri.RANDOM_PARAM, goog.string.getRandomString());
  return this;
};
goog.Uri.prototype.removeParameter = function(key) {
  this.enforceReadOnly();
  this.queryData_.remove(key);
  return this;
};
goog.Uri.prototype.setReadOnly = function(isReadOnly) {
  this.isReadOnly_ = isReadOnly;
  return this;
};
goog.Uri.prototype.isReadOnly = function() {
  return this.isReadOnly_;
};
goog.Uri.prototype.enforceReadOnly = function() {
  if (this.isReadOnly_) {
    throw Error("Tried to modify a read-only Uri");
  }
};
goog.Uri.prototype.setIgnoreCase = function(ignoreCase) {
  this.ignoreCase_ = ignoreCase;
  this.queryData_ && this.queryData_.setIgnoreCase(ignoreCase);
  return this;
};
goog.Uri.prototype.getIgnoreCase = function() {
  return this.ignoreCase_;
};
goog.Uri.parse = function(uri, opt_ignoreCase) {
  return uri instanceof goog.Uri ? uri.clone() : new goog.Uri(uri, opt_ignoreCase);
};
goog.Uri.create = function(opt_scheme, opt_userInfo, opt_domain, opt_port, opt_path, opt_query, opt_fragment, opt_ignoreCase) {
  var uri = new goog.Uri(null, opt_ignoreCase);
  opt_scheme && uri.setScheme(opt_scheme);
  opt_userInfo && uri.setUserInfo(opt_userInfo);
  opt_domain && uri.setDomain(opt_domain);
  opt_port && uri.setPort(opt_port);
  opt_path && uri.setPath(opt_path);
  opt_query && uri.setQueryData(opt_query);
  opt_fragment && uri.setFragment(opt_fragment);
  return uri;
};
goog.Uri.resolve = function(base, rel) {
  base instanceof goog.Uri || (base = goog.Uri.parse(base));
  rel instanceof goog.Uri || (rel = goog.Uri.parse(rel));
  return base.resolve(rel);
};
goog.Uri.removeDotSegments = function(path) {
  if (".." == path || "." == path) {
    return "";
  }
  if (goog.string.contains(path, "./") || goog.string.contains(path, "/.")) {
    for (var leadingSlash = goog.string.startsWith(path, "/"), segments = path.split("/"), out = [], pos = 0; pos < segments.length;) {
      var segment = segments[pos++];
      "." == segment ? leadingSlash && pos == segments.length && out.push("") : ".." == segment ? ((1 < out.length || 1 == out.length && "" != out[0]) && out.pop(), leadingSlash && pos == segments.length && out.push("")) : (out.push(segment), leadingSlash = !0);
    }
    return out.join("/");
  }
  return path;
};
goog.Uri.decodeOrEmpty_ = function(val, opt_preserveReserved) {
  return val ? opt_preserveReserved ? decodeURI(val.replace(/%25/g, "%2525")) : decodeURIComponent(val) : "";
};
goog.Uri.encodeSpecialChars_ = function(unescapedPart, extra, opt_removeDoubleEncoding) {
  if (goog.isString(unescapedPart)) {
    var encoded = encodeURI(unescapedPart).replace(extra, goog.Uri.encodeChar_);
    opt_removeDoubleEncoding && (encoded = goog.Uri.removeDoubleEncoding_(encoded));
    return encoded;
  }
  return null;
};
goog.Uri.encodeChar_ = function(ch) {
  var n = ch.charCodeAt(0);
  return "%" + (n >> 4 & 15).toString(16) + (n & 15).toString(16);
};
goog.Uri.removeDoubleEncoding_ = function(doubleEncodedString) {
  return doubleEncodedString.replace(/%25([0-9a-fA-F]{2})/g, "%$1");
};
goog.Uri.reDisallowedInSchemeOrUserInfo_ = /[#\/\?@]/g;
goog.Uri.reDisallowedInRelativePath_ = /[#\?:]/g;
goog.Uri.reDisallowedInAbsolutePath_ = /[#\?]/g;
goog.Uri.reDisallowedInQuery_ = /[#\?@]/g;
goog.Uri.reDisallowedInFragment_ = /#/g;
goog.Uri.haveSameDomain = function(uri1String, uri2String) {
  var pieces1 = goog.uri.utils.split(uri1String), pieces2 = goog.uri.utils.split(uri2String);
  return pieces1[goog.uri.utils.ComponentIndex.DOMAIN] == pieces2[goog.uri.utils.ComponentIndex.DOMAIN] && pieces1[goog.uri.utils.ComponentIndex.PORT] == pieces2[goog.uri.utils.ComponentIndex.PORT];
};
goog.Uri.QueryData = function(opt_query, opt_uri, opt_ignoreCase) {
  this.count_ = this.keyMap_ = null;
  this.encodedQuery_ = opt_query || null;
  this.ignoreCase_ = !!opt_ignoreCase;
};
goog.Uri.QueryData.prototype.ensureKeyMapInitialized_ = function() {
  if (!this.keyMap_ && (this.keyMap_ = new goog.structs.Map, this.count_ = 0, this.encodedQuery_)) {
    var self = this;
    goog.uri.utils.parseQueryData(this.encodedQuery_, function(name, value) {
      self.add(goog.string.urlDecode(name), value);
    });
  }
};
goog.Uri.QueryData.createFromMap = function(map, opt_uri, opt_ignoreCase) {
  var keys = goog.structs.getKeys(map);
  if ("undefined" == typeof keys) {
    throw Error("Keys are undefined");
  }
  for (var queryData = new goog.Uri.QueryData(null, null, opt_ignoreCase), values = goog.structs.getValues(map), i = 0; i < keys.length; i++) {
    var key = keys[i], value = values[i];
    goog.isArray(value) ? queryData.setValues(key, value) : queryData.add(key, value);
  }
  return queryData;
};
goog.Uri.QueryData.createFromKeysValues = function(keys, values, opt_uri, opt_ignoreCase) {
  if (keys.length != values.length) {
    throw Error("Mismatched lengths for keys/values");
  }
  for (var queryData = new goog.Uri.QueryData(null, null, opt_ignoreCase), i = 0; i < keys.length; i++) {
    queryData.add(keys[i], values[i]);
  }
  return queryData;
};
goog.Uri.QueryData.prototype.getCount = function() {
  this.ensureKeyMapInitialized_();
  return this.count_;
};
goog.Uri.QueryData.prototype.add = function(key, value) {
  this.ensureKeyMapInitialized_();
  this.invalidateCache_();
  key = this.getKeyName_(key);
  var values = this.keyMap_.get(key);
  values || this.keyMap_.set(key, values = []);
  values.push(value);
  this.count_ = goog.asserts.assertNumber(this.count_) + 1;
  return this;
};
goog.Uri.QueryData.prototype.remove = function(key) {
  this.ensureKeyMapInitialized_();
  key = this.getKeyName_(key);
  return this.keyMap_.containsKey(key) ? (this.invalidateCache_(), this.count_ = goog.asserts.assertNumber(this.count_) - this.keyMap_.get(key).length, this.keyMap_.remove(key)) : !1;
};
goog.Uri.QueryData.prototype.clear = function() {
  this.invalidateCache_();
  this.keyMap_ = null;
  this.count_ = 0;
};
goog.Uri.QueryData.prototype.isEmpty = function() {
  this.ensureKeyMapInitialized_();
  return 0 == this.count_;
};
goog.Uri.QueryData.prototype.containsKey = function(key) {
  this.ensureKeyMapInitialized_();
  key = this.getKeyName_(key);
  return this.keyMap_.containsKey(key);
};
goog.Uri.QueryData.prototype.containsValue = function(value) {
  var vals = this.getValues();
  return goog.array.contains(vals, value);
};
goog.Uri.QueryData.prototype.forEach = function(f, opt_scope) {
  this.ensureKeyMapInitialized_();
  this.keyMap_.forEach(function(values, key) {
    goog.array.forEach(values, function(value) {
      f.call(opt_scope, value, key, this);
    }, this);
  }, this);
};
goog.Uri.QueryData.prototype.getKeys = function() {
  this.ensureKeyMapInitialized_();
  for (var vals = this.keyMap_.getValues(), keys = this.keyMap_.getKeys(), rv = [], i = 0; i < keys.length; i++) {
    for (var val = vals[i], j = 0; j < val.length; j++) {
      rv.push(keys[i]);
    }
  }
  return rv;
};
goog.Uri.QueryData.prototype.getValues = function(opt_key) {
  this.ensureKeyMapInitialized_();
  var rv = [];
  if (goog.isString(opt_key)) {
    this.containsKey(opt_key) && (rv = goog.array.concat(rv, this.keyMap_.get(this.getKeyName_(opt_key))));
  } else {
    for (var values = this.keyMap_.getValues(), i = 0; i < values.length; i++) {
      rv = goog.array.concat(rv, values[i]);
    }
  }
  return rv;
};
goog.Uri.QueryData.prototype.set = function(key, value) {
  this.ensureKeyMapInitialized_();
  this.invalidateCache_();
  key = this.getKeyName_(key);
  this.containsKey(key) && (this.count_ = goog.asserts.assertNumber(this.count_) - this.keyMap_.get(key).length);
  this.keyMap_.set(key, [value]);
  this.count_ = goog.asserts.assertNumber(this.count_) + 1;
  return this;
};
goog.Uri.QueryData.prototype.get = function(key, opt_default) {
  if (!key) {
    return opt_default;
  }
  var values = this.getValues(key);
  return 0 < values.length ? String(values[0]) : opt_default;
};
goog.Uri.QueryData.prototype.setValues = function(key, values) {
  this.remove(key);
  0 < values.length && (this.invalidateCache_(), this.keyMap_.set(this.getKeyName_(key), goog.array.clone(values)), this.count_ = goog.asserts.assertNumber(this.count_) + values.length);
};
goog.Uri.QueryData.prototype.toString = function() {
  if (this.encodedQuery_) {
    return this.encodedQuery_;
  }
  if (!this.keyMap_) {
    return "";
  }
  for (var sb = [], keys = this.keyMap_.getKeys(), i = 0; i < keys.length; i++) {
    for (var key = keys[i], encodedKey = goog.string.urlEncode(key), val = this.getValues(key), j = 0; j < val.length; j++) {
      var param = encodedKey;
      "" !== val[j] && (param += "=" + goog.string.urlEncode(val[j]));
      sb.push(param);
    }
  }
  return this.encodedQuery_ = sb.join("&");
};
goog.Uri.QueryData.prototype.toDecodedString = function() {
  return goog.Uri.decodeOrEmpty_(this.toString());
};
goog.Uri.QueryData.prototype.invalidateCache_ = function() {
  this.encodedQuery_ = null;
};
goog.Uri.QueryData.prototype.filterKeys = function(keys) {
  this.ensureKeyMapInitialized_();
  this.keyMap_.forEach(function(value, key) {
    goog.array.contains(keys, key) || this.remove(key);
  }, this);
  return this;
};
goog.Uri.QueryData.prototype.clone = function() {
  var rv = new goog.Uri.QueryData;
  rv.encodedQuery_ = this.encodedQuery_;
  this.keyMap_ && (rv.keyMap_ = this.keyMap_.clone(), rv.count_ = this.count_);
  return rv;
};
goog.Uri.QueryData.prototype.getKeyName_ = function(arg) {
  var keyName = String(arg);
  this.ignoreCase_ && (keyName = keyName.toLowerCase());
  return keyName;
};
goog.Uri.QueryData.prototype.setIgnoreCase = function(ignoreCase) {
  ignoreCase && !this.ignoreCase_ && (this.ensureKeyMapInitialized_(), this.invalidateCache_(), this.keyMap_.forEach(function(value, key) {
    var lowerCase = key.toLowerCase();
    key != lowerCase && (this.remove(key), this.setValues(lowerCase, value));
  }, this));
  this.ignoreCase_ = ignoreCase;
};
goog.Uri.QueryData.prototype.extend = function(var_args) {
  for (var i = 0; i < arguments.length; i++) {
    goog.structs.forEach(arguments[i], function(value, key) {
      this.add(key, value);
    }, this);
  }
};
ee.data = {};
ee.data.authenticateViaOauth = function(clientId, success, opt_error, opt_extraScopes, opt_onImmediateFailed) {
  var scopes = [ee.data.AUTH_SCOPE_];
  opt_extraScopes && (goog.array.extend(scopes, opt_extraScopes), goog.array.removeDuplicates(scopes));
  ee.data.authClientId_ = clientId;
  ee.data.authScopes_ = scopes;
  goog.isNull(clientId) ? ee.data.authToken_ = null : ee.data.ensureAuthLibLoaded_(function() {
    var onImmediateFailed = opt_onImmediateFailed || goog.partial(ee.data.authenticateViaPopup, success, opt_error);
    ee.data.refreshAuthToken(success, opt_error, onImmediateFailed);
  });
};
ee.data.authenticate = function(clientId, success, opt_error, opt_extraScopes, opt_onImmediateFailed) {
  ee.data.authenticateViaOauth(clientId, success, opt_error, opt_extraScopes, opt_onImmediateFailed);
};
ee.data.authenticateViaPopup = function(opt_success, opt_error) {
  goog.global.gapi.auth.authorize({client_id:ee.data.authClientId_, immediate:!1, scope:ee.data.authScopes_.join(" ")}, goog.partial(ee.data.handleAuthResult_, opt_success, opt_error));
};
ee.data.authenticateViaPrivateKey = function(privateKey, opt_success, opt_error, opt_extraScopes) {
  if ("window" in goog.global) {
    throw Error("Use of private key authentication in the browser is insecure. Consider using OAuth, instead.");
  }
  var scopes = [ee.data.AUTH_SCOPE_, ee.data.STORAGE_SCOPE_];
  opt_extraScopes && (goog.array.extend(scopes, opt_extraScopes), goog.array.removeDuplicates(scopes));
  ee.data.authClientId_ = privateKey.client_email;
  ee.data.authScopes_ = scopes;
  var jwtClient = new googleapis.auth.JWT(privateKey.client_email, null, privateKey.private_key, scopes, null);
  ee.data.setAuthTokenRefresher(function(authArgs, callback) {
    jwtClient.authorize(function(error, token) {
      error ? callback({error:error}) : callback({access_token:token.access_token, token_type:token.token_type, expires_in:(token.expiry_date - Date.now()) / 1000});
    });
  });
  ee.data.refreshAuthToken(opt_success, opt_error);
};
ee.data.cloudApiSymbols = [];
ee.data.setApiKey = function(apiKey) {
  ee.data.cloudApiKey_ = apiKey;
};
ee.data.cloudApiSymbols.push("setApiKey");
ee.data.DEFAULT_PROJECT_ = "earthengine-legacy";
ee.data.setProject = function(project) {
  ee.data.project_ = project;
};
ee.data.cloudApiSymbols.push("setProject");
ee.data.getProject = function() {
  return ee.data.project_;
};
ee.data.cloudApiSymbols.push("getProject");
ee.data.setCloudApiEnabled = function(enable) {
  if (enable && !goog.getObjectByName("gapi")) {
    throw Error('Cloud API requires <script src="https://apis.google.com/js/api.js">');
  }
  ee.data.cloudApiEnabled_ = enable;
};
ee.data.cloudApiSymbols.push("setCloudApiEnabled");
ee.data.getCloudApiEnabled = function() {
  return ee.data.cloudApiEnabled_;
};
ee.data.cloudApiSymbols.push("getCloudApiEnabled");
ee.data.setAuthToken = function(clientId, tokenType, accessToken, expiresIn, opt_extraScopes, opt_callback, opt_updateAuthLibrary) {
  var scopes = [ee.data.AUTH_SCOPE_];
  opt_extraScopes && (goog.array.extend(scopes, opt_extraScopes), goog.array.removeDuplicates(scopes));
  ee.data.authClientId_ = clientId;
  ee.data.authScopes_ = scopes;
  var tokenObject = {token_type:tokenType, access_token:accessToken, state:scopes.join(" "), expires_in:expiresIn};
  ee.data.handleAuthResult_(void 0, void 0, tokenObject);
  !1 === opt_updateAuthLibrary ? opt_callback && opt_callback() : ee.data.ensureAuthLibLoaded_(function() {
    goog.global.gapi.auth.setToken(tokenObject);
    opt_callback && opt_callback();
  });
};
ee.data.refreshAuthToken = function(opt_success, opt_error, opt_onImmediateFailed) {
  if (ee.data.isAuthTokenRefreshingEnabled_()) {
    var authArgs = {client_id:String(ee.data.authClientId_), immediate:!0, scope:ee.data.authScopes_.join(" ")};
    ee.data.authTokenRefresher_(authArgs, function(result) {
      "immediate_failed" == result.error && opt_onImmediateFailed ? opt_onImmediateFailed() : ee.data.handleAuthResult_(opt_success, opt_error, result);
    });
  }
};
ee.data.setAuthTokenRefresher = function(refresher) {
  ee.data.authTokenRefresher_ = refresher;
};
ee.data.getAuthToken = function() {
  ee.data.authTokenExpiration_ && 0 <= goog.now() - ee.data.authTokenExpiration_ && ee.data.clearAuthToken();
  return ee.data.authToken_;
};
ee.data.clearAuthToken = function() {
  ee.data.authToken_ = null;
  ee.data.authTokenExpiration_ = null;
};
ee.data.getAuthClientId = function() {
  return ee.data.authClientId_;
};
ee.data.getAuthScopes = function() {
  return ee.data.authScopes_;
};
ee.data.initialize = function(opt_apiBaseUrl, opt_tileBaseUrl, opt_xsrfToken) {
  goog.isDefAndNotNull(opt_apiBaseUrl) ? ee.data.apiBaseUrl_ = opt_apiBaseUrl : ee.data.initialized_ || (ee.data.apiBaseUrl_ = ee.data.DEFAULT_API_BASE_URL_);
  goog.isDefAndNotNull(opt_tileBaseUrl) ? ee.data.tileBaseUrl_ = opt_tileBaseUrl : ee.data.initialized_ || (ee.data.tileBaseUrl_ = ee.data.DEFAULT_TILE_BASE_URL_);
  goog.isDef(opt_xsrfToken) && (ee.data.xsrfToken_ = opt_xsrfToken);
  !ee.data.cloudApiEnabled_ || ee.data.cloudApiReadyPromise_ && !goog.isDefAndNotNull(opt_apiBaseUrl) || (ee.data.cloudApiReadyPromise_ = new Promise(function(resolve, reject) {
    gapi.load("client", {callback:function() {
      var discoveryDoc = Object.assign({}, googleapidiscovery.earthengine.v1.rest, {rootUrl:ee.data.apiBaseUrl_.replace(/\/api$/, "")});
      gapi.client.init({apiKey:ee.data.cloudApiKey_, discoveryDocs:[discoveryDoc]}).then(function() {
        ee.data.cloudApiReady_ = !0;
        gapi.config.update("client/headers/request", [ee.data.PROFILE_REQUEST_HEADER]);
        resolve();
      });
    }, onerror:reject});
  }), ee.data.setProject(ee.data.DEFAULT_PROJECT_));
  ee.data.initialized_ = !0;
};
ee.data.reset = function() {
  ee.data.apiBaseUrl_ = null;
  ee.data.tileBaseUrl_ = null;
  ee.data.xsrfToken_ = null;
  ee.data.cloudApiReadyPromise_ = null;
  ee.data.cloudApiReady_ = !1;
  goog.getObjectByName("gapi") && gapi.client && delete gapi.client.earthengine;
  ee.data.initialized_ = !1;
};
ee.data.sendCloudApiRequest_ = function(callApi, getResponse, opt_callback, opt_retries) {
  ee.data.initialize();
  var callApiWithHeaders = ee.data.profileHook_ ? function() {
    var request = callApi();
    ee.data.getGapiHeaders_(request)[ee.data.PROFILE_REQUEST_HEADER] = "1";
    return request;
  } : callApi;
  if (opt_callback) {
    var handler = function(payload) {
      return ee.data.handleResponse_(payload.status, function(h) {
        return payload.headers[h.toLowerCase()];
      }, payload.body, null, opt_callback, getResponse || goog.functions.identity);
    };
    ee.data.cloudApiReadyPromise_.then(function() {
      callApiWithHeaders().then(handler, handler);
    });
    return null;
  }
  if (!ee.data.cloudApiReady_) {
    throw Error("Cloud API not ready");
  }
  var xhr = ee.data.hijackXhr_(function() {
    callApiWithHeaders().then(function() {
      return null;
    }, function() {
      return null;
    });
  });
  return ee.data.handleResponse_(xhr.status, function(h) {
    try {
      return xhr.getResponseHeader(h);
    } catch (e) {
      return null;
    }
  }, xhr.responseText, null, void 0, getResponse || goog.functions.identity);
};
ee.data.getGapiHeaders_ = function(request) {
  var hasHeaders = function(value) {
    return goog.isObject(value) && goog.isObject(value.headers);
  }, withHeaders = [];
  Object.values(request).filter(goog.isObject).forEach(function(field) {
    goog.array.extend(withHeaders, Object.values(field).filter(hasHeaders));
  });
  if (1 === withHeaders.length) {
    return withHeaders[0].headers;
  }
  console.error("NO HEADERS:", request);
  throw Error("Incompatible GAPI version: cannot find headers");
};
ee.data.hijackXhr_ = function(action) {
  if (XMLHttpRequest.prototype.HijackedConstructor) {
    throw Error("Cannot initialize synchronous request mode");
  }
  var XhrHijack = function() {
    this.xhr = new this.HijackedConstructor;
    XMLHttpRequest.lastXhr = this.xhr;
  };
  XhrHijack.prototype.open = function(method, url, async, u, p) {
    this.xhr.open(method, url, !1, u, p);
  };
  XhrHijack.prototype.send = function(a) {
    this.xhr.send(a);
  };
  XhrHijack.prototype.abort = function() {
    this.xhr.abort();
  };
  XhrHijack.prototype.overrideMimeType = function(a) {
    this.xhr.overrideMimeType(a);
  };
  XhrHijack.prototype.setRequestHeader = function(a, b) {
    this.xhr.setRequestHeader(a, b);
  };
  XhrHijack.prototype.getResponseHeader = function(a) {
    return this.xhr.getResponseHeader(a);
  };
  XhrHijack.prototype.getAllResponseHeaders = function() {
    return this.xhr.getAllResponseHeaders();
  };
  "onabort onerror onload onloadstart onloadend onprogress onreadystatechange readyState responseText responseType responseXML status statusText upload withCredentials DONE UNSENT HEADERS_RECEIVED LOADING OPENED".split(" ").forEach(function(prop) {
    return Object.defineProperty(XhrHijack.prototype, prop, {get:function() {
      return this.xhr[prop];
    }, set:function(obj) {
      this.xhr[prop] = obj;
    }});
  });
  XhrHijack.prototype.HijackedConstructor = XMLHttpRequest;
  XMLHttpRequest = XhrHijack;
  try {
    return action(), XMLHttpRequest.lastXhr;
  } finally {
    XMLHttpRequest = XMLHttpRequest.prototype.HijackedConstructor;
  }
};
ee.data.setDeadline = function(milliseconds) {
  ee.data.deadlineMs_ = milliseconds;
};
ee.data.setParamAugmenter = function(augmenter) {
  ee.data.paramAugmenter_ = augmenter || goog.functions.identity;
};
ee.data.getApiBaseUrl = function() {
  return ee.data.apiBaseUrl_;
};
ee.data.getTileBaseUrl = function() {
  return ee.data.tileBaseUrl_;
};
ee.data.getXsrfToken = function() {
  return ee.data.xsrfToken_;
};
ee.data.getAlgorithms = function(opt_callback) {
  if (ee.data.cloudApiEnabled_) {
    return ee.data.sendCloudApiRequest_(function() {
      return gapi.client.earthengine.algorithms.list({prettyPrint:!1});
    }, ee.rpc_convert.algorithms, opt_callback);
  }
  var result = ee.data.send_("/algorithms", null, opt_callback, "GET");
  return opt_callback ? null : result;
};
ee.data.getMapId = function(params, opt_callback) {
  if (ee.data.cloudApiEnabled_) {
    if (goog.isString(params.image)) {
      throw Error("Image as JSON string not supported.");
    }
    if (goog.isDef(params.version)) {
      throw Error("Image version specification not supported.");
    }
    var map = {name:null, expression:ee.Serializer.encodeCloudApi(params.image), fileFormat:ee.rpc_convert.fileFormat(params.format), bandIds:ee.rpc_convert.bandList(params.bands), visualizationOptions:ee.rpc_convert.visualizationOptions(params)}, parent = "projects/" + ee.data.getProject(), fields = ["name"];
    return ee.data.sendCloudApiRequest_(function() {
      return gapi.client.earthengine.projects.maps.create({parent:parent, fields:fields}, map);
    }, function(response) {
      return ee.data.makeMapId_(response.name, "", "/v1/{}/tiles", ee.data.cloudApiKey_ ? "?key=" + ee.data.cloudApiKey_ : "");
    }, opt_callback);
  }
  params = goog.object.clone(params);
  goog.isString(params.image) || (params.image = params.image.serialize());
  var makeMapId = function(result) {
    return ee.data.makeMapId_(result.mapid, result.token, "/map/{}", "?token={}");
  };
  return opt_callback ? (ee.data.send_("/mapid", ee.data.makeRequest_(params), function(result, err) {
    return opt_callback(result && makeMapId(result), err);
  }), null) : makeMapId(ee.data.send_("/mapid", ee.data.makeRequest_(params)));
};
ee.data.getTileUrl = function(mapid, x, y, z) {
  return mapid.formatTileUrl(x, y, z);
};
ee.data.makeMapId_ = function(mapid, token, path, suffix) {
  path = ee.data.tileBaseUrl_ + path.replace("{}", mapid);
  suffix = suffix.replace("{}", token);
  return {mapid:mapid, token:token, formatTileUrl:function(x, y, z) {
    var width = Math.pow(2, z);
    x %= width;
    0 > x && (x += width);
    return [path, z, x, y].join("/") + suffix;
  }};
};
ee.data.getValue = function(params, opt_callback) {
  params = goog.object.clone(params);
  return ee.data.send_("/value", ee.data.makeRequest_(params), opt_callback);
};
ee.data.computeValue = function(obj, opt_callback) {
  if (ee.data.cloudApiEnabled_) {
    var expression = ee.Serializer.encodeCloudApi(obj);
    return ee.data.sendCloudApiRequest_(function() {
      return gapi.client.earthengine.value.compute({expression:expression});
    }, function(x) {
      return x.result;
    }, opt_callback);
  }
  var params = {json:ee.Serializer.toJSON(obj)};
  return ee.data.send_("/value", ee.data.makeRequest_(params), opt_callback);
};
ee.data.getThumbId = function(params, opt_callback) {
  if (ee.data.cloudApiEnabled_) {
    if (goog.isString(params.image)) {
      throw Error("Image as JSON string not supported.");
    }
    if (goog.isDef(params.version)) {
      throw Error("Image version specification not supported.");
    }
    if (goog.isDef(params.region)) {
      throw Error('"region" not supported in call to ee.data.getThumbId. Use ee.Image.getThumbURL.');
    }
    var thumbnail = {name:null, expression:ee.Serializer.encodeCloudApi(params.image), fileFormat:ee.rpc_convert.fileFormat(params.format), bandIds:ee.rpc_convert.bandList(params.bands), visualizationOptions:ee.rpc_convert.visualizationOptions(params), grid:null}, fields = ["name"], parent = "projects/" + ee.data.getProject();
    return ee.data.sendCloudApiRequest_(function() {
      return gapi.client.earthengine.projects.thumbnails.create({parent:parent, fields:fields}, thumbnail);
    }, function(response) {
      return {thumbid:response.name, token:""};
    }, opt_callback);
  }
  params = goog.object.clone(params);
  goog.isString(params.image) || (params.image = params.image.serialize());
  goog.isArray(params.dimensions) && (params.dimensions = params.dimensions.join("x"));
  var request = ee.data.makeRequest_(params).add("getid", "1");
  return ee.data.send_("/thumb", request, opt_callback);
};
ee.data.makeThumbUrl = function(id) {
  return ee.data.cloudApiEnabled_ ? ee.data.tileBaseUrl_ + "/v1/" + id.thumbid + ":getPixels" + (ee.data.cloudApiKey_ ? "?key=" + ee.data.cloudApiKey_ : "") : ee.data.tileBaseUrl_ + "/api/thumb?thumbid=" + id.thumbid + "&token=" + id.token;
};
ee.data.getDownloadId = function(params, opt_callback) {
  params = goog.object.clone(params);
  return ee.data.send_("/download", ee.data.makeRequest_(params), opt_callback);
};
ee.data.makeDownloadUrl = function(id) {
  return ee.data.tileBaseUrl_ + "/api/download?docid=" + id.docid + "&token=" + id.token;
};
ee.data.getTableDownloadId = function(params, opt_callback) {
  params = goog.object.clone(params);
  return ee.data.send_("/table", ee.data.makeRequest_(params), opt_callback);
};
ee.data.makeTableDownloadUrl = function(id) {
  return ee.data.tileBaseUrl_ + "/api/table?docid=" + id.docid + "&token=" + id.token;
};
ee.data.withProfiling = function(hook, body, opt_this) {
  var saved = ee.data.profileHook_;
  try {
    return ee.data.profileHook_ = hook, body.call(opt_this);
  } finally {
    ee.data.profileHook_ = saved;
  }
};
ee.data.newTaskId = function(opt_count, opt_callback) {
  if (ee.data.cloudApiEnabled_) {
    var rand = function(n) {
      return Math.floor(Math.random() * n);
    }, hex = function(d) {
      return rand(Math.pow(2, 4 * d)).toString(16).padStart(d, "0");
    }, variantPart = function() {
      return (8 + rand(4)).toString(16) + hex(3);
    }, uuids = goog.array.range(opt_count || 1).map(function() {
      return [hex(8), hex(4), "4" + hex(3), variantPart(), hex(12)].join("-");
    });
    return opt_callback ? opt_callback(uuids) : uuids;
  }
  var params = {};
  goog.isNumber(opt_count) && (params.count = opt_count);
  return ee.data.send_("/newtaskid", ee.data.makeRequest_(params), opt_callback);
};
ee.data.getTaskStatus = function(taskId, opt_callback) {
  if (ee.data.cloudApiEnabled_) {
    var get = function(id) {
      return gapi.client.earthengine.operations.get({name:ee.rpc_convert.taskIdToOperationName(id)});
    };
    return ee.data.sendCloudApiRequest_(function() {
      return ee.data.singletonOrBatch_(taskId, get);
    }, function(response) {
      return 1 === taskId.length ? ee.rpc_convert.operationToTask(response) : taskId.map(function(id) {
        return ee.rpc_convert.operationToTask(response[id]);
      });
    }, opt_callback);
  }
  var url = "/taskstatus?q=" + ee.data.makeStringArray_(taskId).join();
  return ee.data.send_(url, null, opt_callback, "GET");
};
ee.data.makeStringArray_ = function(value) {
  if (goog.isString(value)) {
    return [value];
  }
  if (goog.isArray(value)) {
    return value;
  }
  throw Error("Invalid value: expected a string or an array of strings.");
};
ee.data.TASKLIST_PAGE_SIZE_ = 500;
ee.data.getTaskList = function(opt_callback) {
  return ee.data.getTaskListWithLimit(void 0, opt_callback);
};
ee.data.getTaskListWithLimit = function(opt_limit, opt_callback) {
  function buildParams(pageToken) {
    var params = {pagesize:ee.data.TASKLIST_PAGE_SIZE_};
    opt_limit && (params.pagesize = Math.min(params.pagesize, opt_limit - taskListResponse.tasks.length));
    pageToken && (params.pagetoken = pageToken);
    return params;
  }
  function inner(callback, opt_pageToken) {
    var params = buildParams(opt_pageToken);
    ee.data.send_("/tasklist", ee.data.makeRequest_(params), function(resp, err) {
      err ? callback(taskListResponse, err) : (goog.array.extend(taskListResponse.tasks, resp.tasks), !resp.next_page_token || opt_limit && taskListResponse.tasks.length >= opt_limit ? callback(taskListResponse) : inner(callback, resp.next_page_token));
    }, "GET");
  }
  if (ee.data.cloudApiEnabled_) {
    var convert = function(ops) {
      return {tasks:ops.map(ee.rpc_convert.operationToTask)};
    };
    return opt_callback ? (ee.data.listOperations(opt_limit, function(v, e) {
      return opt_callback(v ? convert(v) : null, e);
    }), null) : convert(ee.data.listOperations(opt_limit));
  }
  var taskListResponse = {tasks:[]};
  if (opt_callback) {
    return inner(opt_callback), null;
  }
  for (var nextPageToken = "";;) {
    var params$jscomp$0 = buildParams(nextPageToken), resp = ee.data.send_("/tasklist", ee.data.makeRequest_(params$jscomp$0), void 0, "GET");
    goog.array.extend(taskListResponse.tasks, resp.tasks);
    nextPageToken = resp.next_page_token;
    if (!resp.next_page_token || opt_limit && taskListResponse.tasks.length >= opt_limit) {
      break;
    }
  }
  return taskListResponse;
};
ee.data.listOperations = function(opt_limit, opt_callback) {
  var ops = [], truncatedOps = function() {
    return opt_limit ? ops.slice(0, opt_limit) : ops;
  }, request = {name:"operations", pageSize:ee.data.TASKLIST_PAGE_SIZE_, filter:null, pageToken:null}, callApi = function() {
    return gapi.client.earthengine.operations.list(request);
  }, noopCallback = opt_callback ? function() {
    return 0;
  } : void 0, getResponse = function(r) {
    goog.array.extend(ops, r.operations || []);
    !r.nextPageToken || opt_limit && ops.length >= opt_limit ? opt_callback && opt_callback(truncatedOps()) : (request.pageToken = r.nextPageToken, ee.data.sendCloudApiRequest_(callApi, getResponse, noopCallback));
    return null;
  };
  ee.data.sendCloudApiRequest_(callApi, getResponse, noopCallback);
  return opt_callback ? null : truncatedOps();
};
ee.data.cancelOperation = function(operationName, opt_callback) {
  var cancel = function(name) {
    return gapi.client.earthengine.operations.cancel({name:name});
  };
  ee.data.sendCloudApiRequest_(function() {
    return ee.data.singletonOrBatch_(operationName, cancel);
  }, null, opt_callback);
};
ee.data.getOperation = function(operationName, opt_callback) {
  var get = function(id) {
    return gapi.client.earthengine.operations.get({name:ee.rpc_convert.taskIdToOperationName(id)});
  };
  return ee.data.sendCloudApiRequest_(function() {
    return ee.data.singletonOrBatch_(operationName, get);
  }, null, opt_callback);
};
ee.data.singletonOrBatch_ = function(requestParams, buildRequest) {
  requestParams = ee.data.makeStringArray_(requestParams);
  if (1 === requestParams.length) {
    return buildRequest(requestParams[0]);
  }
  var batch = gapi.client.newBatch();
  requestParams.forEach(function(param) {
    batch.add(buildRequest(param), {id:param});
  });
  return batch;
};
ee.data.cancelTask = function(taskId, opt_callback) {
  return ee.data.updateTask(taskId, ee.data.TaskUpdateActions.CANCEL, opt_callback);
};
ee.data.updateTask = function(taskId, action, opt_callback) {
  if (!goog.object.containsValue(ee.data.TaskUpdateActions, action)) {
    throw Error("Invalid action: " + action);
  }
  taskId = ee.data.makeStringArray_(taskId);
  if (ee.data.cloudApiEnabled_) {
    var operations = taskId.map(ee.rpc_convert.taskIdToOperationName);
    ee.data.cancelOperation(operations, opt_callback);
    return null;
  }
  return ee.data.send_("/updatetask", ee.data.makeRequest_({id:taskId, action:action}), opt_callback, "POST");
};
ee.data.startProcessing = function(taskId, params, opt_callback) {
  if (ee.data.cloudApiEnabled_) {
    params.id = taskId;
    var taskType = params.type;
    switch(taskType) {
      case ee.data.ExportType.IMAGE:
        var imageRequest = ee.rpc_convert_batch.taskToExportImageRequest(params);
        var callApi = function() {
          return gapi.client.earthengine.exportImage(imageRequest);
        };
        break;
      case ee.data.ExportType.TABLE:
        var tableRequest = ee.rpc_convert_batch.taskToExportTableRequest(params);
        callApi = function() {
          return gapi.client.earthengine.exportTable(tableRequest);
        };
        break;
      case ee.data.ExportType.VIDEO:
        var videoRequest = ee.rpc_convert_batch.taskToExportVideoRequest(params);
        callApi = function() {
          return gapi.client.earthengine.exportVideo(videoRequest);
        };
        break;
      case ee.data.ExportType.MAP:
        var mapRequest = ee.rpc_convert_batch.taskToExportMapRequest(params);
        callApi = function() {
          return gapi.client.earthengine.exportMap(mapRequest);
        };
        break;
      case ee.data.ExportType.VIDEO_MAP:
        var videoMapRequest = ee.rpc_convert_batch.taskToExportVideoMapRequest(params);
        callApi = function() {
          return gapi.client.earthengine.exportVideoMap(videoMapRequest);
        };
        break;
      default:
        throw Error("Unable to start processing for task of type " + taskType);
    }
    return ee.data.sendCloudApiRequest_(callApi, function(body) {
      return ee.rpc_convert.operationToProcessingResponse(body);
    }, opt_callback);
  }
  params = goog.object.clone(params);
  goog.isDefAndNotNull(params.element) && (params.json = params.element.serialize(), delete params.element);
  params.id = taskId;
  return ee.data.send_("/processingrequest", ee.data.makeRequest_(params), opt_callback);
};
ee.data.startIngestion = function(taskId, request, opt_callback) {
  var params = {id:taskId, request:goog.json.serialize(request)};
  return ee.data.send_("/ingestionrequest", ee.data.makeRequest_(params), opt_callback);
};
ee.data.ingestImage = function(taskId, imageManifest, callback) {
  var body = {imageManifest:imageManifest, requestId:taskId, overwrite:!1, description:null};
  ee.data.sendCloudApiRequest_(function() {
    return gapi.client.earthengine.image.ingest(body);
  }, null, callback, taskId ? void 0 : 0);
};
ee.data.ingestTable = function(taskId, tableManifest, callback) {
  var body = {tableManifest:tableManifest, requestId:taskId, overwrite:!1, description:null};
  ee.data.sendCloudApiRequest_(function() {
    return gapi.client.earthengine.table.ingest(body);
  }, null, callback, taskId ? void 0 : 0);
};
ee.data.startTableIngestion = function(taskId, request, opt_callback) {
  var params = {id:taskId, tableRequest:goog.json.serialize(request)};
  return ee.data.send_("/ingestionrequest", ee.data.makeRequest_(params), opt_callback);
};
ee.data.getAsset = function(id, opt_callback) {
  if (ee.data.cloudApiEnabled_) {
    var body = {name:ee.rpc_convert.assetIdToAssetName(id), prettyPrint:!1};
    return ee.data.sendCloudApiRequest_(function() {
      return gapi.client.earthengine.assets.get(body);
    }, null, opt_callback);
  }
  return ee.data.send_("/info", (new goog.Uri.QueryData).add("id", id), opt_callback);
};
ee.data.cloudApiSymbols.push("getAsset");
ee.data.getInfo = ee.data.getAsset;
ee.data.getList = function(params, opt_callback) {
  if (ee.data.cloudApiEnabled_) {
    if (Object.keys(params).every(function(k) {
      return "id" === k || "num" === k;
    })) {
      var body = ee.rpc_convert.getListToListAssets(params);
      return ee.data.sendCloudApiRequest_(function() {
        return gapi.client.earthengine.projects.assets.list(body);
      }, ee.rpc_convert.listAssetsToGetList, opt_callback);
    }
    var body$18 = ee.rpc_convert.getListToListImages(params);
    return ee.data.sendCloudApiRequest_(function() {
      return gapi.client.earthengine.projects.assets.listImages({fields:"assets(type,path)"}, body$18);
    }, ee.rpc_convert.listImagesToGetList, opt_callback);
  }
  var request = ee.data.makeRequest_(params);
  return ee.data.send_("/list", request, opt_callback);
};
ee.data.listAssets = function(body, opt_callback) {
  return ee.data.sendCloudApiRequest_(function() {
    return gapi.client.earthengine.assets.list(body);
  }, null, opt_callback);
};
ee.data.cloudApiSymbols.push("listAssets");
ee.data.listImages = function(body, opt_callback) {
  return ee.data.sendCloudApiRequest_(function() {
    return gapi.client.earthengine.assets.listImages(body);
  }, null, opt_callback);
};
ee.data.cloudApiSymbols.push("listImages");
ee.data.listBuckets = function(opt_callback) {
  return ee.data.sendCloudApiRequest_(function() {
    return gapi.client.earthengine.listBuckets({});
  }, null, opt_callback);
};
ee.data.cloudApiSymbols.push("listBuckets");
ee.data.getAssetRoots = function(opt_callback) {
  return ee.data.cloudApiEnabled_ ? ee.data.sendCloudApiRequest_(function() {
    return gapi.client.earthengine.listBuckets({});
  }, ee.rpc_convert.listBucketsToGetList, opt_callback) : ee.data.send_("/buckets", null, opt_callback, "GET");
};
ee.data.createAssetHome = function(requestedId, opt_callback) {
  if (ee.data.cloudApiEnabled_) {
    var body = {parent:ee.rpc_convert.projectParentFromPath(requestedId), type:"Folder", name:ee.rpc_convert.assetIdToAssetName(requestedId)};
    ee.data.sendCloudApiRequest_(function() {
      return gapi.client.earthengine.projects.assets.create(body);
    }, null, opt_callback);
  } else {
    var request = ee.data.makeRequest_({id:requestedId});
    ee.data.send_("/createbucket", request, opt_callback);
  }
};
ee.data.createAsset = function(value, opt_path, opt_force, opt_properties, opt_callback) {
  if (ee.data.cloudApiEnabled_) {
    if (opt_force) {
      throw Error("Asset overwrite not supported.");
    }
    if (goog.isString(value)) {
      throw Error("Asset cannot be specified as string.");
    }
    var name = value.name || opt_path && ee.rpc_convert.assetIdToAssetName(opt_path);
    if (!name) {
      throw Error("Either asset name or opt_path must be specified.");
    }
    var split = name.indexOf("/assets/");
    if (-1 === split) {
      throw Error("Asset name must contain /assets/.");
    }
    var asset = Object.assign({}, value);
    delete asset.name;
    opt_properties && !asset.properties && (asset.properties = opt_properties);
    asset.type = ee.rpc_convert.assetTypeForCreate(asset.type);
    var body = {asset:asset, parent:name.slice(0, split), assetId:name.slice(split + 8), overwrite:opt_force || !1};
    return ee.data.sendCloudApiRequest_(function() {
      return gapi.client.earthengine.projects.assets.create(body);
    }, null, opt_callback);
  }
  goog.isString(value) || (value = goog.json.serialize(value));
  var args = {value:value};
  void 0 !== opt_path && (args.id = opt_path);
  args.force = opt_force || !1;
  void 0 != opt_properties && (args.properties = goog.json.serialize(opt_properties));
  return ee.data.send_("/create", ee.data.makeRequest_(args), opt_callback);
};
ee.data.createFolder = function(path, opt_force, opt_callback) {
  if (ee.data.cloudApiEnabled_) {
    var body = {parent:ee.rpc_convert.projectParentFromPath(path), type:"Folder", name:ee.rpc_convert.assetIdToAssetName(path)};
    return ee.data.sendCloudApiRequest_(function() {
      return gapi.client.earthengine.projects.assets.create(body);
    }, null, opt_callback);
  }
  return ee.data.send_("/createfolder", ee.data.makeRequest_({id:path, force:opt_force || !1}), opt_callback);
};
ee.data.search = function(query, opt_callback) {
  return ee.data.send_("/search", ee.data.makeRequest_({q:query}), opt_callback);
};
ee.data.renameAsset = function(sourceId, destinationId, opt_callback) {
  if (ee.data.cloudApiEnabled_) {
    var body = {sourceName:ee.rpc_convert.assetIdToAssetName(sourceId), destinationName:ee.rpc_convert.assetIdToAssetName(destinationId), sourcePath:null, destinationPath:null};
    ee.data.sendCloudApiRequest_(function() {
      return gapi.client.earthengine.assets.move(body);
    }, null, opt_callback);
  } else {
    ee.data.send_("/rename", ee.data.makeRequest_({sourceId:sourceId, destinationId:destinationId}), opt_callback);
  }
};
ee.data.copyAsset = function(sourceId, destinationId, opt_callback) {
  if (ee.data.cloudApiEnabled_) {
    var body = {sourceName:ee.rpc_convert.assetIdToAssetName(sourceId), destinationName:ee.rpc_convert.assetIdToAssetName(destinationId), overwrite:!1, sourcePath:null, destinationPath:null, bandIds:null};
    ee.data.sendCloudApiRequest_(function() {
      return gapi.client.earthengine.assets.copy(body);
    }, null, opt_callback);
  } else {
    ee.data.send_("/copy", ee.data.makeRequest_({sourceId:sourceId, destinationId:destinationId}), opt_callback);
  }
};
ee.data.deleteAsset = function(assetId, opt_callback) {
  if (ee.data.cloudApiEnabled_) {
    var body = {name:ee.rpc_convert.assetIdToAssetName(assetId)};
    ee.data.sendCloudApiRequest_(function() {
      return gapi.client.earthengine.assets["delete"](body);
    }, null, opt_callback);
  } else {
    ee.data.send_("/delete", ee.data.makeRequest_({id:assetId}), opt_callback);
  }
};
ee.data.getAssetAcl = function(assetId, opt_callback) {
  if (ee.data.cloudApiEnabled_) {
    var body = {resource:ee.rpc_convert.assetIdToAssetName(assetId), prettyPrint:!1};
    return ee.data.sendCloudApiRequest_(function() {
      return gapi.client.earthengine.projects.assets.getIamPolicy(body);
    }, ee.rpc_convert.iamPolicyToAcl, opt_callback);
  }
  return ee.data.send_("/getacl", ee.data.makeRequest_({id:assetId}), opt_callback, "GET");
};
ee.data.getIamPolicy = function(assetId, opt_callback) {
  var body = {resource:ee.rpc_convert.assetIdToAssetName(assetId), prettyPrint:!1};
  return ee.data.sendCloudApiRequest_(function() {
    return gapi.client.earthengine.projects.assets.getIamPolicy(body);
  }, null, opt_callback);
};
ee.data.setIamPolicy = function(assetId, policy, opt_callback) {
  var body = {policy:policy, resource:ee.rpc_convert.assetIdToAssetName(assetId), prettyPrint:!1};
  return ee.data.sendCloudApiRequest_(function() {
    return gapi.client.earthengine.projects.assets.setIamPolicy(body);
  }, null, opt_callback);
};
ee.data.updateAsset = function(assetId, asset, updateMask, opt_callback) {
  var body = {name:ee.rpc_convert.assetIdToAssetName(assetId), asset:asset, updateMask:{paths:updateMask || []}};
  ee.data.sendCloudApiRequest_(function() {
    return gapi.client.earthengine.assets.patch(body);
  }, null, opt_callback);
};
ee.data.setAssetAcl = function(assetId, aclUpdate, opt_callback) {
  if (ee.data.cloudApiEnabled_) {
    var body = {resource:ee.rpc_convert.assetIdToAssetName(assetId), policy:ee.rpc_convert.aclToIamPolicy(aclUpdate), prettyPrint:!1};
    ee.data.sendCloudApiRequest_(function() {
      return gapi.client.earthengine.projects.assets.setIamPolicy(body);
    }, null, opt_callback);
  } else {
    var request = {id:assetId, value:goog.json.serialize(aclUpdate)};
    ee.data.send_("/setacl", ee.data.makeRequest_(request), opt_callback);
  }
};
ee.data.setAssetProperties = function(assetId, properties, opt_callback) {
  if (ee.data.cloudApiEnabled_) {
    var updateMask = Object.keys(properties).map(function(k) {
      return "properties." + k;
    });
    ee.data.updateAsset(assetId, {properties:properties}, updateMask, opt_callback);
  } else {
    var request = {id:assetId, properties:goog.json.serialize(properties)};
    ee.data.send_("/setproperties", ee.data.makeRequest_(request), opt_callback);
  }
};
ee.data.getAssetRootQuota = function(rootId, opt_callback) {
  if (ee.data.cloudApiEnabled_) {
    var body = {name:ee.rpc_convert.assetIdToAssetName(rootId), prettyPrint:!1};
    return ee.data.sendCloudApiRequest_(function() {
      return gapi.client.earthengine.assets.get(body);
    }, function(asset) {
      if (!asset.quota) {
        throw Error(rootId + " is not a root folder.");
      }
      var q = function(field) {
        return Number(asset.quota[field] || 0);
      };
      return {assetCount:{usage:q("assetCount"), limit:q("maxAssetCount")}, assetSize:{usage:q("sizeBytes"), limit:q("maxSizeBytes")}};
    }, opt_callback);
  }
  return ee.data.send_("/quota", ee.data.makeRequest_({id:rootId}), opt_callback, "GET");
};
ee.data.AssetType = {ALGORITHM:"Algorithm", FOLDER:"Folder", IMAGE:"Image", IMAGE_COLLECTION:"ImageCollection", TABLE:"Table", UNKNOWN:"Unknown"};
ee.data.ExportType = {IMAGE:"EXPORT_IMAGE", MAP:"EXPORT_TILES", TABLE:"EXPORT_FEATURES", VIDEO:"EXPORT_VIDEO", VIDEO_MAP:"EXPORT_VIDEO_MAP"};
ee.data.ExportState = {UNSUBMITTED:"UNSUBMITTED", READY:"READY", RUNNING:"RUNNING", COMPLETED:"COMPLETED", FAILED:"FAILED", CANCEL_REQUESTED:"CANCEL_REQUESTED", CANCELLED:"CANCELLED"};
ee.data.ExportDestination = {DRIVE:"DRIVE", GCS:"GOOGLE_CLOUD_STORAGE", ASSET:"ASSET"};
ee.data.SystemTimeProperty = {START:"system:time_start", END:"system:time_end"};
ee.data.SYSTEM_ASSET_SIZE_PROPERTY = "system:asset_size";
ee.data.AssetDetailsProperty = {TITLE:"system:title", DESCRIPTION:"system:description", TAGS:"system:tags"};
ee.data.ALLOWED_DESCRIPTION_HTML_TABLE_ELEMENTS_ = "col colgroup caption table tbody td tfoot th thead tr".split(" ");
ee.data.ALLOWED_DESCRIPTION_HTML_ELEMENTS = ee.data.ALLOWED_DESCRIPTION_HTML_TABLE_ELEMENTS_.concat("a code em i li ol p strong sub sup ul".split(" "));
ee.data.ShortAssetDescription = function() {
};
ee.data.AssetAcl = function() {
};
ee.data.AssetAclUpdate = function() {
};
ee.data.AssetQuotaEntry = function() {
};
ee.data.AssetQuotaDetails = function() {
};
ee.data.FolderDescription = function() {
};
ee.data.FeatureCollectionDescription = function() {
};
ee.data.FeatureVisualizationParameters = function() {
};
ee.data.GeoJSONFeature = function() {
};
ee.data.GeoJSONGeometry = function() {
};
ee.data.GeoJSONGeometryCrs = function() {
};
ee.data.GeoJSONGeometryCrsProperties = function() {
};
ee.data.ImageCollectionDescription = function() {
};
ee.data.ImageDescription = function() {
};
ee.data.TableDescription = function() {
};
ee.data.TableDownloadParameters = function() {
};
ee.data.ImageVisualizationParameters = function() {
};
ee.data.ThumbnailOptions = function() {
};
$jscomp.inherits(ee.data.ThumbnailOptions, ee.data.ImageVisualizationParameters);
ee.data.BandDescription = function() {
};
ee.data.PixelTypeDescription = function() {
};
ee.data.AlgorithmSignature = function() {
};
ee.data.AlgorithmArgument = function() {
};
ee.data.ThumbnailId = function() {
};
ee.data.DownloadId = function() {
};
ee.data.RawMapId = function() {
};
ee.data.MapId = function() {
};
$jscomp.inherits(ee.data.MapId, ee.data.RawMapId);
ee.data.MapZoomRange = {MIN:0, MAX:24};
ee.data.TaskStatus = function() {
};
ee.data.ProcessingResponse = function() {
};
ee.data.TaskListResponse = function() {
};
ee.data.TaskUpdateActions = {CANCEL:"CANCEL", UPDATE:"UPDATE"};
ee.data.AssetDescription = function() {
};
ee.data.IngestionRequest = function() {
};
ee.data.MissingData = function() {
};
ee.data.PyramidingPolicy = {MEAN:"MEAN", MODE:"MODE", MIN:"MIN", MAX:"MAX", SAMPLE:"SAMPLE"};
ee.data.Band = function() {
};
ee.data.Tileset = function() {
};
ee.data.FileBand = function() {
};
ee.data.FileSource = function() {
};
ee.data.TableIngestionRequest = function() {
};
ee.data.TableSource = function() {
};
$jscomp.inherits(ee.data.TableSource, ee.data.FileSource);
ee.data.AuthArgs = function() {
};
ee.data.AuthResponse = function() {
};
ee.data.AuthPrivateKey = function() {
};
ee.data.send_ = function(path, params, opt_callback, opt_method) {
  ee.data.initialize();
  var profileHookAtCallTime = ee.data.profileHook_, headers = {"Content-Type":"application/x-www-form-urlencoded"}, authToken = ee.data.getAuthToken();
  if (goog.isDefAndNotNull(authToken)) {
    headers.Authorization = authToken;
  } else {
    if (opt_callback && ee.data.isAuthTokenRefreshingEnabled_()) {
      return ee.data.refreshAuthToken(function() {
        ee.data.withProfiling(profileHookAtCallTime, function() {
          ee.data.send_(path, params, opt_callback, opt_method);
        });
      }), null;
    }
  }
  var method = opt_method || "POST";
  params = params ? params.clone() : new goog.Uri.QueryData;
  profileHookAtCallTime && params.add("profiling", "1");
  null != ee.data.cloudApiKey_ && params.add("key", ee.data.cloudApiKey_);
  params = ee.data.paramAugmenter_(params, path);
  goog.isDefAndNotNull(ee.data.xsrfToken_) && (headers["X-XSRF-Token"] = ee.data.xsrfToken_);
  var requestData = params ? params.toString() : "";
  "GET" != method || goog.string.isEmptyOrWhitespace(requestData) || (path += goog.string.contains(path, "?") ? "&" : "?", path += requestData, requestData = null);
  var url = ee.data.apiBaseUrl_ + path;
  if (opt_callback) {
    return ee.data.requestQueue_.push(ee.data.buildAsyncRequest_(url, opt_callback, method, requestData, headers)), ee.data.RequestThrottle_.fire(), null;
  }
  for (var setRequestHeader = function(value, key) {
    this.setRequestHeader && this.setRequestHeader(key, value);
  }, xmlHttp, retries = 0;;) {
    xmlHttp = goog.net.XmlHttp();
    xmlHttp.open(method, url, !1);
    goog.object.forEach(headers, setRequestHeader, xmlHttp);
    xmlHttp.send(requestData);
    if (429 != xmlHttp.status || retries > ee.data.MAX_SYNC_RETRIES_) {
      break;
    }
    retries++;
  }
  return ee.data.handleResponse_(xmlHttp.status, function getResponseHeaderSafe(header) {
    try {
      return xmlHttp.getResponseHeader(header);
    } catch (e) {
      return null;
    }
  }, xmlHttp.responseText, profileHookAtCallTime);
};
ee.data.buildAsyncRequest_ = function(url, callback, method, content, headers) {
  var retries = 0, request = {url:url, method:method, content:content, headers:headers}, profileHookAtCallTime = ee.data.profileHook_;
  request.callback = function(e) {
    var xhrIo = e.target;
    return 429 == xhrIo.getStatus() && retries < ee.data.MAX_ASYNC_RETRIES_ ? (retries++, setTimeout(function() {
      ee.data.requestQueue_.push(request);
      ee.data.RequestThrottle_.fire();
    }, ee.data.calculateRetryWait_(retries)), null) : ee.data.handleResponse_(xhrIo.getStatus(), goog.bind(xhrIo.getResponseHeader, xhrIo), xhrIo.getResponseText(), profileHookAtCallTime, callback);
  };
  return request;
};
ee.data.handleResponse_ = function(status, getResponseHeader, responseText, profileHook, opt_callback, opt_getData) {
  opt_getData = void 0 === opt_getData ? function(response) {
    return response.data;
  } : opt_getData;
  var profileId = getResponseHeader(ee.data.PROFILE_HEADER);
  profileId && profileHook && profileHook(profileId);
  var contentType = getResponseHeader("Content-Type");
  contentType = contentType ? contentType.replace(/;.*/, "") : "application/json";
  if ("application/json" == contentType || "text/json" == contentType) {
    try {
      var response$0 = JSON.parse(responseText);
      var data = opt_getData(response$0);
    } catch (e) {
      var errorMessage = "Invalid JSON: " + responseText;
    }
  } else {
    errorMessage = "Response was unexpectedly not JSON, but " + contentType;
  }
  if (goog.isObject(response$0)) {
    "error" in response$0 && "message" in response$0.error ? errorMessage = response$0.error.message : void 0 === data && (errorMessage = "Malformed response: " + responseText);
  } else {
    if (0 === status) {
      errorMessage = "Failed to contact Earth Engine servers. Please check your connection, firewall, or browser extension settings.";
    } else {
      if (200 > status || 300 <= status) {
        errorMessage = "Server returned HTTP code: " + status;
      }
    }
  }
  if (opt_callback) {
    return opt_callback(data, errorMessage), null;
  }
  if (!errorMessage) {
    return data;
  }
  throw Error(errorMessage);
};
ee.data.ensureAuthLibLoaded_ = function(callback) {
  var done = function() {
    goog.global.gapi.config.update("client/cors", !0);
    ee.data.authTokenRefresher_ || ee.data.setAuthTokenRefresher(goog.global.gapi.auth.authorize);
    callback();
  };
  if (goog.isObject(goog.global.gapi) && goog.isObject(goog.global.gapi.auth) && goog.isFunction(goog.global.gapi.auth.authorize)) {
    done();
  } else {
    for (var callbackName = goog.now().toString(36); callbackName in goog.global;) {
      callbackName += "_";
    }
    goog.global[callbackName] = function() {
      delete goog.global[callbackName];
      done();
    };
    goog.net.jsloader.safeLoad(goog.html.TrustedResourceUrl.format(ee.data.AUTH_LIBRARY_URL_, {onload:callbackName}));
  }
};
ee.data.handleAuthResult_ = function(success, error, result) {
  if (result.access_token) {
    var token = result.token_type + " " + result.access_token;
    if (result.expires_in || 0 === result.expires_in) {
      var expiresInMs = 900 * result.expires_in;
      setTimeout(ee.data.refreshAuthToken, 0.9 * expiresInMs);
      ee.data.authTokenExpiration_ = goog.now() + expiresInMs;
    }
    ee.data.authToken_ = token;
    success && success();
  } else {
    error && error(result.error || "Unknown error.");
  }
};
ee.data.makeRequest_ = function(params) {
  for (var request = new goog.Uri.QueryData, $jscomp$iter$10 = $jscomp.makeIterator(Object.entries(params)), $jscomp$key$ = $jscomp$iter$10.next(); !$jscomp$key$.done; $jscomp$key$ = $jscomp$iter$10.next()) {
    var $jscomp$destructuring$var5 = $jscomp.makeIterator($jscomp$key$.value), name = $jscomp$destructuring$var5.next().value, item = $jscomp$destructuring$var5.next().value;
    request.set(name, item);
  }
  return request;
};
ee.data.setupMockSend = function(opt_calls) {
  function getResponse(url, method, data) {
    url = url.replace(apiBaseUrl, "");
    if (url in calls) {
      var response = calls[url];
    } else {
      throw Error(url + " mock response not specified");
    }
    goog.isFunction(response) && (response = response(url, method, data));
    goog.isString(response) && (response = {text:response, status:200, contentType:"application/json; charset=utf-8"});
    if (!goog.isString(response.text)) {
      throw Error(url + " mock response missing/invalid text");
    }
    if (!goog.isNumber(response.status) && !goog.isFunction(response.status)) {
      throw Error(url + " mock response missing/invalid status");
    }
    return response;
  }
  var calls = opt_calls ? goog.object.clone(opt_calls) : {}, apiBaseUrl;
  goog.net.XhrIo.send = function(url, callback, method, data) {
    apiBaseUrl = apiBaseUrl || ee.data.apiBaseUrl_;
    var responseData = getResponse(url, method, data), e = new function() {
      this.target = {};
    };
    e.target.getResponseText = function() {
      return responseData.text;
    };
    e.target.getStatus = goog.isFunction(responseData.status) ? responseData.status : function() {
      return responseData.status;
    };
    e.target.getResponseHeader = function(header) {
      return "Content-Type" === header ? responseData.contentType : null;
    };
    setTimeout(goog.bind(callback, e, e), 0);
    return new goog.net.XhrIo;
  };
  var fakeXmlHttp = function() {
  };
  fakeXmlHttp.prototype.open = function(method, urlIn) {
    apiBaseUrl = apiBaseUrl || ee.data.apiBaseUrl_;
    this.url = urlIn;
    this.method = method;
  };
  fakeXmlHttp.prototype.setRequestHeader = function() {
  };
  fakeXmlHttp.prototype.getResponseHeader = function(header) {
    return "Content-Type" === header ? this.contentType_ || null : null;
  };
  fakeXmlHttp.prototype.send = function(data) {
    var responseData = getResponse(this.url, this.method, data);
    this.responseText = responseData.text;
    this.status = goog.isFunction(responseData.status) ? responseData.status() : responseData.status;
    this.contentType_ = responseData.contentType;
  };
  goog.net.XmlHttp = function() {
    return new fakeXmlHttp;
  };
};
ee.data.isAuthTokenRefreshingEnabled_ = function() {
  return !(!ee.data.authTokenRefresher_ || !ee.data.authClientId_);
};
ee.data.calculateRetryWait_ = function(retryCount) {
  return Math.min(ee.data.MAX_RETRY_WAIT_, Math.pow(2, retryCount) * ee.data.BASE_RETRY_WAIT_);
};
ee.data.sleep_ = function(timeInMs) {
  for (var end = (new Date).getTime() + timeInMs; (new Date).getTime() < end;) {
  }
};
ee.data.NetworkRequest_ = function() {
};
ee.data.requestQueue_ = [];
ee.data.REQUEST_THROTTLE_INTERVAL_MS_ = 350;
ee.data.RequestThrottle_ = new goog.async.Throttle(function() {
  var request = ee.data.requestQueue_.shift();
  request && goog.net.XhrIo.send(request.url, request.callback, request.method, request.content, request.headers, ee.data.deadlineMs_);
  goog.array.isEmpty(ee.data.requestQueue_) || ee.data.RequestThrottle_.fire();
}, ee.data.REQUEST_THROTTLE_INTERVAL_MS_);
ee.data.apiBaseUrl_ = null;
ee.data.tileBaseUrl_ = null;
ee.data.xsrfToken_ = null;
ee.data.paramAugmenter_ = goog.functions.identity;
ee.data.authToken_ = null;
ee.data.authTokenExpiration_ = null;
ee.data.authClientId_ = null;
ee.data.authScopes_ = [];
ee.data.authTokenRefresher_ = null;
ee.data.AUTH_SCOPE_ = "https://www.googleapis.com/auth/earthengine";
ee.data.AUTH_LIBRARY_URL_ = goog.string.Const.from("https://apis.google.com/js/client.js?onload=%{onload}");
ee.data.STORAGE_SCOPE_ = "https://www.googleapis.com/auth/devstorage.read_write";
ee.data.cloudApiKey_ = null;
ee.data.cloudApiEnabled_ = !1;
ee.data.cloudApiReadyPromise_ = null;
ee.data.cloudApiReady_ = !1;
ee.data.initialized_ = !1;
ee.data.deadlineMs_ = 0;
ee.data.profileHook_ = null;
ee.data.BASE_RETRY_WAIT_ = 1000;
ee.data.MAX_RETRY_WAIT_ = 120000;
ee.data.MAX_ASYNC_RETRIES_ = 10;
ee.data.MAX_SYNC_RETRIES_ = 5;
ee.data.PROFILE_HEADER = "X-Earth-Engine-Computation-Profile";
ee.data.PROFILE_REQUEST_HEADER = "X-Earth-Engine-Computation-Profiling";
ee.data.DEFAULT_API_BASE_URL_ = "https://earthengine.googleapis.com/api";
ee.data.DEFAULT_TILE_BASE_URL_ = "https://earthengine.googleapis.com";
ee.ComputedObject = function(func, args, opt_varName) {
  if (!(this instanceof ee.ComputedObject)) {
    return ee.ComputedObject.construct(ee.ComputedObject, arguments);
  }
  if (opt_varName && (func || args)) {
    throw Error('When "opt_varName" is specified, "func" and "args" must be null.');
  }
  if (func && !args) {
    throw Error('When "func" is specified, "args" must not be null.');
  }
  this.func = func;
  this.args = args;
  this.varName = opt_varName || null;
};
goog.inherits(ee.ComputedObject, ee.Encodable);
goog.exportSymbol("ee.ComputedObject", ee.ComputedObject);
ee.ComputedObject.prototype.evaluate = function(callback) {
  if (!callback || !goog.isFunction(callback)) {
    throw Error("evaluate() requires a callback function.");
  }
  ee.data.computeValue(this, callback);
};
ee.ComputedObject.prototype.getInfo = function(opt_callback) {
  return ee.data.computeValue(this, opt_callback);
};
ee.ComputedObject.prototype.encode = function(encoder) {
  if (this.isVariable()) {
    return {type:"ArgumentRef", value:this.varName};
  }
  var encodedArgs = {}, name;
  for (name in this.args) {
    goog.isDef(this.args[name]) && (encodedArgs[name] = encoder(this.args[name]));
  }
  var result = {type:"Invocation", arguments:encodedArgs}, func = encoder(this.func);
  result[goog.isString(func) ? "functionName" : "function"] = func;
  return result;
};
ee.ComputedObject.prototype.encodeCloudValue = function(encoder) {
  if (this.isVariable()) {
    return ee.rpc_node.argumentReference(this.varName || "uninitializedVar");
  }
  var encodedArgs = {}, name;
  for (name in this.args) {
    goog.isDef(this.args[name]) && (encodedArgs[name] = ee.rpc_node.reference(encoder(this.args[name])));
  }
  return goog.isString(this.func) ? ee.rpc_node.functionByName(String(this.func), encodedArgs) : this.func.encodeCloudInvocation(encoder, encodedArgs);
};
ee.ComputedObject.prototype.serialize = function() {
  return ee.Serializer.toJSON(this);
};
ee.ComputedObject.prototype.toString = function() {
  return "ee." + this.name() + "(" + ee.Serializer.toReadableJSON(this) + ")";
};
goog.exportSymbol("ee.ComputedObject.prototype.toString", ee.ComputedObject.prototype.toString);
ee.ComputedObject.prototype.isVariable = function() {
  return goog.isNull(this.func) && goog.isNull(this.args);
};
ee.ComputedObject.prototype.name = function() {
  return "ComputedObject";
};
ee.ComputedObject.prototype.aside = function(func, var_args) {
  var args = goog.array.clone(arguments);
  args[0] = this;
  func.apply(goog.global, args);
  return this;
};
ee.ComputedObject.prototype.castInternal = function(obj) {
  if (obj instanceof this.constructor) {
    return obj;
  }
  var klass = function() {
  };
  klass.prototype = this.constructor.prototype;
  var result = new klass;
  result.func = obj.func;
  result.args = obj.args;
  result.varName = obj.varName;
  return result;
};
ee.ComputedObject.construct = function(constructor, argsArray) {
  function F() {
    return constructor.apply(this, argsArray);
  }
  F.prototype = constructor.prototype;
  return new F;
};
ee.Types = {};
ee.Types.registeredClasses_ = {};
ee.Types.registerClasses = function(classes) {
  ee.Types.registeredClasses_ = classes;
};
ee.Types.nameToClass = function(name) {
  return name in ee.Types.registeredClasses_ ? ee.Types.registeredClasses_[name] : null;
};
ee.Types.classToName = function(klass) {
  return klass.prototype instanceof ee.ComputedObject ? klass.prototype.name.call(null) : klass == Number ? "Number" : klass == String ? "String" : klass == Array ? "Array" : klass == Date ? "Date" : "Object";
};
ee.Types.isSubtype = function(firstType, secondType) {
  if (secondType == firstType) {
    return !0;
  }
  switch(firstType) {
    case "Element":
      return "Element" == secondType || "Image" == secondType || "Feature" == secondType || "Collection" == secondType || "ImageCollection" == secondType || "FeatureCollection" == secondType;
    case "FeatureCollection":
    case "Collection":
      return "Collection" == secondType || "ImageCollection" == secondType || "FeatureCollection" == secondType;
    case "Object":
      return !0;
    default:
      return !1;
  }
};
ee.Types.isNumber = function(obj) {
  return goog.isNumber(obj) || obj instanceof ee.ComputedObject && "Number" == obj.name();
};
ee.Types.isString = function(obj) {
  return goog.isString(obj) || obj instanceof ee.ComputedObject && "String" == obj.name();
};
ee.Types.isArray = function(obj) {
  return goog.isArray(obj) || obj instanceof ee.ComputedObject && "List" == obj.name();
};
ee.Types.isRegularObject = function(obj) {
  if (goog.isObject(obj) && !goog.isFunction(obj)) {
    var proto = Object.getPrototypeOf(obj);
    return !goog.isNull(proto) && goog.isNull(Object.getPrototypeOf(proto));
  }
  return !1;
};
ee.Function = function() {
  if (!(this instanceof ee.Function)) {
    return new ee.Function;
  }
};
goog.inherits(ee.Function, ee.Encodable);
goog.exportSymbol("ee.Function", ee.Function);
ee.Function.promoter_ = goog.functions.identity;
ee.Function.registerPromoter = function(promoter) {
  ee.Function.promoter_ = promoter;
};
ee.Function.prototype.call = function(var_args) {
  return this.apply(this.nameArgs(Array.prototype.slice.call(arguments, 0)));
};
ee.Function.prototype.apply = function(namedArgs) {
  var result = new ee.ComputedObject(this, this.promoteArgs(namedArgs));
  return ee.Function.promoter_(result, this.getReturnType());
};
ee.Function.prototype.callOrApply = function(thisValue, args) {
  var isInstance = goog.isDef(thisValue), signature = this.getSignature(), useKeywordArgs = !1;
  if (1 == args.length && ee.Types.isRegularObject(args[0])) {
    var params = signature.args;
    isInstance && (params = params.slice(1));
    params.length && (useKeywordArgs = !((1 == params.length || params[1].optional) && "Dictionary" == params[0].type));
  }
  if (useKeywordArgs) {
    var namedArgs = goog.object.clone(args[0]);
    if (isInstance) {
      var firstArgName = signature.args[0].name;
      if (firstArgName in namedArgs) {
        throw Error("Named args for " + signature.name + " can't contain keyword " + firstArgName);
      }
      namedArgs[firstArgName] = thisValue;
    }
  } else {
    namedArgs = this.nameArgs(isInstance ? [thisValue].concat(args) : args);
  }
  return this.apply(namedArgs);
};
ee.Function.prototype.promoteArgs = function(args) {
  for (var specs = this.getSignature().args, promotedArgs = {}, known = {}, i = 0; i < specs.length; i++) {
    var name = specs[i].name;
    if (name in args && goog.isDef(args[name])) {
      promotedArgs[name] = ee.Function.promoter_(args[name], specs[i].type);
    } else {
      if (!specs[i].optional) {
        throw Error("Required argument (" + name + ") missing to function: " + this);
      }
    }
    known[name] = !0;
  }
  var unknown = [], argName;
  for (argName in args) {
    known[argName] || unknown.push(argName);
  }
  if (0 < unknown.length) {
    throw Error("Unrecognized arguments (" + unknown + ") to function: " + this);
  }
  return promotedArgs;
};
ee.Function.prototype.nameArgs = function(args) {
  var specs = this.getSignature().args;
  if (specs.length < args.length) {
    throw Error("Too many (" + args.length + ") arguments to function: " + this);
  }
  for (var namedArgs = {}, i = 0; i < args.length; i++) {
    namedArgs[specs[i].name] = args[i];
  }
  return namedArgs;
};
ee.Function.prototype.getReturnType = function() {
  return this.getSignature().returns;
};
ee.Function.prototype.toString = function(opt_name, opt_isInstance) {
  var signature = this.getSignature(), buffer = [];
  buffer.push(opt_name || signature.name);
  buffer.push("(");
  buffer.push(goog.array.map(signature.args.slice(opt_isInstance ? 1 : 0), function(elem) {
    return elem.name;
  }).join(", "));
  buffer.push(")\n");
  buffer.push("\n");
  signature.description ? buffer.push(signature.description) : buffer.push("Undocumented.");
  buffer.push("\n");
  if (signature.args.length) {
    buffer.push("\nArgs:\n");
    for (var i = 0; i < signature.args.length; i++) {
      opt_isInstance && 0 == i ? buffer.push("  this:") : buffer.push("\n  ");
      var arg = signature.args[i];
      buffer.push(arg.name);
      buffer.push(" (");
      buffer.push(arg.type);
      arg.optional && buffer.push(", optional");
      buffer.push("): ");
      arg.description ? buffer.push(arg.description) : buffer.push("Undocumented.");
    }
  }
  return buffer.join("");
};
ee.Function.prototype.serialize = function() {
  return ee.Serializer.toJSON(this);
};
ee.ApiFunction = function(name, opt_signature) {
  if (!goog.isDef(opt_signature)) {
    return ee.ApiFunction.lookup(name);
  }
  if (!(this instanceof ee.ApiFunction)) {
    return ee.ComputedObject.construct(ee.ApiFunction, arguments);
  }
  this.signature_ = goog.object.unsafeClone(opt_signature);
  this.signature_.name = name;
};
goog.inherits(ee.ApiFunction, ee.Function);
goog.exportSymbol("ee.ApiFunction", ee.ApiFunction);
ee.ApiFunction._call = function(name, var_args) {
  return ee.Function.prototype.call.apply(ee.ApiFunction.lookup(name), Array.prototype.slice.call(arguments, 1));
};
ee.ApiFunction._apply = function(name, namedArgs) {
  return ee.ApiFunction.lookup(name).apply(namedArgs);
};
ee.ApiFunction.prototype.encode = function(encoder) {
  return this.signature_.name;
};
ee.ApiFunction.prototype.encodeCloudInvocation = function(encoder, args) {
  return ee.rpc_node.functionByName(this.signature_.name, args);
};
ee.ApiFunction.prototype.getSignature = function() {
  return this.signature_;
};
ee.ApiFunction.api_ = null;
ee.ApiFunction.boundSignatures_ = {};
ee.ApiFunction.allSignatures = function() {
  ee.ApiFunction.initialize();
  return goog.object.map(ee.ApiFunction.api_, function(func) {
    return func.getSignature();
  });
};
ee.ApiFunction.unboundFunctions = function() {
  ee.ApiFunction.initialize();
  return goog.object.filter(ee.ApiFunction.api_, function(func, name) {
    return !ee.ApiFunction.boundSignatures_[name];
  });
};
ee.ApiFunction.lookup = function(name) {
  var func = ee.ApiFunction.lookupInternal(name);
  if (!func) {
    throw Error("Unknown built-in function name: " + name);
  }
  return func;
};
ee.ApiFunction.lookupInternal = function(name) {
  ee.ApiFunction.initialize();
  return ee.ApiFunction.api_[name] || null;
};
ee.ApiFunction.initialize = function(opt_successCallback, opt_failureCallback) {
  if (ee.ApiFunction.api_) {
    opt_successCallback && opt_successCallback();
  } else {
    var callback = function(data, opt_error) {
      opt_error ? opt_failureCallback && opt_failureCallback(Error(opt_error)) : (ee.ApiFunction.api_ = goog.object.map(data, function(sig, name) {
        sig.returns = sig.returns.replace(/<.*>/, "");
        for (var i = 0; i < sig.args.length; i++) {
          sig.args[i].type = sig.args[i].type.replace(/<.*>/, "");
        }
        return new ee.ApiFunction(name, sig);
      }), opt_successCallback && opt_successCallback());
    };
    opt_successCallback ? ee.data.getAlgorithms(callback) : callback(ee.data.getAlgorithms());
  }
};
ee.ApiFunction.reset = function() {
  ee.ApiFunction.api_ = null;
  ee.ApiFunction.boundSignatures_ = {};
};
ee.ApiFunction.importApi = function(target, prefix, typeName, opt_prepend) {
  ee.ApiFunction.initialize();
  var prepend = opt_prepend || "";
  goog.object.forEach(ee.ApiFunction.api_, function(apiFunc, name) {
    var parts = name.split(".");
    if (2 == parts.length && parts[0] == prefix) {
      var fname = prepend + parts[1], signature = apiFunc.getSignature();
      ee.ApiFunction.boundSignatures_[name] = !0;
      var isInstance = !1;
      if (signature.args.length) {
        var firstArgType = signature.args[0].type;
        isInstance = "Object" != firstArgType && ee.Types.isSubtype(firstArgType, typeName);
      }
      var destination = isInstance ? target.prototype : target;
      fname in destination && !destination[fname].signature || (destination[fname] = function(var_args) {
        return apiFunc.callOrApply(isInstance ? this : void 0, Array.prototype.slice.call(arguments, 0));
      }, destination[fname].toString = goog.bind(apiFunc.toString, apiFunc, fname, isInstance), destination[fname].signature = signature);
    }
  });
};
ee.ApiFunction.clearApi = function(target$jscomp$0) {
  var clear = function(target) {
    for (var name in target) {
      goog.isFunction(target[name]) && target[name].signature && delete target[name];
    }
  };
  clear(target$jscomp$0);
  clear(target$jscomp$0.prototype || {});
};
ee.arguments = {};
ee.arguments.extractFromFunction = function(fn, originalArgs) {
  return ee.arguments.extractImpl_(fn, originalArgs, ee.arguments.JS_PARAM_DECL_MATCHER_FUNCTION_);
};
ee.arguments.extractFromClassConstructor = function(fn, originalArgs) {
  return ee.arguments.extractImpl_(fn, originalArgs, ee.arguments.JS_PARAM_DECL_MATCHER_CLASS_CONSTRUCTOR_);
};
ee.arguments.extractFromClassMethod = function(fn, originalArgs) {
  return ee.arguments.extractImpl_(fn, originalArgs, ee.arguments.JS_PARAM_DECL_MATCHER_CLASS_METHOD_);
};
ee.arguments.extract = ee.arguments.extractFromFunction;
ee.arguments.extractImpl_ = function(fn, originalArgs, parameterMatcher) {
  var paramNamesWithOptPrefix = ee.arguments.getParamNames_(fn, parameterMatcher), paramNames = goog.array.map(paramNamesWithOptPrefix, function(param) {
    return param.replace(/^opt_/, "");
  }), fnName = ee.arguments.getFnName_(fn), fnNameSnippet = fnName ? " to function " + fnName : "", args = {}, firstArg = originalArgs[0], firstArgCouldBeDictionary = goog.isObject(firstArg) && !goog.isFunction(firstArg) && !goog.isArray(firstArg) && !(firstArg instanceof ee.ComputedObject);
  if (1 < originalArgs.length || !firstArgCouldBeDictionary) {
    if (originalArgs.length > paramNames.length) {
      throw Error("Received too many arguments" + fnNameSnippet + ". Expected at most " + paramNames.length + " but got " + originalArgs.length + ".");
    }
    for (var i = 0; i < originalArgs.length; i++) {
      args[paramNames[i]] = originalArgs[i];
    }
  } else {
    var seen = new goog.structs.Set(goog.object.getKeys(firstArg)), expected = new goog.structs.Set(paramNames);
    if (expected.intersection(seen).isEmpty()) {
      args[paramNames[0]] = originalArgs[0];
    } else {
      var unexpected = seen.difference(expected);
      if (!unexpected.isEmpty()) {
        throw Error("Unexpected arguments" + fnNameSnippet + ": " + unexpected.getValues().join(", "));
      }
      args = goog.object.clone(firstArg);
    }
  }
  var provided = new goog.structs.Set(goog.object.getKeys(args)), missing = (new goog.structs.Set(goog.array.filter(paramNamesWithOptPrefix, function(param) {
    return !goog.string.startsWith(param, "opt_");
  }))).difference(provided);
  if (!missing.isEmpty()) {
    throw Error("Missing required arguments" + fnNameSnippet + ": " + missing.getValues().join(", "));
  }
  return args;
};
ee.arguments.getParamNames_ = function(fn, parameterMatcher) {
  var paramNames = [];
  if (goog.global.EXPORTED_FN_INFO) {
    var exportedFnInfo = goog.global.EXPORTED_FN_INFO[fn.toString()];
    goog.isObject(exportedFnInfo) || ee.arguments.throwMatchFailedError_();
    paramNames = exportedFnInfo.paramNames;
    goog.isArray(paramNames) || ee.arguments.throwMatchFailedError_();
  } else {
    var fnMatchResult = fn.toString().replace(ee.arguments.JS_COMMENT_MATCHER_, "").match(parameterMatcher);
    null === fnMatchResult && ee.arguments.throwMatchFailedError_();
    paramNames = (fnMatchResult[1].split(",") || []).map(function(p) {
      return p.replace(ee.arguments.JS_PARAM_DEFAULT_MATCHER_, "");
    });
  }
  return paramNames;
};
ee.arguments.getFnName_ = function(fn) {
  return goog.global.EXPORTED_FN_INFO ? goog.global.EXPORTED_FN_INFO[fn.toString()].name.split(".").pop() + "()" : null;
};
ee.arguments.throwMatchFailedError_ = function() {
  throw Error("Failed to locate function parameters.");
};
ee.arguments.JS_COMMENT_MATCHER_ = /((\/\/.*$)|(\/\*[\s\S]*?\*\/)|(\s))/mg;
ee.arguments.JS_PARAM_DECL_MATCHER_FUNCTION_ = /^function[^\(]*\(([^\)]*)\)/m;
ee.arguments.JS_PARAM_DECL_MATCHER_CLASS_CONSTRUCTOR_ = /^class[^\{]*{\S*?\bconstructor\(([^\)]*)\)/m;
ee.arguments.JS_PARAM_DECL_MATCHER_CLASS_METHOD_ = /[^\(]*\(([^\)]*)\)/m;
ee.arguments.JS_PARAM_DEFAULT_MATCHER_ = /=.*$/;
ee.Element = function(func, args, opt_varName) {
  ee.ComputedObject.call(this, func, args, opt_varName);
  ee.Element.initialize();
};
goog.inherits(ee.Element, ee.ComputedObject);
goog.exportSymbol("ee.Element", ee.Element);
ee.Element.initialized_ = !1;
ee.Element.initialize = function() {
  ee.Element.initialized_ || (ee.ApiFunction.importApi(ee.Element, "Element", "Element"), ee.Element.initialized_ = !0);
};
ee.Element.reset = function() {
  ee.ApiFunction.clearApi(ee.Element);
  ee.Element.initialized_ = !1;
};
ee.Element.prototype.name = function() {
  return "Element";
};
ee.Element.prototype.set = function(var_args) {
  if (1 >= arguments.length) {
    var properties = arguments[0];
    ee.Types.isRegularObject(properties) && goog.array.equals(goog.object.getKeys(properties), ["properties"]) && goog.isObject(properties.properties) && (properties = properties.properties);
    if (ee.Types.isRegularObject(properties)) {
      var result = this;
      for (var key in properties) {
        var value = properties[key];
        result = ee.ApiFunction._call("Element.set", result, key, value);
      }
    } else {
      if (properties instanceof ee.ComputedObject && ee.ApiFunction.lookupInternal("Element.setMulti")) {
        result = ee.ApiFunction._call("Element.setMulti", this, properties);
      } else {
        throw Error("When Element.set() is passed one argument, it must be a dictionary.");
      }
    }
  } else {
    if (0 != arguments.length % 2) {
      throw Error("When Element.set() is passed multiple arguments, there must be an even number of them.");
    }
    result = this;
    for (var i = 0; i < arguments.length; i += 2) {
      key = arguments[i], value = arguments[i + 1], result = ee.ApiFunction._call("Element.set", result, key, value);
    }
  }
  return this.castInternal(result);
};
ee.Geometry = function(geoJson, opt_proj, opt_geodesic, opt_evenOdd) {
  if (!(this instanceof ee.Geometry)) {
    return ee.ComputedObject.construct(ee.Geometry, arguments);
  }
  if (!("type" in geoJson)) {
    var args = ee.arguments.extractFromFunction(ee.Geometry, arguments);
    geoJson = args.geoJson;
    opt_proj = args.proj;
    opt_geodesic = args.geodesic;
    opt_evenOdd = args.evenOdd;
  }
  ee.Geometry.initialize();
  var options = goog.isDefAndNotNull(opt_proj) || goog.isDefAndNotNull(opt_geodesic) || goog.isDefAndNotNull(opt_evenOdd);
  if (geoJson instanceof ee.ComputedObject && !(geoJson instanceof ee.Geometry && geoJson.type_)) {
    if (options) {
      throw Error("Setting the CRS, geodesic, or evenOdd flag on a computed Geometry is not supported.  Use Geometry.transform().");
    }
    ee.ComputedObject.call(this, geoJson.func, geoJson.args, geoJson.varName);
  } else {
    geoJson instanceof ee.Geometry && (geoJson = geoJson.encode());
    if (!ee.Geometry.isValidGeometry_(geoJson)) {
      throw Error("Invalid GeoJSON geometry: " + JSON.stringify(geoJson));
    }
    ee.ComputedObject.call(this, null, null);
    this.type_ = geoJson.type;
    this.coordinates_ = goog.isDefAndNotNull(geoJson.coordinates) ? goog.object.unsafeClone(geoJson.coordinates) : null;
    this.geometries_ = geoJson.geometries || null;
    if (goog.isDefAndNotNull(opt_proj)) {
      this.proj_ = opt_proj;
    } else {
      if ("crs" in geoJson) {
        if (goog.isObject(geoJson.crs) && "name" == geoJson.crs.type && goog.isObject(geoJson.crs.properties) && goog.isString(geoJson.crs.properties.name)) {
          this.proj_ = geoJson.crs.properties.name;
        } else {
          throw Error("Invalid CRS declaration in GeoJSON: " + (new goog.json.Serializer).serialize(geoJson.crs));
        }
      }
    }
    this.geodesic_ = opt_geodesic;
    !goog.isDef(this.geodesic_) && "geodesic" in geoJson && (this.geodesic_ = !!geoJson.geodesic);
    this.evenOdd_ = opt_evenOdd;
    !goog.isDef(this.evenOdd_) && "evenOdd" in geoJson && (this.evenOdd_ = !!geoJson.evenOdd);
  }
};
goog.inherits(ee.Geometry, ee.ComputedObject);
ee.Geometry.initialized_ = !1;
ee.Geometry.initialize = function() {
  ee.Geometry.initialized_ || (ee.ApiFunction.importApi(ee.Geometry, "Geometry", "Geometry"), ee.Geometry.initialized_ = !0);
};
ee.Geometry.reset = function() {
  ee.ApiFunction.clearApi(ee.Geometry);
  ee.Geometry.initialized_ = !1;
};
ee.Geometry.Point = function(coords, opt_proj) {
  if (!(this instanceof ee.Geometry.Point)) {
    return ee.Geometry.createInstance_(ee.Geometry.Point, arguments);
  }
  var init = ee.Geometry.construct_(ee.Geometry.Point, "Point", 1, arguments);
  if (!(init instanceof ee.ComputedObject)) {
    var xy = init.coordinates;
    if (!goog.isArray(xy) || 2 != xy.length) {
      throw Error("The Geometry.Point constructor requires 2 coordinates.");
    }
  }
  ee.Geometry.call(this, init);
};
goog.inherits(ee.Geometry.Point, ee.Geometry);
ee.Geometry.MultiPoint = function(coords, opt_proj) {
  if (!(this instanceof ee.Geometry.MultiPoint)) {
    return ee.Geometry.createInstance_(ee.Geometry.MultiPoint, arguments);
  }
  ee.Geometry.call(this, ee.Geometry.construct_(ee.Geometry.MultiPoint, "MultiPoint", 2, arguments));
};
goog.inherits(ee.Geometry.MultiPoint, ee.Geometry);
ee.Geometry.Rectangle = function(coords, opt_proj, opt_geodesic, opt_evenOdd) {
  if (!(this instanceof ee.Geometry.Rectangle)) {
    return ee.Geometry.createInstance_(ee.Geometry.Rectangle, arguments);
  }
  var init = ee.Geometry.construct_(ee.Geometry.Rectangle, "Rectangle", 2, arguments);
  if (!(init instanceof ee.ComputedObject)) {
    var xy = init.coordinates;
    if (2 != xy.length) {
      throw Error("The Geometry.Rectangle constructor requires 2 points or 4 coordinates.");
    }
    var x1 = xy[0][0], y1 = xy[0][1], x2 = xy[1][0], y2 = xy[1][1];
    init.coordinates = [[[x1, y2], [x1, y1], [x2, y1], [x2, y2]]];
    init.type = "Polygon";
  }
  ee.Geometry.call(this, init);
};
goog.inherits(ee.Geometry.Rectangle, ee.Geometry);
ee.Geometry.LineString = function(coords, opt_proj, opt_geodesic, opt_maxError) {
  if (!(this instanceof ee.Geometry.LineString)) {
    return ee.Geometry.createInstance_(ee.Geometry.LineString, arguments);
  }
  ee.Geometry.call(this, ee.Geometry.construct_(ee.Geometry.LineString, "LineString", 2, arguments));
};
goog.inherits(ee.Geometry.LineString, ee.Geometry);
ee.Geometry.LinearRing = function(coords, opt_proj, opt_geodesic, opt_maxError) {
  if (!(this instanceof ee.Geometry.LinearRing)) {
    return ee.Geometry.createInstance_(ee.Geometry.LinearRing, arguments);
  }
  ee.Geometry.call(this, ee.Geometry.construct_(ee.Geometry.LinearRing, "LinearRing", 2, arguments));
};
goog.inherits(ee.Geometry.LinearRing, ee.Geometry);
ee.Geometry.MultiLineString = function(coords, opt_proj, opt_geodesic, opt_maxError) {
  if (!(this instanceof ee.Geometry.MultiLineString)) {
    return ee.Geometry.createInstance_(ee.Geometry.MultiLineString, arguments);
  }
  ee.Geometry.call(this, ee.Geometry.construct_(ee.Geometry.MultiLineString, "MultiLineString", 3, arguments));
};
goog.inherits(ee.Geometry.MultiLineString, ee.Geometry);
ee.Geometry.Polygon = function(coords, opt_proj, opt_geodesic, opt_maxError, opt_evenOdd) {
  if (!(this instanceof ee.Geometry.Polygon)) {
    return ee.Geometry.createInstance_(ee.Geometry.Polygon, arguments);
  }
  ee.Geometry.call(this, ee.Geometry.construct_(ee.Geometry.Polygon, "Polygon", 3, arguments));
};
goog.inherits(ee.Geometry.Polygon, ee.Geometry);
ee.Geometry.MultiPolygon = function(coords, opt_proj, opt_geodesic, opt_maxError, opt_evenOdd) {
  if (!(this instanceof ee.Geometry.MultiPolygon)) {
    return ee.Geometry.createInstance_(ee.Geometry.MultiPolygon, arguments);
  }
  ee.Geometry.call(this, ee.Geometry.construct_(ee.Geometry.MultiPolygon, "MultiPolygon", 4, arguments));
};
goog.inherits(ee.Geometry.MultiPolygon, ee.Geometry);
ee.Geometry.prototype.encode = function(opt_encoder) {
  if (!this.type_) {
    if (!opt_encoder) {
      throw Error("Must specify an encode function when encoding a computed geometry.");
    }
    return ee.ComputedObject.prototype.encode.call(this, opt_encoder);
  }
  var result = {type:this.type_};
  "GeometryCollection" == this.type_ ? result.geometries = this.geometries_ : result.coordinates = this.coordinates_;
  goog.isDefAndNotNull(this.proj_) && (result.crs = {type:"name", properties:{name:this.proj_}});
  goog.isDefAndNotNull(this.geodesic_) && (result.geodesic = this.geodesic_);
  goog.isDefAndNotNull(this.evenOdd_) && (result.evenOdd = this.evenOdd_);
  return result;
};
ee.Geometry.prototype.toGeoJSON = function() {
  if (this.func) {
    throw Error("Can't convert a computed Geometry to GeoJSON. Use getInfo() instead.");
  }
  return this.encode();
};
ee.Geometry.prototype.toGeoJSONString = function() {
  if (this.func) {
    throw Error("Can't convert a computed Geometry to GeoJSON. Use getInfo() instead.");
  }
  return (new goog.json.Serializer).serialize(this.toGeoJSON());
};
ee.Geometry.prototype.serialize = function() {
  return ee.Serializer.toJSON(this);
};
ee.Geometry.prototype.toString = function() {
  return "ee.Geometry(" + this.toGeoJSONString() + ")";
};
ee.Geometry.prototype.encodeCloudValue = function(opt_encoder) {
  if (!this.type_) {
    if (!opt_encoder) {
      throw Error("Must specify an encode function when encoding a computed geometry.");
    }
    return ee.ComputedObject.prototype.encodeCloudValue.call(this, opt_encoder);
  }
  var func = "GeometryConstructors." + this.type_, args = {};
  "GeometryCollection" === this.type_ ? args.geometries = this.geometries_ : args.coordinates = this.coordinates_;
  goog.isDefAndNotNull(this.proj_) && (args.crs = goog.isString(this.proj_) ? (new ee.ApiFunction("Projection")).call(this.proj_) : this.proj_);
  goog.isDefAndNotNull(this.geodesic_) && (args.geodesic = this.geodesic_);
  goog.isDefAndNotNull(this.evenOdd_) && (args.evenOdd = this.evenOdd_);
  return (new ee.ApiFunction(func)).apply(args).encodeCloudValue(opt_encoder);
};
ee.Geometry.isValidGeometry_ = function(geometry) {
  var type = geometry.type;
  if ("GeometryCollection" == type) {
    var geometries = geometry.geometries;
    if (!goog.isArray(geometries)) {
      return !1;
    }
    for (var i = 0; i < geometries.length; i++) {
      if (!ee.Geometry.isValidGeometry_(geometries[i])) {
        return !1;
      }
    }
    return !0;
  }
  var coords = geometry.coordinates, nesting = ee.Geometry.isValidCoordinates_(coords);
  return "Point" == type && 1 == nesting || "MultiPoint" == type && (2 == nesting || 0 == coords.length) || "LineString" == type && 2 == nesting || "LinearRing" == type && 2 == nesting || "MultiLineString" == type && (3 == nesting || 0 == coords.length) || "Polygon" == type && 3 == nesting || "MultiPolygon" == type && (4 == nesting || 0 == coords.length);
};
ee.Geometry.isValidCoordinates_ = function(shape) {
  if (!goog.isArray(shape)) {
    return -1;
  }
  if (goog.isArray(shape[0])) {
    for (var count = ee.Geometry.isValidCoordinates_(shape[0]), i = 1; i < shape.length; i++) {
      if (ee.Geometry.isValidCoordinates_(shape[i]) != count) {
        return -1;
      }
    }
    return count + 1;
  }
  for (i = 0; i < shape.length; i++) {
    if (!goog.isNumber(shape[i])) {
      return -1;
    }
  }
  return 0 == shape.length % 2 ? 1 : -1;
};
ee.Geometry.coordinatesToLine_ = function(coordinates) {
  if (!goog.isNumber(coordinates[0]) || 2 == coordinates.length) {
    return coordinates;
  }
  if (0 != coordinates.length % 2) {
    throw Error("Invalid number of coordinates: " + coordinates.length);
  }
  for (var line = [], i = 0; i < coordinates.length; i += 2) {
    line.push([coordinates[i], coordinates[i + 1]]);
  }
  return line;
};
ee.Geometry.construct_ = function(jsConstructorFn, apiConstructorName, depth, originalArgs) {
  var eeArgs = ee.Geometry.getEeApiArgs_(jsConstructorFn, originalArgs);
  if (ee.Geometry.hasServerValue_(eeArgs.coordinates) || goog.isDefAndNotNull(eeArgs.crs) || goog.isDefAndNotNull(eeArgs.maxError)) {
    return (new ee.ApiFunction("GeometryConstructors." + apiConstructorName)).apply(eeArgs);
  }
  eeArgs.type = apiConstructorName;
  eeArgs.coordinates = ee.Geometry.fixDepth_(depth, eeArgs.coordinates);
  var isPolygon = goog.array.contains(["Polygon", "Rectangle", "MultiPolygon"], apiConstructorName);
  isPolygon && !goog.isDefAndNotNull(eeArgs.evenOdd) && (eeArgs.evenOdd = !0);
  if (isPolygon && !1 === eeArgs.geodesic && !1 === eeArgs.evenOdd) {
    throw Error("Planar interiors must be even/odd.");
  }
  return eeArgs;
};
ee.Geometry.getEeApiArgs_ = function(jsConstructorFn, originalArgs) {
  if (goog.array.every(originalArgs, ee.Types.isNumber)) {
    return {coordinates:goog.array.toArray(originalArgs)};
  }
  var args = ee.arguments.extractFromFunction(jsConstructorFn, originalArgs);
  args.coordinates = args.coords;
  delete args.coords;
  args.crs = args.proj;
  delete args.proj;
  return goog.object.filter(args, goog.isDefAndNotNull);
};
ee.Geometry.hasServerValue_ = function(coordinates) {
  return goog.isArray(coordinates) ? goog.array.some(coordinates, ee.Geometry.hasServerValue_) : coordinates instanceof ee.ComputedObject;
};
ee.Geometry.fixDepth_ = function(depth, coords) {
  if (1 > depth || 4 < depth) {
    throw Error("Unexpected nesting level.");
  }
  goog.array.every(coords, goog.isNumber) && (coords = ee.Geometry.coordinatesToLine_(coords));
  for (var item = coords, count = 0; goog.isArray(item);) {
    item = item[0], count++;
  }
  for (; count < depth;) {
    coords = [coords], count++;
  }
  if (ee.Geometry.isValidCoordinates_(coords) != depth) {
    throw Error("Invalid geometry");
  }
  for (item = coords; goog.isArray(item) && 1 == item.length;) {
    item = item[0];
  }
  return goog.isArray(item) && 0 == item.length ? [] : coords;
};
ee.Geometry.createInstance_ = function(klass, args) {
  var f = function() {
  };
  f.prototype = klass.prototype;
  var instance = new f, result = klass.apply(instance, args);
  return void 0 !== result ? result : instance;
};
ee.Geometry.prototype.name = function() {
  return "Geometry";
};
ee.Filter = function(opt_filter) {
  if (!(this instanceof ee.Filter)) {
    return ee.ComputedObject.construct(ee.Filter, arguments);
  }
  if (opt_filter instanceof ee.Filter) {
    return opt_filter;
  }
  ee.Filter.initialize();
  if (goog.isArray(opt_filter)) {
    if (0 == opt_filter.length) {
      throw Error("Empty list specified for ee.Filter().");
    }
    if (1 == opt_filter.length) {
      return new ee.Filter(opt_filter[0]);
    }
    ee.ComputedObject.call(this, new ee.ApiFunction("Filter.and"), {filters:opt_filter});
    this.filter_ = opt_filter;
  } else {
    if (opt_filter instanceof ee.ComputedObject) {
      ee.ComputedObject.call(this, opt_filter.func, opt_filter.args, opt_filter.varName), this.filter_ = [opt_filter];
    } else {
      if (goog.isDef(opt_filter)) {
        throw Error("Invalid argument specified for ee.Filter(): " + opt_filter);
      }
      ee.ComputedObject.call(this, null, null);
      this.filter_ = [];
    }
  }
};
goog.inherits(ee.Filter, ee.ComputedObject);
ee.Filter.initialized_ = !1;
ee.Filter.initialize = function() {
  ee.Filter.initialized_ || (ee.ApiFunction.importApi(ee.Filter, "Filter", "Filter"), ee.Filter.initialized_ = !0);
};
ee.Filter.reset = function() {
  ee.ApiFunction.clearApi(ee.Filter);
  ee.Filter.initialized_ = !1;
};
ee.Filter.functionNames_ = {equals:"equals", less_than:"lessThan", greater_than:"greaterThan", contains:"stringContains", starts_with:"stringStartsWith", ends_with:"stringEndsWith"};
ee.Filter.prototype.append_ = function(newFilter) {
  var prev = this.filter_.slice(0);
  newFilter instanceof ee.Filter ? goog.array.extend(prev, newFilter.filter_) : newFilter instanceof Array ? goog.array.extend(prev, newFilter) : prev.push(newFilter);
  return new ee.Filter(prev);
};
ee.Filter.prototype.not = function() {
  return ee.ApiFunction._call("Filter.not", this);
};
ee.Filter.eq = function(name, value) {
  var args = ee.arguments.extractFromFunction(ee.Filter.eq, arguments);
  return ee.ApiFunction._call("Filter.equals", args.name, args.value);
};
ee.Filter.neq = function(name, value) {
  var args = ee.arguments.extractFromFunction(ee.Filter.neq, arguments);
  return ee.Filter.eq(args.name, args.value).not();
};
ee.Filter.lt = function(name, value) {
  var args = ee.arguments.extractFromFunction(ee.Filter.lt, arguments);
  return ee.ApiFunction._call("Filter.lessThan", args.name, args.value);
};
ee.Filter.gte = function(name, value) {
  var args = ee.arguments.extractFromFunction(ee.Filter.gte, arguments);
  return ee.Filter.lt(args.name, args.value).not();
};
ee.Filter.gt = function(name, value) {
  var args = ee.arguments.extractFromFunction(ee.Filter.gt, arguments);
  return ee.ApiFunction._call("Filter.greaterThan", args.name, args.value);
};
ee.Filter.lte = function(name, value) {
  var args = ee.arguments.extractFromFunction(ee.Filter.lte, arguments);
  return ee.Filter.gt(args.name, args.value).not();
};
ee.Filter.and = function(var_args) {
  var args = Array.prototype.slice.call(arguments);
  return ee.ApiFunction._call("Filter.and", args);
};
ee.Filter.or = function(var_args) {
  var args = Array.prototype.slice.call(arguments);
  return ee.ApiFunction._call("Filter.or", args);
};
ee.Filter.date = function(start, opt_end) {
  var args = ee.arguments.extractFromFunction(ee.Filter.date, arguments), range = ee.ApiFunction._call("DateRange", args.start, args.end);
  return ee.ApiFunction._apply("Filter.dateRangeContains", {leftValue:range, rightField:"system:time_start"});
};
ee.Filter.inList = function(opt_leftField, opt_rightValue, opt_rightField, opt_leftValue) {
  var args = ee.arguments.extractFromFunction(ee.Filter.inList, arguments);
  return ee.ApiFunction._apply("Filter.listContains", {leftField:args.rightField, rightValue:args.leftValue, rightField:args.leftField, leftValue:args.rightValue});
};
ee.Filter.bounds = function(geometry, opt_errorMargin) {
  return ee.ApiFunction._apply("Filter.intersects", {leftField:".all", rightValue:ee.ApiFunction._call("Feature", geometry), maxError:opt_errorMargin});
};
ee.Filter.prototype.name = function() {
  return "Filter";
};
ee.Filter.metadata = function(name, operator, value) {
  operator = operator.toLowerCase();
  var negated = !1;
  goog.string.startsWith(operator, "not_") && (negated = !0, operator = operator.substring(4));
  if (!(operator in ee.Filter.functionNames_)) {
    throw Error("Unknown filtering operator: " + operator);
  }
  var filter = ee.ApiFunction._call("Filter." + ee.Filter.functionNames_[operator], name, value);
  return negated ? filter.not() : filter;
};
ee.Collection = function(func, args, opt_varName) {
  ee.Element.call(this, func, args, opt_varName);
  ee.Collection.initialize();
};
goog.inherits(ee.Collection, ee.Element);
goog.exportSymbol("ee.Collection", ee.Collection);
ee.Collection.initialized_ = !1;
ee.Collection.initialize = function() {
  ee.Collection.initialized_ || (ee.ApiFunction.importApi(ee.Collection, "Collection", "Collection"), ee.ApiFunction.importApi(ee.Collection, "AggregateFeatureCollection", "Collection", "aggregate_"), ee.Collection.initialized_ = !0);
};
ee.Collection.reset = function() {
  ee.ApiFunction.clearApi(ee.Collection);
  ee.Collection.initialized_ = !1;
};
ee.Collection.prototype.filter = function(filter) {
  filter = ee.arguments.extractFromFunction(ee.Collection.prototype.filter, arguments).filter;
  if (!filter) {
    throw Error("Empty filters.");
  }
  return this.castInternal(ee.ApiFunction._call("Collection.filter", this, filter));
};
ee.Collection.prototype.filterMetadata = function(name, operator, value) {
  var args = ee.arguments.extractFromFunction(ee.Collection.prototype.filterMetadata, arguments);
  return this.filter(ee.Filter.metadata(args.name, args.operator, args.value));
};
ee.Collection.prototype.filterBounds = function(geometry) {
  return this.filter(ee.Filter.bounds(geometry));
};
ee.Collection.prototype.filterDate = function(start, opt_end) {
  var args = ee.arguments.extractFromFunction(ee.Collection.prototype.filterDate, arguments);
  return this.filter(ee.Filter.date(args.start, args.end));
};
ee.Collection.prototype.limit = function(max, opt_property, opt_ascending) {
  var args = ee.arguments.extractFromFunction(ee.Collection.prototype.limit, arguments);
  return this.castInternal(ee.ApiFunction._call("Collection.limit", this, args.max, args.property, args.ascending));
};
ee.Collection.prototype.sort = function(property, opt_ascending) {
  var args = ee.arguments.extractFromFunction(ee.Collection.prototype.sort, arguments);
  return this.castInternal(ee.ApiFunction._call("Collection.limit", this, void 0, args.property, args.ascending));
};
ee.Collection.prototype.name = function() {
  return "Collection";
};
ee.Collection.prototype.elementType = function() {
  return ee.Element;
};
ee.Collection.prototype.map = function(algorithm, opt_dropNulls) {
  var elementType = this.elementType();
  return this.castInternal(ee.ApiFunction._call("Collection.map", this, function(e) {
    return algorithm(new elementType(e));
  }, opt_dropNulls));
};
ee.Collection.prototype.iterate = function(algorithm, opt_first) {
  var first = goog.isDef(opt_first) ? opt_first : null, elementType = this.elementType();
  return ee.ApiFunction._call("Collection.iterate", this, function(e, p) {
    return algorithm(new elementType(e), p);
  }, first);
};
ee.Feature = function(geometry, opt_properties) {
  if (!(this instanceof ee.Feature)) {
    return ee.ComputedObject.construct(ee.Feature, arguments);
  }
  if (geometry instanceof ee.Feature) {
    if (opt_properties) {
      throw Error("Can't create Feature out of a Feature and properties.");
    }
    return geometry;
  }
  if (2 < arguments.length) {
    throw Error("The Feature constructor takes at most 2 arguments (" + arguments.length + " given)");
  }
  ee.Feature.initialize();
  if (geometry instanceof ee.Geometry || null === geometry) {
    ee.Element.call(this, new ee.ApiFunction("Feature"), {geometry:geometry, metadata:opt_properties || null});
  } else {
    if (geometry instanceof ee.ComputedObject) {
      ee.Element.call(this, geometry.func, geometry.args, geometry.varName);
    } else {
      if ("Feature" == geometry.type) {
        var properties = geometry.properties || {};
        if ("id" in geometry) {
          if ("system:index" in properties) {
            throw Error('Can\'t specify both "id" and "system:index".');
          }
          properties = goog.object.clone(properties);
          properties["system:index"] = geometry.id;
        }
        ee.Element.call(this, new ee.ApiFunction("Feature"), {geometry:new ee.Geometry(geometry.geometry), metadata:properties});
      } else {
        ee.Element.call(this, new ee.ApiFunction("Feature"), {geometry:new ee.Geometry(geometry), metadata:opt_properties || null});
      }
    }
  }
};
goog.inherits(ee.Feature, ee.Element);
ee.Feature.initialized_ = !1;
ee.Feature.initialize = function() {
  ee.Feature.initialized_ || (ee.ApiFunction.importApi(ee.Feature, "Feature", "Feature"), ee.Feature.initialized_ = !0);
};
ee.Feature.reset = function() {
  ee.ApiFunction.clearApi(ee.Feature);
  ee.Feature.initialized_ = !1;
};
ee.Feature.prototype.getInfo = function(opt_callback) {
  return ee.Feature.superClass_.getInfo.call(this, opt_callback);
};
ee.Feature.prototype.getMap = function(opt_visParams, opt_callback) {
  var args = ee.arguments.extractFromFunction(ee.Feature.prototype.getMap, arguments);
  return ee.ApiFunction._call("Collection", [this]).getMap(args.visParams, args.callback);
};
ee.Feature.prototype.name = function() {
  return "Feature";
};
ee.data.images = {};
ee.data.images.applySelectionAndScale = function(image, params, outParams) {
  var clipParams = {};
  goog.object.forEach(params, function(value, key) {
    switch(key) {
      case "dimensions":
        var dims = goog.isString(value) ? value.split("x").map(Number) : goog.isArray(value) ? value : goog.isNumber(value) ? [value] : [];
        if (1 === dims.length) {
          clipParams.maxDimension = dims[0];
        } else {
          if (2 === dims.length) {
            clipParams.width = dims[0], clipParams.height = dims[1];
          } else {
            throw Error("Invalid dimensions " + value);
          }
        }
        break;
      case "region":
        var region = goog.isString(value) ? JSON.parse(value) : value;
        clipParams.geometry = new ee.Geometry(region);
        break;
      case "scale":
        clipParams.scale = value;
      default:
        outParams[key] = value;
    }
  });
  goog.object.isEmpty(clipParams) || (clipParams.input = image, image = ee.ApiFunction._apply("Image.clipToBoundsAndScale", clipParams));
  return image;
};
ee.data.images.applyCrsAndTransform = function(image, params) {
  var crs = params.crs || "", crsTransform = params.crsTransform || params.crs_transform || "";
  if (!crs && !crsTransform) {
    return image;
  }
  if (crsTransform && !crs) {
    throw Error('Must specify "crs" if "crsTransform" is specified.');
  }
  if (crsTransform) {
    if (image = ee.ApiFunction._apply("Image.reproject", {image:image, crs:crs, crsTransform:crsTransform}), goog.isDefAndNotNull(params.dimensions) && !goog.isDefAndNotNull(params.scale) && !goog.isDefAndNotNull(params.region)) {
      var dimensions = params.dimensions;
      delete params.dimensions;
      goog.isString(dimensions) && (dimensions = dimensions.split("x").map(Number));
      var projection = ee.ApiFunction._apply("Image.projection", {image:image});
      2 === dimensions.length && (params.region = new ee.Geometry.Rectangle([0, 0, dimensions[0], dimensions[1]], projection, !0));
    }
  } else {
    image = ee.ApiFunction._apply("Image.setDefaultProjection", {image:image, crs:crs, crsTransform:[1, 0, 0, 0, -1, 0]});
  }
  return image;
};
ee.data.images.applyVisualization = function(image, params) {
  var request = {}, visParams = ee.data.images.extractVisParams(params, request);
  goog.object.isEmpty(visParams) || (visParams.image = image, image = ee.ApiFunction._apply("Image.visualize", visParams));
  request.image = image;
  return request;
};
ee.data.images.extractVisParams = function(params, outParams) {
  var keysToExtract = "bands gain bias min max gamma palette opacity forceRgbOutput".split(" "), visParams = {};
  goog.object.forEach(params, function(value, key) {
    goog.array.contains(keysToExtract, key) ? visParams[key] = value : outParams[key] = value;
  });
  return visParams;
};
ee.Image = function(opt_args) {
  if (!(this instanceof ee.Image)) {
    return ee.ComputedObject.construct(ee.Image, arguments);
  }
  if (opt_args instanceof ee.Image) {
    return opt_args;
  }
  ee.Image.initialize();
  var argCount = arguments.length;
  if (0 == argCount || 1 == argCount && !goog.isDef(opt_args)) {
    ee.Element.call(this, new ee.ApiFunction("Image.mask"), {image:new ee.Image(0), mask:new ee.Image(0)});
  } else {
    if (1 == argCount) {
      if (ee.Types.isNumber(opt_args)) {
        ee.Element.call(this, new ee.ApiFunction("Image.constant"), {value:opt_args});
      } else {
        if (ee.Types.isString(opt_args)) {
          ee.Element.call(this, new ee.ApiFunction("Image.load"), {id:opt_args});
        } else {
          if (goog.isArray(opt_args)) {
            return ee.Image.combine_(goog.array.map(opt_args, function(elem) {
              return new ee.Image(elem);
            }));
          }
          if (opt_args instanceof ee.ComputedObject) {
            "Array" == opt_args.name() ? ee.Element.call(this, new ee.ApiFunction("Image.constant"), {value:opt_args}) : ee.Element.call(this, opt_args.func, opt_args.args, opt_args.varName);
          } else {
            throw Error("Unrecognized argument type to convert to an Image: " + opt_args);
          }
        }
      }
    } else {
      if (2 == argCount) {
        var id = arguments[0], version = arguments[1];
        if (ee.Types.isString(id) && ee.Types.isNumber(version)) {
          ee.Element.call(this, new ee.ApiFunction("Image.load"), {id:id, version:version});
        } else {
          throw Error("Unrecognized argument types to convert to an Image: " + arguments);
        }
      } else {
        throw Error("The Image constructor takes at most 2 arguments (" + argCount + " given)");
      }
    }
  }
};
goog.inherits(ee.Image, ee.Element);
ee.Image.initialized_ = !1;
ee.Image.initialize = function() {
  ee.Image.initialized_ || (ee.ApiFunction.importApi(ee.Image, "Image", "Image"), ee.ApiFunction.importApi(ee.Image, "Window", "Image", "focal_"), ee.Image.initialized_ = !0);
};
ee.Image.reset = function() {
  ee.ApiFunction.clearApi(ee.Image);
  ee.Image.initialized_ = !1;
};
ee.Image.prototype.getInfo = function(opt_callback) {
  return ee.Image.superClass_.getInfo.call(this, opt_callback);
};
ee.Image.prototype.getMap = function(opt_visParams, opt_callback) {
  var $jscomp$this = this, args = ee.arguments.extractFromFunction(ee.Image.prototype.getMap, arguments), request = ee.data.images.applyVisualization(this, args.visParams);
  if (args.callback) {
    var callback = args.callback;
    ee.data.getMapId(request, function(data, error) {
      var mapId = data ? Object.assign(data, {image:$jscomp$this}) : void 0;
      callback(mapId, error);
    });
  } else {
    var response = ee.data.getMapId(request);
    response.image = this;
    return response;
  }
};
ee.Image.prototype.getDownloadURL = function(params, opt_callback) {
  var args = ee.arguments.extractFromFunction(ee.Image.prototype.getDownloadURL, arguments), request = args.params ? goog.object.clone(args.params) : {};
  request.image = this.serialize();
  if (args.callback) {
    var callback = args.callback;
    ee.data.getDownloadId(request, function(downloadId, error) {
      downloadId ? callback(ee.data.makeDownloadUrl(downloadId)) : callback(null, error);
    });
  } else {
    return ee.data.makeDownloadUrl(ee.data.getDownloadId(request));
  }
};
ee.Image.prototype.getThumbURL = function(params, opt_callback) {
  var args = ee.arguments.extractFromFunction(ee.Image.prototype.getThumbURL, arguments);
  if (ee.data.getCloudApiEnabled()) {
    var extra = {}, image = ee.data.images.applySelectionAndScale(this, args.params, extra);
    var request = ee.data.images.applyVisualization(image, extra);
  } else {
    if (request = ee.data.images.applyVisualization(this, args.params), request.region) {
      if (goog.isArray(request.region) || ee.Types.isRegularObject(request.region)) {
        request.region = goog.json.serialize(request.region);
      } else {
        if (!goog.isString(request.region)) {
          throw Error("The region parameter must be an array or a GeoJSON object.");
        }
      }
    }
  }
  if (args.callback) {
    ee.data.getThumbId(request, function(thumbId, opt_error) {
      var thumbUrl = "";
      if (!goog.isDef(opt_error)) {
        try {
          thumbUrl = ee.data.makeThumbUrl(thumbId);
        } catch (e) {
          opt_error = String(e.message);
        }
      }
      args.callback(thumbUrl, opt_error);
    });
  } else {
    return ee.data.makeThumbUrl(ee.data.getThumbId(request));
  }
};
ee.Image.rgb = function(r, g, b) {
  var args = ee.arguments.extractFromFunction(ee.Image.rgb, arguments);
  return ee.Image.combine_([args.r, args.g, args.b], ["vis-red", "vis-green", "vis-blue"]);
};
ee.Image.cat = function(var_args) {
  var args = Array.prototype.slice.call(arguments);
  return ee.Image.combine_(args, null);
};
ee.Image.combine_ = function(images, opt_names) {
  if (0 == images.length) {
    return ee.ApiFunction._call("Image.constant", []);
  }
  for (var result = new ee.Image(images[0]), i = 1; i < images.length; i++) {
    result = ee.ApiFunction._call("Image.addBands", result, images[i]);
  }
  opt_names && (result = result.select([".*"], opt_names));
  return result;
};
ee.Image.prototype.select = function(var_args) {
  var args = Array.prototype.slice.call(arguments), algorithmArgs = {input:this, bandSelectors:args[0] || []};
  if (2 < args.length || ee.Types.isString(args[0]) || ee.Types.isNumber(args[0])) {
    for (var i = 0; i < args.length; i++) {
      if (!(ee.Types.isString(args[i]) || ee.Types.isNumber(args[i]) || args[i] instanceof ee.ComputedObject)) {
        throw Error("Illegal argument to select(): " + args[i]);
      }
    }
    algorithmArgs.bandSelectors = args;
  } else {
    args[1] && (algorithmArgs.newNames = args[1]);
  }
  return ee.ApiFunction._apply("Image.select", algorithmArgs);
};
ee.Image.prototype.expression = function(expression, opt_map) {
  var originalArgs = ee.arguments.extractFromFunction(ee.Image.prototype.expression, arguments), vars = ["DEFAULT_EXPRESSION_IMAGE"], eeArgs = {DEFAULT_EXPRESSION_IMAGE:this};
  if (originalArgs.map) {
    var map = originalArgs.map, name$jscomp$0;
    for (name$jscomp$0 in map) {
      vars.push(name$jscomp$0), eeArgs[name$jscomp$0] = new ee.Image(map[name$jscomp$0]);
    }
  }
  var body = ee.ApiFunction._call("Image.parseExpression", originalArgs.expression, "DEFAULT_EXPRESSION_IMAGE", vars), func = new ee.Function;
  func.encode = function(encoder) {
    return body.encode(encoder);
  };
  func.encodeCloudInvocation = function(encoder, args) {
    return ee.rpc_node.functionByReference(encoder(body), args);
  };
  func.getSignature = function() {
    return {name:"", args:goog.array.map(vars, function(name) {
      return {name:name, type:"Image", optional:!1};
    }, this), returns:"Image"};
  };
  return func.apply(eeArgs);
};
ee.Image.prototype.clip = function(geometry) {
  try {
    geometry = new ee.Geometry(geometry);
  } catch (e) {
  }
  return ee.ApiFunction._call("Image.clip", this, geometry);
};
ee.Image.prototype.rename = function(var_args) {
  var names = 1 != arguments.length || ee.Types.isString(arguments[0]) ? goog.array.clone(arguments) : arguments[0];
  return ee.ApiFunction._call("Image.rename", this, names);
};
ee.Image.prototype.name = function() {
  return "Image";
};
ee.List = function(list) {
  if (this instanceof ee.List) {
    if (1 < arguments.length) {
      throw Error("ee.List() only accepts 1 argument.");
    }
    if (list instanceof ee.List) {
      return list;
    }
  } else {
    return ee.ComputedObject.construct(ee.List, arguments);
  }
  ee.List.initialize();
  if (goog.isArray(list)) {
    ee.ComputedObject.call(this, null, null), this.list_ = list;
  } else {
    if (list instanceof ee.ComputedObject) {
      ee.ComputedObject.call(this, list.func, list.args, list.varName), this.list_ = null;
    } else {
      throw Error("Invalid argument specified for ee.List(): " + list);
    }
  }
};
goog.inherits(ee.List, ee.ComputedObject);
ee.List.initialized_ = !1;
ee.List.initialize = function() {
  ee.List.initialized_ || (ee.ApiFunction.importApi(ee.List, "List", "List"), ee.List.initialized_ = !0);
};
ee.List.reset = function() {
  ee.ApiFunction.clearApi(ee.List);
  ee.List.initialized_ = !1;
};
ee.List.prototype.encode = function(encoder) {
  return goog.isArray(this.list_) ? goog.array.map(this.list_, function(elem) {
    return encoder(elem);
  }) : ee.List.superClass_.encode.call(this, encoder);
};
ee.List.prototype.encodeCloudValue = function(encoder) {
  return goog.isArray(this.list_) ? ee.rpc_node.reference(encoder(this.list_)) : ee.List.superClass_.encodeCloudValue.call(this, encoder);
};
ee.List.prototype.name = function() {
  return "List";
};
ee.FeatureCollection = function(args, opt_column) {
  if (!(this instanceof ee.FeatureCollection)) {
    return ee.ComputedObject.construct(ee.FeatureCollection, arguments);
  }
  if (args instanceof ee.FeatureCollection) {
    return args;
  }
  if (2 < arguments.length) {
    throw Error("The FeatureCollection constructor takes at most 2 arguments (" + arguments.length + " given)");
  }
  ee.FeatureCollection.initialize();
  args instanceof ee.Geometry && (args = new ee.Feature(args));
  args instanceof ee.Feature && (args = [args]);
  if (ee.Types.isString(args)) {
    var actualArgs = {tableId:args};
    opt_column && (actualArgs.geometryColumn = opt_column);
    ee.Collection.call(this, new ee.ApiFunction("Collection.loadTable"), actualArgs);
  } else {
    if (goog.isArray(args)) {
      ee.Collection.call(this, new ee.ApiFunction("Collection"), {features:goog.array.map(args, function(elem) {
        return new ee.Feature(elem);
      })});
    } else {
      if (args instanceof ee.List) {
        ee.Collection.call(this, new ee.ApiFunction("Collection"), {features:args});
      } else {
        if (args instanceof ee.ComputedObject) {
          ee.Collection.call(this, args.func, args.args, args.varName);
        } else {
          throw Error("Unrecognized argument type to convert to a FeatureCollection: " + args);
        }
      }
    }
  }
};
goog.inherits(ee.FeatureCollection, ee.Collection);
ee.FeatureCollection.initialized_ = !1;
ee.FeatureCollection.initialize = function() {
  ee.FeatureCollection.initialized_ || (ee.ApiFunction.importApi(ee.FeatureCollection, "FeatureCollection", "FeatureCollection"), ee.FeatureCollection.initialized_ = !0);
};
ee.FeatureCollection.reset = function() {
  ee.ApiFunction.clearApi(ee.FeatureCollection);
  ee.FeatureCollection.initialized_ = !1;
};
ee.FeatureCollection.prototype.getMap = function(opt_visParams, opt_callback) {
  var args = ee.arguments.extractFromFunction(ee.FeatureCollection.prototype.getMap, arguments), painted = ee.ApiFunction._apply("Collection.draw", {collection:this, color:(args.visParams || {}).color || "000000"});
  if (args.callback) {
    painted.getMap(void 0, args.callback);
  } else {
    return painted.getMap();
  }
};
ee.FeatureCollection.prototype.getInfo = function(opt_callback) {
  return ee.FeatureCollection.superClass_.getInfo.call(this, opt_callback);
};
ee.FeatureCollection.prototype.getDownloadURL = function(opt_format, opt_selectors, opt_filename, opt_callback) {
  var args = ee.arguments.extractFromFunction(ee.FeatureCollection.prototype.getDownloadURL, arguments), request = {};
  request.table = this.serialize();
  args.format && (request.format = args.format.toUpperCase());
  args.filename && (request.filename = args.filename);
  if (args.selectors) {
    var selectors = args.selectors;
    goog.isArrayLike(selectors) && (selectors = selectors.join(","));
    request.selectors = selectors;
  }
  if (args.callback) {
    ee.data.getTableDownloadId(request, function(downloadId, error) {
      downloadId ? args.callback(ee.data.makeTableDownloadUrl(downloadId)) : args.callback(null, error);
    });
  } else {
    return ee.data.makeTableDownloadUrl(ee.data.getTableDownloadId(request));
  }
};
ee.FeatureCollection.prototype.select = function(propertySelectors, opt_newProperties, opt_retainGeometry) {
  if (ee.Types.isString(propertySelectors)) {
    var varargs = Array.prototype.slice.call(arguments);
    return this.map(function(feature) {
      return feature.select(varargs);
    });
  }
  var args = ee.arguments.extractFromFunction(ee.FeatureCollection.prototype.select, arguments);
  return this.map(function(feature) {
    return feature.select(args);
  });
};
ee.FeatureCollection.prototype.name = function() {
  return "FeatureCollection";
};
ee.FeatureCollection.prototype.elementType = function() {
  return ee.Feature;
};
ee.ImageCollection = function(args) {
  if (!(this instanceof ee.ImageCollection)) {
    return ee.ComputedObject.construct(ee.ImageCollection, arguments);
  }
  if (args instanceof ee.ImageCollection) {
    return args;
  }
  if (1 != arguments.length) {
    throw Error("The ImageCollection constructor takes exactly 1 argument (" + arguments.length + " given)");
  }
  ee.ImageCollection.initialize();
  args instanceof ee.Image && (args = [args]);
  if (ee.Types.isString(args)) {
    ee.Collection.call(this, new ee.ApiFunction("ImageCollection.load"), {id:args});
  } else {
    if (goog.isArray(args)) {
      ee.Collection.call(this, new ee.ApiFunction("ImageCollection.fromImages"), {images:goog.array.map(args, function(elem) {
        return new ee.Image(elem);
      })});
    } else {
      if (args instanceof ee.List) {
        ee.Collection.call(this, new ee.ApiFunction("ImageCollection.fromImages"), {images:args});
      } else {
        if (args instanceof ee.ComputedObject) {
          ee.Collection.call(this, args.func, args.args, args.varName);
        } else {
          throw Error("Unrecognized argument type to convert to an ImageCollection: " + args);
        }
      }
    }
  }
};
goog.inherits(ee.ImageCollection, ee.Collection);
ee.ImageCollection.initialized_ = !1;
ee.ImageCollection.initialize = function() {
  ee.ImageCollection.initialized_ || (ee.ApiFunction.importApi(ee.ImageCollection, "ImageCollection", "ImageCollection"), ee.ApiFunction.importApi(ee.ImageCollection, "reduce", "ImageCollection"), ee.ImageCollection.initialized_ = !0);
};
ee.ImageCollection.reset = function() {
  ee.ApiFunction.clearApi(ee.ImageCollection);
  ee.ImageCollection.initialized_ = !1;
};
ee.ImageCollection.prototype.getFilmstripThumbURL = function(params, opt_callback) {
  var args = ee.arguments.extractFromFunction(ee.ImageCollection.prototype.getFilmstripThumbURL, arguments);
  return ee.ImageCollection.prototype.getThumbURL_(this, args, ["png", "jpg", "jpeg"], opt_callback);
};
ee.ImageCollection.prototype.getVideoThumbURL = function(params, opt_callback) {
  var args = ee.arguments.extractFromFunction(ee.ImageCollection.prototype.getVideoThumbURL, arguments);
  return ee.ImageCollection.prototype.getThumbURL_(this, args, ["gif"], opt_callback);
};
ee.ImageCollection.prototype.getThumbURL_ = function(collection, args, validFormats, opt_callback) {
  var extraParams = {}, clippedCollection = collection.map(function(image) {
    var projected = ee.data.images.applyCrsAndTransform(image, args.params);
    return ee.data.images.applySelectionAndScale(projected, args.params, extraParams);
  }), request = {}, visParams = ee.data.images.extractVisParams(extraParams, request);
  goog.isDefAndNotNull(args.params.dimensions) && (request.dimensions = args.params.dimensions);
  var visColl = clippedCollection.map(function(image) {
    visParams.image = image;
    return ee.ApiFunction._apply("Image.visualize", visParams);
  });
  request.image = visColl.serialize();
  if (request.format) {
    if (!goog.array.some(validFormats, function(format) {
      return goog.string.caseInsensitiveEquals(format, request.format);
    })) {
      throw Error("Invalid format specified.");
    }
  } else {
    request.format = validFormats[0];
  }
  if (args.callback) {
    ee.data.getThumbId(request, function(thumbId, opt_error) {
      var thumbUrl = "";
      if (!goog.isDef(opt_error)) {
        try {
          thumbUrl = ee.data.makeThumbUrl(thumbId);
        } catch (e) {
          opt_error = String(e.message);
        }
      }
      args.callback(thumbUrl, opt_error);
    });
  } else {
    return ee.data.makeThumbUrl(ee.data.getThumbId(request));
  }
};
ee.ImageCollection.prototype.getMap = function(opt_visParams, opt_callback) {
  var args = ee.arguments.extractFromFunction(ee.ImageCollection.prototype.getMap, arguments), mosaic = ee.ApiFunction._call("ImageCollection.mosaic", this);
  if (args.callback) {
    mosaic.getMap(args.visParams, args.callback);
  } else {
    return mosaic.getMap(args.visParams);
  }
};
ee.ImageCollection.prototype.getInfo = function(opt_callback) {
  return ee.ImageCollection.superClass_.getInfo.call(this, opt_callback);
};
ee.ImageCollection.prototype.select = function(selectors, opt_names) {
  var varargs = arguments;
  return this.map(function(obj) {
    return obj.select.apply(obj, varargs);
  });
};
ee.ImageCollection.prototype.first = function() {
  return new ee.Image(ee.ApiFunction._call("Collection.first", this));
};
ee.ImageCollection.prototype.name = function() {
  return "ImageCollection";
};
ee.ImageCollection.prototype.elementType = function() {
  return ee.Image;
};
ee.batch = {};
var ComputedObject = ee.ComputedObject, ExportDestination = ee.data.ExportDestination, ExportType = ee.data.ExportType, GoogPromise = goog.Promise, googArray = goog.array, googObject = goog.object, json = goog.json;
ee.batch.Export = {image:{}, map:{}, table:{}, video:{}, videoMap:{}};
ee.batch.ExportTask = function(config) {
  this.config_ = config;
  this.id = null;
};
ee.batch.ExportTask.create = function(exportArgs) {
  var config = {element:ee.batch.Export.extractElement(exportArgs)};
  Object.assign(config, exportArgs);
  config = goog.object.filter(config, goog.isDefAndNotNull);
  return new ee.batch.ExportTask(config);
};
ee.batch.ExportTask.prototype.start = function(opt_success, opt_error) {
  var $jscomp$this = this;
  goog.asserts.assert(this.config_, "Task config must be specified for tasks to be started.");
  if (opt_success) {
    var startProcessing = function() {
      goog.asserts.assertString($jscomp$this.id);
      ee.data.startProcessing($jscomp$this.id, $jscomp$this.config_, function(_, error) {
        error ? opt_error(error) : opt_success();
      });
    };
    this.id ? startProcessing() : ee.data.newTaskId(1, function(ids) {
      var id = ids && ids[0];
      id ? ($jscomp$this.id = id, startProcessing()) : opt_error("Failed to obtain task ID.");
    });
  } else {
    this.id = this.id || ee.data.newTaskId(1)[0], goog.asserts.assertString(this.id, "Failed to obtain task ID."), ee.data.startProcessing(this.id, this.config_);
  }
};
ee.batch.Export.image.toAsset = function(image, opt_description, opt_assetId, opt_pyramidingPolicy, opt_dimensions, opt_region, opt_scale, opt_crs, opt_crsTransform, opt_maxPixels) {
  var clientConfig = ee.arguments.extractFromFunction(ee.batch.Export.image.toAsset, arguments), serverConfig = ee.batch.Export.convertToServerParams(clientConfig, ee.data.ExportDestination.ASSET, ee.data.ExportType.IMAGE);
  return ee.batch.ExportTask.create(serverConfig);
};
ee.batch.Export.image.toCloudStorage = function(image, opt_description, opt_bucket, opt_fileNamePrefix, opt_dimensions, opt_region, opt_scale, opt_crs, opt_crsTransform, opt_maxPixels, opt_shardSize, opt_fileDimensions, opt_skipEmptyTiles, opt_fileFormat, opt_formatOptions) {
  var clientConfig = ee.arguments.extractFromFunction(ee.batch.Export.image.toCloudStorage, arguments), serverConfig = ee.batch.Export.convertToServerParams(clientConfig, ee.data.ExportDestination.GCS, ee.data.ExportType.IMAGE);
  return ee.batch.ExportTask.create(serverConfig);
};
ee.batch.Export.image.toDrive = function(image, opt_description, opt_folder, opt_fileNamePrefix, opt_dimensions, opt_region, opt_scale, opt_crs, opt_crsTransform, opt_maxPixels, opt_shardSize, opt_fileDimensions, opt_skipEmptyTiles, opt_fileFormat, opt_formatOptions) {
  var clientConfig = ee.arguments.extractFromFunction(ee.batch.Export.image.toDrive, arguments), serverConfig = ee.batch.Export.convertToServerParams(clientConfig, ee.data.ExportDestination.DRIVE, ee.data.ExportType.IMAGE);
  return ee.batch.ExportTask.create(serverConfig);
};
ee.batch.Export.map.toCloudStorage = function(image, opt_description, opt_bucket, opt_fileFormat, opt_path, opt_writePublicTiles, opt_scale, opt_maxZoom, opt_minZoom, opt_region, opt_skipEmptyTiles, opt_mapsApiKey) {
  var clientConfig = ee.arguments.extractFromFunction(ee.batch.Export.map.toCloudStorage, arguments), serverConfig = ee.batch.Export.convertToServerParams(clientConfig, ee.data.ExportDestination.GCS, ee.data.ExportType.MAP);
  return ee.batch.ExportTask.create(serverConfig);
};
ee.batch.Export.table.toCloudStorage = function(collection, opt_description, opt_bucket, opt_fileNamePrefix, opt_fileFormat, opt_selectors) {
  var clientConfig = ee.arguments.extractFromFunction(ee.batch.Export.table.toCloudStorage, arguments), serverConfig = ee.batch.Export.convertToServerParams(clientConfig, ee.data.ExportDestination.GCS, ee.data.ExportType.TABLE);
  return ee.batch.ExportTask.create(serverConfig);
};
ee.batch.Export.table.toDrive = function(collection, opt_description, opt_folder, opt_fileNamePrefix, opt_fileFormat, opt_selectors) {
  var clientConfig = ee.arguments.extractFromFunction(ee.batch.Export.table.toDrive, arguments);
  clientConfig.type = ee.data.ExportType.TABLE;
  var serverConfig = ee.batch.Export.convertToServerParams(clientConfig, ee.data.ExportDestination.DRIVE, ee.data.ExportType.TABLE);
  return ee.batch.ExportTask.create(serverConfig);
};
ee.batch.Export.table.toAsset = function(collection, opt_description, opt_assetId) {
  var clientConfig = ee.arguments.extractFromFunction(ee.batch.Export.table.toAsset, arguments), serverConfig = ee.batch.Export.convertToServerParams(clientConfig, ee.data.ExportDestination.ASSET, ee.data.ExportType.TABLE);
  return ee.batch.ExportTask.create(serverConfig);
};
ee.batch.Export.video.toCloudStorage = function(collection, opt_description, opt_bucket, opt_fileNamePrefix, opt_framesPerSecond, opt_dimensions, opt_region, opt_scale, opt_crs, opt_crsTransform, opt_maxPixels, opt_maxFrames) {
  var clientConfig = ee.arguments.extractFromFunction(ee.batch.Export.video.toCloudStorage, arguments), serverConfig = ee.batch.Export.convertToServerParams(clientConfig, ee.data.ExportDestination.GCS, ee.data.ExportType.VIDEO);
  return ee.batch.ExportTask.create(serverConfig);
};
ee.batch.Export.video.toDrive = function(collection, opt_description, opt_folder, opt_fileNamePrefix, opt_framesPerSecond, opt_dimensions, opt_region, opt_scale, opt_crs, opt_crsTransform, opt_maxPixels, opt_maxFrames) {
  var clientConfig = ee.arguments.extractFromFunction(ee.batch.Export.video.toDrive, arguments), serverConfig = ee.batch.Export.convertToServerParams(clientConfig, ee.data.ExportDestination.DRIVE, ee.data.ExportType.VIDEO);
  return ee.batch.ExportTask.create(serverConfig);
};
ee.batch.Export.videoMap.toCloudStorage = function(collection, opt_description, opt_bucket, opt_fileNamePrefix, opt_framesPerSecond, opt_writePublicTiles, opt_minZoom, opt_maxZoom, opt_scale, opt_region, opt_skipEmptyTiles) {
  var clientConfig = ee.arguments.extractFromFunction(ee.batch.Export.videoMap.toCloudStorage, arguments), serverConfig = ee.batch.Export.convertToServerParams(clientConfig, ee.data.ExportDestination.GCS, ee.data.ExportType.VIDEO_MAP);
  return ee.batch.ExportTask.create(serverConfig);
};
ee.batch.ServerTaskConfig = {};
ee.batch.Export.serializeRegion = function(region) {
  if (region instanceof ee.Geometry) {
    region = region.toGeoJSON();
  } else {
    if (goog.isString(region)) {
      try {
        region = goog.asserts.assertObject(JSON.parse(region));
      } catch (x) {
        throw Error("Invalid format for region property. Region must be GeoJSON LinearRing or Polygon specified as actual coordinates or serialized as a string. See Export documentation.");
      }
    }
  }
  if (!(goog.isObject(region) && "type" in region)) {
    try {
      new ee.Geometry.LineString(region);
    } catch (e) {
      try {
        new ee.Geometry.Polygon(region);
      } catch (e2) {
        throw Error("Invalid format for region property. Region must be GeoJSON LinearRing or Polygon specified as actual coordinates or serialized as a string. See Export documentation.");
      }
    }
  }
  return goog.json.serialize(region);
};
ee.batch.Export.resolveRegionParam = function(params) {
  params = goog.object.clone(params);
  if (!params.region) {
    return goog.Promise.resolve(params);
  }
  var region = params.region;
  if (region instanceof ee.ComputedObject) {
    return region instanceof ee.Element && (region = region.geometry()), new goog.Promise(function(resolve, reject) {
      region.getInfo(function(regionInfo, error) {
        error ? reject(error) : (params.region = ee.batch.Export.serializeRegion(regionInfo), ee.data.getCloudApiEnabled() && params.type === ee.data.ExportType.IMAGE && (params.region = new ee.Geometry(regionInfo), ee.batch.Export.applyTransformsToImage(params)), resolve(params));
      });
    });
  }
  params.region = ee.batch.Export.serializeRegion(region);
  return goog.Promise.resolve(params);
};
ee.batch.Export.applyTransformsToImage = function(taskConfig) {
  var resultParams = {}, image = ee.data.images.applyCrsAndTransform(taskConfig.image, taskConfig);
  image = ee.data.images.applySelectionAndScale(image, taskConfig, resultParams);
  resultParams.image = image;
  return resultParams;
};
ee.batch.Export.extractElement = function(exportArgs) {
  var isInArgs = function(key) {
    return key in exportArgs;
  }, eeElementKey = ee.batch.Export.EE_ELEMENT_KEYS.find(isInArgs);
  goog.asserts.assert(1 === goog.array.count(ee.batch.Export.EE_ELEMENT_KEYS, isInArgs), 'Expected a single "image" or "collection" key.');
  var element = exportArgs[eeElementKey];
  if (element instanceof ee.Image) {
    var result = element;
  } else {
    if (element instanceof ee.FeatureCollection) {
      result = element;
    } else {
      if (element instanceof ee.ImageCollection) {
        result = element;
      } else {
        if (element instanceof ee.Element) {
          result = element;
        } else {
          throw Error("Unknown element type provided: " + typeof element + ". Expected:  ee.Image, ee.ImageCollection, ee.FeatureCollection or ee.Element.");
        }
      }
    }
  }
  delete exportArgs[eeElementKey];
  return result;
};
ee.batch.Export.convertToServerParams = function(originalArgs, destination, exportType, serializeRegion) {
  serializeRegion = void 0 === serializeRegion ? !0 : serializeRegion;
  var taskConfig = {type:exportType};
  Object.assign(taskConfig, originalArgs);
  switch(exportType) {
    case ee.data.ExportType.IMAGE:
      taskConfig = ee.batch.Export.image.prepareTaskConfig_(taskConfig, destination);
      break;
    case ee.data.ExportType.MAP:
      taskConfig = ee.batch.Export.map.prepareTaskConfig_(taskConfig, destination);
      break;
    case ee.data.ExportType.TABLE:
      taskConfig = ee.batch.Export.table.prepareTaskConfig_(taskConfig, destination);
      break;
    case ee.data.ExportType.VIDEO:
      taskConfig = ee.batch.Export.video.prepareTaskConfig_(taskConfig, destination);
      break;
    case ee.data.ExportType.VIDEO_MAP:
      taskConfig = ee.batch.Export.videoMap.prepareTaskConfig_(taskConfig, destination);
      break;
    default:
      throw Error("Unknown export type: " + taskConfig.type);
  }
  serializeRegion && goog.isDefAndNotNull(taskConfig.region) && (taskConfig.region = ee.batch.Export.serializeRegion(taskConfig.region));
  return taskConfig;
};
ee.batch.Export.prepareDestination_ = function(taskConfig, destination) {
  switch(destination) {
    case ee.data.ExportDestination.GCS:
      taskConfig.outputBucket = taskConfig.bucket || "";
      taskConfig.outputPrefix = taskConfig.fileNamePrefix || taskConfig.path || "";
      delete taskConfig.fileNamePrefix;
      delete taskConfig.path;
      delete taskConfig.bucket;
      break;
    case ee.data.ExportDestination.ASSET:
      taskConfig.assetId = taskConfig.assetId || "";
      break;
    default:
      var folderType = goog.typeOf(taskConfig.folder);
      if (!goog.array.contains(["string", "undefined"], folderType)) {
        throw Error('Error: toDrive "folder" parameter must be a string, but is of type ' + folderType + ".");
      }
      taskConfig.driveFolder = taskConfig.folder || "";
      taskConfig.driveFileNamePrefix = taskConfig.fileNamePrefix || "";
      delete taskConfig.folder;
      delete taskConfig.fileNamePrefix;
  }
  return taskConfig;
};
ee.batch.Export.image.prepareTaskConfig_ = function(taskConfig, destination) {
  goog.isDefAndNotNull(taskConfig.fileFormat) || (taskConfig.fileFormat = "GeoTIFF");
  taskConfig = ee.batch.Export.reconcileImageFormat(taskConfig);
  taskConfig = ee.batch.Export.prepareDestination_(taskConfig, destination);
  goog.isDefAndNotNull(taskConfig.crsTransform) && (taskConfig[ee.batch.Export.CRS_TRANSFORM_KEY] = taskConfig.crsTransform, delete taskConfig.crsTransform);
  return taskConfig;
};
ee.batch.Export.table.prepareTaskConfig_ = function(taskConfig, destination) {
  goog.isArray(taskConfig.selectors) && (taskConfig.selectors = taskConfig.selectors.join());
  return taskConfig = ee.batch.Export.prepareDestination_(taskConfig, destination);
};
ee.batch.Export.map.prepareTaskConfig_ = function(taskConfig, destination) {
  return taskConfig = ee.batch.Export.prepareDestination_(taskConfig, destination);
};
ee.batch.Export.video.prepareTaskConfig_ = function(taskConfig, destination) {
  taskConfig = ee.batch.Export.reconcileVideoFormat_(taskConfig);
  taskConfig = ee.batch.Export.prepareDestination_(taskConfig, destination);
  goog.isDefAndNotNull(taskConfig.crsTransform) && (taskConfig[ee.batch.Export.CRS_TRANSFORM_KEY] = taskConfig.crsTransform, delete taskConfig.crsTransform);
  return taskConfig;
};
ee.batch.Export.videoMap.prepareTaskConfig_ = function(taskConfig, destination) {
  taskConfig = ee.batch.Export.reconcileVideoFormat_(taskConfig);
  return taskConfig = ee.batch.Export.prepareDestination_(taskConfig, destination);
};
ee.batch.VideoFormat = {MP4:"MP4"};
ee.batch.ImageFormat = {JPEG:"JPEG", PNG:"PNG", AUTO_PNG_JPEG:"AUTO_PNG_JPEG", NPY:"NPY", GEO_TIFF:"GEO_TIFF", TF_RECORD_IMAGE:"TF_RECORD_IMAGE"};
var FORMAT_OPTIONS_MAP = {GEO_TIFF:["cloudOptimized", "fileDimensions"], TF_RECORD_IMAGE:"patchDimensions kernelSize compressed maxFileSize defaultValue tensorDepths sequenceData collapseBands maskedThreshold".split(" ")}, FORMAT_PREFIX_MAP = {GEO_TIFF:"tiff", TF_RECORD_IMAGE:"tfrecord"};
ee.batch.Export.reconcileVideoFormat_ = function(taskConfig) {
  taskConfig.videoOptions = taskConfig.framesPerSecond || 5.0;
  taskConfig.maxFrames = taskConfig.maxFrames || 1000;
  taskConfig.maxPixels = taskConfig.maxPixels || 1e8;
  taskConfig.fileFormat = ee.batch.VideoFormat.MP4;
  return taskConfig;
};
ee.batch.Export.reconcileImageFormat = function(taskConfig) {
  var formatString = taskConfig.fileFormat;
  goog.isDefAndNotNull(formatString) || (formatString = "GEO_TIFF");
  formatString = formatString.toUpperCase();
  switch(formatString) {
    case "TIFF":
    case "TIF":
    case "GEO_TIFF":
    case "GEOTIFF":
      formatString = ee.batch.ImageFormat.GEO_TIFF;
      break;
    case "TF_RECORD":
    case "TF_RECORD_IMAGE":
    case "TFRECORD":
      formatString = ee.batch.ImageFormat.TF_RECORD_IMAGE;
      break;
    default:
      throw Error("Invalid file format " + formatString + ". Supported formats are: 'GEOTIFF', 'TFRECORD'.");
  }
  if (goog.isDefAndNotNull(taskConfig.formatOptions)) {
    var formatOptions = ee.batch.Export.prefixImageFormatOptions_(taskConfig, formatString);
    delete taskConfig.formatOptions;
    Object.assign(taskConfig, formatOptions);
  }
  return taskConfig;
};
ee.batch.Export.prefixImageFormatOptions_ = function(taskConfig, imageFormat) {
  var formatOptions = taskConfig.formatOptions;
  if (!goog.isDefAndNotNull(formatOptions)) {
    return {};
  }
  if (Object.keys(taskConfig).some(function(key) {
    return goog.object.containsKey(formatOptions, key);
  })) {
    throw Error("Parameter specified at least twice: once in config, and once in config format options.");
  }
  for (var prefix = FORMAT_PREFIX_MAP[imageFormat], validOptionKeys = FORMAT_OPTIONS_MAP[imageFormat], prefixedOptions = {}, $jscomp$iter$11 = $jscomp.makeIterator(Object.entries(formatOptions)), $jscomp$key$ = $jscomp$iter$11.next(); !$jscomp$key$.done; $jscomp$key$ = $jscomp$iter$11.next()) {
    var $jscomp$destructuring$var7 = $jscomp.makeIterator($jscomp$key$.value), key$jscomp$0 = $jscomp$destructuring$var7.next().value, value = $jscomp$destructuring$var7.next().value;
    if (!goog.array.contains(validOptionKeys, key$jscomp$0)) {
      var validKeysMsg = validOptionKeys.join(", ");
      throw Error('"' + key$jscomp$0 + '" is not a valid option, the image format "' + imageFormat + '"' + ('"may have the following options: ' + validKeysMsg + '".'));
    }
    var prefixedKey = prefix + key$jscomp$0[0].toUpperCase() + key$jscomp$0.substring(1);
    goog.isArray(value) ? prefixedOptions[prefixedKey] = value.join() : prefixedOptions[prefixedKey] = value;
  }
  return prefixedOptions;
};
ee.batch.Export.CRS_TRANSFORM_KEY = "crs_transform";
ee.batch.Export.EE_ELEMENT_KEYS = ["image", "collection"];
ee.Number = function(number) {
  if (!(this instanceof ee.Number)) {
    return ee.ComputedObject.construct(ee.Number, arguments);
  }
  if (number instanceof ee.Number) {
    return number;
  }
  ee.Number.initialize();
  if (goog.isNumber(number)) {
    ee.ComputedObject.call(this, null, null), this.number_ = number;
  } else {
    if (number instanceof ee.ComputedObject) {
      ee.ComputedObject.call(this, number.func, number.args, number.varName), this.number_ = null;
    } else {
      throw Error("Invalid argument specified for ee.Number(): " + number);
    }
  }
};
goog.inherits(ee.Number, ee.ComputedObject);
ee.Number.initialized_ = !1;
ee.Number.initialize = function() {
  ee.Number.initialized_ || (ee.ApiFunction.importApi(ee.Number, "Number", "Number"), ee.Number.initialized_ = !0);
};
ee.Number.reset = function() {
  ee.ApiFunction.clearApi(ee.Number);
  ee.Number.initialized_ = !1;
};
ee.Number.prototype.encode = function(encoder) {
  return goog.isNumber(this.number_) ? this.number_ : ee.Number.superClass_.encode.call(this, encoder);
};
ee.Number.prototype.encodeCloudValue = function(encoder) {
  return goog.isNumber(this.number_) ? ee.rpc_node.reference(encoder(this.number_)) : ee.Number.superClass_.encodeCloudValue.call(this, encoder);
};
ee.Number.prototype.name = function() {
  return "Number";
};
ee.String = function(string) {
  if (!(this instanceof ee.String)) {
    return ee.ComputedObject.construct(ee.String, arguments);
  }
  if (string instanceof ee.String) {
    return string;
  }
  ee.String.initialize();
  if (goog.isString(string)) {
    ee.ComputedObject.call(this, null, null), this.string_ = string;
  } else {
    if (string instanceof ee.ComputedObject) {
      this.string_ = null, string.func && "String" == string.func.getSignature().returns ? ee.ComputedObject.call(this, string.func, string.args, string.varName) : ee.ComputedObject.call(this, new ee.ApiFunction("String"), {input:string}, null);
    } else {
      throw Error("Invalid argument specified for ee.String(): " + string);
    }
  }
};
goog.inherits(ee.String, ee.ComputedObject);
ee.String.initialized_ = !1;
ee.String.initialize = function() {
  ee.String.initialized_ || (ee.ApiFunction.importApi(ee.String, "String", "String"), ee.String.initialized_ = !0);
};
ee.String.reset = function() {
  ee.ApiFunction.clearApi(ee.String);
  ee.String.initialized_ = !1;
};
ee.String.prototype.encode = function(encoder) {
  return goog.isString(this.string_) ? this.string_ : ee.String.superClass_.encode.call(this, encoder);
};
ee.String.prototype.encodeCloudValue = function(encoder) {
  return goog.isString(this.string_) ? ee.rpc_node.reference(encoder(this.string_)) : ee.String.superClass_.encodeCloudValue.call(this, encoder);
};
ee.String.prototype.name = function() {
  return "String";
};
ee.CustomFunction = function(signature, body) {
  if (!(this instanceof ee.CustomFunction)) {
    return ee.ComputedObject.construct(ee.CustomFunction, arguments);
  }
  for (var vars = [], args = signature.args, i = 0; i < args.length; i++) {
    var arg = args[i];
    vars.push(ee.CustomFunction.variable(ee.Types.nameToClass(arg.type), arg.name));
  }
  if (!goog.isDef(body.apply(null, vars))) {
    throw Error("User-defined methods must return a value.");
  }
  this.signature_ = ee.CustomFunction.resolveNamelessArgs_(signature, vars, body);
  this.body_ = body.apply(null, vars);
};
goog.inherits(ee.CustomFunction, ee.Function);
goog.exportSymbol("ee.CustomFunction", ee.CustomFunction);
ee.CustomFunction.prototype.encode = function(encoder) {
  return {type:"Function", argumentNames:goog.array.map(this.signature_.args, function(arg) {
    return arg.name;
  }), body:encoder(this.body_)};
};
ee.CustomFunction.prototype.encodeCloudValue = function(encoder) {
  return ee.rpc_node.functionDefinition(this.signature_.args.map(function(arg) {
    return arg.name;
  }), encoder(this.body_));
};
ee.CustomFunction.prototype.encodeCloudInvocation = function(encoder, args) {
  return ee.rpc_node.functionByReference(encoder(this), args);
};
ee.CustomFunction.prototype.getSignature = function() {
  return this.signature_;
};
ee.CustomFunction.variable = function(type, name$jscomp$0) {
  type = type || Object;
  if (!(type.prototype instanceof ee.ComputedObject)) {
    if (type && type != Object) {
      if (type == String) {
        type = ee.String;
      } else {
        if (type == Number) {
          type = ee.Number;
        } else {
          if (type == Array) {
            type = goog.global.ee.List;
          } else {
            throw Error("Variables must be of an EE type, e.g. ee.Image or ee.Number.");
          }
        }
      }
    } else {
      type = ee.ComputedObject;
    }
  }
  var klass = function(name) {
    this.args = this.func = null;
    this.varName = name;
  };
  klass.prototype = type.prototype;
  return new klass(name$jscomp$0);
};
ee.CustomFunction.create = function(func, returnType, arg_types) {
  var stringifyType = function(type) {
    return goog.isString(type) ? type : ee.Types.classToName(type);
  }, args = goog.array.map(arg_types, function(argType) {
    return {name:null, type:stringifyType(argType)};
  }), signature = {name:"", returns:stringifyType(returnType), args:args};
  return new ee.CustomFunction(signature, func);
};
ee.CustomFunction.resolveNamelessArgs_ = function(signature, vars, body) {
  for (var namelessArgIndices = [], i = 0; i < vars.length; i++) {
    goog.isNull(vars[i].varName) && namelessArgIndices.push(i);
  }
  if (0 == namelessArgIndices.length) {
    return signature;
  }
  var countFunctions = function(expression) {
    var count = 0;
    goog.isObject(expression) && !goog.isFunction(expression) && ("Function" == expression.type && count++, goog.object.forEach(expression, function(subExpression) {
      count += countFunctions(subExpression);
    }));
    return count;
  }, serializedBody = ee.Serializer.encode(body.apply(null, vars)), baseName = "_MAPPING_VAR_" + countFunctions(serializedBody) + "_";
  for (i = 0; i < namelessArgIndices.length; i++) {
    var index = namelessArgIndices[i], name = baseName + i;
    vars[index].varName = name;
    signature.args[index].name = name;
  }
  return signature;
};
ee.Date = function(date, opt_tz) {
  if (!(this instanceof ee.Date)) {
    return ee.ComputedObject.construct(ee.Date, arguments);
  }
  if (date instanceof ee.Date) {
    return date;
  }
  ee.Date.initialize();
  var jsArgs = ee.arguments.extractFromFunction(ee.Date, arguments);
  date = jsArgs.date;
  var tz = jsArgs.tz, func = new ee.ApiFunction("Date"), args = {}, varName = null;
  if (ee.Types.isString(date)) {
    if (args.value = date, tz) {
      if (ee.Types.isString(tz)) {
        args.timeZone = tz;
      } else {
        throw Error("Invalid argument specified for ee.Date(..., opt_tz): " + tz);
      }
    }
  } else {
    if (ee.Types.isNumber(date)) {
      args.value = date;
    } else {
      if (goog.isDateLike(date)) {
        args.value = Math.floor(date.getTime());
      } else {
        if (date instanceof ee.ComputedObject) {
          date.func && "Date" == date.func.getSignature().returns ? (func = date.func, args = date.args, varName = date.varName) : args.value = date;
        } else {
          throw Error("Invalid argument specified for ee.Date(): " + date);
        }
      }
    }
  }
  ee.ComputedObject.call(this, func, args, varName);
};
goog.inherits(ee.Date, ee.ComputedObject);
ee.Date.initialized_ = !1;
ee.Date.initialize = function() {
  ee.Date.initialized_ || (ee.ApiFunction.importApi(ee.Date, "Date", "Date"), ee.Date.initialized_ = !0);
};
ee.Date.reset = function() {
  ee.ApiFunction.clearApi(ee.Date);
  ee.Date.initialized_ = !1;
};
ee.Date.prototype.name = function() {
  return "Date";
};
ee.Deserializer = function() {
};
goog.exportSymbol("ee.Deserializer", ee.Deserializer);
ee.Deserializer.fromJSON = function(json) {
  return ee.Deserializer.decode(JSON.parse(json));
};
ee.Deserializer.decode = function(json) {
  var namedValues = {};
  if (goog.isObject(json) && "CompoundValue" == json.type) {
    for (var scopes = json.scope, i = 0; i < scopes.length; i++) {
      var key = scopes[i][0], value = scopes[i][1];
      if (key in namedValues) {
        throw Error('Duplicate scope key "' + key + '" in scope #' + i + ".");
      }
      namedValues[key] = ee.Deserializer.decodeValue_(value, namedValues);
    }
    json = json.value;
  }
  return ee.Deserializer.decodeValue_(json, namedValues);
};
ee.Deserializer.decodeValue_ = function(json, namedValues) {
  if (goog.isNull(json) || goog.isNumber(json) || goog.isBoolean(json) || goog.isString(json)) {
    return json;
  }
  if (goog.isArray(json)) {
    return goog.array.map(json, function(element) {
      return ee.Deserializer.decodeValue_(element, namedValues);
    });
  }
  if (!goog.isObject(json) || goog.isFunction(json)) {
    throw Error("Cannot decode object: " + json);
  }
  var typeName = json.type;
  switch(typeName) {
    case "ValueRef":
      if (json.value in namedValues) {
        return namedValues[json.value];
      }
      throw Error("Unknown ValueRef: " + json);
    case "ArgumentRef":
      var varName = json.value;
      if (!goog.isString(varName)) {
        throw Error("Invalid variable name: " + varName);
      }
      return ee.CustomFunction.variable(Object, varName);
    case "Date":
      var microseconds = json.value;
      if (!goog.isNumber(microseconds)) {
        throw Error("Invalid date value: " + microseconds);
      }
      return new ee.Date(microseconds / 1000);
    case "Bytes":
      var result = new ee.Encodable;
      result.encode = function(encoder) {
        return json;
      };
      return result;
    case "Invocation":
      var func = "functionName" in json ? ee.ApiFunction.lookup(json.functionName) : ee.Deserializer.decodeValue_(json["function"], namedValues);
      var args = goog.object.map(json.arguments, function(element) {
        return ee.Deserializer.decodeValue_(element, namedValues);
      });
      if (func instanceof ee.Function) {
        return func.apply(args);
      }
      if (func instanceof ee.ComputedObject) {
        return new ee.ComputedObject(func, args);
      }
      throw Error("Invalid function value: " + json["function"]);
    case "Dictionary":
      return goog.object.map(json.value, function(element) {
        return ee.Deserializer.decodeValue_(element, namedValues);
      });
    case "Function":
      var body = ee.Deserializer.decodeValue_(json.body, namedValues), signature = {name:"", args:goog.array.map(json.argumentNames, function(argName) {
        return {name:argName, type:"Object", optional:!1};
      }), returns:"Object"};
      return new ee.CustomFunction(signature, function() {
        return body;
      });
    case "Point":
    case "MultiPoint":
    case "LineString":
    case "MultiLineString":
    case "Polygon":
    case "MultiPolygon":
    case "LinearRing":
    case "GeometryCollection":
      return new ee.Geometry(json);
    case "CompoundValue":
      throw Error("Nested CompoundValues are disallowed.");
    default:
      throw Error("Unknown encoded object type: " + typeName);
  }
};
ee.Dictionary = function(opt_dict) {
  if (!(this instanceof ee.Dictionary)) {
    return ee.ComputedObject.construct(ee.Dictionary, arguments);
  }
  if (opt_dict instanceof ee.Dictionary) {
    return opt_dict;
  }
  ee.Dictionary.initialize();
  ee.Types.isRegularObject(opt_dict) ? (ee.ComputedObject.call(this, null, null), this.dict_ = opt_dict) : (opt_dict instanceof ee.ComputedObject && opt_dict.func && "Dictionary" == opt_dict.func.getSignature().returns ? ee.ComputedObject.call(this, opt_dict.func, opt_dict.args, opt_dict.varName) : ee.ComputedObject.call(this, new ee.ApiFunction("Dictionary"), {input:opt_dict}, null), this.dict_ = null);
};
goog.inherits(ee.Dictionary, ee.ComputedObject);
ee.Dictionary.initialized_ = !1;
ee.Dictionary.initialize = function() {
  ee.Dictionary.initialized_ || (ee.ApiFunction.importApi(ee.Dictionary, "Dictionary", "Dictionary"), ee.Dictionary.initialized_ = !0);
};
ee.Dictionary.reset = function() {
  ee.ApiFunction.clearApi(ee.Dictionary);
  ee.Dictionary.initialized_ = !1;
};
ee.Dictionary.prototype.encode = function(encoder) {
  return goog.isNull(this.dict_) ? ee.Dictionary.superClass_.encode.call(this, encoder) : encoder(this.dict_);
};
ee.Dictionary.prototype.encodeCloudValue = function(encoder) {
  return goog.isNull(this.dict_) ? ee.Dictionary.superClass_.encodeCloudValue.call(this, encoder) : ee.rpc_node.reference(encoder(this.dict_));
};
ee.Dictionary.prototype.name = function() {
  return "Dictionary";
};
ee.Terrain = {};
ee.Terrain.initialized_ = !1;
ee.Terrain.initialize = function() {
  ee.Terrain.initialized_ || (ee.ApiFunction.importApi(ee.Terrain, "Terrain", "Terrain"), ee.Terrain.initialized_ = !0);
};
ee.Terrain.reset = function() {
  ee.ApiFunction.clearApi(ee.Terrain);
  ee.Terrain.initialized_ = !1;
};
ee.initialize = function(opt_baseurl, opt_tileurl, opt_successCallback, opt_errorCallback, opt_xsrfToken) {
  if (ee.ready_ != ee.InitState.READY || opt_baseurl || opt_tileurl) {
    var isAsynchronous = goog.isDefAndNotNull(opt_successCallback);
    if (opt_errorCallback) {
      if (isAsynchronous) {
        ee.errorCallbacks_.push(opt_errorCallback);
      } else {
        throw Error("Can't pass an error callback without a success callback.");
      }
    }
    if (ee.ready_ == ee.InitState.LOADING && isAsynchronous) {
      ee.successCallbacks_.push(opt_successCallback);
    } else {
      if (ee.ready_ = ee.InitState.LOADING, ee.data.initialize(opt_baseurl, opt_tileurl, opt_xsrfToken), isAsynchronous) {
        ee.successCallbacks_.push(opt_successCallback), ee.ApiFunction.initialize(ee.initializationSuccess_, ee.initializationFailure_);
      } else {
        try {
          ee.ApiFunction.initialize(), ee.initializationSuccess_();
        } catch (e) {
          throw ee.initializationFailure_(e), e;
        }
      }
    }
  } else {
    opt_successCallback && opt_successCallback();
  }
};
ee.reset = function() {
  ee.ready_ = ee.InitState.NOT_READY;
  ee.data.reset();
  ee.ApiFunction.reset();
  ee.Date.reset();
  ee.Dictionary.reset();
  ee.Element.reset();
  ee.Image.reset();
  ee.Feature.reset();
  ee.Collection.reset();
  ee.ImageCollection.reset();
  ee.FeatureCollection.reset();
  ee.Filter.reset();
  ee.Geometry.reset();
  ee.List.reset();
  ee.Number.reset();
  ee.String.reset();
  ee.Terrain.reset();
  ee.resetGeneratedClasses_();
  goog.object.clear(ee.Algorithms);
};
ee.InitState = {NOT_READY:"not_ready", LOADING:"loading", READY:"ready"};
goog.exportSymbol("ee.InitState.NOT_READY", ee.InitState.NOT_READY);
goog.exportSymbol("ee.InitState.LOADING", ee.InitState.LOADING);
goog.exportSymbol("ee.InitState.READY", ee.InitState.READY);
ee.ready_ = ee.InitState.NOT_READY;
ee.successCallbacks_ = [];
ee.errorCallbacks_ = [];
ee.TILE_SIZE = 256;
ee.generatedClasses_ = [];
ee.Algorithms = {};
ee.ready = function() {
  return ee.ready_;
};
ee.call = function(func, var_args) {
  goog.isString(func) && (func = new ee.ApiFunction(func));
  var args = Array.prototype.slice.call(arguments, 1);
  return ee.Function.prototype.call.apply(func, args);
};
ee.apply = function(func, namedArgs) {
  goog.isString(func) && (func = new ee.ApiFunction(func));
  return func.apply(namedArgs);
};
ee.initializationSuccess_ = function() {
  if (ee.ready_ == ee.InitState.LOADING) {
    try {
      ee.Date.initialize(), ee.Dictionary.initialize(), ee.Element.initialize(), ee.Image.initialize(), ee.Feature.initialize(), ee.Collection.initialize(), ee.ImageCollection.initialize(), ee.FeatureCollection.initialize(), ee.Filter.initialize(), ee.Geometry.initialize(), ee.List.initialize(), ee.Number.initialize(), ee.String.initialize(), ee.Terrain.initialize(), ee.initializeGeneratedClasses_(), ee.initializeUnboundMethods_();
    } catch (e) {
      ee.initializationFailure_(e);
      return;
    }
    ee.ready_ = ee.InitState.READY;
    for (ee.errorCallbacks_ = []; 0 < ee.successCallbacks_.length;) {
      ee.successCallbacks_.shift()();
    }
  }
};
ee.initializationFailure_ = function(e) {
  if (ee.ready_ == ee.InitState.LOADING) {
    for (ee.ready_ = ee.InitState.NOT_READY, ee.successCallbacks_ = []; 0 < ee.errorCallbacks_.length;) {
      ee.errorCallbacks_.shift()(e);
    }
  }
};
ee.promote_ = function(arg, klass) {
  if (goog.isNull(arg)) {
    return null;
  }
  if (goog.isDef(arg)) {
    var exportedEE = goog.global.ee;
    switch(klass) {
      case "Image":
        return new ee.Image(arg);
      case "Feature":
        return arg instanceof ee.Collection ? ee.ApiFunction._call("Feature", ee.ApiFunction._call("Collection.geometry", arg)) : new ee.Feature(arg);
      case "Element":
        if (arg instanceof ee.Element) {
          return arg;
        }
        if (arg instanceof ee.Geometry) {
          return new ee.Feature(arg);
        }
        if (arg instanceof ee.ComputedObject) {
          return new ee.Element(arg.func, arg.args, arg.varName);
        }
        throw Error("Cannot convert " + arg + " to Element.");
      case "Geometry":
        return arg instanceof ee.FeatureCollection ? ee.ApiFunction._call("Collection.geometry", arg) : new ee.Geometry(arg);
      case "FeatureCollection":
      case "Collection":
        return arg instanceof ee.Collection ? arg : new ee.FeatureCollection(arg);
      case "ImageCollection":
        return new ee.ImageCollection(arg);
      case "Filter":
        return new ee.Filter(arg);
      case "Algorithm":
        if (goog.isString(arg)) {
          return new ee.ApiFunction(arg);
        }
        if (goog.isFunction(arg)) {
          return ee.CustomFunction.create(arg, "Object", goog.array.repeat("Object", arg.length));
        }
        if (arg instanceof ee.Encodable) {
          return arg;
        }
        throw Error("Argument is not a function: " + arg);
      case "String":
        return ee.Types.isString(arg) || arg instanceof ee.String || arg instanceof ee.ComputedObject ? new ee.String(arg) : arg;
      case "Dictionary":
        return ee.Types.isRegularObject(arg) ? arg : new ee.Dictionary(arg);
      case "List":
        return new ee.List(arg);
      case "Number":
      case "Float":
      case "Long":
      case "Integer":
      case "Short":
      case "Byte":
        return new ee.Number(arg);
      default:
        if (klass in exportedEE) {
          var ctor = ee.ApiFunction.lookupInternal(klass);
          if (arg instanceof exportedEE[klass]) {
            return arg;
          }
          if (ctor) {
            return new exportedEE[klass](arg);
          }
          if (goog.isString(arg)) {
            if (arg in exportedEE[klass]) {
              return exportedEE[klass][arg].call();
            }
            throw Error("Unknown algorithm: " + klass + "." + arg);
          }
          return new exportedEE[klass](arg);
        }
        return arg;
    }
  }
};
ee.initializeUnboundMethods_ = function() {
  var unbound = ee.ApiFunction.unboundFunctions();
  goog.object.getKeys(unbound).sort().forEach(function(name) {
    var func = unbound[name], signature = func.getSignature();
    if (!signature.hidden) {
      var nameParts = name.split("."), target = ee.Algorithms;
      for (target.signature = {}; 1 < nameParts.length;) {
        var first = nameParts[0];
        first in target || (target[first] = {signature:{}});
        target = target[first];
        nameParts = goog.array.slice(nameParts, 1);
      }
      var bound = function(var_args) {
        return func.callOrApply(void 0, Array.prototype.slice.call(arguments, 0));
      };
      bound.signature = signature;
      bound.toString = goog.bind(func.toString, func);
      target[nameParts[0]] = bound;
    }
  });
};
ee.initializeGeneratedClasses_ = function() {
  var signatures = ee.ApiFunction.allSignatures(), names = {}, returnTypes = {}, sig;
  for (sig in signatures) {
    var type = -1 != sig.indexOf(".") ? sig.slice(0, sig.indexOf(".")) : sig;
    names[type] = !0;
    var rtype = signatures[sig].returns.replace(/<.*>/, "");
    returnTypes[rtype] = !0;
  }
  var exportedEE = goog.global.ee, name;
  for (name in names) {
    name in returnTypes && !(name in exportedEE) && (exportedEE[name] = ee.makeClass_(name), ee.generatedClasses_.push(name), signatures[name] ? (exportedEE[name].signature = signatures[name], exportedEE[name].signature.isConstructor = !0, ee.ApiFunction.boundSignatures_[name] = !0) : exportedEE[name].signature = {});
  }
  ee.Types.registerClasses(exportedEE);
};
ee.resetGeneratedClasses_ = function() {
  for (var exportedEE = goog.global.ee, i = 0; i < ee.generatedClasses_.length; i++) {
    var name = ee.generatedClasses_[i];
    ee.ApiFunction.clearApi(exportedEE[name]);
    delete exportedEE[name];
  }
  ee.generatedClasses_ = [];
  ee.Types.registerClasses(exportedEE);
};
ee.makeClass_ = function(name) {
  var target = function(var_args) {
    var klass = goog.global.ee[name], args = Array.prototype.slice.call(arguments), onlyOneArg = 1 == args.length;
    if (onlyOneArg && args[0] instanceof klass) {
      return args[0];
    }
    if (!(this instanceof klass)) {
      return ee.ComputedObject.construct(klass, args);
    }
    var ctor = ee.ApiFunction.lookupInternal(name), firstArgIsPrimitive = !(args[0] instanceof ee.ComputedObject), shouldUseConstructor = !1;
    ctor && (onlyOneArg ? firstArgIsPrimitive ? shouldUseConstructor = !0 : args[0].func != ctor && (shouldUseConstructor = !0) : shouldUseConstructor = !0);
    if (shouldUseConstructor) {
      ee.ComputedObject.call(this, ctor, ctor.promoteArgs(ctor.nameArgs(args)));
    } else {
      if (!onlyOneArg) {
        throw Error("Too many arguments for ee." + name + "(): " + args);
      }
      if (firstArgIsPrimitive) {
        throw Error("Invalid argument for ee." + name + "(): " + args + ". Must be a ComputedObject.");
      }
      var theOneArg = args[0];
      ee.ComputedObject.call(this, theOneArg.func, theOneArg.args, theOneArg.varName);
    }
  };
  goog.inherits(target, ee.ComputedObject);
  target.prototype.name = function() {
    return name;
  };
  ee.ApiFunction.importApi(target, name, name);
  return target;
};
ee.Function.registerPromoter(ee.promote_);
ee.FloatTileOverlay = function(url, mapId, token) {
  ee.AbstractOverlay.call(this, url, mapId, token);
  this.tileSize = new google.maps.Size(ee.FloatTileOverlay.TILE_EDGE_LENGTH, ee.FloatTileOverlay.TILE_EDGE_LENGTH);
  this.floatTiles_ = new goog.structs.Map;
  this.floatTileDivs_ = new goog.structs.Map;
};
goog.inherits(ee.FloatTileOverlay, ee.AbstractOverlay);
ee.FloatTileOverlay.prototype.getTile = function(coord, zoom, ownerDocument) {
  var tileId = this.getTileId(coord, zoom), src = [this.url, tileId].join("/") + "?token=" + this.token, uniqueTileId = [tileId, this.tileCounter, this.token].join("/");
  this.tilesLoading.push(uniqueTileId);
  this.tileCounter += 1;
  var div = goog.dom.createDom("DIV"), floatTile = this.loadFloatTile_(src, coord, uniqueTileId, div);
  this.dispatchTileEvent_();
  return div;
};
ee.FloatTileOverlay.TILE_EDGE_LENGTH = 256;
ee.FloatTileOverlay.prototype.loadFloatTile_ = function(tileUrl, coord, tileId, div) {
  var tileRequest = goog.net.XmlHttp();
  tileRequest.open("GET", tileUrl, !0);
  tileRequest.responseType = "arraybuffer";
  tileRequest.onreadystatechange = goog.bind(function() {
    if (tileRequest.readyState === XMLHttpRequest.DONE && 200 === tileRequest.status) {
      var tileResponse = tileRequest.response;
      if (tileResponse) {
        var floatBuffer = new Float32Array(tileResponse);
        this.handleFloatTileLoaded_(floatBuffer, coord, tileId, div);
      } else {
        throw this.tilesFailed.add(tileId), Error("Unable to request floating point array buffers.");
      }
    }
  }, this);
  tileRequest.send();
};
ee.FloatTileOverlay.prototype.handleFloatTileLoaded_ = function(floatTile, coord, tileId, div) {
  this.floatTiles_.set(coord, floatTile);
  this.floatTileDivs_.set(coord, div);
  goog.array.remove(this.tilesLoading, tileId);
  this.dispatchTileEvent_();
};
ee.FloatTileOverlay.prototype.getAllFloatTiles = function() {
  return this.floatTiles_;
};
ee.FloatTileOverlay.prototype.getAllFloatTileDivs = function() {
  return this.floatTileDivs_;
};
ee.FloatTileOverlay.prototype.getLoadedFloatTilesCount = function() {
  return this.floatTiles_.getCount();
};
ee.FloatTileOverlay.prototype.dispatchTileEvent_ = function() {
  this.dispatchEvent(new ee.TileEvent(this.tilesLoading.length));
};
ee.FloatTileOverlay.prototype.disposeInternal = function() {
  this.floatTileDivs_ = this.floatTiles_ = null;
  ee.FloatTileOverlay.superClass_.disposeInternal.call(this);
};
ee.layers = {};
ee.layers.AbstractOverlayStats = function(uniqueId) {
  this.statsByZoom_ = new Map;
  this.uniqueId_ = uniqueId;
};
ee.layers.AbstractOverlayStats.prototype.addTileStats = function(start, end, zoom) {
  this.getStatsForZoom_(zoom).tileLatencies.push(end - start);
};
ee.layers.AbstractOverlayStats.prototype.incrementThrottleCounter = function(zoom) {
  this.getStatsForZoom_(zoom).throttleCount++;
};
ee.layers.AbstractOverlayStats.prototype.incrementErrorCounter = function(zoom) {
  this.getStatsForZoom_(zoom).errorCount++;
};
ee.layers.AbstractOverlayStats.prototype.clear = function() {
  this.statsByZoom_.clear();
};
ee.layers.AbstractOverlayStats.prototype.hasData = function() {
  return 0 < this.statsByZoom_.size;
};
ee.layers.AbstractOverlayStats.prototype.getSummaryList = function() {
  var $jscomp$this = this, summaryList = [];
  this.statsByZoom_.forEach(function(stats, zoom) {
    return summaryList.push({layerId:$jscomp$this.uniqueId_, zoomLevel:zoom, tileLatencies:stats.tileLatencies, throttleCount:stats.throttleCount, errorCount:stats.errorCount});
  });
  return summaryList;
};
ee.layers.AbstractOverlayStats.prototype.getStatsForZoom_ = function(zoom) {
  this.statsByZoom_.has(zoom) || this.statsByZoom_.set(zoom, {throttleCount:0, errorCount:0, tileLatencies:[]});
  return this.statsByZoom_.get(zoom);
};
ee.layers.AbstractOverlayStats.LayerStatsForZoomLevel = function() {
};
ee.layers.AbstractOverlayStats.Summary = function() {
};
goog.events.EventHandler = function(opt_scope) {
  goog.Disposable.call(this);
  this.handler_ = opt_scope;
  this.keys_ = {};
};
goog.inherits(goog.events.EventHandler, goog.Disposable);
goog.events.EventHandler.typeArray_ = [];
goog.events.EventHandler.prototype.listen = function(src, type, opt_fn, opt_options) {
  return this.listen_(src, type, opt_fn, opt_options);
};
goog.events.EventHandler.prototype.listenWithScope = function(src, type, fn, options, scope) {
  return this.listen_(src, type, fn, options, scope);
};
goog.events.EventHandler.prototype.listen_ = function(src, type, opt_fn, opt_options, opt_scope) {
  goog.isArray(type) || (type && (goog.events.EventHandler.typeArray_[0] = type.toString()), type = goog.events.EventHandler.typeArray_);
  for (var i = 0; i < type.length; i++) {
    var listenerObj = goog.events.listen(src, type[i], opt_fn || this.handleEvent, opt_options || !1, opt_scope || this.handler_ || this);
    if (!listenerObj) {
      break;
    }
    this.keys_[listenerObj.key] = listenerObj;
  }
  return this;
};
goog.events.EventHandler.prototype.listenOnce = function(src, type, opt_fn, opt_options) {
  return this.listenOnce_(src, type, opt_fn, opt_options);
};
goog.events.EventHandler.prototype.listenOnceWithScope = function(src, type, fn, capture, scope) {
  return this.listenOnce_(src, type, fn, capture, scope);
};
goog.events.EventHandler.prototype.listenOnce_ = function(src, type, opt_fn, opt_options, opt_scope) {
  if (goog.isArray(type)) {
    for (var i = 0; i < type.length; i++) {
      this.listenOnce_(src, type[i], opt_fn, opt_options, opt_scope);
    }
  } else {
    var listenerObj = goog.events.listenOnce(src, type, opt_fn || this.handleEvent, opt_options, opt_scope || this.handler_ || this);
    if (!listenerObj) {
      return this;
    }
    this.keys_[listenerObj.key] = listenerObj;
  }
  return this;
};
goog.events.EventHandler.prototype.listenWithWrapper = function(src, wrapper, listener, opt_capt) {
  return this.listenWithWrapper_(src, wrapper, listener, opt_capt);
};
goog.events.EventHandler.prototype.listenWithWrapperAndScope = function(src, wrapper, listener, capture, scope) {
  return this.listenWithWrapper_(src, wrapper, listener, capture, scope);
};
goog.events.EventHandler.prototype.listenWithWrapper_ = function(src, wrapper, listener, opt_capt, opt_scope) {
  wrapper.listen(src, listener, opt_capt, opt_scope || this.handler_ || this, this);
  return this;
};
goog.events.EventHandler.prototype.getListenerCount = function() {
  var count = 0, key;
  for (key in this.keys_) {
    Object.prototype.hasOwnProperty.call(this.keys_, key) && count++;
  }
  return count;
};
goog.events.EventHandler.prototype.unlisten = function(src, type, opt_fn, opt_options, opt_scope) {
  if (goog.isArray(type)) {
    for (var i = 0; i < type.length; i++) {
      this.unlisten(src, type[i], opt_fn, opt_options, opt_scope);
    }
  } else {
    var listener = goog.events.getListener(src, type, opt_fn || this.handleEvent, goog.isObject(opt_options) ? !!opt_options.capture : !!opt_options, opt_scope || this.handler_ || this);
    listener && (goog.events.unlistenByKey(listener), delete this.keys_[listener.key]);
  }
  return this;
};
goog.events.EventHandler.prototype.unlistenWithWrapper = function(src, wrapper, listener, opt_capt, opt_scope) {
  wrapper.unlisten(src, listener, opt_capt, opt_scope || this.handler_ || this, this);
  return this;
};
goog.events.EventHandler.prototype.removeAll = function() {
  goog.object.forEach(this.keys_, function(listenerObj, key) {
    this.keys_.hasOwnProperty(key) && goog.events.unlistenByKey(listenerObj);
  }, this);
  this.keys_ = {};
};
goog.events.EventHandler.prototype.disposeInternal = function() {
  goog.events.EventHandler.superClass_.disposeInternal.call(this);
  this.removeAll();
};
goog.events.EventHandler.prototype.handleEvent = function(e) {
  throw Error("EventHandler.handleEvent not implemented");
};
goog.fs.DOMErrorLike = function() {
};
goog.fs.Error = function(error, action) {
  if (goog.isDef(error.name)) {
    this.name = error.name, this.code = goog.fs.Error.getCodeFromName_(error.name);
  } else {
    var code = goog.asserts.assertNumber(error.code);
    this.code = code;
    this.name = goog.fs.Error.getNameFromCode_(code);
  }
  goog.debug.Error.call(this, goog.string.subs("%s %s", this.name, action));
};
goog.inherits(goog.fs.Error, goog.debug.Error);
goog.fs.Error.ErrorName = {ABORT:"AbortError", ENCODING:"EncodingError", INVALID_MODIFICATION:"InvalidModificationError", INVALID_STATE:"InvalidStateError", NOT_FOUND:"NotFoundError", NOT_READABLE:"NotReadableError", NO_MODIFICATION_ALLOWED:"NoModificationAllowedError", PATH_EXISTS:"PathExistsError", QUOTA_EXCEEDED:"QuotaExceededError", SECURITY:"SecurityError", SYNTAX:"SyntaxError", TYPE_MISMATCH:"TypeMismatchError"};
goog.fs.Error.ErrorCode = {NOT_FOUND:1, SECURITY:2, ABORT:3, NOT_READABLE:4, ENCODING:5, NO_MODIFICATION_ALLOWED:6, INVALID_STATE:7, SYNTAX:8, INVALID_MODIFICATION:9, QUOTA_EXCEEDED:10, TYPE_MISMATCH:11, PATH_EXISTS:12};
goog.fs.Error.getNameFromCode_ = function(code) {
  var name = goog.object.findKey(goog.fs.Error.NameToCodeMap_, function(c) {
    return code == c;
  });
  if (!goog.isDef(name)) {
    throw Error("Invalid code: " + code);
  }
  return name;
};
goog.fs.Error.getCodeFromName_ = function(name) {
  return goog.fs.Error.NameToCodeMap_[name];
};
goog.fs.Error.NameToCodeMap_ = goog.object.create(goog.fs.Error.ErrorName.ABORT, goog.fs.Error.ErrorCode.ABORT, goog.fs.Error.ErrorName.ENCODING, goog.fs.Error.ErrorCode.ENCODING, goog.fs.Error.ErrorName.INVALID_MODIFICATION, goog.fs.Error.ErrorCode.INVALID_MODIFICATION, goog.fs.Error.ErrorName.INVALID_STATE, goog.fs.Error.ErrorCode.INVALID_STATE, goog.fs.Error.ErrorName.NOT_FOUND, goog.fs.Error.ErrorCode.NOT_FOUND, goog.fs.Error.ErrorName.NOT_READABLE, goog.fs.Error.ErrorCode.NOT_READABLE, goog.fs.Error.ErrorName.NO_MODIFICATION_ALLOWED, 
goog.fs.Error.ErrorCode.NO_MODIFICATION_ALLOWED, goog.fs.Error.ErrorName.PATH_EXISTS, goog.fs.Error.ErrorCode.PATH_EXISTS, goog.fs.Error.ErrorName.QUOTA_EXCEEDED, goog.fs.Error.ErrorCode.QUOTA_EXCEEDED, goog.fs.Error.ErrorName.SECURITY, goog.fs.Error.ErrorCode.SECURITY, goog.fs.Error.ErrorName.SYNTAX, goog.fs.Error.ErrorCode.SYNTAX, goog.fs.Error.ErrorName.TYPE_MISMATCH, goog.fs.Error.ErrorCode.TYPE_MISMATCH);
goog.fs.ProgressEvent = function(event, target) {
  goog.events.Event.call(this, event.type, target);
  this.event_ = event;
};
goog.inherits(goog.fs.ProgressEvent, goog.events.Event);
goog.fs.ProgressEvent.prototype.isLengthComputable = function() {
  return this.event_.lengthComputable;
};
goog.fs.ProgressEvent.prototype.getLoaded = function() {
  return this.event_.loaded;
};
goog.fs.ProgressEvent.prototype.getTotal = function() {
  return this.event_.total;
};
goog.fs.FileReader = function() {
  goog.events.EventTarget.call(this);
  this.reader_ = new FileReader;
  this.reader_.onloadstart = goog.bind(this.dispatchProgressEvent_, this);
  this.reader_.onprogress = goog.bind(this.dispatchProgressEvent_, this);
  this.reader_.onload = goog.bind(this.dispatchProgressEvent_, this);
  this.reader_.onabort = goog.bind(this.dispatchProgressEvent_, this);
  this.reader_.onerror = goog.bind(this.dispatchProgressEvent_, this);
  this.reader_.onloadend = goog.bind(this.dispatchProgressEvent_, this);
};
goog.inherits(goog.fs.FileReader, goog.events.EventTarget);
goog.fs.FileReader.ReadyState = {INIT:0, LOADING:1, DONE:2};
goog.fs.FileReader.EventType = {LOAD_START:"loadstart", PROGRESS:"progress", LOAD:"load", ABORT:"abort", ERROR:"error", LOAD_END:"loadend"};
goog.fs.FileReader.prototype.abort = function() {
  try {
    this.reader_.abort();
  } catch (e) {
    throw new goog.fs.Error(e, "aborting read");
  }
};
goog.fs.FileReader.prototype.getReadyState = function() {
  return this.reader_.readyState;
};
goog.fs.FileReader.prototype.getResult = function() {
  return this.reader_.result;
};
goog.fs.FileReader.prototype.getError = function() {
  return this.reader_.error && new goog.fs.Error(this.reader_.error, "reading file");
};
goog.fs.FileReader.prototype.dispatchProgressEvent_ = function(event) {
  this.dispatchEvent(new goog.fs.ProgressEvent(event, this));
};
goog.fs.FileReader.prototype.disposeInternal = function() {
  goog.fs.FileReader.superClass_.disposeInternal.call(this);
  delete this.reader_;
};
goog.fs.FileReader.prototype.readAsBinaryString = function(blob) {
  this.reader_.readAsBinaryString(blob);
};
goog.fs.FileReader.readAsBinaryString = function(blob) {
  var reader = new goog.fs.FileReader, d = goog.fs.FileReader.createDeferred_(reader);
  reader.readAsBinaryString(blob);
  return d;
};
goog.fs.FileReader.prototype.readAsArrayBuffer = function(blob) {
  this.reader_.readAsArrayBuffer(blob);
};
goog.fs.FileReader.readAsArrayBuffer = function(blob) {
  var reader = new goog.fs.FileReader, d = goog.fs.FileReader.createDeferred_(reader);
  reader.readAsArrayBuffer(blob);
  return d;
};
goog.fs.FileReader.prototype.readAsText = function(blob, opt_encoding) {
  this.reader_.readAsText(blob, opt_encoding);
};
goog.fs.FileReader.readAsText = function(blob, opt_encoding) {
  var reader = new goog.fs.FileReader, d = goog.fs.FileReader.createDeferred_(reader);
  reader.readAsText(blob, opt_encoding);
  return d;
};
goog.fs.FileReader.prototype.readAsDataUrl = function(blob) {
  this.reader_.readAsDataURL(blob);
};
goog.fs.FileReader.readAsDataUrl = function(blob) {
  var reader = new goog.fs.FileReader, d = goog.fs.FileReader.createDeferred_(reader);
  reader.readAsDataUrl(blob);
  return d;
};
goog.fs.FileReader.createDeferred_ = function(reader) {
  var deferred = new goog.async.Deferred;
  reader.listen(goog.fs.FileReader.EventType.LOAD_END, goog.partial(function(d, r, e) {
    var result = r.getResult(), error = r.getError();
    null == result || error ? d.errback(error) : d.callback(result);
    r.dispose();
  }, deferred, reader));
  return deferred;
};
goog.dom.vendor = {};
goog.dom.vendor.getVendorJsPrefix = function() {
  return goog.userAgent.WEBKIT ? "Webkit" : goog.userAgent.GECKO ? "Moz" : goog.userAgent.IE ? "ms" : goog.userAgent.OPERA ? "O" : null;
};
goog.dom.vendor.getVendorPrefix = function() {
  return goog.userAgent.WEBKIT ? "-webkit" : goog.userAgent.GECKO ? "-moz" : goog.userAgent.IE ? "-ms" : goog.userAgent.OPERA ? "-o" : null;
};
goog.dom.vendor.getPrefixedPropertyName = function(propertyName, opt_object) {
  if (opt_object && propertyName in opt_object) {
    return propertyName;
  }
  var prefix = goog.dom.vendor.getVendorJsPrefix();
  if (prefix) {
    prefix = prefix.toLowerCase();
    var prefixedPropertyName = prefix + goog.string.toTitleCase(propertyName);
    return !goog.isDef(opt_object) || prefixedPropertyName in opt_object ? prefixedPropertyName : null;
  }
  return null;
};
goog.dom.vendor.getPrefixedEventType = function(eventType) {
  return ((goog.dom.vendor.getVendorJsPrefix() || "") + eventType).toLowerCase();
};
goog.math.Box = function(top, right, bottom, left) {
  this.top = top;
  this.right = right;
  this.bottom = bottom;
  this.left = left;
};
goog.math.Box.boundingBox = function(var_args) {
  for (var box = new goog.math.Box(arguments[0].y, arguments[0].x, arguments[0].y, arguments[0].x), i = 1; i < arguments.length; i++) {
    box.expandToIncludeCoordinate(arguments[i]);
  }
  return box;
};
goog.math.Box.prototype.getWidth = function() {
  return this.right - this.left;
};
goog.math.Box.prototype.getHeight = function() {
  return this.bottom - this.top;
};
goog.math.Box.prototype.clone = function() {
  return new goog.math.Box(this.top, this.right, this.bottom, this.left);
};
goog.DEBUG && (goog.math.Box.prototype.toString = function() {
  return "(" + this.top + "t, " + this.right + "r, " + this.bottom + "b, " + this.left + "l)";
});
goog.math.Box.prototype.contains = function(other) {
  return goog.math.Box.contains(this, other);
};
goog.math.Box.prototype.expand = function(top, opt_right, opt_bottom, opt_left) {
  goog.isObject(top) ? (this.top -= top.top, this.right += top.right, this.bottom += top.bottom, this.left -= top.left) : (this.top -= top, this.right += Number(opt_right), this.bottom += Number(opt_bottom), this.left -= Number(opt_left));
  return this;
};
goog.math.Box.prototype.expandToInclude = function(box) {
  this.left = Math.min(this.left, box.left);
  this.top = Math.min(this.top, box.top);
  this.right = Math.max(this.right, box.right);
  this.bottom = Math.max(this.bottom, box.bottom);
};
goog.math.Box.prototype.expandToIncludeCoordinate = function(coord) {
  this.top = Math.min(this.top, coord.y);
  this.right = Math.max(this.right, coord.x);
  this.bottom = Math.max(this.bottom, coord.y);
  this.left = Math.min(this.left, coord.x);
};
goog.math.Box.equals = function(a, b) {
  return a == b ? !0 : a && b ? a.top == b.top && a.right == b.right && a.bottom == b.bottom && a.left == b.left : !1;
};
goog.math.Box.contains = function(box, other) {
  return box && other ? other instanceof goog.math.Box ? other.left >= box.left && other.right <= box.right && other.top >= box.top && other.bottom <= box.bottom : other.x >= box.left && other.x <= box.right && other.y >= box.top && other.y <= box.bottom : !1;
};
goog.math.Box.relativePositionX = function(box, coord) {
  return coord.x < box.left ? coord.x - box.left : coord.x > box.right ? coord.x - box.right : 0;
};
goog.math.Box.relativePositionY = function(box, coord) {
  return coord.y < box.top ? coord.y - box.top : coord.y > box.bottom ? coord.y - box.bottom : 0;
};
goog.math.Box.distance = function(box, coord) {
  var x = goog.math.Box.relativePositionX(box, coord), y = goog.math.Box.relativePositionY(box, coord);
  return Math.sqrt(x * x + y * y);
};
goog.math.Box.intersects = function(a, b) {
  return a.left <= b.right && b.left <= a.right && a.top <= b.bottom && b.top <= a.bottom;
};
goog.math.Box.intersectsWithPadding = function(a, b, padding) {
  return a.left <= b.right + padding && b.left <= a.right + padding && a.top <= b.bottom + padding && b.top <= a.bottom + padding;
};
goog.math.Box.prototype.ceil = function() {
  this.top = Math.ceil(this.top);
  this.right = Math.ceil(this.right);
  this.bottom = Math.ceil(this.bottom);
  this.left = Math.ceil(this.left);
  return this;
};
goog.math.Box.prototype.floor = function() {
  this.top = Math.floor(this.top);
  this.right = Math.floor(this.right);
  this.bottom = Math.floor(this.bottom);
  this.left = Math.floor(this.left);
  return this;
};
goog.math.Box.prototype.round = function() {
  this.top = Math.round(this.top);
  this.right = Math.round(this.right);
  this.bottom = Math.round(this.bottom);
  this.left = Math.round(this.left);
  return this;
};
goog.math.Box.prototype.translate = function(tx, opt_ty) {
  tx instanceof goog.math.Coordinate ? (this.left += tx.x, this.right += tx.x, this.top += tx.y, this.bottom += tx.y) : (goog.asserts.assertNumber(tx), this.left += tx, this.right += tx, goog.isNumber(opt_ty) && (this.top += opt_ty, this.bottom += opt_ty));
  return this;
};
goog.math.Box.prototype.scale = function(sx, opt_sy) {
  var sy = goog.isNumber(opt_sy) ? opt_sy : sx;
  this.left *= sx;
  this.right *= sx;
  this.top *= sy;
  this.bottom *= sy;
  return this;
};
goog.math.IRect = function() {
};
goog.math.Rect = function(x, y, w, h) {
  this.left = x;
  this.top = y;
  this.width = w;
  this.height = h;
};
goog.math.Rect.prototype.clone = function() {
  return new goog.math.Rect(this.left, this.top, this.width, this.height);
};
goog.math.Rect.prototype.toBox = function() {
  return new goog.math.Box(this.top, this.left + this.width, this.top + this.height, this.left);
};
goog.math.Rect.createFromPositionAndSize = function(position, size) {
  return new goog.math.Rect(position.x, position.y, size.width, size.height);
};
goog.math.Rect.createFromBox = function(box) {
  return new goog.math.Rect(box.left, box.top, box.right - box.left, box.bottom - box.top);
};
goog.DEBUG && (goog.math.Rect.prototype.toString = function() {
  return "(" + this.left + ", " + this.top + " - " + this.width + "w x " + this.height + "h)";
});
goog.math.Rect.equals = function(a, b) {
  return a == b ? !0 : a && b ? a.left == b.left && a.width == b.width && a.top == b.top && a.height == b.height : !1;
};
goog.math.Rect.prototype.intersection = function(rect) {
  var x0 = Math.max(this.left, rect.left), x1 = Math.min(this.left + this.width, rect.left + rect.width);
  if (x0 <= x1) {
    var y0 = Math.max(this.top, rect.top), y1 = Math.min(this.top + this.height, rect.top + rect.height);
    if (y0 <= y1) {
      return this.left = x0, this.top = y0, this.width = x1 - x0, this.height = y1 - y0, !0;
    }
  }
  return !1;
};
goog.math.Rect.intersection = function(a, b) {
  var x0 = Math.max(a.left, b.left), x1 = Math.min(a.left + a.width, b.left + b.width);
  if (x0 <= x1) {
    var y0 = Math.max(a.top, b.top), y1 = Math.min(a.top + a.height, b.top + b.height);
    if (y0 <= y1) {
      return new goog.math.Rect(x0, y0, x1 - x0, y1 - y0);
    }
  }
  return null;
};
goog.math.Rect.intersects = function(a, b) {
  return a.left <= b.left + b.width && b.left <= a.left + a.width && a.top <= b.top + b.height && b.top <= a.top + a.height;
};
goog.math.Rect.prototype.intersects = function(rect) {
  return goog.math.Rect.intersects(this, rect);
};
goog.math.Rect.difference = function(a, b) {
  var intersection = goog.math.Rect.intersection(a, b);
  if (!intersection || !intersection.height || !intersection.width) {
    return [a.clone()];
  }
  var result = [], top = a.top, height = a.height, ar = a.left + a.width, ab = a.top + a.height, br = b.left + b.width, bb = b.top + b.height;
  b.top > a.top && (result.push(new goog.math.Rect(a.left, a.top, a.width, b.top - a.top)), top = b.top, height -= b.top - a.top);
  bb < ab && (result.push(new goog.math.Rect(a.left, bb, a.width, ab - bb)), height = bb - top);
  b.left > a.left && result.push(new goog.math.Rect(a.left, top, b.left - a.left, height));
  br < ar && result.push(new goog.math.Rect(br, top, ar - br, height));
  return result;
};
goog.math.Rect.prototype.difference = function(rect) {
  return goog.math.Rect.difference(this, rect);
};
goog.math.Rect.prototype.boundingRect = function(rect) {
  var right = Math.max(this.left + this.width, rect.left + rect.width), bottom = Math.max(this.top + this.height, rect.top + rect.height);
  this.left = Math.min(this.left, rect.left);
  this.top = Math.min(this.top, rect.top);
  this.width = right - this.left;
  this.height = bottom - this.top;
};
goog.math.Rect.boundingRect = function(a, b) {
  if (!a || !b) {
    return null;
  }
  var newRect = new goog.math.Rect(a.left, a.top, a.width, a.height);
  newRect.boundingRect(b);
  return newRect;
};
goog.math.Rect.prototype.contains = function(another) {
  return another instanceof goog.math.Coordinate ? another.x >= this.left && another.x <= this.left + this.width && another.y >= this.top && another.y <= this.top + this.height : this.left <= another.left && this.left + this.width >= another.left + another.width && this.top <= another.top && this.top + this.height >= another.top + another.height;
};
goog.math.Rect.prototype.squaredDistance = function(point) {
  var dx = point.x < this.left ? this.left - point.x : Math.max(point.x - (this.left + this.width), 0), dy = point.y < this.top ? this.top - point.y : Math.max(point.y - (this.top + this.height), 0);
  return dx * dx + dy * dy;
};
goog.math.Rect.prototype.distance = function(point) {
  return Math.sqrt(this.squaredDistance(point));
};
goog.math.Rect.prototype.getSize = function() {
  return new goog.math.Size(this.width, this.height);
};
goog.math.Rect.prototype.getTopLeft = function() {
  return new goog.math.Coordinate(this.left, this.top);
};
goog.math.Rect.prototype.getCenter = function() {
  return new goog.math.Coordinate(this.left + this.width / 2, this.top + this.height / 2);
};
goog.math.Rect.prototype.getBottomRight = function() {
  return new goog.math.Coordinate(this.left + this.width, this.top + this.height);
};
goog.math.Rect.prototype.ceil = function() {
  this.left = Math.ceil(this.left);
  this.top = Math.ceil(this.top);
  this.width = Math.ceil(this.width);
  this.height = Math.ceil(this.height);
  return this;
};
goog.math.Rect.prototype.floor = function() {
  this.left = Math.floor(this.left);
  this.top = Math.floor(this.top);
  this.width = Math.floor(this.width);
  this.height = Math.floor(this.height);
  return this;
};
goog.math.Rect.prototype.round = function() {
  this.left = Math.round(this.left);
  this.top = Math.round(this.top);
  this.width = Math.round(this.width);
  this.height = Math.round(this.height);
  return this;
};
goog.math.Rect.prototype.translate = function(tx, opt_ty) {
  tx instanceof goog.math.Coordinate ? (this.left += tx.x, this.top += tx.y) : (this.left += goog.asserts.assertNumber(tx), goog.isNumber(opt_ty) && (this.top += opt_ty));
  return this;
};
goog.math.Rect.prototype.scale = function(sx, opt_sy) {
  var sy = goog.isNumber(opt_sy) ? opt_sy : sx;
  this.left *= sx;
  this.width *= sx;
  this.top *= sy;
  this.height *= sy;
  return this;
};
goog.style = {};
goog.style.setStyle = function(element, style, opt_value) {
  if (goog.isString(style)) {
    goog.style.setStyle_(element, opt_value, style);
  } else {
    for (var key in style) {
      goog.style.setStyle_(element, style[key], key);
    }
  }
};
goog.style.setStyle_ = function(element, value, style) {
  var propertyName = goog.style.getVendorJsStyleName_(element, style);
  propertyName && (element.style[propertyName] = value);
};
goog.style.styleNameCache_ = {};
goog.style.getVendorJsStyleName_ = function(element, style) {
  var propertyName = goog.style.styleNameCache_[style];
  if (!propertyName) {
    var camelStyle = goog.string.toCamelCase(style);
    propertyName = camelStyle;
    if (void 0 === element.style[camelStyle]) {
      var prefixedStyle = goog.dom.vendor.getVendorJsPrefix() + goog.string.toTitleCase(camelStyle);
      void 0 !== element.style[prefixedStyle] && (propertyName = prefixedStyle);
    }
    goog.style.styleNameCache_[style] = propertyName;
  }
  return propertyName;
};
goog.style.getVendorStyleName_ = function(element, style) {
  var camelStyle = goog.string.toCamelCase(style);
  if (void 0 === element.style[camelStyle]) {
    var prefixedStyle = goog.dom.vendor.getVendorJsPrefix() + goog.string.toTitleCase(camelStyle);
    if (void 0 !== element.style[prefixedStyle]) {
      return goog.dom.vendor.getVendorPrefix() + "-" + style;
    }
  }
  return style;
};
goog.style.getStyle = function(element, property) {
  var styleValue = element.style[goog.string.toCamelCase(property)];
  return "undefined" !== typeof styleValue ? styleValue : element.style[goog.style.getVendorJsStyleName_(element, property)] || "";
};
goog.style.getComputedStyle = function(element, property) {
  var doc = goog.dom.getOwnerDocument(element);
  if (doc.defaultView && doc.defaultView.getComputedStyle) {
    var styles = doc.defaultView.getComputedStyle(element, null);
    if (styles) {
      return styles[property] || styles.getPropertyValue(property) || "";
    }
  }
  return "";
};
goog.style.getCascadedStyle = function(element, style) {
  return element.currentStyle ? element.currentStyle[style] : null;
};
goog.style.getStyle_ = function(element, style) {
  return goog.style.getComputedStyle(element, style) || goog.style.getCascadedStyle(element, style) || element.style && element.style[style];
};
goog.style.getComputedBoxSizing = function(element) {
  return goog.style.getStyle_(element, "boxSizing") || goog.style.getStyle_(element, "MozBoxSizing") || goog.style.getStyle_(element, "WebkitBoxSizing") || null;
};
goog.style.getComputedPosition = function(element) {
  return goog.style.getStyle_(element, "position");
};
goog.style.getBackgroundColor = function(element) {
  return goog.style.getStyle_(element, "backgroundColor");
};
goog.style.getComputedOverflowX = function(element) {
  return goog.style.getStyle_(element, "overflowX");
};
goog.style.getComputedOverflowY = function(element) {
  return goog.style.getStyle_(element, "overflowY");
};
goog.style.getComputedZIndex = function(element) {
  return goog.style.getStyle_(element, "zIndex");
};
goog.style.getComputedTextAlign = function(element) {
  return goog.style.getStyle_(element, "textAlign");
};
goog.style.getComputedCursor = function(element) {
  return goog.style.getStyle_(element, "cursor");
};
goog.style.getComputedTransform = function(element) {
  var property = goog.style.getVendorStyleName_(element, "transform");
  return goog.style.getStyle_(element, property) || goog.style.getStyle_(element, "transform");
};
goog.style.setPosition = function(el, arg1, opt_arg2) {
  if (arg1 instanceof goog.math.Coordinate) {
    var x = arg1.x;
    var y = arg1.y;
  } else {
    x = arg1, y = opt_arg2;
  }
  el.style.left = goog.style.getPixelStyleValue_(x, !1);
  el.style.top = goog.style.getPixelStyleValue_(y, !1);
};
goog.style.getPosition = function(element) {
  return new goog.math.Coordinate(element.offsetLeft, element.offsetTop);
};
goog.style.getClientViewportElement = function(opt_node) {
  var doc = opt_node ? goog.dom.getOwnerDocument(opt_node) : goog.dom.getDocument();
  return !goog.userAgent.IE || goog.userAgent.isDocumentModeOrHigher(9) || goog.dom.getDomHelper(doc).isCss1CompatMode() ? doc.documentElement : doc.body;
};
goog.style.getViewportPageOffset = function(doc) {
  var body = doc.body, documentElement = doc.documentElement;
  return new goog.math.Coordinate(body.scrollLeft || documentElement.scrollLeft, body.scrollTop || documentElement.scrollTop);
};
goog.style.getBoundingClientRect_ = function(el) {
  try {
    var rect = el.getBoundingClientRect();
  } catch (e) {
    return {left:0, top:0, right:0, bottom:0};
  }
  if (goog.userAgent.IE && el.ownerDocument.body) {
    var doc = el.ownerDocument;
    rect.left -= doc.documentElement.clientLeft + doc.body.clientLeft;
    rect.top -= doc.documentElement.clientTop + doc.body.clientTop;
  }
  return rect;
};
goog.style.getOffsetParent = function(element) {
  if (goog.userAgent.IE && !goog.userAgent.isDocumentModeOrHigher(8)) {
    return goog.asserts.assert(element && "offsetParent" in element), element.offsetParent;
  }
  for (var doc = goog.dom.getOwnerDocument(element), positionStyle = goog.style.getStyle_(element, "position"), skipStatic = "fixed" == positionStyle || "absolute" == positionStyle, parent = element.parentNode; parent && parent != doc; parent = parent.parentNode) {
    if (parent.nodeType == goog.dom.NodeType.DOCUMENT_FRAGMENT && parent.host && (parent = parent.host), positionStyle = goog.style.getStyle_(parent, "position"), skipStatic = skipStatic && "static" == positionStyle && parent != doc.documentElement && parent != doc.body, !skipStatic && (parent.scrollWidth > parent.clientWidth || parent.scrollHeight > parent.clientHeight || "fixed" == positionStyle || "absolute" == positionStyle || "relative" == positionStyle)) {
      return parent;
    }
  }
  return null;
};
goog.style.getVisibleRectForElement = function(element) {
  for (var visibleRect = new goog.math.Box(0, Infinity, Infinity, 0), dom = goog.dom.getDomHelper(element), body = dom.getDocument().body, documentElement = dom.getDocument().documentElement, scrollEl = dom.getDocumentScrollElement(), el = element; el = goog.style.getOffsetParent(el);) {
    if (!(goog.userAgent.IE && 0 == el.clientWidth || goog.userAgent.WEBKIT && 0 == el.clientHeight && el == body) && el != body && el != documentElement && "visible" != goog.style.getStyle_(el, "overflow")) {
      var pos = goog.style.getPageOffset(el), client = goog.style.getClientLeftTop(el);
      pos.x += client.x;
      pos.y += client.y;
      visibleRect.top = Math.max(visibleRect.top, pos.y);
      visibleRect.right = Math.min(visibleRect.right, pos.x + el.clientWidth);
      visibleRect.bottom = Math.min(visibleRect.bottom, pos.y + el.clientHeight);
      visibleRect.left = Math.max(visibleRect.left, pos.x);
    }
  }
  var scrollX = scrollEl.scrollLeft, scrollY = scrollEl.scrollTop;
  visibleRect.left = Math.max(visibleRect.left, scrollX);
  visibleRect.top = Math.max(visibleRect.top, scrollY);
  var winSize = dom.getViewportSize();
  visibleRect.right = Math.min(visibleRect.right, scrollX + winSize.width);
  visibleRect.bottom = Math.min(visibleRect.bottom, scrollY + winSize.height);
  return 0 <= visibleRect.top && 0 <= visibleRect.left && visibleRect.bottom > visibleRect.top && visibleRect.right > visibleRect.left ? visibleRect : null;
};
goog.style.getContainerOffsetToScrollInto = function(element, opt_container, opt_center) {
  var container = opt_container || goog.dom.getDocumentScrollElement(), elementPos = goog.style.getPageOffset(element), containerPos = goog.style.getPageOffset(container), containerBorder = goog.style.getBorderBox(container);
  if (container == goog.dom.getDocumentScrollElement()) {
    var relX = elementPos.x - container.scrollLeft, relY = elementPos.y - container.scrollTop;
    goog.userAgent.IE && !goog.userAgent.isDocumentModeOrHigher(10) && (relX += containerBorder.left, relY += containerBorder.top);
  } else {
    relX = elementPos.x - containerPos.x - containerBorder.left, relY = elementPos.y - containerPos.y - containerBorder.top;
  }
  var elementSize = goog.style.getSizeWithDisplay_(element), spaceX = container.clientWidth - elementSize.width, spaceY = container.clientHeight - elementSize.height, scrollLeft = container.scrollLeft, scrollTop = container.scrollTop;
  opt_center ? (scrollLeft += relX - spaceX / 2, scrollTop += relY - spaceY / 2) : (scrollLeft += Math.min(relX, Math.max(relX - spaceX, 0)), scrollTop += Math.min(relY, Math.max(relY - spaceY, 0)));
  return new goog.math.Coordinate(scrollLeft, scrollTop);
};
goog.style.scrollIntoContainerView = function(element, opt_container, opt_center) {
  var container = opt_container || goog.dom.getDocumentScrollElement(), offset = goog.style.getContainerOffsetToScrollInto(element, container, opt_center);
  container.scrollLeft = offset.x;
  container.scrollTop = offset.y;
};
goog.style.getClientLeftTop = function(el) {
  return new goog.math.Coordinate(el.clientLeft, el.clientTop);
};
goog.style.getPageOffset = function(el) {
  var doc = goog.dom.getOwnerDocument(el);
  goog.asserts.assertObject(el, "Parameter is required");
  var pos = new goog.math.Coordinate(0, 0), viewportElement = goog.style.getClientViewportElement(doc);
  if (el == viewportElement) {
    return pos;
  }
  var box = goog.style.getBoundingClientRect_(el), scrollCoord = goog.dom.getDomHelper(doc).getDocumentScroll();
  pos.x = box.left + scrollCoord.x;
  pos.y = box.top + scrollCoord.y;
  return pos;
};
goog.style.getPageOffsetLeft = function(el) {
  return goog.style.getPageOffset(el).x;
};
goog.style.getPageOffsetTop = function(el) {
  return goog.style.getPageOffset(el).y;
};
goog.style.getFramedPageOffset = function(el, relativeWin) {
  var position = new goog.math.Coordinate(0, 0), currentWin = goog.dom.getWindow(goog.dom.getOwnerDocument(el));
  if (!goog.reflect.canAccessProperty(currentWin, "parent")) {
    return position;
  }
  var currentEl = el;
  do {
    var offset = currentWin == relativeWin ? goog.style.getPageOffset(currentEl) : goog.style.getClientPositionForElement_(goog.asserts.assert(currentEl));
    position.x += offset.x;
    position.y += offset.y;
  } while (currentWin && currentWin != relativeWin && currentWin != currentWin.parent && (currentEl = currentWin.frameElement) && (currentWin = currentWin.parent));
  return position;
};
goog.style.translateRectForAnotherFrame = function(rect, origBase, newBase) {
  if (origBase.getDocument() != newBase.getDocument()) {
    var body = origBase.getDocument().body, pos = goog.style.getFramedPageOffset(body, newBase.getWindow());
    pos = goog.math.Coordinate.difference(pos, goog.style.getPageOffset(body));
    !goog.userAgent.IE || goog.userAgent.isDocumentModeOrHigher(9) || origBase.isCss1CompatMode() || (pos = goog.math.Coordinate.difference(pos, origBase.getDocumentScroll()));
    rect.left += pos.x;
    rect.top += pos.y;
  }
};
goog.style.getRelativePosition = function(a, b) {
  var ap = goog.style.getClientPosition(a), bp = goog.style.getClientPosition(b);
  return new goog.math.Coordinate(ap.x - bp.x, ap.y - bp.y);
};
goog.style.getClientPositionForElement_ = function(el) {
  var box = goog.style.getBoundingClientRect_(el);
  return new goog.math.Coordinate(box.left, box.top);
};
goog.style.getClientPosition = function(el) {
  goog.asserts.assert(el);
  if (el.nodeType == goog.dom.NodeType.ELEMENT) {
    return goog.style.getClientPositionForElement_(el);
  }
  var targetEvent = el.changedTouches ? el.changedTouches[0] : el;
  return new goog.math.Coordinate(targetEvent.clientX, targetEvent.clientY);
};
goog.style.setPageOffset = function(el, x, opt_y) {
  var cur = goog.style.getPageOffset(el);
  x instanceof goog.math.Coordinate && (opt_y = x.y, x = x.x);
  var dx = goog.asserts.assertNumber(x) - cur.x;
  goog.style.setPosition(el, el.offsetLeft + dx, el.offsetTop + (Number(opt_y) - cur.y));
};
goog.style.setSize = function(element, w, opt_h) {
  if (w instanceof goog.math.Size) {
    var h = w.height;
    w = w.width;
  } else {
    if (void 0 == opt_h) {
      throw Error("missing height argument");
    }
    h = opt_h;
  }
  goog.style.setWidth(element, w);
  goog.style.setHeight(element, h);
};
goog.style.getPixelStyleValue_ = function(value, round) {
  "number" == typeof value && (value = (round ? Math.round(value) : value) + "px");
  return value;
};
goog.style.setHeight = function(element, height) {
  element.style.height = goog.style.getPixelStyleValue_(height, !0);
};
goog.style.setWidth = function(element, width) {
  element.style.width = goog.style.getPixelStyleValue_(width, !0);
};
goog.style.getSize = function(element) {
  return goog.style.evaluateWithTemporaryDisplay_(goog.style.getSizeWithDisplay_, element);
};
goog.style.evaluateWithTemporaryDisplay_ = function(fn, element) {
  if ("none" != goog.style.getStyle_(element, "display")) {
    return fn(element);
  }
  var style = element.style, originalDisplay = style.display, originalVisibility = style.visibility, originalPosition = style.position;
  style.visibility = "hidden";
  style.position = "absolute";
  style.display = "inline";
  var retVal = fn(element);
  style.display = originalDisplay;
  style.position = originalPosition;
  style.visibility = originalVisibility;
  return retVal;
};
goog.style.getSizeWithDisplay_ = function(element) {
  var offsetWidth = element.offsetWidth, offsetHeight = element.offsetHeight, webkitOffsetsZero = goog.userAgent.WEBKIT && !offsetWidth && !offsetHeight;
  if ((!goog.isDef(offsetWidth) || webkitOffsetsZero) && element.getBoundingClientRect) {
    var clientRect = goog.style.getBoundingClientRect_(element);
    return new goog.math.Size(clientRect.right - clientRect.left, clientRect.bottom - clientRect.top);
  }
  return new goog.math.Size(offsetWidth, offsetHeight);
};
goog.style.getTransformedSize = function(element) {
  if (!element.getBoundingClientRect) {
    return null;
  }
  var clientRect = goog.style.evaluateWithTemporaryDisplay_(goog.style.getBoundingClientRect_, element);
  return new goog.math.Size(clientRect.right - clientRect.left, clientRect.bottom - clientRect.top);
};
goog.style.getBounds = function(element) {
  var o = goog.style.getPageOffset(element), s = goog.style.getSize(element);
  return new goog.math.Rect(o.x, o.y, s.width, s.height);
};
goog.style.toCamelCase = function(selector) {
  return goog.string.toCamelCase(String(selector));
};
goog.style.toSelectorCase = function(selector) {
  return goog.string.toSelectorCase(selector);
};
goog.style.getOpacity = function(el) {
  goog.asserts.assert(el);
  var style = el.style, result = "";
  if ("opacity" in style) {
    result = style.opacity;
  } else {
    if ("MozOpacity" in style) {
      result = style.MozOpacity;
    } else {
      if ("filter" in style) {
        var match = style.filter.match(/alpha\(opacity=([\d.]+)\)/);
        match && (result = String(match[1] / 100));
      }
    }
  }
  return "" == result ? result : Number(result);
};
goog.style.setOpacity = function(el, alpha) {
  goog.asserts.assert(el);
  var style = el.style;
  "opacity" in style ? style.opacity = alpha : "MozOpacity" in style ? style.MozOpacity = alpha : "filter" in style && (style.filter = "" === alpha ? "" : "alpha(opacity=" + 100 * Number(alpha) + ")");
};
goog.style.setTransparentBackgroundImage = function(el, src) {
  var style = el.style;
  goog.userAgent.IE && !goog.userAgent.isVersionOrHigher("8") ? style.filter = 'progid:DXImageTransform.Microsoft.AlphaImageLoader(src="' + src + '", sizingMethod="crop")' : (style.backgroundImage = "url(" + src + ")", style.backgroundPosition = "top left", style.backgroundRepeat = "no-repeat");
};
goog.style.clearTransparentBackgroundImage = function(el) {
  var style = el.style;
  "filter" in style ? style.filter = "" : style.backgroundImage = "none";
};
goog.style.showElement = function(el, display) {
  goog.style.setElementShown(el, display);
};
goog.style.setElementShown = function(el, isShown) {
  el.style.display = isShown ? "" : "none";
};
goog.style.isElementShown = function(el) {
  return "none" != el.style.display;
};
goog.style.installSafeStyleSheet = function(safeStyleSheet, opt_node) {
  var dh = goog.dom.getDomHelper(opt_node), doc = dh.getDocument();
  if (goog.userAgent.IE && doc.createStyleSheet) {
    var styleSheet = doc.createStyleSheet();
    goog.style.setSafeStyleSheet(styleSheet, safeStyleSheet);
    return styleSheet;
  }
  var head = dh.getElementsByTagNameAndClass("HEAD")[0];
  if (!head) {
    var body = dh.getElementsByTagNameAndClass("BODY")[0];
    head = dh.createDom("HEAD");
    body.parentNode.insertBefore(head, body);
  }
  var el = dh.createDom("STYLE");
  goog.style.setSafeStyleSheet(el, safeStyleSheet);
  dh.appendChild(head, el);
  return el;
};
goog.style.uninstallStyles = function(styleSheet) {
  goog.dom.removeNode(styleSheet.ownerNode || styleSheet.owningElement || styleSheet);
};
goog.style.setSafeStyleSheet = function(element, safeStyleSheet) {
  var stylesString = goog.html.SafeStyleSheet.unwrap(safeStyleSheet);
  goog.userAgent.IE && goog.isDef(element.cssText) ? element.cssText = stylesString : element.innerHTML = stylesString;
};
goog.style.setPreWrap = function(el) {
  var style = el.style;
  goog.userAgent.IE && !goog.userAgent.isVersionOrHigher("8") ? (style.whiteSpace = "pre", style.wordWrap = "break-word") : style.whiteSpace = goog.userAgent.GECKO ? "-moz-pre-wrap" : "pre-wrap";
};
goog.style.setInlineBlock = function(el) {
  var style = el.style;
  style.position = "relative";
  goog.userAgent.IE && !goog.userAgent.isVersionOrHigher("8") ? (style.zoom = "1", style.display = "inline") : style.display = "inline-block";
};
goog.style.isRightToLeft = function(el) {
  return "rtl" == goog.style.getStyle_(el, "direction");
};
goog.style.unselectableStyle_ = goog.userAgent.GECKO ? "MozUserSelect" : goog.userAgent.WEBKIT || goog.userAgent.EDGE ? "WebkitUserSelect" : null;
goog.style.isUnselectable = function(el) {
  return goog.style.unselectableStyle_ ? "none" == el.style[goog.style.unselectableStyle_].toLowerCase() : goog.userAgent.IE || goog.userAgent.OPERA ? "on" == el.getAttribute("unselectable") : !1;
};
goog.style.setUnselectable = function(el, unselectable, opt_noRecurse) {
  var descendants = opt_noRecurse ? null : el.getElementsByTagName("*"), name = goog.style.unselectableStyle_;
  if (name) {
    var value = unselectable ? "none" : "";
    el.style && (el.style[name] = value);
    if (descendants) {
      for (var i = 0, descendant; descendant = descendants[i]; i++) {
        descendant.style && (descendant.style[name] = value);
      }
    }
  } else {
    if (goog.userAgent.IE || goog.userAgent.OPERA) {
      if (value = unselectable ? "on" : "", el.setAttribute("unselectable", value), descendants) {
        for (i = 0; descendant = descendants[i]; i++) {
          descendant.setAttribute("unselectable", value);
        }
      }
    }
  }
};
goog.style.getBorderBoxSize = function(element) {
  return new goog.math.Size(element.offsetWidth, element.offsetHeight);
};
goog.style.setBorderBoxSize = function(element, size) {
  var doc = goog.dom.getOwnerDocument(element), isCss1CompatMode = goog.dom.getDomHelper(doc).isCss1CompatMode();
  if (!goog.userAgent.IE || goog.userAgent.isVersionOrHigher("10") || isCss1CompatMode && goog.userAgent.isVersionOrHigher("8")) {
    goog.style.setBoxSizingSize_(element, size, "border-box");
  } else {
    var style = element.style;
    if (isCss1CompatMode) {
      var paddingBox = goog.style.getPaddingBox(element), borderBox = goog.style.getBorderBox(element);
      style.pixelWidth = size.width - borderBox.left - paddingBox.left - paddingBox.right - borderBox.right;
      style.pixelHeight = size.height - borderBox.top - paddingBox.top - paddingBox.bottom - borderBox.bottom;
    } else {
      style.pixelWidth = size.width, style.pixelHeight = size.height;
    }
  }
};
goog.style.getContentBoxSize = function(element) {
  var doc = goog.dom.getOwnerDocument(element), ieCurrentStyle = goog.userAgent.IE && element.currentStyle;
  if (ieCurrentStyle && goog.dom.getDomHelper(doc).isCss1CompatMode() && "auto" != ieCurrentStyle.width && "auto" != ieCurrentStyle.height && !ieCurrentStyle.boxSizing) {
    var width = goog.style.getIePixelValue_(element, ieCurrentStyle.width, "width", "pixelWidth"), height = goog.style.getIePixelValue_(element, ieCurrentStyle.height, "height", "pixelHeight");
    return new goog.math.Size(width, height);
  }
  var borderBoxSize = goog.style.getBorderBoxSize(element), paddingBox = goog.style.getPaddingBox(element), borderBox = goog.style.getBorderBox(element);
  return new goog.math.Size(borderBoxSize.width - borderBox.left - paddingBox.left - paddingBox.right - borderBox.right, borderBoxSize.height - borderBox.top - paddingBox.top - paddingBox.bottom - borderBox.bottom);
};
goog.style.setContentBoxSize = function(element, size) {
  var doc = goog.dom.getOwnerDocument(element), isCss1CompatMode = goog.dom.getDomHelper(doc).isCss1CompatMode();
  if (!goog.userAgent.IE || goog.userAgent.isVersionOrHigher("10") || isCss1CompatMode && goog.userAgent.isVersionOrHigher("8")) {
    goog.style.setBoxSizingSize_(element, size, "content-box");
  } else {
    var style = element.style;
    if (isCss1CompatMode) {
      style.pixelWidth = size.width, style.pixelHeight = size.height;
    } else {
      var paddingBox = goog.style.getPaddingBox(element), borderBox = goog.style.getBorderBox(element);
      style.pixelWidth = size.width + borderBox.left + paddingBox.left + paddingBox.right + borderBox.right;
      style.pixelHeight = size.height + borderBox.top + paddingBox.top + paddingBox.bottom + borderBox.bottom;
    }
  }
};
goog.style.setBoxSizingSize_ = function(element, size, boxSizing) {
  var style = element.style;
  goog.userAgent.GECKO ? style.MozBoxSizing = boxSizing : goog.userAgent.WEBKIT ? style.WebkitBoxSizing = boxSizing : style.boxSizing = boxSizing;
  style.width = Math.max(size.width, 0) + "px";
  style.height = Math.max(size.height, 0) + "px";
};
goog.style.getIePixelValue_ = function(element, value, name, pixelName) {
  if (/^\d+px?$/.test(value)) {
    return parseInt(value, 10);
  }
  var oldStyleValue = element.style[name], oldRuntimeValue = element.runtimeStyle[name];
  element.runtimeStyle[name] = element.currentStyle[name];
  element.style[name] = value;
  var pixelValue = element.style[pixelName];
  element.style[name] = oldStyleValue;
  element.runtimeStyle[name] = oldRuntimeValue;
  return +pixelValue;
};
goog.style.getIePixelDistance_ = function(element, propName) {
  var value = goog.style.getCascadedStyle(element, propName);
  return value ? goog.style.getIePixelValue_(element, value, "left", "pixelLeft") : 0;
};
goog.style.getBox_ = function(element, stylePrefix) {
  if (goog.userAgent.IE) {
    var left = goog.style.getIePixelDistance_(element, stylePrefix + "Left"), right = goog.style.getIePixelDistance_(element, stylePrefix + "Right"), top = goog.style.getIePixelDistance_(element, stylePrefix + "Top"), bottom = goog.style.getIePixelDistance_(element, stylePrefix + "Bottom");
    return new goog.math.Box(top, right, bottom, left);
  }
  left = goog.style.getComputedStyle(element, stylePrefix + "Left");
  right = goog.style.getComputedStyle(element, stylePrefix + "Right");
  top = goog.style.getComputedStyle(element, stylePrefix + "Top");
  bottom = goog.style.getComputedStyle(element, stylePrefix + "Bottom");
  return new goog.math.Box(parseFloat(top), parseFloat(right), parseFloat(bottom), parseFloat(left));
};
goog.style.getPaddingBox = function(element) {
  return goog.style.getBox_(element, "padding");
};
goog.style.getMarginBox = function(element) {
  return goog.style.getBox_(element, "margin");
};
goog.style.ieBorderWidthKeywords_ = {thin:2, medium:4, thick:6};
goog.style.getIePixelBorder_ = function(element, prop) {
  if ("none" == goog.style.getCascadedStyle(element, prop + "Style")) {
    return 0;
  }
  var width = goog.style.getCascadedStyle(element, prop + "Width");
  return width in goog.style.ieBorderWidthKeywords_ ? goog.style.ieBorderWidthKeywords_[width] : goog.style.getIePixelValue_(element, width, "left", "pixelLeft");
};
goog.style.getBorderBox = function(element) {
  if (goog.userAgent.IE && !goog.userAgent.isDocumentModeOrHigher(9)) {
    var left = goog.style.getIePixelBorder_(element, "borderLeft"), right = goog.style.getIePixelBorder_(element, "borderRight"), top = goog.style.getIePixelBorder_(element, "borderTop"), bottom = goog.style.getIePixelBorder_(element, "borderBottom");
    return new goog.math.Box(top, right, bottom, left);
  }
  left = goog.style.getComputedStyle(element, "borderLeftWidth");
  right = goog.style.getComputedStyle(element, "borderRightWidth");
  top = goog.style.getComputedStyle(element, "borderTopWidth");
  bottom = goog.style.getComputedStyle(element, "borderBottomWidth");
  return new goog.math.Box(parseFloat(top), parseFloat(right), parseFloat(bottom), parseFloat(left));
};
goog.style.getFontFamily = function(el) {
  var doc = goog.dom.getOwnerDocument(el), font = "";
  if (doc.body.createTextRange && goog.dom.contains(doc, el)) {
    var range = doc.body.createTextRange();
    range.moveToElementText(el);
    try {
      font = range.queryCommandValue("FontName");
    } catch (e) {
      font = "";
    }
  }
  font || (font = goog.style.getStyle_(el, "fontFamily"));
  var fontsArray = font.split(",");
  1 < fontsArray.length && (font = fontsArray[0]);
  return goog.string.stripQuotes(font, "\"'");
};
goog.style.lengthUnitRegex_ = /[^\d]+$/;
goog.style.getLengthUnits = function(value) {
  var units = value.match(goog.style.lengthUnitRegex_);
  return units && units[0] || null;
};
goog.style.ABSOLUTE_CSS_LENGTH_UNITS_ = {cm:1, "in":1, mm:1, pc:1, pt:1};
goog.style.CONVERTIBLE_RELATIVE_CSS_UNITS_ = {em:1, ex:1};
goog.style.getFontSize = function(el) {
  var fontSize = goog.style.getStyle_(el, "fontSize"), sizeUnits = goog.style.getLengthUnits(fontSize);
  if (fontSize && "px" == sizeUnits) {
    return parseInt(fontSize, 10);
  }
  if (goog.userAgent.IE) {
    if (String(sizeUnits) in goog.style.ABSOLUTE_CSS_LENGTH_UNITS_) {
      return goog.style.getIePixelValue_(el, fontSize, "left", "pixelLeft");
    }
    if (el.parentNode && el.parentNode.nodeType == goog.dom.NodeType.ELEMENT && String(sizeUnits) in goog.style.CONVERTIBLE_RELATIVE_CSS_UNITS_) {
      var parentElement = el.parentNode, parentSize = goog.style.getStyle_(parentElement, "fontSize");
      return goog.style.getIePixelValue_(parentElement, fontSize == parentSize ? "1em" : fontSize, "left", "pixelLeft");
    }
  }
  var sizeElement = goog.dom.createDom("SPAN", {style:"visibility:hidden;position:absolute;line-height:0;padding:0;margin:0;border:0;height:1em;"});
  goog.dom.appendChild(el, sizeElement);
  fontSize = sizeElement.offsetHeight;
  goog.dom.removeNode(sizeElement);
  return fontSize;
};
goog.style.parseStyleAttribute = function(value) {
  var result = {};
  goog.array.forEach(value.split(/\s*;\s*/), function(pair) {
    var keyValue = pair.match(/\s*([\w-]+)\s*:(.+)/);
    if (keyValue) {
      var styleName = keyValue[1], styleValue = goog.string.trim(keyValue[2]);
      result[goog.string.toCamelCase(styleName.toLowerCase())] = styleValue;
    }
  });
  return result;
};
goog.style.toStyleAttribute = function(obj) {
  var buffer = [];
  goog.object.forEach(obj, function(value, key) {
    buffer.push(goog.string.toSelectorCase(key), ":", value, ";");
  });
  return buffer.join("");
};
goog.style.setFloat = function(el, value) {
  el.style[goog.userAgent.IE ? "styleFloat" : "cssFloat"] = value;
};
goog.style.getFloat = function(el) {
  return el.style[goog.userAgent.IE ? "styleFloat" : "cssFloat"] || "";
};
goog.style.getScrollbarWidth = function(opt_className) {
  var outerDiv = goog.dom.createElement("DIV");
  opt_className && (outerDiv.className = opt_className);
  outerDiv.style.cssText = "overflow:auto;position:absolute;top:0;width:100px;height:100px";
  var innerDiv = goog.dom.createElement("DIV");
  goog.style.setSize(innerDiv, "200px", "200px");
  outerDiv.appendChild(innerDiv);
  goog.dom.appendChild(goog.dom.getDocument().body, outerDiv);
  var width = outerDiv.offsetWidth - outerDiv.clientWidth;
  goog.dom.removeNode(outerDiv);
  return width;
};
goog.style.MATRIX_TRANSLATION_REGEX_ = /matrix\([0-9\.\-]+, [0-9\.\-]+, [0-9\.\-]+, [0-9\.\-]+, ([0-9\.\-]+)p?x?, ([0-9\.\-]+)p?x?\)/;
goog.style.getCssTranslation = function(element) {
  var transform = goog.style.getComputedTransform(element);
  if (!transform) {
    return new goog.math.Coordinate(0, 0);
  }
  var matches = transform.match(goog.style.MATRIX_TRANSLATION_REGEX_);
  return matches ? new goog.math.Coordinate(parseFloat(matches[1]), parseFloat(matches[2])) : new goog.math.Coordinate(0, 0);
};
ee.layers.AbstractOverlay = function(tileSource, opt_options) {
  goog.events.EventTarget.call(this);
  var options = opt_options || {};
  this.minZoom = options.minZoom || 0;
  this.maxZoom = options.maxZoom || 20;
  if (!window.google || !window.google.maps) {
    throw Error("Google Maps API hasn't been initialized.");
  }
  this.tileSize = options.tileSize || new google.maps.Size(ee.layers.AbstractOverlay.DEFAULT_TILE_EDGE_LENGTH, ee.layers.AbstractOverlay.DEFAULT_TILE_EDGE_LENGTH);
  this.isPng = "isPng" in options ? options.isPng : !0;
  this.name = options.name;
  this.opacity = "opacity" in options ? options.opacity : 1;
  this.stats = new ee.layers.AbstractOverlayStats(tileSource.getUniqueId());
  this.tilesById = new goog.structs.Map;
  this.tileCounter = 0;
  this.tileSource = tileSource;
  this.handler = new goog.events.EventHandler(this);
  this.alt = this.radius = this.projection = void 0;
};
goog.inherits(ee.layers.AbstractOverlay, goog.events.EventTarget);
ee.layers.AbstractOverlay.EventType = {TILE_FAIL:"tile-fail", TILE_THROTTLE:"tile-throttle", TILE_LOAD:"tile-load"};
ee.layers.AbstractOverlay.DEFAULT_TILE_EDGE_LENGTH = 256;
ee.layers.AbstractOverlay.prototype.addTileCallback = function(callback) {
  return goog.events.listen(this, ee.layers.AbstractOverlay.EventType.TILE_LOAD, callback);
};
ee.layers.AbstractOverlay.prototype.removeTileCallback = function(callbackId) {
  goog.events.unlistenByKey(callbackId);
};
ee.layers.AbstractOverlay.prototype.getLoadingTilesCount = function() {
  return this.getTileCountForStatus_(ee.layers.AbstractTile.Status.THROTTLED) + this.getTileCountForStatus_(ee.layers.AbstractTile.Status.LOADING) + this.getTileCountForStatus_(ee.layers.AbstractTile.Status.NEW);
};
ee.layers.AbstractOverlay.prototype.getFailedTilesCount = function() {
  return this.getTileCountForStatus_(ee.layers.AbstractTile.Status.FAILED);
};
ee.layers.AbstractOverlay.prototype.getLoadedTilesCount = function() {
  return this.getTileCountForStatus_(ee.layers.AbstractTile.Status.LOADED);
};
ee.layers.AbstractOverlay.prototype.setOpacity = function(opacity) {
  this.opacity = opacity;
  this.tilesById.forEach(function(tile) {
    goog.style.setOpacity(tile.div, this.opacity);
  }, this);
};
ee.layers.AbstractOverlay.prototype.getStats = function() {
  return this.stats;
};
ee.layers.AbstractOverlay.prototype.getTile = function(coord, zoom, ownerDocument) {
  var maxCoord = 1 << zoom;
  if (zoom < this.minZoom || 0 > coord.y || coord.y >= maxCoord) {
    return ownerDocument.createElement("div");
  }
  var x = coord.x % maxCoord;
  0 > x && (x += maxCoord);
  var normalizedCoord = new google.maps.Point(x, coord.y), uniqueId = this.getUniqueTileId_(coord, zoom), tile = this.createTile(normalizedCoord, zoom, ownerDocument, uniqueId);
  tile.tileSize = this.tileSize;
  goog.style.setOpacity(tile.div, this.opacity);
  this.tilesById.set(uniqueId, tile);
  this.registerStatusChangeListener_(tile);
  this.tileSource.loadTile(tile, (new Date).getTime() / 1000);
  return tile.div;
};
ee.layers.AbstractOverlay.prototype.releaseTile = function(tileDiv) {
  var tile = this.tilesById.get(tileDiv.id);
  this.tilesById.remove(tileDiv.id);
  tile && (tile.abort(), goog.dispose(tile));
};
ee.layers.AbstractOverlay.prototype.registerStatusChangeListener_ = function(tile) {
  this.handler.listen(tile, ee.layers.AbstractTile.EventType.STATUS_CHANGED, function() {
    var Status = ee.layers.AbstractTile.Status;
    switch(tile.getStatus()) {
      case Status.LOADED:
        this.stats.addTileStats(tile.loadingStartTs_, (new Date).getTime(), tile.zoom);
        this.dispatchEvent(new ee.layers.TileLoadEvent(this.getLoadingTilesCount()));
        break;
      case Status.THROTTLED:
        this.stats.incrementThrottleCounter(tile.zoom);
        this.dispatchEvent(new ee.layers.TileThrottleEvent(tile.sourceUrl));
        break;
      case Status.FAILED:
        this.stats.incrementErrorCounter(tile.zoom), this.dispatchEvent(new ee.layers.TileFailEvent(tile.sourceUrl, tile.errorMessage_));
    }
  });
};
ee.layers.AbstractOverlay.prototype.getUniqueTileId_ = function(coord, z) {
  var tileId = [coord.x, coord.y, z, this.tileCounter++].join("-"), sourceId = this.tileSource.getUniqueId();
  return [tileId, sourceId].join("-");
};
ee.layers.AbstractOverlay.prototype.disposeInternal = function() {
  ee.layers.AbstractOverlay.superClass_.disposeInternal.call(this);
  this.tilesById.forEach(goog.dispose);
  this.tilesById.clear();
  this.tilesById = null;
  goog.dispose(this.handler);
  this.tileSource = this.handler = null;
};
ee.layers.AbstractOverlay.prototype.getTileCountForStatus_ = function(status) {
  return goog.array.count(this.tilesById.getValues(), function(tile) {
    return tile.getStatus() == status;
  });
};
ee.layers.TileLoadEvent = function(loadingTileCount) {
  goog.events.Event.call(this, ee.layers.AbstractOverlay.EventType.TILE_LOAD);
  this.loadingTileCount = loadingTileCount;
};
goog.inherits(ee.layers.TileLoadEvent, goog.events.Event);
ee.layers.TileThrottleEvent = function(tileUrl) {
  goog.events.Event.call(this, ee.layers.AbstractOverlay.EventType.TILE_THROTTLE);
  this.tileUrl = tileUrl;
};
goog.inherits(ee.layers.TileThrottleEvent, goog.events.Event);
ee.layers.TileFailEvent = function(tileUrl, opt_errorMessage) {
  goog.events.Event.call(this, ee.layers.AbstractOverlay.EventType.TILE_FAIL);
  this.tileUrl = tileUrl;
  this.errorMessage = opt_errorMessage;
};
goog.inherits(ee.layers.TileFailEvent, goog.events.Event);
ee.layers.AbstractTile = function(coord, zoom, ownerDocument, uniqueId) {
  goog.events.EventTarget.call(this);
  this.coord = coord;
  this.zoom = zoom;
  this.div = ownerDocument.createElement("div");
  this.div.id = uniqueId;
  this.maxRetries = ee.layers.AbstractTile.DEFAULT_MAX_LOAD_RETRIES_;
  this.renderer = function() {
  };
  this.status_ = ee.layers.AbstractTile.Status.NEW;
  this.retryAttemptCount_ = 0;
  this.isRetrying_ = !1;
};
goog.inherits(ee.layers.AbstractTile, goog.events.EventTarget);
ee.layers.AbstractTile.EventType = {STATUS_CHANGED:"status-changed"};
ee.layers.AbstractTile.Status = {NEW:"new", LOADING:"loading", THROTTLED:"throttled", LOADED:"loaded", FAILED:"failed", ABORTED:"aborted"};
ee.layers.AbstractTile.prototype.startLoad = function() {
  if (!this.isRetrying_ && this.getStatus() == ee.layers.AbstractTile.Status.LOADING) {
    throw Error("startLoad() can only be invoked once. Use retryLoad() after the first attempt.");
  }
  this.setStatus(ee.layers.AbstractTile.Status.LOADING);
  this.loadingStartTs_ = (new Date).getTime();
  this.xhrIo_ = new goog.net.XhrIo;
  this.xhrIo_.setResponseType(goog.net.XhrIo.ResponseType.BLOB);
  this.xhrIo_.listen(goog.net.EventType.COMPLETE, function(event) {
    var blob = this.xhrIo_.getResponse(), status = this.xhrIo_.getStatus(), HttpStatus = goog.net.HttpStatus;
    status == HttpStatus.TOO_MANY_REQUESTS && this.setStatus(ee.layers.AbstractTile.Status.THROTTLED);
    if (HttpStatus.isSuccess(status)) {
      var sourceResponseHeaders = {};
      goog.object.forEach(this.xhrIo_.getResponseHeaders(), function(value, name) {
        sourceResponseHeaders[name.toLowerCase()] = value;
      });
      this.sourceResponseHeaders = sourceResponseHeaders;
      this.sourceData = blob;
      this.finishLoad();
    } else {
      if (blob) {
        var reader = new goog.fs.FileReader;
        reader.listen(goog.fs.FileReader.EventType.LOAD_END, function() {
          this.retryLoad(reader.getResult());
        }, void 0, this);
        reader.readAsText(blob);
      } else {
        this.retryLoad("Failed to load tile.");
      }
    }
  }, !1, this);
  this.xhrIo_.listenOnce(goog.net.EventType.READY, goog.partial(goog.dispose, this.xhrIo_));
  this.xhrIo_.send(this.sourceUrl, "GET");
};
ee.layers.AbstractTile.prototype.finishLoad = function() {
  this.renderer(this);
  this.setStatus(ee.layers.AbstractTile.Status.LOADED);
};
ee.layers.AbstractTile.prototype.cancelLoad = function() {
  goog.dispose(this.xhrIo_);
};
ee.layers.AbstractTile.prototype.retryLoad = function(opt_errorMessage) {
  var parseError = function(error) {
    try {
      if (error = JSON.parse(error), error.error && error.error.message) {
        return error.error.message;
      }
    } catch (e) {
    }
    return error;
  };
  this.retryAttemptCount_ >= this.maxRetries ? (this.errorMessage_ = parseError(opt_errorMessage), this.setStatus(ee.layers.AbstractTile.Status.FAILED)) : (this.cancelLoad(), setTimeout(goog.bind(function() {
    this.isDisposed() || (this.isRetrying_ = !0, this.startLoad(), this.isRetrying_ = !1);
  }, this), 1000 * Math.pow(2, this.retryAttemptCount_++)));
};
ee.layers.AbstractTile.prototype.abort = function() {
  this.cancelLoad();
  this.setStatus(ee.layers.AbstractTile.Status.ABORTED);
};
ee.layers.AbstractTile.prototype.isDone = function() {
  return this.status_ in ee.layers.AbstractTile.DONE_STATUS_SET_;
};
ee.layers.AbstractTile.prototype.getStatus = function() {
  return this.status_;
};
ee.layers.AbstractTile.prototype.setStatus = function(status) {
  this.status_ = status;
  this.dispatchEvent(ee.layers.AbstractTile.EventType.STATUS_CHANGED);
};
ee.layers.AbstractTile.DONE_STATUS_SET_ = goog.object.createSet(ee.layers.AbstractTile.Status.ABORTED, ee.layers.AbstractTile.Status.FAILED, ee.layers.AbstractTile.Status.LOADED);
ee.layers.AbstractTile.prototype.disposeInternal = function() {
  ee.layers.AbstractTile.superClass_.disposeInternal.call(this);
  this.cancelLoad();
  this.div.remove();
  this.renderer = null;
};
ee.layers.AbstractTile.DEFAULT_MAX_LOAD_RETRIES_ = 5;
ee.layers.AbstractTileSource = function() {
  goog.Disposable.call(this);
};
goog.inherits(ee.layers.AbstractTileSource, goog.Disposable);
ee.layers.BinaryOverlay = function(tileSource, opt_options) {
  ee.layers.AbstractOverlay.call(this, tileSource, opt_options);
  this.buffersByCoord_ = new goog.structs.Map;
  this.divsByCoord_ = new goog.structs.Map;
};
goog.inherits(ee.layers.BinaryOverlay, ee.layers.AbstractOverlay);
ee.layers.BinaryOverlay.prototype.createTile = function(coord, zoom, ownerDocument, uniqueId) {
  var tile = new ee.layers.BinaryTile(coord, zoom, ownerDocument, uniqueId);
  this.handler.listen(tile, ee.layers.AbstractTile.EventType.STATUS_CHANGED, function() {
    tile.getStatus() == ee.layers.AbstractTile.Status.LOADED && (this.buffersByCoord_.set(coord, new Float32Array(tile.buffer_)), this.divsByCoord_.set(coord, tile.div));
  });
  return tile;
};
ee.layers.BinaryOverlay.prototype.getBuffersByCoord = function() {
  return this.buffersByCoord_;
};
ee.layers.BinaryOverlay.prototype.getDivsByCoord = function() {
  return this.divsByCoord_;
};
ee.layers.BinaryOverlay.prototype.disposeInternal = function() {
  ee.layers.BinaryOverlay.superClass_.disposeInternal.call(this);
  this.divsByCoord_ = this.buffersByCoord_ = null;
};
ee.layers.BinaryTile = function(coord, zoom, ownerDocument, uniqueId) {
  ee.layers.AbstractTile.call(this, coord, zoom, ownerDocument, uniqueId);
};
goog.inherits(ee.layers.BinaryTile, ee.layers.AbstractTile);
ee.layers.BinaryTile.prototype.finishLoad = function() {
  var reader = new goog.fs.FileReader;
  reader.listen(goog.fs.FileReader.EventType.LOAD_END, function() {
    this.buffer_ = reader.getResult();
    ee.layers.AbstractTile.prototype.finishLoad.call(this);
  }, void 0, this);
  reader.readAsArrayBuffer(this.sourceData);
};
goog.net.ImageLoader = function(opt_parent) {
  goog.events.EventTarget.call(this);
  this.imageIdToRequestMap_ = {};
  this.imageIdToImageMap_ = {};
  this.handler_ = new goog.events.EventHandler(this);
  this.parent_ = opt_parent;
};
goog.inherits(goog.net.ImageLoader, goog.events.EventTarget);
goog.net.ImageLoader.CorsRequestType = {ANONYMOUS:"anonymous", USE_CREDENTIALS:"use-credentials"};
goog.net.ImageLoader.IMAGE_LOAD_EVENTS_ = [goog.userAgent.IE && !goog.userAgent.isVersionOrHigher("11") ? goog.net.EventType.READY_STATE_CHANGE : goog.events.EventType.LOAD, goog.net.EventType.ABORT, goog.net.EventType.ERROR];
goog.net.ImageLoader.prototype.addImage = function(id, image, opt_corsRequestType) {
  var src = goog.isString(image) ? image : image.src;
  src && (this.imageIdToRequestMap_[id] = {src:src, corsRequestType:goog.isDef(opt_corsRequestType) ? opt_corsRequestType : null});
};
goog.net.ImageLoader.prototype.removeImage = function(id) {
  delete this.imageIdToRequestMap_[id];
  var image = this.imageIdToImageMap_[id];
  image && (delete this.imageIdToImageMap_[id], this.handler_.unlisten(image, goog.net.ImageLoader.IMAGE_LOAD_EVENTS_, this.onNetworkEvent_), goog.object.isEmpty(this.imageIdToImageMap_) && goog.object.isEmpty(this.imageIdToRequestMap_) && this.dispatchEvent(goog.net.EventType.COMPLETE));
};
goog.net.ImageLoader.prototype.start = function() {
  var imageIdToRequestMap = this.imageIdToRequestMap_;
  goog.array.forEach(goog.object.getKeys(imageIdToRequestMap), function(id) {
    var imageRequest = imageIdToRequestMap[id];
    imageRequest && (delete imageIdToRequestMap[id], this.loadImage_(imageRequest, id));
  }, this);
};
goog.net.ImageLoader.prototype.loadImage_ = function(imageRequest, id) {
  if (!this.isDisposed()) {
    var image = this.parent_ ? goog.dom.getDomHelper(this.parent_).createDom("IMG") : new Image;
    imageRequest.corsRequestType && (image.crossOrigin = imageRequest.corsRequestType);
    this.handler_.listen(image, goog.net.ImageLoader.IMAGE_LOAD_EVENTS_, this.onNetworkEvent_);
    this.imageIdToImageMap_[id] = image;
    image.id = id;
    image.src = imageRequest.src;
  }
};
goog.net.ImageLoader.prototype.onNetworkEvent_ = function(evt) {
  var image = evt.currentTarget;
  if (image) {
    if (evt.type == goog.net.EventType.READY_STATE_CHANGE) {
      if (image.readyState == goog.net.EventType.COMPLETE) {
        evt.type = goog.events.EventType.LOAD;
      } else {
        return;
      }
    }
    "undefined" == typeof image.naturalWidth && (evt.type == goog.events.EventType.LOAD ? (image.naturalWidth = image.width, image.naturalHeight = image.height) : (image.naturalWidth = 0, image.naturalHeight = 0));
    this.dispatchEvent({type:evt.type, target:image});
    this.isDisposed() || this.removeImage(image.id);
  }
};
goog.net.ImageLoader.prototype.disposeInternal = function() {
  delete this.imageIdToRequestMap_;
  delete this.imageIdToImageMap_;
  goog.dispose(this.handler_);
  goog.net.ImageLoader.superClass_.disposeInternal.call(this);
};
ee.layers.ImageOverlay = function(tileSource, opt_options) {
  ee.layers.AbstractOverlay.call(this, tileSource, opt_options);
};
goog.inherits(ee.layers.ImageOverlay, ee.layers.AbstractOverlay);
ee.layers.ImageOverlay.prototype.createTile = function(coord, zoom, ownerDocument, uniqueId) {
  return new ee.layers.ImageTile(coord, zoom, ownerDocument, uniqueId);
};
ee.layers.ImageTile = function(coord, zoom, ownerDocument, uniqueId) {
  ee.layers.AbstractTile.call(this, coord, zoom, ownerDocument, uniqueId);
  this.renderer = ee.layers.ImageTile.defaultRenderer_;
  this.imageLoaderListenerKey_ = this.imageLoader_ = this.imageEl = null;
  this.objectUrl_ = "";
};
goog.inherits(ee.layers.ImageTile, ee.layers.AbstractTile);
ee.layers.ImageTile.prototype.finishLoad = function() {
  try {
    var safeUrl = goog.html.SafeUrl.fromBlob(this.sourceData);
    this.objectUrl_ = goog.html.SafeUrl.unwrap(safeUrl);
    var imageUrl = this.objectUrl_ !== goog.html.SafeUrl.INNOCUOUS_STRING ? this.objectUrl_ : this.sourceUrl;
  } catch (e) {
    imageUrl = this.sourceUrl;
  }
  this.imageLoader_ = new goog.net.ImageLoader;
  this.imageLoader_.addImage(this.div.id + "-image", imageUrl);
  this.imageLoaderListenerKey_ = goog.events.listenOnce(this.imageLoader_, ee.layers.ImageTile.IMAGE_LOADER_EVENTS_, function(event) {
    event.type == goog.events.EventType.LOAD ? (this.imageEl = event.target, ee.layers.AbstractTile.prototype.finishLoad.call(this)) : this.retryLoad();
  }, void 0, this);
  this.imageLoader_.start();
};
ee.layers.ImageTile.prototype.cancelLoad = function() {
  ee.layers.ImageTile.superClass_.cancelLoad.call(this);
  this.imageLoader_ && (goog.events.unlistenByKey(this.imageLoaderListenerKey_), goog.dispose(this.imageLoader_));
};
ee.layers.ImageTile.prototype.disposeInternal = function() {
  ee.layers.ImageTile.superClass_.disposeInternal.call(this);
  this.objectUrl_ && URL.revokeObjectURL(this.objectUrl_);
};
ee.layers.ImageTile.IMAGE_LOADER_EVENTS_ = [goog.events.EventType.LOAD, goog.net.EventType.ABORT, goog.net.EventType.ERROR];
ee.layers.ImageTile.defaultRenderer_ = function(tile) {
  tile.div.appendChild(tile.imageEl);
};
goog.string.path = {};
goog.string.path.baseName = function(path) {
  var i = path.lastIndexOf("/") + 1;
  return path.slice(i);
};
goog.string.path.basename = goog.string.path.baseName;
goog.string.path.dirname = function(path) {
  var i = path.lastIndexOf("/") + 1, head = path.slice(0, i);
  /^\/+$/.test(head) || (head = head.replace(/\/+$/, ""));
  return head;
};
goog.string.path.extension = function(path) {
  var baseName = goog.string.path.baseName(path).replace(/\.+/g, "."), separatorIndex = baseName.lastIndexOf(".");
  return 0 >= separatorIndex ? "" : baseName.substr(separatorIndex + 1);
};
goog.string.path.join = function(var_args) {
  for (var path = arguments[0], i = 1; i < arguments.length; i++) {
    var arg = arguments[i];
    path = goog.string.startsWith(arg, "/") ? arg : "" == path || goog.string.endsWith(path, "/") ? path + arg : path + ("/" + arg);
  }
  return path;
};
goog.string.path.normalizePath = function(path) {
  if ("" == path) {
    return ".";
  }
  var initialSlashes = "";
  goog.string.startsWith(path, "/") && (initialSlashes = "/", goog.string.startsWith(path, "//") && !goog.string.startsWith(path, "///") && (initialSlashes = "//"));
  for (var parts = path.split("/"), newParts = [], i = 0; i < parts.length; i++) {
    var part = parts[i];
    "" != part && "." != part && (".." != part || !initialSlashes && !newParts.length || ".." == goog.array.peek(newParts) ? newParts.push(part) : newParts.pop());
  }
  return initialSlashes + newParts.join("/") || ".";
};
goog.string.path.split = function(path) {
  var head = goog.string.path.dirname(path), tail = goog.string.path.baseName(path);
  return [head, tail];
};
ee.layers.CloudStorageTileSource = function(bucket, path, maxZoom, opt_suffix) {
  ee.layers.AbstractTileSource.call(this);
  this.bucket_ = bucket;
  this.path_ = path;
  this.suffix_ = opt_suffix || "";
  this.maxZoom_ = maxZoom;
};
goog.inherits(ee.layers.CloudStorageTileSource, ee.layers.AbstractTileSource);
ee.layers.CloudStorageTileSource.prototype.loadTile = function(tile, opt_priority) {
  if (tile.zoom <= this.maxZoom_) {
    tile.sourceUrl = this.getTileUrl_(tile.coord, tile.zoom);
  } else {
    var zoomSteps = tile.zoom - this.maxZoom_, zoomFactor = Math.pow(2, zoomSteps), upperCoord = new google.maps.Point(Math.floor(tile.coord.x / zoomFactor), Math.floor(tile.coord.y / zoomFactor));
    tile.sourceUrl = this.getTileUrl_(upperCoord, tile.zoom - zoomSteps);
    tile.renderer = goog.partial(ee.layers.CloudStorageTileSource.zoomTileRenderer_, this.maxZoom_);
  }
  var originalRetryLoad = goog.bind(tile.retryLoad, tile);
  tile.retryLoad = goog.bind(function(opt_errorMessage) {
    opt_errorMessage && (opt_errorMessage.includes(ee.layers.CloudStorageTileSource.MISSING_TILE_ERROR_) || opt_errorMessage.includes(ee.layers.CloudStorageTileSource.ACCESS_DENIED_ERROR_)) ? tile.setStatus(ee.layers.AbstractTile.Status.LOADED) : originalRetryLoad(opt_errorMessage);
  }, tile);
  tile.startLoad();
};
ee.layers.CloudStorageTileSource.prototype.getUniqueId = function() {
  return [this.bucket_, this.path_, this.maxZoom_, this.suffix_].join("-");
};
ee.layers.CloudStorageTileSource.prototype.getTileUrl_ = function(coord, zoom) {
  var url = goog.string.path.join(ee.layers.CloudStorageTileSource.BASE_URL_, this.bucket_, this.path_, String(zoom), String(coord.x), String(coord.y));
  this.suffix_ && (url += this.suffix_);
  return url;
};
ee.layers.CloudStorageTileSource.zoomTileRenderer_ = function(maxZoom, tile) {
  if (!tile.imageEl) {
    throw Error("Tile must have an image element to be rendered.");
  }
  var zoomFactor = Math.pow(2, tile.zoom - maxZoom), sideLength = tile.tileSize.width, canv = tile.div.ownerDocument.createElement("canvas");
  canv.setAttribute("width", sideLength);
  canv.setAttribute("height", sideLength);
  tile.div.appendChild(canv);
  var context = canv.getContext("2d");
  context.imageSmoothingEnabled = !1;
  context.mozImageSmoothingEnabled = !1;
  context.webkitImageSmoothingEnabled = !1;
  context.drawImage(tile.imageEl, sideLength / zoomFactor * (tile.coord.x % zoomFactor), sideLength / zoomFactor * (tile.coord.y % zoomFactor), sideLength / zoomFactor, sideLength / zoomFactor, 0, 0, sideLength, sideLength);
};
ee.layers.CloudStorageTileSource.BASE_URL_ = "https://storage.googleapis.com";
ee.layers.CloudStorageTileSource.MISSING_TILE_ERROR_ = "The specified key does not exist.";
ee.layers.CloudStorageTileSource.ACCESS_DENIED_ERROR_ = "AccessDenied";
goog.structs.Queue = function() {
  this.front_ = [];
  this.back_ = [];
};
goog.structs.Queue.prototype.maybeFlip_ = function() {
  goog.array.isEmpty(this.front_) && (this.front_ = this.back_, this.front_.reverse(), this.back_ = []);
};
goog.structs.Queue.prototype.enqueue = function(element) {
  this.back_.push(element);
};
goog.structs.Queue.prototype.dequeue = function() {
  this.maybeFlip_();
  return this.front_.pop();
};
goog.structs.Queue.prototype.peek = function() {
  this.maybeFlip_();
  return goog.array.peek(this.front_);
};
goog.structs.Queue.prototype.getCount = function() {
  return this.front_.length + this.back_.length;
};
goog.structs.Queue.prototype.isEmpty = function() {
  return goog.array.isEmpty(this.front_) && goog.array.isEmpty(this.back_);
};
goog.structs.Queue.prototype.clear = function() {
  this.front_ = [];
  this.back_ = [];
};
goog.structs.Queue.prototype.contains = function(obj) {
  return goog.array.contains(this.front_, obj) || goog.array.contains(this.back_, obj);
};
goog.structs.Queue.prototype.remove = function(obj) {
  return goog.array.removeLast(this.front_, obj) || goog.array.remove(this.back_, obj);
};
goog.structs.Queue.prototype.getValues = function() {
  for (var res = [], i = this.front_.length - 1; 0 <= i; --i) {
    res.push(this.front_[i]);
  }
  var len = this.back_.length;
  for (i = 0; i < len; ++i) {
    res.push(this.back_[i]);
  }
  return res;
};
goog.structs.Pool = function(opt_minCount, opt_maxCount) {
  goog.Disposable.call(this);
  this.minCount_ = opt_minCount || 0;
  this.maxCount_ = opt_maxCount || 10;
  if (this.minCount_ > this.maxCount_) {
    throw Error(goog.structs.Pool.ERROR_MIN_MAX_);
  }
  this.freeQueue_ = new goog.structs.Queue;
  this.inUseSet_ = new goog.structs.Set;
  this.delay = 0;
  this.lastAccess = null;
  this.adjustForMinMax();
};
goog.inherits(goog.structs.Pool, goog.Disposable);
goog.structs.Pool.ERROR_MIN_MAX_ = "[goog.structs.Pool] Min can not be greater than max";
goog.structs.Pool.ERROR_DISPOSE_UNRELEASED_OBJS_ = "[goog.structs.Pool] Objects not released";
goog.structs.Pool.prototype.setMinimumCount = function(min) {
  if (min > this.maxCount_) {
    throw Error(goog.structs.Pool.ERROR_MIN_MAX_);
  }
  this.minCount_ = min;
  this.adjustForMinMax();
};
goog.structs.Pool.prototype.setMaximumCount = function(max) {
  if (max < this.minCount_) {
    throw Error(goog.structs.Pool.ERROR_MIN_MAX_);
  }
  this.maxCount_ = max;
  this.adjustForMinMax();
};
goog.structs.Pool.prototype.setDelay = function(delay) {
  this.delay = delay;
};
goog.structs.Pool.prototype.getObject = function() {
  var time = goog.now();
  if (!(goog.isDefAndNotNull(this.lastAccess) && time - this.lastAccess < this.delay)) {
    var obj = this.removeFreeObject_();
    obj && (this.lastAccess = time, this.inUseSet_.add(obj));
    return obj;
  }
};
goog.structs.Pool.prototype.releaseObject = function(obj) {
  return this.inUseSet_.remove(obj) ? (this.addFreeObject(obj), !0) : !1;
};
goog.structs.Pool.prototype.removeFreeObject_ = function() {
  for (var obj; 0 < this.getFreeCount() && (obj = this.freeQueue_.dequeue(), !this.objectCanBeReused(obj));) {
    this.adjustForMinMax();
  }
  !obj && this.getCount() < this.maxCount_ && (obj = this.createObject());
  return obj;
};
goog.structs.Pool.prototype.addFreeObject = function(obj) {
  this.inUseSet_.remove(obj);
  this.objectCanBeReused(obj) && this.getCount() < this.maxCount_ ? this.freeQueue_.enqueue(obj) : this.disposeObject(obj);
};
goog.structs.Pool.prototype.adjustForMinMax = function() {
  for (var freeQueue = this.freeQueue_; this.getCount() < this.minCount_;) {
    freeQueue.enqueue(this.createObject());
  }
  for (; this.getCount() > this.maxCount_ && 0 < this.getFreeCount();) {
    this.disposeObject(freeQueue.dequeue());
  }
};
goog.structs.Pool.prototype.createObject = function() {
  return {};
};
goog.structs.Pool.prototype.disposeObject = function(obj) {
  if ("function" == typeof obj.dispose) {
    obj.dispose();
  } else {
    for (var i in obj) {
      obj[i] = null;
    }
  }
};
goog.structs.Pool.prototype.objectCanBeReused = function(obj) {
  return "function" == typeof obj.canBeReused ? obj.canBeReused() : !0;
};
goog.structs.Pool.prototype.contains = function(obj) {
  return this.freeQueue_.contains(obj) || this.inUseSet_.contains(obj);
};
goog.structs.Pool.prototype.getCount = function() {
  return this.freeQueue_.getCount() + this.inUseSet_.getCount();
};
goog.structs.Pool.prototype.getInUseCount = function() {
  return this.inUseSet_.getCount();
};
goog.structs.Pool.prototype.getFreeCount = function() {
  return this.freeQueue_.getCount();
};
goog.structs.Pool.prototype.isEmpty = function() {
  return this.freeQueue_.isEmpty() && this.inUseSet_.isEmpty();
};
goog.structs.Pool.prototype.disposeInternal = function() {
  goog.structs.Pool.superClass_.disposeInternal.call(this);
  if (0 < this.getInUseCount()) {
    throw Error(goog.structs.Pool.ERROR_DISPOSE_UNRELEASED_OBJS_);
  }
  delete this.inUseSet_;
  for (var freeQueue = this.freeQueue_; !freeQueue.isEmpty();) {
    this.disposeObject(freeQueue.dequeue());
  }
  delete this.freeQueue_;
};
goog.structs.Node = function(key, value) {
  this.key_ = key;
  this.value_ = value;
};
goog.structs.Node.prototype.getKey = function() {
  return this.key_;
};
goog.structs.Node.prototype.getValue = function() {
  return this.value_;
};
goog.structs.Node.prototype.clone = function() {
  return new goog.structs.Node(this.key_, this.value_);
};
goog.structs.Heap = function(opt_heap) {
  this.nodes_ = [];
  opt_heap && this.insertAll(opt_heap);
};
goog.structs.Heap.prototype.insert = function(key, value) {
  var node = new goog.structs.Node(key, value), nodes = this.nodes_;
  nodes.push(node);
  this.moveUp_(nodes.length - 1);
};
goog.structs.Heap.prototype.insertAll = function(heap) {
  if (heap instanceof goog.structs.Heap) {
    var keys = heap.getKeys();
    var values = heap.getValues();
    if (0 >= this.getCount()) {
      for (var nodes = this.nodes_, i = 0; i < keys.length; i++) {
        nodes.push(new goog.structs.Node(keys[i], values[i]));
      }
      return;
    }
  } else {
    keys = goog.object.getKeys(heap), values = goog.object.getValues(heap);
  }
  for (i = 0; i < keys.length; i++) {
    this.insert(keys[i], values[i]);
  }
};
goog.structs.Heap.prototype.remove = function() {
  var nodes = this.nodes_, count = nodes.length, rootNode = nodes[0];
  if (!(0 >= count)) {
    return 1 == count ? goog.array.clear(nodes) : (nodes[0] = nodes.pop(), this.moveDown_(0)), rootNode.getValue();
  }
};
goog.structs.Heap.prototype.peek = function() {
  var nodes = this.nodes_;
  if (0 != nodes.length) {
    return nodes[0].getValue();
  }
};
goog.structs.Heap.prototype.peekKey = function() {
  return this.nodes_[0] && this.nodes_[0].getKey();
};
goog.structs.Heap.prototype.moveDown_ = function(index) {
  for (var nodes = this.nodes_, count = nodes.length, node = nodes[index]; index < count >> 1;) {
    var leftChildIndex = this.getLeftChildIndex_(index), rightChildIndex = this.getRightChildIndex_(index), smallerChildIndex = rightChildIndex < count && nodes[rightChildIndex].getKey() < nodes[leftChildIndex].getKey() ? rightChildIndex : leftChildIndex;
    if (nodes[smallerChildIndex].getKey() > node.getKey()) {
      break;
    }
    nodes[index] = nodes[smallerChildIndex];
    index = smallerChildIndex;
  }
  nodes[index] = node;
};
goog.structs.Heap.prototype.moveUp_ = function(index) {
  for (var nodes = this.nodes_, node = nodes[index]; 0 < index;) {
    var parentIndex = this.getParentIndex_(index);
    if (nodes[parentIndex].getKey() > node.getKey()) {
      nodes[index] = nodes[parentIndex], index = parentIndex;
    } else {
      break;
    }
  }
  nodes[index] = node;
};
goog.structs.Heap.prototype.getLeftChildIndex_ = function(index) {
  return 2 * index + 1;
};
goog.structs.Heap.prototype.getRightChildIndex_ = function(index) {
  return 2 * index + 2;
};
goog.structs.Heap.prototype.getParentIndex_ = function(index) {
  return index - 1 >> 1;
};
goog.structs.Heap.prototype.getValues = function() {
  for (var nodes = this.nodes_, rv = [], l = nodes.length, i = 0; i < l; i++) {
    rv.push(nodes[i].getValue());
  }
  return rv;
};
goog.structs.Heap.prototype.getKeys = function() {
  for (var nodes = this.nodes_, rv = [], l = nodes.length, i = 0; i < l; i++) {
    rv.push(nodes[i].getKey());
  }
  return rv;
};
goog.structs.Heap.prototype.containsValue = function(val) {
  return goog.array.some(this.nodes_, function(node) {
    return node.getValue() == val;
  });
};
goog.structs.Heap.prototype.containsKey = function(key) {
  return goog.array.some(this.nodes_, function(node) {
    return node.getKey() == key;
  });
};
goog.structs.Heap.prototype.clone = function() {
  return new goog.structs.Heap(this);
};
goog.structs.Heap.prototype.getCount = function() {
  return this.nodes_.length;
};
goog.structs.Heap.prototype.isEmpty = function() {
  return goog.array.isEmpty(this.nodes_);
};
goog.structs.Heap.prototype.clear = function() {
  goog.array.clear(this.nodes_);
};
goog.structs.PriorityQueue = function() {
  goog.structs.Heap.call(this);
};
goog.inherits(goog.structs.PriorityQueue, goog.structs.Heap);
goog.structs.PriorityQueue.prototype.enqueue = function(priority, value) {
  this.insert(priority, value);
};
goog.structs.PriorityQueue.prototype.dequeue = function() {
  return this.remove();
};
goog.structs.PriorityPool = function(opt_minCount, opt_maxCount) {
  this.delayTimeout_ = void 0;
  this.requestQueue_ = new goog.structs.PriorityQueue;
  goog.structs.Pool.call(this, opt_minCount, opt_maxCount);
};
goog.inherits(goog.structs.PriorityPool, goog.structs.Pool);
goog.structs.PriorityPool.DEFAULT_PRIORITY_ = 100;
goog.structs.PriorityPool.prototype.setDelay = function(delay) {
  goog.structs.PriorityPool.superClass_.setDelay.call(this, delay);
  goog.isDefAndNotNull(this.lastAccess) && (goog.global.clearTimeout(this.delayTimeout_), this.delayTimeout_ = goog.global.setTimeout(goog.bind(this.handleQueueRequests_, this), this.delay + this.lastAccess - goog.now()), this.handleQueueRequests_());
};
goog.structs.PriorityPool.prototype.getObject = function(opt_callback, opt_priority) {
  if (!opt_callback) {
    var result = goog.structs.PriorityPool.superClass_.getObject.call(this);
    result && this.delay && (this.delayTimeout_ = goog.global.setTimeout(goog.bind(this.handleQueueRequests_, this), this.delay));
    return result;
  }
  this.requestQueue_.enqueue(goog.isDef(opt_priority) ? opt_priority : goog.structs.PriorityPool.DEFAULT_PRIORITY_, opt_callback);
  this.handleQueueRequests_();
};
goog.structs.PriorityPool.prototype.handleQueueRequests_ = function() {
  for (var requestQueue = this.requestQueue_; 0 < requestQueue.getCount();) {
    var obj = this.getObject();
    if (obj) {
      requestQueue.dequeue().apply(this, [obj]);
    } else {
      break;
    }
  }
};
goog.structs.PriorityPool.prototype.addFreeObject = function(obj) {
  goog.structs.PriorityPool.superClass_.addFreeObject.call(this, obj);
  this.handleQueueRequests_();
};
goog.structs.PriorityPool.prototype.adjustForMinMax = function() {
  goog.structs.PriorityPool.superClass_.adjustForMinMax.call(this);
  this.handleQueueRequests_();
};
goog.structs.PriorityPool.prototype.disposeInternal = function() {
  goog.structs.PriorityPool.superClass_.disposeInternal.call(this);
  goog.global.clearTimeout(this.delayTimeout_);
  this.requestQueue_.clear();
  this.requestQueue_ = null;
};
ee.layers.EarthEngineTileSource = function(mapId, opt_profiler) {
  ee.layers.AbstractTileSource.call(this);
  this.mapId_ = mapId;
  this.profiler_ = opt_profiler || null;
};
goog.inherits(ee.layers.EarthEngineTileSource, ee.layers.AbstractTileSource);
ee.layers.EarthEngineTileSource.prototype.loadTile = function(tile, opt_priority) {
  var ProfilerHeader = ee.data.PROFILE_HEADER.toLowerCase(), key = goog.events.listen(tile, ee.layers.AbstractTile.EventType.STATUS_CHANGED, function() {
    switch(tile.getStatus()) {
      case ee.layers.AbstractTile.Status.LOADED:
        var profileId = tile.sourceResponseHeaders[ProfilerHeader];
        this.profiler_ && profileId && this.profiler_.addTile(tile.div.id, profileId);
        break;
      case ee.layers.AbstractTile.Status.FAILED:
      case ee.layers.AbstractTile.Status.ABORTED:
        this.profiler_ && "" !== tile.div.id && this.profiler_.removeTile(tile.div.id), goog.events.unlistenByKey(key);
    }
  }, void 0, this);
  tile.sourceUrl = this.getTileUrl_(tile.coord, tile.zoom);
  var handleAvailableToken = goog.bind(this.handleAvailableToken_, this, tile);
  ee.layers.EarthEngineTileSource.getGlobalTokenPool_().getObject(handleAvailableToken, opt_priority);
};
ee.layers.EarthEngineTileSource.prototype.getUniqueId = function() {
  return this.mapId_.mapid + "-" + this.mapId_.token;
};
ee.layers.EarthEngineTileSource.prototype.handleAvailableToken_ = function(tile, token) {
  var tokenPool = ee.layers.EarthEngineTileSource.getGlobalTokenPool_();
  if (tile.isDisposed() || tile.getStatus() == ee.layers.AbstractTile.Status.ABORTED) {
    tokenPool.releaseObject(token);
  } else {
    var key = goog.events.listen(tile, ee.layers.AbstractTile.EventType.STATUS_CHANGED, function() {
      tile.isDone() && (goog.events.unlistenByKey(key), tokenPool.releaseObject(token));
    });
    tile.startLoad();
  }
};
ee.layers.EarthEngineTileSource.prototype.getTileUrl_ = function(coord, zoom) {
  var url = ee.data.getTileUrl(this.mapId_, coord.x, coord.y, zoom);
  return this.profiler_ && this.profiler_.isEnabled() ? url + "&profiling=1" : url;
};
ee.layers.EarthEngineTileSource.getGlobalTokenPool_ = function() {
  ee.layers.EarthEngineTileSource.TOKEN_POOL_ || (ee.layers.EarthEngineTileSource.TOKEN_POOL_ = new goog.structs.PriorityPool(0, ee.layers.EarthEngineTileSource.TOKEN_COUNT_));
  return ee.layers.EarthEngineTileSource.TOKEN_POOL_;
};
ee.layers.EarthEngineTileSource.TOKEN_POOL_ = null;
ee.layers.EarthEngineTileSource.TOKEN_COUNT_ = 4;
ee.MapTileManager = function() {
  goog.events.EventTarget.call(this);
  this.tokenPool_ = new ee.MapTileManager.TokenPool_(0, 60);
  this.requests_ = new goog.structs.Map;
};
goog.inherits(ee.MapTileManager, goog.events.EventTarget);
goog.addSingletonGetter(ee.MapTileManager);
ee.MapTileManager.MAX_RETRIES = 1;
ee.MapTileManager.ERROR_ID_IN_USE_ = "[ee.MapTileManager] ID in use";
ee.MapTileManager.prototype.getOutstandingCount = function() {
  return this.requests_.getCount();
};
ee.MapTileManager.prototype.send = function(id, url, opt_priority, opt_imageCompletedCallback, opt_maxRetries) {
  if (this.requests_.get(id)) {
    throw Error(ee.MapTileManager.ERROR_ID_IN_USE_);
  }
  var request = new ee.MapTileManager.Request_(id, url, opt_imageCompletedCallback, goog.bind(this.releaseRequest_, this), goog.isDef(opt_maxRetries) ? opt_maxRetries : ee.MapTileManager.MAX_RETRIES);
  this.requests_.set(id, request);
  var callback = goog.bind(this.handleAvailableToken_, this, request);
  this.tokenPool_.getObject(callback, opt_priority);
  return request;
};
ee.MapTileManager.prototype.abort = function(id) {
  var request = this.requests_.get(id);
  request && (request.setAborted(!0), this.releaseRequest_(request));
};
ee.MapTileManager.prototype.handleAvailableToken_ = function(request, token) {
  if (request.getImageLoader() || request.getAborted()) {
    this.releaseObject_(token);
  } else {
    if (request.setToken(token), token.setActive(!0), request.setImageLoader(new goog.net.ImageLoader), !request.retry()) {
      throw Error("Cannot dispatch first request!");
    }
  }
};
ee.MapTileManager.prototype.releaseRequest_ = function(request) {
  this.requests_.remove(request.getId());
  request.getImageLoader() && (this.releaseObject_(request.getToken()), request.getImageLoader().dispose());
  request.fireImageEventCallback();
};
ee.MapTileManager.prototype.releaseObject_ = function(token) {
  token.setActive(!1);
  if (!this.tokenPool_.releaseObject(token)) {
    throw Error("Object not released");
  }
};
ee.MapTileManager.prototype.disposeInternal = function() {
  ee.MapTileManager.superClass_.disposeInternal.call(this);
  this.tokenPool_.dispose();
  this.tokenPool_ = null;
  var requests = this.requests_;
  goog.array.forEach(requests.getValues(), function(value) {
    value.dispose();
  });
  requests.clear();
  this.requests_ = null;
};
ee.MapTileManager.Request_ = function(id, url, opt_imageEventCallback, opt_requestCompleteCallback, opt_maxRetries) {
  goog.Disposable.call(this);
  this.id_ = id;
  this.url_ = url;
  this.maxRetries_ = goog.isDef(opt_maxRetries) ? opt_maxRetries : ee.MapTileManager.MAX_RETRIES;
  this.imageEventCallback_ = opt_imageEventCallback;
  this.requestCompleteCallback_ = opt_requestCompleteCallback;
};
goog.inherits(ee.MapTileManager.Request_, goog.Disposable);
ee.MapTileManager.Request_.prototype.attemptCount_ = 0;
ee.MapTileManager.Request_.prototype.aborted_ = !1;
ee.MapTileManager.Request_.prototype.imageLoader_ = null;
ee.MapTileManager.Request_.prototype.token_ = null;
ee.MapTileManager.Request_.prototype.event_ = null;
ee.MapTileManager.Request_.prototype.profileId_ = null;
ee.MapTileManager.Request_.IMAGE_LOADER_EVENT_TYPES_ = [goog.events.EventType.LOAD, goog.net.EventType.ABORT, goog.net.EventType.ERROR];
ee.MapTileManager.Request_.prototype.getImageLoader = function() {
  return this.imageLoader_;
};
ee.MapTileManager.Request_.prototype.setImageLoader = function(imageLoader) {
  this.imageLoader_ = imageLoader;
};
ee.MapTileManager.Request_.prototype.getToken = function() {
  return this.token_;
};
ee.MapTileManager.Request_.prototype.setToken = function(token) {
  this.token_ = token;
};
ee.MapTileManager.Request_.prototype.addImageEventListener = function() {
  goog.events.listenOnce(this.imageLoader_, ee.MapTileManager.Request_.IMAGE_LOADER_EVENT_TYPES_, goog.bind(this.handleImageEvent_, this));
};
ee.MapTileManager.Request_.prototype.fireImageEventCallback = function() {
  this.imageEventCallback_ && this.imageEventCallback_(this.event_, this.profileId_);
};
ee.MapTileManager.Request_.prototype.getId = function() {
  return this.id_;
};
ee.MapTileManager.Request_.prototype.getUrl = function() {
  return this.url_;
};
ee.MapTileManager.Request_.prototype.getMaxRetries = function() {
  return this.maxRetries_;
};
ee.MapTileManager.Request_.prototype.getAttemptCount = function() {
  return this.attemptCount_;
};
ee.MapTileManager.Request_.prototype.increaseAttemptCount = function() {
  this.attemptCount_++;
};
ee.MapTileManager.Request_.prototype.hasReachedMaxRetries = function() {
  return this.attemptCount_ > this.maxRetries_;
};
ee.MapTileManager.Request_.prototype.setAborted = function(aborted) {
  aborted && !this.aborted_ && (this.aborted_ = aborted, this.event_ = new goog.events.Event(goog.net.EventType.ABORT));
};
ee.MapTileManager.Request_.prototype.getAborted = function() {
  return this.aborted_;
};
ee.MapTileManager.Request_.prototype.handleImageEvent_ = function(e) {
  if (this.getAborted()) {
    this.markCompleted_();
  } else {
    switch(e.type) {
      case goog.events.EventType.LOAD:
        this.handleSuccess_(e);
        this.markCompleted_();
        break;
      case goog.net.EventType.ERROR:
      case goog.net.EventType.ABORT:
        this.handleError_(e);
    }
  }
};
ee.MapTileManager.Request_.prototype.markCompleted_ = function() {
  this.requestCompleteCallback_ && this.requestCompleteCallback_(this);
};
ee.MapTileManager.Request_.prototype.handleSuccess_ = function(e) {
  this.event_ = e;
};
ee.MapTileManager.Request_.prototype.handleError_ = function(e) {
  this.retry() || (this.event_ = e, this.markCompleted_());
};
ee.MapTileManager.Request_.prototype.disposeInternal = function() {
  ee.MapTileManager.Request_.superClass_.disposeInternal.call(this);
  delete this.imageEventCallback_;
  delete this.requestCompleteCallback_;
};
ee.MapTileManager.Request_.prototype.retry = function() {
  if (this.hasReachedMaxRetries()) {
    return !1;
  }
  this.increaseAttemptCount();
  this.imageLoader_.removeImage(this.id_);
  setTimeout(goog.bind(this.start_, this), 0);
  return !0;
};
ee.MapTileManager.Request_.prototype.start_ = function() {
  if (!this.getAborted()) {
    var actuallyLoadImage = goog.bind(function(imageUrl) {
      this.getAborted() || (this.imageLoader_.addImage(this.id_, imageUrl), this.addImageEventListener(), this.imageLoader_.start());
    }, this), sourceUrl = this.getUrl();
    if (goog.Uri.parse(sourceUrl).getQueryData().containsKey("profiling")) {
      var xhrIo = new goog.net.XhrIo;
      xhrIo.setResponseType(goog.net.XhrIo.ResponseType.BLOB);
      xhrIo.listen(goog.net.EventType.COMPLETE, goog.bind(function(event) {
        this.profileId_ = xhrIo.getResponseHeader(ee.data.PROFILE_HEADER) || null;
        if (200 <= xhrIo.getStatus() && 300 > xhrIo.getStatus()) {
          try {
            var objectUrl = goog.html.SafeUrl.unwrap(goog.html.SafeUrl.fromBlob(xhrIo.getResponse()));
            var ok = objectUrl !== goog.html.SafeUrl.INNOCUOUS_STRING;
          } catch (e) {
          }
        }
        actuallyLoadImage(ok ? objectUrl : sourceUrl);
      }, this));
      xhrIo.listenOnce(goog.net.EventType.READY, goog.bind(xhrIo.dispose, xhrIo));
      xhrIo.send(sourceUrl, "GET");
    } else {
      actuallyLoadImage(sourceUrl);
    }
  }
};
ee.MapTileManager.Token_ = function() {
  this.active_ = !1;
};
goog.inherits(ee.MapTileManager.Token_, goog.Disposable);
ee.MapTileManager.Token_.prototype.setActive = function(val) {
  this.active_ = val;
};
ee.MapTileManager.Token_.prototype.isActive = function() {
  return this.active_;
};
ee.MapTileManager.TokenPool_ = function(opt_minCount, opt_maxCount) {
  goog.structs.PriorityPool.call(this, opt_minCount, opt_maxCount);
};
goog.inherits(ee.MapTileManager.TokenPool_, goog.structs.PriorityPool);
ee.MapTileManager.TokenPool_.prototype.createObject = function() {
  return new ee.MapTileManager.Token_;
};
ee.MapTileManager.TokenPool_.prototype.disposeObject = function(obj) {
  obj.dispose();
};
ee.MapTileManager.TokenPool_.prototype.objectCanBeReused = function(obj) {
  return !obj.isDisposed() && !obj.isActive();
};
ee.MapLayerOverlay = function(url, mapId, token, init, opt_profiler) {
  ee.AbstractOverlay.call(this, url, mapId, token, init, opt_profiler);
  this.minZoom = init.minZoom || 0;
  this.maxZoom = init.maxZoom || 20;
  if (!window.google || !window.google.maps) {
    throw Error("Google Maps API hasn't been initialized.");
  }
  this.tileSize = init.tileSize || new google.maps.Size(256, 256);
  this.isPng = goog.isDef(init.isPng) ? init.isPng : !0;
  this.name = init.name;
  this.tiles_ = new goog.structs.Set;
  this.opacity_ = 1.0;
  this.visible_ = !0;
  this.profiler_ = opt_profiler || null;
};
goog.inherits(ee.MapLayerOverlay, ee.AbstractOverlay);
ee.MapLayerOverlay.prototype.addTileCallback = function(callback) {
  return goog.events.listen(this, ee.AbstractOverlay.EventType.TILE_LOADED, callback);
};
ee.MapLayerOverlay.prototype.removeTileCallback = function(callbackId) {
  goog.events.unlistenByKey(callbackId);
};
ee.MapLayerOverlay.prototype.dispatchTileEvent_ = function() {
  this.dispatchEvent(new ee.TileEvent(this.tilesLoading.length));
};
ee.MapLayerOverlay.prototype.getTile = function(coord, zoom, ownerDocument) {
  var maxCoord;
  if (zoom < this.minZoom || 0 > coord.y || coord.y >= 1 << zoom) {
    var img = ownerDocument.createElement("IMG");
    img.style.width = "0px";
    img.style.height = "0px";
    return img;
  }
  var profiling = this.profiler_ && this.profiler_.isEnabled(), tileId = this.getTileId(coord, zoom), src = [this.url, tileId].join("/") + "?token=" + this.token;
  profiling && (src += "&profiling=1");
  var uniqueTileId = [tileId, this.tileCounter, this.token].join("/");
  this.tileCounter += 1;
  var div = goog.dom.createDom("DIV", {id:uniqueTileId}), priority = (new Date).getTime() / 1000;
  this.tilesLoading.push(uniqueTileId);
  ee.MapTileManager.getInstance().send(uniqueTileId, src, priority, goog.bind(this.handleImageCompleted_, this, div, uniqueTileId));
  this.dispatchTileEvent_();
  return div;
};
ee.MapLayerOverlay.prototype.getLoadedTilesCount = function() {
  return this.tiles_.getCount();
};
ee.MapLayerOverlay.prototype.getLoadingTilesCount = function() {
  return this.tilesLoading.length;
};
ee.MapLayerOverlay.prototype.releaseTile = function(tileDiv) {
  ee.MapTileManager.getInstance().abort(tileDiv.id);
  var tileImg = goog.dom.getFirstElementChild(tileDiv);
  this.tiles_.remove(tileImg);
  "" !== tileDiv.id && (this.tilesFailed.remove(tileDiv.id), this.profiler_ && this.profiler_.removeTile(tileDiv.id));
};
ee.MapLayerOverlay.prototype.setOpacity = function(opacity) {
  this.opacity_ = opacity;
  var iter = this.tiles_.__iterator__();
  goog.iter.forEach(iter, function(tile) {
    goog.style.setOpacity(tile, opacity);
  });
};
goog.exportProperty(ee.MapLayerOverlay.prototype, "getTile", ee.MapLayerOverlay.prototype.getTile);
goog.exportProperty(ee.MapLayerOverlay.prototype, "setOpacity", ee.MapLayerOverlay.prototype.setOpacity);
goog.exportProperty(ee.MapLayerOverlay.prototype, "releaseTile", ee.MapLayerOverlay.prototype.releaseTile);
ee.MapLayerOverlay.prototype.handleImageCompleted_ = function(div, tileId, e, profileId) {
  if (e.type == goog.net.EventType.ERROR) {
    goog.array.remove(this.tilesLoading, tileId), this.tilesFailed.add(tileId), this.dispatchEvent(e);
  } else {
    goog.array.remove(this.tilesLoading, tileId);
    if (e.target && e.type == goog.events.EventType.LOAD) {
      var tile = e.target;
      this.tiles_.add(tile);
      1.0 != this.opacity_ && goog.style.setOpacity(tile, this.opacity_);
      div.appendChild(tile);
    }
    this.dispatchTileEvent_();
  }
  this.profiler_ && !goog.isNull(profileId) && this.profiler_.addTile(tileId, profileId);
};
ee.SavedFunction = function(path, signature) {
  if (!(this instanceof ee.SavedFunction)) {
    return new ee.SavedFunction(path, signature);
  }
  this.path_ = path;
  this.signature_ = signature;
};
goog.inherits(ee.SavedFunction, ee.Function);
goog.exportSymbol("ee.SavedFunction", ee.SavedFunction);
ee.SavedFunction.prototype.encode = function(encoder) {
  return ee.ApiFunction._call("LoadAlgorithmById", this.path_).encode(encoder);
};
ee.SavedFunction.prototype.getSignature = function() {
  return this.signature_;
};
ee.Package = function(opt_path) {
  if (opt_path && ee.Package.importedPackages_[opt_path]) {
    return ee.Package.importedPackages_[opt_path];
  }
  if (!(this instanceof ee.Package)) {
    return new ee.Package(opt_path);
  }
  if (opt_path) {
    for (var contents = ee.Package.getFolder(opt_path), i = 0; i < contents.length; i++) {
      var parts = contents[i].id.split("/"), name = parts[parts.length - 1];
      this[name] = ee.Package.makeInvocation_(opt_path, name, contents[i]);
    }
    ee.Package.importedPackages_[opt_path] = this;
  }
};
ee.Package.importedPackages_ = {};
ee.Package.makeFunction = function(signature, body) {
  "string" == typeof signature && (signature = ee.Package.decodeDecl(signature));
  var func = function() {
    throw Error("Package not saved.");
  };
  func.body = body;
  func.signature = signature;
  return func;
};
ee.Package.save = function(pkg, path) {
  var args = ee.arguments.extractFromFunction(ee.Package.save, arguments);
  pkg = args.pkg;
  path = args.path;
  if (!path) {
    throw Error("No path specified.");
  }
  var original = {};
  for (name in pkg) {
    if (pkg.hasOwnProperty(name)) {
      var member = pkg[name];
      if (member instanceof Function) {
        if (member.isSaved) {
          var expected = path + "/" + name;
          if (member.path != expected) {
            throw Error("Function name mismatch.  Expected path: " + expected + " but found: " + member.path);
          }
        } else {
          if ("signature" in member) {
            original[name] = member, pkg[name] = ee.Package.makeInvocation_(path, name, member.signature);
          } else {
            throw Error("No signature for function: " + name);
          }
        }
      } else {
        throw Error("Can't save constants: " + name);
      }
    }
  }
  var custom = [];
  for (name in original) {
    var body = original[name].body, signature = original[name].signature, func = new ee.CustomFunction(signature, body);
    custom.push({name:name, algorithm:ee.ApiFunction._call("SavedAlgorithm", func, signature, {text:body.toString()})});
  }
  if (custom.length) {
    try {
      ee.data.createFolder(path);
    } catch (e) {
      if (!e.message.match(/exists/)) {
        throw e;
      }
    }
    for (var index = 0; index < custom.length; index++) {
      var name = custom[index].name;
      var algorithm = custom[index].algorithm.serialize();
      ee.data.createAsset(algorithm, path + "/" + name);
    }
  }
};
ee.Package.getFolder = function(path) {
  return ee.ApiFunction.lookup("LoadFolder").call(path).getInfo();
};
ee.Package.decodeDecl = function(decl) {
  var parts = decl.match(/\w+|\S/g), cur = 0, peek = function() {
    return parts[cur];
  }, expect = function(regex) {
    var match = peek() && peek().match(regex);
    if (match) {
      return cur++, match[0];
    }
    throw Error("Unable to decode declaration.");
  }, type = expect(/\w+/);
  expect(/\w+/);
  expect(/\(/);
  for (var collected = []; peek() && !peek().match("\\)");) {
    collected.length && expect(","), collected.push({type:expect(/\w+/), name:expect(/\w+/)});
  }
  expect(/\)/);
  ";" == peek() && expect(";");
  if (peek()) {
    throw Error("Unable to decode declaration.  Found extra trailing input.");
  }
  return {returns:type, args:collected};
};
ee.Package.encodeDecl_ = function(signature, name) {
  var out = [signature.returns, " ", name, "("];
  if (signature.args) {
    for (var i = 0; i < signature.args.length; i++) {
      0 < i && out.push(", "), out.push(signature.args[i].type + " " + signature.args[i].name);
    }
  }
  out.push(")");
  return out.join("");
};
ee.Package.makeInvocation_ = function(path, name, signature) {
  var savedFunction = new ee.SavedFunction(path + "/" + name, signature), fn = function(var_args) {
    var args = Array.prototype.slice.call(arguments);
    return savedFunction.call.apply(savedFunction, args);
  };
  fn.toString = function() {
    return signature.returns + " " + savedFunction.toString(name);
  };
  fn.isSaved = !0;
  return fn;
};
goog.async.Delay = function(listener, opt_interval, opt_handler) {
  goog.Disposable.call(this);
  this.listener_ = listener;
  this.interval_ = opt_interval || 0;
  this.handler_ = opt_handler;
  this.callback_ = goog.bind(this.doAction_, this);
};
goog.inherits(goog.async.Delay, goog.Disposable);
goog.Delay = goog.async.Delay;
goog.async.Delay.prototype.id_ = 0;
goog.async.Delay.prototype.disposeInternal = function() {
  goog.async.Delay.superClass_.disposeInternal.call(this);
  this.stop();
  delete this.listener_;
  delete this.handler_;
};
goog.async.Delay.prototype.start = function(opt_interval) {
  this.stop();
  this.id_ = goog.Timer.callOnce(this.callback_, goog.isDef(opt_interval) ? opt_interval : this.interval_);
};
goog.async.Delay.prototype.startIfNotActive = function(opt_interval) {
  this.isActive() || this.start(opt_interval);
};
goog.async.Delay.prototype.stop = function() {
  this.isActive() && goog.Timer.clear(this.id_);
  this.id_ = 0;
};
goog.async.Delay.prototype.fire = function() {
  this.stop();
  this.doAction_();
};
goog.async.Delay.prototype.fireIfActive = function() {
  this.isActive() && this.fire();
};
goog.async.Delay.prototype.isActive = function() {
  return 0 != this.id_;
};
goog.async.Delay.prototype.doAction_ = function() {
  this.id_ = 0;
  this.listener_ && this.listener_.call(this.handler_);
};
ee.data.Profiler = function(format) {
  goog.events.EventTarget.call(this);
  this.format_ = format;
  this.isEnabled_ = !1;
  this.lastRefreshToken_ = null;
  this.profileIds_ = Object.create(null);
  this.tileProfileIds_ = Object.create(null);
  this.showInternal_ = !1;
  this.profileError_ = null;
  this.throttledRefresh_ = new goog.async.Delay(goog.bind(this.refresh_, this), ee.data.Profiler.DELAY_BEFORE_REFRESH_);
  this.profileData_ = ee.data.Profiler.getEmptyProfile_(format);
};
goog.inherits(ee.data.Profiler, goog.events.EventTarget);
ee.data.Profiler.DELAY_BEFORE_REFRESH_ = 500;
ee.data.Profiler.prototype.isEnabled = function() {
  return this.isEnabled_;
};
ee.data.Profiler.prototype.setEnabled = function(value) {
  this.isEnabled_ = !!value;
  this.dispatchEvent(new goog.events.Event(ee.data.Profiler.EventType.STATE_CHANGED));
};
ee.data.Profiler.prototype.isLoading = function() {
  return null !== this.lastRefreshToken_;
};
ee.data.Profiler.prototype.isError = function() {
  return goog.isDefAndNotNull(this.profileError_);
};
ee.data.Profiler.prototype.getStatusText = function() {
  if (this.profileError_) {
    return this.profileError_;
  }
  if (this.lastRefreshToken_) {
    return "Loading...";
  }
  var profiles = 0, nonTileProfiles = 0, tileProfiles = 0;
  goog.object.forEach(this.profileIds_, function(refCount) {
    profiles++;
    Infinity === refCount ? nonTileProfiles++ : tileProfiles++;
  }, this);
  return "Viewing " + profiles + " profiles, " + nonTileProfiles + " from API calls and " + tileProfiles + " from map tiles.";
};
ee.data.Profiler.prototype.getProfileData = function() {
  return this.profileData_;
};
ee.data.Profiler.prototype.clearAndDrop = function() {
  this.profileIds_ = Object.create(null);
  this.tileProfileIds_ = Object.create(null);
  this.refresh_();
};
ee.data.Profiler.prototype.getProfileHook = function() {
  var profileIds = this.profileIds_;
  return this.isEnabled_ ? goog.bind(function(profileId) {
    profileIds[profileId] = Infinity;
    this.throttledRefresh_.start();
  }, this) : null;
};
ee.data.Profiler.prototype.removeProfile_ = function(profileId) {
  var count = this.profileIds_[profileId];
  1 < count ? this.profileIds_[profileId]-- : void 0 !== count && (delete this.profileIds_[profileId], this.throttledRefresh_.start());
};
ee.data.Profiler.prototype.refresh_ = function() {
  var marker = {};
  this.lastRefreshToken_ = marker;
  var handleResponse = goog.bind(function(result, error) {
    marker == this.lastRefreshToken_ && (this.profileData_ = (this.profileError_ = error) ? ee.data.Profiler.getEmptyProfile_(this.format_) : result, this.lastRefreshToken_ = null, this.dispatchEvent(ee.data.Profiler.EventType.STATE_CHANGED), this.dispatchEvent(ee.data.Profiler.EventType.DATA_CHANGED));
  }, this), ids = goog.object.getKeys(this.profileIds_);
  0 === ids.length ? handleResponse(ee.data.Profiler.getEmptyProfile_(this.format_), void 0) : (ee.ApiFunction._apply(this.showInternal_ ? "Profile.getProfilesInternal" : "Profile.getProfiles", {ids:ids, format:this.format_.toString()}).getInfo(handleResponse), this.dispatchEvent(ee.data.Profiler.EventType.STATE_CHANGED));
};
ee.data.Profiler.prototype.addTile = function(tileId, profileId) {
  this.tileProfileIds_[tileId] || (this.tileProfileIds_[tileId] = profileId, this.profileIds_[profileId] = (this.profileIds_[profileId] || 0) + 1, this.throttledRefresh_.start());
};
ee.data.Profiler.prototype.removeTile = function(tileId) {
  var profileId = this.tileProfileIds_[tileId];
  profileId && (delete this.tileProfileIds_[tileId], this.removeProfile_(profileId));
};
ee.data.Profiler.prototype.getShowInternal = function() {
  return this.showInternal_;
};
ee.data.Profiler.prototype.setShowInternal = function(value) {
  this.showInternal_ = !!value;
  this.throttledRefresh_.fire();
};
ee.data.Profiler.prototype.setParentEventTarget = function(parent) {
  throw Error("not applicable");
};
ee.data.Profiler.getEmptyProfile_ = function(format) {
  switch(format) {
    case ee.data.Profiler.Format.TEXT:
      return "";
    case ee.data.Profiler.Format.JSON:
      return ee.data.Profiler.EMPTY_JSON_PROFILE_;
    default:
      throw Error("Invalid Profiler data format: " + format);
  }
};
ee.data.Profiler.EMPTY_JSON_PROFILE_ = {cols:[], rows:[]};
ee.data.Profiler.EventType = {STATE_CHANGED:"statechanged", DATA_CHANGED:"datachanged"};
ee.data.Profiler.Format = function(format) {
  this.format_ = format;
};
ee.data.Profiler.Format.prototype.toString = function() {
  return this.format_;
};
ee.data.Profiler.Format.TEXT = new ee.data.Profiler.Format("text");
ee.data.Profiler.Format.JSON = new ee.data.Profiler.Format("json");
(function() {
  var exportedFnInfo = {}, orderedFnNames = "ee.Filter.lte ee.data.setCloudApiEnabled ee.Image.prototype.expression ee.batch.Export.image.toDrive ee.Dictionary ee.batch.Export.video.toDrive ee.data.getTaskList ee.ComputedObject.prototype.evaluate ee.Terrain ee.data.getThumbId ee.Filter.gte ee.batch.Export.videoMap.toCloudStorage ee.data.updateAsset ee.data.getCloudApiEnabled ee.Collection.prototype.filterMetadata ee.data.newTaskId ee.data.setAssetProperties ee.data.makeTableDownloadUrl ee.Image.cat ee.data.makeThumbUrl ee.ComputedObject.prototype.aside ee.rpc_convert_batch.taskToExportVideoRequest ee.data.listImages ee.batch.Export.video.toCloudStorage ee.Function.prototype.apply ee.Serializer.encode ee.data.cancelOperation ee.ComputedObject.prototype.serialize ee.Filter.bounds ee.Geometry.prototype.toGeoJSONString ee.Algorithms ee.Filter.neq ee.data.getXsrfToken ee.data.getInfo ee.Filter ee.data.getOperation ee.data.listAssets ee.Geometry.LineString ee.List ee.Geometry ee.data.setAuthTokenRefresher ee.Image.prototype.getDownloadURL ee.data.setParamAugmenter ee.Collection.prototype.limit ee.Image.prototype.getMap ee.FeatureCollection.prototype.select ee.data.getTaskStatus ee.ImageCollection.prototype.select ee.Image ee.batch.Export.table.toDrive ee.Geometry.MultiPolygon ee.Image.prototype.select ee.FeatureCollection ee.Serializer.toJSON ee.TILE_SIZE ee.data.authenticateViaOauth ee.ApiFunction.lookup ee.InitState ee.data.authenticateViaPopup ee.data.setApiKey ee.batch.Export.map.toCloudStorage ee.ComputedObject.prototype.getInfo ee.batch.Export.table.toCloudStorage ee.data.setProject ee.batch.Export.table.toAsset ee.Filter.inList ee.data.listBuckets ee.ApiFunction._call ee.Element.prototype.set ee.Filter.eq ee.data.getTableDownloadId ee.Geometry.Rectangle ee.data.getApiBaseUrl ee.Serializer.toReadableCloudApiJSON ee.Deserializer.fromJSON ee.FeatureCollection.prototype.getMap ee.Image.rgb ee.data.getAssetRoots ee.data.setAuthToken ee.data.withProfiling ee.rpc_convert_batch.taskToExportMapRequest ee.Filter.date ee.data.getMapId ee.data.startProcessing ee.Function.prototype.call ee.Geometry.prototype.toGeoJSON ee.data.startIngestion ee.data.getTileUrl ee.data.cancelTask ee.Serializer.encodeCloudApi ee.Deserializer.decode ee.Collection.prototype.filter ee.ApiFunction._apply ee.apply ee.Collection.prototype.map ee.ImageCollection.prototype.getMap ee.Collection.prototype.filterBounds ee.data.authenticate ee.data.renameAsset ee.ImageCollection.prototype.getFilmstripThumbURL ee.call ee.Filter.or ee.initialize ee.String ee.Image.prototype.getInfo ee.data.createFolder ee.data.setDeadline ee.Filter.gt ee.Feature.prototype.getMap ee.Filter.prototype.not ee.data.setAssetAcl ee.data.copyAsset ee.Filter.and ee.Geometry.Point ee.data.clearAuthToken ee.Geometry.Polygon ee.Image.prototype.clip ee.rpc_convert_batch.taskToExportVideoMapRequest ee.Image.prototype.getThumbURL ee.Collection.prototype.filterDate ee.Geometry.prototype.serialize ee.data.getTileBaseUrl ee.Serializer.encodeCloudApiPretty ee.FeatureCollection.prototype.getInfo ee.ImageCollection.prototype.getVideoThumbURL ee.data.getAssetAcl ee.data.getAuthScopes ee.reset ee.data.getDownloadId ee.Geometry.MultiPoint ee.data.deleteAsset ee.data.startTableIngestion ee.FeatureCollection.prototype.getDownloadURL ee.Collection.prototype.sort ee.Serializer.toReadableJSON ee.Image.prototype.rename ee.Collection.prototype.iterate ee.Number ee.rpc_convert_batch.taskToExportImageRequest ee.ImageCollection ee.data.getAsset ee.data.getAuthToken ee.batch.Export.image.toCloudStorage ee.data.createAssetHome ee.data.getList ee.Geometry.LinearRing ee.Geometry.MultiLineString ee.Date ee.data.getAuthClientId ee.batch.Export.image.toAsset ee.ImageCollection.prototype.first ee.Feature.prototype.getInfo ee.ImageCollection.prototype.getInfo ee.data.createAsset ee.rpc_convert_batch.taskToExportTableRequest ee.data.getTaskListWithLimit ee.data.getAssetRootQuota ee.Filter.lt ee.data.updateTask ee.data.getValue ee.data.makeDownloadUrl ee.Feature ee.data.authenticateViaPrivateKey ee.Filter.metadata".split(" "), 
  orderedParamLists = [["name", "value"], ["enable"], ["expression", "opt_map"], "image opt_description opt_folder opt_fileNamePrefix opt_dimensions opt_region opt_scale opt_crs opt_crsTransform opt_maxPixels opt_shardSize opt_fileDimensions opt_skipEmptyTiles opt_fileFormat opt_formatOptions".split(" "), ["opt_dict"], "collection opt_description opt_folder opt_fileNamePrefix opt_framesPerSecond opt_dimensions opt_region opt_scale opt_crs opt_crsTransform opt_maxPixels opt_maxFrames".split(" "), 
  ["opt_callback"], ["callback"], [], ["params", "opt_callback"], ["name", "value"], "collection opt_description opt_bucket opt_fileNamePrefix opt_framesPerSecond opt_writePublicTiles opt_minZoom opt_maxZoom opt_scale opt_region opt_skipEmptyTiles".split(" "), ["assetId", "asset", "updateMask", "opt_callback"], [], ["name", "operator", "value"], ["opt_count", "opt_callback"], ["assetId", "properties", "opt_callback"], ["id"], ["var_args"], ["id"], ["func", "var_args"], ["params"], ["body", "opt_callback"], 
  "collection opt_description opt_bucket opt_fileNamePrefix opt_framesPerSecond opt_dimensions opt_region opt_scale opt_crs opt_crsTransform opt_maxPixels opt_maxFrames".split(" "), ["namedArgs"], ["obj", "opt_isCompound"], ["operationName", "opt_callback"], [], ["geometry", "opt_errorMargin"], [], [], ["name", "value"], [], ["id", "opt_callback"], ["opt_filter"], ["operationName", "opt_callback"], ["body", "opt_callback"], ["coords", "opt_proj", "opt_geodesic", "opt_maxError"], ["list"], ["geoJson", 
  "opt_proj", "opt_geodesic", "opt_evenOdd"], ["refresher"], ["params", "opt_callback"], ["augmenter"], ["max", "opt_property", "opt_ascending"], ["opt_visParams", "opt_callback"], ["propertySelectors", "opt_newProperties", "opt_retainGeometry"], ["taskId", "opt_callback"], ["selectors", "opt_names"], ["opt_args"], "collection opt_description opt_folder opt_fileNamePrefix opt_fileFormat opt_selectors".split(" "), ["coords", "opt_proj", "opt_geodesic", "opt_maxError", "opt_evenOdd"], ["var_args"], 
  ["args", "opt_column"], ["obj"], [], ["clientId", "success", "opt_error", "opt_extraScopes", "opt_onImmediateFailed"], ["name"], [], ["opt_success", "opt_error"], ["apiKey"], "image opt_description opt_bucket opt_fileFormat opt_path opt_writePublicTiles opt_scale opt_maxZoom opt_minZoom opt_region opt_skipEmptyTiles opt_mapsApiKey".split(" "), ["opt_callback"], "collection opt_description opt_bucket opt_fileNamePrefix opt_fileFormat opt_selectors".split(" "), ["project"], ["collection", "opt_description", 
  "opt_assetId"], ["opt_leftField", "opt_rightValue", "opt_rightField", "opt_leftValue"], ["opt_callback"], ["name", "var_args"], ["var_args"], ["name", "value"], ["params", "opt_callback"], ["coords", "opt_proj", "opt_geodesic", "opt_evenOdd"], [], ["obj"], ["json"], ["opt_visParams", "opt_callback"], ["r", "g", "b"], ["opt_callback"], "clientId tokenType accessToken expiresIn opt_extraScopes opt_callback opt_updateAuthLibrary".split(" "), ["hook", "body", "opt_this"], ["params"], ["start", "opt_end"], 
  ["params", "opt_callback"], ["taskId", "params", "opt_callback"], ["var_args"], [], ["taskId", "request", "opt_callback"], ["mapid", "x", "y", "z"], ["taskId", "opt_callback"], ["obj"], ["json"], ["filter"], ["name", "namedArgs"], ["func", "namedArgs"], ["algorithm", "opt_dropNulls"], ["opt_visParams", "opt_callback"], ["geometry"], ["clientId", "success", "opt_error", "opt_extraScopes", "opt_onImmediateFailed"], ["sourceId", "destinationId", "opt_callback"], ["params", "opt_callback"], ["func", 
  "var_args"], ["var_args"], ["opt_baseurl", "opt_tileurl", "opt_successCallback", "opt_errorCallback", "opt_xsrfToken"], ["string"], ["opt_callback"], ["path", "opt_force", "opt_callback"], ["milliseconds"], ["name", "value"], ["opt_visParams", "opt_callback"], [], ["assetId", "aclUpdate", "opt_callback"], ["sourceId", "destinationId", "opt_callback"], ["var_args"], ["coords", "opt_proj"], [], ["coords", "opt_proj", "opt_geodesic", "opt_maxError", "opt_evenOdd"], ["geometry"], ["params"], ["params", 
  "opt_callback"], ["start", "opt_end"], [], [], ["obj"], ["opt_callback"], ["params", "opt_callback"], ["assetId", "opt_callback"], [], [], ["params", "opt_callback"], ["coords", "opt_proj"], ["assetId", "opt_callback"], ["taskId", "request", "opt_callback"], ["opt_format", "opt_selectors", "opt_filename", "opt_callback"], ["property", "opt_ascending"], ["obj"], ["var_args"], ["algorithm", "opt_first"], ["number"], ["params"], ["args"], ["id", "opt_callback"], [], "image opt_description opt_bucket opt_fileNamePrefix opt_dimensions opt_region opt_scale opt_crs opt_crsTransform opt_maxPixels opt_shardSize opt_fileDimensions opt_skipEmptyTiles opt_fileFormat opt_formatOptions".split(" "), 
  ["requestedId", "opt_callback"], ["params", "opt_callback"], ["coords", "opt_proj", "opt_geodesic", "opt_maxError"], ["coords", "opt_proj", "opt_geodesic", "opt_maxError"], ["date", "opt_tz"], [], "image opt_description opt_assetId opt_pyramidingPolicy opt_dimensions opt_region opt_scale opt_crs opt_crsTransform opt_maxPixels".split(" "), [], ["opt_callback"], ["opt_callback"], ["value", "opt_path", "opt_force", "opt_properties", "opt_callback"], ["params"], ["opt_limit", "opt_callback"], ["rootId", 
  "opt_callback"], ["name", "value"], ["taskId", "action", "opt_callback"], ["params", "opt_callback"], ["id"], ["geometry", "opt_properties"], ["privateKey", "opt_success", "opt_error", "opt_extraScopes"], ["name", "operator", "value"]];
  [ee.Filter.lte, ee.data.setCloudApiEnabled, ee.Image.prototype.expression, ee.batch.Export.image.toDrive, ee.Dictionary, ee.batch.Export.video.toDrive, ee.data.getTaskList, ee.ComputedObject.prototype.evaluate, ee.Terrain, ee.data.getThumbId, ee.Filter.gte, ee.batch.Export.videoMap.toCloudStorage, ee.data.updateAsset, ee.data.getCloudApiEnabled, ee.Collection.prototype.filterMetadata, ee.data.newTaskId, ee.data.setAssetProperties, ee.data.makeTableDownloadUrl, ee.Image.cat, ee.data.makeThumbUrl, 
  ee.ComputedObject.prototype.aside, ee.rpc_convert_batch.taskToExportVideoRequest, ee.data.listImages, ee.batch.Export.video.toCloudStorage, ee.Function.prototype.apply, ee.Serializer.encode, ee.data.cancelOperation, ee.ComputedObject.prototype.serialize, ee.Filter.bounds, ee.Geometry.prototype.toGeoJSONString, ee.Algorithms, ee.Filter.neq, ee.data.getXsrfToken, ee.data.getInfo, ee.Filter, ee.data.getOperation, ee.data.listAssets, ee.Geometry.LineString, ee.List, ee.Geometry, ee.data.setAuthTokenRefresher, 
  ee.Image.prototype.getDownloadURL, ee.data.setParamAugmenter, ee.Collection.prototype.limit, ee.Image.prototype.getMap, ee.FeatureCollection.prototype.select, ee.data.getTaskStatus, ee.ImageCollection.prototype.select, ee.Image, ee.batch.Export.table.toDrive, ee.Geometry.MultiPolygon, ee.Image.prototype.select, ee.FeatureCollection, ee.Serializer.toJSON, ee.TILE_SIZE, ee.data.authenticateViaOauth, ee.ApiFunction.lookup, ee.InitState, ee.data.authenticateViaPopup, ee.data.setApiKey, ee.batch.Export.map.toCloudStorage, 
  ee.ComputedObject.prototype.getInfo, ee.batch.Export.table.toCloudStorage, ee.data.setProject, ee.batch.Export.table.toAsset, ee.Filter.inList, ee.data.listBuckets, ee.ApiFunction._call, ee.Element.prototype.set, ee.Filter.eq, ee.data.getTableDownloadId, ee.Geometry.Rectangle, ee.data.getApiBaseUrl, ee.Serializer.toReadableCloudApiJSON, ee.Deserializer.fromJSON, ee.FeatureCollection.prototype.getMap, ee.Image.rgb, ee.data.getAssetRoots, ee.data.setAuthToken, ee.data.withProfiling, ee.rpc_convert_batch.taskToExportMapRequest, 
  ee.Filter.date, ee.data.getMapId, ee.data.startProcessing, ee.Function.prototype.call, ee.Geometry.prototype.toGeoJSON, ee.data.startIngestion, ee.data.getTileUrl, ee.data.cancelTask, ee.Serializer.encodeCloudApi, ee.Deserializer.decode, ee.Collection.prototype.filter, ee.ApiFunction._apply, ee.apply, ee.Collection.prototype.map, ee.ImageCollection.prototype.getMap, ee.Collection.prototype.filterBounds, ee.data.authenticate, ee.data.renameAsset, ee.ImageCollection.prototype.getFilmstripThumbURL, 
  ee.call, ee.Filter.or, ee.initialize, ee.String, ee.Image.prototype.getInfo, ee.data.createFolder, ee.data.setDeadline, ee.Filter.gt, ee.Feature.prototype.getMap, ee.Filter.prototype.not, ee.data.setAssetAcl, ee.data.copyAsset, ee.Filter.and, ee.Geometry.Point, ee.data.clearAuthToken, ee.Geometry.Polygon, ee.Image.prototype.clip, ee.rpc_convert_batch.taskToExportVideoMapRequest, ee.Image.prototype.getThumbURL, ee.Collection.prototype.filterDate, ee.Geometry.prototype.serialize, ee.data.getTileBaseUrl, 
  ee.Serializer.encodeCloudApiPretty, ee.FeatureCollection.prototype.getInfo, ee.ImageCollection.prototype.getVideoThumbURL, ee.data.getAssetAcl, ee.data.getAuthScopes, ee.reset, ee.data.getDownloadId, ee.Geometry.MultiPoint, ee.data.deleteAsset, ee.data.startTableIngestion, ee.FeatureCollection.prototype.getDownloadURL, ee.Collection.prototype.sort, ee.Serializer.toReadableJSON, ee.Image.prototype.rename, ee.Collection.prototype.iterate, ee.Number, ee.rpc_convert_batch.taskToExportImageRequest, 
  ee.ImageCollection, ee.data.getAsset, ee.data.getAuthToken, ee.batch.Export.image.toCloudStorage, ee.data.createAssetHome, ee.data.getList, ee.Geometry.LinearRing, ee.Geometry.MultiLineString, ee.Date, ee.data.getAuthClientId, ee.batch.Export.image.toAsset, ee.ImageCollection.prototype.first, ee.Feature.prototype.getInfo, ee.ImageCollection.prototype.getInfo, ee.data.createAsset, ee.rpc_convert_batch.taskToExportTableRequest, ee.data.getTaskListWithLimit, ee.data.getAssetRootQuota, ee.Filter.lt, 
  ee.data.updateTask, ee.data.getValue, ee.data.makeDownloadUrl, ee.Feature, ee.data.authenticateViaPrivateKey, ee.Filter.metadata].forEach(function(fn, i) {
    fn && (exportedFnInfo[fn.toString()] = {name:orderedFnNames[i], paramNames:orderedParamLists[i]});
  });
  goog.global.EXPORTED_FN_INFO = exportedFnInfo;
})();

