export const SearchHistory = {
    key: 'search-history',
    data: [],

    loadHistory: function (event) {
        let data = localStorage.getItem(this.key);
        if (data)
            this.data = JSON.parse(data);
        event(this.data);
    },

    addHistory: function (id) {
        if (this.data == []) {
            this.data = localStorage.getItem(this.key) ? JSON.parse(localStorage.getItem(this.key)) : [];
        }
        // Check if the id already exists in the history
        let index = this.data.indexOf(id);
        if (index !== -1) {
            // If it does, move it to the first position
            this.data.splice(index, 1);
            this.data.unshift(id);
        } else {
            // If it doesn't, add it to the first position
            this.data.unshift(id);
            // And check if we have reached the maximum history length
            if (this.data.length > 10) {
                this.data.pop();
            }
        }
        localStorage.setItem(this.key, JSON.stringify(this.data));
    },

    clearHistory: function () {
        this.data = [];
        localStorage.setItem(this.key, JSON.stringify(this.data));
    }
}