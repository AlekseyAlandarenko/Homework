'use strict';

function sendRequest(url, onSuccess) {
    const request = new XMLHttpRequest();
    request.open('GET', url);
    request.send();

    request.addEventListener('load', () => {
        if (request.status !== 200) {
            alert(`Ошибка: статус ${request.status}.`);
            return;
        }

        try {
            const data = JSON.parse(request.responseText);
            onSuccess(data);
        } catch (error) {
            alert(`Ошибка обработки данных: ${error.message}.`);
        }
    });

    request.addEventListener('error', () => {
        alert('Не удалось выполнить сетевой запрос. Проверьте подключение к интернету.');
    });
}

function fetchPokemonAbilities(pokemonUrl) {
    sendRequest(pokemonUrl, (pokemonData) => {
        const { abilities } = pokemonData;

        if (!Array.isArray(abilities) || abilities.length === 0) {
            alert('Ошибка: у покемона отсутствуют способности!');
            return;
        }

        const ability = abilities.find(a => a?.ability?.url);
        if (!ability || !ability.ability.url) {
            alert('Ошибка: у способности отсутствует URL!');
            return;
        }

        const abilityUrl = ability.ability.url;
        alert(`URL способности: ${abilityUrl}`);
        fetchAbilityDetails(abilityUrl);
    });
}

function fetchAbilityDetails(abilityUrl) {
    sendRequest(abilityUrl, (abilityData) => {
        const { effect_entries } = abilityData;

        if (!Array.isArray(effect_entries) || effect_entries.length === 0) {
            alert('Ошибка: у способности отсутствует описание!');
            return;
        }

        const effect = effect_entries.find(entry => entry.language?.name === 'en')?.effect;
        alert(`Описание способности: ${effect || 'Эффект не найден.'}`);
    });
}

fetchPokemonAbilities('https://pokeapi.co/api/v2/pokemon/ditto/');