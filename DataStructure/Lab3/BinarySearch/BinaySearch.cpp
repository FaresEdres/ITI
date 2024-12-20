#include <iostream>
#define ARR_SIZE 10
using namespace std;

int binarySearch(int *arr,int target){
    int start=0 ;
    int  end=ARR_SIZE-1;
    while(end>start){
        int mid= start+((end-start)/2);
        if(arr[mid]==target)return mid;
        if(arr[mid]>target)start=mid+1;
        if(arr[mid]<target)end=mid-1;

    }
    return -1;
}
int main(){
int arr[ARR_SIZE]={1,2,3,4,5,6,7,8,9,10};
cout<<binarySearch(arr,5);
    return 1;
}