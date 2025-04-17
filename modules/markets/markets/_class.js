const path = require('path');
const fs = require('fs');
const modules = require('../../../modules');

class Market {
    #__dirname;
    getDirname() { return this.#__dirname }
    
    #name;
    getName() { return this.#name }
    
    #save_auth_path;
    /** @type {Array<{ ip: String|undefined, data: Object }>} */
    #auth = [];

    setAuth(array) {
        this.#auth = array;
        fs.writeFileSync(this.#save_auth_path, JSON.stringify(this.#auth, null, 4));
        return true;
    }
    getAuth() { return this.#auth }
    getAuthByIp(ip) {
        const auth = this.#auth?.find(item => item.ip === ip);
        return auth || false;
    }

    async validAuth(auth) {
        const request = await this.ping({ ip: auth.ip, auth: auth.data });
        if (!request) this.setAuth(null);
        return request;
    }
    async #loadAuth() {
        this.#save_auth_path = path.join(this.#__dirname, './files/auth.json');
        if (!fs.existsSync(this.#save_auth_path)) return false;
        
        const saved_auth = require(this.#save_auth_path);
        if (!saved_auth) return false;

        if (Array.isArray(saved_auth)) {
            const set_auth = [];
            for (let i = 0; i < saved_auth.length; i++) {
                const auth = saved_auth[i];
                const done = await this.validAuth(auth);
                if (done) set_auth.push(auth);
            }
            if (set_auth.length > 0) return await this.setAuth(set_auth);
        }
        
        return true;
    }

    #bought_ids_path = null;
    #bought_ids_limit = 100;
    #bought_ids = [];
    checkBoughtId(id) { return this.#bought_ids.includes(id) }
    checkBoughtIds(ids) { return ids.filter(id => this.checkBoughtId(id)) }
    addBoughtIds(ids) {
        for (let i = 0; i < ids.length; i++) {
            const id = ids[i];            
            if (this.checkBoughtId(id)) continue;
            this.#bought_ids.push(id);
        }
        if (this.#bought_ids.length > this.#bought_ids_limit) this.#bought_ids.splice(0, this.#bought_ids.length-this.#bought_ids_limit);
        
        fs.writeFileSync(this.#bought_ids_path, JSON.stringify(this.#bought_ids));
        return true;
    }
    #loadBoughtIds() {
        this.#bought_ids_path = path.join(this.#__dirname, './files/bought_ids.json');
        if (fs.existsSync(this.#bought_ids_path)) this.#bought_ids = require(this.#bought_ids_path);
        return true;
    }
    
    getRequestArgs(args) { return Object.isObject(args) && args[this.#name] || {} }
    getConfig() { return this.getRequestArgs(modules.markets.getConfig().markets) }

    constructor(dirname, name) {
        this.#__dirname = dirname;
        this.#name = name;
    }

    async init(super_init) { return await this.#loadBoughtIds() && await this.#loadAuth() }
    async ping({ ip=undefined, auth=false }={}) { }

    async getCurrencies(name='RUB') { }
    async getBalance() { }
    async getItems({ ip=undefined, auth=false, minPrice=0, maxPrice=1e5, offset=0 }) { }
    async filterItems(items) { }
    async buyItems(items) { }
}

module.exports = Market;