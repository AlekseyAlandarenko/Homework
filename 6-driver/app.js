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

function promptForValidInput(message, validOptions) {
    return promptForInput(
        message,
        input => {
            const trimmedInput = input.trim().toLowerCase();
            if (!validOptions[trimmedInput]) {
                alert(`Введенное значение недопустимо! Допустимые значения: ${formatValidInput(validOptions)}.`);
                return null;
            }
            return trimmedInput;
        }
    );
}

function formatValidInput(validOptions) {
    return Object.entries(validOptions)
        .map(([key, desc]) => `${desc} (${key})`)
        .join(', ');
}

function getUserInputs() {
    const validOptions = { 
        yes: 'да', 
        no: 'нет' 
    };

    const questions = {
        isAdult: 'Вам 18 лет или больше?',
        hasDrivingLicense: 'У вас есть водительские права?',
        isSober: 'Вы трезвы?'
    };

    const userResponses = {};

    for (const [key, question] of Object.entries(questions)) {
        const value = promptForValidInput(
            `${question} Введите ${formatValidInput(validOptions)} или нажмите "Отмена" для выхода.`,
            validOptions
        );
        if (value === null) return null;

        userResponses[key] = value === 'yes';
    }

    return userResponses;
}

function assessDrivingEligibility(responses) {
    const reasons = {
        isAdult: 'вы несовершеннолетний',
        hasDrivingLicense: 'у вас нет водительских прав',
        isSober: 'вы не трезвы'
    };

    return Object.entries(reasons)
        .filter(([key]) => !responses[key])
        .map(([, reason]) => reason);
}

function createDrivingEligibilityMessage(reasons) {
    return reasons.length === 0
        ? 'Вы можете сесть за руль!'
        : `Вы не можете сесть за руль!\nПричины:\n- ${reasons.join('\n- ')}`;
}

function displayDrivingEligibility() {
    const responses = getUserInputs();
    if (!responses) {
        alert('Отмена! Программа завершена.');
        return;
    }

    const reasons = assessDrivingEligibility(responses);
    alert(createDrivingEligibilityMessage(reasons));
}

displayDrivingEligibility();