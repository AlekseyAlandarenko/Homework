'use strict';

class Character {
    constructor(race,name,language) {
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
        super('орк','Орк');
        this.weapon = weapon;
    }

    attack() { 
        alert(`Бью ${this.weapon}.`); 
    }

    speak() {
        alert(`Я ${this.race} по имени ${this.name}, говорю по-оркски.`);
    }
}

class Elf extends Character {
    constructor(spell) {
        super('эльф','Эльф');
        this.spell = spell
    }

    cast() { 
        alert(`Создаю ${this.spell}.`); 
    }

    speak() {
        alert(`Я ${this.race} по имени ${this.name}, говорю по-эльфийски.`);
    }
}

class Start {
    createNewCharacter(race,name,language) {
        let key, validChoices = {new: true, orc: true, elf: true,};
        while (true) {
            do {
                key = prompt('Выберете персонажа: орк(orc) или эльф(elf) либо создайте нового(new).');
                if (key === null) return;
                if (key === 'new') {
                    do {
                        race = prompt('Введите расу персонажа:');
                        if (!race) alert('Вы не ввели расу персонажа!');
                    } while (!race);
                    do {
                        name = prompt('Введите имя персонажа:');
                        if (!name) alert('Вы не ввели имя персонажа!');
                    } while (!name);
                    do {
                        language = prompt('Введите язык персонажа:');
                        if (!language) alert('Вы не ввели язык персонажа!');
                    } while (!language);
                    let theNew = new Character(race,name,language);
                    theNew.speak();
                }
                if (key === 'orc') {
                    let weapon;
                    do {
                        weapon = prompt('Введите название оружия орка:');
                        if (!weapon) alert('Вы не ввели название оружия орка!');
                    } while (!weapon);
                    let theOrc = new Orc(weapon);
                    theOrc.speak();
                    theOrc.attack();
                }
                if (key === 'elf') {
                    let spell;
                    do {
                        spell = prompt('Введите название заклинания эльфа:');
                        if (!spell) alert('Вы не ввели название заклинания эльфа!');
                    } while (!spell); 
                    let theElf = new Elf(spell);
                    theElf.speak();
                    theElf.cast();
                }
                if (!validChoices[key]) alert('Нет такого персонажа!');
            } while (!validChoices[key]);   
        }
    }
}

Start.prototype.createNewCharacter();