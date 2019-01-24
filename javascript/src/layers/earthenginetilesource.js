goog.provide('ee.layers.EarthEngineTileSource');
goog.require('ee.data');
goog.require('ee.layers.AbstractTile');
goog.require('ee.layers.AbstractTileSource');
goog.require('goog.events');
goog.require('goog.structs.PriorityPool');



/**
 * A layer tile source for tiles served by Earth Engine.
 *
 * @param {!ee.data.RawMapId} mapId The EE map ID for fetching this layer's
 *     tiles.
 * @param {ee.data.Profiler=} opt_profiler The profiler to send map tile
 *     calculation cost to, if any.
 * @constructor
 * @extends {ee.layers.AbstractTileSource}
 * @export
 * @ignore
 */
ee.layers.EarthEngineTileSource = function(mapId, opt_profiler) {
  ee.layers.EarthEngineTileSource.base(this, 'constructor');

  /** @const @private {!ee.data.RawMapId} The EE map ID for fetching tiles. */
  this.mapId_ = mapId;

  /**
   * Map tile calculation cost will be sent to this profiler, if its enabled
   * flag is set.
   * @private {?ee.data.Profiler}
   */
  this.profiler_ = opt_profiler || null;
};
goog.inherits(ee.layers.EarthEngineTileSource, ee.layers.AbstractTileSource);


// Public interface.


/** @override */
ee.layers.EarthEngineTileSource.prototype.loadTile = function(
    tile, opt_priority) {
  // Enable profiling.
  var ProfilerHeader = ee.data.PROFILE_HEADER.toLowerCase();
  var key = goog.events.listen(
      tile, ee.layers.AbstractTile.EventType.STATUS_CHANGED, function() {
        switch (tile.getStatus()) {
          case ee.layers.AbstractTile.Status.LOADED:
            var profileId = tile.sourceResponseHeaders[ProfilerHeader];
            if (this.profiler_ && profileId) {
              this.profiler_.addTile(tile.div.id, profileId);
            }
            break;
          case ee.layers.AbstractTile.Status.FAILED:
          case ee.layers.AbstractTile.Status.ABORTED:
            if (this.profiler_) {
              if (tile.div.id !== '') {  // Out-of-bounds tiles have no ID.
                this.profiler_.removeTile(tile.div.id);
              }
            }
            goog.events.unlistenByKey(key);
            break;
          default:
        }
      }, undefined, this);

  // Configure the tile.
  tile.sourceUrl = this.getTileUrl_(tile.coord, tile.zoom);

  // When a request token is available, load the tile.
  var handleAvailableToken = goog.bind(this.handleAvailableToken_, this, tile);
  var tokenPool = ee.layers.EarthEngineTileSource.getGlobalTokenPool_();
  tokenPool.getObject(handleAvailableToken, opt_priority);
};


/** @override */
ee.layers.EarthEngineTileSource.prototype.getUniqueId = function() {
  return this.mapId_.mapid + '-' + this.mapId_.token;
};


// Internals.


/**
 * Handles a request pool token being available by starting the tile load.
 * @param {ee.layers.AbstractTile} tile The tile to load.
 * @param {!Object} token The EE tile token pool object for this load.
 * @private
 */
ee.layers.EarthEngineTileSource.prototype.handleAvailableToken_ =
    function(tile, token) {
  var tokenPool = ee.layers.EarthEngineTileSource.getGlobalTokenPool_();

  // Exit early if the tile was aborted (e.g. because the layer was hidden or
  // this tile was panned out of view).
  if (tile.isDisposed() ||
      tile.getStatus() == ee.layers.AbstractTile.Status.ABORTED) {
    tokenPool.releaseObject(token);
    return;
  }

  var key = goog.events.listen(
      tile, ee.layers.AbstractTile.EventType.STATUS_CHANGED, function() {
        if (tile.isDone()) {
          goog.events.unlistenByKey(key);
          tokenPool.releaseObject(token);
        }
      });

  tile.startLoad();
};


/**
 * Returns the EE source URL for the tile at the provided location.
 * @param {!google.maps.Point} coord The position of the tile.
 * @param {number} zoom The zoom level of the tile.
 * @return {string} The tile URL.
 * @private
 */
ee.layers.EarthEngineTileSource.prototype.getTileUrl_ = function(coord, zoom) {
  const url = ee.data.getTileUrl(this.mapId_, coord.x, coord.y, zoom);
  if (this.profiler_ && this.profiler_.isEnabled()) {
    return url + '&profiling=1';
  }
  return url;
};


// Global EE tile request token pool.


/**
 * @return {!goog.structs.PriorityPool} The global EE tile request token pool.
 * @private
 */
ee.layers.EarthEngineTileSource.getGlobalTokenPool_ = function() {
  if (!ee.layers.EarthEngineTileSource.TOKEN_POOL_) {
    ee.layers.EarthEngineTileSource.TOKEN_POOL_ =
        new goog.structs.PriorityPool(
            0, ee.layers.EarthEngineTileSource.TOKEN_COUNT_);
  }
  return ee.layers.EarthEngineTileSource.TOKEN_POOL_;
};


/** @private {?goog.structs.PriorityPool} The global EE tile token pool. */
ee.layers.EarthEngineTileSource.TOKEN_POOL_ = null;


/** @private {number} The global max count of outstanding EE tile requests. */
ee.layers.EarthEngineTileSource.TOKEN_COUNT_ = 4;
