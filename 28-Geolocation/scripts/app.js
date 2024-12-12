'use strict';

function createElement(tag, { className = [], textContent = '', dataset = {}, attributes = {} } = {}, parent = null) {
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
    return createElement('div', { className: Array.isArray(className) ? className : [className] }, parent);
}

function createButton({ id, text, className = '' }, parent) {
    return createElement('button', { className, textContent: text, attributes: { id } }, parent);
}

function createTextElement(parent, textContent, className, dataset = {}) {
    return createElement('div', { className, textContent, dataset }, parent);
}

function createGeolocationInterface(container) {
    const wrapper = createContainer('geolocation__wrapper', container);
    const textElement = createTextElement(wrapper, getDefaultText(), 'geolocation__text');
    const buttonElement = createButton(
        { text: getDefaultButtonText(), className: 'geolocation__button' },
        wrapper
    );
    return { textElement, buttonElement };
}

function getLocation() {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
            ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }),
            (error) => reject(getGeolocationErrorMessage(error))
        );
    });
}

function getGeolocationErrorMessage(error) {
    switch (error.code) {
        case error.PERMISSION_DENIED:
            return 'Доступ к местоположению отклонен.';
        case error.POSITION_UNAVAILABLE:
            return 'Информация о местоположении недоступна.';
        case error.TIMEOUT:
            return 'Время ожидания истекло.';
        default:
            return 'Произошла неизвестная ошибка.';
    }
}

function handleButtonClick(buttonElement, textElement) {
    return async () => {
        setLoadingState(buttonElement, textElement);

        try {
            const { latitude, longitude } = await getLocation();
            setSuccessState(buttonElement, textElement, latitude, longitude);
        } catch (error) {
            setErrorState(buttonElement, textElement, error);
        } finally {
            resetInterface(buttonElement, textElement);
        }
    };
}

function setLoadingState(buttonElement, textElement) {
    buttonElement.textContent = 'Получение местоположения...';
    buttonElement.disabled = true;
    textElement.textContent = 'Пожалуйста, подождите...';
}

function setSuccessState(buttonElement, textElement, latitude, longitude) {
    buttonElement.textContent = `Широта: ${latitude}, Долгота: ${longitude}`;
    buttonElement.classList.add('geolocation__button_active');
    textElement.textContent = 'Ваше местоположение успешно определено.';
}

function setErrorState(buttonElement, textElement, error) {
    buttonElement.textContent = 'Ошибка!';
    textElement.textContent = error;
}

function resetInterface(buttonElement, textElement) {
    setTimeout(() => {
        textElement.textContent = getDefaultText();
        buttonElement.textContent = getDefaultButtonText();
        buttonElement.disabled = false;
        buttonElement.classList.remove('geolocation__button_active');
    }, 3000);
}

function getDefaultText() {
    return 'Нажмите кнопку, чтобы получить координаты своего местоположения.';
}

function getDefaultButtonText() {
    return 'Получить местоположение.';
}

function initGeolocationApp() {
    const geolocationContainer = createContainer('geolocation', document.body);
    const { textElement, buttonElement } = createGeolocationInterface(geolocationContainer);
    buttonElement.addEventListener('click', handleButtonClick(buttonElement, textElement));
}

initGeolocationApp();