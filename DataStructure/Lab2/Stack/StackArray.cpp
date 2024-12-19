#include <iostream>
using namespace std;
class Stack{
   private:
int* items;
int top;

public:
int stackSize;

~Stack(){delete[]items;}
Stack(int stackSize){
    top=-1;
    items=new int[stackSize];
    this->stackSize=stackSize;
}

void stackDisplay();
int pop();
int push(int data);
int peek();
int reverse();
};
int Stack::reverse(){
    if(top<2)return  0;
    int temp;
    int start=0,end=top;
    while(start<end){
        temp=items[start];
        items[start]=items[end];
        items[end]=temp;
        start++;
        end--;
    }
    return 1;
}
void Stack::stackDisplay(){

    if(top==-1){
    cout<<"No data";
    }

    else{for(int i=0;i<=top;i++){

        cout<<items[i]<<"\t";

    }
    cout<<endl;

    }


}
int Stack::pop(){
        if(top==-1){
        throw "No data";
        
    }
    int data = items[top];
     cout<<"Poped value is"<<data<<endl;
    top--;
    return data;
}

int Stack::push(int data){
    if(top==stackSize-1){
    cout<<"Stack is full"<<endl;
        return 0;
    }
top++;
items[top]=data;
cout<<"Added value is "<<items[top]<<endl;
return 1;

}
int Stack::peek(){
cout<<"peek is"<< items[top]<<endl;
return items[top];
    
}

int main()
{
   
Stack s(3);
s.push(10);
s.push(20);
s.push(30);
s.stackDisplay();
s.reverse();
s.stackDisplay();
return 0;
    }

