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
    int insertAfter(int data,int afterData);
    int insertBefore(int data,int beforeData);
    int getCount();
    int getDataByIndex(int index,int&result);
    int insertByIndex(int index,int data);
    void merge(LinkedList& l);
    void display();
    void createHead(int data);
};
void LinkedList::merge(LinkedList& l){
  tail->next=l.head;
}

int LinkedList::insertByIndex(int index,int data){
    
    if(index>size-1)return 0;
    Node* newNode=new Node(data);
    if(index==0){
        newNode->next=head;
        head=newNode;
    }
    return 1;
    }
int LinkedList::insertAfter(int data,int afterData){
Node*newNode=new Node(data);
Node*curr=searchData(afterData);
if(curr==NULL){
    delete newNode;
    return -1;
}
size++;
newNode->next=curr->next;
newNode->prev=curr;

if(newNode->next==NULL){
    tail=newNode;
}
else{
curr->next->prev=newNode;
}
curr->next=newNode;
return 1;
}
int LinkedList::insertBefore(int data,int beforeData){
    Node* newNode=new Node(data);
    Node*curr=searchData(beforeData);
    if(curr==NULL){
        delete newNode;
        return -1;
    }
    size++;
    newNode->next=curr;
    newNode->prev=curr->prev;
    if(curr->prev==NULL){
        head=newNode;
    }
    else{
        curr->prev->next=newNode;
    }
    
    curr->prev=newNode;
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
    
        void LinkedList::createHead(int data){
    Node* newNode = new Node(data); 
    head = newNode;
    tail = newNode;
    size++;
        }

int main() {
    LinkedList l1,l2;
    l1.createHead(10);
    l1.insertAfter(20, 10);
    l1.insertAfter(30, 20);
    l1.insertAfter(40, 30);
    l1.insertBefore(15, 20);

    l2.createHead(10);
    l2.insertAfter(20, 10);
    l2.insertAfter(30, 20);
    l2.insertAfter(40, 30);
    l2.insertBefore(15, 20);
    l1.merge(l2);
    l1.display();
/*
    int test, result;
    cout << "Insert data:" << endl;
    cout << "Insert Before Empty LinkedList" << endl;
    test = list.insertBefore(10, 0);
    cout << "Test=" << test << endl;
    cout << "Insert Before After Empty LinkedList" << endl;
    test = list.insertAfter(10, 0);
    cout << "Test=" << test << endl;

    list.createHead(10);
    list.insertAfter(20, 10);
    list.insertAfter(30, 20);
    list.insertAfter(40, 30);
    list.insertBefore(15, 20);

    test = list.getDataByIndex(2, result);
    if (test == 1)
        cout << "Index = " << result << endl;

    int invalidIndex = 10;
    test = list.getDataByIndex(invalidIndex, result);
    if (test == -1)
        cout << "Accessing invalid index " << endl;

    list.insertBefore(5, 10);
    list.insertAfter(50, 40);

    cout << "Final Linked List: ";
    list.display();

    cout << "LinkedList Size=" << list.getCount() << endl;
    */
    return 0;
}
