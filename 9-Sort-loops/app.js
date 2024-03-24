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

function sortingAlgorithm() {
    sourceArray()
    output = [...input];
    do {
        sortOrder = prompt('Введите порядок сортировки: по убыванию(min) или по возрастанию(max).');
        if (!validChoices[sortOrder]) alert('Нет такого параметра сортировки!');
    } while (!validChoices[sortOrder]);
    if (sortOrder === 'min') {
        for (let j = 0; j < output.length; j++) {
            for (let i = 0; i < output.length - 1; i++) {
                if (output[i] < output[i + 1]) {
                    output[i] = [output[i + 1], output[i + 1] = output[i]][0]
                }
            }
        }
    }
    else {
        for (let j = 0; j < output.length; j++) {
            for (let i = 0; i < output.length - 1; i++) {
                if (output[i] > output[i + 1]) {
                    output[i] = [output[i + 1], output[i + 1] = output[i]][0]
                }
            }
        }
    }
    return [input, output, sortOrder];
}

/*function sortingAlgorithm() {
    sourceArray()
    temp = [...input];
    do {
        sortOrder = prompt('Введите порядок сортировки: по убыванию(min) или по возрастанию(max).');
        if (!validChoices[sortOrder]) alert('Нет такого параметра сортировки!');
    } while (!validChoices[sortOrder]);
    if (sortOrder === 'min') {
        while (temp.length) {
            output.push(temp.splice(temp.indexOf(Math.max(...temp)), 1));
        }
    }
    else {
        while (temp.length) {
            output.push(temp.splice(temp.indexOf(Math.min(...temp)), 1));
        }
    }
    return [input, output, sortOrder];
}*/

sortingAlgorithm()
alert(`Введенный массив: ${input}
Массив отсортированный в порядке ${sortOrder === 'min' ? 'убывания' : 'возрастания'}: ${output}`);







