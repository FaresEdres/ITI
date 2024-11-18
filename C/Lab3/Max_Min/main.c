#include <stdio.h>
#include <stdlib.h>
#define SIZE 10
int main()
{

    int arr[SIZE];
    for(int i=0;i<SIZE;i++){
    scanf("%d",&arr[i]);

    }
    int min=arr[0],max=arr[0];
    for(int i=1;i<SIZE;i++){
    if(arr[i]>max)max=arr[i];
    if(arr[i]<min)min=arr[i];

    }
printf("Max=%d \tMin=%d",max,min);
    return 0;
}
