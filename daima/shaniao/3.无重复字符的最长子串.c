/*
 * @lc app=leetcode.cn id=3 lang=c
 *
 * [3] 无重复字符的最长子串
 */

// @lc code=start
int lengthOfLongestSubstring(char* s) {
    int charSet[128] = {0}; // ASCII字符集
    int left = 0, right = 0, maxLength = 0;
    while (s[right] != '\0') {
        if (charSet[(unsigned char)s[right]] == 0) {
            charSet[(unsigned char)s[right]]++;
            maxLength = (right - left + 1 > maxLength) ? (right - left + 1) : maxLength;
            right++;
        } else {
            charSet[(unsigned char)s[left]]--;
            left++;
        }
    }
    return maxLength;
}
// @lc code=end

