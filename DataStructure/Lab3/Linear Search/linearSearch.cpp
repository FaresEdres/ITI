#define ARR_SIZE 10
#include <iostream>
using namespace std;

class Node{
    public:
    int data;
    Node* prev;
    Node* next;
    Node(int data){
        prev=NULL;
        next=NULL;
        this->data=data;
    }
    
};


class LinkedList{
    public:
    Node* head;
    Node* tail;
    int size;

    LinkedList(){
        head=NULL;
        tail=NULL;
        size=0;
    }
    Node* searchData(int data){
        Node*search=head;
        while(search!=NULL){
            if(search->data==data){
                return search;
            }
            search=search->next;
        }
        return NULL;
    }

    int getDataByIndex(int index,int&result);
    int insertByIndex(int index,int data);
    void display();
    int getCount();
    void getOccurrence(int *arr,int target);
};

int LinkedList::insertByIndex(int index,int data){
    
    if(index>size)return 0;
    size++;
    Node* newNode=new Node(data);
    if(index==0){
        newNode->next=head;
        head=newNode;
        tail=newNode;
        
    }
    else if(index==size-1){
        tail->next=newNode;
        tail=newNode;
    }
    else{

        Node*curr=head;
        for(int i=0;i<index-1;i++)curr=curr->next;
        newNode->next=curr->next;
        curr->next=newNode;
        newNode->prev=curr;
        newNode->next->prev=newNode;
    }
    return 1;
    
    }


    int LinkedList::getCount(){
        return size;
    }
    int LinkedList::getDataByIndex(int index,int& result){
        Node* curr=head;
        int i=0;
        int size=getCount();
        if(index<size){

        for(int i=0 ; i<index;i++){
            
            curr=curr->next;
        }
         result=curr->data;
            return 1; 
           
        }
        else{
            cout<<"Out of Range"<<endl;
            return -1;
        }
    }        

    void display(){
        
    }
    void LinkedList::display(){
        int len=getCount();
        Node*curr=head;
        if (curr==NULL){
            cout<<"No Data in linkedList"<<endl;
        }
        else{
        while(curr!=NULL){
            cout <<curr->data<<"->";
            curr=curr->next;
        }
        cout<<endl;
        }
    }   
    
void LinkedList::getOccurrence(int *arr,int target){
    
    int count=0;
for(int i=0;i<ARR_SIZE;i++){
if(arr[i]==target){
this->insertByIndex(count,i);
count++;

}
}
}
int main() {
   int arr[ARR_SIZE]={5,6,7,8,9,6,2,4,5,6};
int target=6;
LinkedList l;
l.getOccurrence(arr,6);
l.display();


    return 0;
}