'use strict';

let toDoList = {
    tasks:[],
    startToDoList() {
        let key, validChoices = {add: true, delete: true, update: true, sort: true}
        while (true) {
            do {
                key = prompt('Введите ключ метода.');
                if (key === null) return alert(toDoList.tasks.map((item)=>JSON.stringify(item, null, 2)));
                if (key === 'add') {
                    this.addTask();
                }
                else if (key === 'delete') {
                    this.deleteTask();
                }
                else if (key === 'update') {
                    this.updateTask();
                }
                else if (key === 'sort') {
                    this.sortTask();
                }
                if (!validChoices[key]) alert('Нет такого ключа задачи!');
            } while (!validChoices[key]);   
        }
    },
    findById(num) {
        return this.tasks.findIndex(item => item.id === Number(num))
    },
    addTask() {
        let title, priority;
        do {
            title = prompt(`Введите название задачи:`);
            if (!title) alert('Вы не ввели название задачи!');
        } while (!title);
        do {
            priority = prompt('Введите приоритет задачи:');
            if (Boolean(Number(priority)) !== true) alert('Вы не ввели приоритет задачи!');
        } while (Boolean(Number(priority)) !== true);
        this.tasks.push({
            title,
            id : this.tasks.length + 1,
            priority,
        });
    },
    deleteTask() {
        let id;
        do {
            id = prompt('Введите id задачи для удаления:');
            if (Boolean(Number(id)) !== true) alert('Вы не ввели id задачи для удаления!');
        } while (Boolean(Number(id)) !== true);
        if (this.findById(id) !== -1) {
            this.tasks.splice(this.findById(id), 1)
        }
        else {
            return alert('Нет задачи с таким id!')
        }
    },
    updateTask() {
        let id, key, validChoices = {title: true, priority: true};
        do {
            id = prompt('Введите id задачи для обновления :');
            if (Boolean(Number(id)) !== true) alert('Вы не ввели id задачи для обновления!');
        } while (Boolean(Number(id)) !== true);
        if (this.findById(id) !== -1) {
            do {
                key = prompt('Введите ключ задачи для обновления.');
                if (!validChoices[key]) alert('Нет такого ключа задачи!');
            } while (!validChoices[key]);
            if (key === 'title') {
                let title;
                do {
                    title = prompt(`Введите новое название задачи:`);
                    if (!title) alert('Вы не ввели новое название задачи!');
                } while (!title);
                this.tasks[this.findById(id)][key] = title;
            }
            else if (key === 'priority') {
                let priority;
                do {
                    priority = prompt('Введите новый приоритет задачи:');
                    if (Boolean(Number(priority)) !== true) alert('Вы не ввели новый приоритет задачи!');
                } while (Boolean(Number(priority)) !== true);
                this.tasks[this.findById(id)][key] = priority;
            }
        }
        else {
            return alert('Нет задачи с таким id!')
        }
    }, 
    sortTask() {
        let sortingOrder, validChoices = { min: true, max: true };
        do {
            sortingOrder = prompt('Введите параметр сортировки: по убыванию(min) или по возрастанию(max).');
            if (!validChoices[sortingOrder]) alert('Нет такого параметра сортировки!');
        } while (!validChoices[sortingOrder]);
        if (sortingOrder === 'min') {
            this.tasks.sort((a,b) => b.priority - a.priority);
        }
        else {       
            this.tasks.sort((a,b) => a.priority - b.priority);
        }
    },
}

toDoList.startToDoList()