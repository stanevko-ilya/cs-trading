const path = require('path');
const Module = require('../_class');
const MarketClass = require('./markets/_class');
const modules = require('../../modules');
const directorySearch = require('../../functions/directorySearch');

class Market extends Module {

    /** @type {Object<string, MarketClass>} */
    #markets = {};
    async #initMarkets() {
        this.#markets = {};
        const markets = this.getConfig().markets;        
        await directorySearch(path.join(__dirname, 'markets'), async file_path => {
            const market_name = file_path.split('/').reverse()[1];            
            if (!(market_name in markets && markets[market_name].active)) return false;

            let inited = false;
            let example;
            try {
                example = new (require(file_path))(market_name, ...Object.values(markets[market_name]));
                inited = await example.init();
            }
            catch (e) { modules.logger.log('warn', `Ошибка при подключении маркета ${market_name.toUpperCase()}: ${modules.logger.stringError(e)}`) }

            if (!example) return false;

            if (inited) {
                modules.logger.log('info', `Маркет ${market_name.toUpperCase()} подключен`);
                if (typeof(example.test) === 'function') {
                    const test = await example.test();
                    if (!test) modules.logger.log('warn', `Не удалось протестировать ${market_name}`);
                }
                this.#markets[market_name] = example;
            } else modules.logger.log('warn', `Не удалось подключить маркет ${market_name.toUpperCase()}`);
        }, 'index.js');        
        return true;
    }

    getMarkets() { return Object.keys(this.#markets) }
    getMarket(key) { return this.#markets[key] || null }

    constructor() { super(__dirname) }

    async startFunction() {
        await this.#initMarkets();
    }
}

module.exports = Market;