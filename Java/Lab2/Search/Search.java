public class Search{
static int binarySearch(int arr[],int left,int right,int value){
int mid=left+((right-left)/2);
if(arr[mid]==value){
System.out.println("Index is"+mid);
return mid;
}
if(arr[mid]>value){
right=mid-1;
return binarySearch(arr,left,right,value);
}
else{
left=mid+1;
return binarySearch(arr,left,right,value);
}
}

}
class SearchCompare{
public static void main(String args[]){
int firstIndex=0;
int arrSize=1000;
int value;
int start,end;
int arr[]=new int [arrSize];
/******************************************Linear Search***************************/
for(int i=0;i<arrSize;i++){
arr[i]=(int)(Math.random()*1000);
}
int max=arr[0];
int min=arr[0];
start=(int)System.nanoTime();
for(int i=0;i<arrSize;i++){
if(arr[i]>max)max=arr[i];
if(arr[i]<min)min=arr[i];
}
System.out.println("Min="+min+"Max="+max);
end=(int)System.nanoTime();
System.out.println("Linear Search Time Taken="+ (end-start) +"ms");
/**********************Binary Search****************************************/

for(int i=0;i<arrSize;i++){
arr[i]=i;
}
start=(int)System.nanoTime();
System.out.println("Enter a value from 1 to 1000");
value=500;
Search.binarySearch(arr,firstIndex,arrSize,value);
end=(int)System.nanoTime();
System.out.println("Binary Search Time Taken="+ (end-start) +"ms");

}
}

