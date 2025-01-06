import java.util.Scanner;
import java.util.SortedMap;
import java.util.TreeMap;
import MyPkg.*;

public class WordDictionary{
   public static void main(String args[]){
      Scanner input=new Scanner(System.in);
      
    SortedMap<Character,SortedMap<String,String>> sMap =new TreeMap<>();
    
sMap.put('a',new TreeMap<>()); 
sMap.get('a').put("apple", "A fruit that is sweet and crisp.");
        sMap.get('a').put("ant", "A small insect known for its teamwork.");
        sMap.get('a').put("arm", "A limb on the human body.");

sMap.put('b',new TreeMap<>());
sMap.get('b').put("ball", "A round object used in games.");
sMap.get('b').put("bat", "An implement used in cricket or baseball.");
sMap.get('b').put("boat", "A vehicle used to travel on water.");

sMap.put('c',new TreeMap<>());
sMap.get('c').put("cat", "A small domesticated carnivorous mammal.");
sMap.get('c').put("car", "A four-wheeled vehicle for transport.");
sMap.get('c').put("cake", "A sweet baked dessert.");
/*************Display************ */
SortedMapOperations.mapDisplay(sMap);
/*************Insert************ */
System.out.println("Insert word");
String newWord=input.nextLine();
System.out.println("Insert a Sentence");
String sentence=input.nextLine();
SortedMapOperations.mapInsert(sMap, newWord, sentence);
/*************Display************ */
SortedMapOperations.mapDisplay(sMap);
/*************Search************ */
System.out.println("Search word");
String searchWord=input.nextLine();
SortedMapOperations.mapSearch(sMap,searchWord);
/*************Display************ */
SortedMapOperations.mapDisplay(sMap);
/*************Delete************ */
System.out.println("Delete word");
String deleteWord=input.nextLine();
SortedMapOperations.mapDelete(sMap, deleteWord);
/*************Display************ */
SortedMapOperations.mapDisplay(sMap);



   }
}