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
    int insertByIndex(int index,int data);
    void display();
    int getCount();
    void bubbleSort();
    int getDataByIndex(int index,int&result);
    void nodeSwap(Node* n1,Node* n2);
};
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
void LinkedList::nodeSwap(Node* n1,Node* n2){
    if(n1==head&&n2==tail){
        tail->next=head;
        head->prev=tail;
        head->next=NULL;
        tail->prev=NULL;
        head=n2;
        tail=n1;
    }
    else if(n2==tail){
        n2->next=n1;
        n2->prev=n1->prev;
        n1->prev->next=n2;
        n1->prev=n2;
        n1->next=NULL;
        tail=n1;
    }
    else if(n1==head){
        n1->prev=n2;
        n2->prev=NULL;
        n1->next=n2->next;
        n2->next->prev=n1;
        n2->next=n1;
        head=n2;
    }
    else{
        n1->prev->next=n2;
        n1->prev=n2;
        n1->next=n2->next;
        n2->prev=n1->prev;
        n2->next->prev=n1;
        n2->next=n1;
    }
}

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
        newNode->prev=tail;
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
void LinkedList::bubbleSort() {
    if (!head || !head->next) return;
    bool swapped;
    Node* last = NULL;

    do {
        swapped = -1;
        Node* curr = head;

        while (curr->next != last) {
            if (curr->data>curr->next->data) {
                nodeSwap(curr,curr->next);

                swapped=1;
            } else {
                curr=curr->next;
            }
        }
        last=curr;
    } while (swapped==1);
}

    
    /*
cout<<"Swap First two elements"<<endl;
    nodeSwap(head,head->next);
    this->display();
cout<<"Swap Last two elements"<<endl;
    nodeSwap(tail->prev,tail);
    this->display();
cout<<"Swap First 2nd and 3rd elements"<<endl;
    nodeSwap(head->next,head->next->next);
    this->display();
    */

int main() {
LinkedList l;

l.insertByIndex(0,2);
l.insertByIndex(1,5);
l.insertByIndex(2,7);
l.insertByIndex(3,3);
l.insertByIndex(4,5);
l.display();
l.bubbleSort();
l.display();
    return 0;
}