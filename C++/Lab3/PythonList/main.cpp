#include <iostream>

using namespace std;
class List{
private:
int len;
int *items;
public:
List(){
this->len=0;
items=nullptr;

}
void listPush(int num){
int*temp=items;
items=new int[++len];
for(int i=0;i<len-1;i++){
    this->items[i]=temp[i];
}
items[len-1]=num;
delete[]temp;
}
int listPop(int&value){
    if(len==0)return false;
    value=items[--len];
   int*temp=items;
items=new int[len];
for(int i=0;i<len;i++){
    this->items[i]=temp[i];
}
delete[]temp;
return true;
}
void listDisplay(){
    for(int i=0;i<len;i++){
        cout<<items[i]<<endl;
    }
}
int operator==(List& l){
    if( this->len >l.len) return 0;
    else if (this->len<l.len) return 0;

int i=0;
while ((this->items[i]==l.items[i])&&(i<this->len)){


    i++;

}
return (this->items[i]-l.items[i]);

}
void operator=(List& l){
delete[] items;
this->items=new int[l.len];
int i=0;
while ((i<l.len)){
this->items[i]=l.items[i];

    i++;

}
len=l.len;

}
~List(){
delete[] items;
}
};
int main()
{
    List l1,l2;

    l1.listPush(60);
    l1.listPush(50);
   l2=l1;
   l2.listDisplay();
    return 0;
}
