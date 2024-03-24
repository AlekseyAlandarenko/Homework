const validChoices = { rub: true, usd: true, eur: true };
const rub = 1;
const usd = 90;
const eur = 100;
let sourceCurrency;
let targetCurrency;
let sum;

function valueValidation() {
    do {
        sourceCurrency = prompt('Введите валюту для продажи: rub, usd, eur');
        if (!validChoices[sourceCurrency]) alert('Мы не покупаем данную валюту!');
    } while (!validChoices[sourceCurrency]);
    do {
        targetCurrency = prompt('Введите валюту для покупки: rub, usd, eur');
        if (!validChoices[targetCurrency]) alert('Мы не продаем данную валюту!');
    } while (!validChoices[targetCurrency]);
    if (sourceCurrency === targetCurrency) return [sourceCurrency, targetCurrency, sum = 0];
    do {
        sum = prompt('Введите сумму для конвертации:');
    } while (Boolean(Number(sum)) !== true);
    return [sourceCurrency, targetCurrency, sum];
}

function convertingTo() {
    valueValidation()
    if (sourceCurrency === targetCurrency) return message = 'В данной конвертации нет смысла!';
    transfer = (sourceCurrency === 'eur') ? sum * eur : (sourceCurrency === 'usd') ? sum * usd : sum * rub;
    switch (true) {
        case targetCurrency === 'rub':
            return message = `${transfer / rub} \u20bd`;
        case targetCurrency === 'usd':
            return message = `${transfer / usd} \u0024`;
        case targetCurrency === 'eur':
            return message = `${transfer / eur} \u20ac`;
    }
}

convertingTo();
alert((sourceCurrency === targetCurrency) ? message : 'Сумма конвертации равна ' + message);


