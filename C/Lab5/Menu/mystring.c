#include "mystring.h"

void faresStrcat(char dest[], char src[]){
int i = 0;
int j = strlen(dest);
while(src[i] != '\0' ){
    dest[j] = src[i];
    i++;
    j++;
}
dest[j] = '\0';
}
int faresStrcmp(char str1[], char str2[]){
    if(faresStrlen(str1) < faresStrlen(str2))return -1;
    if(faresStrlen(str1) > faresStrlen(str2))return 1;



for(int i =0; str1[i] != '\0'; i++){
    if(str1[i] > str2[i])return 1;
    if(str1[i] < str2[i]) return -1;
}
return 0;
}

void faresStrcpy(char dest[], char source[],int dest_size){

    int i = 0;
    if( faresStrlen(source) < dest_size){
        for(i=0; source[i] != '\0'; i++){
            dest[i] = source[i];
        }
    dest[i] = '\0';
    }
    else{
        printf("source is less than destination.");
    }
}
int faresStrlen(char text[]){
    int i = 0;
    while(text[i] != '\0'){
    i++;
    }
return i;
}

void faresLowerToUpper(char text[]){
int i = 0;
while(text[i] != '\0'){
    if (text[i] >= 97 && text[i] <= 122){
text[i] -= 32;
    }
i++;
}

void faresUpperToLower(char text[]){
    int i =0;
        while(text[i] != '\0'){
        if(text[i] >= 65  && text[i] <= 90){
            text[i] = text[i] + 32;
        }
i++;
    }
}
