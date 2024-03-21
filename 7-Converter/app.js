const validChoices = { rub: true, usd: true, eur: true };
const rub = 1;
const usd = 90;
const eur = 100;
let inputValues = [];

function valueValidation() {
    do {
        sourceCurrency = prompt('Введите валюту для продажи: rub, usd, eur');
        if (!validChoices.hasOwnProperty(sourceCurrency)) alert('Мы не покупаем данную валюту!');
    } while (!validChoices.hasOwnProperty(sourceCurrency));

    do {
        targetCurrency = prompt('Введите валюту для покупки: rub, usd, eur');
        if (!validChoices.hasOwnProperty(targetCurrency)) alert('Мы не продаем данную валюту!');
    } while (!validChoices.hasOwnProperty(targetCurrency));

    if (sourceCurrency === targetCurrency) return inputValues = [sourceCurrency, targetCurrency, sum = 0];

    do {
        sum = prompt('Введите сумму для конвертации:');
    } while (Boolean(Number(sum)) !== true);

    return inputValues = [sourceCurrency, targetCurrency, sum];
}

function convertingTo(inputValues) {
    if (sourceCurrency === targetCurrency) return 'В данной конвертации нет смысла!';
    transfer = (sourceCurrency === 'eur') ? sum * eur : (sourceCurrency === 'usd') ? sum * usd : sum * rub;
    switch (true) {
        case targetCurrency === 'rub':
            return `Сумма конвертации равна ${transfer / rub} \u20bd`;
        case targetCurrency === 'usd':
            return `Сумма конвертации равна ${transfer / usd} \u0024`;
        case targetCurrency === 'eur':
            return `Сумма конвертации равна ${transfer / eur} \u20ac`;
    }
}

valueValidation();
alert(convertingTo(inputValues));


