'use strict';

function clearAll() {
    document.querySelector('.input-a').value = '';
    document.querySelector('.input-b').value = '';
}

function calculate(fn) {
    let numA = Number(document.querySelector('.input-a').value);
    let numB = Number(document.querySelector('.input-b').value);  
    switch(document.querySelector('.operations').value) {
        case '+':
            document.querySelector('.output').innerHTML = numA + numB;
            fn();
            break;
        case '-':
            document.querySelector('.output').innerHTML = numA - numB;
            fn();
            break;
        case '*':
            document.querySelector('.output').innerHTML = numA * numB;
            fn();
            break;
        case '/':
            document.querySelector('.output').innerHTML = numA / numB;
            fn();
            break;
    }
}