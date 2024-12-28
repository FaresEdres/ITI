package Database;
import java.util.InputMismatchException;
import java.util.Scanner;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
public class Validate {
    public static int validInt(){
        Scanner scanner = new Scanner(System.in);
        int num;
        
        while(true){
        try{

        num = scanner.nextInt();
        scanner.nextLine();
        return num;
        }
        catch(Exception e){
            System.out.println("Enter positive integer Only:");
            scanner.nextLine();

        }
        }

        
    }
    


    public static void AlphabetCheck() {
        Scanner scanner = new Scanner(System.in);
        String regex = "^[A-Za-z]+$";
        boolean isValid=false;
        do{
        String input = scanner.nextLine();

        if (input.matches(regex)) {
            isValid=true;
        } else {
            System.out.println("Enter Alphabetics only");
        }
    }
        while(!isValid);

        scanner.close();
    }
}



