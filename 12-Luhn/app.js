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

function promptForCreditCardNumber() {
    return promptForInput(
        'Введите номер кредитной карты для проверки или нажмите "Отмена" для выхода.',
        input => {
            const cleanedCardNumber = input.replace(/[\s\-]/g, '');
            if (!/^\d{16}$/.test(cleanedCardNumber)) {
                alert(`Введённое значение недопустимо! Пожалуйста, введите номер кредитной карты, содержащий ровно 16 цифр, без пробелов или специальных символов.`);
                return null;
            }
            return cleanedCardNumber;
        }
    );
}

function formatCreditCardNumber(cardNumber) {
    return cardNumber.match(/.{1,4}/g).join('-');
}

function isValidCreditCardNumber(cardNumber) {
    const digits = Array.from(cardNumber, Number).reverse();

    const checksum = digits.reduce((sum, digit, index) => {
        if (index % 2 === 1) {
            digit *= 2;
            if (digit > 9) digit -= 9;
        }
        return sum + digit;
    }, 0);

    return checksum % 10 === 0;
}

function createCreditCardValidationResultMessage(formattedNumber, isValid) {
    const statusMessage = isValid ? 'прошёл' : 'не прошёл';
    return `Введенный номер кредитной карты (${formattedNumber}) ${statusMessage} проверку по алгоритму Луна.`;
}

function displayCreditCardValidationResult() {
    const cardNumber = promptForCreditCardNumber();
    if (cardNumber === null) {
        alert('Отмена! Программа завершена.');
        return;
    }

    const formattedNumber = formatCreditCardNumber(cardNumber);
    const isValid = isValidCreditCardNumber(cardNumber);
    alert(createCreditCardValidationResultMessage(formattedNumber, isValid));
}

displayCreditCardValidationResult();