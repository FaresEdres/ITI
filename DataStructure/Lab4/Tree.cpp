#include <iostream>
using namespace std;

class Node{
    public:
    Node*right;
    Node*left;
    int data;
    Node(int _data){
        right=NULL;
        left=NULL;
        data=_data;
    }
};
class Tree{
    private:
    Node* root;
    Node* getNodeByData(int data);
    Node* getParent(Node* n);
    Node* getMaxRight(Node* n);
    Node* getMaxLeft(Node*n);
    void displayTree(Node*n);
    public:
    Tree():root(NULL){}
    void add(int data);
    int  findDataInTree(int data); 
    int  getMaxRightByData(int data);
    int  getMinValue(int data);
    int  getParentData(int data);
    void removeNode(int data);  
    void displayTreeUser();  
};

void Tree::displayTreeUser(){

    displayTree(root);

}
void Tree::displayTree(Node*n){
    if(n==NULL)return;
    displayTree(n->left);
    cout<<n->data<<" --";
    displayTree(n->right);

}
void Tree::removeNode(int data){
        Node* n=getNodeByData(data);
        if(n==NULL)throw "Node not found";
        if(n==root){
            if(n->left==NULL && n->right==NULL) root=NULL;
            else if(n->left==NULL) root=n->right;
            else if(n->right==NULL)root=n->left;
            else{
                getMaxRight(root->left)->right=n->right;
                root=root->left;
            }
        }
        else{
            Node* parent=getParent(n) ;
            Node* newChild=NULL;
            if(n->left==NULL && n->right==NULL) newChild==NULL;
            else if(n->left==NULL) newChild=n->right;
            else if(n->right==NULL)newChild=n->left;
            else{
                getMaxRight(root->left)->right=n->right;
                newChild=n->left;
            }
            if(parent->left==n)parent->left=newChild;
            else parent->right=newChild;
        }
       delete n;
    }
Node* Tree::getNodeByData(int data){
    Node* curr=root;
    while(curr!=NULL){
        if(data==curr->data)return curr;
        else if(data>curr->data)curr=curr->right;
        else{
            curr=curr->left;
        }
    }
    return NULL;
}
int   Tree::findDataInTree(int data){
    if(getNodeByData(data))return 1;
    else return 0;
}
void  Tree::add(int data){
    Node*newNode=new Node(data);
if(root==NULL){
    root=newNode;
}
else{
    Node*curr=root;
    Node*prev=NULL;
    while(curr!=NULL){
         prev=curr;
        if(data>curr->data)
        curr=curr->right;
        else{
            curr=curr->left;

        } 
    }
    if(prev->data>data )
    prev->left=newNode;
    else{
    prev->right=newNode;

    }
}
}
Node* Tree::getParent(Node* n){
    Node* curr=root;
    while (curr!=NULL){
        if(n==curr->right||n==curr->left){
            return curr;
        }
        else if(n->data>curr->data)curr=curr->right;
        else curr=curr->left;
    }
    return NULL;
}   
Node* Tree::getMaxRight(Node* n){
    Node*curr=n;
    //if no right curr will be returned
    while(curr->right!=NULL)curr=curr->right;
    return curr;

}
int   Tree::getParentData(int data){
    Node* node=getNodeByData(data);
    if(node==root)throw "The root has no parent";
    if (node!=NULL){
        Node*curr=root;
        if(curr->right==node||curr->left==node)return curr->data;       
    }
    throw "Data hasnot been found";
    }
int   Tree::getMaxRightByData(int data){
        Node* curr=getNodeByData(data);
        if(curr==NULL){
           throw "Node Not found";
        }
        else{
            return  getMaxRight(curr)->data;
        }         
}
Node* Tree::getMaxLeft(Node*n){
    Node* curr=n;
    while(curr->left!=NULL)curr=curr->left;
    return curr;
}
int   Tree::getMinValue(int data){
        Node*n=getNodeByData(data);
        if(n==NULL)throw "NUll";
        else{
            
                return getMaxLeft(n)->data;
        }
    

}
int main(){
Tree t;
t.add(100);
t.add(50);
t.add(30);
t.add(40);
t.add(10);
t.add(1000);
cout<<t.getMinValue(30)<<endl;
t.displayTreeUser();
t.removeNode(30);
t.displayTreeUser();
return 0;
}
