
#include <stdio.h>
#include "menu.h"
void main(){
char enterCheck=0;
Employee emp[SIZE];
char empCount=0;
char flag=SELECT_NEW;
char choice;
choiceNew();
while(INFINITE_LOOP){
choice=checkButton();
switch(choice){
case ENTER:
if(flag==SELECT_DELETE){
choiceDeleteDetails(&emp,&empCount);
}
if(flag==SELECT_NEW){
choiceNewDetails(&emp,&empCount);
}
if (flag==SELECT_DISPLAY){
choiceDisplayDetails(&emp,&empCount);
}
if(flag==SELECT_EXIT){
choiceExitDetails();
}
if(flag==SELECT_MODIFY){
choiceModifyDetails(&emp,&empCount);
choiceModify();
}
break;

case UP:
flag--;
    switch(flag){

        case SELECT_NEW :
        choiceNew();
        break;

        case SELECT_DISPLAY:
        choiceDisplay();

        break;
        case SELECT_MODIFY:
        choiceModify();
        break;
        case SELECT_DELETE:
        choiceDelete();
        break;
        case MIN_FLAG:
        flag=SELECT_EXIT;
        choiceExit();
        break;

    }

break;

case DOWN:
flag++;

    switch(flag){

        case SELECT_NEW :
        choiceNew();
        break;

        case SELECT_DISPLAY:
        choiceDisplay();

        break;
        case SELECT_MODIFY:
        choiceModify();
        break;

        case SELECT_DELETE:
        choiceDelete();
        break;
        case SELECT_EXIT :
        choiceExit();
        break;
        break;
        case MAX_FLAG:
        flag=MIN_FLAG;
        choiceNew();

    }
break;

case ESC:
    return 0;
break;

case HOME:
choiceNew();
break;

case BACK:
if(flag==SELECT_NEW)choiceNew();
if (flag==SELECT_DISPLAY)choiceDisplay();
if(flag==SELECT_MODIFY)choiceModify();
if (flag==SELECT_EXIT)choiceExit();
if (flag==SELECT_DELETE)choiceDelete();
break;
default:
invalidInput(flag);
break;



}
}}


/*
Check ASCII of a key
void main(){
printf("Enter\n");
char choice=getch();
printf("%d",choice);
if(choice==27){
    choice=getch();
    printf("%d",choice);
    choice=getch();
    printf("%d",choice);
  }
}


*/
