function encryptPassword() {
    let enteredPassword = prompt('Введите пароль:');
    let encryptedPassword = [];
    for (let i = 0; i < enteredPassword.length; i++) {
        let trash = '0123456789qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM';
        let position = Math.floor(Math.random() * (trash.length - 1));
        encryptedPassword.push(enteredPassword[i]);
        encryptedPassword.push(trash.substring(position, position + 1));
    }
    if (enteredPassword.length % 2 === 0) {
        encryptedPassword.push(`${encryptedPassword[Math.floor(encryptedPassword.length / 2)]}`);
        encryptedPassword.splice((Math.floor(encryptedPassword.length / 2)), 1);
    }
    else {
        encryptedPassword.unshift(`${encryptedPassword[Math.floor(encryptedPassword.length / 2)]}`);
        encryptedPassword.splice((Math.floor(encryptedPassword.length / 2 + 1)), 1);
    }
    alert(`Зашифрованный пароль: ${encryptedPassword.join('')}.`)
    return [enteredPassword, encryptedPassword];
}

function decryptPassword(fn) {
    let [enteredPassword, encryptedPassword] = fn();
    let decryptedPassword = [];
    if (enteredPassword.length % 2 === 0) {
        encryptedPassword.pop(encryptedPassword.splice((Math.floor(encryptedPassword.length / 2)), 0, encryptedPassword[encryptedPassword.length - 1]));
    }
    else {
        encryptedPassword.shift(encryptedPassword.splice((Math.floor(encryptedPassword.length / 2 + 1)), 0, encryptedPassword[0]));
    }
    for (let i = 0; i < encryptedPassword.length; i += 2) {
        decryptedPassword.push(encryptedPassword[i]);
    }
    return alert(`Раcшифрованный пароль (${decryptedPassword.join('')}) ${((enteredPassword === decryptedPassword.join('')) ? 'тождественен' : 'не тождественен')} исходному.`);
}

decryptPassword(encryptPassword);




