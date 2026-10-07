export interface CodingProblem {
  id: string;
  name: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  timeMinutes: number;
  description: string;
  starterCode: {
    javascript: string;
    python: string;
    java: string;
    cpp: string;
  };
  testCases: {
    input: string;
    expectedOutput: string;
  }[];
}

export const codingProblems: CodingProblem[] = [
  {
    id: '1',
    name: 'Two Sum',
    difficulty: 'Easy',
    timeMinutes: 15,
    description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.

Example:
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].`,
    starterCode: {
      javascript: `function twoSum(nums, target) {
    // Your code here
    
}

// Test
console.log(twoSum([2,7,11,15], 9)); // [0,1]`,
      python: `def twoSum(nums, target):
    # Your code here
    pass

# Test
print(twoSum([2,7,11,15], 9))  # [0,1]`,
      java: `public class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Your code here
        return new int[]{};
    }
}`,
      cpp: `#include <vector>
using namespace std;

vector<int> twoSum(vector<int>& nums, int target) {
    // Your code here
    return {};
}`
    },
    testCases: [
      { input: '[2,7,11,15], 9', expectedOutput: '[0,1]' },
      { input: '[3,2,4], 6', expectedOutput: '[1,2]' },
      { input: '[3,3], 6', expectedOutput: '[0,1]' }
    ]
  },
  {
    id: '2',
    name: 'Reverse Linked List',
    difficulty: 'Medium',
    timeMinutes: 30,
    description: `Given the head of a singly linked list, reverse the list, and return the reversed list.

Example:
Input: head = [1,2,3,4,5]
Output: [5,4,3,2,1]`,
    starterCode: {
      javascript: `function reverseList(head) {
    // Your code here
    
}`,
      python: `def reverseList(head):
    # Your code here
    pass`,
      java: `public class ListNode {
    int val;
    ListNode next;
    ListNode() {}
}

public class Solution {
    public ListNode reverseList(ListNode head) {
        // Your code here
        return null;
    }
}`,
      cpp: `struct ListNode {
    int val;
    ListNode *next;
};

class Solution {
public:
    ListNode* reverseList(ListNode* head) {
        // Your code here
        return nullptr;
    }
};`
    },
    testCases: [
      { input: '[1,2,3,4,5]', expectedOutput: '[5,4,3,2,1]' },
      { input: '[1,2]', expectedOutput: '[2,1]' },
      { input: '[]', expectedOutput: '[]' }
    ]
  },
  {
    id: '3',
    name: 'Merge Intervals',
    difficulty: 'Hard',
    timeMinutes: 60,
    description: `Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.

Example:
Input: intervals = [[1,3],[2,6],[8,10],[15,18]]
Output: [[1,6],[8,10],[15,18]]
Explanation: Since intervals [1,3] and [2,6] overlap, merge them into [1,6].`,
    starterCode: {
      javascript: `function merge(intervals) {
    // Your code here
    
}`,
      python: `def merge(intervals):
    # Your code here
    pass`,
      java: `public class Solution {
    public int[][] merge(int[][] intervals) {
        // Your code here
        return new int[][]{};
    }
}`,
      cpp: `#include <vector>
using namespace std;

vector<vector<int>> merge(vector<vector<int>>& intervals) {
    // Your code here
    return {};
}`
    },
    testCases: [
      { input: '[[1,3],[2,6],[8,10],[15,18]]', expectedOutput: '[[1,6],[8,10],[15,18]]' },
      { input: '[[1,4],[4,5]]', expectedOutput: '[[1,5]]' }
    ]
  }
];

