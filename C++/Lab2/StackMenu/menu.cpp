#include <iostream>
#include <termios.h>
#include <unistd.h>

#include "menu.h"




char checkButton() {
    struct termios oldt, newt;
    char buf[10]; // Buffer to handle longer escape sequences
    int n = 0;

    // Save the current terminal settings
    tcgetattr(STDIN_FILENO, &oldt);
    newt = oldt;


    newt.c_lflag &= ~(ICANON | ECHO);
    tcsetattr(STDIN_FILENO, TCSANOW, &newt);

    // Read key input
    n = read(STDIN_FILENO, buf, sizeof(buf));
    tcsetattr(STDIN_FILENO, TCSANOW, &oldt); // Restore terminal settings


    if (n >= 3 && buf[0] == 27 && buf[1] == '[') {
        // Handle common special keys
        switch (buf[2]) {
            case 'A': return UP;
            case 'B': return DOWN;
            case 'C': return RIGHT;
            case 'D': return LEFT;
            case 'H': return HOME;
            case 'F': return ESC;
            default:
                if (n == 4 && buf[2] == '1') { // F1-F4 keys
                    switch (buf[3]) {
                        case '1': return 'F1';
                        case '2': return 'F2';
                        case '3': return 'F3';
                        case '4': return 'F4';
                    }
                }
        }
    } else if (n >= 2 && buf[0] == 27) {
        // ALT key combinations
        return 'A'; // ALT key detected
    }

    // Handle normal keys (letters, numbers, etc.)
    return buf[0];
}



void choicePush(){
clrscr();

        printf(SET_RED);
        printf("Push \n");
        printf(SET_WHITE);
        printf("Pop \n");
        printf("Display \n");
        }
void choicePop(){
clrscr();
 printf(SET_WHITE);

        printf("Push \n");
       printf(SET_RED);
        printf("Pop \n");
         printf(SET_WHITE);
        printf("Display \n");
        }
void choiceDisplay(){
clrscr();

       printf(SET_WHITE);
        printf("Push \n");

        printf("Pop \n");
         printf(SET_RED);
        printf("Display \n");
}

