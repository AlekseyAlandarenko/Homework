'use strict';

function sendRequest(url) {
    return new Promise((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open('GET', url);
        request.send();

        request.addEventListener('load', () => {
            if (request.status !== 200) {
                reject(`Ошибка: статус ${request.status}.`);
                return;
            }

            try {
                const data = JSON.parse(request.responseText);
                resolve(data);
            } catch (error) {
                reject(`Ошибка обработки данных: ${error.message}.`);
            }
        });

        request.addEventListener('error', () => {
            reject('Не удалось выполнить сетевой запрос. Проверьте подключение к интернету.');
        });
    });
}

function fetchPokemonAbilities(pokemonUrl) {
    sendRequest(pokemonUrl)
        .then(pokemonData => {
            const { abilities } = pokemonData;

            if (!Array.isArray(abilities) || abilities.length === 0) {
                throw 'Ошибка: у покемона отсутствуют способности!';
            }

            const ability = abilities.find(a => a?.ability?.url);
            if (!ability || !ability.ability.url) {
                throw 'Ошибка: у способности отсутствует URL!';
            }

            const abilityUrl = ability.ability.url;
            alert(`URL способности: ${abilityUrl}`);
            return sendRequest(abilityUrl);
        })
        .then(abilityData => {
            const { effect_entries } = abilityData;

            if (!Array.isArray(effect_entries) || effect_entries.length === 0) {
                throw 'Ошибка: у способности отсутствует описание!';
            }

            const effect = effect_entries.find(entry => entry.language?.name === 'en')?.effect;
            alert(`Описание способности: ${effect || 'Эффект не найден.'}`);
        })
        .catch(error => {
            alert(error);
        });
}

fetchPokemonAbilities('https://pokeapi.co/api/v2/pokemon/ditto/');

