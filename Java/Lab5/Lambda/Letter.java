public class Letter {
    public static void main(String args[]){
       String s= "efewf";
       boolean isAlpha=s.chars().allMatch(Character::isLetter);
}
}