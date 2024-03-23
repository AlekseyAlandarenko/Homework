const validChoices = { min: true, max: true };
let input = [];
let output = [];

function sourceArray() {
    alert('Введите элементы массива.')
    for (let i = 0; ; i++) {
        let p = prompt(`Введите ${i + 1} элемент массива:`)
        if (p === null) break;
        if (Boolean(Number(p)) === true || Number(p) === 0) input.push(Number(p));
        else alert('Вы ввели не число!'), --i;
    }
    return input;
}

function sortingAlgorithm(input) {
    do {
        sortOrder = prompt('Введите порядок сортировки: по убыванию(min) или по возрастанию(max).');
        if (!validChoices.hasOwnProperty(sortOrder)) alert('Нет такого параметра сортировки!');
    } while (!validChoices.hasOwnProperty(sortOrder));
    switch (true) {
        case sortOrder === 'min':
            while (input.length) {
                output.push(input.splice(input.indexOf(Math.max(...input)), 1));
            }
        case sortOrder === 'max':
            while (input.length) {
                output.push(input.splice(input.indexOf(Math.min(...input)), 1));
            }
    }
    console.log(output, sortOrder);
    return [output, sortOrder];
}

alert(`Введенный массив: ${sourceArray()}`);
sortingAlgorithm(input);
alert(`Массив отсортированный в порядке ${sortOrder === 'min' ? 'убывания' : 'возрастания'}: ${output}`);







