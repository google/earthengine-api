#!/usr/bin/env python3
"""Tests for ee.Reducer module."""

import json
from typing import Any, Dict

import unittest
import ee
from ee import apitestcase

TO_LIST = 'Reducer.toList'


def make_expression_graph(
    function_invocation_value: Dict[str, Any],
) -> Dict[str, Any]:
  return {
      'result': '0',
      'values': {'0': {'functionInvocationValue': function_invocation_value}},
  }


class ReducerTest(apitestcase.ApiTestCase):

  def test_simple(self):
    reducer = ee.Reducer.toList()
    self.assertEqual({'value': 'fakeValue'}, reducer.getInfo())

    reducer_func = ee.ApiFunction.lookup(TO_LIST)
    self.assertEqual(reducer_func, reducer.func)

    self.assertFalse(reducer.isVariable())
    self.assertEqual({'numOptional': None, 'tupleSize': None}, reducer.args)

    result = json.loads(reducer.serialize())
    expect = {
        'result': '0',
        'values': {
            '0': {
                'functionInvocationValue': {
                    'functionName': TO_LIST,
                    'arguments': {},
                }
            }
        },
    }
    self.assertEqual(expect, result)

    cast_result = json.loads(ee.Reducer(reducer).serialize())
    self.assertEqual(expect, cast_result)

  def test_no_args(self):
    message = r"missing 1 required positional argument: 'reducer'"
    with self.assertRaisesRegex(TypeError, message):
      ee.Reducer()  # pytype: disable=missing-parameter

  def test_bad_arg_literal(self):
    message = (
        r"Reducer can only be used as a cast to Reducer. Found <class 'int'>\."
    )
    with self.assertRaisesRegex(TypeError, message):
      ee.Reducer(1)  # pytype: disable=wrong-arg-types

  def test_all_non_zero(self):
    expect = make_expression_graph(
        {'arguments': {}, 'functionName': 'Reducer.allNonZero'}
    )
    expression = ee.Reducer.allNonZero()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_and(self):
    expect = make_expression_graph(
        {'arguments': {}, 'functionName': 'Reducer.and'}
    )
    expression = ee.Reducer.And()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_anyNonZero(self):
    expect = make_expression_graph(
        {'arguments': {}, 'functionName': 'Reducer.anyNonZero'}
    )
    expression = ee.Reducer.anyNonZero()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_auto_histogram(self):
    max_buckets = 1
    min_bucket_width = 2
    max_raw = 3
    cumulative = True
    expect = make_expression_graph({
        'arguments': {
            'maxBuckets': {'constantValue': max_buckets},
            'minBucketWidth': {'constantValue': min_bucket_width},
            'maxRaw': {'constantValue': max_raw},
            'cumulative': {'constantValue': cumulative},
        },
        'functionName': 'Reducer.autoHistogram',
    })
    expression = ee.Reducer.autoHistogram(
        max_buckets, min_bucket_width, max_raw, cumulative
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Reducer.autoHistogram(
        maxBuckets=max_buckets,
        minBucketWidth=min_bucket_width,
        maxRaw=max_raw,
        cumulative=cumulative,
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_bitwise_and(self):
    expect = make_expression_graph({
        'arguments': {},
        'functionName': 'Reducer.bitwiseAnd',
    })
    expression = ee.Reducer.bitwiseAnd()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_bitwise_or(self):
    expect = make_expression_graph(
        {'arguments': {}, 'functionName': 'Reducer.bitwiseOr'}
    )
    expression = ee.Reducer.bitwiseOr()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_centered_covariance(self):
    expect = make_expression_graph(
        {'arguments': {}, 'functionName': 'Reducer.centeredCovariance'}
    )
    expression = ee.Reducer.centeredCovariance()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_circular_mean(self):
    expect = make_expression_graph(
        {'arguments': {}, 'functionName': 'Reducer.circularMean'}
    )
    expression = ee.Reducer.circularMean()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_circular_stddev(self):
    expect = make_expression_graph(
        {'arguments': {}, 'functionName': 'Reducer.circularStddev'}
    )
    expression = ee.Reducer.circularStddev()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_circular_variance(self):
    expect = make_expression_graph(
        {'arguments': {}, 'functionName': 'Reducer.circularVariance'}
    )
    expression = ee.Reducer.circularVariance()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_combine(self):
    reducer1 = ee.Reducer.first()
    reducer2 = ee.Reducer.last()
    output_prefix = 'a'
    shared_inputs = True
    expect = make_expression_graph({
        'arguments': {
            'reducer1': {
                'functionInvocationValue': {
                    'functionName': 'Reducer.first',
                    'arguments': {},
                }
            },
            'reducer2': {
                'functionInvocationValue': {
                    'functionName': 'Reducer.last',
                    'arguments': {},
                }
            },
            'outputPrefix': {'constantValue': output_prefix},
            'sharedInputs': {'constantValue': shared_inputs},
        },
        'functionName': 'Reducer.combine',
    })
    expression = reducer1.combine(
        reducer2, output_prefix, shared_inputs
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = reducer1.combine(
        reducer2=reducer2,
        outputPrefix=output_prefix,
        sharedInputs=shared_inputs,
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_count(self):
    expect = make_expression_graph(
        {'arguments': {}, 'functionName': 'Reducer.count'}
    )
    expression = ee.Reducer.count()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_count_distinct(self):
    expect = make_expression_graph(
        {'arguments': {}, 'functionName': 'Reducer.countDistinct'}
    )
    expression = ee.Reducer.countDistinct()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_count_distinct_non_null(self):
    expect = make_expression_graph(
        {'arguments': {}, 'functionName': 'Reducer.countDistinctNonNull'}
    )
    expression = ee.Reducer.countDistinctNonNull()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_count_every(self):
    expect = make_expression_graph(
        {'arguments': {}, 'functionName': 'Reducer.countEvery'}
    )
    expression = ee.Reducer.countEvery()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_count_runs(self):
    expect = make_expression_graph(
        {'arguments': {}, 'functionName': 'Reducer.countRuns'}
    )
    expression = ee.Reducer.countRuns()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_covariance(self):
    expect = make_expression_graph(
        {'arguments': {}, 'functionName': 'Reducer.covariance'}
    )
    expression = ee.Reducer.covariance()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_disaggregate(self):
    reducer = ee.Reducer.last()
    axis = 1
    expect = make_expression_graph({
        'arguments': {
            'reducer': {
                'functionInvocationValue': {
                    'functionName': 'Reducer.last',
                    'arguments': {},
                }
            },
            'axis': {'constantValue': axis},
        },
        'functionName': 'Reducer.disaggregate',
    })
    expression = reducer.disaggregate(axis)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = reducer.disaggregate(axis=axis)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_first(self):
    expect = make_expression_graph(
        {'arguments': {}, 'functionName': 'Reducer.first'}
    )
    expression = ee.Reducer.first()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_first_non_null(self):
    expect = make_expression_graph(
        {'arguments': {}, 'functionName': 'Reducer.firstNonNull'}
    )
    expression = ee.Reducer.firstNonNull()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_fixed_2d_histogram(self):
    x_min = 1
    x_max = 2
    x_steps = 3
    y_min = 4
    y_max = 5
    y_steps = 6
    expect = make_expression_graph({
        'arguments': {
            'xMin': {'constantValue': x_min},
            'xMax': {'constantValue': x_max},
            'xSteps': {'constantValue': x_steps},
            'yMin': {'constantValue': y_min},
            'yMax': {'constantValue': y_max},
            'ySteps': {'constantValue': y_steps},
        },
        'functionName': 'Reducer.fixed2DHistogram',
    })
    expression = ee.Reducer.fixed2DHistogram(
        x_min, x_max, x_steps, y_min, y_max, y_steps
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Reducer.fixed2DHistogram(
        xMin=x_min,
        xMax=x_max,
        xSteps=x_steps,
        yMin=y_min,
        yMax=y_max,
        ySteps=y_steps,
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_fixed_histogram(self):
    min_value = 1
    max_value = 2
    steps = 3
    cumulative = True
    expect = make_expression_graph({
        'arguments': {
            'min': {'constantValue': min_value},
            'max': {'constantValue': max_value},
            'steps': {'constantValue': steps},
            'cumulative': {'constantValue': cumulative},
        },
        'functionName': 'Reducer.fixedHistogram',
    })
    expression = ee.Reducer.fixedHistogram(
        min_value, max_value, steps, cumulative
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Reducer.fixedHistogram(
        min=min_value, max=max_value, steps=steps, cumulative=cumulative
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_for_each(self):
    reducer = ee.Reducer.last()
    output_names = ['a', 'b']
    expect = make_expression_graph({
        'arguments': {
            'reducer': {
                'functionInvocationValue': {
                    'functionName': 'Reducer.last',
                    'arguments': {},
                }
            },
            'outputNames': {'constantValue': output_names},
        },
        'functionName': 'Reducer.forEach',
    })
    expression = reducer.forEach(output_names)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = reducer.forEach(outputNames=output_names)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_for_each_band(self):
    reducer = ee.Reducer.last()
    image = 'a'
    expect = make_expression_graph({
        'arguments': {
            'reducer': {
                'functionInvocationValue': {
                    'functionName': 'Reducer.last',
                    'arguments': {},
                }
            },
            'image': {
                'functionInvocationValue': {
                    'functionName': 'Image.load',
                    'arguments': {'id': {'constantValue': 'a'}},
                }
            },
        },
        'functionName': 'Reducer.forEachBand',
    })
    expression = reducer.forEachBand(image)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = reducer.forEachBand(image=image)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_for_each_element(self):
    reducer = ee.Reducer.last()
    expect = make_expression_graph({
        'arguments': {
            'reducer': {
                'functionInvocationValue': {
                    'functionName': 'Reducer.last',
                    'arguments': {},
                }
            },
        },
        'functionName': 'Reducer.forEachElement',
    })
    expression = reducer.forEachElement()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_frequency_histogram(self):
    expect = make_expression_graph(
        {'arguments': {}, 'functionName': 'Reducer.frequencyHistogram'}
    )
    expression = ee.Reducer.frequencyHistogram()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_geometric_median(self):
    num_x = 1
    eta = 2
    initial_step_size = 3
    expect = make_expression_graph({
        'arguments': {
            'numX': {'constantValue': num_x},
            'eta': {'constantValue': eta},
            'initialStepSize': {'constantValue': initial_step_size},
        },
        'functionName': 'Reducer.geometricMedian',
    })
    expression = ee.Reducer.geometricMedian(num_x, eta, initial_step_size)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Reducer.geometricMedian(
        numX=num_x, eta=eta, initialStepSize=initial_step_size
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_get_outputs(self):
    reducer = ee.Reducer.last()
    expect = make_expression_graph({
        'arguments': {
            'reducer': {
                'functionInvocationValue': {
                    'functionName': 'Reducer.last',
                    'arguments': {},
                }
            },
        },
        'functionName': 'Reducer.getOutputs',
    })
    expression = reducer.getOutputs()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_group(self):
    reducer = ee.Reducer.last()
    group_field = 1
    group_name = 'a'
    expect = make_expression_graph({
        'arguments': {
            'reducer': {
                'functionInvocationValue': {
                    'functionName': 'Reducer.last',
                    'arguments': {},
                }
            },
            'groupField': {'constantValue': group_field},
            'groupName': {'constantValue': group_name},
        },
        'functionName': 'Reducer.group',
    })
    expression = reducer.group(group_field, group_name)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = reducer.group(
        groupField=group_field, groupName=group_name
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_histogram(self):
    max_buckets = 1
    min_bucket_width = 2
    max_raw = 3
    expect = make_expression_graph({
        'arguments': {
            'maxBuckets': {'constantValue': max_buckets},
            'minBucketWidth': {'constantValue': min_bucket_width},
            'maxRaw': {'constantValue': max_raw},
        },
        'functionName': 'Reducer.histogram',
    })
    expression = ee.Reducer.histogram(max_buckets, min_bucket_width, max_raw)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Reducer.histogram(
        maxBuckets=max_buckets, minBucketWidth=min_bucket_width, maxRaw=max_raw
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_interval_mean(self):
    min_percentile = 1
    max_percentile = 2
    max_buckets = 3
    min_bucket_width = 4
    max_raw = 5
    expect = make_expression_graph({
        'arguments': {
            'minPercentile': {'constantValue': min_percentile},
            'maxPercentile': {'constantValue': max_percentile},
            'maxBuckets': {'constantValue': max_buckets},
            'minBucketWidth': {'constantValue': min_bucket_width},
            'maxRaw': {'constantValue': max_raw},
        },
        'functionName': 'Reducer.intervalMean',
    })
    expression = ee.Reducer.intervalMean(
        min_percentile, max_percentile, max_buckets, min_bucket_width, max_raw
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Reducer.intervalMean(
        minPercentile=min_percentile,
        maxPercentile=max_percentile,
        maxBuckets=max_buckets,
        minBucketWidth=min_bucket_width,
        maxRaw=max_raw,
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_kendalls_correlation(self):
    num_inputs = 1
    expect = make_expression_graph({
        'arguments': {
            'numInputs': {'constantValue': num_inputs},
        },
        'functionName': 'Reducer.kendallsCorrelation',
    })
    expression = ee.Reducer.kendallsCorrelation(num_inputs)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Reducer.kendallsCorrelation(numInputs=num_inputs)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_kurtosis(self):
    expect = make_expression_graph(
        {'arguments': {}, 'functionName': 'Reducer.kurtosis'}
    )
    expression = ee.Reducer.kurtosis()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_last(self):
    expect = make_expression_graph(
        {'arguments': {}, 'functionName': 'Reducer.last'}
    )
    expression = ee.Reducer.last()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_last_non_null(self):
    expect = make_expression_graph(
        {'arguments': {}, 'functionName': 'Reducer.lastNonNull'}
    )
    expression = ee.Reducer.lastNonNull()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_linear_fit(self):
    expect = make_expression_graph(
        {'arguments': {}, 'functionName': 'Reducer.linearFit'}
    )
    expression = ee.Reducer.linearFit()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_linear_regression(self):
    num_x = 1
    num_y = 2
    expect = make_expression_graph({
        'arguments': {
            'numX': {'constantValue': num_x},
            'numY': {'constantValue': num_y},
        },
        'functionName': 'Reducer.linearRegression',
    })
    expression = ee.Reducer.linearRegression(num_x, num_y)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Reducer.linearRegression(numX=num_x, numY=num_y)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_max(self):
    num_inputs = 1
    expect = make_expression_graph({
        'arguments': {
            'numInputs': {'constantValue': num_inputs},
        },
        'functionName': 'Reducer.max',
    })
    expression = ee.Reducer.max(num_inputs)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Reducer.max(numInputs=num_inputs)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_mean(self):
    expect = make_expression_graph(
        {'arguments': {}, 'functionName': 'Reducer.mean'}
    )
    expression = ee.Reducer.mean()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_median(self):
    max_buckets = 1
    min_bucket_width = 2
    max_raw = 3
    expect = make_expression_graph({
        'arguments': {
            'maxBuckets': {'constantValue': max_buckets},
            'minBucketWidth': {'constantValue': min_bucket_width},
            'maxRaw': {'constantValue': max_raw},
        },
        'functionName': 'Reducer.median',
    })
    expression = ee.Reducer.median(max_buckets, min_bucket_width, max_raw)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Reducer.median(
        maxBuckets=max_buckets, minBucketWidth=min_bucket_width, maxRaw=max_raw
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_min(self):
    num_inputs = 1
    expect = make_expression_graph({
        'arguments': {
            'numInputs': {'constantValue': num_inputs},
        },
        'functionName': 'Reducer.min',
    })
    expression = ee.Reducer.min(num_inputs)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Reducer.min(numInputs=num_inputs)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_min_max(self):
    expect = make_expression_graph(
        {'arguments': {}, 'functionName': 'Reducer.minMax'}
    )
    expression = ee.Reducer.minMax()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_mode(self):
    max_buckets = 1
    min_bucket_width = 2
    max_raw = 3
    expect = make_expression_graph({
        'arguments': {
            'maxBuckets': {'constantValue': max_buckets},
            'minBucketWidth': {'constantValue': min_bucket_width},
            'maxRaw': {'constantValue': max_raw},
        },
        'functionName': 'Reducer.mode',
    })
    expression = ee.Reducer.mode(max_buckets, min_bucket_width, max_raw)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Reducer.mode(
        maxBuckets=max_buckets, minBucketWidth=min_bucket_width, maxRaw=max_raw
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_or(self):
    expect = make_expression_graph(
        {'arguments': {}, 'functionName': 'Reducer.or'}
    )
    expression = ee.Reducer.Or()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_pearsons_correlation(self):
    expect = make_expression_graph(
        {'arguments': {}, 'functionName': 'Reducer.pearsonsCorrelation'}
    )
    expression = ee.Reducer.pearsonsCorrelation()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_percentile(self):
    percentiles = [1, 2]
    output_names = ['a', 'b']
    max_buckets = 3
    min_bucket_width = 4
    max_raw = 5
    expect = make_expression_graph({
        'arguments': {
            'percentiles': {'constantValue': percentiles},
            'outputNames': {'constantValue': output_names},
            'maxBuckets': {'constantValue': max_buckets},
            'minBucketWidth': {'constantValue': min_bucket_width},
            'maxRaw': {'constantValue': max_raw},
        },
        'functionName': 'Reducer.percentile',
    })
    expression = ee.Reducer.percentile(
        percentiles, output_names, max_buckets, min_bucket_width, max_raw
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Reducer.percentile(
        percentiles=percentiles,
        outputNames=output_names,
        maxBuckets=max_buckets,
        minBucketWidth=min_bucket_width,
        maxRaw=max_raw,
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_product(self):
    expect = make_expression_graph(
        {'arguments': {}, 'functionName': 'Reducer.product'}
    )
    expression = ee.Reducer.product()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_repeat(self):
    reducer = ee.Reducer.product()
    count = 1
    expect = make_expression_graph({
        'arguments': {
            'reducer': {
                'functionInvocationValue': {
                    'functionName': 'Reducer.product',
                    'arguments': {},
                }
            },
            'count': {'constantValue': count},
        },
        'functionName': 'Reducer.repeat',
    })
    expression = reducer.repeat(count)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = reducer.repeat(count=count)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_ridge_regression(self):
    num_x = 1
    num_y = 2
    lambda_ = 3
    expect = make_expression_graph({
        'arguments': {
            'numX': {'constantValue': num_x},
            'numY': {'constantValue': num_y},
            'lambda': {'constantValue': lambda_},
        },
        'functionName': 'Reducer.ridgeRegression',
    })
    expression = ee.Reducer.ridgeRegression(num_x, num_y, lambda_)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    # 'lambda' is a reserved word in Python.
    args = {
        'numX': num_x,
        'numY': num_y,
        'lambda': lambda_,
    }

    expression = ee.Reducer.ridgeRegression(**args)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_robust_linear_regression(self):
    num_x = 1
    num_y = 2
    beta = 3
    expect = make_expression_graph({
        'arguments': {
            'numX': {'constantValue': num_x},
            'numY': {'constantValue': num_y},
            'beta': {'constantValue': beta},
        },
        'functionName': 'Reducer.robustLinearRegression',
    })
    expression = ee.Reducer.robustLinearRegression(num_x, num_y, beta)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Reducer.robustLinearRegression(
        numX=num_x, numY=num_y, beta=beta
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_sample_std_dev(self):
    expect = make_expression_graph(
        {'arguments': {}, 'functionName': 'Reducer.sampleStdDev'}
    )
    expression = ee.Reducer.sampleStdDev()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_sample_variance(self):
    expect = make_expression_graph(
        {'arguments': {}, 'functionName': 'Reducer.sampleVariance'}
    )
    expression = ee.Reducer.sampleVariance()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_sens_slope(self):
    expect = make_expression_graph(
        {'arguments': {}, 'functionName': 'Reducer.sensSlope'}
    )
    expression = ee.Reducer.sensSlope()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_set_outputs(self):
    reducer = ee.Reducer.stdDev()
    outputs = ['a', 'b']
    expect = make_expression_graph({
        'arguments': {
            'reducer': {
                'functionInvocationValue': {
                    'functionName': 'Reducer.stdDev',
                    'arguments': {},
                }
            },
            'outputs': {'constantValue': outputs},
        },
        'functionName': 'Reducer.setOutputs',
    })
    expression = reducer.setOutputs(outputs)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = reducer.setOutputs(outputs=outputs)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_skew(self):
    expect = make_expression_graph(
        {'arguments': {}, 'functionName': 'Reducer.skew'}
    )
    expression = ee.Reducer.skew()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_spearmans_correlation(self):
    expect = make_expression_graph(
        {'arguments': {}, 'functionName': 'Reducer.spearmansCorrelation'}
    )
    expression = ee.Reducer.spearmansCorrelation()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_split_weights(self):
    reducer = ee.Reducer.stdDev()
    expect = make_expression_graph({
        'arguments': {
            'reducer': {
                'functionInvocationValue': {
                    'functionName': 'Reducer.stdDev',
                    'arguments': {},
                }
            }
        },
        'functionName': 'Reducer.splitWeights',
    })
    expression = reducer.splitWeights()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_std_dev(self):
    expect = make_expression_graph(
        {'arguments': {}, 'functionName': 'Reducer.stdDev'}
    )
    expression = ee.Reducer.stdDev()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_sum(self):
    expect = make_expression_graph(
        {'arguments': {}, 'functionName': 'Reducer.sum'}
    )
    expression = ee.Reducer.sum()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_to_collection(self):
    property_names = ['a', 'b']
    num_optional = 1
    expect = make_expression_graph({
        'arguments': {
            'propertyNames': {'constantValue': property_names},
            'numOptional': {'constantValue': num_optional},
        },
        'functionName': 'Reducer.toCollection',
    })
    expression = ee.Reducer.toCollection(property_names, num_optional)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Reducer.toCollection(
        propertyNames=property_names, numOptional=num_optional
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_to_list(self):
    tuple_size = 1
    num_optional = 2
    expect = make_expression_graph({
        'arguments': {
            'tupleSize': {'constantValue': tuple_size},
            'numOptional': {'constantValue': num_optional},
        },
        'functionName': 'Reducer.toList',
    })
    expression = ee.Reducer.toList(tuple_size, num_optional)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Reducer.toList(
        tupleSize=tuple_size, numOptional=num_optional
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_unweighted(self):
    reducer = ee.Reducer.variance()
    expect = make_expression_graph({
        'arguments': {
            'reducer': {
                'functionInvocationValue': {
                    'functionName': 'Reducer.variance',
                    'arguments': {},
                }
            }
        },
        'functionName': 'Reducer.unweighted',
    })
    expression = reducer.unweighted()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_variance(self):
    expect = make_expression_graph(
        {'arguments': {}, 'functionName': 'Reducer.variance'}
    )
    expression = ee.Reducer.variance()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)


if __name__ == '__main__':
  unittest.main()
