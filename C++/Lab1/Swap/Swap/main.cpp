#include <iostream>

using namespace std;
void swapValue(int num1,int num2);
void swapRef(int &num1,int &num2);
void swapAddress(int *num1,int *num2);

int main()
{

    int num1=5;
    int num2=6;
    cout<<"Base Value \n num1="<<num1<<"\tnum2="<<num2<<endl;
    swapValue(num1,num2);
    cout<<"Call by Value \n num1="<<num1<<"\tnum2="<<num2<<endl;
    swapRef(num1,num2);
    cout<<"Call by Reference \n num1="<<num1<<"\tnum2="<<num2<<endl;
    swapAddress(&num1,&num2);
    cout<<"Call by Address \n num1="<<num1<<"\tnum2="<<num2<<endl;
    return 0;
}
void swapValue(int num1,int num2){
num1=num1+num2;
num2=num1-num2;
num1=num1-num2;
}
void swapAddress(int *num1,int* num2){
*num1=*num1+*num2;
*num2=*num1-*num2;
*num1=*num1-*num2;

}
void swapRef(int &num1,int &num2){

num1=num1+num2;
num2=num1-num2;
num1=num1-num2;


}
