goog.provide('forest.ForestControls');


/**
 * <forest-controls> is the controls widgets element.
 */
forest.ForestControls = Polymer({
  is: 'forest-controls',

  /**
   * Fires an event to notify listeners that the layers button was tapped.
   * @private
   */
  handleLayersTap_: function() {
    this.fire('layers-tap');
  },

  /**
   * Fires an event to notify listeners that the search button was tapped.
   * @private
   */
  handleSearchTap_: function() {
    this.fire('search-tap');
  },
});
