'use strict';

const toDoList = {
    tasks: [],
    nextId: 1,

    promptForInput(message, parseFunction = input => input) {
        while (true) {
            const input = prompt(message);
            if (input === null) return null;

            const trimmedInput = input.trim();
            if (!trimmedInput) {
                alert('Поле не может быть пустым! Пожалуйста, введите значение.');
                continue;
            }

            const result = parseFunction(trimmedInput);
            if (result === null) continue;

            return result;
        }
    },

    promptForPositiveNumberInput(message) {
        return this.promptForInput(
            message,
            input => {
                const number = Number(input);
                if (isNaN(number) || number <= 0) {
                    alert('Введенное значение недопустимо! Пожалуйста, введите положительное числовое значение.');
                    return null;
                }
                return number;
            }
        );
    },

    promptForValidInput(message, validOptions) {
        return this.promptForInput(
            message,
            input => {
                const trimmedInput = input.trim().toLowerCase();
                if (!validOptions[trimmedInput]) {
                    alert(`Введенное значение недопустимо! Допустимые значения: ${this.formatValidInput(validOptions)}.`);
                    return null;
                }
                return trimmedInput;
            }
        );
    },

    formatValidInput(validOptions) {
        return Object.entries(validOptions)
            .map(([key, desc]) => `${desc} (${key})`)
            .join(', ');
    },

    getTaskList() {
        if (this.tasks.length === 0) return 'Список задач пуст.';

        return `Список задач:\n${this.tasks
            .map(({ id, title, priority }) => `id: ${id}, Название: ${title}, Приоритет: ${priority}`)
            .join('\n')}`;
    },

    findTaskIndexById(id) {
        return this.tasks.findIndex(task => task.id === id);
    },

    start() {
        const actions = {
            add: { description: 'добавить задачу', action: () => this.addTask() },
            delete: { description: 'удалить задачу', action: () => this.deleteTask() },
            update: { description: 'обновить задачу', action: () => this.updateTask() },
            sort: { description: 'отсортировать задачи', action: () => this.sortTasks() },
        };

        while (true) {
            const validOptions = Object.fromEntries(
                Object.entries(actions).map(([key, { description }]) => [key, description])
            );

            const actionKey = this.promptForValidInput(
                `Введите команду: ${this.formatValidInput(validOptions)} или нажмите "Отмена" для выхода.`,
                validOptions
            );

            if (actionKey === null) {
                alert(this.getTaskList());
                return;
            }

            const selectedAction = actions[actionKey];
            if (selectedAction) selectedAction.action();
        }
    },

    addTask() {
        const title = this.promptForInput('Введите название задачи:');
        if (title === null) return;

        const priority = this.promptForPositiveNumberInput('Введите приоритет задачи:');
        if (priority === null) return;

        const newTask = { id: this.nextId++, title, priority };
        this.tasks.push(newTask);

        alert(`Задача добавлена:\nНазвание: ${newTask.title}, Приоритет: ${newTask.priority}.`);
        alert(this.getTaskList());
    },

    deleteTask() {
        if (this.tasks.length === 0) {
            alert('Список задач пуст. Нечего удалять.');
            return;
        }

        const id = this.promptForPositiveNumberInput('Введите id задачи для удаления:');
        if (id === null) return;

        const taskIndex = this.findTaskIndexById(id);
        if (taskIndex === -1) {
            alert('Задача с таким id не найдена.');
            return;
        }

        const { title } = this.tasks[taskIndex];
        if (confirm(`Удалить задачу: ${title}?`)) {
            this.tasks.splice(taskIndex, 1);
            alert('Задача удалена.');

            alert(this.getTaskList() || 'Список задач теперь пуст.');
        }
    },

    updateTask() {
        if (this.tasks.length === 0) {
            alert('Список задач пуст. Нечего обновлять.');
            return;
        }

        const id = this.promptForPositiveNumberInput('Введите id задачи для обновления:');
        if (id === null) return;

        const taskIndex = this.findTaskIndexById(id);
        if (taskIndex === -1) {
            alert('Задача с таким id не найдена.');
            return;
        }

        const validFields = { title: 'название', priority: 'приоритет' };
        const field = this.promptForValidInput(
            `Введите поле для обновления: ${this.formatValidInput(validFields)}.`,
            validFields
        );
        if (field === null) return;

        const newValue = field === 'priority'
            ? this.promptForPositiveNumberInput(`Введите новое значение для поля "${validFields[field]}":`)
            : this.promptForInput(`Введите новое значение для поля "${validFields[field]}":`);
        if (newValue === null) return;

        this.tasks[taskIndex][field] = newValue;
        alert('Задача обновлена.');
        alert(this.getTaskList());
    },

    sortTasks() {
        if (this.tasks.length === 0) {
            alert('Список задач пуст. Нечего сортировать.');
            return;
        }

        const validSortingOptions = { asc: 'по возрастанию', desc: 'по убыванию' };
        const order = this.promptForValidInput(
            `Введите порядок сортировки: ${this.formatValidInput(validSortingOptions)}.`,
            validSortingOptions
        );

        if (order === null) return;

        this.tasks.sort((a, b) => (order === 'asc' ? a.priority - b.priority : b.priority - a.priority));
        alert(`Список задач отсортирован ${validSortingOptions[order]}.`);
        alert(this.getTaskList());
    },
};

const updatedToDoList = Object.create(toDoList);

updatedToDoList.getTaskList = function () {
    if (this.tasks.length === 0) return 'Список задач пуст.';

    return `Список задач:\n${this.tasks
        .map(task => `id: ${task.id}, Название: ${task.title}, Описание: ${task.description}, Приоритет: ${task.priority}.`)
        .join('\n')}`;
};

updatedToDoList.addTask = function () {
    const title = this.promptForInput('Введите название задачи:');
    if (title === null) return;

    const description = this.promptForInput('Введите описание задачи:');
    if (description === null) return;

    const priority = this.promptForPositiveNumberInput('Введите приоритет задачи:');
    if (priority === null) return;

    const newTask = { id: this.nextId++, title, description, priority };
    this.tasks.push(newTask);

    alert(`Задача добавлена: Название: ${newTask.title}, Описание: ${newTask.description}, Приоритет: ${newTask.priority}.`);
    alert(this.getTaskList());
};

updatedToDoList.updateTask = function () {
    if (this.tasks.length === 0) {
        alert('Список задач пуст. Нечего обновлять.');
        return;
    }

    const id = this.promptForPositiveNumberInput('Введите id задачи для обновления:');
    if (id === null) return;

    const taskIndex = this.findTaskIndexById(id);
    if (taskIndex === -1) {
        alert('Задача с таким id не найдена!');
        return;
    }

    const validFields = { title: 'название', description: 'описание', priority: 'приоритет' };
    const field = this.promptForValidInput(
        `Введите поле для обновления: ${this.formatValidInput(validFields)}.`,
        validFields
    );
    if (field === null) return;

    const newValue = field === 'priority'
        ? this.promptForPositiveNumberInput(`Введите новое значение для поля "${validFields[field]}":`)
        : this.promptForInput(`Введите новое значение для поля "${validFields[field]}":`);
    if (newValue === null) return;

    this.tasks[taskIndex][field] = newValue;
    alert('Задача обновлена.');
    alert(this.getTaskList());
};

updatedToDoList.start();