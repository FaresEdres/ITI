import java.util.function.BiPredicate;

public class App {
    public static String betterString(String s1, String s2, BiPredicate<String, String> isBetter) {
        return isBetter.test(s1, s2) ? s1 : s2;
    }

    public static void main(String[] args) {
     
        String result = betterString("hello", "world", (s1, s2) -> s1.length() > s2.length());
        System.out.println(result);  

    
    
    }
}
