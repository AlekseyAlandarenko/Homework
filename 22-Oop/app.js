'use strict';

function Character(race, name, language) {
    this.race = race;
    this.name = name;
    this.language = language;
}

Character.prototype.speak = function () {
    alert(`Я ${this.race} по имени ${this.name}, говорю ${this.language}.`);
};

function Orc(weapon) {
    Character.call(this, 'орк', 'Орк', 'по-оркски');
    this.weapon = weapon;
}

Orc.prototype = Object.create(Character.prototype);
Orc.prototype.constructor = Orc;

Orc.prototype.attack = function () {
    alert(`Бью ${this.weapon}.`);
};

function Elf(spell) {
    Character.call(this, 'эльф', 'Эльф', 'по-эльфийски');
    this.spell = spell;
}

Elf.prototype = Object.create(Character.prototype);
Elf.prototype.constructor = Elf;

Elf.prototype.cast = function () {
    alert(`Создаю ${this.spell}.`);
};

function Start() {}

Start.prototype.promptForInput = function (message, parseFunction = input => input) {
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
};

Start.prototype.promptForValidInput = function (message, validOptions) {
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
};

Start.prototype.formatValidInput = function (validOptions) {
    return Object.entries(validOptions)
        .map(([key, desc]) => `${desc} (${key})`)
        .join(', ');
};

Start.prototype.createCharacterFactory = function (key) {
    const inputMap = {
        new: {
            text: ['расу персонажа', 'имя персонажа', 'язык персонажа'],
            factory: ([race, name, language]) => new Character(race, name, language),
        },
        orc: {
            text: ['название оружия орка'],
            factory: ([weapon]) => new Orc(weapon),
        },
        elf: {
            text: ['название заклинания эльфа'],
            factory: ([spell]) => new Elf(spell),
        },
    };

    const config = inputMap[key];
    const inputs = [];

    for (const text of config.text) {
        const input = this.promptForInput(`Введите ${text}:`);
        if (input === null) return null;
        inputs.push(input);
    }

    const character = config.factory(inputs);
    character.speak();
    if (character.attack) character.attack();
    if (character.cast) character.cast();

    return character;
};

Start.prototype.createNewCharacter = function () {
    const validCharacter = { new: 'новый персонаж', orc: 'орк', elf: 'эльф' };

    const key = this.promptForValidInput(
        `Выберите тип персонажа: ${this.formatValidInput(validCharacter)} или нажмите "Отмена" для выхода.`,
        validCharacter
    );

    if (key === null) return null;

    return this.createCharacterFactory(key);
};

Start.prototype.displayNewCharacter = function () {
    const character = this.createNewCharacter();
    if (character) {
        alert('Персонаж успешно создан!');
    } else {
        alert('Отмена! Программа завершена.');
    }
};

const start = new Start();
start.displayNewCharacter();