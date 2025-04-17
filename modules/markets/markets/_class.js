const path = require('path');
const fs = require('fs');
const modules = require('../../../modules');

class Market {
    #__dirname;
    getDirname() { return this.#__dirname }
    
    #name;
    getName() { return this.#name }

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

    async init(super_init) { return await this.#loadBoughtIds() }
    async ping(withAuth=false) { }

    async getCurrencies(name='RUB') { }
    async getBalance() { }
    async getItems({ minPrice=0, maxPrice=1e5, offset=0 }) { }
    async filterItems(items) { }
    async buyItems(items) { }
}

module.exports = Market;