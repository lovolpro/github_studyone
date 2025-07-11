#include <stddef.h>
#include <string.h>
#include <stdlib.h>
/*
 * @lc app=leetcode.cn id=6 lang=c
 *
 * [6] Z 字形变换
 */

// @lc code=start
char* convert(char* s, int numRows) {
    if (numRows == 1) {
        return s; // 或者 strdup(s) 如果需要新分配内存
    }

    int len = strlen(s);
    char* result = (char*)malloc((len + 1) * sizeof(char));
    int resultIdx = 0;

    int cycleLen = 2 * numRows - 2;

    for (int r = 0; r < numRows; r++) { // 遍历每一行
        for (int k = 0; ; k++) { // 遍历每个周期
            // 第一个字符的索引 (向下移动时)
            int index1 = k * cycleLen + r;
            if (index1 < len) {
                result[resultIdx++] = s[index1];
            } else {
                break; // 超出字符串长度，停止当前行的填充
            }

            // 中间行的第二个字符的索引 (向上斜向移动时)
            if (r > 0 && r < numRows - 1) {
                int index2 = (k + 1) * cycleLen - r;
                if (index2 < len) {
                    result[resultIdx++] = s[index2];
                }
            }
        }
    }
    result[len] = '\0'; // 添加字符串结束符
    return result;
}
// @lc code=end

