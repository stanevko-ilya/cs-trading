const fs = require('fs');
const path = require('path');

/**
 * 
 * @param {String} directory_path Путь к папке для перебора
 * @param {Function} callback Функция, в которой будет выполнена работа с выполняемым файлом
 * @param {String} file_name Название выполняемого файла
 * @description Функция для перебора всего каталога(савм каталог + подкаталоги) и поиска исполняемых файлов
 */
async function func(directory_path, callback=(file_path)=>{}, file_name='index.js') {
    const file_path = path.join(directory_path, file_name);
    const available_executable_file = fs.existsSync(file_path);
    if (available_executable_file) await callback(file_path);
    else {
        const dirs = fs.readdirSync(directory_path, { withFileTypes: true }).filter(el => el.isDirectory());
        for (const dir of dirs) {
            await func(
                path.join(directory_path, dir.name),
                callback,
                file_name
            );
        }
    }
}

module.exports = func;