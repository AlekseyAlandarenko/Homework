function valueValidation() {
    let sourceCurrency, targetCurrency, sum;
    let validChoices = { rub: true, usd: true, eur: true };
    do {
        sourceCurrency = prompt('Введите валюту для продажи: rub, usd, eur.');
        if (!validChoices[sourceCurrency]) alert('Мы не покупаем данную валюту!');
    } while (!validChoices[sourceCurrency]);
    do {
        targetCurrency = prompt('Введите валюту для покупки: rub, usd, eur.');
        if (!validChoices[targetCurrency]) alert('Мы не продаем данную валюту!');
    } while (!validChoices[targetCurrency]);
    if (sourceCurrency === targetCurrency) return [sourceCurrency, targetCurrency, sum = 0];
    do {
        sum = prompt('Введите сумму для конвертации:');
    } while (Boolean(Number(sum)) !== true);
    return [sourceCurrency, targetCurrency, sum];
}

function convertingTo(fn) {
    let sourceCurrency, targetCurrency, sum, rub = 1, usd = 90, eur = 100;
    [sourceCurrency, targetCurrency, sum] = fn();
    let transfer = (sourceCurrency === 'eur') ? sum * eur : (sourceCurrency === 'usd') ? sum * usd : sum * rub;
    if (targetCurrency === sourceCurrency) return alert('В данной конвертации нет смысла!');
    else switch (true) {
        case targetCurrency === 'rub':
            return alert(`Сумма конвертации равна ${transfer / rub} \u20bd.`);
        case targetCurrency === 'usd':
            return alert(`Сумма конвертации равна ${transfer / usd} \u0024.`);
        case targetCurrency === 'eur':
            return alert(`Сумма конвертации равна ${transfer / eur} \u20ac.`);
    }
}

convertingTo(valueValidation);


