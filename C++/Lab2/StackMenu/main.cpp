#include <iostream>
#include <ctype.h>
#include <string.h>
#include "menu.h"
#include "validation.h"
#include "conio.h"
using namespace std;
class Stack{
   private:
Employee* items;
int top=-1;

public:
int stackSize;
int push();
int pop();
void stackDisplay();

~Stack(){delete[]items;}
Stack(int stackSize){
    top=-1;
    items=new Employee[stackSize];
    this->stackSize=stackSize;
}

};

void Stack::stackDisplay(){
int x;
printf(SET_WHITE);
    if(top==-1){
    cout<<"No Employees in the database"<<endl;


    }

    else{for(int i=0;i<=top;i++){

        cout<<"ID:"<<items[i].id<<"\t"<<"Name:"<<items[i].name<<"\t"<<"Salary:"<<items[i].salary<<endl;

    }
    }

}

int Stack::pop(){
        if(top==-1){
        cout<<"No Employees in the database"<<endl;
        return -1;
    }
     cout<<"ID:"<<items[top].id<<"\t"<<"Name:"<<items[top].name<<"\t"<<"Salary:"<<items[top].salary<<endl;
    top--;
    return 1;
}

int Stack::push(){
    if(top==stackSize-1){
    cout<<"Database is Full"<<endl;
        return -1;
    }
top++;
items[top].id=getValidInteger("Enter Positive Integer ID");
do{
while (kbhit()) { // Check if there are characters in the buffer
        getch();      // Consume them
    }
cout<<"Enter a Valid Name"<<endl;
   scanf(" %99[^\n]", items[top].name);

}while(!(isAlphaSpace(items[top].name)));
while (kbhit()) { // Check if there are characters in the buffer
        getch();      // Consume them
    }
items[top].salary=getValidInteger("Enter Salary");

return 1;

}

int main()
{int num;


num=getValidInteger("Enter Stack Size");


Stack s(num);

while (true) {
char choice;
char enterCheck=0;
char empCount=0;
char flag=SELECT_PUSH;
choicePush();
while(INFINITE_LOOP){
choice=checkButton();
switch(choice){
case ENTER:
if(flag==SELECT_PUSH){
clrscr();
s.push();
sleep(3);
choicePush();
}
if(flag==SELECT_POP){
clrscr();
s.pop();
sleep(5);
choicePop();
}
if (flag==SELECT_DISPLAY){
clrscr();
s.stackDisplay();
sleep(5);
choiceDisplay();
}
break;

case UP:
flag--;
    switch(flag){

        case SELECT_PUSH :
        choicePush();
        break;

        case SELECT_POP:
        choicePop();

        break;
        case SELECT_DISPLAY:
        choiceDisplay();
        break;
        case MIN_FLAG:
        flag=SELECT_DISPLAY;
        choiceDisplay();
        break;

    }

break;

case DOWN:
flag++;

    switch(flag){

         case SELECT_PUSH :
        choicePush();
        break;

        case SELECT_POP:
        choicePop();

        break;
        case SELECT_DISPLAY:
        choiceDisplay();

        break;
        case MAX_FLAG:
        flag=MIN_FLAG;
        choicePush();

    }
break;

case ESC:
    return 0;
break;

case HOME:
choicePush();
break;
/*
case BACKSPACE:
if(flag==SELECT_PUSH)choicePush();
if (flag==SELECT_DISPLAY)choiceDisplay();
if(flag==SELECT_POP)choicePop();
break;
default:

break;
*/


}

}

}

return 0;
    }


