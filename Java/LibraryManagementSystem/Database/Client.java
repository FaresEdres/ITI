package Database;
public class Client{
private int id;
private String name;
private String email;
public Client(int id,String name,String email){
    this.id=id;
    this.name=name;
    this.email=email;
}

public int getClientId(){
    return this.id;
}

public void getClientDetails(){
    System.out.println("Id: \t"+id);
    System.out.println("Name \t"+name);
    System.out.println("Email \t"+email);
    
}
}