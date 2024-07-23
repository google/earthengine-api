#!/usr/bin/env python3
"""Tests for the ee.Clusterer module."""

import json
import sys
from typing import Any, Dict
import unittest

import unittest
import ee
from ee import apitestcase

_WEKA_COBWEB_SERIALIZED = {
    'result': '0',
    'values': {
        '0': {
            'functionInvocationValue': {
                'functionName': 'Clusterer.wekaCobweb',
                'arguments': {
                    'acuity': {'constantValue': 2},
                    'cutoff': {'constantValue': 0.01},
                    'seed': {'constantValue': 3},
                },
            }
        }
    },
}


def make_expression_graph(
    function_invocation_value: Dict[str, Any],
) -> Dict[str, Any]:
  return {
      'result': '0',
      'values': {'0': {'functionInvocationValue': function_invocation_value}},
  }


class ClustererTest(apitestcase.ApiTestCase):

  def test_cobweb_args(self):
    clusterer = ee.Clusterer.wekaCobweb(2, 0.01, 3)
    self.assertEqual({'value': 'fakeValue'}, clusterer.getInfo())

    join_func = ee.ApiFunction.lookup('Clusterer.wekaCobweb')
    self.assertEqual(join_func, clusterer.func)
    self.assertFalse(clusterer.isVariable())

    result = json.loads(clusterer.serialize())
    self.assertEqual(_WEKA_COBWEB_SERIALIZED, result)

  def test_cobweb_kwargs(self):
    clusterer = ee.Clusterer.wekaCobweb(acuity=2, cutoff=0.01, seed=3)
    self.assertEqual({'value': 'fakeValue'}, clusterer.getInfo())

    join_func = ee.ApiFunction.lookup('Clusterer.wekaCobweb')
    self.assertEqual(join_func, clusterer.func)
    self.assertFalse(clusterer.isVariable())

    result = json.loads(clusterer.serialize())
    self.assertEqual(_WEKA_COBWEB_SERIALIZED, result)

  def test_cast(self):
    clusterer = ee.Clusterer(
        ee.Clusterer.wekaCobweb(acuity=2, cutoff=0.01, seed=3)
    )
    result = json.loads(clusterer.serialize())
    self.assertEqual(_WEKA_COBWEB_SERIALIZED, result)

  @unittest.skipIf(sys.version_info < (3, 10), 'Unsupported in Python <= 3.9')
  def test_no_args(self):
    message = (
        r'Clusterer\.__init__\(\) missing 1 required positional argument:'
        r' \'clusterer\''
    )
    with self.assertRaisesRegex(TypeError, message):
      ee.Clusterer()  # pytype:disable=missing-parameter

  def test_wrong_type(self):
    message = (
        r'Clusterer can only be used as a cast to Clusterer\. Found <class'
        r' \'int\'>'
    )
    with self.assertRaisesRegex(TypeError, message):
      ee.Clusterer(1234)  # pytype:disable=wrong-arg-types

  def test_schema(self):
    clusterer = ee.Clusterer.wekaCobweb(1.1, 2.2, 3)
    expect = make_expression_graph({
        'functionName': 'Clusterer.schema',
        'arguments': {
            'clusterer': {
                'functionInvocationValue': {
                    'functionName': 'Clusterer.wekaCobweb',
                    'arguments': {
                        'acuity': {'constantValue': 1.1},
                        'cutoff': {'constantValue': 2.2},
                        'seed': {'constantValue': 3},
                    },
                }
            }
        },
    })
    expression = ee.Clusterer(clusterer).schema()
    self.assertIsNotNone(expression)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_train(self):
    clusterer = ee.Clusterer.wekaCobweb(1.1, 2.2, 3)
    features = ee.FeatureCollection('a')
    input_properties = ['b', 'c']
    subsampling = 4.4
    subsampling_seed = 5
    expect = make_expression_graph({
        'arguments': {
            'clusterer': {
                'functionInvocationValue': {
                    'functionName': 'Clusterer.wekaCobweb',
                    'arguments': {
                        'acuity': {'constantValue': 1.1},
                        'cutoff': {'constantValue': 2.2},
                        'seed': {'constantValue': 3},
                    },
                }
            },
            'features': {
                'functionInvocationValue': {
                    'functionName': 'Collection.loadTable',
                    'arguments': {'tableId': {'constantValue': 'a'}},
                }
            },
            'inputProperties': {'constantValue': input_properties},
            'subsampling': {'constantValue': subsampling},
            'subsamplingSeed': {'constantValue': subsampling_seed},
        },
        'functionName': 'Clusterer.train',
    })
    expression = ee.Clusterer(clusterer).train(
        features, input_properties, subsampling, subsampling_seed
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Clusterer(clusterer).train(
        features=features,
        inputProperties=input_properties,
        subsampling=subsampling,
        subsamplingSeed=subsampling_seed,
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_weka_cascade_k_means(self):
    min_clusters = 1
    max_clusters = 2
    restarts = 3
    manual = True
    init = False
    distance_function = 'Manhattan'
    max_iterations = 4
    expect = make_expression_graph({
        'arguments': {
            'minClusters': {'constantValue': min_clusters},
            'maxClusters': {'constantValue': max_clusters},
            'restarts': {'constantValue': restarts},
            'manual': {'constantValue': manual},
            'init': {'constantValue': init},
            'distanceFunction': {'constantValue': distance_function},
            'maxIterations': {'constantValue': max_iterations},
        },
        'functionName': 'Clusterer.wekaCascadeKMeans',
    })
    expression = ee.Clusterer.wekaCascadeKMeans(
        min_clusters,
        max_clusters,
        restarts,
        manual,
        init,
        distance_function,
        max_iterations,
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Clusterer.wekaCascadeKMeans(
        minClusters=min_clusters,
        maxClusters=max_clusters,
        restarts=restarts,
        manual=manual,
        init=init,
        distanceFunction=distance_function,
        maxIterations=max_iterations,
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_weka_cobweb(self):
    acuity = 1.0
    cutoff = 2.0
    seed = 3
    expect = make_expression_graph({
        'arguments': {
            'acuity': {'constantValue': acuity},
            'cutoff': {'constantValue': cutoff},
            'seed': {'constantValue': seed},
        },
        'functionName': 'Clusterer.wekaCobweb',
    })
    expression = ee.Clusterer.wekaCobweb(acuity, cutoff, seed)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Clusterer.wekaCobweb(
        acuity=acuity, cutoff=cutoff, seed=seed
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_weka_k_means(self):
    n_clusters = 1
    init = 2
    canopies = True
    max_candidates = 3
    periodic_pruning = 4
    min_density = 5
    t1 = 6.1
    t2 = 7.1
    distance_function = 'Euclidean'
    max_iterations = 8
    preserve_order = False
    fast = True
    seed = 9
    expect = make_expression_graph({
        'arguments': {
            'nClusters': {'constantValue': n_clusters},
            'init': {'constantValue': init},
            'canopies': {'constantValue': canopies},
            'maxCandidates': {'constantValue': max_candidates},
            'periodicPruning': {'constantValue': periodic_pruning},
            'minDensity': {'constantValue': min_density},
            't1': {'constantValue': t1},
            't2': {'constantValue': t2},
            'distanceFunction': {'constantValue': distance_function},
            'maxIterations': {'constantValue': max_iterations},
            'preserveOrder': {'constantValue': preserve_order},
            'fast': {'constantValue': fast},
            'seed': {'constantValue': seed},
        },
        'functionName': 'Clusterer.wekaKMeans',
    })
    expression = ee.Clusterer.wekaKMeans(
        n_clusters,
        init,
        canopies,
        max_candidates,
        periodic_pruning,
        min_density,
        t1,
        t2,
        distance_function,
        max_iterations,
        preserve_order,
        fast,
        seed,
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Clusterer.wekaKMeans(
        nClusters=n_clusters,
        init=init,
        canopies=canopies,
        maxCandidates=max_candidates,
        periodicPruning=periodic_pruning,
        minDensity=min_density,
        t1=t1,
        t2=t2,
        distanceFunction=distance_function,
        maxIterations=max_iterations,
        preserveOrder=preserve_order,
        fast=fast,
        seed=seed,
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_weka_lvq(self):
    num_clusters = 1
    learning_rate = 2.2
    epochs = 3
    normalize_input = True
    expect = make_expression_graph({
        'arguments': {
            'numClusters': {'constantValue': num_clusters},
            'learningRate': {'constantValue': learning_rate},
            'epochs': {'constantValue': epochs},
            'normalizeInput': {'constantValue': normalize_input},
        },
        'functionName': 'Clusterer.wekaLVQ',
    })
    expression = ee.Clusterer.wekaLVQ(
        num_clusters, learning_rate, epochs, normalize_input
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Clusterer.wekaLVQ(
        numClusters=num_clusters,
        learningRate=learning_rate,
        epochs=epochs,
        normalizeInput=normalize_input,
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_weka_x_means(self):
    min_clusters = 1
    max_clusters = 2
    max_iterations = 3
    max_k_means = 4
    max_for_children = 5
    use_k_d = True
    cutoff_factor = 6.1
    distance_function = 'Chebyshev'
    seed = 7
    expect = make_expression_graph({
        'arguments': {
            'minClusters': {'constantValue': min_clusters},
            'maxClusters': {'constantValue': max_clusters},
            'maxIterations': {'constantValue': max_iterations},
            'maxKMeans': {'constantValue': max_k_means},
            'maxForChildren': {'constantValue': max_for_children},
            'useKD': {'constantValue': use_k_d},
            'cutoffFactor': {'constantValue': cutoff_factor},
            'distanceFunction': {'constantValue': distance_function},
            'seed': {'constantValue': seed},
        },
        'functionName': 'Clusterer.wekaXMeans',
    })
    expression = ee.Clusterer.wekaXMeans(
        min_clusters,
        max_clusters,
        max_iterations,
        max_k_means,
        max_for_children,
        use_k_d,
        cutoff_factor,
        distance_function,
        seed,
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Clusterer.wekaXMeans(
        minClusters=min_clusters,
        maxClusters=max_clusters,
        maxIterations=max_iterations,
        maxKMeans=max_k_means,
        maxForChildren=max_for_children,
        useKD=use_k_d,
        cutoffFactor=cutoff_factor,
        distanceFunction=distance_function,
        seed=seed,
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)


if __name__ == '__main__':
  unittest.main()
