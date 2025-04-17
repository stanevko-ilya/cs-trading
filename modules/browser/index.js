const path = require('path');
const webdriver = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const modules = require('../../modules');
const Module = require('../_class');

class Browser extends Module {

    #active_ip = null;
    getIp() { return this.#active_ip }

    /** 
     * @type {chrome.Driver|null}
     * @description Драйвер для управления браузером
    */
    #driver = null;
    getDriver() { return this.#driver }

    /** Флаг, отображающий работу браузера */
    #driver_working = false;
    isWork() { return this.#driver_working }

    /**
     * @type {[{ func: Function }]}
     * @description Очередь запросов
     */
    #queue = [ ];

    constructor() {
        super(__dirname);
    }
    
    /**
     * 
     * @param {Function} func Будет вызвана после парсинга
     */
    async addToQueue(func=()=>{}) {
        const request = { func };
        this.#queue.push(request);
        
        if (this.#queue.length > 1) return { result: 'in_process' };
        else return await this.#process();
    }

    async #process() {
        if (this.#queue.length === 0) return false;

        const request = this.#queue[0];
        try { await request.func() }
        catch (e) {
            modules.logger.log('error', 'Ошибка во время работы модуля браузера');
            modules.logger.log('info', e);
            return { result: 'error' };
        }
        
        this.#queue.splice(0, 1);
        if (this.#queue.length !== 0) new Promise(() => this.#process());

        return { result: 'completed' };
    }

    async start(ip) {
        if (typeof(ip) === 'string') this.#active_ip = ip;
        return await super.start();
    }

    async startFunction() {
        const config = this.getConfig();
        const builder = new webdriver.Builder();
        const options = new chrome.Options();
        const service = new chrome.ServiceBuilder(path.join(__dirname, config.driver));
        
        builder.forBrowser('chrome');
        builder.setChromeService(service);
        
        options.addArguments(...config.arguments);
        if (this.#active_ip) {
            options.addArguments(`--host-resolver-rules="MAP * ${this.#active_ip} , EXCLUDE localhost"`);
            options.addArguments(`--user-data-dir=/root/snap/chromium/common/chromium/ip_${this.#active_ip}`);
        } else options.addArguments('--user-data-dir=/root/snap/chromium/common/chromium/Default');
        builder.setChromeOptions(options);
        
        try {
            const driver = await builder.build();
            this.#driver = driver;            

            this.#driver.manage().setTimeouts({ script: 6e4 });
            this.#driver.manage().window().setRect({
                width: config.react.width,
                height: config.react.height,
                x: config.react.hide ? -config.react.width : 0,
                y: config.react.hide ? -config.react.height : 0
            });
            for (let i = 0; i < config.DevToolsCommands.length; i++) {
                const command = config.DevToolsCommands[i];
                await this.#driver.sendDevToolsCommand(command.name, command.params);
            }

            modules.logger.log('info', 'Система браузера запущена');

            if (this.#queue.length > 0) new Promise(() => this.#process());
        } catch (e) {
            modules.logger.log('error', 'Ошибка при запуске драйвера');
            modules.logger.log('info', e);
            return false;
        }
        
        this.#driver_working = true;
        return true;
    }

    async stopFunction() {
        if (this.isWork()) {
            this.#driver_working = false;
            await this.#driver.quit();
            modules.logger.log('info', 'Система браузера остановлена');
        }
    }
}

module.exports = Browser;