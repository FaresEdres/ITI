import MyPkg.Admin;
import MyPkg.AdminException;
public class App {
    public static void main(String[] args) {
        Admin admin = new Admin();
        int arr[]={1,2,3};

        try {
           // admin.plRatio(5,0);
            //admin.checkBranches(arr,5);
            admin.AdminId(123456);
        } catch (AdminException e) {
            System.out.println(e.getMessage());
        }
        catch (IndexOutOfBoundsException e){
            System.out.println(e.getMessage());
        }
        catch(RuntimeException e){
            System.out.println(e.getMessage());
        }
    }
}