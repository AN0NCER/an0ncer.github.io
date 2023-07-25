//Елементы на которых будут изменяться статусы
const _elements = [".btn.btn--filter", ".btn.btn--clear", "main.main", "main.history", "main.result", "main.animation-loading"];

const _states = [
    { id: "common", class: 'state_common' },
    { id: "focus", class: 'state_focus' },
    { id: "search", class: 'state_search' },
    { id: "result", class: 'state_result' }
];

let _cur_state = _states[0];

export function SetState(num = 0, event = (s, f) => { /*$DEV.log(s, f)*/ }) {
    //Получаем все елементы со старого состояния
    let el = $('.' + _cur_state.class);
    //Запоминает старый статус
    let second = _cur_state;
    //Удаляем старый статус с елементов
    for (let i = 0; i < el.length; i++) {
        const element = $(el[i]);
        element.removeClass(_cur_state.class);
    }
    //Присваемваем новый статус объекту
    _cur_state = _states[num];
    //Присваемваем класс елементам со списка
    for (let i = 0; i < _elements.length; i++) {
        const element = _elements[i];
        $(element).addClass(_cur_state.class);
    }
    event(second, _cur_state);
}

export function GetState(){
    return _cur_state;
}

SetState(0);