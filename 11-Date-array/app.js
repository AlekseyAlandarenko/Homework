function sourceString() {
    let inputStr = prompt('Введите строку, содержащую потенциальные даты. Форматы дат: DD.MM.YY, MM.DD.YY, DD/MM/YY, MM/DD/YY, DD-MM-YY, MM-DD-YY.');
    return inputStr;
}

function sortingAlgorithm(fn) {
    let inputStr = fn()
    let outputStr = inputStr.replace(/\s+/g, '').split(',').map(item => item.split(/[\/\-\.]/)).map(item => {
        if (item[1] > 12) item[1] = [item[0], item[0] = item[1]][0];
        return item;
    }).filter(item => {
        if ((item.length === 3) && (item[0] > 0 && item[0] <= 31 && item[1] > 0 && item[1] <= 12 && item[2] >= 0)) {
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
    return alert(`Введенная строка: ${inputStr}.
Отфильтрованная строка: ${outputStr.join(', ')}.`);
}

sortingAlgorithm(sourceString);