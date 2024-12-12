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

function promptForPassword() {
    return promptForInput('Введите пароль или нажмите "Отмена" для выхода.');
}

function getRandomCharacter() {
    const randomChars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return randomChars[Math.floor(Math.random() * randomChars.length)];
}

function moveMiddleCharacter(array, originalLength) {
    const middleIndex = Math.floor(array.length / 2);
    const char = originalLength % 2 === 0 ? array.pop() : array.shift();
    array.splice(middleIndex, 0, char);
    return array;
}

function encryptPassword(password) {
    const encryptedArray = password.split('').flatMap(char => [char, getRandomCharacter()]);
    return moveMiddleCharacter(encryptedArray, password.length);
}

function restoreMiddleCharacter(array, originalLength) {
    const middleIndex = Math.floor(array.length / 2);
    const char = originalLength % 2 === 0 ? array.pop() : array.shift();
    array.splice(middleIndex, 0, char);
    return array;
}

function decryptPassword(encryptedArray, originalLength) {
    restoreMiddleCharacter(encryptedArray, originalLength);
    return encryptedArray.filter((_, index) => index % 2 === 0).join('');
}

function createPasswordValidationMessage(originalPassword, encryptedArray, decryptedPassword) {
    const resultMessage = originalPassword === decryptedPassword ? 'совпадает' : 'не совпадает';
    return `Оригинальный пароль: ${originalPassword}\n` +
        `Зашифрованный пароль: ${encryptedArray.join('')}\n` +
        `Расшифрованный пароль: ${decryptedPassword}, ${resultMessage} с исходным.`;
}

function displayPasswordValidation() {
    const originalPassword = promptForPassword();
    if (originalPassword === null) {
        alert('Отмена! Программа завершена.');
        return;
    }

    const encryptedArray = encryptPassword(originalPassword);
    const decryptedPassword = decryptPassword([...encryptedArray], originalPassword.length);
    alert(createPasswordValidationMessage(originalPassword, encryptedArray, decryptedPassword));
}

displayPasswordValidation();