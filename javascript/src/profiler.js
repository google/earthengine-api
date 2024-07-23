goog.provide('ee.data.Profiler');

goog.require('ee.ApiFunction');
goog.require('goog.Timer');
goog.require('goog.async.Delay');
goog.require('goog.events.Event');
goog.require('goog.events.EventTarget');
goog.require('goog.object');


// TODO(user): The part about fetching the combined profile is potentially
// separate from the part about collecting profile IDs. The former can be moved
// to the UI code, which would make more overall complexity but simplify the
// client library.
/**
 * Helper for interactive computation profiling: captures multiple profile IDs
 * and fetches the combined profile. Also maintains a boolean value to control
 * whether profiling is enabled.
 * @template T
 * @ignore
 * @unrestricted
 */
ee.data.Profiler = class extends goog.events.EventTarget {
  /**
   * @param {!ee.data.Profiler.Format<T>} format The format of the data to be
   *     returned by getProfileData.
   */
  constructor(format) {
    super();

    /**
     * The data format to be returned by getProfileData.
     * @private {!ee.data.Profiler.Format<T>}
     */
    this.format_ = format;

    /**
     * Whether to request profile data.
     *
     * This flag does not affect the behavior of the Profiler in collecting
     * profile data; it only controls whether getProfileHook() returns a hook,
     * and is used by other code (via isEnabled()) to to decide whether to
     * enable profiling.
     * @private {boolean}
     */
    this.isEnabled_ = false;

    /**
     * Non-null unique object if and only if we have a refresh request
     * outstanding.
     * @private {?Object}
     */
    this.lastRefreshToken_ = null;

    /**
     * All profile IDs contributing to the current combined profile. Keys are
     * IDs, values are reference counts for tile profiles or Infinity for other
     * profiles (which are never removed).
     * @private {!Object<number>}
     */
    this.profileIds_ = Object.create(null);

    /**
     * Maps map tile IDs (as defined by ee.MapLayerOverlay} to profile IDs, so
     * so that map tiles which are no longer in view can be removed from the
     * combined profile.
     * @private {!Object<string>}
     */
    this.tileProfileIds_ = Object.create(null);

    /**
     * Whether to show implementation details in the retrieved profiles.
     * This option requires additional privileges and will cause errors if set
     * to true by a normal user.
     * @private {boolean}
     */
    this.showInternal_ = false;

    /**
     * @private {?string}
     */
    this.profileError_ = null;

    /**
     * Helper to ensure we don't make too many profile requests.
     * See DELAY_BEFORE_REFRESH_ for rationale.
     * @private {!goog.async.Delay}
     */
    this.throttledRefresh_ = new goog.async.Delay(
        goog.bind(this.refresh_, this), ee.data.Profiler.DELAY_BEFORE_REFRESH_);

    /**
     * The combined profile data, to be displayed in the UI.
     * @private {T}
     */
    this.profileData_ = ee.data.Profiler.getEmptyProfile_(format);
    // Note: the above initialization also causes the value of format to be
    // validated.

    /**
     * Maximum retry count when performing a profile refresh.
     * @private @const {number}
     */
    this.MAX_RETRY_COUNT_ = 5;
  }

  /**
   * Whether profiling is currently enabled.
   * @return {boolean}
   */
  isEnabled() {
    return this.isEnabled_;
  }

  /**
   * Enable or disable profiling.
   *
   * Note that this has no effect on state other than isEnabled(); in
   * particular, it does not clear existing profile IDs.
   * @param {boolean} value
   */
  setEnabled(value) {
    this.isEnabled_ = Boolean(value);
    this.dispatchEvent(
        new goog.events.Event(ee.data.Profiler.EventType.STATE_CHANGED));
  }

  /**
   * Returns whether new profile data is in the process of being loaded.
   * @return {boolean}
   */
  isLoading() {
    return this.lastRefreshToken_ !== null;
  }

  /**
   * Returns whether the most recent load failed.
   * @return {boolean}
   */
  isError() {
    return this.profileError_ != null;
  }

  /**
   * Returns a description of the state of the available profile data.
   * @return {string}
   */
  getStatusText() {
    if (this.profileError_) {
      return this.profileError_;
    } else if (this.lastRefreshToken_) {
      return 'Loading...';
    } else {
      let profiles = 0;
      let nonTileProfiles = 0;
      let tileProfiles = 0;
      goog.object.forEach(this.profileIds_, function(refCount) {
        profiles++;
        if (refCount === Infinity) {
          nonTileProfiles++;
        } else {
          tileProfiles++;
        }
      }, this);
      return 'Viewing ' + profiles + ' profiles, ' + nonTileProfiles +
          ' from API calls and ' + tileProfiles + ' from map tiles.';
    }
  }

  /**
   * Returns the profile data in the format specified in the constructor.
   * @return {T}
   */
  getProfileData() {
    return this.profileData_;
  }

  /**
   * Clears all current profile data, and ignores any more from requests
   * started before now.
   */
  clearAndDrop() {
    this.profileIds_ = Object.create(null);
    this.tileProfileIds_ = Object.create(null);
    this.refresh_();
  }

  /**
   * Returns a value suitable as the argument to ee.data.withProfiling (i.e. a
   * function or null, depending on enabled state).
   * @return {?function(string):undefined}
   */
  getProfileHook() {
    // Capture the current profileIds table so that if we get clearAndDrop()
    // then the data from here is effectively discarded.
    const profileIds = this.profileIds_;

    if (this.isEnabled_) {
      return goog.bind(function(profileId) {
        // This profile is never removed, so it gets a reference count of
        // Infinity. 1 would be equally good, but this allows us to distinguish
        // which kind of profile it is later.
        profileIds[profileId] = Infinity;
        this.throttledRefresh_.start();
      }, this);
    } else {
      return null;
    }
  }

  /**
   * Decrement reference count for the given profile ID and update the combined
   * profile if it should change.
   *
   * @param {string} profileId
   * @private
   */
  removeProfile_(profileId) {
    const count = this.profileIds_[profileId];
    if (count > 1) {
      // Reference count will be decremented but not to zero.
      this.profileIds_[profileId]--;
    } else if (count !== undefined) {
      // Reference count would be decremented to zero (or is bogus).
      delete this.profileIds_[profileId];
      this.throttledRefresh_.start();
    }
  }

  /**
   * Fetches a new combined profile asynchronously and fires events when done.
   * @param {number=} retryAttempt current refresh attempt, if retryAttempt is
   * less than MAX_RETRY_COUNT_ the profile refresh is retried.
   * @private
   */
  refresh_(retryAttempt = 0) {
    // Create a unique object identity for this request.
    const marker = {};
    this.lastRefreshToken_ = marker;
    /**
     * @param{?Object|undefined} result Object obtained from getProfiles.
     * @param{string=} error Error message returned on failure.
     */
    const handleResponse = (result, error) => {
      if (marker != this.lastRefreshToken_) return;  // Superseded.
      if (error && typeof retryAttempt === 'number' &&
          retryAttempt < this.MAX_RETRY_COUNT_) {
        goog.Timer.callOnce(
            goog.bind(this.refresh_, this, retryAttempt + 1),
            2 * ee.data.Profiler.DELAY_BEFORE_REFRESH_);
        return;
      }
      this.profileError_ = error || null;
      this.profileData_ =
          error ? ee.data.Profiler.getEmptyProfile_(this.format_) : result;
      this.lastRefreshToken_ = null;
      this.dispatchEvent(ee.data.Profiler.EventType.STATE_CHANGED);
      this.dispatchEvent(ee.data.Profiler.EventType.DATA_CHANGED);
    };

    const ids = goog.object.getKeys(this.profileIds_);
    if (ids.length === 0) {
      // Shortcut: no input, so no output.
      handleResponse(
          ee.data.Profiler.getEmptyProfile_(this.format_), undefined);
    } else {
      const getProfilesFn = this.showInternal_ ? 'Profile.getProfilesInternal' :
                                               'Profile.getProfiles';
      const profileValue = ee.ApiFunction._apply(getProfilesFn, {
        'ids': ids,
        'format': this.format_.toString(),
      });
      profileValue.getInfo(handleResponse);
      this.dispatchEvent(ee.data.Profiler.EventType.STATE_CHANGED);
    }
  }

  /**
   * Adds the profile for a map tile. The tileId will be remembered to allow
   * removal based on the tileId rather than the profileId.
   *
   * Multiple tile IDs with the same profile ID may be used and they will count
   * once until all are removed. (This occurs when the map is zoomed out to show
   * more than 360° of longitude.) Multiple identical tile IDs are not expected
   * and will be ignored.
   *
   * Interface for map layers. Not for general use.
   * @param {string} tileId
   * @param {string} profileId
   */
  addTile(tileId, profileId) {
    if (this.tileProfileIds_[tileId]) {
      // (Shouldn't happen, but we don't want to throw and break the map.)
      return;
    }
    this.tileProfileIds_[tileId] = profileId;
    this.profileIds_[profileId] = (this.profileIds_[profileId] || 0) + 1;
    this.throttledRefresh_.start();
  }

  /**
   * Removes the profile for a map tile, identified by tileId.
   *
   * Interface for map layers. Not for general use.
   * @param {string} tileId
   */
  removeTile(tileId) {
    const profileId = this.tileProfileIds_[tileId];
    if (!profileId) {
      // This can occur when profiling was not enabled before (or if a tileId is
      // duplicated, which should not occur).
      return;
    }
    delete this.tileProfileIds_[tileId];
    this.removeProfile_(profileId);
  }

  /**
   * Returns whether implementation details are shown in the retrieved profiles.
   * @return {boolean}
   */
  getShowInternal() {
    return this.showInternal_;
  }

  /**
   * Sets whether to show implementation details in the retrieved profiles.
   * This option requires additional privileges and will cause errors if set
   * to true by a normal user.
   * @param {boolean} value
   */
  setShowInternal(value) {
    this.showInternal_ = Boolean(value);
    this.throttledRefresh_.fire();
  }

  /**
   * This class does not allow setting a parent event target.
   * @override
   */
  setParentEventTarget(parent) {
    throw new Error('not applicable');
  }

  /**
   * @param {!ee.data.Profiler.Format<T>} format A profile data format.
   * @return {T} Empty value of the specified format.
   * @private
   * @template T
   */
  static getEmptyProfile_(format) {
    switch (format) {
      case ee.data.Profiler.Format.TEXT:
        return '';
      case ee.data.Profiler.Format.JSON:
        return ee.data.Profiler.EMPTY_JSON_PROFILE_;
      default:
        throw new Error('Invalid Profiler data format: ' + format);
    }
  }
};



/**
 * Time delay in milliseconds between receiving a new profile ID and actually
 * fetching data from the server. This delay is used to coalesce multiple
 * updates (as from many map tiles loading quickly), both to limit server load
 * and to not waste effort updating the UI faster than users can read the
 * results.
 * @private @const {number}
 */
ee.data.Profiler.DELAY_BEFORE_REFRESH_ = 500;



/**
 * @private {!google.visualization.DataObject}
 */
ee.data.Profiler.EMPTY_JSON_PROFILE_ = {
  cols: [],
  rows: []
};


/** @enum {string} Event types. */
ee.data.Profiler.EventType = {
  STATE_CHANGED: 'statechanged',
  DATA_CHANGED: 'datachanged'
};


/**
 * A profile data format.
 * The formats must be in sync with the format parameter of the
 * Profile.getProfiles algorithm.
 * @template T
 */
ee.data.Profiler.Format = class {
  /**
   * @param {string} format
   */
  constructor(format) {
    /**
     * @const @private {string}
     */
    this.format_ = format;
  }

  /**
   * @override
   */
  toString() {
    return this.format_;
  }
};

/**
 * @const {!ee.data.Profiler.Format<string>}
 */
ee.data.Profiler.Format.TEXT = new ee.data.Profiler.Format('text');

/**
 * @const {!ee.data.Profiler.Format<!google.visualization.DataObject>}
 */
ee.data.Profiler.Format.JSON = new ee.data.Profiler.Format('json');
