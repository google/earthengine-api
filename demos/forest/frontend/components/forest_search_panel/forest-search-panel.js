goog.provide('forest.ForestSearchPanel');

goog.require('goog.events.KeyCodes');


/**
 * <forest-search-panel> is the search panel element.
 */
forest.ForestSearchPanel = Polymer({
  is: 'forest-search-panel',

  behaviors: [
    forest.behaviors.PocketDrawer
  ],

  properties: {

    /** @type {Array<Object>} */
    results: Array,
  },

  /** Focuses the search box when the panel is opened. */
  finishOpen: function() {
    this.$$('paper-input').$.input.focus();
  },

  /** Clears the results list when the panel is closed. */
  finishClose: function() {
    this.$$('paper-input').value = '';
  },

  /**
   * Handles a keydown event on a search result item.
   * @param {Event} e The keydown event.
   * @private
   */
  handleItemKeyDown_: function(e) {
    if (e.keyCode == goog.events.KeyCodes.DOWN) {
      var nextResult = e.target.nextElementSibling;
      if (nextResult) {
        nextResult.focus();
      }
    } else if (e.keyCode == goog.events.KeyCodes.UP) {
      var prevResult = e.target.previousElementSibling;
      if (prevResult) {
        prevResult.focus();
      } else {
        this.$$('paper-input').$.input.focus();
      }
    }
  },

  /**
   * Handles a keydown event on the search input.
   * @param {Event} e The keydown event.
   * @private
   */
  handleInputKeyDown_: function(e) {
    var firstResult = this.$$('paper-item');
    if (!firstResult) {
      return;
    } else if (e.keyCode == goog.events.KeyCodes.DOWN) {
      firstResult.focus();
    } else if (e.keyCode == goog.events.KeyCodes.ENTER) {
      firstResult.click();
    }
  },

  /** @private Initializes the Places API object. */
  initPlacesApi_: function() {
    this.placesApi_ = new google.maps.places.AutocompleteService();
  },

  /** @private Handles a new search query. */
  handleQuery_: function() {
    var query = this.$$('paper-input').value;
    if (!query) {
      this.results = [];
    } else if (this.placesApi_) {
      this.placesApi_['getPredictions']({
        'input': query,
        'types': ['(regions)'],
      }, goog.bind(this.handleResults_, this));
    } else {
      // TODO(user): Consider showing an error.
    }
  },

  /**
   * Handles new search results.
   * @param {Array<Object>} results The results from the autocomplete API.
   * @private
   */
  handleResults_: function(results) {
    this.results = results.map(function(result) {
      return {
        name: result['description'],
        placeId: result['place_id']
      };
    });
  },

  /**
   * Handles a result being tapped.
   * @param {Event} e The tap event.
   * @private
   */
  handleResultTapped_: function(e) {
    this.fire('result-selected', e['model']['item']);
    this.close();
  },
});
