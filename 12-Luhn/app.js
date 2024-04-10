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
    let sum = creditCardNumber.replace(/-/g, '').split('').reduce((acc, item, index) => {
        let number = Number(item);
        if (index % 2 === 0) {
            number *= 2;
            if (number > 9) {
                return acc + number - 9;
            }
            else { return acc + number; }
        }
        else { return acc + number; }
    }, 0);
    return alert(`Введенный номер кредитной карты (${creditCardNumber}) ${((sum % 10) === 0 ? 'прошёл' : 'не прошёл')} проверку.`);
}

checkLuhn(sourceStr)