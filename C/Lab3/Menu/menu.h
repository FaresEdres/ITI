#ifndef MENU.H
#define MENU.H


/*************KEYS***************/
#define UP 65
#define DOWN 66
#define BACK 127
#define ENTER 10
/***********COLORS***************/
#define SET_WHITE "\033[0m"
#define SET_RED "\033[1;31m"
#define EXTENDED 27
/***********MENU***************/
#define SELECT_NEW      1
#define SELECT_DISPLAY  2
#define SELECT_EXIT     3
/********FLAGS************/
#define MIN_FLAG  0
#define MAX_FLAG  4
/*******INFINITELOOP*******/
#define INFINITE_LOOP 1


void choiceOne();
void choiceTwo();
void choiceThree();
void choiceOneDetails();
void choiceTwoDetails();
void choiceThreeDetails();
char checkButton();


#endif
