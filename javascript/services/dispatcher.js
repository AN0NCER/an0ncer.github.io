import('./installing.js');

export const CurrentPage = $($(`head meta[name="page"]`)[0]).attr('content');

const handlers = {
    'pageload': (name, data, manager) => {
        if(CurrentPage === data.page){
            if(data.redirect){
                manager.RemoveTask(name);
                window.location.href = data.redirect;
            }
        }
    }
};

class Dispatcher {
    constructor() {
        this.name = 'dispatcher';
        this.tasks = JSON.parse(localStorage.getItem(this.name)) || [];
        
        //Проверка задач на статус pending и выполнение
        this.tasks.forEach(task => {
            if (task.status === 'pending') {
                handlers[task.type](task.name, task.data, this);
            }
        });
    }
    
    /**
     * Создать новую задачу
     * @param {string} name - название задачи
     * @param {'pageload'} type - тип задачи
     * @param {object} data - данные задачи
    */
   NewTask(name, type) {
       if (type === 'pageload') {
           return {
               data: ({ page, redirect = undefined } = {}) => {
                   const Task = {
                        type: 'pageload',
                        name: name,
                        data: {
                            page: page,
                            redirect: redirect
                        }
                    }
                    this.#AddTask(Task);
                }
            }
        }
    }

    #AddTask({ name, type, data } = {}) {
        this.tasks = this.tasks.filter(task => task.name !== name || task.status !== 'pending');
        this.tasks.push({
            type: type,
            name: name,
            status: 'pending',
            data: data
        });
        localStorage.setItem(this.name, JSON.stringify(this.tasks));
    }
    
    RemoveTask(name){
        this.tasks = this.tasks.filter(task => task.name !== name);
        if(this.tasks.length === 0){
            localStorage.removeItem(this.name);
        } else {
            localStorage.setItem(this.name, JSON.stringify(this.tasks));
        }
    }
}

console.log(`[service] - Dispatcher`);
export const Manager = new Dispatcher();