//Текущая ориентация устройства
let current_device_orientation = "vertical";

(() => {
    //Инидентификатор для каких елементов будет отслеживать изменение ориентации экрана
    const id = "orientationchange";

    const elements = $(`[data-engine="${id}"]`);

    if (window.orientation && window.orientation == 90 || window.orientation == -90) {
        elements.addClass("landscape");
        current_device_orientation = "horizontal";
    } else {
        elements.removeClass("landscape");
        current_device_orientation = "vertical";
    }

    window.addEventListener("orientationchange", function () {
        if (window.orientation && window.orientation == 90 || window.orientation == -90) {
            elements.addClass("landscape");
            current_device_orientation = "horizontal";
        } else {
            elements.removeClass("landscape");
            current_device_orientation = "vertical";
        }
    }, false);
})();