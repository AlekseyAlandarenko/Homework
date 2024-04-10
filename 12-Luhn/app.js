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
    let sum = creditCardNumber.replace(/-/g, '').split('').reduce((res, num, index) => {
        num = Number(num);
        if (index % 2 === 0) {
            num *= 2;
            if (num > 9) {
                return res + num - 9;
            }
            else { return res + num; }
        }
        else { return res + num; }
    }, 0);
    return alert(`Введенный номер кредитной карты (${creditCardNumber}) ${((sum % 10) === 0 ? 'прошёл' : 'не прошёл')} проверку.`);
}

checkLuhn(sourceStr)