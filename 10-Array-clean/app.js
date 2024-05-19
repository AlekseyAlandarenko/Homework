'use strict';

function enterArray() {
    let inputArr = [];
    for (let i = 0; ; i++) {
        let num = prompt(`Введите ${i + 1} элемент массива чисел:`);
        if (num === null) break;
        if (!isNaN(num) && num !== '') inputArr.push(Number(num));
        else alert('Вы ввели не число!'), --i;
    }
    return inputArr;
}

function checkNumber(num, limit) {
    return num > limit;
}

function filterArray(fn1, fn2) {
    let inputArr = fn1();
    let outputArr = [...inputArr];
    let limit;
    do {
        limit = prompt(`Введите предел для элементов массива чисел:`);
        if (!(!isNaN(limit) && limit !== '' && limit !== null)) alert('Вы не ввели предел для элементов массива чисел!');
    } while (!(!isNaN(limit) && limit !== '' && limit !== null));
    for (let i = outputArr.length; i >= 0; i--) {
        if (fn2(outputArr[i], limit)) outputArr.splice(i, 1);
    }
    return alert(`Введенный массив чисел: ${inputArr}.
Отфильтрованный массив чисел: ${outputArr}.`);
}

filterArray(enterArray, checkNumber);