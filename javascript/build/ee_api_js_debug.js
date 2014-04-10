var goog = goog || {};
goog.global = this;
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split("."), cur = opt_objectToExportTo || goog.global;
  parts[0] in cur || !cur.execScript || cur.execScript("var " + parts[0]);
  for (var part;parts.length && (part = parts.shift());) {
    parts.length || void 0 === opt_object ? cur = cur[part] ? cur[part] : cur[part] = {} : cur[part] = opt_object;
  }
};
goog.define = function(name, defaultValue) {
  goog.exportPath_(name, defaultValue);
};
goog.DEBUG = !0;
goog.LOCALE = "en";
goog.TRUSTED_SITE = !0;
goog.STRICT_MODE_COMPATIBLE = !1;
goog.provide = function(name) {
  var namespace;
  goog.exportPath_(name);
};
goog.setTestOnly = function(opt_message) {
  if (!goog.DEBUG) {
    throw opt_message = opt_message || "", Error("Importing test-only code into non-debug environment" + opt_message ? ": " + opt_message : ".");
  }
};
goog.forwardDeclare = function(name) {
};
goog.getObjectByName = function(name, opt_obj) {
  for (var parts = name.split("."), cur = opt_obj || goog.global, part;part = parts.shift();) {
    if (goog.isDefAndNotNull(cur[part])) {
      cur = cur[part];
    } else {
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
goog.addDependency = function(relPath, provides, requires) {
  if (goog.DEPENDENCIES_ENABLED) {
    for (var provide, require, path = relPath.replace(/\\/g, "/"), deps = goog.dependencies_, i = 0;provide = provides[i];i++) {
      deps.nameToPath[provide] = path, path in deps.pathToNames || (deps.pathToNames[path] = {}), deps.pathToNames[path][provide] = !0;
    }
    for (var j = 0;require = requires[j];j++) {
      path in deps.requires || (deps.requires[path] = {}), deps.requires[path][require] = !0;
    }
  }
};
goog.useStrictRequires = !1;
goog.ENABLE_DEBUG_LOADER = !0;
goog.require = function(name) {
  var errorMessage, path;
};
goog.basePath = "";
goog.nullFunction = function() {
};
goog.identityFunction = function(opt_returnValue, var_args) {
  return opt_returnValue;
};
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    if (ctor.instance_) {
      return ctor.instance_;
    }
    goog.DEBUG && (goog.instantiatedSingletons_[goog.instantiatedSingletons_.length] = ctor);
    return ctor.instance_ = new ctor;
  };
};
goog.instantiatedSingletons_ = [];
goog.DEPENDENCIES_ENABLED = !1;
goog.DEPENDENCIES_ENABLED && (goog.included_ = {}, goog.dependencies_ = {pathToNames:{}, nameToPath:{}, requires:{}, visited:{}, written:{}}, goog.inHtmlDocument_ = function() {
  var doc = goog.global.document;
  return "undefined" != typeof doc && "write" in doc;
}, goog.findBasePath_ = function() {
  if (goog.global.CLOSURE_BASE_PATH) {
    goog.basePath = goog.global.CLOSURE_BASE_PATH;
  } else {
    if (goog.inHtmlDocument_()) {
      for (var scripts = goog.global.document.getElementsByTagName("script"), i = scripts.length - 1;0 <= i;--i) {
        var src = scripts[i].src, qmark = src.lastIndexOf("?"), l = -1 == qmark ? src.length : qmark;
        if ("base.js" == src.substr(l - 7, 7)) {
          goog.basePath = src.substr(0, l - 7);
          break;
        }
      }
    }
  }
}, goog.importScript_ = function(src) {
  var importScript = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_;
  !goog.dependencies_.written[src] && importScript(src) && (goog.dependencies_.written[src] = !0);
}, goog.writeScriptTag_ = function(src) {
  if (goog.inHtmlDocument_()) {
    var doc = goog.global.document;
    if ("complete" == doc.readyState) {
      if (/\bdeps.js$/.test(src)) {
        return!1;
      }
      throw Error('Cannot write "' + src + '" after document load');
    }
    doc.write('<script type="text/javascript" src="' + src + '">\x3c/script>');
    return!0;
  }
  return!1;
}, goog.writeScripts_ = function() {
  function visitNode(path) {
    if (!(path in deps.written)) {
      if (!(path in deps.visited) && (deps.visited[path] = !0, path in deps.requires)) {
        for (var requireName in deps.requires[path]) {
          if (!goog.isProvided_(requireName)) {
            if (requireName in deps.nameToPath) {
              visitNode(deps.nameToPath[requireName]);
            } else {
              throw Error("Undefined nameToPath for " + requireName);
            }
          }
        }
      }
      path in seenScript || (seenScript[path] = !0, scripts.push(path));
    }
  }
  var scripts = [], seenScript = {}, deps = goog.dependencies_, path$$0;
  for (path$$0 in goog.included_) {
    deps.written[path$$0] || visitNode(path$$0);
  }
  for (var i = 0;i < scripts.length;i++) {
    if (scripts[i]) {
      goog.importScript_(goog.basePath + scripts[i]);
    } else {
      throw Error("Undefined script input");
    }
  }
}, goog.getPathFromDeps_ = function(rule) {
  return rule in goog.dependencies_.nameToPath ? goog.dependencies_.nameToPath[rule] : null;
}, goog.findBasePath_(), goog.global.CLOSURE_NO_DEPS || goog.importScript_(goog.basePath + "deps.js"));
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
goog.isDef = function(val) {
  return void 0 !== val;
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
goog.isString = function(val) {
  return "string" == typeof val;
};
goog.isBoolean = function(val) {
  return "boolean" == typeof val;
};
goog.isNumber = function(val) {
  return "number" == typeof val;
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
  return!!obj[goog.UID_PROPERTY_];
};
goog.removeUid = function(obj) {
  "removeAttribute" in obj && obj.removeAttribute(goog.UID_PROPERTY_);
  try {
    delete obj[goog.UID_PROPERTY_];
  } catch (ex) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + (1E9 * Math.random() >>> 0);
goog.uidCounter_ = 0;
goog.getHashCode = goog.getUid;
goog.removeHashCode = goog.removeUid;
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if ("object" == type || "array" == type) {
    if (obj.clone) {
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
  return+new Date;
};
goog.globalEval = function(script) {
  if (goog.global.execScript) {
    goog.global.execScript(script, "JavaScript");
  } else {
    if (goog.global.eval) {
      if (null == goog.evalWorksForGlobals_ && (goog.global.eval("var _et_ = 1;"), "undefined" != typeof goog.global._et_ ? (delete goog.global._et_, goog.evalWorksForGlobals_ = !0) : goog.evalWorksForGlobals_ = !1), goog.evalWorksForGlobals_) {
        goog.global.eval(script);
      } else {
        var doc = goog.global.document, scriptElt = doc.createElement("script");
        scriptElt.type = "text/javascript";
        scriptElt.defer = !1;
        scriptElt.appendChild(doc.createTextNode(script));
        doc.body.appendChild(scriptElt);
        doc.body.removeChild(scriptElt);
      }
    } else {
      throw Error("goog.globalEval not available");
    }
  }
};
goog.evalWorksForGlobals_ = null;
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName;
  }, renameByParts = function(cssName) {
    for (var parts = cssName.split("-"), mapped = [], i = 0;i < parts.length;i++) {
      mapped.push(getMapping(parts[i]));
    }
    return mapped.join("-");
  }, rename;
  rename = goog.cssNameMapping_ ? "BY_WHOLE" == goog.cssNameMappingStyle_ ? getMapping : renameByParts : function(a) {
    return a;
  };
  return opt_modifier ? className + "-" + rename(opt_modifier) : rename(className);
};
goog.setCssNameMapping = function(mapping, opt_style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = opt_style;
};
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {}, key;
  for (key in values) {
    var value = ("" + values[key]).replace(/\$/g, "$$$$");
    str = str.replace(RegExp("\\{\\$" + key + "\\}", "gi"), value);
  }
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
    var args = Array.prototype.slice.call(arguments, 2);
    return parentCtor.prototype[methodName].apply(me, args);
  };
};
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if (goog.STRICT_MODE_COMPATIBLE || goog.DEBUG && !caller) {
    throw Error("arguments.caller not defined.  goog.base() cannot be used with strict mode code. See http://www.ecma-international.org/ecma-262/5.1/#sec-C");
  }
  if (caller.superClass_) {
    return caller.superClass_.constructor.apply(me, Array.prototype.slice.call(arguments, 1));
  }
  for (var args = Array.prototype.slice.call(arguments, 2), foundCaller = !1, ctor = me.constructor;ctor;ctor = ctor.superClass_ && ctor.superClass_.constructor) {
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
  fn.call(goog.global);
};
goog.MODIFY_FUNCTION_PROTOTYPES = !0;
goog.MODIFY_FUNCTION_PROTOTYPES && (Function.prototype.bind = Function.prototype.bind || function(selfObj, var_args) {
  if (1 < arguments.length) {
    var args = Array.prototype.slice.call(arguments, 1);
    args.unshift(this, selfObj);
    return goog.bind.apply(null, args);
  }
  return goog.bind(this, selfObj);
}, Function.prototype.partial = function(var_args) {
  var args = Array.prototype.slice.call(arguments);
  args.unshift(this, null);
  return goog.bind.apply(null, args);
}, Function.prototype.inherits = function(parentCtor) {
  goog.inherits(this, parentCtor);
}, Function.prototype.mixin = function(source) {
  goog.mixin(this.prototype, source);
});
goog.object = {};
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
      return!0;
    }
  }
  return!1;
};
goog.object.every = function(obj, f, opt_obj) {
  for (var key in obj) {
    if (!f.call(opt_obj, obj[key], key, obj)) {
      return!1;
    }
  }
  return!0;
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
  for (var isArrayLike = goog.isArrayLike(var_args), keys = isArrayLike ? var_args : arguments, i = isArrayLike ? 0 : 1;i < keys.length && (obj = obj[keys[i]], goog.isDef(obj));i++) {
  }
  return obj;
};
goog.object.containsKey = function(obj, key) {
  return key in obj;
};
goog.object.containsValue = function(obj, val) {
  for (var key in obj) {
    if (obj[key] == val) {
      return!0;
    }
  }
  return!1;
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
    return!1;
  }
  return!0;
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
  if (key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val);
};
goog.object.get = function(obj, key, opt_val) {
  return key in obj ? obj[key] : opt_val;
};
goog.object.set = function(obj, key, value) {
  obj[key] = value;
};
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : obj[key] = value;
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
    if (obj.clone) {
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
  for (var key, source, i = 1;i < arguments.length;i++) {
    source = arguments[i];
    for (key in source) {
      target[key] = source[key];
    }
    for (var j = 0;j < goog.object.PROTOTYPE_FIELDS_.length;j++) {
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
  for (var rv = {}, i = 0;i < argLength;i += 2) {
    rv[arguments[i]] = arguments[i + 1];
  }
  return rv;
};
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if (1 == argLength && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0]);
  }
  for (var rv = {}, i = 0;i < argLength;i++) {
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
  return!!Object.isFrozen && Object.isFrozen(obj);
};
goog.json = {};
goog.json.USE_NATIVE_JSON = !1;
goog.json.isValid_ = function(s) {
  return/^\s*$/.test(s) ? !1 : /^[\],:{}\s\u2028\u2029]*$/.test(s.replace(/\\["\\\/bfnrtu]/g, "@").replace(/"[^"\\\n\r\u2028\u2029\x00-\x08\x0a-\x1f]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, "]").replace(/(?:^|:|,)(?:[\s\u2028\u2029]*\[)+/g, ""));
};
goog.json.parse = goog.json.USE_NATIVE_JSON ? goog.global.JSON.parse : function(s) {
  var o = String(s);
  if (goog.json.isValid_(o)) {
    try {
      return eval("(" + o + ")");
    } catch (ex) {
    }
  }
  throw Error("Invalid JSON string: " + o);
};
goog.json.unsafeParse = goog.json.USE_NATIVE_JSON ? goog.global.JSON.parse : function(s) {
  return eval("(" + s + ")");
};
goog.json.serialize = goog.json.USE_NATIVE_JSON ? goog.global.JSON.stringify : function(object, opt_replacer) {
  return(new goog.json.Serializer(opt_replacer)).serialize(object);
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
  switch(typeof object) {
    case "string":
      this.serializeString_(object, sb);
      break;
    case "number":
      this.serializeNumber_(object, sb);
      break;
    case "boolean":
      sb.push(object);
      break;
    case "undefined":
      sb.push("null");
      break;
    case "object":
      if (null == object) {
        sb.push("null");
        break;
      }
      if (goog.isArray(object)) {
        this.serializeArray(object, sb);
        break;
      }
      this.serializeObject_(object, sb);
      break;
    case "function":
      break;
    default:
      throw Error("Unknown type: " + typeof object);;
  }
};
goog.json.Serializer.charToJsonCharCache_ = {'"':'\\"', "\\":"\\\\", "/":"\\/", "\b":"\\b", "\f":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\u000b"};
goog.json.Serializer.charsToReplace_ = /\uffff/.test("\uffff") ? /[\\\"\x00-\x1f\x7f-\uffff]/g : /[\\\"\x00-\x1f\x7f-\xff]/g;
goog.json.Serializer.prototype.serializeString_ = function(s, sb) {
  sb.push('"', s.replace(goog.json.Serializer.charsToReplace_, function(c) {
    if (c in goog.json.Serializer.charToJsonCharCache_) {
      return goog.json.Serializer.charToJsonCharCache_[c];
    }
    var cc = c.charCodeAt(0), rv = "\\u";
    16 > cc ? rv += "000" : 256 > cc ? rv += "00" : 4096 > cc && (rv += "0");
    return goog.json.Serializer.charToJsonCharCache_[c] = rv + cc.toString(16);
  }), '"');
};
goog.json.Serializer.prototype.serializeNumber_ = function(n, sb) {
  sb.push(isFinite(n) && !isNaN(n) ? n : "null");
};
goog.json.Serializer.prototype.serializeArray = function(arr, sb) {
  var l = arr.length;
  sb.push("[");
  for (var sep = "", i = 0;i < l;i++) {
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
goog.debug = {};
goog.debug.Error = function(opt_msg) {
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, goog.debug.Error);
  } else {
    var stack = Error().stack;
    stack && (this.stack = stack);
  }
  opt_msg && (this.message = String(opt_msg));
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
goog.dom = {};
goog.dom.NodeType = {ELEMENT:1, ATTRIBUTE:2, TEXT:3, CDATA_SECTION:4, ENTITY_REFERENCE:5, ENTITY:6, PROCESSING_INSTRUCTION:7, COMMENT:8, DOCUMENT:9, DOCUMENT_TYPE:10, DOCUMENT_FRAGMENT:11, NOTATION:12};
goog.string = {};
goog.string.Unicode = {NBSP:"\u00a0"};
goog.string.startsWith = function(str, prefix) {
  return 0 == str.lastIndexOf(prefix, 0);
};
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return 0 <= l && str.indexOf(suffix, l) == l;
};
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return 0 == goog.string.caseInsensitiveCompare(prefix, str.substr(0, prefix.length));
};
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return 0 == goog.string.caseInsensitiveCompare(suffix, str.substr(str.length - suffix.length, suffix.length));
};
goog.string.caseInsensitiveEquals = function(str1, str2) {
  return str1.toLowerCase() == str2.toLowerCase();
};
goog.string.subs = function(str, var_args) {
  for (var splitParts = str.split("%s"), returnString = "", subsArguments = Array.prototype.slice.call(arguments, 1);subsArguments.length && 1 < splitParts.length;) {
    returnString += splitParts.shift() + subsArguments.shift();
  }
  return returnString + splitParts.join("%s");
};
goog.string.collapseWhitespace = function(str) {
  return str.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "");
};
goog.string.isEmpty = function(str) {
  return/^[\s\xa0]*$/.test(str);
};
goog.string.isEmptySafe = function(str) {
  return goog.string.isEmpty(goog.string.makeSafe(str));
};
goog.string.isBreakingWhitespace = function(str) {
  return!/[^\t\n\r ]/.test(str);
};
goog.string.isAlpha = function(str) {
  return!/[^a-zA-Z]/.test(str);
};
goog.string.isNumeric = function(str) {
  return!/[^0-9]/.test(str);
};
goog.string.isAlphaNumeric = function(str) {
  return!/[^a-zA-Z0-9]/.test(str);
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
goog.string.trim = function(str) {
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "");
};
goog.string.trimLeft = function(str) {
  return str.replace(/^[\s\xa0]+/, "");
};
goog.string.trimRight = function(str) {
  return str.replace(/[\s\xa0]+$/, "");
};
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase(), test2 = String(str2).toLowerCase();
  return test1 < test2 ? -1 : test1 == test2 ? 0 : 1;
};
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;
goog.string.numerateCompare = function(str1, str2) {
  if (str1 == str2) {
    return 0;
  }
  if (!str1) {
    return-1;
  }
  if (!str2) {
    return 1;
  }
  for (var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_), tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_), count = Math.min(tokens1.length, tokens2.length), i = 0;i < count;i++) {
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
goog.string.urlEncode = function(str) {
  return encodeURIComponent(String(str));
};
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, " "));
};
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? "<br />" : "<br>");
};
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {
  if (opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, "&amp;").replace(goog.string.ltRe_, "&lt;").replace(goog.string.gtRe_, "&gt;").replace(goog.string.quotRe_, "&quot;").replace(goog.string.singleQuoteRe_, "&#39;");
  }
  if (!goog.string.allRe_.test(str)) {
    return str;
  }
  -1 != str.indexOf("&") && (str = str.replace(goog.string.amperRe_, "&amp;"));
  -1 != str.indexOf("<") && (str = str.replace(goog.string.ltRe_, "&lt;"));
  -1 != str.indexOf(">") && (str = str.replace(goog.string.gtRe_, "&gt;"));
  -1 != str.indexOf('"') && (str = str.replace(goog.string.quotRe_, "&quot;"));
  -1 != str.indexOf("'") && (str = str.replace(goog.string.singleQuoteRe_, "&#39;"));
  return str;
};
goog.string.amperRe_ = /&/g;
goog.string.ltRe_ = /</g;
goog.string.gtRe_ = />/g;
goog.string.quotRe_ = /"/g;
goog.string.singleQuoteRe_ = /'/g;
goog.string.allRe_ = /[&<>"']/;
goog.string.unescapeEntities = function(str) {
  return goog.string.contains(str, "&") ? "document" in goog.global ? goog.string.unescapeEntitiesUsingDom_(str) : goog.string.unescapePureXmlEntities_(str) : str;
};
goog.string.unescapeEntitiesWithDocument = function(str, document) {
  return goog.string.contains(str, "&") ? goog.string.unescapeEntitiesUsingDom_(str, document) : str;
};
goog.string.unescapeEntitiesUsingDom_ = function(str, opt_document) {
  var seen = {"&amp;":"&", "&lt;":"<", "&gt;":">", "&quot;":'"'}, div;
  div = opt_document ? opt_document.createElement("div") : document.createElement("div");
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
        return'"';
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
goog.string.stripQuotes = function(str, quoteChars) {
  for (var length = quoteChars.length, i = 0;i < length;i++) {
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
      var half = Math.floor(chars / 2), endPos = str.length - half;
      str = str.substring(0, half + chars % 2) + "..." + str.substring(endPos);
    }
  }
  opt_protectEscapedCharacters && (str = goog.string.htmlEscape(str));
  return str;
};
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\b":"\\b", "\f":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\x0B", '"':'\\"', "\\":"\\\\"};
goog.string.jsEscapeCache_ = {"'":"\\'"};
goog.string.quote = function(s) {
  s = String(s);
  if (s.quote) {
    return s.quote();
  }
  for (var sb = ['"'], i = 0;i < s.length;i++) {
    var ch = s.charAt(i), cc = ch.charCodeAt(0);
    sb[i + 1] = goog.string.specialEscapeChars_[ch] || (31 < cc && 127 > cc ? ch : goog.string.escapeChar(ch));
  }
  sb.push('"');
  return sb.join("");
};
goog.string.escapeString = function(str) {
  for (var sb = [], i = 0;i < str.length;i++) {
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
goog.string.toMap = function(s) {
  for (var rv = {}, i = 0;i < s.length;i++) {
    rv[s.charAt(i)] = !0;
  }
  return rv;
};
goog.string.contains = function(str, subString) {
  return-1 != str.indexOf(subString);
};
goog.string.caseInsensitiveContains = function(str, subString) {
  return goog.string.contains(str.toLowerCase(), subString.toLowerCase());
};
goog.string.countOf = function(s, ss) {
  return s && ss ? s.split(ss).length - 1 : 0;
};
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  0 <= index && index < s.length && 0 < stringLength && (resultStr = s.substr(0, index) + s.substr(index + stringLength, s.length - index - stringLength));
  return resultStr;
};
goog.string.remove = function(s, ss) {
  var re = RegExp(goog.string.regExpEscape(ss), "");
  return s.replace(re, "");
};
goog.string.removeAll = function(s, ss) {
  var re = RegExp(goog.string.regExpEscape(ss), "g");
  return s.replace(re, "");
};
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08");
};
goog.string.repeat = function(string, length) {
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
goog.string.compareVersions = function(version1, version2) {
  for (var order = 0, v1Subs = goog.string.trim(String(version1)).split("."), v2Subs = goog.string.trim(String(version2)).split("."), subCount = Math.max(v1Subs.length, v2Subs.length), subIdx = 0;0 == order && subIdx < subCount;subIdx++) {
    var v1Sub = v1Subs[subIdx] || "", v2Sub = v2Subs[subIdx] || "", v1CompParser = RegExp("(\\d*)(\\D*)", "g"), v2CompParser = RegExp("(\\d*)(\\D*)", "g");
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ["", "", ""], v2Comp = v2CompParser.exec(v2Sub) || ["", "", ""];
      if (0 == v1Comp[0].length && 0 == v2Comp[0].length) {
        break;
      }
      order = goog.string.compareElements_(0 == v1Comp[1].length ? 0 : parseInt(v1Comp[1], 10), 0 == v2Comp[1].length ? 0 : parseInt(v2Comp[1], 10)) || goog.string.compareElements_(0 == v1Comp[2].length, 0 == v2Comp[2].length) || goog.string.compareElements_(v1Comp[2], v2Comp[2]);
    } while (0 == order);
  }
  return order;
};
goog.string.compareElements_ = function(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
};
goog.string.HASHCODE_MAX_ = 4294967296;
goog.string.hashCode = function(str) {
  for (var result = 0, i = 0;i < str.length;++i) {
    result = 31 * result + str.charCodeAt(i), result %= goog.string.HASHCODE_MAX_;
  }
  return result;
};
goog.string.uniqueStringCounter_ = 2147483648 * Math.random() | 0;
goog.string.createUniqueString = function() {
  return "goog_" + goog.string.uniqueStringCounter_++;
};
goog.string.toNumber = function(str) {
  var num = Number(str);
  return 0 == num && goog.string.isEmpty(str) ? NaN : num;
};
goog.string.isLowerCamelCase = function(str) {
  return/^[a-z]+([A-Z][a-z]*)*$/.test(str);
};
goog.string.isUpperCamelCase = function(str) {
  return/^([A-Z][a-z]*)+$/.test(str);
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
  return str.replace(RegExp("(^" + (delimiters ? "|[" + delimiters + "]+" : "") + ")([a-z])", "g"), function(all, p1, p2) {
    return p1 + p2.toUpperCase();
  });
};
goog.string.parseInt = function(value) {
  isFinite(value) && (value = String(value));
  return goog.isString(value) ? /^\s*-?0x/i.test(value) ? parseInt(value, 16) : parseInt(value, 10) : NaN;
};
goog.string.splitLimit = function(str, separator, limit) {
  for (var parts = str.split(separator), returnVal = [];0 < limit && parts.length;) {
    returnVal.push(parts.shift()), limit--;
  }
  parts.length && returnVal.push(parts.join(separator));
  return returnVal;
};
goog.asserts = {};
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  messageArgs.shift();
  this.messagePattern = messagePattern;
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);
goog.asserts.AssertionError.prototype.name = "AssertionError";
goog.asserts.doAssertFailure_ = function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = "Assertion failed";
  if (givenMessage) {
    var message = message + (": " + givenMessage), args = givenArgs
  } else {
    defaultMessage && (message += ": " + defaultMessage, args = defaultArgs);
  }
  throw new goog.asserts.AssertionError("" + message, args || []);
};
goog.asserts.assert = function(condition, opt_message, var_args) {
  goog.asserts.ENABLE_ASSERTS && !condition && goog.asserts.doAssertFailure_("", null, opt_message, Array.prototype.slice.call(arguments, 2));
  return condition;
};
goog.asserts.fail = function(opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError("Failure" + (opt_message ? ": " + opt_message : ""), Array.prototype.slice.call(arguments, 1));
  }
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
  !goog.asserts.ENABLE_ASSERTS || value instanceof type || goog.asserts.doAssertFailure_("instanceof check failed.", null, opt_message, Array.prototype.slice.call(arguments, 3));
  return value;
};
goog.asserts.assertObjectPrototypeIsIntact = function() {
  for (var key in Object.prototype) {
    goog.asserts.fail(key + " should not be enumerable in Object.prototype.");
  }
};
goog.array = {};
goog.NATIVE_ARRAY_PROTOTYPES = goog.TRUSTED_SITE;
goog.array.ASSUME_NATIVE_FUNCTIONS = !1;
goog.array.peek = function(array) {
  return array[array.length - 1];
};
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES && (goog.array.ASSUME_NATIVE_FUNCTIONS || goog.array.ARRAY_PROTOTYPE_.indexOf) ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(null != arr.length);
  return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex);
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = null == opt_fromIndex ? 0 : 0 > opt_fromIndex ? Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex;
  if (goog.isString(arr)) {
    return goog.isString(obj) && 1 == obj.length ? arr.indexOf(obj, fromIndex) : -1;
  }
  for (var i = fromIndex;i < arr.length;i++) {
    if (i in arr && arr[i] === obj) {
      return i;
    }
  }
  return-1;
};
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES && (goog.array.ASSUME_NATIVE_FUNCTIONS || goog.array.ARRAY_PROTOTYPE_.lastIndexOf) ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(null != arr.length);
  return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, null == opt_fromIndex ? arr.length - 1 : opt_fromIndex);
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = null == opt_fromIndex ? arr.length - 1 : opt_fromIndex;
  0 > fromIndex && (fromIndex = Math.max(0, arr.length + fromIndex));
  if (goog.isString(arr)) {
    return goog.isString(obj) && 1 == obj.length ? arr.lastIndexOf(obj, fromIndex) : -1;
  }
  for (var i = fromIndex;0 <= i;i--) {
    if (i in arr && arr[i] === obj) {
      return i;
    }
  }
  return-1;
};
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES && (goog.array.ASSUME_NATIVE_FUNCTIONS || goog.array.ARRAY_PROTOTYPE_.forEach) ? function(arr, f, opt_obj) {
  goog.asserts.assert(null != arr.length);
  goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj);
} : function(arr, f, opt_obj) {
  for (var l = arr.length, arr2 = goog.isString(arr) ? arr.split("") : arr, i = 0;i < l;i++) {
    i in arr2 && f.call(opt_obj, arr2[i], i, arr);
  }
};
goog.array.forEachRight = function(arr, f, opt_obj) {
  for (var l = arr.length, arr2 = goog.isString(arr) ? arr.split("") : arr, i = l - 1;0 <= i;--i) {
    i in arr2 && f.call(opt_obj, arr2[i], i, arr);
  }
};
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES && (goog.array.ASSUME_NATIVE_FUNCTIONS || goog.array.ARRAY_PROTOTYPE_.filter) ? function(arr, f, opt_obj) {
  goog.asserts.assert(null != arr.length);
  return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj);
} : function(arr, f, opt_obj) {
  for (var l = arr.length, res = [], resLength = 0, arr2 = goog.isString(arr) ? arr.split("") : arr, i = 0;i < l;i++) {
    if (i in arr2) {
      var val = arr2[i];
      f.call(opt_obj, val, i, arr) && (res[resLength++] = val);
    }
  }
  return res;
};
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES && (goog.array.ASSUME_NATIVE_FUNCTIONS || goog.array.ARRAY_PROTOTYPE_.map) ? function(arr, f, opt_obj) {
  goog.asserts.assert(null != arr.length);
  return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj);
} : function(arr, f, opt_obj) {
  for (var l = arr.length, res = Array(l), arr2 = goog.isString(arr) ? arr.split("") : arr, i = 0;i < l;i++) {
    i in arr2 && (res[i] = f.call(opt_obj, arr2[i], i, arr));
  }
  return res;
};
goog.array.reduce = goog.NATIVE_ARRAY_PROTOTYPES && (goog.array.ASSUME_NATIVE_FUNCTIONS || goog.array.ARRAY_PROTOTYPE_.reduce) ? function(arr, f, val, opt_obj) {
  goog.asserts.assert(null != arr.length);
  opt_obj && (f = goog.bind(f, opt_obj));
  return goog.array.ARRAY_PROTOTYPE_.reduce.call(arr, f, val);
} : function(arr, f, val$$0, opt_obj) {
  var rval = val$$0;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr);
  });
  return rval;
};
goog.array.reduceRight = goog.NATIVE_ARRAY_PROTOTYPES && (goog.array.ASSUME_NATIVE_FUNCTIONS || goog.array.ARRAY_PROTOTYPE_.reduceRight) ? function(arr, f, val, opt_obj) {
  goog.asserts.assert(null != arr.length);
  opt_obj && (f = goog.bind(f, opt_obj));
  return goog.array.ARRAY_PROTOTYPE_.reduceRight.call(arr, f, val);
} : function(arr, f, val$$0, opt_obj) {
  var rval = val$$0;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr);
  });
  return rval;
};
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES && (goog.array.ASSUME_NATIVE_FUNCTIONS || goog.array.ARRAY_PROTOTYPE_.some) ? function(arr, f, opt_obj) {
  goog.asserts.assert(null != arr.length);
  return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj);
} : function(arr, f, opt_obj) {
  for (var l = arr.length, arr2 = goog.isString(arr) ? arr.split("") : arr, i = 0;i < l;i++) {
    if (i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return!0;
    }
  }
  return!1;
};
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES && (goog.array.ASSUME_NATIVE_FUNCTIONS || goog.array.ARRAY_PROTOTYPE_.every) ? function(arr, f, opt_obj) {
  goog.asserts.assert(null != arr.length);
  return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj);
} : function(arr, f, opt_obj) {
  for (var l = arr.length, arr2 = goog.isString(arr) ? arr.split("") : arr, i = 0;i < l;i++) {
    if (i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
      return!1;
    }
  }
  return!0;
};
goog.array.count = function(arr$$0, f, opt_obj) {
  var count = 0;
  goog.array.forEach(arr$$0, function(element, index, arr) {
    f.call(opt_obj, element, index, arr) && ++count;
  }, opt_obj);
  return count;
};
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return 0 > i ? null : goog.isString(arr) ? arr.charAt(i) : arr[i];
};
goog.array.findIndex = function(arr, f, opt_obj) {
  for (var l = arr.length, arr2 = goog.isString(arr) ? arr.split("") : arr, i = 0;i < l;i++) {
    if (i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i;
    }
  }
  return-1;
};
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return 0 > i ? null : goog.isString(arr) ? arr.charAt(i) : arr[i];
};
goog.array.findIndexRight = function(arr, f, opt_obj) {
  for (var l = arr.length, arr2 = goog.isString(arr) ? arr.split("") : arr, i = l - 1;0 <= i;i--) {
    if (i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i;
    }
  }
  return-1;
};
goog.array.contains = function(arr, obj) {
  return 0 <= goog.array.indexOf(arr, obj);
};
goog.array.isEmpty = function(arr) {
  return 0 == arr.length;
};
goog.array.clear = function(arr) {
  if (!goog.isArray(arr)) {
    for (var i = arr.length - 1;0 <= i;i--) {
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
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(null != arr.length);
  return 1 == goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length;
};
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return 0 <= i ? (goog.array.removeAt(arr, i), !0) : !1;
};
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(goog.array.ARRAY_PROTOTYPE_, arguments);
};
goog.array.join = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(goog.array.ARRAY_PROTOTYPE_, arguments);
};
goog.array.toArray = function(object) {
  var length = object.length;
  if (0 < length) {
    for (var rv = Array(length), i = 0;i < length;i++) {
      rv[i] = object[i];
    }
    return rv;
  }
  return[];
};
goog.array.clone = goog.array.toArray;
goog.array.extend = function(arr1, var_args) {
  for (var i = 1;i < arguments.length;i++) {
    var arr2 = arguments[i], isArrayLike;
    if (goog.isArray(arr2) || (isArrayLike = goog.isArrayLike(arr2)) && Object.prototype.hasOwnProperty.call(arr2, "callee")) {
      arr1.push.apply(arr1, arr2);
    } else {
      if (isArrayLike) {
        for (var len1 = arr1.length, len2 = arr2.length, j = 0;j < len2;j++) {
          arr1[len1 + j] = arr2[j];
        }
      } else {
        arr1.push(arr2);
      }
    }
  }
};
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(null != arr.length);
  return goog.array.ARRAY_PROTOTYPE_.splice.apply(arr, goog.array.slice(arguments, 1));
};
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(null != arr.length);
  return 2 >= arguments.length ? goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start) : goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end);
};
goog.array.removeDuplicates = function(arr, opt_rv, opt_hashFn) {
  for (var returnArray = opt_rv || arr, defaultHashFn = function(item) {
    return goog.isObject(current) ? "o" + goog.getUid(current) : (typeof current).charAt(0) + current;
  }, hashFn = opt_hashFn || defaultHashFn, seen = {}, cursorInsert = 0, cursorRead = 0;cursorRead < arr.length;) {
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
  for (var left = 0, right = arr.length, found;left < right;) {
    var middle = left + right >> 1, compareResult;
    compareResult = isEvaluator ? compareFn.call(opt_selfObj, arr[middle], middle, arr) : compareFn(opt_target, arr[middle]);
    0 < compareResult ? left = middle + 1 : (right = middle, found = !compareResult);
  }
  return found ? left : ~left;
};
goog.array.sort = function(arr, opt_compareFn) {
  arr.sort(opt_compareFn || goog.array.defaultCompare);
};
goog.array.stableSort = function(arr, opt_compareFn) {
  for (var i = 0;i < arr.length;i++) {
    arr[i] = {index:i, value:arr[i]};
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index;
  });
  for (i = 0;i < arr.length;i++) {
    arr[i] = arr[i].value;
  }
};
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return compare(a[key], b[key]);
  });
};
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  for (var compare = opt_compareFn || goog.array.defaultCompare, i = 1;i < arr.length;i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if (0 < compareResult || 0 == compareResult && opt_strict) {
      return!1;
    }
  }
  return!0;
};
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if (!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) || arr1.length != arr2.length) {
    return!1;
  }
  for (var l = arr1.length, equalsFn = opt_equalsFn || goog.array.defaultCompareEquality, i = 0;i < l;i++) {
    if (!equalsFn(arr1[i], arr2[i])) {
      return!1;
    }
  }
  return!0;
};
goog.array.compare3 = function(arr1, arr2, opt_compareFn) {
  for (var compare = opt_compareFn || goog.array.defaultCompare, l = Math.min(arr1.length, arr2.length), i = 0;i < l;i++) {
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
  for (var buckets = {}, i = 0;i < array.length;i++) {
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
    return[];
  }
  if (0 < step) {
    for (var i = start;i < end;i += step) {
      array.push(i);
    }
  } else {
    for (i = start;i > end;i += step) {
      array.push(i);
    }
  }
  return array;
};
goog.array.repeat = function(value, n) {
  for (var array = [], i = 0;i < n;i++) {
    array[i] = value;
  }
  return array;
};
goog.array.flatten = function(var_args) {
  for (var result = [], i = 0;i < arguments.length;i++) {
    var element = arguments[i];
    goog.isArray(element) ? result.push.apply(result, goog.array.flatten.apply(null, element)) : result.push(element);
  }
  return result;
};
goog.array.rotate = function(array, n) {
  goog.asserts.assert(null != array.length);
  array.length && (n %= array.length, 0 < n ? goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n)) : 0 > n && goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n)));
  return array;
};
goog.array.moveItem = function(arr, fromIndex, toIndex) {
  goog.asserts.assert(0 <= fromIndex && fromIndex < arr.length);
  goog.asserts.assert(0 <= toIndex && toIndex < arr.length);
  var removedItems = goog.array.ARRAY_PROTOTYPE_.splice.call(arr, fromIndex, 1);
  goog.array.ARRAY_PROTOTYPE_.splice.call(arr, toIndex, 0, removedItems[0]);
};
goog.array.zip = function(var_args) {
  if (!arguments.length) {
    return[];
  }
  for (var result = [], i = 0;;i++) {
    for (var value = [], j = 0;j < arguments.length;j++) {
      var arr = arguments[j];
      if (i >= arr.length) {
        return result;
      }
      value.push(arr[i]);
    }
    result.push(value);
  }
};
goog.array.shuffle = function(arr, opt_randFn) {
  for (var randFn = opt_randFn || Math.random, i = arr.length - 1;0 < i;i--) {
    var j = Math.floor(randFn() * (i + 1)), tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
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
    for (var monitors = goog.debug.entryPointRegistry.monitors_, i = 0;i < monitors.length;i++) {
      callback(goog.bind(monitors[i].wrap, monitors[i]));
    }
  }
};
goog.debug.entryPointRegistry.monitorAll = function(monitor) {
  goog.debug.entryPointRegistry.monitorsMayExist_ = !0;
  for (var transformer = goog.bind(monitor.wrap, monitor), i = 0;i < goog.debug.entryPointRegistry.refList_.length;i++) {
    goog.debug.entryPointRegistry.refList_[i](transformer);
  }
  goog.debug.entryPointRegistry.monitors_.push(monitor);
};
goog.debug.entryPointRegistry.unmonitorAllIfPossible = function(monitor) {
  var monitors = goog.debug.entryPointRegistry.monitors_;
  goog.asserts.assert(monitor == monitors[monitors.length - 1], "Only the most recent monitor can be unwrapped.");
  for (var transformer = goog.bind(monitor.unwrap, monitor), i = 0;i < goog.debug.entryPointRegistry.refList_.length;i++) {
    goog.debug.entryPointRegistry.refList_[i](transformer);
  }
  monitors.length--;
};
goog.disposable = {};
goog.disposable.IDisposable = function() {
};
goog.Disposable = function() {
  goog.Disposable.MONITORING_MODE != goog.Disposable.MonitoringMode.OFF && (goog.Disposable.INCLUDE_STACK_ON_CREATION && (this.creationStack = Error().stack), goog.Disposable.instances_[goog.getUid(this)] = this);
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
    delete goog.Disposable.instances_[uid];
  }
};
goog.Disposable.prototype.registerDisposable = function(disposable) {
  this.addOnDisposeCallback(goog.partial(goog.dispose, disposable));
};
goog.Disposable.prototype.addOnDisposeCallback = function(callback, opt_scope) {
  this.onDisposeCallbacks_ || (this.onDisposeCallbacks_ = []);
  this.onDisposeCallbacks_.push(goog.bind(callback, opt_scope));
};
goog.Disposable.prototype.disposeInternal = function() {
  if (this.onDisposeCallbacks_) {
    for (;this.onDisposeCallbacks_.length;) {
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
  for (var i = 0, len = arguments.length;i < len;++i) {
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
goog.events.Event.prototype.disposeInternal = function() {
};
goog.events.Event.prototype.dispose = function() {
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
goog.reflect = {};
goog.reflect.object = function(type, object) {
  return object;
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
  return!1;
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
  return goog.string.contains(goog.labs.userAgent.util.getUserAgent(), str);
};
goog.labs.userAgent.util.matchUserAgentIgnoreCase = function(str) {
  return goog.string.caseInsensitiveContains(goog.labs.userAgent.util.getUserAgent(), str);
};
goog.labs.userAgent.util.extractVersionTuples = function(userAgent) {
  for (var versionRegExp = RegExp("(\\w[\\w ]+)/([^\\s]+)\\s*(?:\\((.*?)\\))?", "g"), data = [], match;match = versionRegExp.exec(userAgent);) {
    data.push([match[1], match[2], match[3] || void 0]);
  }
  return data;
};
goog.labs.userAgent.browser = {};
goog.labs.userAgent.browser.matchOpera_ = function() {
  return goog.labs.userAgent.util.matchUserAgent("Opera") || goog.labs.userAgent.util.matchUserAgent("OPR");
};
goog.labs.userAgent.browser.matchIE_ = function() {
  return goog.labs.userAgent.util.matchUserAgent("Trident") || goog.labs.userAgent.util.matchUserAgent("MSIE");
};
goog.labs.userAgent.browser.matchFirefox_ = function() {
  return goog.labs.userAgent.util.matchUserAgent("Firefox");
};
goog.labs.userAgent.browser.matchSafari_ = function() {
  return goog.labs.userAgent.util.matchUserAgent("Safari") && !goog.labs.userAgent.util.matchUserAgent("Chrome") && !goog.labs.userAgent.util.matchUserAgent("CriOS") && !goog.labs.userAgent.util.matchUserAgent("Android");
};
goog.labs.userAgent.browser.matchChrome_ = function() {
  return goog.labs.userAgent.util.matchUserAgent("Chrome") || goog.labs.userAgent.util.matchUserAgent("CriOS");
};
goog.labs.userAgent.browser.matchAndroidBrowser_ = function() {
  return goog.labs.userAgent.util.matchUserAgent("Android") && !goog.labs.userAgent.util.matchUserAgent("Chrome") && !goog.labs.userAgent.util.matchUserAgent("CriOS");
};
goog.labs.userAgent.browser.isOpera = goog.labs.userAgent.browser.matchOpera_;
goog.labs.userAgent.browser.isIE = goog.labs.userAgent.browser.matchIE_;
goog.labs.userAgent.browser.isFirefox = goog.labs.userAgent.browser.matchFirefox_;
goog.labs.userAgent.browser.isSafari = goog.labs.userAgent.browser.matchSafari_;
goog.labs.userAgent.browser.isChrome = goog.labs.userAgent.browser.matchChrome_;
goog.labs.userAgent.browser.isAndroidBrowser = goog.labs.userAgent.browser.matchAndroidBrowser_;
goog.labs.userAgent.browser.isSilk = function() {
  return goog.labs.userAgent.util.matchUserAgent("Silk");
};
goog.labs.userAgent.browser.getVersion = function() {
  var userAgentString = goog.labs.userAgent.util.getUserAgent();
  if (goog.labs.userAgent.browser.isIE()) {
    return goog.labs.userAgent.browser.getIEVersion_(userAgentString);
  }
  if (goog.labs.userAgent.browser.isOpera()) {
    return goog.labs.userAgent.browser.getOperaVersion_(userAgentString);
  }
  var versionTuples = goog.labs.userAgent.util.extractVersionTuples(userAgentString);
  return goog.labs.userAgent.browser.getVersionFromTuples_(versionTuples);
};
goog.labs.userAgent.browser.isVersionOrHigher = function(version) {
  return 0 <= goog.string.compareVersions(goog.labs.userAgent.browser.getVersion(), version);
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
            break;
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
goog.labs.userAgent.browser.getOperaVersion_ = function(userAgent) {
  var versionTuples = goog.labs.userAgent.util.extractVersionTuples(userAgent), lastTuple = goog.array.peek(versionTuples);
  return "OPR" == lastTuple[0] && lastTuple[1] ? lastTuple[1] : goog.labs.userAgent.browser.getVersionFromTuples_(versionTuples);
};
goog.labs.userAgent.browser.getVersionFromTuples_ = function(versionTuples) {
  goog.asserts.assert(2 < versionTuples.length, "Couldn't extract version tuple from user agent string");
  return versionTuples[2] && versionTuples[2][1] ? versionTuples[2][1] : "";
};
goog.labs.userAgent.engine = {};
goog.labs.userAgent.engine.isPresto = function() {
  return goog.labs.userAgent.util.matchUserAgent("Presto");
};
goog.labs.userAgent.engine.isTrident = function() {
  return goog.labs.userAgent.util.matchUserAgent("Trident") || goog.labs.userAgent.util.matchUserAgent("MSIE");
};
goog.labs.userAgent.engine.isWebKit = function() {
  return goog.labs.userAgent.util.matchUserAgentIgnoreCase("WebKit");
};
goog.labs.userAgent.engine.isGecko = function() {
  return goog.labs.userAgent.util.matchUserAgent("Gecko") && !goog.labs.userAgent.engine.isWebKit() && !goog.labs.userAgent.engine.isTrident();
};
goog.labs.userAgent.engine.getVersion = function() {
  var userAgentString = goog.labs.userAgent.util.getUserAgent();
  if (userAgentString) {
    var tuples = goog.labs.userAgent.util.extractVersionTuples(userAgentString), engineTuple = tuples[1];
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
goog.labs.userAgent.engine.isVersionOrHigher = function(version) {
  return 0 <= goog.string.compareVersions(goog.labs.userAgent.engine.getVersion(), version);
};
goog.labs.userAgent.engine.getVersionForKey_ = function(tuples, key) {
  var pair = goog.array.find(tuples, function(pair) {
    return key == pair[0];
  });
  return pair && pair[1] || "";
};
goog.userAgent = {};
goog.userAgent.ASSUME_IE = !1;
goog.userAgent.ASSUME_GECKO = !1;
goog.userAgent.ASSUME_WEBKIT = !1;
goog.userAgent.ASSUME_MOBILE_WEBKIT = !1;
goog.userAgent.ASSUME_OPERA = !1;
goog.userAgent.ASSUME_ANY_VERSION = !1;
goog.userAgent.BROWSER_KNOWN_ = goog.userAgent.ASSUME_IE || goog.userAgent.ASSUME_GECKO || goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_OPERA;
goog.userAgent.getUserAgentString = function() {
  return goog.labs.userAgent.util.getUserAgent();
};
goog.userAgent.getNavigator = function() {
  return goog.global.navigator || null;
};
goog.userAgent.OPERA = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_OPERA : goog.labs.userAgent.browser.isOpera();
goog.userAgent.IE = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_IE : goog.labs.userAgent.browser.isIE();
goog.userAgent.GECKO = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_GECKO : goog.labs.userAgent.engine.isGecko();
goog.userAgent.WEBKIT = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_MOBILE_WEBKIT : goog.labs.userAgent.engine.isWebKit();
goog.userAgent.isMobile_ = function() {
  return goog.userAgent.WEBKIT && goog.labs.userAgent.util.matchUserAgent("Mobile");
};
goog.userAgent.MOBILE = goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.isMobile_();
goog.userAgent.SAFARI = goog.userAgent.WEBKIT;
goog.userAgent.determinePlatform_ = function() {
  var navigator = goog.userAgent.getNavigator();
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
goog.userAgent.PLATFORM_KNOWN_ = goog.userAgent.ASSUME_MAC || goog.userAgent.ASSUME_WINDOWS || goog.userAgent.ASSUME_LINUX || goog.userAgent.ASSUME_X11 || goog.userAgent.ASSUME_ANDROID || goog.userAgent.ASSUME_IPHONE || goog.userAgent.ASSUME_IPAD;
goog.userAgent.initPlatform_ = function() {
  goog.userAgent.detectedMac_ = goog.string.contains(goog.userAgent.PLATFORM, "Mac");
  goog.userAgent.detectedWindows_ = goog.string.contains(goog.userAgent.PLATFORM, "Win");
  goog.userAgent.detectedLinux_ = goog.string.contains(goog.userAgent.PLATFORM, "Linux");
  goog.userAgent.detectedX11_ = !!goog.userAgent.getNavigator() && goog.string.contains(goog.userAgent.getNavigator().appVersion || "", "X11");
  var ua = goog.userAgent.getUserAgentString();
  goog.userAgent.detectedAndroid_ = !!ua && goog.string.contains(ua, "Android");
  goog.userAgent.detectedIPhone_ = !!ua && goog.string.contains(ua, "iPhone");
  goog.userAgent.detectedIPad_ = !!ua && goog.string.contains(ua, "iPad");
};
goog.userAgent.PLATFORM_KNOWN_ || goog.userAgent.initPlatform_();
goog.userAgent.MAC = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_MAC : goog.userAgent.detectedMac_;
goog.userAgent.WINDOWS = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_WINDOWS : goog.userAgent.detectedWindows_;
goog.userAgent.LINUX = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_LINUX : goog.userAgent.detectedLinux_;
goog.userAgent.X11 = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_X11 : goog.userAgent.detectedX11_;
goog.userAgent.ANDROID = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_ANDROID : goog.userAgent.detectedAndroid_;
goog.userAgent.IPHONE = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_IPHONE : goog.userAgent.detectedIPhone_;
goog.userAgent.IPAD = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_IPAD : goog.userAgent.detectedIPad_;
goog.userAgent.determineVersion_ = function() {
  var version = "", re;
  if (goog.userAgent.OPERA && goog.global.opera) {
    var operaVersion = goog.global.opera.version;
    return goog.isFunction(operaVersion) ? operaVersion() : operaVersion;
  }
  goog.userAgent.GECKO ? re = /rv\:([^\);]+)(\)|;)/ : goog.userAgent.IE ? re = /\b(?:MSIE|rv)[: ]([^\);]+)(\)|;)/ : goog.userAgent.WEBKIT && (re = /WebKit\/(\S+)/);
  if (re) {
    var arr = re.exec(goog.userAgent.getUserAgentString()), version = arr ? arr[1] : ""
  }
  if (goog.userAgent.IE) {
    var docMode = goog.userAgent.getDocumentMode_();
    if (docMode > parseFloat(version)) {
      return String(docMode);
    }
  }
  return version;
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
  return goog.userAgent.ASSUME_ANY_VERSION || goog.userAgent.isVersionOrHigherCache_[version] || (goog.userAgent.isVersionOrHigherCache_[version] = 0 <= goog.string.compareVersions(goog.userAgent.VERSION, version));
};
goog.userAgent.isVersion = goog.userAgent.isVersionOrHigher;
goog.userAgent.isDocumentModeOrHigher = function(documentMode) {
  return goog.userAgent.IE && goog.userAgent.DOCUMENT_MODE >= documentMode;
};
goog.userAgent.isDocumentMode = goog.userAgent.isDocumentModeOrHigher;
goog.userAgent.DOCUMENT_MODE = function() {
  var doc = goog.global.document;
  return doc && goog.userAgent.IE ? goog.userAgent.getDocumentMode_() || ("CSS1Compat" == doc.compatMode ? parseInt(goog.userAgent.VERSION, 10) : 5) : void 0;
}();
goog.events.BrowserFeature = {HAS_W3C_BUTTON:!goog.userAgent.IE || goog.userAgent.isDocumentModeOrHigher(9), HAS_W3C_EVENT_SUPPORT:!goog.userAgent.IE || goog.userAgent.isDocumentModeOrHigher(9), SET_KEY_CODE_TO_PREVENT_DEFAULT:goog.userAgent.IE && !goog.userAgent.isVersionOrHigher("9"), HAS_NAVIGATOR_ONLINE_PROPERTY:!goog.userAgent.WEBKIT || goog.userAgent.isVersionOrHigher("528"), HAS_HTML5_NETWORK_EVENT_SUPPORT:goog.userAgent.GECKO && goog.userAgent.isVersionOrHigher("1.9b") || goog.userAgent.IE && 
goog.userAgent.isVersionOrHigher("8") || goog.userAgent.OPERA && goog.userAgent.isVersionOrHigher("9.5") || goog.userAgent.WEBKIT && goog.userAgent.isVersionOrHigher("528"), HTML5_NETWORK_EVENTS_FIRE_ON_BODY:goog.userAgent.GECKO && !goog.userAgent.isVersionOrHigher("8") || goog.userAgent.IE && !goog.userAgent.isVersionOrHigher("9"), TOUCH_ENABLED:"ontouchstart" in goog.global || !!(goog.global.document && document.documentElement && "ontouchstart" in document.documentElement) || !(!goog.global.navigator || 
!goog.global.navigator.msMaxTouchPoints)};
goog.events.getVendorPrefixedName_ = function(eventName) {
  return goog.userAgent.WEBKIT ? "webkit" + eventName : goog.userAgent.OPERA ? "o" + eventName.toLowerCase() : eventName.toLowerCase();
};
goog.events.EventType = {CLICK:"click", DBLCLICK:"dblclick", MOUSEDOWN:"mousedown", MOUSEUP:"mouseup", MOUSEOVER:"mouseover", MOUSEOUT:"mouseout", MOUSEMOVE:"mousemove", MOUSEENTER:"mouseenter", MOUSELEAVE:"mouseleave", SELECTSTART:"selectstart", KEYPRESS:"keypress", KEYDOWN:"keydown", KEYUP:"keyup", BLUR:"blur", FOCUS:"focus", DEACTIVATE:"deactivate", FOCUSIN:goog.userAgent.IE ? "focusin" : "DOMFocusIn", FOCUSOUT:goog.userAgent.IE ? "focusout" : "DOMFocusOut", CHANGE:"change", SELECT:"select", SUBMIT:"submit", 
INPUT:"input", PROPERTYCHANGE:"propertychange", DRAGSTART:"dragstart", DRAG:"drag", DRAGENTER:"dragenter", DRAGOVER:"dragover", DRAGLEAVE:"dragleave", DROP:"drop", DRAGEND:"dragend", TOUCHSTART:"touchstart", TOUCHMOVE:"touchmove", TOUCHEND:"touchend", TOUCHCANCEL:"touchcancel", BEFOREUNLOAD:"beforeunload", CONSOLEMESSAGE:"consolemessage", CONTEXTMENU:"contextmenu", DOMCONTENTLOADED:"DOMContentLoaded", ERROR:"error", HELP:"help", LOAD:"load", LOSECAPTURE:"losecapture", ORIENTATIONCHANGE:"orientationchange", 
READYSTATECHANGE:"readystatechange", RESIZE:"resize", SCROLL:"scroll", UNLOAD:"unload", HASHCHANGE:"hashchange", PAGEHIDE:"pagehide", PAGESHOW:"pageshow", POPSTATE:"popstate", COPY:"copy", PASTE:"paste", CUT:"cut", BEFORECOPY:"beforecopy", BEFORECUT:"beforecut", BEFOREPASTE:"beforepaste", ONLINE:"online", OFFLINE:"offline", MESSAGE:"message", CONNECT:"connect", ANIMATIONSTART:goog.events.getVendorPrefixedName_("AnimationStart"), ANIMATIONEND:goog.events.getVendorPrefixedName_("AnimationEnd"), ANIMATIONITERATION:goog.events.getVendorPrefixedName_("AnimationIteration"), 
TRANSITIONEND:goog.events.getVendorPrefixedName_("TransitionEnd"), POINTERDOWN:"pointerdown", POINTERUP:"pointerup", POINTERCANCEL:"pointercancel", POINTERMOVE:"pointermove", POINTEROVER:"pointerover", POINTEROUT:"pointerout", POINTERENTER:"pointerenter", POINTERLEAVE:"pointerleave", GOTPOINTERCAPTURE:"gotpointercapture", LOSTPOINTERCAPTURE:"lostpointercapture", MSGESTURECHANGE:"MSGestureChange", MSGESTUREEND:"MSGestureEnd", MSGESTUREHOLD:"MSGestureHold", MSGESTURESTART:"MSGestureStart", MSGESTURETAP:"MSGestureTap", 
MSGOTPOINTERCAPTURE:"MSGotPointerCapture", MSINERTIASTART:"MSInertiaStart", MSLOSTPOINTERCAPTURE:"MSLostPointerCapture", MSPOINTERCANCEL:"MSPointerCancel", MSPOINTERDOWN:"MSPointerDown", MSPOINTERENTER:"MSPointerEnter", MSPOINTERHOVER:"MSPointerHover", MSPOINTERLEAVE:"MSPointerLeave", MSPOINTERMOVE:"MSPointerMove", MSPOINTEROUT:"MSPointerOut", MSPOINTEROVER:"MSPointerOver", MSPOINTERUP:"MSPointerUp", TEXTINPUT:"textinput", COMPOSITIONSTART:"compositionstart", COMPOSITIONUPDATE:"compositionupdate", 
COMPOSITIONEND:"compositionend", EXIT:"exit", LOADABORT:"loadabort", LOADCOMMIT:"loadcommit", LOADREDIRECT:"loadredirect", LOADSTART:"loadstart", LOADSTOP:"loadstop", RESPONSIVE:"responsive", SIZECHANGED:"sizechanged", UNRESPONSIVE:"unresponsive", VISIBILITYCHANGE:"visibilitychange", STORAGE:"storage", DOMSUBTREEMODIFIED:"DOMSubtreeModified", DOMNODEINSERTED:"DOMNodeInserted", DOMNODEREMOVED:"DOMNodeRemoved", DOMNODEREMOVEDFROMDOCUMENT:"DOMNodeRemovedFromDocument", DOMNODEINSERTEDINTODOCUMENT:"DOMNodeInsertedIntoDocument", 
DOMATTRMODIFIED:"DOMAttrModified", DOMCHARACTERDATAMODIFIED:"DOMCharacterDataModified"};
goog.events.BrowserEvent = function(opt_e, opt_currentTarget) {
  goog.events.Event.call(this, opt_e ? opt_e.type : "");
  this.relatedTarget = this.currentTarget = this.target = null;
  this.charCode = this.keyCode = this.button = this.screenY = this.screenX = this.clientY = this.clientX = this.offsetY = this.offsetX = 0;
  this.metaKey = this.shiftKey = this.altKey = this.ctrlKey = !1;
  this.state = null;
  this.platformModifierKey = !1;
  this.event_ = null;
  opt_e && this.init(opt_e, opt_currentTarget);
};
goog.inherits(goog.events.BrowserEvent, goog.events.Event);
goog.events.BrowserEvent.MouseButton = {LEFT:0, MIDDLE:1, RIGHT:2};
goog.events.BrowserEvent.IEButtonMap = [1, 4, 2];
goog.events.BrowserEvent.prototype.init = function(e, opt_currentTarget) {
  var type = this.type = e.type;
  this.target = e.target || e.srcElement;
  this.currentTarget = opt_currentTarget;
  var relatedTarget = e.relatedTarget;
  relatedTarget ? goog.userAgent.GECKO && (goog.reflect.canAccessProperty(relatedTarget, "nodeName") || (relatedTarget = null)) : type == goog.events.EventType.MOUSEOVER ? relatedTarget = e.fromElement : type == goog.events.EventType.MOUSEOUT && (relatedTarget = e.toElement);
  this.relatedTarget = relatedTarget;
  this.offsetX = goog.userAgent.WEBKIT || void 0 !== e.offsetX ? e.offsetX : e.layerX;
  this.offsetY = goog.userAgent.WEBKIT || void 0 !== e.offsetY ? e.offsetY : e.layerY;
  this.clientX = void 0 !== e.clientX ? e.clientX : e.pageX;
  this.clientY = void 0 !== e.clientY ? e.clientY : e.pageY;
  this.screenX = e.screenX || 0;
  this.screenY = e.screenY || 0;
  this.button = e.button;
  this.keyCode = e.keyCode || 0;
  this.charCode = e.charCode || ("keypress" == type ? e.keyCode : 0);
  this.ctrlKey = e.ctrlKey;
  this.altKey = e.altKey;
  this.shiftKey = e.shiftKey;
  this.metaKey = e.metaKey;
  this.platformModifierKey = goog.userAgent.MAC ? e.metaKey : e.ctrlKey;
  this.state = e.state;
  this.event_ = e;
  e.defaultPrevented && this.preventDefault();
};
goog.events.BrowserEvent.prototype.isButton = function(button) {
  return goog.events.BrowserFeature.HAS_W3C_BUTTON ? this.event_.button == button : "click" == this.type ? button == goog.events.BrowserEvent.MouseButton.LEFT : !!(this.event_.button & goog.events.BrowserEvent.IEButtonMap[button]);
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
goog.events.BrowserEvent.prototype.disposeInternal = function() {
};
goog.events.Listenable = function() {
};
goog.events.Listenable.IMPLEMENTED_BY_PROP = "closure_listenable_" + (1E6 * Math.random() | 0);
goog.events.Listenable.addImplementation = function(cls) {
  cls.prototype[goog.events.Listenable.IMPLEMENTED_BY_PROP] = !0;
};
goog.events.Listenable.isImplementedBy = function(obj) {
  try {
    return!(!obj || !obj[goog.events.Listenable.IMPLEMENTED_BY_PROP]);
  } catch (e) {
    return!1;
  }
};
goog.events.ListenableKey = function() {
};
goog.events.ListenableKey.counter_ = 0;
goog.events.ListenableKey.reserveKey = function() {
  return++goog.events.ListenableKey.counter_;
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
  var listenerObj, index = goog.events.ListenerMap.findListenerIndex_(listenerArray, listener, opt_useCapture, opt_listenerScope);
  -1 < index ? (listenerObj = listenerArray[index], callOnce || (listenerObj.callOnce = !1)) : (listenerObj = new goog.events.Listener(listener, null, this.src, typeStr, !!opt_useCapture, opt_listenerScope), listenerObj.callOnce = callOnce, listenerArray.push(listenerObj));
  return listenerObj;
};
goog.events.ListenerMap.prototype.remove = function(type, listener, opt_useCapture, opt_listenerScope) {
  var typeStr = type.toString();
  if (!(typeStr in this.listeners)) {
    return!1;
  }
  var listenerArray = this.listeners[typeStr], index = goog.events.ListenerMap.findListenerIndex_(listenerArray, listener, opt_useCapture, opt_listenerScope);
  return-1 < index ? (listenerArray[index].markAsRemoved(), goog.array.removeAt(listenerArray, index), 0 == listenerArray.length && (delete this.listeners[typeStr], this.typeCount_--), !0) : !1;
};
goog.events.ListenerMap.prototype.removeByKey = function(listener) {
  var type = listener.type;
  if (!(type in this.listeners)) {
    return!1;
  }
  var removed = goog.array.remove(this.listeners[type], listener);
  removed && (listener.markAsRemoved(), 0 == this.listeners[type].length && (delete this.listeners[type], this.typeCount_--));
  return removed;
};
goog.events.ListenerMap.prototype.removeAll = function(opt_type) {
  var typeStr = opt_type && opt_type.toString(), count = 0, type;
  for (type in this.listeners) {
    if (!typeStr || type == typeStr) {
      for (var listenerArray = this.listeners[type], i = 0;i < listenerArray.length;i++) {
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
    for (var i = 0;i < listenerArray.length;++i) {
      var listenerObj = listenerArray[i];
      listenerObj.capture == capture && rv.push(listenerObj);
    }
  }
  return rv;
};
goog.events.ListenerMap.prototype.getListener = function(type, listener, capture, opt_listenerScope) {
  var listenerArray = this.listeners[type.toString()], i = -1;
  listenerArray && (i = goog.events.ListenerMap.findListenerIndex_(listenerArray, listener, capture, opt_listenerScope));
  return-1 < i ? listenerArray[i] : null;
};
goog.events.ListenerMap.prototype.hasListener = function(opt_type, opt_capture) {
  var hasType = goog.isDef(opt_type), typeStr = hasType ? opt_type.toString() : "", hasCapture = goog.isDef(opt_capture);
  return goog.object.some(this.listeners, function(listenerArray, type) {
    for (var i = 0;i < listenerArray.length;++i) {
      if (!(hasType && listenerArray[i].type != typeStr || hasCapture && listenerArray[i].capture != opt_capture)) {
        return!0;
      }
    }
    return!1;
  });
};
goog.events.ListenerMap.findListenerIndex_ = function(listenerArray, listener, opt_useCapture, opt_listenerScope) {
  for (var i = 0;i < listenerArray.length;++i) {
    var listenerObj = listenerArray[i];
    if (!listenerObj.removed && listenerObj.listener == listener && listenerObj.capture == !!opt_useCapture && listenerObj.handler == opt_listenerScope) {
      return i;
    }
  }
  return-1;
};
goog.events.listeners_ = {};
goog.events.LISTENER_MAP_PROP_ = "closure_lm_" + (1E6 * Math.random() | 0);
goog.events.onString_ = "on";
goog.events.onStringMap_ = {};
goog.events.CaptureSimulationMode = {OFF_AND_FAIL:0, OFF_AND_SILENT:1, ON:2};
goog.events.CAPTURE_SIMULATION_MODE = 2;
goog.events.listenerCountEstimate_ = 0;
goog.events.listen = function(src, type, listener, opt_capt, opt_handler) {
  if (goog.isArray(type)) {
    for (var i = 0;i < type.length;i++) {
      goog.events.listen(src, type[i], listener, opt_capt, opt_handler);
    }
    return null;
  }
  listener = goog.events.wrapListener(listener);
  return goog.events.Listenable.isImplementedBy(src) ? src.listen(type, listener, opt_capt, opt_handler) : goog.events.listen_(src, type, listener, !1, opt_capt, opt_handler);
};
goog.events.listen_ = function(src, type, listener, callOnce, opt_capt, opt_handler) {
  if (!type) {
    throw Error("Invalid event type");
  }
  var capture = !!opt_capt;
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
  var listenerObj = listenerMap.add(type, listener, callOnce, opt_capt, opt_handler);
  if (listenerObj.proxy) {
    return listenerObj;
  }
  var proxy = goog.events.getProxy();
  listenerObj.proxy = proxy;
  proxy.src = src;
  proxy.listener = listenerObj;
  src.addEventListener ? src.addEventListener(type.toString(), proxy, capture) : src.attachEvent(goog.events.getOnString_(type.toString()), proxy);
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
goog.events.listenOnce = function(src, type, listener, opt_capt, opt_handler) {
  if (goog.isArray(type)) {
    for (var i = 0;i < type.length;i++) {
      goog.events.listenOnce(src, type[i], listener, opt_capt, opt_handler);
    }
    return null;
  }
  listener = goog.events.wrapListener(listener);
  return goog.events.Listenable.isImplementedBy(src) ? src.listenOnce(type, listener, opt_capt, opt_handler) : goog.events.listen_(src, type, listener, !0, opt_capt, opt_handler);
};
goog.events.listenWithWrapper = function(src, wrapper, listener, opt_capt, opt_handler) {
  wrapper.listen(src, listener, opt_capt, opt_handler);
};
goog.events.unlisten = function(src, type, listener, opt_capt, opt_handler) {
  if (goog.isArray(type)) {
    for (var i = 0;i < type.length;i++) {
      goog.events.unlisten(src, type[i], listener, opt_capt, opt_handler);
    }
    return null;
  }
  listener = goog.events.wrapListener(listener);
  if (goog.events.Listenable.isImplementedBy(src)) {
    return src.unlisten(type, listener, opt_capt, opt_handler);
  }
  if (!src) {
    return!1;
  }
  var capture, listenerMap = goog.events.getListenerMap_(src);
  if (listenerMap) {
    var listenerObj = listenerMap.getListener(type, listener, !!opt_capt, opt_handler);
    if (listenerObj) {
      return goog.events.unlistenByKey(listenerObj);
    }
  }
  return!1;
};
goog.events.unlistenByKey = function(key) {
  if (goog.isNumber(key) || !key || key.removed) {
    return!1;
  }
  var src = key.src;
  if (goog.events.Listenable.isImplementedBy(src)) {
    return src.unlistenByKey(key);
  }
  var type = key.type, proxy = key.proxy;
  src.removeEventListener ? src.removeEventListener(type, proxy, key.capture) : src.detachEvent && src.detachEvent(goog.events.getOnString_(type), proxy);
  goog.events.listenerCountEstimate_--;
  var listenerMap = goog.events.getListenerMap_(src);
  listenerMap ? (listenerMap.removeByKey(key), 0 == listenerMap.getTypeCount() && (listenerMap.src = null, src[goog.events.LISTENER_MAP_PROP_] = null)) : key.markAsRemoved();
  return!0;
};
goog.events.unlistenWithWrapper = function(src, wrapper, listener, opt_capt, opt_handler) {
  wrapper.unlisten(src, listener, opt_capt, opt_handler);
};
goog.events.removeAll = function(opt_obj, opt_type) {
  if (!opt_obj) {
    return 0;
  }
  if (goog.events.Listenable.isImplementedBy(opt_obj)) {
    return opt_obj.removeAllListeners(opt_type);
  }
  var listenerMap = goog.events.getListenerMap_(opt_obj);
  if (!listenerMap) {
    return 0;
  }
  var count = 0, typeStr = opt_type && opt_type.toString(), type;
  for (type in listenerMap.listeners) {
    if (!typeStr || type == typeStr) {
      for (var listeners = goog.array.clone(listenerMap.listeners[type]), i = 0;i < listeners.length;++i) {
        goog.events.unlistenByKey(listeners[i]) && ++count;
      }
    }
  }
  return count;
};
goog.events.removeAllNativeListeners = function() {
  return goog.events.listenerCountEstimate_ = 0;
};
goog.events.getListeners = function(obj, type, capture) {
  if (goog.events.Listenable.isImplementedBy(obj)) {
    return obj.getListeners(type, capture);
  }
  if (!obj) {
    return[];
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
  return!!listenerMap && listenerMap.hasListener(opt_type, opt_capture);
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
  var retval = 1, listenerMap = goog.events.getListenerMap_(obj);
  if (listenerMap) {
    var listenerArray = listenerMap.listeners[type.toString()];
    if (listenerArray) {
      for (var listenerArray = goog.array.clone(listenerArray), i = 0;i < listenerArray.length;i++) {
        var listener = listenerArray[i];
        listener && listener.capture == capture && !listener.removed && (retval &= !1 !== goog.events.fireListener(listener, eventObject));
      }
    }
  }
  return Boolean(retval);
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
    return!0;
  }
  if (!goog.events.BrowserFeature.HAS_W3C_EVENT_SUPPORT) {
    var ieEvent = opt_evt || goog.getObjectByName("window.event"), evt = new goog.events.BrowserEvent(ieEvent, this), retval = !0;
    if (goog.events.CAPTURE_SIMULATION_MODE == goog.events.CaptureSimulationMode.ON) {
      if (!goog.events.isMarkedIeEvent_(ieEvent)) {
        goog.events.markIeEvent_(ieEvent);
        for (var ancestors = [], parent = evt.currentTarget;parent;parent = parent.parentNode) {
          ancestors.push(parent);
        }
        for (var type = listener.type, i = ancestors.length - 1;!evt.propagationStopped_ && 0 <= i;i--) {
          evt.currentTarget = ancestors[i], retval &= goog.events.fireListeners_(ancestors[i], type, !0, evt);
        }
        for (i = 0;!evt.propagationStopped_ && i < ancestors.length;i++) {
          evt.currentTarget = ancestors[i], retval &= goog.events.fireListeners_(ancestors[i], type, !1, evt);
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
goog.events.LISTENER_WRAPPER_PROP_ = "__closure_events_fn_" + (1E9 * Math.random() >>> 0);
goog.events.wrapListener = function(listener) {
  goog.asserts.assert(listener, "Listener can not be null.");
  if (goog.isFunction(listener)) {
    return listener;
  }
  goog.asserts.assert(listener.handleEvent, "An object listener must have handleEvent method.");
  return listener[goog.events.LISTENER_WRAPPER_PROP_] || (listener[goog.events.LISTENER_WRAPPER_PROP_] = function(e) {
    return listener.handleEvent(e);
  });
};
goog.debug.entryPointRegistry.register(function(transformer) {
  goog.events.handleBrowserEvent_ = transformer(goog.events.handleBrowserEvent_);
});
goog.events.EventTarget = function() {
  goog.Disposable.call(this);
  this.eventTargetListeners_ = new goog.events.ListenerMap(this);
  this.actualEventTarget_ = this;
};
goog.inherits(goog.events.EventTarget, goog.Disposable);
goog.events.Listenable.addImplementation(goog.events.EventTarget);
goog.events.EventTarget.MAX_ANCESTORS_ = 1E3;
goog.events.EventTarget.prototype.parentEventTarget_ = null;
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
  var ancestorsTree, ancestor = this.getParentEventTarget();
  if (ancestor) {
    ancestorsTree = [];
    for (var ancestorCount = 1;ancestor;ancestor = ancestor.getParentEventTarget()) {
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
    return!0;
  }
  for (var listenerArray = goog.array.clone(listenerArray), rv = !0, i = 0;i < listenerArray.length;++i) {
    var listener = listenerArray[i];
    if (listener && !listener.removed && listener.capture == capture) {
      var listenerFn = listener.listener, listenerHandler = listener.handler || listener.src;
      listener.callOnce && this.unlistenByKey(listener);
      rv = !1 !== listenerFn.call(listenerHandler, eventObject) && rv;
    }
  }
  return rv && !1 != eventObject.returnValue_;
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
  var rv = !0, currentTarget;
  if (opt_ancestorsTree) {
    for (var i = opt_ancestorsTree.length - 1;!e.propagationStopped_ && 0 <= i;i--) {
      currentTarget = e.currentTarget = opt_ancestorsTree[i], rv = currentTarget.fireListeners(type, !0, e) && rv;
    }
  }
  e.propagationStopped_ || (currentTarget = e.currentTarget = target, rv = currentTarget.fireListeners(type, !0, e) && rv, e.propagationStopped_ || (rv = currentTarget.fireListeners(type, !1, e) && rv));
  if (opt_ancestorsTree) {
    for (i = 0;!e.propagationStopped_ && i < opt_ancestorsTree.length;i++) {
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
goog.functions.FALSE = goog.functions.constant(!1);
goog.functions.TRUE = goog.functions.constant(!0);
goog.functions.NULL = goog.functions.constant(null);
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
goog.functions.withReturnValue = function(f, retValue) {
  return goog.functions.sequence(f, goog.functions.constant(retValue));
};
goog.functions.compose = function(fn, var_args) {
  var functions = arguments, length = functions.length;
  return function() {
    var result;
    length && (result = functions[length - 1].apply(this, arguments));
    for (var i = length - 2;0 <= i;i--) {
      result = functions[i].call(this, result);
    }
    return result;
  };
};
goog.functions.sequence = function(var_args) {
  var functions = arguments, length = functions.length;
  return function() {
    for (var result, i = 0;i < length;i++) {
      result = functions[i].apply(this, arguments);
    }
    return result;
  };
};
goog.functions.and = function(var_args) {
  var functions = arguments, length = functions.length;
  return function() {
    for (var i = 0;i < length;i++) {
      if (!functions[i].apply(this, arguments)) {
        return!1;
      }
    }
    return!0;
  };
};
goog.functions.or = function(var_args) {
  var functions = arguments, length = functions.length;
  return function() {
    for (var i = 0;i < length;i++) {
      if (functions[i].apply(this, arguments)) {
        return!0;
      }
    }
    return!1;
  };
};
goog.functions.not = function(f) {
  return function() {
    return!f.apply(this, arguments);
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
  return Math.abs(a - b) <= (opt_tolerance || 1E-6);
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
  return 0 == x ? 0 : 0 > x ? -1 : 1;
};
goog.math.longestCommonSubsequence = function(array1, array2, opt_compareFn, opt_collectorFn) {
  for (var compare = opt_compareFn || function(a, b) {
    return a == b;
  }, collect = opt_collectorFn || function(i1, i2) {
    return array1[i1];
  }, length1 = array1.length, length2 = array2.length, arr = [], i = 0;i < length1 + 1;i++) {
    arr[i] = [], arr[i][0] = 0;
  }
  for (var j = 0;j < length2 + 1;j++) {
    arr[0][j] = 0;
  }
  for (i = 1;i <= length1;i++) {
    for (j = 1;j <= length2;j++) {
      compare(array1[i - 1], array2[j - 1]) ? arr[i][j] = arr[i - 1][j - 1] + 1 : arr[i][j] = Math.max(arr[i - 1][j], arr[i][j - 1]);
    }
  }
  for (var result = [], i = length1, j = length2;0 < i && 0 < j;) {
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
  return isFinite(num) && !isNaN(num);
};
goog.math.log10Floor = function(num) {
  if (0 < num) {
    var x = Math.round(Math.log(num) * Math.LOG10E);
    return x - (parseFloat("1e" + x) > num);
  }
  return 0 == num ? -Infinity : NaN;
};
goog.math.safeFloor = function(num, opt_epsilon) {
  goog.asserts.assert(!goog.isDef(opt_epsilon) || 0 < opt_epsilon);
  return Math.floor(num + (opt_epsilon || 2E-15));
};
goog.math.safeCeil = function(num, opt_epsilon) {
  goog.asserts.assert(!goog.isDef(opt_epsilon) || 0 < opt_epsilon);
  return Math.ceil(num - (opt_epsilon || 2E-15));
};
goog.iter = {};
goog.iter.StopIteration = "StopIteration" in goog.global ? goog.global.StopIteration : Error("StopIteration");
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
    } catch (ex$$0) {
      if (ex$$0 !== goog.iter.StopIteration) {
        throw ex$$0;
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
  1 < arguments.length && (start = startOrStop, stop = opt_stop);
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
goog.iter.reduce = function(iterable, f, val$$0, opt_obj) {
  var rval = val$$0;
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
        return!0;
      }
    }
  } catch (ex) {
    if (ex !== goog.iter.StopIteration) {
      throw ex;
    }
  }
  return!1;
};
goog.iter.every = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  try {
    for (;;) {
      if (!f.call(opt_obj, iterable.next(), void 0, iterable)) {
        return!1;
      }
    }
  } catch (ex) {
    if (ex !== goog.iter.StopIteration) {
      throw ex;
    }
  }
  return!0;
};
goog.iter.chain = function(var_args) {
  var iterator = goog.iter.toIterator(arguments), iter = new goog.iter.Iterator, current = null;
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
goog.iter.chainFromIterable = function(iterable) {
  return goog.iter.chain.apply(void 0, iterable);
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
  var iterator = goog.iter.toIterator(iterable), newIter = new goog.iter.Iterator, taking = !0;
  newIter.next = function() {
    for (;;) {
      if (taking) {
        var val = iterator.next();
        if (f.call(opt_obj, val, void 0, iterator)) {
          return val;
        }
        taking = !1;
      } else {
        throw goog.iter.StopIteration;
      }
    }
  };
  return newIter;
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
goog.iter.equals = function(iterable1, iterable2) {
  var pairs = goog.iter.zipLongest({}, iterable1, iterable2);
  return goog.iter.every(pairs, function(pair) {
    return pair[0] == pair[1];
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
    return!arr.length;
  }) || !arguments.length) {
    return new goog.iter.Iterator;
  }
  var iter = new goog.iter.Iterator, arrays = arguments, indicies = goog.array.repeat(0, arrays.length);
  iter.next = function() {
    if (indicies) {
      for (var retVal = goog.array.map(indicies, function(valueIndex, arrayIndex) {
        return arrays[arrayIndex][valueIndex];
      }), i = indicies.length - 1;0 <= i;i--) {
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
        var returnValue;
        try {
          returnValue = it.next(), iteratorsHaveValues = !0;
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
    return!!selectorIterator.next();
  });
};
goog.iter.GroupByIterator_ = function(iterable, opt_keyFunc) {
  this.iterator = goog.iter.toIterator(iterable);
  this.keyFunc = opt_keyFunc || goog.functions.identity;
};
goog.inherits(goog.iter.GroupByIterator_, goog.iter.Iterator);
goog.iter.GroupByIterator_.prototype.next = function() {
  for (;this.currentKey == this.targetKey;) {
    this.currentValue = this.iterator.next(), this.currentKey = this.keyFunc(this.currentValue);
  }
  this.targetKey = this.currentKey;
  return[this.currentKey, this.groupItems_(this.targetKey)];
};
goog.iter.GroupByIterator_.prototype.groupItems_ = function(targetKey) {
  for (var arr = [];this.currentKey == targetKey;) {
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
    return[];
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
  for (var iterator = goog.iter.toIterator(iterable);0 < count--;) {
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
    return!goog.iter.hasDuplicates_(arr);
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
    for (var i = 0;i < argLength;i += 2) {
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
  for (var rv = [], i = 0;i < this.keys_.length;i++) {
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
  for (var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    if (goog.structs.Map.hasKey_(this.map_, key) && this.map_[key] == val) {
      return!0;
    }
  }
  return!1;
};
goog.structs.Map.prototype.equals = function(otherMap, opt_equalityFn) {
  if (this === otherMap) {
    return!0;
  }
  if (this.count_ != otherMap.getCount()) {
    return!1;
  }
  var equalityFn = opt_equalityFn || goog.structs.Map.defaultEquals;
  this.cleanupKeysArray_();
  for (var key, i = 0;key = this.keys_[i];i++) {
    if (!equalityFn(this.get(key), otherMap.get(key))) {
      return!1;
    }
  }
  return!0;
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
    for (var srcIndex = 0, destIndex = 0;srcIndex < this.keys_.length;) {
      var key = this.keys_[srcIndex];
      goog.structs.Map.hasKey_(this.map_, key) && (this.keys_[destIndex++] = key);
      srcIndex++;
    }
    this.keys_.length = destIndex;
  }
  if (this.count_ != this.keys_.length) {
    for (var seen = {}, destIndex = srcIndex = 0;srcIndex < this.keys_.length;) {
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
  var keys, values;
  map instanceof goog.structs.Map ? (keys = map.getKeys(), values = map.getValues()) : (keys = goog.object.getKeys(map), values = goog.object.getValues(map));
  for (var i = 0;i < keys.length;i++) {
    this.set(keys[i], values[i]);
  }
};
goog.structs.Map.prototype.forEach = function(f, opt_obj) {
  for (var keys = this.getKeys(), i = 0;i < keys.length;i++) {
    var key = keys[i], value = this.get(key);
    f.call(opt_obj, value, key, this);
  }
};
goog.structs.Map.prototype.clone = function() {
  return new goog.structs.Map(this);
};
goog.structs.Map.prototype.transpose = function() {
  for (var transposed = new goog.structs.Map, i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    transposed.set(this.map_[key], key);
  }
  return transposed;
};
goog.structs.Map.prototype.toObject = function() {
  this.cleanupKeysArray_();
  for (var obj = {}, i = 0;i < this.keys_.length;i++) {
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
  var i = 0, keys = this.keys_, map = this.map_, version = this.version_, selfObj = this, newIter = new goog.iter.Iterator;
  newIter.next = function() {
    for (;;) {
      if (version != selfObj.version_) {
        throw Error("The map has changed since the iterator was created");
      }
      if (i >= keys.length) {
        throw goog.iter.StopIteration;
      }
      var key = keys[i++];
      return opt_keys ? key : map[key];
    }
  };
  return newIter;
};
goog.structs.Map.hasKey_ = function(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
};
goog.structs.getCount = function(col) {
  return "function" == typeof col.getCount ? col.getCount() : goog.isArrayLike(col) || goog.isString(col) ? col.length : goog.object.getCount(col);
};
goog.structs.getValues = function(col) {
  if ("function" == typeof col.getValues) {
    return col.getValues();
  }
  if (goog.isString(col)) {
    return col.split("");
  }
  if (goog.isArrayLike(col)) {
    for (var rv = [], l = col.length, i = 0;i < l;i++) {
      rv.push(col[i]);
    }
    return rv;
  }
  return goog.object.getValues(col);
};
goog.structs.getKeys = function(col) {
  if ("function" == typeof col.getKeys) {
    return col.getKeys();
  }
  if ("function" != typeof col.getValues) {
    if (goog.isArrayLike(col) || goog.isString(col)) {
      for (var rv = [], l = col.length, i = 0;i < l;i++) {
        rv.push(i);
      }
      return rv;
    }
    return goog.object.getKeys(col);
  }
};
goog.structs.contains = function(col, val) {
  return "function" == typeof col.contains ? col.contains(val) : "function" == typeof col.containsValue ? col.containsValue(val) : goog.isArrayLike(col) || goog.isString(col) ? goog.array.contains(col, val) : goog.object.containsValue(col, val);
};
goog.structs.isEmpty = function(col) {
  return "function" == typeof col.isEmpty ? col.isEmpty() : goog.isArrayLike(col) || goog.isString(col) ? goog.array.isEmpty(col) : goog.object.isEmpty(col);
};
goog.structs.clear = function(col) {
  "function" == typeof col.clear ? col.clear() : goog.isArrayLike(col) ? goog.array.clear(col) : goog.object.clear(col);
};
goog.structs.forEach = function(col, f, opt_obj) {
  if ("function" == typeof col.forEach) {
    col.forEach(f, opt_obj);
  } else {
    if (goog.isArrayLike(col) || goog.isString(col)) {
      goog.array.forEach(col, f, opt_obj);
    } else {
      for (var keys = goog.structs.getKeys(col), values = goog.structs.getValues(col), l = values.length, i = 0;i < l;i++) {
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
  var rv, keys = goog.structs.getKeys(col), values = goog.structs.getValues(col), l = values.length;
  if (keys) {
    rv = {};
    for (var i = 0;i < l;i++) {
      f.call(opt_obj, values[i], keys[i], col) && (rv[keys[i]] = values[i]);
    }
  } else {
    for (rv = [], i = 0;i < l;i++) {
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
  var rv, keys = goog.structs.getKeys(col), values = goog.structs.getValues(col), l = values.length;
  if (keys) {
    rv = {};
    for (var i = 0;i < l;i++) {
      rv[keys[i]] = f.call(opt_obj, values[i], keys[i], col);
    }
  } else {
    for (rv = [], i = 0;i < l;i++) {
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
  for (var keys = goog.structs.getKeys(col), values = goog.structs.getValues(col), l = values.length, i = 0;i < l;i++) {
    if (f.call(opt_obj, values[i], keys && keys[i], col)) {
      return!0;
    }
  }
  return!1;
};
goog.structs.every = function(col, f, opt_obj) {
  if ("function" == typeof col.every) {
    return col.every(f, opt_obj);
  }
  if (goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.every(col, f, opt_obj);
  }
  for (var keys = goog.structs.getKeys(col), values = goog.structs.getValues(col), l = values.length, i = 0;i < l;i++) {
    if (!f.call(opt_obj, values[i], keys && keys[i], col)) {
      return!1;
    }
  }
  return!0;
};
goog.structs.Set = function(opt_values) {
  this.map_ = new goog.structs.Map;
  opt_values && this.addAll(opt_values);
};
goog.structs.Set.getKey_ = function(val) {
  var type = typeof val;
  return "object" == type && val || "function" == type ? "o" + goog.getUid(val) : type.substr(0, 1) + val;
};
goog.structs.Set.prototype.getCount = function() {
  return this.map_.getCount();
};
goog.structs.Set.prototype.add = function(element) {
  this.map_.set(goog.structs.Set.getKey_(element), element);
};
goog.structs.Set.prototype.addAll = function(col) {
  for (var values = goog.structs.getValues(col), l = values.length, i = 0;i < l;i++) {
    this.add(values[i]);
  }
};
goog.structs.Set.prototype.removeAll = function(col) {
  for (var values = goog.structs.getValues(col), l = values.length, i = 0;i < l;i++) {
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
  for (var result = new goog.structs.Set, values = goog.structs.getValues(col), i = 0;i < values.length;i++) {
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
    return!1;
  }
  !(col instanceof goog.structs.Set) && 5 < colCount && (col = new goog.structs.Set(col));
  return goog.structs.every(this, function(value) {
    return goog.structs.contains(col, value);
  });
};
goog.structs.Set.prototype.__iterator__ = function(opt_keys) {
  return this.map_.__iterator__(!1);
};
goog.debug.LOGGING_ENABLED = goog.DEBUG;
goog.debug.catchErrors = function(logFunc, opt_cancel, opt_target) {
  var target = opt_target || goog.global, oldErrorHandler = target.onerror, retVal = !!opt_cancel;
  goog.userAgent.WEBKIT && !goog.userAgent.isVersionOrHigher("535.3") && (retVal = !retVal);
  target.onerror = function(message, url, line, opt_col, opt_error) {
    oldErrorHandler && oldErrorHandler(message, url, line, opt_col, opt_error);
    logFunc({message:message, fileName:url, line:line, col:opt_col, error:opt_error});
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
goog.debug.deepExpose = function(obj$$0, opt_showFn) {
  var str = [], helper = function(obj, space, parentSeen) {
    var nestspace = space + "  ", seen = new goog.structs.Set(parentSeen);
    try {
      if (goog.isDef(obj)) {
        if (goog.isNull(obj)) {
          str.push("NULL");
        } else {
          if (goog.isString(obj)) {
            str.push('"' + obj.replace(/\n/g, "\n" + space) + '"');
          } else {
            if (goog.isFunction(obj)) {
              str.push(String(obj).replace(/\n/g, "\n" + space));
            } else {
              if (goog.isObject(obj)) {
                if (seen.contains(obj)) {
                  str.push("*** reference loop detected ***");
                } else {
                  seen.add(obj);
                  str.push("{");
                  for (var x in obj) {
                    if (opt_showFn || !goog.isFunction(obj[x])) {
                      str.push("\n"), str.push(nestspace), str.push(x + " = "), helper(obj[x], nestspace, seen);
                    }
                  }
                  str.push("\n" + space + "}");
                }
              } else {
                str.push(obj);
              }
            }
          }
        }
      } else {
        str.push("undefined");
      }
    } catch (e) {
      str.push("*** " + e + " ***");
    }
  };
  helper(obj$$0, "", new goog.structs.Set);
  return str.join("");
};
goog.debug.exposeArray = function(arr) {
  for (var str = [], i = 0;i < arr.length;i++) {
    goog.isArray(arr[i]) ? str.push(goog.debug.exposeArray(arr[i])) : str.push(arr[i]);
  }
  return "[ " + str.join(", ") + " ]";
};
goog.debug.exposeException = function(err, opt_fn) {
  try {
    var e = goog.debug.normalizeErrorObject(err);
    return "Message: " + goog.string.htmlEscape(e.message) + '\nUrl: <a href="view-source:' + e.fileName + '" target="_new">' + e.fileName + "</a>\nLine: " + e.lineNumber + "\n\nBrowser stack:\n" + goog.string.htmlEscape(e.stack + "-> ") + "[end]\n\nJS stack traversal:\n" + goog.string.htmlEscape(goog.debug.getStacktrace(opt_fn) + "-> ");
  } catch (e2) {
    return "Exception trying to expose exception! You win, we lose. " + e2;
  }
};
goog.debug.normalizeErrorObject = function(err) {
  var href = goog.getObjectByName("window.location.href");
  if (goog.isString(err)) {
    return{message:err, name:"Unknown error", lineNumber:"Not available", fileName:href, stack:"Not available"};
  }
  var lineNumber, fileName, threwError = !1;
  try {
    lineNumber = err.lineNumber || err.line || "Not available";
  } catch (e) {
    lineNumber = "Not available", threwError = !0;
  }
  try {
    fileName = err.fileName || err.filename || err.sourceURL || goog.global.$googDebugFname || href;
  } catch (e$$0) {
    fileName = "Not available", threwError = !0;
  }
  return!threwError && err.lineNumber && err.fileName && err.stack && err.message && err.name ? err : {message:err.message || "Not available", name:err.name || "UnknownError", lineNumber:lineNumber, fileName:fileName, stack:err.stack || "Not available"};
};
goog.debug.enhanceError = function(err, opt_message) {
  var error;
  "string" == typeof err ? (error = Error(err), Error.captureStackTrace && Error.captureStackTrace(error, goog.debug.enhanceError)) : error = err;
  error.stack || (error.stack = goog.debug.getStacktrace(goog.debug.enhanceError));
  if (opt_message) {
    for (var x = 0;error["message" + x];) {
      ++x;
    }
    error["message" + x] = String(opt_message);
  }
  return error;
};
goog.debug.getStacktraceSimple = function(opt_depth) {
  if (goog.STRICT_MODE_COMPATIBLE) {
    var stack = goog.debug.getNativeStackTrace_(goog.debug.getStacktraceSimple);
    if (stack) {
      return stack;
    }
  }
  for (var sb = [], fn = arguments.callee.caller, depth = 0;fn && (!opt_depth || depth < opt_depth);) {
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
goog.debug.getStacktrace = function(opt_fn) {
  var stack;
  goog.STRICT_MODE_COMPATIBLE && (stack = goog.debug.getNativeStackTrace_(opt_fn || goog.debug.getStacktrace));
  stack || (stack = goog.debug.getStacktraceHelper_(opt_fn || arguments.callee.caller, []));
  return stack;
};
goog.debug.getStacktraceHelper_ = function(fn, visited) {
  var sb = [];
  if (goog.array.contains(visited, fn)) {
    sb.push("[...circular reference...]");
  } else {
    if (fn && visited.length < goog.debug.MAX_STACK_DEPTH) {
      sb.push(goog.debug.getFunctionName(fn) + "(");
      for (var args = fn.arguments, i = 0;args && i < args.length;i++) {
        0 < i && sb.push(", ");
        var argDesc, arg = args[i];
        switch(typeof arg) {
          case "object":
            argDesc = arg ? "object" : "null";
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
            break;
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
goog.debug.setFunctionResolver = function(resolver) {
  goog.debug.fnNameResolver_ = resolver;
};
goog.debug.getFunctionName = function(fn) {
  if (goog.debug.fnNameCache_[fn]) {
    return goog.debug.fnNameCache_[fn];
  }
  if (goog.debug.fnNameResolver_) {
    var name = goog.debug.fnNameResolver_(fn);
    if (name) {
      return goog.debug.fnNameCache_[fn] = name;
    }
  }
  var functionSource = String(fn);
  if (!goog.debug.fnNameCache_[functionSource]) {
    var matches = /function ([^\(]+)/.exec(functionSource);
    goog.debug.fnNameCache_[functionSource] = matches ? matches[1] : "[Anonymous]";
  }
  return goog.debug.fnNameCache_[functionSource];
};
goog.debug.makeWhitespaceVisible = function(string) {
  return string.replace(/ /g, "[_]").replace(/\f/g, "[f]").replace(/\n/g, "[n]\n").replace(/\r/g, "[r]").replace(/\t/g, "[t]");
};
goog.debug.fnNameCache_ = {};
goog.debug.LogRecord = function(level, msg, loggerName, opt_time, opt_sequenceNumber) {
  this.reset(level, msg, loggerName, opt_time, opt_sequenceNumber);
};
goog.debug.LogRecord.prototype.sequenceNumber_ = 0;
goog.debug.LogRecord.prototype.exception_ = null;
goog.debug.LogRecord.prototype.exceptionText_ = null;
goog.debug.LogRecord.ENABLE_SEQUENCE_NUMBERS = !0;
goog.debug.LogRecord.nextSequenceNumber_ = 0;
goog.debug.LogRecord.prototype.reset = function(level, msg, loggerName, opt_time, opt_sequenceNumber) {
  goog.debug.LogRecord.ENABLE_SEQUENCE_NUMBERS && (this.sequenceNumber_ = "number" == typeof opt_sequenceNumber ? opt_sequenceNumber : goog.debug.LogRecord.nextSequenceNumber_++);
  this.time_ = opt_time || goog.now();
  this.level_ = level;
  this.msg_ = msg;
  this.loggerName_ = loggerName;
  delete this.exception_;
  delete this.exceptionText_;
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
goog.debug.LogRecord.prototype.getExceptionText = function() {
  return this.exceptionText_;
};
goog.debug.LogRecord.prototype.setExceptionText = function(text) {
  this.exceptionText_ = text;
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
goog.debug.Logger.ENABLE_HIERARCHY = !0;
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
goog.debug.Logger.Level.SEVERE = new goog.debug.Logger.Level("SEVERE", 1E3);
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
  for (var i = 0, level;level = goog.debug.Logger.Level.PREDEFINED_LEVELS[i];i++) {
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
  for (var i = 0;i < goog.debug.Logger.Level.PREDEFINED_LEVELS.length;++i) {
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
  goog.global.console && (goog.global.console.timeStamp ? goog.global.console.timeStamp(msg) : goog.global.console.markTimeline && goog.global.console.markTimeline(msg));
  goog.global.msWriteProfilerMark && goog.global.msWriteProfilerMark(msg);
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
    return!!handlers && goog.array.remove(handlers, handler);
  }
  return!1;
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
  goog.debug.LOGGING_ENABLED && this.isLoggable(level) && (goog.isFunction(msg) && (msg = msg()), this.doLogRecord_(this.getLogRecord(level, msg, opt_exception, goog.debug.Logger.prototype.log)));
};
goog.debug.Logger.prototype.getLogRecord = function(level, msg, opt_exception, opt_fnStackContext) {
  var logRecord = goog.debug.LogBuffer.isBufferingEnabled() ? goog.debug.LogBuffer.getInstance().addRecord(level, msg, this.name_) : new goog.debug.LogRecord(level, String(msg), this.name_);
  opt_exception && (logRecord.setException(opt_exception), logRecord.setExceptionText(goog.debug.exposeException(opt_exception, opt_fnStackContext || goog.debug.Logger.prototype.getLogRecord)));
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
  goog.debug.Logger.logToProfilers("log:" + logRecord.getMessage());
  if (goog.debug.Logger.ENABLE_HIERARCHY) {
    for (var target = this;target;) {
      target.callPublish_(logRecord), target = target.getParent();
    }
  } else {
    for (var i = 0, handler;handler = goog.debug.Logger.rootHandlers_[i++];) {
      handler(logRecord);
    }
  }
};
goog.debug.Logger.prototype.callPublish_ = function(logRecord) {
  if (this.handlers_) {
    for (var i = 0, handler;handler = this.handlers_[i];i++) {
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
  goog.debug.LogManager.rootLogger_ || (goog.debug.LogManager.rootLogger_ = new goog.debug.Logger(""), goog.debug.LogManager.loggers_[""] = goog.debug.LogManager.rootLogger_, goog.debug.LogManager.rootLogger_.setLevel(goog.debug.Logger.Level.CONFIG));
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
goog.Timer = function(opt_interval, opt_timerObject) {
  goog.events.EventTarget.call(this);
  this.interval_ = opt_interval || 1;
  this.timerObject_ = opt_timerObject || goog.Timer.defaultTimerObject;
  this.boundTick_ = goog.bind(this.tick_, this);
  this.last_ = goog.now();
};
goog.inherits(goog.Timer, goog.events.EventTarget);
goog.Timer.MAX_TIMEOUT_ = 2147483647;
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
    0 < elapsed && elapsed < this.interval_ * goog.Timer.intervalScale ? this.timer_ = this.timerObject_.setTimeout(this.boundTick_, this.interval_ - elapsed) : (this.timer_ && (this.timerObject_.clearTimeout(this.timer_), this.timer_ = null), this.dispatchTick(), this.enabled && (this.timer_ = this.timerObject_.setTimeout(this.boundTick_, this.interval_), this.last_ = goog.now()));
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
  return opt_delay > goog.Timer.MAX_TIMEOUT_ ? -1 : goog.Timer.defaultTimerObject.setTimeout(listener, opt_delay || 0);
};
goog.Timer.clear = function(timerId) {
  goog.Timer.defaultTimerObject.clearTimeout(timerId);
};
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
goog.uri.utils.splitRe_ = RegExp("^(?:([^:/?#.]+):)?(?://(?:([^/?#]*)@)?([^/#?]*?)(?::([0-9]+))?(?=[/#?]|$))?([^?#]+)?(?:\\?([^#]*))?(?:#(.*))?$");
goog.uri.utils.ComponentIndex = {SCHEME:1, USER_INFO:2, DOMAIN:3, PORT:4, PATH:5, QUERY_DATA:6, FRAGMENT:7};
goog.uri.utils.split = function(uri) {
  goog.uri.utils.phishingProtection_();
  return uri.match(goog.uri.utils.splitRe_);
};
goog.uri.utils.needsPhishingProtection_ = goog.userAgent.WEBKIT;
goog.uri.utils.phishingProtection_ = function() {
  if (goog.uri.utils.needsPhishingProtection_) {
    goog.uri.utils.needsPhishingProtection_ = !1;
    var location = goog.global.location;
    if (location) {
      var href = location.href;
      if (href) {
        var domain = goog.uri.utils.getDomain(href);
        if (domain && domain != location.hostname) {
          throw goog.uri.utils.needsPhishingProtection_ = !0, Error();
        }
      }
    }
  }
};
goog.uri.utils.decodeIfPossible_ = function(uri) {
  return uri && decodeURIComponent(uri);
};
goog.uri.utils.getComponentByIndex_ = function(componentIndex, uri) {
  return goog.uri.utils.split(uri)[componentIndex] || null;
};
goog.uri.utils.getScheme = function(uri) {
  return goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.SCHEME, uri);
};
goog.uri.utils.getEffectiveScheme = function(uri) {
  var scheme = goog.uri.utils.getScheme(uri);
  if (!scheme && self.location) {
    var protocol = self.location.protocol, scheme = protocol.substr(0, protocol.length - 1)
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
  return goog.uri.utils.decodeIfPossible_(goog.uri.utils.getDomainEncoded(uri));
};
goog.uri.utils.getPort = function(uri) {
  return Number(goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.PORT, uri)) || null;
};
goog.uri.utils.getPathEncoded = function(uri) {
  return goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.PATH, uri);
};
goog.uri.utils.getPath = function(uri) {
  return goog.uri.utils.decodeIfPossible_(goog.uri.utils.getPathEncoded(uri));
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
  if (goog.DEBUG && (0 <= uri.indexOf("#") || 0 <= uri.indexOf("?"))) {
    throw Error("goog.uri.utils: Fragment or query identifiers are not supported: [" + uri + "]");
  }
};
goog.uri.utils.appendQueryData_ = function(buffer) {
  if (buffer[1]) {
    var baseUri = buffer[0], hashIndex = baseUri.indexOf("#");
    0 <= hashIndex && (buffer.push(baseUri.substr(hashIndex)), buffer[0] = baseUri = baseUri.substr(0, hashIndex));
    var questionIndex = baseUri.indexOf("?");
    0 > questionIndex ? buffer[1] = "?" : questionIndex == baseUri.length - 1 && (buffer[1] = void 0);
  }
  return buffer.join("");
};
goog.uri.utils.appendKeyValuePairs_ = function(key, value, pairs) {
  if (goog.isArray(value)) {
    goog.asserts.assertArray(value);
    for (var j = 0;j < value.length;j++) {
      goog.uri.utils.appendKeyValuePairs_(key, String(value[j]), pairs);
    }
  } else {
    null != value && pairs.push("&", key, "" === value ? "" : "=", goog.string.urlEncode(value));
  }
};
goog.uri.utils.buildQueryDataBuffer_ = function(buffer, keysAndValues, opt_startIndex) {
  goog.asserts.assert(0 == Math.max(keysAndValues.length - (opt_startIndex || 0), 0) % 2, "goog.uri.utils: Key/value lists must be even in length.");
  for (var i = opt_startIndex || 0;i < keysAndValues.length;i += 2) {
    goog.uri.utils.appendKeyValuePairs_(keysAndValues[i], keysAndValues[i + 1], buffer);
  }
  return buffer;
};
goog.uri.utils.buildQueryData = function(keysAndValues, opt_startIndex) {
  var buffer = goog.uri.utils.buildQueryDataBuffer_([], keysAndValues, opt_startIndex);
  buffer[0] = "";
  return buffer.join("");
};
goog.uri.utils.buildQueryDataBufferFromMap_ = function(buffer, map) {
  for (var key in map) {
    goog.uri.utils.appendKeyValuePairs_(key, map[key], buffer);
  }
  return buffer;
};
goog.uri.utils.buildQueryDataFromMap = function(map) {
  var buffer = goog.uri.utils.buildQueryDataBufferFromMap_([], map);
  buffer[0] = "";
  return buffer.join("");
};
goog.uri.utils.appendParams = function(uri, var_args) {
  return goog.uri.utils.appendQueryData_(2 == arguments.length ? goog.uri.utils.buildQueryDataBuffer_([uri], arguments[1], 0) : goog.uri.utils.buildQueryDataBuffer_([uri], arguments, 1));
};
goog.uri.utils.appendParamsFromMap = function(uri, map) {
  return goog.uri.utils.appendQueryData_(goog.uri.utils.buildQueryDataBufferFromMap_([uri], map));
};
goog.uri.utils.appendParam = function(uri, key, opt_value) {
  var paramArr = [uri, "&", key];
  goog.isDefAndNotNull(opt_value) && paramArr.push("=", goog.string.urlEncode(opt_value));
  return goog.uri.utils.appendQueryData_(paramArr);
};
goog.uri.utils.findParam_ = function(uri, startIndex, keyEncoded, hashOrEndIndex) {
  for (var index = startIndex, keyLength = keyEncoded.length;0 <= (index = uri.indexOf(keyEncoded, index)) && index < hashOrEndIndex;) {
    var precedingChar = uri.charCodeAt(index - 1);
    if (precedingChar == goog.uri.utils.CharCode_.AMPERSAND || precedingChar == goog.uri.utils.CharCode_.QUESTION) {
      var followingChar = uri.charCodeAt(index + keyLength);
      if (!followingChar || followingChar == goog.uri.utils.CharCode_.EQUAL || followingChar == goog.uri.utils.CharCode_.AMPERSAND || followingChar == goog.uri.utils.CharCode_.HASH) {
        return index;
      }
    }
    index += keyLength + 1;
  }
  return-1;
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
  for (var hashOrEndIndex = uri.search(goog.uri.utils.hashOrEndRe_), position = 0, foundIndex, result = [];0 <= (foundIndex = goog.uri.utils.findParam_(uri, position, keyEncoded, hashOrEndIndex));) {
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
  for (var hashOrEndIndex = uri.search(goog.uri.utils.hashOrEndRe_), position = 0, foundIndex, buffer = [];0 <= (foundIndex = goog.uri.utils.findParam_(uri, position, keyEncoded, hashOrEndIndex));) {
    buffer.push(uri.substring(position, foundIndex)), position = Math.min(uri.indexOf("&", foundIndex) + 1 || hashOrEndIndex, hashOrEndIndex);
  }
  buffer.push(uri.substr(position));
  return buffer.join("").replace(goog.uri.utils.trailingQueryPunctuationRe_, "$1");
};
goog.uri.utils.setParam = function(uri, keyEncoded, value) {
  return goog.uri.utils.appendParam(goog.uri.utils.removeParam(uri, keyEncoded), keyEncoded, value);
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
goog.net = {};
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
goog.net.EventType = {COMPLETE:"complete", SUCCESS:"success", ERROR:"error", ABORT:"abort", READY:"ready", READY_STATE_CHANGE:"readystatechange", TIMEOUT:"timeout", INCREMENTAL_DATA:"incrementaldata", PROGRESS:"progress"};
goog.net.HttpStatus = {CONTINUE:100, SWITCHING_PROTOCOLS:101, OK:200, CREATED:201, ACCEPTED:202, NON_AUTHORITATIVE_INFORMATION:203, NO_CONTENT:204, RESET_CONTENT:205, PARTIAL_CONTENT:206, MULTIPLE_CHOICES:300, MOVED_PERMANENTLY:301, FOUND:302, SEE_OTHER:303, NOT_MODIFIED:304, USE_PROXY:305, TEMPORARY_REDIRECT:307, BAD_REQUEST:400, UNAUTHORIZED:401, PAYMENT_REQUIRED:402, FORBIDDEN:403, NOT_FOUND:404, METHOD_NOT_ALLOWED:405, NOT_ACCEPTABLE:406, PROXY_AUTHENTICATION_REQUIRED:407, REQUEST_TIMEOUT:408, 
CONFLICT:409, GONE:410, LENGTH_REQUIRED:411, PRECONDITION_FAILED:412, REQUEST_ENTITY_TOO_LARGE:413, REQUEST_URI_TOO_LONG:414, UNSUPPORTED_MEDIA_TYPE:415, REQUEST_RANGE_NOT_SATISFIABLE:416, EXPECTATION_FAILED:417, INTERNAL_SERVER_ERROR:500, NOT_IMPLEMENTED:501, BAD_GATEWAY:502, SERVICE_UNAVAILABLE:503, GATEWAY_TIMEOUT:504, HTTP_VERSION_NOT_SUPPORTED:505, QUIRK_IE_NO_CONTENT:1223};
goog.net.HttpStatus.isSuccess = function(status) {
  switch(status) {
    case goog.net.HttpStatus.OK:
    ;
    case goog.net.HttpStatus.CREATED:
    ;
    case goog.net.HttpStatus.ACCEPTED:
    ;
    case goog.net.HttpStatus.NO_CONTENT:
    ;
    case goog.net.HttpStatus.PARTIAL_CONTENT:
    ;
    case goog.net.HttpStatus.NOT_MODIFIED:
    ;
    case goog.net.HttpStatus.QUIRK_IE_NO_CONTENT:
      return!0;
    default:
      return!1;
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
    for (var ACTIVE_X_IDENTS = ["MSXML2.XMLHTTP.6.0", "MSXML2.XMLHTTP.3.0", "MSXML2.XMLHTTP", "Microsoft.XMLHTTP"], i = 0;i < ACTIVE_X_IDENTS.length;i++) {
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
  this.useXhr2Timeout_ = this.withCredentials_ = !1;
};
goog.inherits(goog.net.XhrIo, goog.events.EventTarget);
goog.net.XhrIo.ResponseType = {DEFAULT:"", TEXT:"text", DOCUMENT:"document", BLOB:"blob", ARRAY_BUFFER:"arraybuffer"};
goog.net.XhrIo.prototype.logger_ = goog.log.getLogger("goog.net.XhrIo");
goog.net.XhrIo.CONTENT_TYPE_HEADER = "Content-Type";
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
};
goog.net.XhrIo.cleanup = function() {
  for (var instances = goog.net.XhrIo.sendInstances_;instances.length;) {
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
  goog.object.containsKey(this.xhr_, "withCredentials") && (this.xhr_.withCredentials = this.withCredentials_);
  try {
    this.cleanUpTimeoutTimer_(), 0 < this.timeoutInterval_ && (this.useXhr2Timeout_ = goog.net.XhrIo.shouldUseXhr2Timeout_(this.xhr_), goog.log.fine(this.logger_, this.formatMsg_("Will abort after " + this.timeoutInterval_ + "ms if incomplete, xhr2 " + this.useXhr2Timeout_)), this.useXhr2Timeout_ ? (this.xhr_[goog.net.XhrIo.XHR2_TIMEOUT_] = this.timeoutInterval_, this.xhr_[goog.net.XhrIo.XHR2_ON_TIMEOUT_] = goog.bind(this.timeout_, this)) : this.timeoutId_ = goog.Timer.callOnce(this.timeout_, this.timeoutInterval_, 
    this)), goog.log.fine(this.logger_, this.formatMsg_("Sending request")), this.inSend_ = !0, this.xhr_.send(content), this.inSend_ = !1;
  } catch (err$$0) {
    goog.log.fine(this.logger_, this.formatMsg_("Send error: " + err$$0.message)), this.error_(goog.net.ErrorCode.EXCEPTION, err$$0);
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
  goog.isNumber(this.timeoutId_) && (goog.Timer.clear(this.timeoutId_), this.timeoutId_ = null);
};
goog.net.XhrIo.prototype.isActive = function() {
  return!!this.xhr_;
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
    return-1;
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
    return goog.json.parse(responseText);
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
      ;
      case goog.net.XhrIo.ResponseType.TEXT:
        return this.xhr_.responseText;
      case goog.net.XhrIo.ResponseType.ARRAY_BUFFER:
        if ("mozResponseArrayBuffer" in this.xhr_) {
          return this.xhr_.mozResponseArrayBuffer;
        }
      ;
    }
    goog.log.error(this.logger_, "Response type " + this.responseType_ + " is not supported on this browser");
    return null;
  } catch (e) {
    return goog.log.fine(this.logger_, "Can not get response: " + e.message), null;
  }
};
goog.net.XhrIo.prototype.getResponseHeader = function(key) {
  return this.xhr_ && this.isComplete() ? this.xhr_.getResponseHeader(key) : void 0;
};
goog.net.XhrIo.prototype.getAllResponseHeaders = function() {
  return this.xhr_ && this.isComplete() ? this.xhr_.getAllResponseHeaders() : "";
};
goog.net.XhrIo.prototype.getResponseHeaders = function() {
  for (var headersObject = {}, headersArray = this.getAllResponseHeaders().split("\r\n"), i = 0;i < headersArray.length;i++) {
    if (!goog.string.isEmpty(headersArray[i])) {
      var keyValue = goog.string.splitLimit(headersArray[i], ": ", 2);
      headersObject[keyValue[0]] = headersObject[keyValue[0]] ? headersObject[keyValue[0]] + (", " + keyValue[1]) : keyValue[1];
    }
  }
  return headersObject;
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
  var m;
  opt_uri instanceof goog.Uri ? (this.ignoreCase_ = goog.isDef(opt_ignoreCase) ? opt_ignoreCase : opt_uri.getIgnoreCase(), this.setScheme(opt_uri.getScheme()), this.setUserInfo(opt_uri.getUserInfo()), this.setDomain(opt_uri.getDomain()), this.setPort(opt_uri.getPort()), this.setPath(opt_uri.getPath()), this.setQueryData(opt_uri.getQueryData().clone()), this.setFragment(opt_uri.getFragment())) : opt_uri && (m = goog.uri.utils.split(String(opt_uri))) ? (this.ignoreCase_ = !!opt_ignoreCase, this.setScheme(m[goog.uri.utils.ComponentIndex.SCHEME] || 
  "", !0), this.setUserInfo(m[goog.uri.utils.ComponentIndex.USER_INFO] || "", !0), this.setDomain(m[goog.uri.utils.ComponentIndex.DOMAIN] || "", !0), this.setPort(m[goog.uri.utils.ComponentIndex.PORT]), this.setPath(m[goog.uri.utils.ComponentIndex.PATH] || "", !0), this.setQueryData(m[goog.uri.utils.ComponentIndex.QUERY_DATA] || "", !0), this.setFragment(m[goog.uri.utils.ComponentIndex.FRAGMENT] || "", !0)) : (this.ignoreCase_ = !!opt_ignoreCase, this.queryData_ = new goog.Uri.QueryData(null, null, 
  this.ignoreCase_));
};
goog.Uri.preserveParameterTypesCompatibilityFlag = !1;
goog.Uri.RANDOM_PARAM = goog.uri.utils.StandardQueryParam.RANDOM;
goog.Uri.prototype.scheme_ = "";
goog.Uri.prototype.userInfo_ = "";
goog.Uri.prototype.domain_ = "";
goog.Uri.prototype.port_ = null;
goog.Uri.prototype.path_ = "";
goog.Uri.prototype.fragment_ = "";
goog.Uri.prototype.isReadOnly_ = !1;
goog.Uri.prototype.ignoreCase_ = !1;
goog.Uri.prototype.toString = function() {
  var out = [], scheme = this.getScheme();
  scheme && out.push(goog.Uri.encodeSpecialChars_(scheme, goog.Uri.reDisallowedInSchemeOrUserInfo_), ":");
  var domain = this.getDomain();
  if (domain) {
    out.push("//");
    var userInfo = this.getUserInfo();
    userInfo && out.push(goog.Uri.encodeSpecialChars_(userInfo, goog.Uri.reDisallowedInSchemeOrUserInfo_), "@");
    out.push(goog.string.urlEncode(domain));
    var port = this.getPort();
    null != port && out.push(":", String(port));
  }
  var path = this.getPath();
  path && (this.hasDomain() && "/" != path.charAt(0) && out.push("/"), out.push(goog.Uri.encodeSpecialChars_(path, "/" == path.charAt(0) ? goog.Uri.reDisallowedInAbsolutePath_ : goog.Uri.reDisallowedInRelativePath_)));
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
  overridden ? absoluteUri.setQueryData(relativeUri.getDecodedQuery()) : overridden = relativeUri.hasFragment();
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
  if (this.scheme_ = opt_decode ? goog.Uri.decodeOrEmpty_(newScheme) : newScheme) {
    this.scheme_ = this.scheme_.replace(/:$/, "");
  }
  return this;
};
goog.Uri.prototype.hasScheme = function() {
  return!!this.scheme_;
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
  return!!this.userInfo_;
};
goog.Uri.prototype.getDomain = function() {
  return this.domain_;
};
goog.Uri.prototype.setDomain = function(newDomain, opt_decode) {
  this.enforceReadOnly();
  this.domain_ = opt_decode ? goog.Uri.decodeOrEmpty_(newDomain) : newDomain;
  return this;
};
goog.Uri.prototype.hasDomain = function() {
  return!!this.domain_;
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
  this.path_ = opt_decode ? goog.Uri.decodeOrEmpty_(newPath) : newPath;
  return this;
};
goog.Uri.prototype.hasPath = function() {
  return!!this.path_;
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
  return!!this.fragment_;
};
goog.Uri.prototype.hasSameDomainAs = function(uri2) {
  return(!this.hasDomain() && !uri2.hasDomain() || this.getDomain() == uri2.getDomain()) && (!this.hasPort() && !uri2.hasPort() || this.getPort() == uri2.getPort());
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
    for (var leadingSlash = goog.string.startsWith(path, "/"), segments = path.split("/"), out = [], pos = 0;pos < segments.length;) {
      var segment = segments[pos++];
      "." == segment ? leadingSlash && pos == segments.length && out.push("") : ".." == segment ? ((1 < out.length || 1 == out.length && "" != out[0]) && out.pop(), leadingSlash && pos == segments.length && out.push("")) : (out.push(segment), leadingSlash = !0);
    }
    return out.join("/");
  }
  return path;
};
goog.Uri.decodeOrEmpty_ = function(val) {
  return val ? decodeURIComponent(val) : "";
};
goog.Uri.encodeSpecialChars_ = function(unescapedPart, extra) {
  return goog.isString(unescapedPart) ? encodeURI(unescapedPart).replace(extra, goog.Uri.encodeChar_) : null;
};
goog.Uri.encodeChar_ = function(ch) {
  var n = ch.charCodeAt(0);
  return "%" + (n >> 4 & 15).toString(16) + (n & 15).toString(16);
};
goog.Uri.reDisallowedInSchemeOrUserInfo_ = /[#\/\?@]/g;
goog.Uri.reDisallowedInRelativePath_ = /[\#\?:]/g;
goog.Uri.reDisallowedInAbsolutePath_ = /[\#\?]/g;
goog.Uri.reDisallowedInQuery_ = /[\#\?@]/g;
goog.Uri.reDisallowedInFragment_ = /#/g;
goog.Uri.haveSameDomain = function(uri1String, uri2String) {
  var pieces1 = goog.uri.utils.split(uri1String), pieces2 = goog.uri.utils.split(uri2String);
  return pieces1[goog.uri.utils.ComponentIndex.DOMAIN] == pieces2[goog.uri.utils.ComponentIndex.DOMAIN] && pieces1[goog.uri.utils.ComponentIndex.PORT] == pieces2[goog.uri.utils.ComponentIndex.PORT];
};
goog.Uri.QueryData = function(opt_query, opt_uri, opt_ignoreCase) {
  this.encodedQuery_ = opt_query || null;
  this.ignoreCase_ = !!opt_ignoreCase;
};
goog.Uri.QueryData.prototype.ensureKeyMapInitialized_ = function() {
  if (!this.keyMap_ && (this.keyMap_ = new goog.structs.Map, this.count_ = 0, this.encodedQuery_)) {
    for (var pairs = this.encodedQuery_.split("&"), i = 0;i < pairs.length;i++) {
      var indexOfEquals = pairs[i].indexOf("="), name = null, value = null;
      0 <= indexOfEquals ? (name = pairs[i].substring(0, indexOfEquals), value = pairs[i].substring(indexOfEquals + 1)) : name = pairs[i];
      name = goog.string.urlDecode(name);
      name = this.getKeyName_(name);
      this.add(name, value ? goog.string.urlDecode(value) : "");
    }
  }
};
goog.Uri.QueryData.createFromMap = function(map, opt_uri, opt_ignoreCase) {
  var keys = goog.structs.getKeys(map);
  if ("undefined" == typeof keys) {
    throw Error("Keys are undefined");
  }
  for (var queryData = new goog.Uri.QueryData(null, null, opt_ignoreCase), values = goog.structs.getValues(map), i = 0;i < keys.length;i++) {
    var key = keys[i], value = values[i];
    goog.isArray(value) ? queryData.setValues(key, value) : queryData.add(key, value);
  }
  return queryData;
};
goog.Uri.QueryData.createFromKeysValues = function(keys, values, opt_uri, opt_ignoreCase) {
  if (keys.length != values.length) {
    throw Error("Mismatched lengths for keys/values");
  }
  for (var queryData = new goog.Uri.QueryData(null, null, opt_ignoreCase), i = 0;i < keys.length;i++) {
    queryData.add(keys[i], values[i]);
  }
  return queryData;
};
goog.Uri.QueryData.prototype.keyMap_ = null;
goog.Uri.QueryData.prototype.count_ = null;
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
  this.count_++;
  return this;
};
goog.Uri.QueryData.prototype.remove = function(key) {
  this.ensureKeyMapInitialized_();
  key = this.getKeyName_(key);
  return this.keyMap_.containsKey(key) ? (this.invalidateCache_(), this.count_ -= this.keyMap_.get(key).length, this.keyMap_.remove(key)) : !1;
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
goog.Uri.QueryData.prototype.getKeys = function() {
  this.ensureKeyMapInitialized_();
  for (var vals = this.keyMap_.getValues(), keys = this.keyMap_.getKeys(), rv = [], i = 0;i < keys.length;i++) {
    for (var val = vals[i], j = 0;j < val.length;j++) {
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
    for (var values = this.keyMap_.getValues(), i = 0;i < values.length;i++) {
      rv = goog.array.concat(rv, values[i]);
    }
  }
  return rv;
};
goog.Uri.QueryData.prototype.set = function(key, value) {
  this.ensureKeyMapInitialized_();
  this.invalidateCache_();
  key = this.getKeyName_(key);
  this.containsKey(key) && (this.count_ -= this.keyMap_.get(key).length);
  this.keyMap_.set(key, [value]);
  this.count_++;
  return this;
};
goog.Uri.QueryData.prototype.get = function(key, opt_default) {
  var values = key ? this.getValues(key) : [];
  return goog.Uri.preserveParameterTypesCompatibilityFlag ? 0 < values.length ? values[0] : opt_default : 0 < values.length ? String(values[0]) : opt_default;
};
goog.Uri.QueryData.prototype.setValues = function(key, values) {
  this.remove(key);
  0 < values.length && (this.invalidateCache_(), this.keyMap_.set(this.getKeyName_(key), goog.array.clone(values)), this.count_ += values.length);
};
goog.Uri.QueryData.prototype.toString = function() {
  if (this.encodedQuery_) {
    return this.encodedQuery_;
  }
  if (!this.keyMap_) {
    return "";
  }
  for (var sb = [], keys = this.keyMap_.getKeys(), i = 0;i < keys.length;i++) {
    for (var key = keys[i], encodedKey = goog.string.urlEncode(key), val = this.getValues(key), j = 0;j < val.length;j++) {
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
  for (var i = 0;i < arguments.length;i++) {
    goog.structs.forEach(arguments[i], function(value, key) {
      this.add(key, value);
    }, this);
  }
};
var ee = {data:{}};
ee.data.apiBaseUrl_ = null;
ee.data.tileBaseUrl_ = null;
ee.data.initialized_ = !1;
ee.data.deadlineMs_ = 0;
ee.data.DEFAULT_API_BASE_URL_ = "/api";
ee.data.DEFAULT_TILE_BASE_URL_ = "https://earthengine.googleapis.com";
ee.data.TaskUpdateActions = {CANCEL:"CANCEL", UPDATE:"UPDATE"};
ee.data.initialize = function(opt_apiBaseUrl, opt_tileBaseUrl) {
  goog.isDefAndNotNull(opt_apiBaseUrl) ? ee.data.apiBaseUrl_ = opt_apiBaseUrl : ee.data.initialized_ || (ee.data.apiBaseUrl_ = ee.data.DEFAULT_API_BASE_URL_);
  goog.isDefAndNotNull(opt_tileBaseUrl) ? ee.data.tileBaseUrl_ = opt_tileBaseUrl : ee.data.initialized_ || (ee.data.tileBaseUrl_ = ee.data.DEFAULT_TILE_BASE_URL_);
  ee.data.initialized_ = !0;
};
ee.data.reset = function() {
  ee.data.apiBaseUrl_ = null;
  ee.data.tileBaseUrl_ = null;
  ee.data.initialized_ = !1;
};
ee.data.setDeadline = function(milliseconds) {
  ee.data.deadlineMs_ = milliseconds;
};
ee.data.getTileBaseUrl = function() {
  return ee.data.tileBaseUrl_;
};
ee.data.getInfo = function(id, opt_callback) {
  goog.global.console && goog.global.console.error && goog.global.console.error("ee.data.getInfo is DEPRECATED. Use ee.data.getValue() instead.");
  return ee.data.send_("/info", (new goog.Uri.QueryData).add("id", id), opt_callback);
};
ee.data.getList = function(params, opt_callback) {
  var request = ee.data.makeRequest_(params);
  return ee.data.send_("/list", request, opt_callback);
};
ee.data.getMapId = function(params, opt_callback) {
  params = goog.object.clone(params);
  params.json_format = "v2";
  return ee.data.send_("/mapid", ee.data.makeRequest_(params), opt_callback);
};
ee.data.getTileUrl = function(mapid, x, y, z) {
  var width = Math.pow(2, z);
  x %= width;
  0 > x && (x += width);
  return[ee.data.tileBaseUrl_, "map", mapid.mapid, z, x, y].join("/") + "?token=" + mapid.token;
};
ee.data.getValue = function(params, opt_callback) {
  params = goog.object.clone(params);
  params.json_format = "v2";
  return ee.data.send_("/value", ee.data.makeRequest_(params), opt_callback);
};
ee.data.getThumbId = function(params, opt_callback) {
  params = goog.object.clone(params);
  params.json_format = "v2";
  goog.isArray(params.size) && (params.size = params.size.join("x"));
  var request = ee.data.makeRequest_(params).add("getid", "1");
  return ee.data.send_("/thumb", request, opt_callback);
};
ee.data.makeThumbUrl = function(id) {
  return ee.data.tileBaseUrl_ + "/api/thumb?thumbid=" + id.thumbid + "&token=" + id.token;
};
ee.data.getDownloadId = function(params, opt_callback) {
  params = goog.object.clone(params);
  params.json_format = "v2";
  return ee.data.send_("/download", ee.data.makeRequest_(params), opt_callback);
};
ee.data.makeDownloadUrl = function(id) {
  return ee.data.tileBaseUrl_ + "/api/download?docid=" + id.docid + "&token=" + id.token;
};
ee.data.getTableDownloadId = function(params, opt_callback) {
  params = goog.object.clone(params);
  params.json_format = "v2";
  return ee.data.send_("/table", ee.data.makeRequest_(params), opt_callback);
};
ee.data.makeTableDownloadUrl = function(id) {
  return ee.data.tileBaseUrl_ + "/api/table?docid=" + id.docid + "&token=" + id.token;
};
ee.data.getAlgorithms = function(opt_callback) {
  return ee.data.send_("/algorithms", null, opt_callback, "GET");
};
ee.data.getGMEProjects = function(opt_callback) {
  return ee.data.send_("/gmeprojects", null, opt_callback, "GET");
};
ee.data.createAsset = function(value, opt_path, opt_force, opt_callback) {
  var args = {value:value, json_format:"v2"};
  void 0 !== opt_path && (args.id = opt_path);
  args.force = opt_force || !1;
  return ee.data.send_("/create", ee.data.makeRequest_(args), opt_callback);
};
ee.data.createFolder = function(path, opt_force, opt_callback) {
  return ee.data.send_("/createfolder", ee.data.makeRequest_({id:path, force:opt_force || !1}), opt_callback);
};
ee.data.search = function(query, opt_callback) {
  var searchParams = (new goog.Uri.QueryData).add("q", query);
  return ee.data.send_("/search", searchParams, opt_callback, "GET");
};
ee.data.newTaskId = function(opt_count, opt_callback) {
  var params = {};
  goog.isNumber(opt_count) && (params.count = opt_count);
  return ee.data.send_("/newtaskid", ee.data.makeRequest_(params), opt_callback);
};
goog.exportSymbol("ee.data.newTaskId", ee.data.newTaskId);
ee.data.getTaskStatus = function(task_id, opt_callback) {
  if (goog.isString(task_id)) {
    task_id = [task_id];
  } else {
    if (!goog.isArray(task_id)) {
      throw Error("Invalid task_id: expected a string or an array of strings.");
    }
  }
  var url = "/taskstatus?q=" + task_id.join();
  return ee.data.send_(url, null, opt_callback, "GET");
};
goog.exportSymbol("ee.data.getTaskStatus", ee.data.getTaskStatus);
ee.data.getTaskList = function(opt_callback) {
  return ee.data.send_("/tasklist", null, opt_callback, "GET");
};
goog.exportSymbol("ee.data.getTaskList", ee.data.getTaskList);
ee.data.cancelTask = function(task_id, opt_callback) {
  return ee.data.updateTask(task_id, ee.data.TaskUpdateActions.CANCEL, opt_callback);
};
goog.exportSymbol("ee.data.cancelTask", ee.data.cancelTask);
ee.data.updateTask = function(task_id, action, opt_callback) {
  if (goog.isString(task_id)) {
    task_id = [task_id];
  } else {
    if (!goog.isArray(task_id)) {
      throw Error("Invalid task_id: expected a string or an array of strings.");
    }
  }
  if (!goog.object.containsValue(ee.data.TaskUpdateActions, action)) {
    throw Error("Invalid action: " + action);
  }
  return ee.data.send_("/updatetask", ee.data.makeRequest_({id:task_id, action:action}), opt_callback, "POST");
};
goog.exportSymbol("ee.data.updateTask", ee.data.updateTask);
ee.data.prepareValue = function(task_id, params, opt_callback) {
  params = goog.object.clone(params);
  params.tid = task_id;
  return ee.data.send_("/prepare", ee.data.makeRequest_(params), opt_callback);
};
goog.exportSymbol("ee.data.prepareValue", ee.data.prepareValue);
ee.data.startProcessing = function(task_id, params, opt_callback) {
  params = goog.object.clone(params);
  params.id = task_id;
  return ee.data.send_("/processingrequest", ee.data.makeRequest_(params), opt_callback);
};
goog.exportSymbol("ee.data.startProcessing", ee.data.startProcessing);
ee.data.send_ = function(path, params, opt_callback$$0, opt_method) {
  function handleResponse(responseText, opt_callback) {
    var jsonIsInvalid = !1;
    try {
      var response = goog.json.parse(responseText), data = response.data;
    } catch (e) {
      jsonIsInvalid = !0;
    }
    var errorMessage = void 0;
    jsonIsInvalid || !("data" in response || "error" in response) ? errorMessage = "Malformed response: " + responseText : "error" in response && (errorMessage = response.error.message);
    if (opt_callback) {
      opt_callback(data, errorMessage);
    } else {
      if (!errorMessage) {
        return data;
      }
      throw Error(errorMessage);
    }
  }
  ee.data.initialize();
  opt_method = opt_method || "POST";
  var url = ee.data.apiBaseUrl_ + path, requestData = params ? params.toString() : "";
  if (opt_callback$$0) {
    goog.net.XhrIo.send(url, function(e) {
      return handleResponse(e.target.getResponseText(), opt_callback$$0);
    }, opt_method, requestData, {"Content-Type":"application/x-www-form-urlencoded"}, ee.data.deadlineMs_);
  } else {
    var xmlhttp = goog.net.XmlHttp();
    xmlhttp.open(opt_method, url, !1);
    xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xmlhttp.send(requestData);
    return handleResponse(xmlhttp.responseText, null);
  }
};
ee.data.makeRequest_ = function(params) {
  var request = new goog.Uri.QueryData, item;
  for (item in params) {
    request.set(item, params[item]);
  }
  return request;
};
ee.data.setupMockSend = function(opt_calls) {
  var calls = opt_calls ? goog.object.clone(opt_calls) : {};
  goog.net.XhrIo.send = function(url, callback, method, data) {
    var e = new function() {
    };
    e.target = {};
    e.target.getResponseText = function() {
      return url in calls ? goog.isString(calls[url]) ? calls[url] : calls[url](url, callback, method, data) : '{"error": {}}';
    };
    setTimeout(goog.bind(callback, e, e), 0);
  };
  var fakeXmlHttp = function() {
  }, method$$0 = null;
  fakeXmlHttp.prototype.open = function(method, urlIn) {
    this.url = urlIn;
    this.method = method;
  };
  fakeXmlHttp.prototype.setRequestHeader = function() {
  };
  fakeXmlHttp.prototype.send = function(data) {
    this.url in calls ? goog.isString(calls[this.url]) ? this.responseText = calls[this.url] : this.responseText = calls[this.url](this.url, this.method, data) : this.responseText = goog.json.serialize({data:{url:this.url, method:this.method, data:data}});
  };
  goog.net.XmlHttp = function() {
    return new fakeXmlHttp;
  };
};
ee.Encodable = function() {
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
    for (var i = 0;16 > i;++i) {
      X[i] = buf.charCodeAt(opt_offset++) | buf.charCodeAt(opt_offset++) << 8 | buf.charCodeAt(opt_offset++) << 16 | buf.charCodeAt(opt_offset++) << 24;
    }
  } else {
    for (i = 0;16 > i;++i) {
      X[i] = buf[opt_offset++] | buf[opt_offset++] << 8 | buf[opt_offset++] << 16 | buf[opt_offset++] << 24;
    }
  }
  var A = this.chain_[0], B = this.chain_[1], C = this.chain_[2], D = this.chain_[3], sum = 0, sum = A + (D ^ B & (C ^ D)) + X[0] + 3614090360 & 4294967295, A = B + (sum << 7 & 4294967295 | sum >>> 25), sum = D + (C ^ A & (B ^ C)) + X[1] + 3905402710 & 4294967295, D = A + (sum << 12 & 4294967295 | sum >>> 20), sum = C + (B ^ D & (A ^ B)) + X[2] + 606105819 & 4294967295, C = D + (sum << 17 & 4294967295 | sum >>> 15), sum = B + (A ^ C & (D ^ A)) + X[3] + 3250441966 & 4294967295, B = C + (sum << 22 & 
  4294967295 | sum >>> 10), sum = A + (D ^ B & (C ^ D)) + X[4] + 4118548399 & 4294967295, A = B + (sum << 7 & 4294967295 | sum >>> 25), sum = D + (C ^ A & (B ^ C)) + X[5] + 1200080426 & 4294967295, D = A + (sum << 12 & 4294967295 | sum >>> 20), sum = C + (B ^ D & (A ^ B)) + X[6] + 2821735955 & 4294967295, C = D + (sum << 17 & 4294967295 | sum >>> 15), sum = B + (A ^ C & (D ^ A)) + X[7] + 4249261313 & 4294967295, B = C + (sum << 22 & 4294967295 | sum >>> 10), sum = A + (D ^ B & (C ^ D)) + X[8] + 1770035416 & 
  4294967295, A = B + (sum << 7 & 4294967295 | sum >>> 25), sum = D + (C ^ A & (B ^ C)) + X[9] + 2336552879 & 4294967295, D = A + (sum << 12 & 4294967295 | sum >>> 20), sum = C + (B ^ D & (A ^ B)) + X[10] + 4294925233 & 4294967295, C = D + (sum << 17 & 4294967295 | sum >>> 15), sum = B + (A ^ C & (D ^ A)) + X[11] + 2304563134 & 4294967295, B = C + (sum << 22 & 4294967295 | sum >>> 10), sum = A + (D ^ B & (C ^ D)) + X[12] + 1804603682 & 4294967295, A = B + (sum << 7 & 4294967295 | sum >>> 25), sum = 
  D + (C ^ A & (B ^ C)) + X[13] + 4254626195 & 4294967295, D = A + (sum << 12 & 4294967295 | sum >>> 20), sum = C + (B ^ D & (A ^ B)) + X[14] + 2792965006 & 4294967295, C = D + (sum << 17 & 4294967295 | sum >>> 15), sum = B + (A ^ C & (D ^ A)) + X[15] + 1236535329 & 4294967295, B = C + (sum << 22 & 4294967295 | sum >>> 10), sum = A + (C ^ D & (B ^ C)) + X[1] + 4129170786 & 4294967295, A = B + (sum << 5 & 4294967295 | sum >>> 27), sum = D + (B ^ C & (A ^ B)) + X[6] + 3225465664 & 4294967295, D = A + 
  (sum << 9 & 4294967295 | sum >>> 23), sum = C + (A ^ B & (D ^ A)) + X[11] + 643717713 & 4294967295, C = D + (sum << 14 & 4294967295 | sum >>> 18), sum = B + (D ^ A & (C ^ D)) + X[0] + 3921069994 & 4294967295, B = C + (sum << 20 & 4294967295 | sum >>> 12), sum = A + (C ^ D & (B ^ C)) + X[5] + 3593408605 & 4294967295, A = B + (sum << 5 & 4294967295 | sum >>> 27), sum = D + (B ^ C & (A ^ B)) + X[10] + 38016083 & 4294967295, D = A + (sum << 9 & 4294967295 | sum >>> 23), sum = C + (A ^ B & (D ^ A)) + 
  X[15] + 3634488961 & 4294967295, C = D + (sum << 14 & 4294967295 | sum >>> 18), sum = B + (D ^ A & (C ^ D)) + X[4] + 3889429448 & 4294967295, B = C + (sum << 20 & 4294967295 | sum >>> 12), sum = A + (C ^ D & (B ^ C)) + X[9] + 568446438 & 4294967295, A = B + (sum << 5 & 4294967295 | sum >>> 27), sum = D + (B ^ C & (A ^ B)) + X[14] + 3275163606 & 4294967295, D = A + (sum << 9 & 4294967295 | sum >>> 23), sum = C + (A ^ B & (D ^ A)) + X[3] + 4107603335 & 4294967295, C = D + (sum << 14 & 4294967295 | 
  sum >>> 18), sum = B + (D ^ A & (C ^ D)) + X[8] + 1163531501 & 4294967295, B = C + (sum << 20 & 4294967295 | sum >>> 12), sum = A + (C ^ D & (B ^ C)) + X[13] + 2850285829 & 4294967295, A = B + (sum << 5 & 4294967295 | sum >>> 27), sum = D + (B ^ C & (A ^ B)) + X[2] + 4243563512 & 4294967295, D = A + (sum << 9 & 4294967295 | sum >>> 23), sum = C + (A ^ B & (D ^ A)) + X[7] + 1735328473 & 4294967295, C = D + (sum << 14 & 4294967295 | sum >>> 18), sum = B + (D ^ A & (C ^ D)) + X[12] + 2368359562 & 
  4294967295, B = C + (sum << 20 & 4294967295 | sum >>> 12), sum = A + (B ^ C ^ D) + X[5] + 4294588738 & 4294967295, A = B + (sum << 4 & 4294967295 | sum >>> 28), sum = D + (A ^ B ^ C) + X[8] + 2272392833 & 4294967295, D = A + (sum << 11 & 4294967295 | sum >>> 21), sum = C + (D ^ A ^ B) + X[11] + 1839030562 & 4294967295, C = D + (sum << 16 & 4294967295 | sum >>> 16), sum = B + (C ^ D ^ A) + X[14] + 4259657740 & 4294967295, B = C + (sum << 23 & 4294967295 | sum >>> 9), sum = A + (B ^ C ^ D) + X[1] + 
  2763975236 & 4294967295, A = B + (sum << 4 & 4294967295 | sum >>> 28), sum = D + (A ^ B ^ C) + X[4] + 1272893353 & 4294967295, D = A + (sum << 11 & 4294967295 | sum >>> 21), sum = C + (D ^ A ^ B) + X[7] + 4139469664 & 4294967295, C = D + (sum << 16 & 4294967295 | sum >>> 16), sum = B + (C ^ D ^ A) + X[10] + 3200236656 & 4294967295, B = C + (sum << 23 & 4294967295 | sum >>> 9), sum = A + (B ^ C ^ D) + X[13] + 681279174 & 4294967295, A = B + (sum << 4 & 4294967295 | sum >>> 28), sum = D + (A ^ B ^ 
  C) + X[0] + 3936430074 & 4294967295, D = A + (sum << 11 & 4294967295 | sum >>> 21), sum = C + (D ^ A ^ B) + X[3] + 3572445317 & 4294967295, C = D + (sum << 16 & 4294967295 | sum >>> 16), sum = B + (C ^ D ^ A) + X[6] + 76029189 & 4294967295, B = C + (sum << 23 & 4294967295 | sum >>> 9), sum = A + (B ^ C ^ D) + X[9] + 3654602809 & 4294967295, A = B + (sum << 4 & 4294967295 | sum >>> 28), sum = D + (A ^ B ^ C) + X[12] + 3873151461 & 4294967295, D = A + (sum << 11 & 4294967295 | sum >>> 21), sum = 
  C + (D ^ A ^ B) + X[15] + 530742520 & 4294967295, C = D + (sum << 16 & 4294967295 | sum >>> 16), sum = B + (C ^ D ^ A) + X[2] + 3299628645 & 4294967295, B = C + (sum << 23 & 4294967295 | sum >>> 9), sum = A + (C ^ (B | ~D)) + X[0] + 4096336452 & 4294967295, A = B + (sum << 6 & 4294967295 | sum >>> 26), sum = D + (B ^ (A | ~C)) + X[7] + 1126891415 & 4294967295, D = A + (sum << 10 & 4294967295 | sum >>> 22), sum = C + (A ^ (D | ~B)) + X[14] + 2878612391 & 4294967295, C = D + (sum << 15 & 4294967295 | 
  sum >>> 17), sum = B + (D ^ (C | ~A)) + X[5] + 4237533241 & 4294967295, B = C + (sum << 21 & 4294967295 | sum >>> 11), sum = A + (C ^ (B | ~D)) + X[12] + 1700485571 & 4294967295, A = B + (sum << 6 & 4294967295 | sum >>> 26), sum = D + (B ^ (A | ~C)) + X[3] + 2399980690 & 4294967295, D = A + (sum << 10 & 4294967295 | sum >>> 22), sum = C + (A ^ (D | ~B)) + X[10] + 4293915773 & 4294967295, C = D + (sum << 15 & 4294967295 | sum >>> 17), sum = B + (D ^ (C | ~A)) + X[1] + 2240044497 & 4294967295, B = 
  C + (sum << 21 & 4294967295 | sum >>> 11), sum = A + (C ^ (B | ~D)) + X[8] + 1873313359 & 4294967295, A = B + (sum << 6 & 4294967295 | sum >>> 26), sum = D + (B ^ (A | ~C)) + X[15] + 4264355552 & 4294967295, D = A + (sum << 10 & 4294967295 | sum >>> 22), sum = C + (A ^ (D | ~B)) + X[6] + 2734768916 & 4294967295, C = D + (sum << 15 & 4294967295 | sum >>> 17), sum = B + (D ^ (C | ~A)) + X[13] + 1309151649 & 4294967295, B = C + (sum << 21 & 4294967295 | sum >>> 11), sum = A + (C ^ (B | ~D)) + X[4] + 
  4149444226 & 4294967295, A = B + (sum << 6 & 4294967295 | sum >>> 26), sum = D + (B ^ (A | ~C)) + X[11] + 3174756917 & 4294967295, D = A + (sum << 10 & 4294967295 | sum >>> 22), sum = C + (A ^ (D | ~B)) + X[2] + 718787259 & 4294967295, C = D + (sum << 15 & 4294967295 | sum >>> 17), sum = B + (D ^ (C | ~A)) + X[9] + 3951481745 & 4294967295;
  this.chain_[0] = this.chain_[0] + A & 4294967295;
  this.chain_[1] = this.chain_[1] + (C + (sum << 21 & 4294967295 | sum >>> 11)) & 4294967295;
  this.chain_[2] = this.chain_[2] + C & 4294967295;
  this.chain_[3] = this.chain_[3] + D & 4294967295;
};
goog.crypt.Md5.prototype.update = function(bytes, opt_length) {
  goog.isDef(opt_length) || (opt_length = bytes.length);
  for (var lengthMinusBlock = opt_length - this.blockSize, block = this.block_, blockLength = this.blockLength_, i = 0;i < opt_length;) {
    if (0 == blockLength) {
      for (;i <= lengthMinusBlock;) {
        this.compress_(bytes, i), i += this.blockSize;
      }
    }
    if (goog.isString(bytes)) {
      for (;i < opt_length;) {
        if (block[blockLength++] = bytes.charCodeAt(i++), blockLength == this.blockSize) {
          this.compress_(block);
          blockLength = 0;
          break;
        }
      }
    } else {
      for (;i < opt_length;) {
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
  for (var i = 1;i < pad.length - 8;++i) {
    pad[i] = 0;
  }
  for (var totalBits = 8 * this.totalLength_, i = pad.length - 8;i < pad.length;++i) {
    pad[i] = totalBits & 255, totalBits /= 256;
  }
  this.update(pad);
  for (var digest = Array(16), n = 0, i = 0;4 > i;++i) {
    for (var j = 0;32 > j;j += 8) {
      digest[n++] = this.chain_[i] >>> j & 255;
    }
  }
  return digest;
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
ee.Serializer.encode = function(obj) {
  return(new ee.Serializer(!0)).encode_(obj);
};
ee.Serializer.toJSON = function(obj) {
  return ee.Serializer.jsonSerializer_.serialize(ee.Serializer.encode(obj));
};
ee.Serializer.toReadableJSON = function(obj) {
  var encoded = (new ee.Serializer(!1)).encode_(obj);
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
  var result, hash = goog.isObject(object) ? object[this.HASH_KEY] : null;
  if (this.isCompound_ && null != hash && this.encoded_[hash]) {
    return{type:"ValueRef", value:this.encoded_[hash]};
  }
  if (null === object || goog.isBoolean(object) || goog.isNumber(object) || goog.isString(object)) {
    return object;
  }
  if (goog.isDateLike(object)) {
    return{type:"Invocation", functionName:"Date", arguments:{value:Math.floor(object.getTime())}};
  }
  if (object instanceof ee.Encodable) {
    if (result = object.encode(goog.bind(this.encodeValue_, this)), !(goog.isArray(result) || goog.isObject(result) && "ArgumentRef" != result.type)) {
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
    ee.Serializer.hash_.reset();
    ee.Serializer.hash_.update(ee.Serializer.jsonSerializer_.serialize(result));
    var hash = ee.Serializer.hash_.digest().toString(), name;
    this.encoded_[hash] ? name = this.encoded_[hash] : (name = String(this.scope_.length), this.scope_.push([name, result]), this.encoded_[hash] = name);
    object[this.HASH_KEY] = hash;
    this.withHashes_.push(object);
    return{type:"ValueRef", value:name};
  }
  return result;
};
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
ee.ComputedObject.prototype.getInfo = function(opt_callback) {
  return ee.data.getValue({json:this.serialize()}, opt_callback);
};
ee.ComputedObject.prototype.encode = function(encoder) {
  if (this.isVariable()) {
    return{type:"ArgumentRef", value:this.varName};
  }
  var encodedArgs = {}, name;
  for (name in this.args) {
    goog.isDef(this.args[name]) && (encodedArgs[name] = encoder(this.args[name]));
  }
  var result = {type:"Invocation", arguments:encodedArgs}, func = encoder(this.func);
  result[goog.isString(func) ? "functionName" : "function"] = func;
  return result;
};
ee.ComputedObject.prototype.serialize = function() {
  return ee.Serializer.toJSON(this);
};
ee.ComputedObject.prototype.toString = function() {
  return "ee." + this.name() + "(" + ee.Serializer.toReadableJSON(this) + ")";
};
ee.ComputedObject.prototype.isVariable = function() {
  return goog.isNull(this.func) && goog.isNull(this.args);
};
ee.ComputedObject.prototype.name = function() {
  return "ComputedObject";
};
ee.ComputedObject.prototype.cast = function(obj) {
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
ee.Function.prototype.promoteArgs = function(args) {
  for (var specs = this.getSignature().args, promotedArgs = {}, known = {}, i = 0;i < specs.length;i++) {
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
  for (var namedArgs = {}, i = 0;i < args.length;i++) {
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
    for (var i = 0;i < signature.args.length;i++) {
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
    return!0;
  }
  switch(firstType) {
    case "Element":
    ;
    case "EEObject":
      return "EEObject" == secondType || "Element" == secondType || "Image" == secondType || "Feature" == secondType || "Collection" == secondType || "ImageCollection" == secondType || "FeatureCollection" == secondType;
    case "FeatureCollection":
    ;
    case "Collection":
      return "Collection" == secondType || "ImageCollection" == secondType || "FeatureCollection" == secondType;
    case "Object":
      return!0;
    default:
      return!1;
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
    return!goog.isNull(proto) && goog.isNull(Object.getPrototypeOf(proto));
  }
  return!1;
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
    return!ee.ApiFunction.boundSignatures_[name];
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
        for (var i = 0;i < sig.args.length;i++) {
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
        var firstArgType = signature.args[0].type, isInstance = "Object" != firstArgType && ee.Types.isSubtype(firstArgType, typeName)
      }
      var destination = isInstance ? target.prototype : target;
      fname in destination && (fname += "_", signature.hidden = !0);
      destination[fname] = function(var_args) {
        var args = Array.prototype.slice.call(arguments, 0), namedArgs;
        if (1 == args.length && ee.Types.isRegularObject(args[0])) {
          if (namedArgs = goog.object.clone(args[0]), isInstance) {
            var firstArgName = signature.args[0].name;
            if (firstArgName in namedArgs) {
              throw Error("Named args for " + fname + " can't contain keyword " + firstArgName);
            }
            namedArgs[firstArgName] = this;
          }
        } else {
          namedArgs = apiFunc.nameArgs(isInstance ? [this].concat(args) : args);
        }
        return apiFunc.apply(namedArgs);
      };
      destination[fname].toString = goog.bind(apiFunc.toString, apiFunc, fname, isInstance);
      destination[fname].signature = signature;
    }
  });
};
ee.ApiFunction.clearApi = function(target$$0) {
  var clear = function(target) {
    for (var name in target) {
      goog.isFunction(target[name]) && target[name].signature && delete target[name];
    }
  };
  clear(target$$0);
  clear(target$$0.prototype);
};
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
      ee.ComputedObject.call(this, string.func, string.args, string.varName), this.string_ = null;
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
ee.String.prototype.name = function() {
  return "String";
};
ee.CustomFunction = function(signature, body) {
  if (!(this instanceof ee.CustomFunction)) {
    return ee.ComputedObject.construct(ee.CustomFunction, arguments);
  }
  for (var vars = [], args = signature.args, i = 0;i < args.length;i++) {
    var arg = args[i];
    vars.push(ee.CustomFunction.variable(ee.Types.nameToClass(arg.type), arg.name));
  }
  this.signature_ = ee.CustomFunction.resolveNamelessArgs_(signature, vars, body);
  this.body_ = body.apply(null, vars);
};
goog.inherits(ee.CustomFunction, ee.Function);
goog.exportSymbol("ee.CustomFunction", ee.CustomFunction);
ee.CustomFunction.prototype.encode = function(encoder) {
  return{type:"Function", argumentNames:goog.array.map(this.signature_.args, function(arg) {
    return arg.name;
  }), body:encoder(this.body_)};
};
ee.CustomFunction.prototype.getSignature = function() {
  return this.signature_;
};
ee.CustomFunction.variable = function(type, name) {
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
  var klass = function() {
  };
  klass.prototype = type.prototype;
  var obj = new klass;
  obj.func = null;
  obj.args = null;
  obj.varName = name;
  return obj;
};
ee.CustomFunction.resolveNamelessArgs_ = function(signature, vars, body) {
  for (var namelessArgIndices = [], i = 0;i < vars.length;i++) {
    goog.isNull(vars[i].varName) && namelessArgIndices.push(i);
  }
  if (0 == namelessArgIndices.length) {
    return signature;
  }
  for (var countFunctions = function(expression) {
    var count = 0;
    goog.isObject(expression) && !goog.isFunction(expression) && ("Function" == expression.type && count++, goog.object.forEach(expression, function(subExpression) {
      count += countFunctions(subExpression);
    }));
    return count;
  }, serializedBody = ee.Serializer.encode(body.apply(null, vars)), baseName = "_MAPPING_VAR_" + countFunctions(serializedBody) + "_", i = 0;i < namelessArgIndices.length;i++) {
    var index = namelessArgIndices[i], name = baseName + i;
    vars[index].varName = name;
    signature.args[index].name = name;
  }
  return signature;
};
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
  var result = this;
  if (1 >= arguments.length) {
    var properties = arguments[0];
    if (!goog.isObject(properties)) {
      throw Error("When Element.set() is passed one argument, it must be a dictionary.");
    }
    ee.Types.isRegularObject(properties) && goog.array.equals(goog.object.getKeys(properties), ["properties"]) && ee.Types.isRegularObject(properties.properties) && (properties = properties.properties);
    try {
      for (var key in properties) {
        var value = properties[key], result = ee.ApiFunction._call("Element.set", result, key, value)
      }
    } catch (e) {
      result = ee.ApiFunction._call("Feature.set", result, properties);
    }
  } else {
    if (0 != arguments.length % 2) {
      throw Error("When Element.set() is passed multiple arguments, there must be an even number of them.");
    }
    try {
      for (var i = 0;i < arguments.length;i += 2) {
        key = arguments[i], value = arguments[i + 1], result = ee.ApiFunction._call("Element.set", result, key, value);
      }
    } catch (e$$0) {
      properties = {};
      for (i = 0;i < arguments.length;i += 2) {
        key = arguments[i], value = arguments[i + 1], properties[key] = value;
      }
      result = ee.ApiFunction._call("Feature.set", result, properties);
    }
  }
  return this.cast(result);
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
ee.Filter.prototype.length = function() {
  return this.filter_.length;
};
ee.Filter.prototype.append_ = function(newFilter) {
  var prev = this.filter_.slice(0);
  newFilter instanceof ee.Filter ? goog.array.extend(prev, newFilter.filter_) : newFilter instanceof Array ? goog.array.extend(prev, newFilter) : prev.push(newFilter);
  return new ee.Filter(prev);
};
ee.Filter.prototype.not = function() {
  return ee.ApiFunction._call("Filter.not", this);
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
ee.Filter.eq = function(name, value) {
  return ee.ApiFunction._call("Filter.equals", name, value);
};
ee.Filter.neq = function(name, value) {
  return ee.Filter.eq(name, value).not();
};
ee.Filter.lt = function(name, value) {
  return ee.ApiFunction._call("Filter.lessThan", name, value);
};
ee.Filter.gte = function(name, value) {
  return ee.Filter.lt(name, value).not();
};
ee.Filter.gt = function(name, value) {
  return ee.ApiFunction._call("Filter.greaterThan", name, value);
};
ee.Filter.lte = function(name, value) {
  return ee.Filter.gt(name, value).not();
};
ee.Filter.contains = function(name, value) {
  return ee.ApiFunction._call("Filter.stringContains", name, value);
};
ee.Filter.not_contains = function(name, value) {
  return ee.Filter.contains(name, value).not();
};
ee.Filter.starts_with = function(name, value) {
  return ee.ApiFunction._call("Filter.stringStartsWith", name, value);
};
ee.Filter.not_starts_with = function(name, value) {
  return ee.Filter.starts_with(name, value).not();
};
ee.Filter.ends_with = function(name, value) {
  return ee.ApiFunction._call("Filter.stringEndsWith", name, value);
};
ee.Filter.not_ends_with = function(name, value) {
  return ee.Filter.ends_with(name, value).not();
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
  var range = ee.ApiFunction._call("DateRange", start, opt_end);
  return ee.ApiFunction._apply("Filter.dateRangeContains", {leftValue:range, rightField:"system:time_start"});
};
ee.Filter.inList = function(opt_leftField, opt_rightValue, opt_rightField, opt_leftValue) {
  return ee.ApiFunction._apply("Filter.listContains", {leftField:opt_rightField, rightValue:opt_leftValue, rightField:opt_leftField, leftValue:opt_rightValue});
};
ee.Filter.bounds = function(geometry, opt_errorMargin) {
  return ee.ApiFunction._apply("Filter.intersects", {leftField:".all", rightValue:ee.ApiFunction._call("Feature", geometry), maxError:opt_errorMargin});
};
ee.Filter.prototype.eq = function() {
  return this.append_(ee.Filter.eq.apply(null, [].slice.call(arguments)));
};
ee.Filter.prototype.neq = function() {
  return this.append_(ee.Filter.neq.apply(null, [].slice.call(arguments)));
};
ee.Filter.prototype.lt = function() {
  return this.append_(ee.Filter.lt.apply(null, [].slice.call(arguments)));
};
ee.Filter.prototype.gte = function() {
  return this.append_(ee.Filter.gte.apply(null, [].slice.call(arguments)));
};
ee.Filter.prototype.gt = function() {
  return this.append_(ee.Filter.gt.apply(null, [].slice.call(arguments)));
};
ee.Filter.prototype.lte = function() {
  return this.append_(ee.Filter.lte.apply(null, [].slice.call(arguments)));
};
ee.Filter.prototype.contains = function() {
  return this.append_(ee.Filter.contains.apply(null, [].slice.call(arguments)));
};
ee.Filter.prototype.not_contains = function() {
  return this.append_(ee.Filter.not_contains.apply(null, [].slice.call(arguments)));
};
ee.Filter.prototype.starts_with = function() {
  return this.append_(ee.Filter.starts_with.apply(null, [].slice.call(arguments)));
};
ee.Filter.prototype.not_starts_with = function() {
  return this.append_(ee.Filter.not_starts_with.apply(null, [].slice.call(arguments)));
};
ee.Filter.prototype.ends_with = function() {
  return this.append_(ee.Filter.ends_with.apply(null, [].slice.call(arguments)));
};
ee.Filter.prototype.not_ends_with = function() {
  return this.append_(ee.Filter.not_ends_with.apply(null, [].slice.call(arguments)));
};
ee.Filter.prototype.and = function() {
  return this.append_(ee.Filter.and.apply(null, [].slice.call(arguments)));
};
ee.Filter.prototype.date = function() {
  return this.append_(ee.Filter.date.apply(null, [].slice.call(arguments)));
};
ee.Filter.prototype.inList = function() {
  return this.append_(ee.Filter.inList.apply(null, [].slice.call(arguments)));
};
ee.Filter.prototype.bounds = function() {
  return this.append_(ee.Filter.bounds.apply(null, [].slice.call(arguments)));
};
ee.Filter.prototype.name = function() {
  return "Filter";
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
ee.Collection.prototype.filter = function(newFilter) {
  if (!newFilter) {
    throw Error("Empty filters.");
  }
  return this.cast(ee.ApiFunction._call("Collection.filter", this, newFilter));
};
ee.Collection.prototype.filterMetadata = function(name, operator, value) {
  return this.filter(ee.Filter.metadata(name, operator, value));
};
ee.Collection.prototype.filterBounds = function(geometry) {
  return this.filter(ee.Filter.bounds(geometry));
};
ee.Collection.prototype.filterDate = function(start, end) {
  return this.filter(ee.Filter.date(start, end));
};
ee.Collection.prototype.limit = function(max, opt_property, opt_ascending) {
  return this.cast(ee.ApiFunction._call("Collection.limit", this, max, opt_property, opt_ascending));
};
ee.Collection.prototype.sort = function(property, opt_ascending) {
  return this.cast(ee.ApiFunction._call("Collection.limit", this, void 0, property, opt_ascending));
};
ee.Collection.prototype.name = function() {
  return "Collection";
};
ee.Collection.prototype.mapInternal = function(type, algorithm) {
  if (!goog.isFunction(algorithm)) {
    throw Error("Can't map non-callable object: " + algorithm);
  }
  var signature = {name:"", returns:"Object", args:[{name:null, type:ee.Types.classToName(type)}]};
  return this.cast(ee.ApiFunction._apply("Collection.map", {collection:this, baseAlgorithm:new ee.CustomFunction(signature, algorithm)}));
};
ee.Collection.prototype.map = function(algorithm) {
  return this.mapInternal(ee.ComputedObject, algorithm);
};
ee.Date = function(date, opt_tz) {
  if (!(this instanceof ee.Date)) {
    return ee.ComputedObject.construct(ee.Date, arguments);
  }
  if (date instanceof ee.Date) {
    return date;
  }
  ee.Date.initialize();
  var func = new ee.ApiFunction("Date"), args = {}, varName = null;
  if (ee.Types.isString(date)) {
    if (args.value = date, opt_tz) {
      if (ee.Types.isString(opt_tz)) {
        args.timeZone = opt_tz;
      } else {
        throw Error("Invalid argument specified for ee.Date(..., opt_tz): " + opt_tz);
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
          date.func != func ? args.value = date : (func = date.func, args = date.args, varName = date.varName);
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
ee.Geometry = function(geoJson, opt_proj, opt_geodesic) {
  if (!(this instanceof ee.Geometry)) {
    return ee.ComputedObject.construct(ee.Geometry, arguments);
  }
  ee.Geometry.initialize();
  var options = goog.isDefAndNotNull(opt_proj) || goog.isDefAndNotNull(opt_geodesic);
  if (geoJson instanceof ee.ComputedObject && !(geoJson instanceof ee.Geometry && geoJson.type_)) {
    if (options) {
      throw Error("Setting the CRS or geodesic on a computed Geometry is not suported.  Use Geometry.transform().");
    }
    ee.ComputedObject.call(this, geoJson.func, geoJson.args, geoJson.varName);
  } else {
    geoJson instanceof ee.Geometry && (geoJson = geoJson.encode());
    if (3 < arguments.length) {
      throw Error("The Geometry constructor takes at most 3 arguments (" + arguments.length + " given)");
    }
    if (!ee.Geometry.isValidGeometry_(geoJson)) {
      throw Error("Invalid GeoJSON geometry: " + JSON.stringify(geoJson));
    }
    ee.ComputedObject.call(this, null, null);
    this.type_ = geoJson.type;
    this.coordinates_ = geoJson.coordinates || null;
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
    !goog.isDef(opt_geodesic) && "geodesic" in geoJson && (this.geodesic_ = Boolean(geoJson.geodesic));
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
ee.Geometry.Point = function(lon, lat) {
  if (!(this instanceof ee.Geometry.Point)) {
    return ee.Geometry.createInstance_(ee.Geometry.Point, arguments);
  }
  if (2 < arguments.length) {
    throw Error("The Geometry.Point constructor takes at most 2 arguments (" + arguments.length + " given)");
  }
  if (1 == arguments.length && goog.isArray(arguments[0]) && 2 == arguments[0].length) {
    var coords = arguments[0];
    lon = coords[0];
    lat = coords[1];
  }
  ee.Geometry.call(this, {type:"Point", coordinates:[lon, lat]});
};
goog.inherits(ee.Geometry.Point, ee.Geometry);
ee.Geometry.MultiPoint = function(coordinates) {
  if (!(this instanceof ee.Geometry.MultiPoint)) {
    return ee.Geometry.createInstance_(ee.Geometry.MultiPoint, arguments);
  }
  ee.Geometry.call(this, {type:"MultiPoint", coordinates:ee.Geometry.makeGeometry_(coordinates, 2, arguments)});
};
goog.inherits(ee.Geometry.MultiPoint, ee.Geometry);
ee.Geometry.Rectangle = function(lon1, lat1, lon2, lat2) {
  if (!(this instanceof ee.Geometry.Rectangle)) {
    return ee.ComputedObject.construct(ee.Geometry.Rectangle, arguments);
  }
  if (4 < arguments.length) {
    throw Error("The Geometry.Rectangle constructor takes at most 4 arguments (" + arguments.length + " given)");
  }
  if (goog.isArray(lon1)) {
    var args = lon1;
    lon1 = args[0];
    lat1 = args[1];
    lon2 = args[2];
    lat2 = args[3];
  }
  ee.Geometry.call(this, {type:"Polygon", coordinates:[[[lon1, lat2], [lon1, lat1], [lon2, lat1], [lon2, lat2]]]});
};
goog.inherits(ee.Geometry.Rectangle, ee.Geometry);
ee.Geometry.LineString = function(coordinates) {
  if (!(this instanceof ee.Geometry.LineString)) {
    return ee.Geometry.createInstance_(ee.Geometry.LineString, arguments);
  }
  ee.Geometry.call(this, {type:"LineString", coordinates:ee.Geometry.makeGeometry_(coordinates, 2, arguments)});
};
goog.inherits(ee.Geometry.LineString, ee.Geometry);
ee.Geometry.LinearRing = function(coordinates) {
  if (!(this instanceof ee.Geometry.LinearRing)) {
    return ee.Geometry.createInstance_(ee.Geometry.LinearRing, arguments);
  }
  ee.Geometry.call(this, {type:"LinearRing", coordinates:ee.Geometry.makeGeometry_(coordinates, 2, arguments)});
};
goog.inherits(ee.Geometry.LinearRing, ee.Geometry);
ee.Geometry.MultiLineString = function(coordinates) {
  if (!(this instanceof ee.Geometry.MultiLineString)) {
    return ee.Geometry.createInstance_(ee.Geometry.MultiLineString, arguments);
  }
  ee.Geometry.call(this, {type:"MultiLineString", coordinates:ee.Geometry.makeGeometry_(coordinates, 3, arguments)});
};
goog.inherits(ee.Geometry.MultiLineString, ee.Geometry);
ee.Geometry.Polygon = function(coordinates) {
  if (!(this instanceof ee.Geometry.Polygon)) {
    return ee.Geometry.createInstance_(ee.Geometry.Polygon, arguments);
  }
  ee.Geometry.call(this, {type:"Polygon", coordinates:ee.Geometry.makeGeometry_(coordinates, 3, arguments)});
};
goog.inherits(ee.Geometry.Polygon, ee.Geometry);
ee.Geometry.MultiPolygon = function(coordinates) {
  if (!(this instanceof ee.Geometry.MultiPolygon)) {
    return ee.Geometry.createInstance_(ee.Geometry.MultiPolygon, arguments);
  }
  ee.Geometry.call(this, {type:"MultiPolygon", coordinates:ee.Geometry.makeGeometry_(coordinates, 4, arguments)});
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
  return(new goog.json.Serializer).serialize(this.toGeoJSON());
};
ee.Geometry.prototype.type = function() {
  if (this.func) {
    throw Error("Can't get the type of a computed Geometry to GeoJSON. Use getInfo() instead.");
  }
  return this.type_;
};
ee.Geometry.prototype.serialize = function() {
  return ee.Serializer.toJSON(this);
};
ee.Geometry.prototype.toString = function() {
  return "ee.Geometry(" + this.toGeoJSONString() + ")";
};
ee.Geometry.isValidGeometry_ = function(geometry) {
  var type = geometry.type;
  if ("GeometryCollection" == type) {
    var geometries = geometry.geometries;
    if (!goog.isArray(geometries)) {
      return!1;
    }
    for (var i = 0;i < geometries.length;i++) {
      if (!ee.Geometry.isValidGeometry_(geometries[i])) {
        return!1;
      }
    }
    return!0;
  }
  var nesting = ee.Geometry.isValidCoordinates_(geometry.coordinates);
  return "Point" == type && 1 == nesting || "MultiPoint" == type && 2 == nesting || "LineString" == type && 2 == nesting || "LinearRing" == type && 2 == nesting || "MultiLineString" == type && 3 == nesting || "Polygon" == type && 3 == nesting || "MultiPolygon" == type && 4 == nesting;
};
ee.Geometry.isValidCoordinates_ = function(shape) {
  if (!goog.isArray(shape)) {
    return-1;
  }
  if (goog.isArray(shape[0])) {
    for (var count = ee.Geometry.isValidCoordinates_(shape[0]), i = 1;i < shape.length;i++) {
      if (ee.Geometry.isValidCoordinates_(shape[i]) != count) {
        return-1;
      }
    }
    return count + 1;
  }
  for (i = 0;i < shape.length;i++) {
    if (!goog.isNumber(shape[i])) {
      return-1;
    }
  }
  return 0 == shape.length % 2 ? 1 : -1;
};
ee.Geometry.coordinatesToLine_ = function(coordinates) {
  if ("number" == typeof coordinates[0]) {
    if (0 != coordinates.length % 2) {
      throw Error("Invalid number of coordinates: " + coordinates.length);
    }
    for (var line = [], i = 0;i < coordinates.length;i += 2) {
      line.push([coordinates[i], coordinates[i + 1]]);
    }
    coordinates = line;
  }
  return coordinates;
};
ee.Geometry.makeGeometry_ = function(geometry, nesting, opt_coordinates) {
  if (2 > nesting || 4 < nesting) {
    throw Error("Unexpected nesting level.");
  }
  !goog.isArray(geometry) && opt_coordinates && (geometry = ee.Geometry.coordinatesToLine_(Array.prototype.slice.call(opt_coordinates)));
  for (var item = geometry, count = 0;goog.isArray(item);) {
    item = item[0], count++;
  }
  for (;count < nesting;) {
    geometry = [geometry], count++;
  }
  if (ee.Geometry.isValidCoordinates_(geometry) != nesting) {
    throw Error("Invalid geometry");
  }
  return geometry;
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
ee.Deserializer = function() {
};
goog.exportSymbol("ee.Deserializer", ee.Deserializer);
ee.Deserializer.fromJSON = function(json) {
  return ee.Deserializer.decode(goog.json.parse(json));
};
ee.Deserializer.decode = function(json) {
  var namedValues = {};
  if (goog.isObject(json) && "CompoundValue" == json.type) {
    for (var scopes = json.scope, i = 0;i < scopes.length;i++) {
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
      throw Error("Unknown ValueRef: " + json);;
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
      return new ee.Date(microseconds / 1E3);
    case "Bytes":
      var result = new ee.Encodable;
      result.encode = function(encoder) {
        return json;
      };
      return result;
    case "Invocation":
      var func;
      func = "functionName" in json ? ee.ApiFunction.lookup(json.functionName) : ee.Deserializer.decodeValue_(json["function"], namedValues);
      var args = goog.object.map(json.arguments, function(element) {
        return ee.Deserializer.decodeValue_(element, namedValues);
      });
      if (func instanceof ee.Function) {
        return func.apply(args);
      }
      if (func instanceof ee.ComputedObject) {
        return new ee.ComputedObject(func, args);
      }
      throw Error("Invalid function value: " + json["function"]);;
    case "Dictionary":
      return goog.object.map(json.value, function(element) {
        return ee.Deserializer.decodeValue_(element, namedValues);
      });
    case "Function":
      var body = ee.Deserializer.decodeValue_(json.body, namedValues), signature = {name:"", args:goog.array.map(json.argumentNames, function(argName) {
        return{name:argName, type:"Object", optional:!1};
      }), returns:"Object"};
      return new ee.CustomFunction(signature, function() {
        return body;
      });
    case "Point":
    ;
    case "MultiPoint":
    ;
    case "LineString":
    ;
    case "MultiLineString":
    ;
    case "Polygon":
    ;
    case "MultiPolygon":
    ;
    case "LinearRing":
    ;
    case "GeometryCollection":
      return new ee.Geometry(json);
    case "CompoundValue":
      throw Error("Nested CompoundValues are disallowed.");;
    default:
      throw Error("Unknown encoded object type: " + typeName);;
  }
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
            throw Error('Can\t specify both "id" and "system:index".');
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
  return ee.ApiFunction._call("Collection", [this]).getMap(opt_visParams, opt_callback);
};
ee.Feature.Point = function(lon, lat) {
  return ee.Geometry.Point.apply(null, arguments);
};
ee.Feature.MultiPoint = function(coordinates) {
  return ee.Geometry.MultiPoint.apply(null, arguments);
};
ee.Feature.Rectangle = function(lon1, lat1, lon2, lat2) {
  return new ee.Geometry.Rectangle(lon1, lat1, lon2, lat2);
};
ee.Feature.LineString = function(coordinates) {
  return ee.Geometry.LineString.apply(null, arguments);
};
ee.Feature.LinearRing = function(coordinates) {
  return ee.Geometry.LinearRing.apply(null, arguments);
};
ee.Feature.MultiLine = function(coordinates) {
  return ee.Geometry.MultiLineString.apply(null, arguments);
};
ee.Feature.Polygon = function(coordinates) {
  return ee.Geometry.Polygon.apply(null, arguments);
};
ee.Feature.MultiPolygon = function(coordinates) {
  return ee.Geometry.MultiPolygon.apply(null, arguments);
};
ee.Feature.prototype.name = function() {
  return "Feature";
};
ee.List = function(list) {
  if (!(this instanceof ee.List)) {
    return ee.ComputedObject.construct(ee.List, arguments);
  }
  if (list instanceof ee.List) {
    return list;
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
ee.List.prototype.encode = function(opt_encoder) {
  return goog.isArray(this.list_) ? goog.array.map(this.list_, function(elem) {
    return opt_encoder(elem);
  }) : ee.List.superClass_.encode.call(this, opt_encoder);
};
ee.List.prototype.name = function() {
  return "List";
};
ee.List.prototype.map = function(algorithm) {
  if (!goog.isFunction(algorithm)) {
    throw Error("Can't map non-callable object: " + algorithm);
  }
  return this.cast(ee.ApiFunction._apply("List.map", {list:this, baseAlgorithm:new ee.CustomFunction({name:"", returns:"Object", args:[{name:null, type:"Object"}]}, algorithm)}));
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
  if (ee.Types.isNumber(args) || ee.Types.isString(args)) {
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
  var painted = ee.ApiFunction._apply("Collection.draw", {collection:this, color:(opt_visParams || {}).color || "000000"});
  if (opt_callback) {
    painted.getMap(null, opt_callback);
  } else {
    return painted.getMap();
  }
};
ee.FeatureCollection.prototype.getInfo = function(opt_callback) {
  return ee.FeatureCollection.superClass_.getInfo.call(this, opt_callback);
};
ee.FeatureCollection.prototype.getDownloadURL = function(opt_format, opt_selectors, opt_filename, opt_callback) {
  var request = {};
  request.table = this.serialize();
  opt_format && (request.format = opt_format.toUpperCase());
  opt_filename && (request.filename = opt_filename);
  opt_selectors && (request.selectors = opt_selectors);
  if (opt_callback) {
    ee.data.getTableDownloadId(request, function(downloadId, error) {
      downloadId ? opt_callback(ee.data.makeTableDownloadUrl(downloadId)) : opt_callback(null, error);
    });
  } else {
    return ee.data.makeTableDownloadUrl(ee.data.getTableDownloadId(request));
  }
};
ee.FeatureCollection.prototype.map = function(algorithm) {
  return this.mapInternal(ee.Feature, algorithm);
};
ee.FeatureCollection.prototype.name = function() {
  return "FeatureCollection";
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
  var request = opt_visParams ? goog.object.clone(opt_visParams) : {};
  request.image = this.serialize();
  if (opt_callback) {
    ee.data.getMapId(request, goog.bind(function(data, error) {
      data && (data.image = this);
      opt_callback(data, error);
    }, this));
  } else {
    var response = ee.data.getMapId(request);
    response.image = this;
    return response;
  }
};
ee.Image.prototype.getDownloadURL = function(params, opt_callback) {
  var request = params ? goog.object.clone(params) : {};
  request.image = this.serialize();
  if (opt_callback) {
    ee.data.getDownloadId(request, function(downloadId, error) {
      downloadId ? opt_callback(ee.data.makeDownloadUrl(downloadId)) : opt_callback(null, error);
    });
  } else {
    return ee.data.makeDownloadUrl(ee.data.getDownloadId(request));
  }
};
ee.Image.prototype.getThumbURL = function(params) {
  var request = params ? goog.object.clone(params) : {};
  request.image = this.serialize();
  return ee.data.makeThumbUrl(ee.data.getThumbId(request));
};
ee.Image.rgb = function(r, g, b) {
  return ee.Image.combine_([r, g, b], ["vis-red", "vis-green", "vis-blue"]);
};
ee.Image.cat = function(var_args) {
  var args = Array.prototype.slice.call(arguments);
  return ee.Image.combine_(args, null);
};
ee.Image.combine_ = function(images, opt_names) {
  if (0 == images.length) {
    throw Error("Can't combine 0 images.");
  }
  for (var result = new ee.Image(images[0]), i = 1;i < images.length;i++) {
    result = ee.ApiFunction._call("Image.addBands", result, images[i]);
  }
  opt_names && (result = result.select([".*"], opt_names));
  return result;
};
ee.Image.prototype.select = function(selectors, opt_names) {
  var args = {input:this, bandSelectors:selectors};
  if (goog.isArray(selectors)) {
    opt_names && (args.newNames = opt_names);
  } else {
    selectors = Array.prototype.slice.call(arguments);
    for (var i = 0;i < selectors.length;i++) {
      if (!goog.isString(selectors[i]) && !goog.isNumber(selectors[i])) {
        throw Error("Illegal argument to select(): " + selectors[i]);
      }
    }
    args.bandSelectors = selectors;
  }
  return ee.ApiFunction._apply("Image.select", args);
};
ee.Image.prototype.expression = function(expression, opt_map) {
  var body = ee.ApiFunction._call("Image.parseExpression", expression, "DEFAULT_EXPRESSION_IMAGE"), argNames = ["DEFAULT_EXPRESSION_IMAGE"], args = {DEFAULT_EXPRESSION_IMAGE:this};
  if (opt_map) {
    for (var name$$0 in opt_map) {
      argNames.push(name$$0), args[name$$0] = new ee.Image(opt_map[name$$0]);
    }
  }
  var func = new ee.Function;
  func.encode = function(encoder) {
    return body.encode(encoder);
  };
  func.getSignature = function() {
    return{name:"", args:goog.array.map(argNames, function(name) {
      return{name:name, type:"Image", optional:!1};
    }, this), returns:"Image"};
  };
  return func.apply(args);
};
ee.Image.prototype.clip = function(geometry) {
  try {
    geometry = new ee.Geometry(geometry);
  } catch (e) {
  }
  return ee.ApiFunction._call("Image.clip", this, geometry);
};
ee.Image.prototype.name = function() {
  return "Image";
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
      if (args instanceof ee.ComputedObject) {
        ee.Collection.call(this, args.func, args.args, args.varName);
      } else {
        throw Error("Unrecognized argument type to convert to an ImageCollection: " + args);
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
ee.ImageCollection.prototype.getMap = function(opt_visParams, opt_callback) {
  var mosaic = ee.ApiFunction._call("ImageCollection.mosaic", this);
  if (opt_callback) {
    mosaic.getMap(opt_visParams, opt_callback);
  } else {
    return mosaic.getMap(opt_visParams);
  }
};
ee.ImageCollection.prototype.getInfo = function(opt_callback) {
  return ee.ImageCollection.superClass_.getInfo.call(this, opt_callback);
};
ee.ImageCollection.prototype.map = function(algorithm) {
  return this.mapInternal(ee.Image, algorithm);
};
ee.ImageCollection.prototype.select = function(selectors, opt_names) {
  var varargs = arguments;
  return this.map(function(img) {
    return img.select.apply(img, varargs);
  });
};
ee.ImageCollection.prototype.name = function() {
  return "ImageCollection";
};
ee.initialize = function(opt_baseurl, opt_tileurl, opt_successCallback, opt_errorCallback) {
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
      if (ee.ready_ = ee.InitState.LOADING, ee.data.initialize(opt_baseurl, opt_tileurl), isAsynchronous) {
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
      ee.Date.initialize(), ee.Element.initialize(), ee.Image.initialize(), ee.Feature.initialize(), ee.Collection.initialize(), ee.ImageCollection.initialize(), ee.FeatureCollection.initialize(), ee.Filter.initialize(), ee.Geometry.initialize(), ee.List.initialize(), ee.Number.initialize(), ee.String.initialize(), ee.initializeGeneratedClasses_(), ee.initializeUnboundMethods_();
    } catch (e) {
      ee.initializationFailure_(e);
      return;
    }
    ee.ready_ = ee.InitState.READY;
    for (ee.errorCallbacks_ = [];0 < ee.successCallbacks_.length;) {
      ee.successCallbacks_.shift()();
    }
  }
};
ee.initializationFailure_ = function(e) {
  if (ee.ready_ == ee.InitState.LOADING) {
    for (ee.ready_ = ee.InitState.NOT_READY, ee.successCallbacks_ = [];0 < ee.errorCallbacks_.length;) {
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
      ;
      case "EEObject":
        if (arg instanceof ee.Element) {
          return arg;
        }
        if (arg instanceof ee.ComputedObject) {
          return new ee.Element(arg.func, arg.args);
        }
        throw Error("Cannot convert " + arg + " to Element.");;
      case "Geometry":
        return arg instanceof ee.FeatureCollection ? ee.ApiFunction._call("Collection.geometry", arg) : new ee.Geometry(arg);
      case "FeatureCollection":
      ;
      case "Collection":
        return arg instanceof ee.Collection ? arg : new ee.FeatureCollection(arg);
      case "ImageCollection":
        return new ee.ImageCollection(arg);
      case "Filter":
        return new ee.Filter(arg);
      case "Algorithm":
        return goog.isString(arg) ? new ee.ApiFunction(arg) : arg;
      case "Dictionary":
        return klass in exportedEE ? arg instanceof exportedEE[klass] ? arg : arg instanceof ee.ComputedObject ? new exportedEE[klass](arg) : arg : arg;
      case "String":
        return ee.Types.isString(arg) || arg instanceof ee.String || arg instanceof ee.ComputedObject ? new ee.String(arg) : arg;
      case "List":
        return new ee.List(arg);
      case "Number":
      ;
      case "Float":
      ;
      case "Long":
      ;
      case "Integer":
      ;
      case "Short":
      ;
      case "Byte":
        return new ee.Number(arg);
      default:
        if (klass in exportedEE && arg) {
          if (arg instanceof exportedEE[klass]) {
            return arg;
          }
          if (goog.isString(arg)) {
            if (!(arg in exportedEE[klass])) {
              throw Error("Unknown algorithm: " + klass + "." + arg);
            }
            return exportedEE[klass][arg].call();
          }
          return new exportedEE[klass](arg);
        }
        return arg;
    }
  }
};
ee.initializeUnboundMethods_ = function() {
  goog.object.forEach(ee.ApiFunction.unboundFunctions(), function(func, name) {
    var signature = func.getSignature();
    if (!signature.hidden) {
      var nameParts = name.split("."), target = ee.Algorithms;
      for (target.signature = {};1 < nameParts.length;) {
        var first = nameParts[0];
        first in target || (target[first] = {signature:{}});
        target = target[first];
        nameParts = goog.array.slice(nameParts, 1);
      }
      var bound = goog.bind(func.call, func);
      bound.signature = signature;
      bound.toString = goog.bind(func.toString, func);
      target[nameParts[0]] = bound;
    }
  });
};
ee.initializeGeneratedClasses_ = function() {
  var signatures = ee.ApiFunction.allSignatures(), names = {}, returnTypes = {}, sig;
  for (sig in signatures) {
    var type;
    type = -1 != sig.indexOf(".") ? sig.slice(0, sig.indexOf(".")) : sig;
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
  for (var exportedEE = goog.global.ee, i = 0;i < ee.generatedClasses_.length;i++) {
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
    var ctor = ee.ApiFunction.lookupInternal(name), firstArgIsComputed = args[0] instanceof ee.ComputedObject, shouldUseConstructor = !1;
    ctor && (onlyOneArg ? firstArgIsComputed ? args[0].func != ctor && (shouldUseConstructor = !0) : shouldUseConstructor = !0 : shouldUseConstructor = !0);
    if (shouldUseConstructor) {
      ee.ComputedObject.call(this, ctor, ctor.promoteArgs(ctor.nameArgs(args)));
    } else {
      if (!onlyOneArg) {
        throw Error("Too many arguments for ee." + name + "(): " + args);
      }
      if (!firstArgIsComputed) {
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
  tx instanceof goog.math.Coordinate ? (this.x += tx.x, this.y += tx.y) : (this.x += tx, goog.isNumber(opt_ty) && (this.y += opt_ty));
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
  return!this.area();
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
goog.math.Size.prototype.scaleToFit = function(target) {
  return this.scale(this.aspectRatio() > target.aspectRatio() ? target.width / this.width : target.height / this.height);
};
goog.dom.BrowserFeature = {CAN_ADD_NAME_OR_TYPE_ATTRIBUTES:!goog.userAgent.IE || goog.userAgent.isDocumentModeOrHigher(9), CAN_USE_CHILDREN_ATTRIBUTE:!goog.userAgent.GECKO && !goog.userAgent.IE || goog.userAgent.IE && goog.userAgent.isDocumentModeOrHigher(9) || goog.userAgent.GECKO && goog.userAgent.isVersionOrHigher("1.9.1"), CAN_USE_INNER_TEXT:goog.userAgent.IE && !goog.userAgent.isVersionOrHigher("9"), CAN_USE_PARENT_ELEMENT_PROPERTY:goog.userAgent.IE || goog.userAgent.OPERA || goog.userAgent.WEBKIT, 
INNER_HTML_NEEDS_SCOPED_ELEMENT:goog.userAgent.IE};
goog.dom.classes = {};
goog.dom.classes.set = function(element, className) {
  element.className = className;
};
goog.dom.classes.get = function(element) {
  var className = element.className;
  return goog.isString(className) && className.match(/\S+/g) || [];
};
goog.dom.classes.add = function(element, var_args) {
  var classes = goog.dom.classes.get(element), args = goog.array.slice(arguments, 1), expectedCount = classes.length + args.length;
  goog.dom.classes.add_(classes, args);
  goog.dom.classes.set(element, classes.join(" "));
  return classes.length == expectedCount;
};
goog.dom.classes.remove = function(element, var_args) {
  var classes = goog.dom.classes.get(element), args = goog.array.slice(arguments, 1), newClasses = goog.dom.classes.getDifference_(classes, args);
  goog.dom.classes.set(element, newClasses.join(" "));
  return newClasses.length == classes.length - args.length;
};
goog.dom.classes.add_ = function(classes, args) {
  for (var i = 0;i < args.length;i++) {
    goog.array.contains(classes, args[i]) || classes.push(args[i]);
  }
};
goog.dom.classes.getDifference_ = function(arr1, arr2) {
  return goog.array.filter(arr1, function(item) {
    return!goog.array.contains(arr2, item);
  });
};
goog.dom.classes.swap = function(element, fromClass, toClass) {
  for (var classes = goog.dom.classes.get(element), removed = !1, i = 0;i < classes.length;i++) {
    classes[i] == fromClass && (goog.array.splice(classes, i--, 1), removed = !0);
  }
  removed && (classes.push(toClass), goog.dom.classes.set(element, classes.join(" ")));
  return removed;
};
goog.dom.classes.addRemove = function(element, classesToRemove, classesToAdd) {
  var classes = goog.dom.classes.get(element);
  goog.isString(classesToRemove) ? goog.array.remove(classes, classesToRemove) : goog.isArray(classesToRemove) && (classes = goog.dom.classes.getDifference_(classes, classesToRemove));
  goog.isString(classesToAdd) && !goog.array.contains(classes, classesToAdd) ? classes.push(classesToAdd) : goog.isArray(classesToAdd) && goog.dom.classes.add_(classes, classesToAdd);
  goog.dom.classes.set(element, classes.join(" "));
};
goog.dom.classes.has = function(element, className) {
  return goog.array.contains(goog.dom.classes.get(element), className);
};
goog.dom.classes.enable = function(element, className, enabled) {
  enabled ? goog.dom.classes.add(element, className) : goog.dom.classes.remove(element, className);
};
goog.dom.classes.toggle = function(element, className) {
  var add = !goog.dom.classes.has(element, className);
  goog.dom.classes.enable(element, className, add);
  return add;
};
goog.dom.TagName = {A:"A", ABBR:"ABBR", ACRONYM:"ACRONYM", ADDRESS:"ADDRESS", APPLET:"APPLET", AREA:"AREA", ARTICLE:"ARTICLE", ASIDE:"ASIDE", AUDIO:"AUDIO", B:"B", BASE:"BASE", BASEFONT:"BASEFONT", BDI:"BDI", BDO:"BDO", BIG:"BIG", BLOCKQUOTE:"BLOCKQUOTE", BODY:"BODY", BR:"BR", BUTTON:"BUTTON", CANVAS:"CANVAS", CAPTION:"CAPTION", CENTER:"CENTER", CITE:"CITE", CODE:"CODE", COL:"COL", COLGROUP:"COLGROUP", COMMAND:"COMMAND", DATA:"DATA", DATALIST:"DATALIST", DD:"DD", DEL:"DEL", DETAILS:"DETAILS", DFN:"DFN", 
DIALOG:"DIALOG", DIR:"DIR", DIV:"DIV", DL:"DL", DT:"DT", EM:"EM", EMBED:"EMBED", FIELDSET:"FIELDSET", FIGCAPTION:"FIGCAPTION", FIGURE:"FIGURE", FONT:"FONT", FOOTER:"FOOTER", FORM:"FORM", FRAME:"FRAME", FRAMESET:"FRAMESET", H1:"H1", H2:"H2", H3:"H3", H4:"H4", H5:"H5", H6:"H6", HEAD:"HEAD", HEADER:"HEADER", HGROUP:"HGROUP", HR:"HR", HTML:"HTML", I:"I", IFRAME:"IFRAME", IMG:"IMG", INPUT:"INPUT", INS:"INS", ISINDEX:"ISINDEX", KBD:"KBD", KEYGEN:"KEYGEN", LABEL:"LABEL", LEGEND:"LEGEND", LI:"LI", LINK:"LINK", 
MAP:"MAP", MARK:"MARK", MATH:"MATH", MENU:"MENU", META:"META", METER:"METER", NAV:"NAV", NOFRAMES:"NOFRAMES", NOSCRIPT:"NOSCRIPT", OBJECT:"OBJECT", OL:"OL", OPTGROUP:"OPTGROUP", OPTION:"OPTION", OUTPUT:"OUTPUT", P:"P", PARAM:"PARAM", PRE:"PRE", PROGRESS:"PROGRESS", Q:"Q", RP:"RP", RT:"RT", RUBY:"RUBY", S:"S", SAMP:"SAMP", SCRIPT:"SCRIPT", SECTION:"SECTION", SELECT:"SELECT", SMALL:"SMALL", SOURCE:"SOURCE", SPAN:"SPAN", STRIKE:"STRIKE", STRONG:"STRONG", STYLE:"STYLE", SUB:"SUB", SUMMARY:"SUMMARY", 
SUP:"SUP", SVG:"SVG", TABLE:"TABLE", TBODY:"TBODY", TD:"TD", TEXTAREA:"TEXTAREA", TFOOT:"TFOOT", TH:"TH", THEAD:"THEAD", TIME:"TIME", TITLE:"TITLE", TR:"TR", TRACK:"TRACK", TT:"TT", U:"U", UL:"UL", VAR:"VAR", VIDEO:"VIDEO", WBR:"WBR"};
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
goog.dom.getElementsByTagNameAndClass = function(opt_tag, opt_class, opt_el) {
  return goog.dom.getElementsByTagNameAndClass_(document, opt_tag, opt_class, opt_el);
};
goog.dom.getElementsByClass = function(className, opt_el) {
  var parent = opt_el || document;
  return goog.dom.canUseQuerySelector_(parent) ? parent.querySelectorAll("." + className) : goog.dom.getElementsByTagNameAndClass_(document, "*", className, opt_el);
};
goog.dom.getElementByClass = function(className, opt_el) {
  var parent = opt_el || document, retVal = null;
  return(retVal = goog.dom.canUseQuerySelector_(parent) ? parent.querySelector("." + className) : goog.dom.getElementsByTagNameAndClass_(document, "*", className, opt_el)[0]) || null;
};
goog.dom.getRequiredElementByClass = function(className, opt_root) {
  var retValue = goog.dom.getElementByClass(className, opt_root);
  return goog.asserts.assert(retValue, "No element found with className: " + className);
};
goog.dom.canUseQuerySelector_ = function(parent) {
  return!(!parent.querySelectorAll || !parent.querySelector);
};
goog.dom.getElementsByTagNameAndClass_ = function(doc, opt_tag, opt_class, opt_el) {
  var parent = opt_el || doc, tagName = opt_tag && "*" != opt_tag ? opt_tag.toUpperCase() : "";
  if (goog.dom.canUseQuerySelector_(parent) && (tagName || opt_class)) {
    return parent.querySelectorAll(tagName + (opt_class ? "." + opt_class : ""));
  }
  if (opt_class && parent.getElementsByClassName) {
    var els = parent.getElementsByClassName(opt_class);
    if (tagName) {
      for (var arrayLike = {}, len = 0, i = 0, el;el = els[i];i++) {
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
    for (i = len = 0;el = els[i];i++) {
      var className = el.className;
      "function" == typeof className.split && goog.array.contains(className.split(/\s+/), opt_class) && (arrayLike[len++] = el);
    }
    arrayLike.length = len;
    return arrayLike;
  }
  return els;
};
goog.dom.$$ = goog.dom.getElementsByTagNameAndClass;
goog.dom.setProperties = function(element, properties) {
  goog.object.forEach(properties, function(val, key) {
    "style" == key ? element.style.cssText = val : "class" == key ? element.className = val : "for" == key ? element.htmlFor = val : key in goog.dom.DIRECT_ATTRIBUTE_MAP_ ? element.setAttribute(goog.dom.DIRECT_ATTRIBUTE_MAP_[key], val) : goog.string.startsWith(key, "aria-") || goog.string.startsWith(key, "data-") ? element.setAttribute(key, val) : element[key] = val;
  });
};
goog.dom.DIRECT_ATTRIBUTE_MAP_ = {cellpadding:"cellPadding", cellspacing:"cellSpacing", colspan:"colSpan", frameborder:"frameBorder", height:"height", maxlength:"maxLength", role:"role", rowspan:"rowSpan", type:"type", usemap:"useMap", valign:"vAlign", width:"width"};
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
goog.dom.getDocumentHeight_ = function(win) {
  var doc = win.document, height = 0;
  if (doc) {
    var vh = goog.dom.getViewportSize_(win).height, body = doc.body, docEl = doc.documentElement;
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
  return!goog.userAgent.WEBKIT && goog.dom.isCss1CompatMode_(doc) ? doc.documentElement : doc.body || doc.documentElement;
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
  var tagName = args[0], attributes = args[1];
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
  attributes && (goog.isString(attributes) ? element.className = attributes : goog.isArray(attributes) ? goog.dom.classes.add.apply(null, [element].concat(attributes)) : goog.dom.setProperties(element, attributes));
  2 < args.length && goog.dom.append_(doc, element, args, 2);
  return element;
};
goog.dom.append_ = function(doc, parent, args, startIndex) {
  function childHandler(child) {
    child && parent.appendChild(goog.isString(child) ? doc.createTextNode(child) : child);
  }
  for (var i = startIndex;i < args.length;i++) {
    var arg = args[i];
    goog.isArrayLike(arg) && !goog.dom.isNodeLike(arg) ? goog.array.forEach(goog.dom.isNodeList(arg) ? goog.array.toArray(arg) : arg, childHandler) : childHandler(arg);
  }
};
goog.dom.$dom = goog.dom.createDom;
goog.dom.createElement = function(name) {
  return document.createElement(name);
};
goog.dom.createTextNode = function(content) {
  return document.createTextNode(String(content));
};
goog.dom.createTable = function(rows, columns, opt_fillWithNbsp) {
  return goog.dom.createTable_(document, rows, columns, !!opt_fillWithNbsp);
};
goog.dom.createTable_ = function(doc, rows, columns, fillWithNbsp) {
  for (var rowHtml = ["<tr>"], i = 0;i < columns;i++) {
    rowHtml.push(fillWithNbsp ? "<td>&nbsp;</td>" : "<td></td>");
  }
  rowHtml.push("</tr>");
  for (var rowHtml = rowHtml.join(""), totalHtml = ["<table>"], i = 0;i < rows;i++) {
    totalHtml.push(rowHtml);
  }
  totalHtml.push("</table>");
  var elem = doc.createElement(goog.dom.TagName.DIV);
  elem.innerHTML = totalHtml.join("");
  return elem.removeChild(elem.firstChild);
};
goog.dom.htmlToDocumentFragment = function(htmlString) {
  return goog.dom.htmlToDocumentFragment_(document, htmlString);
};
goog.dom.htmlToDocumentFragment_ = function(doc, htmlString) {
  var tempDiv = doc.createElement("div");
  goog.dom.BrowserFeature.INNER_HTML_NEEDS_SCOPED_ELEMENT ? (tempDiv.innerHTML = "<br>" + htmlString, tempDiv.removeChild(tempDiv.firstChild)) : tempDiv.innerHTML = htmlString;
  if (1 == tempDiv.childNodes.length) {
    return tempDiv.removeChild(tempDiv.firstChild);
  }
  for (var fragment = doc.createDocumentFragment();tempDiv.firstChild;) {
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
    return!1;
  }
  switch(node.tagName) {
    case goog.dom.TagName.APPLET:
    ;
    case goog.dom.TagName.AREA:
    ;
    case goog.dom.TagName.BASE:
    ;
    case goog.dom.TagName.BR:
    ;
    case goog.dom.TagName.COL:
    ;
    case goog.dom.TagName.COMMAND:
    ;
    case goog.dom.TagName.EMBED:
    ;
    case goog.dom.TagName.FRAME:
    ;
    case goog.dom.TagName.HR:
    ;
    case goog.dom.TagName.IMG:
    ;
    case goog.dom.TagName.INPUT:
    ;
    case goog.dom.TagName.IFRAME:
    ;
    case goog.dom.TagName.ISINDEX:
    ;
    case goog.dom.TagName.KEYGEN:
    ;
    case goog.dom.TagName.LINK:
    ;
    case goog.dom.TagName.NOFRAMES:
    ;
    case goog.dom.TagName.NOSCRIPT:
    ;
    case goog.dom.TagName.META:
    ;
    case goog.dom.TagName.OBJECT:
    ;
    case goog.dom.TagName.PARAM:
    ;
    case goog.dom.TagName.SCRIPT:
    ;
    case goog.dom.TagName.SOURCE:
    ;
    case goog.dom.TagName.STYLE:
    ;
    case goog.dom.TagName.TRACK:
    ;
    case goog.dom.TagName.WBR:
      return!1;
  }
  return!0;
};
goog.dom.appendChild = function(parent, child) {
  parent.appendChild(child);
};
goog.dom.append = function(parent, var_args) {
  goog.dom.append_(goog.dom.getOwnerDocument(parent), parent, arguments, 1);
};
goog.dom.removeChildren = function(node) {
  for (var child;child = node.firstChild;) {
    node.removeChild(child);
  }
};
goog.dom.insertSiblingBefore = function(newNode, refNode) {
  refNode.parentNode && refNode.parentNode.insertBefore(newNode, refNode);
};
goog.dom.insertSiblingAfter = function(newNode, refNode) {
  refNode.parentNode && refNode.parentNode.insertBefore(newNode, refNode.nextSibling);
};
goog.dom.insertChildAt = function(parent, child, index) {
  parent.insertBefore(child, parent.childNodes[index] || null);
};
goog.dom.removeNode = function(node) {
  return node && node.parentNode ? node.parentNode.removeChild(node) : null;
};
goog.dom.replaceNode = function(newNode, oldNode) {
  var parent = oldNode.parentNode;
  parent && parent.replaceChild(newNode, oldNode);
};
goog.dom.flattenElement = function(element) {
  var child, parent = element.parentNode;
  if (parent && parent.nodeType != goog.dom.NodeType.DOCUMENT_FRAGMENT) {
    if (element.removeNode) {
      return element.removeNode(!1);
    }
    for (;child = element.firstChild;) {
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
  return void 0 != node.firstElementChild ? node.firstElementChild : goog.dom.getNextElementNode_(node.firstChild, !0);
};
goog.dom.getLastElementChild = function(node) {
  return void 0 != node.lastElementChild ? node.lastElementChild : goog.dom.getNextElementNode_(node.lastChild, !1);
};
goog.dom.getNextElementSibling = function(node) {
  return void 0 != node.nextElementSibling ? node.nextElementSibling : goog.dom.getNextElementNode_(node.nextSibling, !0);
};
goog.dom.getPreviousElementSibling = function(node) {
  return void 0 != node.previousElementSibling ? node.previousElementSibling : goog.dom.getNextElementNode_(node.previousSibling, !1);
};
goog.dom.getNextElementNode_ = function(node, forward) {
  for (;node && node.nodeType != goog.dom.NodeType.ELEMENT;) {
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
  for (;node && !node.nextSibling;) {
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
  for (node = node.previousSibling;node && node.lastChild;) {
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
  if (goog.dom.BrowserFeature.CAN_USE_PARENT_ELEMENT_PROPERTY && !(goog.userAgent.IE && goog.userAgent.isVersionOrHigher("9") && !goog.userAgent.isVersionOrHigher("10") && goog.global.SVGElement && element instanceof goog.global.SVGElement)) {
    return element.parentElement;
  }
  var parent = element.parentNode;
  return goog.dom.isElement(parent) ? parent : null;
};
goog.dom.contains = function(parent, descendant) {
  if (parent.contains && descendant.nodeType == goog.dom.NodeType.ELEMENT) {
    return parent == descendant || parent.contains(descendant);
  }
  if ("undefined" != typeof parent.compareDocumentPosition) {
    return parent == descendant || Boolean(parent.compareDocumentPosition(descendant) & 16);
  }
  for (;descendant && parent != descendant;) {
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
      return-1;
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
  var doc = goog.dom.getOwnerDocument(node1), range1, range2;
  range1 = doc.createRange();
  range1.selectNode(node1);
  range1.collapse(!0);
  range2 = doc.createRange();
  range2.selectNode(node2);
  range2.collapse(!0);
  return range1.compareBoundaryPoints(goog.global.Range.START_TO_END, range2);
};
goog.dom.compareParentsDescendantNodeIe_ = function(textNode, node) {
  var parent = textNode.parentNode;
  if (parent == node) {
    return-1;
  }
  for (var sibling = node;sibling.parentNode != parent;) {
    sibling = sibling.parentNode;
  }
  return goog.dom.compareSiblingOrder_(sibling, textNode);
};
goog.dom.compareSiblingOrder_ = function(node1, node2) {
  for (var s = node2;s = s.previousSibling;) {
    if (s == node1) {
      return-1;
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
  for (i = 0;i < count;i++) {
    for (var ancestors = [], node = arguments[i];node;) {
      ancestors.unshift(node), node = node.parentNode;
    }
    paths.push(ancestors);
    minLength = Math.min(minLength, ancestors.length);
  }
  var output = null;
  for (i = 0;i < minLength;i++) {
    for (var first = paths[0][i], j = 1;j < count;j++) {
      if (first != paths[j][i]) {
        return output;
      }
    }
    output = first;
  }
  return output;
};
goog.dom.getOwnerDocument = function(node) {
  return node.nodeType == goog.dom.NodeType.DOCUMENT ? node : node.ownerDocument || node.document;
};
goog.dom.getFrameContentDocument = function(frame) {
  return frame.contentDocument || frame.contentWindow.document;
};
goog.dom.getFrameContentWindow = function(frame) {
  return frame.contentWindow || goog.dom.getWindow(goog.dom.getFrameContentDocument(frame));
};
goog.dom.setTextContent = function(node, text) {
  goog.asserts.assert(null != node, "goog.dom.setTextContent expects a non-null value for node");
  if ("textContent" in node) {
    node.textContent = text;
  } else {
    if (node.nodeType == goog.dom.NodeType.TEXT) {
      node.data = text;
    } else {
      if (node.firstChild && node.firstChild.nodeType == goog.dom.NodeType.TEXT) {
        for (;node.lastChild != node.firstChild;) {
          node.removeChild(node.lastChild);
        }
        node.firstChild.data = text;
      } else {
        goog.dom.removeChildren(node);
        var doc = goog.dom.getOwnerDocument(node);
        node.appendChild(doc.createTextNode(String(text)));
      }
    }
  }
};
goog.dom.getOuterHtml = function(element) {
  if ("outerHTML" in element) {
    return element.outerHTML;
  }
  var div = goog.dom.getOwnerDocument(element).createElement("div");
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
    for (var child = root.firstChild;child;) {
      if (p(child) && (rv.push(child), findOne) || goog.dom.findNodes_(child, p, rv, findOne)) {
        return!0;
      }
      child = child.nextSibling;
    }
  }
  return!1;
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
  return(focusable = goog.dom.nativelySupportsFocus_(element) ? !element.disabled && (!goog.dom.hasSpecifiedTabIndex_(element) || goog.dom.isTabIndexFocusable_(element)) : goog.dom.isFocusableTabIndex(element)) && goog.userAgent.IE ? goog.dom.hasNonZeroBoundingRect_(element) : focusable;
};
goog.dom.hasSpecifiedTabIndex_ = function(element) {
  var attrNode = element.getAttributeNode("tabindex");
  return goog.isDefAndNotNull(attrNode) && attrNode.specified;
};
goog.dom.isTabIndexFocusable_ = function(element) {
  var index = element.tabIndex;
  return goog.isNumber(index) && 0 <= index && 32768 > index;
};
goog.dom.nativelySupportsFocus_ = function(element) {
  return element.tagName == goog.dom.TagName.A || element.tagName == goog.dom.TagName.INPUT || element.tagName == goog.dom.TagName.TEXTAREA || element.tagName == goog.dom.TagName.SELECT || element.tagName == goog.dom.TagName.BUTTON;
};
goog.dom.hasNonZeroBoundingRect_ = function(element) {
  var rect = goog.isFunction(element.getBoundingClientRect) ? element.getBoundingClientRect() : {height:element.offsetHeight, width:element.offsetWidth};
  return goog.isDefAndNotNull(rect) && 0 < rect.height && 0 < rect.width;
};
goog.dom.getTextContent = function(node) {
  var textContent;
  if (goog.dom.BrowserFeature.CAN_USE_INNER_TEXT && "innerText" in node) {
    textContent = goog.string.canonicalizeNewlines(node.innerText);
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
        for (var child = node.firstChild;child;) {
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
  for (var root = opt_offsetParent || goog.dom.getOwnerDocument(node).body, buf = [];node && node != root;) {
    for (var cur = node;cur = cur.previousSibling;) {
      buf.unshift(goog.dom.getTextContent(cur));
    }
    node = node.parentNode;
  }
  return goog.string.trimLeft(buf.join("")).replace(/ +/g, " ").length;
};
goog.dom.getNodeAtOffset = function(parent, offset, opt_result) {
  for (var stack = [parent], pos = 0, cur = null;0 < stack.length && pos < offset;) {
    if (cur = stack.pop(), !(cur.nodeName in goog.dom.TAGS_TO_IGNORE_)) {
      if (cur.nodeType == goog.dom.NodeType.TEXT) {
        var text = cur.nodeValue.replace(/(\r\n|\r|\n)/g, "").replace(/ +/g, " "), pos = pos + text.length
      } else {
        if (cur.nodeName in goog.dom.PREDEFINED_TAG_VALUES_) {
          pos += goog.dom.PREDEFINED_TAG_VALUES_[cur.nodeName].length;
        } else {
          for (var i = cur.childNodes.length - 1;0 <= i;i--) {
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
  return!1;
};
goog.dom.getAncestorByTagNameAndClass = function(element, opt_tag, opt_class) {
  if (!opt_tag && !opt_class) {
    return null;
  }
  var tagName = opt_tag ? opt_tag.toUpperCase() : null;
  return goog.dom.getAncestor(element, function(node) {
    return(!tagName || node.nodeName == tagName) && (!opt_class || goog.dom.classes.has(node, opt_class));
  }, !0);
};
goog.dom.getAncestorByClass = function(element, className) {
  return goog.dom.getAncestorByTagNameAndClass(element, null, className);
};
goog.dom.getAncestor = function(element, matcher, opt_includeNode, opt_maxSearchSteps) {
  opt_includeNode || (element = element.parentNode);
  for (var ignoreSearchSteps = null == opt_maxSearchSteps, steps = 0;element && (ignoreSearchSteps || steps <= opt_maxSearchSteps);) {
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
    return doc && doc.activeElement;
  } catch (e) {
  }
  return null;
};
goog.dom.getPixelRatio = goog.functions.cacheReturnValue(function() {
  var win = goog.dom.getWindow(), isFirefoxMobile = goog.userAgent.GECKO && goog.userAgent.MOBILE;
  return goog.isDef(win.devicePixelRatio) && !isFirefoxMobile ? win.devicePixelRatio : win.matchMedia ? goog.dom.matchesPixelRatio_(0.75) || goog.dom.matchesPixelRatio_(1.5) || goog.dom.matchesPixelRatio_(2) || goog.dom.matchesPixelRatio_(3) || 1 : 1;
});
goog.dom.matchesPixelRatio_ = function(pixelRatio) {
  return goog.dom.getWindow().matchMedia("(-webkit-min-device-pixel-ratio: " + pixelRatio + "),(min--moz-device-pixel-ratio: " + pixelRatio + "),(min-resolution: " + pixelRatio + "dppx)").matches ? pixelRatio : 0;
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
goog.dom.DomHelper.prototype.getElementsByTagNameAndClass = function(opt_tag, opt_class, opt_el) {
  return goog.dom.getElementsByTagNameAndClass_(this.document_, opt_tag, opt_class, opt_el);
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
  return this.document_.createElement(name);
};
goog.dom.DomHelper.prototype.createTextNode = function(content) {
  return this.document_.createTextNode(String(content));
};
goog.dom.DomHelper.prototype.createTable = function(rows, columns, opt_fillWithNbsp) {
  return goog.dom.createTable_(this.document_, rows, columns, !!opt_fillWithNbsp);
};
goog.dom.DomHelper.prototype.htmlToDocumentFragment = function(htmlString) {
  return goog.dom.htmlToDocumentFragment_(this.document_, htmlString);
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
    var prefix = prefix.toLowerCase(), prefixedPropertyName = prefix + goog.string.toTitleCase(propertyName);
    return!goog.isDef(opt_object) || prefixedPropertyName in opt_object ? prefixedPropertyName : null;
  }
  return null;
};
goog.dom.vendor.getPrefixedEventType = function(eventType) {
  return((goog.dom.vendor.getVendorJsPrefix() || "") + eventType).toLowerCase();
};
goog.math.Box = function(top, right, bottom, left) {
  this.top = top;
  this.right = right;
  this.bottom = bottom;
  this.left = left;
};
goog.math.Box.boundingBox = function(var_args) {
  for (var box = new goog.math.Box(arguments[0].y, arguments[0].x, arguments[0].y, arguments[0].x), i = 1;i < arguments.length;i++) {
    var coord = arguments[i];
    box.top = Math.min(box.top, coord.y);
    box.right = Math.max(box.right, coord.x);
    box.bottom = Math.max(box.bottom, coord.y);
    box.left = Math.min(box.left, coord.x);
  }
  return box;
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
  goog.isObject(top) ? (this.top -= top.top, this.right += top.right, this.bottom += top.bottom, this.left -= top.left) : (this.top -= top, this.right += opt_right, this.bottom += opt_bottom, this.left -= opt_left);
  return this;
};
goog.math.Box.prototype.expandToInclude = function(box) {
  this.left = Math.min(this.left, box.left);
  this.top = Math.min(this.top, box.top);
  this.right = Math.max(this.right, box.right);
  this.bottom = Math.max(this.bottom, box.bottom);
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
  tx instanceof goog.math.Coordinate ? (this.left += tx.x, this.right += tx.x, this.top += tx.y, this.bottom += tx.y) : (this.left += tx, this.right += tx, goog.isNumber(opt_ty) && (this.top += opt_ty, this.bottom += opt_ty));
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
  return!1;
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
    return[a.clone()];
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
  var clone = a.clone();
  clone.boundingRect(b);
  return clone;
};
goog.math.Rect.prototype.contains = function(another) {
  return another instanceof goog.math.Rect ? this.left <= another.left && this.left + this.width >= another.left + another.width && this.top <= another.top && this.top + this.height >= another.top + another.height : another.x >= this.left && another.x <= this.left + this.width && another.y >= this.top && another.y <= this.top + this.height;
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
  tx instanceof goog.math.Coordinate ? (this.left += tx.x, this.top += tx.y) : (this.left += tx, goog.isNumber(opt_ty) && (this.top += opt_ty));
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
goog.style.GET_BOUNDING_CLIENT_RECT_ALWAYS_EXISTS = !1;
goog.style.setStyle = function(element, style, opt_value) {
  goog.isString(style) ? goog.style.setStyle_(element, opt_value, style) : goog.object.forEach(style, goog.partial(goog.style.setStyle_, element));
};
goog.style.setStyle_ = function(element, value, style) {
  var propertyName = goog.style.getVendorJsStyleName_(element, style);
  propertyName && (element.style[propertyName] = value);
};
goog.style.getVendorJsStyleName_ = function(element, style) {
  var camelStyle = goog.string.toCamelCase(style);
  if (void 0 === element.style[camelStyle]) {
    var prefixedStyle = goog.dom.vendor.getVendorJsPrefix() + goog.string.toTitleCase(style);
    if (void 0 !== element.style[prefixedStyle]) {
      return prefixedStyle;
    }
  }
  return camelStyle;
};
goog.style.getVendorStyleName_ = function(element, style) {
  var camelStyle = goog.string.toCamelCase(style);
  if (void 0 === element.style[camelStyle]) {
    var prefixedStyle = goog.dom.vendor.getVendorJsPrefix() + goog.string.toTitleCase(style);
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
  var x, y, buggyGeckoSubPixelPos = goog.userAgent.GECKO && (goog.userAgent.MAC || goog.userAgent.X11) && goog.userAgent.isVersionOrHigher("1.9");
  arg1 instanceof goog.math.Coordinate ? (x = arg1.x, y = arg1.y) : (x = arg1, y = opt_arg2);
  el.style.left = goog.style.getPixelStyleValue_(x, buggyGeckoSubPixelPos);
  el.style.top = goog.style.getPixelStyleValue_(y, buggyGeckoSubPixelPos);
};
goog.style.getPosition = function(element) {
  return new goog.math.Coordinate(element.offsetLeft, element.offsetTop);
};
goog.style.getClientViewportElement = function(opt_node) {
  var doc;
  doc = opt_node ? goog.dom.getOwnerDocument(opt_node) : goog.dom.getDocument();
  return!goog.userAgent.IE || goog.userAgent.isDocumentModeOrHigher(9) || goog.dom.getDomHelper(doc).isCss1CompatMode() ? doc.documentElement : doc.body;
};
goog.style.getViewportPageOffset = function(doc) {
  var body = doc.body, documentElement = doc.documentElement;
  return new goog.math.Coordinate(body.scrollLeft || documentElement.scrollLeft, body.scrollTop || documentElement.scrollTop);
};
goog.style.getBoundingClientRect_ = function(el) {
  var rect;
  try {
    rect = el.getBoundingClientRect();
  } catch (e) {
    return{left:0, top:0, right:0, bottom:0};
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
    return element.offsetParent;
  }
  for (var doc = goog.dom.getOwnerDocument(element), positionStyle = goog.style.getStyle_(element, "position"), skipStatic = "fixed" == positionStyle || "absolute" == positionStyle, parent = element.parentNode;parent && parent != doc;parent = parent.parentNode) {
    if (positionStyle = goog.style.getStyle_(parent, "position"), skipStatic = skipStatic && "static" == positionStyle && parent != doc.documentElement && parent != doc.body, !skipStatic && (parent.scrollWidth > parent.clientWidth || parent.scrollHeight > parent.clientHeight || "fixed" == positionStyle || "absolute" == positionStyle || "relative" == positionStyle)) {
      return parent;
    }
  }
  return null;
};
goog.style.getVisibleRectForElement = function(element) {
  for (var visibleRect = new goog.math.Box(0, Infinity, Infinity, 0), dom = goog.dom.getDomHelper(element), body = dom.getDocument().body, documentElement = dom.getDocument().documentElement, scrollEl = dom.getDocumentScrollElement(), el = element;el = goog.style.getOffsetParent(el);) {
    if (!(goog.userAgent.IE && 0 == el.clientWidth || goog.userAgent.WEBKIT && 0 == el.clientHeight && el == body || el == body || el == documentElement || "visible" == goog.style.getStyle_(el, "overflow"))) {
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
goog.style.getContainerOffsetToScrollInto = function(element, container, opt_center) {
  var elementPos = goog.style.getPageOffset(element), containerPos = goog.style.getPageOffset(container), containerBorder = goog.style.getBorderBox(container), relX = elementPos.x - containerPos.x - containerBorder.left, relY = elementPos.y - containerPos.y - containerBorder.top, spaceX = container.clientWidth - element.offsetWidth, spaceY = container.clientHeight - element.offsetHeight, scrollLeft = container.scrollLeft, scrollTop = container.scrollTop;
  opt_center ? (scrollLeft += relX - spaceX / 2, scrollTop += relY - spaceY / 2) : (scrollLeft += Math.min(relX, Math.max(relX - spaceX, 0)), scrollTop += Math.min(relY, Math.max(relY - spaceY, 0)));
  return new goog.math.Coordinate(scrollLeft, scrollTop);
};
goog.style.scrollIntoContainerView = function(element, container, opt_center) {
  var offset = goog.style.getContainerOffsetToScrollInto(element, container, opt_center);
  container.scrollLeft = offset.x;
  container.scrollTop = offset.y;
};
goog.style.getClientLeftTop = function(el) {
  if (goog.userAgent.GECKO && !goog.userAgent.isVersionOrHigher("1.9")) {
    var left = parseFloat(goog.style.getComputedStyle(el, "borderLeftWidth"));
    if (goog.style.isRightToLeft(el)) {
      var scrollbarWidth = el.offsetWidth - el.clientWidth - left - parseFloat(goog.style.getComputedStyle(el, "borderRightWidth")), left = left + scrollbarWidth
    }
    return new goog.math.Coordinate(left, parseFloat(goog.style.getComputedStyle(el, "borderTopWidth")));
  }
  return new goog.math.Coordinate(el.clientLeft, el.clientTop);
};
goog.style.getPageOffset = function(el) {
  var box, doc = goog.dom.getOwnerDocument(el), positionStyle = goog.style.getStyle_(el, "position");
  goog.asserts.assertObject(el, "Parameter is required");
  var BUGGY_GECKO_BOX_OBJECT = !goog.style.GET_BOUNDING_CLIENT_RECT_ALWAYS_EXISTS && goog.userAgent.GECKO && doc.getBoxObjectFor && !el.getBoundingClientRect && "absolute" == positionStyle && (box = doc.getBoxObjectFor(el)) && (0 > box.screenX || 0 > box.screenY), pos = new goog.math.Coordinate(0, 0), viewportElement = goog.style.getClientViewportElement(doc);
  if (el == viewportElement) {
    return pos;
  }
  if (goog.style.GET_BOUNDING_CLIENT_RECT_ALWAYS_EXISTS || el.getBoundingClientRect) {
    box = goog.style.getBoundingClientRect_(el);
    var scrollCoord = goog.dom.getDomHelper(doc).getDocumentScroll();
    pos.x = box.left + scrollCoord.x;
    pos.y = box.top + scrollCoord.y;
  } else {
    if (doc.getBoxObjectFor && !BUGGY_GECKO_BOX_OBJECT) {
      box = doc.getBoxObjectFor(el);
      var vpBox = doc.getBoxObjectFor(viewportElement);
      pos.x = box.screenX - vpBox.screenX;
      pos.y = box.screenY - vpBox.screenY;
    } else {
      var parent = el;
      do {
        pos.x += parent.offsetLeft;
        pos.y += parent.offsetTop;
        parent != el && (pos.x += parent.clientLeft || 0, pos.y += parent.clientTop || 0);
        if (goog.userAgent.WEBKIT && "fixed" == goog.style.getComputedPosition(parent)) {
          pos.x += doc.body.scrollLeft;
          pos.y += doc.body.scrollTop;
          break;
        }
        parent = parent.offsetParent;
      } while (parent && parent != el);
      if (goog.userAgent.OPERA || goog.userAgent.WEBKIT && "absolute" == positionStyle) {
        pos.y -= doc.body.offsetTop;
      }
      for (parent = el;(parent = goog.style.getOffsetParent(parent)) && parent != doc.body && parent != viewportElement;) {
        pos.x -= parent.scrollLeft, goog.userAgent.OPERA && "TR" == parent.tagName || (pos.y -= parent.scrollTop);
      }
    }
  }
  return pos;
};
goog.style.getPageOffsetLeft = function(el) {
  return goog.style.getPageOffset(el).x;
};
goog.style.getPageOffsetTop = function(el) {
  return goog.style.getPageOffset(el).y;
};
goog.style.getFramedPageOffset = function(el, relativeWin) {
  var position = new goog.math.Coordinate(0, 0), currentWin = goog.dom.getWindow(goog.dom.getOwnerDocument(el)), currentEl = el;
  do {
    var offset = currentWin == relativeWin ? goog.style.getPageOffset(currentEl) : goog.style.getClientPositionForElement_(goog.asserts.assert(currentEl));
    position.x += offset.x;
    position.y += offset.y;
  } while (currentWin && currentWin != relativeWin && (currentEl = currentWin.frameElement) && (currentWin = currentWin.parent));
  return position;
};
goog.style.translateRectForAnotherFrame = function(rect, origBase, newBase) {
  if (origBase.getDocument() != newBase.getDocument()) {
    var body = origBase.getDocument().body, pos = goog.style.getFramedPageOffset(body, newBase.getWindow()), pos = goog.math.Coordinate.difference(pos, goog.style.getPageOffset(body));
    goog.userAgent.IE && !origBase.isCss1CompatMode() && (pos = goog.math.Coordinate.difference(pos, origBase.getDocumentScroll()));
    rect.left += pos.x;
    rect.top += pos.y;
  }
};
goog.style.getRelativePosition = function(a, b) {
  var ap = goog.style.getClientPosition(a), bp = goog.style.getClientPosition(b);
  return new goog.math.Coordinate(ap.x - bp.x, ap.y - bp.y);
};
goog.style.getClientPositionForElement_ = function(el) {
  var pos;
  if (goog.style.GET_BOUNDING_CLIENT_RECT_ALWAYS_EXISTS || el.getBoundingClientRect) {
    var box = goog.style.getBoundingClientRect_(el);
    pos = new goog.math.Coordinate(box.left, box.top);
  } else {
    var scrollCoord = goog.dom.getDomHelper(el).getDocumentScroll(), pageCoord = goog.style.getPageOffset(el);
    pos = new goog.math.Coordinate(pageCoord.x - scrollCoord.x, pageCoord.y - scrollCoord.y);
  }
  return goog.userAgent.GECKO && !goog.userAgent.isVersionOrHigher(12) ? goog.math.Coordinate.sum(pos, goog.style.getCssTranslation(el)) : pos;
};
goog.style.getClientPosition = function(el) {
  goog.asserts.assert(el);
  if (el.nodeType == goog.dom.NodeType.ELEMENT) {
    return goog.style.getClientPositionForElement_(el);
  }
  var isAbstractedEvent = goog.isFunction(el.getBrowserEvent), targetEvent = el;
  el.targetTouches ? targetEvent = el.targetTouches[0] : isAbstractedEvent && el.getBrowserEvent().targetTouches && (targetEvent = el.getBrowserEvent().targetTouches[0]);
  return new goog.math.Coordinate(targetEvent.clientX, targetEvent.clientY);
};
goog.style.setPageOffset = function(el, x, opt_y) {
  var cur = goog.style.getPageOffset(el);
  x instanceof goog.math.Coordinate && (opt_y = x.y, x = x.x);
  goog.style.setPosition(el, el.offsetLeft + (x - cur.x), el.offsetTop + (opt_y - cur.y));
};
goog.style.setSize = function(element, w, opt_h) {
  var h;
  if (w instanceof goog.math.Size) {
    h = w.height, w = w.width;
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
  var style = el.style;
  "opacity" in style ? style.opacity = alpha : "MozOpacity" in style ? style.MozOpacity = alpha : "filter" in style && (style.filter = "" === alpha ? "" : "alpha(opacity=" + 100 * alpha + ")");
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
goog.style.installStyles = function(stylesString, opt_node) {
  var dh = goog.dom.getDomHelper(opt_node), styleSheet = null, doc = dh.getDocument();
  if (goog.userAgent.IE && doc.createStyleSheet) {
    styleSheet = doc.createStyleSheet(), goog.style.setStyles(styleSheet, stylesString);
  } else {
    var head = dh.getElementsByTagNameAndClass("head")[0];
    if (!head) {
      var body = dh.getElementsByTagNameAndClass("body")[0], head = dh.createDom("head");
      body.parentNode.insertBefore(head, body);
    }
    styleSheet = dh.createDom("style");
    goog.style.setStyles(styleSheet, stylesString);
    dh.appendChild(head, styleSheet);
  }
  return styleSheet;
};
goog.style.uninstallStyles = function(styleSheet) {
  goog.dom.removeNode(styleSheet.ownerNode || styleSheet.owningElement || styleSheet);
};
goog.style.setStyles = function(element, stylesString) {
  goog.userAgent.IE && goog.isDef(element.cssText) ? element.cssText = stylesString : element.innerHTML = stylesString;
};
goog.style.setPreWrap = function(el) {
  var style = el.style;
  goog.userAgent.IE && !goog.userAgent.isVersionOrHigher("8") ? (style.whiteSpace = "pre", style.wordWrap = "break-word") : style.whiteSpace = goog.userAgent.GECKO ? "-moz-pre-wrap" : "pre-wrap";
};
goog.style.setInlineBlock = function(el) {
  var style = el.style;
  style.position = "relative";
  goog.userAgent.IE && !goog.userAgent.isVersionOrHigher("8") ? (style.zoom = "1", style.display = "inline") : style.display = goog.userAgent.GECKO ? goog.userAgent.isVersionOrHigher("1.9a") ? "inline-block" : "-moz-inline-box" : "inline-block";
};
goog.style.isRightToLeft = function(el) {
  return "rtl" == goog.style.getStyle_(el, "direction");
};
goog.style.unselectableStyle_ = goog.userAgent.GECKO ? "MozUserSelect" : goog.userAgent.WEBKIT ? "WebkitUserSelect" : null;
goog.style.isUnselectable = function(el) {
  return goog.style.unselectableStyle_ ? "none" == el.style[goog.style.unselectableStyle_].toLowerCase() : goog.userAgent.IE || goog.userAgent.OPERA ? "on" == el.getAttribute("unselectable") : !1;
};
goog.style.setUnselectable = function(el, unselectable, opt_noRecurse) {
  var descendants = opt_noRecurse ? null : el.getElementsByTagName("*"), name = goog.style.unselectableStyle_;
  if (name) {
    var value = unselectable ? "none" : "";
    el.style[name] = value;
    if (descendants) {
      for (var i = 0, descendant;descendant = descendants[i];i++) {
        descendant.style[name] = value;
      }
    }
  } else {
    if (goog.userAgent.IE || goog.userAgent.OPERA) {
      if (value = unselectable ? "on" : "", el.setAttribute("unselectable", value), descendants) {
        for (i = 0;descendant = descendants[i];i++) {
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
  if (!goog.userAgent.IE || isCss1CompatMode && goog.userAgent.isVersionOrHigher("8")) {
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
  if (!goog.userAgent.IE || isCss1CompatMode && goog.userAgent.isVersionOrHigher("8")) {
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
  return pixelValue;
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
  if (doc.body.createTextRange) {
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
    if (sizeUnits in goog.style.ABSOLUTE_CSS_LENGTH_UNITS_) {
      return goog.style.getIePixelValue_(el, fontSize, "left", "pixelLeft");
    }
    if (el.parentNode && el.parentNode.nodeType == goog.dom.NodeType.ELEMENT && sizeUnits in goog.style.CONVERTIBLE_RELATIVE_CSS_UNITS_) {
      var parentElement = el.parentNode, parentSize = goog.style.getStyle_(parentElement, "fontSize");
      return goog.style.getIePixelValue_(parentElement, fontSize == parentSize ? "1em" : fontSize, "left", "pixelLeft");
    }
  }
  var sizeElement = goog.dom.createDom("span", {style:"visibility:hidden;position:absolute;line-height:0;padding:0;margin:0;border:0;height:1em;"});
  goog.dom.appendChild(el, sizeElement);
  fontSize = sizeElement.offsetHeight;
  goog.dom.removeNode(sizeElement);
  return fontSize;
};
goog.style.parseStyleAttribute = function(value) {
  var result = {};
  goog.array.forEach(value.split(/\s*;\s*/), function(pair) {
    var keyValue = pair.split(/\s*:\s*/);
    2 == keyValue.length && (result[goog.string.toCamelCase(keyValue[0].toLowerCase())] = keyValue[1]);
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
  var outerDiv = goog.dom.createElement("div");
  opt_className && (outerDiv.className = opt_className);
  outerDiv.style.cssText = "overflow:auto;position:absolute;top:0;width:100px;height:100px";
  var innerDiv = goog.dom.createElement("div");
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
goog.events.EventHandler = function(opt_scope) {
  goog.Disposable.call(this);
  this.handler_ = opt_scope;
  this.keys_ = {};
};
goog.inherits(goog.events.EventHandler, goog.Disposable);
goog.events.EventHandler.typeArray_ = [];
goog.events.EventHandler.prototype.listen = function(src, type, opt_fn, opt_capture) {
  return this.listen_(src, type, opt_fn, opt_capture);
};
goog.events.EventHandler.prototype.listenWithScope = function(src, type, fn, capture, scope) {
  return this.listen_(src, type, fn, capture, scope);
};
goog.events.EventHandler.prototype.listen_ = function(src, type, opt_fn, opt_capture, opt_scope) {
  goog.isArray(type) || (type && (goog.events.EventHandler.typeArray_[0] = type.toString()), type = goog.events.EventHandler.typeArray_);
  for (var i = 0;i < type.length;i++) {
    var listenerObj = goog.events.listen(src, type[i], opt_fn || this.handleEvent, opt_capture || !1, opt_scope || this.handler_ || this);
    if (!listenerObj) {
      break;
    }
    this.keys_[listenerObj.key] = listenerObj;
  }
  return this;
};
goog.events.EventHandler.prototype.listenOnce = function(src, type, opt_fn, opt_capture) {
  return this.listenOnce_(src, type, opt_fn, opt_capture);
};
goog.events.EventHandler.prototype.listenOnceWithScope = function(src, type, fn, capture, scope) {
  return this.listenOnce_(src, type, fn, capture, scope);
};
goog.events.EventHandler.prototype.listenOnce_ = function(src, type, opt_fn, opt_capture, opt_scope) {
  if (goog.isArray(type)) {
    for (var i = 0;i < type.length;i++) {
      this.listenOnce_(src, type[i], opt_fn, opt_capture, opt_scope);
    }
  } else {
    var listenerObj = goog.events.listenOnce(src, type, opt_fn || this.handleEvent, opt_capture, opt_scope || this.handler_ || this);
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
goog.events.EventHandler.prototype.unlisten = function(src, type, opt_fn, opt_capture, opt_scope) {
  if (goog.isArray(type)) {
    for (var i = 0;i < type.length;i++) {
      this.unlisten(src, type[i], opt_fn, opt_capture, opt_scope);
    }
  } else {
    var listener = goog.events.getListener(src, type, opt_fn || this.handleEvent, opt_capture, opt_scope || this.handler_ || this);
    listener && (goog.events.unlistenByKey(listener), delete this.keys_[listener.key]);
  }
  return this;
};
goog.events.EventHandler.prototype.unlistenWithWrapper = function(src, wrapper, listener, opt_capt, opt_scope) {
  wrapper.unlisten(src, listener, opt_capt, opt_scope || this.handler_ || this, this);
  return this;
};
goog.events.EventHandler.prototype.removeAll = function() {
  goog.object.forEach(this.keys_, goog.events.unlistenByKey);
  this.keys_ = {};
};
goog.events.EventHandler.prototype.disposeInternal = function() {
  goog.events.EventHandler.superClass_.disposeInternal.call(this);
  this.removeAll();
};
goog.events.EventHandler.prototype.handleEvent = function(e) {
  throw Error("EventHandler.handleEvent not implemented");
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
    var image;
    image = this.parent_ ? goog.dom.getDomHelper(this.parent_).createDom("img") : new Image;
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
goog.structs.Queue = function() {
  this.tail_ = this.head_ = 0;
  this.elements_ = [];
};
goog.structs.Queue.prototype.enqueue = function(element) {
  this.elements_[this.tail_++] = element;
};
goog.structs.Queue.prototype.dequeue = function() {
  if (this.head_ != this.tail_) {
    var result = this.elements_[this.head_];
    delete this.elements_[this.head_];
    this.head_++;
    return result;
  }
};
goog.structs.Queue.prototype.peek = function() {
  return this.head_ == this.tail_ ? void 0 : this.elements_[this.head_];
};
goog.structs.Queue.prototype.getCount = function() {
  return this.tail_ - this.head_;
};
goog.structs.Queue.prototype.isEmpty = function() {
  return 0 == this.tail_ - this.head_;
};
goog.structs.Queue.prototype.clear = function() {
  this.tail_ = this.head_ = this.elements_.length = 0;
};
goog.structs.Queue.prototype.contains = function(obj) {
  return goog.array.contains(this.elements_, obj);
};
goog.structs.Queue.prototype.remove = function(obj) {
  var index = goog.array.indexOf(this.elements_, obj);
  if (0 > index) {
    return!1;
  }
  index == this.head_ ? this.dequeue() : (goog.array.removeAt(this.elements_, index), this.tail_--);
  return!0;
};
goog.structs.Queue.prototype.getValues = function() {
  return this.elements_.slice(this.head_, this.tail_);
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
  var magicProps = {canBeReused:0};
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
  for (var obj;0 < this.getFreeCount() && (obj = this.freeQueue_.dequeue(), !this.objectCanBeReused(obj));) {
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
  for (var freeQueue = this.freeQueue_;this.getCount() < this.minCount_;) {
    freeQueue.enqueue(this.createObject());
  }
  for (;this.getCount() > this.maxCount_ && 0 < this.getFreeCount();) {
    this.disposeObject(freeQueue.dequeue());
  }
};
goog.structs.Pool.prototype.createObject = function() {
  return{};
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
  for (var freeQueue = this.freeQueue_;!freeQueue.isEmpty();) {
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
  var nodes = this.nodes_;
  nodes.push(new goog.structs.Node(key, value));
  this.moveUp_(nodes.length - 1);
};
goog.structs.Heap.prototype.insertAll = function(heap) {
  var keys, values;
  if (heap instanceof goog.structs.Heap) {
    if (keys = heap.getKeys(), values = heap.getValues(), 0 >= heap.getCount()) {
      for (var nodes = this.nodes_, i = 0;i < keys.length;i++) {
        nodes.push(new goog.structs.Node(keys[i], values[i]));
      }
      return;
    }
  } else {
    keys = goog.object.getKeys(heap), values = goog.object.getValues(heap);
  }
  for (i = 0;i < keys.length;i++) {
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
  return 0 == nodes.length ? void 0 : nodes[0].getValue();
};
goog.structs.Heap.prototype.peekKey = function() {
  return this.nodes_[0] && this.nodes_[0].getKey();
};
goog.structs.Heap.prototype.moveDown_ = function(index) {
  for (var nodes = this.nodes_, count = nodes.length, node = nodes[index];index < count >> 1;) {
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
  for (var nodes = this.nodes_, node = nodes[index];0 < index;) {
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
  for (var nodes = this.nodes_, rv = [], l = nodes.length, i = 0;i < l;i++) {
    rv.push(nodes[i].getValue());
  }
  return rv;
};
goog.structs.Heap.prototype.getKeys = function() {
  for (var nodes = this.nodes_, rv = [], l = nodes.length, i = 0;i < l;i++) {
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
  for (var requestQueue = this.requestQueue_;0 < requestQueue.getCount();) {
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
ee.MapTileManager = function() {
  goog.events.EventTarget.call(this);
  this.tokenPool_ = new ee.MapTileManager.TokenPool_(0, 4);
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
ee.MapTileManager.Event_ = function(type, target, id, imageLoader) {
  goog.events.Event.call(this, type, target);
  this.id = id;
  this.imageLoader = imageLoader;
};
goog.inherits(ee.MapTileManager.Event_, goog.events.Event);
ee.MapTileManager.Event_.prototype.disposeInternal = function() {
  delete this.id;
  this.imageLoader = null;
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
ee.MapTileManager.Request_.aborted_ = !1;
ee.MapTileManager.Request_.imageLoader_ = null;
ee.MapTileManager.Request_.token_ = null;
ee.MapTileManager.Request_.event_ = null;
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
  this.imageEventCallback_ && this.imageEventCallback_(this.event_);
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
      ;
      case goog.net.EventType.ABORT:
        this.handleError_(e);
        break;
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
ee.MapTileManager.Request_.prototype.getImageEventCallback = function() {
  return this.imageEventCallback_;
};
ee.MapTileManager.Request_.prototype.getRequestCompleteCallback = function() {
  return this.requestCompleteCallback_;
};
ee.MapTileManager.Request_.prototype.disposeInternal = function() {
  ee.MapTileManager.Request_.superClass_.disposeInternal.call(this);
  delete this.imageEventCallback_;
  delete this.requestCompleteCallback_;
};
ee.MapTileManager.Request_.prototype.retry = function() {
  if (this.hasReachedMaxRetries()) {
    return!1;
  }
  this.increaseAttemptCount();
  this.imageLoader_.removeImage(this.id_);
  setTimeout(goog.bind(this.start_, this), 0);
  return!0;
};
ee.MapTileManager.Request_.prototype.start_ = function() {
  this.getAborted() || (this.imageLoader_.addImage(this.id_, this.getUrl()), this.addImageEventListener(), this.imageLoader_.start());
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
  return!obj.isDisposed() && !obj.isActive();
};
ee.MapLayerOverlay = function(url, mapId, token, init) {
  goog.events.EventTarget.call(this);
  this.mapId = mapId;
  this.token = token;
  this.minZoom = init.minZoom || 0;
  this.maxZoom = init.maxZoom || 20;
  if (!window.google || !window.google.maps) {
    throw Error("Google Maps API hasn't been initialized.");
  }
  this.tileSize = init.tileSize || new google.maps.Size(256, 256);
  this.isPng = init.isPng || !0;
  this.tilesLoading_ = [];
  this.tiles_ = new goog.structs.Set;
  this.tileCounter_ = 0;
  this.url = url;
  this.opacity_ = 1;
  this.visible_ = !0;
};
goog.inherits(ee.MapLayerOverlay, goog.events.EventTarget);
ee.MapLayerOverlay.prototype.dispatchTileEvent_ = function() {
  this.dispatchEvent(new ee.TileEvent_(this.tilesLoading_.length));
};
ee.MapLayerOverlay.prototype.getTile = function(coord, zoom, ownerDocument) {
  var maxCoord = 1 << zoom;
  if (zoom < this.minZoom || 0 > coord.y || coord.y >= maxCoord) {
    var img = ownerDocument.createElement("IMG");
    img.style.width = "0px";
    img.style.height = "0px";
    return img;
  }
  var x = coord.x % maxCoord;
  0 > x && (x += maxCoord);
  var tileId = [this.mapId, zoom, x, coord.y].join("/"), src = [this.url, tileId].join("/") + "?token=" + this.token, uniqueTileId = tileId + "/" + this.tileCounter_;
  this.tileCounter_ += 1;
  var div = goog.dom.createDom("div", {id:uniqueTileId}), priority = (new Date).getTime() / 1E3;
  this.tilesLoading_.push(uniqueTileId);
  ee.MapTileManager.getInstance().send(uniqueTileId, src, priority, goog.bind(this.handleImageCompleted_, this, div, uniqueTileId));
  this.dispatchTileEvent_();
  return div;
};
ee.MapLayerOverlay.prototype.releaseTile = function(tileNode) {
  ee.MapTileManager.getInstance().abort(tileNode.id);
  this.tiles_.remove(tileNode);
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
ee.MapLayerOverlay.prototype.handleImageCompleted_ = function(div, tileId, e) {
  if (e.type == goog.net.EventType.ERROR) {
    this.dispatchEvent(e);
  } else {
    goog.array.remove(this.tilesLoading_, tileId);
    var tile;
    e.target && e.type == goog.events.EventType.LOAD && (tile = e.target, this.tiles_.add(tile), 1 != this.opacity_ && goog.style.setOpacity(tile, this.opacity_), div.appendChild(tile));
    this.dispatchTileEvent_();
  }
};
ee.TileEvent_ = function(count) {
  goog.events.Event.call(this, "tileevent");
  this.count = count;
};
goog.inherits(ee.TileEvent_, goog.events.Event);
ee.SavedFunction = function(path, signature) {
  if (!(this instanceof ee.SavedFunction)) {
    return new ee.SavedFunction(path, signature);
  }
  this.path_ = path;
  this.signature_ = signature;
};
goog.inherits(ee.SavedFunction, ee.Function);
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
    for (var contents = ee.Package.getFolder(opt_path), i = 0;i < contents.length;i++) {
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
  if (!path) {
    throw Error("No path specified.");
  }
  var original = {}, name;
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
    for (var index = 0;index < custom.length;index++) {
      name = custom[index].name;
      var algorithm = custom[index].algorithm.serialize();
      ee.data.createAsset(algorithm, path + "/" + name);
    }
  }
};
ee.Package.getFolder = function(path) {
  return ee.ApiFunction.lookup("LoadFolder").call(path).getInfo();
};
ee.Package.decodeDecl = function(decl) {
  var parts = decl.match(/\w+|\S/g), cur = 0, expect = function(regex) {
    var match = parts[cur] && parts[cur].match(regex);
    if (match) {
      return cur++, match[0];
    }
    throw Error("Unable to decode declaration.");
  }, type = expect(/\w+/);
  expect(/\w+/);
  expect(/\(/);
  for (var collected = [];parts[cur] && !parts[cur].match("\\)");) {
    collected.length && expect(","), collected.push({type:expect(/\w+/), name:expect(/\w+/)});
  }
  expect(/\)/);
  ";" == parts[cur] && expect(";");
  if (parts[cur]) {
    throw Error("Unable to decode declaration.  Found extra trailing input.");
  }
  return{returns:type, args:collected};
};
ee.Package.encodeDecl_ = function(signature, name) {
  var out = [signature.returns, " ", name, "("];
  if (signature.args) {
    for (var i = 0;i < signature.args.length;i++) {
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

