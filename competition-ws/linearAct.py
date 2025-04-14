#Links for possible control libraries:
#https://pypi.org/project/simple-pid/
#https://robotpy.readthedocs.io/projects/ctre/en/stable/phoenix5.html
import math

#motion magic
#set and recieve
#

#vertical depth conversions
class LinearActuator:

    # Control board
    height_of_excavator = 0
    target_depth = 0
    stroke_length = 0
    
    def __init__(self, pivot_height, angle, desired_depth):
        self.height_of_pivot = pivot_height
        self.angle = angle
        self.desired_depth = desired_depth

    def force_calculations(self):
        # Placeholder for force calculations
        pass

    def holding_weight(self):
        # Placeholder for holding weight calculations
        pass

    def stall_weight(self):
        # Placeholder for stall weight calculations
        pass

    def acceleration(self):
        # Placeholder for acceleration calculations
        pass
    def lin_ext(pivot_height, angle, desired_depth):
        # Placeholder for linear extension calculations
        pass

if __name__ == "__main__":
    # TESTING
    actuator = LinearActuator(pivot_height=10, angle=30, desired_depth=5)
    actuator.force_calculations()
    actuator.holding_weight()
    actuator.stall_weight()
    actuator.acceleration()