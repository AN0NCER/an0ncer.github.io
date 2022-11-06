$('.search').keyup(()=>{
    let value = $('.search').val();
    shikimoriApi.Animes.animes({
        search: value,
        limit: 16
    }, (response)=>{
        if(response){
            $('.results').empty();
            for (let index = 0; index < response.length; index++) {
                const element = response[index];
                let html = `<a href="/watch.html?id=${element.id}"><div class="anime-card"><div class="anime-image">
                        <img src="https://nyaa.shikimori.one${element.image.original}" alt="${element.russian}"><div class="play-btn"><div class="btn"><svg viewBox="0 0 30 36" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.70312 0.551381C4.54688 -0.159557 3.09375 -0.182995 1.91406 0.481068C0.734375 1.14513 0 2.39513 0 3.75451V31.2545C0 32.6139 0.734375 33.8639 1.91406 34.5279C3.09375 35.192 4.54688 35.1608 5.70312 34.4576L28.2031 20.7076C29.3203 20.0279 30 18.817 30 17.5045C30 16.192 29.3203 14.9889 28.2031 14.3014L5.70312 0.551381Z" fill="white" /></svg></div></div></div><div class="anime-title">${element.russian}</div></div></a>`;
                $('.results').append(html);
            }
        }
    });
})