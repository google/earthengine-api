goog.provide('forest.ForestLegend');


/**
 * <forest-legend> is a legend for the current product layer on the map.
 */
forest.ForestLegend = Polymer({
  is: 'forest-legend',

  properties: {

    /**
     * The current forest layer.
     * @type {forest.ForestLayerPanel.ForestLayer}
     */
    forestLayer: {
      type: Object,
      observer: 'showLegend_'
    }
  },

  /**
   * Shows the legend and title for the current layer.
   * @param {forest.ForestLayerPanel.ForestLayer} forestLayer
   * @private
   */
  showLegend_: function(forestLayer) {
    this.$.title.textContent = forestLayer.title;

    var previous = this.$.svgAnchor.firstChild;
    if (previous) {
      this.$.svgAnchor.removeChild(previous);
    }

    this.renderRows_(
        forest.ForestLegend.LEGEND_ROWS_BY_LAYER_ID_[forestLayer.id]);
  },

  /**
   * Renders the rows within the legend.
   * @param {forest.ForestLegend.LegendRows_} rows
   * @private
   */
  renderRows_: function(rows) {
    var xmlNs = forest.ForestLegend.XML_NS_;
    var root = document.createElementNS(xmlNs, 'svg');
    this.$.svgAnchor.appendChild(root);

    var rowHeight = 2 + forest.ForestLegend.LEGEND_SIDE_LENGTH_;
    root.setAttribute('height', rows.length * rowHeight);
    var maxWidth = -1;

    rows.forEach(function(row, i) {
      var group = document.createElementNS(xmlNs, 'svg');
      group.setAttribute('y', i * rowHeight);
      root.appendChild(group);

      var rect = document.createElementNS(xmlNs, 'rect');
      rect.setAttribute('height', forest.ForestLegend.LEGEND_SIDE_LENGTH_);
      rect.setAttribute('width', forest.ForestLegend.LEGEND_SIDE_LENGTH_);
      rect.setAttribute('style', 'fill:' + row.color);
      group.appendChild(rect);

      var text = document.createElementNS(xmlNs, 'text');
      var leftMargin = forest.ForestLegend.LEGEND_SIDE_LENGTH_ + 4;
      text.setAttribute('x', leftMargin);
      text.setAttribute('y', forest.ForestLegend.LEGEND_SIDE_LENGTH_ - 3);
      text.setAttribute('style', 'fill: white; font-weight: normal;');
      text.appendChild(document.createTextNode(row.label));
      group.appendChild(text);

      var width = text['getBBox']().width + leftMargin;
      if (width > maxWidth) {
        maxWidth = width;
      }
    });

    root.setAttribute('width', maxWidth);
  },
});


/** @private @enum {string} The legend row colors. */
forest.ForestLegend.Color_ = {
  PINK: '#FF00FF',
  RED: '#FF0000',
  ORANGE: '#FF8000',
  YELLOW: '#FFFF00',
  TEAL: '#00FFFF',
  BLUE: '#0000FF',
  GREEN: '#00E000',
  LIGHT_GREEN: '#55CC55',
  LIGHTER_GREEN: '#AAE5AA',
};


/**
 * A list of descriptions of forest layer legends and their layer IDs.
 * @private @const {!Array<{
 *   id: forest.ForestLayerPanel.ForestLayerId,
 *   rows: forest.ForestLegend.LegendRows_
 * }>}
 */
forest.ForestLegend.LEGEND_DESCRIPTIONS_ = [
  {
    id: forest.ForestLayerPanel.ForestLayerId.LOSS_YEAR,
    rows: [
      {color: forest.ForestLegend.Color_.RED, label: '2014'},
      {color: forest.ForestLegend.Color_.ORANGE, label: '...'},
      {color: forest.ForestLegend.Color_.YELLOW, label: '2000'}
    ]
  }, {
    id: forest.ForestLayerPanel.ForestLayerId.LOSS_YEAR_NEW,
    rows: [
      {color: forest.ForestLegend.Color_.TEAL, label: '2014'},
      {color: forest.ForestLegend.Color_.RED, label: '2013'},
      {color: forest.ForestLegend.Color_.ORANGE, label: '...'},
      {color: forest.ForestLegend.Color_.YELLOW, label: '2000'}
    ]
  }, {
    id: forest.ForestLayerPanel.ForestLayerId.LOSS_TREE_GAIN,
    rows: [
      {color: forest.ForestLegend.Color_.RED, label: 'Loss 2000 to 2013'},
      {color: forest.ForestLegend.Color_.BLUE, label: 'Gain 2000 to 2012'},
      {color: forest.ForestLegend.Color_.PINK, label: 'Both loss and gain'},
      {color: forest.ForestLegend.Color_.GREEN, label: 'Unchanged'}
    ]
  }, {
    id: forest.ForestLayerPanel.ForestLayerId.LOSS,
    rows: [
      {color: forest.ForestLegend.Color_.RED, label: 'Loss 2000 to 2014'}
    ]
  }, {
    id: forest.ForestLayerPanel.ForestLayerId.GAIN,
    rows: [
      {color: forest.ForestLegend.Color_.BLUE, label: 'Gain 2000 to 2014'}
    ]
  }, {
    id: forest.ForestLayerPanel.ForestLayerId.TREE,
    rows: [
      {color: forest.ForestLegend.Color_.GREEN, label: '75-100%'},
      {color: forest.ForestLegend.Color_.LIGHT_GREEN, label: '50-75%'},
      {color: forest.ForestLegend.Color_.LIGHTER_GREEN, label: '25-50%'}
    ]
  },
];


/**
 * Creates a mapping from layer ID to legend descriptions.
 * @return {!Object<string, forest.ForestLegend.LegendRows_>}
 * @private
 */
forest.ForestLegend.createDescriptionMapping_ = function() {
  var mapping = {};
  forest.ForestLegend.LEGEND_DESCRIPTIONS_.forEach(function(description) {
    mapping[description.id] = description.rows;
  }, this);
  return mapping;
};


/**
 * A dictionary mapping from a forest layer ID to its legend entries.
 * @private @const {!Object<string, forest.ForestLegend.LegendRows_>}
 */
forest.ForestLegend.LEGEND_ROWS_BY_LAYER_ID_ =
    forest.ForestLegend.createDescriptionMapping_();


/**
 * A description of a legend for a forest data layer.
 * @private @typedef {!Array<!{
 *   color: forest.ForestLegend.Color_,
 *   label: string
 * }>}
 */
forest.ForestLegend.LegendRows_;


/** @private @const {string} The XML namespace. */
forest.ForestLegend.XML_NS_ = 'http://www.w3.org/2000/svg';


/** @private @const {number} The size of a color box for a legend row. */
forest.ForestLegend.LEGEND_SIDE_LENGTH_ = 20;
