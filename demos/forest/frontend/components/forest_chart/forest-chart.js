goog.provide('forest.ForestChart');


/**
 * <forest-chart> is the chart element.
 */
forest.ForestChart = Polymer({
  is: 'forest-chart',

  /** @type {boolean} */
  isReady_: false,

  properties: {
    /** @type {string} */
    type: {
      type: String,
      value: 'line',
      notify: true
    },

    /** @type {Object} */
    options: {
      type: Object,
      value: function() {},
      notify: true,
      observer: 'onOptionsChange'
    },

    /** @type {Object} */
    data: {
      type: Object,
      value: function() {},
      notify: true
    }
  },

  /**
   * Handles option change events.
   * @param {Object|undefined} newOpts The new options object, if any, else
   *     undefined.
   * @private
   */
  onOptionsChange: function(newOpts) {
    if (goog.isDefAndNotNull(newOpts)) {
      for (var key in forest.ForestChart.DEFAULT_OPTIONS_) {
        this.options[key] = forest.ForestChart.DEFAULT_OPTIONS_[key];
      }
      this.isReady_ = true;
      this.style.display = 'block';
    } else {
      this.style.display = 'none';
    }

    this.$$('google-chart') && this.$$('google-chart').drawChart();
  }
});


/** @private {string} The color of the chart font. */
forest.ForestChart.CHART_FONT_COLOR_ = 'white';


/**
 * Default chart options. Note that there is no global font color setting.
 * @private {!Object<string,(string|Object)>}
 */
forest.ForestChart.DEFAULT_OPTIONS_ = {
  'chartArea': {
    'left': '0%',
    'top': '10%',
    'height': '65%',
    'width': '100%'
  },
  'backgroundColor': '#212121',  // Material grey 900.
  'axisTitlesPosition': 'in',
  'isStacked': false,
  'colors': ['#26C6DA'],  // Material teal 400.
  'legend': {
    'position': 'none',
    'textStyle': {'color': forest.ForestChart.CHART_FONT_COLOR_}
  },
  'fontName': 'Roboto',
  'hAxis': {
    'title': 'Year',
    'textStyle': {'color': forest.ForestChart.CHART_FONT_COLOR_},
    'titleTextStyle': {'color': forest.ForestChart.CHART_FONT_COLOR_},
    'showTextEvery': 3,
  },
  'vAxis': {
    'title': 'Forest loss (square km)',
    'textPosition': 'in',
    'logScale': false,
    'textStyle': {'color': forest.ForestChart.CHART_FONT_COLOR_},
    'titleTextStyle': {'color': forest.ForestChart.CHART_FONT_COLOR_}
  },
  'titleTextStyle': {'color': forest.ForestChart.CHART_FONT_COLOR_}
};
