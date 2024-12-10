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

function promptForValidInput(message, validOptions) {
    return promptForInput(
        message,
        input => {
            const trimmedInput = input.trim().toLowerCase();
            if (!validOptions[trimmedInput]) {
                alert(`Введенное значение недопустимо! Допустимые значения: ${formatValidInput(validOptions)}.`);
                return null;
            }
            return trimmedInput;
        }
    );
}

function formatValidInput(validOptions) {
    return Object.entries(validOptions)
        .map(([key, desc]) => `${desc} (${key})`)
        .join(', ');
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

function getSortingDirection() {
    const sortingDirections = { asc: 'сортировка по возрастанию', desc: 'сортировка по убыванию' };

    return promptForValidInput(
        `Введите параметр сортировки: ${formatValidInput(sortingDirections)} или нажмите "Отмена" для выхода.`,
        sortingDirections
    );
}

function sortArrayWithBubbleSort(array, sortingOrder) {
    const compare = sortingOrder === 'asc'
        ? (a, b) => a > b
        : (a, b) => a < b;

    const sortedArray = [...array];
    let swapped;

    for (let i = 0; i < sortedArray.length - 1; i++) {
        swapped = false;
        for (let j = 0; j < sortedArray.length - 1 - i; j++) {
            if (compare(sortedArray[j], sortedArray[j + 1])) {
                [sortedArray[j], sortedArray[j + 1]] = [sortedArray[j + 1], sortedArray[j]];
                swapped = true;
            }
        }
        if (!swapped) break;
    }

    return sortedArray;
}

function createSortedNumberArrayMessage(numbersArray, sortingOrder, sortedArray) {
    const direction = sortingOrder === 'asc' ? 'возрастания' : 'убывания';
    return `Входной массив чисел: ${numbersArray.join(', ')}.\n` +
           `Отсортированный в порядке ${direction} массив чисел: ${sortedArray.join(', ')}.`;
}

function displaySortedNumberArray() {
    const numbersArray = promptForNumberArrayInput();
    if (!numbersArray) {
        alert('Отмена! Программа завершена.');
        return;
    }

    const sortingOrder = getSortingDirection();
    if (!sortingOrder) {
        alert('Отмена! Программа завершена.');
        return;
    }

    const sortedArray = sortArrayWithBubbleSort(numbersArray, sortingOrder);
    alert(createSortedNumberArrayMessage(numbersArray, sortingOrder, sortedArray));
}

displaySortedNumberArray();