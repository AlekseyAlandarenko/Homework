'use strict';

function checkDate() {
    let birthday = prompt('Введите дату рождения в формате "ГГГГ-ММ-ДД":');
    if (((new Date() - (14 / 4 * 86400000)) - new Date(birthday)) / (86400000 * 365) >= 14) {
        return alert('Пользователю больше 14 лет.');
    }
    else return alert('Пользователю меньше 14 лет.');
}

checkDate()