const rp = require('request-promise');
const selenium = require('selenium-webdriver');
const cheerio = require('cheerio');
const Market = require('../_class');
const modules = require('../../../../modules');

class CSMoney extends Market {    
    getAuth() {
        const auth = super.getAuth();
        if (!auth) return false;

        const cookies = [];
        for (const key in auth) { cookies.push(`${key}=${auth[key]?.value || ''}`) }

        return { cookie: cookies.filter(item => Boolean(item)).join(';') };
    }

    validAuth() {
        const auth = super.getAuth();
        const now = new Date();
        for (const key in auth) {            
            if (new Date(auth[key].expiry*1000) < now)
                return false;
        }

        return super.validAuth();
    }

    /** @param {rp.Options} options */
    async #request(options) {
        if (!('simple' in options)) options.simple = false;

        const response = await rp(options);
        if (response.error === 6) {
            this.setAuth(null);
            new Promise(() => this.init(true));
        }
        return response;
    }
    
    constructor(name) { super(__dirname, name) }

    async init() {
        const super_inited = await super.init();
        if (super_inited) return true;

        const stoped = !modules.browser.isWork();
        if (stoped) {
            const started = await modules.browser.start();
            if (!started) return false;
        }
   
        const request = await modules.browser.addToQueue(async () => {
            const driver = modules.browser.getDriver();
            const saveAuth = async () => {
                try {
                    await driver.get('https://cs.money');

                    const auth = {};
                    const keys = [ 'steamid', 'support_token', 'csgo_ses', '_uetvid' ];
                    let done = true;
                    for (let i = 0; i < keys.length; i++) {
                        const key = keys[i];
                        const cookie = await driver.manage().getCookie(key);

                        const value = cookie || null;
                        if (value === null) {
                            done = false;
                            break;
                        }
                        auth[key] = value;                        
                    }

                    if (done) this.setAuth(auth);
                    return done;
                } catch(e) {
                    modules.logger.log('warn', `Ошибка при сохранение данных авторизации: ${modules.logger.stringError(e)}`);
                    return false;
                }

            }

            const try1 = await saveAuth();
            if (!try1) {
                const loginButtonMarket = await driver.findElement(selenium.By.xpath('//a[contains(., "Войти через Steam")]'));
                if (!loginButtonMarket) return false;
                const link = await loginButtonMarket.getAttribute('href');
                if (!link) return false;
                
                await driver.get(link);
                const loginButtonSteam = await driver.findElement(selenium.By.id('imageLogin'));
                if (!loginButtonSteam) return false;
                await loginButtonSteam.click();

                const try2 = await saveAuth();
                if (!try2) return false;
            }
            
            if (stoped) await modules.browser.stop();
            return true;
        });

        return request.result === 'completed';
    }

    async ping(withAuth=false) {
        try {
            const request = await this.#request({
                method: withAuth ? 'POST' : 'GET',
                url: withAuth ? 'https://cs.money/get_user_data' : 'https://cs.money/work_statuses',
                headers: withAuth && this.getAuth() || undefined, json: true
            });
            
            return withAuth ? request?.error !== 6 : Boolean(request);
        } catch (e) {
            modules.logger.log('error', `Ошибка при пилинговании сервиса: ${modules.logger.stringError(e)}`);
            return false;
        }
    }
    
    #currencies = {
        last_load: null,
        interval: 6e5,
        data: {}
    };
    async getCurrencies(name='RUB') {        
        if (this.#currencies.last_load+this.#currencies.interval < new Date()) {
            this.#currencies.last_load = new Date();
            this.#currencies.data = await this.#loadCurrencies();
        }
        return this.#currencies.data[name]?.value || null;
    }

    async #loadCurrencies() {
        const request = await this.#request({ url: 'https://cs.money/get_currencies', json: true });
        return request;
    }

    async testCurrencies() {
        const rub_usd = await this.getCurrencies();
        console.log(`1 USD = ${rub_usd} RUB`);
        return true;
    }

    async getBalance() {
        const auth = this.getAuth();        
        if (!auth) return false;

        const request = await this.#request({ url: 'https://cs.money/ru/market/buy/', headers: auth });
        const html = cheerio.load(request);        
        
        return JSON.parse(html('#__app-params').text())?.userInfo?.marketBalance || false;
    }
    async testBalance() {
        const balance = await this.getBalance();
        console.log(`Баланс: ${balance}$`);
        return true;
    }

    /** @returns {Array<import('./types/MarketItem').default>} */
    async getItems({ minPrice=0, maxPrice=1e5, offset=0, limit=60 }={}) {
        const rub_usd = await this.getCurrencies();
        const url = `https://cs.money/1.0/market/sell-orders?limit=${limit}&offset=${offset}&minPrice=${minPrice/rub_usd}&maxPrice=${maxPrice/rub_usd}&type=2&type=13&type=5&type=6&type=3&type=4&type=7&type=8&isStatTrak=false&hasKeychains=false&isSouvenir=false&rarity=Mil-Spec Grade&rarity=Restricted&rarity=Classified&rarity=Covert&order=desc&sort=discount`;
        const request = await this.#request({ url, json: true });
        return request?.items || [];
    }

    /** @param {Array<import('./types/MarketItem').default>} items  */
    async filterItems(items) {
        const black_list = modules.markets.getConfig().black_list.map(name => new RegExp(name));

        const config = this.getConfig();
        const rub_usd = await this.getCurrencies();
        return items.filter(item => {
            if (item.pricing.discount < config.discount_percent/100 || item.pricing.default*rub_usd >= config.price.min_default) return false;
            
            if (item.pricing?.extra) {
                const extra_stickers = (item.pricing.extra?.stickers || 0)/item.pricing.computed;
                if (extra_stickers > config.price.extra.max_stickers_percent/100) return false;
            }

            if (black_list.find(regexp => regexp.test(item.asset.names.full))) return false;
        });
    }

    /** @param {Array<import('./types/MarketItem').default>} items  */
    convertItems(items) { return items.map(item => ({ id: item.id, price: item.pricing.computed })) }

    async testItems() {
        const items = await this.getItems();
        console.log(`Предметов: ${items.length}`);
        
        const filter_items = await this.filterItems(items);
        console.log(`Валидных предметов: ${filter_items.length}`);

        const convertItems = await this.convertItems(filter_items);
        console.log(`Сконвертированные предметы:`, convertItems);
        
        return true;
    }

    async buyItems(marketItems) {
        const auth = this.getAuth();
        if (!auth) return false;

        const buyItems = await this.convertItems(await this.filterItems(marketItems));

        const balance = await this.getBalance();
        if (typeof(balance) !== 'number') return false;

        let sum = 0;
        const items = [];
        for (let i = 0; i < buyItems.length; i++) {
            const item = buyItems[i];

            const calc_sum = sum + item.price;
            if (calc_sum > balance) continue;

            sum = calc_sum;
            items.push(item);
        }

        if (items.length === 0) return false;

        try {    
            const purchase = await this.#request({
                url: 'https://cs.money/1.0/market/purchase',
                method: 'POST',
                headers: auth,
                body: { items },
                json: true
            });
            modules.logger.log('info', `${JSON.stringify(items)} покупка: ${JSON.stringify(purchase) === '{}'}`);
        } catch (e) {
            modules.logger.log('error', `Ошибка при покупке скинов ${JSON.stringify(items)}: ${modules.logger.stringError(e)}`);
            return false;
        }

        return true;
    }
    async testBuyItems() {
        /** @type {import('./types/DataItem').default} */
        const item_data = [
            { id: 37790373, price: 0.02 },
            { id: 37762643, price: 0.02 },
            { id: 37770089, price: 0.02 }
        ];
        const buy = await this.buyItems(item_data);
        return buy;
    }
}

module.exports = CSMoney;