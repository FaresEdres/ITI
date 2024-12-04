#include <iostream>
#include <ctype.h>
#include <string.h>
#include "validate.h"
#include <cmath>
using namespace std;

class Complex{
private:
int real;
int  img;
static int counter;
public:
Complex ComplexAdd(Complex c);
Complex ComplexSub(Complex c);
~Complex(){
cout<<"Bye";

}
void setComplex(int real,int img);
void ComplexDisplay();
void setReal();
void setImg();
int getReal();
int getImg();
Complex operator+(Complex c){
Complex sum;
sum.real=this->real+c.real;
sum.img=this->img+c.img;
return sum;

}
int operator==(Complex c){
    if(c.real==real && c.img==img)return 1;
    else return 0;
}
void operator+=(Complex c){
    this->real += c.real;
    this->img += c.img;
}
void operator++(){
    ++(this->real);

}
void operator--(){
   --(this->real);
}
void operator++(int x){
    (this->real)++;

}
void operator--(int x){
  (this->real) --;
}
operator float(){
return sqrt(real*real+img*img);
}

Complex operator-(Complex c){
    Complex sub;
sub.real=this->real-c.real;
sub.img=this->img-c.img;
return sub;
}
Complex operator+(int num){
    Complex sum;
sum.real=this->real+num;
return sum;
}
Complex operator-(int num){
        Complex sub;
sub.real=this->real-num;
return sub;
}


Complex(int real=0,int img=0){
this->real=real;
this->img=img;
counter++;
}
};


int Complex::counter=0;
void Complex::setComplex(int real,int img){
this->real=real;
this->img=img;

}
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
Complex complexSum(int num,Complex c){
    Complex sum;
    sum=num+c.real;
    return sum;
}

Complex complexSub(int num,Complex c){
    Complex sub;
    sub=sub-c.real;
    return sub;
}




int main()
{
int num;
Complex num1,num2,num3,num4;

num1.setReal();
num1.setImg();
num2.setReal();
num2.setImg();
num3=num2.ComplexAdd(num1);
num4=num2.ComplexSub(num1);
cout<<"Add Function"<<endl;
num3.ComplexDisplay();

cout<<"Sub Function"<<endl;
num4.ComplexDisplay();


    return 0;
    }


