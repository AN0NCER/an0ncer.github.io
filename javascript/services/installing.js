const key = 'application_installed';

let app = JSON.parse(localStorage.getItem(key)) || {
    installed: false,
    date: ''
};

(() => {
    console.log(`[service] - App Installing`);
    if (!app.installed && window.location.href.match('/?mode=standalone')) {
        app.installed = true;
        app.date = new Date().toISOString();
        localStorage.setItem(key, JSON.stringify(app));
        window.location.href = 'login.html';
    }
})();