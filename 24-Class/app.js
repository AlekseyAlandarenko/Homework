'use strict';

class Car {
    #make;
    #model;
    #_mileage;
    constructor(make, model, mileage) {
        this.#make = make;
        this.#model = model;
        this.#mileage = mileage;
    }

    set #mileage(mileage) {
        this.#_mileage = mileage;
    }

    get #mileage() {
        return this.#_mileage;
    }

    #checkMileage(mileage) {
        return this.#mileage < mileage;
    }

    changeMileage() {
        let newMileage;
        do {
            newMileage = prompt('Введите новый пробег автомобиля:');
            if (!(!isNaN(newMileage) && newMileage !== '' && newMileage !== null)) alert('Вы не ввели новый пробег автомобиля!');
        } while (!(!isNaN(newMileage) && newMileage !== '' && newMileage !== null));
        if (!this.#checkMileage(newMileage)){
            return alert(false);
        }
        this.#mileage = newMileage;
    }
    
    info() {
        alert(`Марка: ${this.#make}.
Модель: ${this.#model}.
Пробег: ${this.#mileage}.`);
    }
}

class Start {
    createNewCar() {
        let make, model, mileage;
        do {
            make = prompt('Введите марку автомобиля:');
            if (!make) alert('Вы не ввели марку автомобиля!');
        } while (!make);
        do {
            model = prompt('Введите модель автомобиля:');
            if (!model) alert('Вы не ввели модель автомобиля!');
        } while (!model);
        do {
            mileage = prompt('Введите пробег автомобиля:');
            if (!(!isNaN(mileage) && mileage !== '' && mileage !== null)) alert('Вы не ввели пробег автомобиля!');
        } while (!(!isNaN(mileage) && mileage !== '' && mileage !== null));
        let car = new Car(make, model, mileage);
        let key, validChoices = {change: true, info: true,};
        while (true) {
            do {
                key = prompt(`Выберете метод : изменить пробег автомобиля(change) или получить основную информацию об автомобиле(info).`);
                if (key === null) return;
                if (key === 'change') {
                    car.changeMileage();
                }
                if (key === 'info') {
                    car.info();
                }
                if (!validChoices[key]) alert('Нет такого метода!');
            } while (!validChoices[key]);   
        }
    }
}

Start.prototype.createNewCar();