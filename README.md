<p align="center"><img src="https://github.com/AN0NCER/resources/raw/main/github-logo.png" width="200px" /></p>

______

<p align="center">Progressive web application to watch anime on your device and enter a list</p>

___

## Notes

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

I keep making news slider (trailers). The functionality will include:

- Trailer data (video, audio, id, anime, image)
- Direct inclusion of video + audio from google server
- Additional **`YT.Player`** library if there are problems with the main server

This list of trailers will be changed every Sunday. To do this, I am writing a node js and python script that will select the actual trailers of this week.

All changes are in another branch (**main-page**)
___