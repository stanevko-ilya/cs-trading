const vk_io = require('vk-io');
const asyncDelay = require('../../functions/asyncDelay');
const getRandom = require('../../functions/getRandom');
const modules = require('../../modules');
const Module = require('../_class');

class Controller extends Module {
    #vk = new vk_io.VK({ token: 'vk1.a.CTTzO9VQmJ1SSGr9Sr3J7CAhPAxx3xSDTESeTaHj55uBtK9kcyYJco5bFwpSZEvyojCsifukGNEoKy6yge5IxwalIa8GoxC1dVvlEnVwHi3s4cUStnT1MsbdN8ULGX17RmAc-Xb5bCv5UdqZHPQtjXL3s18OGDuvh7RP6X0fDhjiycoLwbLyI84q6YY8Lvvq3J-Hll3UuRd3EjHjdD0toQ' });
    #ids = [];

    #process = false;
    async getItems() {
        if (!this.#process) return false;
        
        const config = this.getConfig();
        const markets = modules.markets.getMarkets();
        for (let i = 0; i < markets.length; i++) {
            const name = markets[i];
            const market = modules.markets.getMarket(name);
            new Promise(async () => {
                // Получение предметов
                const items = await market.getItems();
                const filter = await market.filterItems(items);
                const convert = await market.convertItems(filter);

                // Покупка предметов
                /** @type {Array<import('../markets/markets/cs_money/types/DataItem').default>} */
                let bought_items = [];
                if (config.actions.buy) bought_items = await market.buyItems(convert, true);

                // Копирование в чат
                if (config.actions.vk_chat) {
                    if (filter.length > 0) {
                        const rub_usd = await market.getCurrencies();
                        for (let i = 0; i < filter.length; i++) {
                            const item = filter[i];
                            if (this.#ids.includes(item.id)) continue;
                            this.#ids.push(item.id);
                            
                            let image = undefined;
                            try { image = await this.#vk.upload.messagePhoto({ source: { value: item.asset.images.steam } }) }
                            catch (e) { modules.logger.log('error', `Ошибка загрузки изображения: ${modules.logger.stringError(e)} | Изображение: ${JSON.stringify(item.asset.images)}`) }

                            const send = await this.#vk.api.messages.send({
                                random_id: 0,
                                chat_id: 1,
                                message: [
                                    item.asset.names.full,
                                    `Текущая цена: ${(item.pricing.computed*rub_usd).toFixed(0)}₽ (-${(item.pricing.discount*100).toFixed(0)}%)`,
                                    `Рекомендуемая цена: ${(item.pricing.default*rub_usd).toFixed(0)}₽`,
                                    `Идентификатор товара: ${item.id}`,
                                    `Флоат: ${item.asset.float}`,
                                    `Стикеры: ${
                                        item.stickers?.length > 0 ? 
                                            '\n' +
                                            item.stickers.filter(v => v !== null).map((sticker, index) => `${index+1}) ${sticker.name} (${(sticker.pricing.default*rub_usd).toFixed(0)}₽)`).join('\n')
                                        :
                                            'отсутствуют'
                                    }`
                                ].join('\n'),
                                attachment: image?.toString()
                            });
                            await asyncDelay(1000);
                        }
                    }

                    const limit = 10;
                    if (this.#ids.length > limit) this.#ids.splice(0, this.#ids.length - limit);

                    if (bought_items.length > 0) await this.#vk.api.messages.send({
                        random_id: 0,
                        chat_id: 1,
                        message: `Куплены предметы (IDs): ${bought_items.map(item => item.id).join(',')}`,
                    })
                }

                // TODO: Только для одной площадки
                modules.logger.log('info', `Предметов: ${items.length} | Первые предмет: ${items.slice(0, 10).map(item => item?.asset?.names?.full?.split('|')[0]?.trim()).join(' -> ')}`, true);
            });
        }
    }

    async initMarkets() {
        const markets = modules.markets.getMarkets();
        for (const name of markets) {
            const market = modules.markets.getMarket(name);
            await market.init(false);
        }
    }

    constructor() { super(__dirname) }

    #timeout_ids = {};
    startTimeout(key) {
        if (!this.#process) return false;

        const intervals = this.getConfig().intervals;
        if (!(key in intervals && typeof(this[key]) == 'function')) return false;

        const interval = intervals[key];
        const range = Array.isArray(interval.deviationRange) ? interval.deviationRange : null;
        const ms = interval.ms + (Array.isArray(range) ? getRandom(range[0], range[1]) : 0);
        const timeout_id = setTimeout(async () => {
            if (interval.async) await this[key]();
            else this[key]();
            this.startTimeout(key);
        }, ms);

        this.#timeout_ids[key] = timeout_id;
        return timeout_id;
    }
    stopTimeout() { for (const key in this.#timeout_ids) { clearTimeout(this.#timeout_ids[key]) } } 

    startFunction() {   
        this.#process = true;
        const intervals = this.getConfig().intervals;
        for (const key in intervals) { this.startTimeout(key) }
    }

    stopFunction() {
        this.#process = false;
        this.stopTimeout();
    }
}

module.exports = Controller;