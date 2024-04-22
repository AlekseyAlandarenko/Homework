'use strict';

let language = navigator.language.slice(0, 2);

switch (language) {
    case 'ru':
        alert('Привет!');
        break;

    case 'en':
        alert('Hello!');
        break;

    case 'de':
        alert('Hallo!');
        break;

    default:
        alert('(・_・)ノ');
} 