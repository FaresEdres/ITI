package MyPkg;
import java.util.function.Function;
public class Degree implements Function<Double[],Double[]>{
    private double a;
    private double b;
    private double c;
    private boolean isNegative(double a,double b ,double c){
    if(((b*b)-4*a*c)<0)return true;
    else               return false;
    }  
   
    @Override
    public Double[] apply(Double[] d){
        Double arr[]=new Double[2];
        a=d[0];
        b=d[1];
        c=d[2];
        
        if(isNegative(a,b,c)){
            arr[0]=Double.NaN;
            arr[1]=Double.NaN;

        }
        else{
        double root=Math.sqrt((b*b)-4*a*c);
        double posFormula=(-b+root)/(2*a);
        double negFormula=(-b-root)/(2*a);
            arr[0]=posFormula;
            arr[1]=negFormula;
               
            
        }
        return arr;
        
        
    }
} 