import java.io.*;
import java.util.regex.*;
class App{
 public static void main(String args[]){
 System.out.println("Welcome");
 
int len=args.length;
 if(len !=2){
 System.out.println("Enter only a value and a string");
 return;
 }
 //Print args
 System.out.print("Args are:");
 for(int i=0;i<len;i++){
 System.out.println(""+args[i]+" ");
 }
if(!Pattern.matches("\\d+",args[0]))
{System.out.println("Enter positive value");
return;
} 
 int num=Integer.parseInt(args[0]);

 String str=args[1];
 System.out.println();
 //Print string num times
 for(int i=0;i<num;i++){
 System.out.println(str);
 
}
}}
