goog.provide('forest.ForestChart');

goog.require('goog.object');

/**
 * <forest-chart> is the chart element.
 */
forest.ForestChart = Polymer({
  is: 'forest-chart',

  properties: {
    /** @type {string} */
    type: {
      type: String,
      value: 'line',
      notify: true
    },

    /** @type {Object|undefined} */
    options: {
      type: Object
    },

    /** @type {Object|undefined} */
    data: {
      type: Object
    }
  },

  /**
   * Computes google-chart options from forest-chart options.
   * Toggles display between block/none if options is defined/undefined.
   * @param {Object|undefined} options the forest-chart options
   * @return {Object|undefined} the google-chart options
   * @private
   */
  _computeChartOptions: function(options) {
    if (goog.isDefAndNotNull(options)) {
      goog.object.extend(options, forest.ForestChart.DEFAULT_OPTIONS_);
      this.style.display = 'block';
    } else {
      this.style.display = 'none';
    }
    return options;
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
