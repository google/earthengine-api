goog.provide('forest.behaviors.PocketDrawer');

goog.require('goog.events');
goog.require('goog.events.EventType');


/**
 * Pocket drawer panel behavior for the small drawers controlled by the
 * left icon control panel.
 * @polymerBehavior
 */
forest.behaviors.PocketDrawerImpl = {
  listeners: {
    'neon-animation-finish': 'handleNeonAnimationFinish_'
  },

  properties: {
    /** @type {boolean} Whether the panel is open. */
    isOpen: {
      type: Boolean,
      boolean: false,
    },

    /** @type {!Object} The entry & exit animations. */
    animationConfig: {
      /** @this {!forest.ForestLayerPanel} */
      value: function() {
        return {
          'entry': {
            name: 'slide-from-left-animation',
            node: this,
          },
          'exit': {
            name: 'slide-left-animation',
            node: this,
          }
        }
      }
    },
  },

  /** @private Hides the panel once the close animation finishes. */
  handleNeonAnimationFinish_: function() {
    if (!this.isOpen) {
      this.style.display = 'none';
    }
  },

  /** Opens the panel. */
  open: function() {
    this.isOpen = true;
    this.style.display = 'inline-block';
    this.playAnimation('entry');
    this.finishOpen();
    // Run this on the next event loop to avoid a mobile bug in which the panel
    // is immediately closed.
    setTimeout(() => this.setGlobalClickHandler_(true));
  },

  /** Closes the panel. */
  close: function() {
    this.isOpen = false;
    this.playAnimation('exit');
    this.finishClose();
    this.setGlobalClickHandler_(false);
  },

  /** Hook for children to customize open behavior. */
  finishOpen: function() {
    // Optional abstract method.
  },

  /** Hook for children to customize close behavior. */
  finishClose: function() {
    // Optional abstract method.
  },

  /**
   * Sets a global click handler which closes the drawer if the user
   * clicks outside it.
   * @param {boolean} enabled Whether to enable the click handler.
   * @private
   */
  setGlobalClickHandler_: function(enabled) {
    var html = window.document.getElementsByTagName('html')[0];
    var element = this;
    var mousedown = goog.events.EventType.MOUSEDOWN;
    var stopPropagation = function(event) {
      event.stopPropagation();
    };
    if (enabled) {
      goog.events.listen(html, mousedown, this.close, false, this);
      goog.events.listen(element, mousedown, stopPropagation);
    } else {
      goog.events.unlisten(html, mousedown, this.close, false, this);
      goog.events.unlisten(element, mousedown, stopPropagation);
    }
  },
};


/**
 * @polymerBehavior
 */
forest.behaviors.PocketDrawer = [
  Polymer.NeonAnimationRunnerBehavior,
  forest.behaviors.PocketDrawerImpl,
];
