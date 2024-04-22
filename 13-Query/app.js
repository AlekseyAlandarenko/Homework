'use strict';

function enterObject() {
    let inputObj = {};
    for (let i = 0; ; i++) {
        let key = prompt(`Введите ключ ${i + 1} свойства:`);
        let value = prompt(`Введите значение ${i + 1} свойства:`);
        if (!key || !value) break;
        inputObj[key] = value;
    }
    return inputObj;
}

function convertObject(fn) {
    return alert(Object.entries(fn()).reduce((res, ent, index) => `${res}${index > 0 ? '&' : '?'}${encodeURIComponent(ent[0])}=${encodeURIComponent(ent[1])}`, ''));
}

convertObject(enterObject);