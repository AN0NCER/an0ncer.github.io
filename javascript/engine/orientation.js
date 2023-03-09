(() => {
    //Инидентификатор для каких елементов будет отслеживать изменение ориентации экрана
    const id = "orientationchange";

    const elements = $(`[data-engine="${id}"]`);

    if (window.orientation && window.orientation == 90 || window.orientation == -90) {
        elements.addClass("landscape");
    } else {
        elements.removeClass("landscape");
    }

    window.addEventListener("orientationchange", function () {
        if (window.orientation && window.orientation == 90 || window.orientation == -90) {
            elements.addClass("landscape");
        } else {
            elements.removeClass("landscape");
        }
    }, false);
})();