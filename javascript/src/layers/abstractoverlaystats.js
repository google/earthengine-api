goog.module('ee.layers.AbstractOverlayStats');
goog.module.declareLegacyNamespace();

/**
 * A class for tracking per-overlay statistics about individual tile loads. Used
 * for performance monitoring.
 */
const AbstractOverlayStats = class {
  /**
   * @param{string} uniqueId An id unique to this map overlay.
   */
  constructor(uniqueId) {
    /**
     * @private @const
     * {!Map<number, AbstractOverlayStats.LayerStatsForZoomLevel>}
     * Statistics for tiles at each zoom level.
     */
    this.statsByZoom_ = new Map();
    this.uniqueId_ = uniqueId;
  }

  /**
   * Add latency stats for a tile at a given zoom.
   */
  addTileStats(start, end, zoom) {
    this.getStatsForZoom_(zoom).tileLatencies.push(end - start);
  }

  /**
   * Increase the throttle count for tiles of a given zoom level.
   */
  incrementThrottleCounter(zoom){
    this.getStatsForZoom_(zoom).throttleCount++;
  }

  /**
   * Increase the error count for tiles of a given zoom level.
   */
  incrementErrorCounter(zoom){
    this.getStatsForZoom_(zoom).errorCount++;
  }

  /**
   * Clear all data.
   */
  clear(){
    this.statsByZoom_.clear();
  }

  /**
   * Returns true if there is any fresh data for the overlay.
   * @return {boolean} whether or not there are any current stats.
   */
  hasData() {
    return this.statsByZoom_.size > 0;
  }

  /**
   * Returns a list for stats for this overlay. Each entry in the list contains
   * tile data for tiles of the same zoom level.
   * @return {!Array<AbstractOverlayStats.Summary>} current stats
   */
  getSummaryList() {
    let summaryList = [];
    this.statsByZoom_.forEach((stats, zoom) => summaryList.push({
      layerId: this.uniqueId_,
      zoomLevel: zoom,
      tileLatencies: stats.tileLatencies,
      throttleCount: stats.throttleCount,
      errorCount: stats.errorCount,
    }));
    return summaryList;
  }

  /**
   * Layer stats for tiles at a given zoom.
   * @param {number} zoom The zoom level.
   * @return {AbstractOverlayStats.LayerStatsForZoomLevel}
   * @private
   */
  getStatsForZoom_(zoom) {
    if (!this.statsByZoom_.has(zoom)){
      this.statsByZoom_.set(zoom, {
        throttleCount: 0,
        errorCount: 0,
        tileLatencies: [],
      });
    }
    return this.statsByZoom_.get(zoom);
  }
};

/**
 * An object for determining the configuration of map control visibility.
 * @record @struct
 */
AbstractOverlayStats.LayerStatsForZoomLevel = class {
  constructor() {
    /** @export {number} */
    this.throttleCount;

    /** @export {number} */
    this.errorCount;

    /** @export {!Array<number>} */
    this.tileLatencies;
  }
};

/**
 * Data structure containing statistics for an AbstractOverlay
 * @record @struct
 */
AbstractOverlayStats.Summary = class {
  constructor() {

    /** @export {string} */
    this.layerId;
    /** @export {number} */
    this.zoomLevel;
    /** @export {number} */
    this.throttleCount;
    /** @export {number} */
    this.errorCount;
    /** @export {!Array<number>} */
    this.tileLatencies;
  }
};

exports = AbstractOverlayStats;
