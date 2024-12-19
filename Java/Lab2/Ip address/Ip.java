import java.util.regex.Pattern;
import java.util.StringTokenizer;
class IpCheck{

	// Function to validate the IPs address.
	  public static void ip(String s) {
    if (ValidIp(s)) {

      String[] octets = s.split("\\.");
      for (String octet:octets) {
        System.out.print(""+octet + "\t");
      }
      System.out.println();
    } else {
        System.out.println("invalid IP");
      }
    }

  public static boolean ValidIp(String ip) {

    String number = "(\\d{1,2}|1\\d{2}|2[0-4]\\d|25[0-5])";
    String ipRegex = number + "\\." +number +"\\." +number + "\\." + number;


    Pattern p = Pattern.compile(ipRegex);
    return p.matcher(ip).matches();
  }
}
class Ip{
  public static void main(String arg[]){
    IpCheck.ip("192.168.1.1");
    
  }
}
