'use strict';

class Car {
    #make;
    #model;
    #mileage;

    constructor(make, model, mileage) {
        this.#make = make;
        this.#model = model;
        this.#mileage = Number(mileage);
    }

    get mileage() {
        return this.#mileage;
    }

    set mileage(newMileage) {
        if (Car.isValidAmount(newMileage) && newMileage > this.#mileage) {
            this.#mileage = newMileage;
            alert('Пробег успешно обновлен!');
        } else {
            alert('Новый пробег должен быть больше текущего!');
        }
    }

    static isValidAmount(value) {
        return typeof value === 'number' && value >= 0;
    }

    changeMileage(newMileage) {
        this.mileage = newMileage;
    }

    showInfo() {
        alert(`Марка: ${this.#make}.\nМодель: ${this.#model}.\nПробег: ${this.#mileage}.`);
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

    promptForPositiveNumberInput(message) {
        return this.promptForInput(
            message,
            input => {
                const number = Number(input);
                if (!Car.isValidAmount(number)) {
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
            .map(([key, desc]) => `${desc} (${key})`)
            .join(', ');
    }

    collectCarData() {
        const carPrompts = {
            make: 'марку',
            model: 'модель',
            mileage: 'пробег'
        };

        const carData = {};

        for (const [key, message] of Object.entries(carPrompts)) {
            const value = key === 'mileage'
                ? this.promptForPositiveNumberInput(`Введите ${message} автомобиля или нажмите "Отмена" для выхода.`)
                : this.promptForInput(`Введите ${message} автомобиля или нажмите "Отмена" для выхода.`);

            if (value === null) return null;
            carData[key] = value;
        }

        return carData;
    }

    handleCarActions(car) {
        const validChoices = {
            change: 'изменить пробег',
            info: 'получить информацию'
        };

        while (true) {
            const action = this.promptForValidInput(
                `Выберите действие: ${this.formatValidInput(validChoices)} или нажмите "Отмена" для выхода.`,
                validChoices
            );

            if (action === null) {
                alert('Отмена! Программа завершена.');
                return;
            }

            if (action === 'change') {
                const newMileage = this.promptForPositiveNumberInput('Введите новый пробег автомобиля:');
                if (newMileage !== null) car.changeMileage(newMileage);
            } else {
                car.showInfo();
            }
        }
    }

    createNewCar() {
        const carData = this.collectCarData();
        if (!carData) {
            alert('Отмена! Программа завершена.');
            return;
        }

        const car = new Car(carData.make, carData.model, carData.mileage);
        this.handleCarActions(car);
    }
}

const start = new Start();
start.createNewCar();