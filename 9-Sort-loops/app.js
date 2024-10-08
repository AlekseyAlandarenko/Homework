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

function sortArray(fn) {
    let inputArr = fn();
    let sortingOrder, outputArr = [...inputArr];
    do {
        sortingOrder = prompt('Введите порядок сортировки: по убыванию(min) или по возрастанию(max).');
        if (sortingOrder !== 'min' && sortingOrder !== 'max') alert('Нет такого параметра сортировки!');
    } while (sortingOrder !== 'min' && sortingOrder !== 'max');
    if (sortingOrder === 'min') {
        for (let i = 0; i < outputArr.length; i++) {
            for (let j = 0; j < outputArr.length - 1; j++) {
                if (outputArr[i] > outputArr[j]) {
                    [outputArr[i], outputArr[j]] = [outputArr[j], outputArr[i]];
                }
            }
        }
    }
    else {
        for (let i = 0; i < outputArr.length; i++) {
            for (let j = 0; j < outputArr.length - 1; j++) {
                if (outputArr[i] < outputArr[j]) {
                    [outputArr[i], outputArr[j]] = [outputArr[j], outputArr[i]];
                }
            }
        }
    }
    return alert(`Введенный массив чисел: ${inputArr}.
Массив чисел отсортированный в порядке ${sortingOrder === 'min' ? 'убывания' : 'возрастания'}: ${outputArr}.`);
}

sortArray(enterArray);