'use strict';

function getUserBrowserLanguage() {
    return (navigator.language || navigator.userLanguage).slice(0, 2).toLowerCase();
}

function displayGreeting() {
    const language = getUserBrowserLanguage();

    const greetingMessages = {
        ru: 'Привет!',
        en: 'Hello!',
        de: 'Hallo!',
    };

    alert(greetingMessages[language] || '(・_・)ノ');
}

displayGreeting();