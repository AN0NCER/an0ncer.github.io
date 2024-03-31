async function simonmain() {
    simonglitch();
}

async function simonglitch() {
    const s = sessionStorage.getItem('simons');
    if (window.location.pathname == '/' && !s || window.location.pathname == '/index.html' && !s) {
        document.addEventListener("DOMContentLoaded", async function () {
            // Create a new div element
            const div = document.createElement("div");

            // Set the id attribute of the div to "simons"
            div.id = "simons";

            // Set the CSS styles for the div
            div.style.position = "fixed";
            div.style.top = "0";
            div.style.left = "0";
            div.style.right = "0";
            div.style.bottom = "0";
            div.style.zIndex = "999";
            div.style.pointerEvents = "all";

            // Append the div to the body of the HTML document
            document.body.appendChild(div);
            document.body.style.overflowX = "hidden";

            await simonsleep(5000);

            const bg = document.getElementById('simons');
            const count = 20;
            for (let i = 0; i < count; i++) {
                let glitchBox = document.createElement("div");
                glitchBox.className = 'simons-box';
                glitchBox.style.position = "absolute";
                bg.appendChild(glitchBox);
            }

            const glitch = document.getElementsByClassName('simons-box');
            const colors = ["#FF0000", "#00FF00", "#0000FF"];
            const colorProbability = 0.6;

            let completed = 0;

            const interval = setInterval(function () {
                // Select all img elements on the page
                var imgElements = document.getElementsByTagName('img');

                // Create an array to store the src attributes of all img elements
                var imgSrcs = [];

                // Loop through all img elements and store their src attributes in the array
                for (let i = 0; i < imgElements.length; i++) {
                    imgSrcs.push(imgElements[i].src);
                }
                for (let i = 0; i < glitch.length; i++) {
                    glitch[i].style.left = Math.floor(Math.random() * 100) + 'vw';
                    glitch[i].style.top = Math.floor(Math.random() * 100) + 'vh';
                    glitch[i].style.width = Math.floor(Math.random() * 400) + 'px';
                    glitch[i].style.height = Math.floor(Math.random() * 100) + 'px';
                    var isColor = Math.random() < colorProbability;

                    if (isColor) {
                        // Select a random color from the colors array
                        var randomColorIndex = Math.floor(Math.random() * colors.length);

                        // Set the background color of the glitch element to the randomly selected color
                        glitch[i].style.backgroundColor = colors[randomColorIndex];
                        glitch[i].style.backgroundImage = ''; // Clear background image
                    } else {
                        if (imgSrcs.length > 0) {
                            // Select a random index from the imgSrcs array
                            var randomIndex = Math.floor(Math.random() * imgSrcs.length);

                            // Set the background image of the glitch element to the randomly selected src
                            glitch[i].style.backgroundImage = `url(${imgSrcs[randomIndex]})`;
                            glitch[i].style.backgroundSize = 'cover'; // Set background size to cover
                            glitch[i].style.width = '100%'; // Set width to 100%
                        } else {
                            // If no images are available, set a background color instead
                            var randomColorIndex = Math.floor(Math.random() * colors.length);
                            glitch[i].style.backgroundColor = colors[randomColorIndex];
                            glitch[i].style.backgroundImage = ''; // Clear background image
                        }
                    }
                }
                const h = document.getElementsByTagName('header');
                h[0].style.transform = `translate(${Math.floor(Math.random() * -50)}px, ${Math.floor(Math.random() * 50)}px)`;
                const j = document.getElementsByClassName('swiper-horizontal');
                const k = document.getElementsByClassName('section-title');
                const l = document.getElementsByClassName('genres');
                const a = document.getElementsByClassName('card-anime');
                const s = document.getElementsByClassName('btn-menu');
                const d = document.getElementsByClassName('application-menu');
                const f = document.getElementsByTagName('input');
                const g = document.getElementsByTagName('span');
                for (let i = 0; i < j.length; i++) {
                    j[i].style.transform = `translate(${Math.floor(Math.random() * 100) - 50}px, ${Math.floor(Math.random() * 100) - 50}px)`;
                }
                for (let i = 0; i < k.length; i++) {
                    k[i].style.transform = `translate(${Math.floor(Math.random() * 100) - 50}px, ${Math.floor(Math.random() * 100) - 50}px)`;
                }
                for (let i = 0; i < l.length; i++) {
                    l[i].style.transform = `translate(${Math.floor(Math.random() * 20) - 10}px, ${Math.floor(Math.random() * 20) - 10}px)`;
                }
                for (let i = 0; i < a.length; i++) {
                    a[i].style.transform = `translate(${Math.floor(Math.random() * 100) - 50}px, ${Math.floor(Math.random() * 100) - 50}px)`;
                }
                for (let i = 0; i < s.length; i++) {
                    s[i].style.transform = `translate(${Math.floor(Math.random() * 100) - 50}px, ${Math.floor(Math.random() * 100) - 50}px)`;
                }
                for (let i = 0; i < d.length; i++) {
                    d[i].style.transform = `translate(${Math.floor(Math.random() * 100) - 50}px, ${Math.floor(Math.random() * 100) - 50}px)`;
                }
                for (let i = 0; i < f.length; i++) {
                    f[i].style.transform = `translate(${Math.floor(Math.random() * 100) - 50}px, ${Math.floor(Math.random() * 100) - 50}px)`;
                }
                for (let i = 0; i < g.length; i++) {
                    g[i].style.transform = `translate(${Math.floor(Math.random() * 100) - 50}px, ${Math.floor(Math.random() * 100) - 50}px)`;
                }

                completed++;

                if (completed > 8) {
                    clearInterval(interval);
                    div.parentNode.removeChild(div);
                    h[0].style.transform = ``;
                    for (let i = 0; i < j.length; i++) {
                        j[i].style.transform = ``;
                    }
                    for (let i = 0; i < k.length; i++) {
                        k[i].style.transform = ``;
                    }
                    for (let i = 0; i < l.length; i++) {
                        l[i].style.transform = ``;
                    }
                    for (let i = 0; i < a.length; i++) {
                        a[i].style.transform = ``;
                    }
                    for (let i = 0; i < s.length; i++) {
                        s[i].style.transform = ``;
                    }
                    for (let i = 0; i < d.length; i++) {
                        d[i].style.transform = ``;
                    }
                    for (let i = 0; i < f.length; i++) {
                        f[i].style.transform = ``;
                    }
                    for (let i = 0; i < g.length; i++) {
                        g[i].style.transform = ``;
                    }
                }

                sessionStorage.setItem('simons', true);
            }, 50);
        });
    }
}

function simonscat_py() {
    if (window.location.pathname == '/watch.html') {
        document.addEventListener("DOMContentLoaded", function () {
            const inner = document.getElementsByClassName('loader');
            for (let i = 0; i < inner.length; i++) {
                const element = inner[i];
                element.parentNode.removeChild(element);
            }
            const img = document.createElement("img");
            img.src = "https://github.com/AN0NCER/resources/blob/main/simons/wartet.gif?raw=true";
            img.style.position = 'absolute';
            img.width = '250';
            img.style.left = 'calc(50% - 250px / 2)';
            img.style.top = 'calc(50% - 250px / 2)'
            document.getElementsByClassName('page-loading')[0].appendChild(img);

            // Создаем элемент <a>
            var link = document.createElement("a");
            link.href = "https://www.youtube.com/@SimonsCat";
            link.style.display = "flex";
            link.style.justifyContent = "center";
            link.style.alignItems = "center";
            link.style.background = "#e5e8ef";

            // Создаем элемент <img>
            var image = document.createElement("img");
            image.src = "https://github.com/AN0NCER/resources/blob/main/simons/hero.gif?raw=true";
            image.style.position = "initial";

            // Создаем элемент <div> для класса "hero"
            var heroDiv = document.createElement("div");
            heroDiv.className = "hero";

            // Создаем элемент <div> для класса "name"
            var nameDiv = document.createElement("div");
            nameDiv.className = "name";
            nameDiv.innerText = "Кот Саймона";

            // Добавляем элементы в нужном порядке
            heroDiv.appendChild(nameDiv);
            link.appendChild(image);
            link.appendChild(heroDiv);
            document.querySelector('.hero-anime > .val').appendChild(link);

            image = document.createElement("img");
            image.src = "https://github.com/AN0NCER/resources/blob/main/simons/schlafe.gif?raw=true";
            image.style.position = "absolute";
            image.style.width = "140px";
            image.style.right = "10%";
            image.style.zIndex = "2";

            image.style.top = "calc(140px / 2 * -1 + -7px)";
            heroDiv = document.createElement("div");
            heroDiv.style.position = "relative"
            heroDiv.appendChild(image);
            document.querySelector('.player').appendChild(heroDiv);

            var parent = document.querySelector('.franchisa-anime > a:first-child');
            if (parent != null) {
                image = document.createElement("img");
                image.src = "https://github.com/AN0NCER/resources/blob/main/simons/schlafe.gif?raw=true";
                image.style.zIndex = "2";
                parent.append(image);
            }

            waitForElm('.franchisa-anime > a').then((elm) => {
                var parent = document.querySelector('.franchisa-anime > a:first-child');
                if (parent != null) {
                    image = document.createElement("img");
                    image.src = "https://github.com/AN0NCER/resources/blob/main/simons/cooc.gif?raw=true";
                    image.style.position = "absolute";
                    image.style.width = "105px";
                    image.style.right = "10px";
                    image.style.top = "7px";
                    parent.append(image);
                    parent = document.querySelector('.franchisa-anime');
                    if (parent != null) {
                        parent.style.overflowY = "hidden";
                    }
                }
            });
            image = document.createElement("img");
            image.style.position = "absolute";
            image.src = "https://github.com/AN0NCER/resources/blob/main/simons/interesant.gif?raw=true";

            image.style.width = "106px";
            image.style.right = "calc(50% - 106px / 2)";
            image.style.top = "auto";
            image.style.left = "auto";
            image.style.bottom = "0";
            image.style.zIndex = "9";
            heroDiv = document.createElement("div");
            heroDiv.appendChild(image);
            document.querySelector('.preview').appendChild(heroDiv);
            image = document.createElement("img");
            image.src = "https://github.com/AN0NCER/resources/blob/main/simons/hide.gif?raw=true";
            heroDiv = document.createElement("div");
            heroDiv.className = "slide";
            heroDiv.style.display = "grid";
            heroDiv.style.placeItems = "center";
            heroDiv.style.background = "#e5e8ef";
            heroDiv.style.borderRadius = "3px";
            heroDiv.style.paddingLeft = "20px";
            heroDiv.style.paddingRight = "40px";
            heroDiv.style.maxHeight = "150px";
            heroDiv.appendChild(image);
            document.querySelector('.galery-slider').appendChild(heroDiv);
        });
    }
}

function simonsleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
simonmain();
simonscat_py();

function waitForElm(selector) {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                observer.disconnect();
                resolve(document.querySelector(selector));
            }
        });

        // If you get "parameter 1 is not of type 'Node'" error, see https://stackoverflow.com/a/77855838/492336
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}