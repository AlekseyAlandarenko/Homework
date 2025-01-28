'use strict';

function main() {
    try {
        timerApp();
    } catch (error) {
        console.error(error.message);
        process.exit(1);
    }
}

function timerApp() {
    const args = parseArguments();
    const [hours = 0, minutes = 0, seconds = 0] = args.map(Number);

    validateTimeValues(hours, minutes, seconds);

    const milliseconds = convertToMilliseconds(hours, minutes, seconds);

    console.log(`Таймер запущен на ${hours}ч ${minutes}м ${seconds}с.`);

    setTimeout(() => {
        console.log("Время истекло!");
    }, milliseconds);
}

function parseArguments() {
    const args = process.argv.slice(2);

    if (args.length !== 3) {
        throw new Error('Неверное число аргументов! Введите: node app.js <число1> <число2> <число3>.');
    }

    return args;
}

function validateTimeValues(hours, minutes, seconds) {
    if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
        throw new Error("Введённое значение недопустимо! Все аргументы должны быть числами.");
    }

    if (hours < 0 || minutes < 0 || seconds < 0) {
        throw new Error("Введённое значение недопустимо! Часы, минуты и секунды не могут быть отрицательными.");
    }

    if (hours === 0 && minutes === 0 && seconds === 0) {
        throw new Error("Введённое значение недопустимо! Введите корректное время больше нуля.");
    }
}

function convertToMilliseconds(hours, minutes, seconds) {
    return (hours * 60 * 60 + minutes * 60 + seconds) * 1000;
}

main();