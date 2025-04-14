const vk_io = require('vk-io');
const asyncDelay = require('../../functions/asyncDelay');
const modules = require('../../modules');
const Module = require('../_class');

class Controller extends Module {
    #vk = new vk_io.VK({ token: 'vk1.a.CTTzO9VQmJ1SSGr9Sr3J7CAhPAxx3xSDTESeTaHj55uBtK9kcyYJco5bFwpSZEvyojCsifukGNEoKy6yge5IxwalIa8GoxC1dVvlEnVwHi3s4cUStnT1MsbdN8ULGX17RmAc-Xb5bCv5UdqZHPQtjXL3s18OGDuvh7RP6X0fDhjiycoLwbLyI84q6YY8Lvvq3J-Hll3UuRd3EjHjdD0toQ' });
    #ids = [];

    #process = false;
    async #run() {
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
                        message: `Куплены прдеметы (IDs): ${bought_items.map(item => item.id).join(',')}`,
                    })
                }

                // TODO: Только для одной площадки
                modules.logger.log('info', `Предметов: ${items.length} | Первые предмет: ${items.slice(0, 10).map(item => item.asset.names.full.split('|')[0].trim()).join(' -> ')}`, true);
            });
        }
    }
    #runContainer() {
        const config = this.getConfig();
        const ms = config.intervalMs + Math.round(Math.random()*config.deviationRange);
        return setTimeout(() => {
            this.#runContainer();
            this.#run();
        }, ms);
    }

    #timeout_id;
    startTimeout() { this.#timeout_id = this.#runContainer() }
    stopTimeout() { clearInterval(this.#timeout_id) } 

    constructor() { super(__dirname) }

    startFunction() {
        this.#process = true;
        this.startTimeout();
    }

    stopFunction() {
        this.#process = false;
        this.stopTimeout();
    }
}

module.exports = Controller;