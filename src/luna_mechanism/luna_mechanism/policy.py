"""ROS-independent validation and motion gating for the standalone stub."""

from math import isfinite
import xml.etree.ElementTree as ET


POSITION_JOINTS = ('depth_left_joint', 'depth_right_joint', 'hatch_joint')
VELOCITY_JOINTS = ('excavator_chain_joint', 'conveyor_joint')


class MotionPolicy:
    """Clamp to model limits and require fresh commands and permission."""

    def __init__(self, description, timeout=0.5):
        if not isfinite(timeout) or timeout <= 0:
            raise ValueError('timeout must be positive and finite')
        self.timeout = timeout
        joints = {j.attrib['name']: j for j in ET.fromstring(description).findall('joint')}
        self.bounds = []
        for name in POSITION_JOINTS:
            limit = joints[name].find('limit')
            low, high = float(limit.attrib['lower']), float(limit.attrib['upper'])
            if not all(map(isfinite, (low, high))) or low > high:
                raise ValueError('invalid position bounds')
            self.bounds.append((low, high))
        self.speeds = [float(joints[n].find('limit').attrib['velocity'])
                       for n in VELOCITY_JOINTS]
        if any(not isfinite(v) or v <= 0 for v in self.speeds):
            raise ValueError('invalid velocity bounds')
        self.position = [min(max(0.0, lo), hi) for lo, hi in self.bounds]
        self.target = list(self.position)
        self.velocity = [0.0, 0.0]
        self.command_time = None
        self.permission_time = None
        self.allowed = False

    def fresh(self, stamp, now):
        """Reject old, future, and non-finite timestamps."""
        return (stamp is not None and isfinite(stamp) and isfinite(now)
                and 0 <= now - stamp < self.timeout)

    def permit(self, allowed, now):
        """Permission is a heartbeat, never a latched authorization."""
        self.allowed = bool(allowed)
        self.permission_time = now
        if not self.allowed:
            self.command_time = None

    def command(self, positions, velocities, stamp, now):
        """Reject malformed messages atomically and discard denied commands."""
        self.command_time = None
        if (not self.allowed or not self.fresh(self.permission_time, now)
                or not self.fresh(stamp, now)
                or len(positions) != 3 or len(velocities) != 2
                or not all(isfinite(v) for v in (*positions, *velocities))):
            return False
        self.target = [min(max(v, lo), hi)
                       for v, (lo, hi) in zip(positions, self.bounds)]
        self.velocity = [min(max(v, -limit), limit)
                         for v, limit in zip(velocities, self.speeds)]
        self.command_time = stamp
        return True

    def output(self, now):
        """Hold the last position command and zero speeds when inhibited."""
        active = (self.allowed and self.fresh(self.permission_time, now)
                  and self.fresh(self.command_time, now))
        if active:
            self.position = list(self.target)
        else:
            # Expired commands must not resume after permission returns.
            self.command_time = None
        return list(self.position), list(self.velocity) if active else [0.0, 0.0]


def entry_guard(mode, stowed, hatch_closed):
    """Sensor-only truth table from 4.4, not a replacement mode manager."""
    return {'TRAVEL': stowed and hatch_closed,
            'EXCAVATE': hatch_closed, 'DUMP': stowed}.get(mode, False)
