'use strict';

function exitWithError(message) {
    console.error(message);
    process.exit(1);
}

function parseArguments() {
    const args = process.argv.slice(2);

    if (args.length !== 3) {
        exitWithError('Неверное число аргументов! Введите: node index.js <число1> <число2> <число3>.');
    }

    return args;
}

function convertToMilliseconds(hours, minutes, seconds) {
    return (hours * 60 * 60 + minutes * 60 + seconds) * 1000;
}

function timerApp() {
    const args = parseArguments();
    const [hours = 0, minutes = 0, seconds = 0] = args.map(Number);

    if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
        exitWithError("Введённое значение недопустимо! Все аргументы должны быть числами.");
    }

    if (hours < 0 || minutes < 0 || seconds < 0) {
        exitWithError("Введённое значение недопустимо! Часы, минуты и секунды не могут быть отрицательными.");
    }

    const milliseconds = convertToMilliseconds(hours, minutes, seconds);

    if (milliseconds <= 0) {
        exitWithError("Введённое значение недопустимо! Введите корректное время больше нуля.");
    }

    console.log(`Таймер запущен на ${hours}ч ${minutes}м ${seconds}с.`);

    setTimeout(() => {
        console.log("Время истекло!");
    }, milliseconds);
}

timerApp();