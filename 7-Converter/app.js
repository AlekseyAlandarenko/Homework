function enterValue() {
    let sourceCurrency, targetCurrency, sum;
    do {
        sourceCurrency = prompt('Введите валюту для продажи: rub, usd, eur.');
        if (sourceCurrency !== 'rub' && sourceCurrency !== 'usd' && sourceCurrency !== 'eur') alert('Мы не покупаем данную валюту!');
    } while (sourceCurrency !== 'rub' && sourceCurrency !== 'usd' && sourceCurrency !== 'eur');
    do {
        targetCurrency = prompt('Введите валюту для покупки: rub, usd, eur.');
        if (targetCurrency !== 'rub' && targetCurrency !== 'usd' && targetCurrency !== 'eur') alert('Мы не продаем данную валюту!');
    } while (targetCurrency !== 'rub' && targetCurrency !== 'usd' && targetCurrency !== 'eur');
    if (sourceCurrency === targetCurrency) return [sourceCurrency, targetCurrency, sum];
    do {
        sum = prompt('Введите сумму для конвертации:');
        if (Boolean(Number(sum)) !== true || Number(sum) === 0) alert('Вы не ввели сумму для конвертации!');
    } while (Boolean(Number(sum)) !== true);
    return [sourceCurrency, targetCurrency, sum];
}

function convertingTo(fn) {
    let [sourceCurrency, targetCurrency, sum] = fn();
    let transfer, rub = 1, usd = 50, eur = 100;
    if (sourceCurrency === targetCurrency) return alert('В данной конвертации нет смысла!');
    if (sourceCurrency === 'rub') {
        transfer = sum * rub;
    }
    else if (sourceCurrency === 'usd') {
        transfer = sum * usd;
    }
    else if (sourceCurrency === 'eur') {
        transfer = sum * eur;
    }
    if (targetCurrency === 'rub') {
        transfer = transfer / rub + ' \u20bd';
    }
    else if (targetCurrency === 'usd') {
        transfer = transfer / usd + ' \u0024';
    }
    else if (targetCurrency === 'eur') {
        transfer = transfer / eur + ' \u20ac';
    }
    return alert(`Сумма конвертации равна ${transfer}.`);
}

convertingTo(enterValue);


