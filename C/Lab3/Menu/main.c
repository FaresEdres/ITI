
#include <stdio.h>
#include "conio.h"
#include "menu.h"


void main(){

char flag=SELECT_NEW;
char choice;
choiceOne();
while(INFINITE_LOOP){
choice=checkButton();
switch(choice){
case UP:
flag--;
    switch(flag){

        case SELECT_NEW :
        choiceOne();
        break;

        case SELECT_DISPLAY:
        choiceTwo();

        break;

        case MIN_FLAG:
        flag=SELECT_EXIT;
        choiceThree();
        break;

    }

break;

case DOWN:
flag++;

    switch(flag){

        case SELECT_DISPLAY:

        choiceTwo();
        break;
        case SELECT_EXIT:

        choiceThree();

        break;
        case MAX_FLAG:
        flag=SELECT_NEW;
        choiceOne();

        break;

    }
break;

case BACK:
if(flag==SELECT_NEW)choiceOne();
if (flag==SELECT_DISPLAY)choiceTwo();
if (flag==SELECT_EXIT)choiceThree();

break;

case ENTER:

if(flag==SELECT_NEW){

choiceOneDetails();

}
if (flag==SELECT_DISPLAY){

choiceTwoDetails();
}

if(flag==SELECT_EXIT){
choiceThreeDetails();
}
break;

default:
printf("Invalid Input");
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
