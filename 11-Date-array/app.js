function sourceArray() {
    let inputArr = ['31.1.2000', '31.2.2000', '31.3.2000', '31.4.2000', '31.5.2000', '31.6.2000', '31.7.2000', '31.8.2000', '31.9.2000', '31.10.2000', '31.11.2000', '31.12.2000',
        '31/1/2000', '30/2/2000', '30/3/2000', '30/4/2000', '30/5/2000', '30/6/2000', '30/7/2000', '30/8/2000', '30/9/2000', '30/10/2000', '30/11/2000', '30/12/2000', '30/12/2000',
        '29.2.2000', '29.2.2001', '2/29/2000', '2/29/2001', '28.2.2000', '28.2.2001', '2/28/2000', '2/28/2001', 'n.2.2000', '29.n.2001', '29/2/n', '1/1/1/2001'];
    return inputArr;
}

function isNumber(num) {
    return Number(num) && !isNaN(num);
}
function isDay31(num) {
    return Number(num) > 0 && Number(num) <= 31;
}
function isDay30(num) {
    return Number(num) > 0 && Number(num) <= 30;
}

function isDay29(num) {
    return Number(num) > 0 && Number(num) <= 29;
}

function isDay28(num) {
    return Number(num) > 0 && Number(num) <= 28;
}

function isMonth(num) {
    return Number(num) > 0 && Number(num) <= 12;
}
function isYear(num) {
    return Number(num) >= 0;
}
function checkDate(array) {
    if (array.some(el => !isNumber(el)) || array.length !== 3) {
        return false;
    }
    const [day, month, year] = array;
    if ((month == 1 || month == 3 || month == 5 || month == 7 || month == 8 || month == 10 || month == 12)) {
        return isDay31(day) && isMonth(month) && isYear(year);
    }
    if (month == 4 || month == 6 || month == 9 || month == 11) {
        return isDay30(day) && isMonth(month) && isYear(year);
    }
    if (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) {
        return isDay29(day) && isMonth(month) && isYear(year);
    }
    else if (year % 4 !== 0 || year % 100 === 0) {
        return isDay28(day) && isMonth(month) && isYear(year);
    }
}

function filterArray(fn) {
    let inputArr = fn();
    const outputArr = inputArr.reduce((acc, valueArr) => {
        const date = valueArr.split(/[\/\-\.]/);
        if (date[1] > 12) {
            date[1] = [date[0], date[0] = date[1]][0];
        }
        if (checkDate(date)) {
            [date[0], date[1], date[2]] = [date[0].padStart(2, '0'), date[1].padStart(2, '0'), date[2].padStart(4, '0')]
            acc.push(date.join('-'))
        }
        return acc;
    }, [])
    return alert(`Введенный массив строк: ${inputArr}.
Отфильтрованный массив строк: ${outputArr}.`);
}

filterArray(sourceArray);

/*function sourceString() {
    let inputStr = prompt('Введите строку, содержащую потенциальные даты. Форматы дат: DD.MM.YY, MM.DD.YY, DD/MM/YY, MM/DD/YY, DD-MM-YY, MM-DD-YY.');
    return inputStr.replace(/[\s+\']/g, '').split(',');
}

function filterString(fn) {
    let inputStr = fn()
    let outputStr = inputStr.map(item => item.split(/[\/\-\.]/)).map(item => {
        if (item[1] > 12) item[1] = [item[0], item[0] = item[1]][0];
        return item;
    }).filter(item => {
        if (item.some(el => !isNaN(el)) && item.length === 3) {
            if ((item[0] <= 30) && (item[1] == 4 || item[1] == 6 || item[1] == 9 || item[1] == 11)) return item;
            if ((item[0] <= 31) && (item[1] == 1 || item[1] == 3 || item[1] == 5 || item[1] == 7 || item[1] == 8 || item[1] == 10 || item[1] == 12)) return item;
            if (item[2] % 4 === 0 && (item[2] % 100 !== 0 || item[2] % 400 === 0)) {
                if (item[0] <= 29 && item[1] == 2) return item;
            }
            else if (item[2] % 4 !== 0 || item[2] % 100 === 0) {
                if (item[0] <= 28 && item[1] == 2) return item;
            }
        }
    }).map(item => {
        [item[0], item[1], item[2]] = [item[0].padStart(2, '0'), item[1].padStart(2, '0'), item[2].padStart(4, '0')];
        return item = item.join('-');
    });
    return alert(`Введенная строка: ${inputStr.join(', ')}.
Отфильтрованная строка: ${outputStr.join(', ')}.`);
}

filterString(sourceString);*/