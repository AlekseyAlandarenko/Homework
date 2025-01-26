'use strict';

const add = require('./add');
const subtract = require('./subtract');
const multiply = require('./multiply');
const divide = require('./divide');

function exitWithError(message) {
    console.error(message);
    process.exit(1);
}

function parseArguments() {
    const args = process.argv.slice(2);

    if (args.length !== 3) {
        exitWithError('Неверное число аргументов! Введите: node index.js <число1> <число2> <операция>.');
    }

    return args;
}

function convertToNumbers(num1, num2) {
    const number1 = parseFloat(num1);
    const number2 = parseFloat(num2);

    if (isNaN(number1) || isNaN(number2)) {
        exitWithError('Оба аргумента должны быть числами!');
    }

    return [number1, number2];
}

function performOperation(number1, number2, operation) {
    const operations = { add, subtract, multiply, divide };

    if (!operations[operation]) {
        exitWithError('Недопустимая операция! Поддерживаемые операции: add, subtract, multiply, divide.');
    }

    try {
        return operations[operation](number1, number2);
    } catch (error) {
        exitWithError(`Ошибка выполнения операции: ${error.message}`);
    }
}

function main() {
    const [num1, num2, operation] = parseArguments();
    const [number1, number2] = convertToNumbers(num1, num2);
    const result = performOperation(number1, number2, operation);
    console.log(`Результат: ${result}`);
}

main();