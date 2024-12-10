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

function promptForValidInput(message, validOptions) {
    return promptForInput(
        message,
        input => {
            const trimmedInput = input.trim().toUpperCase();
            if (!validOptions.includes(trimmedInput)) {
                alert(`Введенное значение недопустимо! Допустимые значения: ${validOptions.join(', ')}.`);
                return null;
            }
            return trimmedInput;
        }
    );
}

function promptForDiceType() {
    const supportedDiceTypes = ['D4', 'D6', 'D8', 'D10', 'D12', 'D20', 'D100'];

    return promptForValidInput(
        `Введите тип кубика: ${supportedDiceTypes.join(', ')} или нажмите "Отмена" для выхода.`,
        supportedDiceTypes
    );
}

function rollDice(diceType, rolls = 1) {
    const results = [];
    const maxValue = Number(diceType.slice(1));

    for (let i = 0; i < rolls; i++) {
        results.push(Math.floor(Math.random() * maxValue) + 1);
    }
    return results;
}

function createRollResultsMessage(diceType, results) {
    const total = results.reduce((sum, roll) => sum + roll, 0);
    const rollsList = results.join(', ');

    return `Тип кубика: ${diceType}\nРезультаты бросков: ${rollsList}\nСумма всех бросков: ${total}`;
}

function displayRollResults() {
    const diceType = promptForDiceType();
    if (diceType === null) {
        alert('Отмена! Программа завершена.');
        return;
    }

    const rolls = promptForPositiveNumberInput('Введите количество бросков:');
    if (rolls === null) {
        alert('Отмена! Программа завершена.');
        return;
    }

    const results = rollDice(diceType, rolls);
    alert(createRollResultsMessage(diceType, results));
}

displayRollResults();