class Count{
public static int index(String text,String target){
int index=0;
int count=0;
while(index!=-1){
index =text.indexOf(target,index);
if(index!=-1){
count++;
index++;
}
}
return count;
}
public static int split(String text,String target){
String words[]=text.split("\\s");
int count=0;
for(String word:words){
if( word.equals("ITI"))count++;
}
return count;
}
public static int replace(String text,String target){
String replaced=text.replace("ITI","");
int count=0;
count=(text.length()-replaced.length())/target.length();
return count;
}

}

class Token{
public static void main(String args[]){
String text="ITI develops people and ITI house of developers and ITI for people";
String target ="ITI";
System.out.println("Count using Indexof:"+Count.index(text,target));
System.out.println("Count using Split:"+Count.split(text,target));
System.out.println("Count using Replace:"+Count.replace(text,target));

/*Should be improved by using map or set
int ptr=0;
int len=text.length();
String target ="ITI";
int targetLen=target.length();
while(ptr<len){
if(text.charAt(ptr)==target.charAt(0)){
int i=1;
while(i<targetLen){
ptr++;
if(text.charAt(ptr)!=target.charAt(i))continue;

i++;
}
if(i==targetLen)count++;
}
ptr++;
}
*/
}

}
