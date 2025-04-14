import pygame
import time

pygame.joystick.init()
joysticks = [pygame.joystick.Joystick(x) for x in range(pygame.joystick.get_count())]

print(len(joysticks))
pygame.init()

while True:
        # Event processing step.
        # Possible joystick events: JOYAXISMOTION, JOYBALLMOTION, JOYBUTTONDOWN,
        # JOYBUTTONUP, JOYHATMOTION, JOYDEVICEADDED, JOYDEVICEREMOVED
        joystick = pygame.joystick.Joystick(0)
        for i in range(4):
            axis = joystick.get_axis(i)
            print(f"Axis {i} value: {axis}")
        time.sleep(2)
        