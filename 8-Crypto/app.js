function encryptPassword() {
    let password = prompt('Введите пароль:');
    let encryptedPassword = [];
    for (let i = 0; i < password.length; i++) {
        let trash = '0123456789qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM';
        let position = Math.floor(Math.random() * (trash.length - 1));
        encryptedPassword += password[i] + trash.substring(position, position + 1);
    }
    encryptedPassword = encryptedPassword.split('')
    if (password.length % 2 === 0) {
        encryptedPassword.push(`${encryptedPassword[Math.floor(encryptedPassword.length / 2)]}`);
        encryptedPassword.splice((Math.floor(encryptedPassword.length / 2)), 1);
    }
    else {
        encryptedPassword.unshift(`${encryptedPassword[Math.floor(encryptedPassword.length / 2)]}`);
        encryptedPassword.splice((Math.floor(encryptedPassword.length / 2 + 1)), 1);
    }
    return [password, encryptedPassword.join('')];
}

function decryptPassword(fn) {
    let password, encryptedPassword = [], tempArr = [], decryptedPassword = [];
    [password, encryptedPassword] = fn();
    tempArr = encryptedPassword.split('')
    if (password.length % 2 === 0) {
        tempArr.pop(tempArr.splice((Math.floor(tempArr.length / 2)), 0, tempArr[tempArr.length - 1]));
    }
    else {
        tempArr.shift(tempArr.splice((Math.floor(tempArr.length / 2 + 1)), 0, tempArr[0]));
    }
    for (let i = 0; i < tempArr.length; i += 2) {
        decryptedPassword += tempArr[i];
    }
    return alert(`Исходный пароль: ${password}.
Зашифрованный пароль: ${encryptedPassword}. 
Раcшифрованный пароль ${((password === decryptedPassword) ? 'тождественен' : 'не тождественен')} исходному.`);
}

decryptPassword(encryptPassword)




