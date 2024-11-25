#include <stdio.h>

int main(){



    int num_1 = 2, num_2 = 8;

     num_1 = num_1 ^ num_2;
     num_2 = num_1 ^ num_2;
     num_1 = num_1 ^ num_2;
     printf("%d,%d",num_1,num_2);
/*
    int num_1= 2,num_2 = 8;

     num_1 = num_1 + num_2;
     num_2 = num_1 - num_2;
     num_1 = num_1 - num_2;
     printf("%d,%d",num_1,num_2);

     num_1 = 2, num_2 = 8;

     num_1 = num_1 * num_2;
     num_2 = num_1 / num_2;
     num_1 = num_1 / num_2;
     printf("%d,%d",num_1,num_2);

     num_1 = 2, num_2 = 8;

     num_1 = num_1 - num_2;
     num_2 = num_1 + num_2;
     num_1 = num_2 - num_1;
     printf("%d,%d",num_1,num_2);

     float num_2f = 2, num_1f = 8;

     num_1f = num_1f / num_2f;
     num_2f = num_1f * num_2f;
     num_1f = num_2f / num_1f;
     printf("%.2f,%.2f",num_1f,num_2f);

*/


    return 0;

}
