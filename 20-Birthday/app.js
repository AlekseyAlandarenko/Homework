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

function promptForDateInput(message) {
    return promptForInput(
        message,
        input => {
            if (!isDateFormatValid(input)) {
                alert('Введённое значение недопустимо! Пожалуйста, введите дату в формате "ДД-ММ-ГГГГ".');
                return null;
            }

            const normalizedInput = normalizeDateInput(input);

            if (!isDateValid(normalizedInput)) {
                alert('Введённая дата недействительна! Пожалуйста, введите существующую дату.');
                return null;
            }

            return new Date(normalizedInput);
        }
    );
}

function promptForBirthday() {
    return promptForDateInput(
        'Введите дату рождения в формате "ДД-ММ-ГГГГ" или нажмите "Отмена" для выхода.'
    );
}

function isDateFormatValid(input) {
    const dateFormatRegex = /^\d{1,2}-\d{1,2}-\d{4}$/;
    return dateFormatRegex.test(input);
}

function normalizeDateInput(input) {
    const [day, month, year] = input.split('-').map(Number);
    const normalizedDay = String(day).padStart(2, '0');
    const normalizedMonth = String(month).padStart(2, '0');
    return `${year}-${normalizedMonth}-${normalizedDay}`;
}

function isDateValid(normalizedInput) {
    const [year, month, day] = normalizedInput.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
    );
}

function isOlderThan14(birthday) {
    const today = new Date();
    const thisYearBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());

    const age = today.getFullYear() - birthday.getFullYear();
    return age > 14 || (age === 14 && today >= thisYearBirthday);
}

function createUserAgeMessage(isOlder, birthday) {
    const formattedDate = formatDate(birthday);
    return isOlder
        ? `Дата рождения: ${formattedDate}. Пользователю больше 14 лет.`
        : `Дата рождения: ${formattedDate}. Пользователю меньше 14 лет.`;
}

function formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
}

function displayUserAge() {
    const birthday = promptForBirthday();
    if (!birthday) {
        alert('Отмена! Программа завершена.');
        return;
    }

    const isOlder = isOlderThan14(birthday);
    alert(createUserAgeMessage(isOlder, birthday));
}

displayUserAge();