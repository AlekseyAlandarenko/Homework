'use strict';

function createPromise(label) {
    return new Promise(resolve => {
        const delay = Math.floor(Math.random() * 1000);
        setTimeout(() => resolve(label), delay);
    });
}

function race(promises) {
    return new Promise((resolve, reject) => {
        promises.forEach(promise => {
            promise.then(resolve).catch(reject);
        });
    });
}

function generatePromises() {
    return [
        createPromise('Первый'),
        createPromise('Второй'),
        createPromise('Третий'),
    ];
}

const promises = generatePromises();

race(promises)
    .then(result => alert(`Результат: ${result}`))
    .catch(error => alert(`Ошибка: ${error}`));