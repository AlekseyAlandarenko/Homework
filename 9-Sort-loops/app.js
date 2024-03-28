function sourceArray() {
    let inputArr = [];
    alert('Введите элементы массива.')
    for (let i = 0; ; i++) {
        let p = prompt(`Введите ${i + 1} элемент массива:`)
        if (p === null) break;
        if (Boolean(Number(p)) === true || Number(p) === 0) inputArr.push(p);
        else alert('Вы ввели не число!'), --i;
    }
    return inputArr;
}

function sortingAlgorithm(fn) {
    const validChoices = { min: true, max: true };
    let inputArr = fn();
    let outputArr = [...inputArr].map(Number);
    do {
        sortOrder = prompt('Введите порядок сортировки: по убыванию(min) или по возрастанию(max).');
        if (!validChoices[sortOrder]) alert('Нет такого параметра сортировки!');
    } while (!validChoices[sortOrder]);
    if (sortOrder === 'min') {
        for (let i = 0; i < outputArr.length; i++) {
            for (let j = 0; j < outputArr.length - 1; j++) {
                if (outputArr[j] < outputArr[j + 1]) {
                    let temp = outputArr[j];
                    outputArr[j] = outputArr[j + 1];
                    outputArr[j + 1] = temp;
                }
            }
        }
    }
    else {
        for (let i = 0; i < outputArr.length; i++) {
            for (let j = 0; j < outputArr.length - 1; j++) {
                if (outputArr[j] > outputArr[j + 1]) {
                    let temp = outputArr[j];
                    outputArr[j] = outputArr[j + 1];
                    outputArr[j + 1] = temp;
                }
            }
        }
    }
    return alert(`Введенный массив: ${inputArr}
Массив отсортированный в порядке ${sortOrder === 'min' ? 'убывания' : 'возрастания'}: ${outputArr}`);
}

/*function sortingAlgorithm(fn) {
    const validChoices = { min: true, max: true };
    let inputArr = fn();
    let outputArr = [...inputArr].map(Number);
    do {
        sortOrder = prompt('Введите порядок сортировки: по убыванию(min) или по возрастанию(max).');
        if (!validChoices[sortOrder]) alert('Нет такого параметра сортировки!');
    } while (!validChoices[sortOrder]);
    if (sortOrder === 'min') {
        for (let i = 0; i < outputArr.length; i++) {
            for (let j = 0; j < outputArr.length - 1; j++) {
                if (outputArr[j] < outputArr[j + 1]) {
                    outputArr[j] = [outputArr[j + 1], outputArr[j + 1] = outputArr[j]][0];
                }
            }
        }
    }
    else {
        for (let i = 0; i < outputArr.length; i++) {
            for (let j = 0; j < outputArr.length - 1; j++) {
                if (outputArr[j] > outputArr[j + 1]) {
                    outputArr[j] = [outputArr[j + 1], outputArr[j + 1] = outputArr[j]][0];
                }
            }
        }
    }
    return alert(`Введенный массив: ${inputArr}
Массив отсортированный в порядке ${sortOrder === 'min' ? 'убывания' : 'возрастания'}: ${outputArr}`);
}*/

/*function sortingAlgorithm(fn) {
    const validChoices = { min: true, max: true };
    let inputArr = fn();
    let outputArr = [];
    let tempArr = [...inputArr].map(Number);
    do {
        sortOrder = prompt('Введите порядок сортировки: по убыванию(min) или по возрастанию(max).');
        if (!validChoices[sortOrder]) alert('Нет такого параметра сортировки!');
    } while (!validChoices[sortOrder]);
    if (sortOrder === 'min') {
        while (tempArr.length) {
            outputArr.push(tempArr.splice(tempArr.indexOf(Math.max(...tempArr)), 1));
            console.log(outputArr);
        }
    }
    else {
        while (tempArr.length) {
            outputArr.push(tempArr.splice(tempArr.indexOf(Math.min(...tempArr)), 1));
            console.log(outputArr);
        }
    }
    return alert(`Введенный массив: ${inputArr}
Массив отсортированный в порядке ${sortOrder === 'min' ? 'убывания' : 'возрастания'}: ${outputArr}`);
}*/

sortingAlgorithm(sourceArray);







