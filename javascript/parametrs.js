const keysParametrs = 'parametrs';
let parametrs = {
    censored: true, //Делать цензуру на 18+ hentay
    dub_anime: false, //Сохранять переводы для каждого аниме отдельно
    dub_anime_franchise: false
}

//Метод загрузки параметров
let synchparam = () => {
    let ls = JSON.parse(localStorage.getItem(keysParametrs));
    if (ls) {
        for (key in ls) {
            parametrs[key] = ls[key];
        }
    } else {
        localStorage.setItem(keysParametrs, JSON.stringify(parametrs));
    }
};

//Метод сохранения параметров
let saveparametrs = () => {
    localStorage.setItem(keysParametrs, JSON.stringify(parametrs));
}

//Загружаем параметры
synchparam();

let param = {
    keys: {
        default: 'NAN',
        censored: 'censored',
        dub_anime: 'dub_anime',
        dub_anime_franchise: 'dub_anime_franchise'
    },
    register: function (i,k){
        return{
            boolean: function(){
                i.change(function (){
                    parametrs[k] = this.checked;
                    saveparametrs();
                });
            }
        }
    }
}

let loadparampage = ()=>{
    for (const key in param.keys) {
        if(param.keys[key] != param.keys.default){
            let input = $(`input[data-param="${param.keys[key]}"]`);
            if(input.length > 0){
                let reg = param.register(input, key);
                if(typeof(parametrs[key]) == 'boolean'){
                    reg.boolean();
                    input.prop( "checked", parametrs[key] );
                }
            }
        }
    }
};

loadparampage();