'use strict';

let firstPromise, secondPromise, thirdPromise; 
let promises = [
    firstPromise = new Promise(resolve => setTimeout(() => resolve('First'), Math.floor(Math.random() * 10))),      
    secondPromise = new Promise(resolve => setTimeout(() => resolve('Second'), Math.floor(Math.random() * 10))),
    thirdPromise = new Promise(resolve => setTimeout(() => resolve('Third'), Math.floor(Math.random() * 10))),
]

function race(promises) {
	return new Promise((resolve, reject) => {
        Promise.all(promises.map(promise => promise.then(resolve).catch(reject)));   
    });
}

race(promises).then(alert).catch(error => alert(error));