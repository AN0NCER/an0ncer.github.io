<p align="center"><img src="https://github.com/AN0NCER/resources/raw/main/github-logo.png" width="200px" /></p>

______

<p align="center">Progressive web application to watch anime on your device and enter a list</p>

___

# Tunime

<img src="icon-512x512.png" align="left" width="50" />

This site is a mobile application for watching anime. Uses data from **Shikimori** and **Kodik** player, as well as **PWA** functionality.

## Functional

<img src="https://raw.githubusercontent.com/AN0NCER/resources/main/screenshot_1.PNG" align="right" width="310">

- [X] Search anime by name.
- [X] View information about anime, including description, genre, number of episodes and rating.
- [X] Play video on mobile device with Kodik player.
- [X] Add anime to favorites.
- [X] User account management.
- [X] Work offline as a PWA app.
- [X] Mobile optimization and friendly user interface.


## Pages

- [X] Main page.
- [X] Search page.
- [X] Page witch anime (Can Watch).
- [X] List page (User anime).
- [ ] User page (update).
- [X] Settings page.

## Description

**`https://an0ncer.github.io/`** - is an online platform for watching anime with the ability to manage your account and save your favorites. The site has a convenient and simple interface, has many filters and categories to search for anime. In addition, the site supports PWA functionality, which allows you to add it to the home screen of a mobile device and use it as a full-fledged application.

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