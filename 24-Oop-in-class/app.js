'use strict';

class Character {
    constructor(race, name, language) {
        this.race = race;
        this.name = name;
        this.language = language;
    }

    speak() {
        alert(`Я ${this.race} по имени ${this.name}, говорю ${this.language}.`);
    }
}

class Orc extends Character {
    constructor(weapon) {
        super('орк', 'Орк', 'по-оркски');
        this.weapon = weapon;
    }

    speak() {
        alert(`Я грозный ${this.race} по имени ${this.name}, говорю ${this.language}.`);
    }

    attack() {
        alert(`Бью ${this.weapon}.`);
    }
}

class Elf extends Character {
    constructor(spell) {
        super('эльф', 'Эльф', 'по-эльфийски');
        this.spell = spell;
    }

    speak() {
        alert(`Я изящный ${this.race} по имени ${this.name}, говорю ${this.language}.`);
    }

    cast() {
        alert(`Создаю ${this.spell}.`);
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

    createCharacterFactory(key) {
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
        if (character instanceof Orc) character.attack();
        if (character instanceof Elf) character.cast();

        return character;
    }

    createNewCharacter() {
        const validCharacter = { new: 'новый персонаж', orc: 'орк', elf: 'эльф' };

        const key = this.promptForValidInput(
            `Выберите тип персонажа: ${this.formatValidInput(validCharacter)} или нажмите "Отмена" для выхода.`,
            validCharacter
        );

        if (key === null) return null;

        return this.createCharacterFactory(key);
    }

    displayNewCharacter() {
        const character = this.createNewCharacter();
        if (character) {
            alert('Персонаж успешно создан!');
        } else {
            alert('Отмена! Программа завершена.');
        }
    }
}

const start = new Start();
start.displayNewCharacter();