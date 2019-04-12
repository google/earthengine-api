/**
 * @fileoverview Generated externs.
 * @externs
 */
/**
 * @const
 * @suppress {const,duplicate}
 */
var ee = {};
/**
 * @param {string} url
 * @param {string} mapId
 * @param {string} token
 * @param {(Object|null)=} opt_init
 * @param {(ee.data.Profiler|null)=} opt_profiler
 * @extends {goog.events.EventTarget}
 * @implements {goog.disposable.IDisposable}
 * @implements {goog.events.Listenable}
 * @constructor
 */
ee.AbstractOverlay = function(url, mapId, token, opt_init, opt_profiler) {
};
/** @type {{}} */
ee.Algorithms = {};
/**
 * @param {string} name
 * @param {(ee.data.AlgorithmSignature|{args: !Array<(ee.data.AlgorithmArgument|null)>, deprecated: (string|undefined), description: (string|undefined), name: string, returns: string})=} opt_signature
 * @return {?}
 * @extends {ee.Function}
 * @constructor
 */
ee.ApiFunction = function(name, opt_signature) {
};
/**
 * @param {string} name
 * @param {!Object} namedArgs
 * @return {!ee.ComputedObject}
 */
ee.ApiFunction._apply = function(name, namedArgs) {
};
/**
 * @param {string} name
 * @param {...*} var_args
 * @return {!ee.ComputedObject}
 */
ee.ApiFunction._call = function(name, var_args) {
};
/**
 * @param {string} name
 * @return {!ee.ApiFunction}
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
 * @param {(ee.Filter|null)} filter
 * @return {(ee.Collection|null)}
 */
ee.Collection.prototype.filter = function(filter) {
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
 * @param {function((Object|null), (Object|null)): (Object|null)} algorithm
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
 * @param {function((Object|null)): (Object|null)} algorithm
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
/**
 * @param {(ee.Function|null)} func
 * @param {(Object|null)} args
 * @param {(null|string)=} opt_varName
 * @return {?}
 * @extends {ee.Encodable}
 * @constructor
 * @template T
 */
ee.ComputedObject = function(func, args, opt_varName) {
};
/**
 * @param {(!Function|null)} func
 * @param {...*} var_args
 * @return {(ee.ComputedObject|null)}
 */
ee.ComputedObject.prototype.aside = function(func, var_args) {
};
/**
 * @param {function(T, string=): ?} callback
 * @return {undefined}
 */
ee.ComputedObject.prototype.evaluate = function(callback) {
};
/**
 * @param {function(T, string=): ?=} opt_callback
 * @return {T}
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
 * @param {{args: !Array<(ee.data.AlgorithmArgument|null)>, deprecated: (string|undefined), description: (string|undefined), name: string, returns: string}} signature
 * @param {(!Function|null)} body
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
 * @param {(Object|null)=} opt_dict
 * @return {?}
 * @extends {ee.ComputedObject}
 * @constructor
 */
ee.Dictionary = function(opt_dict) {
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
 * @param {function((ee.data.GeoJSONFeature|null), string=): ?=} opt_callback
 * @return {(ee.data.GeoJSONFeature|null)}
 */
ee.Feature.prototype.getInfo = function(opt_callback) {
};
/**
 * @param {(Object|null)=} opt_visParams
 * @param {function((Object|null), string=): ?=} opt_callback
 * @return {(ee.data.MapId|null|undefined)}
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
 * @param {function((null|string), string=): ?=} opt_callback
 * @return {(string|undefined)}
 */
ee.FeatureCollection.prototype.getDownloadURL = function(opt_format, opt_selectors, opt_filename, opt_callback) {
};
/**
 * @param {function((ee.data.FeatureCollectionDescription|null), string=): ?=} opt_callback
 * @return {(ee.data.FeatureCollectionDescription|null)}
 */
ee.FeatureCollection.prototype.getInfo = function(opt_callback) {
};
/**
 * @param {(Object|null)=} opt_visParams
 * @param {function((Object|null), string=): ?=} opt_callback
 * @return {(ee.data.MapId|null|undefined)}
 */
ee.FeatureCollection.prototype.getMap = function(opt_visParams, opt_callback) {
};
/**
 * @param {!Array<string>} propertySelectors
 * @param {!Array<string>=} opt_newProperties
 * @param {boolean=} opt_retainGeometry
 * @return {!ee.FeatureCollection}
 */
ee.FeatureCollection.prototype.select = function(propertySelectors, opt_newProperties, opt_retainGeometry) {
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
 * @param {(Date|null|number|string)} start
 * @param {(Date|null|number|string)=} opt_end
 * @return {(ee.Filter|null)}
 */
ee.Filter.date = function(start, opt_end) {
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
 * @param {...(ee.Filter|null)} var_args
 * @return {(ee.Filter|null)}
 */
ee.Filter.or = function(var_args) {
};
/**
 * @return {(ee.Filter|null)}
 */
ee.Filter.prototype.not = function() {
};
/**
 * @param {string} url
 * @param {string} mapId
 * @param {string} token
 * @extends {ee.AbstractOverlay}
 * @implements {goog.disposable.IDisposable}
 * @implements {goog.events.Listenable}
 * @constructor
 */
ee.FloatTileOverlay = function(url, mapId, token) {
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
 * @return {!ee.ComputedObject}
 */
ee.Function.prototype.apply = function(namedArgs) {
};
/**
 * @param {...*} var_args
 * @return {!ee.ComputedObject}
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
 * @param {(Array<?>|null)} coords
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
 * @param {(Array<?>|null)} coords
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
 * @param {(Array<?>|null)} coords
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
 * @param {(Array<?>|null)} coords
 * @param {(ee.Projection|null)=} opt_proj
 * @return {?}
 * @extends {ee.Geometry}
 * @constructor
 */
ee.Geometry.MultiPoint = function(coords, opt_proj) {
};
/**
 * @param {(Array<?>|null)} coords
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
 * @param {!Array<number>} coords
 * @param {(ee.Projection|null)=} opt_proj
 * @return {?}
 * @extends {ee.Geometry}
 * @constructor
 */
ee.Geometry.Point = function(coords, opt_proj) {
};
/**
 * @param {(Array<?>|null)} coords
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
 * @param {(Array<?>|null)} coords
 * @param {(ee.Projection|null)=} opt_proj
 * @param {boolean=} opt_geodesic
 * @param {boolean=} opt_evenOdd
 * @return {?}
 * @extends {ee.Geometry}
 * @constructor
 */
ee.Geometry.Rectangle = function(coords, opt_proj, opt_geodesic, opt_evenOdd) {
};
/**
 * @return {string}
 */
ee.Geometry.prototype.serialize = function() {
};
/**
 * @return {!ee.data.GeoJSONGeometry}
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
 * @return {!ee.Image}
 */
ee.Image.prototype.expression = function(expression, opt_map) {
};
/**
 * @param {(Object|null)} params
 * @param {function((null|string), string=): ?=} opt_callback
 * @return {(string|undefined)}
 */
ee.Image.prototype.getDownloadURL = function(params, opt_callback) {
};
/**
 * @param {function((ee.data.ImageDescription|null), string=): ?=} opt_callback
 * @return {(ee.data.ImageDescription|null)}
 */
ee.Image.prototype.getInfo = function(opt_callback) {
};
/**
 * @param {!ee.data.ImageVisualizationParameters=} opt_visParams
 * @param {function(!ee.data.MapId, string=): ?=} opt_callback
 * @return {(ee.data.MapId|undefined)}
 */
ee.Image.prototype.getMap = function(opt_visParams, opt_callback) {
};
/**
 * @param {!Object} params
 * @param {function(string, string=): ?=} opt_callback
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
 * @return {(ee.Image|null)}
 */
ee.ImageCollection.prototype.first = function() {
};
/**
 * @param {!Object} params
 * @param {function(string, string=): ?=} opt_callback
 * @return {(string|undefined)}
 */
ee.ImageCollection.prototype.getFilmstripThumbURL = function(params, opt_callback) {
};
/**
 * @param {function(!ee.data.ImageCollectionDescription, string=): ?=} opt_callback
 * @return {!ee.data.ImageCollectionDescription}
 */
ee.ImageCollection.prototype.getInfo = function(opt_callback) {
};
/**
 * @param {(Object|null)=} opt_visParams
 * @param {function((Object|null), string=): ?=} opt_callback
 * @return {(ee.data.MapId|null|undefined)}
 */
ee.ImageCollection.prototype.getMap = function(opt_visParams, opt_callback) {
};
/**
 * @param {!Object} params
 * @param {function(string, string=): ?=} opt_callback
 * @return {(string|undefined)}
 */
ee.ImageCollection.prototype.getVideoThumbURL = function(params, opt_callback) {
};
/**
 * @param {!Array<(number|string)>} selectors
 * @param {!Array<string>=} opt_names
 * @return {!ee.ImageCollection}
 */
ee.ImageCollection.prototype.select = function(selectors, opt_names) {
};
/** @enum {string} */
ee.InitState = {NOT_READY:1, LOADING:2, READY:3};
ee.InitState.LOADING;
ee.InitState.NOT_READY;
ee.InitState.READY;
/**
 * @param {!Object} list
 * @return {?}
 * @extends {ee.ComputedObject}
 * @constructor
 * @template T
 */
ee.List = function(list) {
};
/**
 * @param {string} url
 * @param {string} mapId
 * @param {string} token
 * @param {(Object|null)} init
 * @param {(ee.data.Profiler|null)=} opt_profiler
 * @extends {ee.AbstractOverlay}
 * @implements {goog.disposable.IDisposable}
 * @implements {goog.events.Listenable}
 * @constructor
 */
ee.MapLayerOverlay = function(url, mapId, token, init, opt_profiler) {
};
/**
 * @param {function((ee.TileEvent|null)): ?} callback
 * @return {!Object}
 */
ee.MapLayerOverlay.prototype.addTileCallback = function(callback) {
};
/**
 * @param {!google.maps.Point} coord
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
 * @param {!Object} callbackId
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
/**
 * @param {(Object|number)} number
 * @return {?}
 * @extends {ee.ComputedObject}
 * @constructor
 */
ee.Number = function(number) {
};
/**
 * @param {string} path
 * @param {{args: !Array<(ee.data.AlgorithmArgument|null)>, deprecated: (string|undefined), description: (string|undefined), name: string, returns: string}} signature
 * @return {?}
 * @extends {ee.Function}
 * @constructor
 */
ee.SavedFunction = function(path, signature) {
};
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
 * @return {{result: (null|string), values: (Object<string,{argumentReference: (null|string), arrayValue: (null|{values: (Array<?>|null)}), bytesValue: (null|string), constantValue: *, dictionaryValue: (null|{values: (Object<string,?>|null)}), functionDefinitionValue: (null|{argumentNames: (Array<string>|null), body: (null|string)}), functionInvocationValue: (null|{arguments: (Object<string,?>|null), functionName: (null|string), functionReference: (null|string)}), integerValue: (null|string), valueReference: (null|string)}>|null)}}
 */
ee.Serializer.encodeCloudApi = function(obj) {
};
/**
 * @param {*} obj
 * @return {*}
 */
ee.Serializer.encodeCloudApiPretty = function(obj) {
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
ee.Serializer.toReadableCloudApiJSON = function(obj) {
};
/**
 * @param {*} obj
 * @return {string}
 */
ee.Serializer.toReadableJSON = function(obj) {
};
/**
 * @param {(Object|string)} string
 * @return {?}
 * @extends {ee.ComputedObject}
 * @constructor
 */
ee.String = function(string) {
};
ee.TILE_SIZE;
/** @type {{}} */
ee.Terrain = {};
/**
 * @param {(ee.Function|null|string)} func
 * @param {(Object|null)} namedArgs
 * @return {(ee.ComputedObject|null)}
 */
ee.apply = function(func, namedArgs) {
};
ee.batch;
ee.batch.Export;
ee.batch.Export.image;
/**
 * @param {!ee.Image} image
 * @param {string=} opt_description
 * @param {string=} opt_assetId
 * @param {(Object|null)=} opt_pyramidingPolicy
 * @param {(number|string)=} opt_dimensions
 * @param {(ee.Geometry.LinearRing|ee.Geometry.Polygon|null|string)=} opt_region
 * @param {number=} opt_scale
 * @param {string=} opt_crs
 * @param {string=} opt_crsTransform
 * @param {number=} opt_maxPixels
 * @return {!ee.batch.ExportTask}
 */
ee.batch.Export.image.toAsset = function(image, opt_description, opt_assetId, opt_pyramidingPolicy, opt_dimensions, opt_region, opt_scale, opt_crs, opt_crsTransform, opt_maxPixels) {
};
/**
 * @param {!ee.Image} image
 * @param {string=} opt_description
 * @param {string=} opt_bucket
 * @param {string=} opt_fileNamePrefix
 * @param {(number|string)=} opt_dimensions
 * @param {(ee.Geometry.LinearRing|ee.Geometry.Polygon|null|string)=} opt_region
 * @param {number=} opt_scale
 * @param {string=} opt_crs
 * @param {string=} opt_crsTransform
 * @param {number=} opt_maxPixels
 * @param {number=} opt_shardSize
 * @param {(Array<number>|null|number)=} opt_fileDimensions
 * @param {boolean=} opt_skipEmptyTiles
 * @param {string=} opt_fileFormat
 * @param {(null|{cloudOptimized: (boolean|undefined), collapseBands: (boolean|undefined), compressed: (boolean|undefined), defaultValue: (number|undefined), fileDimensions: (Array<number>|undefined), kernelSize: (Array<number>|undefined), maskedThreshold: (number|undefined), maxFileSize: (number|undefined), patchDimensions: (Array<number>|undefined), sequenceData: (boolean|undefined), tensorDepths: (Object|undefined)})=} opt_formatOptions
 * @return {!ee.batch.ExportTask}
 */
ee.batch.Export.image.toCloudStorage = function(image, opt_description, opt_bucket, opt_fileNamePrefix, opt_dimensions, opt_region, opt_scale, opt_crs, opt_crsTransform, opt_maxPixels, opt_shardSize, opt_fileDimensions, opt_skipEmptyTiles, opt_fileFormat, opt_formatOptions) {
};
/**
 * @param {!ee.Image} image
 * @param {string=} opt_description
 * @param {string=} opt_folder
 * @param {string=} opt_fileNamePrefix
 * @param {(number|string)=} opt_dimensions
 * @param {(ee.Geometry.LinearRing|ee.Geometry.Polygon|null|string)=} opt_region
 * @param {number=} opt_scale
 * @param {string=} opt_crs
 * @param {string=} opt_crsTransform
 * @param {number=} opt_maxPixels
 * @param {number=} opt_shardSize
 * @param {(Array<number>|null|number)=} opt_fileDimensions
 * @param {boolean=} opt_skipEmptyTiles
 * @param {string=} opt_fileFormat
 * @param {(null|{cloudOptimized: (boolean|undefined), collapseBands: (boolean|undefined), compressed: (boolean|undefined), defaultValue: (number|undefined), fileDimensions: (Array<number>|undefined), kernelSize: (Array<number>|undefined), maskedThreshold: (number|undefined), maxFileSize: (number|undefined), patchDimensions: (Array<number>|undefined), sequenceData: (boolean|undefined), tensorDepths: (Object|undefined)})=} opt_formatOptions
 * @return {!ee.batch.ExportTask}
 */
ee.batch.Export.image.toDrive = function(image, opt_description, opt_folder, opt_fileNamePrefix, opt_dimensions, opt_region, opt_scale, opt_crs, opt_crsTransform, opt_maxPixels, opt_shardSize, opt_fileDimensions, opt_skipEmptyTiles, opt_fileFormat, opt_formatOptions) {
};
ee.batch.Export.map;
/**
 * @param {!ee.Image} image
 * @param {string=} opt_description
 * @param {string=} opt_bucket
 * @param {string=} opt_fileFormat
 * @param {string=} opt_path
 * @param {boolean=} opt_writePublicTiles
 * @param {number=} opt_scale
 * @param {number=} opt_maxZoom
 * @param {number=} opt_minZoom
 * @param {(ee.Geometry.LinearRing|ee.Geometry.Polygon|null|string)=} opt_region
 * @param {boolean=} opt_skipEmptyTiles
 * @param {string=} opt_mapsApiKey
 * @return {!ee.batch.ExportTask}
 */
ee.batch.Export.map.toCloudStorage = function(image, opt_description, opt_bucket, opt_fileFormat, opt_path, opt_writePublicTiles, opt_scale, opt_maxZoom, opt_minZoom, opt_region, opt_skipEmptyTiles, opt_mapsApiKey) {
};
ee.batch.Export.table;
/**
 * @param {!ee.FeatureCollection} collection
 * @param {string=} opt_description
 * @param {string=} opt_assetId
 * @return {!ee.batch.ExportTask}
 */
ee.batch.Export.table.toAsset = function(collection, opt_description, opt_assetId) {
};
/**
 * @param {!ee.FeatureCollection} collection
 * @param {string=} opt_description
 * @param {string=} opt_bucket
 * @param {string=} opt_fileNamePrefix
 * @param {string=} opt_fileFormat
 * @param {(Array<string>|string)=} opt_selectors
 * @return {!ee.batch.ExportTask}
 */
ee.batch.Export.table.toCloudStorage = function(collection, opt_description, opt_bucket, opt_fileNamePrefix, opt_fileFormat, opt_selectors) {
};
/**
 * @param {!ee.FeatureCollection} collection
 * @param {string=} opt_description
 * @param {string=} opt_folder
 * @param {string=} opt_fileNamePrefix
 * @param {string=} opt_fileFormat
 * @param {(Array<string>|string)=} opt_selectors
 * @return {!ee.batch.ExportTask}
 */
ee.batch.Export.table.toDrive = function(collection, opt_description, opt_folder, opt_fileNamePrefix, opt_fileFormat, opt_selectors) {
};
ee.batch.Export.video;
/**
 * @param {!ee.ImageCollection} collection
 * @param {string=} opt_description
 * @param {string=} opt_bucket
 * @param {string=} opt_fileNamePrefix
 * @param {number=} opt_framesPerSecond
 * @param {(number|string)=} opt_dimensions
 * @param {(ee.Geometry.LinearRing|ee.Geometry.Polygon|null|string)=} opt_region
 * @param {number=} opt_scale
 * @param {string=} opt_crs
 * @param {string=} opt_crsTransform
 * @param {number=} opt_maxPixels
 * @param {number=} opt_maxFrames
 * @return {!ee.batch.ExportTask}
 */
ee.batch.Export.video.toCloudStorage = function(collection, opt_description, opt_bucket, opt_fileNamePrefix, opt_framesPerSecond, opt_dimensions, opt_region, opt_scale, opt_crs, opt_crsTransform, opt_maxPixels, opt_maxFrames) {
};
/**
 * @param {!ee.ImageCollection} collection
 * @param {string=} opt_description
 * @param {string=} opt_folder
 * @param {string=} opt_fileNamePrefix
 * @param {number=} opt_framesPerSecond
 * @param {(number|string)=} opt_dimensions
 * @param {(ee.Geometry.LinearRing|ee.Geometry.Polygon|null|string)=} opt_region
 * @param {number=} opt_scale
 * @param {string=} opt_crs
 * @param {string=} opt_crsTransform
 * @param {number=} opt_maxPixels
 * @param {number=} opt_maxFrames
 * @return {!ee.batch.ExportTask}
 */
ee.batch.Export.video.toDrive = function(collection, opt_description, opt_folder, opt_fileNamePrefix, opt_framesPerSecond, opt_dimensions, opt_region, opt_scale, opt_crs, opt_crsTransform, opt_maxPixels, opt_maxFrames) {
};
ee.batch.Export.videoMap;
/**
 * @param {!ee.ImageCollection} collection
 * @param {string=} opt_description
 * @param {string=} opt_bucket
 * @param {string=} opt_fileNamePrefix
 * @param {number=} opt_framesPerSecond
 * @param {boolean=} opt_writePublicTiles
 * @param {number=} opt_minZoom
 * @param {number=} opt_maxZoom
 * @param {number=} opt_scale
 * @param {(ee.Geometry.LinearRing|ee.Geometry.Polygon|null|string)=} opt_region
 * @param {boolean=} opt_skipEmptyTiles
 * @return {!ee.batch.ExportTask}
 */
ee.batch.Export.videoMap.toCloudStorage = function(collection, opt_description, opt_bucket, opt_fileNamePrefix, opt_framesPerSecond, opt_writePublicTiles, opt_minZoom, opt_maxZoom, opt_scale, opt_region, opt_skipEmptyTiles) {
};
ee.batch.ExportTask;
ee.batch.ExportTask.prototype.id;
/**
 * @param {function(): ?=} opt_success
 * @param {function(string=): ?=} opt_error
 * @return {undefined}
 */
ee.batch.ExportTask.prototype.start = function(opt_success, opt_error) {
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
 * @param {function(): ?} success
 * @param {function(string): ?=} opt_error
 * @param {!Array<string>=} opt_extraScopes
 * @param {function(): ?=} opt_onImmediateFailed
 * @return {undefined}
 */
ee.data.authenticate = function(clientId, success, opt_error, opt_extraScopes, opt_onImmediateFailed) {
};
/**
 * @param {(null|string)} clientId
 * @param {function(): ?} success
 * @param {function(string): ?=} opt_error
 * @param {!Array<string>=} opt_extraScopes
 * @param {function(): ?=} opt_onImmediateFailed
 * @return {undefined}
 */
ee.data.authenticateViaOauth = function(clientId, success, opt_error, opt_extraScopes, opt_onImmediateFailed) {
};
/**
 * @param {function(): ?=} opt_success
 * @param {function(string): ?=} opt_error
 * @return {undefined}
 */
ee.data.authenticateViaPopup = function(opt_success, opt_error) {
};
/**
 * @param {!ee.data.AuthPrivateKey} privateKey
 * @param {function(): ?=} opt_success
 * @param {function(string): ?=} opt_error
 * @param {!Array<string>=} opt_extraScopes
 * @return {undefined}
 */
ee.data.authenticateViaPrivateKey = function(privateKey, opt_success, opt_error, opt_extraScopes) {
};
/**
 * @param {(Array<string>|string)} operationName
 * @param {function(!Object, string=): ?=} opt_callback
 * @return {undefined}
 */
ee.data.cancelOperation = function(operationName, opt_callback) {
};
/**
 * @param {string} taskId
 * @param {function((ee.data.ProcessingResponse|null), string=): ?=} opt_callback
 * @return {(Array<(ee.data.TaskStatus|null)>|null)}
 */
ee.data.cancelTask = function(taskId, opt_callback) {
};
/**
 * @return {undefined}
 */
ee.data.clearAuthToken = function() {
};
/**
 * @param {string} sourceId
 * @param {string} destinationId
 * @param {function((Object|null), string=): ?=} opt_callback
 * @return {undefined}
 */
ee.data.copyAsset = function(sourceId, destinationId, opt_callback) {
};
/**
 * @param {(Object|string)} value
 * @param {string=} opt_path
 * @param {boolean=} opt_force
 * @param {!Object=} opt_properties
 * @param {function((Object|null), string=): ?=} opt_callback
 * @return {(Object|null)}
 */
ee.data.createAsset = function(value, opt_path, opt_force, opt_properties, opt_callback) {
};
/**
 * @param {string} requestedId
 * @param {function((Array<ee.data.FolderDescription>|null), string=): ?=} opt_callback
 * @return {undefined}
 */
ee.data.createAssetHome = function(requestedId, opt_callback) {
};
/**
 * @param {string} path
 * @param {boolean=} opt_force
 * @param {function(!Object, string=): ?=} opt_callback
 * @return {(Object|null)}
 */
ee.data.createFolder = function(path, opt_force, opt_callback) {
};
/**
 * @param {string} assetId
 * @param {function((Object|null), string=): ?=} opt_callback
 * @return {undefined}
 */
ee.data.deleteAsset = function(assetId, opt_callback) {
};
/**
 * @return {(null|string)}
 */
ee.data.getApiBaseUrl = function() {
};
/**
 * @param {string} id
 * @param {function(!Object, string=): ?=} opt_callback
 * @return {(Object|null)}
 */
ee.data.getAsset = function(id, opt_callback) {
};
/**
 * @param {string} assetId
 * @param {function(!ee.data.AssetAcl, string=): ?=} opt_callback
 * @return {(ee.data.AssetAcl|null)}
 */
ee.data.getAssetAcl = function(assetId, opt_callback) {
};
/**
 * @param {string} rootId
 * @param {function(!ee.data.AssetQuotaDetails, string=): ?=} opt_callback
 * @return {(ee.data.AssetQuotaDetails|null)}
 */
ee.data.getAssetRootQuota = function(rootId, opt_callback) {
};
/**
 * @param {function((Array<ee.data.FolderDescription>|null), string=): ?=} opt_callback
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
 * @return {!Array<string>}
 */
ee.data.getAuthScopes = function() {
};
/**
 * @return {(null|string)}
 */
ee.data.getAuthToken = function() {
};
/**
 * @return {boolean}
 */
ee.data.getCloudApiEnabled = function() {
};
/**
 * @param {!Object} params
 * @param {function((ee.data.DownloadId|null), string=): ?=} opt_callback
 * @return {(ee.data.DownloadId|null)}
 */
ee.data.getDownloadId = function(params, opt_callback) {
};
ee.data.getInfo;
/**
 * @param {!Object} params
 * @param {function((Array<ee.data.ShortAssetDescription>|null), string=): ?=} opt_callback
 * @return {(Array<ee.data.ShortAssetDescription>|null)}
 */
ee.data.getList = function(params, opt_callback) {
};
/**
 * @param {!ee.data.ImageVisualizationParameters} params
 * @param {function(!ee.data.RawMapId, string=): ?=} opt_callback
 * @return {(ee.data.RawMapId|null)}
 */
ee.data.getMapId = function(params, opt_callback) {
};
/**
 * @param {(Array<string>|string)} operationName
 * @param {function(!Object, string=): ?=} opt_callback
 * @return {(Object<string,ee.rpc_proto.Operation>|ee.rpc_proto.Operation)}
 */
ee.data.getOperation = function(operationName, opt_callback) {
};
/**
 * @param {(Object|null)} params
 * @param {function(!ee.data.DownloadId, string=): ?=} opt_callback
 * @return {(ee.data.DownloadId|null)}
 */
ee.data.getTableDownloadId = function(params, opt_callback) {
};
/**
 * @param {(function((ee.data.TaskListResponse|null), string=): ?|null)=} opt_callback
 * @return {(ee.data.TaskListResponse|null)}
 */
ee.data.getTaskList = function(opt_callback) {
};
/**
 * @param {number=} opt_limit
 * @param {(function((ee.data.TaskListResponse|null), string=): ?|null)=} opt_callback
 * @return {(ee.data.TaskListResponse|null)}
 */
ee.data.getTaskListWithLimit = function(opt_limit, opt_callback) {
};
/**
 * @param {(Array<string>|string)} taskId
 * @param {function((Array<ee.data.TaskStatus>|null), string=): ?=} opt_callback
 * @return {(Array<ee.data.TaskStatus>|null)}
 */
ee.data.getTaskStatus = function(taskId, opt_callback) {
};
/**
 * @param {!ee.data.ThumbnailOptions} params
 * @param {function(!ee.data.ThumbnailId, string=): ?=} opt_callback
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
 * @param {!ee.data.RawMapId} mapid
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @return {string}
 */
ee.data.getTileUrl = function(mapid, x, y, z) {
};
/**
 * @param {(Object|null)} params
 * @param {function(?, string=): ?=} opt_callback
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
 * @param {!ee.rpc_proto.ListAssetsRequest} body
 * @param {function({assets: (Array<{bands: (Array<{dataType: (null|{dimensionsCount: (null|number), precision: (null|string), range: (null|{max: (null|number), min: (null|number)})}), grid: (null|{affineTransform: (null|{scaleX: (null|number), scaleY: (null|number), shearX: (null|number), shearY: (null|number), translateX: (null|number), translateY: (null|number)}), crsCode: (null|string), crsWkt: (null|string), dimensions: (null|{height: (null|number), width: (null|number)})}), id: (null|string), missingData: (null|{values: (Array<number>|null)}), pyramidingPolicy: (null|string), tilesets: (Array<{fileIndexes: (Array<number>|null), firstTileIndex: (null|number), tilesPerFile: (null|number)}>|null)}>|null), endTime: (null|string), geometry: (Object<string,*>|null), id: (null|string), name: (null|string), path: (null|string), properties: (Object<string,*>|null), quota: (null|{assetCount: (null|string), maxAssetCount: (null|string), maxSizeBytes: (null|string), sizeBytes: (null|string)}), sizeBytes: (null|string), startTime: (null|string), tilestoreEntry: (null|{pathPrefix: (null|string), sources: (Array<{headerSizeBytes: (null|number), pathSuffix: (null|string)}>|null)}), time: (null|string), type: (null|string), updateTime: (null|string)}>|null), nextPageToken: (null|string)}, string=): ?=} opt_callback
 * @return {(null|{assets: (Array<{bands: (Array<{dataType: (null|{dimensionsCount: (null|number), precision: (null|string), range: (null|{max: (null|number), min: (null|number)})}), grid: (null|{affineTransform: (null|{scaleX: (null|number), scaleY: (null|number), shearX: (null|number), shearY: (null|number), translateX: (null|number), translateY: (null|number)}), crsCode: (null|string), crsWkt: (null|string), dimensions: (null|{height: (null|number), width: (null|number)})}), id: (null|string), missingData: (null|{values: (Array<number>|null)}), pyramidingPolicy: (null|string), tilesets: (Array<{fileIndexes: (Array<number>|null), firstTileIndex: (null|number), tilesPerFile: (null|number)}>|null)}>|null), endTime: (null|string), geometry: (Object<string,*>|null), id: (null|string), name: (null|string), path: (null|string), properties: (Object<string,*>|null), quota: (null|{assetCount: (null|string), maxAssetCount: (null|string), maxSizeBytes: (null|string), sizeBytes: (null|string)}), sizeBytes: (null|string), startTime: (null|string), tilestoreEntry: (null|{pathPrefix: (null|string), sources: (Array<{headerSizeBytes: (null|number), pathSuffix: (null|string)}>|null)}), time: (null|string), type: (null|string), updateTime: (null|string)}>|null), nextPageToken: (null|string)})}
 */
ee.data.listAssets = function(body, opt_callback) {
};
/**
 * @param {function({buckets: (Array<{bands: (Array<{dataType: (null|{dimensionsCount: (null|number), precision: (null|string), range: (null|{max: (null|number), min: (null|number)})}), grid: (null|{affineTransform: (null|{scaleX: (null|number), scaleY: (null|number), shearX: (null|number), shearY: (null|number), translateX: (null|number), translateY: (null|number)}), crsCode: (null|string), crsWkt: (null|string), dimensions: (null|{height: (null|number), width: (null|number)})}), id: (null|string), missingData: (null|{values: (Array<number>|null)}), pyramidingPolicy: (null|string), tilesets: (Array<{fileIndexes: (Array<number>|null), firstTileIndex: (null|number), tilesPerFile: (null|number)}>|null)}>|null), endTime: (null|string), geometry: (Object<string,*>|null), id: (null|string), name: (null|string), path: (null|string), properties: (Object<string,*>|null), quota: (null|{assetCount: (null|string), maxAssetCount: (null|string), maxSizeBytes: (null|string), sizeBytes: (null|string)}), sizeBytes: (null|string), startTime: (null|string), tilestoreEntry: (null|{pathPrefix: (null|string), sources: (Array<{headerSizeBytes: (null|number), pathSuffix: (null|string)}>|null)}), time: (null|string), type: (null|string), updateTime: (null|string)}>|null)}, string=): ?=} opt_callback
 * @return {(null|{buckets: (Array<{bands: (Array<{dataType: (null|{dimensionsCount: (null|number), precision: (null|string), range: (null|{max: (null|number), min: (null|number)})}), grid: (null|{affineTransform: (null|{scaleX: (null|number), scaleY: (null|number), shearX: (null|number), shearY: (null|number), translateX: (null|number), translateY: (null|number)}), crsCode: (null|string), crsWkt: (null|string), dimensions: (null|{height: (null|number), width: (null|number)})}), id: (null|string), missingData: (null|{values: (Array<number>|null)}), pyramidingPolicy: (null|string), tilesets: (Array<{fileIndexes: (Array<number>|null), firstTileIndex: (null|number), tilesPerFile: (null|number)}>|null)}>|null), endTime: (null|string), geometry: (Object<string,*>|null), id: (null|string), name: (null|string), path: (null|string), properties: (Object<string,*>|null), quota: (null|{assetCount: (null|string), maxAssetCount: (null|string), maxSizeBytes: (null|string), sizeBytes: (null|string)}), sizeBytes: (null|string), startTime: (null|string), tilestoreEntry: (null|{pathPrefix: (null|string), sources: (Array<{headerSizeBytes: (null|number), pathSuffix: (null|string)}>|null)}), time: (null|string), type: (null|string), updateTime: (null|string)}>|null)})}
 */
ee.data.listBuckets = function(opt_callback) {
};
/**
 * @param {!ee.rpc_proto.ListImagesRequest} body
 * @param {function({assets: (Array<{bands: (Array<{dataType: (null|{dimensionsCount: (null|number), precision: (null|string), range: (null|{max: (null|number), min: (null|number)})}), grid: (null|{affineTransform: (null|{scaleX: (null|number), scaleY: (null|number), shearX: (null|number), shearY: (null|number), translateX: (null|number), translateY: (null|number)}), crsCode: (null|string), crsWkt: (null|string), dimensions: (null|{height: (null|number), width: (null|number)})}), id: (null|string), missingData: (null|{values: (Array<number>|null)}), pyramidingPolicy: (null|string), tilesets: (Array<{fileIndexes: (Array<number>|null), firstTileIndex: (null|number), tilesPerFile: (null|number)}>|null)}>|null), endTime: (null|string), geometry: (Object<string,*>|null), id: (null|string), name: (null|string), path: (null|string), properties: (Object<string,*>|null), quota: (null|{assetCount: (null|string), maxAssetCount: (null|string), maxSizeBytes: (null|string), sizeBytes: (null|string)}), sizeBytes: (null|string), startTime: (null|string), tilestoreEntry: (null|{pathPrefix: (null|string), sources: (Array<{headerSizeBytes: (null|number), pathSuffix: (null|string)}>|null)}), time: (null|string), type: (null|string), updateTime: (null|string)}>|null), nextPageToken: (null|string)}, string=): ?=} opt_callback
 * @return {(null|{assets: (Array<{bands: (Array<{dataType: (null|{dimensionsCount: (null|number), precision: (null|string), range: (null|{max: (null|number), min: (null|number)})}), grid: (null|{affineTransform: (null|{scaleX: (null|number), scaleY: (null|number), shearX: (null|number), shearY: (null|number), translateX: (null|number), translateY: (null|number)}), crsCode: (null|string), crsWkt: (null|string), dimensions: (null|{height: (null|number), width: (null|number)})}), id: (null|string), missingData: (null|{values: (Array<number>|null)}), pyramidingPolicy: (null|string), tilesets: (Array<{fileIndexes: (Array<number>|null), firstTileIndex: (null|number), tilesPerFile: (null|number)}>|null)}>|null), endTime: (null|string), geometry: (Object<string,*>|null), id: (null|string), name: (null|string), path: (null|string), properties: (Object<string,*>|null), quota: (null|{assetCount: (null|string), maxAssetCount: (null|string), maxSizeBytes: (null|string), sizeBytes: (null|string)}), sizeBytes: (null|string), startTime: (null|string), tilestoreEntry: (null|{pathPrefix: (null|string), sources: (Array<{headerSizeBytes: (null|number), pathSuffix: (null|string)}>|null)}), time: (null|string), type: (null|string), updateTime: (null|string)}>|null), nextPageToken: (null|string)})}
 */
ee.data.listImages = function(body, opt_callback) {
};
/**
 * @param {!ee.data.DownloadId} id
 * @return {string}
 */
ee.data.makeDownloadUrl = function(id) {
};
/**
 * @param {!ee.data.DownloadId} id
 * @return {string}
 */
ee.data.makeTableDownloadUrl = function(id) {
};
/**
 * @param {!ee.data.ThumbnailId} id
 * @return {string}
 */
ee.data.makeThumbUrl = function(id) {
};
/**
 * @param {number=} opt_count
 * @param {function((Array<string>|null), string=): ?=} opt_callback
 * @return {(Array<string>|null)}
 */
ee.data.newTaskId = function(opt_count, opt_callback) {
};
/**
 * @param {string} sourceId
 * @param {string} destinationId
 * @param {function(!Object, string=): ?=} opt_callback
 * @return {undefined}
 */
ee.data.renameAsset = function(sourceId, destinationId, opt_callback) {
};
/**
 * @param {string} apiKey
 * @return {undefined}
 */
ee.data.setApiKey = function(apiKey) {
};
/**
 * @param {string} assetId
 * @param {!ee.data.AssetAclUpdate} aclUpdate
 * @param {function((Object|null), string=): ?=} opt_callback
 * @return {undefined}
 */
ee.data.setAssetAcl = function(assetId, aclUpdate, opt_callback) {
};
/**
 * @param {string} assetId
 * @param {!Object} properties
 * @param {function((Object|null), string=): ?=} opt_callback
 * @return {undefined}
 */
ee.data.setAssetProperties = function(assetId, properties, opt_callback) {
};
/**
 * @param {string} clientId
 * @param {string} tokenType
 * @param {string} accessToken
 * @param {number} expiresIn
 * @param {!Array<string>=} opt_extraScopes
 * @param {function(): ?=} opt_callback
 * @param {boolean=} opt_updateAuthLibrary
 * @return {undefined}
 */
ee.data.setAuthToken = function(clientId, tokenType, accessToken, expiresIn, opt_extraScopes, opt_callback, opt_updateAuthLibrary) {
};
/**
 * @param {(function(!ee.data.AuthArgs, function(!ee.data.AuthResponse): ?): ?|null)} refresher
 * @return {undefined}
 */
ee.data.setAuthTokenRefresher = function(refresher) {
};
/**
 * @param {boolean} enable
 * @return {undefined}
 */
ee.data.setCloudApiEnabled = function(enable) {
};
/**
 * @param {number} milliseconds
 * @return {undefined}
 */
ee.data.setDeadline = function(milliseconds) {
};
/**
 * @param {(function(!goog.Uri.QueryData, string): !goog.Uri.QueryData|null)} augmenter
 * @return {undefined}
 */
ee.data.setParamAugmenter = function(augmenter) {
};
/**
 * @param {string} project
 * @return {undefined}
 */
ee.data.setProject = function(project) {
};
/**
 * @param {string} taskId
 * @param {!ee.data.IngestionRequest} request
 * @param {function((ee.data.ProcessingResponse|null), string=): ?=} opt_callback
 * @return {(ee.data.ProcessingResponse|null)}
 */
ee.data.startIngestion = function(taskId, request, opt_callback) {
};
/**
 * @param {string} taskId
 * @param {(Object|null)} params
 * @param {function((ee.data.ProcessingResponse|null), string=): ?=} opt_callback
 * @return {(ee.data.ProcessingResponse|null)}
 */
ee.data.startProcessing = function(taskId, params, opt_callback) {
};
/**
 * @param {string} taskId
 * @param {!ee.data.TableIngestionRequest} request
 * @param {function((ee.data.ProcessingResponse|null), string=): ?=} opt_callback
 * @return {(ee.data.ProcessingResponse|null)}
 */
ee.data.startTableIngestion = function(taskId, request, opt_callback) {
};
/**
 * @param {string} assetId
 * @param {!Object} asset
 * @param {(Array<string>|null)} updateMask
 * @param {function((Object|null), string=): ?=} opt_callback
 * @return {undefined}
 */
ee.data.updateAsset = function(assetId, asset, updateMask, opt_callback) {
};
/**
 * @param {(Array<string>|string)} taskId
 * @param {string} action
 * @param {function((ee.data.ProcessingResponse|null), string=): ?=} opt_callback
 * @return {(Array<ee.data.TaskStatus>|null)}
 */
ee.data.updateTask = function(taskId, action, opt_callback) {
};
/**
 * @param {(function(string): ?|null)} hook
 * @param {function(): *} body
 * @param {*=} opt_this
 * @return {*}
 */
ee.data.withProfiling = function(hook, body, opt_this) {
};
/**
 * @param {(null|string)=} opt_baseurl
 * @param {(null|string)=} opt_tileurl
 * @param {(function(): ?|null)=} opt_successCallback
 * @param {(function((Error|null)): ?|null)=} opt_errorCallback
 * @param {(null|string)=} opt_xsrfToken
 * @return {undefined}
 */
ee.initialize = function(opt_baseurl, opt_tileurl, opt_successCallback, opt_errorCallback, opt_xsrfToken) {
};
/**
 * @const
 * @suppress {const,duplicate}
 */
ee.layers = {};
/**
 * @param {!ee.layers.AbstractTileSource} tileSource
 * @param {(Object|null)=} opt_options
 * @extends {goog.events.EventTarget}
 * @implements {goog.disposable.IDisposable}
 * @implements {goog.events.Listenable}
 * @implements {google.maps.MapType}
 * @constructor
 */
ee.layers.AbstractOverlay = function(tileSource, opt_options) {
};
/**
 * @param {function((ee.layers.TileLoadEvent|null)): ?} callback
 * @return {!Object}
 */
ee.layers.AbstractOverlay.prototype.addTileCallback = function(callback) {
};
/**
 * @param {!Object} callbackId
 * @return {undefined}
 */
ee.layers.AbstractOverlay.prototype.removeTileCallback = function(callbackId) {
};
/**
 * @param {!ee.layers.AbstractTileSource} tileSource
 * @param {(Object|null)=} opt_options
 * @extends {ee.layers.AbstractOverlay}
 * @implements {goog.disposable.IDisposable}
 * @implements {goog.events.Listenable}
 * @implements {google.maps.MapType}
 * @constructor
 */
ee.layers.BinaryOverlay = function(tileSource, opt_options) {
};
/**
 * @param {string} bucket
 * @param {string} path
 * @param {number} maxZoom
 * @param {string=} opt_suffix
 * @extends {ee.layers.AbstractTileSource}
 * @implements {goog.disposable.IDisposable}
 * @constructor
 */
ee.layers.CloudStorageTileSource = function(bucket, path, maxZoom, opt_suffix) {
};
/**
 * @param {!ee.data.RawMapId} mapId
 * @param {(ee.data.Profiler|null)=} opt_profiler
 * @extends {ee.layers.AbstractTileSource}
 * @implements {goog.disposable.IDisposable}
 * @constructor
 */
ee.layers.EarthEngineTileSource = function(mapId, opt_profiler) {
};
/**
 * @param {!ee.layers.AbstractTileSource} tileSource
 * @param {(Object|null)=} opt_options
 * @extends {ee.layers.AbstractOverlay}
 * @implements {goog.disposable.IDisposable}
 * @implements {goog.events.Listenable}
 * @implements {google.maps.MapType}
 * @constructor
 */
ee.layers.ImageOverlay = function(tileSource, opt_options) {
};
/**
 * @return {undefined}
 */
ee.reset = function() {
};
ee.rpc_convert_batch;
/**
 * @param {!Object} params
 * @return {{assetExportOptions: (null|{destination: (null|{name: (null|string)}), pyramidingPolicy: (null|string), pyramidingPolicyOverrides: (Object<string,string>|null)}), description: (null|string), expression: (null|{result: (null|string), values: (Object<string,{argumentReference: (null|string), arrayValue: (null|{values: (Array<?>|null)}), bytesValue: (null|string), constantValue: *, dictionaryValue: (null|{values: (Object<string,?>|null)}), functionDefinitionValue: (null|{argumentNames: (Array<string>|null), body: (null|string)}), functionInvocationValue: (null|{arguments: (Object<string,?>|null), functionName: (null|string), functionReference: (null|string)}), integerValue: (null|string), valueReference: (null|string)}>|null)}), fileExportOptions: (null|{cloudStorageDestination: (null|{bucket: (null|string), bucketCorsUris: (Array<string>|null), filenamePrefix: (null|string), permissions: (null|string)}), driveDestination: (null|{filenamePrefix: (null|string), folder: (null|string)}), fileFormat: (null|string), geoTiffOptions: (null|{cloudOptimized: (boolean|null), skipEmptyFiles: (boolean|null), tileDimensions: (null|{height: (null|number), width: (null|number)})}), tfRecordOptions: (null|{collapseBands: (boolean|null), compress: (boolean|null), defaultValue: (null|number), marginDimensions: (null|{height: (null|number), width: (null|number)}), maxMaskedRatio: (null|number), maxSizeBytes: (null|string), sequenceData: (boolean|null), tensorDepths: (Object<string,number>|null), tileDimensions: (null|{height: (null|number), width: (null|number)})})}), grid: (null|{affineTransform: (null|{scaleX: (null|number), scaleY: (null|number), shearX: (null|number), shearY: (null|number), translateX: (null|number), translateY: (null|number)}), crsCode: (null|string), crsWkt: (null|string), dimensions: (null|{height: (null|number), width: (null|number)})}), maxPixels: (null|string), requestId: (null|string)}}
 */
ee.rpc_convert_batch.taskToExportImageRequest = function(params) {
};
/**
 * @param {!Object} params
 * @return {{description: (null|string), expression: (null|{result: (null|string), values: (Object<string,{argumentReference: (null|string), arrayValue: (null|{values: (Array<?>|null)}), bytesValue: (null|string), constantValue: *, dictionaryValue: (null|{values: (Object<string,?>|null)}), functionDefinitionValue: (null|{argumentNames: (Array<string>|null), body: (null|string)}), functionInvocationValue: (null|{arguments: (Object<string,?>|null), functionName: (null|string), functionReference: (null|string)}), integerValue: (null|string), valueReference: (null|string)}>|null)}), requestId: (null|string), tileExportOptions: (null|{cloudStorageDestination: (null|{bucket: (null|string), bucketCorsUris: (Array<string>|null), filenamePrefix: (null|string), permissions: (null|string)}), driveDestination: (null|{filenamePrefix: (null|string), folder: (null|string)}), fileFormat: (null|string), geoTiffOptions: (null|{cloudOptimized: (boolean|null), skipEmptyFiles: (boolean|null), tileDimensions: (null|{height: (null|number), width: (null|number)})}), tfRecordOptions: (null|{collapseBands: (boolean|null), compress: (boolean|null), defaultValue: (null|number), marginDimensions: (null|{height: (null|number), width: (null|number)}), maxMaskedRatio: (null|number), maxSizeBytes: (null|string), sequenceData: (boolean|null), tensorDepths: (Object<string,number>|null), tileDimensions: (null|{height: (null|number), width: (null|number)})})}), tileOptions: (null|{mapsApiKey: (null|string), maxZoom: (null|number), minZoom: (null|number), scale: (null|number), skipEmptyTiles: (boolean|null), tileDimensions: (null|{height: (null|number), width: (null|number)})})}}
 */
ee.rpc_convert_batch.taskToExportMapRequest = function(params) {
};
/**
 * @param {!Object} params
 * @return {{assetExportOptions: (null|{destination: (null|{name: (null|string)})}), description: (null|string), expression: (null|{result: (null|string), values: (Object<string,{argumentReference: (null|string), arrayValue: (null|{values: (Array<?>|null)}), bytesValue: (null|string), constantValue: *, dictionaryValue: (null|{values: (Object<string,?>|null)}), functionDefinitionValue: (null|{argumentNames: (Array<string>|null), body: (null|string)}), functionInvocationValue: (null|{arguments: (Object<string,?>|null), functionName: (null|string), functionReference: (null|string)}), integerValue: (null|string), valueReference: (null|string)}>|null)}), fileExportOptions: (null|{cloudStorageDestination: (null|{bucket: (null|string), bucketCorsUris: (Array<string>|null), filenamePrefix: (null|string), permissions: (null|string)}), driveDestination: (null|{filenamePrefix: (null|string), folder: (null|string)}), fileFormat: (null|string)}), requestId: (null|string), selectors: (Array<string>|null)}}
 */
ee.rpc_convert_batch.taskToExportTableRequest = function(params) {
};
/**
 * @param {!Object} params
 * @return {{description: (null|string), expression: (null|{result: (null|string), values: (Object<string,{argumentReference: (null|string), arrayValue: (null|{values: (Array<?>|null)}), bytesValue: (null|string), constantValue: *, dictionaryValue: (null|{values: (Object<string,?>|null)}), functionDefinitionValue: (null|{argumentNames: (Array<string>|null), body: (null|string)}), functionInvocationValue: (null|{arguments: (Object<string,?>|null), functionName: (null|string), functionReference: (null|string)}), integerValue: (null|string), valueReference: (null|string)}>|null)}), requestId: (null|string), tileExportOptions: (null|{cloudStorageDestination: (null|{bucket: (null|string), bucketCorsUris: (Array<string>|null), filenamePrefix: (null|string), permissions: (null|string)}), driveDestination: (null|{filenamePrefix: (null|string), folder: (null|string)}), fileFormat: (null|string)}), tileOptions: (null|{mapsApiKey: (null|string), maxZoom: (null|number), minZoom: (null|number), scale: (null|number), skipEmptyTiles: (boolean|null), tileDimensions: (null|{height: (null|number), width: (null|number)})}), videoOptions: (null|{framesPerSecond: (null|number), maxFrames: (null|number), maxPixelsPerFrame: (null|string)})}}
 */
ee.rpc_convert_batch.taskToExportVideoMapRequest = function(params) {
};
/**
 * @param {!Object} params
 * @return {{description: (null|string), expression: (null|{result: (null|string), values: (Object<string,{argumentReference: (null|string), arrayValue: (null|{values: (Array<?>|null)}), bytesValue: (null|string), constantValue: *, dictionaryValue: (null|{values: (Object<string,?>|null)}), functionDefinitionValue: (null|{argumentNames: (Array<string>|null), body: (null|string)}), functionInvocationValue: (null|{arguments: (Object<string,?>|null), functionName: (null|string), functionReference: (null|string)}), integerValue: (null|string), valueReference: (null|string)}>|null)}), fileExportOptions: (null|{cloudStorageDestination: (null|{bucket: (null|string), bucketCorsUris: (Array<string>|null), filenamePrefix: (null|string), permissions: (null|string)}), driveDestination: (null|{filenamePrefix: (null|string), folder: (null|string)}), fileFormat: (null|string)}), requestId: (null|string), videoOptions: (null|{framesPerSecond: (null|number), maxFrames: (null|number), maxPixelsPerFrame: (null|string)})}}
 */
ee.rpc_convert_batch.taskToExportVideoRequest = function(params) {
};
