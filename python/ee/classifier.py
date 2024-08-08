"""A wrapper for Classifiers."""
from __future__ import annotations

from typing import Optional

from ee import _arg_types
from ee import apifunction
from ee import computedobject
from ee import confusionmatrix
from ee import dictionary
from ee import ee_list
from ee import ee_string


class Classifier(computedobject.ComputedObject):
  """An object to represent an Earth Engine Classifier.

  Example:
    # https://developers.google.com/earth-engine/guides/classification
  """

  _initialized: bool = False

  def __init__(self, classifier: computedobject.ComputedObject):
    """Creates a Classifier wrapper.

    Args:
      classifier: A Classifier to cast.
    """
    self.initialize()

    if isinstance(classifier, computedobject.ComputedObject):
      # There is no server-side constructor for ee.Classifier. Pass the object
      # as-is to the server in case it is intended to be a Classifier cast.
      super().__init__(classifier.func, classifier.args, classifier.varName)
      return

    raise TypeError(
        'Classifier can only be used as a cast to Classifier. Found'
        f' {type(classifier)}.'
    )

  @classmethod
  def initialize(cls) -> None:
    """Imports API functions to this class."""
    if not cls._initialized:
      apifunction.ApiFunction.importApi(cls, cls.name(), cls.name())
      cls._initialized = True

  @classmethod
  def reset(cls) -> None:
    """Removes imported API functions from this class."""
    apifunction.ApiFunction.clearApi(cls)
    cls._initialized = False

  @staticmethod
  def name() -> str:
    return 'Classifier'

  def amnhMaxent(
      # pylint: disable=invalid-name
      categoricalNames: Optional[_arg_types.List] = None,
      outputFormat: Optional[_arg_types.String] = None,
      autoFeature: Optional[_arg_types.Bool] = None,
      # pylint: enable=invalid-name
      linear: Optional[_arg_types.Bool] = None,
      quadratic: Optional[_arg_types.Bool] = None,
      product: Optional[_arg_types.Bool] = None,
      threshold: Optional[_arg_types.Bool] = None,
      hinge: Optional[_arg_types.Bool] = None,
      # pylint: disable=invalid-name
      hingeThreshold: Optional[_arg_types.Integer] = None,
      l2lqThreshold: Optional[_arg_types.Integer] = None,
      lq2lqptThreshold: Optional[_arg_types.Integer] = None,
      addSamplesToBackground: Optional[_arg_types.Bool] = None,
      addAllSamplesToBackground: Optional[_arg_types.Bool] = None,
      betaMultiplier: Optional[_arg_types.Number] = None,
      betaHinge: Optional[_arg_types.Number] = None,
      betaLqp: Optional[_arg_types.Number] = None,
      betaCategorical: Optional[_arg_types.Number] = None,
      betaThreshold: Optional[_arg_types.Number] = None,
      # pylint: enable=invalid-name
      extrapolate: Optional[_arg_types.Bool] = None,
      # pylint: disable=invalid-name
      doClamp: Optional[_arg_types.Bool] = None,
      writeClampGrid: Optional[_arg_types.Bool] = None,
      randomTestPoints: Optional[_arg_types.Integer] = None,
      # pylint: enable=invalid-name
      seed: Optional[_arg_types.Integer] = None,
  ) -> Classifier:
    """Returns a Maximum Entropy classifier.

    Maxent is used to model species distribution probabilities using
    environmental data for locations of known presence and for a large number of
    'background' locations. For more information and to cite, see:
    https://biodiversityinformatics.amnh.org/open_source/maxent/ and the
    reference publication: Phillips, et al., 2004. A maximum entropy approach
    to species distribution modeling, Proceedings of the Twenty-First
    International Conference on Machine Learning. The output is a single band
    named 'probability', containing the modeled probability,  and an additional
    band named 'clamp' when the 'writeClampGrid' argument is true.

    Args:
      categoricalNames: A list of the names of the categorical inputs. Any
        inputs not listed in this argument are considered to be continuous.
      outputFormat: Representation of probabilities in output.
      autoFeature: Automatically select which feature classes to use, based on
        number of training samples.
      linear: Allow linear features to be used. Ignored when autofeature is
        true.
      quadratic: Allow quadratic features to be used. Ignored when autofeature
        is true.
      product: Allow product features to be used. Ignored when autofeature is
        true.
      threshold: Allow threshold features to be used. Ignored when autofeature
        is true.
      hinge: Allow hinge features to be used. Ignored when autofeature is true.
      hingeThreshold: Number of samples at which hinge features start being
        used. Ignored when autofeature is false.
      l2lqThreshold: Number of samples at which quadratic features start being
        used. Ignored when autofeature is false.
      lq2lqptThreshold: Number of samples at which product and threshold
        features start being used. Ignored when autofeature is false.
      addSamplesToBackground: Add to the background any sample for which has a
        combination of environmental values that isn't already present in the
        background.
      addAllSamplesToBackground: Add all samples to the background, even if they
        have combinations of environmental values that are already present in
        the background.
      betaMultiplier: Regularization multiplier. Multiply all automatic
        regularization parameters by this number. A higher number gives a more
        spread-out distribution.
      betaHinge: Regularization parameter to be applied to all hinge features;
        negative value enables automatic setting.
      betaLqp: Regularization parameter to be applied to all linear, quadratic
        and product features; negative value enables automatic setting.
      betaCategorical: Regularization parameter to be applied to all categorical
        features; negative value enables automatic setting.
      betaThreshold: Regularization parameter to be applied to all threshold
        features; negative value enables automatic setting.
      extrapolate: Extrapolate. Predict to regions of environmental space
        outside the limits encountered during training.
      doClamp: Apply clamping to output.
      writeClampGrid: Adds a band to the output ('clamp') showing the spatial
        distribution of clamping. At each point, the value is the absolute
        difference between prediction values with and without clamping.
      randomTestPoints: Random test percentage. The percentage of training
        points to hold aside as test points, used to compute AUX, omission, etc.
      seed: A seed used when generating random numbers.
    """

    return apifunction.ApiFunction.call_(
        'Classifier.amnhMaxent',
        categoricalNames,
        outputFormat,
        autoFeature,
        linear,
        quadratic,
        product,
        threshold,
        hinge,
        hingeThreshold,
        l2lqThreshold,
        lq2lqptThreshold,
        addSamplesToBackground,
        addAllSamplesToBackground,
        betaMultiplier,
        betaHinge,
        betaLqp,
        betaCategorical,
        betaThreshold,
        extrapolate,
        doClamp,
        writeClampGrid,
        randomTestPoints,
        seed,
    )

  def confusionMatrix(self) -> confusionmatrix.ConfusionMatrix:
    """Returns a 2D confusion matrix.

    Computes a 2D confusion matrix for a classifier based on its training data
    (e.g., resubstitution error). Axis 0 of the matrix corresponds to the input
    classes and axis 1 corresponds to the output classes. The rows and columns
    start at class 0 and increase sequentially up to the maximum class value, so
    some rows or columns might be empty if the input classes aren't 0-based or
    sequential.
    """

    return apifunction.ApiFunction.call_('Classifier.confusionMatrix', self)

  @staticmethod
  def decisionTree(
      treeString: _arg_types.String,  # pylint: disable=invalid-name
  ) -> Classifier:
    """Returns a classifier that applies the given decision tree.

    Args:
      treeString: The decision tree, specified in the text format generated by R
        and other similar tools.
    """

    return apifunction.ApiFunction.call_('Classifier.decisionTree', treeString)

  @staticmethod
  def decisionTreeEnsemble(
      treeStrings: _arg_types.List,  # pylint: disable=invalid-name
  ) -> Classifier:
    """Creates a classifier that applies the given decision trees.

    Args:
      treeStrings: The decision trees, specified in the text format generated by
        R and other similar tools. Each item in the list should contain one or
        more trees in text format.

    Returns:
      An ee.Classifier.
    """

    return apifunction.ApiFunction.call_(
        'Classifier.decisionTreeEnsemble', treeStrings
    )

  def explain(self) -> dictionary.Dictionary:
    """Returns a dictionary describing the results of a trained classifier."""

    return apifunction.ApiFunction.call_(self.name() + '.explain', self)

  @staticmethod
  def libsvm(
      # pylint: disable=invalid-name
      decisionProcedure: Optional[_arg_types.String] = None,
      svmType: Optional[_arg_types.String] = None,
      kernelType: Optional[_arg_types.String] = None,
      # pylint: enable=invalid-name
      shrinking: Optional[_arg_types.Bool] = None,
      degree: Optional[_arg_types.Integer] = None,
      gamma: Optional[_arg_types.Number] = None,
      coef0: Optional[_arg_types.Number] = None,
      cost: Optional[_arg_types.Number] = None,
      nu: Optional[_arg_types.Number] = None,
      # pylint: disable=invalid-name
      terminationEpsilon: Optional[_arg_types.Number] = None,
      lossEpsilon: Optional[_arg_types.Number] = None,
      oneClass: Optional[_arg_types.Integer] = None,
      # pylint: enable=invalid-name
  ) -> Classifier:
    """Returns an empty Support Vector Machine classifier.

    Args:
      decisionProcedure: The decision procedure to use for classification.
        Either 'Voting' or 'Margin'. Not used for regression.
      svmType: The SVM type. One of `C_SVC`, `NU_SVC`, `ONE_CLASS`,
        `EPSILON_SVR`, or `NU_SVR`.
      kernelType: The kernel type. One of LINEAR, POLY, RBF, or SIGMOID.
      shrinking: Whether to use shrinking heuristics.
      degree: The degree of polynomial. Valid for POLY kernels.
      gamma: The gamma value in the kernel function. Defaults to the reciprocal
        of the number of features. Valid for POLY, RBF, and SIGMOID kernels.
      coef0: The coef₀ value in the kernel function. Defaults to 0. Valid for
        POLY and SIGMOID kernels.
      cost: The cost (C) parameter. Defaults to 1. Only valid for C-SVC,
        epsilon-SVR, and nu-SVR.
      nu: The nu parameter. Defaults to 0.5. Only valid for nu-SVC, one-class
        SVM, and nu-SVR.
      terminationEpsilon: The termination criterion tolerance (e). Defaults to
        0.001. Only valid for epsilon-SVR.
      lossEpsilon: The epsilon in the loss function (p). Defaults to 0.1. Only
        valid for epsilon-SVR.
      oneClass: The class of the training data on which to train in a one-class
        SVM. Defaults to 0. Only valid for one-class SVM. Possible values are 0
        and 1. The classifier output is binary (0/1) and will match this class
        value for the data determined to be in the class.
    """

    return apifunction.ApiFunction.call_(
        'Classifier.libsvm',
        decisionProcedure,
        svmType,
        kernelType,
        shrinking,
        degree,
        gamma,
        coef0,
        cost,
        nu,
        terminationEpsilon,
        lossEpsilon,
        oneClass,
    )

  @staticmethod
  # pylint: disable-next=redefined-builtin
  def load(id: _arg_types.String) -> Classifier:
    """Returns a classifier from an asset.

    Args:
      id: The Classifier's Asset ID.

    Returns:
      An ee.Classifier.
    """

    return apifunction.ApiFunction.call_('Classifier.load', id)

  @staticmethod
  def minimumDistance(
      metric: Optional[_arg_types.String] = None,
      # pylint: disable-next=invalid-name
      kNearest: Optional[_arg_types.Integer] = None,
  ) -> Classifier:
    # pyformat: disable
    """Returns a minimum distance classifier for the given distance metric.

    Creates a minimum distance classifier for the given distance metric. In
    CLASSIFICATION mode, the nearest class is returned. In REGRESSION mode, the
    distance to the nearest class center is returned. In RAW mode, the distance
    to every class center is returned.

    Args:
      metric: The distance metric to use. Options are:
        * 'euclidean' - Euclidean distance from the unnormalized class mean.
        * 'cosine' - spectral angle from the unnormalized class mean.
        * 'mahalanobis' - Mahalanobis distance from the class mean.
        * 'manhattan' - Manhattan distance from the unnormalized class mean.
      kNearest: If greater than 1, the result will contain an array of the k
        nearest neighbors or distances, based on the output mode setting. If
        kNearest is greater than the total number of classes, it will be set
        equal to the number of classes.
    """
    # pyformat: enable

    return apifunction.ApiFunction.call_(
        'Classifier.minimumDistance', metric, kNearest
    )

  def mode(self) -> ee_string.String:
    """Returns the classifier mode string.

    The string will be one of `CLASSIFICATION`, `REGRESSION`, `PROBABILITY`,
    `MULTIPROBABILITY`, `RAW`, or `RAW_REGRESSION`.
    """

    return apifunction.ApiFunction.call_(self.name() + '.mode', self)

  def schema(self) -> ee_list.List:
    """Returns a list of the schema of the classifier.

    Returns the names of the inputs used by this classifier or null if this
    classifier has not had any training data added yet.
    """

    return apifunction.ApiFunction.call_(self.name() + '.schema', self)

  def setOutputMode(self, mode: _arg_types.String) -> Classifier:
    # pyformat: disable
    """Returns a classifier with the given output mode.

    Args:
      mode: The output mode. One of:
        * CLASSIFICATION (default): The output is the class number.
        * REGRESSION: The output is the result of standard regression.
        * PROBABILITY: The output is the probability that the classification is
          correct.
        * MULTIPROBABILITY: The output is an array of probabilities that each
          class is correct ordered by classes seen.
        * RAW: The output is an array of the internal representation of the
          classification process. For example, the raw votes in multi-decision
          tree models.
        * RAW_REGRESSION: The output is an array of the internal representation
          of the regression process. For example, the raw predictions of
          multiple regression trees.

        Not all classifiers support modes other than CLASSIFICATION.
    """
    # pyformat: enable

    return apifunction.ApiFunction.call_(
        self.name() + '.setOutputMode', self, mode
    )

  @staticmethod
  def smileCart(
      # pylint: disable=invalid-name
      maxNodes: Optional[_arg_types.Integer] = None,
      minLeafPopulation: Optional[_arg_types.Integer] = None,
      # pylint: enable=invalid-name
  ) -> Classifier:
    """Returns an empty CART classifier.

    See: Classification and Regression Trees, L. Breiman, J. Friedman, R.
    Olshen, C. Stone Chapman and Hall, 1984.

    Args:
      maxNodes: The maximum number of leaf nodes in each tree. If unspecified,
        defaults to no limit.
      minLeafPopulation: Only create nodes whose training set contains at least
        this many points.
    """

    return apifunction.ApiFunction.call_(
        'Classifier.smileCart', maxNodes, minLeafPopulation
    )

  @staticmethod
  def smileGradientTreeBoost(
      numberOfTrees: _arg_types.Integer,  # pylint: disable=invalid-name
      shrinkage: Optional[_arg_types.Number] = None,
      # pylint: disable=invalid-name
      samplingRate: Optional[_arg_types.Number] = None,
      maxNodes: Optional[_arg_types.Integer] = None,
      # pylint: enable=invalid-name
      loss: Optional[_arg_types.String] = None,
      seed: Optional[_arg_types.Integer] = None,
  ) -> Classifier:
    """Returns an empty Gradient Tree Boost classifier.

    Args:
      numberOfTrees: The number of decision trees to create.
      shrinkage: The shrinkage parameter in (0, 1] controls the learning rate of
        procedure.
      samplingRate: The sampling rate for stochastic tree boosting.
      maxNodes: The maximum number of leaf nodes in each tree. If unspecified,
        defaults to no limit.
      loss: Loss function for regression. One of: LeastSquares,
        LeastAbsoluteDeviation, Huber.
      seed: The randomization seed.
    """

    return apifunction.ApiFunction.call_(
        'Classifier.smileGradientTreeBoost',
        numberOfTrees,
        shrinkage,
        samplingRate,
        maxNodes,
        loss,
        seed,
    )

  @staticmethod
  def smileKNN(
      k: Optional[_arg_types.Integer] = None,
      # pylint: disable-next=invalid-name
      searchMethod: Optional[_arg_types.String] = None,
      metric: Optional[_arg_types.String] = None,
  ) -> Classifier:
    # pyformat: disable
    """Returns an empty k-NN classifier.

    The k-nearest neighbor algorithm (k-NN) is a method for classifying objects
    by a majority vote of its neighbors, with the object being assigned to the
    class most common amongst its k nearest neighbors (k is a positive integer,
    typically small, typically odd).

    Args:
      k: The number of neighbors for classification.
      searchMethod: Search method. The following are valid: [AUTO,
        LINEAR_SEARCH, KD_TREE, COVER_TREE]. AUTO will choose between KD_TREE
        and COVER_TREE depending on the dimension count. Results may vary
        between the different search methods for distance ties and probability
        values. Since performance and results may vary consult with SMILE's
        documentation and other literature.
      metric: The distance metric to use. NOTE: KD_TREE (and AUTO for low
        dimensions) will not use the metric selected. Options are:
        * 'EUCLIDEAN' - Euclidean distance.
        * 'MAHALANOBIS' - Mahalanobis distance.
        * 'MANHATTAN' - Manhattan distance.
        * 'BRAYCURTIS' - Bray-Curtis distance.
    """
    # pyformat: enable

    return apifunction.ApiFunction.call_(
        'Classifier.smileKNN', k, searchMethod, metric
    )

  @staticmethod
  def smileNaiveBayes(
      lambda_: Optional[_arg_types.Number] = None, **kwargs
  ) -> Classifier:
    # pylint: disable=g-doc-args
    """Returns an empty Naive Bayes classifier.

    This classifier assumes that the feature vector consists of positive
    integers, and negative inputs are discarded.

    Args:
      lambda: A smoothing lambda. Used to avoid assigning zero probability to
        classes not seen during training, instead using lambda / (lambda *
        nFeatures).
    """
    # pylint: enable=g-doc-args
    if kwargs:
      if kwargs.keys() != {'lambda'}:
        raise ValueError(
            f'Unexpected arguments: {list(kwargs.keys())}. Expected: lambda.'
        )
      lambda_ = kwargs['lambda']

    return apifunction.ApiFunction.call_('Classifier.smileNaiveBayes', lambda_)

  @staticmethod
  def smileRandomForest(
      # pylint: disable=invalid-name
      numberOfTrees: _arg_types.Integer,
      variablesPerSplit: Optional[_arg_types.Integer] = None,
      minLeafPopulation: Optional[_arg_types.Integer] = None,
      bagFraction: Optional[_arg_types.Number] = None,
      maxNodes: Optional[_arg_types.Integer] = None,
      # pylint: enable=invalid-name
      seed: Optional[_arg_types.Integer] = None,
  ) -> Classifier:
    """Returns an empty Random Forest classifier.

    Args:
      numberOfTrees: The number of decision trees to create.
      variablesPerSplit: The number of variables per split. If unspecified, uses
        the square root of the number of variables.
      minLeafPopulation: Only create nodes whose training set contains at least
        this many points.
      bagFraction: The fraction of input to bag per tree.
      maxNodes: The maximum number of leaf nodes in each tree. If unspecified,
        defaults to no limit.
      seed: The randomization seed.
    """

    return apifunction.ApiFunction.call_(
        'Classifier.smileRandomForest',
        numberOfTrees,
        variablesPerSplit,
        minLeafPopulation,
        bagFraction,
        maxNodes,
        seed,
    )

  @staticmethod
  def spectralRegion(
      coordinates: _arg_types.List, schema: Optional[_arg_types.List] = None
  ) -> Classifier:
    """Returns a spectral region classifier.

    Creates a classifier that tests if its inputs lie within a polygon defined
    by a set  of coordinates in an arbitrary 2D coordinate system. Each input to
    be classified  must have 2 values (e.g., images must have 2 bands). The
    result will be 1 wherever  the input values are contained within the given
    polygon and 0 otherwise.

    Args:
      coordinates: The coordinates of the polygon, as a list of rings. Each ring
        is a list of coordinate pairs (e.g., [u1, v1, u2, v2, ..., uN, vN]). No
        edge may intersect any other edge. The resulting classification will be
        a 1 wherever the input values are within the interior of the given
        polygon, that is, an odd number of polygon edges must be crossed to get
        outside the polygon and 0 otherwise.
      schema: The classifier's schema. A list of band or property names that the
        classifier will operate on. Since this classifier doesn't undergo a
        training step, these have to be specified manually. Defaults to ['u',
        'v'].
    """

    return apifunction.ApiFunction.call_(
        'Classifier.spectralRegion', coordinates, schema
    )

  def train(
      # classifier: _ClassifierType,
      self,
      features: _arg_types.FeatureCollection,
      # pylint: disable=invalid-name
      classProperty: _arg_types.String,
      inputProperties: Optional[_arg_types.List] = None,
      # pylint: enable=invalid-name
      subsampling: Optional[_arg_types.Number] = None,
      # pylint: disable-next=invalid-name
      subsamplingSeed: Optional[_arg_types.Integer] = None,
  ) -> Classifier:
    """Returns a trained classifier.

    Trains the classifier on a collection of features, using the specified
    numeric properties of each feature as training data. The geometry of the
    features is ignored.

    Args:
      features: The collection to train on.
      classProperty: The name of the property containing the class value. Each
        feature must have this property and its value must be numeric.
      inputProperties: The list of property names to include as training data.
        Each feature must have all these properties and their values must be
        numeric. This argument is optional if the input collection contains a
        'band_order' property, (as produced by Image.sample).
      subsampling: An optional subsampling factor, within (0, 1].
      subsamplingSeed: A randomization seed to use for subsampling.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.train',
        self,
        features,
        classProperty,
        inputProperties,
        subsampling,
        subsamplingSeed,
    )
