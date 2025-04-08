const path = require('path');
const fs = require('fs');
const modules = require('../../../modules');

class Market {
    #save_auth_path;
    #__dirname;
    getDirname() { return this.#__dirname }

    #name;
    getName() { return this.#name }

    #auth = null;
    setAuth(auth) {
        this.#auth = auth;
        fs.writeFileSync(this.#save_auth_path, JSON.stringify(this.#auth, null, 4));
        return true;
    }
    getAuth() { return this.#auth }
    async validAuth() {
        const request = await this.ping(true);
        if (!request) this.setAuth(null);
        return request;
    }
    
    getRequestArgs(args) { return Object.isObject(args) && args[this.#name] || {} }
    getConfig() { return this.getRequestArgs(modules.markets.getConfig().markets) }

    constructor(dirname, name) {
        this.#__dirname = dirname;
        this.#name = name;
    }

    async init() {
        this.#save_auth_path = path.join(this.#__dirname, './auth.json');
        if (!fs.existsSync(this.#save_auth_path)) return false;
        
        const saved_auth = require(this.#save_auth_path);
        if (!saved_auth) return false;

        const done = this.setAuth(saved_auth) && await this.validAuth();
        return done;
    }
    async ping(withAuth=false) { }

    async getCurrencies(name='RUB') { }
    async getBalance() { }
    async getItems({ minPrice=0, maxPrice=1e5, offset=0 }) { }
    async filterItems(items) { }
    async buyItems(items) { }
}

module.exports = Market;