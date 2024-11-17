
# include <stdio.h>

void main(){
char choice;
printf("Select from the menu \n");
printf("a- Burger \n");
printf("b- Fries \n");
printf("c- Soda \n");
scanf(" %c",&choice);

switch(choice){
case 'a':
case 'A':
printf("Burger");
break;

case 'b':
case 'B':
printf("Fries");
break;

case 'c':
case 'C':
printf("Soda");
break;

default:
printf("Invalid Input");
break;

}


}

