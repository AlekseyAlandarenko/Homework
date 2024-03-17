let positionLatitude = prompt("Введите текущее местоположение пользователя по x:");
let positionLongitude = prompt("Введите текущее местоположение пользователя по y:");
let destinationLatitude = prompt("Введите местоположение точки назначения по x:");
let destinationLongitude = prompt("Введите местоположение точки назначения по y:");
let distance = Math.sqrt((destinationLatitude - positionLatitude) ** 2 + (destinationLongitude - positionLongitude) ** 2);

console.log('Расстояние до точки назначения равно ' + distance);