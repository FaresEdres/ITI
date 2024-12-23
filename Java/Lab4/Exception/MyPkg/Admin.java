package MyPkg;
public class Admin {
    public void plRatio(int profit,int loss) throws RuntimeException {
        if (loss==0) {
            throw new RuntimeException("Div by zero Exception");
        } else {
            System.out.println("P/L ratio"+profit/loss);
        }
    }

    public void checkBranches(int arr[],int size) throws IndexOutOfBoundsException {
        if (size>arr.length) {
            throw new IndexOutOfBoundsException("Wrong Array size");
        } else {
            System.out.println("Do operations");
        }
    }

    public void AdminId(int id) throws AdminException {
        if (id!=123456) {
            throw new AdminException("You are not an Admin :( No Id for you");
        } else {
            System.out.println("Your Id is: 123456");
        }
    }
}