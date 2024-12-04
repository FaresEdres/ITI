#include <stdio.h>

int mystrlen(char* str){
    int count=0;
    char* sptr=str;
    while(*sptr){
        count++;
        sptr++;
    }
    return count;



}
int mystrcmp(char* str1,char *str2){
    if( mystrlen(str1)>mystrlen(str2)) return 1;
    else if (mystrlen(str1)<mystrlen(str2)) return -1;
    {
    char*ptr1=str1;
    char*ptr2=str2;
while ((*ptr1==*ptr2)&&(*ptr1!='\0') && (*ptr2!='\0')){


    ptr1++;
    ptr2++;

}
return (*ptr1 - *ptr2);

}



}

void strconcat(char* source,char* dest,int destSize){
int scount=0,dcount=0;
char* dptr=dest;
char* sptr=source;
while(*dptr){
dcount++;
dptr++;
}

while(*sptr){
scount++;
sptr++;
}
if(scount+dcount< destSize){
dptr=dest+dcount;
sptr=source;
while(*sptr)
{
*dptr=*sptr;
dptr++;
sptr++;
}
*dptr='\0';
printf("%s",dest);
}
else{printf("No Space available");}
}



void mystrcpy(char * source,char * dest,int destSize){
    char *dptr=dest;
    char *sptr = source;
if(mystrlen(sptr)<destSize){

    while(*sptr){
        *dptr=*sptr;
         dptr++;
        *sptr++;


    }
    *dptr='\0';


}
else{

printf("Size is not available");
}
}


char* upperToLower(char* str){
char*ptr=str;
while(*ptr){
    if(*ptr>='A'&& *ptr<='Z'){

        *ptr+=('a'-'A');
    }
ptr++;


}

 return str;

}
char* lowerToUpper(char* str){
  char*ptr=str;
while(*ptr){
    if(*ptr>='a'&& *ptr<='z'){

         *ptr-=('a'-'A');

    }
     ptr++;


}

return str;
}
