#!/usr/bin/env python3
"""Tests for the ee.Classifier module."""

import json
import sys
from typing import Any, Dict
import unittest

import unittest
import ee
from ee import apitestcase


_CLASSIFIER_JSON = {
    'result': '0',
    'values': {
        '0': {
            'functionInvocationValue': {
                'functionName': 'Classifier.smileNaiveBayes',
                'arguments': {'lambda': {'constantValue': 0.01}},
            }
        }
    },
}

# Result of ee.Classifier.load('a')
_CLASSIFIER_LOAD_A = {
    'functionInvocationValue': {
        'functionName': 'Classifier.load',
        'arguments': {'id': {'constantValue': 'a'}},
    }
}


def make_expression_graph(
    function_invocation_value: Dict[str, Any],
) -> Dict[str, Any]:
  return {
      'result': '0',
      'values': {'0': {'functionInvocationValue': function_invocation_value}},
  }


class ClassifierTest(apitestcase.ApiTestCase):

  def test_naive_bayes_args(self):
    classifier = ee.Classifier.smileNaiveBayes(0.01)
    self.assertEqual({'value': 'fakeValue'}, classifier.getInfo())

    naive_bayes_func = ee.ApiFunction.lookup('Classifier.smileNaiveBayes')
    self.assertEqual(naive_bayes_func, classifier.func)
    self.assertFalse(classifier.isVariable())

    result = json.loads(classifier.serialize())
    self.assertEqual(_CLASSIFIER_JSON, result)

  def test_square_kwargs(self):
    kwargs = {'lambda': 0.01}
    classifier = ee.Classifier.smileNaiveBayes(**kwargs)
    result = json.loads(classifier.serialize())
    self.assertEqual(_CLASSIFIER_JSON, result)

  def test_cast(self):
    classifier = ee.Classifier(ee.Classifier.smileNaiveBayes(0.01))
    result = json.loads(classifier.serialize())
    self.assertEqual(_CLASSIFIER_JSON, result)

  @unittest.skipIf(sys.version_info < (3, 10), 'Unsupported in Python <= 3.9')
  def test_no_args(self):
    message = (
        r'Classifier\.__init__\(\) missing 1 required positional argument:'
        r' \'classifier\''
    )
    with self.assertRaisesRegex(TypeError, message):
      ee.Classifier()  # pytype:disable=missing-parameter

  def test_wrong_type(self):
    message = (
        r'Classifier can only be used as a cast to Classifier\. Found <class'
        r' \'int\'>'
    )
    with self.assertRaisesRegex(TypeError, message):
      ee.Classifier(1234)  # pytype:disable=wrong-arg-types

  def test_amnh_maxent(self):
    categorical_names = ['a', 'b']
    output_format = 'cloglog'
    auto_feature = False
    linear = True
    quadratic = False
    product = True
    threshold = False
    hinge = True
    hinge_threshold = 1
    l2lq_threshold = 2
    lq2lqpt_threshold = 3
    add_samples_to_background = False
    add_all_samples_to_background = True
    beta_multiplier = False
    beta_hinge = 4.0
    beta_lqp = 5.0
    beta_categorical = 6.0
    beta_threshold = 7.0
    extrapolate = True
    do_clamp = False
    write_clamp_grid = True
    random_test_points = 8
    seed = 9
    expect = make_expression_graph({
        'arguments': {
            'categoricalNames': {'constantValue': categorical_names},
            'outputFormat': {'constantValue': output_format},
            'autoFeature': {'constantValue': auto_feature},
            'linear': {'constantValue': linear},
            'quadratic': {'constantValue': quadratic},
            'product': {'constantValue': product},
            'threshold': {'constantValue': threshold},
            'hinge': {'constantValue': hinge},
            'hingeThreshold': {'constantValue': hinge_threshold},
            'l2lqThreshold': {'constantValue': l2lq_threshold},
            'lq2lqptThreshold': {'constantValue': lq2lqpt_threshold},
            'addSamplesToBackground': {
                'constantValue': add_samples_to_background
            },
            'addAllSamplesToBackground': {
                'constantValue': add_all_samples_to_background
            },
            'betaMultiplier': {'constantValue': beta_multiplier},
            'betaHinge': {'constantValue': beta_hinge},
            'betaLqp': {'constantValue': beta_lqp},
            'betaCategorical': {'constantValue': beta_categorical},
            'betaThreshold': {'constantValue': beta_threshold},
            'extrapolate': {'constantValue': extrapolate},
            'doClamp': {'constantValue': do_clamp},
            'writeClampGrid': {'constantValue': write_clamp_grid},
            'randomTestPoints': {'constantValue': random_test_points},
            'seed': {'constantValue': seed},
        },
        'functionName': 'Classifier.amnhMaxent',
    })
    expression = ee.Classifier.amnhMaxent(
        categorical_names,
        output_format,
        auto_feature,
        linear,
        quadratic,
        product,
        threshold,
        hinge,
        hinge_threshold,
        l2lq_threshold,
        lq2lqpt_threshold,
        add_samples_to_background,
        add_all_samples_to_background,
        beta_multiplier,
        beta_hinge,
        beta_lqp,
        beta_categorical,
        beta_threshold,
        extrapolate,
        do_clamp,
        write_clamp_grid,
        random_test_points,
        seed,
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Classifier.amnhMaxent(
        categoricalNames=categorical_names,
        outputFormat=output_format,
        autoFeature=auto_feature,
        linear=linear,
        quadratic=quadratic,
        product=product,
        threshold=threshold,
        hinge=hinge,
        hingeThreshold=hinge_threshold,
        l2lqThreshold=l2lq_threshold,
        lq2lqptThreshold=lq2lqpt_threshold,
        addSamplesToBackground=add_samples_to_background,
        addAllSamplesToBackground=add_all_samples_to_background,
        betaMultiplier=beta_multiplier,
        betaHinge=beta_hinge,
        betaLqp=beta_lqp,
        betaCategorical=beta_categorical,
        betaThreshold=beta_threshold,
        extrapolate=extrapolate,
        doClamp=do_clamp,
        writeClampGrid=write_clamp_grid,
        randomTestPoints=random_test_points,
        seed=seed,
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_confusion_matrix(self):
    classifier = ee.Classifier.load('a')
    expect = make_expression_graph({
        'arguments': {'classifier': _CLASSIFIER_LOAD_A},
        'functionName': 'Classifier.confusionMatrix',
    })
    expression = classifier.confusionMatrix()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_decision_tree(self):
    tree_string = 'a'
    expect = make_expression_graph({
        'arguments': {
            'treeString': {'constantValue': tree_string},
        },
        'functionName': 'Classifier.decisionTree',
    })
    expression = ee.Classifier.decisionTree(tree_string)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Classifier.decisionTree(treeString=tree_string)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_decision_tree_ensemble(self):
    tree_strings = ['a', 'b']
    expect = make_expression_graph({
        'arguments': {
            'treeStrings': {'constantValue': tree_strings},
        },
        'functionName': 'Classifier.decisionTreeEnsemble',
    })
    expression = ee.Classifier.decisionTreeEnsemble(tree_strings)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Classifier.decisionTreeEnsemble(treeStrings=tree_strings)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_explain(self):
    classifier = ee.Classifier.load('a')
    expect = make_expression_graph({
        'arguments': {'classifier': _CLASSIFIER_LOAD_A},
        'functionName': 'Classifier.explain',
    })
    expression = classifier.explain()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_libsvm(self):
    decision_procedure = 'Voting'
    svm_type = 'NU_SVC'
    kernel_type = 'POLY'
    shrinking = True
    degree = 1
    gamma = 2.0
    coef0 = 3.0
    cost = 4.0
    nu = 5.0
    termination_epsilon = 6.0
    loss_epsilon = 7.0
    one_class = 0
    expect = make_expression_graph({
        'arguments': {
            'decisionProcedure': {'constantValue': decision_procedure},
            'svmType': {'constantValue': svm_type},
            'kernelType': {'constantValue': kernel_type},
            'shrinking': {'constantValue': shrinking},
            'degree': {'constantValue': degree},
            'gamma': {'constantValue': gamma},
            'coef0': {'constantValue': coef0},
            'cost': {'constantValue': cost},
            'nu': {'constantValue': nu},
            'terminationEpsilon': {'constantValue': termination_epsilon},
            'lossEpsilon': {'constantValue': loss_epsilon},
            'oneClass': {'constantValue': one_class},
        },
        'functionName': 'Classifier.libsvm',
    })
    expression = ee.Classifier.libsvm(
        decision_procedure,
        svm_type,
        kernel_type,
        shrinking,
        degree,
        gamma,
        coef0,
        cost,
        nu,
        termination_epsilon,
        loss_epsilon,
        one_class,
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Classifier.libsvm(
        decisionProcedure=decision_procedure,
        svmType=svm_type,
        kernelType=kernel_type,
        shrinking=shrinking,
        degree=degree,
        gamma=gamma,
        coef0=coef0,
        cost=cost,
        nu=nu,
        terminationEpsilon=termination_epsilon,
        lossEpsilon=loss_epsilon,
        oneClass=one_class,
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_load(self):
    id = 'a'
    expect = make_expression_graph({
        'arguments': {
            'id': {'constantValue': id},
        },
        'functionName': 'Classifier.load',
    })
    expression = ee.Classifier.load(id)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Classifier.load(id=id)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_minimum_distance(self):
    metric = 'cosine'
    k_nearest = 1
    expect = make_expression_graph({
        'arguments': {
            'metric': {'constantValue': metric},
            'kNearest': {'constantValue': k_nearest},
        },
        'functionName': 'Classifier.minimumDistance',
    })
    expression = ee.Classifier.minimumDistance(metric, k_nearest)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Classifier.minimumDistance(
        metric=metric, kNearest=k_nearest
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_mode(self):
    classifier = ee.Classifier.load('a')
    expect = make_expression_graph({
        'arguments': {'classifier': _CLASSIFIER_LOAD_A},
        'functionName': 'Classifier.mode',
    })
    expression = classifier.mode()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_schema(self):
    classifier = ee.Classifier.load('a')
    expect = make_expression_graph({
        'arguments': {'classifier': _CLASSIFIER_LOAD_A},
        'functionName': 'Classifier.schema',
    })
    expression = classifier.schema()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_set_output_mode(self):
    classifier = ee.Classifier.load('a')
    mode = 'PROBABILITY'
    expect = make_expression_graph({
        'arguments': {
            'classifier': _CLASSIFIER_LOAD_A,
            'mode': {'constantValue': mode},
        },
        'functionName': 'Classifier.setOutputMode',
    })
    expression = classifier.setOutputMode(mode)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = classifier.setOutputMode(mode=mode)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_smile_cart(self):
    max_nodes = 1
    min_leaf_population = 2
    expect = make_expression_graph({
        'arguments': {
            'maxNodes': {'constantValue': max_nodes},
            'minLeafPopulation': {'constantValue': min_leaf_population},
        },
        'functionName': 'Classifier.smileCart',
    })
    expression = ee.Classifier.smileCart(max_nodes, min_leaf_population)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Classifier.smileCart(
        maxNodes=max_nodes, minLeafPopulation=min_leaf_population
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_smile_gradient_tree_boost(self):
    number_of_trees = 1
    shrinkage = 0.2
    sampling_rate = 0.3
    max_nodes = 4
    loss = 'Huber'
    seed = 5
    expect = make_expression_graph({
        'arguments': {
            'numberOfTrees': {'constantValue': number_of_trees},
            'shrinkage': {'constantValue': shrinkage},
            'samplingRate': {'constantValue': sampling_rate},
            'maxNodes': {'constantValue': max_nodes},
            'loss': {'constantValue': loss},
            'seed': {'constantValue': seed},
        },
        'functionName': 'Classifier.smileGradientTreeBoost',
    })
    expression = ee.Classifier.smileGradientTreeBoost(
        number_of_trees, shrinkage, sampling_rate, max_nodes, loss, seed
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Classifier.smileGradientTreeBoost(
        numberOfTrees=number_of_trees,
        shrinkage=shrinkage,
        samplingRate=sampling_rate,
        maxNodes=max_nodes,
        loss=loss,
        seed=seed,
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_smile_knn(self):
    k = 1
    search_method = 'AUTO'
    metric = 'EUCLIDEAN'
    expect = make_expression_graph({
        'arguments': {
            'k': {'constantValue': k},
            'searchMethod': {'constantValue': search_method},
            'metric': {'constantValue': metric},
        },
        'functionName': 'Classifier.smileKNN',
    })
    expression = ee.Classifier.smileKNN(k, search_method, metric)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Classifier.smileKNN(
        k=k, searchMethod=search_method, metric=metric
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_smile_naive_bayes(self):
    lambda_ = 1
    expect = make_expression_graph({
        'arguments': {
            'lambda': {'constantValue': lambda_},
        },
        'functionName': 'Classifier.smileNaiveBayes',
    })
    expression = ee.Classifier.smileNaiveBayes(lambda_)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    # 'lambda' is a reserved word in Python.
    args = {'lambda': lambda_}
    expression = ee.Classifier.smileNaiveBayes(**args)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_smile_naive_bayes_with_bad_kwargs(self):
    message = r"Unexpected arguments: \['bad_arg'\]\. Expected: lambda."
    with self.assertRaisesRegex(ValueError, message):
      ee.Classifier.smileNaiveBayes(bad_arg=1)

  def test_smile_random_forest(self):
    number_of_trees = 1
    variables_per_split = True
    min_leaf_population = 2
    bag_fraction = 0.5
    max_nodes = False
    seed = 3
    expect = make_expression_graph({
        'arguments': {
            'numberOfTrees': {'constantValue': number_of_trees},
            'variablesPerSplit': {'constantValue': variables_per_split},
            'minLeafPopulation': {'constantValue': min_leaf_population},
            'bagFraction': {'constantValue': bag_fraction},
            'maxNodes': {'constantValue': max_nodes},
            'seed': {'constantValue': seed},
        },
        'functionName': 'Classifier.smileRandomForest',
    })
    expression = ee.Classifier.smileRandomForest(
        number_of_trees,
        variables_per_split,
        min_leaf_population,
        bag_fraction,
        max_nodes,
        seed,
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Classifier.smileRandomForest(
        numberOfTrees=number_of_trees,
        variablesPerSplit=variables_per_split,
        minLeafPopulation=min_leaf_population,
        bagFraction=bag_fraction,
        maxNodes=max_nodes,
        seed=seed,
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_spectral_region(self):
    coordinates = [[1, 2], [3, 4]]
    schema = ['a', 'b']
    expect = make_expression_graph({
        'arguments': {
            'coordinates': {'constantValue': coordinates},
            'schema': {'constantValue': schema},
        },
        'functionName': 'Classifier.spectralRegion',
    })
    expression = ee.Classifier.spectralRegion(coordinates, schema)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Classifier.spectralRegion(
        coordinates=coordinates, schema=schema
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_train(self):
    classifier = ee.Classifier.load('a')
    features = ee.FeatureCollection('b')
    class_property = 'c'
    input_properties = ['d', 'e']
    subsampling = 1
    subsampling_seed = 2
    expect = make_expression_graph({
        'arguments': {
            'classifier': _CLASSIFIER_LOAD_A,
            'features': {
                'functionInvocationValue': {
                    'functionName': 'Collection.loadTable',
                    'arguments': {'tableId': {'constantValue': 'b'}},
                }
            },
            'classProperty': {'constantValue': class_property},
            'inputProperties': {'constantValue': input_properties},
            'subsampling': {'constantValue': subsampling},
            'subsamplingSeed': {'constantValue': subsampling_seed},
        },
        'functionName': 'Classifier.train',
    })
    expression = classifier.train(
        features,
        class_property,
        input_properties,
        subsampling,
        subsampling_seed,
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = classifier.train(
        features=features,
        classProperty=class_property,
        inputProperties=input_properties,
        subsampling=subsampling,
        subsamplingSeed=subsampling_seed,
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)


if __name__ == '__main__':
  unittest.main()
