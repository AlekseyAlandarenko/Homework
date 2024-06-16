'use strict';

function takeVirtualDice() {
    let validChoices = {d4: true, d6: true, d8: true, d10: true, d12: true, d20: true, d100: true};
    let virtualDice;
    do {
        virtualDice = prompt('Введите тип многогранника: d4, d6, d8, d10, d12, d20, d100.');
        if (!validChoices[virtualDice]) alert('Нет такого поддерживаемого типа многогранника!');
    } while (!validChoices[virtualDice]);
    return virtualDice;
}

function rollVirtualDice(fn) {
    let dice = fn();
    let num = Math.floor(Math.random() * Number(dice.slice(1)) + 1);
    return alert(`Выпало ${num}.`);
}

rollVirtualDice(takeVirtualDice);