#!/usr/bin/env python3
"""Tests for ee._state."""

from absl.testing import parameterized

import unittest
from ee import _state


class StateTest(parameterized.TestCase):

  def setUp(self):
    super().setUp()
    _state.reset_state()

  @parameterized.named_parameters(
      ('global_mode', False),
  )
  def test_get_state(self, use_context_mode: bool):
    state = _state.get_state()

    self.assertIsInstance(state, _state.EEState)
    self.assertEqual(state, _state.EEState())

  @parameterized.named_parameters(
      ('global_mode', False),
  )
  def test_update_state(self, use_context_mode: bool):
    state = _state.get_state()

    # Modify the state and verify the global state has been updated.
    state.cloud_api_user_project = 'my-project'

    self.assertEqual(_state.get_state().cloud_api_user_project, 'my-project')

  @parameterized.named_parameters(
      ('global_mode', False),
  )
  def test_reset_state(self, use_context_mode: bool):
    state = _state.get_state()
    state.cloud_api_user_project = 'my-project'

    _state.reset_state()

    self.assertEqual(_state.get_state(), _state.EEState())


if __name__ == '__main__':
  unittest.main()
