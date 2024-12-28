import Database.*;
import java.util.Scanner;

public class Main {
     static void handleMenu(){
        System.out.println("\nMain Menu:");
        System.out.println("1. Library Items");
        System.out.println("2. Clients");
        System.out.println("3. Borrow/Lend");
        System.out.println("4. Exit");
        System.out.print("Enter your choice: ");
        
    }
    private static void handleLibraryItems(Scanner scanner, Library library) {
        while (true) {
            System.out.println("\nLibrary Items Menu:");
            System.out.println("1. Add Library Item");
            System.out.println("2. Retrieve Library Item");
            System.out.println("3. Display All Library Items");
            System.out.println("4. Delete Library Item");
            System.out.println("5. Back to Main Menu");
            System.out.print("Enter your choice: ");
            
            int choice = Validate.validInt();
            switch (choice) {
                case 1:
                    System.out.print("Enter item type (1 for Book, 2 for Magazine): ");
                    int type = scanner.nextInt();
                    System.out.print("Enter ID: ");
                    int id = scanner.nextInt();
                    System.out.print("Enter title: ");
                    String title = scanner.next();
                    if (type == 1) {
                        System.out.print("Enter ISBN: ");
                        String isbn = scanner.next();
                        library.addItem(new Book(id, title, isbn));
                    } else if (type == 2) {
                        System.out.print("Enter volume: ");
                        int volume = scanner.nextInt();
                        System.out.print("Enter issue number: ");
                        int issueNumber = scanner.nextInt();
                        library.addItem(new Magazine(id, title, volume, issueNumber));
                    }
                    break;

                case 2:
                    System.out.print("Enter item ID to retrieve: ");
                    id = scanner.nextInt();
                    try {
                        LibraryItem item = library.retrieveItem(id);
                        item.getItemDetails();
                    } catch (ItemNotFoundException e) {
                        System.out.println(e.getMessage());
                    }
                    break;

                case 3:
                    library.displayAllItems();
                    break;

                case 4:
                    System.out.print("Enter item ID to delete: ");
                    id = scanner.nextInt();
                    try {
                        library.deleteItem(id);
                        System.out.println("Item deleted.");
                    } catch (ItemNotFoundException e) {
                        System.out.println(e.getMessage());
                    }
                    break;

                case 5:
                    return;

                default:
                    System.out.println("Invalid choice. Please try again.");
            }
        }
    }

    private static void handleClients(Scanner scanner, Library library) {
        while (true) {

            System.out.println("\nClients Menu:");
            System.out.println("1. Add Client");
            System.out.println("2. Retrieve Client");
            System.out.println("3. Display All Clients");
            System.out.println("4. Delete Client");
            System.out.println("5. Back to Main Menu");
            System.out.print("Enter your choice: ");
            
            int choice =  Validate.validInt();
            switch (choice) {
                case 1:
                    System.out.print("Enter client ID: ");
                    int clientId = scanner.nextInt();
                    System.out.print("Enter client name: ");
                    String name = scanner.next();
                    System.out.print("Enter client email: ");
                    String email = scanner.next();
                    library.addClient(new Client(clientId, name, email));
                    break;

                case 2:
                    System.out.print("Enter client ID to retrieve: ");
                    clientId = scanner.nextInt();
                    try {
                        Client client = library.retrieveClient(clientId);
                        client.getClientDetails();
                    } catch (Exception e) {
                        System.out.println(e.getMessage());
                    }
                    break;

                case 3:
                    library.displayAllClients();
                    break;

                case 4:
                    System.out.print("Enter client ID to delete: ");
                    clientId = scanner.nextInt();
                    try {
                        library.deleteClient(clientId);
                        System.out.println("Client deleted.");
                    } catch (Exception e) {
                        System.out.println(e.getMessage());
                    }
                    break;

                case 5:
                    return;

                default:
                    System.out.println("Invalid choice. Please try again.");
            }
        }
    }

    private static void handleBorrowLend(Scanner scanner, Library library) {
        while (true) {
            System.out.println("\nBorrow/Lend Menu:");
            System.out.println("1. Borrow Item");
            System.out.println("2. Return Item");
            System.out.println("3. Display Borrowed Items");
            System.out.println("4. Back to Main Menu");
            System.out.print("Enter your choice: ");
            
            int choice =  Validate.validInt();
            switch (choice) {
                case 1:
                    System.out.print("Enter client ID: ");
                    int clientId = scanner.nextInt();
                    System.out.print("Enter item ID: ");
                    int itemId = scanner.nextInt();
                    library.borrowItem(clientId, itemId);
                    break;

                case 2:
                    System.out.print("Enter client ID: ");
                    clientId = scanner.nextInt();
                    System.out.print("Enter item ID: ");
                    itemId = scanner.nextInt();
                    library.returnItem(clientId, itemId);
                    break;

                case 3:
                 
               
                    library.displayBorrowedItems();

                    break;
 
                case 4:
                    return;

                default:
                    System.out.println("Invalid choice. Please try again.");
            }
        }
    }
    public static void main(String[] args) {
        Library library = new Library();
        Scanner scanner = new Scanner(System.in);

        while (true) {
            handleMenu();
            int mainChoice = Validate.validInt();
            switch (mainChoice) {
                case 1:
                    handleLibraryItems(scanner, library);
                    break;

                case 2:
                    handleClients(scanner, library);
                    break;

                case 3:
                    handleBorrowLend(scanner, library);
                    break;

                case 4:
                    System.out.println("Exiting...");
                    scanner.close();
                    return;

                default:
                    System.out.println("Invalid choice. Please try again.");
            }
        }
    }

    
}
