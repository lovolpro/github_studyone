#include <stdio.h>
#include <stdlib.h>


// TODO : 返回 a + b
double add(double a, double b)
{
    return a + b;
}


// TODO : 返回 a - b
double subtract(double a, double b)
{
    return a - b;
}

// TODO : 返回 a * b
double multiply(double a, double b)
{
    return a * b;
}

// TODO : 返回 a / b，若 b == 0，返回错误提示
double divide(double a, double b)
{
    if (b == 0) {
        printf("Error: Division by zero is not allowed.\n");
        return 0; // or handle error appropriately
    }
    return a / b;
}

// TODO : 输出菜单和操作提示
void show_menu()
{
    printf("Calculator Menu:\n");
    printf("1. Add\n");
    printf("2. Subtract\n");
    printf("3. Multiply\n");
    printf("4. Divide\n");
    printf("Please select an operation (1-4):\n");
}

// TODO : 获取用户输入，校验数据合法性
int get_input(double a, double b, char op)
{
    double result;
    switch (op) {
    case '1':
        result = add(a, b);
        printf("Result: %.2f\n", result);
        break;
    case '2':
        result = subtract(a, b);
        printf("Result: %.2f\n", result);
        break;
    case '3':
        result = multiply(a, b);
        printf("Result: %.2f\n", result);
        break;
    case '4':
        result = divide(a, b);
        if (b != 0) {
            printf("Result: %.2f\n", result);
        }
        break;
    default:
        printf("Invalid operation selected.\n");
        return -1; // Indicate error
    }
    return 0; // Indicate success
}

int main()
{
    double a, b;
    char op;
    char cont;
    do {
        show_menu();
        scanf(" %c", &op);
        printf("Enter two numbers: ");
        if (scanf("%lf %lf", &a, &b) != 2) {
            printf("Invalid input. Please enter two numbers.\n");
            return -1; // Indicate error
        }
        if (get_input(a, b, op) != 0) {
            return -1; // Indicate error
        }
        printf("Do you want to continue? (y/n): ");
        scanf(" %c", &cont);
    } while (cont == 'y' || cont == 'Y');
    printf("Thank you for using the calculator!\n");
    printf("Exiting the program.\n");
    return 0;
}
