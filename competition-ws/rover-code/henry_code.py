import pygame as pg


class Main(object):
    def __init__(self):
        pg.init()
        self._running = False
        self.display = pg.display.set_mode((800, 600), pg.RESIZABLE)
        self.joysticks = [pg.joystick.Joystick(x) for x in range(pg.joystick.get_count())]

    def run(self):
        self._running = True
        print(self.joysticks)
        while self._running:
            events = pg.event.get()
            self.update(events)
            self.output()
            self.check_for_quit(events)
        self.on_quit()
    
    def update(self, events):
        filter_type = None
        filter_axis = 5
        for event in events:
            if filter_type is None:
                print(event)
            elif event.type == filter_type:
                if filter_type == pg.JOYAXISMOTION:
                    if filter_axis is None or event.axis == filter_axis:
                        print(f"axis: {event.axis}\tvalue: {event.value}")
                elif filter_type == pg.JOYHATMOTION:
                    print(f"hat: {event.hat}\tvalue: {event.value}")
                elif filter_type in (pg.JOYBUTTONDOWN, pg.JOYBUTTONUP):
                    print(f"button: {event.button}")

    def output(self):
        self.display.fill((255, 255, 255))
        pg.display.flip()
    
    def check_for_quit(self, events):
        for event in events:
            if (event.type == pg.KEYDOWN and event.key == pg.K_ESCAPE) or event.type == pg.QUIT:
                self._running = False
    
    def on_quit(self):
        pg.quit()


if __name__ == "__main__":
    Main().run()