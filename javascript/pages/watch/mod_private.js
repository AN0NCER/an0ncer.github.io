let INCOGNITO = false;

class _Private{
    set INCOGNITO(val) {
        if(typeof val === 'boolean')
            INCOGNITO = val;
    }

    get INCOGNITO(){
        return INCOGNITO;
    }
}

export const Private = new _Private();