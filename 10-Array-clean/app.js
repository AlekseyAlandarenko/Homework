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
    let limit = prompt(`Введите предел для элементов массива чисел:`);
    let outputArr = inputArr.filter(item => fn2(item, limit) !== true);
    return alert(`Введенный массив чисел: ${inputArr}
Отфильтрованный массив чисел: ${outputArr}`);
}

filter(sourceArray, (item, limit) => {
    if (item > limit) return true;
});


