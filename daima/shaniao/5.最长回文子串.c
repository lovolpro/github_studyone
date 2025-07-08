/*
 * @lc app=leetcode.cn id=5 lang=c
 *
 * [5] 最长回文子串
 */

// @lc code=start
#include <stddef.h>
#include <string.h>

char* longestPalindrome(char* s) {
    int n = strlen(s);
    if (n == 0) return "";

    int start = 0, maxLen = 1;
    int dp[1001][1001] = {0}; // dp[i][j] means s[i..j] is palindrome

    for (int i = 0; i < n; i++) {
        dp[i][i] = 1;
    }

    for (int len = 2; len <= n; len++) {
        for (int i = 0; i <= n - len; i++) {
            int j = i + len - 1;
            if (s[i] == s[j]) {
                if (len == 2) {
                    dp[i][j] = 1;
                } else {
                    dp[i][j] = dp[i + 1][j - 1];
                }
            } else {
                dp[i][j] = 0;
            }
            if (dp[i][j] && len > maxLen) {
                start = i;
                maxLen = len;
            }
        }
    }

    char* res = (char*)malloc(sizeof(char) * (maxLen + 1));
    strncpy(res, s + start, maxLen);
    res[maxLen] = '\0';
    return res;
}
// @lc code=end

