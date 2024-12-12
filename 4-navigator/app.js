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

function promptForNumberInput(message) {
    return promptForInput(
        message,
        input => {
            const number = Number(input);
            if (isNaN(number)) {
                alert('Введенное значение недопустимо! Пожалуйста, введите числовое значение.');
                return null;
            }
            return number;
        }
    );
}

function getCoordinates() {
    const coordinatePrompts = {
        startX: 'X-координату начальной точки',
        startY: 'Y-координату начальной точки',
        endX: 'X-координату конечной точки',
        endY: 'Y-координату конечной точки'
    };

    const coordinates = {};

    for (const [key, promptText] of Object.entries(coordinatePrompts)) {
        const value = promptForNumberInput(`Введите ${promptText} или нажмите "Отмена" для выхода.`);
        if (value === null) return null;
        coordinates[key] = value;
    }

    return coordinates;
}

function computeDistance({ startX, startY, endX, endY }) {
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    return Math.sqrt(deltaX ** 2 + deltaY ** 2);
}

function createDistanceMessage(distance) {
    return distance === 0
        ? 'Начальная и конечная точки совпадают! Расстояние равно нулю.'
        : `Расстояние между точками: ${distance.toFixed(2)}.`;
}

function displayDistance() {
    const coordinates = getCoordinates();
    if (!coordinates) {
        alert('Отмена! Программа завершена.');
        return;
    }

    const distance = computeDistance(coordinates);
    alert(createDistanceMessage(distance));
}

displayDistance();