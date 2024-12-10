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

function promptForPositiveNumberInput(message) {
    return promptForInput(
        message,
        input => {
            const number = Number(input);
            if (isNaN(number) || number <= 0) {
                alert('Введенное значение недопустимо! Пожалуйста, введите положительное числовое значение.');
                return null;
            }
            return number;
        }
    );
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

function getCurrencySelections() {
    const validCurrencyOptions = { 
        rub: 'рубль', 
        usd: 'доллар США', 
        eur: 'евро' 
    };

    const currencyQuestions = {
        sourceCurrency: 'валюту для продажи',
        targetCurrency: 'валюту для покупки'
    };

    const selections = {};

    for (const [key, question] of Object.entries(currencyQuestions)) {
        while (true) {
            const value = promptForValidInput(
                `Введите ${question}: ${formatValidInput(validCurrencyOptions)} или нажмите "Отмена" для выхода.`,
                validCurrencyOptions
            );
            if (value === null) return null;

            if (key === 'targetCurrency' && value === selections.sourceCurrency) {
                alert('Исходная и целевая валюты не должны совпадать! Пожалуйста, выберите другую валюту.');
                continue;
            }

            selections[key] = value;
            break;
        }
    }

    return selections;
}

function getConversionAmount() {
    return promptForPositiveNumberInput(
        'Введите сумму для конвертации или нажмите "Отмена" для выхода.'
    );
}

function calculateCurrencyConversion({ sourceCurrency, targetCurrency }, amount) {
    const exchangeRates = {
        rub: { rateToBase: 1, symbol: '₽' },
        usd: { rateToBase: 0.1, symbol: '$' },
        eur: { rateToBase: 0.01, symbol: '€' }
    };

    const sourceRate = exchangeRates[sourceCurrency].rateToBase;
    const targetRate = exchangeRates[targetCurrency].rateToBase;

    const convertedAmount = (amount / sourceRate) * targetRate;
    const symbol = exchangeRates[targetCurrency].symbol;

    return { convertedAmount, symbol };
}

function createCurrencyConversionMessage(convertedAmount, symbol) {
    return `Сумма конвертации: ${convertedAmount.toFixed(2)} ${symbol}.`;
}

function displayCurrencyConversion() {
    const selections = getCurrencySelections();
    if (!selections) {
        alert('Отмена! Программа завершена.');
        return;
    }

    const amount = getConversionAmount();
    if (amount === null) {
        alert('Отмена! Программа завершена.');
        return;
    }

    const { convertedAmount, symbol } = calculateCurrencyConversion(selections, amount);
    alert(createCurrencyConversionMessage(convertedAmount, symbol));
}

displayCurrencyConversion();