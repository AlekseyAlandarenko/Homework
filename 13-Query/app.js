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

function promtForObjectArrayInput() {
    const objectResult = {};
    let entryIndex = 1;

    while (true) {
        const key = promptForInput(
            `Введите ключ ${entryIndex}-го объекта или нажмите "Отмена" для выхода.`
        );
        if (key === null) break;

        if (objectResult.hasOwnProperty(key)) {
            alert(`Ключ "${key}" уже существует. Его значение будет перезаписано.`);
        }

        const value = promptForInput(
            `Введите значение для ключа "${key}" ${entryIndex}-го объекта или нажмите "Отмена" для выхода.`
        );
        if (value === null) break;

        objectResult[key] = value;
        entryIndex++;
    }

    return Object.keys(objectResult).length > 0 ? objectResult : null;
}

function objectToQueryString(inputObject) {
    const queryString = Object.entries(inputObject)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');

    return queryString ? `?${queryString}` : '';
}

function createQueryStringMessage(queryString) {
    return `Сформированная строка запроса: ${queryString}.`;
}


function displayQueryString() {
    const collectedObject = promtForObjectArrayInput();
    if (!collectedObject) {
        alert('Отмена! Программа завершена.');
        return;
    }

    const queryString = objectToQueryString(collectedObject);
    alert(createQueryStringMessage(queryString));
    return queryString;
}

displayQueryString();