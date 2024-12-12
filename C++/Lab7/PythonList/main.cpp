#include <iostream>
typedef struct Slice{
int start;
int end;
int counter;
}Slice;
using namespace std;
template<class T>
class List{
private:
int len;
T *items;
public:
List(){
this->len=0;
items=nullptr;

}

void listPush(int num){
T*temp=items;
items=new T[++len];
for(int i=0;i<len-1;i++){
    this->items[i]=temp[i];
}
items[len-1]=num;
delete[]temp;
}
int listPop(int&value){
    if(len==0)return false;
    value=items[--len];
   T*temp=items;
items=new T[len];
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
void operator[](Slice s){

if(s.end<=this->len){

for(int i=0;i<s.end;i+=s.counter){
cout<<this->items[i];
}
}


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
    List<int> l1,l2;

    l1.listPush(60);
    l1.listPush(50);
      l1.listPush(60);
    l1.listPush(50);
   l1[{1,4,2}];



    return 0;
}
