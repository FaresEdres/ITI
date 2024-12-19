#include <iostream>
using namespace std;
class QueueArray{
private:
int front;
int rear;
int size;
int* items;
int qSize;
int isEmpty(){
    if(qSize==0) return 1;
    else return 0;
}
int isFull(){
    if(qSize==size-1)return 1;
    else return 0;
}

public:
QueueArray(int size){
    front=-1;
    rear=0;
    this->size=size;
    items=new int[size];
    qSize=0;
}
~QueueArray(){
delete[] items;
}
/*
void Enqueue(int data){
    if(rear==size-1)return 0;
    if(front==-1){
        rear=front=0;
        items[rear]=data;
    }
    else{
        items[rear++]=data;
    }
}
*/

int Enqueue(int data){
if(isFull())return 0;
items[rear]=data;
if(isEmpty()){
    rear=0;
    front=-1;
}

else if(rear==size-1){
    rear=0;

}
else{
    rear++;
}

cout<<data<<" has been entered"<<endl;
qSize++;
return 1;
}

int dequeue(){
    if(isEmpty())throw "Empty Queue";
   
    if(front==rear){
        front=-1;
        rear=0;
    }
    else if(front==size-1){
        front=0;
    }
    else{
        front++;
    }
     int data=items[front];
    cout<<data<<" has been dequed"<<endl;
    qSize--;
    return data;
}

};

int main(){

    QueueArray q(5);
    q.Enqueue(10);
    q.Enqueue(20);
    q.Enqueue(30);
    q.Enqueue(40);
    q.Enqueue(50);
    try{
        q.dequeue();
    }
    catch(const char* message){

    }
q.Enqueue(50);
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
