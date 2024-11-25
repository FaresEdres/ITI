#include <stdio.h>
#include <stdlib.h>
#include "conio.h"
#define ESC 6888
#define EXTENDED 27
#define RIGHT 67
#define LEFT 68
#define BACK 127
#define HOME 72
#define INSERT 80
#define END 70
#define DELETE 81
#define STR_SIZE 100

char checkButton() {
    char choice;
    choice = getch();
    if (choice == EXTENDED) {
        if (kbhit()) {
            getch();
            choice = getch();
        } else {
            return ESC;
        }
    }
    return choice;
}



int main() {
    char *start, *curr, *end;
    char str[STR_SIZE] = {0};
    char ch;
    int flag=0;
    start=str;
    curr=str;
    end=str;
   clrscr();
    while (1) {
        ch = checkButton();

        switch (ch) {
            case RIGHT:
                if ((curr + 1) <= end) {
                    curr++;
                    printf("\033[1C");
                }
                break;

            case LEFT:
                if (curr > start) {
                    curr--;
                    printf("\033[1D");
                }
                break;

            case BACK:
                if (curr > start) {
                    char *ptr=curr-1;
                    while (ptr < end) {
                        *ptr =*(ptr+1);
                        ptr++;
                    }
                    end--;
                    curr--;
                    clrscr();
                    printf("%s",start);
                    printf("\033[%ldG",curr-start+1);
                }
                break;

            case HOME:
                curr=start;
                //move to first col
                printf("\033[1G");
                break;

            case END:
                curr=end;
                //move to last col
                printf("\033[%ldG",curr-start+1);
                break;

            case DELETE:
                if (curr < end) {
                    char *ptr = curr;
                    while (ptr < end) {
                        *ptr =*(ptr + 1);
                        ptr++;
                    }
                    end--;

                    clrscr();
                    printf("%s",start);
                    printf("\033[%ldG",curr-start+1);
                }
                break;

            case INSERT:
                flag = !flag;
                if (flag) {
                    printf("\033[4 q");
                } else {
                    printf("\033[0 q");
                }
                break;

            default:
                if (curr == end) {
                    *curr = ch;
                    curr++;
                    *curr = '\0';
                    end++;
                } else {
                    if (flag==1) {
                        *curr = ch;
                        curr++;
                    } else {
                        char *ptr = end;
                        while (ptr >= curr) {
                            *(ptr + 1) = *ptr;
                            ptr--;
                        }
                        *curr = ch;
                        end++;
                        curr++;
                    }
                }

                clrscr();
                printf("%s", start);
                printf("\033[%ldG", curr - start + 1);
                break;
        }
    }

    return 0;
}
