/*
 * @lc app=leetcode.cn id=7 lang=c
 *
 * [7] 整数反转
 */

 // @lc code=start
int reverse(int x)
{
    int reversed = 0;
    while (x != 0) {
        int pop = x % 10;
        x /= 10;
        // 溢出判断
        if (reversed > 2147483647 / 10 || (reversed == 2147483647 / 10 && pop > 7)) return 0;
        if (reversed < -2147483648 / 10 || (reversed == -2147483648 / 10 && pop < -8)) return 0;
        reversed = reversed * 10 + pop;
    }
    return reversed;
}
// @lc code=end
