#include "menu.h"
#include "conio.h"


void choiceNew(){
clrscr();

        printf(SET_RED);
        printf("New \n");
        printf(SET_WHITE);
        printf("Display \n");
        printf("Modify \n");
        printf("Delete \n");
        printf("Exit \n");
        }
void choiceDisplay(){
clrscr();
printf(SET_WHITE);
        printf("New \n");
        printf(SET_RED);
        printf("Display \n");
        printf(SET_WHITE);
        printf("Modify \n");
        printf("Delete \n");
        printf("Exit \n");
        }
void choiceExit(){
clrscr();
        printf(SET_WHITE);
        printf("New \n");
        printf("Display \n");
        printf("Modify \n");
        printf("Delete \n");
        printf(SET_RED);
        printf("Exit \n");
}
void choiceModify(){
clrscr();
        printf(SET_WHITE);
        printf("New \n");
        printf("Display \n");
        printf(SET_RED);
        printf("Modify \n");
        printf(SET_WHITE);
        printf("Delete \n");
        printf("Exit \n");
}
void choiceDelete(){
clrscr();
        printf(SET_WHITE);
        printf("New \n");
        printf("Display \n");
        printf("Modify \n");
        printf(SET_RED);
        printf("Delete \n");
        printf(SET_WHITE);
        printf("Exit \n");
}
void choiceDeleteDetails(Employee * emp,char* empCount){
int delId;
int i=0;
clrscr();
printf("Select the Id you want to delete");
scanf("%d",&delId);
for(i=0;i<(*empCount);i++){
if(delId==emp[i].id){
clrscr();
delId=i;
emp[i].id=emp[(*empCount)-1].id;
emp[i].salary=emp[(*empCount)-1].salary;
strcpy(emp[i].name,emp[(*empCount)-1].name);
i=(*empCount)+1;
(*empCount)--;
printf("valid\n");
}}
if(i==(*empCount)){
printf("Not valid\n");
}
printf("Press Back to return to the homepage");
while(checkButton()!=BACK);
clrscr();
choiceDelete();
}
char checkButton(){
char choice;
 choice=getch();
if(choice==EXTENDED){
if(kbhit()){
getch();
choice=getch();
}else{return ESC;}
}
}
void choiceNewDetails(Employee * emp,char* empCount){
char select;
char unique;
char *str;
int count=*empCount;
clrscr();
do{

printf("Enter Employee id:\n");
scanf(" %d",&emp[count].id);

unique= isUnique(emp,count,emp[count].id);
if (!unique){
clrscr();
printf("\nnot valid");
}

}while(unique==0);


printf("Enter Employee name:");
scanf(" %s",emp[*empCount].name);
printf("Enter Employee salary:");
scanf(" %d",&emp[*empCount].salary);
(*empCount)++;
int repeat=NO_REPEAT;
while(repeat==NO_REPEAT){
clrscr();
printf("Do you want to enter details of another employee?\nPress y if YES and n for NO");
select=getch();
while (select=='y'||select=='Y'){
clrscr();

unique=0;
while (unique==0){
printf("Enter Employee id:");
scanf(" %d",&emp[*empCount].id);
unique= isUnique(emp,*empCount,emp[*empCount].id);
if (!unique){
clrscr();
printf("Enter Only unique and positive integers\n");
}
}

printf("Enter Employee name:");
scanf("%20s",emp[*empCount].name);
printf("Enter Employee salary:");
scanf(" %d",&emp[*empCount].salary);
(*empCount)++;
select=getch();
}
if (select=='y'||select=='Y'){
repeat=REPEAT;
}
if(select=='n'||select=='N'){
repeat=REPEAT;
choiceNew();
}
}
choiceNew();
}
void choiceDisplayDetails(Employee * emp,char* empCount){
clrscr();
printf("Employees Details\n");
for(int i=0;i<(*empCount);i++){
printf("ID :%d     ",emp[i].id);
printf("Name :%s    ",emp[i].name);
printf("Salary : %d\n",emp[i].salary);
}
while(checkButton()!=BACK);
clrscr();
choiceDisplay();
}
void choiceExitDetails(){
exit(1);
}

void invalidInput(char flag){
clrscr();
printf(SET_RED);
printf("unvalid input please \n") ;
printf(SET_WHITE);
printf("UP arrow to move up \nDOWN arrow to move down\nENTER key to select an option\nBACKSPACE to return to the previous menu\nHOME to return to the homepage \nESC to exit the program\nBACKSPACE to return to the program \n ");
while(getch()!=BACK);
if(flag==SELECT_NEW)choiceNew();
if (flag==SELECT_DISPLAY)choiceModify();
if (flag==SELECT_EXIT)choiceExit();
}
void choiceModifyDetails(Employee * emp,char *empCount){
int select;
char choice;
char modId;
int exit=0;
choiceDisplayDetails(emp,empCount);
printf("Which Employee do you want to modify\n");
scanf("%d",&select);
clrscr();
int i=0;
for(i=0;i<(*empCount);i++){
if(select==emp[i].id){
clrscr();
modId=i;
i=(*empCount)+1;
printf("valid\nPress 1 to modify the name\nPress 2 to change salary\n");
scanf(" %d",&choice);
while(choice!=1&&choice !=2){
scanf(" %d",&choice);
}
char name2[20];
switch(choice){
case 1:
clrscr();
printf("Modify Name:\n");
scanf("%s",name2);
strcpy(emp[modId].name,name2);
printf("%s",emp[modId].name);
break;
case 2:
printf("Modify Salary\n");
scanf("%d",&emp[modId].salary);
printf("%d",emp[modId].salary);
break;
default:
break;
}
}
}
if(i==(*empCount)){


clrscr();
printf("not valid");

}
while(checkButton()!=BACK);
clrscr();
choiceModify();

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