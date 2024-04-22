'use strict';

let positionLatitude = prompt('Введите местоположение точки отправления по x:');
let positionLongitude = prompt('Введите местоположение точки отправления по y:');
let destinationLatitude = prompt('Введите местоположение точки назначения по x:');
let destinationLongitude = prompt('Введите местоположение точки назначения по y:');
let distance = Math.sqrt((destinationLatitude - positionLatitude) ** 2 + (destinationLongitude - positionLongitude) ** 2);

alert(`Расстояние от точки отправления до точки назначения равно ${distance}.`);