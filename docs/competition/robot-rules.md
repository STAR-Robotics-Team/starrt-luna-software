# Rules the robot must follow

The guidebook's requirements for the robot itself: its size and mass, power and the
emergency stop, which sensors and parts are allowed, how it must behave in the arena, and
its radio link. A robot that breaks them does not pass inspection, loses points, or is
disqualified. Read [The Lunabotics competition](README.md) first for the big picture.

When the robot rules (section 13) disagree with another section of the guidebook,
section 13 wins ([§13, p. 41](../sources.md#nasa-lunabotics-guidebook-2027)). The
communication rules (section 14) and the Mission Control and autonomy rules (section 15)
say the same about themselves
([§14, p. 45](../sources.md#nasa-lunabotics-guidebook-2027) and
[§15, p. 52](../sources.md#nasa-lunabotics-guidebook-2027)). Parts do not need to be
space-rated, but the robot must work in ways that would also work on the Moon
([§13 and §13.8, pp. 41-44](../sources.md#nasa-lunabotics-guidebook-2027)).

## Size and mass

| Rule | Limit |
| --- | --- |
| Size at the start | Fits inside a box 150 cm by 75 cm by 75 cm, checked folded up at inspection. The box can be turned any way ([§13.3.1, p. 42](../sources.md#nasa-lunabotics-guidebook-2027) and [§12.1, p. 40](../sources.md#nasa-lunabotics-guidebook-2027)) |
| Size after the start | May unfold beyond the box, but never higher than 250 cm above the regolith ([§13.3.2, p. 42](../sources.md#nasa-lunabotics-guidebook-2027)) |
| Mass | 80 kg at most. Lighter scores better ([§13.4.1, p. 42](../sources.md#nasa-lunabotics-guidebook-2027)) |
| What counts toward the mass | Everything on the robot, including its radio and video equipment, and any navigation beacons placed in the arena. Equipment in Mission Control does not count ([§13.4.3 to §13.4.5, p. 43](../sources.md#nasa-lunabotics-guidebook-2027)) |
| Lifting | At least four marked lifting points, safe for hands, and one person per 20 kg of robot to carry it ([§13.4.2, pp. 42-43](../sources.md#nasa-lunabotics-guidebook-2027)) |
| Several robots | Allowed, if all of them together fit the same box and mass limit and stay under the team's control ([§13.3.3, p. 42](../sources.md#nasa-lunabotics-guidebook-2027)) |
| Direction arrows | Three arrows on the robot: its length, its width, and its forward direction, used to point it north, east, south, or west at the start ([§13.5, p. 43](../sources.md#nasa-lunabotics-guidebook-2027)) |

## Power and the energy logger

- The robot carries its own power, with no limit except that it counts toward the mass.
  No power is supplied during a run
  ([§13.1.5, p. 41](../sources.md#nasa-lunabotics-guidebook-2027)).
- It must carry a removable, off-the-shelf **energy logger**, a meter that records and
  shows the energy the robot used, where judges can reach it without kneeling
  ([§13.1.1, p. 41](../sources.md#nasa-lunabotics-guidebook-2027)).
- The logger is wired between the battery and the E-stop, so pressing the E-stop does not
  erase its reading. Wiring it anywhere else costs 30 points, and risks a score of zero if
  the E-stop has to be pressed
  ([§13.1.2 and §13.1.3, p. 41](../sources.md#nasa-lunabotics-guidebook-2027)).

## The emergency stop

The **E-stop** is a big red button that cuts power in an emergency. The rules
([§13.2, pp. 41-42](../sources.md#nasa-lunabotics-guidebook-2027)):

- An unmodified, off-the-shelf red button at least 40 mm across.
- At the highest point of the robot, reachable from every side without reaching over,
  under, or around anything, and with no collar around it.
- One push stops the robot and cuts the batteries off from every motor controller and the
  other active systems. A relay is allowed if it opens to stop the robot.
- It stays pressed until someone deliberately resets it, such as by twisting it, and
  resetting it alone must not start the robot again.
- Only one E-stop per robot. Disabling it without permission is a safety disqualification.
- The only things allowed to stay on after it is pressed are computers on their own,
  separate battery, such as a small battery that powers only the control computer.

The [operating modes design](../design/operating-modes.md) shows how the robot's software
follows these rules.

## Sensors and navigation

What the robot may use to find its way
([§13.7, p. 43](../sources.md#nasa-lunabotics-guidebook-2027)):

- **No GPS, GPS with a built-in IMU, or compass** may feed the robot's calculations. The
  team must show the inspectors how they are switched off or ignored.
- **Beacons and markers** (fiducials, such as printed tags a camera recognizes) may be
  attached only to the arena frame along the two sides of the starting zone, with tape,
  clamps, or rods pushed into the regolith, never with screws. They are put up during
  setup and taken down after the run, and they count toward the robot's mass.
- **Lasers** must be Class I, Class II, or under 5 mW, unmodified, with the maker's
  documentation for the inspectors.

What the robot may not be built with, because it would not work on the Moon
([§13.8, pp. 43-44](../sources.md#nasa-lunabotics-guidebook-2027)):

| Not allowed | Allowed (the guidebook's examples) |
| --- | --- |
| GPS | Inertial measurement units (IMUs) |
| Ultrasonic proximity sensors | Infrared sensors, proximity detectors, Hall effect sensors |
| Rubber pneumatic tires, air- or foam-filled tires, open- or closed-cell foam | Rubber or plastic parts, composites |
| Hydraulics | Closed-loop pneumatics with the gas carried on board |
| | Sealed lead-acid or nickel-metal hydride batteries, fan-cooled electronics, brushed motors |

Lithium batteries are not banned: the battery rules for the pits cover lithium-ion
packs ([§10.2, p. 30](../sources.md#nasa-lunabotics-guidebook-2027)).

For **autonomous travel**, there are extra rules
([§16.3, p. 56](../sources.md#nasa-lunabotics-guidebook-2027)):

- The robot may not use what it knows in advance about the walls or the column, such as
  their measurements, to work out where it is. It may detect them with its sensors and use
  them as landmarks.
- It may not simply follow a wall, for example by keeping 0.5 m away from it.
- Touch sensors, including wire whiskers that brush a wall, are not allowed.
- It must find its own path around obstacles: no "point and go" route, and no waypoints
  ("bread crumbs") given from Mission Control. The team must show the judges a live view
  of the obstacles the robot detects, its map, and its planned path.

## How the robot must behave

During a run, the robot
([§13.9, pp. 44-45](../sources.md#nasa-lunabotics-guidebook-2027)):

- Starts entirely inside its starting position, and is not anchored to the ground.
- May be teleoperated or autonomous.
- Stays inside the arena, and never rams or hits the walls or uses any part of the arena,
  such as the walls or column, to do its work.
- Digs only in the excavation zone, which includes the starting zone, and never takes
  regolith from the obstacle or construction zones.
- Carries all regolith across the obstacle zone. Pushing it across with a blade does not
  count.
- Does not push or move obstacles in the obstacle zone, avoids its craters, and never
  fills them. Rocks may be pushed aside in the excavation and construction zones.
- Never pushes into the regolith with more force than its own weight, and uses no
  projectiles or far-reaching arms.
- Does not change the regolith's physical or chemical properties.
- Stops immediately when the power-off command is sent or a judge says so.

Teams may repair and change the robot while the pits are open, but not after its safety
inspection for a run ([§13.9.1, p. 44](../sources.md#nasa-lunabotics-guidebook-2027)).

## Communications

The robot's radio link must follow these rules
([§14.1, pp. 47-48](../sources.md#nasa-lunabotics-guidebook-2027)):

- **Wi-Fi (IEEE 802.11)** between the team's access point and the robot. The router must
  support both the 2.4 and 5 GHz bands and be able to turn 2.4 GHz off.
- **The team's assigned network name** (SSID), "Team_##", broadcast (not hidden), with
  encryption on, used by every radio on the robot.
- **No channel bonding on 2.4 GHz:** every transmitter is set to a 20 MHz channel width.
- **No power amplifiers,** and all equipment within the FCC's limits for unlicensed
  radios.
- **Bluetooth** only at Class 2 or 3 (2.5 mW at most); Class 1 is banned. **Zigbee**
  (IEEE 802.15.4) on 2.4 GHz is banned.
- **Average bandwidth** of no more than 4,000 kbit/s over the run, with no limit on short
  peaks. Each NASA camera used adds 500 kbit/s.

In the pits, every router keeps 2.4 GHz off and uses 5 GHz or an Ethernet cable. Testing
on 2.4 GHz needs the Pit Boss's permission and uses channel 11 only. Transmitting on
channel 1 in the pits without permission earns a warning the first time, a 500-point
deduction the second time, and disqualification the third
([§14.2, pp. 48-49](../sources.md#nasa-lunabotics-guidebook-2027)).

In the arena, the robot runs on channel 1 only, and the team must be able to switch to it
within 15 minutes of being told. Being on the wrong channel during a run means
disqualification ([§14.4, pp. 49-50](../sources.md#nasa-lunabotics-guidebook-2027)).

**A question to settle.** [TBD: The guidebook also says teams "can elect to use 5 GHz Wi-Fi
during competition for WAP to robot communications", which NASA does not monitor for
interference ([§14.1.17, p. 48](../sources.md#nasa-lunabotics-guidebook-2027)), but channel
1 is a 2.4 GHz channel and section 14.4 says robot operations happen only on it. Ask in
the FAQ before designing the link around 5 GHz.]

The **communications check** before the first run takes up to 15 minutes, on channel 1.
The team must show every radio on the robot, control the robot wirelessly, show that
2.4 GHz turns off, and bring printed datasheets for any Bluetooth or other non-Wi-Fi
radios. Failing it means disqualification
([§14.3, p. 49](../sources.md#nasa-lunabotics-guidebook-2027)).

## Inspections

| Inspection | When | What is checked |
| --- | --- | --- |
| Safety inspection | Once early on, then before every run, up to 4 in all ([§10.6, pp. 31-32](../sources.md#nasa-lunabotics-guidebook-2027)) | Energy loggers, E-stop, four lifting points, size, mass, and points for dust-tolerant design ([§12.1, p. 40](../sources.md#nasa-lunabotics-guidebook-2027)) |
| Communications check | Before the first run ([§17.1.1, p. 59](../sources.md#nasa-lunabotics-guidebook-2027)) | The radio rules above ([§14.3, p. 49](../sources.md#nasa-lunabotics-guidebook-2027)) |
| Autonomy review | Before the first run | How the autonomy works, that it does not rely on the walls or bread crumbs, and a live view of obstacle detection, mapping, and path planning ([§16, p. 55](../sources.md#nasa-lunabotics-guidebook-2027)) |

The robot must pass both the safety and communications inspections to enter the arena
([§10.6, p. 32](../sources.md#nasa-lunabotics-guidebook-2027)). The Proof of Life video,
due in April, shows several of these checks ahead of time: the size and mass measured by
the faculty advisor, the loggers, the E-stop, and the router turning 2.4 GHz off
([§6.4, p. 15](../sources.md#nasa-lunabotics-guidebook-2027)).

## What this means for the software team

| Rule | What the software has to do |
| --- | --- |
| E-stop and power-off command | Stop everything on command, and never restart on its own after power returns. See the [operating modes design](../design/operating-modes.md) |
| No GPS or compass, beacons only at the start | Localize from the robot's own sensors and the starting zone's markers |
| Walls are not known landmarks | Detect obstacles and build a map; never hard-code arena dimensions into localization |
| No ultrasonic or touch sensors | Rely on lidar, cameras, IMUs, and the motor encoders |
| Average bandwidth of 4,000 kbit/s or less | Budget every topic sent over the link, especially video |
| Channel 1 within 15 minutes | Make the radio settings quick and repeatable |
| Live view for the autonomy review | Show detected obstacles, the map, and the planned path, for example in RViz |
