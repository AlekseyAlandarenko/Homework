'use strict';

let request = new XMLHttpRequest();
request.open('GET', 'https://pokeapi.co/api/v2/pokemon/ditto/');
request.send();

request.addEventListener('load', function() {
    let {abilities} = JSON.parse(this.responseText);
    alert(abilities[0].ability.url);

    let request = new XMLHttpRequest();
    request.open('GET', abilities[0].ability.url);
    request.send();

    request.addEventListener('load', function() {
        let {effect_entries} = JSON.parse(this.responseText);
        alert(effect_entries[1].effect);
    });
});