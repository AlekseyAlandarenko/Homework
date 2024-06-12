'use strict';

function checkDate() {
    let birthday = new Date(prompt('Введите дату рождения в формате "ГГГГ-ММ-ДД":'));
    if (new Date(birthday.getFullYear() + 14, birthday.getMonth(), birthday.getDate()) < new Date()) {
        return alert('Пользователю больше 14 лет.');
    }
    else return alert('Пользователю меньше 14 лет.');
}

checkDate()