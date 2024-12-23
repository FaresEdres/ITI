import java.util.function.Function;
import MyPkg.Degree;
import java.util.regex.*;
class Root{
public static void main(String args[]){
   Function<Double[],Double[]> b=new Degree();


   Double arr[]={10.0,550.0,8.5};
   Double newArr[]=new Double[2];

   newArr=b.apply(arr);
   if(Double.isNaN(newArr[0])){
        System.out.println("Complex");
   }
   else{
 //System.out.println("x1="+newArr[0]+"    x2="+newArr[1]);
 System.out.printf("x1=%.2f x=%.2f\n",newArr[0],newArr[1]);
   }
  
}
}
