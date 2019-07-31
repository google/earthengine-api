goog.provide('forest.ForestMap');
goog.provide('forest.ForestMap.Destination');



/**
 * <forest-map> is the map element.
 */
forest.ForestMap = Polymer({
  is: 'forest-map',

  /**
   * @private {google.maps.FusionTablesLayer}
   */
  ftLayer_: null,

  properties: {

    /** @type {google.maps.FusionTablesQuery} */
    geoQuery: {
      type: Object,
      value: function() {
        return /** @type {google.maps.FusionTablesQuery} **/ ({}); },
      notify: true,
      observer: 'handleGeoQueryChange_'
    },

    /** @type {Object} */
    boundingBox: {
      type: Object,
      notify: true,
      observer: 'handleBoundingBoxChange_'
    },

    /** @private {google.maps.Map} */
    gMap_: {
      type: Object,
      notify: true
    },

    /** @private {number} */
    lat_: {
      type: Number,
      value: forest.ForestMap.DEFAULT_LAT_
    },

    /** @private {number} */
    lon_: {
      type: Number,
      value: forest.ForestMap.DEFAULT_LON_
    },

    /** @private {number} */
    zoom_: {
      type: Number,
      value: forest.ForestMap.DEFAULT_ZOOM_
    },

    /** @private {forest.ForestLayerPanel.ForestLayer} */
    forestLayer_: {
      type: Object,
      observer: 'handleForestLayerChange_'
    },

    /** @private {forest.ForestLayerPanel.BaseLayerId} */
    baseLayerId_: String,
  },

  /**
   * Centers the map on a Google Place.
   * @param {string} placeId The Google Maps API Place ID to center on.
   */
  centerPlace: function(placeId) {
    if (!this.gMap_) return;  // We're not fully loaded yet.
    var placesService = new google.maps.places.PlacesService(this.gMap_);
    var request = {'placeId': placeId};
    placesService.getDetails(request, goog.bind(function(result, status) {
      if (status == google.maps.places.PlacesServiceStatus.OK) {
        this.gMap_.fitBounds(result.geometry.viewport);
      }
    }, this));
  },

  /**
   * Centers the map according to the current bounding box.
   * @private
   */
  handleBoundingBoxChange_: function() {
    if (!this.gMap_ || !this.boundingBox) return;  // We're not fully loaded yet.
    var sw = this.boundingBox['sw'];
    var ne = this.boundingBox['ne'];
    this.gMap_.fitBounds(new google.maps.LatLngBounds(
        new google.maps.LatLng(sw[0], sw[1]),
        new google.maps.LatLng(ne[0], ne[1])));
  },

  /** @private Initializes the map. */
  handleGoogleMapReady_: function() {
    // Configure the Google Maps UI.
    this.gMap_.setOptions({
      disableDefaultUI: true,
      mapTypeId: google.maps.MapTypeId.SATELLITE,
      zoomControl: true,
      zoomControlOptions: {
        position: google.maps.ControlPosition.RIGHT_BOTTOM
      },
    });

    this.handleForestLayerChange_();
    this.handleGeoQueryChange_();
    this.handleBoundingBoxChange_();
  },

  /**
   * Handles a change to the selected forest layer by updating the overlay on
   * the Google Map.
   * @private
   */
  handleForestLayerChange_: function() {
    if (!this.gMap_) return;  // We're not fully loaded yet.

    var curMapType = this.gMap_.overlayMapTypes.getAt(0);
    var newLayer = this.forestLayer_;
    if (curMapType && curMapType.name == forest.ForestMap.getPath_(newLayer)) {
      curMapType.setOpacity(newLayer.opacity);
    } else {
      this.gMap_.overlayMapTypes.setAt(0,
          forest.ForestMap.getMapType_(newLayer));
    }
  },

  /**
   * Handles a change to the geometry query.
   * @private
   */
  handleGeoQueryChange_: function() {
    // The map hasn't been initialized yet.
    if (!this.gMap_) {
      return;
    }

    if (this.ftLayer_) {
      this.ftLayer_.setMap(null);
      this.ftLayer_ = null;
    }

    this.ftLayer_ = new google.maps.FusionTablesLayer({
      styles: forest.ForestMap.DEFAULT_POLY_STYLES_,
      options: {suppressInfoWindows: true},
      query: this.geoQuery,
      map: this.gMap_
    });
  },

  /**
   * Opens the search panel.
   * @private.
   */
  openSearchPanel_: function() {
    var searchPanel = /** @type {forest.ForestSearchPanel} **/ (
        this.$$('forest-search-panel'));
    searchPanel.open();
  },

  /**
   * Opens the layer panel.
   * @private.
   */
  openLayersPanel_: function() {
    var layerPanel = /** @type {forest.ForestLayerPanel} **/ (
        this.$$('forest-layer-panel'));
    layerPanel.open();
  },

  /**
   * Handles the selection of a search result.
   * @param {Event} e The search result event.
   * @private.
   */
  handleSearchDone_: function(e) {
    this.centerPlace(e.detail.placeId);
  },
});


/**
 * Returns the path the image tiles for the given forest layer.
 * @param {forest.ForestLayerPanel.ForestLayer} forestLayer
 * @return {string}
 * @private
 */
forest.ForestMap.getPath_ = function(forestLayer) {
  var alphaSuffix;
  if (forestLayer.background == forest.ForestLayerPanel.BackgroundType.CLEAR) {
    alphaSuffix = '_alpha';
  } else {
    alphaSuffix = '';
  }
  return forestLayer.id + alphaSuffix;
};

/**
 * Returns a new image map type object for the provided valid GFC layer ID.
 * @param {forest.ForestLayerPanel.ForestLayer} forestLayer
 * @return {forest.SubTileZoomMapType}
 * @private
 */
forest.ForestMap.getMapType_ = function(forestLayer) {
  var path = forest.ForestMap.getPath_(forestLayer);
  return new forest.SubTileZoomMapType({
    name: path,
    opacity: forestLayer.opacity,
    tileSize: new google.maps.Size(
        forest.ForestMap.TILE_SIDE_LENGTH_,
        forest.ForestMap.TILE_SIDE_LENGTH_),
    maxTileZoom: forest.ForestMap.MAX_TILE_ZOOM_,
    getTileUrl: (coord, zoom) => {
      if (coord.y < 0 || coord.y >= Math.pow(2, zoom)) {
        // Show a blank tile if the location is out of bounds.
        coord = {x: 0, y: 0};
        zoom = 10;
      }
      return forest.ForestMap.BASE_TILE_URL_ +
             `${path}/${zoom}/${coord.x}/${coord.y}.png`;
    },
  });
};


/**
 * The data model for a current destination.
 * @typedef {{
 *   id: string,
 *   title: string,
 *   type: string,
 *   thumbnailUrl: string,
 *   enabledLayers: string,
 *   text: string,
 *   sourceUrl: string,
 *   boundingBoxSW: Array<number>,
 *   boundingBoxNE: Array<number>,
 *   loss: Object,
 *   question: Object,
 *   answers: Array<Object>
 * }}
 */
forest.ForestMap.Destination;


////////////////////////
// Layer tile constants.
////////////////////////


/** @private @const {string} The base tile URL for Hansen tiles. */
forest.ForestMap.BASE_TILE_URL_ =
    'https://storage.googleapis.com/earthenginepartners-hansen/tiles/gfc2015/';


/** @private @const {number} The tile side length in pixels. */
forest.ForestMap.TILE_SIDE_LENGTH_ = 256;


/** @private @const {number} The maximum zoom level we have tiles for. */
forest.ForestMap.MAX_TILE_ZOOM_ = 12;


///////////////////////////
// Default polygon styling.
///////////////////////////


/** @private @const {Array<google.maps.FusionTablesStyle>} */
forest.ForestMap.DEFAULT_POLY_STYLES_ = [{
  polygonOptions: {
    'fillColor': 'FFFFFF',
    'fillOpacity': '0',
    'strokeColor': 'FFFFFF',
    'strokeWeight': '2'
  }
}];


//////////////////////////////////
// Default map position constants.
//////////////////////////////////


/** @private @const {number} */
forest.ForestMap.DEFAULT_LAT_ = 34.8;


/** @private @const {number} */
forest.ForestMap.DEFAULT_LON_ = -95.2;


/** @private @const {number} */
forest.ForestMap.DEFAULT_ZOOM_ = 4;
