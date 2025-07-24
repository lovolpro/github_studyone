#include <stdio.h>

double fun(int *n) {
    // 计算 n 的平方根
    double result = 0.0;
    if (n == NULL || *n < 0) {
        printf("Invalid input.\n");
        return result; // 返回 0.0 表示无效输入
    }

    // 计算平方根
    double temp = 0.0;
    result = *n;
    while (result != temp) {
        temp = result;
        result = 0.5 * (temp + *n / temp);
    }
    return result;
}

int main() {
    int number;
    printf("请输入一个正整数: ");
    scanf("%d", &number);
    
    double result = fun(&number);
    if (result > 0) {
        printf("%d 的平方根是: %.6f\n", number, result);
    }
    
    return 0;
}