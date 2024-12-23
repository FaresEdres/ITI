import java.util.function.Function;
import MyPkg.Degree;

class Fhrenheit{
public static void main(String args[]){
    Function<Float,Float> d=new Degree();
    Float num=32.2f;
System.out.println(d.apply(num));
}
}