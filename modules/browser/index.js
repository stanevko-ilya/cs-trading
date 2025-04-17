const path = require('path');
const webdriver = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const modules = require('../../modules');
const Module = require('../_class');
const { ips } = require('../../functions/getIp');
const { user_agents } = require('../../functions/getUserAgent');

class Browser extends Module {
    /** 
     * @type {Object<string, chrome.Driver>}
     * @description Драйвер для управления браузером
    */
    #drivers = {};
    getDriver(ip) { return this.#drivers[ip] || null }

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

    async startFunction(ip) {
        const config = this.getConfig();
        const builder = new webdriver.Builder();
        const options = new chrome.Options();
        const service = new chrome.ServiceBuilder(path.join(__dirname, config.driver));
        
        builder.forBrowser('chrome');
        builder.setChromeService(service);
        
        options.addArguments(...config.arguments);
        if (typeof(ip) === 'string') {
            // options.addArguments(`--user-agent=${user_agents.list[ips.list.indexOf(ip)]}`);
            options.addArguments(`--user-data-dir=/root/snap/chromium/common/chromium/ip_${ip}`);
            // options.addArguments(`--user-data-dir=/root/snap/chromium/common/chromium/Default`);
        }
        builder.setChromeOptions(options);
        
        try {
            this.#drivers[ip] = await builder.build();
            const driver = this.#drivers[ip];
            
            driver.manage().setTimeouts({ script: 6e4 });
            driver.manage().window().setRect({
                width: config.react.width,
                height: config.react.height,
                x: config.react.hide ? -config.react.width : 0,
                y: config.react.hide ? -config.react.height : 0
            });
            for (let i = 0; i < config.DevToolsCommands.length; i++) {
                const command = config.DevToolsCommands[i];
                await driver.sendDevToolsCommand(command.name, command.params);
            }

            modules.logger.log('info', `Система браузера запущена | IP: ${ip}`);

            if (this.#queue.length > 0) new Promise(() => this.#process());
        } catch (e) {
            modules.logger.log('error', 'Ошибка при запуске драйвера');
            modules.logger.log('info', e);
            return false;
        }
        
        return true;
    }

    async stopFunction() {
        for (const ip in this.#drivers) {
            const driver = this.#drivers[ip];
            await driver.quit();
            delete this.#drivers[ip];
            modules.logger.log('info', `Система браузера остановлена | IP: ${ip}`);
        }
        return true;
    }
}

module.exports = Browser;