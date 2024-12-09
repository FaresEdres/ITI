#include <iostream>
using namespace std;


class Base{
private:
protected:

public:
void calculateSum(){
cout<<"Base Sum";
}
};

class Derived:public Base{
private:

protected:

public:
void calculateSum(){
cout<<"Derived Sum";
}
};




int main(){

    Base b;
    Base *ptr=
    b.calculateSum();




    return 0;
}