
#include "validation.h"
    char isUnique(Employee *emp,int count,int id){
    for(int i=0;i<count;i++){
    if(emp[i].id==id){

    return 0;
    }

    }
    return 1;

    }

    char isNum(char *str){
    while(*str){

if(!isdigit(*str)){

return 0;
}
str++;
}
return 1;


    }
