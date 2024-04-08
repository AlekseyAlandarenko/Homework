function sourceArray() {
    let inputArr = [];
    alert('Введите элементы массива чисел.')
    for (let i = 0; ; i++) {
        let p = prompt(`Введите ${i + 1} элемент массива чисел:`)
        if (p === null) break;
        if (Boolean(Number(p)) === true || Number(p) === 0) inputArr.push(Number(p));
        else alert('Вы ввели не число!'), --i;
    }
    return inputArr;
}

function filter(fn1, fn2) {
    let inputArr = fn1();
    let outputArr = [...inputArr];
    let limit = prompt(`Введите предел для элементов массива чисел:`);
    for (let i = outputArr.length; i >= 0; i--) {
        if (fn2(outputArr[i], limit))
            outputArr.splice(i, 1);
    }
    return alert(`Введенный массив чисел: ${inputArr}.
Отфильтрованный массив чисел: ${outputArr}.`);
}

filter(sourceArray, (item, limit) => item > limit);