goog.provide('forest.ForestApp');



/**
 * <forest-app> is the main element for the Global Forest Change in
 * the Classroom application.
 */
forest.ForestApp = Polymer({
  is: 'forest-app',

  properties: {
    /** @type {!forest.ForestPickerPanel.DestintationDetails} */
    curDestinationDetails: {
      type: Object,
      notify: true,
      observer: 'updateRoute_'
    },

    /** @private {Object} The route URL component for the app. */
    route_: {
      type: Object,
      value: function() { return {}; }
    },

    /** @private {boolean} Whether the bottom drawer is expanded (on mobile). */
    expanded_: {
      type: Boolean,
      value: false
    }
  },

  /** @override */
  attached: function() {
    forest.ForestApp.initializeAnalytics_();
    // Set the default location if none is set.
    if (!this.route_ || !this.route_.path) {
      this.set('route_.path', forest.ForestApp.DEFAULT_ROUTE_PATH_);
    }
    this.applyRoute_();
  },

  /** @private Toggles the mobile drawer. */
  toggleMobileDrawer_: function() {
    this.expanded_ = !this.expanded_;
  },

  /** @private Selects the previous destination. */
  selectPreviousDestination_: function() {
    var pickerPanel = /** @type {forest.ForestPickerPanel} **/ (
        this.$$('forest-picker-panel'));
    pickerPanel.selectPreviousDestination();
  },

  /** @private Selects the next destination. */
  selectNextDestination_: function() {
    var pickerPanel = /** @type {forest.ForestPickerPanel} **/ (
        this.$$('forest-picker-panel'));
    pickerPanel.selectNextDestination();
  },

  /** @private Applies the route specified in the URL (#prettyType/prettyId). */
  applyRoute_: function() {
    this.$.pickerPanel.selectDestination(this.route_.path.replace('/', '_'));
  },

  /** @private Updates the route based on the current destination. */
  updateRoute_: function() {
    this.set('route_.path', this.curDestinationDetails.id.replace('_', '/'));
  }
});


/** @private @const {string} The default app route. */
forest.ForestApp.DEFAULT_ROUTE_PATH_ = 'country/united-states-of-america';


/** @private @const {string} The Global variable for the Analytics tracker. */
forest.ForestApp.ANALYTICS_TRACKER_NAME_ = 'ga';


/** @private @const {string} The Analytics property ID. */
forest.ForestApp.TRACKER_ID_ = 'UA-17137634-9';


/** @private Initializes analytics. Copied from GA; edited to please linter. */
forest.ForestApp.initializeAnalytics_ = function() {
  if (window[forest.ForestApp.ANALYTICS_TRACKER_NAME_]) {
    return;
  }

  // Creates an initial Google Analytics tracker function.
  var tracker = function(...args) {
    tracker['q'] = tracker['q'] || [];
    tracker['q'].push(args);
  };

  // Timestamp for page views.
  tracker['l'] = Date.now();

  // Allow analytics to be globally accessible.
  window[forest.ForestApp.ANALYTICS_TRACKER_NAME_] = tracker;

  // Insert the script tag asynchronously.
  var script = document.createElement('script');
  script.async = 1;
  script.src = 'https://www.google-analytics.com/analytics.js';
  var tag = document.getElementsByTagName('script')[0];
  tag.parentNode.insertBefore(script, tag);

  tracker('create', forest.ForestApp.TRACKER_ID_, 'auto');
  tracker('send', 'pageview');
};
