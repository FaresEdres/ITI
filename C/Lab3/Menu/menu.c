#include "menu.h"
void choiceOne(){
clrscr();
printf(SET_RED);
        printf("New \n");
        printf(SET_WHITE);
        printf("Display \n");

        printf("Exit \n");
        }
void choiceTwo(){
clrscr();
printf(SET_WHITE);
        printf("New \n");
        printf(SET_RED);
        printf("Display \n");
        printf(SET_WHITE);
        printf("Exit \n");
        }
void choiceThree(){
clrscr();
        printf(SET_WHITE);
        printf("New \n");
        printf("Display \n");
        printf(SET_RED);
        printf("Exit \n");

}
char checkButton(){
char choice;
 choice=getch();
if(choice==EXTENDED){
    getch();
    choice=getch();

  }
}
void choiceOneDetails(){
clrscr();
printf("menu1");
}
void choiceTwoDetails(){
clrscr();
printf("menu2");
}
void choiceThreeDetails(){
exit(1);
}
/*char buttonCheck(char choice){
if(choice==EXTENDED){
    choice=getch();
    printf("%d",choice);
    choice=getch();
    printf("%d",choice);
  }
return choice;

}*/
