#include <iostream>
#define ARR_SIZE 10
using namespace std;

class Sorting{ 
int bubbleSort(int *arr, int target){
int swapped=1;
int temp;
    for(int i=0;i<ARR_SIZE-1&&swapped;i++){
        swapped=0;
        for(int j=0;j<ARR_SIZE-1-i;j++){
            if(arr[j]>arr[j+1]){
                swapped=1;
                temp=arr[j];
                arr[j]=arr[j+1];
                arr[j+1]=temp;

                
            }
        }
    }
}
int selectionSort(int *arr, int target){
    for(int i=0;i<ARR_SIZE-1;i++){
        int index=i;
        for(int j=i+1;j<ARR_SIZE;j++){
            if(arr[j]<arr[index])
            index=j;
            
        }
        if(index!=i){
                int temp=arr[index];
                arr[index]=arr[i];
                arr[i]=temp;
        }
                
    }
}
int insertionSort(int *arr, int target){
    for(int i=0;i<ARR_SIZE;i++){
        int j=i-1;
        while(j>=0 &&arr[i]<arr[j]){
            arr[j+1]=arr[j];
            j-=1;
        }
        arr[j+1]=arr[i];
    }
}
void quickSort(int a[], int low, int high) {
    if (low < high) {
        int pivot = a[low]; // pivot element
        int i = low, j = high;
        int temp;

        while (i < j) {
            // Move from the right towards the left
            while (i < j && a[j] >= pivot) { j--;}
            // Move from the left towards the right
            while (i < j && a[i] <= pivot) {i++;}
            // Swap elements at i and j
            if (i < j) {
                temp = a[i];
                a[i] = a[j];
                a[j] = temp;
            }
        }

        // Swap pivot element with element at i (or j, since i == j)
        a[low] = a[i];
        a[i] = pivot;

        // Recursively sort elements before and after partition
        quickSort(a, low, i - 1);
        quickSort(a, i + 1, high);
    }
}

void merge(int* arr,int left,int mid,int right){
int lSize=mid-left+1;//4-0+1=5
int rSize=right-mid;//9-4=5
int* lArray=new int[lSize];
int* rArray=new int[rSize];
/*
1 2 3 4 5 6 7 8 9 10
|        |        |             
left=0  mid=4     right=9
*/
for(int i=0;i<lSize;i++){
    lArray[i]=arr[left+i];
}

for(int i=0;i<rSize;i++){
    rArray[i]=arr[mid+i+1];
}

int i=0,j=0,k=left;
while(i<rSize && j<lSize){
    if(rArray[i]<lArray[j]){
        arr[k]=rArray[i];
        i++;
       
    }
    else{
        arr[k]=lArray[j];
        j++;
      
    }
    k++;
}
while(i<rSize){
arr[k]=rArray[i];
i++;
k++;
}
while(j<lSize){
arr[k]=lArray[j];
j++;
k++;
}
delete[] lArray;
delete[] rArray;
}

void mergeSort(int*arr,int left,int right){
if(left<right){
    int mid=left+(right-left)/2;
    mergeSort(arr,left,mid);
    mergeSort(arr,mid+1,right);
    merge(arr,left,mid,right);
}
}

};