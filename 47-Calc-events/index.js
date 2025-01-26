'use strict';

const EventEmitter = require('events');
const add = require('./add');
const subtract = require('./subtract');
const multiply = require('./multiply');
const divide = require('./divide');

function setupCalculator() {
    const calculator = new EventEmitter();

    calculator.on('add', (a, b) => console.log(`Результат: ${add(a, b)}`));
    calculator.on('subtract', (a, b) => console.log(`Результат: ${subtract(a, b)}`));
    calculator.on('multiply', (a, b) => console.log(`Результат: ${multiply(a, b)}`));
    calculator.on('divide', (a, b) => {
        try {
            console.log(`Результат: ${divide(a, b)}`);
        } catch (error) {
            console.error(`Ошибка выполнения операции: ${error.message}`);
        }
    });

    return calculator;
}

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

function validateOperation(operation) {
    const validOperations = ['add', 'subtract', 'multiply', 'divide'];
    if (!validOperations.includes(operation)) {
        exitWithError('Недопустимая операция! Поддерживаемые операции: add, subtract, multiply, divide.');
    }
}

function main() {
    const [num1, num2, operation] = parseArguments();
    const [number1, number2] = convertToNumbers(num1, num2);
    validateOperation(operation);

    const calculator = setupCalculator();
    calculator.emit(operation, number1, number2);
}

main();