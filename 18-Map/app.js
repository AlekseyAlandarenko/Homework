'use strict';

function promptForInput(message, parseFunction = input => input) {
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
}

function promptForPositiveNumberInput(message) {
    return promptForInput(
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
}

function formatObjectsList(objects) {
    if (objects.length === 0) return 'Список объектов пуст.';
    return objects
        .map(({ id, title }) => `id: ${id}, Название: ${title}`)
        .join('\n');
}

function collectObjects() {
    const objects = [];
    let index = 1;

    while (true) {
        const id = promptForPositiveNumberInput(`Введите id объекта №${index} или нажмите "Отмена" для завершения.`);
        if (id === null) break;

        const title = promptForInput(`Введите название объекта №${index} или нажмите "Отмена" для завершения.`);
        if (title === null) break;

        objects.push({ id, title });
        index++;
    }

    return objects.length !== 0 ? objects : null;
}

function getUniqueObjects(objects) {
    const uniqueIds = new Set();
    return objects.filter(({ id }) => {
        if (uniqueIds.has(id)) {
            return false;
        }
        uniqueIds.add(id);
        return true;
    });
}

function createUniqueObjectMessage(inputObjects, uniqueObjects) {
    if (inputObjects.length === uniqueObjects.length) {
        return `Все объекты уникальны:\n${formatObjectsList(uniqueObjects)}`;
    }

    return `Введенный массив объектов:\n${formatObjectsList(inputObjects)}\n\n` +
        `Уникализированный массив объектов:\n${formatObjectsList(uniqueObjects)}`;
}

function displayUniqueObjects() {
    const objects = collectObjects();
    if (!objects) {
        alert('Отмена! Программа завершена.');
        return;
    }

    const uniqueObjects = getUniqueObjects(objects);
    alert(createUniqueObjectMessage(objects, uniqueObjects));
}

displayUniqueObjects();