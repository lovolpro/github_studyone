#include <stdio.h>

void main()
{
    printf("请输入两个数字：");
    int a, b;
    scanf("%d %d", &a, &b);
    int sum = a + b;
    printf("它们的和是：%d\n", sum);
}