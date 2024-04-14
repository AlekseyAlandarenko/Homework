function enterString() {
    let inputStr;
    do {
        inputStr = prompt('Введите номер кредитной карты для проверки:').replace(/[\s+\-]/g, '');
        if ((inputStr.length !== 16)) alert('Количество цифр не соответствует таковому в номере кредитной карты!');
    } while (inputStr.length !== 16);
    return inputStr;
}

function checkLuhn(fn) {
    let creditCardNumber = fn();
    let sum = creditCardNumber.split('').reduce((res, num, index) => {
        num = Number(num);
        if (index % 2 === 0) {
            num *= 2;
            if (num > 9) {
                return res + num - 9;
            }
            else {
                return res + num;
            }
        }
        else {
            return res + num;
        }
    }, 0);
    return alert(`Введенный номер кредитной карты (${creditCardNumber.match(/.{1,4}/g).join('-')}) ${((sum % 10) === 0 ? 'прошёл' : 'не прошёл')} проверку.`);
}

checkLuhn(enterString)

