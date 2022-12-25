# Notes

___

Formula to calculate percentage:

**JavaScript:**
```js
function calculatePercentage(part, whole) {
  return (part / whole) * 100;
}

// Example using:
let percentage = calculatePercentage(2, 12);
console.log(percentage); // result 16.666666666666668
```

**TypeScript:**
```ts
function calculatePercentage(part: number, whole: number): number {
  return (part / whole) * 100;
}

// Example using:
let percentage = calculatePercentage(2, 12);
console.log(percentage); // result 16.666666666666668
```

In this example, the **`calculatePercentage`** function takes two arguments: **`part`** and **`whole`**. It returns the value of the part expressed as a percentage of the whole.

>Note: To convert a percentage to a decimal number, you need to divide the percentage value by 100. For example, 50% is 0.5 in decimal format.

___