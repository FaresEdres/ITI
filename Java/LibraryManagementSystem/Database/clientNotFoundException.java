package Database;
public class clientNotFoundException extends Exception{
    clientNotFoundException(){
        super("ClientNotFound");
    }
}