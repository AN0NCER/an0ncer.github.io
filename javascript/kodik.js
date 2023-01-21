const kodikApi = {
    api: 'íç»÷\x97\x1DÝî\x1FïNü{·ùw\x8Dôç¯]ë\x9E}',
    url: 'https://'+btoa('\x92\x87b\x91ªb')+'.com',
    list: function (query = {}, event = () => { }) {
        const url = this.url + '/list' + this.query(query);

        return new Promise((resolve)=>{
            fetch(url, {
                method: 'GET'
            }).then((response) => {
                if (!response.ok) {
                    resolve({failed: true});
                }
                resolve(response.json());
            });
        });
    },
    search: async function(query = {}, event=()=>{}){
        const url = this.url + '/search' + this.query(query);
        event( await new Promise((resolve)=>{
            fetch(url, {
                method: 'GET'
            }).then((response) => {
                if (!response.ok) {
                    resolve({failed: true});
                }
                resolve(response.json());
            });
        }));
    },
    translations: async function(query = {}, event=()=>{}){
        const url = this.url + '/translations/v2' + this.query(query);
        event( await new Promise((resolve)=>{
            fetch(url, {
                method: 'GET'
            }).then((response)=>{
                if(!response.ok){
                    resolve({failed: true});
                }
                resolve(response.json());
            });
        }));
    },

    query: function(query){
        let q = "?token="+btoa(this.api)+"&";
        if(Object.keys(query).length > 0){
            q += new URLSearchParams(query).toString();
        }
        return q;
    }
}