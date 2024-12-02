#include <iostream>
#include <ctype.h>
#include <string.h>
#include "validate.h"
using namespace std;

class Complex{
private:
int real=0;
int  img=0;
public:
Complex complexAdd(Complex c);
Complex complexSub(Complex c);
void complexDisplay();
void setReal();
void setImg();
int getReal();
int getImg();
};

void Complex::complexDisplay(){


if(this->img==0 &&this->real==0){
cout<<0;


}
else if(this->img==0){
    cout<<this->real<<endl;
}
else if(this->real==0){
cout<<this->img <<'j'<<endl;
}
else if(this->img>0){

cout<<this->real<<'+'<<this->img<<'j'<<endl;
}
else{
cout<<this->real<<this->img<<'j'<<endl;

}

}
void Complex::setReal(){
int num;
do{
num=isdigitnum("Enter Real Value");
}while(!num);
this->real=num;
}
void Complex::setImg(){
int num;
    do{
num=isdigitnum("Enter Imaginary Value");
}while(!num);
    this->img=num;
}

int Complex::getReal(){
return this->real;

}

int Complex::getImg(){
return this->img;
}

Complex Complex::complexAdd(Complex c){

Complex Result;
Result.real=this->real+ c.real;
Result.img=this->img+c.img;

return Result;


}

Complex Complex::complexSub(Complex c){

Complex Result;
Result.real=this->real-c.real;
Result.img=this->img-c.img;

return Result;

}



int main()
{
int num;
Complex num1,num2,num3,num4;

num1.setReal();
num1.setImg();
num2.setReal();
num2.setImg();
num3=num2.complexAdd(num1);
num4=num2.complexSub(num1);
cout<<"Add Function"<<endl;
num3.complexDisplay();

cout<<"Sub Function"<<endl;
num4.complexDisplay();


    return 0;
    }


