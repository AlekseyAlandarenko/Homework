'use strict';

let age = confirm('Возраст 18 лет и старше:');
let hasLicence = confirm('Наличие водительских прав:');
let isDrunk = confirm('Трезвость пользователя:');

alert(`Пользователь ${age && hasLicence && isDrunk ? 'может' : 'не может'} сесть за руль.`);