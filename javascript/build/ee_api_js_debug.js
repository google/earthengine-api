var goog = goog || {};
goog.global = this;
goog.DEBUG = !0;
goog.LOCALE = "en";
goog.provide = function(name) {
  goog.exportPath_(name)
};
goog.setTestOnly = function(opt_message) {
  if(!goog.DEBUG) {
    throw opt_message = opt_message || "", Error("Importing test-only code into non-debug environment" + opt_message ? ": " + opt_message : ".");
  }
};
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split("."), cur = opt_objectToExportTo || goog.global;
  !(parts[0] in cur) && cur.execScript && cur.execScript("var " + parts[0]);
  for(var part;parts.length && (part = parts.shift());) {
    !parts.length && goog.isDef(opt_object) ? cur[part] = opt_object : cur = cur[part] ? cur[part] : cur[part] = {}
  }
};
goog.getObjectByName = function(name, opt_obj) {
  for(var parts = name.split("."), cur = opt_obj || goog.global, part;part = parts.shift();) {
    if(goog.isDefAndNotNull(cur[part])) {
      cur = cur[part]
    }else {
      return null
    }
  }
  return cur
};
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global, x;
  for(x in obj) {
    global[x] = obj[x]
  }
};
goog.addDependency = function() {
};
goog.useStrictRequires = !1;
goog.ENABLE_DEBUG_LOADER = !0;
goog.require = function() {
};
goog.basePath = "";
goog.nullFunction = function() {
};
goog.identityFunction = function(opt_returnValue) {
  return opt_returnValue
};
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    if(ctor.instance_) {
      return ctor.instance_
    }
    goog.DEBUG && (goog.instantiatedSingletons_[goog.instantiatedSingletons_.length] = ctor);
    return ctor.instance_ = new ctor
  }
};
goog.instantiatedSingletons_ = [];
goog.typeOf = function(value) {
  var s = typeof value;
  if("object" == s) {
    if(value) {
      if(value instanceof Array) {
        return"array"
      }
      if(value instanceof Object) {
        return s
      }
      var className = Object.prototype.toString.call(value);
      if("[object Window]" == className) {
        return"object"
      }
      if("[object Array]" == className || "number" == typeof value.length && "undefined" != typeof value.splice && "undefined" != typeof value.propertyIsEnumerable && !value.propertyIsEnumerable("splice")) {
        return"array"
      }
      if("[object Function]" == className || "undefined" != typeof value.call && "undefined" != typeof value.propertyIsEnumerable && !value.propertyIsEnumerable("call")) {
        return"function"
      }
    }else {
      return"null"
    }
  }else {
    if("function" == s && "undefined" == typeof value.call) {
      return"object"
    }
  }
  return s
};
goog.isDef = function(val) {
  return void 0 !== val
};
goog.isNull = function(val) {
  return null === val
};
goog.isDefAndNotNull = function(val) {
  return null != val
};
goog.isArray = function(val) {
  return"array" == goog.typeOf(val)
};
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return"array" == type || "object" == type && "number" == typeof val.length
};
goog.isDateLike = function(val) {
  return goog.isObject(val) && "function" == typeof val.getFullYear
};
goog.isString = function(val) {
  return"string" == typeof val
};
goog.isBoolean = function(val) {
  return"boolean" == typeof val
};
goog.isNumber = function(val) {
  return"number" == typeof val
};
goog.isFunction = function(val) {
  return"function" == goog.typeOf(val)
};
goog.isObject = function(val) {
  var type = typeof val;
  return"object" == type && null != val || "function" == type
};
goog.getUid = function(obj) {
  return obj[goog.UID_PROPERTY_] || (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_)
};
goog.removeUid = function(obj) {
  "removeAttribute" in obj && obj.removeAttribute(goog.UID_PROPERTY_);
  try {
    delete obj[goog.UID_PROPERTY_]
  }catch(ex) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + Math.floor(2147483648 * Math.random()).toString(36);
goog.uidCounter_ = 0;
goog.getHashCode = goog.getUid;
goog.removeHashCode = goog.removeUid;
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if("object" == type || "array" == type) {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = "array" == type ? [] : {}, key;
    for(key in obj) {
      clone[key] = goog.cloneObject(obj[key])
    }
    return clone
  }
  return obj
};
goog.bindNative_ = function(fn, selfObj, var_args) {
  return fn.call.apply(fn.bind, arguments)
};
goog.bindJs_ = function(fn, selfObj, var_args) {
  if(!fn) {
    throw Error();
  }
  if(2 < arguments.length) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(selfObj, newArgs)
    }
  }
  return function() {
    return fn.apply(selfObj, arguments)
  }
};
goog.bind = function(fn, selfObj, var_args) {
  goog.bind = Function.prototype.bind && -1 != Function.prototype.bind.toString().indexOf("native code") ? goog.bindNative_ : goog.bindJs_;
  return goog.bind.apply(null, arguments)
};
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs)
  }
};
goog.mixin = function(target, source) {
  for(var x in source) {
    target[x] = source[x]
  }
};
goog.now = Date.now || function() {
  return+new Date
};
goog.globalEval = function(script) {
  if(goog.global.execScript) {
    goog.global.execScript(script, "JavaScript")
  }else {
    if(goog.global.eval) {
      if(null == goog.evalWorksForGlobals_ && (goog.global.eval("var _et_ = 1;"), "undefined" != typeof goog.global._et_ ? (delete goog.global._et_, goog.evalWorksForGlobals_ = !0) : goog.evalWorksForGlobals_ = !1), goog.evalWorksForGlobals_) {
        goog.global.eval(script)
      }else {
        var doc = goog.global.document, scriptElt = doc.createElement("script");
        scriptElt.type = "text/javascript";
        scriptElt.defer = !1;
        scriptElt.appendChild(doc.createTextNode(script));
        doc.body.appendChild(scriptElt);
        doc.body.removeChild(scriptElt)
      }
    }else {
      throw Error("goog.globalEval not available");
    }
  }
};
goog.evalWorksForGlobals_ = null;
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName
  }, renameByParts = function(cssName) {
    for(var parts = cssName.split("-"), mapped = [], i = 0;i < parts.length;i++) {
      mapped.push(getMapping(parts[i]))
    }
    return mapped.join("-")
  }, rename;
  rename = goog.cssNameMapping_ ? "BY_WHOLE" == goog.cssNameMappingStyle_ ? getMapping : renameByParts : function(a) {
    return a
  };
  return opt_modifier ? className + "-" + rename(opt_modifier) : rename(className)
};
goog.setCssNameMapping = function(mapping, opt_style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = opt_style
};
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {}, key;
  for(key in values) {
    var value = ("" + values[key]).replace(/\$/g, "$$$$");
    str = str.replace(RegExp("\\{\\$" + key + "\\}", "gi"), value)
  }
  return str
};
goog.getMsgWithFallback = function(a) {
  return a
};
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo)
};
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol
};
goog.inherits = function(childCtor, parentCtor) {
  function tempCtor() {
  }
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor;
  childCtor.prototype.constructor = childCtor
};
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if(caller.superClass_) {
    return caller.superClass_.constructor.apply(me, Array.prototype.slice.call(arguments, 1))
  }
  for(var args = Array.prototype.slice.call(arguments, 2), foundCaller = !1, ctor = me.constructor;ctor;ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if(ctor.prototype[opt_methodName] === caller) {
      foundCaller = !0
    }else {
      if(foundCaller) {
        return ctor.prototype[opt_methodName].apply(me, args)
      }
    }
  }
  if(me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args)
  }
  throw Error("goog.base called from a method of one name to a method of a different name");
};
goog.scope = function(fn) {
  fn.call(goog.global)
};
goog.MODIFY_FUNCTION_PROTOTYPES = !0;
goog.MODIFY_FUNCTION_PROTOTYPES && (Function.prototype.bind = Function.prototype.bind || function(selfObj, var_args) {
  if(1 < arguments.length) {
    var args = Array.prototype.slice.call(arguments, 1);
    args.unshift(this, selfObj);
    return goog.bind.apply(null, args)
  }
  return goog.bind(this, selfObj)
}, Function.prototype.partial = function(var_args) {
  var args = Array.prototype.slice.call(arguments);
  args.unshift(this, null);
  return goog.bind.apply(null, args)
}, Function.prototype.inherits = function(parentCtor) {
  goog.inherits(this, parentCtor)
}, Function.prototype.mixin = function(source) {
  goog.mixin(this.prototype, source)
});
goog.object = {};
goog.object.forEach = function(obj, f, opt_obj) {
  for(var key in obj) {
    f.call(opt_obj, obj[key], key, obj)
  }
};
goog.object.filter = function(obj, f, opt_obj) {
  var res = {}, key;
  for(key in obj) {
    f.call(opt_obj, obj[key], key, obj) && (res[key] = obj[key])
  }
  return res
};
goog.object.map = function(obj, f, opt_obj) {
  var res = {}, key;
  for(key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj)
  }
  return res
};
goog.object.some = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      return!0
    }
  }
  return!1
};
goog.object.every = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(!f.call(opt_obj, obj[key], key, obj)) {
      return!1
    }
  }
  return!0
};
goog.object.getCount = function(obj) {
  var rv = 0, key;
  for(key in obj) {
    rv++
  }
  return rv
};
goog.object.getAnyKey = function(obj) {
  for(var key in obj) {
    return key
  }
};
goog.object.getAnyValue = function(obj) {
  for(var key in obj) {
    return obj[key]
  }
};
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val)
};
goog.object.getValues = function(obj) {
  var res = [], i = 0, key;
  for(key in obj) {
    res[i++] = obj[key]
  }
  return res
};
goog.object.getKeys = function(obj) {
  var res = [], i = 0, key;
  for(key in obj) {
    res[i++] = key
  }
  return res
};
goog.object.getValueByKeys = function(obj, var_args) {
  for(var isArrayLike = goog.isArrayLike(var_args), keys = isArrayLike ? var_args : arguments, i = isArrayLike ? 0 : 1;i < keys.length && !(obj = obj[keys[i]], !goog.isDef(obj));i++) {
  }
  return obj
};
goog.object.containsKey = function(obj, key) {
  return key in obj
};
goog.object.containsValue = function(obj, val) {
  for(var key in obj) {
    if(obj[key] == val) {
      return!0
    }
  }
  return!1
};
goog.object.findKey = function(obj, f, opt_this) {
  for(var key in obj) {
    if(f.call(opt_this, obj[key], key, obj)) {
      return key
    }
  }
};
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key]
};
goog.object.isEmpty = function(obj) {
  for(var key in obj) {
    return!1
  }
  return!0
};
goog.object.clear = function(obj) {
  for(var i in obj) {
    delete obj[i]
  }
};
goog.object.remove = function(obj, key) {
  var rv;
  (rv = key in obj) && delete obj[key];
  return rv
};
goog.object.add = function(obj, key, val) {
  if(key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val)
};
goog.object.get = function(obj, key, opt_val) {
  return key in obj ? obj[key] : opt_val
};
goog.object.set = function(obj, key, value) {
  obj[key] = value
};
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : obj[key] = value
};
goog.object.clone = function(obj) {
  var res = {}, key;
  for(key in obj) {
    res[key] = obj[key]
  }
  return res
};
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if("object" == type || "array" == type) {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = "array" == type ? [] : {}, key;
    for(key in obj) {
      clone[key] = goog.object.unsafeClone(obj[key])
    }
    return clone
  }
  return obj
};
goog.object.transpose = function(obj) {
  var transposed = {}, key;
  for(key in obj) {
    transposed[obj[key]] = key
  }
  return transposed
};
goog.object.PROTOTYPE_FIELDS_ = "constructor hasOwnProperty isPrototypeOf propertyIsEnumerable toLocaleString toString valueOf".split(" ");
goog.object.extend = function(target, var_args) {
  for(var key, source, i = 1;i < arguments.length;i++) {
    source = arguments[i];
    for(key in source) {
      target[key] = source[key]
    }
    for(var j = 0;j < goog.object.PROTOTYPE_FIELDS_.length;j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j], Object.prototype.hasOwnProperty.call(source, key) && (target[key] = source[key])
    }
  }
};
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if(1 == argLength && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0])
  }
  if(argLength % 2) {
    throw Error("Uneven number of arguments");
  }
  for(var rv = {}, i = 0;i < argLength;i += 2) {
    rv[arguments[i]] = arguments[i + 1]
  }
  return rv
};
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if(1 == argLength && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0])
  }
  for(var rv = {}, i = 0;i < argLength;i++) {
    rv[arguments[i]] = !0
  }
  return rv
};
goog.object.createImmutableView = function(obj) {
  var result = obj;
  Object.isFrozen && !Object.isFrozen(obj) && (result = Object.create(obj), Object.freeze(result));
  return result
};
goog.object.isImmutableView = function(obj) {
  return!!Object.isFrozen && Object.isFrozen(obj)
};
goog.json = {};
goog.json.isValid_ = function(s) {
  return/^\s*$/.test(s) ? !1 : /^[\],:{}\s\u2028\u2029]*$/.test(s.replace(/\\["\\\/bfnrtu]/g, "@").replace(/"[^"\\\n\r\u2028\u2029\x00-\x08\x0a-\x1f]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, "]").replace(/(?:^|:|,)(?:[\s\u2028\u2029]*\[)+/g, ""))
};
goog.json.parse = function(s) {
  var o = String(s);
  if(goog.json.isValid_(o)) {
    try {
      return eval("(" + o + ")")
    }catch(ex) {
    }
  }
  throw Error("Invalid JSON string: " + o);
};
goog.json.unsafeParse = function(s) {
  return eval("(" + s + ")")
};
goog.json.serialize = function(object, opt_replacer) {
  return(new goog.json.Serializer(opt_replacer)).serialize(object)
};
goog.json.Serializer = function(opt_replacer) {
  this.replacer_ = opt_replacer
};
goog.json.Serializer.prototype.serialize = function(object) {
  var sb = [];
  this.serialize_(object, sb);
  return sb.join("")
};
goog.json.Serializer.prototype.serialize_ = function(object, sb) {
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
      if(null == object) {
        sb.push("null");
        break
      }
      if(goog.isArray(object)) {
        this.serializeArray(object, sb);
        break
      }
      this.serializeObject_(object, sb);
      break;
    case "function":
      break;
    default:
      throw Error("Unknown type: " + typeof object);
  }
};
goog.json.Serializer.charToJsonCharCache_ = {'"':'\\"', "\\":"\\\\", "/":"\\/", "\b":"\\b", "\f":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\u000b"};
goog.json.Serializer.charsToReplace_ = /\uffff/.test("\uffff") ? /[\\\"\x00-\x1f\x7f-\uffff]/g : /[\\\"\x00-\x1f\x7f-\xff]/g;
goog.json.Serializer.prototype.serializeString_ = function(s, sb) {
  sb.push('"', s.replace(goog.json.Serializer.charsToReplace_, function(c) {
    if(c in goog.json.Serializer.charToJsonCharCache_) {
      return goog.json.Serializer.charToJsonCharCache_[c]
    }
    var cc = c.charCodeAt(0), rv = "\\u";
    16 > cc ? rv += "000" : 256 > cc ? rv += "00" : 4096 > cc && (rv += "0");
    return goog.json.Serializer.charToJsonCharCache_[c] = rv + cc.toString(16)
  }), '"')
};
goog.json.Serializer.prototype.serializeNumber_ = function(n, sb) {
  sb.push(isFinite(n) && !isNaN(n) ? n : "null")
};
goog.json.Serializer.prototype.serializeArray = function(arr, sb) {
  var l = arr.length;
  sb.push("[");
  for(var sep = "", i = 0;i < l;i++) {
    sb.push(sep);
    var value = arr[i];
    this.serialize_(this.replacer_ ? this.replacer_.call(arr, String(i), value) : value, sb);
    sep = ","
  }
  sb.push("]")
};
goog.json.Serializer.prototype.serializeObject_ = function(obj, sb) {
  sb.push("{");
  var sep = "", key;
  for(key in obj) {
    if(Object.prototype.hasOwnProperty.call(obj, key)) {
      var value = obj[key];
      "function" != typeof value && (sb.push(sep), this.serializeString_(key, sb), sb.push(":"), this.serialize_(this.replacer_ ? this.replacer_.call(obj, key, value) : value, sb), sep = ",")
    }
  }
  sb.push("}")
};
goog.debug = {};
goog.debug.Error = function(opt_msg) {
  Error.captureStackTrace ? Error.captureStackTrace(this, goog.debug.Error) : this.stack = Error().stack || "";
  opt_msg && (this.message = String(opt_msg))
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
goog.string = {};
goog.string.Unicode = {NBSP:"\u00a0"};
goog.string.startsWith = function(str, prefix) {
  return 0 == str.lastIndexOf(prefix, 0)
};
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return 0 <= l && str.indexOf(suffix, l) == l
};
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return 0 == goog.string.caseInsensitiveCompare(prefix, str.substr(0, prefix.length))
};
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return 0 == goog.string.caseInsensitiveCompare(suffix, str.substr(str.length - suffix.length, suffix.length))
};
goog.string.subs = function(str, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var replacement = String(arguments[i]).replace(/\$/g, "$$$$");
    str = str.replace(/\%s/, replacement)
  }
  return str
};
goog.string.collapseWhitespace = function(str) {
  return str.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "")
};
goog.string.isEmpty = function(str) {
  return/^[\s\xa0]*$/.test(str)
};
goog.string.isEmptySafe = function(str) {
  return goog.string.isEmpty(goog.string.makeSafe(str))
};
goog.string.isBreakingWhitespace = function(str) {
  return!/[^\t\n\r ]/.test(str)
};
goog.string.isAlpha = function(str) {
  return!/[^a-zA-Z]/.test(str)
};
goog.string.isNumeric = function(str) {
  return!/[^0-9]/.test(str)
};
goog.string.isAlphaNumeric = function(str) {
  return!/[^a-zA-Z0-9]/.test(str)
};
goog.string.isSpace = function(ch) {
  return" " == ch
};
goog.string.isUnicodeChar = function(ch) {
  return 1 == ch.length && " " <= ch && "~" >= ch || "\u0080" <= ch && "\ufffd" >= ch
};
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, " ")
};
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, "\n")
};
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, " ")
};
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, " ")
};
goog.string.collapseBreakingSpaces = function(str) {
  return str.replace(/[\t\r\n ]+/g, " ").replace(/^[\t\r\n ]+|[\t\r\n ]+$/g, "")
};
goog.string.trim = function(str) {
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "")
};
goog.string.trimLeft = function(str) {
  return str.replace(/^[\s\xa0]+/, "")
};
goog.string.trimRight = function(str) {
  return str.replace(/[\s\xa0]+$/, "")
};
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase(), test2 = String(str2).toLowerCase();
  return test1 < test2 ? -1 : test1 == test2 ? 0 : 1
};
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;
goog.string.numerateCompare = function(str1, str2) {
  if(str1 == str2) {
    return 0
  }
  if(!str1) {
    return-1
  }
  if(!str2) {
    return 1
  }
  for(var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_), tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_), count = Math.min(tokens1.length, tokens2.length), i = 0;i < count;i++) {
    var a = tokens1[i], b = tokens2[i];
    if(a != b) {
      var num1 = parseInt(a, 10);
      if(!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if(!isNaN(num2) && num1 - num2) {
          return num1 - num2
        }
      }
      return a < b ? -1 : 1
    }
  }
  return tokens1.length != tokens2.length ? tokens1.length - tokens2.length : str1 < str2 ? -1 : 1
};
goog.string.urlEncode = function(str) {
  return encodeURIComponent(String(str))
};
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, " "))
};
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? "<br />" : "<br>")
};
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {
  if(opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, "&amp;").replace(goog.string.ltRe_, "&lt;").replace(goog.string.gtRe_, "&gt;").replace(goog.string.quotRe_, "&quot;")
  }
  if(!goog.string.allRe_.test(str)) {
    return str
  }
  -1 != str.indexOf("&") && (str = str.replace(goog.string.amperRe_, "&amp;"));
  -1 != str.indexOf("<") && (str = str.replace(goog.string.ltRe_, "&lt;"));
  -1 != str.indexOf(">") && (str = str.replace(goog.string.gtRe_, "&gt;"));
  -1 != str.indexOf('"') && (str = str.replace(goog.string.quotRe_, "&quot;"));
  return str
};
goog.string.amperRe_ = /&/g;
goog.string.ltRe_ = /</g;
goog.string.gtRe_ = />/g;
goog.string.quotRe_ = /\"/g;
goog.string.allRe_ = /[&<>\"]/;
goog.string.unescapeEntities = function(str) {
  return goog.string.contains(str, "&") ? "document" in goog.global ? goog.string.unescapeEntitiesUsingDom_(str) : goog.string.unescapePureXmlEntities_(str) : str
};
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var seen = {"&amp;":"&", "&lt;":"<", "&gt;":">", "&quot;":'"'}, div = document.createElement("div");
  return str.replace(goog.string.HTML_ENTITY_PATTERN_, function(s, entity) {
    var value = seen[s];
    if(value) {
      return value
    }
    if("#" == entity.charAt(0)) {
      var n = Number("0" + entity.substr(1));
      isNaN(n) || (value = String.fromCharCode(n))
    }
    value || (div.innerHTML = s + " ", value = div.firstChild.nodeValue.slice(0, -1));
    return seen[s] = value
  })
};
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch(entity) {
      case "amp":
        return"&";
      case "lt":
        return"<";
      case "gt":
        return">";
      case "quot":
        return'"';
      default:
        if("#" == entity.charAt(0)) {
          var n = Number("0" + entity.substr(1));
          if(!isNaN(n)) {
            return String.fromCharCode(n)
          }
        }
        return s
    }
  })
};
goog.string.HTML_ENTITY_PATTERN_ = /&([^;\s<&]+);?/g;
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, " &#160;"), opt_xml)
};
goog.string.stripQuotes = function(str, quoteChars) {
  for(var length = quoteChars.length, i = 0;i < length;i++) {
    var quoteChar = 1 == length ? quoteChars : quoteChars.charAt(i);
    if(str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1)
    }
  }
  return str
};
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  opt_protectEscapedCharacters && (str = goog.string.unescapeEntities(str));
  str.length > chars && (str = str.substring(0, chars - 3) + "...");
  opt_protectEscapedCharacters && (str = goog.string.htmlEscape(str));
  return str
};
goog.string.truncateMiddle = function(str, chars, opt_protectEscapedCharacters, opt_trailingChars) {
  opt_protectEscapedCharacters && (str = goog.string.unescapeEntities(str));
  if(opt_trailingChars && str.length > chars) {
    opt_trailingChars > chars && (opt_trailingChars = chars), str = str.substring(0, chars - opt_trailingChars) + "..." + str.substring(str.length - opt_trailingChars)
  }else {
    if(str.length > chars) {
      var half = Math.floor(chars / 2), endPos = str.length - half;
      str = str.substring(0, half + chars % 2) + "..." + str.substring(endPos)
    }
  }
  opt_protectEscapedCharacters && (str = goog.string.htmlEscape(str));
  return str
};
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\b":"\\b", "\f":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\x0B", '"':'\\"', "\\":"\\\\"};
goog.string.jsEscapeCache_ = {"'":"\\'"};
goog.string.quote = function(s) {
  s = String(s);
  if(s.quote) {
    return s.quote()
  }
  for(var sb = ['"'], i = 0;i < s.length;i++) {
    var ch = s.charAt(i), cc = ch.charCodeAt(0);
    sb[i + 1] = goog.string.specialEscapeChars_[ch] || (31 < cc && 127 > cc ? ch : goog.string.escapeChar(ch))
  }
  sb.push('"');
  return sb.join("")
};
goog.string.escapeString = function(str) {
  for(var sb = [], i = 0;i < str.length;i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i))
  }
  return sb.join("")
};
goog.string.escapeChar = function(c) {
  if(c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c]
  }
  if(c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c]
  }
  var rv = c, cc = c.charCodeAt(0);
  if(31 < cc && 127 > cc) {
    rv = c
  }else {
    if(256 > cc) {
      if(rv = "\\x", 16 > cc || 256 < cc) {
        rv += "0"
      }
    }else {
      rv = "\\u", 4096 > cc && (rv += "0")
    }
    rv += cc.toString(16).toUpperCase()
  }
  return goog.string.jsEscapeCache_[c] = rv
};
goog.string.toMap = function(s) {
  for(var rv = {}, i = 0;i < s.length;i++) {
    rv[s.charAt(i)] = !0
  }
  return rv
};
goog.string.contains = function(s, ss) {
  return-1 != s.indexOf(ss)
};
goog.string.countOf = function(s, ss) {
  return s && ss ? s.split(ss).length - 1 : 0
};
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  0 <= index && (index < s.length && 0 < stringLength) && (resultStr = s.substr(0, index) + s.substr(index + stringLength, s.length - index - stringLength));
  return resultStr
};
goog.string.remove = function(s, ss) {
  var re = RegExp(goog.string.regExpEscape(ss), "");
  return s.replace(re, "")
};
goog.string.removeAll = function(s, ss) {
  var re = RegExp(goog.string.regExpEscape(ss), "g");
  return s.replace(re, "")
};
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08")
};
goog.string.repeat = function(string, length) {
  return Array(length + 1).join(string)
};
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num), index = s.indexOf(".");
  -1 == index && (index = s.length);
  return goog.string.repeat("0", Math.max(0, length - index)) + s
};
goog.string.makeSafe = function(obj) {
  return null == obj ? "" : String(obj)
};
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, "")
};
goog.string.getRandomString = function() {
  return Math.floor(2147483648 * Math.random()).toString(36) + Math.abs(Math.floor(2147483648 * Math.random()) ^ goog.now()).toString(36)
};
goog.string.compareVersions = function(version1, version2) {
  for(var order = 0, v1Subs = goog.string.trim(String(version1)).split("."), v2Subs = goog.string.trim(String(version2)).split("."), subCount = Math.max(v1Subs.length, v2Subs.length), subIdx = 0;0 == order && subIdx < subCount;subIdx++) {
    var v1Sub = v1Subs[subIdx] || "", v2Sub = v2Subs[subIdx] || "", v1CompParser = RegExp("(\\d*)(\\D*)", "g"), v2CompParser = RegExp("(\\d*)(\\D*)", "g");
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ["", "", ""], v2Comp = v2CompParser.exec(v2Sub) || ["", "", ""];
      if(0 == v1Comp[0].length && 0 == v2Comp[0].length) {
        break
      }
      order = goog.string.compareElements_(0 == v1Comp[1].length ? 0 : parseInt(v1Comp[1], 10), 0 == v2Comp[1].length ? 0 : parseInt(v2Comp[1], 10)) || goog.string.compareElements_(0 == v1Comp[2].length, 0 == v2Comp[2].length) || goog.string.compareElements_(v1Comp[2], v2Comp[2])
    }while(0 == order)
  }
  return order
};
goog.string.compareElements_ = function(left, right) {
  return left < right ? -1 : left > right ? 1 : 0
};
goog.string.HASHCODE_MAX_ = 4294967296;
goog.string.hashCode = function(str) {
  for(var result = 0, i = 0;i < str.length;++i) {
    result = 31 * result + str.charCodeAt(i), result %= goog.string.HASHCODE_MAX_
  }
  return result
};
goog.string.uniqueStringCounter_ = 2147483648 * Math.random() | 0;
goog.string.createUniqueString = function() {
  return"goog_" + goog.string.uniqueStringCounter_++
};
goog.string.toNumber = function(str) {
  var num = Number(str);
  return 0 == num && goog.string.isEmpty(str) ? NaN : num
};
goog.string.toCamelCase = function(str) {
  return String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase()
  })
};
goog.string.toSelectorCase = function(str) {
  return String(str).replace(/([A-Z])/g, "-$1").toLowerCase()
};
goog.string.toTitleCase = function(str, opt_delimiters) {
  var delimiters = goog.isString(opt_delimiters) ? goog.string.regExpEscape(opt_delimiters) : "\\s";
  return str.replace(RegExp("(^" + (delimiters ? "|[" + delimiters + "]+" : "") + ")([a-z])", "g"), function(all, p1, p2) {
    return p1 + p2.toUpperCase()
  })
};
goog.string.parseInt = function(value) {
  isFinite(value) && (value = String(value));
  return goog.isString(value) ? /^\s*-?0x/i.test(value) ? parseInt(value, 16) : parseInt(value, 10) : NaN
};
goog.asserts = {};
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  messageArgs.shift()
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);
goog.asserts.AssertionError.prototype.name = "AssertionError";
goog.asserts.doAssertFailure_ = function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = "Assertion failed";
  if(givenMessage) {
    var message = message + (": " + givenMessage), args = givenArgs
  }else {
    defaultMessage && (message += ": " + defaultMessage, args = defaultArgs)
  }
  throw new goog.asserts.AssertionError("" + message, args || []);
};
goog.asserts.assert = function(condition, opt_message, var_args) {
  goog.asserts.ENABLE_ASSERTS && !condition && goog.asserts.doAssertFailure_("", null, opt_message, Array.prototype.slice.call(arguments, 2));
  return condition
};
goog.asserts.fail = function(opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError("Failure" + (opt_message ? ": " + opt_message : ""), Array.prototype.slice.call(arguments, 1));
  }
};
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value) && goog.asserts.doAssertFailure_("Expected number but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2));
  return value
};
goog.asserts.assertString = function(value, opt_message, var_args) {
  goog.asserts.ENABLE_ASSERTS && !goog.isString(value) && goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2));
  return value
};
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value) && goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2));
  return value
};
goog.asserts.assertObject = function(value, opt_message, var_args) {
  goog.asserts.ENABLE_ASSERTS && !goog.isObject(value) && goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2));
  return value
};
goog.asserts.assertArray = function(value, opt_message, var_args) {
  goog.asserts.ENABLE_ASSERTS && !goog.isArray(value) && goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2));
  return value
};
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value) && goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2));
  return value
};
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  goog.asserts.ENABLE_ASSERTS && !(value instanceof type) && goog.asserts.doAssertFailure_("instanceof check failed.", null, opt_message, Array.prototype.slice.call(arguments, 3));
  return value
};
goog.debug.entryPointRegistry = {};
goog.debug.EntryPointMonitor = function() {
};
goog.debug.entryPointRegistry.refList_ = [];
goog.debug.entryPointRegistry.monitors_ = [];
goog.debug.entryPointRegistry.monitorsMayExist_ = !1;
goog.debug.entryPointRegistry.register = function(callback) {
  goog.debug.entryPointRegistry.refList_[goog.debug.entryPointRegistry.refList_.length] = callback;
  if(goog.debug.entryPointRegistry.monitorsMayExist_) {
    for(var monitors = goog.debug.entryPointRegistry.monitors_, i = 0;i < monitors.length;i++) {
      callback(goog.bind(monitors[i].wrap, monitors[i]))
    }
  }
};
goog.debug.entryPointRegistry.monitorAll = function(monitor) {
  goog.debug.entryPointRegistry.monitorsMayExist_ = !0;
  for(var transformer = goog.bind(monitor.wrap, monitor), i = 0;i < goog.debug.entryPointRegistry.refList_.length;i++) {
    goog.debug.entryPointRegistry.refList_[i](transformer)
  }
  goog.debug.entryPointRegistry.monitors_.push(monitor)
};
goog.debug.entryPointRegistry.unmonitorAllIfPossible = function(monitor) {
  var monitors = goog.debug.entryPointRegistry.monitors_;
  goog.asserts.assert(monitor == monitors[monitors.length - 1], "Only the most recent monitor can be unwrapped.");
  for(var transformer = goog.bind(monitor.unwrap, monitor), i = 0;i < goog.debug.entryPointRegistry.refList_.length;i++) {
    goog.debug.entryPointRegistry.refList_[i](transformer)
  }
  monitors.length--
};
goog.debug.errorHandlerWeakDep = {protectEntryPoint:function(fn) {
  return fn
}};
goog.array = {};
goog.NATIVE_ARRAY_PROTOTYPES = !0;
goog.array.peek = function(array) {
  return array[array.length - 1]
};
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.indexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(null != arr.length);
  return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = null == opt_fromIndex ? 0 : 0 > opt_fromIndex ? Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex;
  if(goog.isString(arr)) {
    return!goog.isString(obj) || 1 != obj.length ? -1 : arr.indexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i < arr.length;i++) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.lastIndexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(null != arr.length);
  return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, null == opt_fromIndex ? arr.length - 1 : opt_fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = null == opt_fromIndex ? arr.length - 1 : opt_fromIndex;
  0 > fromIndex && (fromIndex = Math.max(0, arr.length + fromIndex));
  if(goog.isString(arr)) {
    return!goog.isString(obj) || 1 != obj.length ? -1 : arr.lastIndexOf(obj, fromIndex)
  }
  for(var i = fromIndex;0 <= i;i--) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.forEach ? function(arr, f, opt_obj) {
  goog.asserts.assert(null != arr.length);
  goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  for(var l = arr.length, arr2 = goog.isString(arr) ? arr.split("") : arr, i = 0;i < l;i++) {
    i in arr2 && f.call(opt_obj, arr2[i], i, arr)
  }
};
goog.array.forEachRight = function(arr, f, opt_obj) {
  for(var l = arr.length, arr2 = goog.isString(arr) ? arr.split("") : arr, i = l - 1;0 <= i;--i) {
    i in arr2 && f.call(opt_obj, arr2[i], i, arr)
  }
};
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.filter ? function(arr, f, opt_obj) {
  goog.asserts.assert(null != arr.length);
  return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  for(var l = arr.length, res = [], resLength = 0, arr2 = goog.isString(arr) ? arr.split("") : arr, i = 0;i < l;i++) {
    if(i in arr2) {
      var val = arr2[i];
      f.call(opt_obj, val, i, arr) && (res[resLength++] = val)
    }
  }
  return res
};
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.map ? function(arr, f, opt_obj) {
  goog.asserts.assert(null != arr.length);
  return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  for(var l = arr.length, res = Array(l), arr2 = goog.isString(arr) ? arr.split("") : arr, i = 0;i < l;i++) {
    i in arr2 && (res[i] = f.call(opt_obj, arr2[i], i, arr))
  }
  return res
};
goog.array.reduce = function(arr, f, val$$0, opt_obj) {
  if(arr.reduce) {
    return opt_obj ? arr.reduce(goog.bind(f, opt_obj), val$$0) : arr.reduce(f, val$$0)
  }
  var rval = val$$0;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.reduceRight = function(arr, f, val$$0, opt_obj) {
  if(arr.reduceRight) {
    return opt_obj ? arr.reduceRight(goog.bind(f, opt_obj), val$$0) : arr.reduceRight(f, val$$0)
  }
  var rval = val$$0;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.some ? function(arr, f, opt_obj) {
  goog.asserts.assert(null != arr.length);
  return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  for(var l = arr.length, arr2 = goog.isString(arr) ? arr.split("") : arr, i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return!0
    }
  }
  return!1
};
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.every ? function(arr, f, opt_obj) {
  goog.asserts.assert(null != arr.length);
  return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  for(var l = arr.length, arr2 = goog.isString(arr) ? arr.split("") : arr, i = 0;i < l;i++) {
    if(i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
      return!1
    }
  }
  return!0
};
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return 0 > i ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndex = function(arr, f, opt_obj) {
  for(var l = arr.length, arr2 = goog.isString(arr) ? arr.split("") : arr, i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return 0 > i ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndexRight = function(arr, f, opt_obj) {
  for(var l = arr.length, arr2 = goog.isString(arr) ? arr.split("") : arr, i = l - 1;0 <= i;i--) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.contains = function(arr, obj) {
  return 0 <= goog.array.indexOf(arr, obj)
};
goog.array.isEmpty = function(arr) {
  return 0 == arr.length
};
goog.array.clear = function(arr) {
  if(!goog.isArray(arr)) {
    for(var i = arr.length - 1;0 <= i;i--) {
      delete arr[i]
    }
  }
  arr.length = 0
};
goog.array.insert = function(arr, obj) {
  goog.array.contains(arr, obj) || arr.push(obj)
};
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj)
};
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd)
};
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  2 == arguments.length || 0 > (i = goog.array.indexOf(arr, opt_obj2)) ? arr.push(obj) : goog.array.insertAt(arr, obj, i)
};
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj), rv;
  (rv = 0 <= i) && goog.array.removeAt(arr, i);
  return rv
};
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(null != arr.length);
  return 1 == goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length
};
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return 0 <= i ? (goog.array.removeAt(arr, i), !0) : !1
};
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(goog.array.ARRAY_PROTOTYPE_, arguments)
};
goog.array.toArray = function(object) {
  var length = object.length;
  if(0 < length) {
    for(var rv = Array(length), i = 0;i < length;i++) {
      rv[i] = object[i]
    }
    return rv
  }
  return[]
};
goog.array.clone = goog.array.toArray;
goog.array.extend = function(arr1, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var arr2 = arguments[i], isArrayLike;
    if(goog.isArray(arr2) || (isArrayLike = goog.isArrayLike(arr2)) && arr2.hasOwnProperty("callee")) {
      arr1.push.apply(arr1, arr2)
    }else {
      if(isArrayLike) {
        for(var len1 = arr1.length, len2 = arr2.length, j = 0;j < len2;j++) {
          arr1[len1 + j] = arr2[j]
        }
      }else {
        arr1.push(arr2)
      }
    }
  }
};
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(null != arr.length);
  return goog.array.ARRAY_PROTOTYPE_.splice.apply(arr, goog.array.slice(arguments, 1))
};
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(null != arr.length);
  return 2 >= arguments.length ? goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start) : goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end)
};
goog.array.removeDuplicates = function(arr, opt_rv) {
  for(var returnArray = opt_rv || arr, seen = {}, cursorInsert = 0, cursorRead = 0;cursorRead < arr.length;) {
    var current = arr[cursorRead++], key = goog.isObject(current) ? "o" + goog.getUid(current) : (typeof current).charAt(0) + current;
    Object.prototype.hasOwnProperty.call(seen, key) || (seen[key] = !0, returnArray[cursorInsert++] = current)
  }
  returnArray.length = cursorInsert
};
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr, opt_compareFn || goog.array.defaultCompare, !1, target)
};
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, !0, void 0, opt_obj)
};
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target, opt_selfObj) {
  for(var left = 0, right = arr.length, found;left < right;) {
    var middle = left + right >> 1, compareResult;
    compareResult = isEvaluator ? compareFn.call(opt_selfObj, arr[middle], middle, arr) : compareFn(opt_target, arr[middle]);
    0 < compareResult ? left = middle + 1 : (right = middle, found = !compareResult)
  }
  return found ? left : ~left
};
goog.array.sort = function(arr, opt_compareFn) {
  goog.asserts.assert(null != arr.length);
  goog.array.ARRAY_PROTOTYPE_.sort.call(arr, opt_compareFn || goog.array.defaultCompare)
};
goog.array.stableSort = function(arr, opt_compareFn) {
  for(var i = 0;i < arr.length;i++) {
    arr[i] = {index:i, value:arr[i]}
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index
  });
  for(i = 0;i < arr.length;i++) {
    arr[i] = arr[i].value
  }
};
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return compare(a[key], b[key])
  })
};
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  for(var compare = opt_compareFn || goog.array.defaultCompare, i = 1;i < arr.length;i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if(0 < compareResult || 0 == compareResult && opt_strict) {
      return!1
    }
  }
  return!0
};
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if(!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) || arr1.length != arr2.length) {
    return!1
  }
  for(var l = arr1.length, equalsFn = opt_equalsFn || goog.array.defaultCompareEquality, i = 0;i < l;i++) {
    if(!equalsFn(arr1[i], arr2[i])) {
      return!1
    }
  }
  return!0
};
goog.array.compare = function(arr1, arr2, opt_equalsFn) {
  return goog.array.equals(arr1, arr2, opt_equalsFn)
};
goog.array.compare3 = function(arr1, arr2, opt_compareFn) {
  for(var compare = opt_compareFn || goog.array.defaultCompare, l = Math.min(arr1.length, arr2.length), i = 0;i < l;i++) {
    var result = compare(arr1[i], arr2[i]);
    if(0 != result) {
      return result
    }
  }
  return goog.array.defaultCompare(arr1.length, arr2.length)
};
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0
};
goog.array.defaultCompareEquality = function(a, b) {
  return a === b
};
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return 0 > index ? (goog.array.insertAt(array, value, -(index + 1)), !0) : !1
};
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return 0 <= index ? goog.array.removeAt(array, index) : !1
};
goog.array.bucket = function(array, sorter) {
  for(var buckets = {}, i = 0;i < array.length;i++) {
    var value = array[i], key = sorter(value, i, array);
    goog.isDef(key) && (buckets[key] || (buckets[key] = [])).push(value)
  }
  return buckets
};
goog.array.toObject = function(arr, keyFunc, opt_obj) {
  var ret = {};
  goog.array.forEach(arr, function(element, index) {
    ret[keyFunc.call(opt_obj, element, index, arr)] = element
  });
  return ret
};
goog.array.repeat = function(value, n) {
  for(var array = [], i = 0;i < n;i++) {
    array[i] = value
  }
  return array
};
goog.array.flatten = function(var_args) {
  for(var result = [], i = 0;i < arguments.length;i++) {
    var element = arguments[i];
    goog.isArray(element) ? result.push.apply(result, goog.array.flatten.apply(null, element)) : result.push(element)
  }
  return result
};
goog.array.rotate = function(array, n) {
  goog.asserts.assert(null != array.length);
  array.length && (n %= array.length, 0 < n ? goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n)) : 0 > n && goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n)));
  return array
};
goog.array.zip = function(var_args) {
  if(!arguments.length) {
    return[]
  }
  for(var result = [], i = 0;;i++) {
    for(var value = [], j = 0;j < arguments.length;j++) {
      var arr = arguments[j];
      if(i >= arr.length) {
        return result
      }
      value.push(arr[i])
    }
    result.push(value)
  }
};
goog.array.shuffle = function(arr, opt_randFn) {
  for(var randFn = opt_randFn || Math.random, i = arr.length - 1;0 < i;i--) {
    var j = Math.floor(randFn() * (i + 1)), tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp
  }
};
goog.structs = {};
goog.structs.Collection = function() {
};
goog.iter = {};
goog.iter.StopIteration = "StopIteration" in goog.global ? goog.global.StopIteration : Error("StopIteration");
goog.iter.Iterator = function() {
};
goog.iter.Iterator.prototype.next = function() {
  throw goog.iter.StopIteration;
};
goog.iter.Iterator.prototype.__iterator__ = function() {
  return this
};
goog.iter.toIterator = function(iterable) {
  if(iterable instanceof goog.iter.Iterator) {
    return iterable
  }
  if("function" == typeof iterable.__iterator__) {
    return iterable.__iterator__(!1)
  }
  if(goog.isArrayLike(iterable)) {
    var i = 0, newIter = new goog.iter.Iterator;
    newIter.next = function() {
      for(;;) {
        if(i >= iterable.length) {
          throw goog.iter.StopIteration;
        }
        if(i in iterable) {
          return iterable[i++]
        }
        i++
      }
    };
    return newIter
  }
  throw Error("Not implemented");
};
goog.iter.forEach = function(iterable, f, opt_obj) {
  if(goog.isArrayLike(iterable)) {
    try {
      goog.array.forEach(iterable, f, opt_obj)
    }catch(ex) {
      if(ex !== goog.iter.StopIteration) {
        throw ex;
      }
    }
  }else {
    iterable = goog.iter.toIterator(iterable);
    try {
      for(;;) {
        f.call(opt_obj, iterable.next(), void 0, iterable)
      }
    }catch(ex$$0) {
      if(ex$$0 !== goog.iter.StopIteration) {
        throw ex$$0;
      }
    }
  }
};
goog.iter.filter = function(iterable, f, opt_obj) {
  var iterator = goog.iter.toIterator(iterable), newIter = new goog.iter.Iterator;
  newIter.next = function() {
    for(;;) {
      var val = iterator.next();
      if(f.call(opt_obj, val, void 0, iterator)) {
        return val
      }
    }
  };
  return newIter
};
goog.iter.range = function(startOrStop, opt_stop, opt_step) {
  var start = 0, stop = startOrStop, step = opt_step || 1;
  1 < arguments.length && (start = startOrStop, stop = opt_stop);
  if(0 == step) {
    throw Error("Range step argument must not be zero");
  }
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    if(0 < step && start >= stop || 0 > step && start <= stop) {
      throw goog.iter.StopIteration;
    }
    var rv = start;
    start += step;
    return rv
  };
  return newIter
};
goog.iter.join = function(iterable, deliminator) {
  return goog.iter.toArray(iterable).join(deliminator)
};
goog.iter.map = function(iterable, f, opt_obj) {
  var iterator = goog.iter.toIterator(iterable), newIter = new goog.iter.Iterator;
  newIter.next = function() {
    for(;;) {
      var val = iterator.next();
      return f.call(opt_obj, val, void 0, iterator)
    }
  };
  return newIter
};
goog.iter.reduce = function(iterable, f, val$$0, opt_obj) {
  var rval = val$$0;
  goog.iter.forEach(iterable, function(val) {
    rval = f.call(opt_obj, rval, val)
  });
  return rval
};
goog.iter.some = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  try {
    for(;;) {
      if(f.call(opt_obj, iterable.next(), void 0, iterable)) {
        return!0
      }
    }
  }catch(ex) {
    if(ex !== goog.iter.StopIteration) {
      throw ex;
    }
  }
  return!1
};
goog.iter.every = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  try {
    for(;;) {
      if(!f.call(opt_obj, iterable.next(), void 0, iterable)) {
        return!1
      }
    }
  }catch(ex) {
    if(ex !== goog.iter.StopIteration) {
      throw ex;
    }
  }
  return!0
};
goog.iter.chain = function(var_args) {
  var args = arguments, length = args.length, i = 0, newIter = new goog.iter.Iterator;
  newIter.next = function() {
    try {
      if(i >= length) {
        throw goog.iter.StopIteration;
      }
      return goog.iter.toIterator(args[i]).next()
    }catch(ex) {
      if(ex !== goog.iter.StopIteration || i >= length) {
        throw ex;
      }
      i++;
      return this.next()
    }
  };
  return newIter
};
goog.iter.dropWhile = function(iterable, f, opt_obj) {
  var iterator = goog.iter.toIterator(iterable), newIter = new goog.iter.Iterator, dropping = !0;
  newIter.next = function() {
    for(;;) {
      var val = iterator.next();
      if(!dropping || !f.call(opt_obj, val, void 0, iterator)) {
        return dropping = !1, val
      }
    }
  };
  return newIter
};
goog.iter.takeWhile = function(iterable, f, opt_obj) {
  var iterator = goog.iter.toIterator(iterable), newIter = new goog.iter.Iterator, taking = !0;
  newIter.next = function() {
    for(;;) {
      if(taking) {
        var val = iterator.next();
        if(f.call(opt_obj, val, void 0, iterator)) {
          return val
        }
        taking = !1
      }else {
        throw goog.iter.StopIteration;
      }
    }
  };
  return newIter
};
goog.iter.toArray = function(iterable) {
  if(goog.isArrayLike(iterable)) {
    return goog.array.toArray(iterable)
  }
  iterable = goog.iter.toIterator(iterable);
  var array = [];
  goog.iter.forEach(iterable, function(val) {
    array.push(val)
  });
  return array
};
goog.iter.equals = function(iterable1, iterable2) {
  iterable1 = goog.iter.toIterator(iterable1);
  iterable2 = goog.iter.toIterator(iterable2);
  var b1, b2;
  try {
    for(;;) {
      b1 = b2 = !1;
      var val1 = iterable1.next();
      b1 = !0;
      var val2 = iterable2.next();
      b2 = !0;
      if(val1 != val2) {
        break
      }
    }
  }catch(ex) {
    if(ex !== goog.iter.StopIteration) {
      throw ex;
    }
    if(b1 && !b2) {
      return!1
    }
    if(!b2) {
      try {
        iterable2.next()
      }catch(ex1) {
        if(ex1 !== goog.iter.StopIteration) {
          throw ex1;
        }
        return!0
      }
    }
  }
  return!1
};
goog.iter.nextOrValue = function(iterable, defaultValue) {
  try {
    return goog.iter.toIterator(iterable).next()
  }catch(e) {
    if(e != goog.iter.StopIteration) {
      throw e;
    }
    return defaultValue
  }
};
goog.iter.product = function(var_args) {
  if(goog.array.some(arguments, function(arr) {
    return!arr.length
  }) || !arguments.length) {
    return new goog.iter.Iterator
  }
  var iter = new goog.iter.Iterator, arrays = arguments, indicies = goog.array.repeat(0, arrays.length);
  iter.next = function() {
    if(indicies) {
      for(var retVal = goog.array.map(indicies, function(valueIndex, arrayIndex) {
        return arrays[arrayIndex][valueIndex]
      }), i = indicies.length - 1;0 <= i;i--) {
        goog.asserts.assert(indicies);
        if(indicies[i] < arrays[i].length - 1) {
          indicies[i]++;
          break
        }
        if(0 == i) {
          indicies = null;
          break
        }
        indicies[i] = 0
      }
      return retVal
    }
    throw goog.iter.StopIteration;
  };
  return iter
};
goog.iter.cycle = function(iterable) {
  var baseIterator = goog.iter.toIterator(iterable), cache = [], cacheIndex = 0, iter = new goog.iter.Iterator, useCache = !1;
  iter.next = function() {
    var returnElement = null;
    if(!useCache) {
      try {
        return returnElement = baseIterator.next(), cache.push(returnElement), returnElement
      }catch(e) {
        if(e != goog.iter.StopIteration || goog.array.isEmpty(cache)) {
          throw e;
        }
        useCache = !0
      }
    }
    returnElement = cache[cacheIndex];
    cacheIndex = (cacheIndex + 1) % cache.length;
    return returnElement
  };
  return iter
};
goog.structs.getCount = function(col) {
  return"function" == typeof col.getCount ? col.getCount() : goog.isArrayLike(col) || goog.isString(col) ? col.length : goog.object.getCount(col)
};
goog.structs.getValues = function(col) {
  if("function" == typeof col.getValues) {
    return col.getValues()
  }
  if(goog.isString(col)) {
    return col.split("")
  }
  if(goog.isArrayLike(col)) {
    for(var rv = [], l = col.length, i = 0;i < l;i++) {
      rv.push(col[i])
    }
    return rv
  }
  return goog.object.getValues(col)
};
goog.structs.getKeys = function(col) {
  if("function" == typeof col.getKeys) {
    return col.getKeys()
  }
  if("function" != typeof col.getValues) {
    if(goog.isArrayLike(col) || goog.isString(col)) {
      for(var rv = [], l = col.length, i = 0;i < l;i++) {
        rv.push(i)
      }
      return rv
    }
    return goog.object.getKeys(col)
  }
};
goog.structs.contains = function(col, val) {
  return"function" == typeof col.contains ? col.contains(val) : "function" == typeof col.containsValue ? col.containsValue(val) : goog.isArrayLike(col) || goog.isString(col) ? goog.array.contains(col, val) : goog.object.containsValue(col, val)
};
goog.structs.isEmpty = function(col) {
  return"function" == typeof col.isEmpty ? col.isEmpty() : goog.isArrayLike(col) || goog.isString(col) ? goog.array.isEmpty(col) : goog.object.isEmpty(col)
};
goog.structs.clear = function(col) {
  "function" == typeof col.clear ? col.clear() : goog.isArrayLike(col) ? goog.array.clear(col) : goog.object.clear(col)
};
goog.structs.forEach = function(col, f, opt_obj) {
  if("function" == typeof col.forEach) {
    col.forEach(f, opt_obj)
  }else {
    if(goog.isArrayLike(col) || goog.isString(col)) {
      goog.array.forEach(col, f, opt_obj)
    }else {
      for(var keys = goog.structs.getKeys(col), values = goog.structs.getValues(col), l = values.length, i = 0;i < l;i++) {
        f.call(opt_obj, values[i], keys && keys[i], col)
      }
    }
  }
};
goog.structs.filter = function(col, f, opt_obj) {
  if("function" == typeof col.filter) {
    return col.filter(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.filter(col, f, opt_obj)
  }
  var rv, keys = goog.structs.getKeys(col), values = goog.structs.getValues(col), l = values.length;
  if(keys) {
    rv = {};
    for(var i = 0;i < l;i++) {
      f.call(opt_obj, values[i], keys[i], col) && (rv[keys[i]] = values[i])
    }
  }else {
    rv = [];
    for(i = 0;i < l;i++) {
      f.call(opt_obj, values[i], void 0, col) && rv.push(values[i])
    }
  }
  return rv
};
goog.structs.map = function(col, f, opt_obj) {
  if("function" == typeof col.map) {
    return col.map(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.map(col, f, opt_obj)
  }
  var rv, keys = goog.structs.getKeys(col), values = goog.structs.getValues(col), l = values.length;
  if(keys) {
    rv = {};
    for(var i = 0;i < l;i++) {
      rv[keys[i]] = f.call(opt_obj, values[i], keys[i], col)
    }
  }else {
    rv = [];
    for(i = 0;i < l;i++) {
      rv[i] = f.call(opt_obj, values[i], void 0, col)
    }
  }
  return rv
};
goog.structs.some = function(col, f, opt_obj) {
  if("function" == typeof col.some) {
    return col.some(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.some(col, f, opt_obj)
  }
  for(var keys = goog.structs.getKeys(col), values = goog.structs.getValues(col), l = values.length, i = 0;i < l;i++) {
    if(f.call(opt_obj, values[i], keys && keys[i], col)) {
      return!0
    }
  }
  return!1
};
goog.structs.every = function(col, f, opt_obj) {
  if("function" == typeof col.every) {
    return col.every(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.every(col, f, opt_obj)
  }
  for(var keys = goog.structs.getKeys(col), values = goog.structs.getValues(col), l = values.length, i = 0;i < l;i++) {
    if(!f.call(opt_obj, values[i], keys && keys[i], col)) {
      return!1
    }
  }
  return!0
};
goog.structs.Map = function(opt_map, var_args) {
  this.map_ = {};
  this.keys_ = [];
  var argLength = arguments.length;
  if(1 < argLength) {
    if(argLength % 2) {
      throw Error("Uneven number of arguments");
    }
    for(var i = 0;i < argLength;i += 2) {
      this.set(arguments[i], arguments[i + 1])
    }
  }else {
    opt_map && this.addAll(opt_map)
  }
};
goog.structs.Map.prototype.count_ = 0;
goog.structs.Map.prototype.version_ = 0;
goog.structs.Map.prototype.getCount = function() {
  return this.count_
};
goog.structs.Map.prototype.getValues = function() {
  this.cleanupKeysArray_();
  for(var rv = [], i = 0;i < this.keys_.length;i++) {
    rv.push(this.map_[this.keys_[i]])
  }
  return rv
};
goog.structs.Map.prototype.getKeys = function() {
  this.cleanupKeysArray_();
  return this.keys_.concat()
};
goog.structs.Map.prototype.containsKey = function(key) {
  return goog.structs.Map.hasKey_(this.map_, key)
};
goog.structs.Map.prototype.containsValue = function(val) {
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    if(goog.structs.Map.hasKey_(this.map_, key) && this.map_[key] == val) {
      return!0
    }
  }
  return!1
};
goog.structs.Map.prototype.equals = function(otherMap, opt_equalityFn) {
  if(this === otherMap) {
    return!0
  }
  if(this.count_ != otherMap.getCount()) {
    return!1
  }
  var equalityFn = opt_equalityFn || goog.structs.Map.defaultEquals;
  this.cleanupKeysArray_();
  for(var key, i = 0;key = this.keys_[i];i++) {
    if(!equalityFn(this.get(key), otherMap.get(key))) {
      return!1
    }
  }
  return!0
};
goog.structs.Map.defaultEquals = function(a, b) {
  return a === b
};
goog.structs.Map.prototype.isEmpty = function() {
  return 0 == this.count_
};
goog.structs.Map.prototype.clear = function() {
  this.map_ = {};
  this.version_ = this.count_ = this.keys_.length = 0
};
goog.structs.Map.prototype.remove = function(key) {
  return goog.structs.Map.hasKey_(this.map_, key) ? (delete this.map_[key], this.count_--, this.version_++, this.keys_.length > 2 * this.count_ && this.cleanupKeysArray_(), !0) : !1
};
goog.structs.Map.prototype.cleanupKeysArray_ = function() {
  if(this.count_ != this.keys_.length) {
    for(var srcIndex = 0, destIndex = 0;srcIndex < this.keys_.length;) {
      var key = this.keys_[srcIndex];
      goog.structs.Map.hasKey_(this.map_, key) && (this.keys_[destIndex++] = key);
      srcIndex++
    }
    this.keys_.length = destIndex
  }
  if(this.count_ != this.keys_.length) {
    for(var seen = {}, destIndex = srcIndex = 0;srcIndex < this.keys_.length;) {
      key = this.keys_[srcIndex], goog.structs.Map.hasKey_(seen, key) || (this.keys_[destIndex++] = key, seen[key] = 1), srcIndex++
    }
    this.keys_.length = destIndex
  }
};
goog.structs.Map.prototype.get = function(key, opt_val) {
  return goog.structs.Map.hasKey_(this.map_, key) ? this.map_[key] : opt_val
};
goog.structs.Map.prototype.set = function(key, value) {
  goog.structs.Map.hasKey_(this.map_, key) || (this.count_++, this.keys_.push(key), this.version_++);
  this.map_[key] = value
};
goog.structs.Map.prototype.addAll = function(map) {
  var keys, values;
  map instanceof goog.structs.Map ? (keys = map.getKeys(), values = map.getValues()) : (keys = goog.object.getKeys(map), values = goog.object.getValues(map));
  for(var i = 0;i < keys.length;i++) {
    this.set(keys[i], values[i])
  }
};
goog.structs.Map.prototype.clone = function() {
  return new goog.structs.Map(this)
};
goog.structs.Map.prototype.transpose = function() {
  for(var transposed = new goog.structs.Map, i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    transposed.set(this.map_[key], key)
  }
  return transposed
};
goog.structs.Map.prototype.toObject = function() {
  this.cleanupKeysArray_();
  for(var obj = {}, i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    obj[key] = this.map_[key]
  }
  return obj
};
goog.structs.Map.prototype.__iterator__ = function(opt_keys) {
  this.cleanupKeysArray_();
  var i = 0, keys = this.keys_, map = this.map_, version = this.version_, selfObj = this, newIter = new goog.iter.Iterator;
  newIter.next = function() {
    for(;;) {
      if(version != selfObj.version_) {
        throw Error("The map has changed since the iterator was created");
      }
      if(i >= keys.length) {
        throw goog.iter.StopIteration;
      }
      var key = keys[i++];
      return opt_keys ? key : map[key]
    }
  };
  return newIter
};
goog.structs.Map.hasKey_ = function(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key)
};
goog.structs.Set = function(opt_values) {
  this.map_ = new goog.structs.Map;
  opt_values && this.addAll(opt_values)
};
goog.structs.Set.getKey_ = function(val) {
  var type = typeof val;
  return"object" == type && val || "function" == type ? "o" + goog.getUid(val) : type.substr(0, 1) + val
};
goog.structs.Set.prototype.getCount = function() {
  return this.map_.getCount()
};
goog.structs.Set.prototype.add = function(element) {
  this.map_.set(goog.structs.Set.getKey_(element), element)
};
goog.structs.Set.prototype.addAll = function(col) {
  for(var values = goog.structs.getValues(col), l = values.length, i = 0;i < l;i++) {
    this.add(values[i])
  }
};
goog.structs.Set.prototype.removeAll = function(col) {
  for(var values = goog.structs.getValues(col), l = values.length, i = 0;i < l;i++) {
    this.remove(values[i])
  }
};
goog.structs.Set.prototype.remove = function(element) {
  return this.map_.remove(goog.structs.Set.getKey_(element))
};
goog.structs.Set.prototype.clear = function() {
  this.map_.clear()
};
goog.structs.Set.prototype.isEmpty = function() {
  return this.map_.isEmpty()
};
goog.structs.Set.prototype.contains = function(element) {
  return this.map_.containsKey(goog.structs.Set.getKey_(element))
};
goog.structs.Set.prototype.getValues = function() {
  return this.map_.getValues()
};
goog.structs.Set.prototype.clone = function() {
  return new goog.structs.Set(this)
};
goog.structs.Set.prototype.equals = function(col) {
  return this.getCount() == goog.structs.getCount(col) && this.isSubsetOf(col)
};
goog.structs.Set.prototype.isSubsetOf = function(col) {
  var colCount = goog.structs.getCount(col);
  if(this.getCount() > colCount) {
    return!1
  }
  !(col instanceof goog.structs.Set) && 5 < colCount && (col = new goog.structs.Set(col));
  return goog.structs.every(this, function(value) {
    return goog.structs.contains(col, value)
  })
};
goog.structs.Set.prototype.__iterator__ = function() {
  return this.map_.__iterator__(!1)
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
  return goog.global.navigator ? goog.global.navigator.userAgent : null
};
goog.userAgent.getNavigator = function() {
  return goog.global.navigator
};
goog.userAgent.init_ = function() {
  goog.userAgent.detectedOpera_ = !1;
  goog.userAgent.detectedIe_ = !1;
  goog.userAgent.detectedWebkit_ = !1;
  goog.userAgent.detectedMobile_ = !1;
  goog.userAgent.detectedGecko_ = !1;
  var ua;
  if(!goog.userAgent.BROWSER_KNOWN_ && (ua = goog.userAgent.getUserAgentString())) {
    var navigator = goog.userAgent.getNavigator();
    goog.userAgent.detectedOpera_ = 0 == ua.indexOf("Opera");
    goog.userAgent.detectedIe_ = !goog.userAgent.detectedOpera_ && -1 != ua.indexOf("MSIE");
    goog.userAgent.detectedWebkit_ = !goog.userAgent.detectedOpera_ && -1 != ua.indexOf("WebKit");
    goog.userAgent.detectedMobile_ = goog.userAgent.detectedWebkit_ && -1 != ua.indexOf("Mobile");
    goog.userAgent.detectedGecko_ = !goog.userAgent.detectedOpera_ && !goog.userAgent.detectedWebkit_ && "Gecko" == navigator.product
  }
};
goog.userAgent.BROWSER_KNOWN_ || goog.userAgent.init_();
goog.userAgent.OPERA = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_OPERA : goog.userAgent.detectedOpera_;
goog.userAgent.IE = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_IE : goog.userAgent.detectedIe_;
goog.userAgent.GECKO = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_GECKO : goog.userAgent.detectedGecko_;
goog.userAgent.WEBKIT = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_MOBILE_WEBKIT : goog.userAgent.detectedWebkit_;
goog.userAgent.MOBILE = goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.detectedMobile_;
goog.userAgent.SAFARI = goog.userAgent.WEBKIT;
goog.userAgent.determinePlatform_ = function() {
  var navigator = goog.userAgent.getNavigator();
  return navigator && navigator.platform || ""
};
goog.userAgent.PLATFORM = goog.userAgent.determinePlatform_();
goog.userAgent.ASSUME_MAC = !1;
goog.userAgent.ASSUME_WINDOWS = !1;
goog.userAgent.ASSUME_LINUX = !1;
goog.userAgent.ASSUME_X11 = !1;
goog.userAgent.PLATFORM_KNOWN_ = goog.userAgent.ASSUME_MAC || goog.userAgent.ASSUME_WINDOWS || goog.userAgent.ASSUME_LINUX || goog.userAgent.ASSUME_X11;
goog.userAgent.initPlatform_ = function() {
  goog.userAgent.detectedMac_ = goog.string.contains(goog.userAgent.PLATFORM, "Mac");
  goog.userAgent.detectedWindows_ = goog.string.contains(goog.userAgent.PLATFORM, "Win");
  goog.userAgent.detectedLinux_ = goog.string.contains(goog.userAgent.PLATFORM, "Linux");
  goog.userAgent.detectedX11_ = !!goog.userAgent.getNavigator() && goog.string.contains(goog.userAgent.getNavigator().appVersion || "", "X11")
};
goog.userAgent.PLATFORM_KNOWN_ || goog.userAgent.initPlatform_();
goog.userAgent.MAC = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_MAC : goog.userAgent.detectedMac_;
goog.userAgent.WINDOWS = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_WINDOWS : goog.userAgent.detectedWindows_;
goog.userAgent.LINUX = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_LINUX : goog.userAgent.detectedLinux_;
goog.userAgent.X11 = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_X11 : goog.userAgent.detectedX11_;
goog.userAgent.determineVersion_ = function() {
  var version = "", re;
  if(goog.userAgent.OPERA && goog.global.opera) {
    var operaVersion = goog.global.opera.version, version = "function" == typeof operaVersion ? operaVersion() : operaVersion
  }else {
    if(goog.userAgent.GECKO ? re = /rv\:([^\);]+)(\)|;)/ : goog.userAgent.IE ? re = /MSIE\s+([^\);]+)(\)|;)/ : goog.userAgent.WEBKIT && (re = /WebKit\/(\S+)/), re) {
      var arr = re.exec(goog.userAgent.getUserAgentString()), version = arr ? arr[1] : ""
    }
  }
  if(goog.userAgent.IE) {
    var docMode = goog.userAgent.getDocumentMode_();
    if(docMode > parseFloat(version)) {
      return String(docMode)
    }
  }
  return version
};
goog.userAgent.getDocumentMode_ = function() {
  var doc = goog.global.document;
  return doc ? doc.documentMode : void 0
};
goog.userAgent.VERSION = goog.userAgent.determineVersion_();
goog.userAgent.compare = function(v1, v2) {
  return goog.string.compareVersions(v1, v2)
};
goog.userAgent.isVersionCache_ = {};
goog.userAgent.isVersion = function(version) {
  return goog.userAgent.ASSUME_ANY_VERSION || goog.userAgent.isVersionCache_[version] || (goog.userAgent.isVersionCache_[version] = 0 <= goog.string.compareVersions(goog.userAgent.VERSION, version))
};
goog.userAgent.isDocumentMode = function(documentMode) {
  return goog.userAgent.IE && goog.userAgent.DOCUMENT_MODE >= documentMode
};
var doc$$inline_1 = goog.global.document;
goog.userAgent.DOCUMENT_MODE = !doc$$inline_1 || !goog.userAgent.IE ? void 0 : goog.userAgent.getDocumentMode_() || ("CSS1Compat" == doc$$inline_1.compatMode ? parseInt(goog.userAgent.VERSION, 10) : 5);
goog.debug.catchErrors = function(logFunc, opt_cancel, opt_target) {
  var target = opt_target || goog.global, oldErrorHandler = target.onerror, retVal = !!opt_cancel;
  goog.userAgent.WEBKIT && !goog.userAgent.isVersion("535.3") && (retVal = !retVal);
  target.onerror = function(message, url, line) {
    oldErrorHandler && oldErrorHandler(message, url, line);
    logFunc({message:message, fileName:url, line:line});
    return retVal
  }
};
goog.debug.expose = function(obj, opt_showFn) {
  if("undefined" == typeof obj) {
    return"undefined"
  }
  if(null == obj) {
    return"NULL"
  }
  var str = [], x;
  for(x in obj) {
    if(opt_showFn || !goog.isFunction(obj[x])) {
      var s = x + " = ";
      try {
        s += obj[x]
      }catch(e) {
        s += "*** " + e + " ***"
      }
      str.push(s)
    }
  }
  return str.join("\n")
};
goog.debug.deepExpose = function(obj$$0, opt_showFn) {
  var previous = new goog.structs.Set, str = [], helper = function(obj, space) {
    var nestspace = space + "  ";
    try {
      if(goog.isDef(obj)) {
        if(goog.isNull(obj)) {
          str.push("NULL")
        }else {
          if(goog.isString(obj)) {
            str.push('"' + obj.replace(/\n/g, "\n" + space) + '"')
          }else {
            if(goog.isFunction(obj)) {
              str.push(String(obj).replace(/\n/g, "\n" + space))
            }else {
              if(goog.isObject(obj)) {
                if(previous.contains(obj)) {
                  str.push("*** reference loop detected ***")
                }else {
                  previous.add(obj);
                  str.push("{");
                  for(var x in obj) {
                    if(opt_showFn || !goog.isFunction(obj[x])) {
                      str.push("\n"), str.push(nestspace), str.push(x + " = "), helper(obj[x], nestspace)
                    }
                  }
                  str.push("\n" + space + "}")
                }
              }else {
                str.push(obj)
              }
            }
          }
        }
      }else {
        str.push("undefined")
      }
    }catch(e) {
      str.push("*** " + e + " ***")
    }
  };
  helper(obj$$0, "");
  return str.join("")
};
goog.debug.exposeArray = function(arr) {
  for(var str = [], i = 0;i < arr.length;i++) {
    goog.isArray(arr[i]) ? str.push(goog.debug.exposeArray(arr[i])) : str.push(arr[i])
  }
  return"[ " + str.join(", ") + " ]"
};
goog.debug.exposeException = function(err, opt_fn) {
  try {
    var e = goog.debug.normalizeErrorObject(err);
    return"Message: " + goog.string.htmlEscape(e.message) + '\nUrl: <a href="view-source:' + e.fileName + '" target="_new">' + e.fileName + "</a>\nLine: " + e.lineNumber + "\n\nBrowser stack:\n" + goog.string.htmlEscape(e.stack + "-> ") + "[end]\n\nJS stack traversal:\n" + goog.string.htmlEscape(goog.debug.getStacktrace(opt_fn) + "-> ")
  }catch(e2) {
    return"Exception trying to expose exception! You win, we lose. " + e2
  }
};
goog.debug.normalizeErrorObject = function(err) {
  var href = goog.getObjectByName("window.location.href");
  if(goog.isString(err)) {
    return{message:err, name:"Unknown error", lineNumber:"Not available", fileName:href, stack:"Not available"}
  }
  var lineNumber, fileName, threwError = !1;
  try {
    lineNumber = err.lineNumber || err.line || "Not available"
  }catch(e) {
    lineNumber = "Not available", threwError = !0
  }
  try {
    fileName = err.fileName || err.filename || err.sourceURL || href
  }catch(e$$0) {
    fileName = "Not available", threwError = !0
  }
  return threwError || !err.lineNumber || !err.fileName || !err.stack ? {message:err.message, name:err.name, lineNumber:lineNumber, fileName:fileName, stack:err.stack || "Not available"} : err
};
goog.debug.enhanceError = function(err, opt_message) {
  var error = "string" == typeof err ? Error(err) : err;
  error.stack || (error.stack = goog.debug.getStacktrace(arguments.callee.caller));
  if(opt_message) {
    for(var x = 0;error["message" + x];) {
      ++x
    }
    error["message" + x] = String(opt_message)
  }
  return error
};
goog.debug.getStacktraceSimple = function(opt_depth) {
  for(var sb = [], fn = arguments.callee.caller, depth = 0;fn && (!opt_depth || depth < opt_depth);) {
    sb.push(goog.debug.getFunctionName(fn));
    sb.push("()\n");
    try {
      fn = fn.caller
    }catch(e) {
      sb.push("[exception trying to get caller]\n");
      break
    }
    depth++;
    if(depth >= goog.debug.MAX_STACK_DEPTH) {
      sb.push("[...long stack...]");
      break
    }
  }
  opt_depth && depth >= opt_depth ? sb.push("[...reached max depth limit...]") : sb.push("[end]");
  return sb.join("")
};
goog.debug.MAX_STACK_DEPTH = 50;
goog.debug.getStacktrace = function(opt_fn) {
  return goog.debug.getStacktraceHelper_(opt_fn || arguments.callee.caller, [])
};
goog.debug.getStacktraceHelper_ = function(fn, visited) {
  var sb = [];
  if(goog.array.contains(visited, fn)) {
    sb.push("[...circular reference...]")
  }else {
    if(fn && visited.length < goog.debug.MAX_STACK_DEPTH) {
      sb.push(goog.debug.getFunctionName(fn) + "(");
      for(var args = fn.arguments, i = 0;i < args.length;i++) {
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
            argDesc = typeof arg
        }
        40 < argDesc.length && (argDesc = argDesc.substr(0, 40) + "...");
        sb.push(argDesc)
      }
      visited.push(fn);
      sb.push(")\n");
      try {
        sb.push(goog.debug.getStacktraceHelper_(fn.caller, visited))
      }catch(e) {
        sb.push("[exception trying to get caller]\n")
      }
    }else {
      fn ? sb.push("[...long stack...]") : sb.push("[end]")
    }
  }
  return sb.join("")
};
goog.debug.setFunctionResolver = function(resolver) {
  goog.debug.fnNameResolver_ = resolver
};
goog.debug.getFunctionName = function(fn) {
  if(goog.debug.fnNameCache_[fn]) {
    return goog.debug.fnNameCache_[fn]
  }
  if(goog.debug.fnNameResolver_) {
    var name = goog.debug.fnNameResolver_(fn);
    if(name) {
      return goog.debug.fnNameCache_[fn] = name
    }
  }
  var functionSource = String(fn);
  if(!goog.debug.fnNameCache_[functionSource]) {
    var matches = /function ([^\(]+)/.exec(functionSource);
    goog.debug.fnNameCache_[functionSource] = matches ? matches[1] : "[Anonymous]"
  }
  return goog.debug.fnNameCache_[functionSource]
};
goog.debug.makeWhitespaceVisible = function(string) {
  return string.replace(/ /g, "[_]").replace(/\f/g, "[f]").replace(/\n/g, "[n]\n").replace(/\r/g, "[r]").replace(/\t/g, "[t]")
};
goog.debug.fnNameCache_ = {};
goog.debug.LogRecord = function(level, msg, loggerName, opt_time, opt_sequenceNumber) {
  this.reset(level, msg, loggerName, opt_time, opt_sequenceNumber)
};
goog.debug.LogRecord.prototype.exception_ = null;
goog.debug.LogRecord.prototype.exceptionText_ = null;
goog.debug.LogRecord.ENABLE_SEQUENCE_NUMBERS = !0;
goog.debug.LogRecord.nextSequenceNumber_ = 0;
goog.debug.LogRecord.prototype.reset = function(level, msg, loggerName, opt_time, opt_sequenceNumber) {
  goog.debug.LogRecord.ENABLE_SEQUENCE_NUMBERS && ("number" == typeof opt_sequenceNumber || goog.debug.LogRecord.nextSequenceNumber_++);
  opt_time || goog.now();
  this.level_ = level;
  this.msg_ = msg;
  delete this.exception_;
  delete this.exceptionText_
};
goog.debug.LogRecord.prototype.setException = function(exception) {
  this.exception_ = exception
};
goog.debug.LogRecord.prototype.setExceptionText = function(text) {
  this.exceptionText_ = text
};
goog.debug.LogRecord.prototype.setLevel = function(level) {
  this.level_ = level
};
goog.debug.LogRecord.prototype.getMessage = function() {
  return this.msg_
};
goog.debug.LogBuffer = function() {
  goog.asserts.assert(goog.debug.LogBuffer.isBufferingEnabled(), "Cannot use goog.debug.LogBuffer without defining goog.debug.LogBuffer.CAPACITY.");
  this.clear()
};
goog.debug.LogBuffer.getInstance = function() {
  goog.debug.LogBuffer.instance_ || (goog.debug.LogBuffer.instance_ = new goog.debug.LogBuffer);
  return goog.debug.LogBuffer.instance_
};
goog.debug.LogBuffer.CAPACITY = 0;
goog.debug.LogBuffer.prototype.addRecord = function(level, msg, loggerName) {
  var curIndex = (this.curIndex_ + 1) % goog.debug.LogBuffer.CAPACITY;
  this.curIndex_ = curIndex;
  if(this.isFull_) {
    var ret = this.buffer_[curIndex];
    ret.reset(level, msg, loggerName);
    return ret
  }
  this.isFull_ = curIndex == goog.debug.LogBuffer.CAPACITY - 1;
  return this.buffer_[curIndex] = new goog.debug.LogRecord(level, msg, loggerName)
};
goog.debug.LogBuffer.isBufferingEnabled = function() {
  return 0 < goog.debug.LogBuffer.CAPACITY
};
goog.debug.LogBuffer.prototype.clear = function() {
  this.buffer_ = Array(goog.debug.LogBuffer.CAPACITY);
  this.curIndex_ = -1;
  this.isFull_ = !1
};
goog.debug.Logger = function(name) {
  this.name_ = name
};
goog.debug.Logger.prototype.parent_ = null;
goog.debug.Logger.prototype.level_ = null;
goog.debug.Logger.prototype.children_ = null;
goog.debug.Logger.prototype.handlers_ = null;
goog.debug.Logger.ENABLE_HIERARCHY = !0;
goog.debug.Logger.ENABLE_HIERARCHY || (goog.debug.Logger.rootHandlers_ = []);
goog.debug.Logger.Level = function(name, value) {
  this.name = name;
  this.value = value
};
goog.debug.Logger.Level.prototype.toString = function() {
  return this.name
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
  for(var i = 0, level;level = goog.debug.Logger.Level.PREDEFINED_LEVELS[i];i++) {
    goog.debug.Logger.Level.predefinedLevelsCache_[level.value] = level, goog.debug.Logger.Level.predefinedLevelsCache_[level.name] = level
  }
};
goog.debug.Logger.Level.getPredefinedLevel = function(name) {
  goog.debug.Logger.Level.predefinedLevelsCache_ || goog.debug.Logger.Level.createPredefinedLevelsCache_();
  return goog.debug.Logger.Level.predefinedLevelsCache_[name] || null
};
goog.debug.Logger.Level.getPredefinedLevelByValue = function(value) {
  goog.debug.Logger.Level.predefinedLevelsCache_ || goog.debug.Logger.Level.createPredefinedLevelsCache_();
  if(value in goog.debug.Logger.Level.predefinedLevelsCache_) {
    return goog.debug.Logger.Level.predefinedLevelsCache_[value]
  }
  for(var i = 0;i < goog.debug.Logger.Level.PREDEFINED_LEVELS.length;++i) {
    var level = goog.debug.Logger.Level.PREDEFINED_LEVELS[i];
    if(level.value <= value) {
      return level
    }
  }
  return null
};
goog.debug.Logger.getLogger = function(name) {
  return goog.debug.LogManager.getLogger(name)
};
goog.debug.Logger.logToProfilers = function(msg) {
  goog.global.console && (goog.global.console.timeStamp ? goog.global.console.timeStamp(msg) : goog.global.console.markTimeline && goog.global.console.markTimeline(msg));
  goog.global.msWriteProfilerMark && goog.global.msWriteProfilerMark(msg)
};
goog.debug.Logger.prototype.getParent = function() {
  return this.parent_
};
goog.debug.Logger.prototype.getChildren = function() {
  this.children_ || (this.children_ = {});
  return this.children_
};
goog.debug.Logger.prototype.setLevel = function(level) {
  goog.debug.Logger.ENABLE_HIERARCHY ? this.level_ = level : (goog.asserts.assert(!this.name_, "Cannot call setLevel() on a non-root logger when goog.debug.Logger.ENABLE_HIERARCHY is false."), goog.debug.Logger.rootLevel_ = level)
};
goog.debug.Logger.prototype.getEffectiveLevel = function() {
  if(!goog.debug.Logger.ENABLE_HIERARCHY) {
    return goog.debug.Logger.rootLevel_
  }
  if(this.level_) {
    return this.level_
  }
  if(this.parent_) {
    return this.parent_.getEffectiveLevel()
  }
  goog.asserts.fail("Root logger has no level set.");
  return null
};
goog.debug.Logger.prototype.isLoggable = function(level) {
  return level.value >= this.getEffectiveLevel().value
};
goog.debug.Logger.prototype.log = function(level, msg, opt_exception) {
  this.isLoggable(level) && this.doLogRecord_(this.getLogRecord(level, msg, opt_exception))
};
goog.debug.Logger.prototype.getLogRecord = function(level, msg, opt_exception) {
  var logRecord = goog.debug.LogBuffer.isBufferingEnabled() ? goog.debug.LogBuffer.getInstance().addRecord(level, msg, this.name_) : new goog.debug.LogRecord(level, String(msg), this.name_);
  opt_exception && (logRecord.setException(opt_exception), logRecord.setExceptionText(goog.debug.exposeException(opt_exception, arguments.callee.caller)));
  return logRecord
};
goog.debug.Logger.prototype.severe = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.SEVERE, msg, opt_exception)
};
goog.debug.Logger.prototype.warning = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.WARNING, msg, opt_exception)
};
goog.debug.Logger.prototype.fine = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.FINE, msg, opt_exception)
};
goog.debug.Logger.prototype.doLogRecord_ = function(logRecord) {
  goog.debug.Logger.logToProfilers("log:" + logRecord.getMessage());
  if(goog.debug.Logger.ENABLE_HIERARCHY) {
    for(var target = this;target;) {
      target.callPublish_(logRecord), target = target.getParent()
    }
  }else {
    for(var i = 0, handler;handler = goog.debug.Logger.rootHandlers_[i++];) {
      handler(logRecord)
    }
  }
};
goog.debug.Logger.prototype.callPublish_ = function(logRecord) {
  if(this.handlers_) {
    for(var i = 0, handler;handler = this.handlers_[i];i++) {
      handler(logRecord)
    }
  }
};
goog.debug.Logger.prototype.setParent_ = function(parent) {
  this.parent_ = parent
};
goog.debug.Logger.prototype.addChild_ = function(name, logger) {
  this.getChildren()[name] = logger
};
goog.debug.LogManager = {};
goog.debug.LogManager.loggers_ = {};
goog.debug.LogManager.rootLogger_ = null;
goog.debug.LogManager.initialize = function() {
  goog.debug.LogManager.rootLogger_ || (goog.debug.LogManager.rootLogger_ = new goog.debug.Logger(""), goog.debug.LogManager.loggers_[""] = goog.debug.LogManager.rootLogger_, goog.debug.LogManager.rootLogger_.setLevel(goog.debug.Logger.Level.CONFIG))
};
goog.debug.LogManager.getLoggers = function() {
  return goog.debug.LogManager.loggers_
};
goog.debug.LogManager.getRoot = function() {
  goog.debug.LogManager.initialize();
  return goog.debug.LogManager.rootLogger_
};
goog.debug.LogManager.getLogger = function(name) {
  goog.debug.LogManager.initialize();
  return goog.debug.LogManager.loggers_[name] || goog.debug.LogManager.createLogger_(name)
};
goog.debug.LogManager.createFunctionForCatchErrors = function(opt_logger) {
  return function(info) {
    (opt_logger || goog.debug.LogManager.getRoot()).severe("Error: " + info.message + " (" + info.fileName + " @ Line: " + info.line + ")")
  }
};
goog.debug.LogManager.createLogger_ = function(name) {
  var logger = new goog.debug.Logger(name);
  if(goog.debug.Logger.ENABLE_HIERARCHY) {
    var lastDotIndex = name.lastIndexOf("."), leafName = name.substr(lastDotIndex + 1), parentLogger = goog.debug.LogManager.getLogger(name.substr(0, lastDotIndex));
    parentLogger.addChild_(leafName, logger);
    logger.setParent_(parentLogger)
  }
  return goog.debug.LogManager.loggers_[name] = logger
};
goog.disposable = {};
goog.disposable.IDisposable = function() {
};
goog.Disposable = function() {
  goog.Disposable.MONITORING_MODE != goog.Disposable.MonitoringMode.OFF && (goog.Disposable.instances_[goog.getUid(this)] = this)
};
goog.Disposable.MonitoringMode = {OFF:0, PERMANENT:1, INTERACTIVE:2};
goog.Disposable.MONITORING_MODE = 0;
goog.Disposable.instances_ = {};
goog.Disposable.getUndisposedObjects = function() {
  var ret = [], id;
  for(id in goog.Disposable.instances_) {
    goog.Disposable.instances_.hasOwnProperty(id) && ret.push(goog.Disposable.instances_[Number(id)])
  }
  return ret
};
goog.Disposable.clearUndisposedObjects = function() {
  goog.Disposable.instances_ = {}
};
goog.Disposable.prototype.disposed_ = !1;
goog.Disposable.prototype.isDisposed = function() {
  return this.disposed_
};
goog.Disposable.prototype.dispose = function() {
  if(!this.disposed_ && (this.disposed_ = !0, this.disposeInternal(), goog.Disposable.MONITORING_MODE != goog.Disposable.MonitoringMode.OFF)) {
    var uid = goog.getUid(this);
    if(goog.Disposable.MONITORING_MODE == goog.Disposable.MonitoringMode.PERMANENT && !goog.Disposable.instances_.hasOwnProperty(uid)) {
      throw Error(this + " did not call the goog.Disposable base constructor or was disposed of after a clearUndisposedObjects call");
    }
    delete goog.Disposable.instances_[uid]
  }
};
goog.Disposable.prototype.disposeInternal = function() {
  this.dependentDisposables_ && goog.disposeAll.apply(null, this.dependentDisposables_);
  if(this.onDisposeCallbacks_) {
    for(;this.onDisposeCallbacks_.length;) {
      this.onDisposeCallbacks_.shift()()
    }
  }
};
goog.Disposable.isDisposed = function(obj) {
  return obj && "function" == typeof obj.isDisposed ? obj.isDisposed() : !1
};
goog.dispose = function(obj) {
  obj && "function" == typeof obj.dispose && obj.dispose()
};
goog.disposeAll = function(var_args) {
  for(var i = 0, len = arguments.length;i < len;++i) {
    var disposable = arguments[i];
    goog.isArrayLike(disposable) ? goog.disposeAll.apply(null, disposable) : goog.dispose(disposable)
  }
};
goog.reflect = {};
goog.reflect.object = function(type, object) {
  return object
};
goog.reflect.sinkValue = function(x) {
  goog.reflect.sinkValue[" "](x);
  return x
};
goog.reflect.sinkValue[" "] = goog.nullFunction;
goog.reflect.canAccessProperty = function(obj, prop) {
  try {
    return goog.reflect.sinkValue(obj[prop]), !0
  }catch(e) {
  }
  return!1
};
goog.events = {};
goog.events.BrowserFeature = {HAS_W3C_BUTTON:!goog.userAgent.IE || goog.userAgent.isDocumentMode(9), HAS_W3C_EVENT_SUPPORT:!goog.userAgent.IE || goog.userAgent.isDocumentMode(9), SET_KEY_CODE_TO_PREVENT_DEFAULT:goog.userAgent.IE && !goog.userAgent.isVersion("9"), HAS_NAVIGATOR_ONLINE_PROPERTY:!goog.userAgent.WEBKIT || goog.userAgent.isVersion("528"), HAS_HTML5_NETWORK_EVENT_SUPPORT:goog.userAgent.GECKO && goog.userAgent.isVersion("1.9b") || goog.userAgent.IE && goog.userAgent.isVersion("8") || goog.userAgent.OPERA && 
goog.userAgent.isVersion("9.5") || goog.userAgent.WEBKIT && goog.userAgent.isVersion("528"), HTML5_NETWORK_EVENTS_FIRE_ON_BODY:goog.userAgent.GECKO && !goog.userAgent.isVersion("8") || goog.userAgent.IE && !goog.userAgent.isVersion("9"), TOUCH_ENABLED:"ontouchstart" in goog.global || !(!goog.global.document || !(document.documentElement && "ontouchstart" in document.documentElement)) || !(!goog.global.navigator || !goog.global.navigator.msMaxTouchPoints)};
goog.events.Event = function(type, opt_target) {
  this.type = type;
  this.currentTarget = this.target = opt_target
};
goog.events.Event.prototype.disposeInternal = function() {
};
goog.events.Event.prototype.dispose = function() {
};
goog.events.Event.prototype.propagationStopped_ = !1;
goog.events.Event.prototype.defaultPrevented = !1;
goog.events.Event.prototype.returnValue_ = !0;
goog.events.Event.prototype.stopPropagation = function() {
  this.propagationStopped_ = !0
};
goog.events.Event.prototype.preventDefault = function() {
  this.defaultPrevented = !0;
  this.returnValue_ = !1
};
goog.events.Event.stopPropagation = function(e) {
  e.stopPropagation()
};
goog.events.Event.preventDefault = function(e) {
  e.preventDefault()
};
goog.events.EventType = {CLICK:"click", DBLCLICK:"dblclick", MOUSEDOWN:"mousedown", MOUSEUP:"mouseup", MOUSEOVER:"mouseover", MOUSEOUT:"mouseout", MOUSEMOVE:"mousemove", SELECTSTART:"selectstart", KEYPRESS:"keypress", KEYDOWN:"keydown", KEYUP:"keyup", BLUR:"blur", FOCUS:"focus", DEACTIVATE:"deactivate", FOCUSIN:goog.userAgent.IE ? "focusin" : "DOMFocusIn", FOCUSOUT:goog.userAgent.IE ? "focusout" : "DOMFocusOut", CHANGE:"change", SELECT:"select", SUBMIT:"submit", INPUT:"input", PROPERTYCHANGE:"propertychange", 
DRAGSTART:"dragstart", DRAG:"drag", DRAGENTER:"dragenter", DRAGOVER:"dragover", DRAGLEAVE:"dragleave", DROP:"drop", DRAGEND:"dragend", TOUCHSTART:"touchstart", TOUCHMOVE:"touchmove", TOUCHEND:"touchend", TOUCHCANCEL:"touchcancel", BEFOREUNLOAD:"beforeunload", CONTEXTMENU:"contextmenu", ERROR:"error", HELP:"help", LOAD:"load", LOSECAPTURE:"losecapture", READYSTATECHANGE:"readystatechange", RESIZE:"resize", SCROLL:"scroll", UNLOAD:"unload", HASHCHANGE:"hashchange", PAGEHIDE:"pagehide", PAGESHOW:"pageshow", 
POPSTATE:"popstate", COPY:"copy", PASTE:"paste", CUT:"cut", BEFORECOPY:"beforecopy", BEFORECUT:"beforecut", BEFOREPASTE:"beforepaste", ONLINE:"online", OFFLINE:"offline", MESSAGE:"message", CONNECT:"connect", TRANSITIONEND:goog.userAgent.WEBKIT ? "webkitTransitionEnd" : goog.userAgent.OPERA ? "oTransitionEnd" : "transitionend", MSGESTURECHANGE:"MSGestureChange", MSGESTUREEND:"MSGestureEnd", MSGESTUREHOLD:"MSGestureHold", MSGESTURESTART:"MSGestureStart", MSGESTURETAP:"MSGestureTap", MSGOTPOINTERCAPTURE:"MSGotPointerCapture", 
MSINERTIASTART:"MSInertiaStart", MSLOSTPOINTERCAPTURE:"MSLostPointerCapture", MSPOINTERCANCEL:"MSPointerCancel", MSPOINTERDOWN:"MSPointerDown", MSPOINTERMOVE:"MSPointerMove", MSPOINTEROVER:"MSPointerOver", MSPOINTEROUT:"MSPointerOut", MSPOINTERUP:"MSPointerUp"};
goog.events.BrowserEvent = function(opt_e, opt_currentTarget) {
  opt_e && this.init(opt_e, opt_currentTarget)
};
goog.inherits(goog.events.BrowserEvent, goog.events.Event);
goog.events.BrowserEvent.MouseButton = {LEFT:0, MIDDLE:1, RIGHT:2};
goog.events.BrowserEvent.IEButtonMap = [1, 4, 2];
goog.events.BrowserEvent.prototype.target = null;
goog.events.BrowserEvent.prototype.relatedTarget = null;
goog.events.BrowserEvent.prototype.offsetX = 0;
goog.events.BrowserEvent.prototype.offsetY = 0;
goog.events.BrowserEvent.prototype.clientX = 0;
goog.events.BrowserEvent.prototype.clientY = 0;
goog.events.BrowserEvent.prototype.screenX = 0;
goog.events.BrowserEvent.prototype.screenY = 0;
goog.events.BrowserEvent.prototype.button = 0;
goog.events.BrowserEvent.prototype.keyCode = 0;
goog.events.BrowserEvent.prototype.charCode = 0;
goog.events.BrowserEvent.prototype.ctrlKey = !1;
goog.events.BrowserEvent.prototype.altKey = !1;
goog.events.BrowserEvent.prototype.shiftKey = !1;
goog.events.BrowserEvent.prototype.metaKey = !1;
goog.events.BrowserEvent.prototype.event_ = null;
goog.events.BrowserEvent.prototype.init = function(e, opt_currentTarget) {
  var type = this.type = e.type;
  goog.events.Event.call(this, type);
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
  this.state = e.state;
  this.event_ = e;
  e.defaultPrevented && this.preventDefault();
  delete this.propagationStopped_
};
goog.events.BrowserEvent.prototype.stopPropagation = function() {
  goog.events.BrowserEvent.superClass_.stopPropagation.call(this);
  this.event_.stopPropagation ? this.event_.stopPropagation() : this.event_.cancelBubble = !0
};
goog.events.BrowserEvent.prototype.preventDefault = function() {
  goog.events.BrowserEvent.superClass_.preventDefault.call(this);
  var be = this.event_;
  if(be.preventDefault) {
    be.preventDefault()
  }else {
    if(be.returnValue = !1, goog.events.BrowserFeature.SET_KEY_CODE_TO_PREVENT_DEFAULT) {
      try {
        if(be.ctrlKey || 112 <= be.keyCode && 123 >= be.keyCode) {
          be.keyCode = -1
        }
      }catch(ex) {
      }
    }
  }
};
goog.events.BrowserEvent.prototype.disposeInternal = function() {
};
goog.events.EventWrapper = function() {
};
goog.events.EventWrapper.prototype.listen = function() {
};
goog.events.EventWrapper.prototype.unlisten = function() {
};
goog.events.Listener = function() {
};
goog.events.Listener.counter_ = 0;
goog.events.Listener.ENABLE_MONITORING = !1;
goog.events.Listener.prototype.key = 0;
goog.events.Listener.prototype.removed = !1;
goog.events.Listener.prototype.callOnce = !1;
goog.events.Listener.prototype.init = function(listener, proxy, src, type, capture, opt_handler) {
  if(goog.isFunction(listener)) {
    this.isFunctionListener_ = !0
  }else {
    if(listener && listener.handleEvent && goog.isFunction(listener.handleEvent)) {
      this.isFunctionListener_ = !1
    }else {
      throw Error("Invalid listener argument");
    }
  }
  this.listener = listener;
  this.proxy = proxy;
  this.src = src;
  this.type = type;
  this.capture = !!capture;
  this.handler = opt_handler;
  this.callOnce = !1;
  this.key = ++goog.events.Listener.counter_;
  this.removed = !1
};
goog.events.Listener.prototype.handleEvent = function(eventObject) {
  return this.isFunctionListener_ ? this.listener.call(this.handler || this.src, eventObject) : this.listener.handleEvent.call(this.listener, eventObject)
};
goog.events.listeners_ = {};
goog.events.listenerTree_ = {};
goog.events.sources_ = {};
goog.events.onString_ = "on";
goog.events.onStringMap_ = {};
goog.events.keySeparator_ = "_";
goog.events.listen = function(src, type, listener, opt_capt, opt_handler) {
  if(type) {
    if(goog.isArray(type)) {
      for(var i = 0;i < type.length;i++) {
        goog.events.listen(src, type[i], listener, opt_capt, opt_handler)
      }
      return null
    }
    var capture = !!opt_capt, map = goog.events.listenerTree_;
    type in map || (map[type] = {count_:0, remaining_:0});
    map = map[type];
    capture in map || (map[capture] = {count_:0, remaining_:0}, map.count_++);
    var map = map[capture], srcUid = goog.getUid(src), listenerArray, listenerObj;
    map.remaining_++;
    if(map[srcUid]) {
      listenerArray = map[srcUid];
      for(i = 0;i < listenerArray.length;i++) {
        if(listenerObj = listenerArray[i], listenerObj.listener == listener && listenerObj.handler == opt_handler) {
          if(listenerObj.removed) {
            break
          }
          return listenerArray[i].key
        }
      }
    }else {
      listenerArray = map[srcUid] = [], map.count_++
    }
    var proxy = goog.events.getProxy();
    proxy.src = src;
    listenerObj = new goog.events.Listener;
    listenerObj.init(listener, proxy, src, type, capture, opt_handler);
    var key = listenerObj.key;
    proxy.key = key;
    listenerArray.push(listenerObj);
    goog.events.listeners_[key] = listenerObj;
    goog.events.sources_[srcUid] || (goog.events.sources_[srcUid] = []);
    goog.events.sources_[srcUid].push(listenerObj);
    src.addEventListener ? (src == goog.global || !src.customEvent_) && src.addEventListener(type, proxy, capture) : src.attachEvent(goog.events.getOnString_(type), proxy);
    return key
  }
  throw Error("Invalid event type");
};
goog.events.getProxy = function() {
  var proxyCallbackFunction = goog.events.handleBrowserEvent_, f = goog.events.BrowserFeature.HAS_W3C_EVENT_SUPPORT ? function(eventObject) {
    return proxyCallbackFunction.call(f.src, f.key, eventObject)
  } : function(eventObject) {
    var v = proxyCallbackFunction.call(f.src, f.key, eventObject);
    if(!v) {
      return v
    }
  };
  return f
};
goog.events.listenOnce = function(src, type, listener, opt_capt, opt_handler) {
  if(goog.isArray(type)) {
    for(var i = 0;i < type.length;i++) {
      goog.events.listenOnce(src, type[i], listener, opt_capt, opt_handler)
    }
    return null
  }
  var key = goog.events.listen(src, type, listener, opt_capt, opt_handler);
  goog.events.listeners_[key].callOnce = !0;
  return key
};
goog.events.listenWithWrapper = function(src, wrapper, listener, opt_capt, opt_handler) {
  wrapper.listen(src, listener, opt_capt, opt_handler)
};
goog.events.unlisten = function(src, type, listener, opt_capt, opt_handler) {
  if(goog.isArray(type)) {
    for(var i = 0;i < type.length;i++) {
      goog.events.unlisten(src, type[i], listener, opt_capt, opt_handler)
    }
    return null
  }
  var capture = !!opt_capt, listenerArray = goog.events.getListeners_(src, type, capture);
  if(!listenerArray) {
    return!1
  }
  for(i = 0;i < listenerArray.length;i++) {
    if(listenerArray[i].listener == listener && listenerArray[i].capture == capture && listenerArray[i].handler == opt_handler) {
      return goog.events.unlistenByKey(listenerArray[i].key)
    }
  }
  return!1
};
goog.events.unlistenByKey = function(key) {
  if(!goog.events.listeners_[key]) {
    return!1
  }
  var listener = goog.events.listeners_[key];
  if(listener.removed) {
    return!1
  }
  var src = listener.src, type = listener.type, proxy = listener.proxy, capture = listener.capture;
  src.removeEventListener ? (src == goog.global || !src.customEvent_) && src.removeEventListener(type, proxy, capture) : src.detachEvent && src.detachEvent(goog.events.getOnString_(type), proxy);
  var srcUid = goog.getUid(src);
  if(goog.events.sources_[srcUid]) {
    var sourcesArray = goog.events.sources_[srcUid];
    goog.array.remove(sourcesArray, listener);
    0 == sourcesArray.length && delete goog.events.sources_[srcUid]
  }
  listener.removed = !0;
  var listenerArray = goog.events.listenerTree_[type][capture][srcUid];
  listenerArray && (listenerArray.needsCleanup_ = !0, goog.events.cleanUp_(type, capture, srcUid, listenerArray));
  delete goog.events.listeners_[key];
  return!0
};
goog.events.unlistenWithWrapper = function(src, wrapper, listener, opt_capt, opt_handler) {
  wrapper.unlisten(src, listener, opt_capt, opt_handler)
};
goog.events.cleanUp_ = function(type, capture, srcUid, listenerArray) {
  if(!listenerArray.locked_ && listenerArray.needsCleanup_) {
    for(var oldIndex = 0, newIndex = 0;oldIndex < listenerArray.length;oldIndex++) {
      listenerArray[oldIndex].removed ? listenerArray[oldIndex].proxy.src = null : (oldIndex != newIndex && (listenerArray[newIndex] = listenerArray[oldIndex]), newIndex++)
    }
    listenerArray.length = newIndex;
    listenerArray.needsCleanup_ = !1;
    0 == newIndex && (delete goog.events.listenerTree_[type][capture][srcUid], goog.events.listenerTree_[type][capture].count_--, 0 == goog.events.listenerTree_[type][capture].count_ && (delete goog.events.listenerTree_[type][capture], goog.events.listenerTree_[type].count_--), 0 == goog.events.listenerTree_[type].count_ && delete goog.events.listenerTree_[type])
  }
};
goog.events.removeAll = function(opt_obj, opt_type, opt_capt) {
  var count = 0, noType = null == opt_type, noCapt = null == opt_capt;
  opt_capt = !!opt_capt;
  if(null == opt_obj) {
    goog.object.forEach(goog.events.sources_, function(listeners) {
      for(var i = listeners.length - 1;0 <= i;i--) {
        var listener = listeners[i];
        if((noType || opt_type == listener.type) && (noCapt || opt_capt == listener.capture)) {
          goog.events.unlistenByKey(listener.key), count++
        }
      }
    })
  }else {
    var srcUid = goog.getUid(opt_obj);
    if(goog.events.sources_[srcUid]) {
      for(var sourcesArray = goog.events.sources_[srcUid], i$$0 = sourcesArray.length - 1;0 <= i$$0;i$$0--) {
        var listener$$0 = sourcesArray[i$$0];
        if((noType || opt_type == listener$$0.type) && (noCapt || opt_capt == listener$$0.capture)) {
          goog.events.unlistenByKey(listener$$0.key), count++
        }
      }
    }
  }
  return count
};
goog.events.getListeners = function(obj, type, capture) {
  return goog.events.getListeners_(obj, type, capture) || []
};
goog.events.getListeners_ = function(obj, type, capture) {
  var map = goog.events.listenerTree_;
  if(type in map && (map = map[type], capture in map)) {
    var map = map[capture], objUid = goog.getUid(obj);
    if(map[objUid]) {
      return map[objUid]
    }
  }
  return null
};
goog.events.getListener = function(src, type, listener, opt_capt, opt_handler) {
  var capture = !!opt_capt, listenerArray = goog.events.getListeners_(src, type, capture);
  if(listenerArray) {
    for(var i = 0;i < listenerArray.length;i++) {
      if(!listenerArray[i].removed && listenerArray[i].listener == listener && listenerArray[i].capture == capture && listenerArray[i].handler == opt_handler) {
        return listenerArray[i]
      }
    }
  }
  return null
};
goog.events.hasListener = function(obj, opt_type, opt_capture) {
  var objUid = goog.getUid(obj), listeners = goog.events.sources_[objUid];
  if(listeners) {
    var hasType = goog.isDef(opt_type), hasCapture = goog.isDef(opt_capture);
    if(hasType && hasCapture) {
      var map = goog.events.listenerTree_[opt_type];
      return!!map && !!map[opt_capture] && objUid in map[opt_capture]
    }
    return!hasType && !hasCapture ? !0 : goog.array.some(listeners, function(listener) {
      return hasType && listener.type == opt_type || hasCapture && listener.capture == opt_capture
    })
  }
  return!1
};
goog.events.expose = function(e) {
  var str = [], key;
  for(key in e) {
    e[key] && e[key].id ? str.push(key + " = " + e[key] + " (" + e[key].id + ")") : str.push(key + " = " + e[key])
  }
  return str.join("\n")
};
goog.events.getOnString_ = function(type) {
  return type in goog.events.onStringMap_ ? goog.events.onStringMap_[type] : goog.events.onStringMap_[type] = goog.events.onString_ + type
};
goog.events.fireListeners = function(obj, type, capture, eventObject) {
  var map = goog.events.listenerTree_;
  return type in map && (map = map[type], capture in map) ? goog.events.fireListeners_(map[capture], obj, type, capture, eventObject) : !0
};
goog.events.fireListeners_ = function(map, obj, type, capture, eventObject) {
  var retval = 1, objUid = goog.getUid(obj);
  if(map[objUid]) {
    map.remaining_--;
    var listenerArray = map[objUid];
    listenerArray.locked_ ? listenerArray.locked_++ : listenerArray.locked_ = 1;
    try {
      for(var length = listenerArray.length, i = 0;i < length;i++) {
        var listener = listenerArray[i];
        listener && !listener.removed && (retval &= !1 !== goog.events.fireListener(listener, eventObject))
      }
    }finally {
      listenerArray.locked_--, goog.events.cleanUp_(type, capture, objUid, listenerArray)
    }
  }
  return Boolean(retval)
};
goog.events.fireListener = function(listener, eventObject) {
  listener.callOnce && goog.events.unlistenByKey(listener.key);
  return listener.handleEvent(eventObject)
};
goog.events.getTotalListenerCount = function() {
  return goog.object.getCount(goog.events.listeners_)
};
goog.events.dispatchEvent = function(src, e) {
  var type = e.type || e, map = goog.events.listenerTree_;
  if(!(type in map)) {
    return!0
  }
  if(goog.isString(e)) {
    e = new goog.events.Event(e, src)
  }else {
    if(e instanceof goog.events.Event) {
      e.target = e.target || src
    }else {
      var oldEvent = e;
      e = new goog.events.Event(type, src);
      goog.object.extend(e, oldEvent)
    }
  }
  var rv = 1, ancestors, map = map[type], hasCapture = !0 in map, targetsMap;
  if(hasCapture) {
    ancestors = [];
    for(var parent = src;parent;parent = parent.getParentEventTarget()) {
      ancestors.push(parent)
    }
    targetsMap = map[!0];
    targetsMap.remaining_ = targetsMap.count_;
    for(var i = ancestors.length - 1;!e.propagationStopped_ && 0 <= i && targetsMap.remaining_;i--) {
      e.currentTarget = ancestors[i], rv &= goog.events.fireListeners_(targetsMap, ancestors[i], e.type, !0, e) && !1 != e.returnValue_
    }
  }
  if(!1 in map) {
    if(targetsMap = map[!1], targetsMap.remaining_ = targetsMap.count_, hasCapture) {
      for(i = 0;!e.propagationStopped_ && i < ancestors.length && targetsMap.remaining_;i++) {
        e.currentTarget = ancestors[i], rv &= goog.events.fireListeners_(targetsMap, ancestors[i], e.type, !1, e) && !1 != e.returnValue_
      }
    }else {
      for(var current = src;!e.propagationStopped_ && current && targetsMap.remaining_;current = current.getParentEventTarget()) {
        e.currentTarget = current, rv &= goog.events.fireListeners_(targetsMap, current, e.type, !1, e) && !1 != e.returnValue_
      }
    }
  }
  return Boolean(rv)
};
goog.events.protectBrowserEventEntryPoint = function(errorHandler) {
  goog.events.handleBrowserEvent_ = errorHandler.protectEntryPoint(goog.events.handleBrowserEvent_)
};
goog.events.handleBrowserEvent_ = function(key, opt_evt) {
  if(!goog.events.listeners_[key]) {
    return!0
  }
  var listener = goog.events.listeners_[key], type = listener.type, map = goog.events.listenerTree_;
  if(!(type in map)) {
    return!0
  }
  var map = map[type], retval, targetsMap;
  if(!goog.events.BrowserFeature.HAS_W3C_EVENT_SUPPORT) {
    var ieEvent = opt_evt || goog.getObjectByName("window.event"), hasCapture = !0 in map, hasBubble = !1 in map;
    if(hasCapture) {
      if(goog.events.isMarkedIeEvent_(ieEvent)) {
        return!0
      }
      goog.events.markIeEvent_(ieEvent)
    }
    var evt = new goog.events.BrowserEvent;
    evt.init(ieEvent, this);
    retval = !0;
    try {
      if(hasCapture) {
        for(var ancestors = [], parent = evt.currentTarget;parent;parent = parent.parentNode) {
          ancestors.push(parent)
        }
        targetsMap = map[!0];
        targetsMap.remaining_ = targetsMap.count_;
        for(var i = ancestors.length - 1;!evt.propagationStopped_ && 0 <= i && targetsMap.remaining_;i--) {
          evt.currentTarget = ancestors[i], retval &= goog.events.fireListeners_(targetsMap, ancestors[i], type, !0, evt)
        }
        if(hasBubble) {
          targetsMap = map[!1];
          targetsMap.remaining_ = targetsMap.count_;
          for(i = 0;!evt.propagationStopped_ && i < ancestors.length && targetsMap.remaining_;i++) {
            evt.currentTarget = ancestors[i], retval &= goog.events.fireListeners_(targetsMap, ancestors[i], type, !1, evt)
          }
        }
      }else {
        retval = goog.events.fireListener(listener, evt)
      }
    }finally {
      ancestors && (ancestors.length = 0)
    }
    return retval
  }
  var be = new goog.events.BrowserEvent(opt_evt, this);
  return retval = goog.events.fireListener(listener, be)
};
goog.events.markIeEvent_ = function(e) {
  var useReturnValue = !1;
  if(0 == e.keyCode) {
    try {
      e.keyCode = -1;
      return
    }catch(ex) {
      useReturnValue = !0
    }
  }
  if(useReturnValue || void 0 == e.returnValue) {
    e.returnValue = !0
  }
};
goog.events.isMarkedIeEvent_ = function(e) {
  return 0 > e.keyCode || void 0 != e.returnValue
};
goog.events.uniqueIdCounter_ = 0;
goog.events.getUniqueId = function(identifier) {
  return identifier + "_" + goog.events.uniqueIdCounter_++
};
goog.debug.entryPointRegistry.register(function(transformer) {
  goog.events.handleBrowserEvent_ = transformer(goog.events.handleBrowserEvent_)
});
goog.events.EventTarget = function() {
  goog.Disposable.call(this)
};
goog.inherits(goog.events.EventTarget, goog.Disposable);
goog.events.EventTarget.prototype.customEvent_ = !0;
goog.events.EventTarget.prototype.parentEventTarget_ = null;
goog.events.EventTarget.prototype.getParentEventTarget = function() {
  return this.parentEventTarget_
};
goog.events.EventTarget.prototype.addEventListener = function(type, handler, opt_capture, opt_handlerScope) {
  goog.events.listen(this, type, handler, opt_capture, opt_handlerScope)
};
goog.events.EventTarget.prototype.removeEventListener = function(type, handler, opt_capture, opt_handlerScope) {
  goog.events.unlisten(this, type, handler, opt_capture, opt_handlerScope)
};
goog.events.EventTarget.prototype.dispatchEvent = function(e) {
  return goog.events.dispatchEvent(this, e)
};
goog.events.EventTarget.prototype.disposeInternal = function() {
  goog.events.EventTarget.superClass_.disposeInternal.call(this);
  goog.events.removeAll(this);
  this.parentEventTarget_ = null
};
goog.Timer = function(opt_interval, opt_timerObject) {
  goog.events.EventTarget.call(this);
  this.interval_ = opt_interval || 1;
  this.timerObject_ = opt_timerObject || goog.Timer.defaultTimerObject;
  this.boundTick_ = goog.bind(this.tick_, this);
  this.last_ = goog.now()
};
goog.inherits(goog.Timer, goog.events.EventTarget);
goog.Timer.MAX_TIMEOUT_ = 2147483647;
goog.Timer.prototype.enabled = !1;
goog.Timer.defaultTimerObject = goog.global.window;
goog.Timer.intervalScale = 0.8;
goog.Timer.prototype.timer_ = null;
goog.Timer.prototype.tick_ = function() {
  if(this.enabled) {
    var elapsed = goog.now() - this.last_;
    0 < elapsed && elapsed < this.interval_ * goog.Timer.intervalScale ? this.timer_ = this.timerObject_.setTimeout(this.boundTick_, this.interval_ - elapsed) : (this.dispatchTick(), this.enabled && (this.timer_ = this.timerObject_.setTimeout(this.boundTick_, this.interval_), this.last_ = goog.now()))
  }
};
goog.Timer.prototype.dispatchTick = function() {
  this.dispatchEvent(goog.Timer.TICK)
};
goog.Timer.prototype.stop = function() {
  this.enabled = !1;
  this.timer_ && (this.timerObject_.clearTimeout(this.timer_), this.timer_ = null)
};
goog.Timer.prototype.disposeInternal = function() {
  goog.Timer.superClass_.disposeInternal.call(this);
  this.stop();
  delete this.timerObject_
};
goog.Timer.TICK = "tick";
goog.Timer.callOnce = function(listener, opt_delay, opt_handler) {
  if(goog.isFunction(listener)) {
    opt_handler && (listener = goog.bind(listener, opt_handler))
  }else {
    if(listener && "function" == typeof listener.handleEvent) {
      listener = goog.bind(listener.handleEvent, listener)
    }else {
      throw Error("Invalid listener argument");
    }
  }
  return opt_delay > goog.Timer.MAX_TIMEOUT_ ? -1 : goog.Timer.defaultTimerObject.setTimeout(listener, opt_delay || 0)
};
goog.Timer.clear = function(timerId) {
  goog.Timer.defaultTimerObject.clearTimeout(timerId)
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
  return out
};
goog.uri.utils.splitRe_ = RegExp("^(?:([^:/?#.]+):)?(?://(?:([^/?#]*)@)?([^/#?]*?)(?::([0-9]+))?(?=[/#?]|$))?([^?#]+)?(?:\\?([^#]*))?(?:#(.*))?$");
goog.uri.utils.ComponentIndex = {SCHEME:1, USER_INFO:2, DOMAIN:3, PORT:4, PATH:5, QUERY_DATA:6, FRAGMENT:7};
goog.uri.utils.split = function(uri) {
  goog.uri.utils.phishingProtection_();
  return uri.match(goog.uri.utils.splitRe_)
};
goog.uri.utils.needsPhishingProtection_ = goog.userAgent.WEBKIT;
goog.uri.utils.phishingProtection_ = function() {
  if(goog.uri.utils.needsPhishingProtection_) {
    goog.uri.utils.needsPhishingProtection_ = !1;
    var location = goog.global.location;
    if(location) {
      var href = location.href;
      if(href) {
        var domain = goog.uri.utils.getDomain(href);
        if(domain && domain != location.hostname) {
          throw goog.uri.utils.needsPhishingProtection_ = !0, Error();
        }
      }
    }
  }
};
goog.uri.utils.decodeIfPossible_ = function(uri) {
  return uri && decodeURIComponent(uri)
};
goog.uri.utils.getComponentByIndex_ = function(componentIndex, uri) {
  return goog.uri.utils.split(uri)[componentIndex] || null
};
goog.uri.utils.getScheme = function(uri) {
  return goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.SCHEME, uri)
};
goog.uri.utils.getEffectiveScheme = function(uri) {
  var scheme = goog.uri.utils.getScheme(uri);
  if(!scheme && self.location) {
    var protocol = self.location.protocol, scheme = protocol.substr(0, protocol.length - 1)
  }
  return scheme ? scheme.toLowerCase() : ""
};
goog.uri.utils.getUserInfoEncoded = function(uri) {
  return goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.USER_INFO, uri)
};
goog.uri.utils.getUserInfo = function(uri) {
  return goog.uri.utils.decodeIfPossible_(goog.uri.utils.getUserInfoEncoded(uri))
};
goog.uri.utils.getDomainEncoded = function(uri) {
  return goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.DOMAIN, uri)
};
goog.uri.utils.getDomain = function(uri) {
  return goog.uri.utils.decodeIfPossible_(goog.uri.utils.getDomainEncoded(uri))
};
goog.uri.utils.getPort = function(uri) {
  return Number(goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.PORT, uri)) || null
};
goog.uri.utils.getPathEncoded = function(uri) {
  return goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.PATH, uri)
};
goog.uri.utils.getPath = function(uri) {
  return goog.uri.utils.decodeIfPossible_(goog.uri.utils.getPathEncoded(uri))
};
goog.uri.utils.getQueryData = function(uri) {
  return goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.QUERY_DATA, uri)
};
goog.uri.utils.getFragmentEncoded = function(uri) {
  var hashIndex = uri.indexOf("#");
  return 0 > hashIndex ? null : uri.substr(hashIndex + 1)
};
goog.uri.utils.setFragmentEncoded = function(uri, fragment) {
  return goog.uri.utils.removeFragment(uri) + (fragment ? "#" + fragment : "")
};
goog.uri.utils.getFragment = function(uri) {
  return goog.uri.utils.decodeIfPossible_(goog.uri.utils.getFragmentEncoded(uri))
};
goog.uri.utils.getHost = function(uri) {
  var pieces = goog.uri.utils.split(uri);
  return goog.uri.utils.buildFromEncodedParts(pieces[goog.uri.utils.ComponentIndex.SCHEME], pieces[goog.uri.utils.ComponentIndex.USER_INFO], pieces[goog.uri.utils.ComponentIndex.DOMAIN], pieces[goog.uri.utils.ComponentIndex.PORT])
};
goog.uri.utils.getPathAndAfter = function(uri) {
  var pieces = goog.uri.utils.split(uri);
  return goog.uri.utils.buildFromEncodedParts(null, null, null, null, pieces[goog.uri.utils.ComponentIndex.PATH], pieces[goog.uri.utils.ComponentIndex.QUERY_DATA], pieces[goog.uri.utils.ComponentIndex.FRAGMENT])
};
goog.uri.utils.removeFragment = function(uri) {
  var hashIndex = uri.indexOf("#");
  return 0 > hashIndex ? uri : uri.substr(0, hashIndex)
};
goog.uri.utils.haveSameDomain = function(uri1, uri2) {
  var pieces1 = goog.uri.utils.split(uri1), pieces2 = goog.uri.utils.split(uri2);
  return pieces1[goog.uri.utils.ComponentIndex.DOMAIN] == pieces2[goog.uri.utils.ComponentIndex.DOMAIN] && pieces1[goog.uri.utils.ComponentIndex.SCHEME] == pieces2[goog.uri.utils.ComponentIndex.SCHEME] && pieces1[goog.uri.utils.ComponentIndex.PORT] == pieces2[goog.uri.utils.ComponentIndex.PORT]
};
goog.uri.utils.assertNoFragmentsOrQueries_ = function(uri) {
  if(goog.DEBUG && (0 <= uri.indexOf("#") || 0 <= uri.indexOf("?"))) {
    throw Error("goog.uri.utils: Fragment or query identifiers are not supported: [" + uri + "]");
  }
};
goog.uri.utils.appendQueryData_ = function(buffer) {
  if(buffer[1]) {
    var baseUri = buffer[0], hashIndex = baseUri.indexOf("#");
    0 <= hashIndex && (buffer.push(baseUri.substr(hashIndex)), buffer[0] = baseUri = baseUri.substr(0, hashIndex));
    var questionIndex = baseUri.indexOf("?");
    0 > questionIndex ? buffer[1] = "?" : questionIndex == baseUri.length - 1 && (buffer[1] = void 0)
  }
  return buffer.join("")
};
goog.uri.utils.appendKeyValuePairs_ = function(key, value, pairs) {
  if(goog.isArray(value)) {
    goog.asserts.assertArray(value);
    for(var j = 0;j < value.length;j++) {
      goog.uri.utils.appendKeyValuePairs_(key, String(value[j]), pairs)
    }
  }else {
    null != value && pairs.push("&", key, "" === value ? "" : "=", goog.string.urlEncode(value))
  }
};
goog.uri.utils.buildQueryDataBuffer_ = function(buffer, keysAndValues, opt_startIndex) {
  goog.asserts.assert(0 == Math.max(keysAndValues.length - (opt_startIndex || 0), 0) % 2, "goog.uri.utils: Key/value lists must be even in length.");
  for(var i = opt_startIndex || 0;i < keysAndValues.length;i += 2) {
    goog.uri.utils.appendKeyValuePairs_(keysAndValues[i], keysAndValues[i + 1], buffer)
  }
  return buffer
};
goog.uri.utils.buildQueryData = function(keysAndValues, opt_startIndex) {
  var buffer = goog.uri.utils.buildQueryDataBuffer_([], keysAndValues, opt_startIndex);
  buffer[0] = "";
  return buffer.join("")
};
goog.uri.utils.buildQueryDataBufferFromMap_ = function(buffer, map) {
  for(var key in map) {
    goog.uri.utils.appendKeyValuePairs_(key, map[key], buffer)
  }
  return buffer
};
goog.uri.utils.buildQueryDataFromMap = function(map) {
  var buffer = goog.uri.utils.buildQueryDataBufferFromMap_([], map);
  buffer[0] = "";
  return buffer.join("")
};
goog.uri.utils.appendParams = function(uri, var_args) {
  return goog.uri.utils.appendQueryData_(2 == arguments.length ? goog.uri.utils.buildQueryDataBuffer_([uri], arguments[1], 0) : goog.uri.utils.buildQueryDataBuffer_([uri], arguments, 1))
};
goog.uri.utils.appendParamsFromMap = function(uri, map) {
  return goog.uri.utils.appendQueryData_(goog.uri.utils.buildQueryDataBufferFromMap_([uri], map))
};
goog.uri.utils.appendParam = function(uri, key, value) {
  return goog.uri.utils.appendQueryData_([uri, "&", key, "=", goog.string.urlEncode(value)])
};
goog.uri.utils.findParam_ = function(uri, startIndex, keyEncoded, hashOrEndIndex) {
  for(var index = startIndex, keyLength = keyEncoded.length;0 <= (index = uri.indexOf(keyEncoded, index)) && index < hashOrEndIndex;) {
    var precedingChar = uri.charCodeAt(index - 1);
    if(precedingChar == goog.uri.utils.CharCode_.AMPERSAND || precedingChar == goog.uri.utils.CharCode_.QUESTION) {
      var followingChar = uri.charCodeAt(index + keyLength);
      if(!followingChar || followingChar == goog.uri.utils.CharCode_.EQUAL || followingChar == goog.uri.utils.CharCode_.AMPERSAND || followingChar == goog.uri.utils.CharCode_.HASH) {
        return index
      }
    }
    index += keyLength + 1
  }
  return-1
};
goog.uri.utils.hashOrEndRe_ = /#|$/;
goog.uri.utils.hasParam = function(uri, keyEncoded) {
  return 0 <= goog.uri.utils.findParam_(uri, 0, keyEncoded, uri.search(goog.uri.utils.hashOrEndRe_))
};
goog.uri.utils.getParamValue = function(uri, keyEncoded) {
  var hashOrEndIndex = uri.search(goog.uri.utils.hashOrEndRe_), foundIndex = goog.uri.utils.findParam_(uri, 0, keyEncoded, hashOrEndIndex);
  if(0 > foundIndex) {
    return null
  }
  var endPosition = uri.indexOf("&", foundIndex);
  if(0 > endPosition || endPosition > hashOrEndIndex) {
    endPosition = hashOrEndIndex
  }
  foundIndex += keyEncoded.length + 1;
  return goog.string.urlDecode(uri.substr(foundIndex, endPosition - foundIndex))
};
goog.uri.utils.getParamValues = function(uri, keyEncoded) {
  for(var hashOrEndIndex = uri.search(goog.uri.utils.hashOrEndRe_), position = 0, foundIndex, result = [];0 <= (foundIndex = goog.uri.utils.findParam_(uri, position, keyEncoded, hashOrEndIndex));) {
    position = uri.indexOf("&", foundIndex);
    if(0 > position || position > hashOrEndIndex) {
      position = hashOrEndIndex
    }
    foundIndex += keyEncoded.length + 1;
    result.push(goog.string.urlDecode(uri.substr(foundIndex, position - foundIndex)))
  }
  return result
};
goog.uri.utils.trailingQueryPunctuationRe_ = /[?&]($|#)/;
goog.uri.utils.removeParam = function(uri, keyEncoded) {
  for(var hashOrEndIndex = uri.search(goog.uri.utils.hashOrEndRe_), position = 0, foundIndex, buffer = [];0 <= (foundIndex = goog.uri.utils.findParam_(uri, position, keyEncoded, hashOrEndIndex));) {
    buffer.push(uri.substring(position, foundIndex)), position = Math.min(uri.indexOf("&", foundIndex) + 1 || hashOrEndIndex, hashOrEndIndex)
  }
  buffer.push(uri.substr(position));
  return buffer.join("").replace(goog.uri.utils.trailingQueryPunctuationRe_, "$1")
};
goog.uri.utils.setParam = function(uri, keyEncoded, value) {
  return goog.uri.utils.appendParam(goog.uri.utils.removeParam(uri, keyEncoded), keyEncoded, value)
};
goog.uri.utils.appendPath = function(baseUri, path) {
  goog.uri.utils.assertNoFragmentsOrQueries_(baseUri);
  goog.string.endsWith(baseUri, "/") && (baseUri = baseUri.substr(0, baseUri.length - 1));
  goog.string.startsWith(path, "/") && (path = path.substr(1));
  return goog.string.buildString(baseUri, "/", path)
};
goog.uri.utils.StandardQueryParam = {RANDOM:"zx"};
goog.uri.utils.makeUnique = function(uri) {
  return goog.uri.utils.setParam(uri, goog.uri.utils.StandardQueryParam.RANDOM, goog.string.getRandomString())
};
goog.net = {};
goog.net.ErrorCode = {NO_ERROR:0, ACCESS_DENIED:1, FILE_NOT_FOUND:2, FF_SILENT_ERROR:3, CUSTOM_ERROR:4, EXCEPTION:5, HTTP_ERROR:6, ABORT:7, TIMEOUT:8, OFFLINE:9};
goog.net.ErrorCode.getDebugMessage = function(errorCode) {
  switch(errorCode) {
    case goog.net.ErrorCode.NO_ERROR:
      return"No Error";
    case goog.net.ErrorCode.ACCESS_DENIED:
      return"Access denied to content document";
    case goog.net.ErrorCode.FILE_NOT_FOUND:
      return"File not found";
    case goog.net.ErrorCode.FF_SILENT_ERROR:
      return"Firefox silently errored";
    case goog.net.ErrorCode.CUSTOM_ERROR:
      return"Application custom error";
    case goog.net.ErrorCode.EXCEPTION:
      return"An exception occurred";
    case goog.net.ErrorCode.HTTP_ERROR:
      return"Http response at 400 or 500 level";
    case goog.net.ErrorCode.ABORT:
      return"Request was aborted";
    case goog.net.ErrorCode.TIMEOUT:
      return"Request timed out";
    case goog.net.ErrorCode.OFFLINE:
      return"The resource is not available offline";
    default:
      return"Unrecognized error code"
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
      return!1
  }
};
goog.net.XmlHttpFactory = function() {
};
goog.net.XmlHttpFactory.prototype.cachedOptions_ = null;
goog.net.XmlHttpFactory.prototype.getOptions = function() {
  return this.cachedOptions_ || (this.cachedOptions_ = this.internalGetOptions())
};
goog.net.WrapperXmlHttpFactory = function(xhrFactory, optionsFactory) {
  this.xhrFactory_ = xhrFactory;
  this.optionsFactory_ = optionsFactory
};
goog.inherits(goog.net.WrapperXmlHttpFactory, goog.net.XmlHttpFactory);
goog.net.WrapperXmlHttpFactory.prototype.createInstance = function() {
  return this.xhrFactory_()
};
goog.net.WrapperXmlHttpFactory.prototype.getOptions = function() {
  return this.optionsFactory_()
};
goog.net.XmlHttp = function() {
  return goog.net.XmlHttp.factory_.createInstance()
};
goog.net.XmlHttp.ASSUME_NATIVE_XHR = !1;
goog.net.XmlHttp.getOptions = function() {
  return goog.net.XmlHttp.factory_.getOptions()
};
goog.net.XmlHttp.OptionType = {USE_NULL_FUNCTION:0, LOCAL_REQUEST_ERROR:1};
goog.net.XmlHttp.ReadyState = {UNINITIALIZED:0, LOADING:1, LOADED:2, INTERACTIVE:3, COMPLETE:4};
goog.net.XmlHttp.setFactory = function(factory, optionsFactory) {
  goog.net.XmlHttp.setGlobalFactory(new goog.net.WrapperXmlHttpFactory(factory, optionsFactory))
};
goog.net.XmlHttp.setGlobalFactory = function(factory) {
  goog.net.XmlHttp.factory_ = factory
};
goog.net.DefaultXmlHttpFactory = function() {
};
goog.inherits(goog.net.DefaultXmlHttpFactory, goog.net.XmlHttpFactory);
goog.net.DefaultXmlHttpFactory.prototype.createInstance = function() {
  var progId = this.getProgId_();
  return progId ? new ActiveXObject(progId) : new XMLHttpRequest
};
goog.net.DefaultXmlHttpFactory.prototype.internalGetOptions = function() {
  var options = {};
  this.getProgId_() && (options[goog.net.XmlHttp.OptionType.USE_NULL_FUNCTION] = !0, options[goog.net.XmlHttp.OptionType.LOCAL_REQUEST_ERROR] = !0);
  return options
};
goog.net.DefaultXmlHttpFactory.prototype.getProgId_ = function() {
  if(goog.net.XmlHttp.ASSUME_NATIVE_XHR) {
    return""
  }
  if(!this.ieProgId_ && "undefined" == typeof XMLHttpRequest && "undefined" != typeof ActiveXObject) {
    for(var ACTIVE_X_IDENTS = ["MSXML2.XMLHTTP.6.0", "MSXML2.XMLHTTP.3.0", "MSXML2.XMLHTTP", "Microsoft.XMLHTTP"], i = 0;i < ACTIVE_X_IDENTS.length;i++) {
      var candidate = ACTIVE_X_IDENTS[i];
      try {
        return new ActiveXObject(candidate), this.ieProgId_ = candidate
      }catch(e) {
      }
    }
    throw Error("Could not create ActiveXObject. ActiveX might be disabled, or MSXML might not be installed");
  }
  return this.ieProgId_
};
goog.net.XmlHttp.setGlobalFactory(new goog.net.DefaultXmlHttpFactory);
goog.net.XhrIo = function(opt_xmlHttpFactory) {
  goog.events.EventTarget.call(this);
  this.headers = new goog.structs.Map;
  this.xmlHttpFactory_ = opt_xmlHttpFactory || null
};
goog.inherits(goog.net.XhrIo, goog.events.EventTarget);
goog.net.XhrIo.ResponseType = {DEFAULT:"", TEXT:"text", DOCUMENT:"document", BLOB:"blob", ARRAY_BUFFER:"arraybuffer"};
goog.net.XhrIo.prototype.logger_ = goog.debug.Logger.getLogger("goog.net.XhrIo");
goog.net.XhrIo.CONTENT_TYPE_HEADER = "Content-Type";
goog.net.XhrIo.HTTP_SCHEME_PATTERN = /^https?$/i;
goog.net.XhrIo.FORM_CONTENT_TYPE = "application/x-www-form-urlencoded;charset=utf-8";
goog.net.XhrIo.sendInstances_ = [];
goog.net.XhrIo.send = function(url, opt_callback, opt_method, opt_content, opt_headers, opt_timeoutInterval, opt_withCredentials) {
  var x = new goog.net.XhrIo;
  goog.net.XhrIo.sendInstances_.push(x);
  opt_callback && goog.events.listen(x, goog.net.EventType.COMPLETE, opt_callback);
  goog.events.listen(x, goog.net.EventType.READY, goog.partial(goog.net.XhrIo.cleanupSend_, x));
  opt_timeoutInterval && x.setTimeoutInterval(opt_timeoutInterval);
  opt_withCredentials && x.setWithCredentials(opt_withCredentials);
  x.send(url, opt_method, opt_content, opt_headers)
};
goog.net.XhrIo.cleanup = function() {
  for(var instances = goog.net.XhrIo.sendInstances_;instances.length;) {
    instances.pop().dispose()
  }
};
goog.net.XhrIo.protectEntryPoints = function(errorHandler) {
  goog.net.XhrIo.prototype.onReadyStateChangeEntryPoint_ = errorHandler.protectEntryPoint(goog.net.XhrIo.prototype.onReadyStateChangeEntryPoint_)
};
goog.net.XhrIo.cleanupSend_ = function(XhrIo) {
  XhrIo.dispose();
  goog.array.remove(goog.net.XhrIo.sendInstances_, XhrIo)
};
goog.net.XhrIo.prototype.active_ = !1;
goog.net.XhrIo.prototype.xhr_ = null;
goog.net.XhrIo.prototype.xhrOptions_ = null;
goog.net.XhrIo.prototype.lastUri_ = "";
goog.net.XhrIo.prototype.lastMethod_ = "";
goog.net.XhrIo.prototype.lastError_ = "";
goog.net.XhrIo.prototype.errorDispatched_ = !1;
goog.net.XhrIo.prototype.inSend_ = !1;
goog.net.XhrIo.prototype.inOpen_ = !1;
goog.net.XhrIo.prototype.inAbort_ = !1;
goog.net.XhrIo.prototype.timeoutInterval_ = 0;
goog.net.XhrIo.prototype.timeoutId_ = null;
goog.net.XhrIo.prototype.responseType_ = goog.net.XhrIo.ResponseType.DEFAULT;
goog.net.XhrIo.prototype.withCredentials_ = !1;
goog.net.XhrIo.prototype.setTimeoutInterval = function(ms) {
  this.timeoutInterval_ = Math.max(0, ms)
};
goog.net.XhrIo.prototype.setWithCredentials = function(withCredentials) {
  this.withCredentials_ = withCredentials
};
goog.net.XhrIo.prototype.send = function(url, opt_method, opt_content, opt_headers) {
  if(this.xhr_) {
    throw Error("[goog.net.XhrIo] Object is active with another request=" + this.lastUri_ + "; newUri=" + url);
  }
  var method = opt_method ? opt_method.toUpperCase() : "GET";
  this.lastUri_ = url;
  this.lastError_ = "";
  this.lastMethod_ = method;
  this.errorDispatched_ = !1;
  this.active_ = !0;
  this.xhr_ = this.createXhr();
  this.xhrOptions_ = this.xmlHttpFactory_ ? this.xmlHttpFactory_.getOptions() : goog.net.XmlHttp.getOptions();
  this.xhr_.onreadystatechange = goog.bind(this.onReadyStateChange_, this);
  try {
    this.logger_.fine(this.formatMsg_("Opening Xhr")), this.inOpen_ = !0, this.xhr_.open(method, url, !0), this.inOpen_ = !1
  }catch(err) {
    this.logger_.fine(this.formatMsg_("Error opening Xhr: " + err.message));
    this.error_(goog.net.ErrorCode.EXCEPTION, err);
    return
  }
  var content = opt_content || "", headers = this.headers.clone();
  opt_headers && goog.structs.forEach(opt_headers, function(value, key) {
    headers.set(key, value)
  });
  var contentIsFormData = goog.global.FormData && content instanceof goog.global.FormData;
  "POST" == method && (!headers.containsKey(goog.net.XhrIo.CONTENT_TYPE_HEADER) && !contentIsFormData) && headers.set(goog.net.XhrIo.CONTENT_TYPE_HEADER, goog.net.XhrIo.FORM_CONTENT_TYPE);
  goog.structs.forEach(headers, function(value, key) {
    this.xhr_.setRequestHeader(key, value)
  }, this);
  this.responseType_ && (this.xhr_.responseType = this.responseType_);
  goog.object.containsKey(this.xhr_, "withCredentials") && (this.xhr_.withCredentials = this.withCredentials_);
  try {
    this.timeoutId_ && (goog.Timer.defaultTimerObject.clearTimeout(this.timeoutId_), this.timeoutId_ = null), 0 < this.timeoutInterval_ && (this.logger_.fine(this.formatMsg_("Will abort after " + this.timeoutInterval_ + "ms if incomplete")), this.timeoutId_ = goog.Timer.defaultTimerObject.setTimeout(goog.bind(this.timeout_, this), this.timeoutInterval_)), this.logger_.fine(this.formatMsg_("Sending request")), this.inSend_ = !0, this.xhr_.send(content), this.inSend_ = !1
  }catch(err$$0) {
    this.logger_.fine(this.formatMsg_("Send error: " + err$$0.message)), this.error_(goog.net.ErrorCode.EXCEPTION, err$$0)
  }
};
goog.net.XhrIo.prototype.createXhr = function() {
  return this.xmlHttpFactory_ ? this.xmlHttpFactory_.createInstance() : goog.net.XmlHttp()
};
goog.net.XhrIo.prototype.timeout_ = function() {
  "undefined" != typeof goog && this.xhr_ && (this.lastError_ = "Timed out after " + this.timeoutInterval_ + "ms, aborting", this.logger_.fine(this.formatMsg_(this.lastError_)), this.dispatchEvent(goog.net.EventType.TIMEOUT), this.abort(goog.net.ErrorCode.TIMEOUT))
};
goog.net.XhrIo.prototype.error_ = function(errorCode, err) {
  this.active_ = !1;
  this.xhr_ && (this.inAbort_ = !0, this.xhr_.abort(), this.inAbort_ = !1);
  this.lastError_ = err;
  this.dispatchErrors_();
  this.cleanUpXhr_()
};
goog.net.XhrIo.prototype.dispatchErrors_ = function() {
  this.errorDispatched_ || (this.errorDispatched_ = !0, this.dispatchEvent(goog.net.EventType.COMPLETE), this.dispatchEvent(goog.net.EventType.ERROR))
};
goog.net.XhrIo.prototype.abort = function() {
  this.xhr_ && this.active_ && (this.logger_.fine(this.formatMsg_("Aborting")), this.active_ = !1, this.inAbort_ = !0, this.xhr_.abort(), this.inAbort_ = !1, this.dispatchEvent(goog.net.EventType.COMPLETE), this.dispatchEvent(goog.net.EventType.ABORT), this.cleanUpXhr_())
};
goog.net.XhrIo.prototype.disposeInternal = function() {
  this.xhr_ && (this.active_ && (this.active_ = !1, this.inAbort_ = !0, this.xhr_.abort(), this.inAbort_ = !1), this.cleanUpXhr_(!0));
  goog.net.XhrIo.superClass_.disposeInternal.call(this)
};
goog.net.XhrIo.prototype.onReadyStateChange_ = function() {
  if(!this.inOpen_ && !this.inSend_ && !this.inAbort_) {
    this.onReadyStateChangeEntryPoint_()
  }else {
    this.onReadyStateChangeHelper_()
  }
};
goog.net.XhrIo.prototype.onReadyStateChangeEntryPoint_ = function() {
  this.onReadyStateChangeHelper_()
};
goog.net.XhrIo.prototype.onReadyStateChangeHelper_ = function() {
  if(this.active_ && "undefined" != typeof goog) {
    if(this.xhrOptions_[goog.net.XmlHttp.OptionType.LOCAL_REQUEST_ERROR] && this.getReadyState() == goog.net.XmlHttp.ReadyState.COMPLETE && 2 == this.getStatus()) {
      this.logger_.fine(this.formatMsg_("Local request error detected and ignored"))
    }else {
      if(this.inSend_ && this.getReadyState() == goog.net.XmlHttp.ReadyState.COMPLETE) {
        goog.Timer.defaultTimerObject.setTimeout(goog.bind(this.onReadyStateChange_, this), 0)
      }else {
        if(this.dispatchEvent(goog.net.EventType.READY_STATE_CHANGE), this.isComplete()) {
          this.logger_.fine(this.formatMsg_("Request complete"));
          this.active_ = !1;
          try {
            this.isSuccess() ? (this.dispatchEvent(goog.net.EventType.COMPLETE), this.dispatchEvent(goog.net.EventType.SUCCESS)) : (this.lastError_ = this.getStatusText() + " [" + this.getStatus() + "]", this.dispatchErrors_())
          }finally {
            this.cleanUpXhr_()
          }
        }
      }
    }
  }
};
goog.net.XhrIo.prototype.cleanUpXhr_ = function(opt_fromDispose) {
  if(this.xhr_) {
    var xhr = this.xhr_, clearedOnReadyStateChange = this.xhrOptions_[goog.net.XmlHttp.OptionType.USE_NULL_FUNCTION] ? goog.nullFunction : null;
    this.xhrOptions_ = this.xhr_ = null;
    this.timeoutId_ && (goog.Timer.defaultTimerObject.clearTimeout(this.timeoutId_), this.timeoutId_ = null);
    opt_fromDispose || this.dispatchEvent(goog.net.EventType.READY);
    try {
      xhr.onreadystatechange = clearedOnReadyStateChange
    }catch(e) {
      this.logger_.severe("Problem encountered resetting onreadystatechange: " + e.message)
    }
  }
};
goog.net.XhrIo.prototype.isComplete = function() {
  return this.getReadyState() == goog.net.XmlHttp.ReadyState.COMPLETE
};
goog.net.XhrIo.prototype.isSuccess = function() {
  var status = this.getStatus();
  return goog.net.HttpStatus.isSuccess(status) || 0 === status && !this.isLastUriEffectiveSchemeHttp_()
};
goog.net.XhrIo.prototype.isLastUriEffectiveSchemeHttp_ = function() {
  var scheme = goog.uri.utils.getEffectiveScheme(String(this.lastUri_));
  return goog.net.XhrIo.HTTP_SCHEME_PATTERN.test(scheme)
};
goog.net.XhrIo.prototype.getReadyState = function() {
  return this.xhr_ ? this.xhr_.readyState : goog.net.XmlHttp.ReadyState.UNINITIALIZED
};
goog.net.XhrIo.prototype.getStatus = function() {
  try {
    return this.getReadyState() > goog.net.XmlHttp.ReadyState.LOADED ? this.xhr_.status : -1
  }catch(e) {
    return this.logger_.warning("Can not get status: " + e.message), -1
  }
};
goog.net.XhrIo.prototype.getStatusText = function() {
  try {
    return this.getReadyState() > goog.net.XmlHttp.ReadyState.LOADED ? this.xhr_.statusText : ""
  }catch(e) {
    return this.logger_.fine("Can not get status: " + e.message), ""
  }
};
goog.net.XhrIo.prototype.getResponseText = function() {
  try {
    return this.xhr_ ? this.xhr_.responseText : ""
  }catch(e) {
    return this.logger_.fine("Can not get responseText: " + e.message), ""
  }
};
goog.net.XhrIo.prototype.formatMsg_ = function(msg) {
  return msg + " [" + this.lastMethod_ + " " + this.lastUri_ + " " + this.getStatus() + "]"
};
goog.debug.entryPointRegistry.register(function(transformer) {
  goog.net.XhrIo.prototype.onReadyStateChangeEntryPoint_ = transformer(goog.net.XhrIo.prototype.onReadyStateChangeEntryPoint_)
});
goog.Uri = function(opt_uri, opt_ignoreCase) {
  var m;
  opt_uri instanceof goog.Uri ? (this.ignoreCase_ = goog.isDef(opt_ignoreCase) ? opt_ignoreCase : opt_uri.getIgnoreCase(), this.setScheme(opt_uri.getScheme()), this.setUserInfo(opt_uri.getUserInfo()), this.setDomain(opt_uri.getDomain()), this.setPort(opt_uri.getPort()), this.setPath(opt_uri.getPath()), this.setQueryData(opt_uri.getQueryData().clone()), this.setFragment(opt_uri.getFragment())) : opt_uri && (m = goog.uri.utils.split(String(opt_uri))) ? (this.ignoreCase_ = !!opt_ignoreCase, this.setScheme(m[goog.uri.utils.ComponentIndex.SCHEME] || 
  "", !0), this.setUserInfo(m[goog.uri.utils.ComponentIndex.USER_INFO] || "", !0), this.setDomain(m[goog.uri.utils.ComponentIndex.DOMAIN] || "", !0), this.setPort(m[goog.uri.utils.ComponentIndex.PORT]), this.setPath(m[goog.uri.utils.ComponentIndex.PATH] || "", !0), this.setQueryData(m[goog.uri.utils.ComponentIndex.QUERY_DATA] || "", !0), this.setFragment(m[goog.uri.utils.ComponentIndex.FRAGMENT] || "", !0)) : (this.ignoreCase_ = !!opt_ignoreCase, this.queryData_ = new goog.Uri.QueryData(null, null, 
  this.ignoreCase_))
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
  if(domain) {
    out.push("//");
    var userInfo = this.getUserInfo();
    userInfo && out.push(goog.Uri.encodeSpecialChars_(userInfo, goog.Uri.reDisallowedInSchemeOrUserInfo_), "@");
    out.push(goog.string.urlEncode(domain));
    var port = this.getPort();
    null != port && out.push(":", String(port))
  }
  var path = this.getPath();
  path && (this.hasDomain() && "/" != path.charAt(0) && out.push("/"), out.push(goog.Uri.encodeSpecialChars_(path, "/" == path.charAt(0) ? goog.Uri.reDisallowedInAbsolutePath_ : goog.Uri.reDisallowedInRelativePath_)));
  var query = this.getEncodedQuery();
  query && out.push("?", query);
  var fragment = this.getFragment();
  fragment && out.push("#", goog.Uri.encodeSpecialChars_(fragment, goog.Uri.reDisallowedInFragment_));
  return out.join("")
};
goog.Uri.prototype.resolve = function(relativeUri) {
  var absoluteUri = this.clone(), overridden = relativeUri.hasScheme();
  overridden ? absoluteUri.setScheme(relativeUri.getScheme()) : overridden = relativeUri.hasUserInfo();
  overridden ? absoluteUri.setUserInfo(relativeUri.getUserInfo()) : overridden = relativeUri.hasDomain();
  overridden ? absoluteUri.setDomain(relativeUri.getDomain()) : overridden = relativeUri.hasPort();
  var path = relativeUri.getPath();
  if(overridden) {
    absoluteUri.setPort(relativeUri.getPort())
  }else {
    if(overridden = relativeUri.hasPath()) {
      if("/" != path.charAt(0)) {
        if(this.hasDomain() && !this.hasPath()) {
          path = "/" + path
        }else {
          var lastSlashIndex = absoluteUri.getPath().lastIndexOf("/");
          -1 != lastSlashIndex && (path = absoluteUri.getPath().substr(0, lastSlashIndex + 1) + path)
        }
      }
      path = goog.Uri.removeDotSegments(path)
    }
  }
  overridden ? absoluteUri.setPath(path) : overridden = relativeUri.hasQuery();
  overridden ? absoluteUri.setQueryData(relativeUri.getDecodedQuery()) : overridden = relativeUri.hasFragment();
  overridden && absoluteUri.setFragment(relativeUri.getFragment());
  return absoluteUri
};
goog.Uri.prototype.clone = function() {
  return new goog.Uri(this)
};
goog.Uri.prototype.getScheme = function() {
  return this.scheme_
};
goog.Uri.prototype.setScheme = function(newScheme, opt_decode) {
  this.enforceReadOnly();
  if(this.scheme_ = opt_decode ? goog.Uri.decodeOrEmpty_(newScheme) : newScheme) {
    this.scheme_ = this.scheme_.replace(/:$/, "")
  }
  return this
};
goog.Uri.prototype.hasScheme = function() {
  return!!this.scheme_
};
goog.Uri.prototype.getUserInfo = function() {
  return this.userInfo_
};
goog.Uri.prototype.setUserInfo = function(newUserInfo, opt_decode) {
  this.enforceReadOnly();
  this.userInfo_ = opt_decode ? goog.Uri.decodeOrEmpty_(newUserInfo) : newUserInfo;
  return this
};
goog.Uri.prototype.hasUserInfo = function() {
  return!!this.userInfo_
};
goog.Uri.prototype.getDomain = function() {
  return this.domain_
};
goog.Uri.prototype.setDomain = function(newDomain, opt_decode) {
  this.enforceReadOnly();
  this.domain_ = opt_decode ? goog.Uri.decodeOrEmpty_(newDomain) : newDomain;
  return this
};
goog.Uri.prototype.hasDomain = function() {
  return!!this.domain_
};
goog.Uri.prototype.getPort = function() {
  return this.port_
};
goog.Uri.prototype.setPort = function(newPort) {
  this.enforceReadOnly();
  if(newPort) {
    newPort = Number(newPort);
    if(isNaN(newPort) || 0 > newPort) {
      throw Error("Bad port number " + newPort);
    }
    this.port_ = newPort
  }else {
    this.port_ = null
  }
  return this
};
goog.Uri.prototype.hasPort = function() {
  return null != this.port_
};
goog.Uri.prototype.getPath = function() {
  return this.path_
};
goog.Uri.prototype.setPath = function(newPath, opt_decode) {
  this.enforceReadOnly();
  this.path_ = opt_decode ? goog.Uri.decodeOrEmpty_(newPath) : newPath;
  return this
};
goog.Uri.prototype.hasPath = function() {
  return!!this.path_
};
goog.Uri.prototype.hasQuery = function() {
  return"" !== this.queryData_.toString()
};
goog.Uri.prototype.setQueryData = function(queryData, opt_decode) {
  this.enforceReadOnly();
  queryData instanceof goog.Uri.QueryData ? (this.queryData_ = queryData, this.queryData_.setIgnoreCase(this.ignoreCase_)) : (opt_decode || (queryData = goog.Uri.encodeSpecialChars_(queryData, goog.Uri.reDisallowedInQuery_)), this.queryData_ = new goog.Uri.QueryData(queryData, null, this.ignoreCase_));
  return this
};
goog.Uri.prototype.getEncodedQuery = function() {
  return this.queryData_.toString()
};
goog.Uri.prototype.getDecodedQuery = function() {
  return this.queryData_.toDecodedString()
};
goog.Uri.prototype.getQueryData = function() {
  return this.queryData_
};
goog.Uri.prototype.setParameterValue = function(key, value) {
  this.enforceReadOnly();
  this.queryData_.set(key, value);
  return this
};
goog.Uri.prototype.getFragment = function() {
  return this.fragment_
};
goog.Uri.prototype.setFragment = function(newFragment, opt_decode) {
  this.enforceReadOnly();
  this.fragment_ = opt_decode ? goog.Uri.decodeOrEmpty_(newFragment) : newFragment;
  return this
};
goog.Uri.prototype.hasFragment = function() {
  return!!this.fragment_
};
goog.Uri.prototype.makeUnique = function() {
  this.enforceReadOnly();
  this.setParameterValue(goog.Uri.RANDOM_PARAM, goog.string.getRandomString());
  return this
};
goog.Uri.prototype.enforceReadOnly = function() {
  if(this.isReadOnly_) {
    throw Error("Tried to modify a read-only Uri");
  }
};
goog.Uri.prototype.setIgnoreCase = function(ignoreCase) {
  this.ignoreCase_ = ignoreCase;
  this.queryData_ && this.queryData_.setIgnoreCase(ignoreCase);
  return this
};
goog.Uri.prototype.getIgnoreCase = function() {
  return this.ignoreCase_
};
goog.Uri.parse = function(uri, opt_ignoreCase) {
  return uri instanceof goog.Uri ? uri.clone() : new goog.Uri(uri, opt_ignoreCase)
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
  return uri
};
goog.Uri.resolve = function(base, rel) {
  base instanceof goog.Uri || (base = goog.Uri.parse(base));
  rel instanceof goog.Uri || (rel = goog.Uri.parse(rel));
  return base.resolve(rel)
};
goog.Uri.removeDotSegments = function(path) {
  if(".." == path || "." == path) {
    return""
  }
  if(!goog.string.contains(path, "./") && !goog.string.contains(path, "/.")) {
    return path
  }
  for(var leadingSlash = goog.string.startsWith(path, "/"), segments = path.split("/"), out = [], pos = 0;pos < segments.length;) {
    var segment = segments[pos++];
    "." == segment ? leadingSlash && pos == segments.length && out.push("") : ".." == segment ? ((1 < out.length || 1 == out.length && "" != out[0]) && out.pop(), leadingSlash && pos == segments.length && out.push("")) : (out.push(segment), leadingSlash = !0)
  }
  return out.join("/")
};
goog.Uri.decodeOrEmpty_ = function(val) {
  return val ? decodeURIComponent(val) : ""
};
goog.Uri.encodeSpecialChars_ = function(unescapedPart, extra) {
  return goog.isString(unescapedPart) ? encodeURI(unescapedPart).replace(extra, goog.Uri.encodeChar_) : null
};
goog.Uri.encodeChar_ = function(ch) {
  var n = ch.charCodeAt(0);
  return"%" + (n >> 4 & 15).toString(16) + (n & 15).toString(16)
};
goog.Uri.reDisallowedInSchemeOrUserInfo_ = /[#\/\?@]/g;
goog.Uri.reDisallowedInRelativePath_ = /[\#\?:]/g;
goog.Uri.reDisallowedInAbsolutePath_ = /[\#\?]/g;
goog.Uri.reDisallowedInQuery_ = /[\#\?@]/g;
goog.Uri.reDisallowedInFragment_ = /#/g;
goog.Uri.haveSameDomain = function(uri1String, uri2String) {
  var pieces1 = goog.uri.utils.split(uri1String), pieces2 = goog.uri.utils.split(uri2String);
  return pieces1[goog.uri.utils.ComponentIndex.DOMAIN] == pieces2[goog.uri.utils.ComponentIndex.DOMAIN] && pieces1[goog.uri.utils.ComponentIndex.PORT] == pieces2[goog.uri.utils.ComponentIndex.PORT]
};
goog.Uri.QueryData = function(opt_query, opt_uri, opt_ignoreCase) {
  this.encodedQuery_ = opt_query || null;
  this.ignoreCase_ = !!opt_ignoreCase
};
goog.Uri.QueryData.prototype.ensureKeyMapInitialized_ = function() {
  if(!this.keyMap_ && (this.keyMap_ = new goog.structs.Map, this.count_ = 0, this.encodedQuery_)) {
    for(var pairs = this.encodedQuery_.split("&"), i = 0;i < pairs.length;i++) {
      var indexOfEquals = pairs[i].indexOf("="), name = null, value = null;
      0 <= indexOfEquals ? (name = pairs[i].substring(0, indexOfEquals), value = pairs[i].substring(indexOfEquals + 1)) : name = pairs[i];
      name = goog.string.urlDecode(name);
      name = this.getKeyName_(name);
      this.add(name, value ? goog.string.urlDecode(value) : "")
    }
  }
};
goog.Uri.QueryData.createFromMap = function(map, opt_uri, opt_ignoreCase) {
  var keys = goog.structs.getKeys(map);
  if("undefined" == typeof keys) {
    throw Error("Keys are undefined");
  }
  for(var queryData = new goog.Uri.QueryData(null, null, opt_ignoreCase), values = goog.structs.getValues(map), i = 0;i < keys.length;i++) {
    var key = keys[i], value = values[i];
    goog.isArray(value) ? queryData.setValues(key, value) : queryData.add(key, value)
  }
  return queryData
};
goog.Uri.QueryData.createFromKeysValues = function(keys, values, opt_uri, opt_ignoreCase) {
  if(keys.length != values.length) {
    throw Error("Mismatched lengths for keys/values");
  }
  for(var queryData = new goog.Uri.QueryData(null, null, opt_ignoreCase), i = 0;i < keys.length;i++) {
    queryData.add(keys[i], values[i])
  }
  return queryData
};
goog.Uri.QueryData.prototype.keyMap_ = null;
goog.Uri.QueryData.prototype.count_ = null;
goog.Uri.QueryData.prototype.getCount = function() {
  this.ensureKeyMapInitialized_();
  return this.count_
};
goog.Uri.QueryData.prototype.add = function(key, value) {
  this.ensureKeyMapInitialized_();
  this.invalidateCache_();
  key = this.getKeyName_(key);
  var values = this.keyMap_.get(key);
  values || this.keyMap_.set(key, values = []);
  values.push(value);
  this.count_++;
  return this
};
goog.Uri.QueryData.prototype.remove = function(key) {
  this.ensureKeyMapInitialized_();
  key = this.getKeyName_(key);
  return this.keyMap_.containsKey(key) ? (this.invalidateCache_(), this.count_ -= this.keyMap_.get(key).length, this.keyMap_.remove(key)) : !1
};
goog.Uri.QueryData.prototype.clear = function() {
  this.invalidateCache_();
  this.keyMap_ = null;
  this.count_ = 0
};
goog.Uri.QueryData.prototype.isEmpty = function() {
  this.ensureKeyMapInitialized_();
  return 0 == this.count_
};
goog.Uri.QueryData.prototype.containsKey = function(key) {
  this.ensureKeyMapInitialized_();
  key = this.getKeyName_(key);
  return this.keyMap_.containsKey(key)
};
goog.Uri.QueryData.prototype.containsValue = function(value) {
  var vals = this.getValues();
  return goog.array.contains(vals, value)
};
goog.Uri.QueryData.prototype.getKeys = function() {
  this.ensureKeyMapInitialized_();
  for(var vals = this.keyMap_.getValues(), keys = this.keyMap_.getKeys(), rv = [], i = 0;i < keys.length;i++) {
    for(var val = vals[i], j = 0;j < val.length;j++) {
      rv.push(keys[i])
    }
  }
  return rv
};
goog.Uri.QueryData.prototype.getValues = function(opt_key) {
  this.ensureKeyMapInitialized_();
  var rv = [];
  if(opt_key) {
    this.containsKey(opt_key) && (rv = goog.array.concat(rv, this.keyMap_.get(this.getKeyName_(opt_key))))
  }else {
    for(var values = this.keyMap_.getValues(), i = 0;i < values.length;i++) {
      rv = goog.array.concat(rv, values[i])
    }
  }
  return rv
};
goog.Uri.QueryData.prototype.set = function(key, value) {
  this.ensureKeyMapInitialized_();
  this.invalidateCache_();
  key = this.getKeyName_(key);
  this.containsKey(key) && (this.count_ -= this.keyMap_.get(key).length);
  this.keyMap_.set(key, [value]);
  this.count_++;
  return this
};
goog.Uri.QueryData.prototype.get = function(key, opt_default) {
  var values = key ? this.getValues(key) : [];
  return goog.Uri.preserveParameterTypesCompatibilityFlag ? 0 < values.length ? values[0] : opt_default : 0 < values.length ? String(values[0]) : opt_default
};
goog.Uri.QueryData.prototype.setValues = function(key, values) {
  this.remove(key);
  0 < values.length && (this.invalidateCache_(), this.keyMap_.set(this.getKeyName_(key), goog.array.clone(values)), this.count_ += values.length)
};
goog.Uri.QueryData.prototype.toString = function() {
  if(this.encodedQuery_) {
    return this.encodedQuery_
  }
  if(!this.keyMap_) {
    return""
  }
  for(var sb = [], keys = this.keyMap_.getKeys(), i = 0;i < keys.length;i++) {
    for(var key = keys[i], encodedKey = goog.string.urlEncode(key), val = this.getValues(key), j = 0;j < val.length;j++) {
      var param = encodedKey;
      "" !== val[j] && (param += "=" + goog.string.urlEncode(val[j]));
      sb.push(param)
    }
  }
  return this.encodedQuery_ = sb.join("&")
};
goog.Uri.QueryData.prototype.toDecodedString = function() {
  return goog.Uri.decodeOrEmpty_(this.toString())
};
goog.Uri.QueryData.prototype.invalidateCache_ = function() {
  this.encodedQuery_ = null
};
goog.Uri.QueryData.prototype.clone = function() {
  var rv = new goog.Uri.QueryData;
  rv.encodedQuery_ = this.encodedQuery_;
  this.keyMap_ && (rv.keyMap_ = this.keyMap_.clone(), rv.count_ = this.count_);
  return rv
};
goog.Uri.QueryData.prototype.getKeyName_ = function(arg) {
  var keyName = String(arg);
  this.ignoreCase_ && (keyName = keyName.toLowerCase());
  return keyName
};
goog.Uri.QueryData.prototype.setIgnoreCase = function(ignoreCase) {
  ignoreCase && !this.ignoreCase_ && (this.ensureKeyMapInitialized_(), this.invalidateCache_(), goog.structs.forEach(this.keyMap_, function(value, key) {
    var lowerCase = key.toLowerCase();
    key != lowerCase && (this.remove(key), this.setValues(lowerCase, value))
  }, this));
  this.ignoreCase_ = ignoreCase
};
goog.Uri.QueryData.prototype.extend = function(var_args) {
  for(var i = 0;i < arguments.length;i++) {
    goog.structs.forEach(arguments[i], function(value, key) {
      this.add(key, value)
    }, this)
  }
};
var ee = {initialize:function(opt_baseurl, opt_tileurl, opt_callback) {
  if(!(ee.ready_ == ee.InitState.READY && !opt_baseurl && !opt_tileurl)) {
    if(ee.ready() == ee.InitState.LOADING) {
      throw Error("Already loading.");
    }
    ee.ready_ = ee.InitState.LOADING;
    ee.url_base_ = opt_baseurl || "/api";
    ee.tile_base_ = opt_tileurl || "https://earthengine.googleapis.com";
    var finish = function() {
      ee.Algorithms.addFunctions(ee.Image, "Image");
      ee.Algorithms.addFunctions(ee.Feature, "Feature");
      ee.Algorithms.addFunctions(ee.FeatureCollection, "FeatureCollection");
      ee.Algorithms.addFunctions(ee.Image, "Window", "focal_");
      ee.Algorithms.addFunctions(ee.ImageCollection, "ImageCollection");
      ee.Algorithms.addFunctions(ee.ImageCollection, "reduce");
      ee.Algorithms.addFunctions(ee.Collection, "Collection");
      ee.Algorithms.addFunctions(ee.Collection, "AggregateFeatureCollection", "aggregate_", ee.Algorithms.makeAggregateFunction);
      ee.Algorithms.addFunctions(ee.ImageCollection, "Image", "map_", ee.Algorithms.makeMapFunction);
      ee.Algorithms.addFunctions(ee.FeatureCollection, "Feature", "map_", ee.Algorithms.makeMapFunction);
      ee.ready_ = ee.InitState.READY;
      opt_callback && opt_callback()
    };
    if(opt_callback) {
      ee.Algorithms.init(finish)
    }else {
      try {
        ee.Algorithms.init(), finish()
      }catch(e) {
        alert("Could not read algorithm list.")
      }
    }
  }
}, InitState:{NOT_READY:"not_ready", LOADING:"loading", READY:"ready"}};
ee.ready_ = ee.InitState.NOT_READY;
ee.url_base_ = null;
ee.tile_base_ = null;
ee.TILE_SIZE = 256;
ee.ready = function() {
  return ee.ready_
};
ee.call = function(name, var_args) {
  if(goog.isString(name)) {
    var algorithm = ee.Algorithms.get(name), argsIn = Array.prototype.slice.call(arguments, 1);
    return ee.Algorithms.applySignature_(algorithm, argsIn, {})
  }
  var argNames = name.args;
  if(!argNames || argNames.length > arguments.length - 1) {
    throw Error("Missing lambda arguments: " + argNames.slice(arguments.length - 1));
  }
  for(var applied = {algorithm:name}, i = 1;i < arguments.length;i++) {
    applied[argNames[i - 1]] = arguments[i]
  }
  return applied
};
ee.apply = function(name, namedArgs) {
  if(goog.isString(name)) {
    var algorithm = ee.Algorithms.get(name);
    return ee.Algorithms.applySignature_(algorithm, [], namedArgs)
  }
  var applied = goog.object.clone(namedArgs);
  applied.algorithm = name;
  return applied
};
ee.variable = function(type, name) {
  var placeholder = {description_:{type:"Variable", name:name}};
  placeholder.__proto__ = type.prototype;
  return placeholder
};
ee.lambda = function(args, body) {
  return{type:"Algorithm", args:args, body:body}
};
goog.exportSymbol("ee.initialize", ee.initialize);
goog.exportSymbol("ee.InitState", ee.InitState);
goog.exportSymbol("ee.InitState.NOT_READY", ee.InitState.NOT_READY);
goog.exportSymbol("ee.InitState.LOADING", ee.InitState.LOADING);
goog.exportSymbol("ee.InitState.READY", ee.InitState.READY);
goog.exportSymbol("ee.ready", ee.ready);
goog.exportSymbol("ee.call", ee.call);
goog.exportSymbol("ee.apply", ee.apply);
goog.exportSymbol("ee.variable", ee.variable);
goog.exportSymbol("ee.lambda", ee.lambda);
goog.exportSymbol("ee.TILE_SIZE", ee.TILE_SIZE);
ee.data = function() {
};
ee.data.getInfo = function(id, opt_callback) {
  return ee.data.send_("/info", (new goog.Uri.QueryData).add("id", id), opt_callback)
};
ee.data.getList = function(id, opt_callback) {
  return ee.data.send_("/list", (new goog.Uri.QueryData).add("id", id), opt_callback)
};
ee.data.getMapId = function(params, opt_callback) {
  return ee.data.send_("/mapid", ee.data.makeRequest_(params), opt_callback)
};
ee.data.getTileUrl = function(mapid, x, y, z) {
  var width = Math.pow(2, z);
  x %= width;
  0 > x && (x += width);
  return[ee.tile_base_, "map", mapid.mapid, z, x, y].join("/") + "?token=" + mapid.token
};
ee.data.getValue = function(params, opt_callback) {
  return ee.data.send_("/value", ee.data.makeRequest_(params), opt_callback)
};
ee.data.getThumbId = function(params, opt_callback) {
  var request = ee.data.makeRequest_(params).add("getid", "1");
  return ee.data.send_("/thumb", request, opt_callback)
};
ee.data.getDownloadId = function(params, opt_callback) {
  return ee.data.send_("/download", ee.data.makeRequest_(params), opt_callback)
};
ee.data.makeDownloadUrl = function(id) {
  return ee.url_base_ + "/download?docid=" + id.docid + "&token=" + id.token
};
ee.data.getAlgorithms = function(opt_callback) {
  return ee.data.send_("/algorithms", ee.data.makeRequest_({}), opt_callback, "GET")
};
ee.data.send_ = function(path, params, opt_callback$$0, opt_method) {
  function handleResponse(responseText, opt_callback) {
    var jsonIsInvalid = !1;
    try {
      var response = goog.json.parse(responseText), data = response.data, error = response.error
    }catch(e) {
      jsonIsInvalid = !0
    }
    var errorMessage = void 0;
    jsonIsInvalid || !data && !error ? errorMessage = "Malformed request: " + responseText : error && (errorMessage = response.error.message);
    if(opt_callback) {
      opt_callback(data, errorMessage)
    }else {
      if(!errorMessage) {
        return data
      }
      throw Error(errorMessage);
    }
  }
  opt_method = opt_method || "POST";
  var url = ee.url_base_ + path, requestData = params ? params.toString() : "";
  if(opt_callback$$0) {
    goog.net.XhrIo.send(url, function(e) {
      return handleResponse(e.target.getResponseText(), opt_callback$$0)
    }, opt_method, requestData)
  }else {
    var xmlhttp = goog.net.XmlHttp();
    xmlhttp.open(opt_method, url, !1);
    xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xmlhttp.send(requestData);
    return handleResponse(xmlhttp.responseText, null)
  }
};
ee.data.makeRequest_ = function(params) {
  var request = new goog.Uri.QueryData, item;
  for(item in params) {
    request.set(item, params[item])
  }
  return request
};
ee.data.setupMockSend = function(opt_calls) {
  var calls = opt_calls || {};
  goog.net.XhrIo.send = function(url, callback, method, data) {
    var e = new function() {
    };
    e.target = {};
    e.target.getResponseText = function() {
      return url in calls ? goog.isString(calls[url]) ? calls[url] : calls[url](url, callback, method, data) : '{"error": {}}'
    };
    setTimeout(goog.bind(callback, e, e), 0)
  };
  var fakeXmlHttp = function() {
  };
  fakeXmlHttp.prototype.open = function(method, urlIn) {
    this.url = urlIn;
    this.method = method
  };
  fakeXmlHttp.prototype.setRequestHeader = function() {
  };
  fakeXmlHttp.prototype.send = function(data) {
    this.responseText = this.url in calls ? goog.isString(calls[this.url]) ? calls[this.url] : calls[this.url](this.url, this.method, data) : goog.json.serialize({data:{url:this.url, method:this.method, data:data}})
  };
  goog.net.XmlHttp = function() {
    return new fakeXmlHttp
  }
};
ee.data.parse = function(str) {
  return goog.json.parse(str)
};
goog.exportSymbol("ee.data", ee.data);
goog.exportSymbol("ee.data.getInfo", ee.data.getInfo);
goog.exportSymbol("ee.data.getList", ee.data.getList);
goog.exportSymbol("ee.data.getMapId", ee.data.getMapId);
goog.exportSymbol("ee.data.getValue", ee.data.getValue);
goog.exportSymbol("ee.data.getThumbId", ee.data.getThumbId);
goog.exportSymbol("ee.data.getDownloadId", ee.data.getDownloadId);
goog.exportSymbol("ee.data.makeDownloadUrl", ee.data.makeDownloadUrl);
goog.exportSymbol("ee.data.send_", ee.data.send_);
goog.exportSymbol("ee.data.setupMockSend", ee.data.setupMockSend);
goog.exportSymbol("ee.data.parse", ee.data.parse);
ee.Serializer = function(opt_replace) {
  goog.json.Serializer.call(this, opt_replace)
};
goog.inherits(ee.Serializer, goog.json.Serializer);
ee.Serializer.toJSON = function(obj) {
  return(new ee.Serializer).serialize(obj)
};
ee.Serializer.toReadableJSON = function(obj) {
  var json = ee.Serializer.toJSON(obj);
  return"JSON" in window ? window.JSON.stringify(window.JSON.parse(json), null, "  ") : json
};
ee.Serializer.prototype.serializeObject_ = function(obj, sb) {
  "serialize" in obj ? sb.push(obj.serialize()) : ee.Serializer.superClass_.serializeObject_.call(this, obj, sb)
};
goog.exportSymbol("ee.Serializer", ee.Serializer);
goog.exportSymbol("ee.Serializer.toJSON", ee.Serializer.toJSON);
goog.exportSymbol("ee.Serializer.toReadableJSON", ee.Serializer.toReadableJSON);
ee.Filter = function(newFilter) {
  if(!(this instanceof ee.Filter)) {
    return new ee.Filter(newFilter)
  }
  ee.initialize();
  if(newFilter instanceof ee.Filter) {
    return newFilter
  }
  this.filter_ = newFilter instanceof Array ? newFilter : newFilter ? [newFilter] : []
};
ee.Filter.Operators = {EQUALS:"equals", NOT_EQUALS:"not_equals", LESS_THAN:"less_than", LESS_THAN_OR_EQUAL:"not_greater_than", GREATER_THAN:"greater_than", GREATER_THAN_OR_EQUAL:"not_less_than", CONTAINS:"contains", NOT_CONTAINS:"not_contains", STARTS_WITH:"starts_with", NOT_STARTS_WITH:"not_starts_with", ENDS_WITH:"ends_with", NOT_ENDS_WITH:"not_ends_with", OR:"or", AND:"and"};
ee.Filter.prototype.length = function() {
  return this.filter_.length
};
ee.Filter.prototype.append_ = function(newFilter) {
  var prev = this.filter_.slice(0);
  newFilter instanceof ee.Filter ? goog.array.extend(prev, newFilter.filter_) : newFilter instanceof Array ? goog.array.extend(prev, newFilter) : prev.push(newFilter);
  return new ee.Filter(prev)
};
ee.Filter.metadata_ = function(name, operator, value) {
  return new ee.Filter(goog.object.create("property", name, operator, value))
};
ee.Filter.eq = function(name, value) {
  return ee.Filter.metadata_(name, ee.Filter.Operators.EQUALS, value)
};
ee.Filter.neq = function(name, value) {
  return ee.Filter.metadata_(name, ee.Filter.Operators.NOT_EQUALS, value)
};
ee.Filter.lt = function(name, value) {
  return ee.Filter.metadata_(name, ee.Filter.Operators.LESS_THAN, value)
};
ee.Filter.gte = function(name, value) {
  return ee.Filter.metadata_(name, ee.Filter.Operators.GREATER_THAN_OR_EQUAL, value)
};
ee.Filter.gt = function(name, value) {
  return ee.Filter.metadata_(name, ee.Filter.Operators.GREATER_THAN, value)
};
ee.Filter.lte = function(name, value) {
  return ee.Filter.metadata_(name, ee.Filter.Operators.LESS_THAN_OR_EQUAL, value)
};
ee.Filter.contains = function(name, value) {
  return ee.Filter.metadata_(name, ee.Filter.Operators.CONTAINS, value)
};
ee.Filter.not_contains = function(name, value) {
  return ee.Filter.metadata_(name, ee.Filter.Operators.NOT_CONTAINS, value)
};
ee.Filter.starts_with = function(name, value) {
  return ee.Filter.metadata_(name, ee.Filter.Operators.STARTS_WITH, value)
};
ee.Filter.not_starts_with = function(name, value) {
  return ee.Filter.metadata_(name, ee.Filter.Operators.NOT_STARTS_WITH, value)
};
ee.Filter.ends_with = function(name, value) {
  return ee.Filter.metadata_(name, ee.Filter.Operators.ENDS_WITH, value)
};
ee.Filter.not_ends_with = function(name, value) {
  return ee.Filter.metadata_(name, ee.Filter.Operators.NOT_ENDS_WITH, value)
};
ee.Filter.and = function(var_args) {
  var args = Array.prototype.slice.call(arguments);
  return new ee.Filter({and:args})
};
ee.Filter.or = function(var_args) {
  var args = Array.prototype.slice.call(arguments);
  return new ee.Filter({or:args})
};
ee.Filter.date = function(start, opt_end) {
  var normalizeDate = function(d) {
    return d instanceof Date ? d.getTime() : "string" == typeof d ? (new Date(d)).getTime() : d
  }, newFilter = {property:"system:time_start", not_less_than:normalizeDate(start)};
  opt_end && (newFilter = [newFilter, {property:"system:time_start", not_greater_than:normalizeDate(opt_end)}]);
  return new ee.Filter(newFilter)
};
ee.Filter.bounds = function(geometry) {
  geometry instanceof ee.FeatureCollection && (geometry = {algorithm:"ExtractGeometry", collection:geometry});
  return new ee.Filter({geometry:geometry})
};
ee.Filter.prototype.eq = function() {
  return this.append_(ee.Filter.eq.apply(null, [].slice.call(arguments)))
};
ee.Filter.prototype.neq = function() {
  return this.append_(ee.Filter.neq.apply(null, [].slice.call(arguments)))
};
ee.Filter.prototype.lt = function() {
  return this.append_(ee.Filter.lt.apply(null, [].slice.call(arguments)))
};
ee.Filter.prototype.gte = function() {
  return this.append_(ee.Filter.gte.apply(null, [].slice.call(arguments)))
};
ee.Filter.prototype.gt = function() {
  return this.append_(ee.Filter.gt.apply(null, [].slice.call(arguments)))
};
ee.Filter.prototype.lte = function() {
  return this.append_(ee.Filter.lte.apply(null, [].slice.call(arguments)))
};
ee.Filter.prototype.contains = function() {
  return this.append_(ee.Filter.contains.apply(null, [].slice.call(arguments)))
};
ee.Filter.prototype.not_contains = function() {
  return this.append_(ee.Filter.not_contains.apply(null, [].slice.call(arguments)))
};
ee.Filter.prototype.starts_with = function() {
  return this.append_(ee.Filter.starts_with.apply(null, [].slice.call(arguments)))
};
ee.Filter.prototype.not_starts_with = function() {
  return this.append_(ee.Filter.not_starts_with.apply(null, [].slice.call(arguments)))
};
ee.Filter.prototype.ends_with = function() {
  return this.append_(ee.Filter.ends_with.apply(null, [].slice.call(arguments)))
};
ee.Filter.prototype.not_ends_with = function() {
  return this.append_(ee.Filter.not_ends_with.apply(null, [].slice.call(arguments)))
};
ee.Filter.prototype.and = function() {
  return this.append_(ee.Filter.and.apply(null, [].slice.call(arguments)))
};
ee.Filter.prototype.date = function() {
  return this.append_(ee.Filter.date.apply(null, [].slice.call(arguments)))
};
ee.Filter.prototype.bounds = function() {
  return this.append_(ee.Filter.bounds.apply(null, [].slice.call(arguments)))
};
ee.Filter.prototype.serialize = function() {
  return ee.Serializer.toJSON(this.filter_)
};
ee.Filter.prototype.toString = function() {
  return"ee.Filter(" + ee.Serializer.toReadableJSON(this.filter_) + ")"
};
goog.exportSymbol("ee.Filter", ee.Filter);
goog.exportProperty(ee.Filter.prototype, "length", ee.Filter.prototype.length);
goog.exportProperty(ee.Filter.prototype, "and", ee.Filter.prototype.and);
goog.exportProperty(ee.Filter.prototype, "eq", ee.Filter.prototype.eq);
goog.exportProperty(ee.Filter.prototype, "neq", ee.Filter.prototype.neq);
goog.exportProperty(ee.Filter.prototype, "lt", ee.Filter.prototype.lt);
goog.exportProperty(ee.Filter.prototype, "gte", ee.Filter.prototype.gte);
goog.exportProperty(ee.Filter.prototype, "gt", ee.Filter.prototype.gt);
goog.exportProperty(ee.Filter.prototype, "lte", ee.Filter.prototype.lte);
goog.exportProperty(ee.Filter.prototype, "contains", ee.Filter.prototype.contains);
goog.exportProperty(ee.Filter.prototype, "not_contains", ee.Filter.prototype.not_contains);
goog.exportProperty(ee.Filter.prototype, "starts_with", ee.Filter.prototype.starts_with);
goog.exportProperty(ee.Filter.prototype, "not_starts_with", ee.Filter.prototype.not_starts_with);
goog.exportProperty(ee.Filter.prototype, "ends_with", ee.Filter.prototype.ends_with);
goog.exportProperty(ee.Filter.prototype, "not_ends_with", ee.Filter.prototype.not_ends_with);
goog.exportProperty(ee.Filter.prototype, "bounds", ee.Filter.prototype.bounds);
goog.exportProperty(ee.Filter.prototype, "date", ee.Filter.prototype.date);
goog.exportProperty(ee.Filter.prototype, "serialize", ee.Filter.prototype.serialize);
goog.exportProperty(ee.Filter.prototype, "toString", ee.Filter.prototype.toString);
goog.exportProperty(ee.Filter, "and", ee.Filter.and);
goog.exportProperty(ee.Filter, "or", ee.Filter.or);
goog.exportProperty(ee.Filter, "eq", ee.Filter.eq);
goog.exportProperty(ee.Filter, "neq", ee.Filter.neq);
goog.exportProperty(ee.Filter, "lt", ee.Filter.lt);
goog.exportProperty(ee.Filter, "gte", ee.Filter.gte);
goog.exportProperty(ee.Filter, "gt", ee.Filter.gt);
goog.exportProperty(ee.Filter, "lte", ee.Filter.lte);
goog.exportProperty(ee.Filter, "contains", ee.Filter.contains);
goog.exportProperty(ee.Filter, "not_contains", ee.Filter.not_contains);
goog.exportProperty(ee.Filter, "starts_with", ee.Filter.starts_with);
goog.exportProperty(ee.Filter, "not_starts_with", ee.Filter.not_starts_with);
goog.exportProperty(ee.Filter, "ends_with", ee.Filter.ends_with);
goog.exportProperty(ee.Filter, "not_ends_with", ee.Filter.not_ends_with);
goog.exportProperty(ee.Filter, "bounds", ee.Filter.bounds);
goog.exportProperty(ee.Filter, "date", ee.Filter.date);
ee.Collection = function(args) {
  this.description_ = args
};
ee.Collection.prototype.filter = function(newFilter) {
  if(!newFilter) {
    throw Error("Empty filters.");
  }
  var description;
  ee.Collection.isFilterFeatureCollection_(this) ? (description = this.description_.collection, newFilter = this.description_.filters.append_(newFilter)) : description = this.description_;
  return new this.constructor({algorithm:"FilterFeatureCollection", collection:description, filters:newFilter})
};
ee.Collection.isFilterFeatureCollection_ = function(collection) {
  return"FilterFeatureCollection" == collection.description_.algorithm
};
ee.Collection.prototype.filterMetadata = function(name, operator, value) {
  return this.filter(ee.Filter.metadata_(name, operator, value))
};
ee.Collection.prototype.filterBounds = function(geometry) {
  return this.filter(ee.Filter.bounds(geometry))
};
ee.Collection.prototype.filterDate = function(start, end) {
  return this.filter(ee.Filter.date(start, end))
};
ee.Collection.prototype.getInfo = function(opt_callback) {
  return ee.data.getValue({json:this.serialize()}, opt_callback)
};
ee.Collection.prototype.serialize = function() {
  for(var item = this;ee.Collection.isFilterFeatureCollection_(item) && 0 == item.description_.filters.length();) {
    item = item.description_.collection
  }
  return ee.Serializer.toJSON(item.description_)
};
ee.Collection.prototype.limit = function(max, opt_property, opt_ascending) {
  var args = {algorithm:"LimitFeatureCollection", collection:this, limit:max};
  opt_property && (args.key = opt_property, opt_ascending && (args.ascending = opt_ascending));
  return new this.constructor(args)
};
ee.Collection.prototype.sort = function(property, opt_ascending) {
  var args = {algorithm:"LimitFeatureCollection", collection:this, key:property};
  opt_ascending && (args.ascending = opt_ascending);
  return new this.constructor(args)
};
ee.Collection.prototype.geometry = function() {
  return{algorithm:"ExtractGeometry", collection:this}
};
goog.exportSymbol("ee.Collection", ee.Collection);
goog.exportProperty(ee.Collection.prototype, "filter", ee.Collection.prototype.filter);
goog.exportProperty(ee.Collection.prototype, "filterMetadata", ee.Collection.prototype.filterMetadata);
goog.exportProperty(ee.Collection.prototype, "filterBounds", ee.Collection.prototype.filterBounds);
goog.exportProperty(ee.Collection.prototype, "filterDate", ee.Collection.prototype.filterDate);
goog.exportProperty(ee.Collection.prototype, "getInfo", ee.Collection.prototype.getInfo);
goog.exportProperty(ee.Collection.prototype, "serialize", ee.Collection.prototype.serialize);
goog.exportProperty(ee.Collection.prototype, "limit", ee.Collection.prototype.limit);
goog.exportProperty(ee.Collection.prototype, "sort", ee.Collection.prototype.sort);
goog.exportProperty(ee.Collection, "isFilterFeatureCollection_", ee.Collection.isFilterFeatureCollection_);
ee.Image = function(args) {
  if(!(this instanceof ee.Image)) {
    return new ee.Image(args)
  }
  ee.initialize();
  if(goog.isNumber(args)) {
    args = {algorithm:"Constant", value:args}
  }else {
    if(goog.isString(args)) {
      args = {type:"Image", id:args}
    }else {
      if(goog.isArray(args)) {
        return ee.Image.combine_(goog.array.map(args, function(elem) {
          return new ee.Image(elem)
        }))
      }
      if(args instanceof ee.Image) {
        return args
      }
    }
  }
  this.description_ = args
};
ee.Image.prototype.getInfo = function() {
  return ee.data.getValue({json:this.serialize()})
};
ee.Image.prototype.getMap = function(opt_visParams, opt_callback) {
  var request = opt_visParams || {};
  request.image = this.serialize();
  if(opt_callback) {
    ee.data.getMapId(request, goog.bind(function(data, error) {
      data && (data.image = this);
      opt_callback(data, error)
    }, this))
  }else {
    var response = ee.data.getMapId(request);
    response.image = this;
    return response
  }
};
ee.Image.prototype.getDownloadURL = function(params) {
  var request = params || {};
  request.image = this.serialize();
  var downloadId = ee.data.getDownloadId(request);
  return ee.data.makeDownloadUrl(downloadId)
};
ee.Image.prototype.serialize = function() {
  return ee.Serializer.toJSON(this.description_)
};
ee.Image.rgb = function(r, g, b) {
  return ee.Image.combine_([r, g, b], ["vis-red", "vis-green", "vis-blue"])
};
ee.Image.cat = function(var_args) {
  var args = Array.prototype.slice.call(arguments);
  return ee.Image.combine_(args, null)
};
ee.Image.combine_ = function(images, opt_names) {
  if(0 == images.length) {
    throw Error("Can't combine 0 images.");
  }
  for(var result = new ee.Image(images[0]), i = 1;i < images.length;i++) {
    result = new ee.Image({algorithm:"Image.addBands", dstImg:result, srcImg:new ee.Image(images[i])})
  }
  opt_names && (result = result.select([".*"], opt_names));
  return result
};
ee.Image.prototype.select = function(selectors, opt_names) {
  var call = {algorithm:"Image.select", input:this, bandSelectors:selectors};
  if(goog.isArray(selectors)) {
    opt_names && (call.newNames = opt_names)
  }else {
    selectors = Array.prototype.slice.call(arguments);
    for(var i = 0;i < selectors.length;i++) {
      if(!goog.isString(selectors[i]) && !goog.isNumber(selectors[i])) {
        throw Error("Illegal argument to select(): " + selectors[i]);
      }
    }
    call.bandSelectors = selectors
  }
  return new ee.Image(call)
};
ee.Image.prototype.toString = function() {
  return"ee.Image(" + ee.Serializer.toReadableJSON(this.description_) + ")"
};
goog.exportSymbol("ee.Image", ee.Image);
goog.exportProperty(ee.Image.prototype, "getInfo", ee.Image.prototype.getInfo);
goog.exportProperty(ee.Image.prototype, "getDownloadURL", ee.Image.prototype.getDownloadURL);
goog.exportProperty(ee.Image.prototype, "getMap", ee.Image.prototype.getMap);
goog.exportProperty(ee.Image.prototype, "select", ee.Image.prototype.select);
goog.exportProperty(ee.Image.prototype, "serialize", ee.Image.prototype.serialize);
goog.exportProperty(ee.Image, "cat", ee.Image.cat);
goog.exportProperty(ee.Image, "combine_", ee.Image.combine_);
goog.exportProperty(ee.Image, "rgb", ee.Image.rgb);
goog.exportProperty(ee.Image, "toString", ee.Image.toString);
ee.Feature = function(geometry, opt_properties) {
  if(!(this instanceof ee.Feature)) {
    return new ee.Feature(geometry, opt_properties)
  }
  ee.initialize();
  if(geometry instanceof ee.Feature) {
    if(opt_properties) {
      throw Error("Can't create Feature out of a Feature and properties.");
    }
    return geometry
  }
  if(geometry.coordinates && ee.Feature.validGeometry(geometry)) {
    this.description_ = {type:"Feature", geometry:geometry, properties:opt_properties}
  }else {
    if("Feature" == geometry.type || "algorithm" in geometry && void 0 === opt_properties) {
      this.description_ = geometry
    }else {
      throw Error("Not a geometry, feature or JSON description.");
    }
  }
};
ee.Feature.prototype.getMap = function(opt_visParams, opt_callback) {
  var painted = new ee.Image({algorithm:"DrawVector", collection:{type:"FeatureCollection", features:[this]}, color:(opt_visParams || {}).color || "000000"});
  if(opt_callback) {
    painted.getMap(null, opt_callback)
  }else {
    return painted.getMap()
  }
};
ee.Feature.validGeometry = function(geometry) {
  var type = geometry.type, nesting = ee.Feature.validCoordinates(geometry.coordinates);
  return"Point" == type && 1 == nesting || "MultiPoint" == type && 2 == nesting || "LineString" == type && 2 == nesting || "LinearRing" == type && 2 == nesting || "MultiLine" == type && 3 == nesting || "Polygon" == type && 3 == nesting || "MultiPolygon" == type && 4 == nesting
};
ee.Feature.validCoordinates = function(shape) {
  if(!goog.isArray(shape)) {
    return-1
  }
  if(goog.isArray(shape[0])) {
    for(var count = ee.Feature.validCoordinates(shape[0]), i = 1;i < shape.length;i++) {
      if(ee.Feature.validCoordinates(shape[i]) != count) {
        return-1
      }
    }
    return count + 1
  }
  for(i = 0;i < shape.length;i++) {
    if(!goog.isNumber(shape[i])) {
      return-1
    }
  }
  return 0 == shape.length % 2 ? 1 : -1
};
ee.Feature.coordinatesToLine = function(coordinates) {
  if("number" == typeof coordinates[0]) {
    if(0 != coordinates.length % 2) {
      throw Error("Invalid number of coordinates: " + coordinates.length);
    }
    for(var line = [], i = 0;i < coordinates.length;i += 2) {
      line.push([coordinates[i], coordinates[i + 1]])
    }
    coordinates = line
  }
  return coordinates
};
ee.Feature.makeGeometry_ = function(geometry, nesting, opt_coordinates) {
  if(2 > nesting || 4 < nesting) {
    throw Error("Unexpected nesting level.");
  }
  !goog.isArray(geometry) && opt_coordinates && (geometry = ee.Feature.coordinatesToLine(Array.prototype.slice.call(opt_coordinates)));
  for(var item = geometry, count = 0;goog.isArray(item);) {
    item = item[0], count++
  }
  for(;count < nesting;) {
    geometry = [geometry], count++
  }
  if(ee.Feature.validCoordinates(geometry) != nesting) {
    throw Error("Invalid geometry");
  }
  return geometry
};
ee.Feature.Point = function(lon, lat) {
  return{type:"Point", coordinates:[lon, lat]}
};
ee.Feature.MultiPoint = function(coordinates) {
  return{type:"MultiPoint", coordinates:ee.Feature.makeGeometry_(coordinates, 2, arguments)}
};
ee.Feature.Rectangle = function(lon1, lat1, lon2, lat2) {
  if(goog.isArray(lon1)) {
    var args = lon1;
    lon1 = args[0];
    lat1 = args[1];
    lon2 = args[2];
    lat2 = args[3]
  }
  return{type:"Polygon", coordinates:[[[lon1, lat2], [lon1, lat1], [lon2, lat1], [lon2, lat2]]]}
};
ee.Feature.LineString = function(coordinates) {
  return{type:"LineString", coordinates:ee.Feature.makeGeometry_(coordinates, 2, arguments)}
};
ee.Feature.LinearRing = function(coordinates) {
  return{type:"LinearRing", coordinates:ee.Feature.makeGeometry_(coordinates, 2, arguments)}
};
ee.Feature.MultiLine = function(coordinates) {
  return{type:"MultiLine", coordinates:ee.Feature.makeGeometry_(coordinates, 3, arguments)}
};
ee.Feature.Polygon = function(coordinates) {
  return{type:"Polygon", coordinates:ee.Feature.makeGeometry_(coordinates, 3, arguments)}
};
ee.Feature.MultiPolygon = function(coordinates) {
  return{type:"MultiPolygon", coordinates:ee.Feature.makeGeometry_(coordinates, 4, arguments)}
};
ee.Feature.prototype.serialize = function() {
  return ee.Serializer.toJSON(this.description_)
};
ee.Feature.prototype.toString = function() {
  return"ee.Feature(" + ee.Serializer.toReadableJSON(this.description_) + ")"
};
goog.exportSymbol("ee.Feature", ee.Feature);
goog.exportProperty(ee.Feature, "validGeometry", ee.Feature.validGeometry);
goog.exportProperty(ee.Feature, "validCoordinates", ee.Feature.validCoordinates);
goog.exportProperty(ee.Feature, "Point", ee.Feature.Point);
goog.exportProperty(ee.Feature, "MultiPoint", ee.Feature.MultiPoint);
goog.exportProperty(ee.Feature, "Rectangle", ee.Feature.Rectangle);
goog.exportProperty(ee.Feature, "LineString", ee.Feature.LineString);
goog.exportProperty(ee.Feature, "LinearRing", ee.Feature.LinearRing);
goog.exportProperty(ee.Feature, "MultiLine", ee.Feature.MultiLine);
goog.exportProperty(ee.Feature, "Polygon", ee.Feature.Polygon);
goog.exportProperty(ee.Feature, "MultiPolygon", ee.Feature.MultiPolygon);
goog.exportProperty(ee.Feature, "getMap", ee.Feature.prototype.getMap);
goog.exportProperty(ee.Feature.prototype, "serialize", ee.Feature.prototype.serialize);
goog.exportProperty(ee.Feature.prototype, "toString", ee.Feature.prototype.toString);
ee.FeatureCollection = function(args, opt_column) {
  if(!(this instanceof ee.FeatureCollection)) {
    return new ee.FeatureCollection(args, opt_column)
  }
  ee.initialize();
  args instanceof ee.Feature && (args = [args]);
  if(goog.isString(args)) {
    args = {type:"FeatureCollection", id:args}, opt_column && (args.geo_column = opt_column)
  }else {
    if(goog.isNumber(args)) {
      args = {type:"FeatureCollection", table_id:args}, opt_column && (args.geo_column = opt_column)
    }else {
      if(goog.isArray(args)) {
        args = {type:"FeatureCollection", features:goog.array.map(args, function(elem) {
          return new ee.Feature(elem)
        })}
      }else {
        if(args instanceof ee.FeatureCollection) {
          return args
        }
      }
    }
  }
  this.description_ = args
};
goog.inherits(ee.FeatureCollection, ee.Collection);
ee.FeatureCollection.prototype.getMap = function(opt_visParams, opt_callback) {
  var painted = new ee.Image({algorithm:"DrawVector", collection:this, color:(opt_visParams || {}).color || "000000"});
  if(opt_callback) {
    painted.getMap(null, opt_callback)
  }else {
    return painted.getMap()
  }
};
ee.FeatureCollection.prototype.toString = function() {
  return"ee.FeatureCollection(" + ee.Serializer.toReadableJSON(this.description_) + ")"
};
ee.FeatureCollection.prototype.map = function(algorithm, opt_dynamicArgs, opt_constantArgs, opt_destination) {
  var args;
  if(goog.isFunction(algorithm)) {
    if(opt_dynamicArgs) {
      throw Error("Can't use dynamicArgs with a mapped JS function.");
    }
    args = [ee.lambda(["FC_GEN_VAR"], algorithm(ee.variable(ee.Feature, "FC_GEN_VAR"))), {FC_GEN_VAR:".all"}, opt_constantArgs, opt_destination]
  }else {
    args = arguments
  }
  return ee.Collection.prototype.map.apply(this, args)
};
goog.exportSymbol("ee.FeatureCollection", ee.FeatureCollection);
goog.exportProperty(ee.FeatureCollection.prototype, "filter", ee.FeatureCollection.prototype.filter);
goog.exportProperty(ee.FeatureCollection.prototype, "filterDate", ee.FeatureCollection.prototype.filterDate);
goog.exportProperty(ee.FeatureCollection.prototype, "filterMetadata", ee.FeatureCollection.prototype.filterMetadata);
goog.exportProperty(ee.FeatureCollection.prototype, "filterBounds", ee.FeatureCollection.prototype.filterBounds);
goog.exportProperty(ee.FeatureCollection.prototype, "getInfo", ee.FeatureCollection.prototype.getInfo);
goog.exportProperty(ee.FeatureCollection.prototype, "limit", ee.FeatureCollection.prototype.limit);
goog.exportProperty(ee.FeatureCollection.prototype, "serialize", ee.FeatureCollection.prototype.serialize);
goog.exportProperty(ee.FeatureCollection.prototype, "sort", ee.FeatureCollection.prototype.sort);
goog.exportProperty(ee.FeatureCollection.prototype, "geometry", ee.FeatureCollection.prototype.geometry);
goog.exportProperty(ee.FeatureCollection.prototype, "getMap", ee.FeatureCollection.prototype.getMap);
goog.exportProperty(ee.FeatureCollection.prototype, "toString", ee.FeatureCollection.prototype.toString);
ee.ImageCollection = function(args) {
  if(!(this instanceof ee.ImageCollection)) {
    return new ee.ImageCollection(args)
  }
  ee.initialize();
  args instanceof ee.Image && (args = [args]);
  if(goog.isString(args)) {
    args = {type:"ImageCollection", id:args}
  }else {
    if(goog.isArray(args)) {
      args = {type:"ImageCollection", images:goog.array.map(args, function(elem) {
        return new ee.Image(elem)
      })}
    }else {
      if(args instanceof ee.ImageCollection) {
        return args
      }
    }
  }
  this.description_ = args
};
goog.inherits(ee.ImageCollection, ee.Collection);
ee.ImageCollection.prototype.getMap = function(opt_visParams, opt_callback) {
  var mosaic = this.mosaic();
  if(opt_callback) {
    mosaic.getMap(opt_visParams, opt_callback)
  }else {
    return mosaic.getMap(opt_visParams)
  }
};
ee.ImageCollection.prototype.mosaic = function() {
  return new ee.Image({creator:"SimpleMosaic", args:[this]})
};
ee.ImageCollection.prototype.combine = function(other) {
  return new ee.ImageCollection({algorithm:"CombineCollectionBands", primary:this, secondary:other})
};
ee.ImageCollection.prototype.toString = function() {
  return"ee.ImageCollection(" + ee.Serializer.toReadableJSON(this.description_) + ")"
};
ee.ImageCollection.prototype.map = function(algorithm, opt_dynamicArgs, opt_constantArgs, opt_destination) {
  var args;
  if(goog.isFunction(algorithm)) {
    if(opt_dynamicArgs) {
      throw Error("Can't use dynamicArgs with a mapped JS function.");
    }
    args = [ee.lambda(["IC_GEN_VAR"], algorithm(ee.variable(ee.Image, "FC_GEN_VAR"))), {IC_GEN_VAR:".all"}, opt_constantArgs, opt_destination]
  }else {
    args = arguments
  }
  return new ee.ImageCollection(ee.Collection.prototype.map.apply(this, args).description_)
};
goog.exportSymbol("ee.ImageCollection", ee.ImageCollection);
goog.exportProperty(ee.ImageCollection.prototype, "getMap", ee.ImageCollection.prototype.getMap);
goog.exportProperty(ee.ImageCollection.prototype, "mosaic", ee.ImageCollection.prototype.mosaic);
goog.exportProperty(ee.ImageCollection.prototype, "combine", ee.ImageCollection.prototype.combine);
goog.exportProperty(ee.ImageCollection.prototype, "filter", ee.ImageCollection.prototype.filter);
goog.exportProperty(ee.ImageCollection.prototype, "filterDate", ee.ImageCollection.prototype.filterDate);
goog.exportProperty(ee.ImageCollection.prototype, "filterMetadata", ee.ImageCollection.prototype.filterMetadata);
goog.exportProperty(ee.ImageCollection.prototype, "filterBounds", ee.ImageCollection.prototype.filterBounds);
goog.exportProperty(ee.ImageCollection.prototype, "getInfo", ee.ImageCollection.prototype.getInfo);
goog.exportProperty(ee.ImageCollection.prototype, "limit", ee.ImageCollection.prototype.limit);
goog.exportProperty(ee.ImageCollection.prototype, "serialize", ee.ImageCollection.prototype.serialize);
goog.exportProperty(ee.ImageCollection.prototype, "sort", ee.ImageCollection.prototype.sort);
goog.exportProperty(ee.ImageCollection.prototype, "toString", ee.ImageCollection.prototype.toString);
ee.Algorithms = {};
ee.Algorithms.init = function(opt_callback) {
  ee.Algorithms.signatures || (opt_callback ? ee.data.getAlgorithms(function(data) {
    ee.Algorithms.signatures = data;
    opt_callback()
  }) : ee.Algorithms.signatures = ee.data.getAlgorithms())
};
ee.Algorithms.get = function(name) {
  ee.Algorithms.init();
  var algorithm = ee.Algorithms.signatures[name];
  if(!algorithm) {
    throw Error("Unknown algorithm");
  }
  name in algorithm || (algorithm.name = name);
  return algorithm
};
ee.Algorithms.applySignature_ = function(signature, opt_posArgs, opt_namedArgs) {
  var positional = opt_posArgs || [], parameters = opt_namedArgs || {}, args = signature.args, nArgs = positional.length + parameters.length;
  if(nArgs > args.length) {
    throw Error("Incorrect number of arguments: " + signature.name + " expects no more than " + args.length + " arguments, got " + nArgs + ".");
  }
  for(var argNames = {}, i = 0;i < args.length;i++) {
    argNames[args[i].name] = !0
  }
  var unknown = [], name;
  for(name in parameters) {
    name in argNames || unknown.push(name)
  }
  if(0 < unknown.length) {
    throw Error("Unrecognized arguments: " + signature.name + "(" + unknown + ")");
  }
  for(i = 0;i < positional.length;i++) {
    name = args[i].name;
    if(name in parameters) {
      throw Error("Argument already set: " + signature.name + "(" + name + ")");
    }
    parameters[name] = positional[i]
  }
  for(i = 0;i < args.length;i++) {
    if(name = args[i].name, name in parameters) {
      parameters[name] = ee.Algorithms.promote_(args[i].type, parameters[name])
    }else {
      if(!args[i].optional) {
        throw"Missing required argument: " + name;
      }
    }
  }
  parameters.algorithm = signature.name;
  return ee.Algorithms.promote_(signature.returns, parameters)
};
ee.Algorithms.makeFunction = function(signature, opt_boundArgs) {
  var func = function() {
    var argsIn = Array.prototype.slice.call(arguments, 0);
    argsIn.unshift(this);
    return ee.Algorithms.applySignature_(signature, argsIn, opt_boundArgs)
  };
  ee.Algorithms.document_(func, signature);
  return func
};
ee.Algorithms.makeAggregateFunction = function(signature, opt_boundArgs) {
  var func = ee.Algorithms.makeFunction(signature, opt_boundArgs), newFunc = function() {
    var args = arguments, callback = void 0, lastArg = arguments[arguments.length - 1];
    lastArg && goog.isFunction(lastArg) && (callback = lastArg, args = Array.prototype.slice.call(arguments, 0, arguments.length - 1));
    var description = func.apply(this, args);
    return ee.data.getValue({json:ee.Serializer.toJSON(description)}, callback)
  };
  newFunc.signature = func.signature;
  newFunc.toString = func.toString;
  return newFunc
};
ee.Algorithms.makeMapFunction = function(signature, opt_boundArgs) {
  var func = function() {
    var argsIn = Array.prototype.slice.call(arguments, 0), copy = goog.object.clone(signature);
    copy.returns = null;
    copy.args = signature.args.slice(1);
    var parameters = ee.Algorithms.applySignature_(copy, argsIn, opt_boundArgs);
    goog.object.remove(parameters, "algorithm");
    var dynamicArgs = {};
    dynamicArgs[signature.args[0].name] = ".all";
    var collectionClass = "Image" == signature.returns ? ee.ImageCollection : ee.FeatureCollection, description = {constantArgs:parameters, baseAlgorithm:signature.name, collection:this, dynamicArgs:dynamicArgs, algorithm:"MapAlgorithm"};
    "Image" == signature.returns || ("EEObject" == signature.returns || "Feature" == signature.returns) || (description.destination = signature.name.split(".").pop());
    return new collectionClass(description)
  }, sig = goog.object.clone(signature);
  sig.name = "Map(" + signature.name + ", this)";
  sig.args = sig.args.slice();
  sig.args[0] = goog.object.clone(sig.args[0]);
  sig.args[0].name = "[" + sig.args[0].name + "]";
  sig.args[0].type += "Collection";
  ee.Algorithms.document_(func, sig);
  return func
};
ee.Algorithms.document_ = function(func, signature, opt_name) {
  func.signature = signature;
  func.toString = function() {
    var buffer = [];
    buffer.push(opt_name || signature.name);
    buffer.push("(");
    buffer.push(goog.array.map(signature.args.slice(1), function(elem) {
      return elem.name
    }).join(", "));
    buffer.push(")\n\n");
    buffer.push(signature.description);
    buffer.push("\n\nArgs:\n");
    for(var i = 0;i < signature.args.length;i++) {
      0 == i ? buffer.push("  this:") : buffer.push("\n  ");
      var arg = signature.args[i];
      buffer.push(arg.name);
      buffer.push(" (");
      buffer.push(arg.type);
      arg.optional && buffer.push(", optional");
      buffer.push("): ");
      buffer.push(arg.description)
    }
    return buffer.join("")
  }
};
ee.Algorithms.addFunctions = function(target, prefix, opt_prepend, opt_wrapper) {
  ee.Algorithms.init();
  var prepend = opt_prepend || "", wrapper = opt_wrapper || ee.Algorithms.makeFunction, name;
  for(name in ee.Algorithms.signatures) {
    var parts = name.split(".");
    if(2 == parts.length && parts[0] == prefix) {
      var fname = prepend + parts[1], signature = ee.Algorithms.signatures[name];
      signature.name = name;
      fname in target.prototype && (fname += "_");
      target.prototype[fname] = wrapper(signature)
    }
  }
};
ee.Algorithms.promote_ = function(type, arg) {
  switch(type) {
    case "Image":
      return new ee.Image(arg);
    case "ImageCollection":
      return new ee.ImageCollection(arg);
    case "Feature":
    ;
    case "EEObject":
      return arg instanceof ee.Collection ? {type:"Feature", geometry:arg.geometry(), properties:{}} : new ee.Feature(arg);
    case "FeatureCollection":
    ;
    case "EECollection":
      return new ee.FeatureCollection(arg);
    case "ErrorMargin":
      return goog.isNumber(arg) ? {type:"ErrorMargin", unit:"meters", value:arg} : arg;
    default:
      return arg
  }
};
goog.exportSymbol("ee.Algorithms", ee.Algorithms);
goog.exportSymbol("ee.Algorithms.addFunctions", ee.Algorithms.addFunctions);
goog.exportSymbol("ee.Algorithms.applySignature_", ee.Algorithms.applySignature_);
goog.exportSymbol("ee.Algorithms.init", ee.Algorithms.init);
goog.exportSymbol("ee.Algorithms.get", ee.Algorithms.get);

