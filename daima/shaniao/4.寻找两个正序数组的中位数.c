/*
 * @lc app=leetcode.cn id=4 lang=c
 *
 * [4] 寻找两个正序数组的中位数
 */

#include <limits.h>

// @lc code=start
double findMedianSortedArrays(int* nums1, int nums1Size, int* nums2, int nums2Size) {
    // 确保 nums1 是较短的数组，这样可以在较短数组上进行二分查找
    if (nums1Size > nums2Size) {
        return findMedianSortedArrays(nums2, nums2Size, nums1, nums1Size);
    }
    
    int m = nums1Size;
    int n = nums2Size;
    int left = 0, right = m;
    
    while (left <= right) {
        int partitionX = (left + right) / 2;
        int partitionY = (m + n + 1) / 2 - partitionX;
        
        // 找到分割点左边的最大值
        int maxLeftX = (partitionX == 0) ? INT_MIN : nums1[partitionX - 1];
        int maxLeftY = (partitionY == 0) ? INT_MIN : nums2[partitionY - 1];
        
        // 找到分割点右边的最小值
        int minRightX = (partitionX == m) ? INT_MAX : nums1[partitionX];
        int minRightY = (partitionY == n) ? INT_MAX : nums2[partitionY];
        
        if (maxLeftX <= minRightY && maxLeftY <= minRightX) {
            // 找到了正确的分割点
            if ((m + n) % 2 == 0) {
                return ((double)(maxLeftX > maxLeftY ? maxLeftX : maxLeftY) + 
                        (double)(minRightX < minRightY ? minRightX : minRightY)) / 2.0;
            } else {
                return (double)(maxLeftX > maxLeftY ? maxLeftX : maxLeftY);
            }
        } else if (maxLeftX > minRightY) {
            // 在左半部分查找
            right = partitionX - 1;
        } else {
            // 在右半部分查找
            left = partitionX + 1;
        }
    }
    
    return 0.0;
}
// @lc code=end

