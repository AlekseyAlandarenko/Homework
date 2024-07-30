'use strict';

function getLocation() {
    return new Promise((resolve, reject) => {
        document.querySelector('.geolocation__button').innerHTML = '';
        navigator.geolocation.getCurrentPosition(
            ({coords}) => {
                resolve(document.querySelector('.geolocation__button').innerHTML = `Широта: ${coords.latitude}, Долгота: ${coords.longitude}.`);
            },
            () => { 
                reject(document.querySelector('.geolocation__button').innerHTML = 'Что-то пошло не так!');
            }
        );
    });
}