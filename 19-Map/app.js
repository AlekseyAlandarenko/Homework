'use strict';

function enterArrayOfObjects() {
    let arrOfObj = [], id, title;
    for (let i = 0; ; i++) {
        do {
            id = prompt(`Введите id ${i + 1} объекта:`);
            if (id === null) break;
            if (!(!isNaN(id) && id !== '')) alert('Вы не ввели id объекта!');
        } while (!(!isNaN(id) && id !== ''));
        do {
            title = prompt(`Введите название ${i + 1} объекта:`);
            if (title === null) break;
            if (!title) alert('Вы не ввели название объекта!');
        } while (!title);
        if (!id || !title) break;
        if (id != null && title != null) {
            arrOfObj.push({
                id,
                title,
            });
        }
    }
    alert(`Введенный массив объектов: 
${JSON.stringify(arrOfObj, null, 2)}.`);
    return arrOfObj;
}

 function uniqueizeArrayOfObjects(fn) {
    let arrOfObj = fn();
    let uniqueArrOfObj = [...new Set(arrOfObj.map(item1 => arrOfObj.find(item2 => item2.id === item1.id)))];
    alert(`Уникализированный массив объектов: 
${JSON.stringify(uniqueArrOfObj, null, 2)}.`);
}

uniqueizeArrayOfObjects(enterArrayOfObjects);