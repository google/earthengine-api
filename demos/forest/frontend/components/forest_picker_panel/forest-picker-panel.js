goog.provide('forest.ForestPickerPanel');


/**
 * <forest-picker-panel> is the destination picker panel element.
 */
forest.ForestPickerPanel = Polymer({
  is: 'forest-picker-panel',

  properties: {
    /** @type {forest.ForestPickerPanel.DestintationDetails} */
    curDestinationDetails: {
      type: Object,
      notify: true,
      computed: 'computeCurDestinationDetails_(' +
                    'curDestinationId_, destinationsDetailsById_)',
    },

    // Private.

    /** @type {Element} The currently selected destination element. */
    curDestinationEl_: Object,

    /** @private {forest.ForestPickerPanel.DestinationType_} */
    curDestinationType_: String,

    /** @private {!string} */
    curDestinationId_: {
      type: String,
      observer: 'handleCurDestinationIdChange_',
    },

    /** @private {forest.ForestPickerPanel.DestintationIndex} */
    visibleDestinations_: {
      type: Array,
      computed: 'computeVisibleDestinations_(' +
                    'curDestinationType_, destinationsIndex_)',
    },

    // Source data.

    /**
     * A mapping from destination types to destination lists.
     * @private {!Object<
     *     forest.ForestPickerPanel.DestinationType_,
     *     forest.ForestPickerPanel.DestintationIndex>}
     */
    destinationsIndex_: Object,

    /**
     * A mapping from destination IDs to details.
     * @private {!Object<string, forest.ForestPickerPanel.DestintationDetails>}
     */
    destinationsDetailsById_: Object,
  },

  behaviors: [
    Polymer.IronResizableBehavior
  ],

  /** @override */
  ready: function() {
    this.setLoadingMode_(true);
  },

  /** @override */
  attached: function() {
    this.autoScroll_(forest.ForestPickerPanel.ScrollDirection_.LEFT);
  },

  // Public interface.

  /** Selects the next destination from the list of destinations. */
  selectNextDestination: function() {
    var picker = this.$.destinationPicker;
    if (picker.indexOf(picker.selectedItem) < picker.items.length - 1) {
      // We're in the middle of a tab of destinations. Just select the next.
      picker.selectNext();
      this.autoScroll_(forest.ForestPickerPanel.ScrollDirection_.RIGHT);
    } else {
      // We're at the end of a tab of destinations.
      // Select the first destination in the next tab.
      this.$.destinationTabs.selectNext();
      // Defer selecting the next destionation until after the tab switch.
      setTimeout(goog.bind(function() {
        picker.select(this.visibleDestinations_[0].id);
        this.autoScroll_(forest.ForestPickerPanel.ScrollDirection_.LEFT);
      }, this));
    }
  },

  /** Selects the previous destination from the list of destinations. */
  selectPreviousDestination: function() {
    var picker = this.$.destinationPicker;
    if (picker.indexOf(picker.selectedItem) > 0) {
      // We're in the middle of a tab of destinations. Just select the previous.
      picker.selectPrevious();
      this.autoScroll_(forest.ForestPickerPanel.ScrollDirection_.LEFT);
    } else {
      // We're at the start of a tab of destinations.
      // Select the tab to the left, and then select the last (right-most)
      // destination from the list of newly-rendered destinations.
      this.$.destinationTabs.selectPrevious();
      // Defer selecting the next destionation until after the tab switch.
      setTimeout(goog.bind(function() {
        var last = this.visibleDestinations_.length - 1;
        picker.select(this.visibleDestinations_[last].id);
        this.autoScroll_(forest.ForestPickerPanel.ScrollDirection_.RIGHT);
      }, this));
    }
  },

  /**
   * Selects the destination with the given ID.
   * @param {string} destinationId The destination ID to select.
   */
  selectDestination: function(destinationId) {
    this.curDestinationType_ =
        /** @type {forest.ForestPickerPanel.DestinationType_} */ (
            destinationId.split('_')[0]);
    this.curDestinationId_ = destinationId;
    this.autoScroll_(forest.ForestPickerPanel.ScrollDirection_.LEFT);
  },

  // Implementation.

  /**
   * Sets the picker panel to loading mode.
   * @param {boolean} enabled
   * @private
   */
  setLoadingMode_: function(enabled) {
    this.toggleClass('loading', enabled);
    this.$.contentSpinner.active = enabled;
  },

  /**
   * Handles a repeat tap on a destination thumbnail box.
   * @param {Object} event
   * @private
   */
  handleRepeatTap_: function(event) {
    this.fire('repeat-tap');
  },

  /**
   * Scrolls the list of destinations left.
   * @param {!CustomEvent} event The event object.
   * @private
   */
  scrollLeft_: function(event) {
    this.scroll_(forest.ForestPickerPanel.ScrollDirection_.LEFT);
  },

  /**
   * Scrolls the list of destinations right.
   * @param {!CustomEvent} event The event object.
   * @private
   */
  scrollRight_: function(event) {
    this.scroll_(forest.ForestPickerPanel.ScrollDirection_.RIGHT);
  },

  /**
   * Scrolls destinations list slowly in response to a button press.
   * @param {forest.ForestPickerPanel.ScrollDirection_} direction The direction
   *     of the scrolling.
   * @private
   */
  scroll_: function(direction) {
    var container = this.$$('iron-selector');
    var button = this.$$('.scroll-button.' + direction);
    var callback;
    var interval;

    if (direction == forest.ForestPickerPanel.ScrollDirection_.LEFT) {
      callback = () => {
        container.scrollLeft = Math.max(0, container.scrollLeft - 5);
        if (container.scrollLeft == 0) {
          this.$.destinationTabs.selectPrevious();
          clearInterval(interval);
          setTimeout(goog.bind(function() {
            this.autoScroll_(forest.ForestPickerPanel.ScrollDirection_.RIGHT,
                             this.$.destinationPicker.items.length);
            interval = setInterval(callback, 20);
          }, this));
        } else if (!button.pressed) {
          clearInterval(interval);
        }
      };
    } else {
      callback = () => {
        var width = container.scrollWidth - container.offsetWidth;
        container.scrollLeft = Math.min(container.scrollLeft + 5, width);
        if (width <= container.scrollLeft) {
          this.$.destinationTabs.selectNext();
        } else if (!button.pressed) {
          clearInterval(interval);
        }
      };
    }

    interval = setInterval(callback, 20);
  },

  /**
   * Programmatically scrolls the destinations list so that the index is
   * visible, anchored to the specified side of the list.
   * @param {forest.ForestPickerPanel.ScrollDirection_} anchorDirection The
   *     direction to anchor the index if it needs to be scrolled into view.
   * @param {number=} opt_index The index to ensure is visible. Defaults to the
   *     index of the currently selected item.
   * @private
   */
  autoScroll_: function(anchorDirection, opt_index) {
    if (this.classList.contains('loading')) return;
    var picker = this.$.destinationPicker;
    var index = goog.isDef(opt_index) ?
        opt_index : picker.indexOf(picker.selectedItem);
    var thumbWidth = this.hasAttribute('narrow-viewport') ? 114 : 116;
    var maxLeftOffset = index * thumbWidth;
    if (anchorDirection == forest.ForestPickerPanel.ScrollDirection_.LEFT) {
      picker.scrollLeft = Math.min(maxLeftOffset, picker.scrollLeft);
    } else {
      var minLeftOffset = maxLeftOffset - picker.offsetWidth + thumbWidth;
      picker.scrollLeft = Math.max(minLeftOffset, picker.scrollLeft);
    }
  },

  /** @private Handles a change to the current destination ID. */
  handleCurDestinationIdChange_: function() {
    if (this.classList.contains('loading')) return;
    if (this.curDestinationEl_) {
      this.unlisten(this.curDestinationEl_, 'tap', 'handleRepeatTap_');
    }
    setTimeout(goog.bind(function() {
      var selectedEl = this.$.destinationPicker.selectedItem;
      this.curDestinationEl_ = /** @type {!Element} */ (selectedEl);
      this.listen(this.curDestinationEl_, 'tap', 'handleRepeatTap_');
    }, this));
  },

  /**
   * Computes the list of visible destinations.
   * @param {forest.ForestPickerPanel.DestinationType_} curDestinationType_
   * @param {!Object} destinationsIndex_
   * @return {!Array}
   * @private
   */
  computeVisibleDestinations_: function(
      curDestinationType_, destinationsIndex_) {
    return destinationsIndex_[curDestinationType_];
  },

  /**
   * Computes the current destination details.
   * @param {string} curDestinationId_
   * @param {!Object} destinationsDetailsById_
   * @return {!Object}
   * @private
   */
  computeCurDestinationDetails_: function(
      curDestinationId_, destinationsDetailsById_) {
    if (this.classList.contains('loading')) {
      this.setLoadingMode_(false);
      this.autoScroll_(forest.ForestPickerPanel.ScrollDirection_.LEFT);
    }
    return destinationsDetailsById_[curDestinationId_];
  }
});


/**
 * @private @enum {string} The destination types.
 */
forest.ForestPickerPanel.DestinationType_ = {
  COUNTRY: 'country',
  ECOREGION: 'ecoregion',
  HOTSPOT: 'hotspot'
};


/**
 * @private @enum {string} The scrolling directions.
 */
forest.ForestPickerPanel.ScrollDirection_ = {
  RIGHT: 'right',
  LEFT: 'left'
};


/**
 * Details about a destination.
 * Only hotspots have a correctChoice and explanation.
 * @typedef {{
 *   id: string,
 *   type: forest.ForestPickerPanel.DestinationType_,
 *   title: string,
 *   geoQuery: {select: string, from: string, where: string},
 *   boundingBox: {sw: !Array<number>, ne: !Array<number>},
 *   loss: !Object,
 *   correctChoice: (string|undefined),
 *   explanation: (string|undefined)
 * }}
 */
forest.ForestPickerPanel.DestintationDetails;


/**
 * An index of destinations.
 * @typedef {!Array<{
 *   id: string,
 *   type: forest.ForestPickerPanel.DestinationType_,
 *   title: string,
 * }>}
 */
forest.ForestPickerPanel.DestintationIndex;
