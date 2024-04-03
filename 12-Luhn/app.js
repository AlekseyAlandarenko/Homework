function sourceStr() {
    let inputStr;
    let outputStr;
    do {
        inputStr = prompt('Введите номер кредитной карты для проверки:');
        outputStr = inputStr.replace(/-/g, '');
        if ((outputStr.length !== 16)) alert('Количество цифр не соответствует таковому в номере кредитной карты!');
    } while (outputStr.length !== 16);
    return inputStr;
}

function checkLuhn(fn) {
    let creditCardNumber = fn();
    let sum = creditCardNumber.replace(/-/g, '').split('').map((item, index) => {
        let number = Number(item);
        if (index % 2 === 0) {
            number *= 2;
            if (number > 9) {
                return number -= 9;
            }
            else { return number; }
        }
        else { return number; }
    }).reduce((previousValue, currentValue) => { return previousValue + currentValue; });
    return alert(`Введенный номер кредитной карты (${creditCardNumber}) ${((sum % 10) === 0 ? 'прошёл' : 'не прошёл')} проверку.`);
}

checkLuhn(sourceStr)