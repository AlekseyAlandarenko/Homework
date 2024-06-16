'use strict';

function declensionDate(num, word) {
  return word[(num % 100 > 4 && num % 100 < 20) ? 2 : [2, 0, 1, 1, 1, 2][(num % 10 < 5) ? num % 10 : 5]];
}

function updateCountdown() {
  let timerId = setInterval(() => {
    let diff = new Date(new Date().getFullYear() + 1, 0, 1) - new Date();
    if (diff < 0) {
      clearInterval(timerId);
    }
    let monthsLeft = 11 - new Date().getMonth();
    let daysLeft;
    if (new Date().getMonth() == 0 && (new Date().getFullYear() % 4 === 0 && (new Date().getFullYear() % 100 !== 0 || new Date().getFullYear() % 400 === 0))) {
      daysLeft = Math.floor(diff / 1000 / 60 / 60 / 24) - 335;
    }
    if (new Date().getMonth() == 0 && (new Date().getFullYear() % 4 !== 0 || new Date().getFullYear() % 100 === 0)) {
      daysLeft = Math.floor(diff / 1000 / 60 / 60 / 24) - 334;
    }
    if (new Date().getMonth() == 1) {
      daysLeft = Math.floor(diff / 1000 / 60 / 60 / 24) - 306;
    }
    if (new Date().getMonth() == 2) {
      daysLeft = Math.floor(diff / 1000 / 60 / 60 / 24) - 275;
    }
    if (new Date().getMonth() == 3) {
      daysLeft = Math.floor(diff / 1000 / 60 / 60 / 24) - 245;
    }
    if (new Date().getMonth() == 4) {
      daysLeft = Math.floor(diff / 1000 / 60 / 60 / 24) - 214;
    }
    if (new Date().getMonth() == 5) {
      daysLeft = Math.floor(diff / 1000 / 60 / 60 / 24) - 184;
    }
    if (new Date().getMonth() == 6) {
      daysLeft = Math.floor(diff / 1000 / 60 / 60 / 24) - 153;
    }
    if (new Date().getMonth() == 7) {
      daysLeft = Math.floor(diff / 1000 / 60 / 60 / 24) - 122;
    }
    if (new Date().getMonth() == 8) {
      daysLeft = Math.floor(diff / 1000 / 60 / 60 / 24) - 92;
    }
    if (new Date().getMonth() == 9) {
      daysLeft = Math.floor(diff / 1000 / 60 / 60 / 24) - 61;
    }
    if (new Date().getMonth() == 10) {
      daysLeft = Math.floor(diff / 1000 / 60 / 60 / 24) - 31;
    }
    if (new Date().getMonth() == 11) {
      daysLeft = Math.floor(diff / 1000 / 60 / 60 / 24);
    }
    let hoursLeft = Math.floor(diff / 1000 / 60 / 60) % 24;
    let minutesLeft = Math.floor(diff / 1000 / 60) % 60;
    let secondsLeft = Math.floor(diff / 1000) % 60;
    document.querySelector('.timer__item_months').textContent = monthsLeft < 10 ? `0${monthsLeft}` : monthsLeft;
    document.querySelector('.timer__item_days').textContent = daysLeft < 10 ? `0${daysLeft}` : daysLeft;
    document.querySelector('.timer__item_hours').textContent = hoursLeft < 10 ? `0${hoursLeft}` : hoursLeft;
    document.querySelector('.timer__item_minutes').textContent = minutesLeft < 10 ? `0${minutesLeft}` : minutesLeft;
    document.querySelector('.timer__item_seconds').textContent = secondsLeft < 10 ? `0${secondsLeft}` : secondsLeft;
    document.querySelector('.timer__item_months').dataset.title = declensionDate(monthsLeft, ['месяц', 'месяца', 'месяцев']);
    document.querySelector('.timer__item_days').dataset.title = declensionDate(daysLeft, ['день', 'дня', 'дней']);
    document.querySelector('.timer__item_hours').dataset.title = declensionDate(hoursLeft, ['час', 'часа', 'часов']);
    document.querySelector('.timer__item_minutes').dataset.title = declensionDate(minutesLeft, ['минута', 'минуты', 'минут']);
    document.querySelector('.timer__item_seconds').dataset.title = declensionDate(secondsLeft, ['секунда', 'секунды', 'секунд']);
  }, 1000);
}

updateCountdown();