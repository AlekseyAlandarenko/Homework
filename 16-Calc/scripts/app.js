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

function createLabeledInput({ labelText, inputClassName, placeholder }, parent) {
    const fieldContainer = createContainer('calculator__input-field', parent);
    createElement('label', { textContent: labelText }, fieldContainer);
    createElement('input', { className: inputClassName, attributes: { placeholder, type: 'text' } }, fieldContainer);
}

function initCalculatorApp() {
    const calculatorContainer = createContainer('calculator', document.body);
    const inner = createContainer('calculator__inner', calculatorContainer);
    const wrapper = createContainer('calculator__wrapper', inner);

    createInputFields(wrapper);
    createControlButtons(wrapper);
    createOutputField(inner);

    const calculateBtn = document.getElementById('calculate-btn');
    const clearBtn = document.getElementById('clear-btn');

    calculateBtn.addEventListener('click', calculate);
    clearBtn.addEventListener('click', clearAll);
}

function createInputFields(container) {
    const inputs = [
        { labelText: 'Введите первое число:', inputClassName: 'input-a', placeholder: 'Введите число.' },
        { labelText: 'Введите второе число:', inputClassName: 'input-b', placeholder: 'Введите число.' },
        { labelText: 'Введите операцию:', inputClassName: 'input-operation', placeholder: 'Введите +, -, *, /.' },
    ];

    inputs.forEach(input => createLabeledInput(input, container));
}

function createControlButtons(container) {
    const buttonsContainer = createContainer('calculator__buttons', container);

    const buttons = [
        { id: 'calculate-btn', text: 'Рассчитать', className: 'btn-calculate' },
        { id: 'clear-btn', text: 'Очистить', className: 'btn-clear' },
    ];

    buttons.forEach(button => createButton(button, buttonsContainer));
}

function createOutputField(container) {
    createTextElement(container, '', 'calculator__output');
}

function getInputValues() {
    return {
        inputA: document.querySelector('.input-a').value.trim(),
        inputB: document.querySelector('.input-b').value.trim(),
        operation: document.querySelector('.input-operation').value.trim(),
    };
}

function validateNumber(input, fieldName) {
    const number = Number(input.trim());
    return isNaN(number) ? `Введите числовое значение для ${fieldName}!` : number;
}

function validateOperation(operation, validOperations) {
    return !validOperations.includes(operation) ? 'Введите допустимое значение для операции!' : null;
}

function performMathOperation(a, b, operation) {
    const operations = {
        '+': (x, y) => x + y,
        '-': (x, y) => x - y,
        '*': (x, y) => x * y,
        '/': (x, y) => (y === 0 ? 'На ноль делить нельзя!' : x / y),
    };
    return operations[operation](a, b);
}

function displayResult(message, isError = false) {
    const outputElement = document.querySelector('.calculator__output');

    outputElement.textContent = message;
    outputElement.className = `calculator__output ${isError ? 'output-error' : 'output-success'}`;
}

function clearInputs() {
    document.querySelectorAll('.input-a, .input-b, .input-operation').forEach(input => (input.value = ''));
}

function clearOutput() {
    const outputElement = document.querySelector('.calculator__output');
    if (outputElement) {
        outputElement.textContent = '';
        outputElement.className = 'calculator__output';
    }
}

function clearAll() {
    clearInputs();
    clearOutput();
}

function calculate() {
    const validOperations = ['+', '-', '*', '/'];
    const { inputA, inputB, operation } = getInputValues();

    if (!inputA || !inputB || !operation) {
        displayResult('Поля не могут быть пустыми! Пожалуйста, введите значения.', true);
        return;
    }

    const errors = [];
    const numA = validateNumber(inputA, 'первого числа');
    if (typeof numA === 'string') errors.push(numA);

    const numB = validateNumber(inputB, 'второго числа');
    if (typeof numB === 'string') errors.push(numB);

    const operationError = validateOperation(operation, validOperations);
    if (operationError) errors.push(operationError);

    if (errors.length > 0) {
        displayResult(errors.join('\n'), true);
        return;
    }

    const result = performMathOperation(numA, numB, operation);
    displayResult(typeof result === 'string' ? result : `Результат: ${result}`);
}

initCalculatorApp();