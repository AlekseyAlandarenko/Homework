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

function createButton({ text, className = '', dataset = {} }, parent) {
    return createElement('button', { className, textContent: text, dataset }, parent);
}

function createTextElement(parent, textContent, className, dataset = {}) {
    return createElement('div', { className, textContent, dataset }, parent);
}

function initButtonsApp(buttonCount) {
    const buttonsContainer = createContainer('buttons', document.body);
    const wrapper = createContainer('buttons__wrapper', buttonsContainer);
    const elementText = createTextElement(wrapper, 'Нажмите кнопку, чтобы увеличить счетчик нажатий.', 'buttons__text');
    const elementButtons = createContainer('buttons__inner', wrapper);

    createButtons(elementButtons, buttonCount);
    setupEventListeners(elementButtons, elementText);
}

function createButtons(container, count) {
    const fragment = document.createDocumentFragment();
    for (let i = 1; i <= count; i++) {
        createButton(
            {
                text: 'Нажми меня!',
                className: 'buttons__button',
                dataset: { id: i }
            },
            fragment
        );
    }
    container.appendChild(fragment);
}

function setupEventListeners(buttonsContainer, textElement) {
    let counter = 0;
    let activeButton = null;

    buttonsContainer.addEventListener('click', (e) => {
        const clickedButton = e.target;
        if (!clickedButton.classList.contains('buttons__button')) return;

        counter++;
        updateText(textElement, counter);

        updateActiveButton(clickedButton, activeButton);
        activeButton = clickedButton;
    });
}

function updateText(textElement, counter) {
    const declensionDate = (num, word) =>
        word[(num % 100 > 4 && num % 100 < 20) ? 2 : [2, 0, 1, 1, 1, 2][(num % 10 < 5) ? num % 10 : 5]];
    const text = `Счетчик нажатий: ${counter} ${declensionDate(counter, ['нажатие', 'нажатия', 'нажатий'])}.`;
    textElement.textContent = text;
}

function updateActiveButton(clickedButton, activeButton) {
    if (activeButton) {
        activeButton.textContent = 'Нажми меня!';
        activeButton.classList.remove('buttons__button_active');
    }

    clickedButton.textContent = 'Нажата!';
    clickedButton.classList.add('buttons__button_active');
}

initButtonsApp(5);