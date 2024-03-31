let navigatorLanguage = window.navigator.language;
let language = navigatorLanguage.split(' ')[0];

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