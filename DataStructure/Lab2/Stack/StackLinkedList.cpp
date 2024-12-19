#include <iostream>
using namespace std;
class StackNode{


public:
int data;
StackNode * prev;
StackNode(int data){
    this->data=data;
    prev=NULL;
}
};

class StackLinkedList{
private:
StackNode* tail;
public:
StackLinkedList():tail(NULL){}
void push(int data){
    StackNode* newNode= new StackNode(data);
    if(tail==NULL){
        tail=newNode;
    }
    else{
        newNode->prev=tail;
        tail=newNode;
    }
}
    int pop(){
        if(tail==NULL){
            throw "stack is Empty";
        }
        StackNode* temp=tail;
        int data=tail->data;
        tail=tail->prev;
        delete temp;
        return data;


    }   
    int peek(){
        if(tail==NULL)throw "Stack is Empty";
        cout<<"Peek is "<< tail->data<<endl;
        return tail->data;
    }
    void display(){
        StackNode* curr=tail;
        while(curr!=NULL){
            cout<<curr->data<<"->";
            curr=curr->prev;
        }
    }
};

int main(){
StackLinkedList s;
s.push(10);
s.push(20);
s.peek();
try{
s.pop();
}
catch(const char*){}
s.display();
    return 0;
}