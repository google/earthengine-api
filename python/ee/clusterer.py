"""A wrapper for Clusterers."""
from __future__ import annotations

from typing import Optional

from ee import _arg_types
from ee import apifunction
from ee import computedobject
from ee import ee_list


class Clusterer(computedobject.ComputedObject):
  """An object to represent an Earth Engine Clusterer.

  Example:
    # Load a pre-computed Landsat composite for input.
    input_img = ee.Image('LANDSAT/LE7_TOA_1YEAR/2001')

    # Define a region in which to generate a sample of the input.
    region = ee.Geometry.Rectangle(29.7, 30, 32.5, 31.7)

    # Make the training dataset.
    training = input_img.sample(region=region, scale=30, numPixels=5000)

    # Instantiate the clusterer and train it.
    clusterer = ee.Clusterer.wekaKMeans(15).train(training)

    # Cluster the input using the trained clusterer.
    result = input_img.cluster(clusterer)
  """

  _initialized: bool = False

  def __init__(
      self,
      clusterer: computedobject.ComputedObject,
  ):
    """Creates a Clusterer wrapper.

    Args:
      clusterer: A Clusterer to cast.
    """
    self.initialize()

    if isinstance(clusterer, computedobject.ComputedObject):
      # There is no server-side constructor for ee.Clusterer. Pass the object
      # as-is to the server in case it is intended to be a Clusterer cast.
      super().__init__(clusterer.func, clusterer.args, clusterer.varName)
      return

    raise TypeError(
        'Clusterer can only be used as a cast to Clusterer. Found'
        f' {type(clusterer)}.'
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
    return 'Clusterer'

  # TODO: The Optional is suspect. The return from schema is
  # never None, but the .getInfo() of the result can be None.
  def schema(self) -> Optional[ee_list.List]:
    """Returns the names of the inputs used by this Clusterer.

    Or None if this Clusterer has not had any training data added yet.
    """

    return apifunction.ApiFunction.call_(self.name() + '.schema', self)

  def train(
      self,
      features: _arg_types.FeatureCollection,
      # pylint: disable-next=invalid-name
      inputProperties: Optional[_arg_types.List] = None,
      subsampling: Optional[_arg_types.Number] = None,
      # pylint: disable-next=invalid-name
      subsamplingSeed: Optional[_arg_types.Integer] = None,
  ) -> Clusterer:
    """Returns a trained Clusterer.

    Trains the Clusterer on a collection of features using the specified
    numeric properties of each feature as training data. The geometry of the
    features is ignored.

    Args:
      features: The collection to train on.
      inputProperties: The list of property names to include as training data.
        Each feature must have all these properties, and their values must be
        numeric. This argument is optional if the input collection contains a
        'band_order' property (as produced by Image.sample).
      subsampling: An optional subsampling factor, within (0, 1].
      subsamplingSeed: A randomization seed to use for subsampling.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.train',
        self,
        features,
        inputProperties,
        subsampling,
        subsamplingSeed,
    )

  @staticmethod
  def wekaCascadeKMeans(
      # pylint: disable=invalid-name
      minClusters: Optional[_arg_types.Integer] = None,
      maxClusters: Optional[_arg_types.Integer] = None,
      # pylint: disable-next=invalid-name
      restarts: Optional[_arg_types.Integer] = None,
      manual: Optional[_arg_types.Bool] = None,
      init: Optional[_arg_types.Bool] = None,
      # pylint: disable=invalid-name
      distanceFunction: Optional[_arg_types.String] = None,
      maxIterations: Optional[_arg_types.Integer] = None,
      # pylint: disable-next=invalid-name
  ) -> Clusterer:
    """Returns a weka Cascade K-Means Clusterer.

    Cascade simple k-means, selects the best k according to the
    Calinski-Harabasz criterion. For more information see:
    Calinski, T. and J. Harabasz. 1974. A dendrite method for cluster analysis,
    Commun. Stat. 3: 1-27.

    Args:
      minClusters: Min number of clusters.
      maxClusters: Max number of clusters.
      restarts: Number of restarts.
      manual: Manually select the number of clusters.
      init: Set whether to initialize using the probabilistic farthest first
        like method of the k-means++ algorithm (rather than the standard random
        selection of initial cluster centers).
      distanceFunction: Distance function to use. Options are: Euclidean and
        Manhattan.
      maxIterations: Maximum number of iterations for k-means.
    """

    return apifunction.ApiFunction.call_(
        'Clusterer.wekaCascadeKMeans',
        minClusters,
        maxClusters,
        restarts,
        manual,
        init,
        distanceFunction,
        maxIterations,
    )

  @staticmethod
  def wekaCobweb(
      acuity: Optional[_arg_types.Number] = None,
      cutoff: Optional[_arg_types.Number] = None,
      seed: Optional[_arg_types.Integer] = None,
  ) -> Clusterer:
    """Returns a weka Cobweb Clusterer.

    Implementation of the Cobweb clustering algorithm. For more information see:
    D. Fisher (1987). Knowledge acquisition via incremental conceptual
    clustering. Machine Learning. 2(2):139-172. and J. H. Gennari, P. Langley,
    D. Fisher (1990). Models of incremental concept formation. Artificial
    Intelligence. 40:11-61.

    Args:
      acuity: Acuity (minimum standard deviation).
      cutoff: Cutoff (minimum category utility).
      seed: Random number seed.
    """

    return apifunction.ApiFunction.call_(
        'Clusterer.wekaCobweb', acuity, cutoff, seed
    )

  @staticmethod
  def wekaKMeans(
      nClusters: _arg_types.Integer,  # pylint: disable=invalid-name
      init: Optional[_arg_types.Integer] = None,
      canopies: Optional[_arg_types.Bool] = None,
      # pylint: disable=invalid-name
      maxCandidates: Optional[_arg_types.Integer] = None,
      periodicPruning: Optional[_arg_types.Integer] = None,
      minDensity: Optional[_arg_types.Integer] = None,
      # pylint: enable=invalid-name
      t1: Optional[_arg_types.Number] = None,
      t2: Optional[_arg_types.Number] = None,
      # pylint: disable=invalid-name
      distanceFunction: Optional[_arg_types.String] = None,
      maxIterations: Optional[_arg_types.Integer] = None,
      preserveOrder: Optional[_arg_types.Bool] = None,
      # pylint: enable=invalid-name
      fast: Optional[_arg_types.Bool] = None,
      seed: Optional[_arg_types.Integer] = None,
  ) -> Clusterer:
    """Returns a weka K-Means Clusterer.

    Cluster data using the k-means algorithm. Can use either the Euclidean
    distance (default) or the Manhattan distance. If the Manhattan distance is
    used, then centroids are computed as the component-wise median rather than
    mean. For more information see: D. Arthur, S. Vassilvitskii: k-means++: the
    advantages of careful seeding. In: Proceedings of the eighteenth annual
    ACM-SIAM symposium on Discrete algorithms, 1027-1035, 2007.

    Args:
      nClusters: Number of clusters.
      init: Initialization method to use. 0 = random, 1 = k-means++, 2 = canopy,
        3 = farthest first.
      canopies: Use canopies to reduce the number of distance calculations.
      maxCandidates: Maximum number of candidate canopies to retain in memory at
        any one time when using canopy clustering. T2 distance plus, data
        characteristics, will determine how many candidate canopies are formed
        before periodic and final pruning are performed, which might result in
        exceess memory consumption. This setting avoids large numbers of
        candidate canopies consuming memory.
      periodicPruning: How often to prune low density canopies when using canopy
        clustering.
      minDensity: Minimum canopy density, when using canopy clustering, below
        which a canopy will be pruned during periodic pruning.
      t1: The T1 distance to use when using canopy clustering. A value < 0 is
        taken as a positive multiplier for T2.
      t2: The T2 distance to use when using canopy clustering. Values < 0 cause
        a heuristic based on attribute std. deviation to be used.
      distanceFunction: Distance function to use. Options are: Euclidean and
        Manhattan.
      maxIterations: Maximum number of iterations.
      preserveOrder: Preserve order of instances.
      fast: Enables faster distance calculations, using cut-off values. Disables
        the calculation/output of squared errors/distances.
      seed: The randomization seed.
    """

    return apifunction.ApiFunction.call_(
        'Clusterer.wekaKMeans',
        nClusters,
        init,
        canopies,
        maxCandidates,
        periodicPruning,
        minDensity,
        t1,
        t2,
        distanceFunction,
        maxIterations,
        preserveOrder,
        fast,
        seed,
    )

  @staticmethod
  def wekaLVQ(
      # pylint: disable=invalid-name
      numClusters: Optional[_arg_types.Integer] = None,
      learningRate: Optional[_arg_types.Number] = None,
      # pylint: enable=invalid-name
      epochs: Optional[_arg_types.Integer] = None,
      # pylint: disable-next=invalid-name
      normalizeInput: Optional[_arg_types.Bool] = None,
  ) -> Clusterer:
    """Returns a weka Learning Vector Quantization (LVQ) Clusterer.

    A Clusterer that implements the Learning Vector Quantization algorithm. For
    more details, see: T. Kohonen, "Learning Vector Quantization", The Handbook
    of Brain Theory and Neural Networks, 2nd Edition, MIT Press, 2003, pp.
    631-634.

    Args:
      numClusters: The number of clusters.
      learningRate: The learning rate for the training algorithm. Value should
        be greater than 0 and less or equal to 1.
      epochs: Number of training epochs. Value should be greater than or equal
        to 1.
      normalizeInput: Skip normalizing the attributes.
    """

    return apifunction.ApiFunction.call_(
        'Clusterer.wekaLVQ', numClusters, learningRate, epochs, normalizeInput
    )

  @staticmethod
  def wekaXMeans(
      # pylint: disable=invalid-name
      minClusters: Optional[_arg_types.Integer] = None,
      maxClusters: Optional[_arg_types.Integer] = None,
      maxIterations: Optional[_arg_types.Integer] = None,
      maxKMeans: Optional[_arg_types.Integer] = None,
      maxForChildren: Optional[_arg_types.Integer] = None,
      useKD: Optional[_arg_types.Bool] = None,
      cutoffFactor: Optional[_arg_types.Number] = None,
      distanceFunction: Optional[_arg_types.String] = None,
      # pylint: enable=invalid-name
      seed: Optional[_arg_types.Integer] = None,
  ) -> Clusterer:
    """Returns a weka X-Means Clusterer.

    X-Means is K-Means with an efficient estimation of the number of clusters.
    For more information see: Dan Pelleg, Andrew W. Moore: X-means: Extending
    K-means with Efficient Estimation of the Number of Clusters. In: Seventeenth
    International Conference on Machine Learning, 727-734, 2000.

    Args:
      minClusters: Minimum number of clusters.
      maxClusters: Maximum number of clusters.
      maxIterations: Maximum number of overall iterations.
      maxKMeans: The maximum number of iterations to perform in KMeans.
      maxForChildren: The maximum number of iterations in KMeans that is
        performed on the child centers.
      useKD: Use a KDTree.
      cutoffFactor: Takes the given percentage of the split centroids if none of
        the children win.
      distanceFunction: Distance function to use. Options are: Chebyshev,
        Euclidean, and Manhattan.
      seed: The randomization seed.
    """

    return apifunction.ApiFunction.call_(
        'Clusterer.wekaXMeans',
        minClusters,
        maxClusters,
        maxIterations,
        maxKMeans,
        maxForChildren,
        useKD,
        cutoffFactor,
        distanceFunction,
        seed,
    )
