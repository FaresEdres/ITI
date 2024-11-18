
#include <stdio.h>
#include "conio.h"
#include "menu.h"


void main(){

char flag=1;
char choice;
choiceOne();
while(1){
char choice=getch();
printf("%d",choice);
if(choice==EXTENDED){
    choice=getch();
    printf("%d",choice);
    choice=getch();
    printf("%d",choice);
  }
clrscr();
switch(choice){
case UP:
flag--;

    switch(flag){

        case 1:
        choiceOne();
        break;

        case 2:
        choiceTwo();

        break;

        case 0:
        flag=3;
        choiceThree();
        break;

    }

break;

case DOWN:
flag++;

    switch(flag){

        case 2:

choiceTwo();
        break;
        case 3:

choiceThree();

        break;
        case 4:
        flag=1;
choiceOne();

        break;

    }
break;


case ENTER:

if(flag==1){
printf("menu1");

while(getch()!=BACK);

clrscr();
choiceOne();

}
if (flag==2){
printf(" menu2");
while(getch()!=BACK);

clrscr();
choiceOne();

}

if(flag==3)return 0;
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
