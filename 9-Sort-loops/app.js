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
    do {
        sortOrder = prompt('Введите порядок сортировки: по убыванию(min) или по возрастанию(max).');
        if (!validChoices.hasOwnProperty(sortOrder)) alert('Нет такого параметра сортировки!');
    } while (!validChoices.hasOwnProperty(sortOrder));
    return input;
}

function sortingAlgorithm(input) {
    switch (true) {
        case sortOrder === 'min':
            while (input.length) {
                output.push(input.splice(input.indexOf(Math.max(...input)), 1));
            }
            return output;
        case sortOrder === 'max':
            while (input.length) {
                output.push(input.splice(input.indexOf(Math.min(...input)), 1));
            }
            return output;
    }
}

alert(`Введенный массив: ${sourceArray()} 
Массив отсортированный в порядке ${sortOrder === 'min' ? 'убывания' : 'возрастания'}: ${sortingAlgorithm(input)}`);







