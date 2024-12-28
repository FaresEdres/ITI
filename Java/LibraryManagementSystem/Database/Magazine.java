package Database;
public class Magazine extends LibraryItem{
      // Daily-Weekly - Monthly
      private int volume;
      private int issueNumber;
     public Magazine(int id,String title,int volume,int issueNumber){
            super(id,title);
            this.volume=volume;
            this.issueNumber=issueNumber;
      }
          public void getItemDetails(){
        System.out.println("Id: \t"+id);
        System.out.println("title \t"+title);
        System.out.println("Volume \t"+volume);
        System.out.println("Issue \t"+issueNumber);

    }
}