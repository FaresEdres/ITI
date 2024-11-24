#include <stdio.h>
#include <stdlib.h>
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
#define ESC 888
#define ARRAY_SIZE 100
#define cursor(x,y)  printf("\033[%d;%dH",y,x)

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

int main()
{
char curr=0,end=0,start=0,ch;
char str[ARRAY_SIZE];
str[0]='\0';
    while(1){

ch=checkButton();

switch(ch){

case RIGHT:

if((curr+1)<=end)
{
printf("\033[;%dH",curr+1);
curr++;
}
break;
case LEFT:
if((curr-1)>=start)
{
printf("\033[;%dH",curr-1);
curr--;
}
break;

case BACK:
for(int i=end;i>=curr;i--){
str[i+1]=str[i];

}
str[curr]=ch;
str[++end]='\0';
    printf("%s",str);
    printf("\033[;%dH",curr);

break;

case HOME:
printf("\033[;%dH",start);
curr=start;
break;


case END:
printf("\033[;%dH",end);
curr=end;


default:

 clrscr();
    if (curr==end){
    str[curr++]=ch;

    str[curr]='\0';

    end++;

    printf("%s",str);
}
else{

for(int i=end;i>=curr;i--){
str[i+1]=str[i];

}
str[curr]=ch;
str[++end]='\0';
    printf("%s",str);
    printf("\033[;%dH",curr);
}
    break;


    }

}
return 0;
}
