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

    async #request(...args) {
        const response = await rp(...args);
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
            const request = await this.#request(
                withAuth ? 'https://cs.money/get_user_data' : 'https://cs.money/work_statuses',
                { method: withAuth ? 'POST' : 'GET', headers: withAuth && this.getAuth() || undefined, json: true }
            );
            
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
        return this.#currencies[name]?.value || null;
    }

    async getBalance() {
        const auth = this.getAuth();        
        if (!auth) return false;

        const request = await this.#request('https://cs.money/ru/market/buy/', { headers: auth });
        const html = cheerio.load(request);        
        
        return JSON.parse(html('#__app-params').text())?.userInfo?.marketBalance || false;
    }

    async #loadCurrencies() {
        const request = await this.#request('https://cs.money/get_currencies', { json: true });
        return request;
    }

    /** @returns {Array<import('./types/MarketItem').default>} */
    async getItems({ minPrice=0, maxPrice=1e5, offset=0 }) {
        const rub_usd = await this.getCurrencies();
        const url = `https://cs.money/1.0/market/sell-orders?limit=${config.requestLimit}&offset=${offset}&minPrice=${minPrice/rub_usd}&maxPrice=${maxPrice/rub_usd}&type=2&type=13&type=5&type=6&type=3&type=4&type=7&type=8&isStatTrak=false&hasKeychains=false&isSouvenir=false&rarity=Mil-Spec Grade&rarity=Restricted&rarity=Classified&rarity=Covert&order=desc&sort=discount`;
        const request = await this.#request(url, { json: true });
        return request?.items || [];
    }

    /** @param {Array<{ id: Number, price: Number }>} buyItems  */
    async buyItems(buyItems) {
        const auth = this.getAuth();
        if (!auth) return false;

        try {
            const balance = await this.getBalance();
            let sum = 0;
            const items = [];
            for (let i = 0; i < buyItems.length; i++) {
                const item = buyItems[i];

                const calc_sum = sum + item.price;
                if (calc_sum > balance) continue;

                sum = calc_sum;
                items.push(item);
            }
    
            const addCart = await this.#request('https://cs.money/1.0/market/cart/items', {
                method: 'POST',
                headers: auth,
                body: { items },
                json: true
            });
            modules.logger.log('info', `${JSON.stringify(items)} добавление в корзину: ${addCart}`);
    
            const purchase = await this.#request('https://cs.money/1.0/market/purchase', {
                method: 'POST',
                headers: auth,
                body: { items },
                json: true
            });
            modules.logger.log('info', `${JSON.stringify(items)} покупка: ${purchase}`);
        } catch (e) {
            modules.logger.log('error', `Ошибка при покупке скинов ${JSON.stringify(items)}: ${modules.logger.stringError(e)}`);
            return false;
        }

        return true;
    }

    async #test() {
        console.log(await this.getBalance());
        return true;
    }
}

module.exports = CSMoney;