var ctor$$2;
ctor$$2.prototype.then;
var ee;
/** @type {{}} */
ee.Algorithms = {};
/**
 * @param {string} name
 * @param {{args: Array<{default: *, name: string, optional: boolean, type: string}>, deprecated: (string|undefined), description: (string|undefined), name: string, returns: string}=} opt_signature
 * @return {?}
 * @extends {ee.Function}
 * @constructor
 */
ee.ApiFunction = function(name, opt_signature) {
};
/**
 * @param {string} name
 * @param {(Object|null)} namedArgs
 * @return {(ee.ComputedObject|null)}
 */
ee.ApiFunction._apply = function(name, namedArgs) {
};
/**
 * @param {string} name
 * @param {...*} var_args
 * @return {(ee.ComputedObject|null)}
 */
ee.ApiFunction._call = function(name, var_args) {
};
/**
 * @param {string} name
 * @return {(ee.ApiFunction|null)}
 */
ee.ApiFunction.lookup = function(name) {
};
/**
 * @param {(ee.Function|null)} func
 * @param {(Object|null)} args
 * @param {(null|string)=} opt_varName
 * @extends {ee.Element}
 * @constructor
 */
ee.Collection = function(func, args, opt_varName) {
};
/**
 * @param {(ee.Filter|null)} newFilter
 * @return {(ee.Collection|null)}
 */
ee.Collection.prototype.filter = function(newFilter) {
};
/**
 * @param {(ee.Feature|ee.Geometry|null)} geometry
 * @return {(ee.Collection|null)}
 */
ee.Collection.prototype.filterBounds = function(geometry) {
};
/**
 * @param {(Date|null|number|string)} start
 * @param {(Date|null|number|string)=} opt_end
 * @return {(ee.Collection|null)}
 */
ee.Collection.prototype.filterDate = function(start, opt_end) {
};
/**
 * @param {string} name
 * @param {string} operator
 * @param {*} value
 * @return {(ee.Collection|null)}
 */
ee.Collection.prototype.filterMetadata = function(name, operator, value) {
};
/**
 * @param {function ((Object|null), (Object|null)): (Object|null)} algorithm
 * @param {*=} opt_first
 * @return {(ee.ComputedObject|null)}
 */
ee.Collection.prototype.iterate = function(algorithm, opt_first) {
};
/**
 * @param {number} max
 * @param {string=} opt_property
 * @param {boolean=} opt_ascending
 * @return {(ee.Collection|null)}
 */
ee.Collection.prototype.limit = function(max, opt_property, opt_ascending) {
};
/**
 * @param {function ((Object|null)): (Object|null)} algorithm
 * @param {boolean=} opt_dropNulls
 * @return {(ee.Collection|null)}
 */
ee.Collection.prototype.map = function(algorithm, opt_dropNulls) {
};
/**
 * @param {string} property
 * @param {boolean=} opt_ascending
 * @return {(ee.Collection|null)}
 */
ee.Collection.prototype.sort = function(property, opt_ascending) {
};
ee.ComputedObject;
/**
 * @param {(Function|null)} func
 * @param {...*} var_args
 * @return {(ee.ComputedObject|null)}
 */
ee.ComputedObject.prototype.aside = function(func, var_args) {
};
/**
 * @param {function (?, string=): ?=} opt_callback
 * @return {*}
 */
ee.ComputedObject.prototype.getInfo = function(opt_callback) {
};
/**
 * @return {string}
 */
ee.ComputedObject.prototype.serialize = function() {
};
/**
 * @return {string}
 */
ee.ComputedObject.prototype.toString = function() {
};
/**
 * @param {{args: Array<{default: *, name: string, optional: boolean, type: string}>, deprecated: (string|undefined), description: (string|undefined), name: string, returns: string}} signature
 * @param {(Function|null)} body
 * @return {?}
 * @extends {ee.Function}
 * @constructor
 */
ee.CustomFunction = function(signature, body) {
};
/**
 * @param {(Date|String|ee.ComputedObject|null|number)} date
 * @param {string=} opt_tz
 * @return {?}
 * @extends {ee.ComputedObject}
 * @constructor
 */
ee.Date = function(date, opt_tz) {
};
/**
 * @constructor
 */
ee.Deserializer = function() {
};
/**
 * @param {*} json
 * @return {*}
 */
ee.Deserializer.decode = function(json) {
};
/**
 * @param {string} json
 * @return {*}
 */
ee.Deserializer.fromJSON = function(json) {
};
/**
 * @param {(Object|null)} dict
 * @return {?}
 * @extends {ee.ComputedObject}
 * @constructor
 */
ee.Dictionary = function(dict) {
};
/**
 * @param {(ee.Function|null)} func
 * @param {(Object|null)} args
 * @param {(null|string)=} opt_varName
 * @extends {ee.ComputedObject}
 * @constructor
 */
ee.Element = function(func, args, opt_varName) {
};
/**
 * @param {...(Object|null)} var_args
 * @return {(ee.Element|null)}
 */
ee.Element.prototype.set = function(var_args) {
};
/**
 * @param {(Object|null)} geometry
 * @param {(Object|null)=} opt_properties
 * @return {?}
 * @extends {ee.Element}
 * @constructor
 */
ee.Feature = function(geometry, opt_properties) {
};
/**
 * @param {(Array<Array<number>>|number)} coordinates
 * @return {(ee.Geometry|null)}
 */
ee.Feature.LineString = function(coordinates) {
};
/**
 * @param {(Array<Array<number>>|number)} coordinates
 * @return {(ee.Geometry|null)}
 */
ee.Feature.LinearRing = function(coordinates) {
};
/**
 * @param {(Array<Array<Array<number>>>|number)} coordinates
 * @return {(ee.Geometry|null)}
 */
ee.Feature.MultiLine = function(coordinates) {
};
/**
 * @param {(Array<Array<number>>|number)} coordinates
 * @return {(Object|null)}
 */
ee.Feature.MultiPoint = function(coordinates) {
};
/**
 * @param {(Array<Array<Array<Array<number>>>>|number)} coordinates
 * @return {(ee.Geometry|null)}
 */
ee.Feature.MultiPolygon = function(coordinates) {
};
/**
 * @param {(Array<number>|null|number)} lon
 * @param {number} lat
 * @return {(ee.Geometry|null)}
 */
ee.Feature.Point = function(lon, lat) {
};
/**
 * @param {(Array<Array<Array<number>>>|number)} coordinates
 * @return {(ee.Geometry|null)}
 */
ee.Feature.Polygon = function(coordinates) {
};
/**
 * @param {number} lon1
 * @param {number} lat1
 * @param {number} lon2
 * @param {number} lat2
 * @return {(Object|null)}
 */
ee.Feature.Rectangle = function(lon1, lat1, lon2, lat2) {
};
/**
 * @param {function ({geometry: (ee.data.GeoJSONGeometry|null), id: (string|undefined), properties: (Object|null|undefined), type: string}, string=): ?=} opt_callback
 * @return {{geometry: (ee.data.GeoJSONGeometry|null), id: (string|undefined), properties: (Object|null|undefined), type: string}}
 */
ee.Feature.prototype.getInfo = function(opt_callback) {
};
/**
 * @param {(Object|null)=} opt_visParams
 * @param {function ((Object|null), string=): ?=} opt_callback
 * @return {(undefined|{image: (ee.Image|null), mapid: string, token: string})}
 */
ee.Feature.prototype.getMap = function(opt_visParams, opt_callback) {
};
/**
 * @param {(Array<*>|ee.ComputedObject|null|number|string)} args
 * @param {string=} opt_column
 * @return {?}
 * @extends {ee.Collection}
 * @constructor
 */
ee.FeatureCollection = function(args, opt_column) {
};
/**
 * @param {string=} opt_format
 * @param {(Array<string>|string)=} opt_selectors
 * @param {string=} opt_filename
 * @param {function ((null|string), string=): ?=} opt_callback
 * @return {(string|undefined)}
 */
ee.FeatureCollection.prototype.getDownloadURL = function(opt_format, opt_selectors, opt_filename, opt_callback) {
};
/**
 * @param {function ({features: (Array<ee.data.GeoJSONFeature>|null), type: string}, string=): ?=} opt_callback
 * @return {{features: (Array<ee.data.GeoJSONFeature>|null), type: string}}
 */
ee.FeatureCollection.prototype.getInfo = function(opt_callback) {
};
/**
 * @param {(Object|null)=} opt_visParams
 * @param {function ((Object|null), string=): ?=} opt_callback
 * @return {(undefined|{image: (ee.Image|null), mapid: string, token: string})}
 */
ee.FeatureCollection.prototype.getMap = function(opt_visParams, opt_callback) {
};
/**
 * @param {(Array<string>|null)} selectors
 * @param {(Array<string>|null)=} opt_names
 * @return {(ee.FeatureCollection|null)}
 */
ee.FeatureCollection.prototype.select = function(selectors, opt_names) {
};
/**
 * @param {(Object|null)=} opt_filter
 * @return {?}
 * @extends {ee.ComputedObject}
 * @constructor
 */
ee.Filter = function(opt_filter) {
};
/**
 * @param {...(ee.Filter|null)} var_args
 * @return {(ee.Filter|null)}
 */
ee.Filter.and = function(var_args) {
};
/**
 * @param {(ee.ComputedObject|null)} geometry
 * @param {(ee.ComputedObject|null|number)=} opt_errorMargin
 * @return {(ee.Filter|null)}
 */
ee.Filter.bounds = function(geometry, opt_errorMargin) {
};
/**
 * @param {string} name
 * @param {string} value
 * @return {(ee.Filter|null)}
 */
ee.Filter.contains = function(name, value) {
};
/**
 * @param {(Date|null|number|string)} start
 * @param {(Date|null|number|string)=} opt_end
 * @return {(ee.Filter|null)}
 */
ee.Filter.date = function(start, opt_end) {
};
/**
 * @param {string} name
 * @param {string} value
 * @return {(ee.Filter|null)}
 */
ee.Filter.ends_with = function(name, value) {
};
/**
 * @param {string} name
 * @param {*} value
 * @return {(ee.Filter|null)}
 */
ee.Filter.eq = function(name, value) {
};
/**
 * @param {string} name
 * @param {*} value
 * @return {(ee.Filter|null)}
 */
ee.Filter.gt = function(name, value) {
};
/**
 * @param {string} name
 * @param {*} value
 * @return {(ee.Filter|null)}
 */
ee.Filter.gte = function(name, value) {
};
/**
 * @param {string=} opt_leftField
 * @param {(Object|null)=} opt_rightValue
 * @param {string=} opt_rightField
 * @param {(Object|null)=} opt_leftValue
 * @return {(ee.Filter|null)}
 */
ee.Filter.inList = function(opt_leftField, opt_rightValue, opt_rightField, opt_leftValue) {
};
/**
 * @param {string} name
 * @param {*} value
 * @return {(ee.Filter|null)}
 */
ee.Filter.lt = function(name, value) {
};
/**
 * @param {string} name
 * @param {*} value
 * @return {(ee.Filter|null)}
 */
ee.Filter.lte = function(name, value) {
};
/**
 * @param {string} name
 * @param {string} operator
 * @param {*} value
 * @return {(ee.Filter|null)}
 */
ee.Filter.metadata = function(name, operator, value) {
};
/**
 * @param {string} name
 * @param {*} value
 * @return {(ee.Filter|null)}
 */
ee.Filter.neq = function(name, value) {
};
/**
 * @param {string} name
 * @param {string} value
 * @return {(ee.Filter|null)}
 */
ee.Filter.not_contains = function(name, value) {
};
/**
 * @param {string} name
 * @param {string} value
 * @return {(ee.Filter|null)}
 */
ee.Filter.not_ends_with = function(name, value) {
};
/**
 * @param {string} name
 * @param {string} value
 * @return {(ee.Filter|null)}
 */
ee.Filter.not_starts_with = function(name, value) {
};
/**
 * @param {...(ee.Filter|null)} var_args
 * @return {(ee.Filter|null)}
 */
ee.Filter.or = function(var_args) {
};
/**
 * @param {...?} var_args
 * @return {(ee.Filter|null)}
 */
ee.Filter.prototype.and = function(var_args) {
};
/**
 * @param {...?} var_args
 * @return {(ee.Filter|null)}
 */
ee.Filter.prototype.bounds = function(var_args) {
};
/**
 * @param {...?} var_args
 * @return {(ee.Filter|null)}
 */
ee.Filter.prototype.contains = function(var_args) {
};
/**
 * @param {...?} var_args
 * @return {(ee.Filter|null)}
 */
ee.Filter.prototype.date = function(var_args) {
};
/**
 * @param {...?} var_args
 * @return {(ee.Filter|null)}
 */
ee.Filter.prototype.ends_with = function(var_args) {
};
/**
 * @param {...?} var_args
 * @return {(ee.Filter|null)}
 */
ee.Filter.prototype.eq = function(var_args) {
};
/**
 * @param {...?} var_args
 * @return {(ee.Filter|null)}
 */
ee.Filter.prototype.gt = function(var_args) {
};
/**
 * @param {...?} var_args
 * @return {(ee.Filter|null)}
 */
ee.Filter.prototype.gte = function(var_args) {
};
/**
 * @param {...?} var_args
 * @return {(ee.Filter|null)}
 */
ee.Filter.prototype.inList = function(var_args) {
};
/**
 * @return {number}
 */
ee.Filter.prototype.length = function() {
};
/**
 * @param {...?} var_args
 * @return {(ee.Filter|null)}
 */
ee.Filter.prototype.lt = function(var_args) {
};
/**
 * @param {...?} var_args
 * @return {(ee.Filter|null)}
 */
ee.Filter.prototype.lte = function(var_args) {
};
/**
 * @param {...?} var_args
 * @return {(ee.Filter|null)}
 */
ee.Filter.prototype.neq = function(var_args) {
};
/**
 * @return {(ee.Filter|null)}
 */
ee.Filter.prototype.not = function() {
};
/**
 * @param {...?} var_args
 * @return {(ee.Filter|null)}
 */
ee.Filter.prototype.not_contains = function(var_args) {
};
/**
 * @param {...?} var_args
 * @return {(ee.Filter|null)}
 */
ee.Filter.prototype.not_ends_with = function(var_args) {
};
/**
 * @param {...?} var_args
 * @return {(ee.Filter|null)}
 */
ee.Filter.prototype.not_starts_with = function(var_args) {
};
/**
 * @param {...?} var_args
 * @return {(ee.Filter|null)}
 */
ee.Filter.prototype.starts_with = function(var_args) {
};
/**
 * @param {string} name
 * @param {string} value
 * @return {(ee.Filter|null)}
 */
ee.Filter.starts_with = function(name, value) {
};
/**
 * @return {?}
 * @extends {ee.Encodable}
 * @constructor
 */
ee.Function = function() {
};
/**
 * @param {(Object|null)} namedArgs
 * @return {(ee.ComputedObject|null)}
 */
ee.Function.prototype.apply = function(namedArgs) {
};
/**
 * @param {...*} var_args
 * @return {(ee.ComputedObject|null)}
 */
ee.Function.prototype.call = function(var_args) {
};
/**
 * @param {(Object|null)} geoJson
 * @param {(ee.Projection|null)=} opt_proj
 * @param {boolean=} opt_geodesic
 * @param {boolean=} opt_evenOdd
 * @return {?}
 * @extends {ee.ComputedObject}
 * @constructor
 */
ee.Geometry = function(geoJson, opt_proj, opt_geodesic, opt_evenOdd) {
};
/**
 * @param {(Array|null)} coords
 * @param {(ee.Projection|null)=} opt_proj
 * @param {boolean=} opt_geodesic
 * @param {(ee.ErrorMargin|null)=} opt_maxError
 * @return {?}
 * @extends {ee.Geometry}
 * @constructor
 */
ee.Geometry.LineString = function(coords, opt_proj, opt_geodesic, opt_maxError) {
};
/**
 * @param {(Array|null)} coords
 * @param {(ee.Projection|null)=} opt_proj
 * @param {boolean=} opt_geodesic
 * @param {(ee.ErrorMargin|null)=} opt_maxError
 * @return {?}
 * @extends {ee.Geometry}
 * @constructor
 */
ee.Geometry.LinearRing = function(coords, opt_proj, opt_geodesic, opt_maxError) {
};
/**
 * @param {(Array|null)} coords
 * @param {(ee.Projection|null)=} opt_proj
 * @param {boolean=} opt_geodesic
 * @param {(ee.ErrorMargin|null)=} opt_maxError
 * @return {?}
 * @extends {ee.Geometry}
 * @constructor
 */
ee.Geometry.MultiLineString = function(coords, opt_proj, opt_geodesic, opt_maxError) {
};
/**
 * @param {(Array|null)} coords
 * @param {(ee.Projection|null)=} opt_proj
 * @return {?}
 * @extends {ee.Geometry}
 * @constructor
 */
ee.Geometry.MultiPoint = function(coords, opt_proj) {
};
/**
 * @param {(Array|null)} coords
 * @param {(ee.Projection|null)=} opt_proj
 * @param {boolean=} opt_geodesic
 * @param {(ee.ErrorMargin|null)=} opt_maxError
 * @param {boolean=} opt_evenOdd
 * @return {?}
 * @extends {ee.Geometry}
 * @constructor
 */
ee.Geometry.MultiPolygon = function(coords, opt_proj, opt_geodesic, opt_maxError, opt_evenOdd) {
};
/**
 * @param {Array<number>} coords
 * @param {(ee.Projection|null)=} opt_proj
 * @return {?}
 * @extends {ee.Geometry}
 * @constructor
 */
ee.Geometry.Point = function(coords, opt_proj) {
};
/**
 * @param {(Array|null)} coords
 * @param {(ee.Projection|null)=} opt_proj
 * @param {boolean=} opt_geodesic
 * @param {(ee.ErrorMargin|null)=} opt_maxError
 * @param {boolean=} opt_evenOdd
 * @return {?}
 * @extends {ee.Geometry}
 * @constructor
 */
ee.Geometry.Polygon = function(coords, opt_proj, opt_geodesic, opt_maxError, opt_evenOdd) {
};
/**
 * @param {(Array|null)} coords
 * @param {(ee.Projection|null)=} opt_proj
 * @param {boolean=} opt_geodesic
 * @param {(ee.ErrorMargin|null)=} opt_maxError
 * @param {boolean=} opt_evenOdd
 * @return {?}
 * @extends {ee.Geometry}
 * @constructor
 */
ee.Geometry.Rectangle = function(coords, opt_proj, opt_geodesic, opt_maxError, opt_evenOdd) {
};
/**
 * @return {string}
 */
ee.Geometry.prototype.serialize = function() {
};
/**
 * @return {{coordinates: (Array<(Array<(Array<(Array<number>|null|number)>|null|number)>|null|number)>|null), crs: (undefined|{properties: {name: string}, type: string}), geodesic: boolean, geometries: (Array<?>|null|undefined), type: string}}
 */
ee.Geometry.prototype.toGeoJSON = function() {
};
/**
 * @return {string}
 */
ee.Geometry.prototype.toGeoJSONString = function() {
};
/**
 * @param {(Object|null|number|string)=} opt_args
 * @return {?}
 * @extends {ee.Element}
 * @constructor
 */
ee.Image = function(opt_args) {
};
/**
 * @param {...(ee.Image|null)} var_args
 * @return {(ee.Image|null)}
 */
ee.Image.cat = function(var_args) {
};
/**
 * @param {(Object|null)} geometry
 * @return {(ee.Image|null)}
 */
ee.Image.prototype.clip = function(geometry) {
};
/**
 * @param {string} expression
 * @param {(Object<?,(ee.Image|null)>|null)=} opt_map
 * @return {ee.Image}
 */
ee.Image.prototype.expression = function(expression, opt_map) {
};
/**
 * @param {(Object|null)} params
 * @param {function ((null|string), string=): ?=} opt_callback
 * @return {(string|undefined)}
 */
ee.Image.prototype.getDownloadURL = function(params, opt_callback) {
};
/**
 * @param {function ({bands: (Array<ee.data.BandDescription>|null), id: (string|undefined), properties: (Object|null|undefined), type: string, version: (number|undefined)}, string=): ?=} opt_callback
 * @return {{bands: (Array<ee.data.BandDescription>|null), id: (string|undefined), properties: (Object|null|undefined), type: string, version: (number|undefined)}}
 */
ee.Image.prototype.getInfo = function(opt_callback) {
};
/**
 * @param {{bands: (Array<string>|null|string|undefined), bias: (Array<number>|null|number|undefined), format: (string|undefined), gain: (Array<number>|null|number|undefined), gamma: (Array<number>|null|number|undefined), image: (ee.Image|null|undefined), max: (Array<number>|null|number|undefined), min: (Array<number>|null|number|undefined), opacity: (number|undefined), palette: (Array<string>|null|string|undefined)}=} opt_visParams
 * @param {function ((Object|null), string=): ?=} opt_callback
 * @return {(undefined|{image: (ee.Image|null), mapid: string, token: string})}
 */
ee.Image.prototype.getMap = function(opt_visParams, opt_callback) {
};
/**
 * @param {(Object|null)} params
 * @param {function (string, string=): ?=} opt_callback
 * @return {(string|undefined)}
 */
ee.Image.prototype.getThumbURL = function(params, opt_callback) {
};
/**
 * @param {...(Object|null|string)} var_args
 * @return {(ee.Image|null)}
 */
ee.Image.prototype.rename = function(var_args) {
};
/**
 * @param {...*} var_args
 * @return {(ee.Image|null)}
 */
ee.Image.prototype.select = function(var_args) {
};
/**
 * @param {(ee.Image|null)} r
 * @param {(ee.Image|null)} g
 * @param {(ee.Image|null)} b
 * @return {(ee.Image|null)}
 */
ee.Image.rgb = function(r, g, b) {
};
/**
 * @param {(Array<*>|ee.ComputedObject|null|string)} args
 * @return {?}
 * @extends {ee.Collection}
 * @constructor
 */
ee.ImageCollection = function(args) {
};
/**
 * @param {function ({bands: (Array<ee.data.BandDescription>|null), features: (Array<ee.data.ImageDescription>|null), id: (string|undefined), properties: (Object|null|undefined), type: string, version: (number|undefined)}, string=): ?=} opt_callback
 * @return {{bands: (Array<ee.data.BandDescription>|null), features: (Array<ee.data.ImageDescription>|null), id: (string|undefined), properties: (Object|null|undefined), type: string, version: (number|undefined)}}
 */
ee.ImageCollection.prototype.getInfo = function(opt_callback) {
};
/**
 * @param {(Object|null)=} opt_visParams
 * @param {function ((Object|null), string=): ?=} opt_callback
 * @return {(undefined|{image: (ee.Image|null), mapid: string, token: string})}
 */
ee.ImageCollection.prototype.getMap = function(opt_visParams, opt_callback) {
};
/**
 * @param {(Array<(number|string)>|null)} selectors
 * @param {(Array<string>|null)=} opt_names
 * @return {(ee.ImageCollection|null)}
 */
ee.ImageCollection.prototype.select = function(selectors, opt_names) {
};
/** @enum {string} */
ee.InitState = {NOT_READY:1, LOADING:2, READY:3};
ee.InitState.LOADING;
ee.InitState.NOT_READY;
ee.InitState.READY;
/**
 * @param {(Object|null)} list
 * @return {?}
 * @extends {ee.ComputedObject}
 * @constructor
 */
ee.List = function(list) {
};
/**
 * @param {string} url
 * @param {string} mapId
 * @param {string} token
 * @param {(Object|null)} init
 * @param {(ee.data.Profiler|null)=} opt_profiler
 * @extends {goog.events.EventTarget}
 * @implements {goog.disposable.IDisposable}
 * @implements {goog.events.Listenable}
 * @constructor
 */
ee.MapLayerOverlay = function(url, mapId, token, init, opt_profiler) {
};
/**
 * @param {function ((ee.TileEvent|null)): ?} callback
 * @return {Object}
 */
ee.MapLayerOverlay.prototype.addTileCallback = function(callback) {
};
/**
 * @param {(google.maps.Point|null)} coord
 * @param {number} zoom
 * @param {(Node|null)} ownerDocument
 * @return {(Node|null)}
 */
ee.MapLayerOverlay.prototype.getTile = function(coord, zoom, ownerDocument) {
};
/**
 * @param {(Node|null)} tileDiv
 * @return {undefined}
 */
ee.MapLayerOverlay.prototype.releaseTile = function(tileDiv) {
};
/**
 * @param {Object} callbackId
 * @return {undefined}
 */
ee.MapLayerOverlay.prototype.removeTileCallback = function(callbackId) {
};
/**
 * @param {number} opacity
 * @return {undefined}
 */
ee.MapLayerOverlay.prototype.setOpacity = function(opacity) {
};
/**
 * @extends {goog.events.EventTarget}
 * @implements {goog.disposable.IDisposable}
 * @implements {goog.events.Listenable}
 * @constructor
 */
ee.MapTileManager = function() {
};
ee.Number;
/**
 * @param {boolean=} opt_isCompound
 * @constructor
 */
ee.Serializer = function(opt_isCompound) {
};
/**
 * @param {*} obj
 * @param {boolean=} opt_isCompound
 * @return {*}
 */
ee.Serializer.encode = function(obj, opt_isCompound) {
};
/**
 * @param {*} obj
 * @return {string}
 */
ee.Serializer.toJSON = function(obj) {
};
/**
 * @param {*} obj
 * @return {string}
 */
ee.Serializer.toReadableJSON = function(obj) {
};
ee.String;
ee.TILE_SIZE;
/** @type {{initialize: function (): undefined, initialized_: boolean, reset: function (): undefined}} */
ee.Terrain = {};
/**
 * @param {(ee.Function|null|string)} func
 * @param {(Object|null)} namedArgs
 * @return {(ee.ComputedObject|null)}
 */
ee.apply = function(func, namedArgs) {
};
/**
 * @param {(ee.Function|null|string)} func
 * @param {...*} var_args
 * @return {(ee.ComputedObject|null)}
 */
ee.call = function(func, var_args) {
};
ee.data;
/**
 * @param {(null|string)} clientId
 * @param {function (): ?} success
 * @param {function (string): ?=} opt_error
 * @param {Array<string>=} opt_extraScopes
 * @param {function (): ?=} opt_onImmediateFailed
 * @return {undefined}
 */
ee.data.authenticate = function(clientId, success, opt_error, opt_extraScopes, opt_onImmediateFailed) {
};
/**
 * @param {function (): ?=} opt_success
 * @param {function (string): ?=} opt_error
 * @return {undefined}
 */
ee.data.authenticateViaPopup = function(opt_success, opt_error) {
};
/**
 * @param {string} taskId
 * @param {function ({note: (string|undefined), started: string}, string=): ?=} opt_callback
 * @return {(Array<ee.data.TaskStatus>|null)}
 */
ee.data.cancelTask = function(taskId, opt_callback) {
};
/**
 * @return {undefined}
 */
ee.data.clearAuthToken = function() {
};
/**
 * @param {(Object|string)} value
 * @param {string=} opt_path
 * @param {boolean=} opt_force
 * @param {function ((Object|null), string=): ?=} opt_callback
 * @return {(Object|null)}
 */
ee.data.createAsset = function(value, opt_path, opt_force, opt_callback) {
};
/**
 * @param {string} requestedId
 * @param {function (Array<ee.data.FolderDescription>, string=): ?=} opt_callback
 * @return {undefined}
 */
ee.data.createAssetHome = function(requestedId, opt_callback) {
};
/**
 * @param {string} path
 * @param {boolean=} opt_force
 * @param {function ((Object|null), string=): ?=} opt_callback
 * @return {(Object|null)}
 */
ee.data.createFolder = function(path, opt_force, opt_callback) {
};
/**
 * @return {(null|string)}
 */
ee.data.getApiBaseUrl = function() {
};
/**
 * @param {string} assetId
 * @param {function ({all_users_can_read: (boolean|undefined), owners: Array<string>, readers: Array<string>, writers: Array<string>}, string=): ?=} opt_callback
 * @return {(ee.data.AssetAcl|null)}
 */
ee.data.getAssetAcl = function(assetId, opt_callback) {
};
/**
 * @param {function (Array<ee.data.FolderDescription>, string=): ?=} opt_callback
 * @return {(Array<ee.data.FolderDescription>|null)}
 */
ee.data.getAssetRoots = function(opt_callback) {
};
/**
 * @return {(null|string)}
 */
ee.data.getAuthClientId = function() {
};
/**
 * @return {Array<string>}
 */
ee.data.getAuthScopes = function() {
};
/**
 * @return {(null|string)}
 */
ee.data.getAuthToken = function() {
};
/**
 * @param {(Object|null)} params
 * @param {function ({docid: string, token: string}, string=): ?=} opt_callback
 * @return {(ee.data.DownloadId|null)}
 */
ee.data.getDownloadId = function(params, opt_callback) {
};
/**
 * @param {string} id
 * @param {function ((Object|null), string=): ?=} opt_callback
 * @return {(Object|null)}
 */
ee.data.getInfo = function(id, opt_callback) {
};
/**
 * @param {(Object|null)} params
 * @param {function ((Array<{id: string, properties: (Object|null|undefined), type: string}>|null), string=): ?=} opt_callback
 * @return {(Array<{id: string, properties: (Object|null|undefined), type: string}>|null)}
 */
ee.data.getList = function(params, opt_callback) {
};
/**
 * @param {{bands: (Array<string>|null|string|undefined), bias: (Array<number>|null|number|undefined), format: (string|undefined), gain: (Array<number>|null|number|undefined), gamma: (Array<number>|null|number|undefined), image: (ee.Image|null|undefined), max: (Array<number>|null|number|undefined), min: (Array<number>|null|number|undefined), opacity: (number|undefined), palette: (Array<string>|null|string|undefined)}} params
 * @param {function ({mapid: string, token: string}, string=): ?=} opt_callback
 * @return {(ee.data.RawMapId|null)}
 */
ee.data.getMapId = function(params, opt_callback) {
};
/**
 * @param {(Object|null)} params
 * @param {function ({docid: string, token: string}, string=): ?=} opt_callback
 * @return {(ee.data.DownloadId|null)}
 */
ee.data.getTableDownloadId = function(params, opt_callback) {
};
/**
 * @param {function ({tasks: (Array<{creation_timestamp_ms: (number|undefined), description: (string|undefined), error_message: (string|undefined), id: (string|undefined), internal_error_info: (string|undefined), output_url: (Array<string>|null|undefined), priority: (number|undefined), progress: (number|undefined), source_url: (string|undefined), state: (string|undefined), task_type: (string|undefined), update_timestamp_ms: (number|undefined)}>|null)}, string=): ?=} opt_callback
 * @return {{tasks: (Array<{creation_timestamp_ms: (number|undefined), description: (string|undefined), error_message: (string|undefined), id: (string|undefined), internal_error_info: (string|undefined), output_url: (Array<string>|null|undefined), priority: (number|undefined), progress: (number|undefined), source_url: (string|undefined), state: (string|undefined), task_type: (string|undefined), update_timestamp_ms: (number|undefined)}>|null)}}
 */
ee.data.getTaskList = function(opt_callback) {
};
/**
 * @param {(Array<string>|string)} taskId
 * @param {function ((Array<ee.data.TaskStatus>|null), string=): ?=} opt_callback
 * @return {(Array<ee.data.TaskStatus>|null)}
 */
ee.data.getTaskStatus = function(taskId, opt_callback) {
};
/**
 * @param {(Object|null)} params
 * @param {function ({thumbid: string, token: string}, string=): ?=} opt_callback
 * @return {(ee.data.ThumbnailId|null)}
 */
ee.data.getThumbId = function(params, opt_callback) {
};
/**
 * @return {(null|string)}
 */
ee.data.getTileBaseUrl = function() {
};
/**
 * @param {{mapid: string, token: string}} mapid
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @return {string}
 */
ee.data.getTileUrl = function(mapid, x, y, z) {
};
/**
 * @param {(Object|null)} params
 * @param {function (?, string=): ?=} opt_callback
 * @return {?}
 */
ee.data.getValue = function(params, opt_callback) {
};
/**
 * @return {(null|string)}
 */
ee.data.getXsrfToken = function() {
};
/**
 * @param {{docid: string, token: string}} id
 * @return {string}
 */
ee.data.makeDownloadUrl = function(id) {
};
/**
 * @param {{docid: string, token: string}} id
 * @return {string}
 */
ee.data.makeTableDownloadUrl = function(id) {
};
/**
 * @param {{thumbid: string, token: string}} id
 * @return {string}
 */
ee.data.makeThumbUrl = function(id) {
};
/**
 * @param {number=} opt_count
 * @param {function ((Array<string>|null), string=): ?=} opt_callback
 * @return {(Array<string>|null)}
 */
ee.data.newTaskId = function(opt_count, opt_callback) {
};
/**
 * @param {string} taskId
 * @param {(Object|null)} params
 * @param {function ({note: (string|undefined), started: string}, string=): ?=} opt_callback
 * @return {(ee.data.ProcessingResponse|null)}
 */
ee.data.prepareValue = function(taskId, params, opt_callback) {
};
/**
 * @param {string} assetId
 * @param {{all_users_can_read: (boolean|undefined), readers: Array<string>, writers: Array<string>}} aclUpdate
 * @param {function ((Object|null), string=): ?=} opt_callback
 * @return {undefined}
 */
ee.data.setAssetAcl = function(assetId, aclUpdate, opt_callback) {
};
/**
 * @param {string} clientId
 * @param {string} tokenType
 * @param {string} accessToken
 * @param {number} expiresIn
 * @param {Array<string>=} opt_extraScopes
 * @param {function (): ?=} opt_callback
 * @param {boolean=} opt_updateAuthLibrary
 * @return {undefined}
 */
ee.data.setAuthToken = function(clientId, tokenType, accessToken, expiresIn, opt_extraScopes, opt_callback, opt_updateAuthLibrary) {
};
/**
 * @param {(function ({client_id: string, immediate: boolean, scope: string}, function ({access_token: string, error: (string|undefined), expires_in: number, token_type: string}): ?): ?|null)} refresher
 * @return {undefined}
 */
ee.data.setAuthTokenRefresher = function(refresher) {
};
/**
 * @param {number} milliseconds
 * @return {undefined}
 */
ee.data.setDeadline = function(milliseconds) {
};
/**
 * @param {(function (goog.Uri.QueryData, string): goog.Uri.QueryData|null)} augmenter
 * @return {undefined}
 */
ee.data.setParamAugmenter = function(augmenter) {
};
/**
 * @param {string} taskId
 * @param {{bands: (Array<ee.data.Band>|undefined), id: string, missingData: (ee.data.MissingData|undefined), reductionPolicy: (ee.data.ReductionPolicy|undefined), tilesets: Array<ee.data.Tileset>}} request
 * @param {function ({note: (string|undefined), started: string}, string=): ?=} opt_callback
 * @return {(ee.data.ProcessingResponse|null)}
 */
ee.data.startIngestion = function(taskId, request, opt_callback) {
};
/**
 * @param {string} taskId
 * @param {(Object|null)} params
 * @param {function ({note: (string|undefined), started: string}, string=): ?=} opt_callback
 * @return {(ee.data.ProcessingResponse|null)}
 */
ee.data.startProcessing = function(taskId, params, opt_callback) {
};
/**
 * @param {(Array<string>|string)} taskId
 * @param {string} action
 * @param {function ({note: (string|undefined), started: string}, string=): ?=} opt_callback
 * @return {(Array<ee.data.TaskStatus>|null)}
 */
ee.data.updateTask = function(taskId, action, opt_callback) {
};
/**
 * @param {(function (string): ?|null)} hook
 * @param {function (): *} body
 * @param {*=} opt_this
 * @return {*}
 */
ee.data.withProfiling = function(hook, body, opt_this) {
};
/**
 * @param {(null|string)=} opt_baseurl
 * @param {(null|string)=} opt_tileurl
 * @param {(function (): ?|null)=} opt_successCallback
 * @param {(function ((Error|null)): ?|null)=} opt_errorCallback
 * @param {(null|string)=} opt_xsrfToken
 * @return {undefined}
 */
ee.initialize = function(opt_baseurl, opt_tileurl, opt_successCallback, opt_errorCallback, opt_xsrfToken) {
};
/**
 * @return {undefined}
 */
ee.reset = function() {
};
