#include <stdio.h>
#include <stdlib.h>
#define ROW 3
#define COL 4
int main()
{
int sum=0;
float avg=0;
int arr[ROW][COL];
int colSum=0;


for(int i=0;i<ROW;i++){
for(int j=0;j<COL;j++){



scanf("%d",&arr[i][j]);
if(arr[i][j]);
}
}

for(int i=0;i<ROW;i++){
sum=0;
for(int j=0;j<COL;j++){
sum+=arr[i][j];

}
printf("Sum %d=%d\n",i,sum);
}

for(int j=0;j<COL;j++){
colSum=0;
for(int i=0;i<ROW;i++){
colSum+=arr[i][j];
}
avg=(float)colSum/ROW;
printf("avg %d=%.1f\n",j,avg);



}






}
