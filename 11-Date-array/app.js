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

function promptForDateInput() {
    return promptForInput(
        'Введите строку с потенциальными датами через запятую или нажмите "Отмена" для выхода.',
        input => {
            return input
                .split(',')
                .map(date => date.trim())
                .filter(date => date);
        }
    );
}

function formatDate([day, month, year]) {
    const formattedDay = day.toString().padStart(2, '0');
    const formattedMonth = month.toString().padStart(2, '0');
    const formattedYear = year.toString().padStart(4, '0');
    return `${formattedDay}-${formattedMonth}-${formattedYear}`;
}

function isValidDate(day, month, year) {
    const date = new Date(year, month - 1, day);
    return (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
    );
}

function validateDate(dateString) {
    const dateParts = dateString.split(/[\/\-\.]/).map(Number);

    if (dateParts.length !== 3 || dateParts.some(isNaN)) {
        return null;
    }

    let [day, month, year] = dateParts;

    if (month > 12 && day <= 12) {
        [day, month] = [month, day];
    }

    return isValidDate(day, month, year) ? formatDate([day, month, year]) : null;
}

function getValidDates(dates) {
    return dates
        .map(validateDate)
        .filter(date => date !== null);
}

function createValidDatesMessage(rawDates, validDates) {
    return validDates.length === 0
        ? 'Ни одна дата не прошла проверку! Программа завершена.'
        : `Входной массив дат: ${rawDates.join(', ')}.\n` +
          `Отфильтрованный массив дат: ${validDates.join(', ')}.`;
}

function displayValidDates() {
    const rawDates = promptForDateInput();
    if (rawDates === null) {
        alert('Отмена! Программа завершена.');
        return;
    }

    const validDates = getValidDates(rawDates);
    alert(createValidDatesMessage(rawDates, validDates));
}

displayValidDates();