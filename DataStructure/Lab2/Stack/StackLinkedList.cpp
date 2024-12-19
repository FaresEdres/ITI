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
        cout<<endl;
    }
    int copy(StackLinkedList s){
        if(s.tail==NULL)return -1;
        this->tail=new StackNode(s.tail->data);
        StackNode*myCurr=s.tail->prev;
        StackNode*copyPrev=this->tail;
    
        while(myCurr!=NULL){
           StackNode* newNode=new StackNode(myCurr->data);
            copyPrev->prev=newNode;
            myCurr=myCurr->prev;
            copyPrev=copyPrev->prev;

        }
        
        return 1;
            }
};

int main(){
StackLinkedList s,sCopy;
s.push(10);
s.push(20);
s.push(30);
s.display();
sCopy.copy(s);
sCopy.display();
    return 0;
}