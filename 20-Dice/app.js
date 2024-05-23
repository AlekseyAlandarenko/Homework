'use strict';

function takeVirtualDice() {
    let validChoices = {d4: true, d6: true, d8: true, d10: true, d12: true, d16: true, d20: true};
    let virtualDice;
    do {
        virtualDice = prompt('Введите тип многогранника: d4, d6, d8, d10, d12, d20, d100.');
        if (!validChoices[virtualDice]) alert('Нет такого поддерживаемого типа многогранника!');
    } while (!validChoices[virtualDice]);
    return virtualDice;
}

function rollVirtualDice(fn) {
    let dice = fn();
    let num;
    switch(dice) {
        case 'd4':
            num = Math.floor(Math.random() * 4 + 1);
            break;
        case 'd6':
            num = Math.floor(Math.random() * 6 + 1);
            break;
        case 'd8':
            num = Math.floor(Math.random() * 8 + 1);
            break;
        case 'd10':
            num = Math.floor(Math.random() * 10 + 1);
            break;
        case 'd12':
            num = Math.floor(Math.random() * 12 + 1);
            break;
        case 'd20':
            num = Math.floor(Math.random() * 20 + 1);
            break;
        case 'd100':
            num = Math.floor(Math.random() * 100 + 1);
            break;
    }
    return alert(`Выпало ${num}.`);
}

rollVirtualDice(takeVirtualDice);