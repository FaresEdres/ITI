    package MyPkg;

    import java.util.SortedMap;
    import java.util.TreeMap;

    public class SortedMapOperations {
        public static void mapInsert(SortedMap<Character,SortedMap<String,String>> sMap,String newWord,String sentence){

    Character letter=Character.toLowerCase(newWord.charAt(0));
    if(!sMap.containsKey(letter)){
    sMap.put(letter,new TreeMap<>());
    }
    sMap.get(letter).put(newWord,sentence);
        }

        public static void mapDelete(SortedMap<Character,SortedMap<String,String>> sMap,String deleteWord){
    Character deleteChar=deleteWord.charAt(0);
    sMap.get(deleteChar).remove(deleteWord);
        }
        public static void mapDisplay(SortedMap<Character,SortedMap<String,String>> sMap){
            System.out.println("Dictionary");
    for(Character key :sMap.keySet()){
    System.out.println("Words with letter  "+key+":");
    for (String word :sMap.get(key).keySet()){
    System.out.println("-"+word+"->"+sMap.get(key).get(word));
        }}}
        public static void mapSearch(SortedMap<Character,SortedMap<String,String>> sMap,String searchWord){
    Character searchCharacter=searchWord.charAt(0);
    if((sMap.containsKey(searchCharacter))&&sMap.get(searchCharacter).containsKey(searchWord)){
    System.out.println("Word is found");
        }
    else {
        System.out.println("Word isnot found");

    }    
    }
    }

