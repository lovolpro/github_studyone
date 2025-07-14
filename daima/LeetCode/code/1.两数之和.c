/*
 * @lc app=leetcode.cn id=1 lang=c
 *
 * [1] 两数之和
 */

#include <stddef.h>

// @lc code=start
/**
 * Note: The returned array must be malloced, assume caller calls free().
 */
#include <stdlib.h>
#include <stdio.h>
#include <string.h>

// 哈希表节点
typedef struct {
    int key;
    int val;
} HashNode;

// 简单哈希表实现
#define HASH_SIZE 20011

int hash(int key) {
    return (key % HASH_SIZE + HASH_SIZE) % HASH_SIZE;
}

int* twoSum(int* nums, int numsSize, int target, int* returnSize) {
    HashNode* hashTable = (HashNode*)malloc(sizeof(HashNode) * HASH_SIZE);
    char* used = (char*)malloc(sizeof(char) * HASH_SIZE);
    memset(hashTable, 0, sizeof(HashNode) * HASH_SIZE);
    memset(used, 0, sizeof(char) * HASH_SIZE);

    for (int i = 0; i < numsSize; i++) {
        int complement = target - nums[i];
        int h = hash(complement);
        // 查找补数，只查找之前插入过的元素
        while (used[h]) {
            if (hashTable[h].key == complement) {
                int* result = (int*)malloc(2 * sizeof(int));
                result[0] = hashTable[h].val;
                result[1] = i;
                *returnSize = 2;
                free(hashTable);
                free(used);
                return result;
            }
            h = (h + 1) % HASH_SIZE;
        }
        // 插入当前值
        h = hash(nums[i]);
        while (used[h]) {
            h = (h + 1) % HASH_SIZE;
        }
        hashTable[h].key = nums[i];
        hashTable[h].val = i;
        used[h] = 1;
    }
    free(hashTable);
    free(used);
    *returnSize = 0;
    return NULL;
}
// @lc code=end

