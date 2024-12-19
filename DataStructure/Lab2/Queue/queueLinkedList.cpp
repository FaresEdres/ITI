#include <iostream>
using namespace std;

class QueueNode{
    public:
    QueueNode*next;
    int data;
    QueueNode(int data){
        next=NULL;
        this->data=data;
    }
};
class QueueLinkedList{
    public:
    QueueNode* rear;
    QueueNode* front;
    QueueLinkedList(){
        front=rear=NULL;
    }
    void Enqueue(int data){
        QueueNode*newNode=new QueueNode(data);
        if(front ==NULL){
            rear=front=newNode;
            return;
        }
        rear->next=newNode;
        rear=newNode;
    }
    int dequeue(){
        if(front==NULL)throw "Empty queue";
        QueueNode* temp=front;
        int data=front->data;
        front=front->next;
        if(front==NULL)rear=NULL;
        delete temp;
        return data;
    }
    void display(){
        QueueNode* curr=front;
        while(curr!=NULL){
            cout<<curr->data<<"\t";
            curr=curr->next;
        }
        cout<<"\n";
    }

};
int main(){

    QueueLinkedList q;
    q.Enqueue(10);
    q.Enqueue(20);
    q.Enqueue(30);
    q.Enqueue(40);
    q.Enqueue(50);
    q.display();
    try{
        q.dequeue();
    }
    catch(const char* message){

    }
    
q.Enqueue(60);
q.display();
    try{
        q.dequeue();
    }
    catch(const char* message){

    }
        try{
        q.dequeue();
    }
    catch(const char* message){

    }
    q.display();
        try{
        q.dequeue();
    }
    catch(const char* message){

    }
        try{
        q.dequeue();
    }
    catch(const char* message){

    }
        try{
        q.dequeue();
    }
    
    catch(const char* message){

    }

        try{
        q.dequeue();
    }
    catch(const char* message){
    cout<<"Stack is Empty";
    }

    return 0;

}
