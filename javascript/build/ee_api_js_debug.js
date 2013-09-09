var goog = goog || {};
goog.global = this;
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split("."), cur = opt_objectToExportTo || goog.global;
  parts[0] in cur || !cur.execScript || cur.execScript("var " + parts[0]);
  for(var part;parts.length && (part = parts.shift());) {
    parts.length || void 0 === opt_object ? cur = cur[part] ? cur[part] : cur[part] = {} : cur[part] = opt_object
  }
};
goog.define = function(name, defaultValue) {
  goog.exportPath_(name, defaultValue)
};
goog.DEBUG = !0;
goog.LOCALE = "en";
goog.TRUSTED_SITE = !0;
goog.provide = function(name) {
  goog.exportPath_(name)
};
goog.setTestOnly = function(opt_message) {
  if(!goog.DEBUG) {
    throw opt_message = opt_message || "", Error("Importing test-only code into non-debug environment" + opt_message ? ": " + opt_message : ".");
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
goog.addDependency = function(relPath, provides, requires) {
  if(goog.DEPENDENCIES_ENABLED) {
    for(var provide, require, path = relPath.replace(/\\/g, "/"), deps = goog.dependencies_, i = 0;provide = provides[i];i++) {
      deps.nameToPath[provide] = path, path in deps.pathToNames || (deps.pathToNames[path] = {}), deps.pathToNames[path][provide] = !0
    }
    for(var j = 0;require = requires[j];j++) {
      path in deps.requires || (deps.requires[path] = {}), deps.requires[path][require] = !0
    }
  }
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
goog.DEPENDENCIES_ENABLED = !1;
goog.DEPENDENCIES_ENABLED && (goog.included_ = {}, goog.dependencies_ = {pathToNames:{}, nameToPath:{}, requires:{}, visited:{}, written:{}}, goog.inHtmlDocument_ = function() {
  var doc = goog.global.document;
  return"undefined" != typeof doc && "write" in doc
}, goog.findBasePath_ = function() {
  if(goog.global.CLOSURE_BASE_PATH) {
    goog.basePath = goog.global.CLOSURE_BASE_PATH
  }else {
    if(goog.inHtmlDocument_()) {
      for(var scripts = goog.global.document.getElementsByTagName("script"), i = scripts.length - 1;0 <= i;--i) {
        var src = scripts[i].src, qmark = src.lastIndexOf("?"), l = -1 == qmark ? src.length : qmark;
        if("base.js" == src.substr(l - 7, 7)) {
          goog.basePath = src.substr(0, l - 7);
          break
        }
      }
    }
  }
}, goog.importScript_ = function(src) {
  var importScript = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_;
  !goog.dependencies_.written[src] && importScript(src) && (goog.dependencies_.written[src] = !0)
}, goog.writeScriptTag_ = function(src) {
  if(goog.inHtmlDocument_()) {
    var doc = goog.global.document;
    if("complete" == doc.readyState) {
      if(/\bdeps.js$/.test(src)) {
        return!1
      }
      throw Error('Cannot write "' + src + '" after document load');
    }
    doc.write('<script type="text/javascript" src="' + src + '">\x3c/script>');
    return!0
  }
  return!1
}, goog.writeScripts_ = function() {
  function visitNode(path) {
    if(!(path in deps.written)) {
      if(!(path in deps.visited) && (deps.visited[path] = !0, path in deps.requires)) {
        for(var requireName in deps.requires[path]) {
          if(!goog.isProvided_(requireName)) {
            if(requireName in deps.nameToPath) {
              visitNode(deps.nameToPath[requireName])
            }else {
              throw Error("Undefined nameToPath for " + requireName);
            }
          }
        }
      }
      path in seenScript || (seenScript[path] = !0, scripts.push(path))
    }
  }
  var scripts = [], seenScript = {}, deps = goog.dependencies_, path$$0;
  for(path$$0 in goog.included_) {
    deps.written[path$$0] || visitNode(path$$0)
  }
  for(var i = 0;i < scripts.length;i++) {
    if(scripts[i]) {
      goog.importScript_(goog.basePath + scripts[i])
    }else {
      throw Error("Undefined script input");
    }
  }
}, goog.getPathFromDeps_ = function(rule) {
  return rule in goog.dependencies_.nameToPath ? goog.dependencies_.nameToPath[rule] : null
}, goog.findBasePath_(), goog.global.CLOSURE_NO_DEPS || goog.importScript_(goog.basePath + "deps.js"));
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
goog.hasUid = function(obj) {
  return!!obj[goog.UID_PROPERTY_]
};
goog.removeUid = function(obj) {
  "removeAttribute" in obj && obj.removeAttribute(goog.UID_PROPERTY_);
  try {
    delete obj[goog.UID_PROPERTY_]
  }catch(ex) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + (1E9 * Math.random() >>> 0);
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
  Function.prototype.bind && -1 != Function.prototype.bind.toString().indexOf("native code") ? goog.bind = goog.bindNative_ : goog.bind = goog.bindJs_;
  return goog.bind.apply(null, arguments)
};
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = args.slice();
    newArgs.push.apply(newArgs, arguments);
    return fn.apply(this, newArgs)
  }
};
goog.mixin = function(target, source) {
  for(var x in source) {
    target[x] = source[x]
  }
};
goog.now = goog.TRUSTED_SITE && Date.now || function() {
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
  if(goog.DEBUG && !caller) {
    throw Error("arguments.caller not defined.  goog.base() expects not to be running in strict mode. See http://www.ecma-international.org/ecma-262/5.1/#sec-C");
  }
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
  for(var isArrayLike = goog.isArrayLike(var_args), keys = isArrayLike ? var_args : arguments, i = isArrayLike ? 0 : 1;i < keys.length && (obj = obj[keys[i]], goog.isDef(obj));i++) {
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
goog.dom = {};
goog.dom.NodeType = {ELEMENT:1, ATTRIBUTE:2, TEXT:3, CDATA_SECTION:4, ENTITY_REFERENCE:5, ENTITY:6, PROCESSING_INSTRUCTION:7, COMMENT:8, DOCUMENT:9, DOCUMENT_TYPE:10, DOCUMENT_FRAGMENT:11, NOTATION:12};
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
goog.string.caseInsensitiveEquals = function(str1, str2) {
  return str1.toLowerCase() == str2.toLowerCase()
};
goog.string.subs = function(str, var_args) {
  for(var splitParts = str.split("%s"), returnString = "", subsArguments = Array.prototype.slice.call(arguments, 1);subsArguments.length && 1 < splitParts.length;) {
    returnString += splitParts.shift() + subsArguments.shift()
  }
  return returnString + splitParts.join("%s")
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
  0 <= index && index < s.length && 0 < stringLength && (resultStr = s.substr(0, index) + s.substr(index + stringLength, s.length - index - stringLength));
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
goog.string.isLowerCamelCase = function(str) {
  return/^[a-z]+([A-Z][a-z]*)*$/.test(str)
};
goog.string.isUpperCamelCase = function(str) {
  return/^([A-Z][a-z]*)+$/.test(str)
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
goog.string.splitLimit = function(str, separator, limit) {
  for(var parts = str.split(separator), returnVal = [];0 < limit && parts.length;) {
    returnVal.push(parts.shift()), limit--
  }
  parts.length && returnVal.push(parts.join(separator));
  return returnVal
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
goog.asserts.assertElement = function(value, opt_message, var_args) {
  !goog.asserts.ENABLE_ASSERTS || goog.isObject(value) && value.nodeType == goog.dom.NodeType.ELEMENT || goog.asserts.doAssertFailure_("Expected Element but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2));
  return value
};
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  !goog.asserts.ENABLE_ASSERTS || value instanceof type || goog.asserts.doAssertFailure_("instanceof check failed.", null, opt_message, Array.prototype.slice.call(arguments, 3));
  return value
};
goog.asserts.assertObjectPrototypeIsIntact = function() {
  for(var key in Object.prototype) {
    goog.asserts.fail(key + " should not be enumerable in Object.prototype.")
  }
};
goog.array = {};
goog.NATIVE_ARRAY_PROTOTYPES = goog.TRUSTED_SITE;
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
    return goog.isString(obj) && 1 == obj.length ? arr.indexOf(obj, fromIndex) : -1
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
    return goog.isString(obj) && 1 == obj.length ? arr.lastIndexOf(obj, fromIndex) : -1
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
goog.array.reduce = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.reduce ? function(arr, f, val, opt_obj) {
  goog.asserts.assert(null != arr.length);
  opt_obj && (f = goog.bind(f, opt_obj));
  return goog.array.ARRAY_PROTOTYPE_.reduce.call(arr, f, val)
} : function(arr, f, val$$0, opt_obj) {
  var rval = val$$0;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.reduceRight = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.reduceRight ? function(arr, f, val, opt_obj) {
  goog.asserts.assert(null != arr.length);
  opt_obj && (f = goog.bind(f, opt_obj));
  return goog.array.ARRAY_PROTOTYPE_.reduceRight.call(arr, f, val)
} : function(arr, f, val$$0, opt_obj) {
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
goog.array.count = function(arr$$0, f, opt_obj) {
  var count = 0;
  goog.array.forEach(arr$$0, function(element, index, arr) {
    f.call(opt_obj, element, index, arr) && ++count
  }, opt_obj);
  return count
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
    if(goog.isArray(arr2) || (isArrayLike = goog.isArrayLike(arr2)) && Object.prototype.hasOwnProperty.call(arr2, "callee")) {
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
goog.array.bucket = function(array, sorter, opt_obj) {
  for(var buckets = {}, i = 0;i < array.length;i++) {
    var value = array[i], key = sorter.call(opt_obj, value, i, array);
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
goog.array.range = function(startOrEnd, opt_end, opt_step) {
  var array = [], start = 0, end = startOrEnd, step = opt_step || 1;
  void 0 !== opt_end && (start = startOrEnd, end = opt_end);
  if(0 > step * (end - start)) {
    return[]
  }
  if(0 < step) {
    for(var i = start;i < end;i += step) {
      array.push(i)
    }
  }else {
    for(i = start;i > end;i += step) {
      array.push(i)
    }
  }
  return array
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
goog.array.moveItem = function(arr, fromIndex, toIndex) {
  goog.asserts.assert(0 <= fromIndex && fromIndex < arr.length);
  goog.asserts.assert(0 <= toIndex && toIndex < arr.length);
  var removedItems = goog.array.ARRAY_PROTOTYPE_.splice.call(arr, fromIndex, 1);
  goog.array.ARRAY_PROTOTYPE_.splice.call(arr, toIndex, 0, removedItems[0])
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
goog.disposable = {};
goog.disposable.IDisposable = function() {
};
goog.Disposable = function() {
  goog.Disposable.MONITORING_MODE != goog.Disposable.MonitoringMode.OFF && (goog.Disposable.instances_[goog.getUid(this)] = this)
};
goog.Disposable.MonitoringMode = {OFF:0, PERMANENT:1, INTERACTIVE:2};
goog.Disposable.MONITORING_MODE = 0;
goog.Disposable.INCLUDE_STACK_ON_CREATION = !0;
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
goog.events = {};
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
    goog.userAgent.detectedOpera_ = goog.string.startsWith(ua, "Opera");
    goog.userAgent.detectedIe_ = !goog.userAgent.detectedOpera_ && (goog.string.contains(ua, "MSIE") || goog.string.contains(ua, "Trident"));
    goog.userAgent.detectedWebkit_ = !goog.userAgent.detectedOpera_ && goog.string.contains(ua, "WebKit");
    goog.userAgent.detectedMobile_ = goog.userAgent.detectedWebkit_ && goog.string.contains(ua, "Mobile");
    goog.userAgent.detectedGecko_ = !goog.userAgent.detectedOpera_ && !goog.userAgent.detectedWebkit_ && !goog.userAgent.detectedIe_ && "Gecko" == navigator.product
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
  goog.userAgent.detectedIPad_ = !!ua && goog.string.contains(ua, "iPad")
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
  if(goog.userAgent.OPERA && goog.global.opera) {
    var operaVersion = goog.global.opera.version, version = "function" == typeof operaVersion ? operaVersion() : operaVersion
  }else {
    if(goog.userAgent.GECKO ? re = /rv\:([^\);]+)(\)|;)/ : goog.userAgent.IE ? re = /\b(?:MSIE|rv)[: ]([^\);]+)(\)|;)/ : goog.userAgent.WEBKIT && (re = /WebKit\/(\S+)/), re) {
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
goog.userAgent.isVersionOrHigherCache_ = {};
goog.userAgent.isVersionOrHigher = function(version) {
  return goog.userAgent.ASSUME_ANY_VERSION || goog.userAgent.isVersionOrHigherCache_[version] || (goog.userAgent.isVersionOrHigherCache_[version] = 0 <= goog.string.compareVersions(goog.userAgent.VERSION, version))
};
goog.userAgent.isVersion = goog.userAgent.isVersionOrHigher;
goog.userAgent.isDocumentModeOrHigher = function(documentMode) {
  return goog.userAgent.IE && goog.userAgent.DOCUMENT_MODE >= documentMode
};
goog.userAgent.isDocumentMode = goog.userAgent.isDocumentModeOrHigher;
var doc$$inline_1 = goog.global.document;
goog.userAgent.DOCUMENT_MODE = doc$$inline_1 && goog.userAgent.IE ? goog.userAgent.getDocumentMode_() || ("CSS1Compat" == doc$$inline_1.compatMode ? parseInt(goog.userAgent.VERSION, 10) : 5) : void 0;
goog.events.BrowserFeature = {HAS_W3C_BUTTON:!goog.userAgent.IE || goog.userAgent.isDocumentModeOrHigher(9), HAS_W3C_EVENT_SUPPORT:!goog.userAgent.IE || goog.userAgent.isDocumentModeOrHigher(9), SET_KEY_CODE_TO_PREVENT_DEFAULT:goog.userAgent.IE && !goog.userAgent.isVersionOrHigher("9"), HAS_NAVIGATOR_ONLINE_PROPERTY:!goog.userAgent.WEBKIT || goog.userAgent.isVersionOrHigher("528"), HAS_HTML5_NETWORK_EVENT_SUPPORT:goog.userAgent.GECKO && goog.userAgent.isVersionOrHigher("1.9b") || goog.userAgent.IE && 
goog.userAgent.isVersionOrHigher("8") || goog.userAgent.OPERA && goog.userAgent.isVersionOrHigher("9.5") || goog.userAgent.WEBKIT && goog.userAgent.isVersionOrHigher("528"), HTML5_NETWORK_EVENTS_FIRE_ON_BODY:goog.userAgent.GECKO && !goog.userAgent.isVersionOrHigher("8") || goog.userAgent.IE && !goog.userAgent.isVersionOrHigher("9"), TOUCH_ENABLED:"ontouchstart" in goog.global || !!(goog.global.document && document.documentElement && "ontouchstart" in document.documentElement) || !(!goog.global.navigator || 
!goog.global.navigator.msMaxTouchPoints)};
goog.events.getVendorPrefixedName_ = function(eventName) {
  return goog.userAgent.WEBKIT ? "webkit" + eventName : goog.userAgent.OPERA ? "o" + eventName.toLowerCase() : eventName.toLowerCase()
};
goog.events.EventType = {CLICK:"click", DBLCLICK:"dblclick", MOUSEDOWN:"mousedown", MOUSEUP:"mouseup", MOUSEOVER:"mouseover", MOUSEOUT:"mouseout", MOUSEMOVE:"mousemove", SELECTSTART:"selectstart", KEYPRESS:"keypress", KEYDOWN:"keydown", KEYUP:"keyup", BLUR:"blur", FOCUS:"focus", DEACTIVATE:"deactivate", FOCUSIN:goog.userAgent.IE ? "focusin" : "DOMFocusIn", FOCUSOUT:goog.userAgent.IE ? "focusout" : "DOMFocusOut", CHANGE:"change", SELECT:"select", SUBMIT:"submit", INPUT:"input", PROPERTYCHANGE:"propertychange", 
DRAGSTART:"dragstart", DRAG:"drag", DRAGENTER:"dragenter", DRAGOVER:"dragover", DRAGLEAVE:"dragleave", DROP:"drop", DRAGEND:"dragend", TOUCHSTART:"touchstart", TOUCHMOVE:"touchmove", TOUCHEND:"touchend", TOUCHCANCEL:"touchcancel", BEFOREUNLOAD:"beforeunload", CONSOLEMESSAGE:"consolemessage", CONTEXTMENU:"contextmenu", DOMCONTENTLOADED:"DOMContentLoaded", ERROR:"error", HELP:"help", LOAD:"load", LOSECAPTURE:"losecapture", ORIENTATIONCHANGE:"orientationchange", READYSTATECHANGE:"readystatechange", 
RESIZE:"resize", SCROLL:"scroll", UNLOAD:"unload", HASHCHANGE:"hashchange", PAGEHIDE:"pagehide", PAGESHOW:"pageshow", POPSTATE:"popstate", COPY:"copy", PASTE:"paste", CUT:"cut", BEFORECOPY:"beforecopy", BEFORECUT:"beforecut", BEFOREPASTE:"beforepaste", ONLINE:"online", OFFLINE:"offline", MESSAGE:"message", CONNECT:"connect", ANIMATIONSTART:goog.events.getVendorPrefixedName_("AnimationStart"), ANIMATIONEND:goog.events.getVendorPrefixedName_("AnimationEnd"), ANIMATIONITERATION:goog.events.getVendorPrefixedName_("AnimationIteration"), 
TRANSITIONEND:goog.events.getVendorPrefixedName_("TransitionEnd"), MSGESTURECHANGE:"MSGestureChange", MSGESTUREEND:"MSGestureEnd", MSGESTUREHOLD:"MSGestureHold", MSGESTURESTART:"MSGestureStart", MSGESTURETAP:"MSGestureTap", MSGOTPOINTERCAPTURE:"MSGotPointerCapture", MSINERTIASTART:"MSInertiaStart", MSLOSTPOINTERCAPTURE:"MSLostPointerCapture", MSPOINTERCANCEL:"MSPointerCancel", MSPOINTERDOWN:"MSPointerDown", MSPOINTERMOVE:"MSPointerMove", MSPOINTEROVER:"MSPointerOver", MSPOINTEROUT:"MSPointerOut", 
MSPOINTERUP:"MSPointerUp", TEXTINPUT:"textinput", COMPOSITIONSTART:"compositionstart", COMPOSITIONUPDATE:"compositionupdate", COMPOSITIONEND:"compositionend", EXIT:"exit", LOADABORT:"loadabort", LOADCOMMIT:"loadcommit", LOADREDIRECT:"loadredirect", LOADSTART:"loadstart", LOADSTOP:"loadstop", RESPONSIVE:"responsive", SIZECHANGED:"sizechanged", UNRESPONSIVE:"unresponsive", VISIBILITYCHANGE:"visibilitychange"};
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
goog.events.Listenable = function() {
};
goog.events.Listenable.IMPLEMENTED_BY_PROP = "closure_listenable_" + (1E6 * Math.random() | 0);
goog.events.Listenable.addImplementation = function(cls) {
  cls.prototype[goog.events.Listenable.IMPLEMENTED_BY_PROP] = !0
};
goog.events.Listenable.isImplementedBy = function(obj) {
  try {
    return!(!obj || !obj[goog.events.Listenable.IMPLEMENTED_BY_PROP])
  }catch(e) {
    return!1
  }
};
goog.events.ListenableKey = function() {
};
goog.events.ListenableKey.counter_ = 0;
goog.events.ListenableKey.reserveKey = function() {
  return++goog.events.ListenableKey.counter_
};
goog.events.Listener = function(listener, proxy, src, type, capture, opt_handler) {
  this.listener = listener;
  this.proxy = proxy;
  this.src = src;
  this.type = type;
  this.capture = !!capture;
  this.handler = opt_handler;
  this.key = goog.events.ListenableKey.reserveKey();
  this.removed = this.callOnce = !1
};
goog.events.Listener.ENABLE_MONITORING = !1;
goog.events.Listener.prototype.markAsRemoved = function() {
  this.removed = !0;
  this.handler = this.src = this.proxy = this.listener = null
};
goog.events.ListenerMap = function(src) {
  this.src = src;
  this.listeners = {};
  this.typeCount_ = 0
};
goog.events.ListenerMap.prototype.getTypeCount = function() {
  return this.typeCount_
};
goog.events.ListenerMap.prototype.add = function(type, listener, callOnce, opt_useCapture, opt_listenerScope) {
  var listenerArray = this.listeners[type];
  listenerArray || (listenerArray = this.listeners[type] = [], this.typeCount_++);
  var listenerObj, index = goog.events.ListenerMap.findListenerIndex_(listenerArray, listener, opt_useCapture, opt_listenerScope);
  -1 < index ? (listenerObj = listenerArray[index], callOnce || (listenerObj.callOnce = !1)) : (listenerObj = new goog.events.Listener(listener, null, this.src, type, !!opt_useCapture, opt_listenerScope), listenerObj.callOnce = callOnce, listenerArray.push(listenerObj));
  return listenerObj
};
goog.events.ListenerMap.prototype.remove = function(type, listener, opt_useCapture, opt_listenerScope) {
  if(!(type in this.listeners)) {
    return!1
  }
  var listenerArray = this.listeners[type], index = goog.events.ListenerMap.findListenerIndex_(listenerArray, listener, opt_useCapture, opt_listenerScope);
  return-1 < index ? (listenerArray[index].markAsRemoved(), goog.array.removeAt(listenerArray, index), 0 == listenerArray.length && (delete this.listeners[type], this.typeCount_--), !0) : !1
};
goog.events.ListenerMap.prototype.removeByKey = function(listener) {
  var type = listener.type;
  if(!(type in this.listeners)) {
    return!1
  }
  var removed = goog.array.remove(this.listeners[type], listener);
  removed && (listener.markAsRemoved(), 0 == this.listeners[type].length && (delete this.listeners[type], this.typeCount_--));
  return removed
};
goog.events.ListenerMap.prototype.removeAll = function(opt_type) {
  var count = 0, type;
  for(type in this.listeners) {
    if(!opt_type || type == opt_type) {
      for(var listenerArray = this.listeners[type], i = 0;i < listenerArray.length;i++) {
        ++count, listenerArray[i].markAsRemoved()
      }
      delete this.listeners[type];
      this.typeCount_--
    }
  }
  return count
};
goog.events.ListenerMap.prototype.getListeners = function(type, capture) {
  var listenerArray = this.listeners[type], rv = [];
  if(listenerArray) {
    for(var i = 0;i < listenerArray.length;++i) {
      var listenerObj = listenerArray[i];
      listenerObj.capture == capture && rv.push(listenerObj)
    }
  }
  return rv
};
goog.events.ListenerMap.prototype.getListener = function(type, listener, capture, opt_listenerScope) {
  var listenerArray = this.listeners[type], i = -1;
  listenerArray && (i = goog.events.ListenerMap.findListenerIndex_(listenerArray, listener, capture, opt_listenerScope));
  return-1 < i ? listenerArray[i] : null
};
goog.events.ListenerMap.prototype.hasListener = function(opt_type, opt_capture) {
  var hasType = goog.isDef(opt_type), hasCapture = goog.isDef(opt_capture);
  return goog.object.some(this.listeners, function(listenerArray) {
    for(var i = 0;i < listenerArray.length;++i) {
      if(!(hasType && listenerArray[i].type != opt_type || hasCapture && listenerArray[i].capture != opt_capture)) {
        return!0
      }
    }
    return!1
  })
};
goog.events.ListenerMap.findListenerIndex_ = function(listenerArray, listener, opt_useCapture, opt_listenerScope) {
  for(var i = 0;i < listenerArray.length;++i) {
    var listenerObj = listenerArray[i];
    if(!listenerObj.removed && listenerObj.listener == listener && listenerObj.capture == !!opt_useCapture && listenerObj.handler == opt_listenerScope) {
      return i
    }
  }
  return-1
};
goog.events.listeners_ = {};
goog.events.LISTENER_MAP_PROP_ = "closure_lm_" + (1E6 * Math.random() | 0);
goog.events.onString_ = "on";
goog.events.onStringMap_ = {};
goog.events.CaptureSimulationMode = {OFF_AND_FAIL:0, OFF_AND_SILENT:1, ON:2};
goog.events.CAPTURE_SIMULATION_MODE = 2;
goog.events.listenerCountEstimate_ = 0;
goog.events.listen = function(src, type, listener, opt_capt, opt_handler) {
  if(goog.isArray(type)) {
    for(var i = 0;i < type.length;i++) {
      goog.events.listen(src, type[i], listener, opt_capt, opt_handler)
    }
    return null
  }
  listener = goog.events.wrapListener_(listener);
  return goog.events.Listenable.isImplementedBy(src) ? src.listen(type, listener, opt_capt, opt_handler) : goog.events.listen_(src, type, listener, !1, opt_capt, opt_handler)
};
goog.events.listen_ = function(src, type, listener, callOnce, opt_capt, opt_handler) {
  if(!type) {
    throw Error("Invalid event type");
  }
  var capture = !!opt_capt;
  if(capture && !goog.events.BrowserFeature.HAS_W3C_EVENT_SUPPORT) {
    if(goog.events.CAPTURE_SIMULATION_MODE == goog.events.CaptureSimulationMode.OFF_AND_FAIL) {
      return goog.asserts.fail("Can not register capture listener in IE8-."), null
    }
    if(goog.events.CAPTURE_SIMULATION_MODE == goog.events.CaptureSimulationMode.OFF_AND_SILENT) {
      return null
    }
  }
  var listenerMap = goog.events.getListenerMap_(src);
  listenerMap || (src[goog.events.LISTENER_MAP_PROP_] = listenerMap = new goog.events.ListenerMap(src));
  var listenerObj = listenerMap.add(type, listener, callOnce, opt_capt, opt_handler);
  if(listenerObj.proxy) {
    return listenerObj
  }
  var proxy = goog.events.getProxy();
  listenerObj.proxy = proxy;
  proxy.src = src;
  proxy.listener = listenerObj;
  src.addEventListener ? src.addEventListener(type, proxy, capture) : src.attachEvent(goog.events.getOnString_(type), proxy);
  goog.events.listenerCountEstimate_++;
  return listenerObj
};
goog.events.getProxy = function() {
  var proxyCallbackFunction = goog.events.handleBrowserEvent_, f = goog.events.BrowserFeature.HAS_W3C_EVENT_SUPPORT ? function(eventObject) {
    return proxyCallbackFunction.call(f.src, f.listener, eventObject)
  } : function(eventObject) {
    var v = proxyCallbackFunction.call(f.src, f.listener, eventObject);
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
  listener = goog.events.wrapListener_(listener);
  return goog.events.Listenable.isImplementedBy(src) ? src.listenOnce(type, listener, opt_capt, opt_handler) : goog.events.listen_(src, type, listener, !0, opt_capt, opt_handler)
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
  listener = goog.events.wrapListener_(listener);
  if(goog.events.Listenable.isImplementedBy(src)) {
    return src.unlisten(type, listener, opt_capt, opt_handler)
  }
  if(!src) {
    return!1
  }
  var listenerMap = goog.events.getListenerMap_(src);
  if(listenerMap) {
    var listenerObj = listenerMap.getListener(type, listener, !!opt_capt, opt_handler);
    if(listenerObj) {
      return goog.events.unlistenByKey(listenerObj)
    }
  }
  return!1
};
goog.events.unlistenByKey = function(key) {
  if(goog.isNumber(key) || !key || key.removed) {
    return!1
  }
  var src = key.src;
  if(goog.events.Listenable.isImplementedBy(src)) {
    return src.unlistenByKey(key)
  }
  var type = key.type, proxy = key.proxy;
  src.removeEventListener ? src.removeEventListener(type, proxy, key.capture) : src.detachEvent && src.detachEvent(goog.events.getOnString_(type), proxy);
  goog.events.listenerCountEstimate_--;
  var listenerMap = goog.events.getListenerMap_(src);
  listenerMap ? (listenerMap.removeByKey(key), 0 == listenerMap.getTypeCount() && (listenerMap.src = null, src[goog.events.LISTENER_MAP_PROP_] = null)) : key.markAsRemoved();
  return!0
};
goog.events.unlistenWithWrapper = function(src, wrapper, listener, opt_capt, opt_handler) {
  wrapper.unlisten(src, listener, opt_capt, opt_handler)
};
goog.events.removeAll = function(opt_obj, opt_type) {
  if(!opt_obj) {
    return 0
  }
  if(goog.events.Listenable.isImplementedBy(opt_obj)) {
    return opt_obj.removeAllListeners(opt_type)
  }
  var listenerMap = goog.events.getListenerMap_(opt_obj);
  if(!listenerMap) {
    return 0
  }
  var count = 0, type;
  for(type in listenerMap.listeners) {
    if(!opt_type || type == opt_type) {
      for(var listeners = goog.array.clone(listenerMap.listeners[type]), i = 0;i < listeners.length;++i) {
        goog.events.unlistenByKey(listeners[i]) && ++count
      }
    }
  }
  return count
};
goog.events.removeAllNativeListeners = function() {
  return goog.events.listenerCountEstimate_ = 0
};
goog.events.getListeners = function(obj, type, capture) {
  if(goog.events.Listenable.isImplementedBy(obj)) {
    return obj.getListeners(type, capture)
  }
  if(!obj) {
    return[]
  }
  var listenerMap = goog.events.getListenerMap_(obj);
  return listenerMap ? listenerMap.getListeners(type, capture) : []
};
goog.events.getListener = function(src, type, listener, opt_capt, opt_handler) {
  listener = goog.events.wrapListener_(listener);
  var capture = !!opt_capt;
  if(goog.events.Listenable.isImplementedBy(src)) {
    return src.getListener(type, listener, capture, opt_handler)
  }
  if(!src) {
    return null
  }
  var listenerMap = goog.events.getListenerMap_(src);
  return listenerMap ? listenerMap.getListener(type, listener, capture, opt_handler) : null
};
goog.events.hasListener = function(obj, opt_type, opt_capture) {
  if(goog.events.Listenable.isImplementedBy(obj)) {
    return obj.hasListener(opt_type, opt_capture)
  }
  var listenerMap = goog.events.getListenerMap_(obj);
  return!!listenerMap && listenerMap.hasListener(opt_type, opt_capture)
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
  return goog.events.Listenable.isImplementedBy(obj) ? obj.fireListeners(type, capture, eventObject) : goog.events.fireListeners_(obj, type, capture, eventObject)
};
goog.events.fireListeners_ = function(obj, type, capture, eventObject) {
  var retval = 1, listenerMap = goog.events.getListenerMap_(obj);
  if(listenerMap) {
    var listenerArray = listenerMap.listeners[type];
    if(listenerArray) {
      for(var listenerArray = goog.array.clone(listenerArray), i = 0;i < listenerArray.length;i++) {
        var listener = listenerArray[i];
        listener && listener.capture == capture && !listener.removed && (retval &= !1 !== goog.events.fireListener(listener, eventObject))
      }
    }
  }
  return Boolean(retval)
};
goog.events.fireListener = function(listener, eventObject) {
  var listenerFn = listener.listener, listenerHandler = listener.handler || listener.src;
  listener.callOnce && goog.events.unlistenByKey(listener);
  return listenerFn.call(listenerHandler, eventObject)
};
goog.events.getTotalListenerCount = function() {
  return goog.events.listenerCountEstimate_
};
goog.events.dispatchEvent = function(src, e) {
  goog.asserts.assert(goog.events.Listenable.isImplementedBy(src), "Can not use goog.events.dispatchEvent with non-goog.events.Listenable instance.");
  return src.dispatchEvent(e)
};
goog.events.protectBrowserEventEntryPoint = function(errorHandler) {
  goog.events.handleBrowserEvent_ = errorHandler.protectEntryPoint(goog.events.handleBrowserEvent_)
};
goog.events.handleBrowserEvent_ = function(listener, opt_evt) {
  if(listener.removed) {
    return!0
  }
  if(!goog.events.BrowserFeature.HAS_W3C_EVENT_SUPPORT) {
    var ieEvent = opt_evt || goog.getObjectByName("window.event"), evt = new goog.events.BrowserEvent(ieEvent, this), retval = !0;
    if(goog.events.CAPTURE_SIMULATION_MODE == goog.events.CaptureSimulationMode.ON) {
      if(!goog.events.isMarkedIeEvent_(ieEvent)) {
        goog.events.markIeEvent_(ieEvent);
        for(var ancestors = [], parent = evt.currentTarget;parent;parent = parent.parentNode) {
          ancestors.push(parent)
        }
        for(var type = listener.type, i = ancestors.length - 1;!evt.propagationStopped_ && 0 <= i;i--) {
          evt.currentTarget = ancestors[i], retval &= goog.events.fireListeners_(ancestors[i], type, !0, evt)
        }
        for(i = 0;!evt.propagationStopped_ && i < ancestors.length;i++) {
          evt.currentTarget = ancestors[i], retval &= goog.events.fireListeners_(ancestors[i], type, !1, evt)
        }
      }
    }else {
      retval = goog.events.fireListener(listener, evt)
    }
    return retval
  }
  return goog.events.fireListener(listener, new goog.events.BrowserEvent(opt_evt, this))
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
goog.events.getListenerMap_ = function(src) {
  var listenerMap = src[goog.events.LISTENER_MAP_PROP_];
  return listenerMap instanceof goog.events.ListenerMap ? listenerMap : null
};
goog.events.LISTENER_WRAPPER_PROP_ = "__closure_events_fn_" + (1E9 * Math.random() >>> 0);
goog.events.wrapListener_ = function(listener) {
  goog.asserts.assert(listener, "Listener can not be null.");
  if(goog.isFunction(listener)) {
    return listener
  }
  goog.asserts.assert(listener.handleEvent, "An object listener must have handleEvent method.");
  return listener[goog.events.LISTENER_WRAPPER_PROP_] || (listener[goog.events.LISTENER_WRAPPER_PROP_] = function(e) {
    return listener.handleEvent(e)
  })
};
goog.debug.entryPointRegistry.register(function(transformer) {
  goog.events.handleBrowserEvent_ = transformer(goog.events.handleBrowserEvent_)
});
goog.events.EventTarget = function() {
  goog.Disposable.call(this);
  this.eventTargetListeners_ = new goog.events.ListenerMap(this);
  this.actualEventTarget_ = this
};
goog.inherits(goog.events.EventTarget, goog.Disposable);
goog.events.Listenable.addImplementation(goog.events.EventTarget);
goog.events.EventTarget.MAX_ANCESTORS_ = 1E3;
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
  this.assertInitialized_();
  var ancestorsTree, ancestor = this.getParentEventTarget();
  if(ancestor) {
    ancestorsTree = [];
    for(var ancestorCount = 1;ancestor;ancestor = ancestor.getParentEventTarget()) {
      ancestorsTree.push(ancestor), goog.asserts.assert(++ancestorCount < goog.events.EventTarget.MAX_ANCESTORS_, "infinite loop")
    }
  }
  return goog.events.EventTarget.dispatchEventInternal_(this.actualEventTarget_, e, ancestorsTree)
};
goog.events.EventTarget.prototype.disposeInternal = function() {
  goog.events.EventTarget.superClass_.disposeInternal.call(this);
  this.removeAllListeners();
  this.parentEventTarget_ = null
};
goog.events.EventTarget.prototype.listen = function(type, listener, opt_useCapture, opt_listenerScope) {
  this.assertInitialized_();
  return this.eventTargetListeners_.add(type, listener, !1, opt_useCapture, opt_listenerScope)
};
goog.events.EventTarget.prototype.listenOnce = function(type, listener, opt_useCapture, opt_listenerScope) {
  return this.eventTargetListeners_.add(type, listener, !0, opt_useCapture, opt_listenerScope)
};
goog.events.EventTarget.prototype.unlisten = function(type, listener, opt_useCapture, opt_listenerScope) {
  return this.eventTargetListeners_.remove(type, listener, opt_useCapture, opt_listenerScope)
};
goog.events.EventTarget.prototype.unlistenByKey = function(key) {
  return this.eventTargetListeners_.removeByKey(key)
};
goog.events.EventTarget.prototype.removeAllListeners = function(opt_type) {
  return this.eventTargetListeners_ ? this.eventTargetListeners_.removeAll(opt_type) : 0
};
goog.events.EventTarget.prototype.fireListeners = function(type, capture, eventObject) {
  var listenerArray = this.eventTargetListeners_.listeners[type];
  if(!listenerArray) {
    return!0
  }
  for(var listenerArray = goog.array.clone(listenerArray), rv = !0, i = 0;i < listenerArray.length;++i) {
    var listener = listenerArray[i];
    if(listener && !listener.removed && listener.capture == capture) {
      var listenerFn = listener.listener, listenerHandler = listener.handler || listener.src;
      listener.callOnce && this.unlistenByKey(listener);
      rv = !1 !== listenerFn.call(listenerHandler, eventObject) && rv
    }
  }
  return rv && !1 != eventObject.returnValue_
};
goog.events.EventTarget.prototype.getListeners = function(type, capture) {
  return this.eventTargetListeners_.getListeners(type, capture)
};
goog.events.EventTarget.prototype.getListener = function(type, listener, capture, opt_listenerScope) {
  return this.eventTargetListeners_.getListener(type, listener, capture, opt_listenerScope)
};
goog.events.EventTarget.prototype.hasListener = function(opt_type, opt_capture) {
  return this.eventTargetListeners_.hasListener(opt_type, opt_capture)
};
goog.events.EventTarget.prototype.assertInitialized_ = function() {
  goog.asserts.assert(this.eventTargetListeners_, "Event target is not initialized. Did you call the superclass (goog.events.EventTarget) constructor?")
};
goog.events.EventTarget.dispatchEventInternal_ = function(target, e, opt_ancestorsTree) {
  var type = e.type || e;
  if(goog.isString(e)) {
    e = new goog.events.Event(e, target)
  }else {
    if(e instanceof goog.events.Event) {
      e.target = e.target || target
    }else {
      var oldEvent = e;
      e = new goog.events.Event(type, target);
      goog.object.extend(e, oldEvent)
    }
  }
  var rv = !0, currentTarget;
  if(opt_ancestorsTree) {
    for(var i = opt_ancestorsTree.length - 1;!e.propagationStopped_ && 0 <= i;i--) {
      currentTarget = e.currentTarget = opt_ancestorsTree[i], rv = currentTarget.fireListeners(type, !0, e) && rv
    }
  }
  e.propagationStopped_ || (currentTarget = e.currentTarget = target, rv = currentTarget.fireListeners(type, !0, e) && rv, e.propagationStopped_ || (rv = currentTarget.fireListeners(type, !1, e) && rv));
  if(opt_ancestorsTree) {
    for(i = 0;!e.propagationStopped_ && i < opt_ancestorsTree.length;i++) {
      currentTarget = e.currentTarget = opt_ancestorsTree[i], rv = currentTarget.fireListeners(type, !1, e) && rv
    }
  }
  return rv
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
goog.structs.Map = function(opt_map, var_args) {
  this.map_ = {};
  this.keys_ = [];
  this.version_ = this.count_ = 0;
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
    for(rv = [], i = 0;i < l;i++) {
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
    for(rv = [], i = 0;i < l;i++) {
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
goog.debug.LOGGING_ENABLED = goog.DEBUG;
goog.debug.catchErrors = function(logFunc, opt_cancel, opt_target) {
  var target = opt_target || goog.global, oldErrorHandler = target.onerror, retVal = !!opt_cancel;
  goog.userAgent.WEBKIT && !goog.userAgent.isVersionOrHigher("535.3") && (retVal = !retVal);
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
    fileName = err.fileName || err.filename || err.sourceURL || goog.global.$googDebugFname || href
  }catch(e$$0) {
    fileName = "Not available", threwError = !0
  }
  return!threwError && err.lineNumber && err.fileName && err.stack && err.message && err.name ? err : {message:err.message || "Not available", name:err.name || "UnknownError", lineNumber:lineNumber, fileName:fileName, stack:err.stack || "Not available"}
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
goog.debug.Logger.prototype.addHandler = function(handler) {
  goog.debug.LOGGING_ENABLED && (goog.debug.Logger.ENABLE_HIERARCHY ? (this.handlers_ || (this.handlers_ = []), this.handlers_.push(handler)) : (goog.asserts.assert(!this.name_, "Cannot call addHandler on a non-root logger when goog.debug.Logger.ENABLE_HIERARCHY is false."), goog.debug.Logger.rootHandlers_.push(handler)))
};
goog.debug.Logger.prototype.removeHandler = function(handler) {
  if(goog.debug.LOGGING_ENABLED) {
    var handlers = goog.debug.Logger.ENABLE_HIERARCHY ? this.handlers_ : goog.debug.Logger.rootHandlers_;
    return!!handlers && goog.array.remove(handlers, handler)
  }
  return!1
};
goog.debug.Logger.prototype.getParent = function() {
  return this.parent_
};
goog.debug.Logger.prototype.getChildren = function() {
  this.children_ || (this.children_ = {});
  return this.children_
};
goog.debug.Logger.prototype.setLevel = function(level) {
  goog.debug.LOGGING_ENABLED && (goog.debug.Logger.ENABLE_HIERARCHY ? this.level_ = level : (goog.asserts.assert(!this.name_, "Cannot call setLevel() on a non-root logger when goog.debug.Logger.ENABLE_HIERARCHY is false."), goog.debug.Logger.rootLevel_ = level))
};
goog.debug.Logger.prototype.getEffectiveLevel = function() {
  if(!goog.debug.LOGGING_ENABLED) {
    return goog.debug.Logger.Level.OFF
  }
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
  return goog.debug.LOGGING_ENABLED && level.value >= this.getEffectiveLevel().value
};
goog.debug.Logger.prototype.log = function(level, msg, opt_exception) {
  goog.debug.LOGGING_ENABLED && this.isLoggable(level) && this.doLogRecord_(this.getLogRecord(level, msg, opt_exception))
};
goog.debug.Logger.prototype.getLogRecord = function(level, msg, opt_exception) {
  var logRecord = goog.debug.LogBuffer.isBufferingEnabled() ? goog.debug.LogBuffer.getInstance().addRecord(level, msg, this.name_) : new goog.debug.LogRecord(level, String(msg), this.name_);
  opt_exception && (logRecord.setException(opt_exception), logRecord.setExceptionText(goog.debug.exposeException(opt_exception, arguments.callee.caller)));
  return logRecord
};
goog.debug.Logger.prototype.severe = function(msg, opt_exception) {
  goog.debug.LOGGING_ENABLED && this.log(goog.debug.Logger.Level.SEVERE, msg, opt_exception)
};
goog.debug.Logger.prototype.warning = function(msg, opt_exception) {
  goog.debug.LOGGING_ENABLED && this.log(goog.debug.Logger.Level.WARNING, msg, opt_exception)
};
goog.debug.Logger.prototype.info = function(msg, opt_exception) {
  goog.debug.LOGGING_ENABLED && this.log(goog.debug.Logger.Level.INFO, msg, opt_exception)
};
goog.debug.Logger.prototype.fine = function(msg, opt_exception) {
  goog.debug.LOGGING_ENABLED && this.log(goog.debug.Logger.Level.FINE, msg, opt_exception)
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
goog.log = {};
goog.log.ENABLED = goog.debug.LOGGING_ENABLED;
goog.log.Logger = goog.debug.Logger;
goog.log.Level = goog.debug.Logger.Level;
goog.log.LogRecord = goog.debug.LogRecord;
goog.log.getLogger = function(name, opt_level) {
  if(goog.log.ENABLED) {
    var logger = goog.debug.Logger.getLogger(name);
    opt_level && logger && logger.setLevel(opt_level);
    return logger
  }
  return null
};
goog.log.addHandler = function(logger, handler) {
  goog.log.ENABLED && logger && logger.addHandler(handler)
};
goog.log.removeHandler = function(logger, handler) {
  return goog.log.ENABLED && logger ? logger.removeHandler(handler) : !1
};
goog.log.log = function(logger, level, msg, opt_exception) {
  goog.log.ENABLED && logger && logger.log(level, msg, opt_exception)
};
goog.log.error = function(logger, msg, opt_exception) {
  goog.log.ENABLED && logger && logger.severe(msg, opt_exception)
};
goog.log.warning = function(logger, msg, opt_exception) {
  goog.log.ENABLED && logger && logger.warning(msg, opt_exception)
};
goog.log.info = function(logger, msg, opt_exception) {
  goog.log.ENABLED && logger && logger.info(msg, opt_exception)
};
goog.log.fine = function(logger, msg, opt_exception) {
  goog.log.ENABLED && logger && logger.fine(msg, opt_exception)
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
goog.Timer.defaultTimerObject = goog.global;
goog.Timer.intervalScale = 0.8;
goog.Timer.prototype.timer_ = null;
goog.Timer.prototype.tick_ = function() {
  if(this.enabled) {
    var elapsed = goog.now() - this.last_;
    0 < elapsed && elapsed < this.interval_ * goog.Timer.intervalScale ? this.timer_ = this.timerObject_.setTimeout(this.boundTick_, this.interval_ - elapsed) : (this.timer_ && (this.timerObject_.clearTimeout(this.timer_), this.timer_ = null), this.dispatchTick(), this.enabled && (this.timer_ = this.timerObject_.setTimeout(this.boundTick_, this.interval_), this.last_ = goog.now()))
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
goog.uri.utils.appendParam = function(uri, key, opt_value) {
  var paramArr = [uri, "&", key];
  goog.isDefAndNotNull(opt_value) && paramArr.push("=", goog.string.urlEncode(opt_value));
  return goog.uri.utils.appendQueryData_(paramArr)
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
  this.xmlHttpFactory_ = opt_xmlHttpFactory || null;
  this.active_ = !1;
  this.xhrOptions_ = this.xhr_ = null;
  this.lastError_ = this.lastMethod_ = this.lastUri_ = "";
  this.inAbort_ = this.inOpen_ = this.inSend_ = this.errorDispatched_ = !1;
  this.timeoutInterval_ = 0;
  this.timeoutId_ = null;
  this.responseType_ = goog.net.XhrIo.ResponseType.DEFAULT;
  this.useXhr2Timeout_ = this.withCredentials_ = !1
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
goog.net.XhrIo.prototype.cleanupSend_ = function() {
  this.dispose();
  goog.array.remove(goog.net.XhrIo.sendInstances_, this)
};
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
    goog.log.fine(this.logger_, this.formatMsg_("Opening Xhr")), this.inOpen_ = !0, this.xhr_.open(method, url, !0), this.inOpen_ = !1
  }catch(err) {
    goog.log.fine(this.logger_, this.formatMsg_("Error opening Xhr: " + err.message));
    this.error_(goog.net.ErrorCode.EXCEPTION, err);
    return
  }
  var content = opt_content || "", headers = this.headers.clone();
  opt_headers && goog.structs.forEach(opt_headers, function(value, key) {
    headers.set(key, value)
  });
  var contentTypeKey = goog.array.find(headers.getKeys(), goog.net.XhrIo.isContentTypeHeader_), contentIsFormData = goog.global.FormData && content instanceof goog.global.FormData;
  !goog.array.contains(goog.net.XhrIo.METHODS_WITH_FORM_DATA, method) || contentTypeKey || contentIsFormData || headers.set(goog.net.XhrIo.CONTENT_TYPE_HEADER, goog.net.XhrIo.FORM_CONTENT_TYPE);
  goog.structs.forEach(headers, function(value, key) {
    this.xhr_.setRequestHeader(key, value)
  }, this);
  this.responseType_ && (this.xhr_.responseType = this.responseType_);
  goog.object.containsKey(this.xhr_, "withCredentials") && (this.xhr_.withCredentials = this.withCredentials_);
  try {
    this.cleanUpTimeoutTimer_(), 0 < this.timeoutInterval_ && (this.useXhr2Timeout_ = goog.net.XhrIo.shouldUseXhr2Timeout_(this.xhr_), goog.log.fine(this.logger_, this.formatMsg_("Will abort after " + this.timeoutInterval_ + "ms if incomplete, xhr2 " + this.useXhr2Timeout_)), this.useXhr2Timeout_ ? (this.xhr_[goog.net.XhrIo.XHR2_TIMEOUT_] = this.timeoutInterval_, this.xhr_[goog.net.XhrIo.XHR2_ON_TIMEOUT_] = goog.bind(this.timeout_, this)) : this.timeoutId_ = goog.Timer.callOnce(this.timeout_, this.timeoutInterval_, 
    this)), goog.log.fine(this.logger_, this.formatMsg_("Sending request")), this.inSend_ = !0, this.xhr_.send(content), this.inSend_ = !1
  }catch(err$$0) {
    goog.log.fine(this.logger_, this.formatMsg_("Send error: " + err$$0.message)), this.error_(goog.net.ErrorCode.EXCEPTION, err$$0)
  }
};
goog.net.XhrIo.shouldUseXhr2Timeout_ = function(xhr) {
  return goog.userAgent.IE && goog.userAgent.isVersionOrHigher(9) && goog.isNumber(xhr[goog.net.XhrIo.XHR2_TIMEOUT_]) && goog.isDef(xhr[goog.net.XhrIo.XHR2_ON_TIMEOUT_])
};
goog.net.XhrIo.isContentTypeHeader_ = function(header) {
  return goog.string.caseInsensitiveEquals(goog.net.XhrIo.CONTENT_TYPE_HEADER, header)
};
goog.net.XhrIo.prototype.createXhr = function() {
  return this.xmlHttpFactory_ ? this.xmlHttpFactory_.createInstance() : goog.net.XmlHttp()
};
goog.net.XhrIo.prototype.timeout_ = function() {
  "undefined" != typeof goog && this.xhr_ && (this.lastError_ = "Timed out after " + this.timeoutInterval_ + "ms, aborting", goog.log.fine(this.logger_, this.formatMsg_(this.lastError_)), this.dispatchEvent(goog.net.EventType.TIMEOUT), this.abort(goog.net.ErrorCode.TIMEOUT))
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
  this.xhr_ && this.active_ && (goog.log.fine(this.logger_, this.formatMsg_("Aborting")), this.active_ = !1, this.inAbort_ = !0, this.xhr_.abort(), this.inAbort_ = !1, this.dispatchEvent(goog.net.EventType.COMPLETE), this.dispatchEvent(goog.net.EventType.ABORT), this.cleanUpXhr_())
};
goog.net.XhrIo.prototype.disposeInternal = function() {
  this.xhr_ && (this.active_ && (this.active_ = !1, this.inAbort_ = !0, this.xhr_.abort(), this.inAbort_ = !1), this.cleanUpXhr_(!0));
  goog.net.XhrIo.superClass_.disposeInternal.call(this)
};
goog.net.XhrIo.prototype.onReadyStateChange_ = function() {
  if(!this.isDisposed()) {
    if(this.inOpen_ || this.inSend_ || this.inAbort_) {
      this.onReadyStateChangeHelper_()
    }else {
      this.onReadyStateChangeEntryPoint_()
    }
  }
};
goog.net.XhrIo.prototype.onReadyStateChangeEntryPoint_ = function() {
  this.onReadyStateChangeHelper_()
};
goog.net.XhrIo.prototype.onReadyStateChangeHelper_ = function() {
  if(this.active_ && "undefined" != typeof goog) {
    if(this.xhrOptions_[goog.net.XmlHttp.OptionType.LOCAL_REQUEST_ERROR] && this.getReadyState() == goog.net.XmlHttp.ReadyState.COMPLETE && 2 == this.getStatus()) {
      goog.log.fine(this.logger_, this.formatMsg_("Local request error detected and ignored"))
    }else {
      if(this.inSend_ && this.getReadyState() == goog.net.XmlHttp.ReadyState.COMPLETE) {
        goog.Timer.callOnce(this.onReadyStateChange_, 0, this)
      }else {
        if(this.dispatchEvent(goog.net.EventType.READY_STATE_CHANGE), this.isComplete()) {
          goog.log.fine(this.logger_, this.formatMsg_("Request complete"));
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
    this.cleanUpTimeoutTimer_();
    var xhr = this.xhr_, clearedOnReadyStateChange = this.xhrOptions_[goog.net.XmlHttp.OptionType.USE_NULL_FUNCTION] ? goog.nullFunction : null;
    this.xhrOptions_ = this.xhr_ = null;
    opt_fromDispose || this.dispatchEvent(goog.net.EventType.READY);
    try {
      xhr.onreadystatechange = clearedOnReadyStateChange
    }catch(e) {
      goog.log.error(this.logger_, "Problem encountered resetting onreadystatechange: " + e.message)
    }
  }
};
goog.net.XhrIo.prototype.cleanUpTimeoutTimer_ = function() {
  this.xhr_ && this.useXhr2Timeout_ && (this.xhr_[goog.net.XhrIo.XHR2_ON_TIMEOUT_] = null);
  goog.isNumber(this.timeoutId_) && (goog.Timer.clear(this.timeoutId_), this.timeoutId_ = null)
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
    return goog.log.warning(this.logger_, "Can not get status: " + e.message), -1
  }
};
goog.net.XhrIo.prototype.getStatusText = function() {
  try {
    return this.getReadyState() > goog.net.XmlHttp.ReadyState.LOADED ? this.xhr_.statusText : ""
  }catch(e) {
    return goog.log.fine(this.logger_, "Can not get status: " + e.message), ""
  }
};
goog.net.XhrIo.prototype.getResponseText = function() {
  try {
    return this.xhr_ ? this.xhr_.responseText : ""
  }catch(e) {
    return goog.log.fine(this.logger_, "Can not get responseText: " + e.message), ""
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
  if(goog.string.contains(path, "./") || goog.string.contains(path, "/.")) {
    for(var leadingSlash = goog.string.startsWith(path, "/"), segments = path.split("/"), out = [], pos = 0;pos < segments.length;) {
      var segment = segments[pos++];
      "." == segment ? leadingSlash && pos == segments.length && out.push("") : ".." == segment ? ((1 < out.length || 1 == out.length && "" != out[0]) && out.pop(), leadingSlash && pos == segments.length && out.push("")) : (out.push(segment), leadingSlash = !0)
    }
    return out.join("/")
  }
  return path
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
  if(goog.isString(opt_key)) {
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
var ee = {data:{}};
ee.data.apiBaseUrl_ = null;
ee.data.tileBaseUrl_ = null;
ee.data.initialized_ = !1;
ee.data.deadlineMs_ = 0;
ee.data.DEFAULT_API_BASE_URL_ = "/api";
ee.data.DEFAULT_TILE_BASE_URL_ = "https://earthengine.googleapis.com";
ee.data.initialize = function(opt_apiBaseUrl, opt_tileBaseUrl) {
  goog.isDefAndNotNull(opt_apiBaseUrl) ? ee.data.apiBaseUrl_ = opt_apiBaseUrl : ee.data.initialized_ || (ee.data.apiBaseUrl_ = ee.data.DEFAULT_API_BASE_URL_);
  goog.isDefAndNotNull(opt_tileBaseUrl) ? ee.data.tileBaseUrl_ = opt_tileBaseUrl : ee.data.initialized_ || (ee.data.tileBaseUrl_ = ee.data.DEFAULT_TILE_BASE_URL_);
  ee.data.initialized_ = !0
};
ee.data.reset = function() {
  ee.data.apiBaseUrl_ = null;
  ee.data.tileBaseUrl_ = null;
  ee.data.initialized_ = !1
};
ee.data.setDeadline = function(milliseconds) {
  ee.data.deadlineMs_ = milliseconds
};
ee.data.getInfo = function(id, opt_callback) {
  return ee.data.send_("/info", (new goog.Uri.QueryData).add("id", id), opt_callback)
};
ee.data.getList = function(params, opt_callback) {
  var request = ee.data.makeRequest_(params);
  return ee.data.send_("/list", request, opt_callback)
};
ee.data.getMapId = function(params, opt_callback) {
  params.json_format = "v2";
  return ee.data.send_("/mapid", ee.data.makeRequest_(params), opt_callback)
};
ee.data.getTileUrl = function(mapid, x, y, z) {
  var width = Math.pow(2, z);
  x %= width;
  0 > x && (x += width);
  return[ee.data.tileBaseUrl_, "map", mapid.mapid, z, x, y].join("/") + "?token=" + mapid.token
};
ee.data.getValue = function(params, opt_callback) {
  params.json_format = "v2";
  return ee.data.send_("/value", ee.data.makeRequest_(params), opt_callback)
};
ee.data.getThumbId = function(params, opt_callback) {
  params.json_format = "v2";
  goog.isArray(params.size) && (params.size = params.size.join("x"));
  var request = ee.data.makeRequest_(params).add("getid", "1");
  return ee.data.send_("/thumb", request, opt_callback)
};
ee.data.makeThumbUrl = function(id) {
  return ee.data.tileBaseUrl_ + "/api/thumb?thumbid=" + id.thumbid + "&token=" + id.token
};
ee.data.getDownloadId = function(params, opt_callback) {
  params.json_format = "v2";
  return ee.data.send_("/download", ee.data.makeRequest_(params), opt_callback)
};
ee.data.makeDownloadUrl = function(id) {
  return ee.data.tileBaseUrl_ + "/api/download?docid=" + id.docid + "&token=" + id.token
};
ee.data.getAlgorithms = function(opt_callback) {
  return ee.data.send_("/algorithms", null, opt_callback, "GET")
};
ee.data.createAsset = function(value, opt_path, opt_callback) {
  var args = {value:value, json_format:"v2"};
  void 0 !== opt_path && (args.id = opt_path);
  return ee.data.send_("/create", ee.data.makeRequest_(args), opt_callback)
};
ee.data.newTaskId = function(opt_count, opt_callback) {
  var params = {};
  goog.isNumber(opt_count) && (params.count = opt_count);
  return ee.data.send_("/newtaskid", ee.data.makeRequest_(params), opt_callback)
};
ee.data.getTaskStatus = function(task_id, opt_callback) {
  if(goog.isString(task_id)) {
    task_id = [task_id]
  }else {
    if(!goog.isArray(task_id)) {
      throw Error("Invalid task_id: expected a string or an array of strings.");
    }
  }
  var url = "/taskstatus?q=" + task_id.join();
  return ee.data.send_(url, null, opt_callback, "GET")
};
ee.data.prepareValue = function(task_id, params, opt_callback) {
  params.tid = task_id;
  return ee.data.send_("/prepare", ee.data.makeRequest_(params), opt_callback)
};
ee.data.startProcessing = function(task_id, params, opt_callback) {
  params.id = task_id;
  return ee.data.send_("/processingrequest", ee.data.makeRequest_(params), opt_callback)
};
ee.data.send_ = function(path, params, opt_callback$$0, opt_method) {
  function handleResponse(responseText, opt_callback) {
    var jsonIsInvalid = !1;
    try {
      var response = goog.json.parse(responseText), data = response.data
    }catch(e) {
      jsonIsInvalid = !0
    }
    var errorMessage = void 0;
    jsonIsInvalid || !("data" in response || "error" in response) ? errorMessage = "Malformed response: " + responseText : "error" in response && (errorMessage = response.error.message);
    if(opt_callback) {
      opt_callback(data, errorMessage)
    }else {
      if(!errorMessage) {
        return data
      }
      throw Error(errorMessage);
    }
  }
  ee.data.initialize();
  opt_method = opt_method || "POST";
  var url = ee.data.apiBaseUrl_ + path, requestData = params ? params.toString() : "";
  if(opt_callback$$0) {
    goog.net.XhrIo.send(url, function(e) {
      return handleResponse(e.target.getResponseText(), opt_callback$$0)
    }, opt_method, requestData, {"Content-Type":"application/x-www-form-urlencoded"}, ee.data.deadlineMs_)
  }else {
    var xmlhttp = goog.net.XmlHttp();
    xmlhttp.open(opt_method, url, !1);
    xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
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
goog.exportSymbol("ee.data", ee.data);
goog.exportProperty(ee.data, "getInfo", ee.data.getInfo);
goog.exportProperty(ee.data, "getList", ee.data.getList);
goog.exportProperty(ee.data, "getMapId", ee.data.getMapId);
goog.exportProperty(ee.data, "getValue", ee.data.getValue);
goog.exportProperty(ee.data, "getThumbId", ee.data.getThumbId);
goog.exportProperty(ee.data, "makeThumbUrl", ee.data.makeThumbUrl);
goog.exportProperty(ee.data, "getDownloadId", ee.data.getDownloadId);
goog.exportProperty(ee.data, "makeDownloadUrl", ee.data.makeDownloadUrl);
goog.functions = {};
goog.functions.constant = function(retValue) {
  return function() {
    return retValue
  }
};
goog.functions.FALSE = goog.functions.constant(!1);
goog.functions.TRUE = goog.functions.constant(!0);
goog.functions.NULL = goog.functions.constant(null);
goog.functions.identity = function(opt_returnValue) {
  return opt_returnValue
};
goog.functions.error = function(message) {
  return function() {
    throw Error(message);
  }
};
goog.functions.fail = function(err) {
  return function() {
    throw err;
  }
};
goog.functions.lock = function(f, opt_numArgs) {
  opt_numArgs = opt_numArgs || 0;
  return function() {
    return f.apply(this, Array.prototype.slice.call(arguments, 0, opt_numArgs))
  }
};
goog.functions.nth = function(n) {
  return function() {
    return arguments[n]
  }
};
goog.functions.withReturnValue = function(f, retValue) {
  return goog.functions.sequence(f, goog.functions.constant(retValue))
};
goog.functions.compose = function(fn, var_args) {
  var functions = arguments, length = functions.length;
  return function() {
    var result;
    length && (result = functions[length - 1].apply(this, arguments));
    for(var i = length - 2;0 <= i;i--) {
      result = functions[i].call(this, result)
    }
    return result
  }
};
goog.functions.sequence = function(var_args) {
  var functions = arguments, length = functions.length;
  return function() {
    for(var result, i = 0;i < length;i++) {
      result = functions[i].apply(this, arguments)
    }
    return result
  }
};
goog.functions.and = function(var_args) {
  var functions = arguments, length = functions.length;
  return function() {
    for(var i = 0;i < length;i++) {
      if(!functions[i].apply(this, arguments)) {
        return!1
      }
    }
    return!0
  }
};
goog.functions.or = function(var_args) {
  var functions = arguments, length = functions.length;
  return function() {
    for(var i = 0;i < length;i++) {
      if(functions[i].apply(this, arguments)) {
        return!0
      }
    }
    return!1
  }
};
goog.functions.not = function(f) {
  return function() {
    return!f.apply(this, arguments)
  }
};
goog.functions.create = function(constructor, var_args) {
  var temp = function() {
  };
  temp.prototype = constructor.prototype;
  var obj = new temp;
  constructor.apply(obj, Array.prototype.slice.call(arguments, 1));
  return obj
};
goog.functions.CACHE_RETURN_VALUE = !0;
goog.functions.cacheReturnValue = function(fn) {
  var called = !1, value;
  return function() {
    if(!goog.functions.CACHE_RETURN_VALUE) {
      return fn()
    }
    called || (value = fn(), called = !0);
    return value
  }
};
ee.Encodable = function() {
};
goog.crypt = {};
goog.crypt.Hash = function() {
};
goog.crypt.Md5 = function() {
  this.chain_ = Array(4);
  this.block_ = Array(64);
  this.totalLength_ = this.blockLength_ = 0;
  this.reset()
};
goog.inherits(goog.crypt.Md5, goog.crypt.Hash);
goog.crypt.Md5.prototype.reset = function() {
  this.chain_[0] = 1732584193;
  this.chain_[1] = 4023233417;
  this.chain_[2] = 2562383102;
  this.chain_[3] = 271733878;
  this.totalLength_ = this.blockLength_ = 0
};
goog.crypt.Md5.prototype.compress_ = function(buf, opt_offset) {
  opt_offset || (opt_offset = 0);
  var X = Array(16);
  if(goog.isString(buf)) {
    for(var i = 0;16 > i;++i) {
      X[i] = buf.charCodeAt(opt_offset++) | buf.charCodeAt(opt_offset++) << 8 | buf.charCodeAt(opt_offset++) << 16 | buf.charCodeAt(opt_offset++) << 24
    }
  }else {
    for(i = 0;16 > i;++i) {
      X[i] = buf[opt_offset++] | buf[opt_offset++] << 8 | buf[opt_offset++] << 16 | buf[opt_offset++] << 24
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
  this.chain_[3] = this.chain_[3] + D & 4294967295
};
goog.crypt.Md5.prototype.update = function(bytes, opt_length) {
  goog.isDef(opt_length) || (opt_length = bytes.length);
  for(var lengthMinusBlock = opt_length - 64, block = this.block_, blockLength = this.blockLength_, i = 0;i < opt_length;) {
    if(0 == blockLength) {
      for(;i <= lengthMinusBlock;) {
        this.compress_(bytes, i), i += 64
      }
    }
    if(goog.isString(bytes)) {
      for(;i < opt_length;) {
        if(block[blockLength++] = bytes.charCodeAt(i++), 64 == blockLength) {
          this.compress_(block);
          blockLength = 0;
          break
        }
      }
    }else {
      for(;i < opt_length;) {
        if(block[blockLength++] = bytes[i++], 64 == blockLength) {
          this.compress_(block);
          blockLength = 0;
          break
        }
      }
    }
  }
  this.blockLength_ = blockLength;
  this.totalLength_ += opt_length
};
goog.crypt.Md5.prototype.digest = function() {
  var pad = Array((56 > this.blockLength_ ? 64 : 128) - this.blockLength_);
  pad[0] = 128;
  for(var i = 1;i < pad.length - 8;++i) {
    pad[i] = 0
  }
  for(var totalBits = 8 * this.totalLength_, i = pad.length - 8;i < pad.length;++i) {
    pad[i] = totalBits & 255, totalBits /= 256
  }
  this.update(pad);
  for(var digest = Array(16), n = 0, i = 0;4 > i;++i) {
    for(var j = 0;32 > j;j += 8) {
      digest[n++] = this.chain_[i] >>> j & 255
    }
  }
  return digest
};
ee.Serializer = function(opt_isCompound) {
  this.HASH_KEY = "__ee_hash__";
  this.isCompound_ = !1 !== opt_isCompound;
  this.scope_ = [];
  this.encoded_ = {}
};
ee.Serializer.jsonSerializer_ = new goog.json.Serializer;
ee.Serializer.hash_ = new goog.crypt.Md5;
ee.Serializer.toJSON = function(obj) {
  return ee.Serializer.jsonSerializer_.serialize((new ee.Serializer(!0)).encode_(obj))
};
ee.Serializer.toReadableJSON = function(obj) {
  var encoded = (new ee.Serializer(!1)).encode_(obj);
  return"JSON" in window ? window.JSON.stringify(encoded, null, "  ") : ee.Serializer.jsonSerializer_.serialize(encoded)
};
ee.Serializer.prototype.encode_ = function(object) {
  var value = this.encodeValue_(object);
  this.isCompound_ && (value = goog.isObject(value) && "ValueRef" == value.type && 1 == this.scope_.length ? this.scope_[0][1] : {type:"CompoundValue", scope:this.scope_, value:value}, this.scope_ = [], this.encoded_ = {});
  return value
};
ee.Serializer.prototype.encodeValue_ = function(object) {
  if(!goog.isDef(object)) {
    throw Error("Can't encode an undefined value.");
  }
  var result, hash = goog.isObject(object) ? object[this.HASH_KEY] : null;
  if(this.isCompound_ && null != hash && this.encoded_[hash]) {
    return{type:"ValueRef", value:this.encoded_[hash]}
  }
  if(null === object || goog.isBoolean(object) || goog.isNumber(object) || goog.isString(object)) {
    return object
  }
  if(goog.isDateLike(object)) {
    return{type:"Date", value:Math.floor(1E3 * object.getTime())}
  }
  if(object instanceof ee.Encodable) {
    if(result = object.encode(goog.bind(this.encodeValue_, this)), !goog.isObject(result) || "ArgumentRef" == result.type) {
      return result
    }
  }else {
    if(goog.isArray(object)) {
      result = goog.array.map(object, function(element) {
        return this.encodeValue_(element)
      }, this)
    }else {
      if(goog.isObject(object) && !goog.isFunction(object)) {
        var encodedObject = goog.object.map(object, function(element) {
          if(!goog.isFunction(element)) {
            return this.encodeValue_(element)
          }
        }, this);
        goog.object.remove(encodedObject, this.HASH_KEY);
        result = {type:"Dictionary", value:encodedObject}
      }else {
        throw Error("Can't encode object: " + object);
      }
    }
  }
  if(this.isCompound_) {
    ee.Serializer.hash_.reset();
    ee.Serializer.hash_.update(ee.Serializer.jsonSerializer_.serialize(result));
    var hash = ee.Serializer.hash_.digest(), name;
    this.encoded_[hash] ? name = this.encoded_[hash] : (name = String(this.scope_.length), this.scope_.push([name, result]), this.encoded_[hash] = name);
    object[this.HASH_KEY] = hash;
    return{type:"ValueRef", value:name}
  }
  return result
};
goog.exportSymbol("ee.Serializer", ee.Serializer);
goog.exportSymbol("ee.Serializer.toJSON", ee.Serializer.toJSON);
goog.exportSymbol("ee.Serializer.toReadableJSON", ee.Serializer.toReadableJSON);
ee.ComputedObject = function(func, args) {
  if(!(this instanceof ee.ComputedObject)) {
    return new ee.ComputedObject(func, args)
  }
  this.func = func;
  this.args = args
};
goog.inherits(ee.ComputedObject, ee.Encodable);
ee.ComputedObject.prototype.getInfo = function(opt_callback) {
  return ee.data.getValue({json:this.serialize()}, opt_callback)
};
ee.ComputedObject.prototype.encode = function(encoder) {
  var encodedArgs = {}, name;
  for(name in this.args) {
    goog.isDef(this.args[name]) && (encodedArgs[name] = encoder(this.args[name]))
  }
  var result = {type:"Invocation", arguments:encodedArgs}, func = encoder(this.func);
  result[goog.isString(func) ? "functionName" : "function"] = func;
  return result
};
ee.ComputedObject.prototype.serialize = function() {
  return ee.Serializer.toJSON(this)
};
ee.ComputedObject.prototype.toString = function() {
  return"ee." + this.name() + "(" + ee.Serializer.toReadableJSON(this) + ")"
};
ee.ComputedObject.prototype.name = function() {
  return"ComputedObject"
};
goog.exportSymbol("ee.ComputedObject", ee.ComputedObject);
goog.exportProperty(ee.ComputedObject.prototype, "getInfo", ee.ComputedObject.prototype.getInfo);
goog.exportProperty(ee.ComputedObject.prototype, "serialize", ee.ComputedObject.prototype.serialize);
goog.exportProperty(ee.ComputedObject.prototype, "toString", ee.ComputedObject.prototype.toString);
ee.Function = function() {
  if(!(this instanceof ee.Function)) {
    return new ee.Function
  }
};
goog.inherits(ee.Function, ee.Encodable);
ee.Function.promoter_ = goog.functions.identity;
ee.Function.registerPromoter = function(promoter) {
  ee.Function.promoter_ = promoter
};
ee.Function.prototype.call = function(var_args) {
  return this.apply(this.nameArgs(Array.prototype.slice.call(arguments, 0)))
};
ee.Function.prototype.apply = function(namedArgs) {
  var result = new ee.ComputedObject(this, this.promoteArgs(namedArgs));
  return ee.Function.promoter_(result, this.getReturnType())
};
ee.Function.prototype.promoteArgs = function(args) {
  for(var specs = this.getSignature().args, promotedArgs = {}, known = {}, i = 0;i < specs.length;i++) {
    var name = specs[i].name;
    if(name in args && goog.isDef(args[name])) {
      promotedArgs[name] = ee.Function.promoter_(args[name], specs[i].type)
    }else {
      if(!specs[i].optional) {
        throw Error("Required argument (" + name + ") missing to function: " + this);
      }
    }
    known[name] = !0
  }
  var unknown = [], argName;
  for(argName in args) {
    known[argName] || unknown.push(argName)
  }
  if(0 < unknown.length) {
    throw Error("Unrecognized arguments (" + unknown + ") to function: " + this);
  }
  return promotedArgs
};
ee.Function.prototype.nameArgs = function(args) {
  var specs = this.getSignature().args;
  if(specs.length < args.length) {
    throw Error("Too many (" + args.length + ") arguments to function: " + this);
  }
  for(var namedArgs = {}, i = 0;i < args.length;i++) {
    namedArgs[specs[i].name] = args[i]
  }
  return namedArgs
};
ee.Function.prototype.getReturnType = function() {
  return this.getSignature().returns
};
ee.Function.prototype.toString = function(opt_name, opt_isInstance) {
  var signature = this.getSignature(), buffer = [];
  buffer.push(opt_name || signature.name);
  buffer.push("(");
  buffer.push(goog.array.map(signature.args.slice(1), function(elem) {
    return elem.name
  }).join(", "));
  buffer.push(")\n");
  signature.description && (buffer.push("\n"), buffer.push(signature.description), buffer.push("\n"));
  if(signature.args.length) {
    buffer.push("\nArgs:\n");
    for(var i = 0;i < signature.args.length;i++) {
      opt_isInstance && 0 == i ? buffer.push("  this:") : buffer.push("\n  ");
      var arg = signature.args[i];
      buffer.push(arg.name);
      buffer.push(" (");
      buffer.push(arg.type);
      arg.optional && buffer.push(", optional");
      buffer.push("): ");
      buffer.push(arg.description)
    }
  }
  return buffer.join("")
};
ee.Function.prototype.serialize = function() {
  return ee.Serializer.toJSON(this)
};
ee.Types = {};
ee.Types.VAR_TYPE_KEY = "__EE_VAR_TYPE";
ee.Types.classToName = function(klass) {
  return klass.prototype instanceof ee.ComputedObject ? klass.prototype.name.call(null) : klass == Number ? "Number" : klass == String ? "String" : klass == Array ? "Array" : klass == Date ? "Date" : "Object"
};
ee.Types.isSubtype = function(firstType, secondType) {
  if(secondType == firstType) {
    return!0
  }
  switch(firstType) {
    case "EEObject":
      return"Image" == secondType || "Feature" == secondType || "Collection" == secondType || "EECollection" == secondType || "ImageCollection" == secondType || "FeatureCollection" == secondType;
    case "FeatureCollection":
    ;
    case "EECollection":
    ;
    case "Collection":
      return"Collection" == secondType || "EECollection" == secondType || "ImageCollection" == secondType || "FeatureCollection" == secondType;
    case "Object":
      return!0;
    default:
      return!1
  }
};
ee.Types.isNumber = function(obj) {
  return goog.isNumber(obj) || ee.Types.isVarOfType(obj, Number)
};
ee.Types.isString = function(obj) {
  return goog.isString(obj) || ee.Types.isVarOfType(obj, String)
};
ee.Types.isArray = function(obj) {
  return goog.isArray(obj) || ee.Types.isVarOfType(obj, Array)
};
ee.Types.isVarOfType = function(obj, klass) {
  if(obj instanceof ee.Encodable) {
    var type = obj[ee.Types.VAR_TYPE_KEY];
    return type && (type == klass || type.prototype instanceof klass)
  }
  return!1
};
ee.ApiFunction = function(name, opt_signature) {
  if(!goog.isDef(opt_signature)) {
    return ee.ApiFunction.lookup(name)
  }
  if(!(this instanceof ee.ApiFunction)) {
    return new ee.ApiFunction(name, opt_signature)
  }
  this.signature_ = goog.object.unsafeClone(opt_signature);
  this.signature_.name = name
};
goog.inherits(ee.ApiFunction, ee.Function);
ee.ApiFunction._call = function(name, var_args) {
  return ee.Function.prototype.call.apply(ee.ApiFunction.lookup(name), Array.prototype.slice.call(arguments, 1))
};
ee.ApiFunction._apply = function(name, namedArgs) {
  return ee.ApiFunction.lookup(name).apply(namedArgs)
};
ee.ApiFunction.prototype.encode = function() {
  return this.signature_.name
};
ee.ApiFunction.prototype.getSignature = function() {
  return this.signature_
};
ee.ApiFunction.api_ = null;
ee.ApiFunction.boundSignatures_ = {};
ee.ApiFunction.allSignatures = function() {
  ee.ApiFunction.initialize();
  return goog.object.map(ee.ApiFunction.api_, function(func) {
    return func.getSignature()
  })
};
ee.ApiFunction.unboundFunctions = function() {
  ee.ApiFunction.initialize();
  return goog.object.filter(ee.ApiFunction.api_, function(func, name) {
    return!ee.ApiFunction.boundSignatures_[name]
  })
};
ee.ApiFunction.lookup = function(name) {
  ee.ApiFunction.initialize();
  var func = ee.ApiFunction.api_[name];
  if(!func) {
    throw Error("Unknown built-in function name: " + name);
  }
  return func
};
ee.ApiFunction.initialize = function(opt_callback) {
  if(!ee.ApiFunction.api_) {
    var callback = function(data) {
      ee.ApiFunction.api_ = goog.object.map(data, function(sig, name) {
        sig.returns = sig.returns.replace(/<.*>/, "");
        for(var i = 0;i < sig.args.length;i++) {
          sig.args[i].type = sig.args[i].type.replace(/<.*>/, "")
        }
        return new ee.ApiFunction(name, sig)
      });
      opt_callback && opt_callback()
    };
    opt_callback ? ee.data.getAlgorithms(callback) : callback(ee.data.getAlgorithms())
  }
};
ee.ApiFunction.reset = function() {
  ee.ApiFunction.api_ = null;
  ee.ApiFunction.boundSignatures_ = {}
};
ee.ApiFunction.importApi = function(target, prefix, typeName, opt_prepend) {
  ee.ApiFunction.initialize();
  var prepend = opt_prepend || "";
  goog.object.forEach(ee.ApiFunction.api_, function(apiFunc, name) {
    var parts = name.split(".");
    if(2 == parts.length && parts[0] == prefix) {
      var fname = prepend + parts[1], signature = apiFunc.getSignature();
      ee.ApiFunction.boundSignatures_[name] = !0;
      var isInstance = !1;
      if(signature.args.length) {
        var firstArgType = signature.args[0].type, isInstance = "Object" != firstArgType && ee.Types.isSubtype(firstArgType, typeName)
      }
      var destination = isInstance ? target.prototype : target;
      fname in destination && (fname += "_");
      destination[fname] = function(var_args) {
        var args = Array.prototype.slice.call(arguments, 0);
        isInstance && args.unshift(this);
        return apiFunc.call.apply(apiFunc, args)
      };
      destination[fname].toString = goog.bind(apiFunc.toString, apiFunc, fname, isInstance);
      destination[fname].signature = signature
    }
  })
};
ee.ApiFunction.clearApi = function(target$$0) {
  var clear = function(target) {
    for(var name in target) {
      goog.isFunction(target[name]) && target[name].signature && delete target[name]
    }
  };
  clear(target$$0);
  clear(target$$0.prototype)
};
ee.CustomFunction = function(args, returnType, body) {
  if(!(this instanceof ee.CustomFunction)) {
    return new ee.CustomFunction(args, returnType, body)
  }
  var argNames, argTypes;
  if(goog.isFunction(body)) {
    if(goog.isArray(args) || !goog.isObject(args)) {
      throw Error('The "args" of a custom function created from a native JS function must be a map from name to type.');
    }
    argNames = [];
    argTypes = [];
    var vars = [], name;
    for(name in args) {
      var type = args[name];
      argNames.push(name);
      argTypes.push(type);
      vars.push(ee.CustomFunction.variable(type, name))
    }
    body = body.apply(null, vars)
  }else {
    if(!goog.isArray(args)) {
      throw Error('The "args" of a custom function created from an expression must be an array of names.');
    }
    argNames = args;
    argTypes = goog.array.map(args, function() {
      return Object
    })
  }
  this.argNames_ = argNames;
  this.argTypes_ = argTypes;
  this.returnType_ = returnType || Object;
  this.body_ = body
};
goog.inherits(ee.CustomFunction, ee.Function);
ee.CustomFunction.prototype.encode = function(encoder) {
  return{type:"Function", argumentNames:this.argNames_, body:encoder(this.body_)}
};
ee.CustomFunction.prototype.getSignature = function() {
  return{name:"", args:goog.array.map(this.argNames_, function(name, i) {
    return{name:name, type:ee.Types.classToName(this.argTypes_[i]), optional:!1}
  }, this), returns:ee.Types.classToName(this.returnType_)}
};
ee.CustomFunction.variable = function(type, name) {
  var Variable = function() {
  };
  type = type || Object;
  Variable.prototype = type.prototype instanceof ee.Encodable ? type.prototype : ee.Encodable.prototype;
  var instance = new Variable;
  instance.encode = function() {
    return{type:"ArgumentRef", value:name}
  };
  instance[ee.Types.VAR_TYPE_KEY] = type;
  return instance
};
ee.Filter = function(opt_filter) {
  if(!(this instanceof ee.Filter)) {
    return new ee.Filter(opt_filter)
  }
  if(opt_filter instanceof ee.Filter) {
    return opt_filter
  }
  ee.Filter.initialize();
  if(goog.isArray(opt_filter)) {
    if(0 == opt_filter.length) {
      throw Error("Empty list specified for ee.Filter().");
    }
    if(1 == opt_filter.length) {
      return new ee.Filter(opt_filter[0])
    }
    ee.ComputedObject.call(this, new ee.ApiFunction("Filter.and"), {filters:opt_filter});
    this.filter_ = opt_filter
  }else {
    if(opt_filter instanceof ee.ComputedObject) {
      ee.ComputedObject.call(this, opt_filter.func, opt_filter.args), this.filter_ = [opt_filter]
    }else {
      if(goog.isDef(opt_filter)) {
        throw Error("Invalid argument specified for ee.Filter(): " + opt_filter);
      }
      ee.ComputedObject.call(this, null, null);
      this.filter_ = []
    }
  }
};
goog.inherits(ee.Filter, ee.ComputedObject);
ee.Filter.initialized_ = !1;
ee.Filter.initialize = function() {
  ee.Filter.initialized_ || (ee.ApiFunction.importApi(ee.Filter, "Filter", "Filter"), ee.Filter.initialized_ = !0)
};
ee.Filter.reset = function() {
  ee.ApiFunction.clearApi(ee.Filter);
  ee.Filter.initialized_ = !1
};
ee.Filter.functionNames_ = {equals:"equals", less_than:"lessThan", greater_than:"greaterThan", contains:"stringContains", starts_with:"stringStartsWith", ends_with:"stringEndsWith"};
ee.Filter.prototype.length = function() {
  return this.filter_.length
};
ee.Filter.prototype.append_ = function(newFilter) {
  var prev = this.filter_.slice(0);
  newFilter instanceof ee.Filter ? goog.array.extend(prev, newFilter.filter_) : newFilter instanceof Array ? goog.array.extend(prev, newFilter) : prev.push(newFilter);
  return new ee.Filter(prev)
};
ee.Filter.prototype.not = function() {
  return ee.ApiFunction._call("Filter.not", this)
};
ee.Filter.metadata = function(name, operator, value) {
  operator = operator.toLowerCase();
  var negated = !1;
  goog.string.startsWith(operator, "not_") && (negated = !0, operator = operator.substring(4));
  if(!(operator in ee.Filter.functionNames_)) {
    throw Error("Unknown filtering operator: " + operator);
  }
  var filter = ee.ApiFunction._call("Filter." + ee.Filter.functionNames_[operator], name, value);
  return negated ? filter.not() : filter
};
ee.Filter.eq = function(name, value) {
  return ee.ApiFunction._call("Filter.equals", name, value)
};
ee.Filter.neq = function(name, value) {
  return ee.Filter.eq(name, value).not()
};
ee.Filter.lt = function(name, value) {
  return ee.ApiFunction._call("Filter.lessThan", name, value)
};
ee.Filter.gte = function(name, value) {
  return ee.Filter.lt(name, value).not()
};
ee.Filter.gt = function(name, value) {
  return ee.ApiFunction._call("Filter.greaterThan", name, value)
};
ee.Filter.lte = function(name, value) {
  return ee.Filter.gt(name, value).not()
};
ee.Filter.contains = function(name, value) {
  return ee.ApiFunction._call("Filter.stringContains", name, value)
};
ee.Filter.not_contains = function(name, value) {
  return ee.Filter.contains(name, value).not()
};
ee.Filter.starts_with = function(name, value) {
  return ee.ApiFunction._call("Filter.stringStartsWith", name, value)
};
ee.Filter.not_starts_with = function(name, value) {
  return ee.Filter.starts_with(name, value).not()
};
ee.Filter.ends_with = function(name, value) {
  return ee.ApiFunction._call("Filter.stringEndsWith", name, value)
};
ee.Filter.not_ends_with = function(name, value) {
  return ee.Filter.ends_with(name, value).not()
};
ee.Filter.and = function(var_args) {
  var args = Array.prototype.slice.call(arguments);
  return ee.ApiFunction._call("Filter.and", args)
};
ee.Filter.or = function(var_args) {
  var args = Array.prototype.slice.call(arguments);
  return ee.ApiFunction._call("Filter.or", args)
};
ee.Filter.date = function(start, opt_end) {
  goog.isDef(opt_end) || (opt_end = 0xffffffffffff);
  var range = ee.ApiFunction._call("DateRange", start, opt_end);
  return ee.ApiFunction._apply("Filter.dateRangeContains", {leftValue:range, rightField:"system:time_start"})
};
ee.Filter.inList = function(opt_leftField, opt_rightValue, opt_rightField, opt_leftValue) {
  return ee.ApiFunction._apply("Filter.listContains", {leftField:opt_rightField, rightValue:opt_leftValue, rightField:opt_leftField, leftValue:opt_rightValue})
};
ee.Filter.bounds = function(geometry, opt_errorMargin) {
  return ee.ApiFunction._apply("Filter.intersects", {leftField:".all", rightValue:ee.ApiFunction._call("Feature", geometry), maxError:opt_errorMargin})
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
ee.Filter.prototype.inList = function() {
  return this.append_(ee.Filter.inList.apply(null, [].slice.call(arguments)))
};
ee.Filter.prototype.bounds = function() {
  return this.append_(ee.Filter.bounds.apply(null, [].slice.call(arguments)))
};
ee.Filter.prototype.name = function() {
  return"Filter"
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
goog.exportProperty(ee.Filter.prototype, "inList", ee.Filter.prototype.inList);
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
goog.exportProperty(ee.Filter, "inList", ee.Filter.inList);
goog.exportProperty(ee.Filter, "date", ee.Filter.date);
ee.Collection = function(func, args) {
  ee.ComputedObject.call(this, func, args);
  ee.Collection.initialize()
};
goog.inherits(ee.Collection, ee.ComputedObject);
ee.Collection.serialMappingId_ = 0;
ee.Collection.initialized_ = !1;
ee.Collection.initialize = function() {
  ee.Collection.initialized_ || (ee.ApiFunction.importApi(ee.Collection, "Collection", "Collection"), ee.ApiFunction.importApi(ee.Collection, "AggregateFeatureCollection", "Collection", "aggregate_"), ee.Collection.initialized_ = !0)
};
ee.Collection.reset = function() {
  ee.ApiFunction.clearApi(ee.Collection);
  ee.Collection.initialized_ = !1;
  ee.Collection.serialMappingId_ = 0
};
ee.Collection.prototype.filter = function(newFilter) {
  if(!newFilter) {
    throw Error("Empty filters.");
  }
  return this.cast_(ee.ApiFunction._call("Collection.filter", this, newFilter))
};
ee.Collection.prototype.filterMetadata = function(name, operator, value) {
  return this.filter(ee.Filter.metadata(name, operator, value))
};
ee.Collection.prototype.filterBounds = function(geometry) {
  return this.filter(ee.Filter.bounds(geometry))
};
ee.Collection.prototype.filterDate = function(start, end) {
  return this.filter(ee.Filter.date(start, end))
};
ee.Collection.prototype.getInfo = function(opt_callback) {
  return ee.Collection.superClass_.getInfo.call(this, opt_callback)
};
ee.Collection.prototype.limit = function(max, opt_property, opt_ascending) {
  return this.cast_(ee.ApiFunction._call("Collection.limit", this, max, opt_property, opt_ascending))
};
ee.Collection.prototype.sort = function(property, opt_ascending) {
  return this.cast_(ee.ApiFunction._call("Collection.limit", this, void 0, property, opt_ascending))
};
ee.Collection.prototype.cast_ = function(obj) {
  return obj instanceof this.constructor ? obj : new this.constructor(obj)
};
ee.Collection.prototype.name = function() {
  return"Collection"
};
ee.Collection.prototype.mapInternal = function(type, algorithm, opt_dynamicArgs, opt_constantArgs, opt_destination) {
  if(goog.isFunction(algorithm)) {
    if(opt_dynamicArgs) {
      throw Error("Can't use dynamicArgs with a mapped JS function.");
    }
    var varName = "_MAPPING_VAR_" + ee.Collection.serialMappingId_++;
    algorithm = new ee.CustomFunction(goog.object.create(varName, type), type, algorithm)
  }else {
    if(goog.isString(algorithm)) {
      algorithm = new ee.ApiFunction(algorithm)
    }else {
      if(!(algorithm instanceof ee.Function)) {
        throw Error("Can't map non-callable object: " + algorithm);
      }
    }
  }
  var args = {collection:this, baseAlgorithm:algorithm};
  opt_dynamicArgs ? args.dynamicArgs = opt_dynamicArgs : (varName = algorithm.getSignature().args[0].name, args.dynamicArgs = goog.object.create(varName, ".all"));
  opt_constantArgs && (args.constantArgs = opt_constantArgs);
  opt_destination && (args.destination = opt_destination);
  return this.cast_(ee.ApiFunction._apply("Collection.map", args))
};
ee.Collection.prototype.map = function(algorithm, opt_dynamicArgs, opt_constantArgs, opt_destination) {
  return this.mapInternal(ee.ComputedObject, algorithm, opt_dynamicArgs, opt_constantArgs, opt_destination)
};
ee.Collection.createAutoMapFunctions = function(collectionClass, elementClass) {
  goog.object.forEach(elementClass.prototype, function(method, name) {
    goog.isFunction(method) && method.signature && (collectionClass.prototype["map_" + name] = function() {
      var destination = null;
      ee.Types.isSubtype("EEObject", method.signature.returns) || (destination = name);
      var constArgs = Array.prototype.slice.call(arguments, 0);
      return this.mapInternal(elementClass, function(elem) {
        return method.apply(elem, constArgs)
      }, null, null, destination)
    })
  })
};
goog.exportSymbol("ee.Collection", ee.Collection);
goog.exportProperty(ee.Collection.prototype, "filter", ee.Collection.prototype.filter);
goog.exportProperty(ee.Collection.prototype, "filterMetadata", ee.Collection.prototype.filterMetadata);
goog.exportProperty(ee.Collection.prototype, "filterBounds", ee.Collection.prototype.filterBounds);
goog.exportProperty(ee.Collection.prototype, "filterDate", ee.Collection.prototype.filterDate);
goog.exportProperty(ee.Collection.prototype, "limit", ee.Collection.prototype.limit);
goog.exportProperty(ee.Collection.prototype, "sort", ee.Collection.prototype.sort);
ee.Geometry = function(geoJson, opt_proj, opt_geodesic) {
  if(!(this instanceof ee.Geometry)) {
    return new ee.Geometry(geoJson, opt_proj, opt_geodesic)
  }
  ee.Geometry.initialize();
  var options = goog.isDefAndNotNull(opt_proj) || goog.isDefAndNotNull(opt_geodesic);
  if(geoJson instanceof ee.ComputedObject && Boolean(geoJson.func)) {
    if(options) {
      throw Error("Setting the CRS or geodesic on a computed Geometry is not suported.  Use Geometry.transform().");
    }
    ee.ComputedObject.call(this, geoJson.func, geoJson.args)
  }else {
    geoJson instanceof ee.Geometry && (geoJson = geoJson.encode());
    if(3 < arguments.length) {
      throw Error("The Geometry constructor takes at most 3 arguments (" + arguments.length + " given)");
    }
    if(!ee.Geometry.isValidGeometry_(geoJson)) {
      throw Error("Invalid GeoJSON geometry: " + JSON.stringify(geoJson));
    }
    ee.ComputedObject.call(this, null, null);
    this.type_ = geoJson.type;
    this.coordinates_ = geoJson.coordinates || null;
    this.geometries_ = geoJson.geometries || null;
    this.proj_ = opt_proj;
    this.geodesic_ = opt_geodesic;
    !goog.isDef(opt_geodesic) && "geodesic" in geoJson && (this.geodesic_ = Boolean(geoJson.geodesic))
  }
};
goog.inherits(ee.Geometry, ee.ComputedObject);
ee.Geometry.initialized_ = !1;
ee.Geometry.initialize = function() {
  ee.Geometry.initialized_ || (ee.ApiFunction.importApi(ee.Geometry, "Geometry", "Geometry"), ee.Geometry.initialized_ = !0)
};
ee.Geometry.reset = function() {
  ee.ApiFunction.clearApi(ee.Geometry);
  ee.Geometry.initialized_ = !1
};
ee.Geometry.Point = function(lon, lat) {
  if(!(this instanceof ee.Geometry.Point)) {
    return ee.Geometry.createInstance_(ee.Geometry.Point, arguments)
  }
  if(2 < arguments.length) {
    throw Error("The Geometry.Point constructor takes at most 2 arguments (" + arguments.length + " given)");
  }
  if(1 == arguments.length && goog.isArray(arguments[0]) && 2 == arguments[0].length) {
    var coords = arguments[0];
    lon = coords[0];
    lat = coords[1]
  }
  ee.Geometry.call(this, {type:"Point", coordinates:[lon, lat]})
};
goog.inherits(ee.Geometry.Point, ee.Geometry);
ee.Geometry.MultiPoint = function(coordinates) {
  if(!(this instanceof ee.Geometry.MultiPoint)) {
    return ee.Geometry.createInstance_(ee.Geometry.MultiPoint, arguments)
  }
  ee.Geometry.call(this, {type:"MultiPoint", coordinates:ee.Geometry.makeGeometry_(coordinates, 2, arguments)})
};
goog.inherits(ee.Geometry.MultiPoint, ee.Geometry);
ee.Geometry.Rectangle = function(lon1, lat1, lon2, lat2) {
  if(!(this instanceof ee.Geometry.Rectangle)) {
    return new ee.Geometry.Rectangle(lon1, lat1, lon2, lat2)
  }
  if(4 < arguments.length) {
    throw Error("The Geometry.Rectangle constructor takes at most 4 arguments (" + arguments.length + " given)");
  }
  if(goog.isArray(lon1)) {
    var args = lon1;
    lon1 = args[0];
    lat1 = args[1];
    lon2 = args[2];
    lat2 = args[3]
  }
  ee.Geometry.call(this, {type:"Polygon", coordinates:[[[lon1, lat2], [lon1, lat1], [lon2, lat1], [lon2, lat2]]]})
};
goog.inherits(ee.Geometry.Rectangle, ee.Geometry);
ee.Geometry.LineString = function(coordinates) {
  if(!(this instanceof ee.Geometry.LineString)) {
    return ee.Geometry.createInstance_(ee.Geometry.LineString, arguments)
  }
  ee.Geometry.call(this, {type:"LineString", coordinates:ee.Geometry.makeGeometry_(coordinates, 2, arguments)})
};
goog.inherits(ee.Geometry.LineString, ee.Geometry);
ee.Geometry.LinearRing = function(coordinates) {
  if(!(this instanceof ee.Geometry.LinearRing)) {
    return ee.Geometry.createInstance_(ee.Geometry.LinearRing, arguments)
  }
  ee.Geometry.call(this, {type:"LinearRing", coordinates:ee.Geometry.makeGeometry_(coordinates, 2, arguments)})
};
goog.inherits(ee.Geometry.LinearRing, ee.Geometry);
ee.Geometry.MultiLineString = function(coordinates) {
  if(!(this instanceof ee.Geometry.MultiLineString)) {
    return ee.Geometry.createInstance_(ee.Geometry.MultiLineString, arguments)
  }
  ee.Geometry.call(this, {type:"MultiLineString", coordinates:ee.Geometry.makeGeometry_(coordinates, 3, arguments)})
};
goog.inherits(ee.Geometry.MultiLineString, ee.Geometry);
ee.Geometry.Polygon = function(coordinates) {
  if(!(this instanceof ee.Geometry.Polygon)) {
    return ee.Geometry.createInstance_(ee.Geometry.Polygon, arguments)
  }
  ee.Geometry.call(this, {type:"Polygon", coordinates:ee.Geometry.makeGeometry_(coordinates, 3, arguments)})
};
goog.inherits(ee.Geometry.Polygon, ee.Geometry);
ee.Geometry.MultiPolygon = function(coordinates) {
  if(!(this instanceof ee.Geometry.MultiPolygon)) {
    return ee.Geometry.createInstance_(ee.Geometry.MultiPolygon, arguments)
  }
  ee.Geometry.call(this, {type:"MultiPolygon", coordinates:ee.Geometry.makeGeometry_(coordinates, 4, arguments)})
};
goog.inherits(ee.Geometry.MultiPolygon, ee.Geometry);
ee.Geometry.prototype.encode = function(opt_encoder) {
  if(this.func) {
    if(!opt_encoder) {
      throw Error("Must specify an encode function when encoding a computed geometry.");
    }
    return ee.ComputedObject.prototype.encode.call(this, opt_encoder)
  }
  var result = {type:this.type_};
  "GeometryCollection" == this.type_ ? result.geometries = this.geometries_ : result.coordinates = this.coordinates_;
  goog.isDefAndNotNull(this.proj_) && (result.crs = {type:"name", properties:{name:this.proj_}});
  goog.isDefAndNotNull(this.geodesic_) && (result.geodesic = this.geodesic_);
  return result
};
ee.Geometry.prototype.toGeoJSON = function() {
  if(this.func) {
    throw Error("Can't convert a computed Geometry to GeoJSON.  Use getInfo() instead.");
  }
  return this.encode()
};
ee.Geometry.prototype.toGeoJSONString = function() {
  if(this.func) {
    throw Error("Can't convert a computed Geometry to GeoJSON.  Use getInfo() instead.");
  }
  return(new goog.json.Serializer).serialize(this.toGeoJSON())
};
ee.Geometry.prototype.serialize = function() {
  return ee.Serializer.toJSON(this)
};
ee.Geometry.prototype.toString = function() {
  return"ee.Geometry(" + this.toGeoJSONString() + ")"
};
ee.Geometry.isValidGeometry_ = function(geometry) {
  var type = geometry.type;
  if("GeometryCollection" == type) {
    var geometries = geometry.geometries;
    if(!goog.isArray(geometries)) {
      return!1
    }
    for(var i = 0;i < geometries.length;i++) {
      if(!ee.Geometry.isValidGeometry_(geometries[i])) {
        return!1
      }
    }
    return!0
  }
  var nesting = ee.Geometry.isValidCoordinates_(geometry.coordinates);
  return"Point" == type && 1 == nesting || "MultiPoint" == type && 2 == nesting || "LineString" == type && 2 == nesting || "LinearRing" == type && 2 == nesting || "MultiLineString" == type && 3 == nesting || "Polygon" == type && 3 == nesting || "MultiPolygon" == type && 4 == nesting
};
ee.Geometry.isValidCoordinates_ = function(shape) {
  if(!goog.isArray(shape)) {
    return-1
  }
  if(goog.isArray(shape[0])) {
    for(var count = ee.Geometry.isValidCoordinates_(shape[0]), i = 1;i < shape.length;i++) {
      if(ee.Geometry.isValidCoordinates_(shape[i]) != count) {
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
ee.Geometry.coordinatesToLine_ = function(coordinates) {
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
ee.Geometry.makeGeometry_ = function(geometry, nesting, opt_coordinates) {
  if(2 > nesting || 4 < nesting) {
    throw Error("Unexpected nesting level.");
  }
  !goog.isArray(geometry) && opt_coordinates && (geometry = ee.Geometry.coordinatesToLine_(Array.prototype.slice.call(opt_coordinates)));
  for(var item = geometry, count = 0;goog.isArray(item);) {
    item = item[0], count++
  }
  for(;count < nesting;) {
    geometry = [geometry], count++
  }
  if(ee.Geometry.isValidCoordinates_(geometry) != nesting) {
    throw Error("Invalid geometry");
  }
  return geometry
};
ee.Geometry.createInstance_ = function(klass, args) {
  var f = function() {
  };
  f.prototype = klass.prototype;
  var instance = new f, result = klass.apply(instance, args);
  return void 0 !== result ? result : instance
};
ee.Geometry.prototype.name = function() {
  return"Geometry"
};
goog.exportSymbol("ee.Geometry", ee.Geometry);
goog.exportProperty(ee.Geometry, "Point", ee.Geometry.Point);
goog.exportProperty(ee.Geometry, "MultiPoint", ee.Geometry.MultiPoint);
goog.exportProperty(ee.Geometry, "Rectangle", ee.Geometry.Rectangle);
goog.exportProperty(ee.Geometry, "LineString", ee.Geometry.LineString);
goog.exportProperty(ee.Geometry, "LinearRing", ee.Geometry.LinearRing);
goog.exportProperty(ee.Geometry, "MultiLineString", ee.Geometry.MultiLineString);
goog.exportProperty(ee.Geometry, "Polygon", ee.Geometry.Polygon);
goog.exportProperty(ee.Geometry, "MultiPolygon", ee.Geometry.MultiPolygon);
goog.exportProperty(ee.Geometry.prototype, "toGeoJSON", ee.Geometry.prototype.toGeoJSON);
goog.exportProperty(ee.Geometry.prototype, "toGeoJSONString", ee.Geometry.prototype.toGeoJSONString);
goog.exportProperty(ee.Geometry.prototype, "toString", ee.Geometry.prototype.toString);
ee.Feature = function(geometry, opt_properties) {
  if(!(this instanceof ee.Feature)) {
    return new ee.Feature(geometry, opt_properties)
  }
  if(geometry instanceof ee.Feature) {
    if(opt_properties) {
      throw Error("Can't create Feature out of a Feature and properties.");
    }
    return geometry
  }
  if(2 < arguments.length) {
    throw Error("The Feature constructor takes at most 2 arguments (" + arguments.length + " given)");
  }
  ee.Feature.initialize();
  geometry instanceof ee.Geometry || null === geometry ? ee.ComputedObject.call(this, new ee.ApiFunction("Feature"), {geometry:geometry, metadata:opt_properties || null}) : geometry instanceof ee.ComputedObject ? ee.ComputedObject.call(this, geometry.func, geometry.args) : "Feature" == geometry.type ? ee.ComputedObject.call(this, new ee.ApiFunction("Feature"), {geometry:new ee.Geometry(geometry.geometry), metadata:geometry.properties || null}) : ee.ComputedObject.call(this, new ee.ApiFunction("Feature"), 
  {geometry:new ee.Geometry(geometry), metadata:opt_properties || null})
};
goog.inherits(ee.Feature, ee.ComputedObject);
ee.Feature.initialized_ = !1;
ee.Feature.initialize = function() {
  ee.Feature.initialized_ || (ee.ApiFunction.importApi(ee.Feature, "Feature", "Feature"), ee.Feature.initialized_ = !0)
};
ee.Feature.reset = function() {
  ee.ApiFunction.clearApi(ee.Feature);
  ee.Feature.initialized_ = !1
};
ee.Feature.prototype.getMap = function(opt_visParams, opt_callback) {
  return ee.ApiFunction._call("Collection", [this]).getMap(opt_visParams, opt_callback)
};
ee.Feature.Point = function(lon, lat) {
  return ee.Geometry.Point.apply(null, arguments)
};
ee.Feature.MultiPoint = function(coordinates) {
  return ee.Geometry.MultiPoint.apply(null, arguments)
};
ee.Feature.Rectangle = function(lon1, lat1, lon2, lat2) {
  return new ee.Geometry.Rectangle(lon1, lat1, lon2, lat2)
};
ee.Feature.LineString = function(coordinates) {
  return ee.Geometry.LineString.apply(null, arguments)
};
ee.Feature.LinearRing = function(coordinates) {
  return ee.Geometry.LinearRing.apply(null, arguments)
};
ee.Feature.MultiLine = function(coordinates) {
  return ee.Geometry.MultiLineString.apply(null, arguments)
};
ee.Feature.Polygon = function(coordinates) {
  return ee.Geometry.Polygon.apply(null, arguments)
};
ee.Feature.MultiPolygon = function(coordinates) {
  return ee.Geometry.MultiPolygon.apply(null, arguments)
};
ee.Feature.prototype.name = function() {
  return"Feature"
};
goog.exportSymbol("ee.Feature", ee.Feature);
goog.exportProperty(ee.Feature, "Point", ee.Feature.Point);
goog.exportProperty(ee.Feature, "MultiPoint", ee.Feature.MultiPoint);
goog.exportProperty(ee.Feature, "Rectangle", ee.Feature.Rectangle);
goog.exportProperty(ee.Feature, "LineString", ee.Feature.LineString);
goog.exportProperty(ee.Feature, "LinearRing", ee.Feature.LinearRing);
goog.exportProperty(ee.Feature, "MultiLine", ee.Feature.MultiLine);
goog.exportProperty(ee.Feature, "Polygon", ee.Feature.Polygon);
goog.exportProperty(ee.Feature, "MultiPolygon", ee.Feature.MultiPolygon);
goog.exportProperty(ee.Feature, "getMap", ee.Feature.prototype.getMap);
ee.FeatureCollection = function(args, opt_column) {
  if(!(this instanceof ee.FeatureCollection)) {
    return new ee.FeatureCollection(args, opt_column)
  }
  if(args instanceof ee.FeatureCollection) {
    return args
  }
  if(2 < arguments.length) {
    throw Error("The FeatureCollection constructor takes at most 2 arguments (" + arguments.length + " given)");
  }
  ee.FeatureCollection.initialize();
  args instanceof ee.Geometry && (args = new ee.Feature(args));
  args instanceof ee.Feature && (args = [args]);
  if(ee.Types.isNumber(args) || ee.Types.isString(args)) {
    var actualArgs = {tableId:args};
    opt_column && (actualArgs.geometryColumn = opt_column);
    ee.Collection.call(this, new ee.ApiFunction("Collection.loadTable"), actualArgs)
  }else {
    if(goog.isArray(args)) {
      ee.Collection.call(this, new ee.ApiFunction("Collection"), {features:goog.array.map(args, function(elem) {
        return new ee.Feature(elem)
      })})
    }else {
      if(args instanceof ee.ComputedObject) {
        ee.Collection.call(this, args.func, args.args)
      }else {
        throw Error("Unrecognized argument type to convert to a FeatureCollection: " + args);
      }
    }
  }
};
goog.inherits(ee.FeatureCollection, ee.Collection);
ee.FeatureCollection.initialized_ = !1;
ee.FeatureCollection.initialize = function() {
  ee.FeatureCollection.initialized_ || (ee.ApiFunction.importApi(ee.FeatureCollection, "FeatureCollection", "FeatureCollection"), ee.Collection.createAutoMapFunctions(ee.FeatureCollection, ee.Feature), ee.FeatureCollection.initialized_ = !0)
};
ee.FeatureCollection.reset = function() {
  ee.ApiFunction.clearApi(ee.FeatureCollection);
  ee.FeatureCollection.initialized_ = !1
};
ee.FeatureCollection.prototype.getMap = function(opt_visParams, opt_callback) {
  var painted = ee.ApiFunction._apply("Collection.draw", {collection:this, color:(opt_visParams || {}).color || "000000"});
  if(opt_callback) {
    painted.getMap(null, opt_callback)
  }else {
    return painted.getMap()
  }
};
ee.FeatureCollection.prototype.map = function(algorithm, opt_dynamicArgs, opt_constantArgs, opt_destination) {
  return this.mapInternal(ee.Feature, algorithm, opt_dynamicArgs, opt_constantArgs, opt_destination)
};
ee.FeatureCollection.prototype.name = function() {
  return"FeatureCollection"
};
goog.exportSymbol("ee.FeatureCollection", ee.FeatureCollection);
goog.exportProperty(ee.FeatureCollection.prototype, "map", ee.FeatureCollection.prototype.map);
goog.exportProperty(ee.FeatureCollection.prototype, "getMap", ee.FeatureCollection.prototype.getMap);
ee.Image = function(args) {
  if(!(this instanceof ee.Image)) {
    return new ee.Image(args)
  }
  if(args instanceof ee.Image) {
    return args
  }
  ee.Image.initialize();
  var argCount = arguments.length;
  if(0 == argCount || 1 == argCount && !goog.isDef(args)) {
    ee.ComputedObject.call(this, new ee.ApiFunction("Image.mask"), {image:new ee.Image(0), mask:new ee.Image(0)})
  }else {
    if(1 == argCount) {
      if(ee.Types.isNumber(args)) {
        ee.ComputedObject.call(this, new ee.ApiFunction("Image.constant"), {value:args})
      }else {
        if(ee.Types.isString(args)) {
          ee.ComputedObject.call(this, new ee.ApiFunction("Image.load"), {id:args})
        }else {
          if(goog.isArray(args)) {
            return ee.Image.combine_(goog.array.map(args, function(elem) {
              return new ee.Image(elem)
            }))
          }
          if(args instanceof ee.ComputedObject) {
            ee.ComputedObject.call(this, args.func, args.args)
          }else {
            throw Error("Unrecognized argument type to convert to an Image: " + args);
          }
        }
      }
    }else {
      if(2 == argCount) {
        var id = arguments[0], version = arguments[1];
        if(ee.Types.isString(id) && ee.Types.isNumber(version)) {
          ee.ComputedObject.call(this, new ee.ApiFunction("Image.load"), {id:id, version:version})
        }else {
          throw Error("Unrecognized argument types to convert to an Image: " + arguments);
        }
      }else {
        throw Error("The Image constructor takes at most 2 arguments (" + argCount + " given)");
      }
    }
  }
};
goog.inherits(ee.Image, ee.ComputedObject);
ee.Image.initialized_ = !1;
ee.Image.initialize = function() {
  ee.Image.initialized_ || (ee.ApiFunction.importApi(ee.Image, "Image", "Image"), ee.ApiFunction.importApi(ee.Image, "Window", "Image", "focal_"), ee.Image.initialized_ = !0)
};
ee.Image.reset = function() {
  ee.ApiFunction.clearApi(ee.Image);
  ee.Image.initialized_ = !1
};
ee.Image.prototype.getInfo = function(opt_callback) {
  return ee.Image.superClass_.getInfo.call(this, opt_callback)
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
ee.Image.prototype.getThumbURL = function(params) {
  var request = params || {};
  request.image = this.serialize();
  return ee.data.makeThumbUrl(ee.data.getThumbId(request))
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
    result = ee.ApiFunction._call("Image.addBands", result, images[i])
  }
  opt_names && (result = result.select([".*"], opt_names));
  return result
};
ee.Image.prototype.select = function(selectors, opt_names) {
  var args = {input:this, bandSelectors:selectors};
  if(goog.isArray(selectors)) {
    opt_names && (args.newNames = opt_names)
  }else {
    selectors = Array.prototype.slice.call(arguments);
    for(var i = 0;i < selectors.length;i++) {
      if(!goog.isString(selectors[i]) && !goog.isNumber(selectors[i])) {
        throw Error("Illegal argument to select(): " + selectors[i]);
      }
    }
    args.bandSelectors = selectors
  }
  return ee.ApiFunction._apply("Image.select", args)
};
ee.Image.prototype.expression = function(expression, opt_map) {
  var body = ee.ApiFunction._call("Image.parseExpression", expression, "DEFAULT_EXPRESSION_IMAGE"), argNames = ["DEFAULT_EXPRESSION_IMAGE"], args = {DEFAULT_EXPRESSION_IMAGE:this};
  if(opt_map) {
    for(var name$$0 in opt_map) {
      argNames.push(name$$0), args[name$$0] = new ee.Image(opt_map[name$$0])
    }
  }
  var func = new ee.Function;
  func.encode = function(encoder) {
    return body.encode(encoder)
  };
  func.getSignature = function() {
    return{name:"", args:goog.array.map(argNames, function(name) {
      return{name:name, type:"Image", optional:!1}
    }, this), returns:"Image"}
  };
  return func.apply(args)
};
ee.Image.prototype.clip = function(geometry) {
  try {
    geometry = new ee.Geometry(geometry)
  }catch(e) {
  }
  return ee.ApiFunction._call("Image.clip", this, geometry)
};
ee.Image.prototype.name = function() {
  return"Image"
};
goog.exportSymbol("ee.Image", ee.Image);
goog.exportProperty(ee.Image.prototype, "getInfo", ee.Image.prototype.getInfo);
goog.exportProperty(ee.Image.prototype, "getDownloadURL", ee.Image.prototype.getDownloadURL);
goog.exportProperty(ee.Image.prototype, "getThumbURL", ee.Image.prototype.getThumbURL);
goog.exportProperty(ee.Image.prototype, "getMap", ee.Image.prototype.getMap);
goog.exportProperty(ee.Image.prototype, "select", ee.Image.prototype.select);
goog.exportProperty(ee.Image.prototype, "expression", ee.Image.prototype.expression);
goog.exportProperty(ee.Image.prototype, "clip", ee.Image.prototype.clip);
goog.exportProperty(ee.Image, "cat", ee.Image.cat);
goog.exportProperty(ee.Image, "rgb", ee.Image.rgb);
goog.exportProperty(ee.Image, "toString", ee.Image.toString);
ee.ImageCollection = function(args) {
  if(!(this instanceof ee.ImageCollection)) {
    return new ee.ImageCollection(args)
  }
  if(args instanceof ee.ImageCollection) {
    return args
  }
  if(1 != arguments.length) {
    throw Error("The ImageCollection constructor takes exactly 1 argument (" + arguments.length + " given)");
  }
  ee.ImageCollection.initialize();
  args instanceof ee.Image && (args = [args]);
  if(ee.Types.isString(args)) {
    ee.Collection.call(this, new ee.ApiFunction("ImageCollection.load"), {id:args})
  }else {
    if(goog.isArray(args)) {
      ee.Collection.call(this, new ee.ApiFunction("ImageCollection.fromImages"), {images:goog.array.map(args, function(elem) {
        return new ee.Image(elem)
      })})
    }else {
      if(args instanceof ee.ComputedObject) {
        ee.Collection.call(this, args.func, args.args)
      }else {
        throw Error("Unrecognized argument type to convert to an ImageCollection: " + args);
      }
    }
  }
};
goog.inherits(ee.ImageCollection, ee.Collection);
ee.ImageCollection.initialized_ = !1;
ee.ImageCollection.initialize = function() {
  ee.ImageCollection.initialized_ || (ee.ApiFunction.importApi(ee.ImageCollection, "ImageCollection", "ImageCollection"), ee.ApiFunction.importApi(ee.ImageCollection, "reduce", "ImageCollection"), ee.Collection.createAutoMapFunctions(ee.ImageCollection, ee.Image), ee.ImageCollection.initialized_ = !0)
};
ee.ImageCollection.reset = function() {
  ee.ApiFunction.clearApi(ee.ImageCollection);
  ee.ImageCollection.initialized_ = !1
};
ee.ImageCollection.prototype.getMap = function(opt_visParams, opt_callback) {
  var mosaic = ee.ApiFunction._call("ImageCollection.mosaic", this);
  if(opt_callback) {
    mosaic.getMap(opt_visParams, opt_callback)
  }else {
    return mosaic.getMap(opt_visParams)
  }
};
ee.ImageCollection.prototype.map = function(algorithm, opt_dynamicArgs, opt_constantArgs, opt_destination) {
  return this.mapInternal(ee.Image, algorithm, opt_dynamicArgs, opt_constantArgs, opt_destination)
};
ee.ImageCollection.prototype.name = function() {
  return"ImageCollection"
};
goog.exportSymbol("ee.ImageCollection", ee.ImageCollection);
goog.exportProperty(ee.ImageCollection.prototype, "map", ee.ImageCollection.prototype.map);
goog.exportProperty(ee.ImageCollection.prototype, "getMap", ee.ImageCollection.prototype.getMap);
ee.String = function(string) {
  if(!(this instanceof ee.String)) {
    return new ee.String(string)
  }
  if(string instanceof ee.String) {
    return string
  }
  ee.String.initialize();
  if(goog.isString(string)) {
    ee.ComputedObject.call(this, null, null)
  }else {
    if(string instanceof ee.ComputedObject) {
      ee.ComputedObject.call(this, string.func, string.args)
    }else {
      throw Error("Invalid argument specified for ee.String(): " + string);
    }
  }
  this.string_ = string
};
goog.inherits(ee.String, ee.ComputedObject);
ee.String.initialized_ = !1;
ee.String.initialize = function() {
  ee.String.initialized_ || (ee.ApiFunction.importApi(ee.String, "String", "String"), ee.String.initialized_ = !0)
};
ee.String.reset = function() {
  ee.ApiFunction.clearApi(ee.String);
  ee.String.initialized_ = !1
};
ee.String.prototype.encode = function(encoder) {
  return goog.isString(this.string_) ? this.string_ : this.string_.encode(encoder)
};
ee.String.prototype.name = function() {
  return"String"
};
goog.exportSymbol("ee.String", ee.String);
goog.exportProperty(ee.String.prototype, "encode", ee.String.prototype.encode);
ee.initialize = function(opt_baseurl, opt_tileurl, opt_callback) {
  if(ee.ready_ != ee.InitState.READY || opt_baseurl || opt_tileurl) {
    if(ee.ready() == ee.InitState.LOADING) {
      throw Error("Already loading.");
    }
    ee.ready_ = ee.InitState.LOADING;
    ee.data.initialize(opt_baseurl, opt_tileurl);
    var finish = function() {
      ee.Image.initialize();
      ee.Feature.initialize();
      ee.Collection.initialize();
      ee.ImageCollection.initialize();
      ee.FeatureCollection.initialize();
      ee.Filter.initialize();
      ee.Geometry.initialize();
      ee.String.initialize();
      ee.initializeGeneratedClasses_();
      ee.initializeUnboundMethods_();
      ee.ready_ = ee.InitState.READY;
      opt_callback && opt_callback()
    };
    if(opt_callback) {
      ee.ApiFunction.initialize(finish)
    }else {
      try {
        ee.ApiFunction.initialize(), finish()
      }catch(e) {
        alert("Could not read algorithm list.")
      }
    }
  }
};
ee.reset = function() {
  ee.ready_ = ee.InitState.NOT_READY;
  ee.data.reset();
  ee.ApiFunction.reset();
  ee.Image.reset();
  ee.Feature.reset();
  ee.Collection.reset();
  ee.ImageCollection.reset();
  ee.FeatureCollection.reset();
  ee.Filter.reset();
  ee.Geometry.reset();
  ee.String.reset();
  ee.resetGeneratedClasses_();
  ee.Algorithms = {}
};
ee.InitState = {NOT_READY:"not_ready", LOADING:"loading", READY:"ready"};
ee.ready_ = ee.InitState.NOT_READY;
ee.TILE_SIZE = 256;
ee.generatedClasses_ = [];
ee.Algorithms = {};
ee.ready = function() {
  return ee.ready_
};
ee.call = function(func, var_args) {
  goog.isString(func) && (func = new ee.ApiFunction(func));
  var args = Array.prototype.slice.call(arguments, 1);
  return ee.Function.prototype.call.apply(func, args)
};
ee.apply = function(func, namedArgs) {
  goog.isString(func) && (func = new ee.ApiFunction(func));
  return func.apply(namedArgs)
};
ee.promote_ = function(arg, klass) {
  if(goog.isNull(arg)) {
    return null
  }
  if(goog.isDef(arg)) {
    switch(klass) {
      case "Image":
        return new ee.Image(arg);
      case "ImageCollection":
        return new ee.ImageCollection(arg);
      case "Feature":
      ;
      case "EEObject":
        return arg instanceof ee.Collection ? ee.ApiFunction._call("Feature", ee.ApiFunction._call("Collection.geometry", arg)) : "EEObject" == klass && arg instanceof ee.Image ? arg : new ee.Feature(arg);
      case "Geometry":
        return arg instanceof ee.FeatureCollection ? ee.ApiFunction._call("Collection.geometry", arg) : new ee.Geometry(arg);
      case "FeatureCollection":
      ;
      case "EECollection":
      ;
      case "Collection":
        return arg instanceof ee.Collection ? arg : new ee.FeatureCollection(arg);
      case "Filter":
        return new ee.Filter(arg);
      case "ErrorMargin":
        return goog.isNumber(arg) ? ee.ApiFunction._call("ErrorMargin", arg, "meters") : arg;
      case "Algorithm":
        return goog.isString(arg) ? new ee.ApiFunction(arg) : arg;
      case "Date":
        return goog.isString(arg) ? new Date(arg) : goog.isNumber(arg) ? new Date(arg) : arg;
      case "Dictionary":
        return klass in ee ? arg instanceof ee[klass] ? arg : arg instanceof ee.ComputedObject ? new ee[klass](arg) : arg : arg;
      case "String":
        return ee.Types.isString(arg) || arg instanceof ee.String || arg instanceof ee.ComputedObject || ee.Types.isVarOfType(arg, ee.String) ? new ee.String(arg) : arg;
      case "List":
        return arg;
      default:
        if(klass in ee && arg) {
          if(arg instanceof ee[klass]) {
            return arg
          }
          if(goog.isString(arg)) {
            if(!(arg in ee[klass])) {
              throw Error("Unknown algorithm: " + klass + "." + arg);
            }
            return ee[klass][arg].call()
          }
          return new ee[klass](arg)
        }
        return arg
    }
  }
};
ee.initializeUnboundMethods_ = function() {
  goog.object.forEach(ee.ApiFunction.unboundFunctions(), function(func, name) {
    var signature = func.getSignature();
    if(!signature.hidden) {
      for(var nameParts = name.split("."), target = ee.Algorithms;1 < nameParts.length;) {
        var first = nameParts[0];
        first in target || (target[first] = {});
        target = target[first];
        nameParts = goog.array.slice(nameParts, 1)
      }
      var bound = goog.bind(func.call, func);
      bound.signature = signature;
      bound.toString = goog.bind(func.toString, func);
      target[nameParts[0]] = bound
    }
  })
};
ee.initializeGeneratedClasses_ = function() {
  var signatures = ee.ApiFunction.allSignatures(), names = {}, returnTypes = {}, sig;
  for(sig in signatures) {
    if(-1 != sig.indexOf(".")) {
      var type = sig.slice(0, sig.indexOf("."));
      names[type] = !0
    }
    var rtype = signatures[sig].returns.replace(/<.*>/, "");
    returnTypes[rtype] = !0
  }
  var blacklist = ["List"], badName;
  for(badName in blacklist) {
    names[badName] && delete names[badName]
  }
  for(var name in names) {
    name in returnTypes && !(name in ee) && (ee[name] = ee.makeClass_(name), ee.generatedClasses_.push(name))
  }
};
ee.resetGeneratedClasses_ = function() {
  for(var i = 0;i < ee.generatedClasses_.length;i++) {
    var name = ee.generatedClasses_[i];
    ee.ApiFunction.clearApi(ee[name]);
    delete ee[name]
  }
  ee.generatedClasses_ = []
};
ee.makeClass_ = function(name) {
  var target = function(var_args) {
    var args = Array.prototype.slice.apply(arguments), result;
    args[0] instanceof ee.ComputedObject && 1 == args.length ? result = args[0] : (args.unshift(name), result = ee.ApiFunction._call.apply(null, args));
    if(this instanceof ee[name]) {
      ee.ComputedObject.call(this, result.func, result.args)
    }else {
      return new ee[name](result)
    }
  };
  goog.inherits(target, ee.ComputedObject);
  ee.ApiFunction.importApi(target, name, name);
  return target
};
ee.Function.registerPromoter(ee.promote_);
goog.exportSymbol("ee.initialize", ee.initialize);
goog.exportSymbol("ee.reset", ee.reset);
goog.exportSymbol("ee.InitState", ee.InitState);
goog.exportSymbol("ee.InitState.NOT_READY", ee.InitState.NOT_READY);
goog.exportSymbol("ee.InitState.LOADING", ee.InitState.LOADING);
goog.exportSymbol("ee.InitState.READY", ee.InitState.READY);
goog.exportSymbol("ee.ready", ee.ready);
goog.exportSymbol("ee.call", ee.call);
goog.exportSymbol("ee.apply", ee.apply);
goog.exportSymbol("ee.TILE_SIZE", ee.TILE_SIZE);

