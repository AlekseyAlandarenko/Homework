let navigatorLanguage = window.navigator.language;
let language = navigatorLanguage.split(' ')[0];

switch (language) {
    case 'ru':
        console.log('Привет!');
        break;

    case 'en':
        console.log('Hello!');
        break;

    case 'de':
        console.log('Hallo!');
        break;

    default:
        console.log('(・_・)ノ');
} 