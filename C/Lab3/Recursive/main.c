#include <stdio.h>
#include <stdlib.h>
int power(int base,int exp);
int main()
{
    int base,exp;
    printf("Write the base number");
    scanf("%d",&base);
    printf("Write the exponent number");

    scanf("%d",&exp);
    int result=power(base,exp);
    printf("%d",result);
    return 0;
}
int power(int base,int exp){


if(exp==0)return 1;

return power(base,exp-1)*base;


}
