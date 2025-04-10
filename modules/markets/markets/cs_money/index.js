const rp = require('request-promise');
const selenium = require('selenium-webdriver');
const cheerio = require('cheerio');
const Market = require('../_class');
const modules = require('../../../../modules');
const getUserAgent = require('../../../../functions/getUserAgent');
const getIp = require('../../../../functions/getIp');

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
    async #request(options, ip='main') {
        if (!('simple' in options)) options.simple = false;
        if (!('proxy' in options)) {
            const address = await getIp(ip);
            options.localAddress = address;
        }

        try {
            const response = await rp(options);
            if (response.error === 6) {
                this.setAuth(null);
                new Promise(() => this.init());
            }

            console.log(options.localAddress);
            return response;
        } catch (e) {
            modules.logger.log('error', `Ошибка запроса: ${modules.logger.stringError(e)}`);
            return false;
        }
    }
    
    constructor(name) { super(__dirname, name) }

    async #initAuth() {
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

    async init() { return await this.#initAuth() && await this.#initCurrencies() && await this.#initBalance() }
    async ping(withAuth=false) {
        try {
            const request = await this.#request({
                method: withAuth ? 'POST' : 'GET',
                url: withAuth ? 'https://cs.money/get_user_data' : 'https://cs.money/work_statuses',
                headers: withAuth && this.getAuth() || undefined, json: true
            });
            
            return Boolean(request) && (!withAuth || request?.error !== 6);
        } catch (e) {
            modules.logger.log('error', `Ошибка при пилинговании сервиса: ${modules.logger.stringError(e)}`);
            return false;
        }
    }
    
    #currencies = {
        last_load: null,
        interval: 36e5,
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
        return request || {};
    }

    async #initCurrencies() {
        const currencie = await this.getCurrencies();
        return typeof(currencie) === 'number';
    }

    async testCurrencies() {
        const rub_usd = await this.getCurrencies();
        console.log(`1 USD = ${rub_usd} RUB`);
        return true;
    }

    #balance = {
        amount: 0,
        last_update: 0
    };
    async getBalance(load=true) {
        if (!load) return this.#balance.amount;
        if (Date.now() - this.#balance.last_update < 1e3) return false;

        const auth = this.getAuth();        
        if (!auth) return false;

        const request = await this.#request({ url: 'https://cs.money/ru/market/buy/', headers: auth });
        if (!request) return false;

        const html = cheerio.load(request);
        this.#balance.amount = JSON.parse(html('#__app-params').text())?.userInfo?.marketBalance || 0;
        this.#balance.last_update = Date.now();
        return this.#balance;
    }
    async #initBalance() {
        const balance = await this.getBalance(true);
        return typeof(balance.amount) === 'number';
    }
    async testBalance() {
        const balance = await this.getBalance();
        console.log(`Баланс: ${balance.amount}$`);
        return true;
    }

    #last_id = 0;
    /** @returns {Array<import('./types/MarketItem').default>} */
    async getItems({ minPrice=100, maxPrice=null, offset=0, limit=null }={}) {
        const start_method = Date.now();
        
        const rub_usd = await this.getCurrencies();
        if (maxPrice === null) maxPrice = this.#balance.amount * rub_usd;
        if (limit === null) limit = this.getConfig().requestLimit;
        
        const id = this.#last_id + 1;
        this.#last_id += 1;

        const url = `https://cs.money/1.0/market/sell-orders?id=${id}&limit=${limit}&offset=${offset}&minPrice=${(minPrice/rub_usd).toFixed(0)}&maxPrice=${(maxPrice/rub_usd).toFixed(0)}&type=2&type=13&type=5&type=6&type=3&type=4&type=7&type=8&isStatTrak=false&hasKeychains=false&isSouvenir=false&rarity=Mil-Spec%20Grade&rarity=Restricted&rarity=Classified&rarity=Covert&order=desc&sort=insertDate`;
        const start = Date.now();
        const request = await this.#request({ url, json: true, headers: { 'user-agent': getUserAgent() } }, 'next');
        console.log(`ID: ${id} | Время запроса: ${Date.now() - start}мс | Время метода: ${Date.now() - start_method}мс`);
        
        return request?.items || [];
    }

    /** @param {Array<import('./types/MarketItem').default>} items  */
    async filterItems(items) {
        const black_list = modules.markets.getConfig().black_list.map(name => new RegExp(name));

        const config = this.getConfig();
        const rub_usd = await this.getCurrencies();
        return items.filter(item => {
            if (item.pricing.discount < config.discount_percent/100 || item.pricing.default*rub_usd < config.price.min_default) return false;
            
            if (item.pricing?.extra) {
                const extra_stickers = (item.pricing.extra?.stickers || 0)/item.pricing.computed;
                if (extra_stickers > config.price.extra.max_stickers_percent/100) return false;
            }

            if (black_list.find(regexp => regexp.test(item.asset.names.full))) return false;
            if (this.checkBoughtId(item.id)) return false;

            return true;
        });
    }

    /** @param {Array<import('./types/MarketItem').default>} items  */
    convertItems(items) { return items.map(item => ({ id: item.id, price: item.pricing.computed })) }

    async testGetItem() {
        const start = Date.now();

        const start_items = Date.now();
        const items = await this.getItems();
        console.log(`Предметов: ${items.length} | Время: ${Date.now() - start_items}мс`);
        
        const start_filter = Date.now();
        const filter_items = await this.filterItems(items);
        console.log(`Валидных предметов: ${filter_items.length} | Время: ${Date.now() - start_filter}мс`);

        const start_convert = Date.now();
        const convertItems = await this.convertItems(filter_items);
        console.log(`Сконвертированные предметы:`, convertItems, `| Время: ${Date.now() - start_convert}мс`);
        
        console.log(`Весь тест: ${Date.now() - start}мс`);        
        return true;
    }

    #last_buy = 0;
    async buyItems(itemsData, converted=false) {
        if (Date.now() - this.#last_buy < 600) return false;

        const auth = this.getAuth();
        if (!auth) return false;

        const buyItems = converted ? itemsData : await this.convertItems(await this.filterItems(itemsData));
        if (buyItems.length === 0) return false;

        const balance = await this.getBalance(false);
        if (typeof(balance.amount) !== 'number') return false;

        let sum = 0;
        const items = [];
        for (let i = 0; i < buyItems.length; i++) {
            const item = buyItems[i];

            const calc_sum = sum + item.price;
            if (calc_sum > balance.amount) continue;

            sum = calc_sum;
            items.push(item);
        }

        if (items.length === 0) return false;

        try {
            this.#last_buy = Date.now();
            const purchase = await this.#request({
                url: 'https://cs.money/1.0/market/purchase',
                method: 'POST',
                headers: auth,
                body: { items },
                json: true
            });

            const answer_string = JSON.stringify(purchase);
            const result = purchase && answer_string === '{}';
            if (result) this.addBoughtIds(items.map(item => item.id));

            modules.logger.log('info', `${JSON.stringify(items)} покупка: ${answer_string}`);
        } catch (e) {
            modules.logger.log('error', `Ошибка при покупке скинов ${JSON.stringify(items)}: ${modules.logger.stringError(e)}`);
            return false;
        }

        await this.getBalance(true);
        return true;
    }
    async testBuyItems() {
        const now = Date.now();
        /** @type {import('./types/DataItem').default} */
        const item_data = [ { id: 37456648, price: 1.79 } ];
        const buy = await this.buyItems(item_data, true, now);
        return buy;
    }
}

module.exports = CSMoney;