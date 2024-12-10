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

function promptForNumberInput(message) {
    return promptForInput(
        message,
        input => {
            const number = Number(input);
            if (isNaN(number)) {
                alert('Введенное значение недопустимо! Пожалуйста, введите числовое значение.');
                return null;
            }
            return number;
        }
    );
}

function promptForNumberArrayInput() {
    const numbersArray = [];
    let index = 1;

    while (true) {
        const number = promptForNumberInput(
            `Введите ${index}-й элемент массива чисел или нажмите "Отмена" для выхода.`
        );
        if (number === null) break;

        numbersArray.push(number);
        index++;
    }

    return numbersArray.length !== 0 ? numbersArray : null;
}

function promptForFilterLimit() {
    return promptForNumberInput(
        'Введите предел для фильтрации массива чисел или нажмите "Отмена" для выхода.'
    );
}

function isAboveLimit(number, limit) {
    return number > limit;
}

function filterArrayAboveLimit(numbersArray, limit) {
    const filteredArray = [...numbersArray];
    for (let i = filteredArray.length - 1; i >= 0; i--) {
        if (isAboveLimit(filteredArray[i], limit)) {
            filteredArray.splice(i, 1);
        }
    }
    return filteredArray;
}

function createFilteredNumberArrayMessage(numbersArray, filteredArray) {
    return `Входной массив чисел: ${numbersArray.join(', ')}.\n` +
            `Отфильтрованный массив чисел: ${filteredArray.join(', ')}.`
}

function displayFilteredNumberArray() {
    const numbersArray = promptForNumberArrayInput();
    if (!numbersArray) {
        alert('Отмена! Программа завершена.');
        return;
    }

    const limit = promptForFilterLimit();
    if (limit === null) {
        alert('Отмена! Программа завершена.');
        return;
    }

    const filteredArray = filterArrayAboveLimit(numbersArray, limit);
    alert(createFilteredNumberArrayMessage(numbersArray, filteredArray));
}

displayFilteredNumberArray();