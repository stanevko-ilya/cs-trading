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

                // Покупка предметов
                if (config.actions.buy) await market.buyItems(items);

                // Копирование в чат
                if (config.actions.vk_chat) {
                    const filter = await market.filterItems(items);
                    if (filter.length > 0) {
                        const rub_usd = await market.getCurrencies();
                        for (let i = 0; i < filter.length; i++) {
                            const item = filter[i];
                            if (this.#ids.includes(item.id)) continue;
                            this.#ids.push(item.id);
                            
                            const image = await this.#vk.upload.messagePhoto({ source: { value: item.asset.images.steam } });
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
                                attachment: image.toString()
                            });
                            await asyncDelay(1000);
                        }
                    }

                    const limit = 10;
                    if (this.#ids.length > limit) this.#ids.splice(0, this.#ids.length - limit);
                }

                // TODO: Только для одной площадки
                modules.logger.log('info', `Предметов: ${items.length} | Первый предмет: ${(() => {
                    /** @type {import('../markets/markets/cs_money/types/MarketItem').default} */
                    const item = items[0];
                    return item ? `${item.asset.names.full} ${item.pricing.computed}$ (${(-item.pricing.discount*100).toFixed(2)}%)` : 'не найден';
                })()}`, true);
            });
        }
    }
    async #runContainer() {
        try { await this.#run() }
        catch (e) { modules.logger.log('error', `Ошибка при работе контроллера: ${modules.logger.stringError(e)}`) }
    }

    #interval_id;
    startInterval() { this.#interval_id = setInterval(() => this.#runContainer(), this.getConfig().intervalMs) }
    stopInterval() { clearInterval(this.#interval_id) } 

    constructor() { super(__dirname) }

    startFunction() {
        this.#process = true;
        this.startInterval();
    }

    stopFunction() {
        this.#process = false;
        this.stopInterval();
    }
}

module.exports = Controller;