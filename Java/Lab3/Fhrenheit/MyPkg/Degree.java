package MyPkg;
import java.util.function.Function;

public class Degree implements Function<Float,Float>{
    private Float num;
    @Override
    public Float apply(Float c){
        num=c*(9/5)+32;
        return num;
        
    }
} 
