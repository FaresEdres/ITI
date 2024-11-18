#include <stdio.h>
#include <stdlib.h>
#define TOTAL_SIZE 100
int main()
{
int arr[TOTAL_SIZE];
int row,size;
printf("Enter size of array less than 100\n");
scanf("%d",&size);
printf("Enter row value\n");
scanf("%d",&row);
if(size>TOTAL_SIZE||size%row!=0||size<0||row<0){

printf("Invalid value");
}

else{
int col=size/row;
for(int i=0;i<row;i++){
for(int j=0;j<col;j++){

scanf("%d",&arr[i*col+j]);
}
}


for(int i=0;i<row;i++){
for(int j=0;j<col;j++){

printf("%d",arr[i*col+j]);
}


}
}


    return 0;
}
