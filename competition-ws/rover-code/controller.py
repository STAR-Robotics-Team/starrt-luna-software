import pygame

class Controller():

    def __init__(self): 
        pygame.init()
        self.joystick = pygame.joystick.Joystick(0)
        self.screen = pygame.display.set_mode((900, 600))
        self.screen.fill((255, 255, 255))

        font = pygame.font.Font('freesansbold.ttf', 15)
        text = font.render('Select your command, then press the appropriate button or move the joystick in your desired direction to set it.', True, (0, 0, 0))
        textRect = text.get_rect()
        textRect.center = (450, 200)
        self.screen.blit(text, textRect)

        pygame.display.set_caption("Set Controller Buttons")
        pygame.display.flip()
        self.running = True
        while self.running:
            self.update()
        
    def update(self):

        for event in pygame.event.get(): 

            if event.type == pygame.QUIT: 
                self.running = False
        
    
if __name__ == "__main__":
    controller = Controller()