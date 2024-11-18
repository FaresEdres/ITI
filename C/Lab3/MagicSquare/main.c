#include <stdio.h>
#include <unistd.h>
#define cursor(x,y)  printf("\033[%d;%dH",(y+2),(x*4+2))

int main() {
    int n;

    printf("Enter the order of the magic square - odd number: ");
    scanf("%d", &n);
    // 1 will be in the mid column first row
    int num = 1;
    int currRow = 0, currCol = n / 2;


    while (num <= n * n) {

        cursor(currRow,currCol);

        printf("%d", num);

        int newRow = currRow - 1;
        int newCol = currCol + 1;


        if (newRow < 0) newRow = n - 1;
        if (newCol >= n) newCol = 0;
//To prevent overwriting
        if (num % n == 0) {
            newRow = currRow + 1;
            newCol = currCol;
        }


        currRow = newRow;
        currCol = newCol;

        num++;
        fflush(stdout);
        sleep(1);

    }
    printf("\n");
    return 0;
}
