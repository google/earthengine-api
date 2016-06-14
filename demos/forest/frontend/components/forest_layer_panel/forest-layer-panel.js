goog.provide('forest.ForestLayerPanel');



/**
 * <forest-layer-panel> is the map layers panel element.
 */
forest.ForestLayerPanel = Polymer({
  is: 'forest-layer-panel',

  behaviors: [
    forest.behaviors.PocketDrawer
  ],

  properties: {

    /**
     * The selected forest layer.
     * @public {forest.ForestLayerPanel.ForestLayer}
     */
    selectedForestLayer: {
      type: Object,
      notify: true,
      computed: 'computeSelectedForestLayer_(' +
                    'selectedForestLayerMetadata_, ' +
                    'selectedBackgroundType_, ' +
                    'rawOpacity_)',
    },

    /**
     * The selected Google Maps layer type ID.
     * @public {forest.ForestLayerPanel.BaseLayerId}
     */
    selectedBaseLayerId: {
      type: String,
      notify: true
    },

    /** @private {?forest.ForestLayerPanel.ForestLayerMetadata_} */
    selectedForestLayerMetadata_: Object,

    /** @private {string} */
    selectedBackgroundType_: {
      type: String,
      value: 'black'
    },

    /** @private {number} */
    rawOpacity_: Number,

    // Constants.
    baseLayerIdList_: Array,
    backgroundTypeList_: Array,
    forestLayerMetadataList_: Array
  },

  /** @override */
  ready: function() {
    this.baseLayerIdList_ = [
      forest.ForestLayerPanel.BaseLayerId.ROADMAP,
      forest.ForestLayerPanel.BaseLayerId.SATELLITE
    ];
    this.selectedBaseLayerId = this.baseLayerIdList_[1];

    this.backgroundTypeList_ = [
      forest.ForestLayerPanel.BackgroundType.CLEAR,
      forest.ForestLayerPanel.BackgroundType.BLACK
    ];
    this.selectedBackgroundType_ = this.backgroundTypeList_[1];

    this.forestLayerMetadataList_ =
        forest.ForestLayerPanel.FOREST_LAYER_METADATA_LIST_;
    this.selectedForestLayerMetadata_ = this.forestLayerMetadataList_[0];
  },

  /**
   * Computes the currently selected forest layer object.
   * @param {forest.ForestLayerPanel.ForestLayerMetadata_}
   *     selectedForestLayerMetadata_
   * @param {forest.ForestLayerPanel.BackgroundType} selectedBackgroundType_
   * @param {number} rawOpacity_ The raw layer opacity between 0 and 100.
   * @return {?forest.ForestLayerPanel.ForestLayer}
   * @private
   */
  computeSelectedForestLayer_: function(
      selectedForestLayerMetadata_, selectedBackgroundType_, rawOpacity_) {
    if (selectedForestLayerMetadata_) {
      return {
        id: selectedForestLayerMetadata_.id,
        title: selectedForestLayerMetadata_.title,
        background: selectedBackgroundType_,
        opacity: rawOpacity_ / forest.ForestLayerPanel.OPACITY_SCALE_FACTOR_
      };
    } else {
      return null;
    }
  },

  /** @private Handles a change to the forest layer select. */
  handleDropdownSelect_: function() {
    var selectedItem = this.$$('paper-listbox').selectedItem;
    var newId = selectedItem.name;
    this.selectedForestLayerMetadata_ = this.getLayerMetadataById_(newId);
    var onlyBlackFill =
        !this.selectedForestLayerMetadata_.hasVersionWithClearBackground;
    if (onlyBlackFill) {
      this.selectedBackgroundType_ =
          forest.ForestLayerPanel.BackgroundType.BLACK;
    }
    this.$.backgroundDropdown.disabled = onlyBlackFill;
  },

  /**
   * Returns metadata about the layer with given ID.
   * @param {forest.ForestLayerPanel.ForestLayerId} id The ID of the layer.
   * @return {?forest.ForestLayerPanel.ForestLayerMetadata_} The metadata.
   * @private
   */
  getLayerMetadataById_: function(id) {
    for (var i = 0; i < this.forestLayerMetadataList_.length; i++) {
      if (this.forestLayerMetadataList_[i].id == id) {
        return this.forestLayerMetadataList_[i];
      }
    }
    // No matching metadata found.
    return null;
  },
});


/**
 * The data model for a forest map layer to render.
 * @typedef {{
 *   id: forest.ForestLayerPanel.ForestLayerId,
 *   title: string,
 *   background: forest.ForestLayerPanel.BackgroundType,
 *   opacity: number
 * }}
 */
forest.ForestLayerPanel.ForestLayer;


/** @enum {string} The Google Maps base layer types. */
forest.ForestLayerPanel.BaseLayerId = {
  ROADMAP: 'roadmap',
  SATELLITE: 'satellite'
};


/** @enum {string} The background mask types. */
forest.ForestLayerPanel.BackgroundType = {
  CLEAR: 'clear',
  BLACK: 'black'
};


/** @enum {string} The IDs of the forest layers. */
forest.ForestLayerPanel.ForestLayerId = {
  LOSS_YEAR: 'loss_year',
  LOSS_YEAR_NEW: 'loss_year_new',
  LOSS_TREE_GAIN: 'loss_tree_gain',
  LOSS: 'loss',
  GAIN: 'gain',
  TREE: 'tree'
};


/**
 * Metadata about forest raster layer type.
 * @private @typedef {{
 *   id: forest.ForestLayerPanel.ForestLayerId,
 *   title: string,
 *   hasVersionWithClearBackground: boolean
 * }}
 */
forest.ForestLayerPanel.ForestLayerMetadata_;


/**
 * A list of the forest change raster layers.
 * @private {!Array<forest.ForestLayerPanel.ForestLayerMetadata_>}
 */
forest.ForestLayerPanel.FOREST_LAYER_METADATA_LIST_ = [
  {
    id: forest.ForestLayerPanel.ForestLayerId.LOSS_YEAR,
    title: 'Loss By Year',
    hasVersionWithClearBackground: true
  }, {
    id: forest.ForestLayerPanel.ForestLayerId.LOSS_YEAR_NEW,
    title: 'Loss By Year (2014 Highlight)',
    hasVersionWithClearBackground: false
  }, {
    id: forest.ForestLayerPanel.ForestLayerId.LOSS_TREE_GAIN,
    title: 'Loss/Extent/Gain',
    hasVersionWithClearBackground: false
  }, {
    id: forest.ForestLayerPanel.ForestLayerId.LOSS,
    title: 'Total Loss 2000-2014',
    hasVersionWithClearBackground: true
  }, {
    id: forest.ForestLayerPanel.ForestLayerId.GAIN,
    title: 'Total Gain 2000-2014',
    hasVersionWithClearBackground: true
  }, {
    id: forest.ForestLayerPanel.ForestLayerId.TREE,
    title: 'Percent Cover in 2000',
    hasVersionWithClearBackground: true
  }
];


/**
 * The factor between the actual opacity and the raw opacity. Needed because
 * <paper-slider> doesn't seem to support 0 to 1 as its limits.
 *
 *   opacity = rawOpacity / OPACITY_SCALE_FACTOR_
 *
 * @private @const {number}
 */
forest.ForestLayerPanel.OPACITY_SCALE_FACTOR_ = 100;
