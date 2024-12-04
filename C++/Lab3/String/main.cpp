#include <iostream>
#include "mystring.h"

using namespace std;
class String{
private:
char*str;
int len;
public:

String(){

len=5;
str=new char[len+1];

for(int i=0;i<len;i++){
str[i]='\0';
}
str[len]='\0';
}
String(const char *ptr){
    int count=0;
    while(ptr[count])count++;
len=count;
str=new char[len+1];

for(int i=0;i<len;i++){
str[i]=ptr[i];
}
str[len]='\0';
}
String( String &z){
    this->len=z.len;
    this->str=new char[this->len+1];
    for(int i=0;i<this->len;i++){
        this->str[i]=z.str[i];
    }
    this->str[this->len]='\0';
}
~String(){
delete[]str;
}

int strLen(){
    return len;
}
int operator==(String text){
return mystrcmp(this->str,text.str);
}
// this + text
String operator+(String text){
    String newStr;
  newStr.len=text.len+this->len;
  newStr.str=new char[newStr.len +1];

  int i;
  for( i=0;i<this->len;i++){
    newStr.str[i]=this->str[i];
}
for(i=0;i<text.len;i++){
    newStr.str[this->len+i]=text.str[i];
}
newStr.str[this->len+i]='\0';
   return newStr;

  }


};




int main()
{





char str11[]="ahmed";
char str22[]="ahmed";

String str1("AHMED");
String str2 ("AHMED");


if(!(str1==str2))cout<<"yes";
else cout<<"no";

    return 0;
    }
int mystrcmp(char* str1,char *str2){
    if( mystrlen(str1)>mystrlen(str2)) return 1;
    else if (mystrlen(str1)<mystrlen(str2)) return -1;

    int i=0;
while ((str1[i]==str2[i])&&(str1[i]!='\0') && (str2[i]!='\0')){


    i++;

}
return (str1[i] - str2[i]);

}
int mystrlen(char* str){
    int count=0;
    char* sptr=str;
    while(*sptr){
        count++;
        sptr++;
    }
    return count;



}

