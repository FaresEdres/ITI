#include <iostream>
#include "mystring.h"
#include <exception>
using namespace std;
class String{
private:
char*str;
int len;
public:

String(){

len=1;
str=new char[len];

str[0]='\0';
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
void operator= (String s){

len=s.len;
delete[] str;
str=new char[len+1];
for(int i=0;i<len;i++){
str[i]=s.str[i];

}
str[len]='\0';

}
~String(){
delete[]str;
}

int strLen(){
    return len;
}
void stringDisplay(){
cout<<str;


}
int operator==(String text){
return mystrcmp(this->str,text.str);
}
// this + text
String operator+(String text){
    String newStr;
  newStr.len=text.len+this->len;
  try{
  newStr.str=new char[newStr.len +1];
  if(newStr.str==nullptr) throw exception();
  }
  catch(exception &e) {
  cout<<"No Space";
  }


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
char str22[]="Mohammed";


String str1 ("AHMED");
String str2 ("  Mohamed");
String str3=str1+str2;



str3.stringDisplay();
    return 0;
    }




