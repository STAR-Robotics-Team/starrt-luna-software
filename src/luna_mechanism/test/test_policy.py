"""Exercise limits, denial, stale input and sensor guard combinations without ROS."""

from itertools import product
from pathlib import Path
import unittest

from luna_mechanism.policy import entry_guard, MotionPolicy


DESCRIPTION = (Path(__file__).parents[1] / 'urdf/mechanism_sandbox.urdf').read_text()


class TestMotionPolicy(unittest.TestCase):
    def setUp(self):
        self.policy = MotionPolicy(DESCRIPTION)

    def test_permission_defaults_to_denied(self):
        self.assertFalse(self.policy.command([0.2, 0.2, 1.0], [2.0, 2.0], 1.0, 1.0))
        self.assertEqual(self.policy.output(1.0), ([0.0] * 3, [0.0] * 2))

    def test_limits_in_both_directions(self):
        self.policy.permit(True, 1.0)
        self.assertTrue(self.policy.command([9.0, -9.0, 9.0], [9.0, -9.0], 1.0, 1.0))
        self.assertEqual(self.policy.output(1.0), ([0.2, 0.0, 1.0], [2.0, -2.0]))
        self.policy.command([-9.0, 9.0, -9.0], [-9.0, 9.0], 1.1, 1.1)
        self.assertEqual(self.policy.output(1.1), ([0.0, 0.2, 0.0], [-2.0, 2.0]))

    def test_revocation_holds_and_requires_new_command(self):
        self.policy.permit(True, 1.0)
        self.policy.command([0.1, 0.1, 0.5], [1.0, 1.0], 1.0, 1.0)
        self.policy.output(1.0)
        self.policy.permit(False, 1.1)
        self.assertEqual(self.policy.output(1.1), ([0.1, 0.1, 0.5], [0.0, 0.0]))
        self.policy.permit(True, 1.2)
        self.assertEqual(self.policy.output(1.2)[1], [0.0, 0.0])

    def test_independent_watchdogs(self):
        for renew_permission in (False, True):
            with self.subTest(renew_permission=renew_permission):
                policy = MotionPolicy(DESCRIPTION)
                policy.permit(True, 1.0)
                policy.command([0.1] * 3, [1.0] * 2, 1.0, 1.0)
                policy.output(1.0)
                if renew_permission:
                    policy.permit(True, 1.4)
                self.assertEqual(policy.output(1.5)[1], [0.0, 0.0])
                self.assertFalse(policy.command([0.1] * 3, [1.0] * 2, 2.0, 2.0))

    def test_invalid_commands_stop_velocity(self):
        invalid = [([0.1] * 3, [float('nan'), 0.0], 1.0),
                   ([float('inf')] * 3, [0.0] * 2, 1.0),
                   ([0.1], [0.0] * 2, 1.0),
                   ([0.1] * 3, [0.0], 1.0),
                   ([0.1] * 3, [0.0] * 2, 0.0),
                   ([0.1] * 3, [0.0] * 2, 1.1)]
        for positions, velocities, stamp in invalid:
            with self.subTest(stamp=stamp, positions=positions):
                self.policy.permit(True, 1.0)
                self.policy.command([0.1] * 3, [1.0] * 2, 1.0, 1.0)
                self.assertFalse(self.policy.command(positions, velocities, stamp, 1.0))
                self.assertEqual(self.policy.output(1.0)[1], [0.0, 0.0])

    def test_clock_rollback_invalidates_command(self):
        self.policy.permit(True, 2.0)
        self.policy.command([0.1] * 3, [1.0] * 2, 2.0, 2.0)
        self.assertEqual(self.policy.output(1.0)[1], [0.0, 0.0])

    def test_sensor_guard_truth_table(self):
        for stowed, closed in product((False, True), repeat=2):
            self.assertEqual(entry_guard('TRAVEL', stowed, closed), stowed and closed)
            self.assertEqual(entry_guard('EXCAVATE', stowed, closed), closed)
            self.assertEqual(entry_guard('DUMP', stowed, closed), stowed)
        self.assertFalse(entry_guard('unknown', True, True))


if __name__ == '__main__':
    unittest.main()
