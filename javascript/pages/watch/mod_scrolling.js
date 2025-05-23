export function ScrollHroizontal() {
    // Получить позицию выбранного элемента
    const selectedElementPosition = $('.value > .sel').position();

    // Получить ширину контейнера с эпизодами
    const episodesContainerWidth = $('.episodes').width();

    // Рассчитать ширину каждого эпизода
    const episodeWidth = 55 + 3;

    // Проверка, находится ли выбранный элемент в левой половине контейнера
    if (episodesContainerWidth / 2 > selectedElementPosition.left) {
        // Если да, то ничего не делаем и выходим из функции
        return;
    }

    // Вычислить новое значение прокрутки контейнера, чтобы выбранный элемент находился посередине
    const newScrollLeftValue = selectedElementPosition.left - episodesContainerWidth / 2 + episodeWidth;

    // Прокрутите контейнер до нового значения прокрутки
    // $('.episodes').scrollLeft(newScrollLeftValue);

    anime({
        targets: '.episodes',
        scrollLeft: newScrollLeftValue,
        duration: 300,
        easing: 'easeInOutQuad'
    });
}

export function ScrollVertical() {
    // Получить позицию выбранного элемента .sel
    const selectedElementPosition = $('.value > .sel').position();

    // Получить высоту блока .episodes
    const episodesContainerHeight = $('.episodes').height();

    // Высота одного эпизода
    const episodeHeight = 70 + 3;

    // Проверка того, находится ли выбранный элемент выше половины блока .episodes
    if (selectedElementPosition.top < episodesContainerHeight / 2) {
        // Если да, завершить функцию
        return;
    }

    // Прокрутка блока .episodes так, чтобы выбранный элемент оказался посередине
    // $('.episodes > .value').scrollTop(selectedElementPosition.top - episodesContainerHeight / 2 + episodeHeight);

    anime({
        targets: '.episodes > .value',
        scrollTop: selectedElementPosition.top - episodesContainerHeight / 2 + episodeHeight,
        duration: 300,
        easing: 'easeInOutQuad'
    });
}

export function AutoScrollEpisodes() {
    //Проверить ориентацию экрана и выполняем эту одну из этих функцией ScrollHroizontal, ScrollVertical
    if (!window.matchMedia("(orientation: landscape)").matches) {
        ScrollHroizontal(); // Вызываем функцию для горизонтальной прокрутки
    } else {
        if ($PARAMETERS.episrevers == "top") {
            ScrollHroizontal();
        } else {
            ScrollVertical(); // Вызываем функцию для вертикальной прокрутки
        }
    }
}