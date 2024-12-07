#include <iostream>
using namespace std;
class Base{
private:
int x;
int y;
protected:
int z;
public:
Base():x(0),y(0),z(0){
    cout<<"Base Default Constructor\n";
}
Base(int a ,int b,int c):x(a),y(b),z(c){
    cout<<"Base Parameterized Constructor\n";
}
~Base(){
    cout<<"Base Destructor\n";
}
void display(){
    cout<<"Base Sum\n";
}
void check(Base *b){
cout <<"Check Function in Base";
}
};
class Derived:public Base{
private:
int l;
protected:

public:
Derived():Base(),l(0){
    cout<<"Derived Default Constructor\n";
}
Derived(int a ,int b,int c,int d):Base(a,b,c),l(d){
    cout<<"Derived Parameterized Constructor\n";
}
~Derived(){
    cout<<"Derived Destructor\n";
}
void display(){
      cout<<"Derived Sum\n";
}
};
class SecondDerived:public Derived{
private:

protected:

public:
SecondDerived():Derived(){
    cout<<"Second Derived Default Constructor\n";
}
SecondDerived(int a ,int b,int c,int d):Derived(a,b,c,d){
    cout<<"Second Derived Parameterized Constructor\n";
}
~SecondDerived(){
    cout<<"Second Derived Destructor\n";
}
};
int main(){
Base b;

 Derived d1;
 b.check(&d1);
 //SecondDerived d2;
 
 //Base *b=&d1;
 //b->display();
    return 0;
}
