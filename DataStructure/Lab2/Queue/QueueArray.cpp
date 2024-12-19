#include <iostream>
using namespace std;
class QueueArray{
private:
int front;
int rear;
int size;
int* items;
int isEmpty(){
    if(rear==-1 && front==-1) return 1;
    else return 0;
}
int isFull(){
    if((front==0&&rear==size-1)||(rear+1==front))return 1;
    else return 0;
}

public:
QueueArray(int size){
    front=rear=-1;
    this->size=size;
    items=new int[size];
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
if(isEmpty()){
    rear=front=0;
}
else if(rear==size-1){
    rear=0;

}
else{
    rear++;
}
items[rear]=data;
cout<<data<<" has been entered"<<endl;
return 1;

}
int dequeue(){
    if(isEmpty())throw "Empty Queue";
    int data=items[front];
    if(front==rear){
        front=rear=-1;
    }
    else if(front==size-1){
        front=0;
    }
    else{
        front++;
    }
    cout<<data<<" has been dequed"<<endl;
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
