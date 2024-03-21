const password = prompt('Введите пароль');
let encryptedPassword = [];
let decryptedPassword = [];

function encryptPassword(password) {
    const trash = '0123456789qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM';
    for (let i = 0; i < password.length; i++) {
        position = Math.floor(Math.random() * (trash.length - 1));
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
    return encryptedPassword.reverse().join('');
}

function decryptPassword(encryptedPassword) {
    encryptedPassword.reverse();
    if (password.length % 2 === 0) {
        encryptedPassword.pop(encryptedPassword.splice((Math.floor(encryptedPassword.length / 2)), 0, encryptedPassword[encryptedPassword.length - 1]));
    }
    else {
        encryptedPassword.shift(encryptedPassword.splice((Math.floor(encryptedPassword.length / 2 + 1)), 0, encryptedPassword[0]));
    }
    for (let i = 0; i < encryptedPassword.length; i += 2) {
        decryptedPassword += encryptedPassword[i];
    }
    return (password !== decryptedPassword) ? 'не тождественен' : 'тождественен';
}

alert(`Исходный пароль: ${password} 
Зашифрованный пароль: ${encryptPassword(password)} 
Раcшифрованный пароль ${decryptPassword(encryptedPassword)} исходному.`);



