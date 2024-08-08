"""A wrapper for Reducers."""
from __future__ import annotations

from typing import Optional

from ee import _arg_types
from ee import apifunction
from ee import computedobject
from ee import deprecation
from ee import ee_list


class Reducer(computedobject.ComputedObject):
  """An object to represent an Earth Engine Reducer.

  Example:
    fc = ee.FeatureCollection([
        ee.Feature(None, {'label': 1}),
        ee.Feature(None, {'label': 2}),
    ])
    reducer = ee.Reducer(ee.Reducer.toList())
    result = fc.reduceColumns(reducer, ['label']).get('list')
    print(result.getInfo())
  """

  _initialized: bool = False

  def __init__(
      self,
      reducer: computedobject.ComputedObject,
  ):
    """Creates a Reducer wrapper.

    Args:
      reducer: A reducer to cast.
    """
    self.initialize()

    if isinstance(reducer, computedobject.ComputedObject):
      # There is no server-side constructor for ee.Reducer. Pass the object
      # as-is to the server in case it is intended to be a Reducer cast.
      super().__init__(reducer.func, reducer.args, reducer.varName)
      return

    raise TypeError(
        f'Reducer can only be used as a cast to Reducer. Found {type(reducer)}.'
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
    return 'Reducer'

  @staticmethod
  def allNonZero() -> Reducer:
    """Returns a Reducer that returns 1 if all inputs are not 0.

    Otherwise, it returns 0.

    Where applicable, the output name is "all".
    """

    return apifunction.ApiFunction.call_('Reducer.allNonZero')

  @staticmethod
  @deprecation.Deprecated('Use Reducer.allNonZero().')
  def And() -> Reducer:
    """Returns a Reducer that returns 1 if all inputs are not 0.

    Otherwise, it returns 0.

    Where applicable, the output name is "all".
    """

    return apifunction.ApiFunction.call_('Reducer.and')

  @staticmethod
  def anyNonZero() -> Reducer:
    """Returns a Reducer that returns 1 if any of its inputs are not 0.

    Otherwise, it returns 0.

    Where applicable, the output name is "any".
    """

    return apifunction.ApiFunction.call_('Reducer.anyNonZero')

  @staticmethod
  def autoHistogram(
      # pylint: disable=invalid-name
      maxBuckets: Optional[_arg_types.Integer] = None,
      minBucketWidth: Optional[_arg_types.Number] = None,
      maxRaw: Optional[_arg_types.Integer] = None,
      # pylint: enable=invalid-name
      cumulative: Optional[_arg_types.Bool] = None,
  ) -> Reducer:
    """Returns an ee.Reducer that computes a histogram of the inputs.

    The output is a Nx2 array of the lower bucket bounds and the counts (or
    cumulative counts) of each bucket and is suitable for use per-pixel.

    Args:
      maxBuckets: The maximum number of buckets to use when building a
        histogram; will be rounded up to a power of 2.
      minBucketWidth: The minimum histogram bucket width, or null to allow any
        power of 2.
      maxRaw: The number of values to accumulate before building the initial
        histogram.
      cumulative: When true, generates a cumulative histogram.
    """

    return apifunction.ApiFunction.call_(
        'Reducer.autoHistogram',
        maxBuckets,
        minBucketWidth,
        maxRaw,
        cumulative,
    )

  @staticmethod
  def bitwiseAnd() -> Reducer:
    """Returns a Reducer that computes the bitwise-and summation of its inputs.

    Where applicable, the output name is "bitwiseAnd".
    """

    return apifunction.ApiFunction.call_('Reducer.bitwiseAnd')

  @staticmethod
  def bitwiseOr() -> Reducer:
    """Returns a Reducer that computes the bitwise-or summation of its inputs.

    Where applicable, the output name is "bitwiseOr".
    """

    return apifunction.ApiFunction.call_('Reducer.bitwiseOr')

  @staticmethod
  def centeredCovariance() -> Reducer:
    """Returns a centered covariance reducer.

    Creates a reducer that reduces some number of 1-D arrays of the same length
    N to a covariance matrix of shape NxN.

    WARNING: this reducer requires that the data has been mean centered.
    """

    return apifunction.ApiFunction.call_('Reducer.centeredCovariance')

  @staticmethod
  def circularMean() -> Reducer:
    """Returns a circular mean reducer.

    Returns a Reducer that computes the (weighted) circular mean of its inputs,
    which are expected to be in radians.

    Output will be in the range (-π to π). Where applicable, the output name is
    "circularMean".
    """

    return apifunction.ApiFunction.call_('Reducer.circularMean')

  @staticmethod
  def circularStddev() -> Reducer:
    """Returns a circular standard deviation reducer.

    Returns a reducer that computes the (weighted) circular standard deviation
    of its inputs, which are expected to be in radians, using the formula
    sqrt(-2 * ln(R)).

    Where applicable, the output name is "circularStdDev".
    """

    return apifunction.ApiFunction.call_('Reducer.circularStddev')

  @staticmethod
  def circularVariance() -> Reducer:
    """Returns a circular variance Reducer.

    Returns a Reducer that computes the (weighted) circular variance of its
    inputs, which are expected to be in radians.

    Where applicable, the output name is "circularVariance".
    """

    return apifunction.ApiFunction.call_('Reducer.circularVariance')

  def combine(
      self,
      reducer2: _arg_types.Reducer,
      # pylint: disable=invalid-name
      outputPrefix: Optional[_arg_types.String] = None,
      sharedInputs: Optional[_arg_types.Bool] = None,
      # pylint: enable=invalid-name
  ) -> Reducer:
    """Returns a Reducer that runs two reducers in parallel.

    The combined reducer's outputs will be those of reducer1 followed by those
    of reducer2, where the output names of reducer2 are prefixed with the given
    string.

    If sharedInputs is true, the reducers must have the same number of inputs,
    and the combined reducer's will match them; if it is false, the inputs of
    the combined reducer will be those of reducer1 followed by those of
    reducer2.

    Args:
      reducer2: The second reducer.
      outputPrefix: Prefix for reducer2's output names.
      sharedInputs: Whether the reducers share inputs.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.combine',
        self,
        reducer2,
        outputPrefix,
        sharedInputs,
    )

  @staticmethod
  def count() -> Reducer:
    """Returns a Reducer that computes the number of non-null inputs.

    Where applicable, the output name is "count".
    """

    return apifunction.ApiFunction.call_('Reducer.count')

  @staticmethod
  def countDistinct() -> Reducer:
    """Returns a Reducer that computes the number of distinct inputs.

    Where applicable, the output name is "count".
    """

    return apifunction.ApiFunction.call_('Reducer.countDistinct')

  @staticmethod
  def countDistinctNonNull() -> Reducer:
    """Returns a Reducer that computes the number of distinct inputs, ignoring nulls.

    Where applicable, the output name is "count".
    """

    return apifunction.ApiFunction.call_('Reducer.countDistinctNonNull')

  @staticmethod
  def countEvery() -> Reducer:
    """Returns a Reducer that computes the number of inputs.

    Where applicable, the output name is "count".
    """

    return apifunction.ApiFunction.call_('Reducer.countEvery')

  @staticmethod
  def countRuns() -> Reducer:
    """Returns a Reducer that computes the number of runs of distinct, non-null inputs.

    Where applicable, the output name is "count".
    """

    return apifunction.ApiFunction.call_('Reducer.countRuns')

  @staticmethod
  def covariance() -> Reducer:
    """Returns a covariance reducer.

    Creates a reducer that reduces some number of 1-D arrays of the same length
    N to a covariance matrix of shape NxN.

    This reducer uses the one-pass covariance formula from Sandia National
    Laboratories Technical Report SAND2008-6212, which can lose accuracy if the
    values span a large range.
    """

    return apifunction.ApiFunction.call_('Reducer.covariance')

  def disaggregate(self, axis: Optional[_arg_types.Integer] = None) -> Reducer:
    """Returns a Reducer that separates aggregate inputs.

    Separates aggregate inputs (Arrays, Lists, or Dictionaries) into individual
    items that are then each passed to the specified reducer. When used on
    dictionaries, the dictionary keys are ignored. Non-aggregated inputs (e.g.,
    numbers or strings) are passed to the underlying reducer directly.

    Args:
      axis: If specified, indicates an array axis along which to disaggregate.
        If not specified, arrays are completely disaggregated. Ignored for
        non-array types.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.disaggregate', self, axis
    )

  @staticmethod
  def first() -> Reducer:
    """Returns a Reducer that returns the first of its inputs.

    Where applicable, the output name is "first".
    """

    return apifunction.ApiFunction.call_('Reducer.first')

  @staticmethod  # pylint: disable=staticmethod-use
  def firstNonNull() -> Reducer:
    """Returns a Reducer that returns the first of its non-null inputs.

    Where applicable, the output name is "first".
    """

    return apifunction.ApiFunction.call_('Reducer.firstNonNull')

  @staticmethod
  def fixed2DHistogram(
      # pylint: disable=invalid-name
      xMin: _arg_types.Number,
      xMax: _arg_types.Number,
      xSteps: _arg_types.Integer,
      yMin: _arg_types.Number,
      yMax: _arg_types.Number,
      ySteps: _arg_types.Integer,
      # pylint: enable=invalid-name
  ) -> Reducer:
    """Returns a fixed 2D histogram reducer.

    Creates a reducer that will compute a 2D histogram of the inputs using a
    fixed number of fixed width bins. Values outside of the [min, max) range on
    either axis are ignored. The output is a 2D array of counts, and 2 1-D
    arrays of bucket lower edges for the xAxis and the yAxis. This reducer is
    suitable for use per-pixel, however it is always unweighted. The maximum
    count for any bucket is 2^31 - 1.

    Args:
      xMin: The lower (inclusive) bound of the first bucket on the X axis.
      xMax: The upper (exclusive) bound of the last bucket on the X axis.
      xSteps: The number of buckets to use on the X axis.
      yMin: The lower (inclusive) bound of the first bucket on the Y axis.
      yMax: The upper (exclusive) bound of the last bucket on the Y axis.
      ySteps: The number of buckets to use on the Y axis.
    """

    return apifunction.ApiFunction.call_(
        'Reducer.fixed2DHistogram', xMin, xMax, xSteps, yMin, yMax, ySteps
    )

  @staticmethod
  def fixedHistogram(
      min: _arg_types.Number,  # pylint: disable=redefined-builtin
      max: _arg_types.Number,  # pylint: disable=redefined-builtin
      steps: _arg_types.Integer,
      cumulative: Optional[_arg_types.Bool] = None,
  ) -> Reducer:
    """Returns a fixed histogram reducer.

    Creates a reducer that will compute a histogram of the inputs using a fixed
    number of fixed-width bins. Values outside of the [min, max) range are
    ignored. The output is a Nx2 array of bucket lower edges and counts (or
    cumulative counts) and is suitable for use per-pixel.

    Args:
      min: The lower (inclusive) bound of the first bucket.
      max: The upper (exclusive) bound of the last bucket.
      steps: The number of buckets to use.
      cumulative: When true, generates a cumulative histogram.
    """

    return apifunction.ApiFunction.call_(
        'Reducer.fixedHistogram', min, max, steps, cumulative
    )

  def forEach(
      self,
      outputNames: _arg_types.List,  # pylint: disable=invalid-name
  ) -> Reducer:
    """Returns a reducer that runs a reducer for each output name in the list.

    Creates a Reducer by combining a copy of the given reducer for each output
    name in the given list. If the reducer has a single output, the output names
    are used as-is; otherwise they are prefixed to the original output names.

    Args:
      outputNames: Which output names to use.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.forEach', self, outputNames
    )

  def forEachBand(
      self,
      image: _arg_types.Image,
  ) -> Reducer:
    """Returns a reducer that runs a reducer for each band in the image.

    Creates a Reducer by combining a copy of the given reducer for each band in
    the given image, using the band names as output names.

    Args:
      image: The image to use.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.forEachBand', self, image
    )

  def forEachElement(self) -> Reducer:
    """Returns a reducer that runs a reducer for each element in the input.

    Separately reduces each position in array inputs of equal shape, producing
    an array output of the same shape.

    For example, with the 'sum' reducer applied to 5 arrays with shape 2x2, the
    output will be a 2x2 array, where each position is the sum of the 5 values
    at that position.
    """

    return apifunction.ApiFunction.call_(self.name() + '.forEachElement', self)

  @staticmethod
  def frequencyHistogram() -> Reducer:
    """Returns a Reducer that returns a weighted frequency table of its inputs.

    Where applicable, the output name is "histogram".
    """

    return apifunction.ApiFunction.call_('Reducer.frequencyHistogram')

  @staticmethod
  def geometricMedian(
      numX: _arg_types.Integer,  # pylint: disable=invalid-name
      eta: Optional[_arg_types.Number] = None,
      # pylint: disable-next=invalid-name
      initialStepSize: Optional[_arg_types.Number] = None,
  ) -> Reducer:
    """Returns a reducer that computes the geometric median across the inputs.

    Args:
      numX: The number of input dimensions.
      eta: The minimum improvement in the solution used as a stopping criteria
        for the solver.
      initialStepSize: The initial step size used in the solver.
    """

    return apifunction.ApiFunction.call_(
        'Reducer.geometricMedian', numX, eta, initialStepSize
    )

  def getOutputs(self) -> ee_list.List:
    """Returns a list of the output names of the given reducer."""

    return apifunction.ApiFunction.call_(self.name() + '.getOutputs', self)

  def group(
      self,
      groupField: Optional[_arg_types.Integer] = None,
      groupName: Optional[_arg_types.String] = None,
  ) -> Reducer:
    """Returns a reducer groups reducer records by the value of a given input.

    Reduces each group with the given reducer.

    Args:
      groupField: The field that contains record groups.
      groupName: The dictionary key that contains the group. Defaults to
        'group'.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.group', self, groupField, groupName
    )

  @staticmethod
  def histogram(
      # pylint: disable=invalid-name
      maxBuckets: Optional[_arg_types.Integer] = None,
      minBucketWidth: Optional[_arg_types.Number] = None,
      maxRaw: Optional[_arg_types.Integer] = None,
      # pylint: enable=invalid-name
  ) -> Reducer:
    """Returns a reducer that will compute a histogram of the inputs.

    Args:
      maxBuckets: The maximum number of buckets to use when building a
        histogram; will be rounded up to a power of 2.
      minBucketWidth: The minimum histogram bucket width, or null to allow any
        power of 2.
      maxRaw: The number of values to accumulate before building the initial
        histogram.
    """

    return apifunction.ApiFunction.call_(
        'Reducer.histogram', maxBuckets, minBucketWidth, maxRaw
    )

  @staticmethod
  def intervalMean(
      # pylint: disable=invalid-name
      minPercentile: _arg_types.Number,
      maxPercentile: _arg_types.Number,
      maxBuckets: Optional[_arg_types.Integer] = None,
      minBucketWidth: Optional[_arg_types.Number] = None,
      maxRaw: Optional[_arg_types.Integer] = None,
      # pylint: enable=invalid-name
  ) -> Reducer:
    """Returns an interval mean reducer.

    Creates a Reducer to compute the mean of all inputs in the specified
    percentile range. For small numbers of inputs (up to maxRaw) the mean will
    be computed directly; for larger numbers of inputs the mean will be derived
    from a histogram.

    Args:
      minPercentile: The lower bound of the percentile range.
      maxPercentile: The upper bound of the percentile range.
      maxBuckets: The maximum number of buckets to use when building a
        histogram; will be rounded up to a power of 2.
      minBucketWidth: The minimum histogram bucket width, or null to allow any
        power of 2.
      maxRaw: The number of values to accumulate before building the initial
        histogram.
    """

    return apifunction.ApiFunction.call_(
        'Reducer.intervalMean',
        minPercentile,
        maxPercentile,
        maxBuckets,
        minBucketWidth,
        maxRaw,
    )

  @staticmethod
  def kendallsCorrelation(
      # pylint: disable-next=invalid-name
      numInputs: Optional[_arg_types.Integer] = None,
  ) -> Reducer:
    """Returns a reducer that computes the Kendall's Tau-b rank correlation.

    A positive tau value indicates an increasing trend; negative value indicates
    a decreasing trend. See
    https://commons.apache.org/proper/commons-math/javadocs/api-3.6.1/org/apache/commons/math3/stat/correlation/KendallsCorrelation.html
    for details.

    Args:
      numInputs: The number of inputs to expect (1 or 2). If 1 is specified,
        automatically generates sequence numbers for the x value (meaning there
        can be no ties).
    """

    return apifunction.ApiFunction.call_(
        'Reducer.kendallsCorrelation', numInputs
    )

  @staticmethod
  def kurtosis() -> Reducer:
    """Returns a Reducer that Computes the kurtosis of its inputs.

    Where applicable, the output name is "kurtosis".
    """

    return apifunction.ApiFunction.call_('Reducer.kurtosis')

  @staticmethod
  def last() -> Reducer:
    """Returns a Reducer that returns the last of its inputs.

    Where applicable, the output name is "last".
    """

    return apifunction.ApiFunction.call_('Reducer.last')

  @staticmethod
  def lastNonNull() -> Reducer:
    """Returns a Reducer that returns the last of its non-null inputs.

    Where applicable, the output name is "last".
    """

    return apifunction.ApiFunction.call_('Reducer.lastNonNull')

  @staticmethod
  def linearFit() -> Reducer:
    """Returns a linear fit reducer.

    Returns a Reducer that computes the slope and offset for a (weighted) linear
    regression of 2 inputs.

    The inputs are expected to be x data followed by y data. Where applicable,
    the outputs are named: "scale", "offset".
    """

    return apifunction.ApiFunction.call_('Reducer.linearFit')

  @staticmethod
  def linearRegression(
      numX: _arg_types.Integer,  # pylint: disable=invalid-name
      numY: Optional[_arg_types.Integer] = None,  # pylint: disable=invalid-name
  ) -> Reducer:
    """Returns a linear regression reducer.

    Creates a reducer that computes a linear least squares regression with numX
    independent variables and numY dependent variables.

    Each input tuple will have values for the independent variables followed by
    the dependent variables.

    The first output is a coefficients array with dimensions (numX, numY); each
    column contains the coefficients for the corresponding dependent variable.
    The second output is a vector of the root mean square of the residuals of
    each dependent variable. Both outputs are null if the system is
    underdetermined, e.g., the number of inputs is less than or equal to numX.

    Args:
      numX: The number of input dimensions.
      numY: The number of output dimensions.
    """

    return apifunction.ApiFunction.call_('Reducer.linearRegression', numX, numY)

  @staticmethod
  def max(
      # pylint: disable-next=invalid-name
      numInputs: Optional[_arg_types.Integer] = None,
  ) -> Reducer:
    """Returns a reducer that outputs the maximum value of its (first) input.

    If numInputs is greater than one, also outputs the corresponding values of
    the additional inputs.

    Args:
      numInputs: The number of inputs.
    """

    return apifunction.ApiFunction.call_('Reducer.max', numInputs)

  @staticmethod
  def mean() -> Reducer:
    """Returns a Reducer that computes the weighted arithmetic mean.

    Where applicable, the output name is "mean".
    """

    return apifunction.ApiFunction.call_('Reducer.mean')

  @staticmethod
  def median(
      # pylint: disable=invalid-name
      maxBuckets: Optional[_arg_types.Integer] = None,
      minBucketWidth: Optional[_arg_types.Number] = None,
      maxRaw: Optional[_arg_types.Integer] = None,
      # pylint: enable=invalid-name
  ) -> Reducer:
    """Returns a reducer that will compute the median of the inputs.

    For small numbers of inputs (up to maxRaw) the median will be computed
    directly; for larger numbers of inputs the median will be derived from a
    histogram.

    Args:
      maxBuckets: The maximum number of buckets to use when building a
        histogram; will be rounded up to a power of 2.
      minBucketWidth: The minimum histogram bucket width, or null to allow any
        power of 2.
      maxRaw: The number of values to accumulate before building the initial
        histogram.
    """

    return apifunction.ApiFunction.call_(
        'Reducer.median', maxBuckets, minBucketWidth, maxRaw
    )

  @staticmethod
  def min(
      # pylint: disable-next=invalid-name
      numInputs: Optional[_arg_types.Integer] = None,
  ) -> Reducer:
    """Returns a reducer that outputs the minimum value of its first input.

    If numInputs is greater than one, also outputs the corresponding values of
    the additional inputs.

    Args:
      numInputs: The number of inputs.
    """

    return apifunction.ApiFunction.call_('Reducer.min', numInputs)

  @staticmethod
  def minMax() -> Reducer:
    """Returns a Reducer that computes the minimum and maximum of its inputs.

    Where applicable, the outputs are named: "min", "max".
    """

    return apifunction.ApiFunction.call_('Reducer.minMax')

  @staticmethod
  def mode(
      # pylint: disable=invalid-name
      maxBuckets: Optional[_arg_types.Integer] = None,
      minBucketWidth: Optional[_arg_types.Number] = None,
      maxRaw: Optional[_arg_types.Integer] = None,
      # pylint: enable=invalid-name
  ) -> Reducer:
    """Returns a reducer that will compute the mode of the inputs.

    For small numbers of inputs (up to maxRaw) the mode will be computed
    directly; for larger numbers of inputs the mode will be derived from a
    histogram.

    Args:
      maxBuckets: The maximum number of buckets to use when building a
        histogram; will be rounded up to a power of 2.
      minBucketWidth: The minimum histogram bucket width, or null to allow any
        power of 2.
      maxRaw: The number of values to accumulate before building the initial
        histogram.
    """

    return apifunction.ApiFunction.call_(
        'Reducer.mode', maxBuckets, minBucketWidth, maxRaw
    )

  @staticmethod
  @deprecation.Deprecated('Use Reducer.anyNonZero().')
  def Or() -> Reducer:
    """Returns a Reducer that returns 1 if any inputs are not 0, 0 otherwise.

    Where applicable, the output name is "any".
    """

    return apifunction.ApiFunction.call_('Reducer.or')

  @staticmethod
  def pearsonsCorrelation() -> Reducer:
    """Returns a Pearson's correlation reducer.

    Creates a two-input reducer that computes Pearson's product-moment
    correlation coefficient and the 2-sided p-value test for correlation = 0.
    """

    return apifunction.ApiFunction.call_('Reducer.pearsonsCorrelation')

  @staticmethod
  def percentile(
      percentiles: _arg_types.List,
      # pylint: disable=invalid-name
      outputNames: Optional[_arg_types.List] = None,
      maxBuckets: Optional[_arg_types.Integer] = None,
      minBucketWidth: Optional[_arg_types.Number] = None,
      maxRaw: Optional[_arg_types.Integer] = None,
      # pylint: enable=invalid-name
  ) -> Reducer:
    """Returns a reducer that will compute the specified percentiles.

    For example,given [0, 50, 100] will produce outputs named 'p0', 'p50', and
    'p100' with the min, median, and max respectively. For small numbers of
    inputs (up to maxRaw) the percentiles will be computed directly; for larger
    numbers of inputs the percentiles will be derived from a histogram.

    Args:
      percentiles: A list of numbers between 0 and 100.
      outputNames: A list of names for the outputs, or null to get default
        names.
      maxBuckets: The maximum number of buckets to use when building a
        histogram; will be rounded up to a power of 2.
      minBucketWidth: The minimum histogram bucket width, or null to allow any
        power of 2.
      maxRaw: The number of values to accumulate before building the initial
        histogram.
    """

    return apifunction.ApiFunction.call_(
        'Reducer.percentile',
        percentiles,
        outputNames,
        maxBuckets,
        minBucketWidth,
        maxRaw,
    )

  @staticmethod
  def product() -> Reducer:
    """Returns a Reducer that computes the product of its inputs.

    Where applicable, the output name is "product".
    """

    return apifunction.ApiFunction.call_('Reducer.product')

  def repeat(self, count: _arg_types.Integer) -> Reducer:
    """Returns a reducer by combining the count copies of the reducer.

    Output names are the same as the given reducer, but each is a list of the
    corresponding output from each of the reducers.

    Args:
      count: The number of copies of the reducer to combine.
    """

    return apifunction.ApiFunction.call_(self.name() + '.repeat', self, count)

  @staticmethod
  def ridgeRegression(
      numX: _arg_types.Integer,  # pylint: disable=invalid-name
      numY: Optional[_arg_types.Integer] = None,  # pylint: disable=invalid-name
      lambda_: Optional[_arg_types.Number] = None,
      **kwargs,
  ) -> Reducer:
    # pylint: disable=g-doc-args
    """Returns a ridge regression reducer.

    Creates a reducer that computes a ridge regression with numX independent
    variables (not including constant) followed by numY dependent variables.
    Ridge regression is a form of Tikhonov regularization which shrinks the
    regression coefficients by imposing a penalty on their size. With this
    implementation of ridge regression there NO NEED to include a constant value
    for bias.

    The first output is a coefficients array with dimensions (numX + 1, numY);
    each column contains the coefficients for the corresponding dependent
    variable plus the intercept for the dependent variable in the last column.
    Additional outputs are a vector of the root mean square of the residuals of
    each dependent variable and a vector of p-values for each dependent
    variable. Outputs are null if the system is underdetermined, e.g., the
    number of inputs is less than numX + 1.

    Args:
      numX: the number of independent variables being regressed.
      numY: the number of dependent variables.
      lambda: Regularization parameter.
    """
    # pylint: enable=g-doc-args
    if kwargs:
      if lambda_ is not None:
        raise ValueError('lambda_ cannot be set when providing kwargs.')
      if kwargs.keys() != {'lambda'}:
        raise ValueError(
            f'Unexpected arguments: {list(kwargs.keys())}. Expected: lambda.'
        )
      lambda_ = kwargs['lambda']

    return apifunction.ApiFunction.call_(
        'Reducer.ridgeRegression', numX, numY, lambda_
    )

  @staticmethod
  def robustLinearRegression(
      numX: _arg_types.Integer,  # pylint: disable=invalid-name
      numY: Optional[_arg_types.Integer] = None,  # pylint: disable=invalid-name
      beta: Optional[_arg_types.Number] = None,
  ) -> Reducer:
    """Returns a robust linear regression reducer.

    Creates a reducer that computes a robust least squares regression with numX
    independent variables and numY dependent variables, using iteratively
    reweighted least squares with the Talwar cost function. A point is
    considered an outlier if the RMS of residuals is greater than beta.

    Each input tuple will have values for the independent variables followed by
    the dependent variables.

    The first output is a coefficients array with dimensions (numX, numY); each
    column contains the coefficients for the corresponding dependent variable.
    The second is a vector of the root mean square of the residuals of each
    dependent variable. Both outputs are null if the system is underdetermined,
    e.g., the number of inputs is less than numX.

    Args:
      numX: The number of input dimensions.
      numY: The number of output dimensions.
      beta: Residual error outlier margin. If null, a default value will be
        computed.
    """

    return apifunction.ApiFunction.call_(
        'Reducer.robustLinearRegression', numX, numY, beta
    )

  @staticmethod
  def sampleStdDev() -> Reducer:
    """Returns a reducer that computes the sample standard deviation.

    Where applicable, the output name is "stdDev".
    """

    return apifunction.ApiFunction.call_('Reducer.sampleStdDev')

  @staticmethod
  def sampleVariance() -> Reducer:
    """Returns a reducer that computes the sample variance of its inputs.

    Where applicable, the output name is "variance".
    """

    return apifunction.ApiFunction.call_('Reducer.sampleVariance')

  @staticmethod
  def sensSlope() -> Reducer:
    """Returns a two-input reducer that computes the Sen's slope estimator.

    The inputs are expected to be x data followed by y data. It returns two
    double values; the estimated slope and the offset.
    """

    return apifunction.ApiFunction.call_('Reducer.sensSlope')

  def setOutputs(self, outputs: _arg_types.List) -> Reducer:
    """Returns a reducer with outputs renamed and/or removed.

    Args:
      outputs: The new output names; any output whose name is null or empty will
        be dropped.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.setOutputs', self, outputs
    )

  @staticmethod
  def skew() -> Reducer:
    """Returns a reducer that Computes the skewness of its inputs.

    Where applicable, the output name is "skew".
    """

    return apifunction.ApiFunction.call_('Reducer.skew')

  @staticmethod
  def spearmansCorrelation() -> Reducer:
    """Returns a two-input Spearman's rank-moment correlation reducer.

    See
    https://commons.apache.org/proper/commons-math/javadocs/api-3.6/org/apache/commons/math3/stat/correlation/SpearmansCorrelation.html
    for details.
    """

    return apifunction.ApiFunction.call_('Reducer.spearmansCorrelation')

  def splitWeights(self) -> Reducer:
    """Returns a reducer that splits each weighted input into two unweighted inputs."""

    return apifunction.ApiFunction.call_(self.name() + '.splitWeights', self)

  @staticmethod
  def stdDev() -> Reducer:
    """Returns a Reducer that computes the standard deviation of its inputs.

    Where applicable, the output name is "stdDev".
    """

    return apifunction.ApiFunction.call_('Reducer.stdDev')

  @staticmethod
  def sum() -> Reducer:
    """Returns a Reducer that computes the (weighted) sum of its inputs.

    Where applicable, the output name is "sum".
    """

    return apifunction.ApiFunction.call_('Reducer.sum')

  @staticmethod
  def toCollection(
      # pylint: disable=invalid-name
      propertyNames: _arg_types.List,
      numOptional: Optional[_arg_types.Integer] = None,
      # pylint: enable=invalid-name
  ) -> Reducer:
    """Returns a reducer that collects its inputs into a FeatureCollection.

    Args:
      propertyNames: The property names that will be defined on each output
        feature; determines the number of reducer inputs.
      numOptional: The last numOptional inputs will be considered optional; the
        other inputs must be non-null or the input tuple will be dropped.
    """

    return apifunction.ApiFunction.call_(
        'Reducer.toCollection', propertyNames, numOptional
    )

  @staticmethod
  def toList(
      # pylint: disable=invalid-name
      tupleSize: Optional[_arg_types.Integer] = None,
      numOptional: Optional[_arg_types.Integer] = None,
      # pylint: enable=invalid-name
  ) -> Reducer:
    """Returns a reducer that collects its inputs into a list.

    Args:
      tupleSize: The size of each output tuple, or null for no grouping. Also
        determines the number of inputs (null tupleSize has 1 input).
      numOptional: The last numOptional inputs will be considered optional; the
        other inputs must be non-null or the input tuple will be dropped.
    """

    return apifunction.ApiFunction.call_(
        'Reducer.toList', tupleSize, numOptional
    )

  def unweighted(self) -> Reducer:
    """Returns a Reducer with no weighted inputs."""

    return apifunction.ApiFunction.call_(self.name() + '.unweighted', self)

  @staticmethod
  def variance() -> Reducer:
    """Returns a Reducer that computes the variance of its inputs.

    Where applicable, the output name is "variance".
    """

    return apifunction.ApiFunction.call_('Reducer.variance')
