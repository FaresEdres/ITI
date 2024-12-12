

#include <stdio.h>
#include <stdlib.h>
#include <ctype.h>
#include <string.h>
#include "validation.h"
int isAlphaSpace(char *str)
{
    for (int i = 0; str[i] != '\0'; i++) {
        char ch = str[i];

        if (!((ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z') || ch == ' ')) {
            return 0;
        }
    }
    return 1;
}

int getValidInteger(const char *prompt) {
    char input[50];
    int id;
    while (1) {

        //print
        printf("%s\n", prompt);
        fgets(input, sizeof(input), stdin);

        // Remove trailing newline
        input[strcspn(input, "\n")] = '\0';

        // optional sign


        //if (*ptr == '+' || *ptr == '-') ptr++;
        char *ptr = input;

        int is_valid = *ptr;
        while (is_valid && *ptr) {
            if (!isdigit(*ptr)) {
                is_valid = 0;
            }
            ptr++;
        }

        if (is_valid&& atoi(input)>0) {
            id = atoi(input);
            return id;
        } else {
            printf("Enter only Positive integer numbers\n");
        }
    }
}




char isUnique(Employee *emp,int count,int id){
    for(int i=0;i<count;i++){
    if(emp[i].id==id){

    return 0;
    }

    }
    return 1;

    }


