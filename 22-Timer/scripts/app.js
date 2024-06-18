'use strict';

function declensionDate(num, word) {
  return word[(num % 100 > 4 && num % 100 < 20) ? 2 : [2, 0, 1, 1, 1, 2][(num % 10 < 5) ? num % 10 : 5]];
}

function daysLeftInYear(num) {
  return Math.floor(num / 1000 / 60 / 60 / 24);
}

function hoursLeftInDay(num) {
  return Math.floor(num / 1000 / 60 / 60) % 24;
}

function minutesLeftInHour(num) {
  return  Math.floor(num / 1000 / 60) % 60;
}

function secondsLeftInMinute(num) {
  return  Math.floor(num / 1000) % 60;
}

function updateCountdown() {
  let timerId = setInterval(() => {
    let diff = new Date(new Date().getFullYear() + 1, 0, 1) - new Date();
    console.log(diff);
    if (diff < 0) {
      clearInterval(timerId);
    }
    let monthsLeft = 11 - new Date().getMonth();
    let daysLeft;
    if (new Date().getMonth() == 0 && (new Date().getFullYear() % 4 === 0 && (new Date().getFullYear() % 100 !== 0 || new Date().getFullYear() % 400 === 0))) {
      daysLeft = daysLeftInYear(diff) - 335;
    }
    if (new Date().getMonth() == 0 && (new Date().getFullYear() % 4 !== 0 || new Date().getFullYear() % 100 === 0)) {
      daysLeft = daysLeftInYear(diff) - 334;
    }
    if (new Date().getMonth() == 1) {
      daysLeft = daysLeftInYear(diff) - 306;
    }
    if (new Date().getMonth() == 2) {
      daysLeft = daysLeftInYear(diff) - 275;
    }
    if (new Date().getMonth() == 3) {
      daysLeft = daysLeftInYear(diff) - 245;
    }
    if (new Date().getMonth() == 4) {
      daysLeft = daysLeftInYear(diff) - 214;
    }
    if (new Date().getMonth() == 5) {
      daysLeft = daysLeftInYear(diff) - 184;
    }
    if (new Date().getMonth() == 6) {
      daysLeft = daysLeftInYear(diff) - 153;
    }
    if (new Date().getMonth() == 7) {
      daysLeft = daysLeftInYear(diff) - 122;
    }
    if (new Date().getMonth() == 8) {
      daysLeft = daysLeftInYear(diff) - 92;
    }
    if (new Date().getMonth() == 9) {
      daysLeft = daysLeftInYear(diff) - 61;
    }
    if (new Date().getMonth() == 10) {
      daysLeft = daysLeftInYear(diff) - 31;
    }
    if (new Date().getMonth() == 11) {
      daysLeft = daysLeftInYear(diff);
    }
    let hoursLeft = hoursLeftInDay(diff);
    let minutesLeft = minutesLeftInHour(diff);
    let secondsLeft = secondsLeftInMinute(diff);
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