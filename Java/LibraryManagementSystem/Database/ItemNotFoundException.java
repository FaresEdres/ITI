package Database;
public class ItemNotFoundException extends Exception{
    ItemNotFoundException(){
        super("ItemNotFound");
    }
}