goog.provide('forest.ForestQuestion');


/**
 * <forest-question> is the hotspot question element.
 */
forest.ForestQuestion = Polymer({
  is: 'forest-question',

  properties: {
    /** @type {string} */
    correctChoice: String,

    /** @type {string} */
    explanation: String,

    /** @type {string} */
    learnMoreLink: String,

    /** @private {!Array<string>} */
    choices_: {
      type: Array,
      computed: 'computeChoices_(correctChoice)',
      observer: 'resetDisplay_',
    },

    /** @private {string} */
    selectedChoice_: String,
  },

  listeners: {
    'iron-select': 'handleSelect_',
  },

  /**
   * Checks is a selected answer is correct and triggers the appropriate
   * response.
   * @private
   * @param {!CustomEvent} event The selection change event.
   */
  handleSelect_: function(event) {
    if (this.selectedChoice_ == this.correctChoice) {
      this.classList.add('answered');
    } else {
      event.target.selectedItem.classList.add('tried');
    }
  },

  /**
   * Updates the content section to display when a correct answer is selected.
   * is received.
   * @private
   */
  resetDisplay_: function() {
    this.selectedChoice_ = '';
    this.classList.remove('answered');
    this.$.choicesGroup.items.forEach(function(item) {
      item.classList.remove('tried');
    });
  },

  /**
   * Computes the possible choices in this question.
   * @param {string} correctChoice
   * @return {!Array<string>}
   * @private
   */
  computeChoices_: function(correctChoice) {
    // Don't show the correct choice twice.
    var choiceSet = {};
    for (var key in forest.ForestQuestion.FILLER_CHOICES_) {
      choiceSet[key] = forest.ForestQuestion.FILLER_CHOICES_[key];
    }
    delete choiceSet[correctChoice];

    // Select three random (unique) wrong choices.
    var wrongChoices = Object.keys(choiceSet);
    forest.ForestQuestion.shuffle_(wrongChoices);
    wrongChoices = wrongChoices.slice(0, 3);

    var choices = wrongChoices.concat(correctChoice);
    forest.ForestQuestion.shuffle_(choices);

    return choices;
  },
});


/**
 * Shuffles the given array in place. Sourced from
 * http://google.github.io/closure-library/api/namespace_goog_array.html.
 * @param {!Array} arr The array to shuffle.
 * @private
 */
forest.ForestQuestion.shuffle_ = function(arr) {
  for (var i = arr.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
};


/**
 * @const @private {!Object}
 */
forest.ForestQuestion.FILLER_CHOICES_ = {
  'Pine beetles': true,
  'Tornado': true,
  'Tree farming': true,
  'Logging': true,
  'Oil extraction': true,
  'Fire': true,
  'Agriculture': true,
  'Mining': true
};
