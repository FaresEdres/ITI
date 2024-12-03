#ifndef MENU.H
#define MENU.H
/*************KEYS***************/
#define ENTER 10
#define BACKSPACE 127
#define ESC 27
#define UP 'U'
#define DOWN 'D'
#define RIGHT 'R'
#define LEFT 'L'
#define HOME 'H'
/***********COLORS***************/
#define SET_WHITE "\033[0m"
#define SET_RED "\033[1;31m"
#define CLEAR "\x1b[2J"
#define SET11 "\x1b[1;1f"
#define EXTENDED 27
/***********MENU***************/
#define SELECT_PUSH     1
#define SELECT_POP       2
#define SELECT_DISPLAY     3

/********FLAGS************/
#define MIN_FLAG  0
#define MAX_FLAG  4
/*******INFINITELOOP*******/
#define INFINITE_LOOP 1
/********REPEAT**********/
#define REPEAT 1
#define NO_REPEAT 0
/*********ARRAY*********/
#define SIZE 100
/********Struct******/
typedef struct Employee{
char name[100];
unsigned int id;
unsigned int salary;
}Employee;
/*****FUNCTION PROTOTYPES*********/
void choicePush();
void choicePop();
void choiceDisplay();
void choicePushDetails(Employee* emp,char *empCount);
void choicePopDetails(Employee * emp,char *empCount);
void choiceDisplayDetails();
//void choiceModifyDetails(Employee * emp,char *empCount);
//void choiceDeleteDetails(Employee * emp,char *empCount);
char checkButton();
void clrscr();

//void invalidInput(char flag);

#endif
