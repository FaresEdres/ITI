#ifndef MENU.H
#define MENU.H
/*************KEYS***************/
#define UP 65
#define DOWN 66
#define BACK 127
#define ENTER 10
#define ESC 27
#define HOME 72
/***********COLORS***************/
#define SET_WHITE "\033[0m"
#define SET_RED "\033[1;31m"
#define EXTENDED 27
/***********MENU***************/
#define SELECT_NEW      1
#define SELECT_DISPLAY  2
#define SELECT_EXIT     5
#define SELECT_MODIFY   3
#define SELECT_DELETE   4
/********FLAGS************/
#define MIN_FLAG  0
#define MAX_FLAG  6
/*******INFINITELOOP*******/
#define INFINITE_LOOP 1
/********REPEAT**********/
#define REPEAT 1
#define NO_REPEAT 0
/*********ARRAY*********/
#define SIZE 100
/********Struct******/
typedef struct Employee{
unsigned char name[20];
unsigned char id;
unsigned int salary;
}Employee;
/*****FUNCTION PROTOTYPES*********/
void choiceNew();
void choiceDisplay();
void choiceExit();
void choiceModify();
void choiceDelete();
void choiceNewDetails(Employee* emp,char *empCount);
void choiceDisplayDetails(Employee * emp,char *empCount);
void choiceExitDetails();
void choiceModifyDetails(Employee * emp,char *empCount);
void choiceDeleteDetails(Employee * emp,char *empCount);
char checkButton();
void invalidInput(char flag);

#endif
