'use strict';

function enterArr() {
    let inputArr = prompt('Введите строку, содержащую потенциальные даты:').replace(/[\s+\']/g, '').split(',');
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
    if (array[1] > 12) {
        array[1] = [array[0], array[0] = array[1]][0];
    }
    if ((array[1] == 1 || array[1] == 3 || array[1] == 5 || array[1] == 7 || array[1] == 8 || array[1] == 10 || array[1] == 12)) {
        return isDay31(array[0]) && isMonth(array[1]) && isYear(array[2]);
    }
    if (array[1] == 4 || array[1] == 6 || array[1] == 9 || array[1] == 11) {
        return isDay30(array[0]) && isMonth(array[1]) && isYear(array[2]);
    }
    if (array[2] % 4 === 0 && (array[2] % 100 !== 0 || array[2] % 400 === 0)) {
        return isDay29(array[0]) && isMonth(array[1]) && isYear(array[2]);
    }
    else if (array[2] % 4 !== 0 || array[2] % 100 === 0) {
        return isDay28(array[0]) && isMonth(array[1]) && isYear(array[2]);
    }
}

function filterArray(fn) {
    let inputArr = fn();
    let outputArr = inputArr.reduce((res, valueArr) => {
        let date = valueArr.split(/[\/\-\.]/);
        if (checkDate(date)) {
            res.push([date[0].padStart(2, '0'), date[1].padStart(2, '0'), date[2].padStart(4, '0')].join('-'))
        }
        return res;
    }, []);
    return alert(`Введенный массив строк: ${inputArr}.
Отфильтрованный массив строк: ${outputArr}.`);
}

filterArray(enterArr);