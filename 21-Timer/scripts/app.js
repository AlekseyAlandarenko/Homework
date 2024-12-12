'use strict';

function createElement(tag, { className = [], textContent = '', dataset = {}, attributes = {}, parent = null } = {}) {
    const element = document.createElement(tag);

    const classes = Array.isArray(className) ? className : [className];
    if (className) {
        element.classList.add(...classes);
    }

    if (textContent) {
        element.textContent = textContent;
    }

    for (const [key, value] of Object.entries(dataset)) {
        element.dataset[key] = value;
    }

    for (const [key, value] of Object.entries(attributes)) {
        element.setAttribute(key, value);
    }

    if (parent) {
        parent.appendChild(element);
    }

    return element;
}

function createContainer(className, parent) {
    return createElement('div', { className: Array.isArray(className) ? className : [className], parent});
}

function createTimerInterface() {
    const timerContainer = createContainer('timer', document.body);
    const wrapper = createContainer('timer__items', timerContainer);

    const timeUnits = getTimeUnits();
    timeUnits.forEach(({ className, title, text }) => {
        createElement('div', {
            className: ['timer__item', className],
            textContent: text,
            dataset: { title },
            parent: wrapper,
        });
    });
}

function getTimeUnits() {
    return [
        { className: 'timer__item_months', title: 'месяцев', text: '00' },
        { className: 'timer__item_days', title: 'дней', text: '00' },
        { className: 'timer__item_hours', title: 'часов', text: '00' },
        { className: 'timer__item_minutes', title: 'минут', text: '00' },
        { className: 'timer__item_seconds', title: 'секунд', text: '00' },
    ];
}

function updateTimerDisplay(timeData) {
    const { months, days, hours, minutes, seconds } = timeData;

    updateTimerItem('.timer__item_months', months, ['месяц', 'месяца', 'месяцев']);
    updateTimerItem('.timer__item_days', days, ['день', 'дня', 'дней']);
    updateTimerItem('.timer__item_hours', hours, ['час', 'часа', 'часов']);
    updateTimerItem('.timer__item_minutes', minutes, ['минута', 'минуты', 'минут']);
    updateTimerItem('.timer__item_seconds', seconds, ['секунда', 'секунды', 'секунд']);
}

function updateTimerItem(selector, value, forms) {
    const element = document.querySelector(selector);
    
    element.textContent = addLeadingZero(value);
    element.dataset.title = getWordDeclension(value, forms);
}

function addLeadingZero(value) {
    return value < 10 ? `0${value}` : value.toString();
}

function getWordDeclension(number, forms) {
    return forms[
        (number % 100 > 4 && number % 100 < 20)
            ? 2
            : [2, 0, 1, 1, 1, 2][(number % 10 < 5) ? number % 10 : 5]
    ];
}

function calculateTimeDifference(targetDate, currentDate) {
    const totalMilliseconds = targetDate - currentDate;
    const totalSeconds = Math.max(0, Math.floor(totalMilliseconds / 1000));

    let months = (targetDate.getFullYear() - currentDate.getFullYear()) * 12 +
                 (targetDate.getMonth() - currentDate.getMonth());
    
    const currentDateCopy = new Date(currentDate);
    currentDateCopy.setMonth(currentDate.getMonth() + months);
    if (currentDateCopy > targetDate) {
        months -= 1;
    }

    const remainingMilliseconds = targetDate - new Date(currentDate.setMonth(currentDate.getMonth() + months));
    const remainingDays = Math.floor(remainingMilliseconds / (1000 * 60 * 60 * 24));

    return {
        months: Math.max(0, months),
        days: Math.max(0, remainingDays),
        hours: Math.floor((totalSeconds / (60 * 60)) % 24),
        minutes: Math.floor((totalSeconds / 60) % 60),
        seconds: totalSeconds % 60,
    };
}

function isCountdownComplete(timeData) {
    return Object.values(timeData).every(value => value <= 0);
}

function startCountdown(targetDate, onUpdate, onComplete) {
    const countdownInterval = setInterval(() => {
        const currentDate = new Date();
        const timeData = calculateTimeDifference(targetDate, currentDate);

        if (isCountdownComplete(timeData)) {
            clearInterval(countdownInterval);
            onComplete();
            return;
        }

        onUpdate(timeData);
    }, 1000);
}

function initTimerApp() {
    createTimerInterface();

    const nextMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);
    const nextNewYear = new Date(new Date().getFullYear() + 1, 0, 1);

    startCountdown(nextMonth, updateTimerDisplay, () => {
        startCountdown(nextNewYear, updateTimerDisplay, () => alert('С Новым Годом!'));
    });
}

initTimerApp();