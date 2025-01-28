'use strict';

const add = require('./add');
const subtract = require('./subtract');
const multiply = require('./multiply');
const divide = require('./divide');

function main() {
    try {
        const [num1, num2, operation] = parseArguments();
        const [number1, number2] = convertToNumbers(num1, num2);
        const result = performOperation(number1, number2, operation);
        console.log(`Результат: ${result}`);
    } catch (error) {
        console.error(error.message);
        process.exit(1);
    }
}

function parseArguments() {
    const args = process.argv.slice(2);

    if (args.length !== 3) {
        throw new Error('Неверное число аргументов! Введите: node index.js <число1> <число2> <операция>.');
    }

    return args;
}

function convertToNumbers(num1, num2) {
    const number1 = parseFloat(num1);
    const number2 = parseFloat(num2);

    if (isNaN(number1) || isNaN(number2)) {
        throw new Error('Оба аргумента должны быть числами!');
    }

    return [number1, number2];
}

function performOperation(number1, number2, operation) {
    const operations = { add, subtract, multiply, divide };

    if (!operations[operation]) {
        throw new Error('Недопустимая операция! Поддерживаемые операции: add, subtract, multiply, divide.');
    }

    return operations[operation](number1, number2);
}

main();