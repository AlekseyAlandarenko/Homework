'use strict';

let habbits = [];
const HABBIT_KEY = 'HABBIT_KEY';
let globalActiveHabbitId;

const page = {
    menu: document.querySelector('.panel__menu-list'),
    header: {
        h1: document.querySelector('.header__title'),
        progressPercent: document.querySelector('.header__progress-percent'),
        progressCoverBar: document.querySelector('.header__progress-cover-bar'),
    },
    main: {
        daysContainer: document.querySelector('.main__days'),
        nextDay: document.querySelector('.main__habbit-day'),
    },
    popup: {
        index: document.querySelector('.cover'),
        iconField: document.querySelector('.popup__form input[name="icon"]'),
    },
}

function loadData() {
    const habbitsString = localStorage.getItem(HABBIT_KEY);
    const habbitArray = JSON.parse(habbitsString);
    if(Array.isArray(habbitArray)){
        habbits = habbitArray;
    }
}

function saveData() {
    localStorage.setItem(HABBIT_KEY, JSON.stringify(habbits));
}

function togglePopup() {
    if (page.popup.index.classList.contains('cover_hidden')) {
        page.popup.index.classList.remove('cover_hidden');
    }
    else {
        page.popup.index.classList.add('cover_hidden');
    }
}

function resetForm(form, fields) {
    for (const field of fields) {
        form[field].value = '';
    }
}

function validateForm(form, fields) {
    const formData = new FormData(form);
    const res = {};
    for (const field of fields) {
        const fieldValue = formData.get(field);
        form[field].classList.remove('error');
        if (!fieldValue) {
            form[field].classList.add('error');
        }
        res[field] = fieldValue;
    }
    let isValid = true;
    for (const field of fields) {
        if (!res[field]) {
            isValid = false;
        }
    }
    if (!isValid) {
        return;
    }
    return res;
}

function rerenderMenu(activeHabbit) {
    for(const habbit of habbits ) {
        const existed = document.querySelector(`[menu-habbit-id="${habbit.id}"]`);
        if (!existed) {
            const element = document.createElement('button');
            element.setAttribute('menu-habbit-id', habbit.id);
            element.classList.add('panel__menu-item')
            element.addEventListener('click', () => rerender(habbit.id));
            element.innerHTML = `<img src="./images/${habbit.icon}.svg" alt="${habbit.name}" width="25px" height="25px">`;
            if (activeHabbit.id === habbit.id) {
                element.classList.add('panel__menu-item_active');
            }
            page.menu.appendChild(element);
            continue;
        }
        if (activeHabbit.id === habbit.id) {
            existed.classList.add('panel__menu-item_active');
        }
        else {
            existed.classList.remove('panel__menu-item_active');
        }
    }
}

function rerenderHead(activeHabbit) {
    page.header.h1.innerText = activeHabbit.name;
    const progress = activeHabbit.days.length / activeHabbit.target > 1 ? 100 : activeHabbit.days.length / activeHabbit.target * 100;
    page.header.progressPercent.innerText = progress.toFixed(0) + ' %';
    page.header.progressCoverBar.setAttribute('style', `width: ${progress}%`);
}

function rerenderMain(activeHabbit) {
    page.main.daysContainer.innerHTML = '';
    for(const index in activeHabbit.days) {
        const element = document.createElement('div');
        element.classList.add('main__habbit');
        element.innerHTML =`<div class="main__habbit-day">
                                День ${Number(index) + 1}
                            </div>
                            <form class="main__habbit-form">
                                <div class="main__habbit-comment">
                                    ${activeHabbit.days[index].comment}    
                                 </div>
                                <button class="main__habbit-delete-button" onclick="deleteDay(${index})">
                                        Удалить    
                                </button>
                            </form>`;
        page.main.daysContainer.appendChild(element);
    }
    page.main.nextDay.innerHTML = `День ${activeHabbit.days.length + 1}`;
}

function rerender(activeHabbitId) {
    globalActiveHabbitId = activeHabbitId;
    const activeHabbit = habbits.find(habbit => habbit.id === activeHabbitId);
    if(!activeHabbit) {
        return;
    }
    document.location.replace(document.location.pathname + '#' + activeHabbitId);
    rerenderMenu(activeHabbit);
    rerenderHead(activeHabbit);
    rerenderMain(activeHabbit);
}

function addDays(event) {
    event.preventDefault();
    const data = validateForm(event.target, ['comment']);
    if (!data) {
        return;
    }
    habbits = habbits.map(habbit => {
        if (habbit.id === globalActiveHabbitId)  {
            return {
                ...habbit,
                days: habbit.days.concat([{comment: data.comment}]),
            }
        }
        return habbit;
    });
    resetForm(event.target, ['comment']);
    rerender(globalActiveHabbitId);
    saveData();
}
 
function deleteDay(index) {
    habbits = habbits.map(habbit =>{
        if (habbit.id === globalActiveHabbitId) {
            habbit.days.splice(index, 1);
            return {
                ...habbit,
                days: habbit.days,
            }
        }
        return habbit;
    })
    rerender(globalActiveHabbitId);
    saveData();
}

function setIcon(context, icon) {
    page.popup.iconField.value = icon;
    const activeIcon = document.querySelector('.popup__icon.popup__icon_active');
    activeIcon.classList.remove('popup__icon_active');
    context.classList.add('popup__icon_active');
}

function addHabbit(event) {
    event.preventDefault();
    const data = validateForm(event.target, ['name', 'icon', 'target']);
    if (!data) {
        return;
    }
    const maxId = habbits.reduce((acc, habbit) => acc > habbit.id ? acc : habbit.id, 0);
    habbits.push({
    id: maxId + 1,
    name: data.name,
    icon: data.icon,
    target: data.target,
    days: [],
    });
    resetForm(event.target, ['name', 'target']);
    togglePopup();
    saveData();
    rerender(maxId + 1);
}

(() => {
    loadData();
    const hashId = Number(document.location.hash.replace('#', ''));
    const urlHabbit = habbits.find(habbit => habbit.id ==  hashId);
    if (urlHabbit) {
        rerender(urlHabbit.id);
    }
    else {
        rerender(habbits[0].id);
    }
    rerender(habbits.find);
})();