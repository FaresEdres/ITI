package Database;
public class Book extends LibraryItem{
    private String isbn;
    public Book(int id,String title, String isbn){
        super(id,title);
        this.isbn=isbn;
        available=true;
    }
    public void getItemDetails(){
        System.out.println("Id: \t"+id);
        System.out.println("title \t"+title);
        System.out.println("ISBN \t"+isbn);
    }
    

} 