package Database;
import java.util.List ;
import java.util.ArrayList; 
import java.util.HashMap;


public class Library {
    private List<LibraryItem>lDatabase=new ArrayList<>();
    private List<Client>cDatabase=new ArrayList<>();
    HashMap<Integer,Integer> libraryMap=new HashMap<>();

    public void addClient(Client c){
        for(int i=0;i<cDatabase.size();i++){
            if(c.getClientId()==cDatabase.get(i).getClientId()){
                System.out.println("Duplicated Client ID");
            }
            
        }
        cDatabase.add(c);
        
    }

    public Client retrieveClient(int id)throws clientNotFoundException{

        Client c=cDatabase
        .stream()
        .filter(((client)->client.getClientId()==id)).findFirst().orElse(null);
        if(c!=null){
            return c;
        }
        else{
        throw new clientNotFoundException();
        }
        /* 
        for(Client c:cDatabase){
            if(c.getClientId()==id){
                return c;
            }         
    } 
    */
     
    
}
    public void deleteClient(int id) throws clientNotFoundException{
        for(Client c:cDatabase){
            if(c.getClientId()==id){
                cDatabase.remove(c);
            }
    
    } 
    throw new clientNotFoundException();

}
   public void displayAllClients(){
        for(Client c:cDatabase){
            c.getClientDetails();;
        }
    }


public void deleteItem(int id) throws ItemNotFoundException{
    for(LibraryItem l:lDatabase){
        if(l.id==id ){
            lDatabase.remove(l);
            return;
        }
}
throw new ItemNotFoundException(); 
}

   public void addItem(LibraryItem l){
    for(int i=0;i<lDatabase.size();i++){
        if(l.id==lDatabase.get(i).id){
            System.out.println("Duplicated item ID");
            return;
        }
        
    }
    lDatabase.add(l);
    
}
    public LibraryItem retrieveItem(int id)throws ItemNotFoundException{
        for(LibraryItem l:lDatabase){
            if(l.id==id){
                return l;
            }
        }
        throw new ItemNotFoundException();
    } 
  

public void displayAllItems(){
    for(LibraryItem l:lDatabase){
        l.getItemDetails();
    }
}

 public void borrowItem(int idClient, int idItem){
    try {
       
        LibraryItem l=retrieveItem(idItem);
        if(l.available){
            libraryMap.put(idItem,idClient);
            l.available=false;
            System.out.println("Item has been borrowed successfully");

        }
        else{
            System.out.println("Unfortunately,another client has this item");

        }
    } catch (ItemNotFoundException l ){
            System.out.println(l.getMessage());
    }
    
    
    
 }

public void returnItem(int idClient, int idItem){
    try {
        
        LibraryItem l=retrieveItem(idItem);
        if((!l.available )&& libraryMap.remove(idItem,idClient)){
            l.available=true;
            System.out.println("Item has been returned successfully");
        }
        else{
        System.out.println("Unfortunately Item hasn't been returned");
        }
    } catch (ItemNotFoundException l ){
            System.out.println(l.getMessage());
    }
    
}
 public void displayBorrowedItems(){
for(int i:libraryMap.keySet()){
    System.out.println("Item id:  "+i+"   Clientid: "+libraryMap.get(i));
}
  
}


}
    