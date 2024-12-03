#include <ctype.h>
#include <string>
#include <iostream>
using namespace std;

int isdigitnum( string text){

    string ptr;
    cout<<text;
    cin>>ptr;

    int i=0;
    int floatFlag=0;
    if(ptr.empty()) return 0;
    if(ptr[0]=='-') i=1;
    else if(ptr[0]=='.'&&ptr.length()==1)return 0;
    else {

        for( i=0;i<ptr.length();i++){
    if(ptr[i]=='.'&&floatFlag<=1)floatFlag++;

    else if(!isdigit(ptr[i]))return 0;


}



    }

return stoi(ptr);
}


