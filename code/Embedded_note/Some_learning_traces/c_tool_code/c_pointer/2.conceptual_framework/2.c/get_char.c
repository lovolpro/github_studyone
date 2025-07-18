#include "get_char.h"

// 检测花括号是否匹配
int check_braces(const char* str) {
    int count = 0;  // 计数器，记录左括号的数量
    
    for (int i = 0; str[i] != '\0'; i++) {
        if (str[i] == '{') {
            count++;  // 遇到左括号，计数器加1
        } else if (str[i] == '}') {
            count--;  // 遇到右括号，计数器减1
            if (count < 0) {
                return 0;  // 右括号多于左括号，返回0表示不匹配
            }
        }
    }
    
    return count == 0;  // 如果计数器为0，表示匹配；否则不匹配
}

// 主函数，用于测试花括号匹配
void get_char() {
    char input[1000];
    
    printf("请输入包含花括号的字符串: ");
    fgets(input, sizeof(input), stdin);
    
    // 移除换行符
    input[strcspn(input, "\n")] = '\0';
    
    if (check_braces(input)) {
        printf("花括号匹配正确！\n");
    } else {
        printf("花括号不匹配！\n");
    }
}

