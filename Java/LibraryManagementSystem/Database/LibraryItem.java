package Database;
public abstract class LibraryItem{
    protected int id;
    protected String title;
    protected boolean available;
   

    public LibraryItem(int id,String title){
        this.id=id;
        this.title=title;
        available=true;
    }

public abstract void getItemDetails();
}