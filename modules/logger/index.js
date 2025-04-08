const fs = require('fs');
const path = require('path');
const Module = require('../_class');

class Logger extends Module {
    #logging = false;

    #to_console = false;
    onCopyToConsole() { this.#to_console = true }
    offCopyToConsole() { this.#to_console = false }

    startFunction() { this.#logging = true }
    stopFunction() { this.#logging = false }

    constructor() {
        super(__dirname);
        this.check_file();
    }

    /**
     * 
     * @param {Boolean} create Необходимо ли создать файл, если он отсутствует
     * @param {String} default_file_name Путь к файлу
     * @description Проверяет наличие файла для записи
     */
    check_file(create=true, default_file_name=null) {
        const directory = path.join(this.getDirname(), this.getConfig().directory);

        const today = new Date();
        if (this.getConfig().UTC) today.toUTCZone();
        
        const file_name =  default_file_name ? default_file_name :  
            this.getConfig().format.file_name
                .replace('%DD%', today.getDate().toStringWithZeros())
                .replace('%D%', today.getDate())
                .replace('%MM%', (today.getMonth() + 1).toStringWithZeros())
                .replace('%M%', (today.getMonth() + 1))
                .replace('%YYYY%', today.getFullYear())
                .replace('%YY%', (today.getFullYear() % 100).toStringWithZeros())
                + '.' + this.getConfig().format.file_extension
        ;

        const path_to_file = path.join(directory, file_name);
        const files_in_directory = fs.readdirSync(directory);
        const exists_file = Boolean(files_in_directory.find(file => file === file_name));

        let created = false;
        if (!exists_file && create) {
            created = true;
            try { fs.writeFileSync(path_to_file, '[INFO]Файл логирования инициализирован\n', { flag: 'w+' }) }
            catch (e) { created = false }
        }
        
        const result = { exists: created || exists_file, created, path_to_file };
        return result;
    }

    stringError(e) { return (e).toString() === '[object Object]' ? JSON.stringify(e, null, 4) : e }

    /**
     * 
     * @param {'info'|'warn'|'error'|String} level Любой уровень сообщения
     * @param {String|Array<String>} message Сообщение или список сообщений
     * @param {Boolean} onlyConsole Обновляет последнюю строку в логах
     * @description Добавляет запись в файл
     */
    log(level, message, onlyConsole=false) {
        if (!this.#logging) return false;

        const checked = this.check_file(true, null);
        if (!checked.exists) return false;

        if (!Array.isArray(message)) message = [ message ];
        message[message.length-1] += '\n';

        const now = new Date();
        if (this.getConfig().UTC) now.toUTCZone();

        const print = message.map(text =>
            this.getConfig().format.log
                .replace('%level%', level.toUpperCase())

                .replace('%HH%', now.getHours().toStringWithZeros())
                .replace('%H%', now.getHours())
                .replace('%MM%', now.getMinutes().toStringWithZeros())
                .replace('%M%', now.getMinutes())
                .replace('%SS%', now.getSeconds().toStringWithZeros())
                .replace('%S%', now.getSeconds())
                .replace('%MSMS%', now.getMilliseconds().toStringWithZeros())
                .replace('%MS%', now.getMilliseconds())

                .replace('%text%', text)
        );

        if (!onlyConsole) fs.writeFileSync(checked.path_to_file, print.join('\n'), { flag: 'a' });
        if (this.#to_console) print.map(message => console.log(message));

        return true;
    }

    /**
     * 
     * @param {String} file_name Имя файла
     * @description Возвращает записи из выбранного файла
     * @returns {false|String}
     */
    get(file_name) {
        const extension = this.getConfig().format.file_extension;
        const splited = file_name.split('.');
        if (splited[splited.length - 1] !== extension) file_name += `.${extension}`;

        const checked = this.check_file(false, file_name);
        
        return checked.exists ? fs.readFileSync(checked.path_to_file).toString() : false;
    }
}

module.exports = Logger;