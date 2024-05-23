'use strict';

function isYear(birthday) {
    return ((new Date().getFullYear() > (new Date(birthday).getFullYear() + 14)) ? '>' : (new Date().getFullYear() === (new Date(birthday).getFullYear() + 14)) ? '=' : '<');
}

function isMonth(birthday) {
    return ((new Date().getMonth() > new Date(birthday).getMonth()) ? '>' : (new Date().getMonth() === new Date(birthday).getMonth()) ? '=' : '<');
}

function isDate(birthday) {
    return ((new Date().getDate() > new Date(birthday).getDate()) ? '>' : (new Date().getDate() === new Date(birthday).getDate()) ? '=' : '<');
}

function checkDate() {
    let birthday = prompt('Введите дату рождения в формате "ГГГГ-ММ-ДД":');
    if (isYear(birthday) == '>') return alert('Пользователю больше 14 лет.');
    else if (isYear(birthday) == '=') {
        if (isMonth(birthday) == '>') return alert('Пользователю больше 14 лет.');
        else if (isMonth(birthday) == '=') {
            if (isDate(birthday) == '>') return alert('Пользователю больше 14 лет.');
            else if (isDate(birthday) == '=') return alert('Пользователю сегодня исполнилось 14 лет.');
            else return alert('Пользователю меньше 14 лет.');
        }
        else return alert('Пользователю меньше 14 лет.');
    } 
    else return alert('Пользователю меньше 14 лет.');
}

checkDate()

/*function checkDate() {
    let birthday = prompt('Введите дату рождения в формате "ГГГГ-ММ-ДД":');
    return alert(`Пользователю ${(isYear(birthday) == '>') ? 'больше' : 
    (isYear(birthday) == '=') && (isMonth(birthday) == '>') ? 'больше' : 
    (isYear(birthday) == '=') && (isMonth(birthday) == '=') && (isDate(birthday) == '>') ? 'больше' : 
    (isYear(birthday) == '=') && (isMonth(birthday) == '=') && (isDate(birthday) == '=') ? 'сегодня исполнилось' : 'меньше'} 14 лет.`);
}

checkDate()*/