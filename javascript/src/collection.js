//Copyright 2012 Google Inc. All Rights Reserved.

/**
 * @fileoverview Base class for ImageCollection and FeatureCollection.
 * This class is never intended to be instantiated by the user.
 *
 */
goog.provide('ee.Collection');

goog.require('ee.Filter');
goog.require('ee.Serializer');
goog.require('ee.data');

/**
 * @param {Object} args - A representation of the collection.
 * @constructor
 *
 * TODO(user): Add some runtime type checking.
 */
ee.Collection = function(args) {
  /**
   * The internal representation of this collection.
   * @type {Object}
   * @private
   */
  this.description_ = args;
};


/**
 * Add a new filter to this collection.
 *
 * Collection filtering is done by wrapping a collection in a filter
 * algorithm.  As additional filters are applied to a collection, we
 * try to avoid adding more wrappers and instead search for a wrapper
 * we can add to, however if the collection doesn't have a filter, this
 * will wrap it in one.
 *
 * @param {ee.Filter} newFilter - A filter to add to this collection.
 * @return {ee.Collection} The filtered collection.
 */
ee.Collection.prototype.filter = function(newFilter) {
  if (!newFilter) {
    throw new Error('Empty filters.');
  }

  var description;
  // Check if this collection already has a filter.
  if (ee.Collection.isFilterFeatureCollection_(this)) {
    description = this.description_['collection'];
    newFilter = this.description_['filters'].append_(newFilter);
  } else {
    description = this.description_;
  }

  // This assumes all collection subclasses can be constructed from JSON.
  return new this.constructor({
    'algorithm': 'FilterFeatureCollection',
    'collection': description,
    'filters': newFilter
  });
};

/**
 * Returns true iff the collection is wrapped with a filter.
 *
 * @param {ee.Collection} collection - The collection to check.
 * @return {boolean} True if the collection is wrapped with a filter.
 * @private
 */
ee.Collection.isFilterFeatureCollection_ = function(collection) {
  return (collection.description_['algorithm'] == 'FilterFeatureCollection');
};

/**
 * Shortcuts to filter a collection by metadata.  This is equivalent
 * to this.filter(new ee.Filter().metadata(...)).
 *
 * @param {string} name - name of a property to filter.
 * @param {string} operator - Name of a comparison operator as defined
 *     by FilterCollection.  Possible values are: "equals", "less_than",
 *     "greater_than", "not_equals", "not_less_than", "not_greater_than",
 *     "starts_with", "ends_with", "not_starts_with", "not_ends_with",
 *     "contains", "not_contains".
 *
 * @param {*} value - The value to compare against.
 * @return {ee.Collection} The filtered collection.
 */
ee.Collection.prototype.filterMetadata = function(name, operator, value) {
  return this.filter(ee.Filter.metadata_(name, operator, value));
};

/**
 * Shortcut to filter a collection by geometry.  Items in the
 * collection with a footprint that fails to intersect the bounds
 * will be excluded when the collection is evaluated.
 *
 * This is equivalent to this.filter(new ee.Filter().bounds(...)).
 * @param {ee.Feature|ee.Geometry} geometry - The geometry to filter to.
 * @return {ee.Collection} The filtered collection.
 */
ee.Collection.prototype.filterBounds = function(geometry) {
  return this.filter(ee.Filter.bounds(geometry));
};

/**
 * Shortcut to filter a collection by a date range.  Items in the
 * collection with a time_start property that doesn't fall between the
 * start and end dates will be excluded.
 *
 * This is equivalent to this.filter(new ee.Filter().date(...)).
 *
 * @param {Date|string|number} start - The start date as a Date object,
 *     a string representation of a date, or milliseconds since epoch.
 * @param {Date|string|number} end - The end date as a Date object,
 *     a string representation of a date, or milliseconds since epoch.
 * @return {ee.Collection} The filtered collection.
 */
ee.Collection.prototype.filterDate = function(start, end) {
  return this.filter(ee.Filter.date(start, end));
};

/**
 * An imperative function that returns all the known information about this
 * collection via a synchronous AJAX call.
 *
 * @param {function(Object)=} opt_callback An optional callback.  If not
 *     supplied, the call is made synchronously.
 *
 * @return {Object} The return contents vary but will include at least:
 *     features - an array containing metadata about the items in the
 *                collection that passed all filters.
 *     properties - a dictionary containing the collection's metadata
 *                  properties.
 */
ee.Collection.prototype.getInfo = function(opt_callback) {
  return ee.data.getValue(
      {'json': this.serialize()},
      opt_callback);
};

/**
 * JSON serializer.
 *
 * @return {string} The serialized representation of this object.
 */
ee.Collection.prototype.serialize = function() {
  // Pop off any unused filter wrappers that might have been added by filter.
  //
  // We copy the object here, otherwise we might accidentally knock off a
  // filter in progress.
  var item = this;
  while (ee.Collection.isFilterFeatureCollection_(item) &&
         item.description_['filters'].length() == 0) {
    item = item.description_['collection'];
  }
  return ee.Serializer.toJSON(item.description_);
};

/**
 * Limit a collection to the specified number of elements, optionally
 * sorting them by a specified property first.
 *
 * @param {number} max - The number to limit the collection to.
 * @param {string=} opt_property - The property to sort by, if sorting.
 * @param {boolean=} opt_ascending - Whether to sort in ascending or
 *     descending order.  The default is true (ascending).
 * @return {ee.Collection} The limited collection.
 */
ee.Collection.prototype.limit = function(max, opt_property, opt_ascending) {
  var args = {
    'algorithm': 'LimitFeatureCollection',
    'collection': this,
    'limit': max
  };
  if (opt_property) {
    args['key'] = opt_property;
    if (opt_ascending) {
      args['ascending'] = opt_ascending;
    }
  }
  return new this.constructor(args);
};

/**
 * Sort a collection by the specified property.
 *
 * @param {string} property - The property to sort by.
 * @param {boolean=} opt_ascending - Whether to sort in ascending or descending
 *     order.  The default is true (ascending).
 * @return {ee.Collection} The sorted collection.
 */
ee.Collection.prototype.sort = function(property, opt_ascending) {
  var args = {
    'algorithm': 'LimitFeatureCollection',
    'collection': this,
    'key': property
  };
  if (opt_ascending) {
    args['ascending'] = opt_ascending;
  }
  return new this.constructor(args);
};

/**
 * Run an algorithm to extract the geometry from this collection.
 *
 * @return {Object} A JSON object representing the algorithm call.
 * TODO(user): Maybe this becomes a Feature?
 */
ee.Collection.prototype.geometry = function() {
  return {
    'algorithm': 'ExtractGeometry',
    'collection': this
  };
};

goog.exportSymbol('ee.Collection', ee.Collection);
goog.exportProperty(ee.Collection.prototype, 'filter',
                    ee.Collection.prototype.filter);
goog.exportProperty(ee.Collection.prototype, 'filterMetadata',
                    ee.Collection.prototype.filterMetadata);
goog.exportProperty(ee.Collection.prototype, 'filterBounds',
                    ee.Collection.prototype.filterBounds);
goog.exportProperty(ee.Collection.prototype, 'filterDate',
                    ee.Collection.prototype.filterDate);
goog.exportProperty(ee.Collection.prototype, 'getInfo',
                    ee.Collection.prototype.getInfo);
goog.exportProperty(ee.Collection.prototype, 'serialize',
                    ee.Collection.prototype.serialize);
goog.exportProperty(ee.Collection.prototype, 'limit',
                    ee.Collection.prototype.limit);
goog.exportProperty(ee.Collection.prototype, 'sort',
                    ee.Collection.prototype.sort);

// Exported for testing.
goog.exportProperty(ee.Collection, 'isFilterFeatureCollection_',
                    ee.Collection.isFilterFeatureCollection_);
