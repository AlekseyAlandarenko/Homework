'use strict';

function enterObject() {
    let inputObj = {};
    for (let i = 0; ; i++) {
        let a = prompt(`Введите ключ ${i + 1} свойства:`);
        let b = prompt(`Введите значение ${i + 1} свойства:`);
        if (!a || !b) break;
        inputObj[a] = b;
    }
    return inputObj;
}

function convertObject(fn) {
    /*return alert(`?${new URLSearchParams(fn())}`)*/
    return alert(Object.entries(fn()).reduce((res, ent, index) => `${res}${index > 0 ? '&' : '?'}${encodeURIComponent(ent[0])}=${encodeURIComponent(ent[1])}`, ''))
}

convertObject(enterObject)