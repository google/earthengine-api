goog.provide('forest.ForestDetailPanel');


/**
 * <forest-detail-panel> is the destination detail panel element.
 */
forest.ForestDetailPanel = Polymer({
  is: 'forest-detail-panel',

  properties: {
    /** @type {forest.ForestPickerPanel.DestintationDetails} */
    curDestinationDetails: {
      type: Object,
      observer: 'showDetails_',
    },

    /** @private {boolean} */
    hasQuestion_: Boolean,
  },

  ready: function() { this.setLoadingMode_(false); },

  /**
   * Toggles whether the panel is in loading mode.
   * @param {boolean} enabled
   * @private
   */
  setLoadingMode_: function(enabled) {
    this.enableButtons_(!enabled);
    this.toggleClass('loading', enabled);
    this.$.contentSpinner.active = enabled;
  },

  /**
   * Shows content in the details panel when the destination changes.
   * @param {!Object} curDestinationDetails
   * @private
   */
  showDetails_: function(curDestinationDetails) {
    this.hasQuestion_ = 'correctChoice' in curDestinationDetails;
    this.setLoadingMode_(false);
  },

  /**
   * Enables the navigation buttons.
   * @param {boolean} enabled Whether to enable or disable the buttons.
   * @private
   */
  enableButtons_: function(enabled) {
    var buttons = Polymer.dom(this).querySelectorAll('paper-icon-button');
    buttons.forEach(function(button) {
      button.disabled = !enabled;
    });
  },

  /**
   * Notifies listeners when the left arrow is tapped.
   * @private
   */
  handleLeftTap_: function() { this.fire('left-tap'); },

  /**
   * Notifies listeners when the right arrow is tapped.
   * @private
   */
  handleRightTap_: function() { this.fire('right-tap'); },
});
