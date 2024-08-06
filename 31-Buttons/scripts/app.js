'use strict';

let elementText = document.querySelector('.buttons__text');
let elementButtons = document.querySelector('.buttons__inner');
let buttons = document.createDocumentFragment();
let counter = 0;

elementText.innerHTML = 'Нажмите кнопку, чтобы увеличить счетчик нажатий.'

function declensionDate(num, word) {
  return word[(num % 100 > 4 && num % 100 < 20) ? 2 : [2, 0, 1, 1, 1, 2][(num % 10 < 5) ? num % 10 : 5]];
}

function createButton() {
    let button = document.createElement('button');
    button.innerHTML = 'Нажми меня!';
    buttons.appendChild(button);
}

for (let i = 0; i < 5; i++) {
  createButton();
}

elementButtons.appendChild(buttons);


elementButtons.addEventListener('click', (e) => {
  if (e.target.tagName != 'BUTTON') return;
  counter++;
  elementText.innerHTML = `Счетчик нажатий: ${counter} ${declensionDate(counter, ['нажатие', 'нажатия', 'нажатий'])}.`;
  [...elementButtons.children].forEach(item => {
    item.innerHTML = 'Нажми меня!';
  });
  e.target.innerHTML = 'Нажата!';
});
