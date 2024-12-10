'use strict';

class Billing {
    constructor(amount) {
        if (!Billing.isValidAmount(amount)) {
            alert('Сумма должна быть положительным числом!');
            return null;
        }
        this.amount = amount;
    }

    static isValidAmount(value) {
        return typeof value === 'number' && value > 0;
    }

    calculateTotal() {
        return this.amount;
    }

    formatMessage(type) {
        return `${type} счет: ${this.calculateTotal()}`;
    }

    showTotal() {
        alert(this.formatMessage('Общий'));
    }
}

class FixedBilling extends Billing {
    showTotal() {
        alert(this.formatMessage('Фиксированный'));
    }
}

class HourBilling extends Billing {
    constructor(amount, hour) {
        super(amount);
        if (!Billing.isValidAmount(hour)) {
            alert('Количество часов должно быть положительным числом!');
            return null;
        }
        this.hour = hour;
    }

    calculateTotal() {
        return this.amount * this.hour;
    }

    showTotal() {
        alert(this.formatMessage('Почасовой'));
    }
}

class ItemBilling extends Billing {
    constructor(amount, item) {
        super(amount);
        if (!Billing.isValidAmount(item)) {
            alert('Количество элементов должно быть положительным числом!');
            return null;
        }
        this.item = item;
    }

    calculateTotal() {
        return this.amount * this.item;
    }

    showTotal() {
        alert(this.formatMessage('По элементам'));
    }
}

class Start {
    promptForInput(message, parseFunction = input => input) {
        while (true) {
            const input = prompt(message);
            if (input === null) return null;

            const trimmedInput = input.trim();
            if (!trimmedInput) {
                alert('Поле не может быть пустым! Пожалуйста, введите значение.');
                continue;
            }

            const result = parseFunction(trimmedInput);
            if (result !== null) return result;
        }
    }

    promptForPositiveNumber(message) {
        return this.promptForInput(
            message,
            input => {
                const number = Number(input);
                if (isNaN(number) || number <= 0) {
                    alert('Введенное значение недопустимо! Пожалуйста, введите положительное числовое значение.');
                    return null;
                }
                return number;
            }
        );
    }

    promptForValidInput(message, validOptions) {
        return this.promptForInput(
            message,
            input => {
                const trimmedInput = input.trim().toLowerCase();
                if (!validOptions[trimmedInput]) {
                    alert(`Введенное значение недопустимо! Допустимые значения: ${this.formatValidInput(validOptions)}.`);
                    return null;
                }
                return trimmedInput;
            }
        );
    }

    formatValidInput(validOptions) {
        return Object.entries(validOptions)
            .map(([key, { desc }]) => `${desc} (${key})`)
            .join(', ');
    }
    
    createBilling() {
        const billingConfig = {
            fixed: { type: FixedBilling, extraPrompt: null, desc: 'фиксированный счет' },
            hour: { type: HourBilling, extraPrompt: 'Введите количество часов или нажмите "Отмена" для выхода.', desc: 'почасовой счет' },
            item: { type: ItemBilling, extraPrompt: 'Введите количество элементов или нажмите "Отмена" для выхода.', desc: 'счет по элементам' },
        };
    
        const billingType = this.promptForValidInput(
            `Выберите тип счета: ${this.formatValidInput(billingConfig)} или нажмите "Отмена" для выхода.`,
            billingConfig
        );
        if (!billingType) return null;
    
        const amount = this.promptForPositiveNumber('Введите сумму счета или нажмите "Отмена" для выхода.');
        if (amount === null) return null;
    
        const { type, extraPrompt } = billingConfig[billingType];
        if (extraPrompt) {
            const extraValue = this.promptForPositiveNumber(extraPrompt);
            if (extraValue === null) return null;
            return new type(amount, extraValue);
        }
    
        return new type(amount);
    }

    displayBilling() {
        const billing = this.createBilling();
        if (!billing) {
            alert('Отмена! Программа завершена.');
            return;
        }

        if (billing) billing.showTotal();
    }
}

const start = new Start();
start.displayBilling();