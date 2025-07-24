#include <stdio.h>
#include <stdlib.h>
#include "increment.h"
#include "negate.h"

void main()
{
    int value1 = 10, value2 = 0, value3 = -10;
    int vessel1, vessel2, vessel3;
    vessel1 = increment(&value1);
    printf("Increment(10): %d\n", vessel1);
    vessel1 = negate(&value1);
    printf("Negate(10): %d\n", vessel1);
    vessel2 = increment(&value2);
    printf("Increment(0): %d\n", vessel2);
    vessel2 = negate(&value2);
    printf("Negate(0): %d\n", vessel2);
    vessel3 = increment(&value3);
    printf("Increment(-10): %d\n", vessel3);
    vessel3 = negate(&value3);
    printf("Negate(-10): %d\n", vessel3);
}