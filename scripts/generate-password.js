const bcrypt = require('bcryptjs');

const password = 'Admin123!@#'; // Это пароль, который вы будете использовать
bcrypt.hash(password, 10).then(hash => {
    console.log('Пароль:', password);
    console.log('Хеш для базы данных:', hash);
}); 