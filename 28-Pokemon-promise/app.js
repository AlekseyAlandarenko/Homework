'use strict';

fetch('https://pokeapi.co/api/v2/pokemon/ditto/')
    .then(response => response.json())
    .then(({abilities}) => {
        alert(abilities[0].ability.url);
        return fetch(abilities[0].ability.url)
    })
    .then(response => response.json())
    .then(({effect_entries}) => {
        alert(effect_entries[1].effect);
    })
    .catch(error => alert(error));